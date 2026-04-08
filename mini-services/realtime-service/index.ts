import { createServer } from 'http';
import { Server } from 'socket.io';
import { setInterval } from 'timers';

const PORT = 3004;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store connected clients and their subscriptions
const clients = new Map<string, {
  userId?: string;
  subscriptions: Set<string>;
  lastPing: number;
}>();

// Market data simulation (in production, this would come from IB)
let marketData = {
  spx: { price: 5800, bid: 5799.5, ask: 5800.5, volume: 1000000, lastUpdate: new Date() },
  vix: { price: 15.5, bid: 15.4, ask: 15.6, volume: 500000, lastUpdate: new Date() },
};

// Active alerts
const priceAlerts = new Map<string, {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  triggered: boolean;
  createdAt: Date;
}>();

// Health status
let healthStatus = {
  ib: { connected: false, lastUpdate: new Date(), latency: 0 },
  database: { connected: true, lastUpdate: new Date() },
  server: { uptime: Date.now(), memory: process.memoryUsage().heapUsed },
};

// Connection handler
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  
  clients.set(socket.id, {
    subscriptions: new Set(),
    lastPing: Date.now(),
  });

  // Send initial data
  socket.emit('connected', { 
    id: socket.id, 
    timestamp: new Date(),
    marketData,
    health: healthStatus,
  });

  // Handle user authentication
  socket.on('auth', (data: { userId: string }) => {
    const client = clients.get(socket.id);
    if (client) {
      client.userId = data.userId;
      console.log(`[WS] Client ${socket.id} authenticated as ${data.userId}`);
    }
  });

  // Handle subscriptions
  socket.on('subscribe', (channels: string[]) => {
    const client = clients.get(socket.id);
    if (client) {
      channels.forEach(ch => client.subscriptions.add(ch));
      console.log(`[WS] Client ${socket.id} subscribed to: ${channels.join(', ')}`);
    }
  });

  socket.on('unsubscribe', (channels: string[]) => {
    const client = clients.get(socket.id);
    if (client) {
      channels.forEach(ch => client.subscriptions.delete(ch));
    }
  });

  // Handle ping for latency measurement
  socket.on('ping', (timestamp: number) => {
    const client = clients.get(socket.id);
    if (client) {
      client.lastPing = Date.now();
      socket.emit('pong', { clientTime: timestamp, serverTime: Date.now() });
    }
  });

  // Handle price alert creation
  socket.on('create-alert', (data: {
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
  }) => {
    const client = clients.get(socket.id);
    if (client?.userId) {
      const alertId = `${client.userId}-${data.symbol}-${Date.now()}`;
      priceAlerts.set(alertId, {
        id: alertId,
        userId: client.userId,
        symbol: data.symbol,
        targetPrice: data.targetPrice,
        condition: data.condition,
        triggered: false,
        createdAt: new Date(),
      });
      socket.emit('alert-created', { id: alertId, ...data });
      console.log(`[WS] Alert created: ${alertId}`);
    }
  });

  // Handle price alert deletion
  socket.on('delete-alert', (alertId: string) => {
    priceAlerts.delete(alertId);
    socket.emit('alert-deleted', alertId);
  });

  // Handle trade updates from main app
  socket.on('trade-update', (data: any) => {
    // Broadcast to all subscribers of trade channel
    io.emit('trade-update', data);
  });

  // Handle position updates
  socket.on('position-update', (data: any) => {
    io.emit('position-update', data);
  });

  // Handle health status update
  socket.on('health-update', (data: any) => {
    healthStatus = { ...healthStatus, ...data };
    io.emit('health-status', healthStatus);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    clients.delete(socket.id);
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Simulate market data updates
setInterval(() => {
  // Update SPX price with small random changes
  const change = (Math.random() - 0.5) * 2;
  marketData.spx.price = Math.round((marketData.spx.price + change) * 100) / 100;
  marketData.spx.bid = marketData.spx.price - 0.5;
  marketData.spx.ask = marketData.spx.price + 0.5;
  marketData.spx.lastUpdate = new Date();

  // Update VIX
  const vixChange = (Math.random() - 0.5) * 0.2;
  marketData.vix.price = Math.round((marketData.vix.price + vixChange) * 100) / 100;
  marketData.vix.bid = marketData.vix.price - 0.1;
  marketData.vix.ask = marketData.vix.price + 0.1;
  marketData.vix.lastUpdate = new Date();

  // Broadcast to all clients subscribed to market data
  clients.forEach((client, socketId) => {
    if (client.subscriptions.has('market') || client.subscriptions.has('all')) {
      io.to(socketId).emit('market-data', marketData);
    }
  });

  // Check price alerts
  priceAlerts.forEach((alert, alertId) => {
    if (alert.triggered) return;

    const currentPrice = alert.symbol === 'SPX' ? marketData.spx.price : marketData.vix.price;
    let triggered = false;

    if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
      triggered = true;
    } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
      triggered = true;
    }

    if (triggered) {
      alert.triggered = true;
      
      // Find client and send alert
      clients.forEach((client, socketId) => {
        if (client.userId === alert.userId) {
          io.to(socketId).emit('price-alert', {
            ...alert,
            currentPrice,
            triggeredAt: new Date(),
          });
        }
      });

      console.log(`[WS] Alert triggered: ${alertId} at ${currentPrice}`);
    }
  });

}, 1000); // Every second

// Health check broadcast every 5 seconds
setInterval(() => {
  healthStatus.server.memory = process.memoryUsage().heapUsed;
  healthStatus.database.lastUpdate = new Date();

  io.emit('health-status', healthStatus);
}, 5000);

// Start server
httpServer.listen(PORT, () => {
  console.log(`[WS] Real-time service running on port ${PORT}`);
});
