import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Get User Statistics
 * Returns credit balance and generation stats
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

    // Get user stats using RPC function
    const { data: stats, error: statsError } = await supabaseAdmin.rpc(
      "get_user_stats",
      {
        p_user_id: userId,
      }
    );

    if (statsError) {
      console.error("Failed to get user stats:", statsError);
      return NextResponse.json(
        { error: "Failed to load user statistics" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      userId,
      credits: stats.credits || 0,
      totalGenerations: stats.total_generations || 0,
      totalSpent: stats.total_spent || 0,
    });
  } catch (error: any) {
    console.error("User stats error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
