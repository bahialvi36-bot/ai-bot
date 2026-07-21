'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Account</p>
          <h1 className="text-3xl font-bold text-white mt-1">Workspace Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Manage your account profile and platform configurations</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            Loading settings...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
              <h2 className="text-base font-bold text-white mb-4">User Profile</h2>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address</label>
                  <input
                    type="text"
                    value={user?.email || 'N/A'}
                    disabled
                    className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">User Identifier (ID)</label>
                  <input
                    type="text"
                    value={user?.id || 'N/A'}
                    disabled
                    className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-400 font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
              <h2 className="text-base font-bold text-white mb-2">Platform Specifications</h2>
              <p className="text-xs text-slate-400 mb-4">Core technologies power your chatbots</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">AI Engine</p>
                  <p className="text-sm font-bold text-white mt-1">OpenAI & Gemini</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-[10px] uppercase font-semibold text-cyan-400 tracking-wider">Vector Database</p>
                  <p className="text-sm font-bold text-white mt-1">Supabase pgvector</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">Embeddings</p>
                  <p className="text-sm font-bold text-white mt-1">text-embedding-3</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}