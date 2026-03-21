import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRIVILEGED_EMAILS = new Set([
  "gelinlandao2000@gmail.com",
  "nuoweileinaxiawan@gmail.com",
]);

export async function GET() {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
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

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[user/stats] Query users failed:", error);
      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    const isPrivileged = PRIVILEGED_EMAILS.has(email.toLowerCase());

    if (data) {
      if (isPrivileged) {
        return NextResponse.json({ credits: data.credits ?? 0 }, { status: 200 });
      }

      if ((data.credits ?? 0) !== 0) {
        const { error: resetError } = await supabaseAdmin
          .from("users")
          .update({ credits: 0 })
          .eq("id", userId);

        if (resetError) {
          console.error("[user/stats] Reset credits failed:", {
            userId,
            email,
            error: resetError,
          });
        }
      }

      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email,
      credits: 0,
    });

    if (insertError) {
      console.error("[user/stats] Insert new user failed:", {
        userId,
        email,
        error: insertError,
      });
      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    return NextResponse.json({ credits: 0 }, { status: 200 });
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
