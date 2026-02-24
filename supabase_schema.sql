-- =====================================================
-- Global GenAI SaaS - Database Schema
-- =====================================================
-- This schema supports a credit-based AI generation platform
-- with Clerk authentication and Stripe payments
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: users
-- =====================================================
-- Stores user information and credit balance
-- id corresponds to Clerk User ID

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- Clerk User ID
  email TEXT NOT NULL UNIQUE,             -- User email
  credits INTEGER NOT NULL DEFAULT 0,     -- Current credit balance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- Table: transactions
-- =====================================================
-- Records all credit purchases via Stripe
-- Used for accounting and reconciliation

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                -- Payment amount in cents (e.g., 1999 = $19.99)
  credits_added INTEGER NOT NULL,         -- Number of credits added to account
  stripe_payment_id TEXT NOT NULL UNIQUE, -- Stripe Payment Intent ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Index for faster lookups by Stripe payment ID (for webhook verification)
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_id ON transactions(stripe_payment_id);

-- =====================================================
-- Table: generations
-- =====================================================
-- Records all AI generation requests (images and videos)
-- Stores the Cloudflare R2 URL for each generation

CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  prompt TEXT NOT NULL,                   -- User's prompt
  url TEXT NOT NULL,                      -- Cloudflare R2 public URL
  cost INTEGER NOT NULL,                  -- Credits consumed for this generation
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);

-- Index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_generations_type ON generations(type);

-- Index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);

-- Compound index for user's generation history (most common query)
CREATE INDEX IF NOT EXISTS idx_generations_user_created ON generations(user_id, created_at DESC);

-- =====================================================
-- RPC Function: deduct_credits
-- =====================================================
-- CRITICAL: Atomic credit deduction with balance check
-- This function ensures thread-safe credit deduction in a
-- serverless environment where concurrent requests can occur
--
-- Parameters:
--   p_user_id: The Clerk user ID
--   p_amount: Number of credits to deduct
--
-- Returns:
--   TRUE if deduction successful
--   FALSE if insufficient balance
--
-- Usage in Next.js API:
--   const { data, error } = await supabaseAdmin.rpc('deduct_credits', {
--     p_user_id: userId,
--     p_amount: 1
--   });
--   if (!data) return res.status(402).json({ error: 'Insufficient credits' });

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id TEXT,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Lock the user row for update to prevent race conditions
  SELECT credits INTO current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Check if sufficient balance
  IF current_balance < p_amount THEN
    RETURN FALSE; -- Insufficient credits
  END IF;

  -- Deduct credits atomically
  UPDATE users
  SET credits = credits - p_amount
  WHERE id = p_user_id;

  RETURN TRUE; -- Success
END;
$$;

-- =====================================================
-- RPC Function: add_credits
-- =====================================================
-- Safely add credits to a user's account
-- Used by Stripe webhook after successful payment
--
-- Parameters:
--   p_user_id: The Clerk user ID
--   p_amount: Number of credits to add
--
-- Returns:
--   New credit balance

CREATE OR REPLACE FUNCTION add_credits(
  p_user_id TEXT,
  p_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Lock the user row for update
  UPDATE users
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO new_balance;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  RETURN new_balance;
END;
$$;

-- =====================================================
-- RPC Function: get_user_stats
-- =====================================================
-- Get user statistics (credits, generation count, etc.)
--
-- Parameters:
--   p_user_id: The Clerk user ID
--
-- Returns:
--   JSON object with user stats

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_credits INTEGER;
  total_generations INTEGER;
  total_spent INTEGER;
  result JSON;
BEGIN
  -- Get user credits
  SELECT credits INTO user_credits
  FROM users
  WHERE id = p_user_id;

  -- Count total generations
  SELECT COUNT(*), COALESCE(SUM(cost), 0)
  INTO total_generations, total_spent
  FROM generations
  WHERE user_id = p_user_id AND status = 'completed';

  -- Build result JSON
  result := json_build_object(
    'credits', COALESCE(user_credits, 0),
    'total_generations', COALESCE(total_generations, 0),
    'total_spent', COALESCE(total_spent, 0)
  );

  RETURN result;
END;
$$;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================
-- Uncomment to insert test data

-- INSERT INTO users (id, email, credits) VALUES
--   ('test_user_001', 'test@example.com', 100);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
-- Enable RLS on all tables for security

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = auth.jwt() ->> 'sub');

-- Users can only read their own transactions
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Users can only read their own generations
CREATE POLICY generations_select_own ON generations
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Service role can do anything (bypass RLS)
-- This is handled by using supabaseAdmin client with service role key

-- =====================================================
-- Grants and Permissions
-- =====================================================
-- Grant execute permissions on RPC functions

GRANT EXECUTE ON FUNCTION deduct_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION add_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits(TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION get_user_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(TEXT) TO service_role;

-- =====================================================
-- Schema Setup Complete
-- =====================================================
-- To apply this schema:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- 4. Verify tables and functions are created
-- =====================================================
