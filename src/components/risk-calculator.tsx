"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  DollarSign,
  Percent,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Shield,
  Zap,
  BarChart3,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function RiskCalculator() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  // Inputs
  const [accountBalance, setAccountBalance] = useState(50000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [entryPrice, setEntryPrice] = useState(350);
  const [stopLoss, setStopLoss] = useState(300);
  const [targetProfit, setTargetProfit] = useState(450);
  const [direction, setDirection] = useState<"CALL" | "PUT">("CALL");

  // Calculate risk metrics
  const calculations = useCallback(() => {
    const maxRisk = (accountBalance * riskPercent) / 100;
    const riskPerContract = Math.abs(entryPrice - stopLoss);
    const maxContracts = riskPerContract > 0 ? Math.floor(maxRisk / riskPerContract) : 0;
    const rewardPerContract = Math.abs(targetProfit - entryPrice);
    const riskRewardRatio = riskPerContract > 0 ? (rewardPerContract / riskPerContract).toFixed(2) : "0";
    const potentialProfit = maxContracts * rewardPerContract;
    const potentialLoss = maxContracts * riskPerContract;
    const breakEven = direction === "CALL"
      ? entryPrice + (riskPerContract * 0.1)
      : entryPrice - (riskPerContract * 0.1);

    return {
      maxRisk,
      riskPerContract,
      maxContracts,
      rewardPerContract,
      riskRewardRatio,
      potentialProfit,
      potentialLoss,
      breakEven,
    };
  }, [accountBalance, riskPercent, entryPrice, stopLoss, targetProfit, direction]);

  const results = calculations();

  const getRiskLevel = (riskPercent: number) => {
    if (riskPercent <= 1) return { level: isArabic ? "منخفض" : "Low", color: "text-green-500", bg: "bg-green-500" };
    if (riskPercent <= 2) return { level: isArabic ? "معتدل" : "Moderate", color: "text-amber-500", bg: "bg-amber-500" };
    if (riskPercent <= 3) return { level: isArabic ? "عالي" : "High", color: "text-orange-500", bg: "bg-orange-500" };
    return { level: isArabic ? "عالي جداً" : "Very High", color: "text-red-500", bg: "bg-red-500" };
  };

  const riskLevel = getRiskLevel(riskPercent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            {isArabic ? "حاسبة المخاطر" : "Risk Calculator"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic ? "احسب المخاطر قبل الدخول في صفقة" : "Calculate risk before entering a trade"}
          </p>
        </div>
        <Badge className={`${riskLevel.bg} text-white`}>
          {isArabic ? `مخاطر ${riskLevel.level}` : `${riskLevel.level} Risk`}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {isArabic ? "إعدادات الصفقة" : "Trade Setup"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Balance */}
            <div className="space-y-2">
              <Label>{isArabic ? "رصيد الحساب" : "Account Balance"}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Number(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Risk Percentage */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{isArabic ? "نسبة المخاطرة" : "Risk Percentage"}</Label>
                <span className="text-sm font-medium">{riskPercent}%</span>
              </div>
              <Slider
                value={[riskPercent]}
                onValueChange={([v]) => setRiskPercent(v)}
                min={0.5}
                max={5}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5% {isArabic ? "(محمي)" : "(Conservative)"}</span>
                <span>5% {isArabic ? "(مخاطرة عالية)" : "(Aggressive)"}</span>
              </div>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <Label>{isArabic ? "اتجاه الصفقة" : "Trade Direction"}</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as "CALL" | "PUT")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      CALL (Bullish)
                    </div>
                  </SelectItem>
                  <SelectItem value="PUT">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      PUT (Bearish)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entry Price */}
            <div className="space-y-2">
              <Label>{isArabic ? "سعر الدخول" : "Entry Price"}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Stop Loss */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{isArabic ? "وقف الخسارة" : "Stop Loss"}</Label>
                <span className="text-sm text-red-500">
                  -${Math.abs(entryPrice - stopLoss).toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Target Profit */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>{isArabic ? "هدف الربح" : "Target Profit"}</Label>
                <span className="text-sm text-green-500">
                  +${Math.abs(targetProfit - entryPrice).toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(Number(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {/* Main Metrics */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "الحد الأقصى للعقود الموصى بها" : "Maximum Recommended Contracts"}
                </p>
                <p className="text-5xl font-bold text-primary my-2">
                  {results.maxContracts}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "عقد" : "contracts"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "أقصى مخاطرة" : "Max Risk"}
                  </p>
                  <p className="text-xl font-bold text-red-500">
                    ${results.maxRisk.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "ربح محتمل" : "Potential Profit"}
                  </p>
                  <p className="text-xl font-bold text-green-500">
                    ${results.potentialProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk/Reward Ratio */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "نسبة المخاطرة/العائد" : "Risk/Reward Ratio"}
                  </p>
                  <p className="text-2xl font-bold">
                    1:{results.riskRewardRatio}
                  </p>
                </div>
                {Number(results.riskRewardRatio) >= 2 ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">{isArabic ? "ممتاز" : "Excellent"}</span>
                  </div>
                ) : Number(results.riskRewardRatio) >= 1.5 ? (
                  <div className="flex items-center gap-2 text-amber-500">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm">{isArabic ? "جيد" : "Good"}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm">{isArabic ? "ضعيف" : "Poor"}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {isArabic ? "تفاصيل الحساب" : "Calculation Details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isArabic ? "المخاطرة لكل عقد" : "Risk per Contract"}
                  </span>
                  <span className="font-medium">${results.riskPerContract.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isArabic ? "العائد لكل عقد" : "Reward per Contract"}
                  </span>
                  <span className="font-medium text-green-500">
                    ${results.rewardPerContract.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isArabic ? "نقطة التعادل" : "Break Even Price"}
                  </span>
                  <span className="font-medium">${results.breakEven.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {isArabic ? "التكلفة الإجمالية" : "Total Cost"}
                  </span>
                  <span className="font-medium">
                    ${(results.maxContracts * entryPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Warnings */}
          {riskPercent > 2 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-500">
                      {isArabic ? "تحذير: مخاطرة عالية" : "Warning: High Risk"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isArabic
                        ? `أنت تخاطر بـ ${riskPercent}% من رصيدك. يُنصح بعدم تجاوز 2%.`
                        : `You're risking ${riskPercent}% of your account. Recommended max is 2%.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {isArabic ? "نصائح إدارة المخاطر" : "Risk Management Tips"}
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• {isArabic ? "لا تخاطر بأكثر من 2% في صفقة واحدة" : "Never risk more than 2% per trade"}</li>
                    <li>• {isArabic ? "هدف نسبة مخاطرة/عائد 1:2 على الأقل" : "Aim for at least 1:2 risk/reward"}</li>
                    <li>• {isArabic ? "استخدم وقف الخسارة دائماً" : "Always use stop loss"}</li>
                    <li>• {isArabic ? "قلل الحجم بعد الخسائر المتتالية" : "Reduce size after consecutive losses"}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
