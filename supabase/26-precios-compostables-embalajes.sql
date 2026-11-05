-- Protección de precios por cantidad. No modifica productos ni precios existentes.
-- La interfaz admite datos anteriores; este trigger refuerza escrituras directas.
begin;
create or replace function kp_private.validate_quantity_prices() returns trigger
language plpgsql set search_path='' as $$
declare
 row_data jsonb; step_size numeric; quantity numeric; unit_price numeric;
 previous_quantity numeric := 0; skus text[] := '{}'; selected_row jsonb;
begin
 if not (new.data ? 'quantityPrices') then return new; end if;
 if new.data->>'category' is distinct from 'gastronomia'
   or new.data->>'type' is distinct from 'custom'
   or new.data->>'printingArea' is distinct from 'tapa'
   or jsonb_typeof(new.data->'orderStep') is distinct from 'number'
   or jsonb_typeof(new.data->'quantityPrices') is distinct from 'array' then
   raise exception 'Configuración de precios por embalaje inválida';
 end if;
 step_size := (new.data->>'orderStep')::numeric;
 if step_size < 1 or step_size > 1000000 or mod(step_size,1) <> 0
   or jsonb_array_length(new.data->'quantityPrices') not between 1 and 30 then
   raise exception 'Revisa los precios por embalaje';
 end if;
 for row_data in select jsonb_array_elements(new.data->'quantityPrices') loop
   if jsonb_typeof(row_data) is distinct from 'object'
     or jsonb_typeof(row_data->'quantity') is distinct from 'number'
     or jsonb_typeof(row_data->'sku') is distinct from 'string'
     or jsonb_typeof(row_data->'label') is distinct from 'string'
     or not (row_data ? 'unitPrice') or not (row_data ? 'totalNet') then
     raise exception 'Tramo de precio inválido';
   end if;
   quantity := (row_data->>'quantity')::numeric;
   if quantity < step_size or quantity > 1000000 or mod(quantity,step_size) <> 0
     or quantity <= previous_quantity or row_data->>'sku' !~ '^[A-Z0-9-]{1,80}$'
     or (row_data->>'sku') = any(skus)
     or not (new.data->'variants' @> jsonb_build_array(row_data->>'label')) then
     raise exception 'Revisa cantidades, SKU y opciones de embalaje';
   end if;
   if jsonb_typeof(row_data->'unitPrice') = 'null' then
     if jsonb_typeof(row_data->'totalNet') is distinct from 'null' then raise exception 'Un tramo por cotizar no puede tener total'; end if;
   else
     if jsonb_typeof(row_data->'unitPrice') is distinct from 'number'
       or jsonb_typeof(row_data->'totalNet') is distinct from 'number' then raise exception 'Precio de embalaje inválido'; end if;
     unit_price := (row_data->>'unitPrice')::numeric;
     if unit_price < 0 or unit_price > 1000000000 or mod(unit_price,1) <> 0
       or (row_data->>'totalNet')::numeric <> quantity*unit_price then raise exception 'El total no coincide con cantidad por precio'; end if;
   end if;
   if new.data->'initialPriceQuantity' = row_data->'quantity' then selected_row := row_data; end if;
   previous_quantity := quantity; skus := array_append(skus,row_data->>'sku');
 end loop;
 if new.data ? 'initialPriceQuantity' then
   if jsonb_typeof(new.data->'initialPriceQuantity') is distinct from 'number' or selected_row is null then raise exception 'Tramo inicial inválido'; end if;
   if jsonb_typeof(selected_row->'unitPrice') = 'null' then
     if new.data ? 'priceNum' then raise exception 'El precio inicial está por cotizar'; end if;
   elsif new.data->'priceNum' is distinct from selected_row->'unitPrice' then
     raise exception 'El precio inicial no coincide con el tramo seleccionado';
   end if;
 end if;
 return new;
end;
$$;
revoke all on function kp_private.validate_quantity_prices() from public,anon,authenticated;
drop trigger if exists kp_quantity_prices_validation on public.kp_products;
create trigger kp_quantity_prices_validation before insert or update on public.kp_products
for each row execute function kp_private.validate_quantity_prices();
commit;
