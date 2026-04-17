"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  Star,
  Tag,
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Save,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface JournalEntry {
  id: string;
  tradeId: string;
  date: Date;
  symbol: string;
  direction: "CALL" | "PUT";
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  strategy: string;
  setup: string;
  entryNotes: string;
  exitNotes: string;
  lessons: string;
  emotions: "confident" | "nervous" | "fearful" | "greedy" | "calm";
  rating: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  mistakes: string[];
  positives: string[];
}

export function TradingJournal() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "1",
      tradeId: "trade-001",
      date: new Date(Date.now() - 86400000),
      symbol: "SPX",
      direction: "CALL",
      entryPrice: 350,
      exitPrice: 420,
      pnl: 350,
      strategy: "Support Bounce",
      setup: "0DTE CALL at support level 5820",
      entryNotes: "Strong support at 5820, RSI oversold, good risk/reward setup",
      exitNotes: "Hit target at 5840, perfect execution",
      lessons: "Patience paid off, waited for confirmation candle",
      emotions: "calm",
      rating: 5,
      tags: ["0DTE", "Support", "RSI"],
      mistakes: [],
      positives: ["Good entry", "Waited for confirmation", "Followed plan"],
    },
    {
      id: "2",
      tradeId: "trade-002",
      date: new Date(Date.now() - 172800000),
      symbol: "SPX",
      direction: "PUT",
      entryPrice: 300,
      exitPrice: 250,
      pnl: -250,
      strategy: "Resistance Test",
      setup: "0DTE PUT at resistance 5850",
      entryNotes: "Resistance at 5850, seemed like good entry",
      exitNotes: "Market broke through resistance, should have used tighter stop",
      lessons: "Don't fight strong momentum, use tighter stops on breakout days",
      emotions: "fearful",
      rating: 2,
      tags: ["0DTE", "Resistance", "Mistake"],
      mistakes: ["Ignored momentum", "Stop too wide", "Didn't wait for confirmation"],
      positives: [],
    },
    {
      id: "3",
      tradeId: "trade-003",
      date: new Date(Date.now() - 259200000),
      symbol: "SPX",
      direction: "CALL",
      entryPrice: 320,
      exitPrice: 380,
      pnl: 300,
      strategy: "VIX Divergence",
      setup: "VIX dropping while SPX consolidating",
      entryNotes: "VIX at 22 and dropping, SPX coiling for breakout",
      exitNotes: "Sold at 380 for nice profit, could have held longer but locked in gains",
      lessons: "Trust the VIX divergence setup, works well",
      emotions: "confident",
      rating: 4,
      tags: ["VIX", "Divergence", "Trend"],
      mistakes: [],
      positives: ["Good analysis", "Managed risk", "Locked profit"],
    },
  ]);

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<"all" | "good" | "bad">("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
    symbol: "SPX",
    direction: "CALL",
    strategy: "",
    setup: "",
    entryNotes: "",
    exitNotes: "",
    lessons: "",
    emotions: "calm",
    rating: 3,
    tags: [],
    mistakes: [],
    positives: [],
  });

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchQuery === "" ||
      entry.strategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.setup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.entryNotes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterRating === "all" ||
      (filterRating === "good" && entry.rating >= 4) ||
      (filterRating === "bad" && entry.rating <= 2);

    return matchesSearch && matchesFilter;
  });

  const getEmotionEmoji = (emotion: JournalEntry["emotions"]) => {
    switch (emotion) {
      case "confident":
        return "😎";
      case "nervous":
        return "😰";
      case "fearful":
        return "😨";
      case "greedy":
        return "🤑";
      case "calm":
        return "😌";
    }
  };

  const getEmotionLabel = (emotion: JournalEntry["emotions"]) => {
    const labels = {
      en: {
        confident: "Confident",
        nervous: "Nervous",
        fearful: "Fearful",
        greedy: "Greedy",
        calm: "Calm",
      },
      ar: {
        confident: "واثق",
        nervous: "متوتر",
        fearful: "خائف",
        greedy: "طماع",
        calm: "هادئ",
      },
    };
    return labels[isArabic ? "ar" : "en"][emotion];
  };

  const addEntry = () => {
    const entry: JournalEntry = {
      id: Date.now().toString(),
      tradeId: `trade-${Date.now()}`,
      date: new Date(),
      symbol: newEntry.symbol || "SPX",
      direction: newEntry.direction || "CALL",
      entryPrice: newEntry.entryPrice || 0,
      exitPrice: newEntry.exitPrice || 0,
      pnl: newEntry.pnl || 0,
      strategy: newEntry.strategy || "",
      setup: newEntry.setup || "",
      entryNotes: newEntry.entryNotes || "",
      exitNotes: newEntry.exitNotes || "",
      lessons: newEntry.lessons || "",
      emotions: newEntry.emotions || "calm",
      rating: newEntry.rating || 3,
      tags: newEntry.tags || [],
      mistakes: newEntry.mistakes || [],
      positives: newEntry.positives || [],
    };

    setEntries((prev) => [entry, ...prev]);
    setShowAddEntry(false);
    toast.success(isArabic ? "تم إضافة الإدخال" : "Entry added");
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelectedEntry(null);
    toast.success(isArabic ? "تم حذف الإدخال" : "Entry deleted");
  };

  const avgRating =
    entries.reduce((sum, e) => sum + e.rating, 0) / entries.length;
  const winCount = entries.filter((e) => e.pnl > 0).length;
  const lossCount = entries.filter((e) => e.pnl < 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {isArabic ? "مذكرة التداول" : "Trading Journal"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic
              ? "سجل تعلمك وحسّن أداءك"
              : "Record your learning and improve performance"}
          </p>
        </div>
        <Dialog open={showAddEntry} onOpenChange={setShowAddEntry}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "إدخال جديد" : "New Entry"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isArabic ? "إدخال جديد في المذكرة" : "New Journal Entry"}
              </DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "سجل تفاصيل صفقتك والدروس المستفادة"
                  : "Record your trade details and lessons learned"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? "الرمز" : "Symbol"}</Label>
                  <Input
                    value={newEntry.symbol}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, symbol: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{isArabic ? "الاتجاه" : "Direction"}</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newEntry.direction}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        direction: e.target.value as "CALL" | "PUT",
                      })
                    }
                  >
                    <option value="CALL">CALL</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{isArabic ? "سعر الدخول" : "Entry Price"}</Label>
                  <Input
                    type="number"
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        entryPrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{isArabic ? "سعر الخروج" : "Exit Price"}</Label>
                  <Input
                    type="number"
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        exitPrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{isArabic ? "P&L" : "P&L"}</Label>
                  <Input
                    type="number"
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, pnl: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>{isArabic ? "الاستراتيجية" : "Strategy"}</Label>
                <Input
                  placeholder={
                    isArabic ? "مثال: ارتداد الدعم" : "e.g., Support Bounce"
                  }
                  value={newEntry.strategy}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, strategy: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>{isArabic ? "الإعداد" : "Setup"}</Label>
                <Textarea
                  placeholder={
                    isArabic
                      ? "وصف الإعداد وظروف الدخول..."
                      : "Describe the setup and entry conditions..."
                  }
                  value={newEntry.setup}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, setup: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>{isArabic ? "ملاحظات الدخول" : "Entry Notes"}</Label>
                <Textarea
                  placeholder={
                    isArabic
                      ? "لماذا دخلت في هذه الصفقة؟"
                      : "Why did you enter this trade?"
                  }
                  value={newEntry.entryNotes}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, entryNotes: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>{isArabic ? "ملاحظات الخروج" : "Exit Notes"}</Label>
                <Textarea
                  placeholder={
                    isArabic
                      ? "لماذا خرجت من الصفقة؟"
                      : "Why did you exit this trade?"
                  }
                  value={newEntry.exitNotes}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, exitNotes: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>{isArabic ? "الدروس المستفادة" : "Lessons Learned"}</Label>
                <Textarea
                  placeholder={
                    isArabic
                      ? "ماذا تعلمت من هذه الصفقة؟"
                      : "What did you learn from this trade?"
                  }
                  value={newEntry.lessons}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, lessons: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? "الحالة النفسية" : "Emotions"}</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newEntry.emotions}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        emotions: e.target.value as JournalEntry["emotions"],
                      })
                    }
                  >
                    <option value="calm">😌 {isArabic ? "هادئ" : "Calm"}</option>
                    <option value="confident">
                      😎 {isArabic ? "واثق" : "Confident"}
                    </option>
                    <option value="nervous">
                      😰 {isArabic ? "متوتر" : "Nervous"}
                    </option>
                    <option value="fearful">
                      😨 {isArabic ? "خائف" : "Fearful"}
                    </option>
                    <option value="greedy">
                      🤑 {isArabic ? "طماع" : "Greedy"}
                    </option>
                  </select>
                </div>
                <div>
                  <Label>{isArabic ? "التقييم" : "Rating"}</Label>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewEntry({ ...newEntry, rating: star as 1|2|3|4|5 })}
                        className="text-2xl"
                      >
                        {star <= (newEntry.rating || 3) ? "⭐" : "☆"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddEntry(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={addEntry}>
                <Save className="h-4 w-4 mr-2" />
                {isArabic ? "حفظ" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "إجمالي الإدخالات" : "Total Entries"}
              </span>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "متوسط التقييم" : "Avg Rating"}
              </span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{avgRating.toFixed(1)} ⭐</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "صفقات رابحة" : "Winning Trades"}
              </span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">{winCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "صفقات خاسرة" : "Losing Trades"}
              </span>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{lossCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isArabic ? "بحث في المذكرة..." : "Search journal..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterRating === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRating("all")}
          >
            {isArabic ? "الكل" : "All"}
          </Button>
          <Button
            variant={filterRating === "good" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRating("good")}
          >
            ⭐ {isArabic ? "جيد" : "Good"}
          </Button>
          <Button
            variant={filterRating === "bad" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRating("bad")}
          >
            ⚠️ {isArabic ? "ضعيف" : "Bad"}
          </Button>
        </div>
      </div>

      {/* Entries List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>
                  {isArabic
                    ? "لا توجد إدخالات"
                    : "No journal entries"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            entry.pnl >= 0
                              ? "bg-green-500/10"
                              : "bg-red-500/10"
                          }`}
                        >
                          {entry.direction === "CALL" ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{entry.symbol}</p>
                            <Badge variant="outline">{entry.direction}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {getEmotionEmoji(entry.emotions)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-primary">
                            {entry.strategy}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {entry.setup}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-sm">
                              {i < entry.rating ? "⭐" : "☆"}
                            </span>
                          ))}
                        </div>
                        <p
                          className={`text-lg font-bold ${
                            entry.pnl >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {entry.pnl >= 0 ? "+" : ""}${entry.pnl.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Quick Lessons */}
                    {entry.lessons && (
                      <div className="mt-3 p-2 bg-amber-500/10 rounded text-xs">
                        <span className="text-amber-500 font-medium">
                          💡 {isArabic ? "الدرس" : "Lesson"}:
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {entry.lessons}
                        </span>
                      </div>
                    )}

                    {/* Mistakes & Positives */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {entry.mistakes.length > 0 && (
                        <div className="p-2 bg-red-500/10 rounded">
                          <p className="text-xs font-medium text-red-500 mb-1">
                            ❌ {isArabic ? "أخطاء" : "Mistakes"}
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {entry.mistakes.map((m, i) => (
                              <li key={i}>• {m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.positives.length > 0 && (
                        <div className="p-2 bg-green-500/10 rounded">
                          <p className="text-xs font-medium text-green-500 mb-1">
                            ✅ {isArabic ? "إيجابيات" : "Positives"}
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {entry.positives.map((p, i) => (
                              <li key={i}>• {p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Entry Detail Dialog */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEntry.symbol} {selectedEntry.direction}
                <Badge variant="outline">{selectedEntry.strategy}</Badge>
              </DialogTitle>
              <DialogDescription>
                {selectedEntry.date.toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-xl">
                      {i < selectedEntry.rating ? "⭐" : "☆"}
                    </span>
                  ))}
                </div>
                <p
                  className={`text-2xl font-bold ${
                    selectedEntry.pnl >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {selectedEntry.pnl >= 0 ? "+" : ""}${selectedEntry.pnl.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isArabic ? "سعر الدخول" : "Entry Price"}
                  </Label>
                  <p className="font-medium">${selectedEntry.entryPrice}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {isArabic ? "سعر الخروج" : "Exit Price"}
                  </Label>
                  <p className="font-medium">${selectedEntry.exitPrice}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  {isArabic ? "الإعداد" : "Setup"}
                </Label>
                <p className="mt-1">{selectedEntry.setup}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  {isArabic ? "ملاحظات الدخول" : "Entry Notes"}
                </Label>
                <p className="mt-1">{selectedEntry.entryNotes}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  {isArabic ? "ملاحظات الخروج" : "Exit Notes"}
                </Label>
                <p className="mt-1">{selectedEntry.exitNotes}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  {isArabic ? "الدروس المستفادة" : "Lessons Learned"}
                </Label>
                <div className="mt-1 p-3 bg-amber-500/10 rounded">
                  {selectedEntry.lessons}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => deleteEntry(selectedEntry.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isArabic ? "حذف" : "Delete"}
              </Button>
              <Button onClick={() => setSelectedEntry(null)}>
                {isArabic ? "إغلاق" : "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
