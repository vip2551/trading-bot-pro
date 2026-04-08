"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/dialog";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  Eye,
  AlertTriangle,
  CheckCircle,
  Brain,
  Radio,
  Flame,
  Shield,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Bell,
  Settings,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

// Types
interface WhaleActivity {
  id: string;
  type: "WHALE" | "HEDGE_FUND" | "MARKET_MAKER" | "DARK_POOL" | "UNUSUAL_OPTIONS";
  symbol: string;
  direction: "BUY" | "SELL";
  size: number;
  price: number;
  timestamp: Date;
  confidence: number;
  estimatedValue: number;
  source: string;
  isFollowed: boolean;
}

interface SmartMoneySignal {
  id: string;
  symbol: string;
  signalType: "ENTRY" | "EXIT" | "ACCUMULATION" | "DISTRIBUTION";
  confidence: number;
  aiScore: number;
  whaleCount: number;
  totalVolume: number;
  timestamp: Date;
  reason: string;
  recommendedAction: "BUY" | "SELL" | "WAIT";
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface WhaleTrackerProps {
  onSignalDetected?: (signal: SmartMoneySignal) => void;
}

export function WhaleTracker({ onSignalDetected }: WhaleTrackerProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [isEnabled, setIsEnabled] = useState(false);
  const [activities, setActivities] = useState<WhaleActivity[]>([]);
  const [signals, setSignals] = useState<SmartMoneySignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Settings
  const [minWhaleSize, setMinWhaleSize] = useState(100000);
  const [symbols, setSymbols] = useState<string[]>(["SPX", "SPY", "QQQ", "TSLA", "NVDA"]);
  const [autoTrade, setAutoTrade] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [followWhales, setFollowWhales] = useState(true);
  const [alertOnly, setAlertOnly] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalWhales: 0,
    todayVolume: 0,
    buyPressure: 50,
    aiAccuracy: 87.5,
    signalsGenerated: 0,
    profitableSignals: 0,
  });

  // Fetch whale activity
  const fetchWhaleActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whales/activity");
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
        setSignals(data.signals);
        setStats(data.stats);
        setLastUpdate(new Date());

        // Notify on new signals
        data.signals.slice(0, 3).forEach((signal: SmartMoneySignal) => {
          if (signal.confidence >= confidenceThreshold && signal.urgency === "CRITICAL") {
            toast.success(isArabic ? `🐋 تنبيه الحيتان: ${signal.symbol} - ${signal.signalType}` : `🐋 Whale Alert: ${signal.symbol} - ${signal.signalType}`, {
              description: signal.reason,
            });
            onSignalDetected?.(signal);
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch whale activity:", error);
    } finally {
      setLoading(false);
    }
  }, [confidenceThreshold, onSignalDetected]);

  // Auto-refresh when enabled
  useEffect(() => {
    if (isEnabled) {
      fetchWhaleActivity();
      const interval = setInterval(fetchWhaleActivity, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isEnabled, fetchWhaleActivity]);

  // Toggle whale tracking
  const toggleTracking = () => {
    setIsEnabled(!isEnabled);
    if (!isEnabled) {
      toast.success(isArabic ? "🐋 تفعيل تتبع الحيتان" : "🐋 Whale Tracking Enabled", {
        description: isArabic ? "مراقبة تحركات الأموال الذكية في الوقت الفعلي" : "Monitoring smart money movements in real-time",
      });
    } else {
      toast.info(isArabic ? "تم إيقاف تتبع الحيتان" : "Whale Tracking Disabled");
    }
  };

  // Follow whale
  const followWhale = async (activityId: string) => {
    try {
      const res = await fetch(`/api/whales/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isArabic ? "متابعة حركة الحيتان" : "Following whale movement");
        fetchWhaleActivity();
      }
    } catch (error) {
      toast.error(isArabic ? "فشل في متابعة الحيتان" : "Failed to follow whale");
    }
  };

  // Execute signal
  const executeSignal = async (signal: SmartMoneySignal) => {
    try {
      const res = await fetch("/api/trades/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: signal.symbol,
          direction: signal.recommendedAction,
          source: "WHALE_TRACKER",
          signalId: signal.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isArabic ? `تم تنفيذ الصفقة: ${signal.recommendedAction} ${signal.symbol}` : `Trade executed: ${signal.recommendedAction} ${signal.symbol}`);
      }
    } catch (error) {
      toast.error(isArabic ? "فشل في تنفيذ الصفقة" : "Failed to execute trade");
    }
  };

  // Get type icon
  const getTypeIcon = (type: WhaleActivity["type"]) => {
    switch (type) {
      case "WHALE":
        return <Wallet className="h-4 w-4 text-blue-500" />;
      case "HEDGE_FUND":
        return <Building2 className="h-4 w-4 text-purple-500" />;
      case "MARKET_MAKER":
        return <Shield className="h-4 w-4 text-amber-500" />;
      case "DARK_POOL":
        return <Eye className="h-4 w-4 text-slate-500" />;
      case "UNUSUAL_OPTIONS":
        return <Flame className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency: SmartMoneySignal["urgency"]) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-500 border-red-500/50";
      case "HIGH":
        return "bg-orange-500/10 text-orange-500 border-orange-500/50";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/50";
      default:
        return "bg-green-500/10 text-green-500 border-green-500/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                {isArabic ? "متتبع الحيتان بالذكاء الاصطناعي" : "AI Whale Tracker"}
              </CardTitle>
              <CardDescription>
                {isArabic ? "تتبع تحركات الأموال الذكية والتداول مع الحيتان" : "Track smart money movements and trade with the whales"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {isEnabled && (
                <Badge className="bg-green-500/10 text-green-500 animate-pulse">
                  <Radio className="h-3 w-3 mr-1" /> {isArabic ? "مباشر" : "LIVE"}
                </Badge>
              )}
              <Button
                onClick={toggleTracking}
                className={isEnabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                {isEnabled ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" /> {isArabic ? "إيقاف التتبع" : "Stop Tracking"}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> {isArabic ? "بدء التتبع" : "Start Tracking"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Wallet className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{stats.totalWhales}</p>
              <p className="text-xs text-muted-foreground">{isArabic ? "الحيتان النشطة" : "Active Whales"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">${(stats.todayVolume / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">{isArabic ? "حجم اليوم" : "Today Volume"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <BarChart3 className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-2xl font-bold">{stats.buyPressure}%</p>
              <p className="text-xs text-muted-foreground">{isArabic ? "ضغط الشراء" : "Buy Pressure"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Target className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">{stats.aiAccuracy}%</p>
              <p className="text-xs text-muted-foreground">{isArabic ? "دقة الذكاء الاصطناعي" : "AI Accuracy"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Zap className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold">{stats.signalsGenerated}</p>
              <p className="text-xs text-muted-foreground">{isArabic ? "إشارات اليوم" : "Signals Today"}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{stats.profitableSignals}</p>
              <p className="text-xs text-muted-foreground">{isArabic ? "ربحية" : "Profitable"}</p>
            </div>
          </div>

          {/* Buy/Sell Pressure Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-500 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" /> {isArabic ? "الشراء" : "Buying"}
              </span>
              <span className="text-red-500 flex items-center gap-1">
                {isArabic ? "البيع" : "Selling"} <TrendingDown className="h-4 w-4" />
              </span>
            </div>
            <div className="h-3 rounded-full bg-red-500/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${stats.buyPressure}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Whale Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {isArabic ? "نشاط الحيتان المباشر" : "Live Whale Activity"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchWhaleActivity} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                {isArabic ? "تحديث" : "Refresh"}
              </Button>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  {isArabic ? "آخر:" : "Last:"} {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Wallet className="h-12 w-12 mb-2" />
                  <p>{isArabic ? "لم يتم اكتشاف نشاط الحيتان بعد" : "No whale activity detected yet"}</p>
                  <p className="text-xs">{isArabic ? "فعّل التتبع لبدء المراقبة" : "Enable tracking to start monitoring"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(activity.type)}
                          <span className="font-semibold">{activity.symbol}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {activity.direction === "BUY" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span className={activity.direction === "BUY" ? "text-green-500" : "text-red-500"}>
                            {activity.direction}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">{isArabic ? "الحجم" : "Size"}</p>
                          <p className="font-medium">{(activity.size / 1000).toFixed(0)}K {isArabic ? "سهم" : "shares"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">{isArabic ? "القيمة" : "Value"}</p>
                          <p className="font-medium">${(activity.estimatedValue / 1000000).toFixed(2)}M</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">{isArabic ? "الثقة" : "Confidence"}</p>
                          <div className="flex items-center gap-1">
                            <Progress value={activity.confidence} className="h-2 flex-1" />
                            <span className="text-xs">{activity.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                        <Button
                          size="sm"
                          variant={activity.isFollowed ? "default" : "outline"}
                          onClick={() => followWhale(activity.id)}
                          disabled={!isEnabled}
                        >
                          {activity.isFollowed ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" /> {isArabic ? "متابع" : "Following"}
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" /> {isArabic ? "متابعة" : "Follow"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* AI Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {isArabic ? "إشارات الأموال الذكية" : "AI Smart Money Signals"}
            </CardTitle>
            <CardDescription>
              {isArabic ? "إشارات تداول مولدة بالذكاء الاصطناعي بناءً على أنماط سلوك الحيتان" : "AI-generated trading signals based on whale behavior patterns"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {signals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Brain className="h-12 w-12 mb-2" />
                  <p>{isArabic ? "لم يتم توليد إشارات بعد" : "No signals generated yet"}</p>
                  <p className="text-xs">{isArabic ? "تظهر الإشارات عندما تقوم الحيتان بتحركات كبيرة" : "Signals appear when whales make significant moves"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signals.map((signal) => (
                    <div
                      key={signal.id}
                      className={`p-3 rounded-lg border ${getUrgencyColor(signal.urgency)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{signal.symbol}</span>
                          <Badge>{signal.signalType}</Badge>
                        </div>
                        <Badge variant="outline" className={getUrgencyColor(signal.urgency)}>
                          {signal.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{signal.reason}</p>
                      <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                        <div>
                          <p className="text-muted-foreground">{isArabic ? "نقاط AI" : "AI Score"}</p>
                          <p className="font-bold text-lg">{signal.aiScore}/100</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isArabic ? "الثقة" : "Confidence"}</p>
                          <p className="font-bold text-lg">{signal.confidence}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isArabic ? "الحيتان" : "Whales"}</p>
                          <p className="font-bold text-lg">{signal.whaleCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isArabic ? "الحجم" : "Volume"}</p>
                          <p className="font-bold text-lg">${(signal.totalVolume / 1000000).toFixed(1)}M</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          variant={signal.recommendedAction === "BUY" ? "default" : "destructive"}
                          onClick={() => executeSignal(signal)}
                          disabled={!isEnabled || !autoTrade}
                        >
                          {signal.recommendedAction === "BUY" ? (
                            <>
                              <TrendingUp className="h-4 w-4 mr-1" /> {isArabic ? "اشتر الآن" : "Buy Now"}
                            </>
                          ) : signal.recommendedAction === "SELL" ? (
                            <>
                              <TrendingDown className="h-4 w-4 mr-1" /> {isArabic ? "بع الآن" : "Sell Now"}
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-1" /> {isArabic ? "انتظر" : "Wait"}
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Bell className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isArabic ? "إعدادات تتبع الحيتان" : "Whale Tracking Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Min Whale Size */}
            <div className="space-y-2">
              <Label>{isArabic ? "الحد الأدنى لحجم الحيتان ($)" : "Minimum Whale Size ($}"}</Label>
              <Input
                type="number"
                value={minWhaleSize}
                onChange={(e) => setMinWhaleSize(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                {isArabic ? "تتبع الصفقات فوق هذه القيمة فقط" : "Only track trades above this value"}
              </p>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-2">
              <Label>{isArabic ? "عتبة ثقة الإشارة (%)" : "Signal Confidence Threshold (%)"}</Label>
              <Input
                type="number"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                {isArabic ? "تنبيه فقط للإشارات فوق هذه الثقة" : "Only alert on signals above this confidence"}
              </p>
            </div>

            {/* Tracked Symbols */}
            <div className="space-y-2">
              <Label>{isArabic ? "الرموز المتتبعة" : "Tracked Symbols"}</Label>
              <Input
                value={symbols.join(", ")}
                onChange={(e) => setSymbols(e.target.value.split(",").map((s) => s.trim()))}
              />
              <p className="text-xs text-muted-foreground">
                {isArabic ? "الرموز مفصولة بفواصل للتتبع" : "Comma-separated symbols to track"}
              </p>
            </div>

            {/* Auto Trade */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>{isArabic ? "التداول التلقائي للإشارات" : "Auto-Trade Signals"}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "تنفيذ الإشارات عالية الثقة تلقائياً" : "Automatically execute high-confidence signals"}
                  </p>
                </div>
                <Switch checked={autoTrade} onCheckedChange={setAutoTrade} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label>{isArabic ? "متابعة الحيتان" : "Follow Whales"}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "تتبع ومتابعة مراكز الحيتان" : "Track and follow whale positions"}
                  </p>
                </div>
                <Switch checked={followWhales} onCheckedChange={setFollowWhales} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hedge Fund Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            {isArabic ? "نشاط صناديق التحوط (تتبع 13F)" : "Hedge Fund Activity (13F Tracking)"}
          </CardTitle>
          <CardDescription>
            {isArabic ? "تتبع الممتلكات المؤسسية والتغييرات الأخيرة" : "Track institutional holdings and recent changes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Berkshire Hathaway", holdings: 45, change: "+2.3%", value: "$298B" },
              { name: "BlackRock", holdings: 890, change: "+1.1%", value: "$3.2T" },
              { name: "Citadel LLC", holdings: 1200, change: "+4.5%", value: "$62B" },
            ].map((fund) => (
              <div key={fund.name} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{fund.name}</span>
                  <Badge className="bg-green-500/10 text-green-500">{fund.change}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{isArabic ? "الممتلكات" : "Holdings"}</p>
                    <p className="font-medium">{fund.holdings}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{isArabic ? "الأصول المدارة" : "AUM"}</p>
                    <p className="font-medium">{fund.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
