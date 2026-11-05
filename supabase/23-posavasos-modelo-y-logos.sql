-- Posavasos: personalizados 100/200/500 con archivo privado y souvenir por caja de 20.
-- No modifica precios ni añade temáticas no confirmadas.
begin;
do $$ begin
 if not exists(select 1 from public.kp_products where id='posavasos-personalizados' and data->>'type'='custom') or not exists(select 1 from public.kp_products where id='posavasos-souvenir-chile' and data->>'type'='stock') then raise exception 'Faltan fichas de posavasos'; end if;
end $$;
with approved as(select * from jsonb_to_recordset($model$[{"id":"posavasos-personalizados","patch":{"variants":["100 unidades","200 unidades","500 unidades"],"configurations":["Tu logo o gráfica"],"customQuantities":[100,200,500],"requiresArtwork":true,"specs":["Pulpa mecánica absorbente","Impresión con tu logo","100, 200 o 500 unidades"]}},{"id":"posavasos-souvenir-chile","patch":{"stockUnits":20,"specs":["20 posavasos por caja","Diámetro 90 mm","Temática a elección"]}}]$model$::jsonb) as x(id text,patch jsonb))
update public.kp_products p set data=p.data || a.patch from approved a
where p.id=a.id and p.data is distinct from (p.data || a.patch);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('kp-logos','kp-logos',false,10485760,array['application/pdf','image/png','image/jpeg','image/svg+xml','application/postscript'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists kp_customer_logo_insert on storage.objects;
create policy kp_customer_logo_insert on storage.objects for insert to anon,authenticated
with check(bucket_id='kp-logos' and name ~ '^posavasos/[a-f0-9-]{36}--[a-zA-Z0-9_-]{1,60}\.(pdf|png|jpg|jpeg|svg|ai|eps)$');
drop policy if exists kp_admin_logo_read on storage.objects;
create policy kp_admin_logo_read on storage.objects for select to authenticated
using(bucket_id='kp-logos' and (select public.kp_is_admin()));
-- Las restricciones mantienen privados estos archivos aunque haya políticas generales de otros buckets.
drop policy if exists kp_logo_anon_read_guard on storage.objects;
create policy kp_logo_anon_read_guard on storage.objects as restrictive for select to anon using(bucket_id<>'kp-logos');
drop policy if exists kp_logo_auth_read_guard on storage.objects;
create policy kp_logo_auth_read_guard on storage.objects as restrictive for select to authenticated using(bucket_id<>'kp-logos' or (select public.kp_is_admin()));
drop policy if exists kp_logo_insert_guard on storage.objects;
create policy kp_logo_insert_guard on storage.objects as restrictive for insert to anon,authenticated
with check(bucket_id<>'kp-logos' or name ~ '^posavasos/[a-f0-9-]{36}--[a-zA-Z0-9_-]{1,60}\.(pdf|png|jpg|jpeg|svg|ai|eps)$');
drop policy if exists kp_logo_update_guard on storage.objects;
create policy kp_logo_update_guard on storage.objects as restrictive for update to anon,authenticated using(bucket_id<>'kp-logos') with check(bucket_id<>'kp-logos');
drop policy if exists kp_logo_delete_guard on storage.objects;
create policy kp_logo_delete_guard on storage.objects as restrictive for delete to anon,authenticated using(bucket_id<>'kp-logos');
commit;
select id,data->'variants' as opciones from public.kp_products
where id in ('posavasos-personalizados','posavasos-souvenir-chile') order by id;
