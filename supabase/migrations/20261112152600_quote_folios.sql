begin;

-- COT-0001 ya se usó en la primera cotización preparada fuera del panel.
create sequence if not exists public.kp_quote_folios_number_seq as bigint start with 2;
create table if not exists public.kp_quote_folios (
  request_id uuid primary key,
  number bigint unique not null default
    (case when public.kp_is_admin() then nextval('public.kp_quote_folios_number_seq') end)
);

alter sequence public.kp_quote_folios_number_seq owned by public.kp_quote_folios.number;
alter table public.kp_quote_folios enable row level security;
revoke all on public.kp_quote_folios from public, anon, authenticated;
grant select on public.kp_quote_folios to authenticated;
grant insert (request_id) on public.kp_quote_folios to authenticated;
revoke all on sequence public.kp_quote_folios_number_seq from public, anon, authenticated;
grant usage on sequence public.kp_quote_folios_number_seq to authenticated;

drop policy if exists kp_quote_folios_read on public.kp_quote_folios;
drop policy if exists kp_quote_folios_insert on public.kp_quote_folios;
create policy kp_quote_folios_read on public.kp_quote_folios
  for select to authenticated using ((select public.kp_is_admin()));
create policy kp_quote_folios_insert on public.kp_quote_folios
  for insert to authenticated with check ((select public.kp_is_admin()));

commit;
