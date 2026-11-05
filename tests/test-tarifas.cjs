const {PGlite}=require('@electric-sql/pglite');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
 const source=fs.readFileSync('data/productos.js','utf8');
 const products=vm.runInNewContext(source+';productsDB');
 const byId=id=>products.find(p=>p.id===id);
 // Current starting prices refer to white packs; logo prices belong to their packs.
 for(const [size,logo] of [[3,391],[4,391],[6,397]]){
  const box=byId(`reposteria-caja-${size}-alfajores`);assert.equal(box.priceNum,400);
  assert.deepEqual(Array.from(box.packs,pack=>[pack.quantity,pack.unitPrice,pack.totalNet]),[[25,400,10000],[50,350,17500],[100,logo,logo*100]]);
  assert.equal(box.packs[2].requiresLogo,true);
 }
 assert.deepEqual(Array.from(byId('bolsa-papel-kraft').variants,v=>Number(/\$([0-9.]+)/.exec(v)[1].replaceAll('.',''))),[292,343,316,518,712]);
 assert.deepEqual(Array.from(byId('doypack-kraft-ventana').variants,v=>Number(/\$([0-9.]+)/.exec(v)[1].replaceAll('.',''))),[174,219,255,343,558,570]);
 assert.equal(byId('reposteria-papel-metalizado').priceNum,12300);
 assert.match(byId('reposteria-papel-metalizado').variants[2],/61\.500/);
 assert.deepEqual(Array.from(products.filter(p=>p.category==='cerveza'),p=>p.priceNum),[700,310,450,460,350,700]);
 const db=new PGlite();
 await db.exec("create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
 await db.exec(fs.readFileSync('supabase/01-esquema.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/02-productos.sql','utf8'));
 const migration=fs.readFileSync('supabase/08-precios-20261016.sql','utf8');
 const read=async()=> (await db.query('select id,data,published,version from kp_products order by id')).rows;
 const seeded=await read();
 assert.equal(seeded.find(row=>row.id==='reposteria-caja-4-alfajores').data.priceNum,391);
 // Exercise the 16 October migration against its historical logo-only format.
 // Later pack migrations are covered separately; do not downgrade today's catalog.
 const historical=await read();
 // An older catalog with a later name/visibility edit must receive only the price patch.
 await db.exec(`update kp_products set data=(data-'priceNum') || '{"price":"Cotización con logo","name":"Nombre actualizado por Jorge"}'::jsonb,published=false where id='reposteria-caja-4-alfajores'`);
 await db.exec(migration);
 const applied=await read();
 const box=applied.find(r=>r.id==='reposteria-caja-4-alfajores');
 assert.equal(box.data.priceNum,391);assert.equal(box.data.name,'Nombre actualizado por Jorge');assert.equal(box.published,false);
 for(const row of historical.filter(r=>r.data.category==='cerveza'||r.data.category==='posavasos'))assert.deepEqual(applied.find(r=>r.id===row.id),row);
 for(const [size,unit] of [[3,391],[4,391],[6,397]]){
  const row=applied.find(r=>r.id===`reposteria-caja-${size}-alfajores`);assert.equal(row.data.priceNum,unit);assert.deepEqual(row.data.variants,['100 unidades','250 unidades','500 unidades']);
 }
 await db.exec(migration);
 assert.deepEqual(await read(),applied);
 // Never replace a price changed since this update was prepared.
 await db.exec(`update kp_products set data=data || '{"price":"Precio posterior","priceNum":999}'::jsonb where id='reposteria-caja-4-alfajores'`);
 const beforeConflict=await read();
 await assert.rejects(db.exec(migration),/Precios no aplicados/);
 await db.exec('rollback');
 assert.deepEqual(await read(),beforeConflict);
 await db.close();
 console.log('OK tarifas: tarifas vigentes por modalidad, migración histórica, importes, variantes, cerveza/posavasos preservados, aplicación, repetición y conflicto sin sobrescritura.');
})().catch(e=>{console.error(e);process.exit(1)});
