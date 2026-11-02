-- Category gates are independent of each product's published flag.
-- Applying this migration preserves the current storefront and all product data.
begin;
create table public.kp_catalog_categories (
  id text primary key check (id in ('cerveza','reposteria','gastronomia','bolsas','doypack','posavasos')),
  visible boolean not null default true,
  version integer not null default 1 check (version > 0)
);
insert into public.kp_catalog_categories(id) values
 ('cerveza'),('reposteria'),('gastronomia'),('bolsas'),('doypack'),('posavasos');
alter table public.kp_catalog_categories enable row level security;
revoke all on public.kp_catalog_categories from public, anon, authenticated;
grant select on public.kp_catalog_categories to anon, authenticated;
grant update(visible,version) on public.kp_catalog_categories to authenticated;
create policy kp_category_read on public.kp_catalog_categories for select to anon, authenticated using (true);
create policy kp_category_admin_update on public.kp_catalog_categories for update to authenticated
 using ((select public.kp_is_admin())) with check ((select public.kp_is_admin()));

alter policy kp_public_read on public.kp_products using (
 published and not exists (
  select 1 from public.kp_catalog_categories c where c.id = kp_products.data->>'category' and not c.visible
 )
);
-- No promotion may lead to an unavailable category or product.
alter policy kp_campaign_public on public.kp_campaigns using (
 published and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
 and not exists (
  select 1 from (values (kp_campaigns.data->'primary'),(kp_campaigns.data->'secondary')) as actions(action)
  where (action->>'kind' = 'categoria' and exists (
   select 1 from public.kp_catalog_categories c where c.id = action->>'target' and not c.visible
  )) or (action->>'kind' in ('producto','personalizar') and not exists (
   select 1 from public.kp_products p where p.id = action->>'target' and p.published
    and not exists (select 1 from public.kp_catalog_categories c where c.id = p.data->>'category' and not c.visible)
  ))
 )
);
commit;
