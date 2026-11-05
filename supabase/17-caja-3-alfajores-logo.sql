-- Agrega la opción visible de 100 cajas con logo a $391/u netos.
-- Requiere el archivo 16 aplicado; conserva los dos packs blancos y demás datos.
begin;
do $$ begin
 if not exists(select 1 from public.kp_products where id='reposteria-caja-3-alfajores' and data->>'type'='dual' and data->>'sku'='KP-REP-A3') then
  raise exception 'Primero ejecuta 16-caja-3-alfajores-packs.sql';
 end if;
end $$;
with approved as(select $prices${"variants": ["Pack 25 u. · Sin impresión ($10.000 + IVA)", "Pack 50 u. · Sin impresión ($17.500 + IVA)", "Pack 100 u. · Con logo ($39.100 + IVA)"], "packs": [{"quantity": 25, "unitPrice": 400, "totalNet": 10000, "sku": "KP-REP-A3-P025-SI", "withoutPrint": true, "label": "Pack 25 u. · Sin impresión ($10.000 + IVA)"}, {"quantity": 50, "unitPrice": 350, "totalNet": 17500, "sku": "KP-REP-A3-P050-SI", "withoutPrint": true, "label": "Pack 50 u. · Sin impresión ($17.500 + IVA)"}, {"quantity": 100, "unitPrice": 391, "totalNet": 39100, "sku": "KP-REP-A3-P100-LOGO", "withoutPrint": false, "label": "Pack 100 u. · Con logo ($39.100 + IVA)", "requiresLogo": true, "configuration": "100 unidades"}], "configurations": ["100 unidades", "250 unidades", "500 unidades"]}$prices$::jsonb as patch)
update public.kp_products p set data=p.data || a.patch from approved a
where p.id='reposteria-caja-3-alfajores' and p.data is distinct from (p.data || a.patch);
commit;
select id,data->'variants' as opciones,data->'packs' as packs from public.kp_products where id='reposteria-caja-3-alfajores';
