create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  business_name text,
  mobile text,
  trade text,
  stripe_customer_id text unique,
  onboarding_status text not null default 'signup',
  callcatch_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null,
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "customers can read own profile" on public.customers;
create policy "customers can read own profile"
on public.customers for select
using (auth.uid() = user_id);

drop policy if exists "customers can update own profile" on public.customers;
create policy "customers can update own profile"
on public.customers for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "customers can read own subscriptions" on public.subscriptions;
create policy "customers can read own subscriptions"
on public.subscriptions for select
using (
  exists (
    select 1
    from public.customers
    where customers.id = subscriptions.customer_id
      and customers.user_id = auth.uid()
  )
);

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users"
on public.admin_users for select
using (auth.uid() = user_id);

create index if not exists customers_user_id_idx on public.customers(user_id);
create index if not exists customers_stripe_customer_id_idx on public.customers(stripe_customer_id);
create index if not exists subscriptions_customer_id_idx on public.subscriptions(customer_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
