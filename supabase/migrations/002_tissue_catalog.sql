-- MYCODAO BLOCKS — Tissue catalog (samples + NAS media metadata).
-- Apply in Supabase SQL editor or: supabase db push (when linked).
-- Date: 2026-06-10

create table if not exists public.tissue_samples (
  id uuid primary key default gen_random_uuid(),
  sample_id text not null unique,
  common_name text not null default '',
  scientific_name text not null default '',
  category text not null check (category in ('mushroom', 'mold', 'mildew', 'yeast')),
  taxonomy jsonb not null default '{}'::jsonb,
  mindex_taxon_id text,
  mass_value numeric,
  mass_unit text check (mass_unit is null or mass_unit in ('g', 'mg')),
  storage_location text,
  collected_at timestamptz,
  description text,
  visibility text not null default 'internal'
    check (visibility in ('public', 'internal', 'hidden')),
  cover_media_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text
);

create table if not exists public.tissue_media (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references public.tissue_samples (id) on delete cascade,
  nas_path text not null,
  kind text not null check (kind in ('image', 'video', 'stream')),
  live_stream_url text,
  is_cover boolean not null default false,
  sort_order int not null default 0,
  visibility text not null default 'internal'
    check (visibility in ('public', 'internal', 'hidden')),
  created_at timestamptz not null default now()
);

alter table public.tissue_samples
  drop constraint if exists tissue_samples_cover_media_id_fkey;

alter table public.tissue_samples
  add constraint tissue_samples_cover_media_id_fkey
  foreign key (cover_media_id) references public.tissue_media (id) on delete set null;

create index if not exists tissue_samples_category_idx on public.tissue_samples (category);
create index if not exists tissue_samples_visibility_idx on public.tissue_samples (visibility);
create index if not exists tissue_samples_sample_id_idx on public.tissue_samples (sample_id);
create index if not exists tissue_media_sample_id_idx on public.tissue_media (sample_id);
create index if not exists tissue_media_visibility_idx on public.tissue_media (visibility);

comment on table public.tissue_samples is 'MycoDAO fungal tissue catalog — system of record for BLOCKS and cross-system readers';
comment on table public.tissue_media is 'NAS media paths under BLOCKS/tissue/<sampleId>/';

alter table public.tissue_samples enable row level security;
alter table public.tissue_media enable row level security;

drop policy if exists tissue_samples_public_read on public.tissue_samples;
create policy tissue_samples_public_read on public.tissue_samples
  for select to anon, authenticated
  using (visibility = 'public');

drop policy if exists tissue_media_public_read on public.tissue_media;
create policy tissue_media_public_read on public.tissue_media
  for select to anon, authenticated
  using (visibility = 'public');
