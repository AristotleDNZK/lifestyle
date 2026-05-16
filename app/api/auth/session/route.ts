import { NextResponse } from "next/server";
import { getAppAuthSession } from "@/lib/local-dev-auth";
import { isLocalDevAuthEnabled } from "@/lib/local-dev-auth-shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getAppAuthSession();

  return NextResponse.json({
    isSignedIn: Boolean(session.userId),
    userId: session.userId,
    email: session.email,
    isLocalDev: session.isLocalDev,
    localDevAuthEnabled: isLocalDevAuthEnabled(),
  });
}
