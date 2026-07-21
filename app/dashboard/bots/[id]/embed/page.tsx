'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function EmbedPage() {
  const params = useParams();
  const botId = params.id as string;
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://ai-bot-xi-ten.vercel.app/widget.js" data-bot-id="${botId}" defer></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <Link href={`/dashboard/bots/${botId}`} className="hover:underline">Bot</Link>
              <span>/</span>
              <span>Embed</span>
            </div>
            <h1 className="text-3xl font-bold text-white mt-1">Embed Your Chatbot</h1>
            <p className="text-xs text-slate-400 mt-1">Add this AI widget to any website or HTML page</p>
          </div>
          <Link
            href={`/dashboard/bots/${botId}`}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            ← Back to Details
          </Link>
        </div>

        {/* Code Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Widget Script Code</p>
          <div className="bg-slate-950 rounded-xl p-4 mb-4 border border-slate-800 overflow-x-auto">
            <code className="text-sm font-mono text-amber-400 select-all">{embedCode}</code>
          </div>
          <button
            onClick={copyToClipboard}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/10"
          >
            {copied ? '✅ Copied to Clipboard!' : 'Copy Script Code'}
          </button>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-base font-bold text-white mb-4">Installation Instructions:</h2>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">1</span>
              <p>Click <strong>Copy Script Code</strong> above.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">2</span>
              <p>Open your website's HTML source code or CMS template (e.g. WordPress, Webflow, Shopify).</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">3</span>
              <p>Paste the snippet directly before the closing <code>&lt;/body&gt;</code> tag.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">4</span>
              <p>Save changes and reload your site. The chat widget will appear floating in the bottom-right corner.</p>
            </div>
          </div>
        </div>

        {/* Bot ID info badge */}
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-medium">Target Bot Identifier:</span>
          <code className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg text-emerald-300 font-mono">{botId}</code>
        </div>
      </div>
    </div>
  );
}