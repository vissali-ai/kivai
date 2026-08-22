alter table public.site_contents
  add column if not exists tool_mode text not null default 'auto';

alter table public.site_contents
  drop constraint if exists site_contents_tool_mode_check;

alter table public.site_contents
  add constraint site_contents_tool_mode_check
  check (tool_mode in ('auto', 'browser', 'server', 'informational'));

update public.site_contents
set tool_mode = 'informational'
where content_type <> 'tool' and tool_mode <> 'informational';
