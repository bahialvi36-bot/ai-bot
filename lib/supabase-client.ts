import { createBrowserClient } from '@supabase/ssr';

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

function createDemoQuery(table: string) {
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

  return {
    select() {
      return {
        order: async () => ({ data: rows, error: null }),
        eq: () => ({
          single: async () => ({ data: rows[0] ?? null, error: null }),
        }),
        single: async () => ({ data: rows[0] ?? null, error: null }),
      };
    },
    insert(values: any) {
      const insertion = Array.isArray(values) ? values : [values];
      return {
        select() {
          return {
            single: async () => ({ data: { id: 'demo-bot', ...insertion[0] }, error: null }),
          };
        },
        single: async () => ({ data: { id: 'demo-bot', ...insertion[0] }, error: null }),
      };
    },
    update() {
      return Promise.resolve({ data: rows, error: null });
    },
    delete() {
      return Promise.resolve({ data: null, error: null });
    },
  };
}

function createDemoClient() {
  return {
    auth: {
      getSession: async () => {
        const session = getStoredDemoSession();
        return {
          data: { session: session ?? null },
          error: null,
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
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

export function createClient() {
  if (hasRealSupabaseConfig()) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return createDemoClient();
}
