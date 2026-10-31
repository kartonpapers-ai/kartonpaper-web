const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const scope={};vm.createContext(scope);vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);const products=JSON.parse(JSON.stringify(scope.products));
class Loader extends ResourceLoader{constructor(remote){super();this.remote=remote;}fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from(`window.KP_CONFIG={enabled:${this.remote},supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'}`));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
const wait=()=>new Promise(resolve=>setTimeout(resolve,30));
async function page(query,options={}){
 const errors=[],copied=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('index.html'),{url:'https://kp.test/'+query,runScripts:'dangerously',resources:new Loader(Boolean(options.remote)),virtualConsole:vc,beforeParse(w){
  w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};
  if(!options.noClipboard)Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>copied.push(text)}});
  w.fetch=options.fetch|| (async url=>({ok:true,json:async()=>String(url).includes('kp_products')?products.map(data=>({id:data.id,data})):[]}));
 }});await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));await wait();return {w:dom.window,d:dom.window.document,errors,copied};
}
(async()=>{
 for(const remote of [false,true]){
  let {w,d,errors,copied}=await page('?catalogo=cerveza',{remote});
  assert.equal(d.querySelectorAll('.product-card').length,products.filter(p=>p.category==='cerveza').length);assert([...d.querySelectorAll('.product-card')].every(card=>card.dataset.productId.startsWith('beer-')));
  d.getElementById('copy-catalog-link').click();await wait();assert.equal(copied[0],'https://kp.test/?catalogo=cerveza#catalogo');assert.deepEqual(errors,[]);w.close();
  ({w,d,errors,copied}=await page('?catalogo=cajas-reposteria&utm_source=whatsapp',{remote}));
  assert.equal(d.querySelectorAll('.product-card').length,3);assert.equal(d.querySelector('[data-product-id="reposteria-papel-metalizado"]'),null);assert.equal(d.querySelector('.filter-tab.active').dataset.category,'reposteria');
  d.getElementById('copy-catalog-link').click();await wait();assert.equal(copied[0],'https://kp.test/?catalogo=cajas-reposteria#catalogo');assert.deepEqual(errors,[]);w.close();
  ({w,d,errors,copied}=await page('?producto=reposteria-caja-4-alfajores',{remote}));
  const dialog=d.getElementById('product-detail-modal');assert(dialog.open);assert.match(dialog.textContent,/Caja con ventana para 4 alfajores/);assert.equal(d.querySelectorAll('.product-card').length,3);assert.equal(d.querySelectorAll('.cart-item').length,0);
  dialog.querySelector('[data-copy-product]').click();await wait();assert.equal(copied[0],'https://kp.test/?producto=reposteria-caja-4-alfajores#catalogo');assert(dialog.querySelector('[data-product-link-value]').hidden);
  d.getElementById('close-product-detail').click();assert(!dialog.open);assert.equal(new URL(w.location.href).searchParams.has('producto'),false);assert.equal(new URL(w.location.href).searchParams.get('catalogo'),'cajas-reposteria');
  d.querySelector('.filter-tab[data-category="cerveza"]').click();assert.equal(new URL(w.location.href).searchParams.get('catalogo'),'cerveza');
  w.history.pushState(null,'','?producto=bagasse-pollo-1');w.dispatchEvent(new w.PopStateEvent('popstate'));assert(dialog.open);assert.equal(dialog.querySelector('.product-card').dataset.productId,'bagasse-pollo-1');assert.deepEqual(errors,[]);w.close();
 }
 let {w,d,errors}=await page('?producto=producto-inexistente',{remote:true});assert(!d.getElementById('product-detail-modal').open);assert.match(d.getElementById('catalog-link-note').textContent,/no está disponible/);assert.deepEqual(errors,[]);w.close();
 ({w,d,errors}=await page('?producto=%22%3E%3Cimg%20src=x%3E'));assert.equal(d.querySelector('img[src="x"]'),null);assert(!d.getElementById('product-detail-modal').open);assert.deepEqual(errors,[]);w.close();
 ({w,d,errors}=await page('?producto=bagasse-pollo-1',{noClipboard:true}));const input=d.querySelector('#product-detail-modal [data-product-link-value]');d.querySelector('#product-detail-modal [data-copy-product]').click();await wait();assert.equal(input.hidden,false);assert.equal(d.activeElement,input);assert.equal(input.value,'https://kp.test/?producto=bagasse-pollo-1#catalogo');assert.equal(input.selectionEnd,input.value.length);assert.deepEqual(errors,[]);w.close();
 let finish;
 ({w,d,errors}=await page('?producto=bagasse-pollo-1',{remote:true,fetch:url=>String(url).includes('kp_products')?new Promise(resolve=>finish=resolve):Promise.resolve({ok:true,json:async()=>[]})}));
 assert(!d.getElementById('product-detail-modal').open);d.querySelector('.filter-tab[data-category="cerveza"]').click();finish({ok:true,json:async()=>products.map(data=>({id:data.id,data}))});await wait();assert(!d.getElementById('product-detail-modal').open);assert.equal(d.querySelector('.filter-tab.active').dataset.category,'cerveza');assert.deepEqual(errors,[]);w.close();
 ({w,d,errors}=await page('?producto=bagasse-pollo-1',{remote:true,fetch:async()=>{throw Error('offline');}}));assert(!d.getElementById('product-detail-modal').open);assert.equal(d.querySelectorAll('.product-card').length,0);assert.match(d.getElementById('catalog-status').textContent,/No pudimos/);assert.deepEqual(errors,[]);w.close();
 console.log('OK enlaces: categoría cervecería, solo cajas de repostería, ficha directa, URL estable, copiar/fallback, historial, producto no disponible, escape, carga tardía sin interrumpir y caída sin precios estáticos.');
})().catch(error=>{console.error(error);process.exit(1);});
