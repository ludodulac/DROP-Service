export type SupabaseEnvDiagnostic = {
  hasSupabaseUrl: boolean;
  hasSupabaseSecretKey: boolean;
  missingEnv: string[];
};

type EnvLike = Record<string, string | undefined>;

export function getSupabaseEnvDiagnostic(
  env: EnvLike = process.env,
): SupabaseEnvDiagnostic {
  const hasSupabaseUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseSecretKey = Boolean(env.SUPABASE_SECRET_KEY);
  const missingEnv: string[] = [];

  if (!hasSupabaseUrl) missingEnv.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!hasSupabaseSecretKey) missingEnv.push("SUPABASE_SECRET_KEY");

  return {
    hasSupabaseUrl,
    hasSupabaseSecretKey,
    missingEnv,
  };
}
