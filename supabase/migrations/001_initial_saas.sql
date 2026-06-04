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
  onboarding_status text not null default 'signup',
  callcatch_number text,
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

alter table public.customers enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "customers can insert own row" on public.customers;
create policy "customers can insert own row"
on public.customers for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "customers can read own row" on public.customers;
create policy "customers can read own row"
on public.customers for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "customers can update own row" on public.customers;
create policy "customers can update own row"
on public.customers for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "admins can read all customers" on public.customers;
create policy "admins can read all customers"
on public.customers for select
to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

drop policy if exists "admins can read admin table" on public.admin_users;
create policy "admins can read admin table"
on public.admin_users for select
to authenticated
using (auth.uid() = user_id);

create index if not exists customers_user_id_idx on public.customers(user_id);
create index if not exists customers_created_at_idx on public.customers(created_at desc);
