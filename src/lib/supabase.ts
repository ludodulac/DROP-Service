import { createClient } from "@supabase/supabase-js";

// Vercel injects NEXT_PUBLIC_* variables at build time. Keep the environment
// variables as the primary source, with public Supabase values as a safe
// fallback so static build analysis cannot fail before the app is deployed.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://nczdadkyysrxxcsnsrrn.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_fTm-7olaGmH1jqpkE7xXng_eaaiRoKE";

export const supabase = createClient(supabaseUrl, supabaseKey);
