"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Settings,
  Copy,
  Key,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string | null;
  type: string;
  strike: number | null;
  expiry: string | null;
  optionType: string | null;
  enabled: boolean;
  autoTrade: boolean;
  quantity: number;
  strategy: string;
  stopLossPercent: number | null;
  takeProfitPercent: number | null;
  lastPrice: number | null;
  notes: string | null;
  createdAt: string;
}

interface SignalLog {
  id: string;
  source: string;
  symbol: string;
  action: string;
  direction: string | null;
  price: number | null;
  quantity: number | null;
  status: string;
  executed: boolean;
  strategy: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface WebhookSecret {
  id: string;
  secret: string;
  name: string | null;
  active: boolean;
  lastUsedAt: string | null;
  useCount: number;
}

interface Props {
  lang: "en" | "ar";
}

export function WatchlistSignals({ lang }: Props) {
  const t = {
    watchlist: lang === "ar" ? "قائمة المراقبة" : "Watchlist",
    addSymbol: lang === "ar" ? "إضافة رمز" : "Add Symbol",
    symbol: lang === "ar" ? "الرمز" : "Symbol",
    type: lang === "ar" ? "النوع" : "Type",
    stock: lang === "ar" ? "سهم" : "Stock",
    option: lang === "ar" ? "خيار" : "Option",
    future: lang === "ar" ? "عقد مستقبلي" : "Future",
    index: lang === "ar" ? "مؤشر" : "Index",
    crypto: lang === "ar" ? "عملة رقمية" : "Crypto",
    autoTrade: lang === "ar" ? "تداول تلقائي" : "Auto Trade",
    enabled: lang === "ar" ? "مفعّل" : "Enabled",
    disabled: lang === "ar" ? "معطّل" : "Disabled",
    quantity: lang === "ar" ? "الكمية" : "Quantity",
    strategy: lang === "ar" ? "الاستراتيجية" : "Strategy",
    stopLoss: lang === "ar" ? "وقف الخسارة %" : "Stop Loss %",
    takeProfit: lang === "ar" ? "جني الأرباح %" : "Take Profit %",
    signals: lang === "ar" ? "سجل الإشارات" : "Signals Log",
    received: lang === "ar" ? "مستلم" : "Received",
    executed: lang === "ar" ? "منفذ" : "Executed",
    failed: lang === "ar" ? "فشل" : "Failed",
    webhookKeys: lang === "ar" ? "مفاتيح Webhook" : "Webhook Keys",
    createKey: lang === "ar" ? "إنشاء مفتاح" : "Create Key",
    copyKey: lang === "ar" ? "نسخ المفتاح" : "Copy Key",
    lastUsed: lang === "ar" ? "آخر استخدام" : "Last Used",
    uses: lang === "ar" ? "استخدامات" : "Uses",
    webhookUrl: lang === "ar" ? "رابط Webhook" : "Webhook URL",
    webhookDesc: lang === "ar" ? "استخدم هذا الرابط في TradingView" : "Use this URL in TradingView",
    add: lang === "ar" ? "إضافة" : "Add",
    delete: lang === "ar" ? "حذف" : "Delete",
    noItems: lang === "ar" ? "لا توجد عناصر" : "No items",
    noSignals: lang === "ar" ? "لا توجد إشارات" : "No signals",
    buy: lang === "ar" ? "شراء" : "BUY",
    sell: lang === "ar" ? "بيع" : "SELL",
    call: lang === "ar" ? "شراء" : "CALL",
    put: lang === "ar" ? "بيع" : "PUT",
    close: lang === "ar" ? "إغلاق" : "CLOSE",
    action: lang === "ar" ? "الإجراء" : "Action",
    price: lang === "ar" ? "السعر" : "Price",
    time: lang === "ar" ? "الوقت" : "Time",
    status: lang === "ar" ? "الحالة" : "Status",
  };

  // Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // New item form
  const [newSymbol, setNewSymbol] = useState("");
  const [newType, setNewType] = useState("STOCK");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newAutoTrade, setNewAutoTrade] = useState(false);
  const [newStrategy, setNewStrategy] = useState("MIXED");
  const [newStopLoss, setNewStopLoss] = useState("");
  const [newTakeProfit, setNewTakeProfit] = useState("");

  // Signals state
  const [signals, setSignals] = useState<SignalLog[]>([]);
  const [signalsStats, setSignalsStats] = useState({ total: 0, received: 0, executed: 0, failed: 0 });
  const [signalsLoading, setSignalsLoading] = useState(false);

  // Webhook secrets
  const [webhookSecrets, setWebhookSecrets] = useState<WebhookSecret[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // Fetch watchlist
  const fetchWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (data.success) {
        setWatchlist(data.data);
      }
    } catch {
      console.log("Failed to fetch watchlist");
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Fetch signals
  const fetchSignals = async () => {
    setSignalsLoading(true);
    try {
      const res = await fetch("/api/signals?limit=50");
      const data = await res.json();
      if (data.success) {
        setSignals(data.data);
        setSignalsStats(data.stats);
      }
    } catch {
      console.log("Failed to fetch signals");
    } finally {
      setSignalsLoading(false);
    }
  };

  // Fetch webhook secrets
  const fetchWebhookSecrets = async () => {
    try {
      const res = await fetch("/api/webhook-secrets");
      const data = await res.json();
      if (data.success) {
        setWebhookSecrets(data.data);
      }
    } catch {
      console.log("Failed to fetch webhook secrets");
    }
  };

  useEffect(() => {
    fetchWatchlist();
    fetchSignals();
    fetchWebhookSecrets();
  }, []);

  // Add to watchlist
  const addToWatchlist = async () => {
    if (!newSymbol) {
      toast.error(lang === "ar" ? "يرجى إدخال الرمز" : "Please enter symbol");
      return;
    }

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase(),
          type: newType,
          quantity: parseInt(newQuantity) || 1,
          autoTrade: newAutoTrade,
          strategy: newStrategy,
          stopLossPercent: newStopLoss ? parseFloat(newStopLoss) : null,
          takeProfitPercent: newTakeProfit ? parseFloat(newTakeProfit) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تمت الإضافة!" : "Added!");
        setNewSymbol("");
        setNewStopLoss("");
        setNewTakeProfit("");
        fetchWatchlist();
      } else {
        toast.error(data.error || (lang === "ar" ? "فشل الإضافة" : "Failed to add"));
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الاتصال" : "Connection failed");
    }
  };

  // Delete from watchlist
  const deleteFromWatchlist = async (id: string) => {
    try {
      const res = await fetch(`/api/watchlist?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(lang === "ar" ? "تم الحذف!" : "Deleted!");
        fetchWatchlist();
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الحذف" : "Failed to delete");
    }
  };

  // Toggle auto trade
  const toggleAutoTrade = async (id: string, autoTrade: boolean) => {
    try {
      await fetch("/api/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, autoTrade: !autoTrade }),
      });
      fetchWatchlist();
    } catch {
      console.log("Failed to update");
    }
  };

  // Create webhook secret
  const createWebhookSecret = async () => {
    try {
      const res = await fetch("/api/webhook-secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "My Webhook" }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.data.secret);
        setNewKeyName("");
        fetchWebhookSecrets();
        toast.success(lang === "ar" ? "تم إنشاء المفتاح!" : "Key created!");
      }
    } catch {
      toast.error(lang === "ar" ? "فشل الإنشاء" : "Failed to create");
    }
  };

  // Delete webhook secret
  const deleteWebhookSecret = async (id: string) => {
    try {
      await fetch(`/api/webhook-secrets?id=${id}`, { method: "DELETE" });
      fetchWebhookSecrets();
      toast.success(lang === "ar" ? "تم حذف المفتاح!" : "Key deleted!");
    } catch {
      toast.error(lang === "ar" ? "فشل الحذف" : "Failed to delete");
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(lang === "ar" ? "تم النسخ!" : "Copied!");
  };

  // Get action badge
  const getActionBadge = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (["BUY", "CALL", "LONG"].includes(actionUpper)) {
      return <Badge className="bg-green-500">{actionUpper}</Badge>;
    }
    if (["SELL", "PUT", "SHORT"].includes(actionUpper)) {
      return <Badge className="bg-red-500">{actionUpper}</Badge>;
    }
    return <Badge variant="outline">{actionUpper}</Badge>;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">{t.received}</Badge>;
      case "VALIDATED":
        return <Badge variant="outline" className="border-cyan-500 text-cyan-500">Validated</Badge>;
      case "EXECUTED":
        return <Badge className="bg-green-500">{t.executed}</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500">{t.failed}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Watchlist Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t.watchlist}
          </CardTitle>
          <CardDescription>
            {lang === "ar" ? "إضافة أسهم وعقود للمراقبة والتداول التلقائي" : "Add stocks and contracts to watch and auto-trade"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new item form */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t.symbol}</Label>
                <Input
                  placeholder="AAPL, TSLA..."
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t.type}</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK">{t.stock}</SelectItem>
                    <SelectItem value="OPTION">{t.option}</SelectItem>
                    <SelectItem value="FUTURE">{t.future}</SelectItem>
                    <SelectItem value="INDEX">{t.index}</SelectItem>
                    <SelectItem value="CRYPTO">{t.crypto}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t.quantity}</Label>
                <Input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t.strategy}</Label>
                <Select value={newStrategy} onValueChange={setNewStrategy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RSI">RSI</SelectItem>
                    <SelectItem value="MACD">MACD</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={newAutoTrade} onCheckedChange={setNewAutoTrade} />
                <Label className="text-sm">{t.autoTrade}</Label>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder={t.stopLoss}
                  value={newStopLoss}
                  onChange={(e) => setNewStopLoss(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder={t.takeProfit}
                  value={newTakeProfit}
                  onChange={(e) => setNewTakeProfit(e.target.value)}
                />
              </div>
              <Button onClick={addToWatchlist}>
                <Plus className="h-4 w-4 mr-1" />
                {t.add}
              </Button>
            </div>
          </div>

          {/* Watchlist items */}
          <ScrollArea className="h-64">
            {watchlistLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : watchlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mb-2" />
                <p>{t.noItems}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="font-bold text-lg">{item.symbol}</span>
                        <Badge variant="outline" className="ml-2">{item.type}</Badge>
                        {item.autoTrade && (
                          <Badge className="bg-green-500 ml-1">
                            <Zap className="h-3 w-3 mr-1" />
                            {t.autoTrade}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        QTY: {item.quantity}
                        {item.stopLossPercent && ` | SL: ${item.stopLossPercent}%`}
                        {item.takeProfitPercent && ` | TP: ${item.takeProfitPercent}%`}
                      </div>
                      <Switch
                        checked={item.autoTrade}
                        onCheckedChange={() => toggleAutoTrade(item.id, item.autoTrade)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFromWatchlist(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Webhook Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t.webhookKeys}
          </CardTitle>
          <CardDescription>
            {lang === "ar" ? "أنشئ مفاتيح للربط مع TradingView" : "Create keys to connect with TradingView"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Webhook URL */}
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Label className="text-sm font-semibold">{t.webhookUrl}</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/tradingview/webhook`}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/tradingview/webhook`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t.webhookDesc}</p>
          </div>

          {/* Create new key */}
          <div className="flex gap-2">
            <Input
              placeholder={lang === "ar" ? "اسم المفتاح (اختياري)" : "Key name (optional)"}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <Button onClick={createWebhookSecret}>
              <Plus className="h-4 w-4 mr-1" />
              {t.createKey}
            </Button>
          </div>

          {/* Show created key */}
          {createdKey && (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <Label className="text-sm font-semibold text-green-600">
                {lang === "ar" ? "المفتاح الجديد (احفظه الآن!):" : "New Key (save it now!):"}
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input readOnly value={createdKey} className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(createdKey)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Existing keys */}
          <ScrollArea className="h-32">
            {webhookSecrets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {lang === "ar" ? "لا توجد مفاتيح" : "No keys yet"}
              </p>
            ) : (
              <div className="space-y-2">
                {webhookSecrets.map((secret) => (
                  <div
                    key={secret.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/30"
                  >
                    <div>
                      <span className="font-mono text-sm">{secret.secret}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({secret.useCount} {t.uses})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={secret.active ? "default" : "secondary"}>
                        {secret.active ? t.enabled : t.disabled}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWebhookSecret(secret.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* TradingView example */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <Label className="text-sm font-semibold">
              {lang === "ar" ? "مثال لرسالة TradingView:" : "TradingView Message Example:"}
            </Label>
            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
{`{
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "quantity": 1,
  "secret": "YOUR_SECRET_KEY"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Signals Log Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t.signals}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">Total: {signalsStats.total}</Badge>
              <Badge className="bg-green-500">Executed: {signalsStats.executed}</Badge>
              <Badge className="bg-red-500">Failed: {signalsStats.failed}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            {signalsLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : signals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mb-2" />
                <p>{t.noSignals}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {signals.map((signal) => (
                  <div
                    key={signal.id}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{signal.symbol}</span>
                        {getActionBadge(signal.action)}
                        {getStatusBadge(signal.status)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(signal.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {signal.price && <span>Price: ${signal.price} </span>}
                      {signal.quantity && <span>Qty: {signal.quantity} </span>}
                      {signal.strategy && <span>Strategy: {signal.strategy}</span>}
                    </div>
                    {signal.errorMessage && (
                      <div className="mt-1 text-xs text-red-500">
                        Error: {signal.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
