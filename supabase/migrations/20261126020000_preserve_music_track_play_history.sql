create table if not exists public.music_track_play_history (
  artist_slug text not null,
  album_slug text not null,
  track_number integer not null,
  track_title_key text not null,
  play_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (artist_slug, album_slug, track_number, track_title_key)
);

alter table public.music_track_play_history enable row level security;
revoke all on public.music_track_play_history from anon, authenticated;
grant select, insert, update on public.music_track_play_history to service_role;

create or replace function public.remember_music_track_plays(
  p_artist_slug text,
  p_album_slug text,
  p_track_number integer,
  p_title text,
  p_play_count bigint
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_title text;
begin
  normalized_title := lower(regexp_replace(btrim(coalesce(p_title, '')), '[[:space:]]+', ' ', 'g'));
  if coalesce(p_play_count, 0) <= 0 or normalized_title = '' then
    return;
  end if;

  insert into public.music_track_play_history (
    artist_slug, album_slug, track_number, track_title_key, play_count, updated_at
  ) values (
    p_artist_slug, p_album_slug, greatest(p_track_number, 1), normalized_title, p_play_count, now()
  )
  on conflict (artist_slug, album_slug, track_number, track_title_key)
  do update set play_count = greatest(public.music_track_play_history.play_count, excluded.play_count),
                updated_at = now();
end;
$$;

revoke all on function public.remember_music_track_plays(text, text, integer, text, bigint) from public, anon, authenticated;

insert into public.music_track_play_history (
  artist_slug, album_slug, track_number, track_title_key, play_count, updated_at
)
select artist.slug, album.slug, greatest(track.track_number, 1),
       lower(regexp_replace(btrim(coalesce(track.title, '')), '[[:space:]]+', ' ', 'g')),
       track.play_count, now()
from public.music_tracks track
join public.music_albums album on album.id = track.album_id
join public.music_artists artist on artist.id = album.artist_id
where track.play_count > 0
  and btrim(coalesce(track.title, '')) <> ''
on conflict (artist_slug, album_slug, track_number, track_title_key)
do update set play_count = greatest(public.music_track_play_history.play_count, excluded.play_count),
              updated_at = now();

create or replace function public.capture_music_track_play_history_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  artist_slug_value text;
  album_slug_value text;
begin
  select artist.slug, album.slug
    into artist_slug_value, album_slug_value
  from public.music_albums album
  join public.music_artists artist on artist.id = album.artist_id
  where album.id = old.album_id;

  if artist_slug_value is not null and album_slug_value is not null then
    perform public.remember_music_track_plays(
      artist_slug_value, album_slug_value, old.track_number, old.title, old.play_count
    );
  end if;
  return old;
end;
$$;

create or replace function public.capture_music_album_play_history_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  artist_slug_value text;
begin
  select artist.slug into artist_slug_value
  from public.music_artists artist
  where artist.id = old.artist_id;

  if artist_slug_value is not null then
    insert into public.music_track_play_history (
      artist_slug, album_slug, track_number, track_title_key, play_count, updated_at
    )
    select artist_slug_value, old.slug, greatest(track.track_number, 1),
           lower(regexp_replace(btrim(coalesce(track.title, '')), '[[:space:]]+', ' ', 'g')),
           track.play_count, now()
    from public.music_tracks track
    where track.album_id = old.id and track.play_count > 0
      and btrim(coalesce(track.title, '')) <> ''
    on conflict (artist_slug, album_slug, track_number, track_title_key)
    do update set play_count = greatest(public.music_track_play_history.play_count, excluded.play_count),
                  updated_at = now();
  end if;
  return old;
end;
$$;

create or replace function public.capture_music_artist_play_history_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.music_track_play_history (
    artist_slug, album_slug, track_number, track_title_key, play_count, updated_at
  )
  select old.slug, album.slug, greatest(track.track_number, 1),
         lower(regexp_replace(btrim(coalesce(track.title, '')), '[[:space:]]+', ' ', 'g')),
         track.play_count, now()
  from public.music_albums album
  join public.music_tracks track on track.album_id = album.id
  where album.artist_id = old.id and track.play_count > 0
    and btrim(coalesce(track.title, '')) <> ''
  on conflict (artist_slug, album_slug, track_number, track_title_key)
  do update set play_count = greatest(public.music_track_play_history.play_count, excluded.play_count),
                updated_at = now();
  return old;
end;
$$;

drop trigger if exists music_track_play_history_before_delete on public.music_tracks;
create trigger music_track_play_history_before_delete
before delete on public.music_tracks
for each row execute function public.capture_music_track_play_history_before_delete();

drop trigger if exists music_album_play_history_before_delete on public.music_albums;
create trigger music_album_play_history_before_delete
before delete on public.music_albums
for each row execute function public.capture_music_album_play_history_before_delete();

drop trigger if exists music_artist_play_history_before_delete on public.music_artists;
create trigger music_artist_play_history_before_delete
before delete on public.music_artists
for each row execute function public.capture_music_artist_play_history_before_delete();

create or replace function public.record_music_play(p_track_id uuid)
returns bigint
language plpgsql
set search_path to public
as $function$
declare
  updated_count bigint;
  artist_slug_value text;
  album_slug_value text;
  title_value text;
  track_number_value integer;
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
  returning track.play_count, artist.slug, album.slug, track.title, track.track_number
    into updated_count, artist_slug_value, album_slug_value, title_value, track_number_value;

  if updated_count is not null then
    perform public.remember_music_track_plays(
      artist_slug_value, album_slug_value, track_number_value, title_value, updated_count
    );
  end if;

  return coalesce(updated_count, 0);
end;
$function$;
