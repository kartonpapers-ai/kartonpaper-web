-- Ejecutar UNA VEZ después de 01-esquema.sql en el proyecto de desarrollo.
-- Las fotos de producto son públicas; solo el administrador puede subirlas.
begin;
grant insert (id,data,published,sort_order) on public.kp_products to authenticated;
create policy kp_admin_insert on public.kp_products for insert to authenticated
with check ((select public.kp_is_admin()));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('kp-productos','kp-productos',true,1048576,array['image/webp'])
on conflict(id) do nothing;
create policy kp_admin_image_insert on storage.objects for insert to authenticated
with check (bucket_id='kp-productos' and (select public.kp_is_admin()) and name ~ '^[a-z0-9-]+\.webp$');
create or replace function kp_private.validate_product() returns trigger
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
    or (new.data->>'image' !~ '^images/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$' and new.data->>'image' !~ '^https://qdclylextthpzxtijvpx\.supabase\.co/storage/v1/object/public/kp-productos/[a-z0-9-]+\.webp$') then
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
commit;
