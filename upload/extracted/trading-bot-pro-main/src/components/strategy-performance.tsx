"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  DollarSign,
  Percent,
  Trophy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface StrategyPerformance {
  id: string;
  name: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  avgHoldTime: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  trend: "up" | "down" | "neutral";
}

export function StrategyPerformance() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [strategies] = useState<StrategyPerformance[]>([
    {
      id: "1",
      name: "Support Bounce",
      trades: 45,
      wins: 32,
      losses: 13,
      winRate: 71.1,
      totalPnL: 4250,
      avgPnL: 94.4,
      avgHoldTime: 35,
      profitFactor: 2.8,
      sharpeRatio: 1.92,
      maxDrawdown: -8.5,
      bestTrade: 850,
      worstTrade: -320,
      trend: "up",
    },
    {
      id: "2",
      name: "VIX Divergence",
      trades: 38,
      wins: 26,
      losses: 12,
      winRate: 68.4,
      totalPnL: 3100,
      avgPnL: 81.6,
      avgHoldTime: 45,
      profitFactor: 2.3,
      sharpeRatio: 1.65,
      maxDrawdown: -6.2,
      bestTrade: 680,
      worstTrade: -280,
      trend: "up",
    },
    {
      id: "3",
      name: "Resistance Test",
      trades: 52,
      wins: 28,
      losses: 24,
      winRate: 53.8,
      totalPnL: 520,
      avgPnL: 10,
      avgHoldTime: 28,
      profitFactor: 1.15,
      sharpeRatio: 0.85,
      maxDrawdown: -12.4,
      bestTrade: 450,
      worstTrade: -380,
      trend: "neutral",
    },
    {
      id: "4",
      name: "Trend Following",
      trades: 28,
      wins: 14,
      losses: 14,
      winRate: 50.0,
      totalPnL: -180,
      avgPnL: -6.4,
      avgHoldTime: 55,
      profitFactor: 0.92,
      sharpeRatio: 0.45,
      maxDrawdown: -15.2,
      bestTrade: 520,
      worstTrade: -420,
      trend: "down",
    },
  ]);

  const sortedStrategies = [...strategies].sort((a, b) => b.totalPnL - a.totalPnL);
  const bestStrategy = sortedStrategies[0];
  const worstStrategy = sortedStrategies[sortedStrategies.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            {isArabic ? "أداء الاستراتيجيات" : "Strategy Performance"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic
              ? "تحليل أداء استراتيجيات التداول"
              : "Analyze your trading strategies performance"}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {isArabic ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Best & Worst */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Trophy className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "أفضل استراتيجية" : "Best Strategy"}
                </p>
                <p className="font-bold text-lg">{bestStrategy.name}</p>
                <p className="text-green-500 font-medium">
                  +${bestStrategy.totalPnL.toLocaleString()} ({bestStrategy.winRate}% win)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "أسوأ استراتيجية" : "Worst Strategy"}
                </p>
                <p className="font-bold text-lg">{worstStrategy.name}</p>
                <p className="text-red-500 font-medium">
                  ${worstStrategy.totalPnL.toLocaleString()} ({worstStrategy.winRate}% win)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {isArabic ? "جميع الاستراتيجيات" : "All Strategies"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {sortedStrategies.map((strategy, index) => (
                <div key={strategy.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{strategy.name}</p>
                        <div className="flex items-center gap-2">
                          {strategy.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : strategy.trend === "down" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <div className="h-4 w-4 border-t-2 border-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {strategy.trades} {isArabic ? "صفقة" : "trades"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xl font-bold ${
                          strategy.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {strategy.totalPnL >= 0 ? "+" : ""}$
                        {strategy.totalPnL.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {strategy.winRate.toFixed(1)}%{" "}
                        {isArabic ? "نسبة فوز" : "win rate"}
                      </p>
                    </div>
                  </div>

                  {/* Win/Loss Bar */}
                  <div className="flex gap-1 h-2 mb-3">
                    <div
                      className="bg-green-500 rounded-l"
                      style={{ width: `${strategy.winRate}%` }}
                    />
                    <div
                      className="bg-red-500 rounded-r"
                      style={{ width: `${100 - strategy.winRate}%` }}
                    />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? "عامل الربح" : "Profit Factor"}
                      </p>
                      <p
                        className={`font-medium ${
                          strategy.profitFactor >= 1.5
                            ? "text-green-500"
                            : strategy.profitFactor >= 1
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                      >
                        {strategy.profitFactor.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? "شارب" : "Sharpe"}
                      </p>
                      <p
                        className={`font-medium ${
                          strategy.sharpeRatio >= 1.5
                            ? "text-green-500"
                            : strategy.sharpeRatio >= 1
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                      >
                        {strategy.sharpeRatio.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? "تراجع" : "Drawdown"}
                      </p>
                      <p className="font-medium text-red-500">
                        {strategy.maxDrawdown}%
                      </p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? "متوسط P&L" : "Avg P&L"}
                      </p>
                      <p
                        className={`font-medium ${
                          strategy.avgPnL >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        ${strategy.avgPnL.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>
                        {strategy.wins} {isArabic ? "ربح" : "wins"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>
                        {strategy.losses} {isArabic ? "خسارة" : "losses"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>
                        {strategy.avgHoldTime}m{" "}
                        {isArabic ? "متوسط" : "avg hold"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            {isArabic ? "توصيات" : "Recommendations"}
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              📈{" "}
              {isArabic
                ? `استمر في استخدام "${bestStrategy.name}" - أداء ممتاز`
                : `Continue using "${bestStrategy.name}" - excellent performance`}
            </p>
            <p>
              ⚠️{" "}
              {isArabic
                ? `راجع "${worstStrategy.name}" - قد تحتاج لتعديل أو استبعاد`
                : `Review "${worstStrategy.name}" - may need adjustment or removal`}
            </p>
            <p>
              💡{" "}
              {isArabic
                ? "ركز على الاستراتيجيات بعامل ربح > 1.5"
                : "Focus on strategies with profit factor > 1.5"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
