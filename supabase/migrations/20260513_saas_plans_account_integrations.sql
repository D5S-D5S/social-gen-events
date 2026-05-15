alter table public.profiles
  add column if not exists saas_settings jsonb not null default '{}'::jsonb,
  add column if not exists ai_uses_this_month integer not null default 0,
  add column if not exists ai_uses_reset_month text;

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('starter', 'tier_1', 'tr1', 'pro', 'enterprise'));

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  business_name text,
  source text not null default 'signup',
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Users can view own newsletter subscriber" on public.newsletter_subscribers;
create policy "Users can view own newsletter subscriber"
  on public.newsletter_subscribers for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own newsletter subscriber" on public.newsletter_subscribers;
create policy "Users can update own newsletter subscriber"
  on public.newsletter_subscribers for update
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, plan, saas_settings)
  values (
    new.id,
    'starter',
    jsonb_build_object(
      'fullName', coalesce(new.raw_user_meta_data->>'full_name', ''),
      'businessName', coalesce(new.raw_user_meta_data->>'business_name', ''),
      'marketingOptIn', coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
      'newsletterEnabled', coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
      'welcomeEmailEnabled', true
    )
  )
  on conflict (id) do update set
    saas_settings = public.profiles.saas_settings || excluded.saas_settings,
    updated_at = now();

  if coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false) then
    insert into public.newsletter_subscribers (user_id, email, full_name, business_name, source)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'business_name',
      'signup'
    )
    on conflict (email) do update set
      user_id = excluded.user_id,
      full_name = excluded.full_name,
      business_name = excluded.business_name,
      status = 'subscribed',
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
