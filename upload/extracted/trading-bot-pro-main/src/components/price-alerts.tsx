"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Bell,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface PriceAlert {
  id: string;
  symbol: string;
  targetType: string;
  targetValue: number;
  condition: string;
  active: boolean;
  triggered: boolean;
  triggeredAt: string | null;
  triggerPrice: number | null;
  customMessage: string | null;
  createdAt: string;
}

export function PriceAlertsPanel() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // New alert form
  const [symbol, setSymbol] = useState("SPX");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [targetValue, setTargetValue] = useState("");
  const [notifyTelegram, setNotifyTelegram] = useState(true);

  const fetchAlerts = async () => {
    try {
      // Simulated alerts for demo
      setAlerts([
        {
          id: "1",
          symbol: "SPX",
          targetType: "PRICE",
          targetValue: 5850,
          condition: "ABOVE",
          active: true,
          triggered: false,
          triggeredAt: null,
          triggerPrice: null,
          customMessage: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          symbol: "SPX",
          targetType: "PRICE",
          targetValue: 5750,
          condition: "BELOW",
          active: true,
          triggered: false,
          triggeredAt: null,
          triggerPrice: null,
          customMessage: null,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          symbol: "VIX",
          targetType: "PRICE",
          targetValue: 20,
          condition: "ABOVE",
          active: false,
          triggered: true,
          triggeredAt: new Date(Date.now() - 3600000).toISOString(),
          triggerPrice: 20.5,
          customMessage: "VIX spiked!",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } catch (e) {
      console.error("Failed to fetch alerts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const createAlert = async () => {
    if (!targetValue) {
      toast.error("Please enter a target price");
      return;
    }

    try {
      // In production, this would call the API
      const newAlert: PriceAlert = {
        id: Date.now().toString(),
        symbol,
        targetType: "PRICE",
        targetValue: parseFloat(targetValue),
        condition,
        active: true,
        triggered: false,
        triggeredAt: null,
        triggerPrice: null,
        customMessage: null,
        createdAt: new Date().toISOString(),
      };

      setAlerts([newAlert, ...alerts]);
      setShowCreate(false);
      setTargetValue("");
      toast.success(`Alert created: ${symbol} ${condition} $${targetValue}`);
    } catch (e) {
      toast.error("Failed to create alert");
    }
  };

  const deleteAlert = async (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
    toast.success(t('alertDeleted'));
  };

  const toggleAlert = async (id: string, active: boolean) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, active } : a)));
  };

  const getConditionIcon = (cond: string) => {
    switch (cond) {
      case "ABOVE":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "BELOW":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);
  const inactiveAlerts = alerts.filter((a) => !a.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t('priceAlerts')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {activeAlerts.length} active, {triggeredAlerts.length} triggered
          </p>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('createAlert')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price Alert</DialogTitle>
              <DialogDescription>
                Get notified when price reaches your target
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>{t('alertSymbol')}</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPX">SPX</SelectItem>
                    <SelectItem value="VIX">VIX</SelectItem>
                    <SelectItem value="ES">ES (E-mini S&P)</SelectItem>
                    <SelectItem value="NQ">NQ (E-mini Nasdaq)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('alertCondition')}</Label>
                <Select
                  value={condition}
                  onValueChange={(v) => setCondition(v as "ABOVE" | "BELOW")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABOVE">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-green-500" />
                        {t('alertAbove')}
                      </div>
                    </SelectItem>
                    <SelectItem value="BELOW">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4 text-red-500" />
                        {t('alertBelow')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('alertTarget')}</Label>
                <Input
                  type="number"
                  placeholder="5850.00"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Telegram</Label>
                  <p className="text-xs text-muted-foreground">Send via Telegram</p>
                </div>
                <Switch checked={notifyTelegram} onCheckedChange={setNotifyTelegram} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={createAlert}>Create Alert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('noAlerts')}</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {getConditionIcon(alert.condition)}
                      <div>
                        <p className="font-medium">
                          {alert.symbol} {alert.condition === "ABOVE" ? ">" : "<"} $
                          {alert.targetValue}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.active}
                        onCheckedChange={(v) => toggleAlert(alert.id, v)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Triggered Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-green-500/20 bg-green-500/5"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">
                          {alert.symbol} {alert.condition === "ABOVE" ? ">" : "<"} $
                          {alert.targetValue}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Triggered at ${alert.triggerPrice} on{" "}
                          {alert.triggeredAt
                            ? new Date(alert.triggeredAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
