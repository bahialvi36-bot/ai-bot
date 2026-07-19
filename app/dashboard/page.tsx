'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

interface Bot {
  id: string;
  name: string;
  personality_prompt: string;
  language: string;
  created_at: string;
}

export default function DashboardOverview() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    let mounted = true;

    const initDashboard = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace('/login');
        return;
      }

      if (!mounted) return;

      const currentEmail = session.user.email?.toLowerCase() || '';
      setUserEmail(session.user.email || '');
      const response = await (supabase as any)
        .from('bots')
        .select('*')
        .eq('owner_email', currentEmail);
      const data = Array.isArray((response as any).data)
        ? ((response as any).data as Bot[]).sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
        : [];
      const error = (response as any).error;

      if (!mounted) return;
      if (error) {
        console.error('Error fetching dashboard data:', error);
        setBots([]);
      } else {
        setBots(data || []);
      }
      setLoading(false);
    };

    initDashboard();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-8 text-slate-400">
        <svg className="mr-2 h-6 w-6 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading your workspace...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">Workspace</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Your bots</h2>
          <p className="mt-2 text-sm text-slate-400">{userEmail ? `Signed in as ${userEmail}` : 'Manage your multi-tenant chatbot workspace.'}</p>
        </div>
        <Link href="/dashboard/bots/new" className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
          Create New Bot
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">
          <p className="text-lg font-semibold text-white">No bots yet</p>
          <p className="mt-2 text-sm">Create your first bot and embed it anywhere on the web.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bots.map((bot) => (
            <Link key={bot.id} href={`/dashboard/bots/${bot.id}`} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:border-amber-500/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{bot.name}</p>
                  <p className="mt-2 text-sm text-slate-400">{bot.personality_prompt}</p>
                </div>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-300">
                  {bot.language}
                </span>
              </div>
              <div className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-500">
                Created {new Date(bot.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
