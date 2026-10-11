-- Ejecutar SOLO en SQL Editor. No es una contraseña ni una clave API.
-- Reemplazar el marcador por el UUID del usuario creado en Authentication > Users.
insert into kp_private.admin_user (slot,user_id)
values (1,'REEMPLAZAR_POR_UUID_DEL_USUARIO'::uuid);
