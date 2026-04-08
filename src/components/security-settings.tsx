"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Mail,
  Smartphone,
  RefreshCw,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

interface SecuritySettingsProps {
  userId?: string;
  email?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

export function SecuritySettings({ 
  userId: propUserId, 
  email: propEmail, 
  emailVerified: propEmailVerified, 
  twoFactorEnabled: prop2FA 
}: SecuritySettingsProps = {}) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(propEmailVerified || false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(prop2FA || false);
  const [email, setEmail] = useState(propEmail || "");
  const [userId, setUserId] = useState(propUserId || "");

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await fetch('/api/settings?userId=demo');
        const data = await res.json();
        if (data.settings) {
          setUserId(data.settings.userId || 'demo');
        }
      } catch (e) {
        console.log('Could not load user data');
      }
    };
    
    if (!propUserId) {
      loadUserData();
    }
  }, [propUserId]);

  const sendVerificationEmail = async () => {
    setLoading(true);
    try {
      toast.info(isArabic ? "جاري إرسال بريد التحقق..." : "Sending verification email...");
      // Simulate success for demo
      setTimeout(() => {
        toast.success(isArabic ? "تم إرسال بريد التحقق! تحقق من صندوق الوارد." : "Verification email sent! Check your inbox.");
        setLoading(false);
      }, 1000);
    } catch (e) {
      toast.error(isArabic ? "فشل إرسال بريد التحقق" : "Failed to send verification email");
      setLoading(false);
    }
  };

  const setup2FA = async () => {
    setLoading(true);
    try {
      toast.info(isArabic ? "جاري إعداد المصادقة الثنائية..." : "Setting up 2FA...");
      // Simulate success for demo
      setTimeout(() => {
        setTwoFactorEnabled(true);
        toast.success(isArabic ? "تم تفعيل المصادقة الثنائية بنجاح!" : "2FA enabled successfully!");
        setLoading(false);
      }, 1000);
    } catch (e) {
      toast.error(isArabic ? "فشل إعداد المصادقة الثنائية" : "Failed to setup 2FA");
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm(isArabic ? "هل أنت متأكد من إيقاف المصادقة الثنائية؟" : "Are you sure you want to disable 2FA?")) return;
    
    setLoading(true);
    try {
      setTwoFactorEnabled(false);
      toast.success(isArabic ? "تم إيقاف المصادقة الثنائية" : "2FA disabled");
    } catch (e) {
      toast.error(isArabic ? "فشل إيقاف المصادقة الثنائية" : "Failed to disable 2FA");
    }
    setLoading(false);
  };

  const requestPasswordReset = async () => {
    setLoading(true);
    try {
      toast.info(isArabic ? "جاري إرسال رابط إعادة التعيين..." : "Sending reset link...");
      // Simulate success for demo
      setTimeout(() => {
        toast.success(isArabic ? "تم إرسال رابط إعادة تعيين كلمة المرور!" : "Password reset email sent!");
        setLoading(false);
      }, 1000);
    } catch (e) {
      toast.error(isArabic ? "فشل إرسال رابط إعادة التعيين" : "Failed to send reset email");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{isArabic ? "إعدادات الأمان" : "Security Settings"}</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Email Verification */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <CardTitle>{isArabic ? "التحقق من البريد الإلكتروني" : "Email Verification"}</CardTitle>
            </div>
            <CardDescription>{isArabic ? "تحقق من عنوان بريدك الإلكتروني" : "Verify your email address"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <span className="text-sm">{email || "user@example.com"}</span>
                {emailVerified ? (
                  <Badge className="bg-green-500/10 text-green-500">
                    <Check className="h-3 w-3 mr-1" /> {isArabic ? "موثق" : "Verified"}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/10 text-yellow-500">
                    <AlertTriangle className="h-3 w-3 mr-1" /> {isArabic ? "غير موثق" : "Not Verified"}
                  </Badge>
                )}
              </div>
            </div>
            {!emailVerified && (
              <Button
                variant="outline"
                className="w-full"
                onClick={sendVerificationEmail}
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                {isArabic ? "إرسال بريد التحقق" : "Send Verification Email"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-500" />
              <CardTitle>{isArabic ? "المصادقة الثنائية" : "Two-Factor Auth"}</CardTitle>
            </div>
            <CardDescription>{isArabic ? "أضف أماناً إضافياً لحسابك" : "Add extra security to your account"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span>{isArabic ? "حالة المصادقة الثنائية" : "2FA Status"}</span>
              {twoFactorEnabled ? (
                <Badge className="bg-green-500/10 text-green-500">
                  <Shield className="h-3 w-3 mr-1" /> {isArabic ? "مفعلة" : "Enabled"}
                </Badge>
              ) : (
                <Badge className="bg-gray-500/10 text-gray-500">
                  <Key className="h-3 w-3 mr-1" /> {isArabic ? "معطلة" : "Disabled"}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {!twoFactorEnabled ? (
                <Button className="flex-1" onClick={setup2FA} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                  {isArabic ? "تفعيل المصادقة الثنائية" : "Enable 2FA"}
                </Button>
              ) : (
                <Button variant="destructive" className="flex-1" onClick={disable2FA} disabled={loading}>
                  {isArabic ? "إيقاف المصادقة الثنائية" : "Disable 2FA"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-500" />
              <CardTitle>{isArabic ? "كلمة المرور" : "Password"}</CardTitle>
            </div>
            <CardDescription>{isArabic ? "إدارة كلمة مرور حسابك" : "Manage your account password"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={requestPasswordReset}
              disabled={loading}
            >
              <Key className="h-4 w-4 mr-2" /> {isArabic ? "تغيير كلمة المرور" : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle>{isArabic ? "ملخص الأمان" : "Security Summary"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{isArabic ? "البريد موثق" : "Email Verified"}</span>
                {emailVerified ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{isArabic ? "المصادقة الثنائية مفعلة" : "2FA Enabled"}</span>
                {twoFactorEnabled ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
