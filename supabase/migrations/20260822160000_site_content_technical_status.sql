alter table public.site_contents
  add column if not exists technical_status text not null default 'not_applicable';

alter table public.site_contents
  drop constraint if exists site_contents_technical_status_check;

alter table public.site_contents
  add constraint site_contents_technical_status_check
  check (technical_status in ('not_applicable', 'pending', 'ready'));

update public.site_contents
set technical_status = case
  when content_type <> 'tool' then 'not_applicable'
  when existing_tool_slug is not null then 'ready'
  else 'pending'
end;

update public.site_contents
set status = 'draft', indexable = false, include_in_sitemap = false, published_at = null
where content_type = 'tool' and technical_status = 'pending';
