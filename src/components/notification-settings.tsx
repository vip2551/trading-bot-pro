"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  MessageSquare,
  Send,
  RefreshCw,
  Check,
  Moon,
  Globe,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/context";

interface NotificationSettingsProps {
  userId?: string;
}

interface Settings {
  id: string;
  telegramEnabled: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  discordEnabled: boolean;
  discordWebhookUrl: string | null;
  emailEnabled: boolean;
  emailOnTradeOpen: boolean;
  emailOnTradeClose: boolean;
  emailOnDailyReport: boolean;
  pushEnabled: boolean;
  pushOnTradeOpen: boolean;
  pushOnTradeClose: boolean;
  pushOnPriceAlert: boolean;
  notifyOnNewSignal: boolean;
  notifyOnError: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  notificationLanguage: string;
}

export function NotificationSettings({ userId = 'demo' }: NotificationSettingsProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [formData, setFormData] = useState({
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
    discordEnabled: false,
    discordWebhookUrl: "",
    emailEnabled: false,
    emailOnTradeOpen: true,
    emailOnTradeClose: true,
    emailOnDailyReport: false,
    pushEnabled: false,
    pushOnTradeOpen: true,
    pushOnTradeClose: true,
    pushOnPriceAlert: false,
    notifyOnNewSignal: true,
    notifyOnError: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    notificationLanguage: "en",
  });

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setFormData({
          telegramEnabled: data.settings.telegramEnabled || false,
          telegramBotToken: data.settings.telegramBotToken || "",
          telegramChatId: data.settings.telegramChatId || "",
          discordEnabled: data.settings.discordEnabled || false,
          discordWebhookUrl: data.settings.discordWebhookUrl || "",
          emailEnabled: data.settings.emailEnabled || false,
          emailOnTradeOpen: data.settings.emailOnTradeOpen ?? true,
          emailOnTradeClose: data.settings.emailOnTradeClose ?? true,
          emailOnDailyReport: data.settings.emailOnDailyReport || false,
          pushEnabled: data.settings.pushEnabled || false,
          pushOnTradeOpen: data.settings.pushOnTradeOpen ?? true,
          pushOnTradeClose: data.settings.pushOnTradeClose ?? true,
          pushOnPriceAlert: data.settings.pushOnPriceAlert || false,
          notifyOnNewSignal: data.settings.notifyOnNewSignal ?? true,
          notifyOnError: data.settings.notifyOnError ?? true,
          quietHoursEnabled: data.settings.quietHoursEnabled || false,
          quietHoursStart: data.settings.quietHoursStart || "22:00",
          quietHoursEnd: data.settings.quietHoursEnd || "08:00",
          notificationLanguage: data.settings.notificationLanguage || "en",
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    // Fetch settings on mount - this is a standard pattern for data fetching
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...formData }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('settingsSaved'));
        loadSettings();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (e) {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const testNotification = async (type: "telegram" | "discord") => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type }),
      });
      const data = await res.json();
      if (data.success) {
        const langText = data.lang === 'ar' ? 'العربية' : 'English';
        toast.success(`Test notification sent! (${langText})`);
      } else {
        toast.error(data.message || "Failed to send test");
      }
    } catch (e) {
      toast.error("Failed to send test notification");
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
          <h2 className="text-2xl font-bold">{t('notifications')}</h2>
          <p className="text-muted-foreground">Configure how you receive alerts</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          {t('save')}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Notification Language */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <CardTitle>Notification Language | لغة الإشعارات</CardTitle>
            </div>
            <CardDescription>
              Choose the language for your Telegram notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select
                value={formData.notificationLanguage}
                onValueChange={(value) => setFormData({ ...formData, notificationLanguage: value })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <span>🇺🇸</span>
                      <span>English</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ar">
                    <div className="flex items-center gap-2">
                      <span>🇸🇦</span>
                      <span>العربية (Arabic)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {formData.notificationLanguage === 'ar' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  الإشعارات بالعربية
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {formData.notificationLanguage === 'ar'
                ? 'سيتم إرسال جميع إشعارات التلقرام باللغة العربية'
                : 'All Telegram notifications will be sent in English'}
            </p>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <CardTitle>Telegram</CardTitle>
              </div>
              <Switch
                checked={formData.telegramEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, telegramEnabled: checked })}
              />
            </div>
            <CardDescription>Receive notifications via Telegram bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('telegramToken')}</Label>
              <Input
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={formData.telegramBotToken}
                onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                disabled={!formData.telegramEnabled}
              />
            </div>
            <div>
              <Label>{t('telegramChatId')}</Label>
              <Input
                placeholder="-1001234567890"
                value={formData.telegramChatId}
                onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                disabled={!formData.telegramEnabled}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testNotification("telegram")}
                disabled={!formData.telegramEnabled || !formData.telegramBotToken || !formData.telegramChatId}
              >
                <Send className="h-4 w-4 mr-2" /> {t('test')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Discord */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                <CardTitle>Discord</CardTitle>
              </div>
              <Switch
                checked={formData.discordEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, discordEnabled: checked })}
              />
            </div>
            <CardDescription>Receive notifications via Discord webhook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <Input
                type="password"
                placeholder="https://discord.com/api/webhooks/..."
                value={formData.discordWebhookUrl}
                onChange={(e) => setFormData({ ...formData, discordWebhookUrl: e.target.value })}
                disabled={!formData.discordEnabled}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification("discord")}
              disabled={!formData.discordEnabled || !formData.discordWebhookUrl}
            >
              <Send className="h-4 w-4 mr-2" /> {t('test')}
            </Button>
          </CardContent>
        </Card>

        {/* Email & Push */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                <CardTitle>Push Notifications</CardTitle>
              </div>
              <Switch
                checked={formData.pushEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, pushEnabled: checked })}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Trade Opened</Label>
              <Switch
                checked={formData.pushOnTradeOpen}
                onCheckedChange={(checked) => setFormData({ ...formData, pushOnTradeOpen: checked })}
                disabled={!formData.pushEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Trade Closed</Label>
              <Switch
                checked={formData.pushOnTradeClose}
                onCheckedChange={(checked) => setFormData({ ...formData, pushOnTradeClose: checked })}
                disabled={!formData.pushEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Price Alerts</Label>
              <Switch
                checked={formData.pushOnPriceAlert}
                onCheckedChange={(checked) => setFormData({ ...formData, pushOnPriceAlert: checked })}
                disabled={!formData.pushEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-purple-500" />
                <CardTitle>Quiet Hours</CardTitle>
              </div>
              <Switch
                checked={formData.quietHoursEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, quietHoursEnabled: checked })}
              />
            </div>
            <CardDescription>Silence notifications during specific hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start</Label>
                <Input
                  type="time"
                  value={formData.quietHoursStart || "22:00"}
                  onChange={(e) => setFormData({ ...formData, quietHoursStart: e.target.value })}
                  disabled={!formData.quietHoursEnabled}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="time"
                  value={formData.quietHoursEnd || "08:00"}
                  onChange={(e) => setFormData({ ...formData, quietHoursEnd: e.target.value })}
                  disabled={!formData.quietHoursEnabled}
                />
              </div>
            </div>
            {formData.quietHoursEnabled && (
              <p className="text-sm text-muted-foreground">
                Notifications will be silenced from {formData.quietHoursStart} to {formData.quietHoursEnd}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
