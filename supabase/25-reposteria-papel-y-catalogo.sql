-- Retira las cajas de temporada del catálogo y renueva la foto del papel.
-- Conserva el producto de temporada en administración y no cambia precios.
begin;
do $$ begin
 if not exists(select 1 from public.kp_products where id='reposteria-papel-metalizado') then
  raise exception 'Falta el producto de papel metalizado';
 end if;
end $$;
update public.kp_products set published=false
where id='reposteria-cajas-decoradas' and published;
update public.kp_products
set data=jsonb_set(data,'{image}','"images/papel-metalizado-pliegos-15x15.webp"'::jsonb)
where id='reposteria-papel-metalizado'
 and data->>'image' is distinct from 'images/papel-metalizado-pliegos-15x15.webp';
commit;
select id,published,data->>'image' as imagen from public.kp_products
where id in ('reposteria-cajas-decoradas','reposteria-papel-metalizado');
