'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NavIcon = ({ path }) => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    label: 'Leads',
    href: '/leads',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
];

export default function Navbar() {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!user) return null;

  const allNavItems = user.role === 'admin'
    ? [...navItems, {
        label: 'Admin',
        href: '/admin',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      }]
    : navItems;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.png" alt="DigiCRM" className="w-8 h-8 rounded-lg object-contain bg-white" />
            <span className="text-white font-bold text-lg tracking-tight">DigiCRM</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {allNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <NavIcon path={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-slate-300 text-xs font-semibold uppercase">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden lg:block">
                <p className="text-white text-sm font-medium leading-tight">{user.name}</p>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  user.role === 'admin'
                    ? 'text-amber-400 bg-amber-400/10'
                    : 'text-blue-400 bg-blue-400/10'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <NavIcon path={item.icon} />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 mt-2 border-t border-slate-800 flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-slate-300 text-xs font-semibold uppercase">{user.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-slate-500 text-xs capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
