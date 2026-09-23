import { createBrowserClient } from "@supabase/ssr";

// Keep the existing public fallback so the current Vercel setup is not broken.
// This is a Supabase publishable key, not a server secret.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nczdadkyysrxxcsnsrrn.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_fTm-7olaGmH1jqpkE7xXng_eaaiRoKE";

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
