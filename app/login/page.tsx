'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted && session?.user) {
        router.replace('/dashboard');
      }
    };

    checkUser();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setStatus('loading');
    setMessage('');

    const supabase = createClient();

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        setStatus('success');
        setMessage(
          data.user && 'identities' in data.user && Array.isArray((data.user as any).identities) && (data.user as any).identities.length === 0
            ? 'This email is already registered. Try logging in.'
            : 'Registration successful! Check your email for verification link.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        setStatus('success');
        setMessage('Login successful! Redirecting...');
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'An error occurred during authentication.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl">🤖</span>
          <h1 className="text-2xl font-extrabold mt-3 tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            Chatbot Platform
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isSignUp ? 'Create your platform account' : 'Sign in to manage your AI agents'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 active:from-teal-700 active:to-indigo-800 text-slate-950 font-bold py-3 rounded-xl text-sm tracking-wide transition shadow-lg shadow-teal-500/10 disabled:opacity-50 mt-2"
          >
            {status === 'loading' ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          {status !== 'idle' && (
            <div className={`text-xs p-3 rounded-xl border ${
              status === 'success' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' :
              status === 'error' ? 'bg-rose-950/30 border-rose-800 text-rose-400' : 'bg-slate-900/50 border-slate-700 text-slate-300'
            }`}>
              {message}
            </div>
          )}

        </form>

        <div className="border-t border-slate-700 mt-6 pt-5 text-center text-sm text-slate-400">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setMessage(''); setStatus('idle'); }}
                className="text-teal-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setMessage(''); setStatus('idle'); }}
                className="text-teal-400 hover:underline font-semibold"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
