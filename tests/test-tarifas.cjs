const {PGlite}=require('@electric-sql/pglite');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
 const source=fs.readFileSync('data/productos.js','utf8');
 const products=vm.runInNewContext(source+';productsDB');
 const byId=id=>products.find(p=>p.id===id);
 assert.equal(byId('reposteria-caja-4-alfajores').priceNum,391);
 assert.equal(byId('reposteria-caja-6-alfajores').priceNum,397);
 assert.deepEqual(Array.from(byId('bolsa-papel-kraft').variants,v=>Number(/\$([0-9.]+)/.exec(v)[1].replaceAll('.',''))),[292,343,316,518,712]);
 assert.deepEqual(Array.from(byId('doypack-kraft-ventana').variants,v=>Number(/\$([0-9.]+)/.exec(v)[1].replaceAll('.',''))),[174,219,255,343,558,570]);
 assert.equal(byId('reposteria-papel-metalizado').priceNum,12300);
 assert.match(byId('reposteria-papel-metalizado').variants[2],/61\.500/);
 assert.deepEqual(Array.from(products.filter(p=>p.category==='cerveza'),p=>p.priceNum),[670,310,450,460,350,670]);
 const db=new PGlite();
 await db.exec("create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
 await db.exec(fs.readFileSync('supabase/01-esquema.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/02-productos.sql','utf8'));
 const migration=fs.readFileSync('supabase/08-precios-20261016.sql','utf8');
 const read=async()=> (await db.query('select id,data,published,version from kp_products order by id')).rows;
 const seeded=await read();
 for(const row of seeded)assert.deepEqual(row.data,JSON.parse(JSON.stringify(byId(row.id))));
 // An older catalog with a later name/visibility edit must receive only the price patch.
 await db.exec(`update kp_products set data=(data-'priceNum') || '{"price":"Cotización con logo","name":"Nombre actualizado por Jorge"}'::jsonb,published=false where id='reposteria-caja-4-alfajores'`);
 await db.exec(migration);
 const applied=await read();
 const box=applied.find(r=>r.id==='reposteria-caja-4-alfajores');
 assert.equal(box.data.priceNum,391);assert.equal(box.data.name,'Nombre actualizado por Jorge');assert.equal(box.published,false);
 for(const row of seeded.filter(r=>r.data.category==='cerveza'||r.data.category==='posavasos'))assert.deepEqual(applied.find(r=>r.id===row.id),row);
 await db.exec(migration);
 assert.deepEqual(await read(),applied);
 // Never replace a price changed since this update was prepared.
 await db.exec(`update kp_products set data=data || '{"price":"Precio posterior","priceNum":999}'::jsonb where id='reposteria-caja-4-alfajores'`);
 const beforeConflict=await read();
 await assert.rejects(db.exec(migration),/Precios no aplicados/);
 await db.exec('rollback');
 assert.deepEqual(await read(),beforeConflict);
 await db.close();
 console.log('OK tarifas: catálogo/seed coinciden, importes, variantes, cerveza/posavasos preservados, aplicación, repetición y conflicto sin sobrescritura.');
})().catch(e=>{console.error(e);process.exit(1)});
