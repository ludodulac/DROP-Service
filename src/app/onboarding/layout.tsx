import { redirect } from "next/navigation";
import { resolveAuthDestination } from "@/lib/auth-role-server";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const destination = await resolveAuthDestination();

  if (destination !== "/onboarding") {
    redirect(destination);
  }

  return children;
}
