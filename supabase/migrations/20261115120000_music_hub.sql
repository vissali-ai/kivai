-- Catálogo público de música independente. A migração é aditiva.
create table if not exists public.music_artists (
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 name text not null check(char_length(name) between 2 and 120), bio text not null default '', photo_url text not null default '', cover_url text not null default '',
 status text not null default 'draft' check(status in ('draft','published','archived')), indexable boolean not null default false, include_in_sitemap boolean not null default false,
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.music_albums (
 id uuid primary key default gen_random_uuid(), artist_id uuid not null references public.music_artists(id) on delete cascade,
 slug text not null check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), title text not null check(char_length(title) between 1 and 160), description text not null default '', cover_url text not null default '', release_date date,
 status text not null default 'draft' check(status in ('draft','published','archived')), indexable boolean not null default false, include_in_sitemap boolean not null default false,
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(artist_id,slug)
);
create table if not exists public.music_tracks (
 id uuid primary key default gen_random_uuid(), album_id uuid not null references public.music_albums(id) on delete cascade,
 title text not null check(char_length(title) between 1 and 160), track_number integer not null check(track_number > 0), duration_seconds integer check(duration_seconds is null or duration_seconds > 0),
 audio_url text not null, status text not null default 'draft' check(status in ('draft','published','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(album_id,track_number)
);
create index if not exists music_albums_artist_idx on public.music_albums(artist_id,status,release_date desc);
create index if not exists music_tracks_album_order_idx on public.music_tracks(album_id,track_number);
alter table public.music_artists enable row level security; alter table public.music_albums enable row level security; alter table public.music_tracks enable row level security;
revoke all on public.music_artists,public.music_albums,public.music_tracks from anon,authenticated;
grant select,insert,update,delete on public.music_artists,public.music_albums,public.music_tracks to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('music-media','music-media',true,104857600,array['audio/mpeg','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=104857600,allowed_mime_types=excluded.allowed_mime_types;
insert into public.site_hubs(slug,name,description,path,content_html,seo_title,seo_description,status,indexable,include_in_sitemap,published_at)
values('musica','Kivai Música','Artistas independentes, álbuns e lançamentos para ouvir.','/musica','','Kivai Música | Artistas independentes','Descubra artistas independentes e ouça seus álbuns no Kivai.','published',true,true,now())
on conflict(slug) do nothing;
