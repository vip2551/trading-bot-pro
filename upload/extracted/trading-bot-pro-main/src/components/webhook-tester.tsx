"use client";

import { useState, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Terminal,
  Play,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  RefreshCw,
  AlertTriangle,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface TestResult {
  id: string;
  timestamp: Date;
  payload: string;
  status: "success" | "error";
  message: string;
  responseTime: number;
}

export function WebhookTester() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [testPayload, setTestPayload] = useState(`{
  "symbol": "SPX",
  "action": "BUY",
  "direction": "CALL",
  "quantity": 2,
  "stopLoss": 300,
  "takeProfit": 450,
  "strategy": "Test Strategy"
}`);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [sending, setSending] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/tradingview`
      : ""
  );

  const sendTestSignal = useCallback(async () => {
    setSending(true);
    const startTime = Date.now();

    try {
      const payload = JSON.parse(testPayload);
      const response = await fetch("/api/webhook/tradingview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      const result: TestResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        payload: testPayload,
        status: response.ok ? "success" : "error",
        message: response.ok
          ? data.message || "Signal processed successfully"
          : data.error || "Failed to process signal",
        responseTime,
      };

      setTestResults((prev) => [result, ...prev].slice(0, 20));
      toast.success(
        response.ok
          ? isArabic
            ? "تم إرسال الإشارة بنجاح"
            : "Signal sent successfully"
          : isArabic
          ? "فشل إرسال الإشارة"
          : "Failed to send signal"
      );
    } catch (error) {
      const result: TestResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        payload: testPayload,
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Invalid JSON payload",
        responseTime: Date.now() - startTime,
      };
      setTestResults((prev) => [result, ...prev].slice(0, 20));
      toast.error(isArabic ? "خطأ في البيانات" : "Invalid JSON payload");
    }

    setSending(false);
  }, [testPayload, isArabic]);

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success(isArabic ? "تم نسخ الرابط" : "URL copied");
  };

  const presetPayloads = [
    {
      name: "CALL Signal",
      payload: JSON.stringify(
        {
          symbol: "SPX",
          action: "BUY",
          direction: "CALL",
          quantity: 2,
          stopLoss: 300,
          takeProfit: 450,
          strategy: "Test CALL",
        },
        null,
        2
      ),
    },
    {
      name: "PUT Signal",
      payload: JSON.stringify(
        {
          symbol: "SPX",
          action: "BUY",
          direction: "PUT",
          quantity: 2,
          stopLoss: 350,
          takeProfit: 200,
          strategy: "Test PUT",
        },
        null,
        2
      ),
    },
    {
      name: "Close Signal",
      payload: JSON.stringify(
        {
          symbol: "SPX",
          action: "CLOSE",
          strategy: "Manual Close",
        },
        null,
        2
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            {isArabic ? "اختبار Webhook" : "Webhook Tester"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic
              ? "اختبر إشارات TradingView قبل الاستخدام الحقيقي"
              : "Test TradingView signals before live use"}
          </p>
        </div>
        <Badge variant="outline" className="bg-green-500/10 text-green-500">
          {isArabic ? "وضع الاختبار" : "Test Mode"}
        </Badge>
      </div>

      {/* Webhook URL */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {isArabic ? "رابط Webhook" : "Webhook URL"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" onClick={copyWebhookUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isArabic
              ? "انسخ هذا الرابط واستخدمه في TradingView Alerts"
              : "Copy this URL and use it in TradingView Alerts"}
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payload Editor */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {isArabic ? "محتوى الإشارة" : "Payload"}
                </CardTitle>
                <div className="flex gap-1">
                  {presetPayloads.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setTestPayload(preset.payload)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full h-64 p-3 font-mono text-sm bg-muted rounded-lg border resize-none"
                spellCheck={false}
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">JSON</Badge>
                  <Badge variant="outline">POST</Badge>
                </div>
                <Button onClick={sendTestSignal} disabled={sending}>
                  {sending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isArabic ? "إرسال اختبار" : "Send Test"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expected Behavior */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {isArabic ? "السلوك المتوقع" : "Expected Behavior"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {isArabic
                      ? "البوت سيستقبل الإشارة ويحللها"
                      : "Bot will receive and parse the signal"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {isArabic
                      ? "يبحث عن استرايك مناسب حسب الإعدادات"
                      : "Search for suitable strike based on settings"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {isArabic
                      ? "يتحقق من السبريد والسيولة"
                      : "Verify spread and liquidity"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {isArabic
                      ? "يرسل إشعار Telegram"
                      : "Send Telegram notification"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {isArabic ? "نتائج الاختبار" : "Test Results"}
              </CardTitle>
              <Badge variant="outline">
                {testResults.length} {isArabic ? "اختبار" : "tests"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{isArabic ? "لا توجد اختبارات بعد" : "No tests yet"}</p>
                <p className="text-sm">
                  {isArabic
                    ? "أرسل إشارة اختبارية للبدء"
                    : "Send a test signal to get started"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-4 rounded-lg border ${
                        result.status === "success"
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.status === "success" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <Badge
                            variant="outline"
                            className={
                              result.status === "success"
                                ? "border-green-500 text-green-500"
                                : "border-red-500 text-red-500"
                            }
                          >
                            {result.status === "success"
                              ? isArabic
                                ? "نجاح"
                                : "Success"
                              : isArabic
                              ? "فشل"
                              : "Error"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {result.responseTime}ms
                        </div>
                      </div>

                      <div className="text-sm mb-2">
                        {result.timestamp.toLocaleString()}
                      </div>

                      <div className="bg-muted/50 p-2 rounded text-sm font-mono mb-2">
                        {result.message}
                      </div>

                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          {isArabic ? "عرض المحتوى" : "View Payload"}
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                          {result.payload}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TradingView Setup Instructions */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-500">
                {isArabic ? "إعداد TradingView" : "TradingView Setup"}
              </p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>
                  {isArabic
                    ? "افتح TradingView واذهب إلى استراتيجيتك"
                    : "Open TradingView and go to your strategy"}
                </li>
                <li>
                  {isArabic
                    ? "اضغط على 'Add Alert'"
                    : "Click 'Add Alert'"}
                </li>
                <li>
                  {isArabic
                    ? "اختر 'Webhook URL' وأدخل الرابط أعلاه"
                    : "Select 'Webhook URL' and paste the URL above"}
                </li>
                <li>
                  {isArabic
                    ? "في 'Message' الصق محتوى JSON المطلوب"
                    : "In 'Message' paste the required JSON payload"}
                </li>
                <li>
                  {isArabic
                    ? "احفظ التنبيه"
                    : "Save the alert"}
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
