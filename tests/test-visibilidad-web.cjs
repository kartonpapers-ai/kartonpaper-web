const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const scope={};vm.createContext(scope);vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);const products=JSON.parse(JSON.stringify(scope.products));
const categories=()=>['cerveza','reposteria','gastronomia','bolsas','doypack','posavasos'].map(id=>({id,visible:true,version:1}));
class Loader extends ResourceLoader{fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js')||u.pathname.includes('/vendor/'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from('window.KP_CONFIG={enabled:true,supabaseUrl:"https://test.supabase.co",publishableKey:"sb_publishable_test"}'));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
const wait=()=>new Promise(r=>setTimeout(r,40));
async function page(file,query,before){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(read(file),{url:'https://kp.test/'+file+query,runScripts:'dangerously',resources:new Loader(),virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};before(w);}});await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));await wait();return {w:dom.window,d:dom.window.document,errors};}
(async()=>{
 const coaster=products.find(p=>p.category==='posavasos'&&p.type==='custom');assert(coaster);
 let cats=categories();cats.find(c=>c.id==='posavasos').visible=false;
 const saved=[{id:coaster.id,variant:coaster.configurations[0],isCustom:true,qty:100,artworkRef:'posavasos/00000000-0000-0000-0000-000000000001--logo.pdf'}];
 const setup=(w,fail=false)=>{w.localStorage.setItem('kp_cart',JSON.stringify(saved));w.fetch=async url=>({ok:!(fail&&url.includes('kp_catalog_categories')),json:async()=>url.includes('kp_catalog_categories')?cats:url.includes('kp_products')?products.map(data=>({id:data.id,data})):[]});};
 for(const query of ['?catalogo=posavasos','?producto='+coaster.id,'']){
  const {w,d,errors}=await page('index.html',query,setup);const style=d.createElement('style');style.textContent=read('css/styles.css')+read('css/hero-editorial.css');d.head.append(style);
  assert.equal(d.querySelector('[data-category="posavasos"]').hidden,true);assert.equal(d.querySelector('[data-hero-category="posavasos"]').hidden,true);assert.equal(w.getComputedStyle(d.querySelector('[data-hero-category="posavasos"]')).display,'none');assert.equal(w.getComputedStyle(d.querySelector('[data-category="posavasos"]')).display,'none');
  assert.equal(d.querySelectorAll('.product-card').length,products.filter(p=>p.category!=='posavasos').length);
  assert(!d.querySelector('[data-product-id="'+coaster.id+'"]'));assert(!w.buildOrderMessage().includes(coaster.name));assert.equal(d.querySelectorAll('.cart-item').length,0);
  assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).length,1);assert.match(d.getElementById('cart-recovery-notice').textContent,/Conservamos/);
  if(query)assert.match(d.getElementById('catalog-link-note').textContent,/no está disponible/);
  assert.equal(w.KP_HERO.visible({published:true,data:{primary:{kind:'categoria',target:'posavasos'}}},products),false);
  d.querySelector('[data-hero-category="cerveza"]').click();await wait();assert.equal(d.querySelector('[data-hero-category="cerveza"]').getAttribute('aria-pressed'),'true');assert.deepEqual(errors,[]);w.close();
 }
 // Reactivating recovers the saved line at current catalog prices.
 cats=categories();let p=await page('index.html','',setup);assert.equal(p.d.querySelectorAll('.cart-item').length,1);assert.equal(p.d.querySelector('[data-category="posavasos"]').hidden,false);p.w.close();
 p=await page('index.html','',w=>setup(w,true));assert.equal(p.d.querySelectorAll('.product-card').length,0);assert.equal(p.d.getElementById('hero-slider-section').hidden,true);assert.equal(JSON.parse(p.w.localStorage.getItem('kp_cart')).length,1);p.w.close();
 cats=categories().map(c=>({...c,visible:false}));p=await page('index.html','',setup);assert.equal(p.d.getElementById('hero-slider-section').hidden,true);assert.equal(p.d.querySelectorAll('.product-card').length,0);assert.deepEqual(p.errors,[]);p.w.close();
 // Admin: gates never rewrite products; preserve pending form fields; conflicts and network failures recover.
 cats=categories();const rows=products.map((data,i)=>({id:data.id,data,published:i!==products.indexOf(coaster),version:1,sort_order:i}));const before=JSON.stringify(rows);let writes=0,fail=false,conflict=false;
 const api={auth:{getSession:async()=>({data:{session:{user:{id:'admin'}}}}),getUser:async()=>({data:{user:{id:'admin'}}}),onAuthStateChange:()=>{}},rpc:async()=>({data:true}),from:table=>{let patch,id,version;const q={select:()=>q,order:()=>q,range:()=>q,eq:(k,v)=>{if(k==='id')id=v;if(k==='version')version=v;return q;},update:value=>{patch=value;return q;},maybeSingle:async()=>{assert.equal(table,'kp_catalog_categories');if(fail)return{error:new Error('offline')};if(conflict)return{data:null};const row=cats.find(c=>c.id===id&&c.version===version);if(!row)return{data:null};writes++;Object.assign(row,patch);return{data:structuredClone(row)};},then:(resolve,reject)=>Promise.resolve({data:structuredClone(table==='kp_products'?rows:table==='kp_catalog_categories'?cats:[])}).then(resolve,reject)};return q;}};
 p=await page('admin/index.html','',w=>{w.supabase={createClient:()=>api};});const {w,d}=p,$=id=>d.getElementById(id),toggle=()=>d.querySelector('[aria-label="Mostrar Posavasos en la web"]');assert.equal(d.querySelectorAll('#category-visibility-list input').length,6);assert.equal(toggle().checked,true);
 w.KP_ADMIN_UI.editProduct(products[0].id);$('edit-name').value='Edición pendiente';$('edit-form').dispatchEvent(new w.Event('input'));
 toggle().click();await wait();assert.equal(toggle().checked,false);assert.equal($('edit-name').value,'Edición pendiente');assert.equal(JSON.stringify(rows),before);assert.equal(writes,1);assert.match($('product-list').textContent,/Oculto por categoría/);
 w.KP_ADMIN_UI.editProduct(coaster.id);assert.equal($('edit-published').checked,false);assert.match($('product-visibility-help').textContent,/categoría está oculta/);
 toggle().click();await wait();assert.equal(toggle().checked,true);assert.equal($('edit-published').checked,false);assert.equal(JSON.stringify(rows),before);assert.equal(writes,2);
 for(const kind of ['fail','conflict']){fail=kind==='fail';conflict=kind==='conflict';toggle().click();await wait();assert.equal(toggle().checked,true);assert.match($('visibility-status').textContent,/No se guardó/);assert.equal(writes,2);}
 assert.deepEqual(p.errors,[]);w.close();console.log('OK visibilidad web: categorías/enlaces/hero/campañas, carrito conservado y recuperado, fallo seguro, todas ocultas, admin por categoría, cambios pendientes, producto oculto, conflicto y fallo de guardado.');
})().catch(e=>{console.error(e);process.exit(1);});
