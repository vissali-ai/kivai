-- Recover credits reserved by requests terminated by the host without executing finally.
-- The AI endpoints have a 60-second maximum duration; 15 minutes is ample.
create or replace function public.recover_stale_ai_credit_operations(p_user_id uuid)
returns integer language plpgsql security definer
set search_path = public
as $$
declare
  operation_row record;
  recovered integer := 0;
begin
  if p_user_id is null then return 0; end if;
  for operation_row in
    select id from public.ai_credit_operations
    where user_id = p_user_id and status = 'reserved'
      and created_at < now() - interval '15 minutes'
    order by created_at
    limit 50
  loop
    if public.finalize_ai_credits(p_user_id, operation_row.id, false) then
      recovered := recovered + 1;
    end if;
  end loop;
  return recovered;
end;
$$;
revoke all on function public.recover_stale_ai_credit_operations(uuid) from public, anon, authenticated;
grant execute on function public.recover_stale_ai_credit_operations(uuid) to service_role;
