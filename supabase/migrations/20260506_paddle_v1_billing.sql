create extension if not exists "uuid-ossp";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists billing_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references users(id) on delete cascade,
  email text,
  provider text not null default 'paddle',
  product_type text not null
    check (product_type in ('credits', 'subscription', 'profile_review_unlock')),
  sku text not null,
  amount integer not null,
  currency text not null default 'usd',
  credits integer,
  monthly_credits integer,
  status text not null default 'created'
    check (status in ('created', 'checkout_opened', 'payment_pending', 'paid', 'fulfilled', 'failed', 'cancelled', 'refunded')),
  provider_transaction_id text,
  provider_subscription_id text,
  profile_review_session_id uuid references profile_review_sessions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_transaction_id)
);

create index if not exists idx_billing_orders_user_created
  on billing_orders(user_id, created_at desc);

create index if not exists idx_billing_orders_profile_review_session
  on billing_orders(profile_review_session_id);

create index if not exists idx_billing_orders_provider_transaction
  on billing_orders(provider, provider_transaction_id);

create table if not exists billing_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null default 'paddle',
  event_id text not null,
  event_type text not null,
  order_id uuid references billing_orders(id) on delete set null,
  provider_transaction_id text,
  provider_subscription_id text,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, event_id)
);

create index if not exists idx_billing_events_order_id
  on billing_events(order_id);

create table if not exists credit_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references users(id) on delete cascade,
  order_id uuid references billing_orders(id) on delete set null,
  amount integer not null,
  reason text not null,
  provider text not null default 'paddle',
  provider_transaction_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_ledger_user_created
  on credit_ledger(user_id, created_at desc);

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references users(id) on delete cascade,
  provider text not null default 'paddle',
  provider_subscription_id text not null,
  sku text not null,
  status text not null,
  monthly_credits integer not null default 0,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_subscription_id)
);

create index if not exists idx_subscriptions_user_status
  on subscriptions(user_id, status);

alter table billing_orders enable row level security;
alter table billing_events enable row level security;
alter table credit_ledger enable row level security;
alter table subscriptions enable row level security;

create policy billing_orders_select_own on billing_orders
  for select
  using (user_id = auth.jwt() ->> 'sub');

create policy credit_ledger_select_own on credit_ledger
  for select
  using (user_id = auth.jwt() ->> 'sub');

create policy subscriptions_select_own on subscriptions
  for select
  using (user_id = auth.jwt() ->> 'sub');

drop trigger if exists set_billing_orders_updated_at on billing_orders;
create trigger set_billing_orders_updated_at
before update on billing_orders
for each row
execute function set_updated_at();

drop trigger if exists set_subscriptions_updated_at on subscriptions;
create trigger set_subscriptions_updated_at
before update on subscriptions
for each row
execute function set_updated_at();
