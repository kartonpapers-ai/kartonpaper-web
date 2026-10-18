-- Cola privada de impresión. Requiere administrador y Ventas (archivo 10).
begin;
create table if not exists public.kp_production (
 id text primary key check(id ~ '^ot-[a-z0-9-]{1,100}$'),
 number bigint generated always as identity unique,
 data jsonb not null,
 source_key text generated always as ((data->>'sale_id')||':'||((data->>'sale_line')::numeric::integer)::text) stored unique,
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.kp_production enable row level security;
revoke all on public.kp_production from public,anon,authenticated;
grant select on public.kp_production to authenticated;
grant insert(id,data) on public.kp_production to authenticated;
grant update(data) on public.kp_production to authenticated;
grant usage on sequence public.kp_production_number_seq to authenticated;
drop policy if exists kp_production_read on public.kp_production;
drop policy if exists kp_production_insert on public.kp_production;
drop policy if exists kp_production_update on public.kp_production;
create policy kp_production_read on public.kp_production for select to authenticated using ((select public.kp_is_admin()));
create policy kp_production_insert on public.kp_production for insert to authenticated with check ((select public.kp_is_admin()));
create policy kp_production_update on public.kp_production for update to authenticated using ((select public.kp_is_admin())) with check ((select public.kp_is_admin()));
create or replace function kp_private.validate_production() returns trigger language plpgsql set search_path='' as $$
declare k text; v numeric; sale jsonb; estimate numeric;
begin
 if jsonb_typeof(new.data) is distinct from 'object' then raise exception 'OT inválida';end if;
 foreach k in array array['product_name','variant','customer','file_ref','notes','state','due_date'] loop
  if jsonb_typeof(new.data->k) is distinct from 'string' then raise exception 'Texto requerido: %',k;end if;
 end loop;
 if length(btrim(new.data->>'product_name'))=0 or length(new.data->>'product_name')>200 or length(new.data->>'variant')>200 or length(new.data->>'customer')>150 or length(new.data->>'file_ref')>300 or length(new.data->>'notes')>2000 then raise exception 'Texto inválido';end if;
 if new.data->'product_id' is null or (new.data->'product_id'<>'null'::jsonb and (jsonb_typeof(new.data->'product_id') is distinct from 'string' or new.data->>'product_id' !~ '^[a-z0-9-]{1,100}$')) then raise exception 'Producto inválido';end if;
 foreach k in array array['quantity','printed','waste','passes','priority','queue_order','ml_per_print','setup_ml','ink_actual'] loop
  if k='ink_actual' and new.data->k='null'::jsonb then continue;end if;
  if jsonb_typeof(new.data->k) is distinct from 'number' then raise exception 'Número inválido: %',k;end if;
  v=(new.data->>k)::numeric;
  if v<0 or v>1000000000 then raise exception 'Importe fuera de rango';end if;
  if k=any(array['quantity','printed','waste','passes','priority','queue_order']) and mod(v,1)<>0 then raise exception 'Cantidad no entera';end if;
 end loop;
 if (new.data->>'quantity')::numeric not between 1 and 1000000 or (new.data->>'printed')::numeric>(new.data->>'quantity')::numeric or (new.data->>'waste')::numeric>1000000 or (new.data->>'passes')::numeric not between 1 and 10 or (new.data->>'priority')::numeric not between 1 and 3 or (new.data->>'queue_order')::numeric>1000000 then raise exception 'Cantidad o prioridad inválida';end if;
 if (new.data->>'ml_per_print')::numeric>100 or round((new.data->>'ml_per_print')::numeric,6)<>(new.data->>'ml_per_print')::numeric or (new.data->>'setup_ml')::numeric>1000000 or round((new.data->>'setup_ml')::numeric,3)<>(new.data->>'setup_ml')::numeric or (new.data->>'ink_actual' is not null and round((new.data->>'ink_actual')::numeric,3)<>(new.data->>'ink_actual')::numeric) then raise exception 'Ml de tinta inválidos';end if;
 if new.data->>'state' not in ('cola','preparacion','imprimiendo','terminada','cancelada') or (new.data->>'state'='terminada' and (new.data->>'printed')::numeric<>(new.data->>'quantity')::numeric) then raise exception 'Estado o unidades conformes inválidos';end if;
 if new.data->>'due_date'<>'' then
  if new.data->>'due_date' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (new.data->>'due_date')::date not between date '2000-01-01' and date '2100-12-31' then raise exception 'Fecha inválida';end if;
 end if;
 if new.data->'sale_id' is null or new.data->'sale_line' is null then raise exception 'Falta origen';end if;
 if new.data->'sale_id'='null'::jsonb then
  if new.data->'sale_line'<>'null'::jsonb then raise exception 'Origen inválido';end if;
 else
  if jsonb_typeof(new.data->'sale_id') is distinct from 'string' or new.data->>'sale_id' !~ '^sale-[a-z0-9-]{1,100}$' or jsonb_typeof(new.data->'sale_line') is distinct from 'number' then raise exception 'Origen inválido';end if;
  v=(new.data->>'sale_line')::numeric;if v not between 0 and 49 or mod(v,1)<>0 then raise exception 'Línea inválida';end if;
  new.data=jsonb_set(new.data,'{sale_line}',to_jsonb(v::integer));
 end if;
 if tg_op='UPDATE' and (new.data->'sale_id' is distinct from old.data->'sale_id' or new.data->'sale_line' is distinct from old.data->'sale_line') then raise exception 'No cambies el origen de una OT guardada';end if;
 if tg_op='INSERT' and new.data->>'sale_id' is not null then
  select data into sale from public.kp_sales where id=new.data->>'sale_id' for share;
  if sale is null or sale->>'state'='anulada' or (new.data->>'sale_line')::numeric::integer>=jsonb_array_length(sale->'lines') then raise exception 'Venta o producto de origen no disponible';end if;
  if new.data->'product_id' is distinct from sale->'lines'->((new.data->>'sale_line')::numeric::integer)->'product_id' or new.data->'product_name' is distinct from sale->'lines'->((new.data->>'sale_line')::numeric::integer)->'name' or new.data->'variant' is distinct from sale->'lines'->((new.data->>'sale_line')::numeric::integer)->'variant' then raise exception 'El producto de la venta cambió. Actualiza la venta y vuelve a crear la OT.';end if;
 end if;
 estimate=((new.data->>'quantity')::numeric+(new.data->>'waste')::numeric)*(new.data->>'passes')::numeric*(new.data->>'ml_per_print')::numeric+(new.data->>'setup_ml')::numeric;
 if round(estimate,3)>1000000000 then raise exception 'Estimación fuera de rango';end if;
 new.version=case when tg_op='UPDATE' then old.version+1 else 1 end;new.updated_at=now();return new;
end;$$;
revoke all on function kp_private.validate_production() from public,anon,authenticated;
drop trigger if exists kp_production_validation on public.kp_production;
create trigger kp_production_validation before insert or update on public.kp_production for each row execute function kp_private.validate_production();
-- Mantener la identidad posicional de las líneas que ya originaron una OT.
create or replace function kp_private.guard_sale_production() returns trigger language plpgsql set search_path='' as $$
declare item record; field text; idx integer;
begin
 if new.data->'lines' is distinct from old.data->'lines' then
  for item in select data from public.kp_production where data->>'sale_id'=old.id loop
   idx=(item.data->>'sale_line')::numeric::integer;
   foreach field in array array['product_id','name','variant'] loop
    if new.data->'lines'->idx->field is distinct from old.data->'lines'->idx->field then raise exception 'La línea % ya tiene OT: conserva su producto, variante y posición. Agrega una línea nueva para otro trabajo.',idx+1;end if;
   end loop;
  end loop;
 end if;
 return new;
end;$$;
revoke all on function kp_private.guard_sale_production() from public,anon,authenticated;
drop trigger if exists kp_sale_production_guard on public.kp_sales;
create trigger kp_sale_production_guard before update on public.kp_sales for each row execute function kp_private.guard_sale_production();
commit;
