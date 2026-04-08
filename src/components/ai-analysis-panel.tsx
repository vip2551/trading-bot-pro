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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  Shield,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

interface AIAnalysisPanelProps {
  userId: string;
}

type AnalysisType = 'general' | 'performance' | 'market' | 'risk';

export function AIAnalysisPanel({ userId }: AIAnalysisPanelProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AnalysisType>('general');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const getAnalysis = useCallback(async (type: AnalysisType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/analysis?userId=${userId}&type=${type}`);
      const data = await res.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        setActiveTab(type);
      } else {
        toast.error(data.error || 'Failed to get analysis');
      }
    } catch (e) {
      toast.error('Failed to connect to AI');
    }
    setLoading(false);
  }, [userId]);

  const askQuestion = useCallback(async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    const userQuestion = question;
    setQuestion('');
    
    setChatHistory(prev => [...prev, { role: 'user', content: userQuestion }]);
    
    try {
      const res = await fetch('/api/ai/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, question: userQuestion }),
      });
      const data = await res.json();
      
      if (data.success) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        toast.error(data.error || 'Failed to get answer');
      }
    } catch (e) {
      toast.error('Failed to connect to AI');
    }
    setLoading(false);
  }, [userId, question]);

  const analysisTypes = [
    { type: 'general' as const, label: 'Quick Analysis', labelAr: 'تحليل سريع', icon: Sparkles },
    { type: 'performance' as const, label: 'Performance', labelAr: 'الأداء', icon: TrendingUp },
    { type: 'market' as const, label: 'Market', labelAr: 'السوق', icon: Target },
    { type: 'risk' as const, label: 'Risk', labelAr: 'المخاطر', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI Trading Assistant | مساعد التداول الذكي
          </h2>
          <p className="text-muted-foreground">Get personalized trading insights and recommendations</p>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by AI
        </Badge>
      </div>

      {/* Analysis Type Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {analysisTypes.map(({ type, label, labelAr, icon: Icon }) => (
          <Button
            key={type}
            variant={activeTab === type ? 'default' : 'outline'}
            className="h-auto py-4 flex flex-col gap-1"
            onClick={() => getAnalysis(type)}
            disabled={loading}
          >
            <Icon className="h-5 w-5" />
            <span className="text-sm">{label}</span>
            <span className="text-xs text-muted-foreground">{labelAr}</span>
          </Button>
        ))}
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analysis | التحليل
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Ask AI | اسأل الذكاء
          </TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {analysisTypes.find(a => a.type === activeTab)?.icon && 
                    (() => {
                      const Icon = analysisTypes.find(a => a.type === activeTab)!.icon;
                      return <Icon className="h-5 w-5" />;
                    })()
                  }
                  {analysisTypes.find(a => a.type === activeTab)?.label} Analysis
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => getAnalysis(activeTab)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-purple-500 animate-pulse" />
                    <p className="text-muted-foreground">Analyzing your trading data...</p>
                    <p className="text-sm text-muted-foreground">جاري تحليل بيانات التداول...</p>
                  </div>
                </div>
              ) : analysis ? (
                <ScrollArea className="h-96">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {analysis.split('\n').map((line, i) => {
                      // Format headers
                      if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
                        const level = line.match(/^#+/)?.[0].length || 1;
                        const text = line.replace(/^#+\s*/, '');
                        const HeaderTag = `h${Math.min(level, 3)}` as keyof JSX.IntrinsicElements;
                        return (
                          <HeaderTag key={i} className="font-bold mt-4 mb-2 text-primary">
                            {text}
                          </HeaderTag>
                        );
                      }
                      
                      // Format bullet points
                      if (line.startsWith('- ') || line.startsWith('• ')) {
                        return (
                          <div key={i} className="flex items-start gap-2 ml-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                            <span>{line.replace(/^[-•]\s*/, '')}</span>
                          </div>
                        );
                      }
                      
                      // Format numbered lists
                      if (/^\d+\./.test(line)) {
                        return (
                          <div key={i} className="flex items-start gap-2 ml-2">
                            <span className="font-medium text-primary shrink-0">
                              {line.match(/^\d+\./)?.[0]}
                            </span>
                            <span>{line.replace(/^\d+\.\s*/, '')}</span>
                          </div>
                        );
                      }
                      
                      // Empty lines
                      if (!line.trim()) {
                        return <div key={i} className="h-2" />;
                      }
                      
                      // Regular text
                      return <p key={i} className="my-1">{line}</p>;
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click an analysis type above to get started</p>
                  <p className="text-sm">اضغط على نوع التحليل أعلاه للبدء</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ask AI Trading Questions
              </CardTitle>
              <CardDescription>
                Get personalized answers about your trading | احصل على إجابات مخصصة حول تداولك
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Ask me anything about your trading!</p>
                      <p className="text-sm mb-4">اسألني أي شيء عن تداولك!</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          "How can I improve my win rate?",
                          "What's my biggest risk?",
                          "Suggest today's strategy",
                        ].map((q) => (
                          <Button
                            key={q}
                            variant="outline"
                            size="sm"
                            onClick={() => setQuestion(q)}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                            <Brain className="h-3 w-3" />
                            AI Assistant
                          </div>
                        )}
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 animate-pulse text-purple-500" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your trading... | اسأل عن تداولك..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                  disabled={loading}
                />
                <Button onClick={askQuestion} disabled={loading || !question.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Strengths Detected</p>
                <p className="text-xs text-muted-foreground">نقاط القوة المكتشفة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium">Areas to Improve</p>
                <p className="text-xs text-muted-foreground">مجالات للتحسين</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-purple-500" />
              <div>
                <p className="font-medium">Smart Suggestions</p>
                <p className="text-xs text-muted-foreground">اقتراحات ذكية</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
