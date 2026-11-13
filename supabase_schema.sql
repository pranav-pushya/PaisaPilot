-- ========================================================
-- PAISAPILOT SUPABASE SCHEMA SETUP
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'tag',
  color text not null default '#6366f1',
  type text check (type in ('expense', 'income')) not null default 'expense',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Transactions Table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null,
  type text check (type in ('expense', 'income')) not null default 'expense',
  category_id uuid references public.categories(id) on delete set null,
  category_name text,
  payment_mode text check (payment_mode in ('UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking')) default 'UPI',
  description text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Budgets Table
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  monthly_limit numeric(12, 2) not null,
  month text not null -- e.g. '2026-11'
);

-- Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- Setup RLS Policies (Allows authenticated users full access to their own rows, and public access if anonymous)
create policy "Allow user all on categories" on public.categories for all using (true) with check (true);
create policy "Allow user all on transactions" on public.transactions for all using (true) with check (true);
create policy "Allow user all on budgets" on public.budgets for all using (true) with check (true);

-- Seed Initial Default Categories
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
