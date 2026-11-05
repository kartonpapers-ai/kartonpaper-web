-- Packs blancos sin impresión aprobados: 25 a $400/u y 50 a $350/u, netos.
-- Conserva nombre, imagen, publicación y orden; personalización desde 100 unidades.
begin;
do $$ begin
 if not exists(select 1 from public.kp_products where id='reposteria-caja-3-alfajores') then
  raise exception 'Falta la caja de 3 alfajores; no se aplicaron los packs';
 end if;
end $$;
with approved as (select $prices${"type": "dual", "price": "$400 + IVA c/u · Pack 25 u. sin impresión", "priceNum": 400, "specs": ["Capacidad 3 alfajores", "Blancas desde 25 u.", "Con logo desde 100 u."], "variants": ["Pack 25 u. · Sin impresión ($10.000 + IVA)", "Pack 50 u. · Sin impresión ($17.500 + IVA)"], "sku": "KP-REP-A3", "packs": [{"quantity": 25, "unitPrice": 400, "totalNet": 10000, "sku": "KP-REP-A3-P025-SI", "withoutPrint": true, "label": "Pack 25 u. · Sin impresión ($10.000 + IVA)"}, {"quantity": 50, "unitPrice": 350, "totalNet": 17500, "sku": "KP-REP-A3-P050-SI", "withoutPrint": true, "label": "Pack 50 u. · Sin impresión ($17.500 + IVA)"}], "configurations": ["100 unidades", "250 unidades", "500 unidades"], "subtitle": "Cartulina blanca 320 g/m² · Mica transparente · Con logo desde 100 u.: $391 + IVA c/u"}$prices$::jsonb as patch)
update public.kp_products p set data=p.data || a.patch
from approved a where p.id='reposteria-caja-3-alfajores' and p.data is distinct from (p.data || a.patch);
commit;
select id,data->>'price' as precio,data->'packs' as packs,data->'configurations' as personalizacion
from public.kp_products where id='reposteria-caja-3-alfajores';
