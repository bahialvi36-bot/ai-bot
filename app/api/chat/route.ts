import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '../../../lib/supabase';
import { embedText, generateChatReply } from '../../../lib/gemini';

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

const FALLBACK_ANSWER =
  "I'm not sure about that — let me have the team follow up with you.";
const SIMILARITY_THRESHOLD = 0.4;

async function sendMissedChatEmail({
  recipientEmail,
  message,
  answer,
  origin,
}: {
  recipientEmail: string;
  message: string;
  answer: string;
  origin: string;
}) {
  if (!process.env.RESEND_API_KEY || !recipientEmail) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Chatbot Platform <onboarding@resend.dev>',
      to: recipientEmail,
      subject: 'Missed chat notification',
      html: `
        <h2>Missed chat notification</h2>
        <p><strong>Origin:</strong> ${origin}</p>
        <p><strong>Visitor message:</strong> ${message}</p>
        <p><strong>Assistant response:</strong> ${answer}</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send missed chat email:', error);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '*';
  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === 'string' ? body.message : '';
  const botId = typeof body?.bot_id === 'string' ? body.bot_id : '';
  const conversationId =
    typeof body?.conversation_id === 'string' ? body.conversation_id : undefined;
  const visitorId =
    typeof body?.visitor_id === 'string'
      ? body.visitor_id
      : 'anonymous';

  // DEBUG: log exactly what we received and whether env vars are set
  console.log('CHAT DEBUG: incoming botId =', JSON.stringify(botId));
  console.log('CHAT DEBUG: SUPABASE_URL set =', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('CHAT DEBUG: SUPABASE_SERVICE_KEY set =', !!process.env.SUPABASE_SERVICE_KEY);

  if (!message.trim() || !botId) {
    return NextResponse.json(
      { error: 'Both message and bot_id are required.' },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // Look up the bot's own settings (personality, language, owner email)
  const { data: bot, error: botError } = await supabaseAdmin
    .from('bots')
    .select('id, personality_prompt, language, owner_email, user_id')
    .eq('id', botId)
    .single();

  // DEBUG: log the exact Supabase response
  console.log('CHAT DEBUG: bot =', JSON.stringify(bot));
  console.log('CHAT DEBUG: botError =', JSON.stringify(botError));

  if (botError || !bot) {
    return NextResponse.json(
      { error: 'Bot not found.' },
      { status: 404, headers: corsHeaders(origin) }
    );
  }

  // Ensure a conversation exists to attach messages to
  let convoId = conversationId;
  if (!convoId) {
    const { data: newConvo } = await supabaseAdmin
      .from('conversations')
      .insert({ bot_id: botId, visitor_id: visitorId })
      .select('id')
      .single();
    convoId = newConvo?.id;
  }

  if (convoId) {
    await supabaseAdmin
      .from('messages')
      .insert({ conversation_id: convoId, role: 'user', content: message });
  }

  let answer: string;

  try {
    // Embed the visitor's question and find the closest matching chunks
    // for THIS bot only.
    const queryEmbedding = await embedText(message);

    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_bot_id: botId,
        match_count: 3,
      }
    );

    if (matchError) {
      console.error('match_documents error:', matchError);
    }

    const goodMatches = (matches ?? []).filter(
      (m: { similarity: number }) => m.similarity >= SIMILARITY_THRESHOLD
    );

    if (goodMatches.length === 0) {
      answer = FALLBACK_ANSWER;
    } else {
      const context = goodMatches
        .map((m: { content: string }) => m.content)
        .join('\n\n---\n\n');

      const personality =
        bot.personality_prompt ||
        'You are a friendly, helpful customer support assistant.';
      const language = bot.language || 'English';

      const systemPrompt = `${personality}

You must answer ONLY using the information in the CONTEXT below. If the answer
isn't clearly contained in the context, respond with exactly:
"${FALLBACK_ANSWER}"
Respond in this language: ${language}.

CONTEXT:
${context}`;

      answer = await generateChatReply(systemPrompt, message);
    }
  } catch (error) {
    console.error('Chat route error:', error);
    answer = FALLBACK_ANSWER;
  }

  if (convoId) {
    await supabaseAdmin
      .from('messages')
      .insert({ conversation_id: convoId, role: 'assistant', content: answer });
  }

  if (answer === FALLBACK_ANSWER) {
    await sendMissedChatEmail({
      recipientEmail: bot.owner_email || '',
      message,
      answer,
      origin,
    });
  }

  const isFallback = answer === FALLBACK_ANSWER;

  return NextResponse.json(
    {
      answer,
      conversation_id: convoId,
      isFallback,
    },
    {
      headers: corsHeaders(origin),
    }
  );
}