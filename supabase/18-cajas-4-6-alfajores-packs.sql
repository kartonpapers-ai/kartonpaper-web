-- Cajas de 4 y 6: packs blancos 25/50 y 100 con logo. Valores netos CLP.
-- Conserva nombre, imagen, publicación y orden; no modifica la caja de 3.
begin;
do $$ begin
 if (select count(*) from public.kp_products where id in ('reposteria-caja-4-alfajores','reposteria-caja-6-alfajores')) <> 2 then
  raise exception 'Faltan cajas de 4 o 6 alfajores; no se aplicaron los packs';
 end if;
end $$;
with approved as (
 select * from jsonb_to_recordset($prices$[{"id":"reposteria-caja-4-alfajores","patch":{"type":"dual","subtitle":"Medida 14 × 14 × 3 cm · Cartulina blanca 320 g/m² · Mica transparente · Con logo desde 100 u.: $391 + IVA c/u","price":"$400 + IVA c/u · Pack 25 u. sin impresión","priceNum":400,"specs":["14 × 14 × 3 cm","Blancas desde 25 u.","Con logo desde 100 u."],"variants":["Pack 25 u. · Sin impresión ($10.000 + IVA)","Pack 50 u. · Sin impresión ($17.500 + IVA)","Pack 100 u. · Con logo ($39.100 + IVA)"],"sku":"KP-REP-A4","packs":[{"quantity":25,"unitPrice":400,"totalNet":10000,"sku":"KP-REP-A4-P025-SI","withoutPrint":true,"label":"Pack 25 u. · Sin impresión ($10.000 + IVA)"},{"quantity":50,"unitPrice":350,"totalNet":17500,"sku":"KP-REP-A4-P050-SI","withoutPrint":true,"label":"Pack 50 u. · Sin impresión ($17.500 + IVA)"},{"quantity":100,"unitPrice":391,"totalNet":39100,"sku":"KP-REP-A4-P100-LOGO","withoutPrint":false,"label":"Pack 100 u. · Con logo ($39.100 + IVA)","requiresLogo":true,"configuration":"100 unidades"}],"configurations":["100 unidades","250 unidades","500 unidades"]}},{"id":"reposteria-caja-6-alfajores","patch":{"type":"dual","subtitle":"Medida 19 × 14 × 3 cm · Cartulina blanca 320 g/m² · Mica transparente · Con logo desde 100 u.: $397 + IVA c/u","price":"$400 + IVA c/u · Pack 25 u. sin impresión","priceNum":400,"specs":["19 × 14 × 3 cm","Blancas desde 25 u.","Con logo desde 100 u."],"variants":["Pack 25 u. · Sin impresión ($10.000 + IVA)","Pack 50 u. · Sin impresión ($17.500 + IVA)","Pack 100 u. · Con logo ($39.700 + IVA)"],"sku":"KP-REP-A6","packs":[{"quantity":25,"unitPrice":400,"totalNet":10000,"sku":"KP-REP-A6-P025-SI","withoutPrint":true,"label":"Pack 25 u. · Sin impresión ($10.000 + IVA)"},{"quantity":50,"unitPrice":350,"totalNet":17500,"sku":"KP-REP-A6-P050-SI","withoutPrint":true,"label":"Pack 50 u. · Sin impresión ($17.500 + IVA)"},{"quantity":100,"unitPrice":397,"totalNet":39700,"sku":"KP-REP-A6-P100-LOGO","withoutPrint":false,"label":"Pack 100 u. · Con logo ($39.700 + IVA)","requiresLogo":true,"configuration":"100 unidades"}],"configurations":["100 unidades","250 unidades","500 unidades"]}}]$prices$::jsonb) as x(id text,patch jsonb)
)
update public.kp_products p set data=p.data || a.patch from approved a
where p.id=a.id and p.data is distinct from (p.data || a.patch);
commit;
select id,data->'variants' as opciones,data->'packs' as packs from public.kp_products
where id in ('reposteria-caja-4-alfajores','reposteria-caja-6-alfajores') order by id;
