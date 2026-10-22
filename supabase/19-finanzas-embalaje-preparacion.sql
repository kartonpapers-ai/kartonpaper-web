-- Ejecutar después del archivo 09. Amplía la validación de las fichas privadas.
-- No completa, borra ni modifica costos existentes. No modifica precios públicos.
begin;
do $$ begin
 if to_regclass('public.kp_finance') is null then raise exception 'Primero ejecuta 09-finanzas-privadas.sql'; end if;
end $$;
create or replace function kp_private.validate_finance() returns trigger language plpgsql set search_path='' as $$
declare k text; v jsonb; unit_cost numeric;
begin
 if jsonb_typeof(new.data) is distinct from 'object' then raise exception 'Ficha inválida'; end if;
 if jsonb_typeof(new.data->'product_id') is distinct from 'string' or new.data->>'product_id' is null or new.data->>'product_id' !~ '^[a-z0-9-]{1,100}$' then raise exception 'Producto inválido'; end if;
 foreach k in array array['variant','supplier','note'] loop
  if jsonb_typeof(new.data->k) is distinct from 'string' or length(new.data->>k)>(case k when 'variant' then 200 when 'supplier' then 150 else 1000 end) then raise exception 'Texto inválido'; end if;
 end loop;
 if length(btrim(new.data->>'variant'))=0 then raise exception 'Variante requerida'; end if;
 foreach k in array array['preparation','packaging'] loop
  v=new.data->k;
  if v is null or v='null'::jsonb then continue; end if;
  if jsonb_typeof(v) is distinct from 'number' then raise exception 'Número inválido %',k; end if;
  if (v::text)::numeric<0 or (v::text)::numeric>1000000000 then raise exception 'Importe fuera de rango %',k; end if;
 end loop;
 foreach k in array array['base','labor','extras','waste','fee','fixed','sale','purchase_total','purchase_units','printing','prints','quantity','discount','target','floor'] loop
  v=new.data->k;
  if v is null then raise exception 'Falta campo %',k; end if;
  if v='null'::jsonb and k=any(array['base','labor','extras','waste','fee','fixed','sale','purchase_total','purchase_units']) then continue; end if;
  if jsonb_typeof(v) is distinct from 'number' then raise exception 'Número inválido %',k; end if;
  if (v::text)::numeric<0 or (v::text)::numeric>1000000000 then raise exception 'Importe fuera de rango'; end if;
 end loop;
 if (new.data->>'quantity')::numeric not between 1 and 1000000 or mod((new.data->>'quantity')::numeric,1)<>0 or (new.data->>'prints')::numeric>1000000 or mod((new.data->>'prints')::numeric,1)<>0 then raise exception 'Cantidad inválida'; end if;
 if new.data->>'purchase_units' is not null and ((new.data->>'purchase_units')::numeric<1 or mod((new.data->>'purchase_units')::numeric,1)<>0) then raise exception 'Embalaje inválido'; end if;
 if coalesce((new.data->>'waste')::numeric,0)>=100 or coalesce((new.data->>'fee')::numeric,0)>=100 or (new.data->>'discount')::numeric>=100 or (new.data->>'target')::numeric<=0 or (new.data->>'target')::numeric>=100 or (new.data->>'floor')::numeric<=0 or (new.data->>'floor')::numeric>(new.data->>'target')::numeric or coalesce((new.data->>'fee')::numeric,0)+(new.data->>'target')::numeric>=100 then raise exception 'Porcentajes inválidos'; end if;
 if jsonb_typeof(new.data->'reviewed') is distinct from 'boolean' then raise exception 'Revisión inválida'; end if;
 if exists(select 1 from public.kp_products p where p.id=new.data->>'product_id' and p.data->>'category'='cerveza') and ((new.data->>'printing')::numeric<>0 or (new.data->>'prints')::numeric<>0) then raise exception 'Cerveza: impresión incluida en costo base'; end if;
 if (new.data->>'reviewed')::boolean and new.data->>'base' is not null and new.data->>'labor' is not null and new.data->>'extras' is not null and new.data->>'waste' is not null and new.data->>'fee' is not null and new.data->>'fixed' is not null and new.data->>'preparation' is not null and new.data->>'packaging' is not null then
  unit_cost := ((new.data->>'base')::numeric+(new.data->>'printing')::numeric*(new.data->>'prints')::numeric+(new.data->>'labor')::numeric+(new.data->>'extras')::numeric)/(1-(new.data->>'waste')::numeric/100)+((new.data->>'fixed')::numeric+(new.data->>'preparation')::numeric+(new.data->>'packaging')::numeric)/(new.data->>'quantity')::numeric;
  if unit_cost>9007199254740991 or unit_cost*(new.data->>'quantity')::numeric>9007199254740991 or unit_cost/(1-(new.data->>'fee')::numeric/100-(new.data->>'target')::numeric/100)>9007199254740991 or coalesce((new.data->>'sale')::numeric,0)*(new.data->>'quantity')::numeric*1.19>9007199254740991 then raise exception 'Importes calculados fuera de rango'; end if;
 end if;
 new.version=case when tg_op='UPDATE' then old.version+1 else 1 end;new.updated_at=now();return new;
end;$$;
revoke all on function kp_private.validate_finance() from public,anon,authenticated;
commit;
