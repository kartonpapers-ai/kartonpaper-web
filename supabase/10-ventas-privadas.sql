-- Registro interno de ventas; no cambia el catálogo, costos ni campañas.
begin;
create table if not exists public.kp_sales (
 id text primary key check(id ~ '^sale-[a-z0-9-]{1,100}$'),
 number bigint generated always as identity unique,
 data jsonb not null,
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.kp_sales enable row level security;
revoke all on public.kp_sales from public,anon,authenticated;
grant select on public.kp_sales to authenticated;
grant insert(id,data) on public.kp_sales to authenticated;
grant update(data) on public.kp_sales to authenticated;
grant usage on sequence public.kp_sales_number_seq to authenticated;
drop policy if exists kp_sales_read on public.kp_sales;
drop policy if exists kp_sales_insert on public.kp_sales;
drop policy if exists kp_sales_update on public.kp_sales;
create policy kp_sales_read on public.kp_sales for select to authenticated using ((select public.kp_is_admin()));
create policy kp_sales_insert on public.kp_sales for insert to authenticated with check ((select public.kp_is_admin()));
create policy kp_sales_update on public.kp_sales for update to authenticated using ((select public.kp_is_admin())) with check ((select public.kp_is_admin()));
create or replace function kp_private.validate_sale() returns trigger language plpgsql set search_path='' as $$
declare k text; item jsonb; value_date date; amount numeric; net numeric:=0; received numeric:=0; refunded numeric:=0; total numeric; cents numeric;
begin
 if jsonb_typeof(new.data) is distinct from 'object' then raise exception 'Venta inválida'; end if;
 foreach k in array array['customer','contact','reference','invoice','notes','date','due_date','state'] loop
  if jsonb_typeof(new.data->k) is distinct from 'string' then raise exception 'Texto requerido: %',k; end if;
 end loop;
 if length(btrim(new.data->>'customer'))=0 or length(new.data->>'customer')>150 or length(new.data->>'contact')>150 or length(new.data->>'reference')>100 or length(new.data->>'invoice')>100 or length(new.data->>'notes')>2000 then raise exception 'Texto de venta inválido'; end if;
 if new.data->>'state' not in ('pendiente','confirmada','produccion','lista','despachada','entregada','anulada') then raise exception 'Estado inválido'; end if;
 foreach k in array array['date','due_date'] loop
  if k='due_date' and new.data->>k='' then continue; end if;
  if new.data->>k !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Fecha inválida'; end if;
  value_date=(new.data->>k)::date;
  if value_date not between date '2000-01-01' and date '2100-12-31' or k='due_date' and value_date<(new.data->>'date')::date then raise exception 'Fecha fuera de rango'; end if;
 end loop;
 if jsonb_typeof(new.data->'lines') is distinct from 'array' then raise exception 'Productos requeridos'; end if;
 if jsonb_array_length(new.data->'lines') not between 1 and 50 then raise exception 'Lista de productos inválida'; end if;
 for item in select jsonb_array_elements(new.data->'lines') loop
  if jsonb_typeof(item) is distinct from 'object' then raise exception 'Producto inválido'; end if;
  if item->'product_id' is null or (item->'product_id'<>'null'::jsonb and (jsonb_typeof(item->'product_id') is distinct from 'string' or item->>'product_id' !~ '^[a-z0-9-]{1,100}$')) then raise exception 'ID de producto inválido'; end if;
  if jsonb_typeof(item->'name') is distinct from 'string' or length(btrim(item->>'name'))=0 or length(item->>'name')>200 or jsonb_typeof(item->'variant') is distinct from 'string' or length(item->>'variant')>200 then raise exception 'Descripción de producto inválida'; end if;
  if jsonb_typeof(item->'quantity') is distinct from 'number' or jsonb_typeof(item->'unit_price') is distinct from 'number' then raise exception 'Cantidad o precio inválido'; end if;
  if (item->>'quantity')::numeric not between 1 and 1000000 or mod((item->>'quantity')::numeric,1)<>0 or (item->>'unit_price')::numeric not between 0 and 1000000000 or round((item->>'unit_price')::numeric,2)<>(item->>'unit_price')::numeric then raise exception 'Cantidad o precio fuera de rango'; end if;
  cents=(item->>'quantity')::numeric*(item->>'unit_price')::numeric*100;
  if cents>900000000000000 then raise exception 'Importe de línea fuera de rango'; end if;
  net=net+round(cents/100);
 end loop;
 if jsonb_typeof(new.data->'shipping') is distinct from 'number' then raise exception 'Despacho inválido'; end if;
 amount=(new.data->>'shipping')::numeric;
 if amount not between 0 and 1000000000 or mod(amount,1)<>0 then raise exception 'Despacho fuera de rango'; end if;
 net=net+amount;if net>9000000000000 then raise exception 'Neto fuera de rango'; end if;total=net+round(net*19/100);
 if jsonb_typeof(new.data->'payments') is distinct from 'array' then raise exception 'Pagos inválidos'; end if;
 if jsonb_array_length(new.data->'payments')>100 then raise exception 'Demasiados pagos'; end if;
 for item in select jsonb_array_elements(new.data->'payments') loop
  if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'kind') is distinct from 'string' or item->>'kind' not in ('abono','devolucion') or jsonb_typeof(item->'date') is distinct from 'string' or item->>'date' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or jsonb_typeof(item->'method') is distinct from 'string' or length(btrim(item->>'method'))=0 or length(item->>'method')>100 or jsonb_typeof(item->'note') is distinct from 'string' or length(item->>'note')>300 or jsonb_typeof(item->'amount') is distinct from 'number' then raise exception 'Movimiento de pago inválido'; end if;
  value_date=(item->>'date')::date;amount=(item->>'amount')::numeric;
  if value_date<date '2000-01-01' or value_date>(now() at time zone 'America/Santiago')::date or amount not between 1 and 9000000000000 or mod(amount,1)<>0 then raise exception 'Fecha o monto de pago inválido'; end if;
  if item->>'kind'='abono' then received=received+amount;else refunded=refunded+amount;end if;
 end loop;
 if received>9000000000000 or refunded>9000000000000 or received-refunded<0 or received-refunded>total then raise exception 'Abonos y devoluciones no coinciden con el total'; end if;
 if new.data->>'state'='anulada' and received<>refunded then raise exception 'Devuelve los abonos antes de anular'; end if;
 new.version=case when tg_op='UPDATE' then old.version+1 else 1 end;new.updated_at=now();return new;
end;$$;
revoke all on function kp_private.validate_sale() from public,anon,authenticated;
drop trigger if exists kp_sales_validation on public.kp_sales;
create trigger kp_sales_validation before insert or update on public.kp_sales for each row execute function kp_private.validate_sale();
commit;
