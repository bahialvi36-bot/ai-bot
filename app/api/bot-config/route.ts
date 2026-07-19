import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') || '*';
  try {
    const { searchParams } = new URL(request.url);
    const bot_id = searchParams.get('bot_id');

    if (!bot_id) {
      return NextResponse.json(
        { error: 'No bot_id provided.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { data: bot, error } = await supabaseAdmin
      .from('bots')
      .select('name, language, conversation_starters')
      .eq('id', bot_id)
      .single();

    if (error || !bot) {
      return NextResponse.json(
        { error: 'Bot not found.' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(bot, { headers: corsHeaders(origin) });
  } catch (error: any) {
    console.error('Error fetching bot config:', error);
    return NextResponse.json(
      { error: error?.message || 'Unexpected error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
