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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Wifi,
  Send,
  RefreshCw,
  Activity,
  Clock,
  MemoryStick,
  Server,
  Zap,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface HealthData {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  uptime: number;
  services: {
    database: { status: boolean; latency?: number; error?: string };
    ib: { status: boolean; latency?: number; error?: string };
    telegram: { status: boolean; error?: string };
    websocket: { status: boolean; error?: string };
  };
  system: {
    memory: { used: number; total: number; percentage: number };
    cpu: number;
  };
  trading: {
    openTrades: number;
    pendingTrades: number;
    todayTrades: number;
    todayPnL: number;
    dailyLossLimitReached: boolean;
  };
  lastErrors: Array<{ time: string; message: string; source: string }>;
}

export function HealthDashboard() {
  const { t } = useLanguage();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error('Failed to fetch health:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string) => {
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      toast[data.success ? 'success' : 'error'](data.message || data.error);
      fetchHealth();
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (!health) return null;
    
    switch (health.status) {
      case 'HEALTHY':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t('healthStatusGood')}</Badge>;
      case 'WARNING':
        return <Badge className="bg-amber-500"><AlertTriangle className="h-3 w-3 mr-1" />{t('healthStatusWarning')}</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />{t('healthStatusCritical')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!health) {
    return (
      <Card className="border-red-500">
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p>Failed to load health status</p>
          <Button onClick={fetchHealth} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('healthStatus')}
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Last updated: {new Date(health.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { setRefreshing(true); fetchHealth(); }}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAction('PING_IB')}>
              <Wifi className="h-4 w-4 mr-2" />
              {t('pingIB')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAction('TEST_TELEGRAM')}>
              <Send className="h-4 w-4 mr-2" />
              {t('testTelegram')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              {getStatusIcon(health.services.database.status)}
            </div>
            <p className="text-sm font-medium">{t('databaseStatus')}</p>
            {health.services.database.latency && (
              <p className="text-xs text-muted-foreground">
                Latency: {health.services.database.latency}ms
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              {getStatusIcon(health.services.ib.status)}
            </div>
            <p className="text-sm font-medium">{t('ibConnection')}</p>
            {health.services.ib.error && (
              <p className="text-xs text-red-500">{health.services.ib.error}</p>
            )}
            {health.services.ib.latency && (
              <p className="text-xs text-muted-foreground">
                Latency: {health.services.ib.latency}ms
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Send className="h-5 w-5 text-muted-foreground" />
              {getStatusIcon(health.services.telegram.status)}
            </div>
            <p className="text-sm font-medium">{t('telegramStatus')}</p>
            {health.services.telegram.error && (
              <p className="text-xs text-amber-500">{health.services.telegram.error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-muted-foreground" />
              {getStatusIcon(health.services.websocket.status)}
            </div>
            <p className="text-sm font-medium">{t('websocketStatus')}</p>
            {health.services.websocket.error && (
              <p className="text-xs text-amber-500">{health.services.websocket.error}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System & Trading */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* System Resources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">System Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" />
                  {t('memoryUsage')}
                </span>
                <span>{health.system.memory.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={health.system.memory.percentage} />
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(health.system.memory.used)} / {formatBytes(health.system.memory.total)}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('uptime')}
              </span>
              <span className="font-mono">{formatUptime(health.uptime)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Trading Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Trading Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{health.trading.openTrades}</p>
                <p className="text-xs text-muted-foreground">{t('openTradesCount')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{health.trading.todayTrades}</p>
                <p className="text-xs text-muted-foreground">Today's Trades</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className={`text-2xl font-bold ${health.trading.todayPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${health.trading.todayPnL.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{t('todayPnL')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Badge variant={health.trading.dailyLossLimitReached ? "destructive" : "outline"}>
                  {health.trading.dailyLossLimitReached ? t('limitReached') : 'OK'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{t('dailyLimit')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      {health.lastErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t('lastErrors')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.lastErrors.map((error, i) => (
                <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{error.source}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(error.time).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{error.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
