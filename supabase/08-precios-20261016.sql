-- Actualización de precios de venta netos, 16/10/2026.
-- Ejecutar manualmente en Supabase SQL Editor, sobre la base conectada al Preview.
-- No contiene costos de compra ni márgenes internos. No cambia cerveza ni posavasos.
-- Si detecta ediciones de precio o variantes posteriores, aborta sin sobrescribirlas.
begin;
create temporary table kp_price_update_20261016 (
  id text primary key, expected jsonb not null, patch jsonb not null
) on commit drop;
insert into kp_price_update_20261016 (id,expected,patch) values
('reposteria-papel-metalizado','{"price":"Desde $8.900","priceNum":8900,"variants":["Dorado metalizado (Pack 100 u.)","Rosado metalizado (Pack 100 u.)","Dorado metalizado (Pack 500 u. $36.900)","Rosado metalizado (Pack 500 u. $36.900)"]}'::jsonb,'{"price":"$12.300 + IVA (Pack 100 u.)","priceNum":12300,"variants":["Dorado metalizado (Pack 100 u. $12.300 + IVA)","Rosado metalizado (Pack 100 u. $12.300 + IVA)","Dorado metalizado (Pack 500 u. $61.500 + IVA)","Rosado metalizado (Pack 500 u. $61.500 + IVA)"]}'::jsonb),
('reposteria-caja-3-alfajores','{"price":"Cotización con logo","priceNum":null,"variants":["100 unidades","250 unidades","500 unidades"]}'::jsonb,'{"price":"$391 + IVA c/u","priceNum":391,"variants":["100 unidades","250 unidades","500 unidades"]}'::jsonb),
('reposteria-caja-4-alfajores','{"price":"Cotización con logo","priceNum":null,"variants":["100 unidades","250 unidades","500 unidades"]}'::jsonb,'{"price":"$391 + IVA c/u","priceNum":391,"variants":["100 unidades","250 unidades","500 unidades"]}'::jsonb),
('reposteria-caja-6-alfajores','{"price":"Cotización con logo","priceNum":null,"variants":["100 unidades","250 unidades","500 unidades"]}'::jsonb,'{"price":"$397 + IVA c/u","priceNum":397,"variants":["100 unidades","250 unidades","500 unidades"]}'::jsonb),
('bagasse-pollo-1','{"price":"Cotización con logo","priceNum":null,"variants":["Modelo Pollo 1 Bagasse"]}'::jsonb,'{"price":"$522 + IVA c/u","priceNum":522,"variants":["Modelo Pollo 1 Bagasse"]}'::jsonb),
('bagasse-sandwich-6x6','{"price":"Cotización con logo","priceNum":null,"variants":["Modelo 6 × 6 Bagasse"]}'::jsonb,'{"price":"$303 + IVA c/u","priceNum":303,"variants":["Modelo 6 × 6 Bagasse"]}'::jsonb),
('bagasse-bowl-850','{"price":"Cotización con logo","priceNum":null,"variants":["Marmita Bowl 850 ml con tapa"]}'::jsonb,'{"price":"$352 + IVA c/u","priceNum":352,"variants":["Marmita Bowl 850 ml con tapa"]}'::jsonb),
('bagasse-colacion-c205','{"price":"Cotización con logo","priceNum":null,"variants":["Modelo Porta Colación C205 900ml"]}'::jsonb,'{"price":"$394 + IVA c/u","priceNum":394,"variants":["Modelo Porta Colación C205 900ml"]}'::jsonb),
('bolsa-papel-kraft','{"price":"Cotización por medida","priceNum":null,"variants":["14 × 20 × 8 cm (pequeña)","14 × 40 × 8 cm (para botellas)","22 × 30 × 10 cm (mediana)","30 × 41 × 12 cm (grande)","45 × 48 × 15 cm (extra grande)"]}'::jsonb,'{"price":"Desde $292 + IVA c/u","priceNum":292,"variants":["14 × 20 × 8 cm (pequeña) · $292 + IVA c/u","14 × 40 × 8 cm (para botellas) · $343 + IVA c/u","22 × 30 × 10 cm (mediana) · $316 + IVA c/u","30 × 41 × 12 cm (grande) · $518 + IVA c/u","45 × 48 × 15 cm (extra grande) · $712 + IVA c/u"]}'::jsonb),
('bolsa-papel-blanca','{"price":"Cotización por medida","priceNum":null,"variants":["14 × 20 × 8 cm (pequeña)","14 × 40 × 8 cm (para botellas)","22 × 30 × 10 cm (mediana)","30 × 41 × 12 cm (grande)","45 × 48 × 15 cm (extra grande)"]}'::jsonb,'{"price":"Desde $292 + IVA c/u","priceNum":292,"variants":["14 × 20 × 8 cm (pequeña) · $292 + IVA c/u","14 × 40 × 8 cm (para botellas) · $343 + IVA c/u","22 × 30 × 10 cm (mediana) · $316 + IVA c/u","30 × 41 × 12 cm (grande) · $518 + IVA c/u","45 × 48 × 15 cm (extra grande) · $712 + IVA c/u"]}'::jsonb),
('doypack-kraft-ventana','{"price":"Cotización según medida","priceNum":null,"variants":["10 × 15 + 3 cm","12 × 20 + 4 cm","14 × 20 + 4 cm","16 × 24 + 4 cm","20 × 29 + 5 cm","25 × 35 + 5 cm"]}'::jsonb,'{"price":"Desde $174 + IVA c/u","priceNum":174,"variants":["10 × 15 + 3 cm · $174 + IVA c/u","12 × 20 + 4 cm · $219 + IVA c/u","14 × 20 + 4 cm · $255 + IVA c/u","16 × 24 + 4 cm · $343 + IVA c/u","20 × 29 + 5 cm · $558 + IVA c/u","25 × 35 + 5 cm · $570 + IVA c/u"]}'::jsonb);
do $$
begin
  perform p.id from public.kp_products p
    join kp_price_update_20261016 u on p.id=u.id for update of p;
  if exists (
    select 1 from kp_price_update_20261016 u
    left join public.kp_products p on p.id=u.id
    where p.id is null or (
      jsonb_build_object('price',p.data->'price','priceNum',p.data->'priceNum','variants',p.data->'variants') <> u.expected
      and jsonb_build_object('price',p.data->'price','priceNum',p.data->'priceNum','variants',p.data->'variants') <> u.patch
    )
  ) then
    raise exception 'Precios no aplicados: falta un producto o hay precios/variantes editados. Revisar antes de actualizar.';
  end if;
end;
$$;
update public.kp_products p set data=p.data || u.patch
from kp_price_update_20261016 u where p.id=u.id
and jsonb_build_object('price',p.data->'price','priceNum',p.data->'priceNum','variants',p.data->'variants') <> u.patch;
select p.id, p.data->>'price' as precio_neto, p.data->'variants' as opciones
from public.kp_products p join kp_price_update_20261016 u on p.id=u.id order by p.sort_order;
commit;
