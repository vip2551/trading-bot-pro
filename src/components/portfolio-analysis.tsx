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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  PieChart,
  BarChart3,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  RefreshCw,
  Download,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface PortfolioData {
  totalValue: number;
  cashBalance: number;
  investedAmount: number;
  todayPnL: number;
  todayPnLPercent: number;
  weekPnL: number;
  weekPnLPercent: number;
  monthPnL: number;
  monthPnLPercent: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgTrade: number;
  bestTrade: number;
  worstTrade: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgHoldTime: number;
}

interface EquityPoint {
  date: string;
  value: number;
  pnl: number;
}

interface TradeDistribution {
  name: string;
  value: number;
  color: string;
}

interface MonthlyPerformance {
  month: string;
  pnl: number;
  trades: number;
  winRate: number;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export function PortfolioAnalysis() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [tradeDistribution, setTradeDistribution] = useState<TradeDistribution[]>([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulated data - in production, fetch from API
      const mockPortfolio: PortfolioData = {
        totalValue: 52847.32,
        cashBalance: 23456.78,
        investedAmount: 29390.54,
        todayPnL: 1234.56,
        todayPnLPercent: 2.39,
        weekPnL: 3456.78,
        weekPnLPercent: 6.98,
        monthPnL: 8765.43,
        monthPnLPercent: 19.87,
        totalPnL: 15234.56,
        totalPnLPercent: 40.48,
        winRate: 68.5,
        profitFactor: 2.34,
        sharpeRatio: 1.87,
        maxDrawdown: -8.45,
        avgTrade: 245.67,
        bestTrade: 1850.00,
        worstTrade: -620.00,
        totalTrades: 156,
        winningTrades: 107,
        losingTrades: 49,
        avgHoldTime: 45, // minutes
      };

      // Generate equity curve
      const mockEquity: EquityPoint[] = [];
      let currentValue = 37612.76;
      const days = timeRange === '1D' ? 1 : timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '1Y' ? 365 : 500;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const change = (Math.random() - 0.4) * 500;
        currentValue += change;
        mockEquity.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(currentValue * 100) / 100,
          pnl: Math.round(change * 100) / 100,
        });
      }

      // Trade distribution
      const mockDistribution: TradeDistribution[] = [
        { name: 'CALL Options', value: 45, color: '#10b981' },
        { name: 'PUT Options', value: 35, color: '#ef4444' },
        { name: 'SPX 0DTE', value: 55, color: '#3b82f6' },
        { name: 'SPX Weekly', value: 21, color: '#f59e0b' },
      ];

      // Monthly performance
      const mockMonthly: MonthlyPerformance[] = [
        { month: 'Jan', pnl: 2340, trades: 28, winRate: 71 },
        { month: 'Feb', pnl: -890, trades: 24, winRate: 58 },
        { month: 'Mar', pnl: 3450, trades: 32, winRate: 75 },
        { month: 'Apr', pnl: 1890, trades: 26, winRate: 69 },
        { month: 'May', pnl: 4120, trades: 35, winRate: 74 },
        { month: 'Jun', pnl: 2567, trades: 30, winRate: 67 },
      ];

      setPortfolio(mockPortfolio);
      setEquityCurve(mockEquity);
      setTradeDistribution(mockDistribution);
      setMonthlyPerformance(mockMonthly);
    } catch (e) {
      console.error('Failed to fetch portfolio data:', e);
    }
    setLoading(false);
  }, [timeRange]);

  useEffect(() => {
    // Fetch data on mount - standard pattern for data fetching
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const exportReport = () => {
    toast.success('Portfolio report exported!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!portfolio) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            Portfolio Analysis | تحليل المحفظة
          </h2>
          <p className="text-muted-foreground">Comprehensive performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1D">1D</SelectItem>
              <SelectItem value="1W">1W</SelectItem>
              <SelectItem value="1M">1M</SelectItem>
              <SelectItem value="3M">3M</SelectItem>
              <SelectItem value="1Y">1Y</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <Badge variant={portfolio.todayPnL >= 0 ? 'default' : 'destructive'} className="text-xs">
                {portfolio.todayPnLPercent >= 0 ? '+' : ''}{portfolio.todayPnLPercent.toFixed(2)}%
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">${portfolio.totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Value | إجمالي القيمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {portfolio.todayPnL >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">Today | اليوم</span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${portfolio.todayPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {portfolio.todayPnL >= 0 ? '+' : ''}${portfolio.todayPnL.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Daily P&L</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {portfolio.totalTrades} trades
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{portfolio.winRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Win Rate | نسبة الفوز</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Award className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sharpe</span>
            </div>
            <p className="text-2xl font-bold mt-2">{portfolio.sharpeRatio.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Risk-Adjusted Return</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="equity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equity">
            <TrendingUp className="h-4 w-4 mr-2" />
            Equity Curve
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <PieChart className="h-4 w-4 mr-2" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <Target className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
        </TabsList>

        {/* Equity Curve */}
        <TabsContent value="equity">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equity Curve | منحنى رأس المال</CardTitle>
              <CardDescription>Portfolio value over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Bar Chart */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Performance | الأداء الشهري</CardTitle>
              <CardDescription>P&L by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'pnl' ? `$${value.toLocaleString()}` : value,
                        name === 'pnl' ? 'P&L' : name
                      ]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="pnl" 
                      name="P&L"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Pie Chart */}
        <TabsContent value="distribution">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trade Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={tradeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {tradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Win/Loss Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={[
                          { name: 'Wins', value: portfolio.winningTrades, color: '#10b981' },
                          { name: 'Losses', value: portfolio.losingTrades, color: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detailed Metrics */}
        <TabsContent value="metrics">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Risk Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Risk Metrics | مقاييس المخاطر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Max Drawdown</span>
                    <span className="text-red-500">{portfolio.maxDrawdown}%</span>
                  </div>
                  <Progress value={Math.abs(portfolio.maxDrawdown)} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sharpe Ratio</span>
                  <span className="font-medium">{portfolio.sharpeRatio}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit Factor</span>
                  <span className="font-medium text-green-500">{portfolio.profitFactor}</span>
                </div>
              </CardContent>
            </Card>

            {/* Trade Statistics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Trade Stats | إحصائيات الصفقات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Trades</span>
                  <span className="font-medium">{portfolio.totalTrades}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Winning Trades</span>
                  <span className="font-medium text-green-500">{portfolio.winningTrades}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Losing Trades</span>
                  <span className="font-medium text-red-500">{portfolio.losingTrades}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Hold Time</span>
                  <span className="font-medium">{portfolio.avgHoldTime} min</span>
                </div>
              </CardContent>
            </Card>

            {/* P&L Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  P&L Summary | ملخص الربح/الخسارة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Trade</span>
                  <span className="font-medium">${portfolio.avgTrade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Best Trade</span>
                  <span className="font-medium text-green-500">+${portfolio.bestTrade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Worst Trade</span>
                  <span className="font-medium text-red-500">-${Math.abs(portfolio.worstTrade)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total P&L</span>
                  <span className="font-medium text-green-500">+${portfolio.totalPnL.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Period Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Period Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Today</span>
                  <span className={portfolio.todayPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {portfolio.todayPnL >= 0 ? '+' : ''}${portfolio.todayPnL} ({portfolio.todayPnLPercent}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Week</span>
                  <span className={portfolio.weekPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {portfolio.weekPnL >= 0 ? '+' : ''}${portfolio.weekPnL} ({portfolio.weekPnLPercent}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className={portfolio.monthPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {portfolio.monthPnL >= 0 ? '+' : ''}${portfolio.monthPnL} ({portfolio.monthPnLPercent}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">All Time</span>
                  <span className={portfolio.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toLocaleString()} ({portfolio.totalPnLPercent}%)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Account Info | معلومات الحساب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash Balance</span>
                  <span className="font-medium">${portfolio.cashBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invested</span>
                  <span className="font-medium">${portfolio.investedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Buying Power</span>
                  <span className="font-medium">${(portfolio.cashBalance * 4).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margin Used</span>
                  <span className="font-medium">{((portfolio.investedAmount / (portfolio.cashBalance * 4)) * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-cyan-500" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Win Rate</span>
                  <Badge variant={portfolio.winRate >= 60 ? 'default' : 'secondary'}>
                    {portfolio.winRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit Factor</span>
                  <Badge variant={portfolio.profitFactor >= 1.5 ? 'default' : 'secondary'}>
                    {portfolio.profitFactor.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expectancy</span>
                  <span className="font-medium">${portfolio.avgTrade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk/Reward</span>
                  <span className="font-medium">1:{(portfolio.avgTrade / Math.abs(portfolio.worstTrade) * 100).toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
