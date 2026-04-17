"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Calendar,
  Trophy,
  AlertTriangle,
  Activity,
  PieChart,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  pnl: number | null;
  status: string;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

interface PerformanceReportProps {
  trades: Trade[];
  accountBalance?: number;
}

export function PerformanceReport({ trades, accountBalance }: PerformanceReportProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<"TODAY" | "WEEK" | "MONTH" | "YEAR" | "ALL">("MONTH");

  // Filter trades by period
  const filteredTrades = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(startOfDay.setDate(startOfDay.getDate() - startOfDay.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let startDate: Date;
    switch (period) {
      case "TODAY":
        startDate = startOfDay;
        break;
      case "WEEK":
        startDate = startOfWeek;
        break;
      case "MONTH":
        startDate = startOfMonth;
        break;
      case "YEAR":
        startDate = startOfYear;
        break;
      default:
        startDate = new Date(0);
    }

    return trades.filter((trade) => new Date(trade.createdAt) >= startDate);
  }, [trades, period]);

  // Calculate performance metrics
  const metrics = useMemo(() => {
    const closed = filteredTrades.filter((t) => t.status === "CLOSED");
    const wins = closed.filter((t) => (t.pnl || 0) > 0);
    const losses = closed.filter((t) => (t.pnl || 0) < 0);
    const breakeven = closed.filter((t) => (t.pnl || 0) === 0);

    const totalPnL = closed.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const largestWin = wins.length ? Math.max(...wins.map((t) => t.pnl || 0)) : 0;
    const largestLoss = losses.length ? Math.min(...losses.map((t) => t.pnl || 0)) : 0;

    // Calculate streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    const sortedClosed = [...closed].sort((a, b) =>
      new Date(a.closedAt || a.createdAt).getTime() - new Date(b.closedAt || b.createdAt).getTime()
    );

    sortedClosed.forEach((trade) => {
      const pnl = trade.pnl || 0;
      if (pnl > 0) {
        tempWinStreak++;
        tempLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, tempWinStreak);
        currentStreak = tempWinStreak;
      } else if (pnl < 0) {
        tempLossStreak++;
        tempWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, tempLossStreak);
        currentStreak = -tempLossStreak;
      }
    });

    // Daily breakdown
    const dailyPnL: { [date: string]: number } = {};
    closed.forEach((trade) => {
      const date = new Date(trade.closedAt || trade.createdAt).toLocaleDateString();
      dailyPnL[date] = (dailyPnL[date] || 0) + (trade.pnl || 0);
    });

    const sortedDays = Object.entries(dailyPnL).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    const bestDay = sortedDays.length ? sortedDays.reduce((best, day) => day[1] > best[1] ? day : best) : null;
    const worstDay = sortedDays.length ? sortedDays.reduce((worst, day) => day[1] < worst[1] ? day : worst) : null;

    // Profit factor
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Expectancy
    const winRate = closed.length ? wins.length / closed.length : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * Math.abs(avgLoss));

    // Return on account
    const returnPercent = accountBalance ? (totalPnL / accountBalance) * 100 : 0;

    return {
      totalTrades: filteredTrades.length,
      closedTrades: closed.length,
      openTrades: filteredTrades.filter((t) => t.status === "OPEN").length,
      wins: wins.length,
      losses: losses.length,
      breakeven: breakeven.length,
      winRate: winRate * 100,
      totalPnL,
      grossProfit,
      grossLoss,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      currentStreak,
      maxWinStreak,
      maxLossStreak,
      bestDay: bestDay ? { date: bestDay[0], pnl: bestDay[1] } : null,
      worstDay: worstDay ? { date: worstDay[0], pnl: worstDay[1] } : null,
      profitFactor,
      expectancy,
      returnPercent,
    };
  }, [filteredTrades, accountBalance]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {t('performanceSummary')}
        </h3>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAY">{t('dailyReport')}</SelectItem>
            <SelectItem value="WEEK">This Week</SelectItem>
            <SelectItem value="MONTH">{t('monthlyReport')}</SelectItem>
            <SelectItem value="YEAR">This Year</SelectItem>
            <SelectItem value="ALL">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('totalPnL')}</span>
            </div>
            <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${metrics.totalPnL.toFixed(2)}
            </p>
            {accountBalance && (
              <p className={`text-xs ${metrics.returnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.returnPercent >= 0 ? '+' : ''}{metrics.returnPercent.toFixed(2)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('winRate')}</span>
            </div>
            <p className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</p>
            <Progress value={metrics.winRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('totalTrades')}</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalTrades}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.openTrades} open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('profitFactor')}</span>
            </div>
            <p className="text-2xl font-bold">
              {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
            </p>
            <p className={`text-xs ${metrics.profitFactor >= 1.5 ? 'text-green-500' : metrics.profitFactor >= 1 ? 'text-amber-500' : 'text-red-500'}`}>
              {metrics.profitFactor >= 1.5 ? 'Excellent' : metrics.profitFactor >= 1 ? 'Good' : 'Needs Work'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wins/Losses Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-500">
              <TrendingUp className="h-4 w-4" />
              Winning Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-green-500">{metrics.wins}</p>
                <p className="text-xs text-muted-foreground">Count</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">${metrics.grossProfit.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Profit</p>
              </div>
              <div>
                <p className="text-lg font-semibold">${metrics.avgWin.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div>
                <p className="text-lg font-semibold">${metrics.largestWin.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Largest</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-500">
              <TrendingDown className="h-4 w-4" />
              Losing Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-red-500">{metrics.losses}</p>
                <p className="text-xs text-muted-foreground">Count</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">${metrics.grossLoss.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Loss</p>
              </div>
              <div>
                <p className="text-lg font-semibold">${Math.abs(metrics.avgLoss).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div>
                <p className="text-lg font-semibold">${Math.abs(metrics.largestLoss).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Largest</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streaks & Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Streaks & Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{t('currentStreak')}</p>
              <Badge className={metrics.currentStreak > 0 ? 'bg-green-500/10 text-green-500' : metrics.currentStreak < 0 ? 'bg-red-500/10 text-red-500' : ''}>
                {metrics.currentStreak > 0 ? `+${metrics.currentStreak} W` : metrics.currentStreak < 0 ? `${metrics.currentStreak} L` : '0'}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{t('winStreak')}</p>
              <p className="text-lg font-semibold text-green-500">{metrics.maxWinStreak}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{t('lossStreak')}</p>
              <p className="text-lg font-semibold text-red-500">{metrics.maxLossStreak}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Expectancy</p>
              <p className={`text-lg font-semibold ${metrics.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${metrics.expectancy.toFixed(2)}
              </p>
            </div>
          </div>

          {(metrics.bestDay || metrics.worstDay) && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{t('bestDay')}</p>
                {metrics.bestDay && (
                  <>
                    <p className="text-lg font-semibold text-green-500">${metrics.bestDay.pnl.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{metrics.bestDay.date}</p>
                  </>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{t('worstDay')}</p>
                {metrics.worstDay && (
                  <>
                    <p className="text-lg font-semibold text-red-500">${metrics.worstDay.pnl.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{metrics.worstDay.date}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
