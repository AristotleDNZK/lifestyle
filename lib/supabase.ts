import { createClient } from "@supabase/supabase-js";

// Supabase URL and Keys from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for frontend usage (safe to expose)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations (DO NOT expose to frontend)
// Used for: Stripe webhooks, RPC calls, and privileged operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database Types
export interface User {
  id: string; // Clerk User ID
  email: string;
  credits: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number; // Payment amount in cents
  credits_added: number;
  stripe_payment_id: string;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  type: "image" | "video";
  prompt: string;
  url: string; // Cloudflare R2 public URL
  cost: number; // Credits consumed
  status: "completed" | "failed";
  created_at: string;
}
