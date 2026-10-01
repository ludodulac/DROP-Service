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

  if (error) {\n    // The address may already have been confirmed by Supabase even if this\n    // browser cannot exchange the PKCE code. Never fall through with a stale\n    // owner session: clear it and ask the artisan to sign in explicitly.\n    await supabase.auth.signOut();\n    loginUrl.searchParams.set("confirmed", "1");\n    return NextResponse.redirect(loginUrl);\n  }\n\n  // A successful exchange now represents the identity that clicked this\n  // confirmation link. Send a new artisan directly to onboarding.\n  return NextResponse.redirect(new URL("/onboarding", request.url));
}
