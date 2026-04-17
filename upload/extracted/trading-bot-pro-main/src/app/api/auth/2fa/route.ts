import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

function generateTwoFactorCode(secret: string): string {
  const time = Math.floor(Date.now() / 30000);
  const hmac = crypto.createHmac('sha1', secret).update(time.toString()).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24 |
                (hmac[offset + 1] & 0xff) << 16 |
                (hmac[offset + 2] & 0xff) << 8 |
                (hmac[offset + 3] & 0xff)) % 1000000;
  return code.toString().padStart(6, '0');
}

function generateSecret(): string {
  return crypto.randomBytes(20).toString('base64');
}

// GET - Get 2FA status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true, 
        twoFactorSecret: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      hasSecret: !!user.twoFactorSecret
    });

  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json({ error: 'Failed to get 2FA status' }, { status: 500 });
  }
}

// POST - Enable/Disable 2FA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, code, secret } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Enable 2FA - Generate secret
    if (action === 'setup') {
      const newSecret = generateSecret();
      
      await db.user.update({
        where: { id: userId },
        data: { twoFactorSecret: newSecret }
      });

      // Generate current code for verification
      const currentCode = generateTwoFactorCode(newSecret);

      return NextResponse.json({
        success: true,
        secret: newSecret,
        currentCode,
        message: 'استخدم تطبيق المصادقة لمسح رمز QR أو أدخل الرمز يدوياً'
      });
    }

    // Verify and enable
    if (action === 'enable') {
      if (!code || !user.twoFactorSecret) {
        return NextResponse.json({ error: 'Code and secret required' }, { status: 400 });
      }

      const expectedCode = generateTwoFactorCode(user.twoFactorSecret);
      if (code !== expectedCode) {
        return NextResponse.json({ error: 'رمز غير صحيح' }, { status: 400 });
      }

      await db.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      });

      // Log
      await db.auditLog.create({
        data: {
          userId,
          action: '2FA_ENABLED',
          entity: 'User',
          entityId: userId,
          status: 'SUCCESS'
        }
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'تم تفعيل المصادقة الثنائية بنجاح'
      });
    }

    // Disable 2FA
    if (action === 'disable') {
      if (!code) {
        return NextResponse.json({ error: 'Code required' }, { status: 400 });
      }

      if (user.twoFactorSecret) {
        const expectedCode = generateTwoFactorCode(user.twoFactorSecret);
        if (code !== expectedCode) {
          return NextResponse.json({ error: 'رمز غير صحيح' }, { status: 400 });
        }
      }

      await db.user.update({
        where: { id: userId },
        data: { 
          twoFactorEnabled: false,
          twoFactorSecret: null
        }
      });

      // Log
      await db.auditLog.create({
        data: {
          userId,
          action: '2FA_DISABLED',
          entity: 'User',
          entityId: userId,
          status: 'SUCCESS'
        }
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'تم إلغاء تفعيل المصادقة الثنائية'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('2FA error:', error);
    return NextResponse.json({ error: 'Failed to process 2FA request' }, { status: 500 });
  }
}
