-- Doypack: 100, 200 y 500 personalizados para las seis medidas.
-- Solo configura cantidades. No cambia precios, fotos o condiciones de impresión.
begin;
do $$ begin
 if not exists(select 1 from public.kp_products where id='doypack-kraft-ventana' and data->>'type'='custom') then raise exception 'Falta la ficha personalizada de doypack'; end if;
end $$;
with approved as(select $rules${"quantityRules":[{"variant":"10 × 15 + 3 cm","quantities":[100,200,500]},{"variant":"12 × 20 + 4 cm","quantities":[100,200,500]},{"variant":"14 × 20 + 4 cm","quantities":[100,200,500]},{"variant":"16 × 24 + 4 cm","quantities":[100,200,500]},{"variant":"20 × 29 + 5 cm","quantities":[100,200,500]},{"variant":"25 × 35 + 5 cm","quantities":[100,200,500]}]}$rules$::jsonb as patch)
update public.kp_products p set data=p.data || a.patch from approved a
where p.id='doypack-kraft-ventana' and p.data is distinct from (p.data || a.patch);
commit;
select id,data->'quantityRules' as cantidades_por_medida from public.kp_products where id='doypack-kraft-ventana';
