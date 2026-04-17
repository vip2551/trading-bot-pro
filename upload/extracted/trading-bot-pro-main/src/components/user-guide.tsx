"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Book,
  ChevronRight,
  Globe,
  ExternalLink,
  Download,
  Search,
  Terminal,
  Settings,
  Bell,
  Shield,
  TrendingUp,
  BarChart3,
  Database,
  HelpCircle,
  Zap,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function UserGuide() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");

  const isArabic = language === "ar";

  const sections = [
    {
      id: "getting-started",
      icon: Zap,
      titleEn: "Getting Started",
      titleAr: "البدء",
    },
    {
      id: "dashboard",
      icon: BarChart3,
      titleEn: "Dashboard",
      titleAr: "لوحة التحكم",
    },
    {
      id: "trading-settings",
      icon: Settings,
      titleEn: "Trading Settings",
      titleAr: "إعدادات التداول",
    },
    {
      id: "risk-management",
      icon: Shield,
      titleEn: "Risk Management",
      titleAr: "إدارة المخاطر",
    },
    {
      id: "notifications",
      icon: Bell,
      titleEn: "Notifications",
      titleAr: "الإشعارات",
    },
    {
      id: "analytics",
      icon: TrendingUp,
      titleEn: "Analytics",
      titleAr: "التحليلات",
    },
    {
      id: "webhook",
      icon: Terminal,
      titleEn: "Webhook Setup",
      titleAr: "إعداد Webhook",
    },
    {
      id: "troubleshooting",
      icon: HelpCircle,
      titleEn: "Troubleshooting",
      titleAr: "استكشاف الأخطاء",
    },
  ];

  const guideContent: Record<string, { en: JSX.Element; ar: JSX.Element }> = {
    "getting-started": {
      en: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Step 1: Create Account
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click "Sign Up" button</li>
              <li>Enter your email and password</li>
              <li>You'll get a 7-day free trial</li>
              <li>Verify your email address</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              Step 2: Setup Interactive Brokers
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <p className="text-sm">In TWS or Gateway:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to Configure → API → Settings</li>
                <li>Enable "ActiveX and Socket Clients"</li>
                <li>Set port: <Badge variant="outline">7497 (Paper)</Badge> or <Badge variant="outline">7496 (Live)</Badge></li>
                <li>Add trusted IP: 127.0.0.1</li>
              </ol>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Step 3: Setup Telegram
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <p className="text-sm">Create a Telegram bot:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open Telegram and search <Badge variant="secondary">@BotFather</Badge></li>
                <li>Send <code className="bg-muted px-1 rounded">/newbot</code></li>
                <li>Follow instructions and copy the token</li>
                <li>Get your Chat ID from <Badge variant="secondary">@userinfobot</Badge></li>
              </ol>
            </div>
          </div>
        </div>
      ),
      ar: (
        <div className="space-y-6" dir="rtl">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              الخطوة 1: إنشاء حساب
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>اضغط على زر "إنشاء حساب"</li>
              <li>أدخل بريدك الإلكتروني وكلمة المرور</li>
              <li>ستحصل على تجربة مجانية لمدة 7 أيام</li>
              <li>تحقق من بريدك الإلكتروني</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              الخطوة 2: إعداد Interactive Brokers
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <p className="text-sm">في TWS أو Gateway:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>اذهب إلى Configure → API → Settings</li>
                <li>فعّل "ActiveX and Socket Clients"</li>
                <li>حدد المنفذ: <Badge variant="outline">7497 (ورقي)</Badge> أو <Badge variant="outline">7496 (حقيقي)</Badge></li>
                <li>أضف IP الموثوق: 127.0.0.1</li>
              </ol>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              الخطوة 3: إعداد Telegram
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <p className="text-sm">إنشاء بوت Telegram:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>افتح Telegram وابحث عن <Badge variant="secondary">@BotFather</Badge></li>
                <li>أرسل <code className="bg-muted px-1 rounded">/newbot</code></li>
                <li>اتبع التعليمات وانسخ الـ Token</li>
                <li>احصل على Chat ID من <Badge variant="secondary">@userinfobot</Badge></li>
              </ol>
            </div>
          </div>
        </div>
      ),
    },
    "trading-settings": {
      en: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Position Sizing</h3>
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">Fixed Amount ($)</h4>
                  <p className="text-sm text-muted-foreground">Invest a specific amount per trade</p>
                  <p className="text-sm mt-2">Example: $500 per trade</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">Portfolio Percentage (%)</h4>
                  <p className="text-sm text-muted-foreground">Use a percentage of your balance</p>
                  <p className="text-sm mt-2">Example: 5% of $10,000 = $500</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">Fixed Contracts</h4>
                  <p className="text-sm text-muted-foreground">Specify exact number of contracts</p>
                  <p className="text-sm mt-2">Example: 3 contracts per trade</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Strike Selection</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium text-green-500 mb-2">Contract Price Mode (Recommended)</p>
              <p className="text-sm text-muted-foreground">Bot finds strike with contract price between $300-$400</p>
              <p className="text-sm mt-2">Best balance between risk and reward</p>
            </div>
          </div>
        </div>
      ),
      ar: (
        <div className="space-y-6" dir="rtl">
          <div>
            <h3 className="text-lg font-semibold mb-4">تحديد حجم الصفقة</h3>
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">مبلغ ثابت ($)</h4>
                  <p className="text-sm text-muted-foreground">استثمار مبلغ محدد في كل صفقة</p>
                  <p className="text-sm mt-2">مثال: $500 في كل صفقة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">نسبة من المحفظة (%)</h4>
                  <p className="text-sm text-muted-foreground">استخدام نسبة من رصيدك</p>
                  <p className="text-sm mt-2">مثال: 5% من $10,000 = $500</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">عدد عقود ثابت</h4>
                  <p className="text-sm text-muted-foreground">تحديد عدد العقود بالضبط</p>
                  <p className="text-sm mt-2">مثال: 3 عقود في كل صفقة</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">اختيار الاسترايك</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium text-green-500 mb-2">وضع سعر العقد (موصى به)</p>
              <p className="text-sm text-muted-foreground">البوت يبحث عن استرايك بسعر عقد بين $300-$400</p>
              <p className="text-sm mt-2">أفضل توازن بين المخاطرة والعائد</p>
            </div>
          </div>
        </div>
      ),
    },
    "risk-management": {
      en: (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-500 mb-2">Spread Protection</h3>
            <p className="text-sm text-muted-foreground">Rejects trades when bid-ask spread is too high</p>
            <p className="text-sm mt-2">Recommended: Max 5% spread</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-500 mb-2">Liquidity Check</h3>
            <p className="text-sm text-muted-foreground">Ensures enough contracts are available</p>
            <p className="text-sm mt-2">Recommended: Min 100 contracts</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
            <h3 className="font-semibold text-amber-500 mb-2">Daily Loss Limit</h3>
            <p className="text-sm text-muted-foreground">Stops trading when daily loss exceeds limit</p>
            <p className="text-sm mt-2">Set based on your risk tolerance</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-500 mb-2">Smart Mode</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Avoid low liquidity hours</li>
              <li>✓ Skip news events</li>
              <li>✓ Protect against high spreads</li>
            </ul>
          </div>
        </div>
      ),
      ar: (
        <div className="space-y-6" dir="rtl">
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-500 mb-2">حماية السبريد</h3>
            <p className="text-sm text-muted-foreground">رفض الصفقات عندما يكون السبريد عالياً</p>
            <p className="text-sm mt-2">الموصى: أقصى سبريد 5%</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-500 mb-2">التحقق من السيولة</h3>
            <p className="text-sm text-muted-foreground">التأكد من توفر عقود كافية</p>
            <p className="text-sm mt-2">الموصى: أقل 100 عقد</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
            <h3 className="font-semibold text-amber-500 mb-2">حد الخسارة اليومية</h3>
            <p className="text-sm text-muted-foreground">إيقاف التداول عند تجاوز حد الخسارة</p>
            <p className="text-sm mt-2">حدد بناءً على تحملك للمخاطر</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-500 mb-2">الوضع الذكي</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ تجنب ساعات السيولة المنخفضة</li>
              <li>✓ تخطي أحداث الأخبار</li>
              <li>✓ حماية من السبريد العالي</li>
            </ul>
          </div>
        </div>
      ),
    },
    "webhook": {
      en: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">TradingView Signal Format</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`{
  "symbol": "SPX",
  "action": "BUY",
  "direction": "CALL",
  "quantity": 1,
  "stopLoss": 300,
  "takeProfit": 500,
  "strategy": "MyStrategy"
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Setup in TradingView</h3>
            <ol className="list-decimal list-inside space-y-3">
              <li>Open your TradingView strategy</li>
              <li>Click "Add Alert"</li>
              <li>Select "Webhook URL"</li>
              <li>Enter your webhook URL</li>
              <li>Paste the JSON message above</li>
            </ol>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="font-medium text-blue-500">Webhook URL</p>
            <code className="text-sm text-muted-foreground">https://your-bot-url/api/webhook/tradingview</code>
          </div>
        </div>
      ),
      ar: (
        <div className="space-y-6" dir="rtl">
          <div>
            <h3 className="text-lg font-semibold mb-4">صيغة إشارة TradingView</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`{
  "symbol": "SPX",
  "action": "BUY",
  "direction": "CALL",
  "quantity": 1,
  "stopLoss": 300,
  "takeProfit": 500,
  "strategy": "MyStrategy"
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">الإعداد في TradingView</h3>
            <ol className="list-decimal list-inside space-y-3">
              <li>افتح استراتيجيتك في TradingView</li>
              <li>اضغط على "Add Alert"</li>
              <li>اختر "Webhook URL"</li>
              <li>أدخل رابط الـ Webhook</li>
              <li>الصق رسالة JSON أعلاه</li>
            </ol>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="font-medium text-blue-500">رابط Webhook</p>
            <code className="text-sm text-muted-foreground">https://your-bot-url/api/webhook/tradingview</code>
          </div>
        </div>
      ),
    },
    "troubleshooting": {
      en: (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ib-connection">
              <AccordionTrigger>IB not connected</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Ensure TWS/Gateway is running</li>
                  <li>• Check API settings are enabled</li>
                  <li>• Verify port number matches</li>
                  <li>• Check firewall settings</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="telegram">
              <AccordionTrigger>Telegram notifications not working</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Verify bot token is correct</li>
                  <li>• Check Chat ID is correct</li>
                  <li>• Make sure bot is not blocked</li>
                  <li>• Test with a simple message</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="trades">
              <AccordionTrigger>Trades not executing</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Check account balance</li>
                  <li>• Verify market is open</li>
                  <li>• Check spread/liquidity settings</li>
                  <li>• Review error logs</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="spread">
              <AccordionTrigger>High spread rejection</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Wait for market to stabilize</li>
                  <li>• Increase max spread setting (risky)</li>
                  <li>• Trade more liquid strikes</li>
                  <li>• Avoid first/last 30 minutes</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ),
      ar: (
        <div className="space-y-4" dir="rtl">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ib-connection">
              <AccordionTrigger>IB غير متصل</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• تأكد من تشغيل TWS/Gateway</li>
                  <li>• تحقق من تفعيل إعدادات API</li>
                  <li>• تأكد من مطابقة رقم المنفذ</li>
                  <li>• تحقق من إعدادات الجدار الناري</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="telegram">
              <AccordionTrigger>إشعارات Telegram لا تعمل</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• تحقق من صحة Bot Token</li>
                  <li>• تأكد من صحة Chat ID</li>
                  <li>• تأكد من عدم حظر البوت</li>
                  <li>• اختبر برسالة بسيطة</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="trades">
              <AccordionTrigger>الصفقات لا تنفذ</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• تحقق من رصيد الحساب</li>
                  <li>• تأكد من أن السوق مفتوح</li>
                  <li>• تحقق من إعدادات السبريد/السيولة</li>
                  <li>• راجع سجل الأخطاء</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="spread">
              <AccordionTrigger>رفض بسبب السبريد العالي</AccordionTrigger>
              <AccordionContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• انتظر استقرار السوق</li>
                  <li>• زد حد السبريد (مخاطرة أعلى)</li>
                  <li>• تداول استرايكات أكثر سيولة</li>
                  <li>• تجنب أول وآخر 30 دقيقة</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ),
    },
    "dashboard": {
      en: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Dashboard Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">156</p>
                <p className="text-xs text-muted-foreground">All time trades</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-green-500">68%</p>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className="text-2xl font-bold text-green-500">+$12,450</p>
                <p className="text-xs text-muted-foreground">Net profit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Open Trades</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Active positions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
      ar: (
        <div className="space-y-6" dir="rtl">
          <h3 className="text-lg font-semibold">نظرة عامة على لوحة التحكم</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">إجمالي الصفقات</p>
                <p className="text-2xl font-bold">156</p>
                <p className="text-xs text-muted-foreground">جميع الصفقات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">نسبة الفوز</p>
                <p className="text-2xl font-bold text-green-500">68%</p>
                <p className="text-xs text-muted-foreground">نسبة النجاح</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">إجمالي P&L</p>
                <p className="text-2xl font-bold text-green-500">+$12,450</p>
                <p className="text-xs text-muted-foreground">صافي الربح</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">الصفقات المفتوحة</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">المراكز النشطة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    "notifications": {
      en: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Notification Language</h3>
            <div className="flex gap-4">
              <Card className="flex-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <p className="font-medium">English</p>
                    <p className="text-xs text-muted-foreground">Notifications in English</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🇸🇦</span>
                  <div>
                    <p className="font-medium">العربية</p>
                    <p className="text-xs text-muted-foreground">إشعارات بالعربية</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
            <div className="space-y-2">
              {[
                "✅ Trade opened",
                "✅ Trade closed",
                "✅ Price alerts",
                "✅ Daily reports",
                "✅ Risk warnings",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      ar: (
        <div className="space-y-6" dir="rtl">
          <div>
            <h3 className="text-lg font-semibold mb-4">لغة الإشعارات</h3>
            <div className="flex gap-4">
              <Card className="flex-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <p className="font-medium">English</p>
                    <p className="text-xs text-muted-foreground">Notifications in English</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🇸🇦</span>
                  <div>
                    <p className="font-medium">العربية</p>
                    <p className="text-xs text-muted-foreground">إشعارات بالعربية</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">أنواع الإشعارات</h3>
            <div className="space-y-2">
              {[
                "✅ فتح صفقة",
                "✅ إغلاق صفقة",
                "✅ تنبيهات سعرية",
                "✅ تقارير يومية",
                "✅ تحذيرات المخاطر",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    "analytics": {
      en: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">AI-Powered Analytics</h3>
          
          <div className="grid gap-4">
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium">Performance Analysis</h4>
                </div>
                <p className="text-sm text-muted-foreground">Detailed analysis of your trading performance with strengths and areas for improvement</p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">Market Analysis</h4>
                </div>
                <p className="text-sm text-muted-foreground">Market outlook and trading opportunities</p>
              </CardContent>
            </Card>
            
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  <h4 className="font-medium">Risk Analysis</h4>
                </div>
                <p className="text-sm text-muted-foreground">Risk assessment and management recommendations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
      ar: (
        <div className="space-y-6" dir="rtl">
          <h3 className="text-lg font-semibold">تحليلات مدعومة بالذكاء الاصطناعي</h3>
          
          <div className="grid gap-4">
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium">تحليل الأداء</h4>
                </div>
                <p className="text-sm text-muted-foreground">تحليل مفصل لأداء تداولك مع نقاط القوة ومجالات التحسين</p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">تحليل السوق</h4>
                </div>
                <p className="text-sm text-muted-foreground">نظرة على السوق وفرص التداول</p>
              </CardContent>
            </Card>
            
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  <h4 className="font-medium">تحليل المخاطر</h4>
                </div>
                <p className="text-sm text-muted-foreground">تقييم المخاطر وتوصيات الإدارة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
  };

  const currentContent = guideContent[activeSection];
  const currentSectionData = sections.find((s) => s.id === activeSection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Book className="h-6 w-6 text-primary" />
            {isArabic ? "دليل المستخدم" : "User Guide"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic ? "تعلم كيفية استخدام البوت" : "Learn how to use the bot"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            {isArabic ? "فتح كامل" : "Open Full"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar Navigation */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={isArabic ? "بحث..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background"
              />
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections
                .filter((s) =>
                  searchQuery
                    ? s.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.titleAr.includes(searchQuery)
                    : true
                )
                .map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{isArabic ? section.titleAr : section.titleEn}</span>
                      {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </button>
                  );
                })}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentSectionData && (
                <>
                  <currentSectionData.icon className="h-5 w-5" />
                  {isArabic ? currentSectionData.titleAr : currentSectionData.titleEn}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {currentContent && (isArabic ? currentContent.ar : currentContent.en)}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-500">
                {isArabic ? "⚠️ تحذيرات مهمة" : "⚠️ Important Warnings"}
              </h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>
                  {isArabic
                    ? "• اختبر على حساب Paper أولاً قبل التداول الحقيقي"
                    : "• Test on Paper account first before live trading"}
                </li>
                <li>
                  {isArabic
                    ? "• لا تستثمر أكثر مما تستطيع خسارته"
                    : "• Don't invest more than you can afford to lose"}
                </li>
                <li>
                  {isArabic
                    ? "• راقب البوت بانتظام وافحص الصفقات"
                    : "• Monitor the bot regularly and check trades"}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
