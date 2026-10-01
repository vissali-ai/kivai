-- All mutations exposed here are invoker functions, callable only by the server.
-- Subscription rows remain the source of access, including tests and courtesies.
create or replace function public.kivai_effective_plan(p_user_id uuid)
returns public.kivai_plan_code language sql stable security invoker set search_path = '' as $$
  select coalesce((select s.plan_code from public.user_subscriptions s
    where s.user_id=p_user_id and s.status='active' and s.current_period_end > now()
      and s.current_period_start <= now()
    order by s.updated_at desc, s.created_at desc, s.id desc limit 1), 'free'::public.kivai_plan_code);
$$;
revoke all on function public.kivai_effective_plan(uuid) from public, anon;
grant execute on function public.kivai_effective_plan(uuid) to authenticated, service_role;

-- Users may edit their contact details, never their own entitlements/admin fields.
revoke update on public.user_profiles from anon, authenticated;
grant update (full_name,avatar_url,phone,secondary_contact,address_street,address_number,
 address_complement,address_neighborhood,address_city,address_state,address_postal_code,
 whatsapp_opt_in,email_marketing_opt_in,updated_at) on public.user_profiles to authenticated;

create or replace function public.kivai_confirm_payment(p_request_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.subscription_requests; s public.user_subscriptions; v_user uuid;
 v_end timestamptz; v_base timestamptz; v_renew boolean; v_communication uuid;
 v_subject text; v_message text; v_label text; v_url text;
begin
 select user_id into v_user from public.subscription_requests where id=p_request_id;
 if v_user is null then raise exception 'Solicitação não encontrada'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 select * into r from public.subscription_requests where id=p_request_id for update;
 if r.status='active' then return jsonb_build_object('alreadyActive',true); end if;
 if r.status not in ('awaiting_payment','payment_reported') then raise exception 'Solicitação encerrada'; end if;
 select * into s from public.user_subscriptions where user_id=v_user order by updated_at desc,created_at desc,id desc limit 1 for update;
 v_renew := coalesce(s.status='active' and s.plan_code=r.plan_code and s.current_period_end>now(),false);
 -- Same-plan renewal preserves remaining time even when switching billing cycle.
 v_base := case when v_renew then s.current_period_end else now() end;
 v_end := v_base + case when r.billing_cycle='annual' then interval '1 year' else interval '1 month' end;
 update public.user_subscriptions set status='canceled',updated_at=now() where user_id=v_user and id is distinct from s.id and status='active';
 if s.id is null then
   insert into public.user_subscriptions(user_id,plan_code,status,provider,billing_cycle,current_period_start,current_period_end,provider_checkout_reference)
   values(v_user,r.plan_code,'active','external_recurring',r.billing_cycle,now(),v_end,r.id::text);
 else
   update public.user_subscriptions set plan_code=r.plan_code,status='active',provider='external_recurring',billing_cycle=r.billing_cycle,
    current_period_start=now(),current_period_end=v_end,provider_checkout_reference=r.id::text,cancel_at_period_end=false,
    grace_until=null,automatic_grace_granted_at=null,automatic_grace_original_period_end=null,test_access=false,updated_at=now()
   where id=s.id;
 end if;
 update public.user_profiles set plan_code=r.plan_code,lifecycle_stage='active',updated_at=now() where user_id=v_user;
 if not found then raise exception 'Perfil não encontrado'; end if;
 update public.subscription_requests set status='active',confirmed_at=now(),confirmed_by='admin',updated_at=now() where id=r.id;
 -- Respect Admin onboarding copy, with a transactional fallback if disabled/missing.
 select subject,message,cta_label,cta_url into v_subject,v_message,v_label,v_url
 from public.customer_onboarding_templates
 where template_key=case when r.plan_code='agency' then 'agency_welcome' else 'pro_welcome' end and enabled=true limit 1;
 v_subject:=replace(coalesce(v_subject,'Seu plano Kivai está ativo'),'{{nome}}',coalesce(r.customer_name,'Olá'));
 v_message:=replace(replace(replace(coalesce(v_message,'Seu plano '||r.plan_code||' está ativo até {{vencimento}}. Acesse seus benefícios no painel.'),
  '{{nome}}',coalesce(r.customer_name,'Olá')),'{{vencimento}}',to_char(v_end at time zone 'America/Sao_Paulo','DD/MM/YYYY')),'{{ciclo}}',case when r.billing_cycle='annual' then 'anual' else 'mensal' end);
 -- Durable outbox: template availability/email delivery cannot undo payment activation.
 insert into public.customer_communications(user_id,event_key,channel,status,subject,message,cta_label,cta_url,metadata)
 values(v_user,'payment_'||r.id,'email','ready',case when v_renew then 'Seu plano Kivai foi renovado' else v_subject end,
   v_message,coalesce(v_label,'Acessar meus benefícios'),coalesce(v_url,'https://www.kivai.com.br/conta'),
   jsonb_build_object('recipient_email',r.customer_email,'kind','subscription_activation','transactional',true,'request_id',r.id,'plan_code',r.plan_code))
 on conflict(event_key,channel) do nothing returning id into v_communication;
 insert into public.customer_marketing_events(user_id,event_type,description,metadata)
 values(v_user,case when v_renew then 'subscription_renewed' else 'subscription_activated' end,'Pagamento confirmado pelo administrador.',jsonb_build_object('request_id',r.id,'period_end',v_end));
 return jsonb_build_object('alreadyActive',false,'communicationId',v_communication,'periodEnd',v_end);
end;
$$;
revoke all on function public.kivai_confirm_payment(uuid) from public,anon,authenticated;
grant execute on function public.kivai_confirm_payment(uuid) to service_role;

create or replace function public.kivai_set_access(p_user_id uuid,p_plan public.kivai_plan_code,p_until timestamptz,p_source text,
 p_services text[] default null,p_notes text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare s public.user_subscriptions;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 if p_source not in ('admin_manual','admin_test','admin_grace') then raise exception 'Origem inválida'; end if;
 if p_plan <> 'free' and (p_until is null or p_until <= now() or p_until > now()+interval '2 years') then raise exception 'Informe uma validade futura (até 2 anos)'; end if;
 select * into s from public.user_subscriptions where user_id=p_user_id order by updated_at desc,created_at desc,id desc limit 1 for update;
 if p_source='admin_test' and public.kivai_effective_plan(p_user_id)<>'free' then raise exception 'O cliente já tem acesso pago ativo'; end if;
 update public.user_subscriptions set status='canceled',updated_at=now() where user_id=p_user_id and (p_plan='free' or id is distinct from s.id) and status='active';
 if p_plan<>'free' then
  if s.id is null then
   insert into public.user_subscriptions(user_id,plan_code,status,provider,current_period_start,current_period_end,test_access)
   values(p_user_id,p_plan,'active',p_source,now(),p_until,p_source='admin_test');
  else
   update public.user_subscriptions set plan_code=p_plan,status='active',provider=p_source,billing_cycle=null,current_period_start=now(),current_period_end=p_until,
    grace_until=case when p_source='admin_grace' then p_until else null end,automatic_grace_granted_at=null,automatic_grace_original_period_end=null,
    test_access=p_source='admin_test',cancel_at_period_end=false,updated_at=now() where id=s.id;
  end if;
 end if;
 update public.user_profiles set plan_code=p_plan,lifecycle_stage=case when p_plan='free' then 'free' when p_source='admin_test' then 'trial' else 'active' end,
 contracted_services=coalesce(p_services,contracted_services),admin_notes=case when p_services is not null then p_notes else admin_notes end,updated_at=now() where user_id=p_user_id;
 if not found then raise exception 'Perfil não encontrado'; end if;
 -- Pending payments are retained for reconciliation, never falsely marked as paid.
 insert into public.customer_marketing_events(user_id,event_type,description,metadata) values(p_user_id,'admin_access_changed','Acesso administrativo atualizado; não representa confirmação de pagamento.',jsonb_build_object('plan',p_plan,'until',p_until,'source',p_source));
end;
$$;
revoke all on function public.kivai_set_access(uuid,public.kivai_plan_code,timestamptz,text,text[],text) from public,anon,authenticated;
grant execute on function public.kivai_set_access(uuid,public.kivai_plan_code,timestamptz,text,text[],text) to service_role;

create or replace function public.kivai_expire_access()
returns integer language plpgsql security invoker set search_path = '' as $$
declare v_user uuid; v_count integer:=0;
begin
 for v_user in select distinct user_id from public.user_subscriptions where status='active' and current_period_end<=now() loop
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  update public.user_subscriptions set status='past_due',updated_at=now() where user_id=v_user and status='active' and current_period_end<=now();
  if found then
   update public.user_profiles set plan_code=public.kivai_effective_plan(v_user),lifecycle_stage=case when public.kivai_effective_plan(v_user)='free' then 'expired' else 'active' end,updated_at=now() where user_id=v_user;
   v_count:=v_count+1;
  end if;
 end loop;
 return v_count;
end;
$$;
revoke all on function public.kivai_expire_access() from public,anon,authenticated;
grant execute on function public.kivai_expire_access() to service_role;

create table public.saved_tool_projects (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('calendar','briefing')),title text not null check(length(title) between 1 and 120),
 client_name text not null default '' check(length(client_name)<=100), payload jsonb not null,
 revision integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(octet_length(payload::text)<=524288)
);
create index saved_tool_projects_owner on public.saved_tool_projects(user_id,updated_at desc);
alter table public.saved_tool_projects enable row level security;
revoke all on public.saved_tool_projects from anon,authenticated;
grant select on public.saved_tool_projects to authenticated;
grant all on public.saved_tool_projects to service_role;
create policy saved_projects_read_own on public.saved_tool_projects for select to authenticated using((select auth.uid())=user_id);

create or replace function public.kivai_save_project(p_user_id uuid,p_id uuid,p_kind text,p_title text,p_client text,p_payload jsonb,p_revision integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_plan public.kivai_plan_code; v_row public.saved_tool_projects; v_client text:=trim(coalesce(p_client,''));
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 v_plan:=public.kivai_effective_plan(p_user_id);
 if v_plan='free' then raise exception 'Plano pago ativo necessário'; end if;
 if v_plan<>'agency' and v_client<>'' then raise exception 'Organização por cliente é exclusiva do Agency'; end if;
 if v_client<>'' and not exists(select 1 from public.saved_tool_projects where user_id=p_user_id and lower(client_name)=lower(v_client))
  and (select count(distinct lower(client_name)) from public.saved_tool_projects where user_id=p_user_id and client_name<>'')>=20 then raise exception 'Limite de 20 clientes atingido'; end if;
 if p_id is null then
  if (select count(*) from public.saved_tool_projects where user_id=p_user_id)>=(case when v_plan='agency' then 200 else 30 end) then raise exception 'Limite de projetos atingido'; end if;
  insert into public.saved_tool_projects(user_id,kind,title,client_name,payload) values(p_user_id,p_kind,trim(p_title),v_client,p_payload) returning * into v_row;
 else
  select * into v_row from public.saved_tool_projects where id=p_id and user_id=p_user_id for update;
  if v_row.id is null then raise exception 'Projeto não encontrado'; end if;
  if v_row.revision<>p_revision then raise exception 'Projeto alterado em outra aba. Abra novamente antes de salvar'; end if;
  if v_row.kind<>p_kind then raise exception 'Tipo de projeto inválido'; end if;
  if v_plan<>'agency' and v_row.client_name<>'' then raise exception 'Renove o Agency ou salve uma cópia pessoal'; end if;
  update public.saved_tool_projects set title=trim(p_title),client_name=v_client,payload=p_payload,revision=revision+1,updated_at=now() where id=p_id returning * into v_row;
 end if;
 return to_jsonb(v_row);
end;
$$;
revoke all on function public.kivai_save_project(uuid,uuid,text,text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.kivai_save_project(uuid,uuid,text,text,text,jsonb,integer) to service_role;

-- Enforce paid Instagram writes and quotas at the database boundary too.
create or replace function public.kivai_check_social_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_plan public.kivai_plan_code;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
 v_plan:=public.kivai_effective_plan(new.user_id);
 if v_plan='free' then raise exception 'Plano pago ativo necessário'; end if;
 if v_plan='pro' and new.follower_count>500000 then raise exception 'Limite de 500 mil seguidores'; end if;
 if tg_table_name='social_accounts' and tg_op='INSERT' and (select count(*) from public.social_accounts where user_id=new.user_id and platform='instagram')>=(case when v_plan='agency' then 20 else 5 end) then raise exception 'Limite de perfis atingido'; end if;
 if tg_table_name='social_snapshots' then
  if not exists(select 1 from public.social_accounts where id=new.social_account_id and user_id=new.user_id) then raise exception 'Perfil inválido'; end if;
 end if;
 return new;
end;
$$;
revoke all on function public.kivai_check_social_write() from public,anon;
grant execute on function public.kivai_check_social_write() to authenticated,service_role;
create trigger kivai_social_account_guard before insert or update on public.social_accounts for each row execute function public.kivai_check_social_write();
create trigger kivai_social_snapshot_guard before insert on public.social_snapshots for each row execute function public.kivai_check_social_write();

create or replace function public.kivai_automatic_grace(p_subscription_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare s public.user_subscriptions; v_user uuid; v_until timestamptz:=now()+interval '7 days';
begin
 select user_id into v_user from public.user_subscriptions where id=p_subscription_id;
 if v_user is null then return null; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 select * into s from public.user_subscriptions where id=p_subscription_id for update;
 if coalesce(s.provider,'') not in ('external_recurring','sumup_external') or s.status<>'past_due' or s.automatic_grace_granted_at is not null or s.current_period_end is null or s.current_period_end>now()-interval '7 days'
  or public.kivai_effective_plan(v_user)<>'free'
  or exists(select 1 from public.subscription_requests where user_id=v_user and status in ('awaiting_payment','payment_reported')) then return null; end if;
 update public.user_subscriptions set status='active',current_period_start=now(),current_period_end=v_until,grace_until=v_until,
 automatic_grace_granted_at=now(),automatic_grace_original_period_end=s.current_period_end,updated_at=now() where id=s.id;
 update public.user_profiles set plan_code=s.plan_code,lifecycle_stage='trial',updated_at=now() where user_id=v_user;
 return jsonb_build_object('graceUntil',v_until);
end;
$$;
revoke all on function public.kivai_automatic_grace(uuid) from public,anon,authenticated;
grant execute on function public.kivai_automatic_grace(uuid) to service_role;

-- Register explanatory content in the existing CMS. Preserve already edited entries.
insert into public.site_contents(content_type,slug,path,title,short_description,content_html,seo_title,seo_description,tool_mode,technical_status,status,indexable,include_in_sitemap,custom_data,published_at)
values ('page','planos','/planos','Ferramentas para analisar, planejar e organizar seu trabalho','Comece grátis. Com Pro, salve calendários e briefings na conta e acompanhe o histórico do Instagram. Com Agency, organize também os projetos por cliente.','<h2>O que está incluído</h2><p>Os limites de projetos somam calendários e briefings. No Pro, salve até 30 projetos pessoais. No Agency, salve até 200 projetos organizados por até 20 nomes de clientes. Clientes são pastas de organização: esta entrega não inclui membros de equipe, login de clientes ou aprovação externa.</p><h2>Como salvar e continuar em outro dispositivo</h2><p>Abra o calendário ou o planejador, dê um nome ao projeto e escolha Salvar na conta. Em outro dispositivo, entre na mesma conta e abra o projeto na ferramenta. As mudanças são salvas ao clicar no botão; não há edição colaborativa em tempo real. Use Salvar como novo projeto para reutilizar um modelo.</p><h2>Instagram e histórico</h2><p>As análises dependem das exportações oficiais da Meta que você importa. A primeira análise salva estabelece a referência; as seguintes permitem comparar períodos. Não coletamos automaticamente os dados do Instagram. O Agency não impõe um teto numérico de seguidores, mas a capacidade do navegador continua sendo um limite técnico.</p><h2>Pagamento e ativação</h2><p>Registre a contratação, pague no serviço financeiro e informe o pagamento no painel. O acesso é ativado após a conferência do administrador. O painel consulta a confirmação automaticamente enquanto estiver aberto e visível.</p><h2>Renovação e mudança de plano</h2><p>Na renovação do mesmo plano, inclusive ao mudar de mensal para anual, o novo período é acrescentado ao vencimento vigente. Na troca entre Pro e Agency, o novo plano entra em vigor na confirmação, com novo período contado dessa data; não há cálculo automático de crédito proporcional. Antes de pagar por uma troca antecipada, combine eventual saldo com o atendimento.</p><h2>Quando o acesso vence</h2><p>Novas gravações na conta ficam bloqueadas. Seus projetos existentes continuam disponíveis para abrir, exportar ou excluir. Ao sair do Agency, projetos de clientes permanecem consultáveis e podem ser copiados para uso pessoal dentro dos limites do Pro.</p><h2>Serviços contratados separadamente</h2><p>Gestão de redes sociais, criação de conteúdo por profissionais, tráfego pago e consultoria não estão incluídos na assinatura das ferramentas. Solicite uma proposta em Serviços.</p>','Planos Kivai | Grátis, Pro e Agency','Compare histórico do Instagram, calendários e briefings salvos no Pro e organização por cliente no Agency.','informational','not_applicable','published',true,true,'{"originalFields":[{"key":"free-description","label":"Resumo free","type":"textarea","value":"Ferramentas gratuitas para uso pontual, com rascunhos no navegador."},{"key":"free-features","label":"Benefícios free (um por linha)","type":"textarea","value":"Análise local de até 50 mil seguidores\nCalendário e briefing salvos neste navegador\nExportações gratuitas das ferramentas"},{"key":"pro-description","label":"Resumo pro","type":"textarea","value":"Projetos pessoais salvos na conta e acompanhamento do Instagram."},{"key":"pro-features","label":"Benefícios pro (um por linha)","type":"textarea","value":"Até 5 perfis do Instagram e 500 mil seguidores por perfil\nHistórico privado e comparação entre exportações da Meta\nAté 30 calendários e briefings salvos na conta\nAbra seus projetos em outros dispositivos e duplique modelos"},{"key":"agency-description","label":"Resumo agency","type":"textarea","value":"Organização de projetos por cliente e maior capacidade para sua operação."},{"key":"agency-features","label":"Benefícios agency (um por linha)","type":"textarea","value":"Até 20 perfis do Instagram\nHistórico e comparação separados por perfil\nAté 200 calendários e briefings salvos na conta\nOrganização dos projetos por até 20 clientes\nTodos os recursos de projetos do Pro"},{"key":"tutorial-url","label":"Link de tutorial dos planos","type":"url","value":""}]}'::jsonb,now()) on conflict(path) do nothing;
insert into public.site_services(slug,path,title,short_description,content_html,seo_title,seo_description,badge,service_type,audience,cta_label,cta_url,status,indexable,include_in_sitemap,show_in_services_index,published_at)
values ('planos-kivai','/servicos/planos-kivai','Assinaturas Pro e Agency','Comece grátis. Com Pro, salve calendários e briefings na conta e acompanhe o histórico do Instagram. Com Agency, organize também os projetos por cliente.','<h2>O que está incluído</h2><p>Os limites de projetos somam calendários e briefings. No Pro, salve até 30 projetos pessoais. No Agency, salve até 200 projetos organizados por até 20 nomes de clientes. Clientes são pastas de organização: esta entrega não inclui membros de equipe, login de clientes ou aprovação externa.</p><h2>Como salvar e continuar em outro dispositivo</h2><p>Abra o calendário ou o planejador, dê um nome ao projeto e escolha Salvar na conta. Em outro dispositivo, entre na mesma conta e abra o projeto na ferramenta. As mudanças são salvas ao clicar no botão; não há edição colaborativa em tempo real. Use Salvar como novo projeto para reutilizar um modelo.</p><h2>Instagram e histórico</h2><p>As análises dependem das exportações oficiais da Meta que você importa. A primeira análise salva estabelece a referência; as seguintes permitem comparar períodos. Não coletamos automaticamente os dados do Instagram. O Agency não impõe um teto numérico de seguidores, mas a capacidade do navegador continua sendo um limite técnico.</p><h2>Pagamento e ativação</h2><p>Registre a contratação, pague no serviço financeiro e informe o pagamento no painel. O acesso é ativado após a conferência do administrador. O painel consulta a confirmação automaticamente enquanto estiver aberto e visível.</p><h2>Renovação e mudança de plano</h2><p>Na renovação do mesmo plano, inclusive ao mudar de mensal para anual, o novo período é acrescentado ao vencimento vigente. Na troca entre Pro e Agency, o novo plano entra em vigor na confirmação, com novo período contado dessa data; não há cálculo automático de crédito proporcional. Antes de pagar por uma troca antecipada, combine eventual saldo com o atendimento.</p><h2>Quando o acesso vence</h2><p>Novas gravações na conta ficam bloqueadas. Seus projetos existentes continuam disponíveis para abrir, exportar ou excluir. Ao sair do Agency, projetos de clientes permanecem consultáveis e podem ser copiados para uso pessoal dentro dos limites do Pro.</p><h2>Serviços contratados separadamente</h2><p>Gestão de redes sociais, criação de conteúdo por profissionais, tráfego pago e consultoria não estão incluídos na assinatura das ferramentas. Solicite uma proposta em Serviços.</p>','Assinaturas Pro e Agency | Kivai','Compare histórico do Instagram, calendários e briefings salvos no Pro e organização por cliente no Agency.','Ferramentas por assinatura','Assinatura de ferramentas','Profissionais, criadores e agências','Comparar planos','/planos','published',true,true,true,now()) on conflict(slug) do nothing;
