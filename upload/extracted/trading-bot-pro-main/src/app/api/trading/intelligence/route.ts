import { NextRequest, NextResponse } from 'next/server';

// Trend Detection & Trade Intelligence System

interface TechnicalIndicators {
  rsi: number;
  rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  macd: { value: number; signal: number; histogram: number };
  macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sma20: number;
  sma50: number;
  sma200: number;
  ema9: number;
  ema21: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  volumeProfile: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface TrendAnalysis {
  direction: 'STRONG_BULLISH' | 'BULLISH' | 'WEAK_BULLISH' | 'NEUTRAL' | 'WEAK_BEARISH' | 'BEARISH' | 'STRONG_BEARISH';
  strength: number; // 0-100
  confidence: number; // 0-100
  duration: string;
  reversalProbability: number; // 0-100
  continuationProbability: number; // 0-100
}

interface EntrySignal {
  quality: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'AVOID';
  score: number; // 0-100
  reasons: string[];
  warnings: string[];
  suggestedEntry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
}

interface ExitSignal {
  shouldExit: boolean;
  reason: string;
  urgency: 'IMMEDIATE' | 'SOON' | 'MONITOR' | 'HOLD';
  suggestedExit: number;
  currentProfit: number;
  maxProfit: number;
  trailingStopPrice: number;
}

// Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period || 0.001;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate EMA
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// Calculate SMA
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// Calculate MACD
function calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdValue = ema12 - ema26;
  
  const macdHistory = prices.slice(-20).map((_, i) => {
    const slice = prices.slice(0, prices.length - 20 + i + 1);
    return calculateEMA(slice, 12) - calculateEMA(slice, 26);
  });
  const signal = calculateEMA(macdHistory, 9);
  
  return {
    value: macdValue,
    signal: signal,
    histogram: macdValue - signal
  };
}

// Calculate Bollinger Bands
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
  const sma = calculateSMA(prices, period);
  const squaredDiffs = prices.slice(-period).map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: sma + stdDev * std,
    middle: sma,
    lower: sma - stdDev * std
  };
}

// Calculate ATR
function calculateATR(data: { high: number; low: number; close: number }[], period: number = 14): number {
  if (data.length < period + 1) return 0;
  
  const trueRanges: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// Analyze Trend
function analyzeTrend(indicators: TechnicalIndicators, currentPrice: number): TrendAnalysis {
  let bullishPoints = 0;
  let bearishPoints = 0;
  let strengthSum = 0;
  
  // RSI Analysis
  if (indicators.rsi < 30) bullishPoints += 15;
  else if (indicators.rsi > 70) bearishPoints += 15;
  
  // MACD Analysis
  if (indicators.macd.histogram > 0) {
    bullishPoints += 20;
    if (indicators.macd.histogram > indicators.macd.value * 0.1) bullishPoints += 5;
  } else if (indicators.macd.histogram < 0) {
    bearishPoints += 20;
    if (indicators.macd.histogram < indicators.macd.value * -0.1) bearishPoints += 5;
  }
  
  // Moving Averages
  if (currentPrice > indicators.sma20) bullishPoints += 10;
  else bearishPoints += 10;
  
  if (indicators.ema9 > indicators.ema21) bullishPoints += 15;
  else bearishPoints += 15;
  
  // Bollinger Bands
  if (currentPrice > indicators.bollingerBands.middle) {
    bullishPoints += 10;
  } else {
    bearishPoints += 10;
  }
  
  // Volume
  if (indicators.volumeProfile === 'HIGH') strengthSum += 10;
  
  const totalPoints = bullishPoints + bearishPoints;
  const netStrength = Math.abs(bullishPoints - bearishPoints);
  const strength = Math.min(100, Math.round((netStrength / totalPoints) * 100 + strengthSum));
  
  let direction: TrendAnalysis['direction'];
  if (bullishPoints > bearishPoints + 25) direction = 'STRONG_BULLISH';
  else if (bullishPoints > bearishPoints + 10) direction = 'BULLISH';
  else if (bullishPoints > bearishPoints) direction = 'WEAK_BULLISH';
  else if (bearishPoints > bullishPoints + 25) direction = 'STRONG_BEARISH';
  else if (bearishPoints > bullishPoints + 10) direction = 'BEARISH';
  else if (bearishPoints > bullishPoints) direction = 'WEAK_BEARISH';
  else direction = 'NEUTRAL';
  
  const reversalProbability = direction.includes('BULLISH') 
    ? Math.min(90, indicators.rsi > 70 ? 60 : 30 + (70 - indicators.rsi) * 0.5)
    : Math.min(90, indicators.rsi < 30 ? 60 : 30 + (indicators.rsi - 30) * 0.5);
  
  return {
    direction,
    strength,
    confidence: Math.min(95, strength + 5),
    duration: strength > 70 ? '2-4 ساعات' : strength > 40 ? '1-2 ساعة' : '30-60 دقيقة',
    reversalProbability: Math.round(reversalProbability),
    continuationProbability: Math.round(100 - reversalProbability)
  };
}

// Generate Entry Signal
function generateEntrySignal(
  trend: TrendAnalysis, 
  indicators: TechnicalIndicators, 
  currentPrice: number,
  direction: 'CALL' | 'PUT'
): EntrySignal {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  
  const isTrendAligned = (direction === 'CALL' && trend.direction.includes('BULLISH')) ||
                         (direction === 'PUT' && trend.direction.includes('BEARISH'));
  
  if (isTrendAligned) {
    score += 25;
    reasons.push(`✅ الاتجاه ${trend.direction.includes('BULLISH') ? 'صعودي' : 'هبوطي'} ومتوافق`);
  } else {
    warnings.push(`⚠️ الاتجاه غير متوافق (${trend.direction})`);
    score -= 15;
  }
  
  if (direction === 'CALL' && indicators.rsi < 40) {
    score += 15;
    reasons.push(`✅ RSI في منطقة جيدة (${indicators.rsi.toFixed(1)})`);
  } else if (direction === 'PUT' && indicators.rsi > 60) {
    score += 15;
    reasons.push(`✅ RSI في منطقة جيدة (${indicators.rsi.toFixed(1)})`);
  }
  
  if ((direction === 'CALL' && indicators.macd.histogram > 0) ||
      (direction === 'PUT' && indicators.macd.histogram < 0)) {
    score += 15;
    reasons.push(`✅ MACD يدعم الاتجاه`);
  }
  
  if (trend.strength > 70) {
    score += 15;
    reasons.push(`✅ قوة الاتجاه عالية (${trend.strength}%)`);
  } else if (trend.strength < 30) {
    warnings.push(`⚠️ قوة الاتجاه ضعيفة (${trend.strength}%)`);
  }
  
  if (direction === 'CALL' && indicators.rsi > 70) {
    warnings.push(`⚠️ RSI فوق 70 - تشبع شرائي`);
    score -= 20;
  } else if (direction === 'PUT' && indicators.rsi < 30) {
    warnings.push(`⚠️ RSI تحت 30 - تشبع بيعي`);
    score -= 20;
  }
  
  const atr = indicators.atr || currentPrice * 0.01;
  const stopLossPercent = (atr / currentPrice) * 100 * 1.5;
  const stopLoss = direction === 'CALL' 
    ? currentPrice * (1 - stopLossPercent / 100)
    : currentPrice * (1 + stopLossPercent / 100);
  
  const takeProfit1 = direction === 'CALL'
    ? currentPrice * (1 + stopLossPercent * 1 / 100)
    : currentPrice * (1 - stopLossPercent * 1 / 100);
    
  const takeProfit2 = direction === 'CALL'
    ? currentPrice * (1 + stopLossPercent * 2 / 100)
    : currentPrice * (1 - stopLossPercent * 2 / 100);
    
  const takeProfit3 = direction === 'CALL'
    ? currentPrice * (1 + stopLossPercent * 3 / 100)
    : currentPrice * (1 - stopLossPercent * 3 / 100);
  
  score = Math.max(0, Math.min(100, score));
  
  let quality: EntrySignal['quality'];
  if (score >= 80) quality = 'EXCELLENT';
  else if (score >= 60) quality = 'GOOD';
  else if (score >= 40) quality = 'MODERATE';
  else if (score >= 20) quality = 'POOR';
  else quality = 'AVOID';
  
  return {
    quality,
    score,
    reasons,
    warnings,
    suggestedEntry: currentPrice,
    stopLoss: Math.round(stopLoss * 100) / 100,
    takeProfit1: Math.round(takeProfit1 * 100) / 100,
    takeProfit2: Math.round(takeProfit2 * 100) / 100,
    takeProfit3: Math.round(takeProfit3 * 100) / 100,
    riskRewardRatio: 2
  };
}

// Generate Exit Signal
function generateExitSignal(
  trade: { entryPrice: number; direction: string; maxPrice?: number; minPrice?: number },
  trend: TrendAnalysis,
  indicators: TechnicalIndicators,
  currentPrice: number
): ExitSignal {
  const isLong = trade.direction === 'CALL' || trade.direction === 'BUY';
  const maxPrice = trade.maxPrice || trade.entryPrice * 1.02;
  const minPrice = trade.minPrice || trade.entryPrice * 0.98;
  
  const currentProfit = isLong 
    ? ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100
    : ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;
  
  const maxProfit = isLong
    ? ((maxPrice - trade.entryPrice) / trade.entryPrice) * 100
    : ((trade.entryPrice - minPrice) / trade.entryPrice) * 100;
  
  let shouldExit = false;
  let reason = 'لا توجد إشارة خروج حالياً';
  let urgency: ExitSignal['urgency'] = 'HOLD';
  
  // Trend Reversal
  const trendReversing = (isLong && trend.direction.includes('BEARISH')) ||
                         (!isLong && trend.direction.includes('BULLISH'));
  
  if (trendReversing && trend.strength > 50) {
    shouldExit = true;
    reason = `🔴 انعكاس الاتجاه: ${trend.direction} بقوة ${trend.strength}%`;
    urgency = 'IMMEDIATE';
  }
  
  // RSI Reversal
  if (isLong && indicators.rsi > 75 && currentProfit > 0) {
    shouldExit = true;
    reason = `🟠 RSI فوق 75 (${indicators.rsi.toFixed(1)}) - تشبع شديد`;
    urgency = 'SOON';
  } else if (!isLong && indicators.rsi < 25 && currentProfit > 0) {
    shouldExit = true;
    reason = `🟠 RSI تحت 25 (${indicators.rsi.toFixed(1)}) - تشبع شديد`;
    urgency = 'SOON';
  }
  
  // Trailing Stop
  const atr = indicators.atr || currentPrice * 0.01;
  const trailingStop = isLong
    ? maxPrice - atr * 2
    : minPrice + atr * 2;
  
  if (currentProfit > 5 && isLong && currentPrice < trailingStop) {
    shouldExit = true;
    reason = `🔴 تم تفعيل الوقف المتحرك`;
    urgency = 'IMMEDIATE';
  } else if (currentProfit > 5 && !isLong && currentPrice > trailingStop) {
    shouldExit = true;
    reason = `🔴 تم تفعيل الوقف المتحرك`;
    urgency = 'IMMEDIATE';
  }
  
  // Trend Weakening
  if (trend.strength < 30 && currentProfit > 3) {
    reason = `🟡 قوة الاتجاه ضعفت إلى ${trend.strength}%`;
    urgency = 'MONITOR';
  }
  
  // High Reversal Probability
  if (trend.reversalProbability > 70 && currentProfit > 0) {
    reason = `🟡 احتمالية الانعكاس عالية: ${trend.reversalProbability}%`;
    urgency = 'SOON';
  }
  
  return {
    shouldExit,
    reason,
    urgency,
    suggestedExit: currentPrice,
    currentProfit: Math.round(currentProfit * 100) / 100,
    maxProfit: Math.round(maxProfit * 100) / 100,
    trailingStopPrice: Math.round(trailingStop * 100) / 100
  };
}

// POST - Analyze trade opportunity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, symbol, currentPrice, direction, trade } = body;
    
    const basePrice = currentPrice || 5000;
    
    // Simulate historical prices
    const simulatedPrices: number[] = [];
    const simulatedData: { high: number; low: number; close: number }[] = [];
    
    for (let i = 0; i < 100; i++) {
      const change = (Math.random() - 0.48) * basePrice * 0.01;
      const price = basePrice + change * i * 0.1;
      simulatedPrices.push(price);
      simulatedData.push({ 
        high: price * 1.002, 
        low: price * 0.998, 
        close: price 
      });
    }
    
    const indicators: TechnicalIndicators = {
      rsi: calculateRSI(simulatedPrices),
      rsiSignal: calculateRSI(simulatedPrices) < 30 ? 'OVERSOLD' : 
                 calculateRSI(simulatedPrices) > 70 ? 'OVERBOUGHT' : 'NEUTRAL',
      macd: calculateMACD(simulatedPrices),
      macdSignal: calculateMACD(simulatedPrices).histogram > 0 ? 'BULLISH' :
                  calculateMACD(simulatedPrices).histogram < 0 ? 'BEARISH' : 'NEUTRAL',
      sma20: calculateSMA(simulatedPrices, 20),
      sma50: calculateSMA(simulatedPrices, 50),
      sma200: calculateSMA(simulatedPrices, 200),
      ema9: calculateEMA(simulatedPrices, 9),
      ema21: calculateEMA(simulatedPrices, 21),
      bollingerBands: calculateBollingerBands(simulatedPrices),
      atr: calculateATR(simulatedData),
      volumeProfile: Math.random() > 0.6 ? 'HIGH' : Math.random() > 0.3 ? 'MEDIUM' : 'LOW'
    };
    
    const trend = analyzeTrend(indicators, basePrice);
    
    if (action === 'entry_signal' && direction) {
      const entrySignal = generateEntrySignal(trend, indicators, basePrice, direction);
      
      return NextResponse.json({
        success: true,
        symbol,
        direction,
        currentPrice: basePrice,
        entrySignal,
        trend,
        indicators: {
          rsi: Math.round(indicators.rsi * 10) / 10,
          macdSignal: indicators.macdSignal,
          trendStrength: trend.strength
        }
      });
    }
    
    if (action === 'exit_signal' && trade) {
      const exitSignal = generateExitSignal(trade, trend, indicators, basePrice);
      
      return NextResponse.json({
        success: true,
        symbol,
        exitSignal,
        trend,
        shouldExit: exitSignal.shouldExit,
        urgency: exitSignal.urgency
      });
    }
    
    // Default: full analysis
    return NextResponse.json({
      success: true,
      symbol,
      currentPrice: basePrice,
      indicators: {
        rsi: Math.round(indicators.rsi * 10) / 10,
        rsiSignal: indicators.rsiSignal,
        macd: indicators.macd,
        macdSignal: indicators.macdSignal,
        sma20: Math.round(indicators.sma20 * 100) / 100,
        ema9: Math.round(indicators.ema9 * 100) / 100,
        ema21: Math.round(indicators.ema21 * 100) / 100,
        bollingerBands: indicators.bollingerBands,
        volumeProfile: indicators.volumeProfile
      },
      trend,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Trading intelligence error:', error);
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 });
  }
}

// GET - Quick market analysis
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'SPX';
  
  return NextResponse.json({
    success: true,
    symbol,
    message: 'Use POST method for detailed analysis',
    endpoints: {
      analyze: 'POST /api/trading/intelligence { action: "analyze", symbol, currentPrice }',
      entrySignal: 'POST /api/trading/intelligence { action: "entry_signal", symbol, currentPrice, direction: "CALL"|"PUT" }',
      exitSignal: 'POST /api/trading/intelligence { action: "exit_signal", symbol, currentPrice, trade: {...} }'
    }
  });
}
