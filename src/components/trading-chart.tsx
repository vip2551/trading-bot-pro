"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CandlestickChart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Maximize2,
  Settings,
  Volume2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface TradingChartProps {
  symbol?: string;
}

export function TradingChart({ symbol = "SPX" }: TradingChartProps) {
  const { t } = useLanguage();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  const [timeframe, setTimeframe] = useState<"1" | "5" | "15" | "60" | "D">("5");
  const [chartType, setChartType] = useState<"candle" | "line" | "area">("candle");
  const [loading, setLoading] = useState(true);

  // Generate simulated candle data
  const generateCandleData = useCallback(() => {
    const data: CandlestickData[] = [];
    const volumeData: HistogramData[] = [];
    
    let basePrice = 5800; // SPX base
    let time = Math.floor(Date.now() / 1000) - 86400; // Start from yesterday
    
    const intervalMap: Record<string, number> = {
      "1": 60,
      "5": 300,
      "15": 900,
      "60": 3600,
      "D": 86400,
    };
    
    const interval = intervalMap[timeframe] || 300;
    const numCandles = timeframe === "D" ? 365 : timeframe === "60" ? 500 : 1000;
    
    for (let i = 0; i < numCandles; i++) {
      const volatility = 0.005 + Math.random() * 0.01;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const move = basePrice * volatility * direction;
      
      const open = basePrice;
      const close = basePrice + move;
      const high = Math.max(open, close) + Math.abs(move) * Math.random() * 0.5;
      const low = Math.min(open, close) - Math.abs(move) * Math.random() * 0.5;
      const volume = Math.floor(100000 + Math.random() * 500000);
      
      data.push({
        time: time as unknown as string,
        open,
        high,
        low,
        close,
      });
      
      volumeData.push({
        time: time as unknown as string,
        value: volume,
        color: close >= open ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
      });
      
      basePrice = close;
      time += interval;
    }
    
    return { candleData: data, volumeData };
  }, [timeframe]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(75, 85, 99, 0.2)" },
        horzLines: { color: "rgba(75, 85, 99, 0.2)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#3b82f6",
          width: 1,
          style: 2,
          labelBackgroundColor: "#3b82f6",
        },
        horzLine: {
          color: "#3b82f6",
          width: 1,
          style: 2,
          labelBackgroundColor: "#3b82f6",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(75, 85, 99, 0.3)",
      },
      timeScale: {
        borderColor: "rgba(75, 85, 99, 0.3)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Update data when timeframe changes
  useEffect(() => {
    // Update chart data when timeframe changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  // Update chart type
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;
    
    if (chartType === "line") {
      candlestickSeriesRef.current.applyOptions({
        lineStyle: 2,
      });
    } else {
      candlestickSeriesRef.current.applyOptions({
        upColor: "#10b981",
        downColor: "#ef4444",
      });
    }
  }, [chartType]);

  const refreshData = () => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    
    setLoading(true);
    const { candleData, volumeData } = generateCandleData();
    
    candlestickSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    
    chartRef.current?.timeScale().fitContent();
    setLoading(false);
  };

  const timeframes = [
    { value: "1", label: "1m" },
    { value: "5", label: "5m" },
    { value: "15", label: "15m" },
    { value: "60", label: "1H" },
    { value: "D", label: "1D" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CandlestickChart className="h-5 w-5" />
              {symbol} Chart
            </CardTitle>
            <Badge variant="outline" className="bg-green-500/10 text-green-500">
              Live
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Timeframe Selector */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={timeframe === tf.value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setTimeframe(tf.value as typeof timeframe)}
                >
                  {tf.label}
                </Button>
              ))}
            </div>
            
            {/* Chart Type */}
            <Select value={chartType} onValueChange={(v) => setChartType(v as typeof chartType)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="candle">Candle</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Actions */}
            <Button variant="outline" size="icon" onClick={refreshData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={chartContainerRef} className="h-[500px] w-full" />
        </div>
        
        {/* Chart Stats */}
        <div className="grid grid-cols-4 gap-4 p-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="font-medium">$5,820.50</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">High</p>
            <p className="font-medium text-green-500">$5,845.75</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Low</p>
            <p className="font-medium text-red-500">$5,805.25</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Close</p>
            <p className="font-medium">$5,835.00</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Options Chain Chart Component
export function OptionsChainChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Options Chain | سلسلة الخيارات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th colSpan={5} className="text-center py-2 text-green-500 font-medium">
                  CALLS
                </th>
                <th className="py-2 font-medium">Strike</th>
                <th colSpan={5} className="text-center py-2 text-red-500 font-medium">
                  PUTS
                </th>
              </tr>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 px-2">IV</th>
                <th className="py-2 px-2">Delta</th>
                <th className="py-2 px-2">Bid</th>
                <th className="py-2 px-2">Ask</th>
                <th className="py-2 px-2">Vol</th>
                <th className="py-2 px-2 bg-muted/50 font-medium">Strike</th>
                <th className="py-2 px-2">Vol</th>
                <th className="py-2 px-2">Bid</th>
                <th className="py-2 px-2">Ask</th>
                <th className="py-2 px-2">Delta</th>
                <th className="py-2 px-2">IV</th>
              </tr>
            </thead>
            <tbody>
              {[5820, 5825, 5830, 5835, 5840, 5845, 5850].map((strike) => {
                const isATM = strike === 5830;
                return (
                  <tr key={strike} className={`border-b ${isATM ? "bg-primary/5" : ""}`}>
                    {/* Call side */}
                    <td className="py-2 px-2 text-center">{(18 + Math.random() * 5).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-center text-green-500">{(0.25 + (strike - 5800) * 0.01).toFixed(2)}</td>
                    <td className="py-2 px-2 text-center">${(40 - (strike - 5800) * 2).toFixed(2)}</td>
                    <td className="py-2 px-2 text-center">${(42 - (strike - 5800) * 2).toFixed(2)}</td>
                    <td className="py-2 px-2 text-center">{Math.floor(100 + Math.random() * 500)}</td>
                    
                    {/* Strike */}
                    <td className="py-2 px-2 text-center font-medium bg-muted/50">
                      {strike}
                      {isATM && <Badge variant="outline" className="ml-1 text-xs">ATM</Badge>}
                    </td>
                    
                    {/* Put side */}
                    <td className="py-2 px-2 text-center">{Math.floor(100 + Math.random() * 500)}</td>
                    <td className="py-2 px-2 text-center">${(40 + (strike - 5800) * 2).toFixed(2)}</td>
                    <td className="py-2 px-2 text-center">${(42 + (strike - 5800) * 2).toFixed(2)}</td>
                    <td className="py-2 px-2 text-center text-red-500">{(-0.25 + (strike - 5800) * 0.01).toFixed(2)}</td>
                    <td className="py-2 px-2 text-center">{(18 + Math.random() * 5).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Options Greeks Chart
export function GreeksChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Position Greeks | إغريق المركز</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-blue-500">0.35</p>
            <p className="text-sm text-muted-foreground">Delta (Δ)</p>
            <p className="text-xs text-muted-foreground mt-1">Directional exposure</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-purple-500">0.12</p>
            <p className="text-sm text-muted-foreground">Gamma (Γ)</p>
            <p className="text-xs text-muted-foreground mt-1">Delta sensitivity</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-amber-500">-45.2</p>
            <p className="text-sm text-muted-foreground">Theta (Θ)</p>
            <p className="text-xs text-muted-foreground mt-1">Time decay/day</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-green-500">125.8</p>
            <p className="text-sm text-muted-foreground">Vega (ν)</p>
            <p className="text-xs text-muted-foreground mt-1">Vol sensitivity</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Greeks Risk</span>
            <Badge className="bg-amber-500">Moderate</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Your position is slightly bullish with moderate time decay. Consider managing theta by closing positions before the last hour of trading.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
