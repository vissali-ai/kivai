-- Additive support for the post creator. Preserve the current credit function,
-- wallet entitlements and privileges; fail if its validation changed upstream.
do $$
declare definition text;
begin
  definition := pg_get_functiondef('public.reserve_ai_credits(uuid,uuid,text,integer)'::regprocedure);
  if position('p_cost not in (1,2)' in definition) = 0 then
    raise exception 'Review current reserve_ai_credits validation before applying migration';
  end if;
  execute replace(definition, 'p_cost not in (1,2)', 'p_cost not in (1,2,5)');
end $$;

alter table public.saved_tool_projects drop constraint saved_tool_projects_kind_check;
alter table public.saved_tool_projects add constraint saved_tool_projects_kind_check
  check (kind in ('calendar','briefing','qr_code','watermark','social_report','preview_post','engagement','roas','roi','post_analysis','trend_radar','margin','markup','post_creator'));
