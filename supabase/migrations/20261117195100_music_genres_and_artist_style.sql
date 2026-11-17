create table if not exists public.music_genres (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  image_url text not null default '',
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists music_genres_name_lower_uidx on public.music_genres (lower(name));
alter table public.music_artists add column if not exists genre_id uuid references public.music_genres(id) on delete set null;
create index if not exists music_artists_genre_status_idx on public.music_artists (genre_id, status);
alter table public.music_genres enable row level security;
revoke all on public.music_genres from anon, authenticated;
grant select on public.music_genres to anon, authenticated;
grant select, insert, update, delete on public.music_genres to service_role;
drop policy if exists "Public can read published music genres" on public.music_genres;
create policy "Public can read published music genres" on public.music_genres for select to anon, authenticated using (status = 'published');
