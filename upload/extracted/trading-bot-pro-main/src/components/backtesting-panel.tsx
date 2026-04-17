"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

interface Backtest {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  status: string;
  progress: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number | null;
  profitFactor: number | null;
  createdAt: string;
}

interface BacktestingProps {
  userId: string;
}

export function BacktestingPanel({ userId }: BacktestingProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedBacktest, setSelectedBacktest] = useState<Backtest | null>(null);
  
  const [newBacktest, setNewBacktest] = useState({
    name: "",
    symbol: "SPX",
    timeframe: "5m",
    startDate: "",
    endDate: "",
  });

  const fetchBacktests = async () => {
    try {
      const res = await fetch(`/api/backtest?userId=${userId}`);
      const data = await res.json();
      setBacktests(data.backtests || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/backtest?userId=${userId}`);
        const data = await res.json();
        setBacktests(data.backtests || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [userId]);

  const createBacktest = async () => {
    if (!newBacktest.name || !newBacktest.startDate || !newBacktest.endDate) {
      toast.error(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...newBacktest,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isArabic ? "بدأ الاختبار!" : "Backtest started!");
        setShowNewDialog(false);
        setNewBacktest({ name: "", symbol: "SPX", timeframe: "5m", startDate: "", endDate: "" });
        fetchBacktests();
      } else {
        toast.error(data.error || (isArabic ? "فشل بدء الاختبار" : "Failed to start backtest"));
      }
    } catch (e) {
      toast.error(isArabic ? "فشل بدء الاختبار" : "Failed to start backtest");
    }
  };

  const deleteBacktest = async (id: string) => {
    try {
      await fetch(`/api/backtest?id=${id}`, { method: "DELETE" });
      toast.success(isArabic ? "تم الحذف!" : "Deleted!");
      fetchBacktests();
    } catch (e) {
      toast.error(isArabic ? "فشل الحذف" : "Failed to delete");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" />{isArabic ? "مكتمل" : "Completed"}</Badge>;
      case "RUNNING":
        return <Badge className="bg-blue-500/10 text-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />{isArabic ? "قيد التشغيل" : "Running"}</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500/10 text-red-500"><AlertCircle className="h-3 w-3 mr-1" />{isArabic ? "فشل" : "Failed"}</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-500">{isArabic ? "في الانتظار" : "Pending"}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{isArabic ? "الاختبار الخلفي" : "Backtesting"}</h2>
          <p className="text-muted-foreground">{isArabic ? "اختبر الاستراتيجيات على البيانات التاريخية" : "Test strategies on historical data"}</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Play className="h-4 w-4 mr-2" /> {isArabic ? "اختبار جديد" : "New Backtest"}
        </Button>
      </div>

      {/* Backtests List */}
      {backtests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{isArabic ? "لا توجد اختبارات بعد. أنشئ اختباراتك الأولى!" : "No backtests yet. Create your first backtest!"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {backtests.map((bt) => (
            <Card
              key={bt.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedBacktest(bt)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{bt.name}</CardTitle>
                  {getStatusBadge(bt.status)}
                </div>
                <CardDescription>
                  {bt.symbol} • {bt.timeframe}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bt.status === "RUNNING" && (
                  <div className="mb-4">
                    <Progress value={bt.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{isArabic ? `${bt.progress}% مكتمل` : `${bt.progress}% complete`}</p>
                  </div>
                )}
                {bt.status === "COMPLETED" && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-500">{bt.winRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">{isArabic ? "معدل الفوز" : "Win Rate"}</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${bt.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                        ${bt.totalPnL.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">{isArabic ? "إجمالي الربح/الخسارة" : "Total P&L"}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{bt.totalTrades}</p>
                      <p className="text-xs text-muted-foreground">{isArabic ? "الصفقات" : "Trades"}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>{new Date(bt.createdAt).toLocaleDateString()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBacktest(bt.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Backtest Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "إنشاء اختبار جديد" : "Create New Backtest"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isArabic ? "اسم الاستراتيجية" : "Strategy Name"}</Label>
              <Input
                placeholder={isArabic ? "مثال: SPX Momentum" : "e.g., SPX Momentum"}
                value={newBacktest.name}
                onChange={(e) => setNewBacktest({ ...newBacktest, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isArabic ? "الرمز" : "Symbol"}</Label>
                <Select value={newBacktest.symbol} onValueChange={(v) => setNewBacktest({ ...newBacktest, symbol: v })}>
                  <SelectTrigger />
                  <SelectContent>
                    <SelectItem value="SPX">SPX</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="AAPL">AAPL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isArabic ? "الإطار الزمني" : "Timeframe"}</Label>
                <Select value={newBacktest.timeframe} onValueChange={(v) => setNewBacktest({ ...newBacktest, timeframe: v })}>
                  <SelectTrigger />
                  <SelectContent>
                    <SelectItem value="1m">{isArabic ? "دقيقة واحدة" : "1 Minute"}</SelectItem>
                    <SelectItem value="5m">{isArabic ? "5 دقائق" : "5 Minutes"}</SelectItem>
                    <SelectItem value="15m">{isArabic ? "15 دقيقة" : "15 Minutes"}</SelectItem>
                    <SelectItem value="1h">{isArabic ? "ساعة واحدة" : "1 Hour"}</SelectItem>
                    <SelectItem value="4h">{isArabic ? "4 ساعات" : "4 Hours"}</SelectItem>
                    <SelectItem value="1d">{isArabic ? "يوم واحد" : "1 Day"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isArabic ? "تاريخ البداية" : "Start Date"}</Label>
                <Input
                  type="date"
                  value={newBacktest.startDate}
                  onChange={(e) => setNewBacktest({ ...newBacktest, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>{isArabic ? "تاريخ النهاية" : "End Date"}</Label>
                <Input
                  type="date"
                  value={newBacktest.endDate}
                  onChange={(e) => setNewBacktest({ ...newBacktest, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>{isArabic ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={createBacktest}>{isArabic ? "بدء الاختبار" : "Start Backtest"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backtest Results Dialog */}
      <Dialog open={!!selectedBacktest} onOpenChange={() => setSelectedBacktest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBacktest?.name}</DialogTitle>
          </DialogHeader>
          {selectedBacktest && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{selectedBacktest.totalTrades}</p>
                  <p className="text-xs text-muted-foreground">{isArabic ? "إجمالي الصفقات" : "Total Trades"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-green-500">{selectedBacktest.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{isArabic ? "معدل الفوز" : "Win Rate"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className={`text-2xl font-bold ${selectedBacktest.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                    ${selectedBacktest.totalPnL.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{isArabic ? "إجمالي الربح/الخسارة" : "Total P&L"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-red-500">{selectedBacktest.maxDrawdown.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">{isArabic ? "أقصى خسارة" : "Max DD"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{isArabic ? "الرابحة / الخاسرة" : "Wins / Losses"}</p>
                  <p className="text-xl font-bold">{selectedBacktest.winCount} / {selectedBacktest.lossCount}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{isArabic ? "معامل شارب" : "Sharpe Ratio"}</p>
                  <p className="text-xl font-bold">{selectedBacktest.sharpeRatio?.toFixed(2) || (isArabic ? "غير متوفر" : "N/A")}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{isArabic ? "معامل الربح" : "Profit Factor"}</p>
                  <p className="text-xl font-bold">{selectedBacktest.profitFactor?.toFixed(2) || (isArabic ? "غير متوفر" : "N/A")}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{isArabic ? "الرمز" : "Symbol"}</p>
                  <p className="text-xl font-bold">{selectedBacktest.symbol}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
