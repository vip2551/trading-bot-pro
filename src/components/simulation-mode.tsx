"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FlaskConical,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Settings,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface SimulationSettings {
  enabled: boolean;
  initialBalance: number;
  currentBalance: number;
  spreadSimulation: number; // 0-100% of real spread
  slippageSimulation: number; // 0-5%
  latencySimulation: number; // 0-2000ms
  volatilityMultiplier: number; // 0.5-2.0x
  fillRate: number; // 0-100%
  marketHoursOnly: boolean;
  randomEvents: boolean;
}

interface SimulatedPosition {
  id: string;
  symbol: string;
  direction: 'CALL' | 'PUT';
  strike: number;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  delta: number;
  theta: number;
  vega: number;
  openTime: Date;
}

export function SimulationMode() {
  const { t, language } = useLanguage();
  const isArabic = language === "ar";

  const [settings, setSettings] = useState<SimulationSettings>({
    enabled: false,
    initialBalance: 50000,
    currentBalance: 50000,
    spreadSimulation: 100,
    slippageSimulation: 0.5,
    latencySimulation: 100,
    volatilityMultiplier: 1.0,
    fillRate: 95,
    marketHoursOnly: true,
    randomEvents: false,
  });

  const [positions, setPositions] = useState<SimulatedPosition[]>([
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
      openTime: new Date(Date.now() - 3600000),
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
      openTime: new Date(Date.now() - 7200000),
    },
  ]);

  const [showSettings, setShowSettings] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const toggleSimulation = useCallback(() => {
    if (!settings.enabled) {
      toast.success(isArabic ? "تم تفعيل وضع المحاكاة" : "Simulation mode enabled");
    } else {
      toast.info(isArabic ? "تم إيقاف وضع المحاكاة" : "Simulation mode disabled");
    }
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, [settings.enabled, isArabic]);

  const resetSimulation = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      currentBalance: prev.initialBalance,
    }));
    setPositions([]);
    toast.success(isArabic ? "تم إعادة تعيين المحاكاة" : "Simulation reset");
  }, [isArabic]);

  const updatePrices = useCallback(() => {
    setSimulating(true);
    setTimeout(() => {
      setPositions(prev =>
        prev.map(pos => {
          const priceChange = (Math.random() - 0.48) * pos.entryPrice * 0.02 * settings.volatilityMultiplier;
          const newPrice = Math.max(0.01, pos.currentPrice + priceChange);
          const pnl = pos.direction === 'CALL'
            ? (newPrice - pos.entryPrice) * pos.quantity
            : (pos.entryPrice - newPrice) * pos.quantity;
          const pnlPercent = (pnl / (pos.entryPrice * pos.quantity)) * 100;
          return {
            ...pos,
            currentPrice: newPrice,
            pnl,
            pnlPercent,
          };
        })
      );
      setSimulating(false);
    }, settings.latencySimulation);
  }, [settings.volatilityMultiplier, settings.latencySimulation]);

  const closePosition = useCallback((id: string) => {
    const position = positions.find(p => p.id === id);
    if (position) {
      const newBalance = settings.currentBalance + position.pnl;
      setSettings(prev => ({ ...prev, currentBalance: newBalance }));
      setPositions(prev => prev.filter(p => p.id !== id));
      toast.success(
        isArabic
          ? `تم إغلاق الصفقة: ${position.pnl >= 0 ? '+' : ''}$${position.pnl.toFixed(2)}`
          : `Position closed: ${position.pnl >= 0 ? '+' : ''}$${position.pnl.toFixed(2)}`
      );
    }
  }, [positions, settings.currentBalance, isArabic]);

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalDelta = positions.reduce((sum, p) => sum + p.delta * p.quantity, 0);
  const totalTheta = positions.reduce((sum, p) => sum + p.theta, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-purple-500" />
            {isArabic ? "وضع المحاكاة" : "Simulation Mode"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic
              ? "اختبر البوت بدون اتصال حقيقي"
              : "Test the bot without real connection"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>{isArabic ? "المحاكاة" : "Simulation"}</Label>
            <Switch
              checked={settings.enabled}
              onCheckedChange={toggleSimulation}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            {isArabic ? "إعدادات" : "Settings"}
          </Button>
        </div>
      </div>

      {/* Simulation Status Banner */}
      {settings.enabled && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-purple-500 animate-pulse" />
                <div>
                  <p className="font-medium text-purple-500">
                    {isArabic ? "🧪 وضع المحاكاة نشط" : "🧪 Simulation Mode Active"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic
                      ? "جميع الصفقات وهمية - لا توجد مخاطر مالية حقيقية"
                      : "All trades are simulated - no real financial risk"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetSimulation}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isArabic ? "إعادة تعيين" : "Reset"}
                </Button>
                <Button variant="outline" size="sm" onClick={updatePrices} disabled={simulating}>
                  <Activity className={`h-4 w-4 mr-2 ${simulating ? 'animate-pulse' : ''}`} />
                  {isArabic ? "تحديث الأسعار" : "Update Prices"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline">{isArabic ? "محاكاة" : "Sim"}</Badge>
            </div>
            <p className="text-2xl font-bold">
              ${settings.currentBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "رصيد المحفظة" : "Portfolio Balance"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              {totalPnL >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={totalPnL >= 0 ? "default" : "destructive"}>
                {totalPnL >= 0 ? "+" : ""}{((totalPnL / settings.initialBalance) * 100).toFixed(1)}%
              </Badge>
            </div>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "الربح/الخسارة" : "Total P&L"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{positions.length}</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "مراكز مفتوحة" : "Open Positions"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Delta</span>
            </div>
            <p className={`text-2xl font-bold ${totalDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalDelta.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "دلتا صافية" : "Net Delta"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Open Positions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {isArabic ? "المراكز المفتوحة" : "Open Positions"}
            </CardTitle>
            <Badge variant="outline">
              {positions.length} {isArabic ? "صفقة" : "trades"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{isArabic ? "لا توجد مراكز مفتوحة" : "No open positions"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        position.direction === "CALL"
                          ? "bg-green-500/10"
                          : "bg-red-500/10"
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
                        <p className="font-medium">{position.symbol}</p>
                        <Badge variant="outline" className="text-xs">
                          {position.direction}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? "استرايك" : "Strike"}: {position.strike} •{" "}
                        {isArabic ? "الكمية" : "Qty"}: {position.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "الدلتا" : "Delta"}
                    </p>
                    <p className="font-medium">{position.delta.toFixed(2)}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "الثيتا" : "Theta"}
                    </p>
                    <p className="font-medium text-red-500">
                      ${position.theta.toFixed(0)}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "الدخول" : "Entry"}
                    </p>
                    <p className="font-medium">${position.entryPrice.toFixed(2)}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "الحالي" : "Current"}
                    </p>
                    <p className="font-medium">${position.currentPrice.toFixed(2)}</p>
                  </div>

                  <div className="text-center">
                    <p
                      className={`text-xl font-bold ${
                        position.pnl >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(2)}
                    </p>
                    <p
                      className={`text-xs ${
                        position.pnlPercent >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {position.pnlPercent >= 0 ? "+" : ""}
                      {position.pnlPercent.toFixed(1)}%
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => closePosition(position.id)}
                  >
                    {isArabic ? "إغلاق" : "Close"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Greeks Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Delta (Δ)</p>
            <p className={`text-xl font-bold ${totalDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalDelta.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "التعرض الاتجاهي" : "Directional exposure"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Gamma (Γ)</p>
            <p className="text-xl font-bold text-blue-500">0.08</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "حساسية الدلتا" : "Delta sensitivity"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Theta (Θ)</p>
            <p className="text-xl font-bold text-red-500">${totalTheta.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "التآكل اليومي" : "Daily decay"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Vega (ν)</p>
            <p className="text-xl font-bold text-amber-500">$145</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "حساسية التقلب" : "Vol sensitivity"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {isArabic ? "إعدادات المحاكاة" : "Simulation Settings"}
            </DialogTitle>
            <DialogDescription>
              {isArabic
                ? "تخصيص معلمات المحاكاة"
                : "Customize simulation parameters"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Initial Balance */}
            <div className="space-y-2">
              <Label>{isArabic ? "الرصيد الأولي" : "Initial Balance"}</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={settings.initialBalance}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      initialBalance: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            {/* Spread Simulation */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{isArabic ? "محاكاة السبريد" : "Spread Simulation"}</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.spreadSimulation}%
                </span>
              </div>
              <Slider
                value={[settings.spreadSimulation]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, spreadSimulation: value }))
                }
                max={200}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? "نسبة السبريد من الواقع"
                  : "Percentage of real spread"}
              </p>
            </div>

            {/* Slippage Simulation */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{isArabic ? "محاكاة الانزلاق" : "Slippage Simulation"}</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.slippageSimulation}%
                </span>
              </div>
              <Slider
                value={[settings.slippageSimulation]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, slippageSimulation: value }))
                }
                max={5}
                step={0.1}
              />
            </div>

            {/* Latency Simulation */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{isArabic ? "محاكاة التأخير" : "Latency Simulation"}</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.latencySimulation}ms
                </span>
              </div>
              <Slider
                value={[settings.latencySimulation]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, latencySimulation: value }))
                }
                max={2000}
                step={50}
              />
            </div>

            {/* Volatility Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{isArabic ? "مضاعف التقلب" : "Volatility Multiplier"}</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.volatilityMultiplier}x
                </span>
              </div>
              <Slider
                value={[settings.volatilityMultiplier * 10]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({
                    ...prev,
                    volatilityMultiplier: value / 10,
                  }))
                }
                min={5}
                max={30}
                step={1}
              />
            </div>

            {/* Fill Rate */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{isArabic ? "نسبة التنفيذ" : "Fill Rate"}</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.fillRate}%
                </span>
              </div>
              <Slider
                value={[settings.fillRate]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, fillRate: value }))
                }
                min={50}
                max={100}
                step={1}
              />
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{isArabic ? "ساعات السوق فقط" : "Market Hours Only"}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isArabic
                      ? "تنفيذ الصفقات فقط أثناء ساعات التداول"
                      : "Only execute trades during market hours"}
                  </p>
                </div>
                <Switch
                  checked={settings.marketHoursOnly}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      marketHoursOnly: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{isArabic ? "أحداث عشوائية" : "Random Events"}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isArabic
                      ? "محاكاة أحداث مفاجئة (أخبار، تقلبات)"
                      : "Simulate sudden events (news, volatility)"}
                  </p>
                </div>
                <Switch
                  checked={settings.randomEvents}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      randomEvents: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={() => setShowSettings(false)}>
              {isArabic ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
