import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '*';
  try {
    const body = await request.json();
    const { bot_id, name, email, message } = body;

    if (!bot_id || !name || !email) {
      return NextResponse.json(
        { error: 'bot_id, name, and email are required.' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        bot_id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message ? message.trim() : null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting lead:', error);
      return NextResponse.json(
        { error: `Database insertion failed: ${error.message}` },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, lead_id: lead.id },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Leads route error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during lead processing.' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
