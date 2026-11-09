-- Finalização de checkout exclusivamente após POST autenticado ao sandbox.
-- Persistir checkout id antes de exibir a URL ao usuário.
create or replace function public.kivai_finalize_asaas_checkout(
 p_id uuid, p_user_id uuid, p_external_reference text, p_provider_checkout_id text
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_row public.kivai_asaas_checkout_intents;
begin
 if p_id is null or p_user_id is null or p_external_reference is null
    or p_provider_checkout_id !~ '^[A-Za-z0-9_-]{4,120}$' then
   raise exception 'Identificação de checkout inválida';
 end if;
 update public.kivai_asaas_checkout_intents
  set provider_checkout_id=p_provider_checkout_id,state='created',updated_at=now()
  where id=p_id and user_id=p_user_id
    and external_reference=p_external_reference and state='creating'
    and provider_checkout_id is null
  returning * into v_row;
 if v_row.id is null then raise exception 'Checkout não pode ser finalizado'; end if;
 return jsonb_build_object('id',v_row.id,'state',v_row.state,
   'provider_checkout_id',v_row.provider_checkout_id);
end;
$$;
revoke all on function public.kivai_finalize_asaas_checkout(uuid,uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.kivai_finalize_asaas_checkout(uuid,uuid,text,text)
 to service_role;
