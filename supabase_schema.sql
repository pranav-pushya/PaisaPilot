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
  type text check (type in ('expense', 'income')) not null default 'expense',
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
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  amount numeric(12, 2) not null,
  type text check (type in ('expense', 'income')) not null default 'expense',
  category_id uuid references public.categories(id) on delete set null,
  category_name text,
  payment_mode text check (payment_mode in ('UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking')) default 'UPI',
  description text,
  trip_id text references public.trips(id) on delete set null,
  trip_name text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.trips enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.user_profiles enable row level security;

-- Setup RLS Policies for Categories
drop policy if exists "Allow read categories" on public.categories;
create policy "Allow read categories" on public.categories
  for select using (user_id is null or auth.uid() = user_id);

drop policy if exists "Allow user insert categories" on public.categories;
create policy "Allow user insert categories" on public.categories
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Allow user update categories" on public.categories;
create policy "Allow user update categories" on public.categories
  for update using (auth.uid() = user_id);

drop policy if exists "Allow user delete categories" on public.categories;
create policy "Allow user delete categories" on public.categories
  for delete using (auth.uid() = user_id);

-- Setup RLS Policies for Transactions
drop policy if exists "Allow user all on transactions" on public.transactions;
create policy "Allow user all on transactions" on public.transactions
  for all using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Setup RLS Policies for Trips
drop policy if exists "Allow user all on trips" on public.trips;
create policy "Allow user all on trips" on public.trips
  for all using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Setup RLS Policies for Budgets
drop policy if exists "Allow user all on budgets" on public.budgets;
create policy "Allow user all on budgets" on public.budgets
  for all using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Setup RLS Policies for User Profiles (Starting Balances)
drop policy if exists "Allow user all on user_profiles" on public.user_profiles;
create policy "Allow user all on user_profiles" on public.user_profiles
  for all using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Enable Realtime for multi-device live sync
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.budgets;
alter publication supabase_realtime add table public.user_profiles;

-- Seed Initial Default Categories (Shared)
insert into public.categories (name, icon, color, type) values
  ('Food & Dining', 'Utensils', '#f97316', 'expense'),
  ('Groceries', 'ShoppingCart', '#10b981', 'expense'),
  ('Transport & Fuel', 'Car', '#3b82f6', 'expense'),
  ('Rent & Utilities', 'Home', '#8b5cf6', 'expense'),
  ('Shopping & Personal', 'ShoppingBag', '#ec4899', 'expense'),
  ('Entertainment & OTT', 'Film', '#06b6d4', 'expense'),
  ('Healthcare', 'HeartPulse', '#ef4444', 'expense'),
  ('Salary & Income', 'Briefcase', '#22c55e', 'income'),
  ('Investments & Returns', 'TrendingUp', '#14b8a6', 'income'),
  ('Freelance / Side Gig', 'Laptop', '#84cc16', 'income')
on conflict do nothing;
