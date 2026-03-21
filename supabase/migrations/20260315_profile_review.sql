create extension if not exists "uuid-ossp";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists profile_review_sessions (
  id uuid primary key default uuid_generate_v4(),
  access_token text not null unique,
  user_id text references users(id) on delete set null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'awaiting_analysis', 'analyzed', 'paywalled', 'paid', 'delivered', 'failed')),
  current_step integer not null default 1,
  email text,
  preview_score integer check (preview_score between 0 and 50),
  final_score integer check (final_score between 0 and 50),
  failure_reason text,
  preview_ready_at timestamptz,
  paid_at timestamptz,
  delivered_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profile_review_sessions_user_id
  on profile_review_sessions(user_id);

create index if not exists idx_profile_review_sessions_status
  on profile_review_sessions(status);

create table if not exists profile_review_answers (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references profile_review_sessions(id) on delete cascade,
  step_key text not null,
  question text not null,
  answer_value text not null,
  answer_label text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(session_id, step_key)
);

create index if not exists idx_profile_review_answers_session_id
  on profile_review_answers(session_id);

create table if not exists profile_review_images (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references profile_review_sessions(id) on delete cascade,
  storage_provider text not null default 'supabase',
  storage_path text not null,
  mime_type text,
  file_name text,
  signed_url_cache text,
  sort_order integer not null,
  analysis_status text not null default 'pending'
    check (analysis_status in ('pending', 'processing', 'completed', 'failed')),
  analysis_score integer check (analysis_score between 0 and 50),
  created_at timestamptz not null default now(),
  unique(session_id, sort_order)
);

create index if not exists idx_profile_review_images_session_id
  on profile_review_images(session_id);

create table if not exists profile_review_reports (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null unique references profile_review_sessions(id) on delete cascade,
  model_name text not null,
  model_version text,
  prompt_version text not null,
  preview_report jsonb not null default '{}'::jsonb,
  full_report jsonb not null default '{}'::jsonb,
  raw_model_output jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profile_review_orders (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null unique references profile_review_sessions(id) on delete cascade,
  user_id text references users(id) on delete set null,
  amount integer not null,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  provider text not null default 'mock',
  provider_order_id text not null unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profile_review_orders_user_id
  on profile_review_orders(user_id);

drop trigger if exists set_profile_review_sessions_updated_at on profile_review_sessions;
create trigger set_profile_review_sessions_updated_at
before update on profile_review_sessions
for each row
execute function set_updated_at();

drop trigger if exists set_profile_review_reports_updated_at on profile_review_reports;
create trigger set_profile_review_reports_updated_at
before update on profile_review_reports
for each row
execute function set_updated_at();

drop trigger if exists set_profile_review_orders_updated_at on profile_review_orders;
create trigger set_profile_review_orders_updated_at
before update on profile_review_orders
for each row
execute function set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-review-photos',
  'profile-review-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
