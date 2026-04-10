'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const setupDatabase = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@tradingbot.com',
          password: 'Admin@123456',
          setupKey: 'trading-bot-admin-2024'
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🚀 إعداد البوت</h1>
          <p className="text-gray-400">اضغط على الأزرار بالترتيب</p>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="font-bold mb-2">الخطوة 1: إنشاء قاعدة البيانات</h2>
            <button
              onClick={setupDatabase}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 rounded-lg font-bold transition"
            >
              {loading ? '⏳ جاري...' : '📊 إنشاء الجداول'}
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="font-bold mb-2">الخطوة 2: إنشاء حساب الأدمن</h2>
            <button
              onClick={createAdmin}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded-lg font-bold transition"
            >
              {loading ? '⏳ جاري...' : '👤 إنشاء حساب الأدمن'}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-900/50 border border-green-500' : 'bg-red-900/50 border border-red-500'}`}>
              <h3 className="font-bold mb-2">{result.success ? '✅ نجح!' : '❌ خطأ!'}</h3>
              <pre className="text-sm overflow-auto max-h-60 bg-black/30 p-2 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
              <p className="text-red-400">❌ {error}</p>
            </div>
          )}

          {/* Admin Credentials */}
          {result?.success && result.admin && (
            <div className="bg-yellow-900/50 border border-yellow-500 p-4 rounded-lg">
              <h3 className="font-bold mb-2">🔐 بيانات الدخول:</h3>
              <p><strong>البريد:</strong> {result.admin.email}</p>
              <p><strong>كلمة المرور:</strong> {result.admin.password}</p>
              <p className="text-yellow-400 text-sm mt-2">⚠️ احفظ هذه البيانات!</p>
            </div>
          )}
        </div>

        <div className="text-center text-gray-500 text-sm">
          بعد الإعداد، اذهب للصفحة الرئيسية للدخول
        </div>
      </div>
    </div>
  );
}
