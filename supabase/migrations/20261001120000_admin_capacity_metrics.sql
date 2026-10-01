-- Read-only capacity summary for the authenticated Admin UI (server-side service role only).
create or replace function public.kivai_admin_capacity_metrics()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'databaseBytes', pg_database_size(current_database()),
    'storageBytes', coalesce((select sum(coalesce((o.metadata->>'size')::bigint, 0)) from storage.objects o), 0),
    'snapshotStorageBytes', coalesce((select sum(coalesce((o.metadata->>'size')::bigint, 0)) from storage.objects o where o.bucket_id = 'social-snapshots'), 0),
    'projectCount', (select count(*) from public.saved_tool_projects),
    'projectPayloadBytes', coalesce((select sum(pg_column_size(p.payload)) from public.saved_tool_projects p), 0),
    'snapshotCount', (select count(*) from public.social_snapshots),
    'activeSubscribers', (select count(distinct s.user_id) from public.user_subscriptions s where s.status = 'active' and s.current_period_start <= now() and s.current_period_end > now())
  );
$$;
revoke all on function public.kivai_admin_capacity_metrics() from public, anon, authenticated;
grant execute on function public.kivai_admin_capacity_metrics() to service_role;

-- These trigger helpers do not need to be callable through the public Data API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
alter function public.set_blog_updated_at() set search_path = '';
