-- Optional metadata for a single uploaded file that contains a complete EP/LP.
-- Existing tracks remain unchanged and default to a regular single track.
alter table public.music_tracks
  add column if not exists full_audio boolean not null default false;

alter table public.music_tracks
  add column if not exists description text not null default '';
