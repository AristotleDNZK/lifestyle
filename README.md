# AI Video & Image Generator - Global GenAI SaaS

A serverless AI generation platform powered by Volcengine AI, built for global users with credit-based monetization.

## Project Status: 🎉 Production Ready! (All Phases Complete) ✅

The complete AI generation platform is ready for deployment! All phases have been successfully implemented:
- ✅ Phase 1: Database & Infrastructure
- ✅ Phase 2: Stripe Payment Integration
- ✅ Phase 3: AI Generation Backend
- ✅ Phase 4: Frontend Dashboard & Deployment Ready

Configure your API credentials and deploy to Vercel to go live!

## What's Been Set Up

### 1. Next.js 14 Project Structure
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **Architecture**: Serverless (Vercel-ready)

### 2. Dependencies Installed
- `@clerk/nextjs` - Authentication
- `stripe` - Payment processing
- `@supabase/supabase-js` - Database client

### 3. Database Schema (`supabase_schema.sql`)

Three core tables:
- **`users`**: Stores user info and credit balance
- **`transactions`**: Records all Stripe payments
- **`generations`**: Logs all AI generation requests with R2 URLs

Critical RPC functions:
- **`deduct_credits(user_id, amount)`**: Atomic credit deduction with race condition protection
- **`add_credits(user_id, amount)`**: Safe credit addition (for Stripe webhooks)
- **`get_user_stats(user_id)`**: Fetch user statistics

### 4. Supabase Client Configuration (`lib/supabase.ts`)
- Public client for frontend operations
- Admin client for privileged backend operations
- TypeScript interfaces for all database tables

### 5. Environment Variables Template (`.env.local`)
Template file created with placeholders for:
- Supabase credentials
- Clerk authentication keys
- Stripe payment keys
- Volcengine AI API keys
- Cloudflare R2 storage credentials

### 6. Stripe Payment Integration ✅ **NEW**
- **`/api/stripe/checkout`**: Creates Stripe Checkout sessions with userId in metadata
- **`/api/webhooks/stripe`**: Handles payment completion events
- **Webhook signature verification**: Secure payment processing
- **Atomic credit addition**: Uses `add_credits` RPC for safe credit updates
- **Transaction recording**: All payments logged in database
- **Idempotency protection**: Prevents duplicate credit additions
- **Auto user creation**: Creates user account if not exists
- **Dashboard page**: `/dashboard` for purchasing credit packages

Credit Packages:
- **Starter**: 100 credits for $9.99
- **Popular**: 500 credits for $39.99 (20% OFF)
- **Pro**: 1000 credits for $69.99 (30% OFF)

See `STRIPE_SETUP.md` for detailed setup and testing instructions.

### 7. AI Generation Backend ✅ **NEW**
- **`lib/volcengine.ts`**: Volcengine Seed 2.0 API integration with HMAC-SHA256 authentication
- **`lib/r2.ts`**: Cloudflare R2 storage (S3-compatible) for permanent file hosting
- **`lib/credits.ts`**: Credit management utilities (deduct, refund, balance check)
- **`/api/generate`**: Unified generation API with atomic credit deduction
  - **Image generation**: Volcengine → Download → Upload R2 → Save DB → Return URL
  - **Video generation**: Returns "coming soon" message (stub implementation)
- **`/generate`**: Frontend generation interface with dual tabs (Image/Video)
- **Error handling**: Automatic credit refund on failure
- **Security**: Row-level locking prevents concurrent credit issues

Generation Costs:
- **Image**: 1 credit per generation
- **Video**: 10 credits (reserved for future)

Complete Flow:
```
User Request → Authenticate → Deduct Credits → Generate AI Content
→ Download → Upload to R2 → Save to DB → Return Public URL
   ↓ (If any step fails)
   → Refund Credits → Return Error
```

See `PHASE_3_COMPLETE.md` for detailed implementation and testing guide.

### 8. Dashboard & User Interface ✅ **NEW**
- **`/dashboard`**: Main control panel with real-time stats and generation history
  - Real-time credit balance display
  - Image/Video/All tabs for filtering
  - Generation history grid with previews
  - Quick stats (Total Generations, Credits Spent, Avg. Cost)
- **`/pricing`**: Dedicated credit purchase page
- **`/api/user/stats`**: User statistics API (credits, generations, spending)
- **`/api/user/generations`**: Generation history API with pagination and filtering
- **Next.js Image optimization**: Configured for R2 domains
- **Responsive design**: Mobile, tablet, and desktop optimized

User Flow:
```
Home → Login (Clerk) → Dashboard → View Stats → Purchase Credits (if needed)
→ Generate (Image/Video) → View in History → Download/Share
```

See `PHASE_4_COMPLETE.md` for dashboard features and `DEPLOYMENT.md` for production setup.

## Quick Start

### Step 1: Set Up Supabase Database

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor in the Supabase dashboard
3. Copy the entire contents of `supabase_schema.sql`
4. Paste and execute in the SQL Editor
5. Verify tables and functions are created successfully

### Step 2: Configure Environment Variables

Open `.env.local` and fill in all the values:

#### Supabase (from Supabase Dashboard > Settings > API)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Clerk (from Clerk Dashboard > API Keys)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### Stripe (from Stripe Dashboard > Developers > API Keys)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Volcengine (from Volcengine Console)
```env
VOLC_ACCESS_KEY=your-access-key
VOLC_SECRET_KEY=your-secret-key
```

#### Cloudflare R2 (from Cloudflare Dashboard > R2)
```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_DOMAIN=https://your-bucket.r2.dev
```

### Step 3: Run the Project Locally

```bash
npm run dev
```

Visit http://localhost:3000 to see the project running.

### Step 4: Build for Production

```bash
npm run build
```

The project is now ready for deployment to Vercel.

## Architecture Highlights

### Atomic Credit Deduction (Financial-Grade Safety)
The `deduct_credits` RPC function uses PostgreSQL row-level locking to prevent race conditions in a serverless environment:

```typescript
// Example usage in API route
const { data: success } = await supabaseAdmin.rpc('deduct_credits', {
  p_user_id: userId,
  p_amount: 1
});

if (!success) {
  return res.status(402).json({ error: 'Insufficient credits' });
}
```

### Dual-Client Pattern
- **Frontend**: Uses `supabase` client with anon key (safe for browser)
- **Backend**: Uses `supabaseAdmin` with service role key (privileged operations)

### Serverless-First Design
- No traditional server or database connection pools
- All operations designed for stateless execution
- Row-level security (RLS) enabled on all tables

## Project Structure

```
video_generator/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles with Tailwind
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── supabase_schema.sql      # Complete database schema
├── .env.local               # Environment variables (fill this in)
├── .gitignore               # Git ignore rules
├── next.config.mjs          # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.mjs       # PostCSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Important Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Service Role Key** - Only use in server-side code, never expose to frontend
3. **RPC Functions** - All credit operations must go through RPC for safety
4. **RLS Policies** - Enabled on all tables to prevent unauthorized access

## What's Next?

According to the project brief, the next phases are:

- **Phase 2**: Stripe payment integration and webhook handler
- **Phase 3**: Volcengine image generation + Cloudflare R2 storage
- **Phase 4**: Frontend UI with tabs (Image/Video generation)

## Support

For issues or questions, refer to the `TASK_BRIEF_GLOBAL_SAAS.md` file for detailed specifications.

---

Built with Next.js 14, Supabase, Clerk, and Stripe
