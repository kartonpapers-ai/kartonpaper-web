-- Ejecutar en SQL Editor de un proyecto nuevo de Supabase.
begin;
create schema if not exists kp_private;
revoke all on schema kp_private from public, anon, authenticated;
create table kp_private.admin_user (
  slot integer primary key check (slot = 1),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
revoke all on kp_private.admin_user from public, anon, authenticated;

create function public.kp_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from kp_private.admin_user where user_id = (select auth.uid()));
$$;
revoke all on function public.kp_is_admin() from public;
grant execute on function public.kp_is_admin() to anon, authenticated;

create table public.kp_products (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  data jsonb not null,
  published boolean not null default true,
  sort_order integer not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  check (data->>'id' = id)
);
alter table public.kp_products enable row level security;
revoke all on public.kp_products from public, anon, authenticated;
grant select on public.kp_products to anon, authenticated;
grant update (data,published) on public.kp_products to authenticated;
create policy kp_public_read on public.kp_products for select to anon,authenticated using (published);
create policy kp_admin_read on public.kp_products for select to authenticated using ((select public.kp_is_admin()));
create policy kp_admin_update on public.kp_products for update to authenticated
  using ((select public.kp_is_admin())) with check ((select public.kp_is_admin()));

create function kp_private.validate_product() returns trigger
language plpgsql set search_path = '' as $$
declare field text; value jsonb;
begin
  foreach field in array array['id','category','name','subtitle','type','image','price'] loop
    if jsonb_typeof(new.data->field) is distinct from 'string'
      or length(btrim(new.data->>field)) = 0 or length(new.data->>field) > 500 then
      raise exception 'Campo de producto inválido: %', field;
    end if;
  end loop;
  if new.data->>'id' <> new.id or new.data->>'category' not in ('cerveza','reposteria','gastronomia','bolsas','doypack','posavasos')
    or new.data->>'type' not in ('dual','custom','stock')
    or new.data->>'image' !~ '^images/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$' then
    raise exception 'Configuración de producto inválida';
  end if;
  foreach field in array array['specs','variants'] loop
    if jsonb_typeof(new.data->field) is distinct from 'array' then raise exception 'Lista inválida'; end if;
    if jsonb_array_length(new.data->field) not between 1 and 30 then raise exception 'Lista vacía o demasiado extensa'; end if;
    for value in select jsonb_array_elements(new.data->field) loop
      if jsonb_typeof(value) <> 'string' or length(btrim(value #>> '{}')) = 0 or length(value #>> '{}') > 500 then
        raise exception 'Opción inválida';
      end if;
    end loop;
  end loop;
  if new.data ? 'priceNum' then
    if jsonb_typeof(new.data->'priceNum') <> 'number' then raise exception 'Precio inválido'; end if;
    if (new.data->>'priceNum')::numeric < 0 then raise exception 'Precio negativo'; end if;
  end if;
  if tg_op = 'UPDATE' then new.version = old.version + 1; end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function kp_private.validate_product() from public,anon,authenticated;
create trigger kp_product_validation before insert or update on public.kp_products
for each row execute function kp_private.validate_product();
commit;
