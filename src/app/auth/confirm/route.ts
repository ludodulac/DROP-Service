import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const loginUrl = new URL("/login", request.url);

  if (!code) {
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // The address may already have been confirmed by Supabase even if this
    // browser cannot exchange the PKCE code. Never fall through with a stale
    // owner session: clear it and ask the artisan to sign in explicitly.
    await supabase.auth.signOut();
    loginUrl.searchParams.set("confirmed", "1");
    return NextResponse.redirect(loginUrl);
  }

  // A successful exchange now represents the identity that clicked this
  // confirmation link. Send a new artisan directly to onboarding.
  return NextResponse.redirect(new URL("/onboarding", request.url));
}
