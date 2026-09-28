import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnvDiagnostic } from "@/lib/supabase-env-diagnostic";

export function createPrivilegedSupabaseClient() {
  const diagnostic = getSupabaseEnvDiagnostic();
  if (diagnostic.missingEnv.length > 0) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    return null;
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
