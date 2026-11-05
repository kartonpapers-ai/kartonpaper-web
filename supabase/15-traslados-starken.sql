-- Registro privado de viajes. Requiere 01-esquema.sql. No registra gastos iniciales.
begin;
create table if not exists public.kp_dispatch_trips (
 id uuid primary key,
 trip_date date not null check (trip_date between date '2000-01-01' and date '2100-12-31'),
 cost integer not null check (cost between 0 and 1000000000),
 orders integer not null check (orders between 1 and 10000),
 reference text not null default '' check (length(reference)<=1000),
 voided boolean not null default false,
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.kp_dispatch_trips enable row level security;
revoke all on public.kp_dispatch_trips from public,anon,authenticated;
grant select on public.kp_dispatch_trips to authenticated;
grant insert(id,trip_date,cost,orders,reference,voided) on public.kp_dispatch_trips to authenticated;
grant update(trip_date,cost,orders,reference,voided) on public.kp_dispatch_trips to authenticated;
drop policy if exists kp_trips_read on public.kp_dispatch_trips;
drop policy if exists kp_trips_insert on public.kp_dispatch_trips;
drop policy if exists kp_trips_update on public.kp_dispatch_trips;
create policy kp_trips_read on public.kp_dispatch_trips for select to authenticated using ((select public.kp_is_admin()));
create policy kp_trips_insert on public.kp_dispatch_trips for insert to authenticated with check ((select public.kp_is_admin()));
create policy kp_trips_update on public.kp_dispatch_trips for update to authenticated using ((select public.kp_is_admin())) with check ((select public.kp_is_admin()));
create or replace function kp_private.version_dispatch_trip() returns trigger language plpgsql set search_path='' as $$
begin
 new.version=case when tg_op='UPDATE' then old.version+1 else 1 end;
 new.updated_at=now();return new;
end;$$;
revoke all on function kp_private.version_dispatch_trip() from public,anon,authenticated;
drop trigger if exists kp_trips_version on public.kp_dispatch_trips;
create trigger kp_trips_version before insert or update on public.kp_dispatch_trips for each row execute function kp_private.version_dispatch_trip();
commit;
