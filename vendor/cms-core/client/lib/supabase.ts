import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
let hasWarnedSessionFetchFailure = false;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: sessionStorage,
      persistSession: true,
    },
  }
);

export async function getSessionSafe(): Promise<Session | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session ?? null;
  } catch (error) {
    if (!hasWarnedSessionFetchFailure) {
      hasWarnedSessionFetchFailure = true;
      console.warn("[supabase] Failed to load auth session", error);
    }
    return null;
  }
}

export async function getAccessTokenSafe(): Promise<string | undefined> {
  const session = await getSessionSafe();
  return session?.access_token;
}
