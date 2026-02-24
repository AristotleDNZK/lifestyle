import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabaseAdmin
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by type if specified
    if (type && (type === "image" || type === "video")) {
      query = query.eq("type", type);
    }

    const { data: generations, error: genError } = await query;

    if (genError) {
      console.error("Failed to get generations:", genError);
      return NextResponse.json(
        { error: "Failed to load generation history" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (type && (type === "image" || type === "video")) {
      countQuery = countQuery.eq("type", type);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      generations: generations || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Generations history error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
