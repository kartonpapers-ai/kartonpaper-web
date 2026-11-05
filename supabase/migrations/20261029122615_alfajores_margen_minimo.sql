-- H9: reglas de Finanzas para cajas de alfajores, sin cambiar fichas ni precios.
-- Complementa la validación existente; no reemplaza permisos ni controles generales.
begin;
create or replace function kp_private.validate_alfajores_finance()
returns trigger language plpgsql security invoker set search_path='' as $$
declare product jsonb; candidate jsonb; matches integer; white boolean; k text;
 variant text; identity text;
begin
 if new.data->>'product_id' not in ('reposteria-caja-3-alfajores','reposteria-caja-4-alfajores','reposteria-caja-6-alfajores') then return new; end if;
 foreach k in array array['floor','target','quantity','printing','prints'] loop
  if jsonb_typeof(new.data->k) is distinct from 'number' then raise exception 'Alfajores: revisa margen, cantidad e impresión'; end if;
 end loop;
 if (new.data->>'floor')::numeric<40 or (new.data->>'target')::numeric<40 then raise exception 'Alfajores requiere al menos 40%% de margen'; end if;
 select data into product from public.kp_products where id=new.data->>'product_id';
 variant:=new.data->>'variant';
 -- La identidad conserva cantidad y modalidad, pero omite el precio mostrado.
 identity:=btrim(regexp_replace(split_part(variant,' · $',1),'\s*\(\$[^)]*\)$',''));
 select count(*) into matches from jsonb_array_elements(case when jsonb_typeof(product->'packs')='array' then product->'packs' else '[]'::jsonb end) as p(value)
 where p.value->>'label'=variant or p.value->>'sku'=variant;
 if matches=1 then
  select value into candidate from jsonb_array_elements(product->'packs') as p(value) where p.value->>'label'=variant or p.value->>'sku'=variant;
 else
  select count(*),jsonb_agg(value)->0 into matches,candidate from jsonb_array_elements(case when jsonb_typeof(product->'packs')='array' then product->'packs' else '[]'::jsonb end) as p(value)
  where p.value->>'configuration'=variant or btrim(regexp_replace(split_part(p.value->>'label',' · $',1),'\s*\(\$[^)]*\)$',''))=identity;
 end if;
 if matches=1 and jsonb_typeof(candidate->'withoutPrint')='boolean' then
  white:=(candidate->>'withoutPrint')::boolean;
 elsif matches=0 and (case when jsonb_typeof(product->'configurations')='array' then product->'configurations' else '[]'::jsonb end) ? variant then
  white:=false;
 else
  raise exception 'Alfajores: selecciona una modalidad válida del catálogo';
 end if;
 if white then
  if (new.data->>'printing')::numeric<>0 or (new.data->>'prints')::numeric<>0 then raise exception 'Alfajores blancos: impresión y pasadas deben ser cero'; end if;
 else
  if (new.data->>'quantity')::numeric<100 then raise exception 'Alfajores con logo: mínimo 100 unidades'; end if;
  if (new.data->>'prints')::numeric<1 then raise exception 'Alfajores con logo: registra al menos una pasada'; end if;
 end if;
 return new;
end;
$$;
revoke all on function kp_private.validate_alfajores_finance() from public,anon,authenticated;
drop trigger if exists kp_finance_alfajores_policy on public.kp_finance;
create trigger kp_finance_alfajores_policy before insert or update on public.kp_finance
for each row execute function kp_private.validate_alfajores_finance();
commit;
