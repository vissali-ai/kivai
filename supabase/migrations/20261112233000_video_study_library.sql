-- Kivai video study projects: additive preview feature. No user data is removed.
alter table public.saved_tool_projects drop constraint if exists saved_tool_projects_kind_check;
alter table public.saved_tool_projects add constraint saved_tool_projects_kind_check
 check(kind in ('calendar','briefing','qr_code','watermark','social_report','preview_post','engagement','roas','roi','post_analysis','trend_radar','margin','markup','post_creator','proofreader','video_summary'));

create table if not exists public.video_study_playlists(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null,
 name text not null check (char_length(btrim(name)) between 1 and 80),
 created_at timestamptz not null default now(),
 unique(id,user_id)
);
create table if not exists public.video_study_playlist_entries(
 playlist_id uuid not null,
 user_id uuid not null,
 project_id uuid not null references public.saved_tool_projects(id) on delete cascade,
 position integer not null default 0,
 primary key(playlist_id,project_id),
 foreign key(playlist_id,user_id) references public.video_study_playlists(id,user_id) on delete cascade
);
create index if not exists video_study_playlist_entries_order_idx on public.video_study_playlist_entries(playlist_id,position);
create table if not exists public.video_study_audio(
 project_id uuid primary key references public.saved_tool_projects(id) on delete cascade,
 user_id uuid not null,
 storage_path text not null unique,
 size_bytes bigint not null check(size_bytes between 1 and 30000000),
 mime_type text not null default 'audio/wav',
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index if not exists video_study_audio_expiry_idx on public.video_study_audio(expires_at);
create table if not exists public.video_study_usage(
 user_id uuid not null,
 month_start date not null,
 summaries integer not null default 0 check(summaries>=0),
 audio integer not null default 0 check(audio>=0),
 primary key(user_id,month_start)
);
do $$
begin
 if not exists (select 1 from storage.buckets where id='video-study-audio') then
  insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('video-study-audio','video-study-audio',false,30000000,array['audio/wav']);
 end if;
end $$;
do $$
declare v_table text;
begin
 foreach v_table in array array['video_study_playlists','video_study_playlist_entries','video_study_audio','video_study_usage'] loop
  execute format('alter table public.%I enable row level security',v_table);
  execute format('revoke all on public.%I from anon,authenticated',v_table);
  execute format('grant select,insert,update,delete on public.%I to service_role',v_table);
 end loop;
end $$;

-- Dedicated entitlement, with limits independent of the general project cap.
create or replace function public.kivai_save_video_project(p_user_id uuid,p_id uuid,p_title text,p_payload jsonb,p_revision integer default 0)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_plan public.kivai_plan_code; v_cap integer; v_row public.saved_tool_projects;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 if char_length(btrim(p_title)) not between 1 and 120 or octet_length(p_payload::text)>524288 then raise exception 'Dados inválidos'; end if;
 v_plan:=public.kivai_effective_plan(p_user_id);
 v_cap:=case when v_plan='agency' then 500 when v_plan='pro' then 100 else 10 end;
 if p_id is null then
  if (select count(*) from public.saved_tool_projects where user_id=p_user_id and kind='video_summary')>=v_cap
   then raise exception 'Limite de resumos salvos atingido'; end if;
  insert into public.saved_tool_projects(user_id,kind,title,client_name,payload)
   values(p_user_id,'video_summary',btrim(p_title),'',p_payload) returning * into v_row;
 else
  select * into v_row from public.saved_tool_projects where id=p_id and user_id=p_user_id and kind='video_summary' for update;
  if v_row.id is null then raise exception 'Resumo não encontrado'; end if;
  if v_row.revision<>p_revision then raise exception 'Resumo alterado em outra aba'; end if;
  update public.saved_tool_projects set title=btrim(p_title),payload=p_payload,revision=revision+1,updated_at=now()
   where id=p_id returning * into v_row;
 end if;
 return to_jsonb(v_row);
end $$;
revoke all on function public.kivai_save_video_project(uuid,uuid,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.kivai_save_video_project(uuid,uuid,text,jsonb,integer) to service_role;

create or replace function public.kivai_reserve_video_study_usage(p_user_id uuid,p_kind text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_plan public.kivai_plan_code; v_cap integer; v_month date:=date_trunc('month',now() at time zone 'utc')::date; v_current integer;
begin
 if p_kind not in ('summary','audio') then raise exception 'Tipo inválido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 v_plan:=public.kivai_effective_plan(p_user_id);
 v_cap:=case when v_plan='agency' then 60 when v_plan='pro' then 20 else 3 end;
 insert into public.video_study_usage(user_id,month_start) values(p_user_id,v_month) on conflict do nothing;
 select case when p_kind='summary' then summaries else audio end into v_current
  from public.video_study_usage where user_id=p_user_id and month_start=v_month for update;
 if v_current>=v_cap then return false; end if;
 if p_kind='summary' then update public.video_study_usage set summaries=summaries+1 where user_id=p_user_id and month_start=v_month;
 else update public.video_study_usage set audio=audio+1 where user_id=p_user_id and month_start=v_month; end if;
 return true;
end $$;
revoke all on function public.kivai_reserve_video_study_usage(uuid,text) from public,anon,authenticated;
grant execute on function public.kivai_reserve_video_study_usage(uuid,text) to service_role;

create or replace function public.kivai_refund_video_study_usage(p_user_id uuid,p_kind text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_kind not in ('summary','audio') then raise exception 'Tipo inválido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 if p_kind='summary' then
 update public.video_study_usage set summaries=greatest(0,summaries-1) where user_id=p_user_id and month_start=date_trunc('month',now() at time zone 'utc')::date;
 else
 update public.video_study_usage set audio=greatest(0,audio-1) where user_id=p_user_id and month_start=date_trunc('month',now() at time zone 'utc')::date;
 end if;
end $$;
revoke all on function public.kivai_refund_video_study_usage(uuid,text) from public,anon,authenticated;
grant execute on function public.kivai_refund_video_study_usage(uuid,text) to service_role;

-- Preserve existing project counts for every original tool. Video summaries use their own quota.
create or replace function public.kivai_save_project(p_user_id uuid,p_id uuid,p_kind text,p_title text,p_client text,p_payload jsonb,p_revision integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_plan public.kivai_plan_code; v_row public.saved_tool_projects; v_client text:=trim(coalesce(p_client,''));
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 if p_kind='video_summary' then raise exception 'Use o salvamento de vídeos'; end if;
 v_plan:=public.kivai_effective_plan(p_user_id);
 if v_plan<>'agency' and v_client<>'' then raise exception 'Organização por cliente é exclusiva do Agency'; end if;
 if v_client<>'' and not exists(select 1 from public.saved_tool_projects where user_id=p_user_id and lower(client_name)=lower(v_client))
  and (select count(distinct lower(client_name)) from public.saved_tool_projects where user_id=p_user_id and client_name<>'')>=20 then raise exception 'Limite de 20 clientes atingido'; end if;
 if p_id is null then
  if (select count(*) from public.saved_tool_projects where user_id=p_user_id and kind<>'video_summary')>=(case when v_plan='agency' then 200 when v_plan='pro' then 30 else 5 end) then raise exception 'Limite de projetos atingido'; end if;
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
end $$;
revoke all on function public.kivai_save_project(uuid,uuid,text,text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.kivai_save_project(uuid,uuid,text,text,text,jsonb,integer) to service_role;
