-- Para proyectos donde ya se ejecutó la versión inicial de 05-heroes.sql.
-- Solo añade validación de capas; no cambia campañas ni productos existentes.
begin;
create or replace function kp_private.validate_campaign_layers() returns trigger
language plpgsql set search_path='' as $$
declare field text; n numeric; lo numeric; hi numeric;
begin
 if not (new.data ? 'layout') then return new; end if;
 if jsonb_typeof(new.data->'layout') is distinct from 'string' or new.data->>'layout' not in ('scene','layered') then raise exception 'Composición inválida'; end if;
 if new.data->>'layout'='scene' then return new; end if;
 if jsonb_typeof(new.data->'background') is distinct from 'object' or jsonb_typeof(new.data->'product') is distinct from 'object' then raise exception 'Configuración de capas inválida'; end if;
 if jsonb_typeof(new.data->'background'->'kind') is distinct from 'string' or new.data->'background'->>'kind' not in ('solid','gradient') then raise exception 'Fondo inválido'; end if;
 foreach field in array array['color','color2'] loop
  if jsonb_typeof(new.data->'background'->field) is distinct from 'string' or new.data->'background'->>field !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Color inválido'; end if;
 end loop;
 foreach field in array array['size','x','mobileSize','mobileX'] loop
  if jsonb_typeof(new.data->'product'->field) is distinct from 'number' then raise exception 'Posición inválida'; end if;
  n=(new.data->'product'->>field)::numeric;
  if field='size' then lo=25;hi=80;
  elsif field='x' then lo=55;hi=85;
  elsif field='mobileSize' then lo=50;hi=100;
  else lo=35;hi=65;end if;
  if n<>floor(n) or n<lo or n>hi then raise exception 'Tamaño o posición fuera de rango'; end if;
 end loop;
 return new;
end;
$$;
revoke all on function kp_private.validate_campaign_layers() from public,anon,authenticated;
drop trigger if exists kp_campaign_layer_validation on public.kp_campaigns;
create trigger kp_campaign_layer_validation before insert or update on public.kp_campaigns
for each row execute function kp_private.validate_campaign_layers();
commit;
