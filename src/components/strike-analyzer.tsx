"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Info,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface StrikeOption {
  strike: number;
  callPremium: number;
  putPremium: number;
  callDelta: number;
  putDelta: number;
  callVolume: number;
  putVolume: number;
  callOpenInterest: number;
  putOpenInterest: number;
  callSpread: number;
  putSpread: number;
  recommendation: 'RECOMMENDED' | 'GOOD' | 'HIGH_SPREAD' | 'LOW_LIQUIDITY';
}

interface StrikeAnalyzerProps {
  spotPrice?: number;
  contractPriceMin?: number;
  contractPriceMax?: number;
  targetDelta?: number;
}

export function StrikeAnalyzer({
  spotPrice = 5800,
  contractPriceMin = 300,
  contractPriceMax = 400,
  targetDelta = 0.30,
}: StrikeAnalyzerProps) {
  const { t } = useLanguage();
  const [optionType, setOptionType] = useState<"CALL" | "PUT">("CALL");
  const [strikes, setStrikes] = useState<StrikeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Generate simulated strike data (in production, this would come from IB API)
  const generateStrikes = useCallback(() => {
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      try {
        const atmStrike = Math.round(spotPrice / 5) * 5;
        const generatedStrikes: StrikeOption[] = [];

        // Generate strikes around ATM
        for (let i = -10; i <= 10; i++) {
          const strike = atmStrike + i * 5;

          // Simulate premium (ATM is highest, decreases OTM)
          const distanceFromATM = Math.abs(i);
          const basePremium = 350; // ATM premium base

          // Premium decreases as we go OTM
          const callPremium = Math.max(10, basePremium - distanceFromATM * 30 + (Math.random() * 20 - 10));
          const putPremium = Math.max(10, basePremium - distanceFromATM * 30 + (Math.random() * 20 - 10));

          // Delta simulation
          const callDelta = Math.max(0.05, Math.min(0.95, 0.50 + (i * -0.03) + (Math.random() * 0.05 - 0.025)));
          const putDelta = Math.max(-0.95, Math.min(-0.05, -0.50 + (i * -0.03) + (Math.random() * 0.05 - 0.025)));

          // Volume and OI (higher near ATM)
          const volumeFactor = Math.max(0.1, 1 - distanceFromATM * 0.08);
          const callVolume = Math.round(500 * volumeFactor + Math.random() * 200);
          const putVolume = Math.round(500 * volumeFactor + Math.random() * 200);
          const callOpenInterest = Math.round(2000 * volumeFactor + Math.random() * 500);
          const putOpenInterest = Math.round(2000 * volumeFactor + Math.random() * 500);

          // Spread (wider OTM)
          const spreadFactor = 1 + distanceFromATM * 0.15;
          const callSpread = Math.round((2 + distanceFromATM * 0.5) * spreadFactor * 100) / 100;
          const putSpread = Math.round((2 + distanceFromATM * 0.5) * spreadFactor * 100) / 100;

          // Determine recommendation
          let recommendation: StrikeOption['recommendation'] = 'GOOD';
          const premium = optionType === "CALL" ? callPremium : putPremium;
          const spread = optionType === "CALL" ? callSpread : putSpread;
          const volume = optionType === "CALL" ? callVolume : putVolume;

          if (premium >= contractPriceMin && premium <= contractPriceMax && spread < 3 && volume > 300) {
            recommendation = 'RECOMMENDED';
          } else if (spread > 5) {
            recommendation = 'HIGH_SPREAD';
          } else if (volume < 100) {
            recommendation = 'LOW_LIQUIDITY';
          }

          generatedStrikes.push({
            strike,
            callPremium: Math.round(callPremium * 100) / 100,
            putPremium: Math.round(putPremium * 100) / 100,
            callDelta: Math.round(callDelta * 100) / 100,
            putDelta: Math.round(putDelta * 100) / 100,
            callVolume,
            putVolume,
            callOpenInterest,
            putOpenInterest,
            callSpread,
            putSpread,
            recommendation,
          });
        }

        // Sort by recommendation and premium fit
        generatedStrikes.sort((a, b) => {
          const premiumA = optionType === "CALL" ? a.callPremium : a.putPremium;
          const premiumB = optionType === "CALL" ? b.callPremium : b.putPremium;

          // Prioritize recommended
          if (a.recommendation === 'RECOMMENDED' && b.recommendation !== 'RECOMMENDED') return -1;
          if (b.recommendation === 'RECOMMENDED' && a.recommendation !== 'RECOMMENDED') return 1;

          // Then by how close to target price range
          const targetMid = (contractPriceMin + contractPriceMax) / 2;
          return Math.abs(premiumA - targetMid) - Math.abs(premiumB - targetMid);
        });

        setStrikes(generatedStrikes);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error generating strikes:', error);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [spotPrice, contractPriceMin, contractPriceMax, optionType]);

  useEffect(() => {
    generateStrikes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateStrikes]);

  const getRecommendationBadge = useCallback((rec: StrikeOption['recommendation']) => {
    switch (rec) {
      case 'RECOMMENDED':
        return (
          <Badge className="bg-green-500/10 text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('recommended')}
          </Badge>
        );
      case 'GOOD':
        return (
          <Badge className="bg-blue-500/10 text-blue-500">
            <Info className="h-3 w-3 mr-1" />
            {t('goodChoice')}
          </Badge>
        );
      case 'HIGH_SPREAD':
        return (
          <Badge className="bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t('highSpread')}
          </Badge>
        );
      case 'LOW_LIQUIDITY':
        return (
          <Badge className="bg-red-500/10 text-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            {t('lowLiquidity')}
          </Badge>
        );
    }
  }, [t]);

  const recommendedStrikes = useMemo(() => 
    strikes.filter(s => s.recommendation === 'RECOMMENDED'),
    [strikes]
  );

  const atmStrike = useMemo(() => 
    Math.round(spotPrice / 5) * 5,
    [spotPrice]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t('strikeAnalyzer')}
          </h3>
          <p className="text-sm text-muted-foreground">
            SPX Spot: <span className="font-bold">${spotPrice.toFixed(2)}</span>
            {" | "}
            Target: ${contractPriceMin} - ${contractPriceMax}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={optionType} onValueChange={(v) => setOptionType(v as "CALL" | "PUT")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CALL">
                <TrendingUp className="h-4 w-4 mr-1 inline text-green-500" />
                CALL
              </SelectItem>
              <SelectItem value="PUT">
                <TrendingDown className="h-4 w-4 mr-1 inline text-red-500" />
                PUT
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={generateStrikes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Recommendations */}
      {recommendedStrikes.length > 0 && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              Top Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recommendedStrikes.slice(0, 5).map((s) => (
                <Badge key={s.strike} className="bg-green-500/20 text-green-600 text-base py-1 px-3">
                  {s.strike} ({optionType === "CALL" ? `$${s.callPremium}` : `$${s.putPremium}`})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strike Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('strikePrice')}</TableHead>
                  <TableHead>{t('premium')}</TableHead>
                  <TableHead>{t('delta')}</TableHead>
                  <TableHead>{t('volume')}</TableHead>
                  <TableHead>{t('openInterest')}</TableHead>
                  <TableHead>{t('spread')}</TableHead>
                  <TableHead>{t('recommendation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strikes.map((strike) => {
                  const premium = optionType === "CALL" ? strike.callPremium : strike.putPremium;
                  const delta = optionType === "CALL" ? strike.callDelta : strike.putDelta;
                  const volume = optionType === "CALL" ? strike.callVolume : strike.putVolume;
                  const oi = optionType === "CALL" ? strike.callOpenInterest : strike.putOpenInterest;
                  const spread = optionType === "CALL" ? strike.callSpread : strike.putSpread;

                  return (
                    <TableRow
                      key={strike.strike}
                      className={strike.recommendation === 'RECOMMENDED' ? 'bg-green-500/5' : ''}
                    >
                      <TableCell className="font-medium">
                        {strike.strike}
                        {strike.strike === atmStrike && (
                          <Badge variant="outline" className="ml-2 text-xs">ATM</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={premium >= contractPriceMin && premium <= contractPriceMax ? 'text-green-500 font-bold' : ''}>
                          ${premium.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{Math.abs(delta).toFixed(2)}</TableCell>
                      <TableCell>{volume.toLocaleString()}</TableCell>
                      <TableCell>{oi.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={spread > 5 ? 'text-red-500' : spread > 3 ? 'text-amber-500' : 'text-green-500'}>
                          {spread.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{getRecommendationBadge(strike.recommendation)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Last Update */}
      {lastUpdate && (
        <p className="text-xs text-muted-foreground text-right">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
