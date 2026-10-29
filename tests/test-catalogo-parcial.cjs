const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const scope={window:{}};vm.createContext(scope);vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);vm.runInContext(read('js/catalogo-remoto.js'),scope);
const products=JSON.parse(JSON.stringify(scope.products)),row=p=>({id:p.id,data:p,published:true,version:1,sort_order:0});
const good=row(products.find(p=>p.id==='beer-wrap-4x330')),food=row(products.find(p=>p.id==='bagasse-pollo-1'));
const bad={...food,data:{...food.data,specs:null}};
const partition=scope.window.KP_CATALOG.partition;
for(const invalid of [null,false,{},[],{id:'bad',data:null},bad,{...food,id:'otro-id'},{...food,data:{...food.data,configurations:4}}]){
 const result=partition([good,invalid,food]);assert.equal(result.valid.length,invalid?.id===food.id?1:2);assert(result.rejected.length);assert.equal(result.valid[0].id,good.id);
}
let result=partition([good,food,structuredClone(food)]);assert.equal(result.valid.length,1);assert.equal(result.rejected.length,2);assert(result.rejected.every(issue=>issue.reason.includes('duplicado')));
assert.throws(()=>partition({}),/Respuesta/);assert.equal(partition([]).rejected.length,0);
assert.equal(partition(products.map(row)).valid.length,products.length);
class Loader extends ResourceLoader{
 fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||u.pathname.includes('/vendor/'))return null;
 if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from('window.KP_CONFIG={enabled:true,supabaseUrl:"https://test.supabase.co",publishableKey:"sb_publishable_test"}'));
 const file=path.join(root,u.pathname);return fs.existsSync(file)&&fs.statSync(file).isFile()?Promise.resolve(fs.readFileSync(file)):null;}
}
const wait=()=>new Promise(resolve=>setTimeout(resolve,40));
const savedFood={id:food.id,variant:'Embalaje completo de 200 u. · Impresión en tapa',isCustom:true,qty:200};
async function shop(rows,saved,network=false){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(),virtualConsole:vc,beforeParse(w){
  w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};
  if(saved)w.localStorage.setItem('kp_cart',JSON.stringify(saved));
  w.fetch=async url=>{if(network)throw Error('offline');return {ok:true,json:async()=>url.includes('kp_products')?rows:[]};};
 }});await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));await wait();
 return {w:dom.window,d:dom.window.document,errors};
}
(async()=>{
 let {w,d,errors}=await shop([good,bad],[savedFood]);
 assert.equal(d.querySelectorAll('.product-card').length,1);assert.equal(d.querySelector('[data-product-id="'+food.id+'"]'),null);assert.equal(d.getElementById('catalog-status').hidden,false);
 assert.equal(d.getElementById('checkout-wa-btn').disabled,false);assert.match(d.getElementById('cart-recovery-notice').textContent,/Conservamos/);
 assert(!w.buildOrderMessage().includes('Caja para pollo'));assert.equal(JSON.parse(w.localStorage.getItem('kp_cart'))[0].id,food.id);
 d.querySelector('[data-action="add-stock"]').click();assert.equal(d.querySelectorAll('.cart-item').length,1);assert.match(w.buildOrderMessage(),/Wrap para 4 botellas/);assert(!w.buildOrderMessage().includes('Caja para pollo'));
 assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).length,2);const persisted=JSON.parse(w.localStorage.getItem('kp_cart'));assert.deepEqual(errors,[]);w.close();
 ({w,d,errors}=await shop([good,food],persisted));assert.equal(d.querySelectorAll('.cart-item').length,2);assert.equal(d.getElementById('cart-recovery-notice').hidden,true);assert.equal(d.getElementById('catalog-status').hidden,true);assert.deepEqual(errors,[]);w.close();
 for(const [rows,network,pattern] of [[[bad],false,/revisando/],[[],false,/actualizando/],[{},false,/No pudimos/],[null,true,/No pudimos/]]){
  ({w,d,errors}=await shop(rows,[savedFood],network));assert.equal(d.querySelectorAll('.product-card').length,0);assert.equal(d.getElementById('checkout-wa-btn').disabled,true);assert.match(d.getElementById('catalog-status').textContent,pattern);
  if(network||!Array.isArray(rows))assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).length,1);assert.deepEqual(errors,[]);w.close();
 }
 // Administrator: diagnose rejected rows without writes, keep valid editing and
 // downstream catalog references, and re-admit a corrected product on reload.
 let rows=[good,bad,{id:'<img src=x onerror=alert(1)>',data:null}],writes=0,listener;
 const api={auth:{getSession:async()=>({data:{session:{user:{id:'admin'}}}}),getUser:async()=>({data:{user:{id:'admin'}}}),onAuthStateChange:fn=>listener=fn},rpc:async()=>({data:true}),from:table=>{
  let patch,id,version;const q={select:()=>q,order:()=>q,range:()=>q,eq:(key,value)=>{if(key==='id')id=value;else version=value;return q;},update:value=>{patch=value;return q;},maybeSingle:async()=>{const record=rows.find(r=>r.id===id&&r.version===version);if(!record)return {data:null};writes++;Object.assign(record,patch,{version:record.version+1});return {data:structuredClone(record)};},then:(resolve,reject)=>Promise.resolve({data:structuredClone(table==='kp_products'?rows:[])}).then(resolve,reject)};return q;
 }};
 const vc=new VirtualConsole();errors=[];vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('admin/index.html'),{url:'https://kp.test/admin/',runScripts:'dangerously',resources:new Loader(),virtualConsole:vc,beforeParse(win){win.supabase={createClient:()=>api};win.structuredClone=structuredClone;win.confirm=()=>true;win.HTMLElement.prototype.scrollIntoView=()=>{};}});
 w=dom.window;d=w.document;const $=id=>d.getElementById(id);await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await wait();
 assert.equal(d.querySelectorAll('.product-row').length,1);assert.equal($('catalog-quarantine').hidden,false);assert.equal($('catalog-quarantine-list').children.length,2);assert.match($('catalog-quarantine-list').textContent,/bagasse-pollo-1.*opciones y características/);assert.equal($('catalog-quarantine-list').querySelector('img'),null);assert.equal(writes,0);
 assert.equal(d.querySelectorAll('#price-rows tr').length,1);assert.equal($('summary-products').textContent,'1');
 w.KP_ADMIN_UI.editProduct(food.id);assert.equal($('edit-form').hidden,true);
 w.KP_ADMIN_UI.editProduct(good.id);$('edit-name').value='Wrap revisado';$('edit-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await wait();assert.equal(writes,1);assert.equal(rows[0].data.name,'Wrap revisado');
 rows=[good,food];$('reload').click();await wait();assert.equal(d.querySelectorAll('.product-row').length,2);assert.equal($('catalog-quarantine').hidden,true);assert.equal($('catalog-quarantine-list').children.length,0);assert.equal(d.querySelectorAll('#price-rows tr').length,2);assert.equal(writes,1);
 rows=[bad];$('reload').click();await wait();assert.equal(d.querySelectorAll('.product-row').length,0);assert.equal($('catalog-quarantine-list').children.length,1);assert.equal(d.querySelectorAll('#price-rows tr').length,0);
 listener('SIGNED_OUT',null);await wait();assert.equal($('catalog-quarantine-list').children.length,0);assert.equal($('catalog-quarantine').hidden,true);assert.deepEqual(errors,[]);w.close();
 console.log('OK H8: cuarentena por fila, duplicados, catálogo parcial/vacío/caído, compra válida, carrito pendiente conservado, diagnóstico seguro del admin, edición válida, actualización y cierre de sesión.');
})().catch(error=>{console.error(error);process.exit(1);});
