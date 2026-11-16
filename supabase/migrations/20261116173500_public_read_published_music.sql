grant select on public.music_artists, public.music_albums, public.music_tracks to anon, authenticated;

drop policy if exists "Public can read published music artists" on public.music_artists;
create policy "Public can read published music artists" on public.music_artists
  for select to anon, authenticated using (status = 'published');

drop policy if exists "Public can read published music albums" on public.music_albums;
create policy "Public can read published music albums" on public.music_albums
  for select to anon, authenticated using (
    status = 'published' and exists (
      select 1 from public.music_artists a where a.id = artist_id and a.status = 'published'
    )
  );

drop policy if exists "Public can read published music tracks" on public.music_tracks;
create policy "Public can read published music tracks" on public.music_tracks
  for select to anon, authenticated using (
    status = 'published' and exists (
      select 1 from public.music_albums a
      join public.music_artists ar on ar.id = a.artist_id
      where a.id = album_id and a.status = 'published' and ar.status = 'published'
    )
  );