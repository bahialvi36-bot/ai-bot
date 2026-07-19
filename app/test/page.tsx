'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface Bot {
  id: string;
  name: string;
  personality_prompt: string;
  language: string;
  owner_email: string;
  created_at: string;
}

interface ContextChunk {
  id: string;
  content: string;
  similarity: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function TestPage() {
  // ─── Bots List & Selection ───
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  
  // ─── Create Bot Form States ───
  const [newBotName, setNewBotName] = useState('');
  const [newBotPrompt, setNewBotPrompt] = useState('You are a helpful and friendly support assistant.');
  const [newBotLanguage, setNewBotLanguage] = useState('en');
  const [newBotEmail, setNewBotEmail] = useState('');
  const [createBotStatus, setCreateBotStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [createBotMsg, setCreateBotMsg] = useState('');

  // ─── Document Ingestion States ───
  const [documentText, setDocumentText] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  // ─── Chat States ───
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [chatStatus, setChatStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [conversationId, setConversationId] = useState<string>('');
  const [lastChunks, setLastChunks] = useState<ContextChunk[]>([]);
  const [showChunks, setShowChunks] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch available bots on load
  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBots(data || []);
      if (data && data.length > 0 && !selectedBotId) {
        setSelectedBotId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching bots:', err);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const selectedBot = bots.find(b => b.id === selectedBotId);

  // ─── Handle Create Bot ───
  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;

    setCreateBotStatus('loading');
    setCreateBotMsg('');

    try {
      const { data, error } = await supabase
        .from('bots')
        .insert({
          name: newBotName.trim(),
          personality_prompt: newBotPrompt.trim(),
          language: newBotLanguage,
          owner_email: newBotEmail.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCreateBotStatus('success');
      setCreateBotMsg(`Bot "${data.name}" created successfully!`);
      setNewBotName('');
      setNewBotEmail('');
      
      // Refresh bot list and select the new bot
      await fetchBots();
      setSelectedBotId(data.id);
    } catch (err: any) {
      console.error(err);
      setCreateBotStatus('error');
      setCreateBotMsg(err.message || 'Failed to create bot.');
    }
  };

  // ─── Handle Ingest Document ───
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId) {
      alert('Please select or create a bot first.');
      return;
    }
    if (!documentText.trim()) return;

    setUploadStatus('loading');
    setUploadMessage('Processing document: chunking, embedding, and saving...');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: selectedBotId,
          text: documentText,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setUploadStatus('success');
      setUploadMessage(data.message || 'Ingestion completed!');
      setDocumentText('');
    } catch (err: any) {
      console.error(err);
      setUploadStatus('error');
      setUploadMessage(err.message || 'An error occurred during upload.');
    }
  };

  // ─── Handle Chat Message ───
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId) {
      alert('Please select or create a bot first.');
      return;
    }
    if (!questionText.trim() || chatStatus === 'loading') return;

    const userMsg = questionText.trim();
    setQuestionText('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatStatus('loading');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: selectedBotId,
          message: userMsg,
          conversation_id: conversationId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chat failed');

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      setLastChunks(data.contextUsed || []);
      setChatStatus('success');
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || 'Failed to get response'}` }]);
      setChatStatus('error');
    }
  };

  const startNewConversation = () => {
    setConversationId('');
    setChatMessages([]);
    setLastChunks([]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <header className="max-w-6xl mx-auto mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            No-Code AI Chatbot Platform
          </h1>
          <p className="text-slate-400 mt-1">Phase 1: Core RAG &amp; Embedding Engine Testing Playground</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="bot-select" className="text-sm font-semibold text-slate-300">Active Bot:</label>
          <select
            id="bot-select"
            value={selectedBotId}
            onChange={(e) => {
              setSelectedBotId(e.target.value);
              startNewConversation();
            }}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {bots.length === 0 ? (
              <option value="">-- No Bots Created --</option>
            ) : (
              bots.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.language})</option>
              ))
            )}
          </select>
          <button
            onClick={fetchBots}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg border border-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: BOT MANAGE & INGEST */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* Create Bot Card */}
          <section className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-teal-400 mb-4 flex items-center gap-2">
              <span>🤖</span> Create New Bot
            </h2>
            <form onSubmit={handleCreateBot} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Bot Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Support Bot"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Personality Prompt</label>
                <textarea
                  placeholder="Define how the bot should behave..."
                  value={newBotPrompt}
                  onChange={(e) => setNewBotPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 h-20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Language</label>
                  <select
                    value={newBotLanguage}
                    onChange={(e) => setNewBotLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Owner Email</label>
                  <input
                    type="email"
                    placeholder="notifications@acme.com"
                    value={newBotEmail}
                    onChange={(e) => setNewBotEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createBotStatus === 'loading'}
                className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-slate-950 font-bold py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {createBotStatus === 'loading' ? 'Creating...' : 'Create Bot'}
              </button>

              {createBotStatus !== 'idle' && (
                <div className={`text-xs p-2.5 rounded-lg mt-1 border ${
                  createBotStatus === 'success' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 
                  createBotStatus === 'error' ? 'bg-rose-950/30 border-rose-800 text-rose-400' : 'text-slate-300 border-slate-700'
                }`}>
                  {createBotMsg}
                </div>
              )}
            </form>
          </section>

          {/* Ingest Documents Card */}
          <section className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-teal-400 mb-4 flex items-center gap-2">
              <span>📄</span> Ingest FAQ / Knowledge Base
            </h2>
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Active Bot Context
                </label>
                <div className="bg-slate-900 px-3 py-2 border border-slate-700 rounded-lg text-sm text-slate-300">
                  {selectedBot ? (
                    <div>
                      <strong>{selectedBot.name}</strong> ({selectedBot.language})
                    </div>
                  ) : (
                    <span className="text-rose-400">Please create/select a bot</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Document Content
                </label>
                <textarea
                  placeholder="Paste FAQ sheets, customer policies, guides, or other business details here..."
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 h-32 resize-none"
                  disabled={uploadStatus === 'loading' || !selectedBotId}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploadStatus === 'loading' || !selectedBotId || !documentText.trim()}
                className="w-full bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-slate-950 font-bold py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {uploadStatus === 'loading' ? 'Processing chunks...' : 'Upload & Train Bot'}
              </button>

              {uploadStatus !== 'idle' && (
                <div className={`text-xs p-2.5 rounded-lg mt-1 border ${
                  uploadStatus === 'success' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' :
                  uploadStatus === 'error' ? 'bg-rose-950/30 border-rose-800 text-rose-400' : 'text-slate-300 border-slate-700 bg-slate-900/50'
                }`}>
                  {uploadMessage}
                </div>
              )}
            </form>
          </section>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE CHAT SIMULATOR */}
        <div className="lg:col-span-2 flex flex-col bg-slate-800/40 border border-slate-700 rounded-xl shadow-xl overflow-hidden h-[650px]">
          {/* Header */}
          <div className="bg-slate-850 px-5 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>💬</span> Chat Simulator
              </h2>
              {selectedBot && (
                <p className="text-xs text-slate-400">
                  Talking to <strong>{selectedBot.name}</strong> • Language: {selectedBot.language}
                </p>
              )}
            </div>
            {conversationId && (
              <div className="flex gap-2 items-center">
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                  ID: {conversationId.substring(0, 8)}...
                </span>
                <button
                  onClick={startNewConversation}
                  className="text-xs text-rose-400 hover:text-rose-300 border border-rose-900/50 hover:bg-rose-950/20 px-2.5 py-1 rounded-lg transition"
                >
                  Reset Chat
                </button>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
                <span className="text-4xl mb-2">🤖</span>
                <p className="font-semibold text-slate-400">Chat with your custom AI agent</p>
                <p className="text-xs mt-1 max-w-sm">
                  Upload some document FAQs on the left first. Then type a message to see RAG retrieval, vector matches, and LLM output in action.
                </p>
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-teal-500 text-slate-950 rounded-br-none font-medium'
                        : 'bg-slate-750 border border-slate-700 text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {chatStatus === 'loading' && (
              <div className="flex justify-start">
                <div className="bg-slate-750 border border-slate-700 text-slate-400 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm flex items-center gap-2">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                  <span>RAG Vector Searching &amp; GPT-4o answering...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Context Details panel if available */}
          {lastChunks.length > 0 && (
            <div className="bg-slate-800 border-t border-slate-700 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowChunks(!showChunks)}
                className="text-xs font-semibold text-teal-400 flex items-center gap-1 focus:outline-none hover:text-teal-300 transition"
              >
                <span>{showChunks ? '▼' : '▶'}</span>
                View Retrieved Chunks ({lastChunks.length}) &bull; Highest Similarity: {(Math.max(...lastChunks.map(c => c.similarity)) * 100).toFixed(1)}%
              </button>
              
              {showChunks && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-2 text-[11px] text-slate-400 font-mono">
                  {lastChunks.map((chunk, idx) => (
                    <div key={chunk.id || idx} className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <div className="flex justify-between text-teal-500 font-semibold mb-1">
                        <span>Chunk #{idx + 1}</span>
                        <span>Match: {(chunk.similarity * 100).toFixed(1)}%</span>
                      </div>
                      <div className="whitespace-pre-wrap">{chunk.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendChat} className="bg-slate-850 p-4 border-t border-slate-700 flex gap-3 bg-slate-800/55">
            <input
              type="text"
              placeholder={selectedBotId ? "Ask a question..." : "Create a bot first to begin chatting"}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              disabled={chatStatus === 'loading' || !selectedBotId}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={chatStatus === 'loading' || !selectedBotId || !questionText.trim()}
              className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center"
            >
              Send
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
