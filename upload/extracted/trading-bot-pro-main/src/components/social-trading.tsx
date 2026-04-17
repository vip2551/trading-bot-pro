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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Share2,
  Copy,
  TrendingUp,
  TrendingDown,
  Star,
  Eye,
  MessageCircle,
  Heart,
  Bookmark,
  ExternalLink,
  Crown,
  CheckCircle,
  AlertTriangle,
  Lock,
  Globe,
  Zap,
  BarChart3,
  Target,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface Strategy {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  performance: {
    winRate: number;
    totalReturn: number;
    maxDrawdown: number;
    trades: number;
  };
  followers: number;
  isFollowing: boolean;
  isPremium: boolean;
  tags: string[];
  riskLevel: "Low" | "Medium" | "High";
  createdAt: Date;
}

interface TradeIdea {
  id: string;
  symbol: string;
  direction: "CALL" | "PUT";
  strike: number;
  entry: number;
  target: number;
  stopLoss: number;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  timestamp: Date;
  analysis: string;
}

export function SocialTrading() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [activeTab, setActiveTab] = useState<"strategies" | "ideas" | "following">("strategies");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Mock data for strategies
  const [strategies] = useState<Strategy[]>([
    {
      id: "1",
      name: "SPX 0DTE Scalper",
      description: isArabic ? "استراتيجية سكالبينج سريعة على SPX" : "Fast scalping strategy on SPX 0DTE options",
      author: { name: "TraderPro", avatar: "", verified: true },
      performance: { winRate: 72, totalReturn: 145, maxDrawdown: 12, trades: 342 },
      followers: 1250,
      isFollowing: false,
      isPremium: true,
      tags: ["SPX", "0DTE", "Scalping"],
      riskLevel: "High",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "Delta Neutral Hedger",
      description: isArabic ? "استراتيجية تحوط محايدة دلتا" : "Delta neutral hedging strategy for consistent income",
      author: { name: "OptionsGuru", avatar: "", verified: true },
      performance: { winRate: 85, totalReturn: 48, maxDrawdown: 5, trades: 156 },
      followers: 890,
      isFollowing: true,
      isPremium: false,
      tags: ["Hedging", "Income", "Low Risk"],
      riskLevel: "Low",
      createdAt: new Date("2024-02-01"),
    },
    {
      id: "3",
      name: "VIX Crash Collector",
      description: isArabic ? "جمع الأقساط عند ارتفاع VIX" : "Collect premium when VIX spikes",
      author: { name: "VolTrader", avatar: "", verified: false },
      performance: { winRate: 68, totalReturn: 95, maxDrawdown: 18, trades: 89 },
      followers: 456,
      isFollowing: false,
      isPremium: true,
      tags: ["VIX", "Premium", "Mean Reversion"],
      riskLevel: "Medium",
      createdAt: new Date("2024-03-10"),
    },
  ]);

  // Mock data for trade ideas
  const [tradeIdeas] = useState<TradeIdea[]>([
    {
      id: "1",
      symbol: "SPX",
      direction: "CALL",
      strike: 5850,
      entry: 350,
      target: 450,
      stopLoss: 280,
      author: { name: "DayTrader1", avatar: "" },
      likes: 45,
      comments: 12,
      timestamp: new Date(Date.now() - 3600000),
      analysis: isArabic ? "دعم قوي عند 5840، مستهدف 5870" : "Strong support at 5840, targeting 5870",
    },
    {
      id: "2",
      symbol: "SPX",
      direction: "PUT",
      strike: 5820,
      entry: 280,
      target: 380,
      stopLoss: 210,
      author: { name: "BearTrader", avatar: "" },
      likes: 32,
      comments: 8,
      timestamp: new Date(Date.now() - 7200000),
      analysis: isArabic ? "مقاومة عند 5850، توقع ارتداد" : "Resistance at 5850, expecting pullback",
    },
  ]);

  const toggleFollow = useCallback((strategyId: string) => {
    toast.success(isArabic ? "تم تحديث المتابعة" : "Follow status updated");
  }, [isArabic]);

  const shareStrategy = useCallback((strategyId: string) => {
    const url = `${window.location.origin}/strategy/${strategyId}`;
    setShareUrl(url);
    setShowShareDialog(true);
  }, []);

  const copyShareUrl = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    toast.success(isArabic ? "تم نسخ الرابط" : "Link copied to clipboard");
  }, [shareUrl, isArabic]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "text-green-500 bg-green-500/10";
      case "Medium": return "text-amber-500 bg-amber-500/10";
      case "High": return "text-red-500 bg-red-500/10";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {isArabic ? "التداول الاجتماعي" : "Social Trading"}
          </h2>
          <p className="text-muted-foreground">
            {isArabic ? "شارك وتابع استراتيجيات المتداولين" : "Share and follow traders' strategies"}
          </p>
        </div>
        <Button onClick={() => setShowShareDialog(true)}>
          <Share2 className="h-4 w-4 mr-2" />
          {isArabic ? "شارك استراتيجيتي" : "Share My Strategy"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">2,596</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "المتابَعين" : "Followers"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">1,234</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "المتابَعون" : "Following"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">89%</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "نسبة النجاح" : "Success Rate"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-5 w-5 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">#42</p>
            <p className="text-xs text-muted-foreground">
              {isArabic ? "الترتيب" : "Ranking"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "strategies" ? "default" : "ghost"}
          onClick={() => setActiveTab("strategies")}
        >
          <Target className="h-4 w-4 mr-2" />
          {isArabic ? "الاستراتيجيات" : "Strategies"}
        </Button>
        <Button
          variant={activeTab === "ideas" ? "default" : "ghost"}
          onClick={() => setActiveTab("ideas")}
        >
          <Zap className="h-4 w-4 mr-2" />
          {isArabic ? "أفكار التداول" : "Trade Ideas"}
        </Button>
        <Button
          variant={activeTab === "following" ? "default" : "ghost"}
          onClick={() => setActiveTab("following")}
        >
          <Users className="h-4 w-4 mr-2" />
          {isArabic ? "المتابَعون" : "Following"}
        </Button>
      </div>

      {/* Strategies Tab */}
      {activeTab === "strategies" && (
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={strategy.author.avatar} />
                        <AvatarFallback>{strategy.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{strategy.name}</p>
                          {strategy.author.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                          {strategy.isPremium && (
                            <Crown className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isArabic ? "بواسطة" : "by"} {strategy.author.name}
                        </p>
                      </div>
                    </div>
                    <Badge className={getRiskColor(strategy.riskLevel)}>
                      {strategy.riskLevel} Risk
                    </Badge>
                  </div>

                  <p className="text-sm mt-3">{strategy.description}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {strategy.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 bg-muted/50 divide-x">
                  <div className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "نسبة النجاح" : "Win Rate"}
                    </p>
                    <p className="font-bold text-green-500">{strategy.performance.winRate}%</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "العائد" : "Return"}
                    </p>
                    <p className="font-bold text-green-500">+{strategy.performance.totalReturn}%</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "السحب الأقصى" : "Max DD"}
                    </p>
                    <p className="font-bold text-red-500">-{strategy.performance.maxDrawdown}%</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "الصفقات" : "Trades"}
                    </p>
                    <p className="font-bold">{strategy.performance.trades}</p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {strategy.followers.toLocaleString()} {isArabic ? "متابع" : "followers"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareStrategy(strategy.id)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={strategy.isFollowing ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleFollow(strategy.id)}
                    >
                      {strategy.isFollowing ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {isArabic ? "متابَع" : "Following"}
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-1" />
                          {isArabic ? "متابعة" : "Follow"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trade Ideas Tab */}
      {activeTab === "ideas" && (
        <div className="space-y-4">
          {tradeIdeas.map((idea) => (
            <Card key={idea.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={idea.author.avatar} />
                      <AvatarFallback>{idea.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{idea.author.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {Math.floor((Date.now() - idea.timestamp.getTime()) / 60000)}m ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{idea.symbol}</Badge>
                    <Badge className={idea.direction === "CALL" ? "bg-green-500" : "bg-red-500"}>
                      {idea.direction === "CALL" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {idea.direction}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3 p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground">{isArabic ? "الاسترايك" : "Strike"}</p>
                    <p className="font-bold">{idea.strike}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isArabic ? "الدخول" : "Entry"}</p>
                    <p className="font-bold">${idea.entry}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isArabic ? "الهدف" : "Target"}</p>
                    <p className="font-bold text-green-500">${idea.target}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isArabic ? "الوقف" : "Stop"}</p>
                    <p className="font-bold text-red-500">${idea.stopLoss}</p>
                  </div>
                </div>

                <p className="text-sm mb-3">{idea.analysis}</p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4 mr-1" />
                      {idea.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {idea.comments}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    {isArabic ? "نسخ الصفقة" : "Copy Trade"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Following Tab */}
      {activeTab === "following" && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">
              {isArabic ? "لمتابَعون" : "Your Following"}
            </p>
            <p className="text-muted-foreground">
              {isArabic
                ? "تابع المتداولين المميزين لترى أفكارهم"
                : "Follow top traders to see their ideas"}
            </p>
            <Button className="mt-4">
              <Globe className="h-4 w-4 mr-2" />
              {isArabic ? "اكتشف المتداولين" : "Discover Traders"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              {isArabic ? "مشاركة الاستراتيجية" : "Share Strategy"}
            </DialogTitle>
            <DialogDescription>
              {isArabic
                ? "شارك استراتيجيتك مع المتداولين الآخرين"
                : "Share your strategy with other traders"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {isArabic ? "مشاركة عامة" : "Public Sharing"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic
                      ? "يمكن للجميع رؤية استراتيجيتك"
                      : "Everyone can see your strategy"}
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? "رابط المشاركة" : "Share Link"}</Label>
              <div className="flex gap-2">
                <Input value={shareUrl || "https://tradingbot.pro/strategy/..."} readOnly />
                <Button onClick={copyShareUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-500">
                    {isArabic ? "تنبيه" : "Notice"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isArabic
                      ? "لا تشارك معلومات حساسة مثل مفاتيح API أو كلمات المرور"
                      : "Never share sensitive info like API keys or passwords"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={() => setShowShareDialog(false)}>
              {isArabic ? "تم" : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
