'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

export default function BotDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [personalityPrompt, setPersonalityPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [startersText, setStartersText] = useState('');

  // Document training state
  const [knowledgeContent, setKnowledgeContent] = useState('');
  const [chunks, setChunks] = useState<any[]>([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  const refetchChunks = async () => {
    const supabase = createClient();
    const { data: chunksData } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false });
    setChunks(chunksData || []);
  };

  useEffect(() => {
    if (!botId) return;

    const fetchBot = async () => {
      const supabase = createClient();
      const { data: botData, error: botError } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .single();

      if (botError || !botData) {
        setError('Bot not found or unable to fetch details.');
        setLoading(false);
        return;
      }

      setBot(botData);
      setName(botData.name || '');
      setPersonalityPrompt(botData.personality_prompt || '');
      setLanguage(botData.language || 'English');
      const starters = Array.isArray(botData.conversation_starters)
        ? botData.conversation_starters.join('\n')
        : '';
      setStartersText(starters);

      // Fetch knowledge document chunks
      const { data: chunksData } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false });

      setChunks(chunksData || []);
      setLoading(false);
    };

    fetchBot();
  }, [botId]);

  const handleUpdateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const supabase = createClient();
    const startersArray = startersText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const { error: updateError } = await supabase
      .from('bots')
      .update({
        name: name.trim(),
        personality_prompt: personalityPrompt.trim(),
        language,
        conversation_starters: startersArray,
      })
      .eq('id', botId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message || 'Failed to update bot.');
      return;
    }

    setSuccess('Bot settings updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteBot = async () => {
    if (!confirm(`Are you sure you want to delete "${bot?.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('bots').delete().eq('id', botId);

    if (deleteError) {
      setError(deleteError.message || 'Failed to delete bot.');
      setDeleting(false);
      return;
    }

    router.push('/dashboard');
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledgeContent.trim()) return;

    setTrainingLoading(true);
    setError('');
    setSuccess('');

    try {
      // IMPORTANT: call the /api/upload route so the text gets split into
      // chunks AND each chunk gets a real vector embedding generated via
      // Gemini before being saved. Inserting directly into Supabase from
      // the client (the old behaviour) skipped embedding generation
      // entirely, leaving every chunk with a NULL embedding that could
      // never be matched during chat.
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          text: knowledgeContent.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Failed to add knowledge base text.');
        setTrainingLoading(false);
        return;
      }

      // Re-fetch the chunks list from Supabase so the UI shows the
      // newly created chunk(s) with their embeddings included.
      await refetchChunks();
      setKnowledgeContent('');
      setSuccess(data?.message || 'Knowledge added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to add knowledge base text.');
    } finally {
      setTrainingLoading(false);
    }
  };

  const handleDeleteChunk = async (chunkId: string) => {
    const supabase = createClient();
    await supabase.from('document_chunks').delete().eq('id', chunkId);
    setChunks(chunks.filter((c) => c.id !== chunkId));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading bot details...
      </div>
    );
  }

  if (error && !bot) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <p className="text-rose-400">{error}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <span>Bot Details</span>
            </div>
            <h1 className="text-3xl font-bold text-white mt-1">{bot?.name}</h1>
            <p className="text-xs text-slate-400 mt-1">Bot ID: {botId}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/bots/${botId}/conversations`}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-slate-800 hover:text-cyan-300"
            >
              💬 View Conversations
            </Link>
            <Link
              href={`/dashboard/bots/${botId}/embed`}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-slate-800 hover:text-amber-200"
            >
              ⚡ Embed Code
            </Link>
            <button
              onClick={handleDeleteBot}
              disabled={deleting}
              className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-4 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-900/40 hover:text-rose-200 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Bot'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error ? (
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-4 text-sm text-rose-300">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
              <h2 className="text-xl font-bold text-white mb-6">Bot Configuration</h2>
              <form onSubmit={handleUpdateBot} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Personality Prompt
                  </label>
                  <textarea
                    rows={4}
                    value={personalityPrompt}
                    onChange={(e) => setPersonalityPrompt(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Default Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                  >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Conversation Starters (one per line)
                  </label>
                  <p className="text-xs text-slate-500 mb-2">Quick buttons shown to visitors when opening chat</p>
                  <textarea
                    rows={3}
                    value={startersText}
                    onChange={(e) => setStartersText(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving Changes...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Knowledge Base & RAG Training */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
              <h2 className="text-xl font-bold text-white mb-2">Knowledge Base</h2>
              <p className="text-xs text-slate-400 mb-4">
                Add FAQs, business information, or context for your bot to reference during chats.
              </p>

              <form onSubmit={handleAddKnowledge} className="space-y-3 mb-6">
                <textarea
                  rows={3}
                  value={knowledgeContent}
                  onChange={(e) => setKnowledgeContent(e.target.value)}
                  placeholder="Paste FAQ or information here..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition"
                  required
                />
                <button
                  type="submit"
                  disabled={trainingLoading}
                  className="w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-amber-300 hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {trainingLoading ? 'Adding Knowledge...' : '+ Add Knowledge Chunk'}
                </button>
              </form>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Trained Chunks ({chunks.length})
                </p>
                {chunks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No knowledge chunks added yet.</p>
                ) : (
                  chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300 relative group"
                    >
                      <p className="line-clamp-3">{chunk.content}</p>
                      <button
                        onClick={() => handleDeleteChunk(chunk.id)}
                        className="mt-2 text-rose-400 hover:text-rose-300 text-[10px] font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}