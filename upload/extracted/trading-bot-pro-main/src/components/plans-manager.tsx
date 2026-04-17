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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Star,
  Tag,
  Percent,
  DollarSign,
  Clock,
  Users,
  Zap,
  Fish,
  Brain,
  BarChart3,
  LineChart,
  TestTube,
  Bell,
  HeadphonesIcon,
  Code,
  CheckCircle,
  XCircle,
  Gift,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  displayNameEn?: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  originalPriceMonthly?: number;
  originalPriceYearly?: number;
  discountPercent?: number;
  discountEnabled: boolean;
  discountExpiresAt?: string;
  discountLabel?: string;
  maxTradesPerDay: number;
  maxActiveTrades: number;
  trialDays: number;
  features?: string[];
  featuresAr?: string[];
  hasAIAnalysis: boolean;
  hasWhaleTracker: boolean;
  hasAdvancedCharts: boolean;
  hasPaperTrading: boolean;
  hasBacktesting: boolean;
  hasTelegramNotif: boolean;
  hasPrioritySupport: boolean;
  hasAPIAccess: boolean;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  badgeText?: string;
  badgeColor?: string;
  subscriberCount?: number;
}

interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxUses?: number;
  currentUses: number;
  maxUsesPerUser: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  minPurchaseAmount?: number;
  forNewUsersOnly: boolean;
}

export function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit Plan Dialog
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // Promo Code Dialog
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<"plans" | "promo">("plans");

  // Plan Form State
  const [planForm, setPlanForm] = useState({
    name: "",
    displayName: "",
    displayNameEn: "",
    description: "",
    priceMonthly: "0",
    priceYearly: "0",
    originalPriceMonthly: "",
    originalPriceYearly: "",
    discountPercent: "",
    discountEnabled: false,
    discountLabel: "",
    maxTradesPerDay: "5",
    maxActiveTrades: "2",
    trialDays: "0",
    features: "",
    featuresAr: "",
    hasAIAnalysis: false,
    hasWhaleTracker: false,
    hasAdvancedCharts: false,
    hasPaperTrading: false,
    hasBacktesting: false,
    hasTelegramNotif: true,
    hasPrioritySupport: false,
    hasAPIAccess: false,
    isPopular: false,
    isActive: true,
    badgeText: "",
    badgeColor: "green",
  });

  // Promo Form State
  const [promoForm, setPromoForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENT",
    discountValue: "10",
    maxUses: "",
    maxUsesPerUser: "1",
    validFrom: "",
    validUntil: "",
    isActive: true,
    minPurchaseAmount: "",
    forNewUsersOnly: false,
  });

  useEffect(() => {
    fetchPlans();
    fetchPromoCodes();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {
      console.log("Could not fetch plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch("/api/plans/promo");
      const data = await res.json();
      setPromoCodes(data.promoCodes || []);
    } catch {
      console.log("Could not fetch promo codes");
    }
  };

  const openPlanDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        displayName: plan.displayName,
        displayNameEn: plan.displayNameEn || "",
        description: plan.description || "",
        priceMonthly: String(plan.priceMonthly),
        priceYearly: String(plan.priceYearly),
        originalPriceMonthly: plan.originalPriceMonthly ? String(plan.originalPriceMonthly) : "",
        originalPriceYearly: plan.originalPriceYearly ? String(plan.originalPriceYearly) : "",
        discountPercent: plan.discountPercent ? String(plan.discountPercent) : "",
        discountEnabled: plan.discountEnabled,
        discountLabel: plan.discountLabel || "",
        maxTradesPerDay: String(plan.maxTradesPerDay),
        maxActiveTrades: String(plan.maxActiveTrades),
        trialDays: String(plan.trialDays),
        features: plan.features ? plan.features.join("\n") : "",
        featuresAr: plan.featuresAr ? plan.featuresAr.join("\n") : "",
        hasAIAnalysis: plan.hasAIAnalysis,
        hasWhaleTracker: plan.hasWhaleTracker,
        hasAdvancedCharts: plan.hasAdvancedCharts,
        hasPaperTrading: plan.hasPaperTrading,
        hasBacktesting: plan.hasBacktesting,
        hasTelegramNotif: plan.hasTelegramNotif,
        hasPrioritySupport: plan.hasPrioritySupport,
        hasAPIAccess: plan.hasAPIAccess,
        isPopular: plan.isPopular,
        isActive: plan.isActive,
        badgeText: plan.badgeText || "",
        badgeColor: plan.badgeColor || "green",
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: "",
        displayName: "",
        displayNameEn: "",
        description: "",
        priceMonthly: "0",
        priceYearly: "0",
        originalPriceMonthly: "",
        originalPriceYearly: "",
        discountPercent: "",
        discountEnabled: false,
        discountLabel: "",
        maxTradesPerDay: "5",
        maxActiveTrades: "2",
        trialDays: "0",
        features: "",
        featuresAr: "",
        hasAIAnalysis: false,
        hasWhaleTracker: false,
        hasAdvancedCharts: false,
        hasPaperTrading: false,
        hasBacktesting: false,
        hasTelegramNotif: true,
        hasPrioritySupport: false,
        hasAPIAccess: false,
        isPopular: false,
        isActive: true,
        badgeText: "",
        badgeColor: "green",
      });
    }
    setShowPlanDialog(true);
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const features = planForm.features.split("\n").filter(f => f.trim());
      const featuresAr = planForm.featuresAr.split("\n").filter(f => f.trim());
      
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlan?.id,
          name: planForm.name,
          displayName: planForm.displayName,
          displayNameEn: planForm.displayNameEn,
          description: planForm.description,
          priceMonthly: parseFloat(planForm.priceMonthly) || 0,
          priceYearly: parseFloat(planForm.priceYearly) || 0,
          originalPriceMonthly: planForm.originalPriceMonthly ? parseFloat(planForm.originalPriceMonthly) : null,
          originalPriceYearly: planForm.originalPriceYearly ? parseFloat(planForm.originalPriceYearly) : null,
          discountPercent: planForm.discountPercent ? parseFloat(planForm.discountPercent) : null,
          discountEnabled: planForm.discountEnabled,
          discountLabel: planForm.discountLabel || null,
          maxTradesPerDay: parseInt(planForm.maxTradesPerDay) || 5,
          maxActiveTrades: parseInt(planForm.maxActiveTrades) || 2,
          trialDays: parseInt(planForm.trialDays) || 0,
          features,
          featuresAr,
          hasAIAnalysis: planForm.hasAIAnalysis,
          hasWhaleTracker: planForm.hasWhaleTracker,
          hasAdvancedCharts: planForm.hasAdvancedCharts,
          hasPaperTrading: planForm.hasPaperTrading,
          hasBacktesting: planForm.hasBacktesting,
          hasTelegramNotif: planForm.hasTelegramNotif,
          hasPrioritySupport: planForm.hasPrioritySupport,
          hasAPIAccess: planForm.hasAPIAccess,
          isPopular: planForm.isPopular,
          isActive: planForm.isActive,
          badgeText: planForm.badgeText || null,
          badgeColor: planForm.badgeColor,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingPlan ? "تم تحديث الباقة!" : "تم إنشاء الباقة!");
        fetchPlans();
        setShowPlanDialog(false);
      } else {
        toast.error(data.error || "فشل الحفظ");
      }
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
    
    try {
      const res = await fetch(`/api/plans?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("تم حذف الباقة!");
        fetchPlans();
      } else {
        toast.error(data.error || "فشل الحذف");
      }
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const savePromoCode = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/plans/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPromo?.id,
          ...promoForm,
          maxUses: promoForm.maxUses ? parseInt(promoForm.maxUses) : null,
          discountValue: parseFloat(promoForm.discountValue) || 0,
          maxUsesPerUser: parseInt(promoForm.maxUsesPerUser) || 1,
          minPurchaseAmount: promoForm.minPurchaseAmount ? parseFloat(promoForm.minPurchaseAmount) : null,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingPromo ? "تم تحديث الكود!" : "تم إنشاء الكود!");
        fetchPromoCodes();
        setShowPromoDialog(false);
      } else {
        toast.error(data.error || "فشل الحفظ");
      }
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const togglePromoStatus = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/plans/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      fetchPromoCodes();
    } catch {
      toast.error("فشل التحديث");
    }
  };

  const initDefaultPlans = async () => {
    try {
      const res = await fetch("/api/plans", { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        toast.success("تم إنشاء الباقات الافتراضية!");
        fetchPlans();
      }
    } catch {
      toast.error("فشل إنشاء الباقات");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">إدارة الباقات</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPlans}>
            <RefreshCw className="h-4 w-4 mr-1" /> تحديث
          </Button>
          {plans.length === 0 && (
            <Button variant="outline" size="sm" onClick={initDefaultPlans}>
              <Sparkles className="h-4 w-4 mr-1" /> إنشاء باقات افتراضية
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "plans" ? "default" : "outline"}
          onClick={() => setActiveTab("plans")}
        >
          <Crown className="h-4 w-4 mr-2" /> الباقات
        </Button>
        <Button
          variant={activeTab === "promo" ? "default" : "outline"}
          onClick={() => setActiveTab("promo")}
        >
          <Tag className="h-4 w-4 mr-2" /> أكواد الخصم
        </Button>
      </div>

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <Button onClick={() => openPlanDialog()}>
            <Plus className="h-4 w-4 mr-2" /> إضافة باقة جديدة
          </Button>

          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.isPopular ? "border-2 border-primary" : ""}`}>
                {plan.badgeText && (
                  <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold text-white bg-${plan.badgeColor || "green"}-500`}>
                    {plan.badgeText}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.displayName}
                        {plan.isPopular && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        {!plan.isActive && <Badge variant="secondary">غير نشطة</Badge>}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openPlanDialog(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Pricing */}
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">شهري</p>
                      <div className="flex items-center gap-1">
                        {plan.discountEnabled && plan.originalPriceMonthly && (
                          <span className="text-sm line-through text-muted-foreground">
                            ${plan.originalPriceMonthly}
                          </span>
                        )}
                        <span className="text-2xl font-bold">${plan.priceMonthly}</span>
                        {plan.discountEnabled && plan.discountPercent && (
                          <Badge className="bg-red-500">-{plan.discountPercent}%</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">سنوي</p>
                      <div className="flex items-center gap-1">
                        {plan.discountEnabled && plan.originalPriceYearly && (
                          <span className="text-sm line-through text-muted-foreground">
                            ${plan.originalPriceYearly}
                          </span>
                        )}
                        <span className="text-2xl font-bold">${plan.priceYearly}</span>
                      </div>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">الصفقات/يوم:</span>{" "}
                      <span className="font-medium">
                        {plan.maxTradesPerDay === -1 ? "غير محدود" : plan.maxTradesPerDay}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">صفقات نشطة:</span>{" "}
                      <span className="font-medium">
                        {plan.maxActiveTrades === -1 ? "غير محدود" : plan.maxActiveTrades}
                      </span>
                    </div>
                    {plan.trialDays > 0 && (
                      <div>
                        <span className="text-muted-foreground">تجربة:</span>{" "}
                        <span className="font-medium">{plan.trialDays} يوم</span>
                      </div>
                    )}
                  </div>

                  {/* Features Toggles */}
                  <div className="flex flex-wrap gap-2">
                    {plan.hasAIAnalysis && <Badge variant="outline"><Brain className="h-3 w-3 mr-1" /> AI</Badge>}
                    {plan.hasWhaleTracker && <Badge variant="outline"><Fish className="h-3 w-3 mr-1" /> الحيتان</Badge>}
                    {plan.hasAdvancedCharts && <Badge variant="outline"><LineChart className="h-3 w-3 mr-1" /> رسوم متقدمة</Badge>}
                    {plan.hasPaperTrading && <Badge variant="outline"><TestTube className="h-3 w-3 mr-1" /> تجريبي</Badge>}
                    {plan.hasBacktesting && <Badge variant="outline"><BarChart3 className="h-3 w-3 mr-1" /> باكتيست</Badge>}
                    {plan.hasPrioritySupport && <Badge variant="outline"><HeadphonesIcon className="h-3 w-3 mr-1" /> دعم VIP</Badge>}
                    {plan.hasAPIAccess && <Badge variant="outline"><Code className="h-3 w-3 mr-1" /> API</Badge>}
                  </div>

                  {/* Subscriber Count */}
                  {plan.subscriberCount !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      <Users className="h-4 w-4 inline mr-1" />
                      {plan.subscriberCount} مشترك
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Promo Codes Tab */}
      {activeTab === "promo" && (
        <div className="space-y-4">
          <Button onClick={() => {
            setEditingPromo(null);
            setPromoForm({
              code: "",
              description: "",
              discountType: "PERCENT",
              discountValue: "10",
              maxUses: "",
              maxUsesPerUser: "1",
              validFrom: "",
              validUntil: "",
              isActive: true,
              minPurchaseAmount: "",
              forNewUsersOnly: false,
            });
            setShowPromoDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" /> إضافة كود خصم
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">أكواد الخصم</CardTitle>
              <CardDescription>إدارة أكواد الخصم والعروض الترويجية</CardDescription>
            </CardHeader>
            <CardContent>
              {promoCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد أكواد خصم</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {promoCodes.map((promo) => (
                      <div key={promo.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${promo.isActive ? "bg-green-500/10" : "bg-gray-500/10"}`}>
                            {promo.discountType === "PERCENT" ? (
                              <Percent className={`h-4 w-4 ${promo.isActive ? "text-green-500" : "text-gray-500"}`} />
                            ) : (
                              <DollarSign className={`h-4 w-4 ${promo.isActive ? "text-green-500" : "text-gray-500"}`} />
                            )}
                          </div>
                          <div>
                            <p className="font-mono font-bold">{promo.code}</p>
                            <p className="text-sm text-muted-foreground">
                              خصم {promo.discountValue}{promo.discountType === "PERCENT" ? "%" : "$"}
                              {promo.description && ` - ${promo.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground">
                            {promo.maxUses ? `${promo.currentUses}/${promo.maxUses}` : promo.currentUses} استخدام
                          </div>
                          <Switch
                            checked={promo.isActive}
                            onCheckedChange={(checked) => togglePromoStatus(promo.id, checked)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingPromo(promo);
                            setPromoForm({
                              code: promo.code,
                              description: promo.description || "",
                              discountType: promo.discountType,
                              discountValue: String(promo.discountValue),
                              maxUses: promo.maxUses ? String(promo.maxUses) : "",
                              maxUsesPerUser: String(promo.maxUsesPerUser),
                              validFrom: promo.validFrom ? promo.validFrom.split("T")[0] : "",
                              validUntil: promo.validUntil ? promo.validUntil.split("T")[0] : "",
                              isActive: promo.isActive,
                              minPurchaseAmount: promo.minPurchaseAmount ? String(promo.minPurchaseAmount) : "",
                              forNewUsersOnly: promo.forNewUsersOnly,
                            });
                            setShowPromoDialog(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "تعديل الباقة" : "إضافة باقة جديدة"}</DialogTitle>
            <DialogDescription>قم بملء تفاصيل الباقة</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (اسم فريد)</Label>
                <Input
                  placeholder="BASIC, PRO, ENTERPRISE"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم المعروض (عربي)</Label>
                <Input
                  placeholder="الباقة الأساسية"
                  value={planForm.displayName}
                  onChange={(e) => setPlanForm({ ...planForm, displayName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم المعروض (إنجليزي)</Label>
                <Input
                  placeholder="Basic Plan"
                  value={planForm.displayNameEn}
                  onChange={(e) => setPlanForm({ ...planForm, displayNameEn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  placeholder="للمتداولين المبتدئين"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> الأسعار
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر الشهري ($)</Label>
                <Input
                  type="number"
                  value={planForm.priceMonthly}
                  onChange={(e) => setPlanForm({ ...planForm, priceMonthly: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>السعر السنوي ($)</Label>
                <Input
                  type="number"
                  value={planForm.priceYearly}
                  onChange={(e) => setPlanForm({ ...planForm, priceYearly: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            {/* Discount */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <Gift className="h-4 w-4" /> الخصم
                </h4>
                <Switch
                  checked={planForm.discountEnabled}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, discountEnabled: checked })}
                />
              </div>
              {planForm.discountEnabled && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>نسبة الخصم (%)</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={planForm.discountPercent}
                      onChange={(e) => setPlanForm({ ...planForm, discountPercent: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر قبل الخصم (شهري)</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={planForm.originalPriceMonthly}
                      onChange={(e) => setPlanForm({ ...planForm, originalPriceMonthly: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تسمية الخصم</Label>
                    <Input
                      placeholder="عرض خاص، خصم 20%"
                      value={planForm.discountLabel}
                      onChange={(e) => setPlanForm({ ...planForm, discountLabel: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Limits */}
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" /> الحدود
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>الصفقات/يوم (-1 = غير محدود)</Label>
                <Input
                  type="number"
                  value={planForm.maxTradesPerDay}
                  onChange={(e) => setPlanForm({ ...planForm, maxTradesPerDay: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الصفقات النشطة (-1 = غير محدود)</Label>
                <Input
                  type="number"
                  value={planForm.maxActiveTrades}
                  onChange={(e) => setPlanForm({ ...planForm, maxActiveTrades: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>أيام التجربة</Label>
                <Input
                  type="number"
                  value={planForm.trialDays}
                  onChange={(e) => setPlanForm({ ...planForm, trialDays: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            {/* Features */}
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> الميزات
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span className="text-sm"><Brain className="h-3 w-3 inline mr-1" /> تحليل AI</span>
                <Switch checked={planForm.hasAIAnalysis} onCheckedChange={(c) => setPlanForm({ ...planForm, hasAIAnalysis: c })} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span className="text-sm"><Fish className="h-3 w-3 inline mr-1" /> الحيتان</span>
                <Switch checked={planForm.hasWhaleTracker} onCheckedChange={(c) => setPlanForm({ ...planForm, hasWhaleTracker: c })} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span className="text-sm"><LineChart className="h-3 w-3 inline mr-1" /> رسوم متقدمة</span>
                <Switch checked={planForm.hasAdvancedCharts} onCheckedChange={(c) => setPlanForm({ ...planForm, hasAdvancedCharts: c })} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span className="text-sm"><TestTube className="h-3 w-3 inline mr-1" /> تداول تجريبي</span>
                <Switch checked={planForm.hasPaperTrading} onCheckedChange={(c) => setPlanForm({ ...planForm, hasPaperTrading: c })} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span className="text-sm"><BarChart3 className="h-3 w-3 inline mr-1" /> باكتيست</span>
                <Switch checked={planForm.hasBacktesting} onCheckedChange={(c) => setPlanForm({ ...planForm, hasBacktesting: c })} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span className="text-sm"><Bell className="h-3 w-3 inline mr-1" /> تيليجرام</span>
                <Switch checked={planForm.hasTelegramNotif} onCheckedChange={(c) => setPlanForm({ ...planForm, hasTelegramNotif: c })} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span className="text-sm"><HeadphonesIcon className="h-3 w-3 inline mr-1" /> دعم VIP</span>
                <Switch checked={planForm.hasPrioritySupport} onCheckedChange={(c) => setPlanForm({ ...planForm, hasPrioritySupport: c })} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <span className="text-sm"><Code className="h-3 w-3 inline mr-1" /> API</span>
                <Switch checked={planForm.hasAPIAccess} onCheckedChange={(c) => setPlanForm({ ...planForm, hasAPIAccess: c })} />
              </div>
            </div>

            <Separator />

            {/* Display */}
            <h4 className="font-semibold flex items-center gap-2">
              <Star className="h-4 w-4" /> العرض
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نص الشارة</Label>
                <Input
                  placeholder="الأكثر شعبية"
                  value={planForm.badgeText}
                  onChange={(e) => setPlanForm({ ...planForm, badgeText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>لون الشارة</Label>
                <Select value={planForm.badgeColor} onValueChange={(v) => setPlanForm({ ...planForm, badgeColor: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">أخضر</SelectItem>
                    <SelectItem value="blue">أزرق</SelectItem>
                    <SelectItem value="purple">بنفسجي</SelectItem>
                    <SelectItem value="red">أحمر</SelectItem>
                    <SelectItem value="orange">برتقالي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={planForm.isPopular} onCheckedChange={(c) => setPlanForm({ ...planForm, isPopular: c })} />
                <Label>الأكثر شعبية</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={planForm.isActive} onCheckedChange={(c) => setPlanForm({ ...planForm, isActive: c })} />
                <Label>نشطة</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>إلغاء</Button>
            <Button onClick={savePlan} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promo Code Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPromo ? "تعديل كود الخصم" : "إضافة كود خصم جديد"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input
                  placeholder="SAVE20"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  placeholder="خصم بمناسبة..."
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الخصم</Label>
                <Select value={promoForm.discountType} onValueChange={(v) => setPromoForm({ ...promoForm, discountType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">نسبة مئوية %</SelectItem>
                    <SelectItem value="FIXED">مبلغ ثابت $</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>قيمة الخصم</Label>
                <Input
                  type="number"
                  placeholder="20"
                  value={promoForm.discountValue}
                  onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>أقصى استخدامات (فارغ = غير محدود)</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={promoForm.maxUses}
                  onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>استخدامات/مستخدم</Label>
                <Input
                  type="number"
                  value={promoForm.maxUsesPerUser}
                  onChange={(e) => setPromoForm({ ...promoForm, maxUsesPerUser: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>صالح من</Label>
                <Input
                  type="date"
                  value={promoForm.validFrom}
                  onChange={(e) => setPromoForm({ ...promoForm, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>صالح حتى</Label>
                <Input
                  type="date"
                  value={promoForm.validUntil}
                  onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={promoForm.isActive} onCheckedChange={(c) => setPromoForm({ ...promoForm, isActive: c })} />
                <Label>نشط</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={promoForm.forNewUsersOnly} onCheckedChange={(c) => setPromoForm({ ...promoForm, forNewUsersOnly: c })} />
                <Label>للمستخدمين الجدد فقط</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoDialog(false)}>إلغاء</Button>
            <Button onClick={savePromoCode} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
