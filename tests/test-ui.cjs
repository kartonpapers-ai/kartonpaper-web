const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const base={};vm.createContext(base);vm.runInContext(fs.readFileSync(path.join(root,'data/productos.js'),'utf8')+';globalThis.products=productsDB;',base);
const products=JSON.parse(JSON.stringify(base.products));
const config='window.KP_CONFIG={enabled:true,supabaseUrl:"https://test.supabase.co",publishableKey:"sb_publishable_test"};';
class Loader extends ResourceLoader{
 constructor(enabled){super();this.enabled=enabled;}
 fetch(url){const u=new URL(url);if(u.hostname!=='kp.test')return null;
 if(u.pathname.includes('/vendor/'))return Promise.resolve(Buffer.from(''));
 if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from(this.enabled ? config : 'window.KP_CONFIG={enabled:false};'));
 const p=path.join(root,u.pathname);if(fs.existsSync(p)&&fs.statSync(p).isFile())return Promise.resolve(fs.readFileSync(p));return null;}
}
const pause=()=>new Promise(r=>setTimeout(r,30));
async function page(file,enabled,before){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://kp.test/'+file,runScripts:'dangerously',resources:new Loader(enabled),virtualConsole:vc,beforeParse:w=>{w.matchMedia=()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};before?.(w);}});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));await pause();return{dom,w:dom.window,doc:dom.window.document,errors};}
(async()=>{
 let p=await page('admin/index.html',false);assert.match(p.doc.getElementById('login-status').textContent,/pendiente de conexión/);assert.equal(p.doc.getElementById('login-button').disabled,true);p.w.close();
 let rows=products.map((data,i)=>({id:data.id,data,published:true,version:1,sort_order:i}));let user=null,allowed=true,writeFails=false,listener;
 let uploads=0,uploadFails=false;
 const api={storage:{from:()=>({upload:async()=>{uploads++;return uploadFails?{error:new Error('upload failed')}:{data:{}}}})},auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user}}),onAuthStateChange:fn=>{listener=fn},signInWithPassword:async creds=>creds.password==='correcta'?{data:{session:{user:(user={id:'admin-id'})}}}:{data:{},error:new Error('incorrecta')},signOut:async()=>{user=null;listener?.('SIGNED_OUT',null);return{}}},rpc:async()=>({data:allowed}),from:()=>{let id,version,update,insert;
 const q={select:()=>q,order:()=>q,update:d=>{update=d;return q},insert:d=>{insert=d;return q},single:async()=>{if(writeFails)return{error:new Error("insert failed")};const row={...insert,version:1};rows.push(structuredClone(row));return{data:structuredClone(row)}},eq:(k,v)=>{if(k==='id')id=v;else if(k==='version')version=v;return q},maybeSingle:async()=>{if(writeFails)return{error:new Error('red')};const r=rows.find(r=>r.id===id&&r.version===version);if(!r)return{data:null};Object.assign(r,update,{version:r.version+1});return{data:structuredClone(r)}},then:(resolve,reject)=>Promise.resolve({data:structuredClone(rows)}).then(resolve,reject)};return q;}};
 p=await page('admin/index.html',true,w=>w.supabase={createClient:()=>api});const el=id=>p.doc.getElementById(id);
 el('email').value='jorge@example.test';el('password').value='errada';el('login-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(el('workspace').hidden,true);assert.match(el('login-status').textContent,/No pudimos/);
 el('password').value='correcta';el('login-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(el('workspace').hidden,false);assert.equal(p.doc.querySelectorAll('.product-row').length,20);
 p.doc.querySelector('.product-row').click();assert.equal(el('edit-auto-price').checked,true);assert.equal(el('edit-price').readOnly,true);
 el('edit-number').value='690';el('edit-number').dispatchEvent(new p.w.Event('input',{bubbles:true}));
 assert.equal(el('edit-price').value,'$690 + IVA c/u');assert.match(el('edit-variants').value,/34\.500/);
 el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();
 assert.equal(rows[0].data.priceNum,690);assert.equal(rows[0].data.price,'$690 + IVA c/u');assert.deepEqual(Array.from(rows[0].data.variants),['Pack 50 u. ($34.500)','Pack 100 u. ($69.000)','Pack 200 u. ($138.000)']);
 el('edit-auto-price').checked=false;el('edit-auto-price').dispatchEvent(new p.w.Event('change',{bubbles:true}));el('edit-price').value='Precio especial';
 el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(rows[0].data.price,'Precio especial');assert.equal(el('edit-price').readOnly,false);
 el('search').value='doypack';el('search').dispatchEvent(new p.w.Event('input'));assert.equal(p.doc.querySelectorAll('.product-row').length,1);
 p.doc.querySelector('.product-row').click();assert.equal(el('edit-form').hidden,false);el('edit-price').value='Cotización revisada';el('edit-price').dispatchEvent(new p.w.Event('input',{bubbles:true}));el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.match(el('save-status').textContent,/guardados/);assert.equal(rows.find(r=>r.data.category==='doypack').data.price,'Cotización revisada');
 p.w.confirm=()=>true;
 // New product: missing image fails, retry creates hidden product, update publishes it.
 el('new-product').click();assert.equal(el('edit-published').checked,false);assert.equal(el('save').textContent,'Crear producto');
 el('edit-name').value='Nueva caja de prueba';el('edit-subtitle').value='Caja nueva';
 el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.match(el('save-status').textContent,/Selecciona una imagen/);
 el('edit-existing-image').value=products[0].image;el('edit-type').value='stock';el('edit-type').dispatchEvent(new p.w.Event('change',{bubbles:true}));
 el('edit-number').value='1000';el('edit-number').dispatchEvent(new p.w.Event('input',{bubbles:true}));
 writeFails=true;el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.match(el('save-status').textContent,/No se guardaron/);assert.equal(rows.length,20);
 writeFails=false;el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(rows.length,21);
 const added=rows[20];assert.equal(added.published,false);assert.equal(added.data.priceNum,1000);assert.equal(added.data.variants[0],'Pack 50 u. ($50.000)');assert.match(el('save-status').textContent,/Producto creado/);
 el('edit-published').checked=true;el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(rows[20].published,true);
 el('search').value='doypack';el('search').dispatchEvent(new p.w.Event('input'));p.doc.querySelector('.product-row').click();
 // Uploaded photos: failed upload never creates a product; retry stores the public URL.
 el('new-product').click();el('edit-name').value='Producto con foto';el('edit-subtitle').value='Foto propia';
 p.w.KP_IMAGES={prepare:async()=>new p.w.Blob(['photo'],{type:'image/webp'})};p.w.URL.createObjectURL=()=> 'blob:test';p.w.URL.revokeObjectURL=()=>{};
 Object.defineProperty(el('edit-file'),'files',{configurable:true,value:[new p.w.File(['photo'],'foto.png',{type:'image/png'})]});
 el('edit-file').dispatchEvent(new p.w.Event('change',{bubbles:true}));await pause();assert.match(el('image-status').textContent,/Foto lista/);
 uploadFails=true;el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(rows.length,21);assert.match(el('save-status').textContent,/No se guardaron/);
 uploadFails=false;el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(rows.length,22);assert.equal(uploads,2);assert.match(rows[21].data.image,/https:\/\/test\.supabase\.co\/storage\/v1\/object\/public\/kp-productos\/.+\.webp$/);
 el('search').value='doypack';el('search').dispatchEvent(new p.w.Event('input'));p.doc.querySelector('.product-row').click();
 const doypack=rows.find(r=>r.data.category==='doypack');doypack.version++;
 el('edit-price').value='Conflicto';el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.match(el('save-status').textContent,/otra sesión/);assert.notEqual(doypack.data.price,'Conflicto');
 p.w.confirm=()=>true;el('reload').click();await pause();p.doc.querySelector('.product-row').click();writeFails=true;el('edit-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.match(el('save-status').textContent,/No se guardaron/);writeFails=false;
 el('logout').click();await pause();assert.equal(el('workspace').hidden,true);allowed=false;el('password').value='correcta';el('login-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(el('workspace').hidden,true);assert.match(el('login-status').textContent,/no tiene acceso/);assert.deepEqual(p.errors,[]);p.w.close();
 p=await page('index.html',false);assert.equal(p.doc.querySelectorAll('.product-card').length,20);p.doc.querySelector('.filter-tab[data-category="reposteria"]').click();assert.equal(p.doc.querySelectorAll('.product-card').length,5);p.doc.querySelector('[data-action="add-stock"]').click();assert.equal(p.doc.getElementById('cart-badge-count').textContent,'1');p.doc.getElementById('close-cart-btn').click();p.doc.querySelector('[data-action="customize"]').click();assert.equal(p.doc.getElementById('custom-modal').getAttribute('aria-hidden'),'false');assert.deepEqual(p.errors,[]);p.w.close();
 const remote=structuredClone(products);remote[0].name='<img src=x onerror="alert(1)">';remote[0].price='$999 + IVA c/u';remote[0].image='https://test.supabase.co/storage/v1/object/public/kp-productos/test.webp';
 p=await page('index.html',true,w=>{w.fetch=async()=>({ok:true,json:async()=>remote.map(data=>({id:data.id,data}))});w.localStorage.setItem('kp_cart',JSON.stringify([{id:remote[0].id,name:'Anterior',price:'Anterior',image:remote[0].image,variant:remote[0].variants[0],isCustom:false,qty:1}]));});
 assert.equal(p.doc.querySelectorAll('.product-card').length,20);assert.equal(p.doc.querySelector('img[src=x]'),null);assert.match(p.doc.querySelector('.product-card-title').textContent,/<img/);assert.match(p.doc.querySelector('.cart-item-price').textContent,/999/);assert.deepEqual(p.errors,[]);p.w.close();
 p=await page('index.html',true,w=>w.fetch=async()=>{throw new Error('network')});assert.equal(p.doc.querySelectorAll('.product-card').length,0);assert.equal(p.doc.getElementById('checkout-wa-btn').disabled,true);assert.match(p.doc.getElementById('catalog-status').textContent,/No pudimos/);assert.deepEqual(p.errors,[]);p.w.close();
 p=await page('index.html',true,w=>w.fetch=async()=>({ok:true,json:async()=>[]}));assert.equal(p.doc.querySelectorAll('.product-card').length,0);assert.match(p.doc.getElementById('catalog-status').textContent,/actualizando/);p.w.close();
 console.log('OK DOM: configuración pendiente, login fallido/autorizado/no autorizado, búsqueda, edición, conflicto, fallo de guardado, logout, filtros, carrito, personalización, catálogo remoto, escape HTML y caída de conexión.');
})().catch(e=>{console.error(e);process.exit(1)});
