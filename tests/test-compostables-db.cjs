const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const scope={window:{}};vm.createContext(scope);for(const file of ['data/productos.js','js/catalogo-remoto.js','admin/precios.js'])vm.runInContext(fs.readFileSync(file,'utf8'),scope);vm.runInContext('globalThis.product=productsDB.find(p=>p.id==="bagasse-pollo-1")',scope);
(async()=>{
 const db=new PGlite();await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");await db.exec(fs.readFileSync('supabase/01-esquema.sql','utf8'));
 const p=JSON.parse(JSON.stringify(scope.product)),entries=scope.window.KP_CATALOG.embalajeOptions(p),patch=JSON.parse(JSON.stringify(scope.window.KP_PRICES.embalajes(p,entries,0))),saved={...p,...patch};
 await db.query('insert into kp_products(id,data,sort_order) values($1,$2,0)',[p.id,p]);const sql=fs.readFileSync('supabase/26-precios-compostables-embalajes.sql','utf8');await db.exec(sql);await db.exec(sql);assert.equal((await db.query('select version from kp_products')).rows[0].version,1);
 await db.query('update kp_products set data=$1 where id=$2',[saved,p.id]);const version=(await db.query('select version from kp_products')).rows[0].version;
 for(const change of [
  {quantityPrices:[{...saved.quantityPrices[0],quantity:201}]},
  {quantityPrices:[{...saved.quantityPrices[0],totalNet:1}]},
  {quantityPrices:[{...saved.quantityPrices[0],unitPrice:-1}]},
  {quantityPrices:[saved.quantityPrices[0],saved.quantityPrices[0]]},
  {quantityPrices:[{...saved.quantityPrices[0],unitPrice:null}]},
  {priceNum:1}, {initialPriceQuantity:1}, {category:'bolsas'},
  {quantityPrices:[{...saved.quantityPrices[0],sku:'lowercase'}]}
 ])await assert.rejects(db.query('update kp_products set data=$1 where id=$2',[{...saved,...change},p.id]));
 assert.equal((await db.query('select version from kp_products')).rows[0].version,version);
 const quoted={...saved,quantityPrices:saved.quantityPrices.map(row=>({...row,unitPrice:null,totalNet:null})),price:'Cotización con logo'};delete quoted.priceNum;await db.query('update kp_products set data=$1 where id=$2',[quoted,p.id]);
 // An old product without this schema remains compatible.
 await db.query('update kp_products set data=$1 where id=$2',[p,p.id]);await db.close();console.log('OK SQL embalajes: migración repetible sin alterar precios, tramos válidos/cotización, totales/SKU/selección protegidos y catálogo anterior compatible.');
})().catch(error=>{console.error(error);process.exit(1);});
