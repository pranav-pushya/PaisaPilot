-- ========================================================
-- PAISAPILOT SUPABASE SCHEMA SETUP (MULTI-DEVICE AUTH & SYNC)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  icon text not null default 'Tag',
  color text not null default '#6366f1',
  type text check (type in ('expense', 'income', 'transfer')) not null default 'expense',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Trips & Hackathons Table
create table if not exists public.trips (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  type text default 'hackathon',
  budget numeric(12, 2) not null default 0,
  start_date text,
  end_date text,
  status text check (status in ('active', 'completed', 'planning')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Transactions Table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  amount numeric(12, 2) not null,
  type text check (type in ('expense', 'income')) not null default 'expense',
  category_id uuid references public.categories(id) on delete set null,
  category_name text,
  payment_mode text check (payment_mode in ('UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking')) default 'UPI',
  description text,
  trip_id text references public.trips(id) on delete set null,
  trip_name text,
  from_mode text,
  to_mode text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safe migrations for existing database columns
alter table public.transactions add column if not exists trip_id text;
alter table public.transactions add column if not exists trip_name text;
alter table public.transactions add column if not exists from_mode text;
alter table public.transactions add column if not exists to_mode text;
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in ('expense', 'income', 'transfer'));

-- 4. Budgets Table
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  category_name text not null,
  monthly_limit numeric(12, 2) not null,
  month text not null, -- e.g. '2026-11'
  unique (user_id, category_name, month)
);

-- 5. User Account Balances Table (Starting Balances per Payment Mode)
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  starting_balances jsonb not null default '{"UPI": 0, "Net Banking": 0, "Debit Card": 0, "Cash": 0, "Credit Card": 0}'::jsonb,
  receivables jsonb not null default '[]'::jsonb,
  savings_jars jsonb not null default '[]'::jsonb,
  impulse_items jsonb not null default '[]'::jsonb,
  quick_actions jsonb not null default '[]'::jsonb,
  upi_id text not null default '',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_profiles add column if not exists receivables jsonb not null default '[]'::jsonb;
alter table public.user_profiles add column if not exists savings_jars jsonb not null default '[]'::jsonb;
alter table public.user_profiles add column if not exists impulse_items jsonb not null default '[]'::jsonb;
alter table public.user_profiles add column if not exists quick_actions jsonb not null default '[]'::jsonb;
alter table public.user_profiles add column if not exists upi_id text not null default '';

-- 6. Recurring bills and income reminders
create table if not exists public.recurring_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  amount numeric(12, 2) not null,
  type text check (type in ('expense', 'income')) not null default 'expense',
  category_name text not null,
  payment_mode text check (payment_mode in ('UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking')) default 'UPI',
  description text not null,
  frequency text check (frequency in ('weekly', 'monthly', 'yearly')) not null default 'monthly',
  next_due date not null,
  anchor_day smallint,
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recurring_rules add column if not exists anchor_day smallint;
update public.recurring_rules set anchor_day = extract(day from next_due)::smallint where anchor_day is null;
alter table public.recurring_rules alter column anchor_day set not null;
alter table public.recurring_rules drop constraint if exists recurring_rules_anchor_day_check;
alter table public.recurring_rules add constraint recurring_rules_anchor_day_check check (anchor_day between 1 and 31);

-- Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.trips enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.user_profiles enable row level security;
alter table public.recurring_rules enable row level security;

-- Shared default categories are readable by everyone. User-created categories
-- and all financial records are private to their authenticated owner.
drop policy if exists "Allow read categories" on public.categories;
create policy "Allow read categories" on public.categories
  for select using (user_id is null or auth.uid() = user_id);

drop policy if exists "Allow user insert categories" on public.categories;
create policy "Allow user insert categories" on public.categories
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Allow user update categories" on public.categories;
create policy "Allow user update categories" on public.categories
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Allow user delete categories" on public.categories;
create policy "Allow user delete categories" on public.categories
  for delete to authenticated using (auth.uid() = user_id);

-- Setup RLS Policies for Transactions
drop policy if exists "Allow user all on transactions" on public.transactions;
create policy "Allow user all on transactions" on public.transactions
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Setup RLS Policies for Trips
drop policy if exists "Allow user all on trips" on public.trips;
create policy "Allow user all on trips" on public.trips
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Setup RLS Policies for Budgets
drop policy if exists "Allow user all on budgets" on public.budgets;
create policy "Allow user all on budgets" on public.budgets
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Setup RLS Policies for User Profiles (Starting Balances)
drop policy if exists "Allow user all on user_profiles" on public.user_profiles;
create policy "Allow user all on user_profiles" on public.user_profiles
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Allow user all on recurring_rules" on public.recurring_rules;
create policy "Allow user all on recurring_rules" on public.recurring_rules
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Enable Realtime for multi-device live sync (safe to rerun)
do $$
declare
  table_name text;
begin
  foreach table_name in array array['transactions', 'trips', 'budgets', 'user_profiles', 'recurring_rules'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;

-- Seed Initial Default Categories (Shared)
insert into public.categories (name, icon, color, type) values
  ('Food & Dining', 'Utensils', '#f97316', 'expense'),
  ('Groceries', 'ShoppingCart', '#10b981', 'expense'),
  ('Transport & Fuel', 'Car', '#3b82f6', 'expense'),
  ('Rent & Utilities', 'Home', '#8b5cf6', 'expense'),
  ('Shopping', 'ShoppingBag', '#ec4899', 'expense'),
  ('Entertainment & OTT', 'Film', '#06b6d4', 'expense'),
  ('Healthcare', 'HeartPulse', '#ef4444', 'expense'),
  ('Education & Supplies', 'BookOpen', '#8b5cf6', 'expense'),
  ('Salary & Income', 'Briefcase', '#22c55e', 'income'),
  ('Investments & Returns', 'TrendingUp', '#14b8a6', 'income'),
  ('Freelance & Bonus', 'Laptop', '#84cc16', 'income')
on conflict do nothing;

-- Existing NULL-owned financial rows are intentionally not reassigned: older
-- app versions shared these rows between visitors. Review them as an admin and
-- assign only records whose owner is known before enabling this schema update.
