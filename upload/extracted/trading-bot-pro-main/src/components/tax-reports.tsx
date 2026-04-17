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
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Percent,
  Calculator,
  FileSpreadsheet,
  File,
  CheckCircle,
  Printer,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export function TaxReports() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedQuarter, setSelectedQuarter] = useState("all");

  // Mock data
  const yearlyData = {
    totalTrades: 245,
    winningTrades: 168,
    losingTrades: 77,
    totalProceeds: 156250,
    totalCost: 148500,
    realizedGain: 7750,
    shortTermGains: 8200,
    longTermGains: 0,
    realizedLoss: -450,
    washSales: -120,
    netGain: 7630,
    fees: 1250,
  };

  const exportToCSV = useCallback(() => {
    const headers = [
      "Date",
      "Symbol",
      "Direction",
      "Strike",
      "Quantity",
      "Entry Price",
      "Exit Price",
      "Proceeds",
      "Cost",
      "Gain/Loss",
      "Term",
    ];
    const csvContent = [
      headers.join(","),
      [
        "2024-01-15,SPX,CALL,5830,5,350,420,2100,1750,350,Short",
        "2024-01-16,SPX,PUT,5820,3,320,250,750,960,-210,Short",
        "2024-01-17,SPX,CALL,5840,2,280,350,700,560,140,Short",
      ].join("\n"),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trading-report-${selectedYear}.csv`;
    a.click();
    toast.success(isArabic ? "تم التصدير" : "Exported");
  }, [selectedYear, isArabic]);

  const exportToPDF = useCallback(() => {
    toast.success(isArabic ? "جاري تحضير التقرير..." : "Preparing report...");
  }, [isArabic]);

  const printReport = useCallback(() => {
    window.print();
    toast.success(isArabic ? "جاري الطباعة..." : "Printing...");
  }, [isArabic]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {isArabic ? "تقارير الضرائب" : "Tax Reports"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic
              ? "تصدير تقارير للإقرار الضريبي"
              : "Export reports for tax filing"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {isArabic ? "السنة كاملة" : "Full Year"}
              </SelectItem>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "إجمالي الصفقات" : "Total Trades"}
              </span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{yearlyData.totalTrades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "إجمالي العائدات" : "Total Proceeds"}
              </span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              ${yearlyData.totalProceeds.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "إجمالي التكلفة" : "Total Cost"}
              </span>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              ${yearlyData.totalCost.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "صافي الربح" : "Net Gain"}
              </span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">
              +${yearlyData.netGain.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isArabic ? "ملخص الضرائب" : "Tax Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {isArabic ? "الأرباح" : "Gains"}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isArabic ? "أرباح قصيرة الأجل" : "Short-term Gains"}
                  </span>
                  <span className="font-medium text-green-500">
                    +${yearlyData.shortTermGains.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isArabic ? "أرباح طويلة الأجل" : "Long-term Gains"}
                  </span>
                  <span className="font-medium">
                    ${yearlyData.longTermGains.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">
                    {isArabic ? "إجمالي الأرباح" : "Total Gains"}
                  </span>
                  <span className="font-bold text-green-500">
                    +${yearlyData.realizedGain.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-red-500 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                {isArabic ? "الخسائر" : "Losses"}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isArabic ? "خسائر محققة" : "Realized Losses"}
                  </span>
                  <span className="font-medium text-red-500">
                    ${yearlyData.realizedLoss.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isArabic ? "خسائر Wash Sales" : "Wash Sales"}
                  </span>
                  <span className="font-medium text-red-500">
                    ${yearlyData.washSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isArabic ? "العمولات والرسوم" : "Fees & Commissions"}
                  </span>
                  <span className="font-medium">${yearlyData.fees.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {isArabic ? "صافي الربح/الخسارة الخاضع للضريبة" : "Net Taxable Gain/Loss"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? "هذا المبلغ يُضاف إلى دخلك السنوي"
                    : "This amount is added to your annual income"}
                </p>
              </div>
              <p className="text-3xl font-bold text-green-500">
                +${yearlyData.netGain.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isArabic ? "خيارات التصدير" : "Export Options"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={exportToCSV}
            >
              <FileSpreadsheet className="h-6 w-6 text-green-500" />
              <span>Export CSV</span>
              <span className="text-xs text-muted-foreground">
                {isArabic ? "للإكسل" : "For Excel"}
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={exportToPDF}
            >
              <File className="h-6 w-6 text-red-500" />
              <span>Export PDF</span>
              <span className="text-xs text-muted-foreground">
                {isArabic ? "للطباعة" : "For Printing"}
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={printReport}
            >
              <Printer className="h-6 w-6 text-blue-500" />
              <span>{isArabic ? "طباعة" : "Print"}</span>
              <span className="text-xs text-muted-foreground">
                {isArabic ? "مباشرة" : "Direct"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            ⚠️{" "}
            {isArabic
              ? "تنبيه: هذه التقارير للأغراض المرجعية فقط. يُنصح باستشارة محاسب ضرائب مؤهل."
              : "Disclaimer: These reports are for reference only. Consult a qualified tax professional."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
