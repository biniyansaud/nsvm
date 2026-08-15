import { createClient, SupabaseClient } from "@supabase/supabase-js";

const envUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const rawUrl = envUrl;
const rawKey = envKey;

function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl) return false;
  try {
    const url = new URL(stringUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  isValidHttpUrl(rawUrl) &&
  !rawUrl.includes("your-project") &&
  !rawUrl.includes("example.supabase")
);

export const supabaseUrl = isSupabaseConfigured ? rawUrl : "";
export const supabaseAnonKey = isSupabaseConfigured ? rawKey : "";

function createSafeSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn("Failed to initialize Supabase client:", err);
    return null;
  }
}

export const supabase = createSafeSupabaseClient();

export function getSupabase(): SupabaseClient | null {
  return supabase;
}
