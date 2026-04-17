"use client";

import { useState, useEffect, useCallback } from "react";
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  RefreshCw,
  X,
  Activity,
  BarChart3,
  Percent,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface LivePosition {
  id: string;
  symbol: string;
  direction: "CALL" | "PUT";
  strike: number;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  delta: number;
  theta: number;
  vega: number;
  gamma: number;
  iv: number;
  dte: number;
  stopLoss: number;
  takeProfit: number;
  trailingStop: number;
  maxProfit: number;
  maxLoss: number;
  openTime: Date;
  duration: number; // minutes
  status: "winning" | "losing" | "neutral";
}

export function LivePositionTracking() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [positions, setPositions] = useState<LivePosition[]>([
    {
      id: "1",
      symbol: "SPX",
      direction: "CALL",
      strike: 5830,
      quantity: 5,
      entryPrice: 350,
      currentPrice: 385,
      pnl: 175,
      pnlPercent: 10,
      delta: 0.45,
      theta: -25,
      vega: 80,
      gamma: 0.08,
      iv: 18.5,
      dte: 0,
      stopLoss: 280,
      takeProfit: 450,
      trailingStop: 340,
      maxProfit: 500,
      maxLoss: -350,
      openTime: new Date(Date.now() - 45 * 60000),
      duration: 45,
      status: "winning",
    },
    {
      id: "2",
      symbol: "SPX",
      direction: "PUT",
      strike: 5820,
      quantity: 3,
      entryPrice: 320,
      currentPrice: 290,
      pnl: 90,
      pnlPercent: 9.4,
      delta: -0.35,
      theta: -18,
      vega: 65,
      gamma: 0.06,
      iv: 17.2,
      dte: 0,
      stopLoss: 380,
      takeProfit: 200,
      trailingStop: 340,
      maxProfit: 360,
      maxLoss: -180,
      openTime: new Date(Date.now() - 90 * 60000),
      duration: 90,
      status: "winning",
    },
    {
      id: "3",
      symbol: "SPX",
      direction: "CALL",
      strike: 5840,
      quantity: 2,
      entryPrice: 280,
      currentPrice: 250,
      pnl: -60,
      pnlPercent: -10.7,
      delta: 0.38,
      theta: -15,
      vega: 55,
      gamma: 0.05,
      iv: 16.8,
      dte: 0,
      stopLoss: 200,
      takeProfit: 380,
      trailingStop: 260,
      maxProfit: 200,
      maxLoss: -160,
      openTime: new Date(Date.now() - 30 * 60000),
      duration: 30,
      status: "losing",
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => {
          const priceChange = (Math.random() - 0.48) * pos.entryPrice * 0.01;
          const newPrice = Math.max(0.01, pos.currentPrice + priceChange);
          const pnl =
            pos.direction === "CALL"
              ? (newPrice - pos.entryPrice) * pos.quantity
              : (pos.entryPrice - newPrice) * pos.quantity;
          const pnlPercent =
            (pnl / (pos.entryPrice * pos.quantity)) * 100;

          return {
            ...pos,
            currentPrice: newPrice,
            pnl,
            pnlPercent,
            status:
              pnl > 50 ? "winning" : pnl < -50 ? "losing" : "neutral",
            duration: pos.duration + 0.25,
          };
        })
      );
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const refreshPrices = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setPositions((prev) =>
        prev.map((pos) => {
          const priceChange = (Math.random() - 0.5) * pos.entryPrice * 0.03;
          const newPrice = Math.max(0.01, pos.currentPrice + priceChange);
          const pnl =
            pos.direction === "CALL"
              ? (newPrice - pos.entryPrice) * pos.quantity
              : (pos.entryPrice - newPrice) * pos.quantity;
          const pnlPercent =
            (pnl / (pos.entryPrice * pos.quantity)) * 100;

          return {
            ...pos,
            currentPrice: newPrice,
            pnl,
            pnlPercent,
            status:
              pnl > 50 ? "winning" : pnl < -50 ? "losing" : "neutral",
          };
        })
      );
      setRefreshing(false);
      toast.success(isArabic ? "تم تحديث الأسعار" : "Prices updated");
    }, 500);
  }, [isArabic]);

  const closePosition = useCallback(
    (id: string) => {
      const position = positions.find((p) => p.id === id);
      if (position) {
        setPositions((prev) => prev.filter((p) => p.id !== id));
        toast.success(
          isArabic
            ? `تم إغلاق الصفقة: ${position.pnl >= 0 ? "+" : ""}$${position.pnl.toFixed(2)}`
            : `Position closed: ${position.pnl >= 0 ? "+" : ""}$${position.pnl.toFixed(2)}`
        );
      }
    },
    [positions, isArabic]
  );

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalDelta = positions.reduce((sum, p) => sum + p.delta * p.quantity, 0);
  const totalTheta = positions.reduce((sum, p) => sum + p.theta, 0);
  const totalVega = positions.reduce((sum, p) => sum + p.vega, 0);

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary animate-pulse" />
            {isArabic ? "تتبع المراكز المباشر" : "Live Position Tracking"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic
              ? "مراقبة لحظية للصفقات المفتوحة"
              : "Real-time monitoring of open positions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${
              totalPnL >= 0
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
          </Badge>
          <Button variant="outline" onClick={refreshPrices} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "المراكز المفتوحة" : "Open Positions"}
              </span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{positions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "صافي P&L" : "Net P&L"}
              </span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p
              className={`text-2xl font-bold ${
                totalPnL >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "دلتا صافية" : "Net Delta"}
              </span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p
              className={`text-2xl font-bold ${
                totalDelta >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {totalDelta.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "تآكل يومي" : "Daily Decay"}
              </span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">
              -${Math.abs(totalTheta).toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Positions List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {isArabic ? "المراكز" : "Positions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {positions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{isArabic ? "لا توجد مراكز مفتوحة" : "No open positions"}</p>
              </div>
            ) : (
              <div className="divide-y">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className={`p-4 ${
                      position.status === "winning"
                        ? "bg-green-500/5"
                        : position.status === "losing"
                        ? "bg-red-500/5"
                        : ""
                    }`}
                  >
                    {/* Position Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            position.direction === "CALL"
                              ? "bg-green-500/20"
                              : "bg-red-500/20"
                          }`}
                        >
                          {position.direction === "CALL" ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{position.symbol}</p>
                            <Badge variant="outline">{position.direction}</Badge>
                            <Badge
                              variant="outline"
                              className={
                                position.pnl >= 0
                                  ? "border-green-500 text-green-500"
                                  : "border-red-500 text-red-500"
                              }
                            >
                              {position.pnl >= 0
                                ? isArabic
                                  ? "رابح"
                                  : "Winning"
                                : isArabic
                                ? "خاسر"
                                : "Losing"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {isArabic ? "استرايك" : "Strike"}: {position.strike} •{" "}
                            {isArabic ? "الكمية" : "Qty"}: {position.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            position.pnl >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(2)}
                        </p>
                        <p
                          className={`text-sm ${
                            position.pnlPercent >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {position.pnlPercent >= 0 ? "+" : ""}
                          {position.pnlPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* P&L Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>
                          {isArabic ? "وقف الخسارة" : "Stop Loss"}: -$
                          {position.maxLoss}
                        </span>
                        <span>
                          {isArabic ? "الهدف" : "Target"}: +$
                          {position.maxProfit}
                        </span>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`absolute h-full transition-all duration-300 ${
                            position.pnlPercent >= 0 ? "bg-green-500" : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, 50 + position.pnlPercent * 2)
                            )}%`,
                          }}
                        />
                        {/* Entry marker */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-background" />
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="grid grid-cols-4 gap-4 mb-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? "الدخول" : "Entry"}
                        </p>
                        <p className="font-medium">${position.entryPrice}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? "الحالي" : "Current"}
                        </p>
                        <p className="font-medium">${position.currentPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? "وقف متحرك" : "Trail Stop"}
                        </p>
                        <p className="font-medium">${position.trailingStop}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? "المدة" : "Duration"}
                        </p>
                        <p className="font-medium">
                          {formatDuration(position.duration)}
                        </p>
                      </div>
                    </div>

                    {/* Greeks */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Δ</p>
                        <p className="font-medium text-sm">{position.delta.toFixed(2)}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Γ</p>
                        <p className="font-medium text-sm">{position.gamma.toFixed(3)}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Θ</p>
                        <p className="font-medium text-sm text-red-500">
                          ${position.theta}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">ν</p>
                        <p className="font-medium text-sm">${position.vega}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">IV</p>
                        <p className="font-medium text-sm">{position.iv}%</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        {isArabic ? "تعديل" : "Modify"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => closePosition(position.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {isArabic ? "إغلاق" : "Close"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Portfolio Greeks Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {isArabic ? "ملخص إغريق المحفظة" : "Portfolio Greeks Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Net Delta (Δ)</p>
              <p
                className={`text-xl font-bold ${
                  totalDelta >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {totalDelta.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.abs(totalDelta) < 5
                  ? isArabic
                    ? "محايد"
                    : "Neutral"
                  : totalDelta > 0
                  ? isArabic
                    ? "صعودي"
                    : "Bullish"
                  : isArabic
                  ? "هبوطي"
                  : "Bearish"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Net Gamma (Γ)</p>
              <p className="text-xl font-bold text-blue-500">
                {positions
                  .reduce((s, p) => s + p.gamma * p.quantity, 0)
                  .toFixed(3)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "حساسية الدلتا" : "Delta Sensitivity"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Net Theta (Θ)</p>
              <p className="text-xl font-bold text-red-500">
                -${Math.abs(totalTheta).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "تآكل يومي" : "Daily Decay"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Net Vega (ν)</p>
              <p className="text-xl font-bold text-amber-500">
                ${totalVega.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "حساسية التقلب" : "Vol Sensitivity"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg IV</p>
              <p className="text-xl font-bold text-purple-500">
                {(
                  positions.reduce((s, p) => s + p.iv, 0) / positions.length
                ).toFixed(1)}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "متوسط التقلب" : "Avg Volatility"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
