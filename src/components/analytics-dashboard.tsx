"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  DollarSign,
  RefreshCw,
  Calendar,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

interface AnalyticsProps {
  userId: string;
}

export function AnalyticsDashboard({ userId }: AnalyticsProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const [data, setData] = useState<{
    summary: {
      totalTrades: number;
      closedTrades: number;
      wins: number;
      losses: number;
      winRate: number;
      totalPnL: number;
      avgPnL: number;
      maxDrawdown: number;
      signalsReceived: number;
    };
    dailyData: { date: string; trades: number; pnl: number }[];
    symbolStats: { symbol: string; count: number; pnl: number }[];
  } | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?userId=${userId}&range=${range}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
      toast.error(isArabic ? "فشل تحليل البيانات" : "Failed to load analytics");
    }
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?userId=${userId}&range=${range}`);
        const d = await res.json();
        setData(d);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [userId, range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const summary = data?.summary || {
    totalTrades: 0,
    closedTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPnL: 0,
    avgPnL: 0,
    maxDrawdown: 0,
    signalsReceived: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isArabic ? "التحليلات" : "Analytics"}</h2>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{isArabic ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
            <SelectItem value="30">{isArabic ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
            <SelectItem value="90">{isArabic ? "آخر 90 يوم" : "Last 90 days"}</SelectItem>
            <SelectItem value="365">{isArabic ? "السنة الماضية" : "Last year"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? "إجمالي الصفقات" : "Total Trades"}</p>
                <p className="text-3xl font-bold">{summary.totalTrades}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? "معدل الفوز" : "Win Rate"}</p>
                <p className="text-3xl font-bold">{summary.winRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? "إجمالي الربح/الخسارة" : "Total P&L"}</p>
                <p className={`text-3xl font-bold ${summary.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ${summary.totalPnL.toFixed(2)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${summary.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isArabic ? "أقصى خسارة" : "Max Drawdown"}</p>
                <p className="text-3xl font-bold text-red-500">-${Math.abs(summary.maxDrawdown).toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Win/Loss Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              {isArabic ? "توزيع الصفقات" : "Trade Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span>{isArabic ? "الرابحة" : "Wins"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{summary.wins}</span>
                  <Badge className="bg-green-500/10 text-green-500">
                    {summary.closedTrades ? ((summary.wins / summary.closedTrades) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span>{isArabic ? "الخاسرة" : "Losses"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{summary.losses}</span>
                  <Badge className="bg-red-500/10 text-red-500">
                    {summary.closedTrades ? ((summary.losses / summary.closedTrades) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${summary.closedTrades ? (summary.wins / summary.closedTrades) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${summary.closedTrades ? (summary.losses / summary.closedTrades) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {isArabic ? "الإشارات المستلمة" : "Signals Received"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-5xl font-bold">{summary.signalsReceived}</p>
              <p className="text-muted-foreground mt-2">{isArabic ? "إشارات TradingView في الفترة المحددة" : "TradingView signals in selected period"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Symbol Stats */}
      {data?.symbolStats && data.symbolStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? "الأداء حسب الرمز" : "Performance by Symbol"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.symbolStats.map((s) => (
                <div key={s.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{s.symbol}</span>
                    <Badge variant="outline">{isArabic ? `${s.count} صفقة` : `${s.count} trades`}</Badge>
                  </div>
                  <span className={`font-mono ${s.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    ${s.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
