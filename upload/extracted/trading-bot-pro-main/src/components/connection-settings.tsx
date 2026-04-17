"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HardDrive,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  TestTube,
  Info,
  Link2,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

interface ConnectionSettingsProps {
  userId?: string;
}

export function ConnectionSettings({ userId = 'demo' }: ConnectionSettingsProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  // IB Connection State
  const [ibHost, setIbHost] = useState("127.0.0.1");
  const [ibPort, setIbPort] = useState("7497");
  const [ibClientId, setIbClientId] = useState("1");
  const [ibAccountType, setIbAccountType] = useState<"paper" | "live">("paper");
  const [ibConnected, setIbConnected] = useState(false);
  const [ibLoading, setIbLoading] = useState(false);
  const [ibAccount, setIbAccount] = useState<any>(null);

  // Paper Trading State
  const [initialBalance, setInitialBalance] = useState("100000");
  const [paperAccount, setPaperAccount] = useState<any>(null);
  const [paperConfig, setPaperConfig] = useState<any>(null);
  const [commission, setCommission] = useState("0.65");
  const [maxPositionSize, setMaxPositionSize] = useState("10");
  const [maxDailyLoss, setMaxDailyLoss] = useState("5");
  const [riskPerTrade, setRiskPerTrade] = useState("2");
  const [paperLoading, setPaperLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadIBStatus();
    loadPaperTradingStatus();
  }, [userId]);

  const loadIBStatus = async () => {
    try {
      const res = await fetch(`/api/ib?userId=${userId}`);
      const data = await res.json();

      if (data.status) {
        setIbHost(data.status.host || "127.0.0.1");
        setIbPort(data.status.port?.toString() || "7497");
        setIbClientId(data.status.clientId?.toString() || "1");
        setIbAccountType(data.status.accountType || "paper");
        setIbConnected(data.status.connected);
        setIbAccount(data.accountSummary);
      }
    } catch (error) {
      console.error("Error loading IB status:", error);
    }
  };

  const loadPaperTradingStatus = async () => {
    try {
      const accountRes = await fetch(`/api/paper-trading?action=account&userId=${userId}`);
      const accountData = await accountRes.json();
      setPaperAccount(accountData);

      const configRes = await fetch(`/api/paper-trading?action=config&userId=${userId}`);
      const configData = await configRes.json();
      setPaperConfig(configData);

      if (configData) {
        setCommission(configData.commission?.toString() || "0.65");
        setMaxPositionSize(configData.maxPositionSize?.toString() || "10");
        setMaxDailyLoss(configData.maxDailyLoss?.toString() || "5");
        setRiskPerTrade(configData.riskPerTrade?.toString() || "2");
        setInitialBalance(configData.initialBalance?.toString() || "100000");
      }
    } catch (error) {
      console.error("Error loading paper trading status:", error);
    }
  };

  const handleIBConnect = async () => {
    setIbLoading(true);
    try {
      const res = await fetch("/api/ib", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          userId,
          host: ibHost,
          port: parseInt(ibPort),
          clientId: parseInt(ibClientId),
          accountType: ibAccountType
        })
      });

      const data = await res.json();

      if (data.success) {
        setIbConnected(true);
        toast.success(isArabic ? "تم الاتصال بـ IB بنجاح" : "Connected to IB successfully");
        loadIBStatus();
      } else {
        toast.error(data.error || data.message || "Connection failed");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIbLoading(false);
    }
  };

  const handleIBDisconnect = async () => {
    setIbLoading(true);
    try {
      const res = await fetch("/api/ib", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disconnect",
          userId
        })
      });

      const data = await res.json();

      if (data.success) {
        setIbConnected(false);
        toast.success(isArabic ? "تم قطع الاتصال" : "Disconnected");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIbLoading(false);
    }
  };

  const handleSavePaperConfig = async () => {
    setPaperLoading(true);
    try {
      const res = await fetch("/api/paper-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_config",
          userId,
          commission: parseFloat(commission),
          maxPositionSize: parseFloat(maxPositionSize),
          maxDailyLoss: parseFloat(maxDailyLoss),
          riskPerTrade: parseFloat(riskPerTrade)
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(isArabic ? "تم حفظ الإعدادات" : "Settings saved");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPaperLoading(false);
    }
  };

  const handleResetPaperAccount = async () => {
    setPaperLoading(true);
    try {
      const res = await fetch("/api/paper-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          userId,
          initialBalance: parseFloat(initialBalance)
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(isArabic ? "تم إعادة تعيين الحساب" : "Account reset");
        loadPaperTradingStatus();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPaperLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Telegram Notice */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-500">
            <Info className="h-5 w-5" />
            <span className="font-medium">
              {isArabic ? "لإعدادات Telegram، اذهب إلى تبويب الإشعارات" : "For Telegram settings, go to the Notifications tab"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ib" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ib" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            {isArabic ? "Interactive Brokers" : "Interactive Brokers"}
          </TabsTrigger>
          <TabsTrigger value="paper" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            {isArabic ? "تداول تجريبي" : "Paper Trading"}
          </TabsTrigger>
        </TabsList>

        {/* IB Connection Tab */}
        <TabsContent value="ib" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Interactive Brokers {isArabic ? "اتصال" : "Connection"}
                  </CardTitle>
                  <CardDescription>
                    {isArabic 
                      ? "اتصل بـ TWS أو IB Gateway للتداول الحقيقي أو التجريبي"
                      : "Connect to TWS or IB Gateway for live or paper trading"}
                  </CardDescription>
                </div>
                <Badge variant={ibConnected ? "default" : "secondary"} className={ibConnected ? "bg-green-500" : ""}>
                  {ibConnected 
                    ? (isArabic ? "متصل" : "Connected")
                    : (isArabic ? "غير متصل" : "Disconnected")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setIbAccountType("paper")}>
                  <div className="flex items-center gap-2 mb-2">
                    <TestTube className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{isArabic ? "حساب تجريبي" : "Paper Account"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "منفذ: 7497" : "Port: 7497"}
                  </p>
                  {ibAccountType === "paper" && (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-2" />
                  )}
                </div>
                <div className="p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setIbAccountType("live")}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-red-500" />
                    <span className="font-medium">{isArabic ? "حساب حقيقي" : "Live Account"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "منفذ: 7496" : "Port: 7496"}
                  </p>
                  {ibAccountType === "live" && (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-2" />
                  )}
                </div>
              </div>

              {/* Connection Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{isArabic ? "المضيف" : "Host"}</Label>
                  <Input
                    value={ibHost}
                    onChange={(e) => setIbHost(e.target.value)}
                    placeholder="127.0.0.1"
                  />
                </div>
                <div>
                  <Label>{isArabic ? "المنفذ" : "Port"}</Label>
                  <Select value={ibPort} onValueChange={setIbPort}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7497">7497 (Paper)</SelectItem>
                      <SelectItem value="7496">7496 (Live)</SelectItem>
                      <SelectItem value="4002">4002 (Gateway Paper)</SelectItem>
                      <SelectItem value="4001">4001 (Gateway Live)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isArabic ? "Client ID" : "Client ID"}</Label>
                  <Input
                    value={ibClientId}
                    onChange={(e) => setIbClientId(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Warning for Live Account */}
              {ibAccountType === "live" && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">
                      {isArabic ? "تحذير: حساب حقيقي!" : "Warning: Live Account!"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isArabic 
                      ? "سيتم تنفيذ صفقات حقيقية بأموال حقيقية"
                      : "Real trades will be executed with real money"}
                  </p>
                </div>
              )}

              {/* Account Summary */}
              {ibAccount && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">{isArabic ? "معلومات الحساب" : "Account Summary"}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{isArabic ? "الرصيد" : "Balance"}</span>
                      <p className="font-medium">${ibAccount.totalCashValue?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{isArabic ? "الأموال المتاحة" : "Available"}</span>
                      <p className="font-medium">${ibAccount.availableFunds?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{isArabic ? "القوة الشرائية" : "Buying Power"}</span>
                      <p className="font-medium">${ibAccount.buyingPower?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">P&L</span>
                      <p className={`font-medium ${ibAccount.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                        ${ibAccount.unrealizedPnL?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!ibConnected ? (
                  <Button onClick={handleIBConnect} disabled={ibLoading}>
                    {ibLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    {isArabic ? "اتصال" : "Connect"}
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleIBDisconnect} disabled={ibLoading}>
                    <XCircle className="h-4 w-4 mr-2" />
                    {isArabic ? "قطع الاتصال" : "Disconnect"}
                  </Button>
                )}
              </div>

              {/* Setup Instructions */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <Info className="h-5 w-5" />
                  <span className="font-medium">{isArabic ? "تعليمات الإعداد" : "Setup Instructions"}</span>
                </div>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>{isArabic ? "افتح TWS أو IB Gateway" : "Open TWS or IB Gateway"}</li>
                  <li>{isArabic ? "اذهب إلى File → Global Configuration → API → Settings" : "Go to File → Global Configuration → API → Settings"}</li>
                  <li>{isArabic ? "فعّل 'Enable ActiveX and Socket Clients'" : "Enable 'Enable ActiveX and Socket Clients'"}</li>
                  <li>{isArabic ? "تأكد أن المنفذ صحيح (7497 Paper / 7496 Live)" : "Ensure port is correct (7497 Paper / 7496 Live)"}</li>
                  <li>{isArabic ? "اضغط 'اتصال' أعلاه" : "Click 'Connect' above"}</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paper Trading Tab */}
        <TabsContent value="paper" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    {isArabic ? "تداول تجريبي" : "Paper Trading"}
                  </CardTitle>
                  <CardDescription>
                    {isArabic 
                      ? "تداول محاكاة بدون أموال حقيقية"
                      : "Simulated trading without real money"}
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-blue-500">
                  {isArabic ? "نشط" : "Active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account Info */}
              {paperAccount && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">{isArabic ? "الرصيد" : "Balance"}</span>
                    <p className="text-2xl font-bold">${paperAccount.balance?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">{isArabic ? "المتاح" : "Available"}</span>
                    <p className="text-2xl font-bold">${paperAccount.availableFunds?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">{isArabic ? "P&L يومي" : "Daily P&L"}</span>
                    <p className={`text-2xl font-bold ${paperAccount.dailyPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ${paperAccount.dailyPnL?.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">{isArabic ? "الصفقات" : "Positions"}</span>
                    <p className="text-2xl font-bold">{paperAccount.openPositions}</p>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isArabic ? "الرصيد الأولي" : "Initial Balance"}</Label>
                  <Input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{isArabic ? "العمولة لكل عقد" : "Commission per Contract"}</Label>
                  <Input
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    step="0.01"
                  />
                </div>
              </div>

              {/* Risk Settings */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-3">{isArabic ? "إعدادات المخاطرة" : "Risk Settings"}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">{isArabic ? "حجم الصفقة الأقصى %" : "Max Position %"}</Label>
                    <Input 
                      value={maxPositionSize}
                      onChange={(e) => setMaxPositionSize(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isArabic ? "الخسارة اليومية القصوى %" : "Max Daily Loss %"}</Label>
                    <Input 
                      value={maxDailyLoss}
                      onChange={(e) => setMaxDailyLoss(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{isArabic ? "المخاطرة للصفقة %" : "Risk per Trade %"}</Label>
                    <Input 
                      value={riskPerTrade}
                      onChange={(e) => setRiskPerTrade(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleSavePaperConfig} disabled={paperLoading}>
                  {paperLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isArabic ? "حفظ الإعدادات" : "Save Settings"}
                </Button>
                <Button variant="outline" onClick={handleResetPaperAccount} disabled={paperLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isArabic ? "إعادة تعيين الحساب" : "Reset Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
