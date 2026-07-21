'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

export default function BotConversationsPage() {
  const params = useParams();
  const botId = params.id as string;

  const [bot, setBot] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (!botId) return;

    const loadConversations = async () => {
      const supabase = createClient();

      // Get Bot Info
      const { data: botData } = await supabase
        .from('bots')
        .select('name')
        .eq('id', botId)
        .single();
      setBot(botData);

      // Get Conversations for Bot
      const { data: convosData } = await supabase
        .from('conversations')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false });

      const fetchedConvos = convosData || [];
      setConversations(fetchedConvos);

      if (fetchedConvos.length > 0) {
        selectConversation(fetchedConvos[0]);
      } else {
        setLoading(false);
      }
    };

    loadConversations();
  }, [botId]);

  const selectConversation = async (convo: any) => {
    setSelectedConvo(convo);
    setMessagesLoading(true);
    const supabase = createClient();

    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true });

    setMessages(msgData || []);
    setMessagesLoading(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <Link href={`/dashboard/bots/${botId}`} className="hover:underline">
                {bot?.name || 'Bot'}
              </Link>
              <span>/</span>
              <span>Conversations</span>
            </div>
            <h1 className="text-3xl font-bold text-white mt-1">Bot Conversations</h1>
            <p className="text-xs text-slate-400 mt-1">Review live chat histories and visitor queries</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/bots/${botId}`}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              ← Back to Bot Details
            </Link>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl">
              💬
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">No conversations recorded yet</h3>
            <p className="mt-1 text-sm text-slate-400">
              Embed your bot on your website to start receiving chat interactions from visitors.
            </p>
            <Link
              href={`/dashboard/bots/${botId}/embed`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
            >
              Get Embed Code
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
            {/* Conversations List */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 overflow-y-auto max-h-[600px]">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
                Sessions ({conversations.length})
              </p>
              {conversations.map((convo) => {
                const isSelected = selectedConvo?.id === convo.id;
                return (
                  <button
                    key={convo.id}
                    onClick={() => selectConversation(convo)}
                    className={`w-full text-left p-3.5 rounded-xl border transition ${
                      isSelected
                        ? 'border-amber-500/50 bg-amber-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-amber-300 truncate max-w-[150px]">
                        Visitor: {convo.visitor_id || 'Anonymous'}
                      </span>
                      {convo.unanswered ? (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                          Unanswered
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {new Date(convo.created_at).toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Conversation Message Transcript */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-800 pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Conversation with {selectedConvo?.visitor_id || 'Visitor'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Started: {selectedConvo ? new Date(selectedConvo.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  {selectedConvo?.unanswered ? (
                    <span className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-3 py-1 text-xs font-medium text-rose-300">
                      Contains Unanswered Query
                    </span>
                  ) : null}
                </div>

                {messagesLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading transcript...</div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">No messages found in this session.</div>
                ) : (
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                    {messages.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                              isUser
                                ? 'bg-amber-500 text-slate-950 font-medium rounded-br-xs'
                                : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-xs'
                            }`}
                          >
                            <p className="text-[10px] opacity-70 mb-1 font-semibold uppercase">
                              {isUser ? 'Visitor' : 'Bot'}
                            </p>
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}