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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  Globe,
  RefreshCw,
  Filter,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Zap,
  Target,
  Building2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface EconomicEvent {
  id: string;
  date: Date;
  time: string;
  country: string;
  event: string;
  impact: "high" | "medium" | "low";
  forecast?: string;
  previous?: string;
  actual?: string;
  category: string;
  isAlertEnabled: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  EU: "🇪🇺",
  UK: "🇬🇧",
  JP: "🇯🇵",
  CN: "🇨🇳",
  DE: "🇩🇪",
  FR: "🇫🇷",
  CA: "🇨🇦",
  AU: "🇦🇺",
  CH: "🇨🇭",
};

const IMPACT_COLORS = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

const IMPACT_LABELS = {
  en: { high: "High", medium: "Medium", low: "Low" },
  ar: { high: "عالي", medium: "متوسط", low: "منخفض" },
};

export function EconomicCalendar() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<EconomicEvent[]>([]);

  const generateMockEvents = useCallback((date: Date): EconomicEvent[] => {
    const today = new Date(date);
    const events: EconomicEvent[] = [];

    const eventTemplates = [
      { country: "US", event: "Federal Reserve Interest Rate Decision", impact: "high" as const, category: "Monetary Policy" },
      { country: "US", event: "Non-Farm Payrolls", impact: "high" as const, category: "Employment" },
      { country: "US", event: "CPI Inflation Rate YoY", impact: "high" as const, category: "Inflation" },
      { country: "US", event: "GDP Growth Rate QoQ", impact: "high" as const, category: "GDP" },
      { country: "US", event: "Retail Sales MoM", impact: "medium" as const, category: "Consumption" },
      { country: "US", event: "ISM Manufacturing PMI", impact: "medium" as const, category: "Manufacturing" },
      { country: "US", event: "Initial Jobless Claims", impact: "medium" as const, category: "Employment" },
      { country: "US", event: "Consumer Confidence Index", impact: "low" as const, category: "Sentiment" },
      { country: "EU", event: "ECB Interest Rate Decision", impact: "high" as const, category: "Monetary Policy" },
      { country: "EU", event: "Eurozone CPI YoY", impact: "high" as const, category: "Inflation" },
      { country: "UK", event: "BOE Interest Rate Decision", impact: "high" as const, category: "Monetary Policy" },
      { country: "UK", event: "UK GDP Growth Rate QoQ", impact: "medium" as const, category: "GDP" },
      { country: "JP", event: "BOJ Interest Rate Decision", impact: "high" as const, category: "Monetary Policy" },
      { country: "CN", event: "China GDP Growth Rate YoY", impact: "high" as const, category: "GDP" },
      { country: "DE", event: "German ZEW Economic Sentiment", impact: "medium" as const, category: "Sentiment" },
    ];

    // Generate events for the week
    for (let i = 0; i < 20; i++) {
      const template = eventTemplates[i % eventTemplates.length];
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + Math.floor(i / 4));
      
      const hour = 8 + Math.floor(Math.random() * 10);
      const minute = Math.floor(Math.random() * 60);

      events.push({
        id: `event-${i}`,
        date: eventDate,
        time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        country: template.country,
        event: template.event,
        impact: template.impact,
        forecast: template.impact === "high" ? (Math.random() * 5 - 2).toFixed(1) + "%" : undefined,
        previous: template.impact !== "low" ? (Math.random() * 5 - 2).toFixed(1) + "%" : undefined,
        actual: Math.random() > 0.5 ? (Math.random() * 5 - 2).toFixed(1) + "%" : undefined,
        category: template.category,
        isAlertEnabled: template.impact === "high",
      });
    }

    return events.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, []);

  useEffect(() => {
    // Fetch events on mount and when date changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setTimeout(() => {
      setEvents(generateMockEvents(selectedDate));
      setLoading(false);
    }, 500);
  }, [selectedDate, generateMockEvents]);

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    return event.impact === filter;
  });

  const todayEvents = filteredEvents.filter(
    (e) => e.date.toDateString() === selectedDate.toDateString()
  );
  const upcomingEvents = filteredEvents.filter(
    (e) => e.date > selectedDate
  ).slice(0, 10);
  const pastEvents = filteredEvents.filter(
    (e) => e.date < selectedDate
  ).slice(-5);

  const toggleAlert = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isAlertEnabled: !e.isAlertEnabled } : e
      )
    );
    const event = events.find((e) => e.id === id);
    toast.success(
      event?.isAlertEnabled
        ? isArabic
          ? "تم إيقاف التنبيه"
          : "Alert disabled"
        : isArabic
        ? "تم تفعيل التنبيه"
        : "Alert enabled"
    );
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            {isArabic ? "التقويم الاقتصادي" : "Economic Calendar"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic
              ? "تتبع الأحداث الاقتصادية المهمة"
              : "Track important economic events"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {isArabic ? "الكل" : "All"}
              </SelectItem>
              <SelectItem value="high">
                {isArabic ? "عالي" : "High"}
              </SelectItem>
              <SelectItem value="medium">
                {isArabic ? "متوسط" : "Medium"}
              </SelectItem>
              <SelectItem value="low">
                {isArabic ? "منخفض" : "Low"}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setEvents(generateMockEvents(selectedDate));
              setLoading(false);
            }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="font-medium">{formatDate(selectedDate)}</p>
              <p className="text-sm text-muted-foreground">
                {todayEvents.length} {isArabic ? "حدث" : "events"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Impact Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>{isArabic ? "تأثير عالي" : "High Impact"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>{isArabic ? "تأثير متوسط" : "Medium Impact"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>{isArabic ? "تأثير منخفض" : "Low Impact"}</span>
        </div>
      </div>

      {/* Events */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">
            <Clock className="h-4 w-4 mr-2" />
            {isArabic ? "اليوم" : "Today"}
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <TrendingUp className="h-4 w-4 mr-2" />
            {isArabic ? "القادمة" : "Upcoming"}
          </TabsTrigger>
          <TabsTrigger value="past">
            <TrendingDown className="h-4 w-4 mr-2" />
            {isArabic ? "السابقة" : "Past"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : todayEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{isArabic ? "لا توجد أحداث اليوم" : "No events today"}</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="divide-y">
                    {todayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="text-center">
                              <p className="text-lg font-bold">{event.time}</p>
                              <p className="text-xs text-muted-foreground">EST</p>
                            </div>
                            <div
                              className={`w-1 h-12 rounded-full ${IMPACT_COLORS[event.impact]}`}
                            />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">
                                  {COUNTRY_FLAGS[event.country] || "🌍"}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {event.country}
                                </Badge>
                              </div>
                              <p className="font-medium">{event.event}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <p className="text-muted-foreground">
                                  {isArabic ? "الفعلي" : "Actual"}
                                </p>
                                <p className="font-medium text-green-500">
                                  {event.actual || "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  {isArabic ? "التوقع" : "Forecast"}
                                </p>
                                <p className="font-medium">{event.forecast || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  {isArabic ? "السابق" : "Previous"}
                                </p>
                                <p className="font-medium">{event.previous || "-"}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() => toggleAlert(event.id)}
                            >
                              {event.isAlertEnabled ? (
                                <Bell className="h-4 w-4 text-primary" />
                              ) : (
                                <BellOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-10 rounded-full ${IMPACT_COLORS[event.impact]}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{COUNTRY_FLAGS[event.country]}</span>
                              <p className="font-medium text-sm">{event.event}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {event.date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
                                month: "short",
                                day: "numeric",
                              })} • {event.time} EST
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            event.impact === "high"
                              ? "border-red-500 text-red-500"
                              : event.impact === "medium"
                              ? "border-amber-500 text-amber-500"
                              : ""
                          }
                        >
                          {IMPACT_LABELS[isArabic ? "ar" : "en"][event.impact]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 hover:bg-muted/30 transition-colors opacity-75"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-10 rounded-full ${IMPACT_COLORS[event.impact]}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{COUNTRY_FLAGS[event.country]}</span>
                              <p className="font-medium text-sm">{event.event}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-muted-foreground">
                                {event.date.toLocaleDateString()}
                              </span>
                              <span className="text-green-500">
                                Actual: {event.actual}
                              </span>
                              <span>
                                Forecast: {event.forecast}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Market Status */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <Badge className="bg-green-500">Open</Badge>
            </div>
            <p className="font-medium">NYSE / NASDAQ</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "يغلق في 4:00 PM EST" : "Closes at 4:00 PM EST"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <Badge className="bg-green-500">Open</Badge>
            </div>
            <p className="font-medium">CME / CBOT</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "تداول SPX متاح" : "SPX trading available"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <Badge variant="outline" className="border-amber-500 text-amber-500">
                {isArabic ? "محدد" : "Limited"}
              </Badge>
            </div>
            <p className="font-medium">VIX</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "تقلب عالي متوقع" : "High volatility expected"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
