import { NextRequest, NextResponse } from 'next/server';

// Auto Trading API - In-process auto trading engine
// This runs within the Next.js server for demo purposes

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO TRADING STATE (in-memory, resets on server restart)
// ═══════════════════════════════════════════════════════════════════════════════

interface AutoTraderConfig {
  enabled: boolean;
  userId: string;
  symbols: string[];
  maxOpenPositions: number;
  maxRiskPerTrade: number;
  autoEntryEnabled: boolean;
  autoExitEnabled: boolean;
  minConfidence: number;
  tradingHours: { start: number; end: number };
}

let autoTraderConfig: AutoTraderConfig = {
  enabled: false,
  userId: 'demo',
  symbols: ['SPX', 'SPY', 'QQQ', 'AAPL', 'TSLA'],
  maxOpenPositions: 3,
  maxRiskPerTrade: 500,
  autoEntryEnabled: true,
  autoExitEnabled: true,
  minConfidence: 70,
  tradingHours: { start: 9, end: 16 }
};

let tradingLogs: Array<{ time: string; type: string; message: string }> = [];
let lastCycleTime: Date | null = null;

// Simulated market analysis
function analyzeSymbol(symbol: string): {
  symbol: string;
  price: number;
  rsi: number;
  trend: string;
  signal: string;
  confidence: number;
  reasons: string[];
} {
  const basePrices: Record<string, number> = {
    'SPX': 5850,
    'SPY': 585,
    'QQQ': 485,
    'AAPL': 185,
    'TSLA': 250
  };
  
  const basePrice = basePrices[symbol] || 100;
  const volatility = (Math.random() - 0.5) * 2;
  const trend = Math.sin(Date.now() / 3600000) * 0.5;
  const price = basePrice * (1 + trend / 100) + volatility;
  
  // Simulate RSI
  const rsiBase = 50 + volatility * 5;
  const rsi = Math.max(10, Math.min(90, rsiBase + (Math.random() - 0.5) * 20));
  
  // Determine trend and signal
  let trendDir = 'NEUTRAL';
  let signal = 'HOLD';
  let confidence = 50;
  const reasons: string[] = [];
  
  if (rsi < 30) {
    trendDir = 'BULLISH';
    signal = 'BUY';
    confidence = 75;
    reasons.push('RSI في منطقة التشبع البيعي');
  } else if (rsi > 70) {
    trendDir = 'BEARISH';
    signal = 'SELL';
    confidence = 75;
    reasons.push('RSI في منطقة التشبع الشرائي');
  } else if (volatility > 0.5) {
    trendDir = 'BULLISH';
    signal = 'BUY';
    confidence = 65;
    reasons.push('زخم صعودي');
  } else if (volatility < -0.5) {
    trendDir = 'BEARISH';
    signal = 'SELL';
    confidence = 65;
    reasons.push('زخم هبوطي');
  } else {
    reasons.push('السوق في حالة اتزان');
  }
  
  return {
    symbol,
    price: Math.round(price * 100) / 100,
    rsi: Math.round(rsi * 10) / 10,
    trend: trendDir,
    signal,
    confidence,
    reasons
  };
}

function addLog(type: string, message: string) {
  tradingLogs.push({
    time: new Date().toISOString(),
    type,
    message
  });
  
  // Keep only last 100 logs
  if (tradingLogs.length > 100) {
    tradingLogs = tradingLogs.slice(-100);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET - Get auto trading status
export async function GET(request: NextRequest) {
  const analyses = autoTraderConfig.symbols.map(s => analyzeSymbol(s));
  
  return NextResponse.json({
    success: true,
    config: autoTraderConfig,
    status: {
      enabled: autoTraderConfig.enabled,
      openPositions: 0, // Would fetch from database
      maxPositions: autoTraderConfig.maxOpenPositions,
      lastCheck: lastCycleTime?.toISOString() || null,
      tradingHours: autoTraderConfig.tradingHours
    },
    analyses,
    recentLogs: tradingLogs.slice(-20)
  });
}

// POST - Control auto trading
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...config } = body;
    
    switch (action) {
      case 'enable':
        autoTraderConfig = { ...autoTraderConfig, ...config, enabled: true };
        addLog('INFO', '🟢 تم تفعيل التداول التلقائي');
        return NextResponse.json({
          success: true,
          config: autoTraderConfig,
          message: 'تم تفعيل التداول التلقائي بنجاح'
        });
        
      case 'disable':
        autoTraderConfig.enabled = false;
        addLog('INFO', '🔴 تم إيقاف التداول التلقائي');
        return NextResponse.json({
          success: true,
          config: autoTraderConfig,
          message: 'تم إيقاف التداول التلقائي'
        });
        
      case 'config':
        autoTraderConfig = { ...autoTraderConfig, ...config };
        addLog('INFO', '⚙️ تم تحديث الإعدادات');
        return NextResponse.json({
          success: true,
          config: autoTraderConfig
        });
        
      case 'run':
        // Run a manual cycle
        lastCycleTime = new Date();
        const analyses = autoTraderConfig.symbols.map(s => analyzeSymbol(s));
        addLog('INFO', '🔄 تم تنفيذ دورة التحليل');
        return NextResponse.json({
          success: true,
          message: 'تم تنفيذ الدورة',
          analyses
        });
        
      default:
        return NextResponse.json({
          error: 'Invalid action',
          success: false
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid request',
      success: false
    }, { status: 400 });
  }
}
