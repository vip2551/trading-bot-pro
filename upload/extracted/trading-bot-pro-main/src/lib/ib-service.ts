/**
 * Interactive Brokers API Service
 * Handles connection and trading with IB TWS/Gateway
 */

import { db } from './db';

// IB API Types
export interface IBConfig {
  host: string;
  port: number;
  clientId: number;
  accountType: 'paper' | 'live';
}

export interface IBOrder {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MKT' | 'LMT' | 'STP';
  limitPrice?: number;
  stopPrice?: number;
  tif?: 'DAY' | 'GTC' | 'IOC';
}

export interface IBPosition {
  symbol: string;
  position: number;
  avgCost: number;
  marketPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface IBAccountSummary {
  account: string;
  totalCashValue: number;
  availableFunds: number;
  buyingPower: number;
  grossPositionValue: number;
  netLiquidation: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface IBContract {
  symbol: string;
  secType: 'STK' | 'OPT' | 'FUT' | 'CASH' | 'IND';
  exchange: string;
  currency: string;
  expiry?: string;
  strike?: number;
  right?: 'C' | 'P';
  multiplier?: string;
}

// IB Connection Manager
export class IBService {
  private config: IBConfig | null = null;
  private connected: boolean = false;
  private socket: WebSocket | null = null;
  private requestId: number = 1;
  private orderId: number = 1;
  private callbacks: Map<number, (data: any) => void> = new Map();
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.initEventListeners();
  }

  private initEventListeners() {
    const events = [
      'connected', 'disconnected', 'error', 'orderStatus',
      'position', 'accountSummary', 'marketData', 'tickPrice'
    ];
    events.forEach(event => this.eventListeners.set(event, []));
  }

  // Configure IB connection
  configure(config: IBConfig): void {
    this.config = config;
  }

  // Connect to IB TWS/Gateway
  async connect(): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: 'IB not configured' };
    }

    try {
      // In a real implementation, this would connect to IB's API
      // For demo/preview, we simulate the connection
      
      // Simulate WebSocket connection to IB
      // Note: IB uses a custom protocol, not WebSocket directly
      // This is a simplified version for demonstration
      
      console.log(`Connecting to IB at ${this.config.host}:${this.config.port}`);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.connected = true;
      this.emit('connected', { 
        host: this.config.host, 
        port: this.config.port,
        clientId: this.config.clientId 
      });

      return { 
        success: true, 
        message: `Connected to IB ${this.config.accountType} account` 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
  }

  // Disconnect from IB
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.emit('disconnected', {});
  }

  // Check connection status
  isConnected(): boolean {
    return this.connected;
  }

  // Get account summary
  async getAccountSummary(): Promise<IBAccountSummary | null> {
    if (!this.connected) return null;

    // Simulated account summary for demo
    return {
      account: 'DU1234567',
      totalCashValue: 100000,
      availableFunds: 85000,
      buyingPower: 340000,
      grossPositionValue: 15000,
      netLiquidation: 115000,
      unrealizedPnL: 2500,
      realizedPnL: 5200
    };
  }

  // Get positions
  async getPositions(): Promise<IBPosition[]> {
    if (!this.connected) return [];

    // Simulated positions
    return [
      {
        symbol: 'SPX',
        position: 5,
        avgCost: 350,
        marketPrice: 380,
        marketValue: 1900,
        unrealizedPnL: 150,
        realizedPnL: 0
      }
    ];
  }

  // Place order
  async placeOrder(order: IBOrder, contract: IBContract): Promise<{ 
    success: boolean; 
    orderId?: number; 
    message?: string 
  }> {
    if (!this.connected) {
      return { success: false, message: 'Not connected to IB' };
    }

    try {
      const orderId = this.orderId++;
      
      // Simulate order placement
      console.log('Placing order:', { orderId, order, contract });
      
      this.emit('orderStatus', {
        orderId,
        status: 'Submitted',
        filled: 0,
        remaining: order.quantity,
        avgFillPrice: 0
      });

      // Simulate immediate fill for market orders
      if (order.orderType === 'MKT') {
        setTimeout(() => {
          this.emit('orderStatus', {
            orderId,
            status: 'Filled',
            filled: order.quantity,
            remaining: 0,
            avgFillPrice: order.limitPrice || 100 // Simulated price
          });
        }, 500);
      }

      return { success: true, orderId };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Cancel order
  async cancelOrder(orderId: number): Promise<boolean> {
    if (!this.connected) return false;
    
    console.log('Cancelling order:', orderId);
    this.emit('orderStatus', {
      orderId,
      status: 'Cancelled',
      filled: 0,
      remaining: 0,
      avgFillPrice: 0
    });
    
    return true;
  }

  // Request market data
  async requestMarketData(contract: IBContract): Promise<void> {
    if (!this.connected) return;

    const reqId = this.requestId++;
    console.log('Requesting market data for:', contract.symbol);

    // Simulate market data updates
    const sendUpdate = () => {
      this.emit('marketData', {
        reqId,
        symbol: contract.symbol,
        bid: 99.50 + Math.random() * 0.5,
        ask: 100.00 + Math.random() * 0.5,
        last: 99.75 + Math.random() * 0.5,
        volume: Math.floor(Math.random() * 1000000)
      });
    };

    sendUpdate();
    // Continue sending updates (would be from IB in real implementation)
    const interval = setInterval(sendUpdate, 1000);
    
    // Store interval for cleanup
    this.callbacks.set(reqId, () => clearInterval(interval));
  }

  // Cancel market data
  cancelMarketData(reqId: number): void {
    const cleanup = this.callbacks.get(reqId);
    if (cleanup) {
      cleanup({});
      this.callbacks.delete(reqId);
    }
  }

  // Event handling
  on(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.push(callback);
    }
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Create SPX option contract
  static createSPXOptionContract(
    strike: number, 
    right: 'C' | 'P', 
    expiry: string
  ): IBContract {
    return {
      symbol: 'SPX',
      secType: 'OPT',
      exchange: 'CBOE',
      currency: 'USD',
      strike,
      right,
      expiry,
      multiplier: '100'
    };
  }

  // Create stock contract
  static createStockContract(symbol: string, exchange: string = 'SMART'): IBContract {
    return {
      symbol,
      secType: 'STK',
      exchange,
      currency: 'USD'
    };
  }
}

// Singleton instance
export const ibService = new IBService();

// IB Configuration helper
export function getIBConfig(accountType: 'paper' | 'live'): IBConfig {
  return {
    host: '127.0.0.1',
    port: accountType === 'paper' ? 7497 : 7496,
    clientId: Math.floor(Math.random() * 10000) + 1,
    accountType
  };
}

// Validate IB connection settings
export function validateIBConfig(config: IBConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.host || config.host.trim() === '') {
    errors.push('Host is required');
  }

  if (!config.port || (config.port !== 7496 && config.port !== 7497 && config.port !== 4001 && config.port !== 4002)) {
    errors.push('Port must be 7496 (Live), 7497 (Paper), 4001 (Gateway Live), or 4002 (Gateway Paper)');
  }

  if (!config.clientId || config.clientId < 0) {
    errors.push('Client ID must be a positive number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
