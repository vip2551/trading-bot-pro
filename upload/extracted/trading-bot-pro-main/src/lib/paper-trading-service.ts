/**
 * Paper Trading Service
 * Simulates trading for testing without real money
 * Can also connect to IB for real paper trading
 */

import { db } from './db';
import { ibService, IBOrder, IBContract } from './ib-service';
import { telegramService } from './telegram-service';

export type TradingMode = 'simulation' | 'paper' | 'live';

export interface PaperTradingConfig {
  mode: TradingMode;
  initialBalance: number;
  leverage: number;
  commission: number; // per contract
  slippage: number; // percentage
  enableTrailingStop: boolean;
  defaultStopLoss: number; // percentage
  defaultTakeProfit: number; // percentage
  maxPositionSize: number; // percentage of account
  maxDailyLoss: number; // percentage
  riskPerTrade: number; // percentage
}

export interface SimulatedPosition {
  id: string;
  symbol: string;
  direction: 'CALL' | 'PUT' | 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingStop: number | null;
  trailingStopPercent: number | null;
  highestPrice: number;
  lowestPrice: number;
  pnl: number;
  pnlPercent: number;
  openedAt: Date;
  expiresAt: Date | null;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  closeReason?: string;
}

export interface SimulatedOrder {
  id: string;
  symbol: string;
  direction: 'CALL' | 'PUT' | 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  limitPrice?: number;
  stopPrice?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  filledPrice?: number;
  filledQuantity: number;
  createdAt: Date;
  filledAt?: Date;
  reason?: string;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: Date;
}

export interface TradingStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  avgHoldTime: number; // minutes
  bestTrade: number;
  worstTrade: number;
}

export class PaperTradingService {
  private config: PaperTradingConfig;
  private balance: number;
  private availableFunds: number;
  private positions: Map<string, SimulatedPosition> = new Map();
  private orders: Map<string, SimulatedOrder> = new Map();
  private tradeHistory: SimulatedPosition[] = [];
  private marketData: Map<string, MarketData> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private dailyPnL: number = 0;
  private dailyStartDate: Date = new Date();

  constructor(config?: Partial<PaperTradingConfig>) {
    this.config = {
      mode: 'simulation',
      initialBalance: 100000,
      leverage: 1,
      commission: 0.65, // IB typical commission
      slippage: 0.1,
      enableTrailingStop: true,
      defaultStopLoss: 50,
      defaultTakeProfit: 100,
      maxPositionSize: 10,
      maxDailyLoss: 5,
      riskPerTrade: 2,
      ...config
    };
    this.balance = this.config.initialBalance;
    this.availableFunds = this.balance;
  }

  // Initialize the service
  async initialize(): Promise<void> {
    // Start price simulation
    this.startPriceSimulation();
    
    // Reset daily stats at midnight
    this.scheduleDailyReset();
    
    console.log('Paper Trading Service initialized');
  }

  // Get current config
  getConfig(): PaperTradingConfig {
    return { ...this.config };
  }

  // Update config
  updateConfig(config: Partial<PaperTradingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get account info
  getAccountInfo() {
    const totalPositionValue = Array.from(this.positions.values())
      .reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0);
    
    return {
      balance: this.balance,
      availableFunds: this.availableFunds,
      leverage: this.config.leverage,
      totalPositionValue,
      equity: this.balance + this.getUnrealizedPnL(),
      unrealizedPnL: this.getUnrealizedPnL(),
      dailyPnL: this.dailyPnL,
      openPositions: this.positions.size,
      pendingOrders: Array.from(this.orders.values()).filter(o => o.status === 'PENDING').length
    };
  }

  // Get all positions
  getPositions(): SimulatedPosition[] {
    return Array.from(this.positions.values());
  }

  // Get position by ID
  getPosition(id: string): SimulatedPosition | undefined {
    return this.positions.get(id);
  }

  // Get open positions
  getOpenPositions(): SimulatedPosition[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'OPEN');
  }

  // Get trade history
  getTradeHistory(): SimulatedPosition[] {
    return this.tradeHistory;
  }

  // Get trading statistics
  getStats(): TradingStats {
    const closedTrades = this.tradeHistory.filter(t => t.status === 'CLOSED');
    const wins = closedTrades.filter(t => t.pnl > 0);
    const losses = closedTrades.filter(t => t.pnl < 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = this.config.initialBalance;
    let runningBalance = this.config.initialBalance;
    
    for (const trade of closedTrades.sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime())) {
      runningBalance += trade.pnl;
      peak = Math.max(peak, runningBalance);
      const drawdown = (peak - runningBalance) / peak * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Calculate average hold time
    const holdTimes = closedTrades.map(t => {
      const closeTime = t.expiresAt || new Date();
      return (closeTime.getTime() - t.openedAt.getTime()) / 60000; // minutes
    });
    const avgHoldTime = holdTimes.length > 0 
      ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length 
      : 0;

    return {
      totalTrades: closedTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      totalPnL,
      avgWin,
      avgLoss,
      maxDrawdown,
      profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
      sharpeRatio: this.calculateSharpeRatio(closedTrades),
      avgHoldTime,
      bestTrade: wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0,
      worstTrade: losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0
    };
  }

  // Open a new position
  async openPosition(params: {
    symbol: string;
    direction: 'CALL' | 'PUT' | 'BUY' | 'SELL';
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
    trailingStopPercent?: number;
    maxHoldMinutes?: number;
  }): Promise<{ success: boolean; position?: SimulatedPosition; error?: string }> {
    
    // Check daily loss limit
    const dailyLossPercent = (this.dailyPnL / this.config.initialBalance) * 100;
    if (dailyLossPercent < -this.config.maxDailyLoss) {
      return { success: false, error: 'Daily loss limit reached' };
    }

    // Get current market price
    const marketData = this.marketData.get(params.symbol);
    if (!marketData) {
      return { success: false, error: 'Market data not available' };
    }

    // Calculate entry price with slippage
    const slippageMultiplier = 1 + (this.config.slippage / 100);
    const entryPrice = params.direction === 'CALL' || params.direction === 'BUY'
      ? marketData.ask * slippageMultiplier
      : marketData.bid * (2 - slippageMultiplier);

    // Calculate position cost
    const positionCost = params.quantity * entryPrice + (this.config.commission * params.quantity);
    
    // Check available funds
    if (positionCost > this.availableFunds) {
      return { success: false, error: 'Insufficient funds' };
    }

    // Check position size limit
    const positionPercent = (positionCost / this.balance) * 100;
    if (positionPercent > this.config.maxPositionSize) {
      return { success: false, error: `Position size exceeds ${this.config.maxPositionSize}% limit` };
    }

    // Create position
    const position: SimulatedPosition = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: params.symbol,
      direction: params.direction,
      quantity: params.quantity,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss: params.stopLoss || entryPrice * (1 - this.config.defaultStopLoss / 100),
      takeProfit: params.takeProfit || entryPrice * (1 + this.config.defaultTakeProfit / 100),
      trailingStop: null,
      trailingStopPercent: params.trailingStopPercent || null,
      highestPrice: entryPrice,
      lowestPrice: entryPrice,
      pnl: 0,
      pnlPercent: 0,
      openedAt: new Date(),
      expiresAt: params.maxHoldMinutes ? new Date(Date.now() + params.maxHoldMinutes * 60000) : null,
      status: 'OPEN'
    };

    // Update account
    this.positions.set(position.id, position);
    this.availableFunds -= positionCost;

    // Send notification
    await telegramService.sendTradeNotification({
      symbol: position.symbol,
      direction: position.direction,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      status: 'Opened'
    });

    return { success: true, position };
  }

  // Close a position
  async closePosition(positionId: string, reason: string = 'Manual'): Promise<{ success: boolean; pnl?: number; error?: string }> {
    const position = this.positions.get(positionId);
    if (!position) {
      return { success: false, error: 'Position not found' };
    }

    if (position.status !== 'OPEN') {
      return { success: false, error: 'Position already closed' };
    }

    // Get current market price
    const marketData = this.marketData.get(position.symbol);
    if (!marketData) {
      return { success: false, error: 'Market data not available' };
    }

    // Calculate exit price with slippage
    const slippageMultiplier = 1 + (this.config.slippage / 100);
    const exitPrice = position.direction === 'CALL' || position.direction === 'BUY'
      ? marketData.bid * (2 - slippageMultiplier)
      : marketData.ask * slippageMultiplier;

    // Calculate P&L
    const multiplier = position.direction === 'CALL' || position.direction === 'BUY' ? 1 : -1;
    const pnl = (exitPrice - position.entryPrice) * position.quantity * multiplier;
    const commission = this.config.commission * position.quantity;
    const netPnL = pnl - commission;

    // Update position
    position.currentPrice = exitPrice;
    position.pnl = netPnL;
    position.pnlPercent = (netPnL / (position.entryPrice * position.quantity)) * 100;
    position.status = 'CLOSED';
    position.closeReason = reason;

    // Move to history
    this.positions.delete(positionId);
    this.tradeHistory.push(position);

    // Update account
    const positionValue = position.quantity * exitPrice;
    this.balance += netPnL;
    this.availableFunds += positionValue + netPnL;
    this.dailyPnL += netPnL;

    // Send notification
    await telegramService.sendTradeNotification({
      symbol: position.symbol,
      direction: position.direction,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      status: 'Closed',
      pnl: netPnL
    });

    return { success: true, pnl: netPnL };
  }

  // Update market data
  updateMarketData(symbol: string, data: Partial<MarketData>): void {
    const existing = this.marketData.get(symbol) || {
      symbol,
      bid: 100,
      ask: 100.5,
      last: 100.25,
      volume: 0,
      timestamp: new Date()
    };

    this.marketData.set(symbol, {
      ...existing,
      ...data,
      timestamp: new Date()
    });

    // Update positions
    this.updatePositionsForPrice(symbol);
  }

  // Update positions based on new price
  private updatePositionsForPrice(symbol: string): void {
    const marketData = this.marketData.get(symbol);
    if (!marketData) return;

    for (const position of this.positions.values()) {
      if (position.symbol !== symbol) continue;

      // Update current price
      position.currentPrice = marketData.last;
      
      // Track highest/lowest for trailing stop
      position.highestPrice = Math.max(position.highestPrice, marketData.last);
      position.lowestPrice = Math.min(position.lowestPrice, marketData.last);

      // Update trailing stop
      if (position.trailingStopPercent && this.config.enableTrailingStop) {
        if (position.direction === 'CALL' || position.direction === 'BUY') {
          position.trailingStop = position.highestPrice * (1 - position.trailingStopPercent / 100);
        } else {
          position.trailingStop = position.lowestPrice * (1 + position.trailingStopPercent / 100);
        }
      }

      // Calculate P&L
      const multiplier = position.direction === 'CALL' || position.direction === 'BUY' ? 1 : -1;
      position.pnl = (position.currentPrice - position.entryPrice) * position.quantity * multiplier;
      position.pnlPercent = (position.pnl / (position.entryPrice * position.quantity)) * 100;

      // Check stop loss
      if (position.stopLoss) {
        if (position.direction === 'CALL' || position.direction === 'BUY') {
          if (marketData.last <= position.stopLoss) {
            this.closePosition(position.id, 'Stop Loss');
            continue;
          }
        } else {
          if (marketData.last >= position.stopLoss) {
            this.closePosition(position.id, 'Stop Loss');
            continue;
          }
        }
      }

      // Check take profit
      if (position.takeProfit) {
        if (position.direction === 'CALL' || position.direction === 'BUY') {
          if (marketData.last >= position.takeProfit) {
            this.closePosition(position.id, 'Take Profit');
            continue;
          }
        } else {
          if (marketData.last <= position.takeProfit) {
            this.closePosition(position.id, 'Take Profit');
            continue;
          }
        }
      }

      // Check trailing stop
      if (position.trailingStop) {
        if (position.direction === 'CALL' || position.direction === 'BUY') {
          if (marketData.last <= position.trailingStop) {
            this.closePosition(position.id, 'Trailing Stop');
            continue;
          }
        } else {
          if (marketData.last >= position.trailingStop) {
            this.closePosition(position.id, 'Trailing Stop');
            continue;
          }
        }
      }

      // Check expiry
      if (position.expiresAt && new Date() >= position.expiresAt) {
        this.closePosition(position.id, 'Expired');
      }
    }
  }

  // Start price simulation
  private startPriceSimulation(): void {
    // Initialize SPX price
    this.marketData.set('SPX', {
      symbol: 'SPX',
      bid: 5800,
      ask: 5800.5,
      last: 5800.25,
      volume: 1000000,
      timestamp: new Date()
    });

    // Simulate price movements
    this.priceUpdateInterval = setInterval(() => {
      for (const [symbol, data] of this.marketData) {
        // Random walk with small volatility
        const change = (Math.random() - 0.5) * 2;
        const newPrice = data.last + change;
        
        this.updateMarketData(symbol, {
          bid: newPrice - 0.25,
          ask: newPrice + 0.25,
          last: newPrice,
          volume: data.volume + Math.floor(Math.random() * 1000)
        });
      }
    }, 1000);
  }

  // Stop price simulation
  stopPriceSimulation(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
  }

  // Get unrealized P&L
  private getUnrealizedPnL(): number {
    return Array.from(this.positions.values())
      .reduce((sum, p) => sum + p.pnl, 0);
  }

  // Calculate Sharpe Ratio
  private calculateSharpeRatio(trades: SimulatedPosition[]): number {
    if (trades.length < 2) return 0;

    const returns = trades.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    // Assuming 252 trading days and risk-free rate of 5%
    const riskFreeRate = 5 / 252; // daily
    const sharpe = stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;

    return sharpe * Math.sqrt(252); // Annualized
  }

  // Schedule daily reset
  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyStats();
      this.scheduleDailyReset();
    }, msUntilMidnight);
  }

  // Reset daily stats
  private resetDailyStats(): void {
    this.dailyPnL = 0;
    this.dailyStartDate = new Date();
    console.log('Daily stats reset');
  }

  // Reset account
  resetAccount(): void {
    this.positions.clear();
    this.orders.clear();
    this.tradeHistory = [];
    this.balance = this.config.initialBalance;
    this.availableFunds = this.balance;
    this.dailyPnL = 0;
  }
}

// Default instance
export const paperTradingService = new PaperTradingService();
