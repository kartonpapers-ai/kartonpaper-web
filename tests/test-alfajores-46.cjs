const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),{PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),scope={window:{}};
vm.createContext(scope);vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);vm.runInContext(read('js/catalogo-remoto.js'),scope);
const products=JSON.parse(JSON.stringify(scope.products));
class Loader extends ResourceLoader{constructor(remote){super();this.remote=remote;}fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from(`window.KP_CONFIG={enabled:${this.remote},supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'}`));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
(async()=>{
 const db=new PGlite();await db.exec('create table kp_products(id text primary key,data jsonb,sort_order integer,published boolean default false);');
 for(const p of products)await db.query('insert into kp_products(id,data,sort_order) values($1,$2,9)',[p.id,{...p,name:'Nombre privado '+p.id,image:'foto-conservada.webp'}]);
 const before=(await db.query('select * from kp_products order by id')).rows;
 const migration=read('supabase/18-cajas-4-6-alfajores-packs.sql');await db.exec(migration);await db.exec(migration);
 for(const [size,logo,withIVA] of [[4,391,46529],[6,397,47243]]){
  const id=`reposteria-caja-${size}-alfajores`,p=products.find(p=>p.id===id);scope.window.KP_CATALOG.validate(p);
  assert.equal(p.type,'dual');assert.deepEqual(p.packs.map(p=>[p.quantity,p.unitPrice,p.totalNet]),[[25,400,10000],[50,350,17500],[100,logo,logo*100]]);
  assert.equal(Math.round(p.packs[2].totalNet*1.19),withIVA);assert.equal(p.packs[2].requiresLogo,true);assert.equal(p.packs[2].configuration,'100 unidades');assert(p.packs.slice(0,2).every(p=>p.withoutPrint));
  const row=(await db.query('select * from kp_products where id=$1',[id])).rows[0];assert.deepEqual(row.data.packs,p.packs);assert.equal(row.data.name,'Nombre privado '+id);assert.equal(row.data.image,'foto-conservada.webp');assert.equal(row.sort_order,9);assert.equal(row.published,false);
 }
 for(const row of before.filter(r=>!['reposteria-caja-4-alfajores','reposteria-caja-6-alfajores'].includes(r.id)))assert.deepEqual((await db.query('select * from kp_products where id=$1',[row.id])).rows[0],row);
 await db.exec("delete from kp_products where id='reposteria-caja-6-alfajores'");await assert.rejects(db.exec(migration),/Faltan cajas/);await db.close();
 for(const remote of [false,true]){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(remote),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=async url=>({ok:true,json:async()=>url.includes('kp_products')?products.map(data=>({id:data.id,data})):[]});}});
  const w=dom.window,d=w.document;await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await new Promise(resolve=>setTimeout(resolve,30));
  for(const [size,logo] of [[4,391],[6,397]]){
   const id=`reposteria-caja-${size}-alfajores`,card=d.querySelector(`[data-action='add-stock'][data-id='${id}']`).closest('.product-card'),options=card.querySelectorAll('.variant-btn');assert.equal(options.length,3);
   for(const [i,total] of [10000,17500].entries()){
    options[i].click();const button=card.querySelector('[data-action="add-stock"]');assert.equal(button.hidden,false);button.click();const item=JSON.parse(w.localStorage.getItem('kp_cart')).at(-1);assert.equal(item.totalNet,total);assert.equal(item.unitsPerPack,i===0?25:50);assert.equal(item.withoutPrint,true);d.getElementById('close-cart-btn').click();
   }
   options[2].click();assert.equal(card.querySelector('[data-action="add-stock"]').hidden,true);assert(card.querySelector('.product-price-value').textContent.includes(String(logo)));
   d.getElementById('modal-quantity-input').value='250';card.querySelector('[data-action="customize"]').click();assert.equal(d.getElementById('modal-quantity-input').value,'100');assert.equal(d.getElementById('modal-variant-select').value,'100 unidades');assert(d.getElementById('modal-product-note').textContent.includes('$'+logo));
   d.getElementById('custom-product-form').dispatchEvent(new w.Event('submit',{cancelable:true}));const item=JSON.parse(w.localStorage.getItem('kp_cart')).at(-1);assert.equal(item.isCustom,true);assert.equal(item.qty,100);assert.equal(item.price,'Cotización con logo');d.getElementById('close-cart-btn').click();
  }
  assert.deepEqual(errors,[]);w.close();
 }
 console.log('OK cajas 4/6: packs blancos 25/50, logo 100 a $391/$397, IVA, carrito, personalización, catálogo estático/remoto y migración sin alterar otros productos.');
})().catch(error=>{console.error(error);process.exit(1);});
