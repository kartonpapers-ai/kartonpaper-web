-- Categoría definitiva: personalizados + Patagonia, Rock y Fútbol.
-- Precios pendientes por decisión comercial. No borra productos ni pedidos anteriores.
-- Ejecutar después de 23-posavasos-modelo-y-logos.sql para activar la carga privada de logos.
begin;
with approved as (
 select * from jsonb_to_recordset($coasters$[{"id": "posavasos-personalizados", "data": {"id": "posavasos-personalizados", "category": "posavasos", "name": "Posavasos Personalizados con Tu Logo", "subtitle": "Para empresas, bares, cafeterías y eventos · Pack prueba desde 20 unidades", "type": "custom", "image": "images/posavasos-personalizados-b2b.webp", "price": "Cotización con logo", "specs": ["Pulpa absorbente", "Tu logo o gráfica", "Pack prueba de 20 · Volumen desde 100"], "variants": ["20 unidades · Pack prueba", "100 unidades", "200 unidades", "500 unidades", "1.000 unidades", "2.000 unidades", "5.000 unidades"], "configurations": ["Tu logo o gráfica"], "customQuantities": [20, 100, 200, 500, 1000, 2000, 5000], "requiresArtwork": true}, "sort_order": 18}, {"id": "posavasos-souvenir-chile", "data": {"id": "posavasos-souvenir-chile", "category": "posavasos", "name": "Caja Souvenir Patagonia", "subtitle": "Ilustraciones turísticas de la Patagonia · Para turismo, hoteles y tiendas", "type": "stock", "image": "images/posavasos-patagonia.webp", "price": "Consultar precio · Caja de 20", "pricePending": true, "specs": ["20 posavasos por caja", "Caja kraft con ventana", "Pulpa absorbente"], "variants": ["1 caja kraft con 20 posavasos"], "stockUnits": 20, "wholesaleInquiry": true}, "sort_order": 19}, {"id": "posavasos-heroes-rock", "data": {"id": "posavasos-heroes-rock", "category": "posavasos", "name": "Caja Colección Héroes del Rock", "subtitle": "Ilustraciones vintage de leyendas de la música · Para regalos y quinchos", "type": "stock", "image": "images/posavasos-heroes-rock.webp", "price": "Consultar precio · Caja de 20", "pricePending": true, "specs": ["20 posavasos por caja", "Caja kraft con ventana", "Pulpa absorbente"], "variants": ["1 caja kraft con 20 posavasos"], "stockUnits": 20}, "sort_order": 20}, {"id": "posavasos-leyendas-futbol", "data": {"id": "posavasos-leyendas-futbol", "category": "posavasos", "name": "Caja Colección Leyendas del Fútbol", "subtitle": "Ilustraciones de figuras icónicas del fútbol · Para deportes y quinchos", "type": "stock", "image": "images/posavasos-leyendas-futbol.webp", "price": "Consultar precio · Caja de 20", "pricePending": true, "specs": ["20 posavasos por caja", "Caja kraft con ventana", "Pulpa absorbente"], "variants": ["1 caja kraft con 20 posavasos"], "stockUnits": 20}, "sort_order": 21}]$coasters$::jsonb) as x(id text,data jsonb,sort_order integer)
)
insert into public.kp_products(id,data,sort_order,published)
select id,data,sort_order,true from approved
on conflict(id) do update set data=public.kp_products.data || excluded.data,sort_order=excluded.sort_order,published=true
where public.kp_products.data is distinct from (public.kp_products.data || excluded.data)
 or public.kp_products.sort_order<>excluded.sort_order or not public.kp_products.published;
-- Las temáticas anteriores siguen disponibles en administración, ocultas en la web.
update public.kp_products set published=false
where data->>'category'='posavasos' and published and id not in ('posavasos-personalizados','posavasos-souvenir-chile','posavasos-heroes-rock','posavasos-leyendas-futbol');
commit;
select id,data->>'name' as modelo,published,data->>'price' as precio from public.kp_products
where data->>'category'='posavasos' order by sort_order,id;
