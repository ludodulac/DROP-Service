import { createClient } from "@supabase/supabase-js";

// Vercel can expose configured variables as empty strings during build.
// Use || instead of ?? so empty values fall back to the public Supabase config.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nczdadkyysrxxcsnsrrn.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_fTm-7olaGmH1jqpkE7xXng_eaaiRoKE";

export const supabase = createClient(supabaseUrl, supabaseKey);
