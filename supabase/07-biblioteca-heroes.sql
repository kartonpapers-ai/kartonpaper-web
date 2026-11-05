-- Ejecutar una vez después de 05-heroes.sql. No modifica campañas ni productos.
begin;
create table public.kp_hero_assets (
 url text primary key check(url ~ '^https://qdclylextthpzxtijvpx\.supabase\.co/storage/v1/object/public/kp-heroes/[a-z0-9-]+\.webp$'),
 name text not null check(length(btrim(name)) between 1 and 120),
 category text not null check(category in ('general','cerveza','reposteria','gastronomia','bolsas','doypack','posavasos')),
 bytes integer not null check(bytes between 1 and 1048576),
 created_at timestamptz not null default now()
);
revoke all on public.kp_hero_assets from public,anon,authenticated;
grant select,insert(url,name,category,bytes) on public.kp_hero_assets to authenticated;
alter table public.kp_hero_assets enable row level security;
create policy kp_admin_assets_read on public.kp_hero_assets for select to authenticated using((select public.kp_is_admin()));
create policy kp_admin_assets_insert on public.kp_hero_assets for insert to authenticated with check((select public.kp_is_admin()));
create or replace function kp_private.validate_campaign() returns trigger language plpgsql set search_path='' as $$
declare field text; value jsonb; action jsonb;
begin
 foreach field in array array['title','lead','image','alt'] loop
  if jsonb_typeof(new.data->field) is distinct from 'string' or length(btrim(new.data->>field))=0 or length(new.data->>field)>500 then raise exception 'Campo de campaña inválido: %',field; end if;
 end loop;
 if length(new.data->>'title')>120 then raise exception 'Título demasiado extenso'; end if;
 foreach field in array array['highlight','badge','badgeStatus'] loop
  if jsonb_typeof(new.data->field) is distinct from 'string' or length(new.data->>field)>120 then raise exception 'Texto de campaña inválido'; end if;
 end loop;
 if new.data->>'image' !~ '^images/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$' and new.data->>'image' !~ '^https://qdclylextthpzxtijvpx\.supabase\.co/storage/v1/object/public/kp-(heroes|productos)/[a-z0-9-]+\.webp$' then raise exception 'Imagen de campaña inválida'; end if;
 if jsonb_typeof(new.data->'trust') is distinct from 'array' then raise exception 'Características inválidas'; end if;
 if jsonb_array_length(new.data->'trust')>3 then raise exception 'Máximo tres características'; end if;
 for value in select jsonb_array_elements(new.data->'trust') loop
  if jsonb_typeof(value) is distinct from 'string' or length(btrim(value #>> '{}'))=0 or length(value #>> '{}')>120 then raise exception 'Característica inválida'; end if;
 end loop;
 foreach field in array array['primary','secondary'] loop
  action=new.data->field;
  if field='secondary' and action='null'::jsonb then continue; end if;
  if jsonb_typeof(action) is distinct from 'object' or jsonb_typeof(action->'label') is distinct from 'string' or length(btrim(action->>'label'))=0 or length(action->>'label')>100 or jsonb_typeof(action->'target') is distinct from 'string' then raise exception 'Botón inválido'; end if;
  if action->>'kind'='categoria' then
   if action->>'target' not in ('all','cerveza','reposteria','gastronomia','bolsas','doypack','posavasos') then raise exception 'Categoría inválida'; end if;
  elsif action->>'kind' in ('producto','personalizar') then
   if not exists(select 1 from public.kp_products where id=action->>'target') then raise exception 'Producto inexistente'; end if;
  elsif action->>'kind'='whatsapp' then
   if action->>'target' <> '' then raise exception 'Destino de WhatsApp inválido'; end if;
  else raise exception 'Acción inválida'; end if;
 end loop;
 if new.data ? 'colors' then
  if jsonb_typeof(new.data->'colors') is distinct from 'object' then raise exception 'Colores inválidos'; end if;
  foreach field in array array['title','text','accent','button','buttonText'] loop
   if jsonb_typeof(new.data->'colors'->field) is distinct from 'string' or new.data->'colors'->>field !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Color inválido'; end if;
  end loop;
 end if;
 if new.data->'product' ? 'shadow' and jsonb_typeof(new.data->'product'->'shadow') is distinct from 'boolean' then raise exception 'Sombra inválida'; end if;
 if tg_op='UPDATE' then new.version=old.version+1; end if;
 new.updated_at=now(); return new;
end;
$$;
revoke all on function kp_private.validate_campaign() from public,anon,authenticated;
commit;
