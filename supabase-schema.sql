-- Run this entire file in Supabase SQL Editor

create table if not exists quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  number text not null,
  client_name text not null default '',
  client_email text default '',
  event_date text default '',
  items jsonb default '[]',
  total numeric default 0,
  status text default 'draft',
  date text default '',
  created_at timestamptz default now()
);
alter table quotes enable row level security;
drop policy if exists "Users manage own quotes" on quotes;
create policy "Users manage own quotes" on quotes for all using (auth.uid() = user_id);

create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text default '',
  phone text default '',
  city text default '',
  notes text default '',
  total_spent numeric default 0,
  quotes_count integer default 0,
  created_at text default '',
  updated_at timestamptz default now()
);
alter table customers enable row level security;
drop policy if exists "Users manage own customers" on customers;
create policy "Users manage own customers" on customers for all using (auth.uid() = user_id);

create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  quote_id text default '',
  client_name text default '',
  amount numeric default 0,
  method text default 'cash',
  method_other text default '',
  type text default 'full',
  date text default '',
  notes text default '',
  created_at timestamptz default now()
);
alter table payments enable row level security;
drop policy if exists "Users manage own payments" on payments;
create policy "Users manage own payments" on payments for all using (auth.uid() = user_id);

create table if not exists booking_forms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'General Enquiry Form',
  fields jsonb default '[]',
  is_published boolean default false,
  created_at timestamptz default now()
);
alter table booking_forms enable row level security;
drop policy if exists "Users manage own booking forms" on booking_forms;
create policy "Users manage own booking forms" on booking_forms for all using (auth.uid() = user_id);

create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  form_id uuid references booking_forms(id) on delete cascade,
  form_name text default '',
  submitted_at timestamptz default now(),
  status text default 'New',
  data jsonb default '{}',
  labels jsonb default '{}'
);
alter table submissions enable row level security;
drop policy if exists "Users manage own submissions" on submissions;
create policy "Users manage own submissions" on submissions for all using (auth.uid() = user_id);

create table if not exists customer_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id text not null,
  text text not null,
  created_at timestamptz default now()
);
alter table customer_notes enable row level security;
drop policy if exists "Users manage own customer notes" on customer_notes;
create policy "Users manage own customer notes" on customer_notes for all using (auth.uid() = user_id);
