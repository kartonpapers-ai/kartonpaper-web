const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),{PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),scope={window:{}};vm.createContext(scope);
vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);vm.runInContext(read('js/catalogo-remoto.js'),scope);vm.runInContext(read('admin/finanzas-calculo.js'),scope);
const products=JSON.parse(JSON.stringify(scope.products)),steps={'bagasse-pollo-1':200,'bagasse-sandwich-6x6':500,'bagasse-bowl-850':300,'bagasse-colacion-c205':250};
class Loader extends ResourceLoader{constructor(remote){super();this.remote=remote;}fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from(`window.KP_CONFIG={enabled:${this.remote},supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'}`));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
(async()=>{
 const db=new PGlite();await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
 for(const file of ['01-esquema.sql','02-productos.sql','09-finanzas-privadas.sql'])await db.exec(read('supabase/'+file));
 const before=(await db.query('select * from kp_products order by id')).rows;const sql=read('supabase/20-gastronomia-embalajes-margen.sql');await db.exec(sql);await db.exec(sql);
 for(const [id,step]of Object.entries(steps)){
  const p=products.find(p=>p.id===id);scope.window.KP_CATALOG.validate(p);assert.equal(p.orderStep,step);assert.equal(p.minimumMargin,45);assert.equal(p.type,'custom');assert.equal(p.printingArea,'tapa');assert.deepEqual(p.variants.map(v=>parseInt(v)),[step,step*2,step*3,step*4,step*5]);
  const row=(await db.query('select * from kp_products where id=$1',[id])).rows[0],old=before.find(p=>p.id===id);for(const key of ['price','priceNum','name','image'])assert.equal(row.data[key],old.data[key]);assert.equal(row.published,old.published);assert.equal(row.sort_order,old.sort_order);
  const f={...scope.window.KP_FINANCE_CALC.blank(p),base:100,labor:0,extras:0,waste:0,fee:0,fixed:0,preparation:0,packaging:0,sale:250,reviewed:true};assert.equal(f.floor,45);assert.equal(f.quantity,step);assert.equal(scope.window.KP_FINANCE_CALC.calculate({...f,quantity:step+1},p).complete,false);
  await db.query('insert into kp_finance(id,data) values($1,$2)',['cost-'+id,f]);
  await assert.rejects(db.query('insert into kp_finance(id,data) values($1,$2)',['bad-floor-'+id,{...f,floor:40}]),/45/);
  await assert.rejects(db.query('insert into kp_finance(id,data) values($1,$2)',['bad-quantity-'+id,{...f,quantity:step+1}]),/embalaje/);
  assert.equal(scope.window.KP_FINANCE_CALC.calculate({...f,floor:40,target:40},p).status,'Bajo mínimo');
 }
 assert.equal((await db.query("select count(*) n from kp_products where id='bagasse-colacion-c205-2'")).rows[0].n,0);await db.close();
 for(const remote of [false,true]){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(remote),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=async url=>({ok:true,json:async()=>url.includes('kp_products')?products.map(data=>({id:data.id,data})):[]});}});
  const w=dom.window,d=w.document;await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await new Promise(resolve=>setTimeout(resolve,30));
  for(const [id,step]of Object.entries(steps)){
   const card=d.querySelector(`[data-action='customize'][data-id='${id}']`).closest('.product-card');card.querySelectorAll('.variant-btn')[1].click();card.querySelector('[data-action="customize"]').click();
   const bulk=d.getElementById('modal-bulk-quantity');assert.equal(bulk.hidden,false);assert.equal(bulk.value,String(step*2));assert.equal(bulk.step,String(step));assert.equal(d.getElementById('modal-quantity-input').hidden,true);
   const submit=()=>d.getElementById('custom-product-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
   const count=JSON.parse(w.localStorage.getItem('kp_cart')||'[]').length;bulk.value=String(step+1);submit();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')||'[]').length,count);assert(bulk.validationMessage.includes(String(step)));
   bulk.value=String(step*6);bulk.dispatchEvent(new w.Event('input'));submit();let cart=JSON.parse(w.localStorage.getItem('kp_cart'));assert.equal(cart.at(-1).qty,step*6);assert.equal(cart.at(-1).unitsPerBox,step);assert.match(w.buildOrderMessage(),/Embalajes completos: 6/);
   d.querySelector('.cart-item:last-child [data-action="plus"]').click();cart=JSON.parse(w.localStorage.getItem('kp_cart'));assert.equal(cart.at(-1).qty,step*7);d.querySelector('.cart-item:last-child [data-action="minus"]').click();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).at(-1).qty,step*6);d.getElementById('close-cart-btn').click();
  }
  d.querySelector('[data-action="customize"][data-id="reposteria-caja-3-alfajores"]').click();assert.equal(d.getElementById('modal-bulk-quantity').disabled,true);assert.equal(d.getElementById('modal-quantity-input').hidden,false);assert.deepEqual(errors,[]);w.close();
 }
 console.log('OK Gastronomía: múltiplos por embalaje, selección y cantidad libre válida, carrito, impresión en tapa, mínimo 45% en cálculo y base de datos, precios conservados y C205/2 pendiente de alta.');
})().catch(error=>{console.error(error);process.exit(1);});
