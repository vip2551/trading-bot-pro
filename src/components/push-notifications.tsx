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
import {
  Bell,
  BellOff,
  Smartphone,
  Send,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Volume2,
  VolumeX,
  RefreshCw,
  Shield,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface PushSettings {
  enabled: boolean;
  soundEnabled: boolean;
  tradeOpen: boolean;
  tradeClose: boolean;
  priceAlerts: boolean;
  dailyReport: boolean;
  riskWarnings: boolean;
  systemAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface PushHistory {
  id: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

export function PushNotifications() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [settings, setSettings] = useState<PushSettings>({
    enabled: false,
    soundEnabled: true,
    tradeOpen: true,
    tradeClose: true,
    priceAlerts: true,
    dailyReport: false,
    riskWarnings: true,
    systemAlerts: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });

  const [history, setHistory] = useState<PushHistory[]>([
    {
      id: "1",
      title: isArabic ? "صفقة جديدة" : "New Trade Opened",
      message: isArabic
        ? "تم فتح صفقة CALL على SPX @ 5830"
        : "CALL trade opened on SPX @ 5830",
      time: new Date(Date.now() - 3600000),
      read: false,
    },
    {
      id: "2",
      title: isArabic ? "تنبيه المخاطر" : "Risk Warning",
      message: isArabic
        ? "الصفقة تقترب من وقف الخسارة (-8%)"
        : "Trade approaching stop loss (-8%)",
      time: new Date(Date.now() - 7200000),
      read: true,
    },
    {
      id: "3",
      title: isArabic ? "صفقة مغلقة" : "Trade Closed",
      message: isArabic
        ? "تم إغلاق الصفقة بربح +$350 (+10%)"
        : "Trade closed with profit +$350 (+10%)",
      time: new Date(Date.now() - 86400000),
      read: true,
    },
  ]);

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error(
        isArabic ? "المتصفح لا يدعم الإشعارات" : "Browser doesn't support notifications"
      );
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      toast.success(isArabic ? "تم السماح بالإشعارات" : "Notifications enabled");
      setSettings((prev) => ({ ...prev, enabled: true }));
    } else {
      toast.error(isArabic ? "تم رفض الإشعارات" : "Notifications denied");
    }
  }, [isArabic]);

  const sendTestNotification = useCallback(() => {
    if (permission !== "granted") {
      toast.error(
        isArabic ? "يجب السماح بالإشعارات أولاً" : "Please enable notifications first"
      );
      return;
    }

    setSending(true);
    setTimeout(() => {
      new Notification(
        isArabic ? "🧪 إشعار تجريبي" : "🧪 Test Notification",
        {
          body: isArabic
            ? "إذا رأيت هذا، فالإشعارات تعمل بشكل صحيح!"
            : "If you see this, notifications are working correctly!",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge.png",
          tag: "test",
        }
      );

      setHistory((prev) => [
        {
          id: Date.now().toString(),
          title: isArabic ? "إشعار تجريبي" : "Test Notification",
          message: isArabic
            ? "تم إرسال إشعار تجريبي"
            : "Test notification sent",
          time: new Date(),
          read: false,
        },
        ...prev,
      ]);

      setSending(false);
      toast.success(isArabic ? "تم إرسال الإشعار" : "Notification sent");
    }, 500);
  }, [permission, isArabic]);

  const toggleSetting = (key: keyof PushSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const markAsRead = (id: string) => {
    setHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, read: true } : h))
    );
  };

  const unreadCount = history.filter((h) => !h.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            {isArabic ? "إشعارات Push" : "Push Notifications"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic
              ? "استلم إشعارات مباشرة على هاتفك"
              : "Get direct notifications on your phone"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {permission === "granted" ? (
            <Badge className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              {isArabic ? "مفعّل" : "Enabled"}
            </Badge>
          ) : permission === "denied" ? (
            <Badge className="bg-red-500">
              <XCircle className="h-3 w-3 mr-1" />
              {isArabic ? "معطّل" : "Blocked"}
            </Badge>
          ) : (
            <Badge variant="outline">
              {isArabic ? "غير مفعّل" : "Not Enabled"}
            </Badge>
          )}
        </div>
      </div>

      {/* Permission Request */}
      {permission !== "granted" && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">
                  {isArabic
                    ? "فعّل الإشعارات للحصول على تنبيهات فورية"
                    : "Enable notifications for instant alerts"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? "سنرسل لك تنبيهات مهمة فقط - صفقات، تحذيرات، وتقارير"
                    : "We'll only send important alerts - trades, warnings, and reports"}
                </p>
              </div>
              <Button onClick={requestPermission} disabled={permission === "denied"}>
                <Bell className="h-4 w-4 mr-2" />
                {isArabic ? "تفعيل" : "Enable"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {isArabic ? "إعدادات الإشعارات" : "Notification Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{isArabic ? "الإشعارات" : "Notifications"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "تفعيل/تعطيل جميع الإشعارات" : "Enable/disable all notifications"}
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={() => toggleSetting("enabled")}
                disabled={permission !== "granted"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  {settings.soundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  {isArabic ? "الصوت" : "Sound"}
                </Label>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={() => toggleSetting("soundEnabled")}
              />
            </div>

            <hr />

            <h4 className="text-sm font-medium">
              {isArabic ? "أنواع الإشعارات" : "Notification Types"}
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{isArabic ? "فتح صفقة" : "Trade Opened"}</Label>
                <Switch
                  checked={settings.tradeOpen}
                  onCheckedChange={() => toggleSetting("tradeOpen")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{isArabic ? "إغلاق صفقة" : "Trade Closed"}</Label>
                <Switch
                  checked={settings.tradeClose}
                  onCheckedChange={() => toggleSetting("tradeClose")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{isArabic ? "تنبيهات سعرية" : "Price Alerts"}</Label>
                <Switch
                  checked={settings.priceAlerts}
                  onCheckedChange={() => toggleSetting("priceAlerts")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{isArabic ? "التقرير اليومي" : "Daily Report"}</Label>
                <Switch
                  checked={settings.dailyReport}
                  onCheckedChange={() => toggleSetting("dailyReport")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{isArabic ? "تحذيرات المخاطر" : "Risk Warnings"}</Label>
                <Switch
                  checked={settings.riskWarnings}
                  onCheckedChange={() => toggleSetting("riskWarnings")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{isArabic ? "تنبيهات النظام" : "System Alerts"}</Label>
                <Switch
                  checked={settings.systemAlerts}
                  onCheckedChange={() => toggleSetting("systemAlerts")}
                />
              </div>
            </div>

            <hr />

            <div className="flex items-center justify-between">
              <div>
                <Label>{isArabic ? "ساعات الهدوء" : "Quiet Hours"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "لا إشعارات خلال هذه الساعات" : "No notifications during these hours"}
                </p>
              </div>
              <Switch
                checked={settings.quietHoursEnabled}
                onCheckedChange={() => toggleSetting("quietHoursEnabled")}
              />
            </div>

            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-4">
                <div>
                  <Label className="text-xs">{isArabic ? "من" : "From"}</Label>
                  <Input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        quietHoursStart: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">{isArabic ? "إلى" : "To"}</Label>
                  <Input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        quietHoursEnd: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full"
              variant="outline"
              onClick={sendTestNotification}
              disabled={permission !== "granted" || sending}
            >
              {sending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              {isArabic ? "إرسال إشعار تجريبي" : "Send Test Notification"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {isArabic ? "سجل الإشعارات" : "Notification History"}
              </CardTitle>
              {unreadCount > 0 && (
                <Badge>{unreadCount} {isArabic ? "جديد" : "new"}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BellOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{isArabic ? "لا توجد إشعارات" : "No notifications yet"}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 cursor-pointer hover:bg-muted/30 ${
                        !item.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markAsRead(item.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.title}</p>
                            {!item.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.message}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="border-muted bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {isArabic ? "كيف تعمل الإشعارات؟" : "How Push Notifications Work?"}
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>
                {isArabic
                  ? 'اضغط "تفعيل" للسماح بالإشعارات'
                  : "Click 'Enable' to allow notifications"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span>
                {isArabic
                  ? "سيُثبت التطبيق على هاتفك"
                  : "The app will be installed on your phone"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span>
                {isArabic
                  ? "ستصلك الإشعارات حتى لو التطبيق مغلق"
                  : "You'll receive notifications even when app is closed"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
