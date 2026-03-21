import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { retryAsync } from "@/lib/retry";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Get User's Generation History
 * Returns list of all generations with optional type filter
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type"); // 'image' or 'video' or null (all)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "8", 10) || 8);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query: only successful generations with non-empty URL
    let query = supabaseAdmin
      .from("generations")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("url", "is", null)
      .neq("url", "")
      .order("created_at", { ascending: false })
      .range(from, to);

    // Filter by type if specified
    if (type && (type === "image" || type === "video")) {
      query = query.eq("type", type);
    }

    const { data: generations, error: genError, count } = await retryAsync(
      async () => query,
      { retries: 2, delayMs: 500 }
    );

    if (genError) {
      console.error("Failed to get generations:", genError);
      return NextResponse.json(
        { error: "Failed to load generation history" },
        { status: 500 }
      );
    }

    const list = generations || [];
    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return NextResponse.json({
      data: list,
      generations: list,
      total,
      page,
      totalPages,
      limit,
      from,
      to,
    });
  } catch (error: any) {
    console.error("Generations history error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
