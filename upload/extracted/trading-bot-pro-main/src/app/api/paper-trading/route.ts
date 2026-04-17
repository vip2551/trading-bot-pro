import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get paper trading status and positions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get or create paper trading account
    let account = await db.paperTradingAccount.findUnique({
      where: { userId },
      include: {
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!account) {
      // Create default account
      account = await db.paperTradingAccount.create({
        data: {
          userId,
          balance: 100000,
          availableFunds: 100000,
          initialBalance: 100000
        },
        include: {
          trades: true
        }
      });
    }

    if (action === 'account') {
      const openTrades = account.trades.filter(t => t.status === 'OPEN');
      const closedTrades = account.trades.filter(t => t.status === 'CLOSED');
      
      // Calculate unrealized PnL from open trades
      const unrealizedPnL = openTrades.reduce((sum, t) => sum + t.pnl, 0);
      const equity = account.balance + unrealizedPnL;
      
      return NextResponse.json({
        balance: account.balance,
        availableFunds: account.availableFunds,
        equity,
        dailyPnL: account.dailyPnL,
        openPositions: openTrades.length,
        totalTrades: account.totalTrades,
        winningTrades: account.winningTrades,
        losingTrades: account.losingTrades,
        winRate: account.totalTrades > 0 
          ? (account.winningTrades / account.totalTrades) * 100 
          : 0,
        unrealizedPnL
      });
    }

    if (action === 'positions') {
      return NextResponse.json({
        open: account.trades.filter(t => t.status === 'OPEN'),
        history: account.trades.filter(t => t.status === 'CLOSED')
      });
    }

    if (action === 'stats') {
      const closedTrades = account.trades.filter(t => t.status === 'CLOSED');
      const wins = closedTrades.filter(t => t.pnl > 0);
      const losses = closedTrades.filter(t => t.pnl < 0);
      
      const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
      const avgWin = wins.length > 0 
        ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length 
        : 0;
      const avgLoss = losses.length > 0 
        ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) 
        : 0;
      
      // Calculate max drawdown
      let maxDrawdown = 0;
      let peak = account.initialBalance;
      let runningBalance = account.initialBalance;
      
      const sortedTrades = [...closedTrades].sort((a, b) => 
        new Date(a.closedAt || a.createdAt).getTime() - new Date(b.closedAt || b.createdAt).getTime()
      );
      
      for (const trade of sortedTrades) {
        runningBalance += trade.pnl;
        peak = Math.max(peak, runningBalance);
        const drawdown = peak > 0 ? ((peak - runningBalance) / peak) * 100 : 0;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }

      // Calculate average hold time
      const holdTimes = closedTrades
        .filter(t => t.closedAt)
        .map(t => {
          const closeTime = new Date(t.closedAt!);
          const openTime = new Date(t.openedAt);
          return (closeTime.getTime() - openTime.getTime()) / 60000; // minutes
        });
      
      const avgHoldTime = holdTimes.length > 0 
        ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length 
        : 0;

      return NextResponse.json({
        totalTrades: closedTrades.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
        winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
        totalPnL,
        avgWin,
        avgLoss,
        maxDrawdown,
        profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
        avgHoldTime,
        bestTrade: wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0,
        worstTrade: losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0
      });
    }

    if (action === 'config') {
      return NextResponse.json({
        leverage: account.leverage,
        commission: account.commission,
        slippage: account.slippage,
        maxPositionSize: account.maxPositionSize,
        maxDailyLoss: account.maxDailyLoss,
        riskPerTrade: account.riskPerTrade,
        initialBalance: account.initialBalance
      });
    }

    // Default: return all info
    return NextResponse.json({
      account: {
        balance: account.balance,
        availableFunds: account.availableFunds,
        dailyPnL: account.dailyPnL,
        openPositions: account.trades.filter(t => t.status === 'OPEN').length
      },
      positions: account.trades.filter(t => t.status === 'OPEN'),
      history: account.trades.filter(t => t.status === 'CLOSED')
    });
  } catch (error: any) {
    console.error('Paper trading GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Execute trading actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, ...params } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get or create account
    let account = await db.paperTradingAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      account = await db.paperTradingAccount.create({
        data: {
          userId,
          balance: 100000,
          availableFunds: 100000,
          initialBalance: 100000
        }
      });
    }

    if (action === 'open') {
      // Check daily loss limit
      const dailyLossPercent = (account.dailyPnL / account.initialBalance) * 100;
      if (dailyLossPercent < -account.maxDailyLoss) {
        return NextResponse.json({ 
          success: false, 
          error: 'Daily loss limit reached' 
        });
      }

      // Calculate entry price (simulate market price)
      const entryPrice = params.entryPrice || 100 + Math.random() * 10;
      
      // Calculate position cost with slippage
      const slippageMultiplier = 1 + (account.slippage / 100);
      const adjustedEntryPrice = entryPrice * slippageMultiplier;
      const positionCost = params.quantity * adjustedEntryPrice + 
                          (account.commission * params.quantity);
      
      // Check available funds
      if (positionCost > account.availableFunds) {
        return NextResponse.json({ 
          success: false, 
          error: 'Insufficient funds' 
        });
      }

      // Check position size limit
      const positionPercent = (positionCost / account.balance) * 100;
      if (positionPercent > account.maxPositionSize) {
        return NextResponse.json({ 
          success: false, 
          error: `Position size exceeds ${account.maxPositionSize}% limit` 
        });
      }

      // Create trade
      const trade = await db.paperTrade.create({
        data: {
          accountId: account.id,
          symbol: params.symbol || 'SPX',
          direction: params.direction || 'CALL',
          quantity: params.quantity,
          entryPrice: adjustedEntryPrice,
          currentPrice: adjustedEntryPrice,
          stopLoss: params.stopLoss || adjustedEntryPrice * 0.5,
          takeProfit: params.takeProfit || adjustedEntryPrice * 2,
          trailingStopPercent: params.trailingStopPercent || null,
          highestPrice: adjustedEntryPrice,
          lowestPrice: adjustedEntryPrice,
          expiresAt: params.maxHoldMinutes 
            ? new Date(Date.now() + params.maxHoldMinutes * 60000) 
            : null
        }
      });

      // Update available funds
      await db.paperTradingAccount.update({
        where: { userId },
        data: {
          availableFunds: account.availableFunds - positionCost
        }
      });

      return NextResponse.json({ success: true, trade });
    }

    if (action === 'close') {
      const trade = await db.paperTrade.findFirst({
        where: { 
          id: params.positionId,
          accountId: account.id,
          status: 'OPEN'
        }
      });

      if (!trade) {
        return NextResponse.json({ 
          success: false, 
          error: 'Position not found' 
        });
      }

      // Calculate exit price (simulate market price)
      const exitPrice = params.exitPrice || trade.currentPrice * (0.9 + Math.random() * 0.2);
      
      // Calculate P&L
      const multiplier = trade.direction === 'CALL' || trade.direction === 'BUY' ? 1 : -1;
      const pnl = (exitPrice - trade.entryPrice) * trade.quantity * multiplier;
      const commission = account.commission * trade.quantity;
      const netPnL = pnl - commission;
      const pnlPercent = (netPnL / (trade.entryPrice * trade.quantity)) * 100;

      // Update trade
      await db.paperTrade.update({
        where: { id: trade.id },
        data: {
          exitPrice,
          currentPrice: exitPrice,
          pnl: netPnL,
          pnlPercent,
          status: 'CLOSED',
          closeReason: params.reason || 'Manual',
          closedAt: new Date()
        }
      });

      // Update account
      const isWin = netPnL > 0;
      const positionValue = trade.quantity * exitPrice;
      
      await db.paperTradingAccount.update({
        where: { userId },
        data: {
          balance: account.balance + netPnL,
          availableFunds: account.availableFunds + positionValue + netPnL,
          dailyPnL: account.dailyPnL + netPnL,
          totalTrades: account.totalTrades + 1,
          winningTrades: account.winningTrades + (isWin ? 1 : 0),
          losingTrades: account.losingTrades + (!isWin ? 1 : 0)
        }
      });

      return NextResponse.json({ success: true, pnl: netPnL });
    }

    if (action === 'update_config') {
      await db.paperTradingAccount.update({
        where: { userId },
        data: {
          leverage: params.leverage || account.leverage,
          commission: params.commission || account.commission,
          slippage: params.slippage || account.slippage,
          maxPositionSize: params.maxPositionSize || account.maxPositionSize,
          maxDailyLoss: params.maxDailyLoss || account.maxDailyLoss,
          riskPerTrade: params.riskPerTrade || account.riskPerTrade
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'reset') {
      // Use provided initialBalance or keep existing
      const newInitialBalance = params.initialBalance || account.initialBalance;
      
      // Close all open trades
      await db.paperTrade.deleteMany({
        where: { 
          accountId: account.id
        }
      });

      // Reset account
      await db.paperTradingAccount.update({
        where: { userId },
        data: {
          balance: newInitialBalance,
          availableFunds: newInitialBalance,
          initialBalance: newInitialBalance,
          dailyPnL: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          lastResetAt: new Date()
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Account reset to initial balance',
        newBalance: newInitialBalance
      });
    }

    if (action === 'update_price') {
      // Update prices for open trades (for simulation)
      const openTrades = await db.paperTrade.findMany({
        where: { 
          accountId: account.id,
          status: 'OPEN'
        }
      });

      for (const trade of openTrades) {
        // Random price movement
        const priceChange = (Math.random() - 0.5) * 2;
        const newPrice = trade.currentPrice + priceChange;
        
        let shouldClose = false;
        let closeReason = '';

        // Check stop loss
        if (trade.stopLoss) {
          if (trade.direction === 'CALL' || trade.direction === 'BUY') {
            if (newPrice <= trade.stopLoss) {
              shouldClose = true;
              closeReason = 'Stop Loss';
            }
          } else {
            if (newPrice >= trade.stopLoss) {
              shouldClose = true;
              closeReason = 'Stop Loss';
            }
          }
        }

        // Check take profit
        if (trade.takeProfit && !shouldClose) {
          if (trade.direction === 'CALL' || trade.direction === 'BUY') {
            if (newPrice >= trade.takeProfit) {
              shouldClose = true;
              closeReason = 'Take Profit';
            }
          } else {
            if (newPrice <= trade.takeProfit) {
              shouldClose = true;
              closeReason = 'Take Profit';
            }
          }
        }

        // Check expiry
        if (trade.expiresAt && !shouldClose) {
          if (new Date() >= trade.expiresAt) {
            shouldClose = true;
            closeReason = 'Expired';
          }
        }

        if (shouldClose) {
          // Close the trade
          const multiplier = trade.direction === 'CALL' || trade.direction === 'BUY' ? 1 : -1;
          const pnl = (newPrice - trade.entryPrice) * trade.quantity * multiplier;
          const commission = account.commission * trade.quantity;
          const netPnL = pnl - commission;

          await db.paperTrade.update({
            where: { id: trade.id },
            data: {
              currentPrice: newPrice,
              exitPrice: newPrice,
              pnl: netPnL,
              status: 'CLOSED',
              closeReason,
              closedAt: new Date()
            }
          });

          // Update account
          const isWin = netPnL > 0;
          await db.paperTradingAccount.update({
            where: { userId },
            data: {
              balance: { increment: netPnL },
              dailyPnL: { increment: netPnL },
              totalTrades: { increment: 1 },
              winningTrades: { increment: isWin ? 1 : 0 },
              losingTrades: { increment: !isWin ? 1 : 0 }
            }
          });
        } else {
          // Just update price
          await db.paperTrade.update({
            where: { id: trade.id },
            data: {
              currentPrice: newPrice,
              highestPrice: Math.max(trade.highestPrice, newPrice),
              lowestPrice: Math.min(trade.lowestPrice, newPrice)
            }
          });
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Paper trading POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
