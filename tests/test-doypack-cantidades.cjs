const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),{PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),scope={window:{}};vm.createContext(scope);vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);vm.runInContext(read('js/catalogo-remoto.js'),scope);
const products=JSON.parse(JSON.stringify(scope.products)),p=products.find(p=>p.id==='doypack-kraft-ventana'),C=scope.window.KP_CATALOG;
class Loader extends ResourceLoader{constructor(remote){super();this.remote=remote;}fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from(`window.KP_CONFIG={enabled:${this.remote},supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'}`));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
(async()=>{
 C.validate(p);assert.equal(p.quantityRules.length,6);for(const variant of p.variants){for(const q of [100,200,500])assert(C.validQuantity(p,variant,q));for(const q of [1,50,250,300,1000])assert(!C.validQuantity(p,variant,q));}
 const db=new PGlite();await db.exec('create table kp_products(id text primary key,data jsonb,sort_order integer,published boolean);');
 for(const product of products){const data={...product};if(product.id===p.id)delete data.quantityRules;await db.query('insert into kp_products values($1,$2,8,false)',[product.id,data]);}
 const before=(await db.query('select * from kp_products order by id')).rows;const sql=read('supabase/22-doypack-cantidades.sql');await db.exec(sql);await db.exec(sql);
 const row=(await db.query('select * from kp_products where id=$1',[p.id])).rows[0];assert.deepEqual(row.data.quantityRules,p.quantityRules);const stripped={...row.data};delete stripped.quantityRules;assert.deepEqual(stripped,before.find(r=>r.id===p.id).data);assert.equal(row.sort_order,8);assert.equal(row.published,false);
 for(const original of before.filter(r=>r.id!==p.id))assert.deepEqual((await db.query('select * from kp_products where id=$1',[original.id])).rows[0],original);
 await db.query('delete from kp_products where id=$1',[p.id]);await assert.rejects(db.exec(sql),/Falta la ficha/);await db.close();
 for(const remote of [false,true]){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(remote),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=async url=>({ok:true,json:async()=>url.includes('kp_products')?products.map(data=>({id:data.id,data})):[]});}});
  const w=dom.window,d=w.document;await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await new Promise(resolve=>setTimeout(resolve,30));
  const card=d.querySelector(`[data-action='customize'][data-id='${p.id}']`).closest('.product-card');
  for(let i=0;i<6;i++){
   card.querySelectorAll('.variant-btn')[i].click();card.querySelector('[data-action="customize"]').click();const variant=d.getElementById('modal-variant-select'),qty=d.getElementById('modal-quantity-input');assert.equal(variant.value,p.variants[i]);assert.deepEqual(Array.from(qty.options,o=>Number(o.value)),[100,200,500]);assert.equal(d.getElementById('modal-bulk-quantity').disabled,true);
   const count=JSON.parse(w.localStorage.getItem('kp_cart')||'[]').length;qty.append(new w.Option('300 inválidas','300'));qty.value='300';const submit=()=>d.getElementById('custom-product-form').dispatchEvent(new w.Event('submit',{cancelable:true}));submit();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')||'[]').length,count);qty.value='100';qty.dispatchEvent(new w.Event('change'));submit();let item=JSON.parse(w.localStorage.getItem('kp_cart')).at(-1);assert.equal(item.qty,100);assert.equal(item.variant,p.variants[i]);assert.equal(item.isCustom,true);assert.equal(item.price,'Cotización con logo');
   const plus=()=>d.querySelector('.cart-item:last-child [data-action="plus"]').click();plus();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).at(-1).qty,200);plus();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).at(-1).qty,500);assert.equal(d.querySelector('.cart-item:last-child [data-action="plus"]').disabled,true);d.querySelector('.cart-item:last-child [data-action="minus"]').click();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).at(-1).qty,200);d.getElementById('close-cart-btn').click();
   card.querySelector('[data-action="customize"]').click();submit();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).at(-1).qty,200);assert.match(d.getElementById('modal-bulk-help').textContent,/Ya hay un pedido/);d.getElementById('close-modal-btn').click();
  }
  assert(!w.buildOrderMessage().includes('solo en la tapa'));assert.deepEqual(errors,[]);w.close();
 }
 console.log('OK doypack: seis medidas, 100/200/500 personalizados, carrito sin cantidades intermedias, duplicados controlados, precios y otros productos preservados.');
})().catch(error=>{console.error(error);process.exit(1);});
