'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        router.push(response.ok ? '/dashboard' : '/login');
      } catch {
        router.push('/login');
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  if (!checking) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading CRM Pro...</p>
      </div>
    </div>
  );
}
