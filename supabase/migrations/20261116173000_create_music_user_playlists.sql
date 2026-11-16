create table if not exists public.music_user_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);
create index if not exists music_user_playlists_user_created_idx on public.music_user_playlists (user_id, created_at desc);
create table if not exists public.music_user_playlist_tracks (
  playlist_id uuid not null references public.music_user_playlists(id) on delete cascade,
  track_id uuid not null references public.music_tracks(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  added_at timestamptz not null default now(),
  primary key (playlist_id, track_id)
);
create index if not exists music_user_playlist_tracks_order_idx on public.music_user_playlist_tracks (playlist_id, position, added_at);
create index if not exists music_user_playlist_tracks_track_id_idx on public.music_user_playlist_tracks (track_id);
alter table public.music_user_playlists enable row level security;
alter table public.music_user_playlist_tracks enable row level security;
create policy "Users manage their own music playlists" on public.music_user_playlists for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users read tracks from their own music playlists" on public.music_user_playlist_tracks for select to authenticated using (exists (select 1 from public.music_user_playlists p where p.id = playlist_id and p.user_id = (select auth.uid())));
create policy "Users add tracks to their own music playlists" on public.music_user_playlist_tracks for insert to authenticated with check (exists (select 1 from public.music_user_playlists p where p.id = playlist_id and p.user_id = (select auth.uid())) and exists (select 1 from public.music_tracks t where t.id = track_id and t.status = 'published'));
create policy "Users remove tracks from their own music playlists" on public.music_user_playlist_tracks for delete to authenticated using (exists (select 1 from public.music_user_playlists p where p.id = playlist_id and p.user_id = (select auth.uid())));
grant select, insert, update, delete on public.music_user_playlists to authenticated;
grant select, insert, delete on public.music_user_playlist_tracks to authenticated;
