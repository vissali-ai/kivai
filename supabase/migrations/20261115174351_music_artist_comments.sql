create table if not exists public.music_artist_comments (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.music_artists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  content text not null check (char_length(btrim(content)) between 3 and 1000),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

create index if not exists music_artist_comments_public_idx
  on public.music_artist_comments (artist_id, status, created_at desc);
create index if not exists music_artist_comments_user_idx
  on public.music_artist_comments (user_id, created_at desc);

alter table public.music_artist_comments enable row level security;
revoke all on public.music_artist_comments from public, anon, authenticated;
grant select, insert, update, delete on public.music_artist_comments to service_role;
