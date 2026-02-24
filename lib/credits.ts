import { supabaseAdmin } from "@/lib/supabase";

/**
 * Credit Management Utilities
 * Handles credit deduction, refund, and balance checks
 */

/**
 * Deduct credits from user account (atomic operation)
 *
 * @param userId - Clerk user ID
 * @param amount - Number of credits to deduct
 * @returns true if successful, false if insufficient balance
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("Credit deduction error:", error);
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }

  return data as boolean;
}

/**
 * Add credits to user account (used for refunds)
 *
 * @param userId - Clerk user ID
 * @param amount - Number of credits to add
 * @returns New balance
 */
export async function addCredits(
  userId: string,
  amount: number
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("Credit addition error:", error);
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  return data as number;
}

/**
 * Get user's current credit balance
 *
 * @param userId - Clerk user ID
 * @returns Current credit balance
 */
export async function getCreditBalance(
  userId: string
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Failed to get credit balance:", error);
    throw new Error(`Failed to get credit balance: ${error.message}`);
  }

  return data?.credits || 0;
}

/**
 * Get user statistics
 *
 * @param userId - Clerk user ID
 * @returns User stats (credits, generations, total spent)
 */
export async function getUserStats(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("get_user_stats", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Failed to get user stats:", error);
    throw new Error(`Failed to get user stats: ${error.message}`);
  }

  return data;
}

/**
 * Ensure user exists in database
 * Creates user if not exists
 *
 * @param userId - Clerk user ID
 * @param email - User email
 */
export async function ensureUserExists(
  userId: string,
  email: string
): Promise<void> {
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingUser) {
    console.log(`Creating user: ${userId}`);
    const { error } = await supabaseAdmin.from("users").insert({
      id: userId,
      email: email,
      credits: 0,
    });

    if (error && !error.message.includes("duplicate")) {
      console.error("Failed to create user:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
}

/**
 * Credit costs for different generation types
 */
export const CREDIT_COSTS = {
  image: 1,
  video: 10, // Reserved for future
} as const;

/**
 * Check if user has sufficient credits
 *
 * @param userId - Clerk user ID
 * @param requiredCredits - Number of credits required
 * @returns true if user has enough credits
 */
export async function hasSufficientCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance >= requiredCredits;
}
