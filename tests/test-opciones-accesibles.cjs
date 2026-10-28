const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
class Loader extends ResourceLoader {
 fetch(url) {
  const u=new URL(url);
  if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;
  return Promise.resolve(Buffer.from(u.pathname==='/data/config.js'?'window.KP_CONFIG={enabled:false}':read(u.pathname.slice(1))));
 }
}
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 function check(group,selector,selectedClass){
  const buttons=[...group.querySelectorAll(selector)];assert(buttons.length);
  assert.equal(buttons.filter(b=>b.getAttribute('aria-pressed')==='true').length,1);
  for(const button of buttons){assert.equal(button.type,'button');assert.equal(button.getAttribute('aria-pressed'),String(button.classList.contains(selectedClass)));}
 }
 const filters=d.querySelector('.filter-tabs');assert.equal(filters.getAttribute('role'),'group');assert(filters.getAttribute('aria-label'));assert.equal(d.querySelector('[role="tablist"],[role="tab"]'),null);
 for(const group of d.querySelectorAll('.variant-pills')){
  assert.equal(group.getAttribute('role'),'group');assert.match(group.getAttribute('aria-label'),/Formato u opción de .+/);
  check(group,'.variant-btn','selected');
  for(const button of group.querySelectorAll('.variant-btn')){button.click();check(group,'.variant-btn','selected');button.click();assert.equal(button.getAttribute('aria-pressed'),'true');}
 }
 const card=d.querySelector('[data-product-id="bagasse-pollo-1"]');card.querySelector('.btn-view-product').click();
 const option=card.querySelectorAll('.variant-btn')[1];option.click();check(card,'.variant-btn','selected');
 const selected=option.dataset.val;$('close-product-detail').click();card.querySelector('.btn-view-product').click();assert.equal(option.getAttribute('aria-pressed'),'true');assert.equal(option.dataset.val,selected);
 card.querySelector('[data-action="customize"]').click();assert.equal($('modal-bulk-quantity').value,'400');$('custom-product-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(JSON.parse(w.localStorage.getItem('kp_cart'))[0].qty,400);$('close-cart-btn').click();
 for(const filter of filters.querySelectorAll('.filter-tab')){
  assert.equal(filter.getAttribute('aria-controls'),'products-grid');filter.click();check(filters,'.filter-tab','active');
  for(const group of d.querySelectorAll('.variant-pills'))check(group,'.variant-btn','selected');
  const ids=[...d.querySelectorAll('.product-card')].map(card=>card.dataset.productId);
  if(filter.dataset.category==='gastronomia')assert(ids.every(id=>id.startsWith('bagasse-')));
 }
 assert.deepEqual(errors,[]);w.close();console.log('OK H6: estado accesible exclusivo en todas las opciones y filtros, grupos nombrados, selección conservada en detalle y 400 unidades trasladadas al carrito.');
})().catch(error=>{console.error(error);process.exit(1);});
