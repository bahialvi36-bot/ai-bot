'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

const languages = ['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German'];

export default function NewBotPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [personalityPrompt, setPersonalityPrompt] = useState('You are a friendly support assistant for this business. Answer clearly, briefly, and warmly.');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
    });
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      setError('You must be signed in to create a bot.');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('bots')
      .insert({
        name: name.trim(),
        personality_prompt: personalityPrompt.trim(),
        language,
        owner_email: session.user.email || null,
        user_id: session.user.id,
        conversation_starters: ['How can I help you today?', 'Tell me about pricing', 'How do I contact support?'],
      })
      .select('id')
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message || 'Unable to create bot.');
      return;
    }

    router.push(`/dashboard/bots/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/20">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">New Bot</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Create a new bot</h1>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-slate-400 transition hover:text-white">
            Back to dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="name">
              Bot name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500"
              placeholder="Example: Aurora Bistro Support"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="prompt">
              Personality / tone prompt
            </label>
            <textarea
              id="prompt"
              value={personalityPrompt}
              onChange={(event) => setPersonalityPrompt(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500"
              placeholder="Example: You are a warm, helpful support assistant for a luxury hotel. Answer clearly and briefly, and never invent details."
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="language">
              Default language
            </label>
            <select
              id="language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500"
            >
              {languages.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="rounded-2xl border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating bot…' : 'Create bot'}
          </button>
        </form>
      </div>
    </div>
  );
}
