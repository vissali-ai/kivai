-- URLs amigáveis e únicas para faixas dentro de cada álbum.
alter table public.music_tracks add column if not exists slug text;
with normalized as (
  select id,
    trim(both '-' from regexp_replace(
      regexp_replace(
        translate(lower(title),
          'áàâãäéèêëíìîïóòôõöúùûüçñ',
          'aaaaaeeeeiiiiooooouuuucn'),
        '[^a-z0-9]+', '-', 'g'),
      '(^-|-$)', '', 'g')) as base_slug
  from public.music_tracks
)
update public.music_tracks t
set slug = coalesce(nullif(n.base_slug, ''), 'faixa') || '-' || left(t.id::text, 6)
from normalized n
where t.id = n.id and (t.slug is null or t.slug = '');
alter table public.music_tracks alter column slug set not null;
create unique index if not exists music_tracks_album_slug_uidx on public.music_tracks(album_id, slug);
