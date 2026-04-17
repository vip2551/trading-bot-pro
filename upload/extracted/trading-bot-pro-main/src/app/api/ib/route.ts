import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get IB connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo';

    // Get settings (any user or create default)
    let settings = await db.botSettings.findFirst();

    // Check if we're in simulation mode (no IB needed)
    const accountType = settings?.accountType || 'simulation';
    const isSimulation = accountType === 'simulation' || accountType === 'SIMULATION';
    
    // In simulation mode, always show as "connected" for demo purposes
    const effectiveConnected = isSimulation ? true : (settings?.ibConnected || false);

    const status = {
      configured: !!(settings?.ibHost && settings?.ibPort),
      connected: effectiveConnected,
      isSimulation: isSimulation,
      host: settings?.ibHost || '127.0.0.1',
      port: settings?.ibPort || 7497,
      accountType: accountType,
      clientId: settings?.ibClientId || 1,
      message: isSimulation 
        ? 'Simulation mode - no IB connection required'
        : settings?.ibConnected 
          ? 'Connected to IB TWS/Gateway'
          : 'Not connected - Start IB TWS/Gateway'
    };

    return NextResponse.json({
      connected: effectiveConnected,
      accountType: accountType,
      message: status.message,
      status
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Connect to IB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, host, port, clientId, accountType } = body;

    if (action === 'connect') {
      const ibHost = host || '127.0.0.1';
      const ibPort = port || 7497;
      const ibClientId = clientId || 1;
      const ibAccountType = accountType || 'paper';

      // Update or create settings
      let settings = await db.botSettings.findFirst();
      
      if (!settings) {
        // Create with a default user or without userId
        settings = await db.botSettings.create({
          data: {
            userId: 'demo',
            ibHost,
            ibPort: Number(ibPort),
            ibClientId: Number(ibClientId),
            accountType: ibAccountType,
            ibConnected: true,
            isRunning: false,
            telegramEnabled: false,
            telegramBotToken: null,
            telegramChatId: null,
            defaultQuantity: 1,
            maxRiskPerTrade: 100,
            defaultExpiry: '0DTE',
            positionSizeMode: 'AMOUNT',
            positionSizePercent: 5,
            positionSizeAmount: 500,
            spxStrikeOffset: 5,
            spxDeltaTarget: 0.3,
            strikeSelectionMode: 'MANUAL',
            contractPriceMin: 300,
            contractPriceMax: 400,
          }
        });
      } else {
        settings = await db.botSettings.update({
          where: { id: settings.id },
          data: {
            ibHost,
            ibPort: Number(ibPort),
            ibClientId: Number(ibClientId),
            accountType: ibAccountType,
            ibConnected: true
          }
        });
      }

      console.log('✅ IB Connection saved:', { host: ibHost, port: ibPort, accountType: ibAccountType });

      return NextResponse.json({ 
        success: true, 
        message: 'Connection settings saved. Make sure TWS/IB Gateway is running.',
        settings: {
          host: ibHost,
          port: ibPort,
          clientId: ibClientId,
          accountType: ibAccountType
        }
      });
    }

    if (action === 'disconnect') {
      const settings = await db.botSettings.findFirst();
      if (settings) {
        await db.botSettings.update({
          where: { id: settings.id },
          data: { ibConnected: false }
        });
      }

      return NextResponse.json({ success: true, message: 'Disconnected from IB' });
    }

    if (action === 'test') {
      return NextResponse.json({ 
        success: true, 
        message: 'Test connection - Make sure TWS/Gateway is running on the specified port'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('IB API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
