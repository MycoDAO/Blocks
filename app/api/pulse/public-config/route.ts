import { NextResponse } from "next/server";
import { getProducerOAuthRedirectUrl } from "@/lib/server/producer-oauth-redirect";
import { getPublicSupabaseConfig } from "@/lib/server/supabase-public";

export const dynamic = "force-dynamic";

/** Client-safe integration config (no secrets beyond public Supabase anon key). */
export async function GET() {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseConfig();
  const producerOAuthRedirect = getProducerOAuthRedirectUrl();
  return NextResponse.json({
    supabaseUrl,
    supabaseAnonKey,
    producerOAuthRedirect,
    producerAuthConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    time: new Date().toISOString(),
  });
}
