'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const checkHealth = async () => {
    setLoading(true);
    addLog('فحص حالة الخادم...');
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setResult(data);
      addLog(`الحالة: ${JSON.stringify(data)}`);
    } catch (e: any) {
      addLog(`خطأ: ${e.message}`);
    }
    setLoading(false);
  };

  const setupDatabase = async () => {
    setLoading(true);
    addLog('بدء إنشاء الجداول...');
    try {
      // First check if we can connect
      const checkRes = await fetch('/api/setup-db');
      const checkData = await checkRes.json();
      addLog(`الجداول الموجودة: ${JSON.stringify(checkData.tables?.map((t: any) => t.table_name) || [])}`);

      // Try to create tables
      const res = await fetch('/api/setup-db', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        addLog('✅ تم إنشاء الجداول بنجاح!');
        setStep(2);
      } else {
        addLog(`❌ خطأ: ${data.error}`);
      }
      setResult(data);
    } catch (e: any) {
      addLog(`❌ خطأ: ${e.message}`);
    }
    setLoading(false);
  };

  const createAdmin = async () => {
    setLoading(true);
    addLog('بدء إنشاء حساب الأدمن...');
    try {
      const res = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@tradingbot.com',
          password: 'Admin@123456',
          setupKey: 'trading-bot-admin-2024'
        })
      });
      const data = await res.json();
      
      if (data.success) {
        addLog('✅ تم إنشاء حساب الأدمن!');
        setStep(3);
      } else {
        addLog(`❌ خطأ: ${data.error || JSON.stringify(data)}`);
      }
      setResult(data);
    } catch (e: any) {
      addLog(`❌ خطأ: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🚀 إعداد البوت</h1>
          <p className="text-gray-400">اتبع الخطوات بالترتيب</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {s}
            </div>
          ))}
        </div>

        {/* Logs */}
        <div className="bg-black rounded-lg p-4 h-40 overflow-auto font-mono text-sm">
          {logs.length === 0 ? (
            <span className="text-gray-500">في انتظار البدء...</span>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={checkHealth}
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 py-3 rounded-lg font-bold"
          >
            🔍 فحص الاتصال
          </button>

          <button
            onClick={setupDatabase}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg font-bold"
          >
            {loading ? '⏳ جاري...' : '📊 الخطوة 1: إنشاء الجداول'}
          </button>

          <button
            onClick={createAdmin}
            disabled={loading || step < 2}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-3 rounded-lg font-bold"
          >
            {loading ? '⏳ جاري...' : '👤 الخطوة 2: إنشاء الأدمن'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <pre className="text-sm overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Success */}
        {step === 3 && (
          <div className="bg-yellow-900/50 border border-yellow-500 p-4 rounded-lg text-center">
            <h3 className="font-bold text-xl mb-2">🎉 تم الإعداد بنجاح!</h3>
            <p><strong>البريد:</strong> admin@tradingbot.com</p>
            <p><strong>كلمة المرور:</strong> Admin@123456</p>
            <a href="/" className="inline-block mt-4 bg-blue-600 px-6 py-2 rounded-lg">
              🏠 الذهاب للصفحة الرئيسية
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
