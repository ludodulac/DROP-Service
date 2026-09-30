import { NextResponse } from "next/server";
import { resolveAuthDestination } from "@/lib/auth-role-server";

export const dynamic = "force-dynamic";

function noStore(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET() {
  try {
    const destination = await resolveAuthDestination();

    if (destination === "/login") {
      return noStore({ authenticated: false, destination }, 401);
    }

    return noStore({ authenticated: true, destination }, 200);
  } catch {
    console.error("auth_destination_failed");
    return noStore({ error: "role_resolution_failed" }, 500);
  }
}
