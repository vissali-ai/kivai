-- Uso gratuito do Resumidor de Vídeos: proteção operacional contra abuso.
-- Sem cotas comerciais por plano; controle diário independente dos planos.
create table if not exists public.video_study_free_safety(
 day_utc date not null,
 fingerprint text not null,
 kind text not null check(kind in ('summary','audio')),
 hits integer not null default 0 check(hits>=0),
 primary key(day_utc,fingerprint,kind)
);
alter table public.video_study_free_safety enable row level security;
revoke all on public.video_study_free_safety from public,anon,authenticated;
grant select,insert,update,delete on public.video_study_free_safety to service_role;

create or replace function public.kivai_reserve_free_video_request(p_fingerprint text,p_kind text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare v_day date:=(now() at time zone 'utc')::date; v_count integer;
begin
 if p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' or p_kind not in ('summary','audio') then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended(v_day::text||p_kind,0));
 insert into public.video_study_free_safety(day_utc,fingerprint,kind,hits)
 values(v_day,'global',p_kind,0) on conflict do nothing;
 insert into public.video_study_free_safety(day_utc,fingerprint,kind,hits)
 values(v_day,p_fingerprint,p_kind,0) on conflict do nothing;
 select hits into v_count from public.video_study_free_safety
 where day_utc=v_day and fingerprint='global' and kind=p_kind for update;
 if v_count>=500 then return false;end if;
 select hits into v_count from public.video_study_free_safety
 where day_utc=v_day and fingerprint=p_fingerprint and kind=p_kind for update;
 if v_count>=40 then return false;end if;
 update public.video_study_free_safety set hits=hits+1
 where day_utc=v_day and fingerprint in ('global',p_fingerprint) and kind=p_kind;
 return true;
end $$;
revoke all on function public.kivai_reserve_free_video_request(text,text) from public,anon,authenticated;
grant execute on function public.kivai_reserve_free_video_request(text,text) to service_role;

create or replace function public.kivai_refund_free_video_request(p_fingerprint text,p_kind text)
returns void language plpgsql security invoker set search_path='' as $$
declare v_day date:=(now() at time zone 'utc')::date;
begin
 if p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' or p_kind not in ('summary','audio') then return;end if;
 perform pg_advisory_xact_lock(hashtextextended(v_day::text||p_kind,0));
 update public.video_study_free_safety set hits=greatest(0,hits-1)
 where day_utc=v_day and fingerprint in ('global',p_fingerprint) and kind=p_kind;
end $$;
revoke all on function public.kivai_refund_free_video_request(text,text) from public,anon,authenticated;
grant execute on function public.kivai_refund_free_video_request(text,text) to service_role;

-- Capacidade de organização igual para todas as contas, sem exigir plano pago.
create or replace function public.kivai_save_video_project(p_user_id uuid,p_id uuid,p_title text,p_payload jsonb,p_revision integer default 0)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_row public.saved_tool_projects;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 if char_length(btrim(p_title)) not between 1 and 120 or octet_length(p_payload::text)>524288 then raise exception 'Dados inválidos';end if;
 if p_id is null then
  if (select count(*) from public.saved_tool_projects where user_id=p_user_id and kind='video_summary')>=100
   then raise exception 'Capacidade da biblioteca de vídeos atingida';end if;
  insert into public.saved_tool_projects(user_id,kind,title,client_name,payload)
  values(p_user_id,'video_summary',btrim(p_title),'',p_payload) returning * into v_row;
 else
  select * into v_row from public.saved_tool_projects where id=p_id and user_id=p_user_id and kind='video_summary' for update;
  if v_row.id is null then raise exception 'Resumo não encontrado';end if;
  if v_row.revision<>p_revision then raise exception 'Resumo alterado em outra aba';end if;
  update public.saved_tool_projects set title=btrim(p_title),payload=p_payload,revision=revision+1,updated_at=now()
  where id=p_id returning * into v_row;
 end if;
 return to_jsonb(v_row);
end $$;
revoke all on function public.kivai_save_video_project(uuid,uuid,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.kivai_save_video_project(uuid,uuid,text,jsonb,integer) to service_role;
