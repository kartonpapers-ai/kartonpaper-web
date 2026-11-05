-- Planificación privada. Requiere 01 y administrador autorizado (03).
-- No crea cuentas sociales, no publica ni guarda credenciales.
begin;
create table if not exists public.kp_social (
 id text primary key check(id='workspace'),
 data jsonb not null check(octet_length(data::text)<=5000000),
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.kp_social enable row level security;
revoke all on public.kp_social from public,anon,authenticated;
grant select on public.kp_social to authenticated;
grant insert(id,data) on public.kp_social to authenticated;
grant update(data) on public.kp_social to authenticated;
drop policy if exists kp_social_read on public.kp_social;
drop policy if exists kp_social_insert on public.kp_social;
drop policy if exists kp_social_update on public.kp_social;
create policy kp_social_read on public.kp_social for select to authenticated using ((select public.kp_is_admin()));
create policy kp_social_insert on public.kp_social for insert to authenticated with check ((select public.kp_is_admin()));
create policy kp_social_update on public.kp_social for update to authenticated using ((select public.kp_is_admin())) with check ((select public.kp_is_admin()));
create or replace function kp_private.validate_social() returns trigger language plpgsql set search_path='' as $$
declare a jsonb;w jsonb;p jsonb;k text;v numeric;d date;seen text[]='{}';channels text[]='{}';link text;
begin
 if jsonb_typeof(new.data) is distinct from 'object' or jsonb_typeof(new.data->'accounts') is distinct from 'array' or jsonb_typeof(new.data->'weeks') is distinct from 'array' then raise exception 'Planificación inválida';end if;
 if jsonb_array_length(new.data->'accounts')<>4 or jsonb_array_length(new.data->'weeks')>104 then raise exception 'Revisa cuentas o límite de semanas';end if;
 for a in select value from jsonb_array_elements(new.data->'accounts') loop
  if jsonb_typeof(a->'channel') is distinct from 'string' or a->>'channel' not in ('instagram','facebook','tiktok','whatsapp') or a->>'channel'=any(channels) or jsonb_typeof(a->'status') is distinct from 'string' or a->>'status' not in ('por_crear','creada','lista') or jsonb_typeof(a->'url') is distinct from 'string' then raise exception 'Cuenta inválida';end if;
  channels=array_append(channels,a->>'channel');link=a->>'url';
  if length(link)>1000 or (link<>'' and (link !~ '^https://[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?([/?#]|$)' or link ~ '^https://[^/]*@')) or (a->>'status'='lista' and link='') then raise exception 'Enlace público de cuenta inválido';end if;
 end loop;
 for w in select value from jsonb_array_elements(new.data->'weeks') loop
  foreach k in array array['week','title','product_id','campaign_id','audience','goal','message','cta','url','learning'] loop
   if jsonb_typeof(w->k) is distinct from 'string' then raise exception 'Texto requerido: %',k;end if;
  end loop;
  if w->>'week' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$|^2100-[0-9]{2}-[0-9]{2}$' then raise exception 'Semana inválida';end if;
  d=(w->>'week')::date;if extract(isodow from d)<>1 or w->>'week'=any(seen) then raise exception 'Semana duplicada o no comienza lunes';end if;seen=array_append(seen,w->>'week');
  if length(btrim(w->>'title'))=0 or length(w->>'title')>150 or length(w->>'product_id')>100 or length(w->>'campaign_id')>100 or length(w->>'audience')>300 or length(w->>'goal')>300 or length(w->>'message')>2000 or length(w->>'cta')>500 or length(w->>'url')>1000 or length(w->>'learning')>2000 then raise exception 'Texto fuera de rango';end if;
  link=w->>'url';if link<>'' and (link !~ '^https://[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?([/?#]|$)' or link ~ '^https://[^/]*@') then raise exception 'Destino inválido';end if;
  foreach k in array array['inquiries','quotes','orders','revenue','spend'] loop
   if w->k='null'::jsonb then continue;end if;
   if jsonb_typeof(w->k) is distinct from 'number' then raise exception 'Métrica inválida';end if;v=(w->>k)::numeric;
   if v<0 or mod(v,1)<>0 or v>(case when k in ('revenue','spend') then 1000000000 else 1000000 end) then raise exception 'Métrica fuera de rango';end if;
  end loop;
  if jsonb_typeof(w->'posts') is distinct from 'array' then raise exception 'Falta contenido';end if;
  if jsonb_array_length(w->'posts')>20 then raise exception 'Demasiado contenido';end if;
  for p in select value from jsonb_array_elements(w->'posts') loop
   foreach k in array array['channel','date','format','state','copy','asset','url'] loop
    if jsonb_typeof(p->k) is distinct from 'string' then raise exception 'Campo de contenido inválido';end if;
   end loop;
   if p->>'channel' not in ('instagram','facebook','tiktok','whatsapp') or p->>'state' not in ('borrador','lista','publicada') or p->>'date' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Contenido inválido';end if;
   if (p->>'date')::date<d or (p->>'date')::date>d+6 or length(p->>'format')>100 or length(p->>'copy')>5000 or length(p->>'asset')>2000 or length(p->>'url')>1000 then raise exception 'Fecha o texto de contenido fuera de rango';end if;
   link=p->>'url';if (link<>'' and (link !~ '^https://[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?([/?#]|$)' or link ~ '^https://[^/]*@')) or (p->>'state'='publicada' and p->>'channel'<>'whatsapp' and link='') then raise exception 'Enlace de publicación inválido';end if;
  end loop;
 end loop;
 new.version=case when tg_op='UPDATE' then old.version+1 else 1 end;new.updated_at=now();return new;
end;$$;
revoke all on function kp_private.validate_social() from public,anon,authenticated;
drop trigger if exists kp_social_validation on public.kp_social;
create trigger kp_social_validation before insert or update on public.kp_social for each row execute function kp_private.validate_social();
commit;
