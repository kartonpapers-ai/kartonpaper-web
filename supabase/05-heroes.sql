-- Ejecutar UNA VEZ en el proyecto de desarrollo, después de 04.
-- Conserva el catálogo. Crea campañas, fotos y carga los siete heroes actuales.
begin;
create table public.kp_campaigns (
 id text primary key check(id ~ '^[a-z0-9-]+$'),
 data jsonb not null,
 published boolean not null default false,
 sort_order integer not null default 0 check(sort_order between 0 and 9999),
 starts_at timestamptz,
 ends_at timestamptz,
 version integer not null default 1,
 updated_at timestamptz not null default now(),
 check(ends_at is null or starts_at is null or ends_at > starts_at)
);
alter table public.kp_campaigns enable row level security;
revoke all on public.kp_campaigns from public,anon,authenticated;
grant select on public.kp_campaigns to anon,authenticated;
grant insert(id,data,published,sort_order,starts_at,ends_at) on public.kp_campaigns to authenticated;
grant update(data,published,sort_order,starts_at,ends_at) on public.kp_campaigns to authenticated;
create policy kp_campaign_public on public.kp_campaigns for select to anon,authenticated
using(published and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy kp_campaign_admin_read on public.kp_campaigns for select to authenticated using((select public.kp_is_admin()));
create policy kp_campaign_admin_insert on public.kp_campaigns for insert to authenticated with check((select public.kp_is_admin()));
create policy kp_campaign_admin_update on public.kp_campaigns for update to authenticated using((select public.kp_is_admin())) with check((select public.kp_is_admin()));
create function kp_private.validate_campaign() returns trigger language plpgsql set search_path='' as $$
declare field text; value jsonb; action jsonb;
begin
 foreach field in array array['title','lead','image','alt'] loop
  if jsonb_typeof(new.data->field) is distinct from 'string' or length(btrim(new.data->>field))=0 or length(new.data->>field)>500 then raise exception 'Campo de campaña inválido: %',field; end if;
 end loop;
 if length(new.data->>'title')>120 then raise exception 'Título demasiado extenso'; end if;
 foreach field in array array['highlight','badge','badgeStatus'] loop
  if jsonb_typeof(new.data->field) is distinct from 'string' or length(new.data->>field)>120 then raise exception 'Texto de campaña inválido'; end if;
 end loop;
 if new.data->>'image' !~ '^images/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$' and new.data->>'image' !~ '^https://qdclylextthpzxtijvpx\.supabase\.co/storage/v1/object/public/kp-heroes/[a-z0-9-]+\.webp$' then raise exception 'Imagen de campaña inválida'; end if;
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
 if tg_op='UPDATE' then new.version=old.version+1; end if;
 new.updated_at=now(); return new;
end;
$$;
revoke all on function kp_private.validate_campaign() from public,anon,authenticated;
create trigger kp_campaign_validation before insert or update on public.kp_campaigns for each row execute function kp_private.validate_campaign();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('kp-heroes','kp-heroes',true,1048576,array['image/webp']) on conflict(id) do nothing;
create policy kp_admin_hero_image_insert on storage.objects for insert to authenticated
with check(bucket_id='kp-heroes' and (select public.kp_is_admin()) and name ~ '^[a-z0-9-]+\.webp$');
insert into public.kp_campaigns(id,data,published,sort_order) values ('hero-1','{"title": "Packs para Cerveza Artesanal", "highlight": "listos para despachar.", "lead": "Maletas y wraps en cartulina kraft 400g autoarmables. Compra directa online sin impresión o personaliza con tu logo desde 100 unidades.", "image": "images/beer-overview-approved.webp", "alt": "Packs kraft para cerveza artesanal", "primary": {"kind": "categoria", "target": "cerveza", "label": "Comprar packs de cerveza"}, "secondary": {"kind": "whatsapp", "target": "", "label": "Cotizar por WhatsApp"}, "trust": ["Packs desde 50 u. listos", "Cartulina kraft 400g extra firme", "Para botellas 330cc y 500cc"], "badge": "Packs de 2, 3, 4 y 6 botellas", "badgeStatus": "● En stock"}'::jsonb,true,0) on conflict(id) do nothing;
insert into public.kp_campaigns(id,data,published,sort_order) values ('hero-2','{"title": "Colección Souvenir:", "highlight": "Posavasos de Chile.", "lead": "Caja de 20 posavasos con ilustraciones icónicas de la Antártica Chilena, Torres del Paine y Valparaíso. Fabricados en cartulina absorbente importada de pulpa mecánica (90 mm).", "image": "images/hero-posavasos.webp", "alt": "Posavasos de cartón absorbente de pulpa mecánica: Antártica, Torres del Paine y Zorro del Desierto", "primary": {"kind": "categoria", "target": "posavasos", "label": "Ver colección ($12.900)"}, "secondary": {"kind": "personalizar", "target": "posavasos-personalizados", "label": "Personalizar con mi logo"}, "trust": ["Cartulina absorbente exclusiva", "Caja kraft de regalo con 20 u.", "Diseños turísticos y marcas"], "badge": "Caja de 20 u. por $12.900", "badgeStatus": "★ Exclusivo"}'::jsonb,true,1) on conflict(id) do nothing;
insert into public.kp_campaigns(id,data,published,sort_order) values ('hero-3','{"title": "Packaging gourmet que", "highlight": "enamora a tus clientes.", "lead": "Papel de aluminio metalizado dorado y rosado (15×15 cm), cajas decoradas de temporada (San Valentín y Navidad) y envases compostables de caña con tu logo impreso en la tapa.", "image": "images/hero-alfajores.webp", "alt": "Cajas blancas con visor para 3, 4 y 6 alfajores artesanales, sobre fondo menta", "primary": {"kind": "categoria", "target": "reposteria", "label": "Ver repostería & alfajores"}, "secondary": {"kind": "categoria", "target": "gastronomia", "label": "Clamshells compostables"}, "trust": ["Papel alfajor dorado y rosado", "Cajas con visor transparente", "Impresión digital en tapas"], "badge": "Edición San Valentín & Navidad", "badgeStatus": "● En stock"}'::jsonb,true,2) on conflict(id) do nothing;
insert into public.kp_campaigns(id,data,published,sort_order) values ('hero-4','{"title": "Envases compostables con", "highlight": "tu marca en la tapa.", "lead": "Clamshells y bowls de bagazo de caña de azúcar personalizados en la parte superior de la tapa. Combínalos con bolsas de papel para un delivery que destaque.", "image": "images/hero-compostables.webp", "alt": "Envases de bagazo de caña con diseños botánicos solo en la parte superior de las tapas, junto a una bolsa de papel de delivery sobre fondo menta", "primary": {"kind": "categoria", "target": "gastronomia", "label": "Ver envases compostables"}, "secondary": {"kind": "categoria", "target": "bolsas", "label": "Ver bolsas de papel"}, "trust": ["Fibra de bagazo de caña", "Personalización en tapa", "Bolsas para delivery"], "badge": "", "badgeStatus": ""}'::jsonb,true,3) on conflict(id) do nothing;
insert into public.kp_campaigns(id,data,published,sort_order) values ('hero-5','{"title": "Doypacks kraft que", "highlight": "cuentan tu historia.", "lead": "Envases con ventana y cierre Ziplock para té, frutos secos y snacks. Personaliza una o ambas caras con tu diseño y elige el tamaño ideal para tu producto.", "image": "images/hero-doypack.webp", "alt": "Doypacks kraft personalizados con diseño botánico, ilustración de gallo y vista posterior impresa, sobre fondo menta", "primary": {"kind": "categoria", "target": "doypack", "label": "Ver doypacks personalizados"}, "secondary": null, "trust": ["Cierre Ziplock", "Ventana transparente", "Impresión en 1 o 2 caras"], "badge": "", "badgeStatus": ""}'::jsonb,true,4) on conflict(id) do nothing;
insert into public.kp_campaigns(id,data,published,sort_order) values ('hero-6','{"title": "Bolsas de papel que", "highlight": "llevan tu marca más lejos.", "lead": "Blancas o kraft, en distintos tamaños y personalizadas con tu diseño. Una presentación cuidada para tus productos, tu tienda y cada entrega.", "image": "images/hero-bolsas.webp", "alt": "Bolsas de papel personalizadas: blanca con asas torcidas y kraft con asas planas, en una escena editorial sobre fondo menta", "primary": {"kind": "categoria", "target": "bolsas", "label": "Ver bolsas de papel"}, "secondary": null, "trust": ["Papel blanco y kraft", "Distintos tamaños", "Personalización con tu diseño"], "badge": "", "badgeStatus": ""}'::jsonb,true,5) on conflict(id) do nothing;
insert into public.kp_campaigns(id,data,published,sort_order) values ('hero-7','{"title": "Un toque de brillo para", "highlight": "tus dulces artesanales.", "lead": "Papel metalizado dorado y rosa en láminas de 15 × 15 cm. Ideal para envolver chocolates y alfajores con una presentación elegante y cuidada.", "image": "images/hero-papel-metalizado.webp", "alt": "Láminas de papel metalizado dorado y rosa junto a alfajores artesanales y chocolates envueltos, sobre fondo menta", "primary": {"kind": "categoria", "target": "reposteria", "label": "Ver papel metalizado y repostería"}, "secondary": null, "trust": ["Láminas de 15 × 15 cm", "Dorado y rosa", "Para chocolates y alfajores"], "badge": "", "badgeStatus": ""}'::jsonb,true,6) on conflict(id) do nothing;
create or replace function kp_private.validate_campaign_layers() returns trigger
language plpgsql set search_path='' as $$
declare field text; n numeric; lo numeric; hi numeric;
begin
 if not (new.data ? 'layout') then return new; end if;
 if jsonb_typeof(new.data->'layout') is distinct from 'string' or new.data->>'layout' not in ('scene','layered') then raise exception 'Composición inválida'; end if;
 if new.data->>'layout'='scene' then return new; end if;
 if jsonb_typeof(new.data->'background') is distinct from 'object' or jsonb_typeof(new.data->'product') is distinct from 'object' then raise exception 'Configuración de capas inválida'; end if;
 if jsonb_typeof(new.data->'background'->'kind') is distinct from 'string' or new.data->'background'->>'kind' not in ('solid','gradient') then raise exception 'Fondo inválido'; end if;
 foreach field in array array['color','color2'] loop
  if jsonb_typeof(new.data->'background'->field) is distinct from 'string' or new.data->'background'->>field !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Color inválido'; end if;
 end loop;
 foreach field in array array['size','x','mobileSize','mobileX'] loop
  if jsonb_typeof(new.data->'product'->field) is distinct from 'number' then raise exception 'Posición inválida'; end if;
  n=(new.data->'product'->>field)::numeric;
  if field='size' then lo=25;hi=80;
  elsif field='x' then lo=55;hi=85;
  elsif field='mobileSize' then lo=50;hi=100;
  else lo=35;hi=65;end if;
  if n<>floor(n) or n<lo or n>hi then raise exception 'Tamaño o posición fuera de rango'; end if;
 end loop;
 return new;
end;
$$;
revoke all on function kp_private.validate_campaign_layers() from public,anon,authenticated;
drop trigger if exists kp_campaign_layer_validation on public.kp_campaigns;
create trigger kp_campaign_layer_validation before insert or update on public.kp_campaigns
for each row execute function kp_private.validate_campaign_layers();
commit;
