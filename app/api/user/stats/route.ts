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
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Ensure user exists in database (auto-create with free credits)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, credits")
      .eq("id", userId)
      .single();

    if (!existingUser) {
      console.log("User not found in stats API - creating new user with 10 free credits");

      // Get user email from Clerk
      const userEmail = authResult.user?.emailAddresses[0]?.emailAddress || `${userId}@temp.local`;

      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: userEmail,
          credits: 10, // Free credits for new users
        });

      if (insertError) {
        console.error("Failed to create user in stats API:", insertError);
      }
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
