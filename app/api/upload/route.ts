import { NextResponse } from 'next/server';
import { embedText } from '../../../lib/gemini';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../lib/supabase';

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// Simple helper to split text into chunks of roughly 500 words
function splitIntoChunks(text: string, wordsPerChunk = 500): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0 || words[0] === '') {
    return [];
  }

  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  return chunks;
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '*';
  try {
    // Check environment variables first
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not set.' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: 'Supabase URL or Service Key environment variable is not set.' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    // Determine and parse content
    let bot_id = '';
    let text = '';
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      bot_id = body.bot_id || '';
      text = body.text || '';
    } else {
      // In case of plain text uploads (needs query params or URL segments for bot_id)
      const url = new URL(request.url);
      bot_id = url.searchParams.get('bot_id') || '';
      text = await request.text();
    }

    if (!bot_id) {
      return NextResponse.json(
        { error: 'No bot_id provided in the request.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'No text content provided in the request body.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const { data: bot, error: botError } = await supabaseAdmin
      .from('bots')
      .select('id, user_id, owner_email')
      .eq('id', bot_id)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: `Bot with ID ${bot_id} does not exist.` },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const currentEmail = user.email?.trim().toLowerCase() || '';
    const isOwner = bot.user_id
      ? bot.user_id === user.id
      : bot.owner_email
        ? !!currentEmail && bot.owner_email.toLowerCase() === currentEmail
        : true;

    if (!isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to upload documents for this bot.' },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    // Split text into chunks
    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to split text into valid chunks.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Generate embeddings one chunk at a time using Gemini
    const insertions = [];
    for (const chunk of chunks) {
      let embedding: number[] | null = null;
      try {
        embedding = await embedText(chunk);
      } catch (embedErr: any) {
        // DEBUG: log the exact embedding failure reason
        console.error('UPLOAD DEBUG: embedText threw an error:', embedErr?.message || embedErr);
        return NextResponse.json(
          { error: `Embedding generation failed: ${embedErr?.message || 'unknown error'}` },
          { status: 500, headers: corsHeaders(origin) }
        );
      }

      // DEBUG: log what embedText actually returned
      console.log(
        'UPLOAD DEBUG: embedding type =',
        Array.isArray(embedding) ? `array[${embedding.length}]` : typeof embedding
      );

      if (!Array.isArray(embedding) || embedding.length === 0) {
        console.error('UPLOAD DEBUG: embedding was empty/invalid for chunk:', chunk.slice(0, 50));
        return NextResponse.json(
          { error: 'Embedding generation returned an empty result. Check GEMINI_API_KEY and model name.' },
          { status: 500, headers: corsHeaders(origin) }
        );
      }

      insertions.push({
        bot_id,
        content: chunk,
        embedding,
      });
    }

    // Save into Supabase table using the admin client
    const { error: dbError } = await supabaseAdmin
      .from('document_chunks')
      .insert(insertions);

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json(
        { error: `Supabase insert failed: ${dbError.message}` },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Document split into ${chunks.length} chunk(s) and saved with vector embeddings.`,
      chunksCount: chunks.length,
    }, { headers: corsHeaders(origin) });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during document processing.' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}