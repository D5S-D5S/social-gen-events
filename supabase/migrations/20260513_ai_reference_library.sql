-- BalloonBase AI Reference Library
-- Admins can upload/link approved inspiration images that AI tools use as prompt context.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-reference-images',
  'ai-reference-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists ai_reference_images (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  source_platform text not null default 'upload',
  source_url text,
  creator_handle text,
  image_url text,
  storage_path text,
  setup_type text not null default '',
  event_type text not null default '',
  style_level text not null default '',
  coverage text not null default '',
  tags text[] not null default '{}',
  colours text[] not null default '{}',
  notes text not null default '',
  use_for_estimator boolean not null default true,
  use_for_mockup boolean not null default true,
  status text not null default 'approved' check (status in ('approved', 'draft', 'hidden')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_ai_reference_images_updated_at on ai_reference_images;
create trigger trg_ai_reference_images_updated_at
before update on ai_reference_images
for each row execute function set_updated_at();

create index if not exists idx_ai_reference_images_status on ai_reference_images(status);
create index if not exists idx_ai_reference_images_estimator on ai_reference_images(use_for_estimator);
create index if not exists idx_ai_reference_images_mockup on ai_reference_images(use_for_mockup);
create index if not exists idx_ai_reference_images_created_at on ai_reference_images(created_at desc);

alter table ai_reference_images enable row level security;

drop policy if exists "ai_reference_images_admin_all" on ai_reference_images;
create policy "ai_reference_images_admin_all" on ai_reference_images
for all using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);
