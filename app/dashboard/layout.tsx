'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

const navItems = [
  { href: '/dashboard', label: 'Bots', icon: '🤖' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      setEmail(session.user.email || '');
      setLoading(false);
    };

    loadSession();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading workspace…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex">
      <aside className="border-b border-slate-800 bg-slate-900/90 p-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">Chatbot Platform</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Business Dashboard</h2>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-amber-500/10 text-amber-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Signed in</p>
          <p className="mt-2 truncate text-sm font-medium text-slate-300">{email}</p>
          <button onClick={handleLogout} className="mt-4 inline-flex w-full justify-center rounded-2xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-rose-500/40 hover:text-rose-300">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}
