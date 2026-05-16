import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAppAuthSession } from "@/lib/local-dev-auth";
import { isLocalDevAuthEnabled } from "@/lib/local-dev-auth-shared";
import { resolveUserStatsRecord } from "@/lib/user-stats";
import { findUserIdentityRecords } from "@/lib/user-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId, email } = await getAppAuthSession();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (isLocalDevAuthEnabled()) {
      return NextResponse.json(
        {
          credits: 100,
          generations: 0,
          totalSpent: 0,
          local: true,
        },
        { status: 200 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[user/stats] Missing Supabase env vars");
      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let identity;
    try {
      identity = await findUserIdentityRecords({
        userId,
        email,
      });
    } catch (error) {
      console.error("[user/stats] Query users failed:", error);
      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    const resolution = resolveUserStatsRecord({
      userId,
      email,
      recordById: identity.recordById,
      recordByEmail: identity.recordByEmail,
    });

    if (resolution.action === "existing-user") {
      return NextResponse.json({ credits: resolution.credits }, { status: 200 });
    }

    const { error: insertError } = await supabaseAdmin.from("users").insert(resolution.user);

    if (insertError) {
      console.error("[user/stats] Insert new user failed:", {
        userId,
        email,
        error: insertError,
      });
      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    return NextResponse.json({ credits: resolution.credits }, { status: 200 });
  } catch (error: any) {
    console.error("[user/stats] Unexpected error:", {
      name: error?.name,
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack,
    });
    return NextResponse.json({ credits: 0 }, { status: 200 });
  }
}
