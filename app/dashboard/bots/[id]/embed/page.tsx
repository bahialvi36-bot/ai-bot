'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

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
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-white">Embed Your Bot</h1>
        <p className="text-slate-400 mt-2 mb-8">Copy this code and paste on your website</p>
        
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <p className="text-sm text-slate-400 mb-3">Embed Code:</p>
          <div className="bg-slate-950 rounded p-4 mb-4 border border-slate-800 overflow-auto">
            <code className="text-sm text-amber-400">{embedCode}</code>
          </div>
          <button 
            onClick={copyToClipboard} 
            className="w-full bg-amber-500 text-slate-950 py-3 rounded-lg font-semibold hover:bg-amber-600"
          >
            {copied ? '✅ Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="mt-8 p-6 border border-slate-700 bg-slate-900 rounded-lg">
          <h2 className="text-white font-bold mb-4">How to use:</h2>
          <div className="space-y-2 text-slate-400">
            <p>1. Copy the code above</p>
            <p>2. Go to your website HTML editor</p>
            <p>3. Paste before closing &lt;/body&gt; tag</p>
            <p>4. Save and refresh your website</p>
            <p>5. Your chatbot will appear in bottom right!</p>
          </div>
        </div>

        <div className="mt-8 p-6 border border-green-800 bg-green-950/20 rounded-lg">
          <p className="text-green-400">Bot ID: <code className="bg-slate-950 px-2 py-1 rounded text-sm">{botId}</code></p>
        </div>
      </div>
    </div>
  );
}