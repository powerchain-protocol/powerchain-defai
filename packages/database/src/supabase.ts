import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | undefined;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}

function validatedUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("SUPABASE_URL_MUST_USE_HTTPS");
  }
  if (url.username || url.password || url.hash) throw new Error("SUPABASE_URL_INVALID");
  return url.toString().replace(/\/$/, "");
}

/**
 * Server-only Supabase client. The service-role key is never exported to browser code.
 * Use Prisma for canonical transactional persistence; use this client for Supabase-native
 * services such as Storage, Auth administration, Realtime, and Edge Function integration.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (serverClient) return serverClient;
  const url = validatedUrl(required("SUPABASE_URL"));
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  serverClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "x-application-name": process.env.POWERCHAIN_DB_APPLICATION_NAME?.trim() || "powerchain-defai" } },
  });
  return serverClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
