alter table public.music_tracks
  add column if not exists play_count bigint not null default 0;

create or replace function public.record_music_play(p_track_id uuid)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated_count bigint;
begin
  update public.music_tracks as track
  set play_count = coalesce(track.play_count, 0) + 1
  from public.music_albums as album
  join public.music_artists as artist on artist.id = album.artist_id
  where track.id = p_track_id
    and track.album_id = album.id
    and track.status = 'published'
    and album.status = 'published'
    and artist.status = 'published'
  returning track.play_count into updated_count;

  return coalesce(updated_count, 0);
end;
$$;

revoke all on function public.record_music_play(uuid) from public, anon, authenticated;
grant execute on function public.record_music_play(uuid) to service_role;
