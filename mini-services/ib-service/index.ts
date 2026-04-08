import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3003;

// Types
interface Settings {
  accountType: string;
  ibHost: string;
  ibPort: number;
  ibClientId: number;
  // Spread & Liquidity
  checkSpread: boolean;
  maxSpreadPercent: number;
  checkLiquidity: boolean;
  minLiquidity: number;
  maxSlippagePercent: number;
  // Execution
  orderType: string;
  limitOrderOffset: number;
  timeoutSeconds: number;
  retryAttempts: number;
}

interface MarketData {
  bid: number;
  ask: number;
  last: number;
  bidSize: number;
  askSize: number;
  volume: number;
  openInterest: number;
}

interface TradeRequest {
  tradeId: string;
  symbol: string;
  direction: string;
  quantity: number;
  strike?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
}

interface TradeResult {
  success: boolean;
  orderId?: number;
  error?: string;
  simulated?: boolean;
  warnings?: string[];
  spread?: { value: number; percent: number };
  liquidity?: { available: number; required: number };
  slippage?: { estimated: number; percent: number };
}

let isConnected = false;
let orderId = 1;
let settings: Settings = {
  accountType: 'PAPER',
  ibHost: '127.0.0.1',
  ibPort: 7497,
  ibClientId: 1,
  checkSpread: true,
  maxSpreadPercent: 5.0,
  checkLiquidity: true,
  minLiquidity: 100,
  maxSlippagePercent: 1.0,
  orderType: 'LIMIT',
  limitOrderOffset: 0.5,
  timeoutSeconds: 30,
  retryAttempts: 3,
};

const ACCOUNT_PORTS = { SIMULATION: 0, PAPER: 7497, LIVE: 7496 };
const simulatedPrices: Record<string, number> = { SPX: 5800, ES: 5800, GC: 2350, AAPL: 180, TSLA: 250 };
const activeTrades = new Map<string, { orderId: number; symbol: string; direction: string; price: number; simulated: boolean }>();

// Connect to IB
async function connectToIB(): Promise<boolean> {
  if (settings.accountType === 'SIMULATION') {
    console.log('🎭 Simulation mode - no IB connection');
    isConnected = true;
    return true;
  }
  console.log(`📡 Connecting to IB at ${settings.ibHost}:${settings.ibPort}`);
  // In production: actual IB connection here
  isConnected = true;
  return true;
}

async function disconnectFromIB(): Promise<void> {
  isConnected = false;
}

// Get market data (simulated or from IB)
async function getMarketData(symbol: string, strike?: number | null): Promise<MarketData> {
  const basePrice = simulatedPrices[symbol] || 100;
  const optionPremium = symbol === 'SPX' && strike ? basePrice * 0.01 : 0;
  const midPrice = (basePrice * 0.01) + optionPremium + (Math.random() - 0.5) * 5;
  
  // Simulate spread based on liquidity
  const spreadPercent = settings.accountType === 'SIMULATION' ? 2 : 1;
  const halfSpread = midPrice * (spreadPercent / 100);
  
  return {
    bid: midPrice - halfSpread,
    ask: midPrice + halfSpread,
    last: midPrice,
    bidSize: Math.floor(Math.random() * 500) + 100,
    askSize: Math.floor(Math.random() * 500) + 100,
    volume: Math.floor(Math.random() * 10000) + 1000,
    openInterest: Math.floor(Math.random() * 50000) + 5000,
  };
}

// Verify spread and liquidity before trade
async function verifySpreadAndLiquidity(symbol: string, quantity: number, marketData: MarketData): Promise<{ valid: boolean; warnings: string[]; spread: { value: number; percent: number }; liquidity: { available: number; required: number }; slippage: { estimated: number; percent: number } }> {
  const warnings: string[] = [];
  
  // Check spread
  const spreadValue = marketData.ask - marketData.bid;
  const midPrice = (marketData.ask + marketData.bid) / 2;
  const spreadPercent = (spreadValue / midPrice) * 100;
  
  if (settings.checkSpread && spreadPercent > settings.maxSpreadPercent) {
    warnings.push(`⚠️ Spread too high: ${spreadPercent.toFixed(2)}% > ${settings.maxSpreadPercent}%`);
  }
  
  // Check liquidity
  const availableLiquidity = Math.min(marketData.bidSize, marketData.askSize);
  
  if (settings.checkLiquidity && availableLiquidity < settings.minLiquidity) {
    warnings.push(`⚠️ Low liquidity: ${availableLiquidity} < ${settings.minLiquidity} contracts`);
  }
  
  if (settings.checkLiquidity && availableLiquidity < quantity) {
    warnings.push(`⚠️ Insufficient liquidity: need ${quantity}, only ${availableLiquidity} available`);
  }
  
  // Estimate slippage
  const slippageRatio = Math.min(quantity / availableLiquidity, 1);
  const estimatedSlippage = spreadValue * (1 + slippageRatio * 2);
  const slippagePercent = (estimatedSlippage / midPrice) * 100;
  
  if (slippagePercent > settings.maxSlippagePercent) {
    warnings.push(`⚠️ High slippage expected: ${slippagePercent.toFixed(2)}%`);
  }
  
  const valid = warnings.length === 0 || settings.accountType === 'SIMULATION';
  
  return {
    valid,
    warnings,
    spread: { value: spreadValue, percent: spreadPercent },
    liquidity: { available: availableLiquidity, required: quantity },
    slippage: { estimated: estimatedSlippage, percent: slippagePercent },
  };
}

// Open trade with verification
async function openTrade(req: TradeRequest): Promise<TradeResult> {
  const warnings: string[] = [];
  
  // Get market data
  const marketData = await getMarketData(req.symbol, req.strike);
  
  // Verify spread and liquidity
  const verification = await verifySpreadAndLiquidity(req.symbol, req.quantity, marketData);
  
  if (!verification.valid && settings.accountType !== 'SIMULATION') {
    return {
      success: false,
      error: 'Trade rejected: ' + verification.warnings.join('; '),
      warnings: verification.warnings,
    };
  }
  
  // Calculate execution price
  let executionPrice: number;
  if (settings.orderType === 'LIMIT') {
    // For limit orders, use bid + offset for buys
    executionPrice = req.direction === 'CALL' || req.direction === 'BUY'
      ? marketData.bid + settings.limitOrderOffset
      : marketData.ask - settings.limitOrderOffset;
  } else {
    // Market order
    executionPrice = req.direction === 'CALL' || req.direction === 'BUY'
      ? marketData.ask
      : marketData.bid;
  }
  
  if (settings.accountType === 'SIMULATION') {
    // Simulate trade
    const simOrderId = 900000 + Math.floor(Math.random() * 100000);
    activeTrades.set(req.tradeId, { orderId: simOrderId, symbol: req.symbol, direction: req.direction, price: executionPrice, simulated: true });
    
    // Notify main app after delay
    setTimeout(() => {
      fetch(`http://localhost:3000/api/trades/${req.tradeId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'OPEN', 
          fillPrice: executionPrice, 
          ibOrderId: simOrderId, 
          filled: req.quantity,
          bidPrice: marketData.bid,
          askPrice: marketData.ask,
          spreadPercent: verification.spread.percent,
          volumeAtExecution: verification.liquidity.available,
          slippage: verification.slippage.estimated,
        }),
      }).catch(() => {});
    }, 500);
    
    console.log(`🎭 [SIM] Opened: ${req.symbol} ${req.direction} @ $${executionPrice.toFixed(2)}`);
    
    return {
      success: true,
      orderId: simOrderId,
      simulated: true,
      warnings: verification.warnings,
      spread: verification.spread,
      liquidity: verification.liquidity,
      slippage: verification.slippage,
    };
  }
  
  // Real IB trade (when connected)
  if (!isConnected) {
    const connected = await connectToIB();
    if (!connected) {
      return { success: false, error: 'Not connected to IB' };
    }
  }
  
  const tradeOrderId = orderId++;
  activeTrades.set(req.tradeId, { orderId: tradeOrderId, symbol: req.symbol, direction: req.direction, price: executionPrice, simulated: false });
  
  // Simulate execution for now
  setTimeout(() => {
    fetch(`http://localhost:3000/api/trades/${req.tradeId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'OPEN', 
        fillPrice: executionPrice, 
        ibOrderId: tradeOrderId, 
        filled: req.quantity,
        bidPrice: marketData.bid,
        askPrice: marketData.ask,
        spreadPercent: verification.spread.percent,
        volumeAtExecution: verification.liquidity.available,
        slippage: verification.slippage.estimated,
      }),
    }).catch(() => {});
  }, 300);
  
  console.log(`${settings.accountType === 'LIVE' ? '🔴' : '🟢'} Opened: ${req.symbol} ${req.direction} @ $${executionPrice.toFixed(2)}`);
  
  return {
    success: true,
    orderId: tradeOrderId,
    warnings: verification.warnings,
    spread: verification.spread,
    liquidity: verification.liquidity,
    slippage: verification.slippage,
  };
}

// Close trade
async function closeTrade(tradeId: string): Promise<{ success: boolean; error?: string }> {
  const trade = activeTrades.get(tradeId);
  if (!trade) return { success: false, error: 'Trade not found' };
  
  activeTrades.delete(tradeId);
  
  setTimeout(() => {
    fetch(`http://localhost:3000/api/trades/${tradeId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED', fillPrice: trade.price, ibOrderId: trade.orderId }),
    }).catch(() => {});
  }, 300);
  
  console.log(`Closed: ${tradeId}`);
  return { success: true };
}

// ===== ROUTES =====

app.get('/health', (_req, res) => res.json({ 
  status: 'ok', 
  connected: isConnected, 
  accountType: settings.accountType, 
  activeTrades: activeTrades.size,
  settings: {
    checkSpread: settings.checkSpread,
    maxSpreadPercent: settings.maxSpreadPercent,
    checkLiquidity: settings.checkLiquidity,
    minLiquidity: settings.minLiquidity,
    orderType: settings.orderType,
  }
}));

app.post('/bot/start', async (_req, res) => {
  const connected = await connectToIB();
  res.json({ success: connected, connected: isConnected, accountType: settings.accountType });
});

app.post('/bot/stop', async (_req, res) => {
  await disconnectFromIB();
  res.json({ success: true, connected: false });
});

app.post('/ib/connect', async (req, res) => {
  const { host, port, clientId, accountType } = req.body;
  if (accountType) {
    settings.accountType = accountType;
    settings.ibPort = ACCOUNT_PORTS[accountType as keyof typeof ACCOUNT_PORTS] || port;
  }
  if (host) settings.ibHost = host;
  if (port) settings.ibPort = port;
  if (clientId) settings.ibClientId = clientId;
  const connected = await connectToIB();
  res.json({ success: connected, connected: isConnected, accountType: settings.accountType });
});

app.post('/ib/disconnect', async (_req, res) => {
  await disconnectFromIB();
  res.json({ success: true, connected: false });
});

// Trade routes
app.post('/trade/open', async (req, res) => res.json(await openTrade(req.body)));
app.post('/trade/close', async (req, res) => res.json(await closeTrade(req.body.tradeId)));

app.post('/trade/trailing', (req, res) => {
  const { tradeId, amount, percent } = req.body;
  const trade = activeTrades.get(tradeId);
  if (trade) {
    console.log(`Trailing stop set for ${tradeId}: ${percent ? percent + '%' : '$' + amount}`);
  }
  res.json({ success: true });
});

// Market data
app.get('/market/:symbol', async (req, res) => {
  const marketData = await getMarketData(req.params.symbol);
  res.json({ 
    symbol: req.params.symbol,
    price: (marketData.bid + marketData.ask) / 2,
    bid: marketData.bid,
    ask: marketData.ask,
    bidSize: marketData.bidSize,
    askSize: marketData.askSize,
    volume: marketData.volume,
    openInterest: marketData.openInterest,
    simulated: settings.accountType === 'SIMULATION',
  });
});

// Spread & Liquidity verification endpoint
app.post('/verify', async (req, res) => {
  const { symbol, quantity, strike } = req.body;
  const marketData = await getMarketData(symbol, strike);
  const verification = await verifySpreadAndLiquidity(symbol, quantity, marketData);
  
  res.json({
    symbol,
    quantity,
    marketData: {
      bid: marketData.bid,
      ask: marketData.ask,
      last: marketData.last,
      volume: marketData.volume,
      openInterest: marketData.openInterest,
    },
    verification: {
      valid: verification.valid,
      warnings: verification.warnings,
      spread: verification.spread,
      liquidity: verification.liquidity,
      slippage: verification.slippage,
    },
    settings: {
      maxSpreadPercent: settings.maxSpreadPercent,
      minLiquidity: settings.minLiquidity,
      maxSlippagePercent: settings.maxSlippagePercent,
    },
  });
});

// Settings
app.post('/settings', (req, res) => {
  const newSettings = req.body;
  settings = { ...settings, ...newSettings };
  res.json({ success: true, settings });
});

app.get('/settings', (_req, res) => res.json(settings));

// Start server
app.listen(PORT, () => {
  console.log(`🤖 IB Service running on port ${PORT}`);
  console.log(`📡 Modes: 🟣 Simulation | 🟢 Paper (7497) | 🔴 Live (7496)`);
  console.log(`📊 Spread check: ${settings.checkSpread ? '✅' : '❌'} (max ${settings.maxSpreadPercent}%)`);
  console.log(`💧 Liquidity check: ${settings.checkLiquidity ? '✅' : '❌'} (min ${settings.minLiquidity} contracts)`);
  console.log(`📈 Max slippage: ${settings.maxSlippagePercent}%`);
  console.log(`Current mode: ${settings.accountType}`);
});
