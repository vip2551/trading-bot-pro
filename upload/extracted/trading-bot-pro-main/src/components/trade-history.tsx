"use client";

import { useState, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  DollarSign,
  BarChart3,
  X,
  Clock,
  Target,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Trade {
  id: string;
  symbol: string;
  instrumentType: string;
  direction: string;
  quantity: number;
  filledQuantity: number;
  entryPrice: number;
  exitPrice: number | null;
  strike: number | null;
  optionType: string | null;
  status: string;
  pnl: number | null;
  trailingStopEnabled: boolean;
  isBracketOrder: boolean;
  maxHoldingMinutes: number | null;
  openedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  signalSource?: string | null;
  spreadPercent?: number | null;
  volumeAtExecution?: number | null;
  slippage?: number | null;
}

interface TradeHistoryProps {
  trades: Trade[];
  onCloseTrade?: (id: string) => void;
}

export function TradeHistory({ trades, onCloseTrade }: TradeHistoryProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDirection, setFilterDirection] = useState<string>("ALL");
  const [filterSymbol, setFilterSymbol] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      if (filterStatus !== "ALL" && trade.status !== filterStatus) return false;
      if (filterDirection !== "ALL" && trade.direction !== filterDirection) return false;
      if (filterSymbol && !trade.symbol.toLowerCase().includes(filterSymbol.toLowerCase())) return false;
      if (filterDateFrom && new Date(trade.createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(trade.createdAt) > new Date(filterDateTo + "T23:59:59")) return false;
      return true;
    });
  }, [trades, filterStatus, filterDirection, filterSymbol, filterDateFrom, filterDateTo]);

  // Calculate stats
  const stats = useMemo(() => {
    const closed = filteredTrades.filter((t) => t.status === "CLOSED");
    const wins = closed.filter((t) => (t.pnl || 0) > 0);
    const losses = closed.filter((t) => (t.pnl || 0) < 0);
    const totalPnL = closed.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgWin = wins.length ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length : 0;
    const maxWin = wins.length ? Math.max(...wins.map((t) => t.pnl || 0)) : 0;
    const maxLoss = losses.length ? Math.min(...losses.map((t) => t.pnl || 0)) : 0;

    return {
      total: filteredTrades.length,
      open: filteredTrades.filter((t) => t.status === "OPEN").length,
      closed: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
      totalPnL,
      avgWin,
      avgLoss,
      maxWin,
      maxLoss,
      profitFactor: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0,
    };
  }, [filteredTrades]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Symbol",
      "Direction",
      "Strike",
      "Quantity",
      "Entry Price",
      "Exit Price",
      "P&L",
      "Status",
      "Signal Source",
      "Spread %",
      "Slippage %",
    ];

    const rows = filteredTrades.map((t) => [
      new Date(t.createdAt).toLocaleDateString(),
      t.symbol,
      t.direction,
      t.strike || "-",
      t.quantity,
      t.entryPrice.toFixed(2),
      t.exitPrice?.toFixed(2) || "-",
      t.pnl?.toFixed(2) || "-",
      t.status,
      t.signalSource || "-",
      t.spreadPercent?.toFixed(2) || "-",
      t.slippage?.toFixed(2) || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear filters
  const clearFilters = () => {
    setFilterStatus("ALL");
    setFilterDirection("ALL");
    setFilterSymbol("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const getDirectionIcon = (d: string) =>
    d === "CALL" || d === "BUY" ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-blue-500/10 text-blue-500">{isArabic ? "مفتوحة" : "Open"}</Badge>;
      case "CLOSED":
        return <Badge className="bg-gray-500/10 text-gray-500">{isArabic ? "مغلقة" : "Closed"}</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/10 text-yellow-500">{isArabic ? "قيد الانتظار" : "Pending"}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{isArabic ? "الإجمالي" : "Total"}</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{isArabic ? "مفتوحة" : "Open"}</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{isArabic ? "معدل الفوز" : "Win Rate"}</span>
            </div>
            <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{isArabic ? "إجمالي P&L" : "Total P&L"}</span>
            </div>
            <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
              ${stats.totalPnL.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">{isArabic ? "متوسط الفوز" : "Avg Win"}</span>
            </div>
            <p className="text-2xl font-bold text-green-500">${stats.avgWin.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">{isArabic ? "متوسط الخسارة" : "Avg Loss"}</span>
            </div>
            <p className="text-2xl font-bold text-red-500">${Math.abs(stats.avgLoss).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {isArabic ? "الفلاتر" : "Filters"}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? (isArabic ? "إخفاء" : "Hide") : (isArabic ? "إظهار" : "Show")} {isArabic ? "الفلاتر" : "Filters"}
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                {isArabic ? "تصدير CSV" : "Export CSV"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs">{isArabic ? "الحالة" : "Status"}</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{isArabic ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="OPEN">{isArabic ? "مفتوحة" : "Open"}</SelectItem>
                    <SelectItem value="CLOSED">{isArabic ? "مغلقة" : "Closed"}</SelectItem>
                    <SelectItem value="PENDING">{isArabic ? "قيد الانتظار" : "Pending"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isArabic ? "الاتجاه" : "Direction"}</Label>
                <Select value={filterDirection} onValueChange={setFilterDirection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{isArabic ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="CALL">Call</SelectItem>
                    <SelectItem value="PUT">Put</SelectItem>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isArabic ? "الرمز" : "Symbol"}</Label>
                <Input
                  placeholder={isArabic ? "SPX, AAPL..." : "SPX, AAPL..."}
                  value={filterSymbol}
                  onChange={(e) => setFilterSymbol(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">{isArabic ? "من تاريخ" : "From Date"}</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">{isArabic ? "إلى تاريخ" : "To Date"}</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                {isArabic ? "مسح الفلاتر" : "Clear Filters"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Trade Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{isArabic ? "الرمز" : "Symbol"}</TableHead>
                  <TableHead>{isArabic ? "الاتجاه" : "Direction"}</TableHead>
                  <TableHead>{isArabic ? "الاسترايك" : "Strike"}</TableHead>
                  <TableHead>{isArabic ? "الكمية" : "Qty"}</TableHead>
                  <TableHead>{isArabic ? "الدخول" : "Entry"}</TableHead>
                  <TableHead>{isArabic ? "الخروج" : "Exit"}</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>{isArabic ? "الفرق" : "Spread"}</TableHead>
                  <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isArabic ? "الإجراء" : "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      {isArabic ? "لا توجد صفقات" : "No trades found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="text-xs">
                        {new Date(trade.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-muted-foreground">
                          {new Date(trade.createdAt).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getDirectionIcon(trade.direction)}
                          <span>{trade.direction}</span>
                        </div>
                      </TableCell>
                      <TableCell>{trade.strike || "-"}</TableCell>
                      <TableCell>{trade.quantity}</TableCell>
                      <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "-"}</TableCell>
                      <TableCell>
                        <span className={trade.pnl && trade.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                          {trade.pnl ? `$${trade.pnl.toFixed(2)}` : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {trade.spreadPercent ? (
                          <span className={trade.spreadPercent > 5 ? "text-red-500" : "text-green-500"}>
                            {trade.spreadPercent.toFixed(1)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(trade.status)}</TableCell>
                      <TableCell>
                        {trade.status === "OPEN" && onCloseTrade && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onCloseTrade(trade.id)}
                          >
                            {isArabic ? "إغلاق" : "Close"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
