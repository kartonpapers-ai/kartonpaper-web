const fs = require('fs'), path = require('path'), vm = require('vm');
const assert = require('node:assert/strict');
const {JSDOM, ResourceLoader, VirtualConsole} = require('jsdom');
const {PGlite} = require('@electric-sql/pglite');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const context = {window:{}}; vm.createContext(context);
vm.runInContext(read('data/productos.js') + '; globalThis.products = productsDB;', context);
vm.runInContext(read('js/catalogo-remoto.js'), context);
const products = JSON.parse(JSON.stringify(context.products));
const expected = [
 ['beer-maleta-3x330','KP-CER-M3-330',[[50,900],[100,700],[200,670]],false],
 ['beer-wrap-4x330','KP-CER-W4-330',[[50,360],[100,310],[200,310],[300,295],[400,285]],true],
 ['beer-wrap-6x330','KP-CER-W6-330',[[50,500],[100,450],[200,450],[300,430],[400,415]],true],
 ['beer-wrap-4x500','KP-CER-W4-500',[[50,510],[100,460],[200,460],[300,440],[400,425]],true],
 ['beer-wrap-2x500','KP-CER-W2-500',[[50,400],[100,350],[200,350],[300,335],[400,325]],true],
 ['beer-maleta-vaso','KP-CER-M2V',[[50,750],[100,700],[200,700],[300,670],[400,650]],true]
];
class Loader extends ResourceLoader {
 constructor(remote) {super();this.remote=remote;}
 fetch(url) {
  const u=new URL(url); if(u.hostname!=='kp.test' || !u.pathname.endsWith('.js')) return null;
  if(u.pathname==='/data/config.js') return Promise.resolve(Buffer.from(`window.KP_CONFIG={enabled:${this.remote},supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'};`));
  return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));
 }
}
async function page(remote) {
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(remote),virtualConsole:vc,beforeParse(w){
  w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.fetch=async url=>({ok:true,json:async()=>url.includes('kp_products')?products.map(data=>({id:data.id,data})):[]});
 }});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 await new Promise(resolve=>setTimeout(resolve,30));
 return {dom,w:dom.window,doc:dom.window.document,errors};
}
(async()=>{
 const skus=new Set();let count=0;
 for(const [id,sku,tiers,si] of expected){
  const p=products.find(p=>p.id===id);context.window.KP_CATALOG.validate(p);
  assert.equal(p.sku,sku);assert.equal(p.packs.length,tiers.length);
  for(const [i,[quantity,unitPrice]] of tiers.entries()){
   const pack=p.packs[i],suffix=si&&quantity===50?'-SI':'';
   assert.equal(pack.quantity,quantity);assert.equal(pack.unitPrice,unitPrice);assert.equal(pack.totalNet,quantity*unitPrice);
   assert.equal(pack.sku,`${sku}-P${String(quantity).padStart(3,'0')}${suffix}`);
   assert.equal(pack.withoutPrint,Boolean(suffix));assert.equal(pack.label.includes('Sin impresión'),Boolean(suffix));
   assert(!skus.has(pack.sku));skus.add(pack.sku);count++;
  }
 }
 const bad=structuredClone(products[0]);bad.packs[0].totalNet=1;assert.throws(()=>context.window.KP_CATALOG.validate(bad));
 // Migration updates only agreed fields, preserves admin changes, and is repeatable.
 const db=new PGlite();await db.exec('create table kp_products(id text primary key,data jsonb,sort_order int);');
 for(const [i,p] of products.entries()) await db.query('insert into kp_products values($1,$2,$3)',[p.id,JSON.stringify({...p,name:'Nombre conservado '+p.id,price:'Anterior',packs:[]}),i]);
 await db.exec(read('supabase/14-precios-cerveza-20261022.sql'));await db.exec(read('supabase/14-precios-cerveza-20261022.sql'));
 for(const [id] of expected){const {rows}=await db.query('select data from kp_products where id=$1',[id]);assert.equal(rows[0].data.name,'Nombre conservado '+id);assert.deepEqual(rows[0].data.packs,products.find(p=>p.id===id).packs);}
 await db.query('delete from kp_products where id=$1',[expected[0][0]]);
 await assert.rejects(()=>db.exec(read('supabase/14-precios-cerveza-20261022.sql')),/Faltan productos/);await db.close();
 for(const remote of [false,true]){
  const {w,doc,errors}=await page(remote);
  assert.equal(doc.querySelectorAll('.product-card').length,products.length);
  for(const [id] of expected){
   const p=products.find(p=>p.id===id);
   const card=doc.querySelector(`[data-action='add-stock'][data-id='${id}']`).closest('.product-card');
   for(const [i,pack] of p.packs.entries()){
    card.querySelectorAll('.variant-btn')[i].click();
    assert.match(card.querySelector('.product-price-note').textContent,new RegExp(pack.sku));
    card.querySelector('[data-action="add-stock"]').click();
    const cart=JSON.parse(w.localStorage.getItem('kp_cart')),item=cart.at(-1);
    assert.equal(item.sku,pack.sku);assert.equal(item.totalNet,pack.totalNet);assert.equal(item.unitsPerPack,pack.quantity);
    assert(w.buildOrderMessage().includes(pack.sku));
    doc.getElementById('close-cart-btn').click();
   }
  }
  const last=doc.querySelector('.cart-item:last-child');last.querySelector('[data-action="plus"]').click();
  assert.match(doc.querySelector('.cart-item:last-child .cart-item-price').textContent,/520.000/);
  assert.match(w.buildOrderMessage(),/Subtotal neto: \$2\.807\.000/);assert.match(w.buildOrderMessage(),/Total con IVA: \$3\.340\.330/);
  // Custom quote must not inherit a stock pack price or offer a 50-unit blank pack as its format.
  doc.getElementById('close-cart-btn').click();
  doc.querySelector('[data-action="customize"][data-id="beer-wrap-4x330"]').click();
  assert(!doc.getElementById('modal-variant-select').textContent.includes('Sin impresión'));
  doc.getElementById('custom-product-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).at(-1).price,'Cotización con logo');
  assert.deepEqual(errors,[]);w.close();
 }
 console.log(`OK: ${count} packs, precios/SKU, migración atómica e idempotente, tienda estática/remota, carrito, IVA y cotización con logo.`);
})().catch(e=>{console.error(e);process.exit(1)});
