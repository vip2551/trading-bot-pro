import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// التحقق من صحة الإشارة
function validateSignal(data: any): { valid: boolean; error?: string } {
  // التحقق من الحقول المطلوبة
  if (!data.symbol) {
    return { valid: false, error: 'الرمز (symbol) مطلوب' };
  }

  if (!data.action) {
    return { valid: false, error: 'الإجراء (action) مطلوب' };
  }

  // التحقق من صحة الإجراء
  const validActions = ['BUY', 'SELL', 'CLOSE', 'EXIT', 'LONG', 'SHORT', 'CALL', 'PUT'];
  const action = data.action.toUpperCase();
  if (!validActions.includes(action)) {
    return { valid: false, error: `إجراء غير صالح: ${action}. الإجراءات المسموحة: ${validActions.join(', ')}` };
  }

  // التحقق من السعر إذا كان موجوداً
  if (data.price !== undefined && isNaN(parseFloat(data.price))) {
    return { valid: false, error: 'السعر يجب أن يكون رقماً' };
  }

  // التحقق من الكمية إذا كانت موجودة
  if (data.quantity !== undefined && isNaN(parseInt(data.quantity))) {
    return { valid: false, error: 'الكمية يجب أن تكون رقماً' };
  }

  return { valid: true };
}

// تحديد اتجاه الصفقة
function getDirection(action: string): string {
  const actionUpper = action.toUpperCase();
  if (['BUY', 'LONG', 'CALL'].includes(actionUpper)) {
    return 'LONG';
  }
  if (['SELL', 'SHORT', 'PUT'].includes(actionUpper)) {
    return 'SHORT';
  }
  return 'CLOSE';
}

// التحقق من المفتاح السري
async function validateSecret(secret: string, ip: string): Promise<{ valid: boolean; error?: string }> {
  if (!secret) {
    return { valid: false, error: 'المفتاح السري مطلوب' };
  }

  const webhookSecret = await db.webhookSecret.findUnique({
    where: { secret }
  });

  if (!webhookSecret) {
    return { valid: false, error: 'مفتاح سري غير صالح' };
  }

  if (!webhookSecret.active) {
    return { valid: false, error: 'هذا المفتاح السري غير مفعل' };
  }

  // التحقق من قائمة IPs المسموحة
  if (webhookSecret.ipWhitelist) {
    const allowedIps = JSON.parse(webhookSecret.ipWhitelist);
    if (allowedIps.length > 0 && !allowedIps.includes(ip)) {
      return { valid: false, error: 'عنوان IP غير مسموح' };
    }
  }

  // تحديث آخر استخدام
  await db.webhookSecret.update({
    where: { secret },
    data: {
      lastUsedAt: new Date(),
      useCount: { increment: 1 }
    }
  });

  return { valid: true };
}

// POST - استقبال إشارة من TradingView
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let signalData: any = {};
  let rawPayload = '';
  let headersData: any = {};

  try {
    // الحصول على IP المصدر
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // حفظ الـ headers
    request.headers.forEach((value, key) => {
      headersData[key] = value;
    });

    // قراءة البيانات
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      signalData = await request.json();
      rawPayload = JSON.stringify(signalData);
    } else {
      rawPayload = await request.text();
      try {
        signalData = JSON.parse(rawPayload);
      } catch {
        // محاولة قراءة كـ form data
        const params = new URLSearchParams(rawPayload);
        signalData = Object.fromEntries(params);
      }
    }

    // توليد معرف فريد للإشارة
    const webhookId = crypto.randomBytes(16).toString('hex');

    // التحقق من المفتاح السري
    const secret = signalData.secret || signalData.api_key || signalData.webhook_secret;
    const secretValidation = await validateSecret(secret, ip);

    if (!secretValidation.valid) {
      // تسجيل الإشارة الفاشلة
      await db.signalLog.create({
        data: {
          source: 'TRADINGVIEW',
          webhookId,
          symbol: signalData.symbol || 'UNKNOWN',
          action: signalData.action || 'UNKNOWN',
          status: 'FAILED',
          errorMessage: secretValidation.error,
          rawPayload,
          headers: JSON.stringify(headersData),
          sourceIp: ip,
          userAgent: request.headers.get('user-agent')
        }
      });

      return NextResponse.json(
        { success: false, error: secretValidation.error },
        { status: 401 }
      );
    }

    // التحقق من صحة الإشارة
    const validation = validateSignal(signalData);
    if (!validation.valid) {
      await db.signalLog.create({
        data: {
          source: 'TRADINGVIEW',
          webhookId,
          symbol: signalData.symbol || 'UNKNOWN',
          action: signalData.action || 'UNKNOWN',
          status: 'FAILED',
          errorMessage: validation.error,
          rawPayload,
          headers: JSON.stringify(headersData),
          sourceIp: ip,
          userAgent: request.headers.get('user-agent')
        }
      });

      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // تحضير بيانات الإشارة
    const symbol = signalData.symbol.toUpperCase();
    const action = signalData.action.toUpperCase();
    const direction = getDirection(action);

    // تسجيل الإشارة
    const signalLog = await db.signalLog.create({
      data: {
        source: 'TRADINGVIEW',
        webhookId,
        symbol,
        action,
        direction,
        price: parseFloat(signalData.price) || null,
        entryPrice: parseFloat(signalData.entry_price || signalData.price) || null,
        strike: parseFloat(signalData.strike) || null,
        expiry: signalData.expiry || signalData.expiration || null,
        optionType: signalData.option_type || signalData.optionType || null,
        quantity: parseInt(signalData.quantity) || signalData.contracts || null,
        positionSize: parseFloat(signalData.position_size || signalData.size) || null,
        stopLoss: parseFloat(signalData.stop_loss || signalData.stopLoss) || null,
        takeProfit: parseFloat(signalData.take_profit || signalData.takeProfit) || null,
        trailingStop: parseFloat(signalData.trailing_stop || signalData.trailingStop) || null,
        strategy: signalData.strategy || null,
        strategyName: signalData.strategy_name || signalData.strategyName || null,
        timeframe: signalData.timeframe || signalData.interval || null,
        confidence: parseFloat(signalData.confidence) || null,
        status: 'RECEIVED',
        rawPayload,
        headers: JSON.stringify(headersData),
        sourceIp: ip,
        userAgent: request.headers.get('user-agent')
      }
    });

    // التحقق من وجود الرمز في قائمة المراقبة مع التداول التلقائي
    const watchlistItem = await db.watchlistItem.findFirst({
      where: {
        symbol,
        autoTrade: true,
        enabled: true
      }
    });

    let executed = false;
    let tradeId = null;

    // إذا كان التداول التلقائي مفعل لهذا الرمز
    if (watchlistItem) {
      try {
        // إنشاء صفقة جديدة
        const trade = await db.trade.create({
          data: {
            symbol,
            instrumentType: watchlistItem.type,
            direction,
            quantity: watchlistItem.quantity || 1,
            entryPrice: parseFloat(signalData.price) || 0,
            strike: watchlistItem.strike,
            expiry: watchlistItem.expiry,
            optionType: watchlistItem.optionType,
            stopLoss: watchlistItem.stopLossPercent ?
              (parseFloat(signalData.price) * (1 - watchlistItem.stopLossPercent / 100)) : null,
            takeProfit: watchlistItem.takeProfitPercent ?
              (parseFloat(signalData.price) * (1 + watchlistItem.takeProfitPercent / 100)) : null,
            status: 'PENDING',
            signalSource: 'TRADINGVIEW',
            signalStrategy: signalData.strategy,
            signalTime: new Date()
          }
        });

        tradeId = trade.id;
        executed = true;

        // تحديث حالة الإشارة
        await db.signalLog.update({
          where: { id: signalLog.id },
          data: {
            status: 'EXECUTED',
            executed: true,
            executedAt: new Date(),
            tradeId
          }
        });
      } catch (execError) {
        console.error('Error executing trade:', execError);

        await db.signalLog.update({
          where: { id: signalLog.id },
          data: {
            status: 'FAILED',
            errorMessage: 'فشل في تنفيذ الصفقة: ' + (execError as Error).message
          }
        });
      }
    } else {
      // تحديث حالة الإشارة إلى تم التحقق
      await db.signalLog.update({
        where: { id: signalLog.id },
        data: {
          status: 'VALIDATED'
        }
      });
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        webhookId,
        signalId: signalLog.id,
        symbol,
        action,
        direction,
        executed,
        tradeId,
        processingTime: `${processingTime}ms`
      },
      message: executed ?
        `تم تنفيذ الإشارة تلقائياً: ${action} ${symbol}` :
        `تم استلام الإشارة: ${action} ${symbol}`
    });

  } catch (error) {
    console.error('Webhook error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ في معالجة الإشارة',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// GET - معلومات الـ Webhook
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    info: {
      name: 'Trading Bot Webhook',
      version: '2.0',
      endpoints: {
        webhook: '/api/tradingview/webhook',
        signals: '/api/signals',
        watchlist: '/api/watchlist'
      },
      supportedActions: ['BUY', 'SELL', 'CLOSE', 'EXIT', 'LONG', 'SHORT', 'CALL', 'PUT'],
      payloadExample: {
        symbol: 'AAPL',
        action: 'BUY',
        price: 150.50,
        quantity: 100,
        stop_loss: 145,
        take_profit: 160,
        secret: 'YOUR_WEBHOOK_SECRET'
      }
    }
  });
}
