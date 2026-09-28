import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase-server";

const OWNER_EMAIL = "ludodulac@gmail.com";

export type AuthDestination = "/login" | "/admin" | "/dashboard" | "/onboarding";

export async function resolveAuthDestination(): Promise<AuthDestination> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user) {
    return "/login";
  }

  if ((user.email ?? "").trim().toLowerCase() === OWNER_EMAIL) {
    return "/admin";
  }

  const { data: artisan, error: artisanError } = await supabase
    .from("drop_service_artisans")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (artisanError) {
    throw new Error("artisan_role_lookup_failed");
  }

  return artisan ? "/dashboard" : "/onboarding";
}
