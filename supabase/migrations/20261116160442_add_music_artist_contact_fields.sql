alter table public.music_artists
  add column if not exists contact_whatsapp text not null default '',
  add column if not exists contact_email text not null default '',
  add column if not exists contact_message text not null default '';

comment on column public.music_artists.contact_whatsapp is 'Public WhatsApp number for artist booking inquiries, stored in international digits or formatted text.';
comment on column public.music_artists.contact_email is 'Public commercial contact email for artist booking inquiries.';
comment on column public.music_artists.contact_message is 'Optional prefilled message for artist booking inquiries.';
