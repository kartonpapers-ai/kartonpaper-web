const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),{PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),scope={window:{}};vm.createContext(scope);vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);vm.runInContext(read('js/catalogo-remoto.js'),scope);
const products=JSON.parse(JSON.stringify(scope.products)),ids=['bolsa-papel-kraft','bolsa-papel-blanca'],C=scope.window.KP_CATALOG;
class Loader extends ResourceLoader{constructor(remote){super();this.remote=remote;}fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from(`window.KP_CONFIG={enabled:${this.remote},supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'}`));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
(async()=>{
 const db=new PGlite();await db.exec('create table kp_products(id text primary key,data jsonb,sort_order integer,published boolean);');
 for(const p of products){const data={...p};delete data.quantityRules;await db.query('insert into kp_products values($1,$2,5,false)',[p.id,data]);}
 const before=(await db.query('select * from kp_products order by id')).rows;const sql=read('supabase/21-bolsas-cantidades-por-medida.sql');await db.exec(sql);await db.exec(sql);
 for(const id of ids){const p=products.find(p=>p.id===id);C.validate(p);assert.deepEqual(p.quantityRules.map(r=>r.quantities||r.step),[[100,200,500],400,400,200,150]);
  const row=(await db.query('select * from kp_products where id=$1',[id])).rows[0];assert.deepEqual(row.data.quantityRules,p.quantityRules);const stripped={...row.data};delete stripped.quantityRules;assert.deepEqual(stripped,before.find(r=>r.id===id).data);assert.equal(row.published,false);assert.equal(row.sort_order,5);
  assert(C.validQuantity(p,p.variants[0],100));assert(C.validQuantity(p,p.variants[0],200));assert(C.validQuantity(p,p.variants[0],500));assert(!C.validQuantity(p,p.variants[0],300));assert(!C.validQuantity(p,p.variants[1],100));assert(C.validQuantity(p,p.variants[1],800));
  const invalid=structuredClone(p);invalid.quantityRules[0].quantities=[100,100];assert.throws(()=>C.validate(invalid));
 }
 await db.close();
 for(const remote of [false,true]){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(remote),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=async url=>({ok:true,json:async()=>url.includes('kp_products')?products.map(data=>({id:data.id,data})):[]});}});
  const w=dom.window,d=w.document;await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await new Promise(resolve=>setTimeout(resolve,30));
  for(const id of ids){const p=products.find(p=>p.id===id),card=d.querySelector(`[data-action='customize'][data-id='${id}']`).closest('.product-card');
   for(let i=0;i<5;i++){
    card.querySelectorAll('.variant-btn')[i].click();card.querySelector('[data-action="customize"]').click();const select=d.getElementById('modal-variant-select'),qty=d.getElementById('modal-quantity-input'),bulk=d.getElementById('modal-bulk-quantity');assert.equal(select.value,p.variants[i]);
    const step=p.quantityRules[i].step;let expected;
    if(step){assert.equal(bulk.hidden,false);assert.equal(bulk.value,String(step));assert.equal(bulk.step,String(step));expected=step;}else{assert.equal(qty.hidden,false);assert.deepEqual(Array.from(qty.options,o=>Number(o.value)),[100,200,500]);expected=100;}
    const submit=()=>d.getElementById('custom-product-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
    if(step){bulk.value=String(step+1);const count=JSON.parse(w.localStorage.getItem('kp_cart')||'[]').length;submit();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')||'[]').length,count);bulk.value=String(step);bulk.dispatchEvent(new w.Event('input'));}
    submit();let item=JSON.parse(w.localStorage.getItem('kp_cart')).at(-1);assert.equal(item.qty,expected);assert.equal(item.variant,p.variants[i]);assert.equal(item.isCustom,true);
    d.querySelector('.cart-item:last-child [data-action="plus"]').click();item=JSON.parse(w.localStorage.getItem('kp_cart')).at(-1);assert.equal(item.qty,step?step*2:200);
    if(!step){d.querySelector('.cart-item:last-child [data-action="plus"]').click();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).at(-1).qty,500);assert.equal(d.querySelector('.cart-item:last-child [data-action="plus"]').disabled,true);d.querySelector('.cart-item:last-child [data-action="minus"]').click();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).at(-1).qty,200);}
    assert(!w.buildOrderMessage().includes('solo en la tapa'));d.getElementById('close-cart-btn').click();
   }
   card.querySelector('[data-action="customize"]').click();const select=d.getElementById('modal-variant-select');select.value=p.variants[0];select.dispatchEvent(new w.Event('change'));assert.deepEqual(Array.from(d.getElementById('modal-quantity-input').options,o=>Number(o.value)),[100,200,500]);select.value=p.variants[4];select.dispatchEvent(new w.Event('change'));assert.equal(d.getElementById('modal-bulk-quantity').value,'150');d.getElementById('close-modal-btn').click();
  }
  assert.deepEqual(errors,[]);w.close();
 }
 console.log('OK bolsas: kraft/blancas, cinco medidas, 100/200/500 pequeña, múltiplos de 400/400/200/150, cambio de medida, carrito y precios preservados.');
})().catch(error=>{console.error(error);process.exit(1);});
