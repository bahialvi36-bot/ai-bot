'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

export default function AdminDashboard() {
  const [bots, setBots] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_bots: 0, total_conversations: 0, total_leads: 0, total_users: 1 });
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUserEmail(session.user.email || '');

        const { data: userBots } = await supabase
          .from('bots')
          .select('*')
          .or(`user_id.eq.${session.user.id},owner_email.eq.${session.user.email}`);

        const fetchedBots = userBots || [];
        setBots(fetchedBots);

        const botIds = fetchedBots.map((b: any) => b.id);

        if (botIds.length > 0) {
          const { count: convCount } = await supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .in('bot_id', botIds);

          const { count: leadCount } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .in('bot_id', botIds);

          setStats({
            total_bots: botIds.length,
            total_conversations: convCount || 0,
            total_leads: leadCount || 0,
            total_users: 1,
          });
        } else {
          setStats({
            total_bots: 0,
            total_conversations: 0,
            total_leads: 0,
            total_users: 1,
          });
        }
      }
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Overview</p>
            <h1 className="text-3xl font-bold text-white mt-1">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage and monitor all your business AI bots</p>
          </div>
          <Link
            href="/dashboard/bots/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 shadow-lg shadow-amber-500/10"
          >
            <span>+</span> Create New Bot
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Bots</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats.total_bots}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Conversations</p>
            <p className="text-3xl font-extrabold text-cyan-400 mt-2">{stats.total_conversations}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lead Captures</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.total_leads}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account Role</p>
            <p className="text-lg font-bold text-amber-300 mt-3 truncate">{userEmail ? 'Admin' : 'Guest'}</p>
          </div>
        </div>

        {/* Bots List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your AI Bots</h2>
            <span className="text-xs text-slate-400">{bots.length} active bot{bots.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
              Loading your bots...
            </div>
          ) : bots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">
                🤖
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">No bots created yet</h3>
              <p className="mt-1 text-sm text-slate-400">Create your first AI chatbot to start automating customer interactions.</p>
              <Link
                href="/dashboard/bots/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
              >
                + Create Bot
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Bot Name</th>
                      <th className="px-6 py-4 font-semibold">Language</th>
                      <th className="px-6 py-4 font-semibold">Created Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bots.map((bot) => (
                      <tr key={bot.id} className="transition hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold text-sm">
                              🤖
                            </span>
                            <span>{bot.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          <span className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                            {bot.language || 'English'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {bot.created_at ? new Date(bot.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/dashboard/bots/${bot.id}`}
                              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                            >
                              View Details
                            </Link>
                            <Link
                              href={`/dashboard/bots/${bot.id}/conversations`}
                              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition"
                            >
                              Chats
                            </Link>
                            <Link
                              href={`/dashboard/bots/${bot.id}/embed`}
                              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                            >
                              Embed Code
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}