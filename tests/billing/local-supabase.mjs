// Isolated HTTP adapter over real in-memory PostgreSQL. Never contacts Supabase.
import http from 'node:http';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
await db.exec(fs.readFileSync(new URL('./schema-fixture.sql',import.meta.url),'utf8'));
await db.exec(fs.readFileSync(new URL('../../supabase/migrations/20260930234728_plan_access_and_saved_projects.sql',import.meta.url),'utf8'));
await db.exec(`alter table customer_communications add column error text,add column provider_status text,add column scheduled_for timestamptz default now(),add column created_at timestamptz default now(),add column updated_at timestamptz default now();
alter table user_profiles add column customer_score int default 0,add column marketing_tags text[] default '{}';
alter table subscription_requests add column created_at timestamptz default now(),add column payment_reported_at timestamptz,add column amount_brl numeric default 19.9,add column payment_link text default 'https://example.invalid/payment';
alter table site_contents add column existing_tool_slug text,add column hub_id uuid,add column canonical_url text default '',add column display_location text default 'direct',add column show_in_most_used boolean default false,add column display_order int default 100,add column created_at timestamptz default now(),add column updated_at timestamptz default now();
alter table site_services add column existing_service_slug text,add column canonical_url text default '',add column cover_image_url text default '',add column display_order int default 100,add column block_visibility jsonb default '{}',add column created_at timestamptz default now(),add column updated_at timestamptz default now();`);
const id='00000000-0000-4000-8000-000000000001';
await db.query('insert into auth.users values($1)',[id]);
await db.query("insert into user_profiles(user_id,full_name) values($1,'Cliente Teste')",[id]);
await db.query("insert into subscription_requests(user_id,customer_email,customer_name,plan_code,billing_cycle,status) values($1,'test@example.invalid','Cliente Teste','pro','monthly','payment_reported')",[id]);
const tables=new Map();
for(const row of (await db.query("select table_name,column_name from information_schema.columns where table_schema='public'")).rows){if(!tables.has(row.table_name))tables.set(row.table_name,new Set());tables.get(row.table_name).add(row.column_name);}
const user={id,email:'test@example.invalid',created_at:new Date().toISOString(),app_metadata:{provider:'email'}};
http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');
 if(req.method==='OPTIONS'){res.end();return;}
 const url=new URL(req.url,'http://127.0.0.1:3197');let raw='';for await(const chunk of req)raw+=chunk;const body=raw?JSON.parse(raw):{};
 try {
  if(url.pathname==='/auth/v1/user'){if(req.headers.authorization!=='Bearer fixture-user'){res.writeHead(401).end('{}');return;}res.end(JSON.stringify(user));return;}
  if(url.pathname==='/auth/v1/admin/users'){res.end(JSON.stringify({users:[user]}));return;}
  if(url.pathname.startsWith('/rest/v1/rpc/')){
   const fn=url.pathname.split('/').pop();if(!/^kivai_[a-z_]+$/.test(fn))throw Error('invalid rpc');
   const entries=Object.entries(body);const params=entries.map(([key],i)=>`${key} => $${i+1}`).join(',');
   const result=await db.query(`select public.${fn}(${params}) result`,entries.map(([,v])=>v && typeof v==='object' && !Array.isArray(v)?JSON.stringify(v):v));res.end(JSON.stringify(result.rows[0].result));return;
  }
  const table=url.pathname.split('/').pop(),columns=tables.get(table);if(!columns){res.end('[]');return;}
  const values=[],where=[];
  for(const [key,value] of url.searchParams){if(!columns.has(key))continue;if(value.startsWith('eq.')){values.push(value.slice(3));where.push(`"${key}"=$${values.length}`);}else if(value.startsWith('in.(')){const list=value.slice(4,-1).split(',');where.push(`"${key}"::text in (${list.map(x=>{values.push(x);return '$'+values.length}).join(',')})`);}}
  if(req.headers.authorization==='Bearer fixture-user'&&columns.has('user_id')){values.push(id);where.push(`user_id=$${values.length}`);}
  const predicate=where.length?' where '+where.join(' and '):'';let result;
  if(req.method==='PATCH'){
   const assignments=Object.entries(body).filter(([key])=>columns.has(key)).map(([key,v])=>{values.push(v && typeof v==='object'?JSON.stringify(v):v);return `"${key}"=$${values.length}`});
   result=await db.query(`update public.${table} set ${assignments.join(',')}${predicate} returning *`,values);
  }else if(req.method==='DELETE'){result=await db.query(`delete from public.${table}${predicate} returning *`,values);}
  else {const order=(url.searchParams.get('order')||'').split(',').filter(x=>columns.has(x.split('.')[0])).map(x=>{const[k,dir]=x.split('.');return `"${k}" ${dir==='desc'?'desc':'asc'}`}).join(',');result=await db.query(`select * from public.${table}${predicate}${order?' order by '+order:''}`,values);}
  res.end(JSON.stringify(result.rows));
 }catch(e){res.writeHead(400).end(JSON.stringify({message:e.message}));}
}).listen(3197,'127.0.0.1',()=>console.log('Isolated billing database listening on 3197'));
