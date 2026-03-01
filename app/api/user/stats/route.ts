import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized - Please sign in" },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("credits")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load credits" },
      { status: 500 }
    );
  }

  return NextResponse.json({ credits: data?.credits ?? 0 });
}
