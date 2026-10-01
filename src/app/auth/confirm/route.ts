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
    return NextResponse.redirect(loginUrl);
  }

  // /login already delegates authenticated users to the existing role resolver:
  // owner -> /admin, artisan -> /dashboard, authenticated user without profile -> /onboarding.
  return NextResponse.redirect(loginUrl);
}
