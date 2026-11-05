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

const vm=require('vm'),scope={window:{}};vm.createContext(scope);
vm.runInContext(read('data/productos.js')+';globalThis.products=productsDB',scope);
vm.runInContext(read('js/catalogo-remoto.js'),scope);
scope.window.KP_BOX_PREVIEW={describe:()=>''};vm.runInContext(read('js/carrito-guardado.js'),scope);
const api=scope.window.KP_SAVED_CART,products=JSON.parse(JSON.stringify(scope.products));
const product=products.find(p=>p.id==='beer-wrap-4x330');
const valid={id:product.id,variant:product.variants[0],qty:1,isCustom:false};
const custom={id:'bagasse-pollo-1',variant:'Embalaje completo de 200 u. · Impresión en tapa',qty:200,isCustom:true,logoFile:'logo.png'};
const parse=raw=>api.read({getItem:()=>raw}),restore=entries=>api.reconcile(parse(JSON.stringify(entries)).items,products);
for(const raw of ['{}','null','true','123','"texto"','[','']){assert.equal(parse(raw).problem,true);assert.equal(parse(raw).items.length,0);}
assert.equal(parse(null).problem,false);assert.equal(parse('[]').problem,false);
for(const bad of [null,false,[],{}, {...valid,id:2},{...valid,variant:{}},{...valid,isCustom:'false'},...[-1,0,1.5,'1',1e20].map(qty=>({...valid,qty}))]){
 const result=parse(JSON.stringify([valid,bad,custom]));assert.equal(result.items.length,2);assert.equal(result.problem,true);
}
let result=restore([valid,{...valid,id:'eliminado'},{...valid,variant:'opción vieja'},custom,{...custom,qty:201},{...custom,isCustom:false}]);
assert.equal(result.items.length,2);assert.equal(result.problem,true);assert.equal(result.items[1].qty,200);
result=restore([{...valid,name:'Modificado',image:'javascript:alert(1)',totalNet:1,stockUnits:100,stockUnitPrice:1,sku:'FALSO',quantityOptions:[999],unitsPerBox:999,pricedCustomization:true,customUnitPrice:1}]);
assert.equal(result.items[0].name,product.name);assert.equal(result.items[0].image,product.image);assert.equal(result.items[0].totalNet,product.packs[0].totalNet);assert.equal(result.items[0].stockUnits,undefined);assert.equal(result.items[0].quantityOptions,undefined);assert.equal(result.items[0].customUnitPrice,undefined);
assert.equal(restore([{...custom,artworkRef:{bad:true},logoFile:{bad:true},artworkPreview:{bad:true}}]).items.length,1);
const required=products.find(p=>p.requiresArtwork);assert(required);
assert.equal(restore([{id:required.id,variant:required.variants[0],qty:100,isCustom:true,artworkRef:'https://example.com/falso'}]).items.length,0);
// Todos los formatos vigentes deben sobrevivir, no solo los compostables.
for(const p of products.filter(p=>!p.pricePending)){
 const isCustom=p.type==='custom',variant=p.orderStep?'Embalaje completo de '+p.orderStep+' u. · Impresión en tapa':(isCustom?(p.configurations||(p.packs?['Personalización con logo · Cotización']:p.variants)):p.variants)[0];
 const rule=scope.window.KP_CATALOG.quantityRule(p,variant);
 const qty=isCustom?(rule?.step||rule?.quantities?.[0]||100):1;
 const item={id:p.id,variant,isCustom,qty,...(p.requiresArtwork?{artworkRef:'posavasos/12345678-1234-1234-1234-123456789abc--logo.png'}:{})};
 assert.equal(restore([item]).items.length,1,p.id);
}
assert.equal(api.read({getItem(){throw Error('denied');}}).readFailed,true);
(async()=>{
 async function page(raw,options={}){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  class RemoteLoader extends Loader{fetch(url){if(new URL(url).pathname==='/data/config.js')return Promise.resolve(Buffer.from('window.KP_CONFIG={enabled:'+Boolean(options.offline)+',supabaseUrl:"https://test.supabase.co",publishableKey:"test"}'));return super.fetch(url);}}
  const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new RemoteLoader(),virtualConsole:vc,beforeParse(w){
   w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};
   if(raw!==null)w.localStorage.setItem('kp_cart',raw);
   if(options.offline)w.fetch=async()=>{throw Error('offline');};
   if(options.blocked)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Denied','SecurityError');}});
   if(options.quota)w.Storage.prototype.setItem=()=>{throw new w.DOMException('Quota','QuotaExceededError');};
  }});
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));await new Promise(resolve=>setTimeout(resolve,30));
  return {w:dom.window,d:dom.window.document,errors};
 }
 for(const raw of ['{}','[null,{}]','[']){
  const {w,d,errors}=await page(raw);assert.equal(d.getElementById('cart-recovery-notice').hidden,false);assert.match(d.getElementById('cart-recovery-notice').textContent,/Vuelve a agregar/);assert.equal(w.localStorage.getItem('kp_cart'),'[]');
  d.querySelector('[data-action="add-stock"][data-id="beer-wrap-4x330"]').click();assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).length,1);assert.deepEqual(errors,[]);w.close();
 }
 let {w,d,errors}=await page(JSON.stringify([valid,null,custom]));assert.equal(JSON.parse(w.localStorage.getItem('kp_cart')).length,2);assert.equal(d.querySelectorAll('.cart-item').length,2);assert.match(d.getElementById('cart-recovery-notice').textContent,/líneas válidas/);assert.equal(d.getElementById('checkout-wa-btn').disabled,false);assert.deepEqual(errors,[]);const healed=w.localStorage.getItem('kp_cart');w.close();
 ({w,d,errors}=await page(healed));assert.equal(d.getElementById('cart-recovery-notice').hidden,true);assert.equal(d.querySelectorAll('.cart-item').length,2);assert.deepEqual(errors,[]);w.close();
 const preview={schema:1,dieline:'wrap-4x330-v1',faces:['front'],size:80,x:100,y:0,rotationInDieline:{front:180,back:0}};
 const customVariant=(product.configurations||['Personalización con logo · Cotización'])[0];
 ({w,d,errors}=await page(JSON.stringify([{id:product.id,variant:customVariant,isCustom:true,qty:100,logoFile:'gráfica.png',artworkPreview:preview}])));
 assert.deepEqual(JSON.parse(w.localStorage.getItem('kp_cart'))[0].artworkPreview,preview);assert.match(w.buildOrderMessage(),/Frente · tamaño 80%/);assert.equal(d.getElementById('cart-recovery-notice').hidden,true);assert.deepEqual(errors,[]);w.close();
 for(const options of [{blocked:true},{quota:true}]){
  ({w,d,errors}=await page(null,options));d.querySelector('[data-action="add-stock"][data-id="beer-wrap-4x330"]').click();assert.equal(d.querySelectorAll('.cart-item').length,1);assert.match(d.getElementById('cart-recovery-notice').textContent,/no permite guardar/);assert.deepEqual(errors,[]);w.close();
 }
 const raw=JSON.stringify([valid,custom]);({w,d,errors}=await page(raw,{offline:true}));assert.equal(w.localStorage.getItem('kp_cart'),raw);assert.equal(d.getElementById('checkout-wa-btn').disabled,true);assert.equal(d.querySelectorAll('.cart-item').length,0);assert.match(d.getElementById('catalog-status').textContent,/recuperar la conexión/);assert.deepEqual(errors,[]);w.close();
 console.log('OK H7: JSON/tipos/líneas inválidos, recuperación parcial, precios y reglas de catálogo, personalización, almacenamiento bloqueado/cuota, pedido nuevo, recarga saneada y desconexión sin pérdida.');
})().catch(error=>{console.error(error);process.exit(1);});
