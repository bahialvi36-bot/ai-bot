import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

function hasRealSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return Boolean(
    url &&
      anonKey &&
      url.includes('supabase.co') &&
      !url.includes('your-supabase-project-url-here') &&
      anonKey.length > 20 &&
      !anonKey.includes('your-supabase-anon-key-here')
  );
}

function getStoredDemoSession() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem('chatbot-platform-demo-session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredDemoSession(session: any) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('chatbot-platform-demo-session', JSON.stringify(session));
  }
}

function clearStoredDemoSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('chatbot-platform-demo-session');
  }
}

function createDemoQuery(table: string): any {
  const fallbackRows = {
    bots: [
      {
        id: 'demo-bot',
        name: 'Demo Bot',
        personality_prompt: 'Friendly support assistant for local testing.',
        language: 'English',
        created_at: new Date().toISOString(),
      },
    ],
    conversations: [],
    messages: [],
    leads: [],
    document_chunks: [],
  } as Record<string, any[]>;

  const rows = fallbackRows[table] ?? [];

  const queryObj: any = {
    _data: null,
    select: () => queryObj,
    insert: (values: any) => {
      const insertion = Array.isArray(values) ? values : [values];
      queryObj._data = { id: 'demo-bot', ...insertion[0] };
      return queryObj;
    },
    update: () => queryObj,
    delete: () => queryObj,
    eq: () => queryObj,
    or: () => queryObj,
    in: () => queryObj,
    order: () => queryObj,
    single: async () => ({ data: queryObj._data ?? rows[0] ?? null, error: null }),
    then: (resolve: any) => resolve({ data: queryObj._data ?? rows, count: rows.length, error: null }),
  };

  return queryObj;
}

function createDemoClient(): any {
  return {
    auth: {
      getSession: async () => {
        const session = getStoredDemoSession();
        return {
          data: { session: session ?? null },
          error: null,
        };
      },
      signInWithPassword: async ({ email }: { email: string; password: string }) => {
        const session = {
          user: {
            id: 'demo-user',
            email,
            role: 'authenticated',
          },
          access_token: 'demo-token',
          refresh_token: 'demo-refresh',
        };
        saveStoredDemoSession(session);
        return { data: { user: session.user }, error: null };
      },
      signUp: async ({ email }: { email: string; password: string }) => {
        const session = {
          user: {
            id: 'demo-user',
            email,
            role: 'authenticated',
          },
          access_token: 'demo-token',
          refresh_token: 'demo-refresh',
        };
        saveStoredDemoSession(session);
        return { data: { user: session.user, session }, error: null };
      },
      signOut: async () => {
        clearStoredDemoSession();
        return { error: null };
      },
    },
    from(table: string) {
      return createDemoQuery(table);
    },
  };
}

export function createClient(): SupabaseClient<any, "public", any> {
  if (hasRealSupabaseConfig()) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ) as any;
  }

  return createDemoClient() as any;
}

