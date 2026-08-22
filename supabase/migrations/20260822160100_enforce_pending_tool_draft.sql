alter table public.site_contents
  drop constraint if exists site_contents_pending_tool_draft_check;

alter table public.site_contents
  add constraint site_contents_pending_tool_draft_check
  check (
    content_type <> 'tool'
    or technical_status <> 'pending'
    or (
      status = 'draft'
      and indexable = false
      and include_in_sitemap = false
      and published_at is null
    )
  );
