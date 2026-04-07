'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white';
const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

export default function AdminRegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-xl text-slate-900">CRM Pro</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">Create Admin Account</h2>
            <p className="text-slate-500 text-sm mt-1">Register a new admin for the CRM system</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Admin account created! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className={labelCls}>Full Name</label>
              <input id="name" name="name" type="text" required placeholder="Enter full name" value={formData.name} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>Email Address</label>
              <input id="email" name="email" type="email" required placeholder="admin@company.com" value={formData.email} onChange={handleChange} className={inputCls} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <input id="password" name="password" type="password" required placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelCls}>Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} className={inputCls} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating admin...
                </>
              ) : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button type="button" onClick={() => router.push('/login')} className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
              Already have an account? Sign in
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p>This page creates admin users with full system access. Keep this URL private and only share with authorized personnel.</p>
        </div>
      </div>
    </div>
  );
}
