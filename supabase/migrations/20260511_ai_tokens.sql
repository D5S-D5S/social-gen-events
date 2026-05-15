alter table public.profiles
  add column if not exists ai_uses_this_month integer not null default 0,
  add column if not exists ai_uses_reset_month text;

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('starter', 'tier_1', 'tr1', 'pro', 'enterprise'));
