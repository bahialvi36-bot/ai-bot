import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../lib/supabase';

const FALLBACK_ANSWER =
  "I'm not sure about that — let me have the team follow up with you.";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // Get all bots belonging to this user
  const { data: bots } = await supabaseAdmin
    .from('bots')
    .select('id, name')
    .or(`user_id.eq.${user.id},owner_email.eq.${user.email}`);

  const botIds = (bots ?? []).map((b) => b.id);

  if (botIds.length === 0) {
    return NextResponse.json({
      totalConversations: 0,
      totalMessages: 0,
      unansweredCount: 0,
      unansweredQuestions: [],
      totalLeads: 0,
    });
  }

  // Total conversations across all this user's bots
  const { count: totalConversations } = await supabaseAdmin
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .in('bot_id', botIds);

  // All conversation ids for this user's bots
  const { data: convoRows } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .in('bot_id', botIds);
  const convoIds = (convoRows ?? []).map((c) => c.id);

  // Total messages
  const { count: totalMessages } = await supabaseAdmin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convoIds.length ? convoIds : ['00000000-0000-0000-0000-000000000000']);

  // All messages, in order, so we can find the user question right before
  // each fallback answer
  const { data: allMessages } = await supabaseAdmin
    .from('messages')
    .select('conversation_id, role, content, created_at')
    .in('conversation_id', convoIds.length ? convoIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: true });

  const unansweredQuestions: { question: string; count: number }[] = [];
  const questionCounts = new Map<string, number>();

  (allMessages ?? []).forEach((msg, index) => {
    if (msg.role === 'assistant' && msg.content === FALLBACK_ANSWER) {
      // Find the user message right before this one, in the same conversation
      for (let i = index - 1; i >= 0; i--) {
        const prev = allMessages![i];
        if (prev.conversation_id !== msg.conversation_id) break;
        if (prev.role === 'user') {
          const key = prev.content.trim().toLowerCase();
          questionCounts.set(key, (questionCounts.get(key) ?? 0) + 1);
          break;
        }
      }
    }
  });

  questionCounts.forEach((count, question) => {
    unansweredQuestions.push({ question, count });
  });
  unansweredQuestions.sort((a, b) => b.count - a.count);

  const unansweredCount = (allMessages ?? []).filter(
    (m) => m.role === 'assistant' && m.content === FALLBACK_ANSWER
  ).length;

  // Total leads
  const { count: totalLeads } = await supabaseAdmin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .in('bot_id', botIds);

  return NextResponse.json({
    totalConversations: totalConversations ?? 0,
    totalMessages: totalMessages ?? 0,
    unansweredCount,
    unansweredQuestions: unansweredQuestions.slice(0, 10),
    totalLeads: totalLeads ?? 0,
  });
}