-- Bolsas kraft y blancas: cantidades acordadas por medida. Conserva precios y fotos.
begin;
do $$ begin
 if (select count(*) from public.kp_products where id in ('bolsa-papel-kraft','bolsa-papel-blanca') and data->>'type'='custom')<>2 then raise exception 'Faltan bolsas kraft o blancas'; end if;
end $$;
with approved as(select * from jsonb_to_recordset($rules$[{"id":"bolsa-papel-kraft","patch":{"quantityRules":[{"variant":"14 × 20 × 8 cm (pequeña)","quantities":[100,200,500]},{"variant":"14 × 40 × 8 cm (para botellas)","step":400},{"variant":"22 × 30 × 10 cm (mediana)","step":400},{"variant":"30 × 41 × 12 cm (grande)","step":200},{"variant":"45 × 48 × 15 cm (extra grande)","step":150}]}},{"id":"bolsa-papel-blanca","patch":{"quantityRules":[{"variant":"14 × 20 × 8 cm (pequeña)","quantities":[100,200,500]},{"variant":"14 × 40 × 8 cm (para botellas)","step":400},{"variant":"22 × 30 × 10 cm (mediana)","step":400},{"variant":"30 × 41 × 12 cm (grande)","step":200},{"variant":"45 × 48 × 15 cm (extra grande)","step":150}]}}]$rules$::jsonb) as x(id text,patch jsonb))
update public.kp_products p set data=p.data || a.patch from approved a
where p.id=a.id and p.data is distinct from (p.data || a.patch);
commit;
select id,data->'quantityRules' as cantidades_por_medida from public.kp_products
where id in ('bolsa-papel-kraft','bolsa-papel-blanca') order by id;
