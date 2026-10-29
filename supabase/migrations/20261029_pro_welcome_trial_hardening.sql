-- Restrict execution to service_role while safely reading Supabase Auth.
create or replace function public.kivai_welcome_trial(p_user_id uuid, p_redeem boolean default false)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text;
  v_canonical text;
  v_domain text;
  v_local text;
  v_fingerprint text;
  v_claim public.pro_welcome_trial_claims;
  v_now timestamptz := now();
  v_until timestamptz := v_now + interval '7 days';
  v_status text;
begin
  if p_user_id is null then return jsonb_build_object('status','unavailable'); end if;
  -- Same per-user advisory lock used by administrative subscription RPC.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  select lower(trim(email)) into v_email
  from auth.users where id=p_user_id and email_confirmed_at is not null;
  if v_email is null or position('@' in v_email)=0 then
    return jsonb_build_object('status','verify_email');
  end if;

  v_local := split_part(v_email,'@',1);
  v_domain := split_part(v_email,'@',2);
  if v_domain in ('gmail.com','googlemail.com') then
    v_domain := 'gmail.com';
    v_local := replace(split_part(v_local,'+',1),'.','');
  end if;
  v_canonical := v_local || '@' || v_domain;
  v_fingerprint := md5(v_canonical);
  -- Serialize competing claims across different accounts using the same canonical email.
  perform pg_advisory_xact_lock(hashtextextended(v_fingerprint,1));
  
  select * into v_claim from public.pro_welcome_trial_claims
  where user_id=p_user_id or email_fingerprint=v_fingerprint
  limit 1;
  if found then
    return jsonb_build_object('status','used','expiresAt',v_claim.expires_at);
  end if;

  -- Do not grant if the customer has ever had Pro test access.
  if exists(select 1 from public.user_subscriptions
      where user_id=p_user_id and test_access=true) then
    return jsonb_build_object('status','used');
  end if;

  -- Don't overwrite paid or administratively granted access.
  if exists(select 1 from public.user_subscriptions
      where user_id=p_user_id and status in ('pending','active','past_due')) then
    return jsonb_build_object('status','has_plan');
  end if;
  
  if not exists(select 1 from public.user_profiles where user_id=p_user_id) then
    return jsonb_build_object('status','unavailable');
  end if;
  if not p_redeem then return jsonb_build_object('status','eligible'); end if;

  -- One atomic transaction: log the claim and activate Pro together.
  insert into public.pro_welcome_trial_claims(user_id,email_fingerprint,granted_at,expires_at)
  values(p_user_id,v_fingerprint,v_now,v_until);
  insert into public.user_subscriptions
    (user_id,plan_code,status,provider,current_period_start,current_period_end,test_access)
  values(p_user_id,'pro','active','welcome_trial',v_now,v_until,true);
  update public.user_profiles set plan_code='pro',lifecycle_stage='trial',updated_at=v_now
  where user_id=p_user_id;
  insert into public.customer_marketing_events(user_id,event_type,description,metadata)
  values(p_user_id,'welcome_trial_granted','Teste de boas-vindas Pro por 7 dias, sem cobrança automática.',
         jsonb_build_object('expires_at',v_until,'source','welcome_trial'));
  return jsonb_build_object('status','activated','expiresAt',v_until);
end;
$$;
revoke all on function public.kivai_welcome_trial(uuid,boolean) from public,anon,authenticated;
grant execute on function public.kivai_welcome_trial(uuid,boolean) to service_role;
