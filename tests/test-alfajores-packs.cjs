const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),{PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scope={window:{}};vm.createContext(scope);vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);vm.runInContext(read('js/catalogo-remoto.js'),scope);
const products=JSON.parse(JSON.stringify(scope.products)),box=products.find(p=>p.id==='reposteria-caja-3-alfajores');
class Loader extends ResourceLoader{constructor(remote){super();this.remote=remote;}fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from(`window.KP_CONFIG={enabled:${this.remote},supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'}`));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
(async()=>{
 scope.window.KP_CATALOG.validate(box);assert.equal(box.type,'dual');assert.deepEqual(box.configurations,['100 unidades','250 unidades','500 unidades']);
 assert.deepEqual(box.packs.map(p=>[p.quantity,p.unitPrice,p.totalNet,p.withoutPrint]),[[25,400,10000,true],[50,350,17500,true],[100,391,39100,false]]);
 const db=new PGlite();await db.exec('create table kp_products(id text primary key,data jsonb,sort_order integer);');
 await db.query('insert into kp_products values($1,$2,7)',[box.id,{name:'Nombre conservado',image:'foto-conservada.webp',price:'Anterior'}]);
 const migration=read('supabase/16-caja-3-alfajores-packs.sql');await db.exec(migration);await db.exec(migration);const logoMigration=read('supabase/17-caja-3-alfajores-logo.sql');await db.exec(logoMigration);await db.exec(logoMigration);
 const row=(await db.query('select * from kp_products')).rows[0];assert.equal(row.sort_order,7);assert.equal(row.data.name,'Nombre conservado');assert.equal(row.data.image,'foto-conservada.webp');assert.deepEqual(row.data.packs,box.packs);assert.deepEqual(row.data.configurations,box.configurations);
 await db.exec('delete from kp_products');await assert.rejects(db.exec(migration),/Falta la caja/);await db.close();
 for(const remote of [false,true]){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(remote),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=async url=>({ok:true,json:async()=>url.includes('kp_products')?products.map(data=>({id:data.id,data})):[]});}});
  const w=dom.window,d=w.document;await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await new Promise(resolve=>setTimeout(resolve,30));
  const card=d.querySelector(`[data-action='add-stock'][data-id='${box.id}']`).closest('.product-card');
  const variants=card.querySelectorAll('.variant-btn');assert.equal(variants.length,3);
  for(const [i,total] of [10000,17500].entries()){
   variants[i].click();assert.match(card.querySelector('.product-price-value').textContent,i===0?/400/:/350/);
   card.querySelector('[data-action="add-stock"]').click();const item=JSON.parse(w.localStorage.getItem('kp_cart')).at(-1);
   assert.equal(item.totalNet,total);assert.equal(item.unitsPerPack,i===0?25:50);assert.equal(item.withoutPrint,true);
   assert(w.buildOrderMessage().includes(i===0?'11.900':'32.725'));assert.match(w.buildOrderMessage(),i===0?/Subtotal neto: \$10\.000/:/Subtotal neto: \$27\.500/);d.getElementById('close-cart-btn').click();
  }
  variants[2].click();assert.equal(card.querySelector('[data-action="add-stock"]').hidden,true);
  assert.match(card.querySelector('.product-price-value').textContent,/391/);assert.match(card.querySelector('.product-price-note').textContent,/39.100/);
  const count=JSON.parse(w.localStorage.getItem('kp_cart')).length;
  card.querySelector('[data-action="add-stock"]').click();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).length,count);
  assert.equal(d.getElementById('modal-quantity-input').value,'100');assert.equal(d.getElementById('modal-variant-select').value,'100 unidades');
  d.getElementById('close-modal-btn').click();
  card.querySelector('[data-action="customize"]').click();const options=Array.from(d.getElementById('modal-variant-select').options,o=>o.value);
  assert.deepEqual(options,box.configurations);assert(Array.from(d.getElementById('modal-quantity-input').options,o=>Number(o.value)).every(n=>n>=100));
  assert.match(d.getElementById('modal-product-note').textContent,/391/);
  d.getElementById('custom-product-form').dispatchEvent(new w.Event('submit',{cancelable:true}));const custom=JSON.parse(w.localStorage.getItem('kp_cart')).at(-1);assert.equal(custom.isCustom,true);assert.equal(custom.price,'Cotización con logo');assert.equal(custom.variant,'100 unidades');d.getElementById('close-cart-btn').click();variants[0].click();assert.equal(card.querySelector('[data-action="add-stock"]').hidden,false);
  assert.deepEqual(errors,[]);w.close();
 }
 console.log('OK caja 3: packs blancos 25/50 y opción visible de 100 con logo, precio/IVA/carrito, carga de archivo y SQL repetible sin sobrescribir nombre o imagen.');
})().catch(error=>{console.error(error);process.exit(1);});
