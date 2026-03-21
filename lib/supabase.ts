import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  ProfileReviewFullReport,
  ProfileReviewPreviewReport,
} from "@/lib/profile-review/types";

type SupabaseClientInstance = SupabaseClient<any, "public", any>;

let publicClient: SupabaseClientInstance | null = null;
let adminClient: SupabaseClientInstance | null = null;

function getEnvValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : "";
}

function requireEnvValues(kind: "public" | "admin", names: string[]) {
  const missing = names.filter((name) => !getEnvValue(name));

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase environment variables for the ${kind} client: ${missing.join(", ")}`
    );
  }

  return Object.fromEntries(
    names.map((name) => [name, getEnvValue(name)])
  ) as Record<string, string>;
}

function createLazySupabaseClient(
  getClient: () => SupabaseClientInstance
): SupabaseClientInstance {
  return new Proxy({} as SupabaseClientInstance, {
    get(_target, prop) {
      const client = getClient();
      const value = Reflect.get(client as object, prop, client);

      return typeof value === "function" ? value.bind(client) : value;
    },
    has(_target, prop) {
      return prop in getClient();
    },
    ownKeys() {
      return Reflect.ownKeys(getClient() as object);
    },
    getOwnPropertyDescriptor(_target, prop) {
      const descriptor = Object.getOwnPropertyDescriptor(
        getClient() as object,
        prop
      );

      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}

export function getSupabase() {
  if (!publicClient) {
    const env = requireEnvValues("public", [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);

    publicClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return publicClient;
}

export function getSupabaseAdmin() {
  if (!adminClient) {
    const env = requireEnvValues("admin", [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);

    adminClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return adminClient;
}

// Lazily create clients so task files can be imported during Trigger builds
// before runtime environment variables are injected.
export const supabase = createLazySupabaseClient(getSupabase);

// Admin client for backend operations (DO NOT expose to frontend).
export const supabaseAdmin = createLazySupabaseClient(getSupabaseAdmin);

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
  url: string | null;
  image_url?: string | null;
  error_message?: string | null;
  model_id?: string | null;
  aspect_ratio?: string | null;
  trigger_run_id?: string | null;
  cost: number; // Credits consumed
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

export interface ProfileReviewSession {
  id: string;
  access_token: string;
  user_id: string | null;
  status:
    | "in_progress"
    | "awaiting_analysis"
    | "analyzed"
    | "paywalled"
    | "paid"
    | "delivered"
    | "failed";
  current_step: number;
  email: string | null;
  preview_score: number | null;
  final_score: number | null;
  failure_reason?: string | null;
  preview_ready_at?: string | null;
  paid_at?: string | null;
  delivered_at?: string | null;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileReviewAnswer {
  id: string;
  session_id: string;
  step_key: string;
  question: string;
  answer_value: string;
  answer_label: string;
  raw_payload: Record<string, unknown>;
  answered_at: string;
  created_at: string;
}

export interface ProfileReviewImage {
  id: string;
  session_id: string;
  storage_provider: string;
  storage_path: string;
  mime_type?: string | null;
  file_name?: string | null;
  signed_url_cache?: string | null;
  sort_order: number;
  analysis_status: "pending" | "processing" | "completed" | "failed";
  analysis_score?: number | null;
  created_at: string;
}

export interface ProfileReviewReport {
  id: string;
  session_id: string;
  model_name: string;
  model_version?: string | null;
  prompt_version: string;
  preview_report: ProfileReviewPreviewReport;
  full_report: ProfileReviewFullReport;
  raw_model_output: Record<string, unknown>;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileReviewOrder {
  id: string;
  session_id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  provider: string;
  provider_order_id: string;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}
