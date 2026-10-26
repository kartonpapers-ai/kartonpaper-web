// H2: synthetic edits only. No connection to the live administrator.
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const scope={window:{}};vm.createContext(scope);
for(const file of ['data/productos.js','admin/precios.js','js/catalogo-remoto.js'])vm.runInContext(read(file),scope);
vm.runInContext('globalThis.products=productsDB',scope);
const model=scope.window.KP_PRICES,products=JSON.parse(JSON.stringify(scope.products));
for(const p of products.filter(p=>p.packs)){
 const entries=p.packs.map(pack=>({...pack,requiresLogo:Boolean(pack.requiresLogo)}));
 const result=model.structured(p,entries,model.initialPack(p));scope.window.KP_CATALOG.validate({...p,...result});
 assert.equal(result.priceNum,p.priceNum);assert.deepEqual(Array.from(result.packs,pack=>pack.unitPrice),p.packs.map(pack=>pack.unitPrice));
}
const box=products.find(p=>p.id==='reposteria-caja-3-alfajores'),entries=box.packs.map(pack=>({...pack,requiresLogo:Boolean(pack.requiresLogo)}));
for(const value of [NaN,-1,1.5,Infinity,1e9+1])assert.throws(()=>model.structured(box,[{...entries[0],unitPrice:value}],0));
assert.throws(()=>model.structured(box,[{...entries[0],quantity:0}],0));assert.throws(()=>model.structured(box,[entries[0],entries[0]],0));assert.throws(()=>model.structured(box,[],0));assert.throws(()=>model.structured(box,entries,99));
const logo=model.structured(box,[{...entries[2],quantity:200}],0);assert.equal(logo.packs[0].configuration,'200 unidades');assert(logo.configurations.includes('200 unidades'));assert(!logo.configurations.includes('100 unidades'));assert(logo.configurations.includes('250 unidades'));
class Loader extends ResourceLoader{fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||u.pathname.includes('/vendor/'))return null;const file=path.join(root,u.pathname);return fs.existsSync(file)&&fs.statSync(file).isFile()?Promise.resolve(fs.readFileSync(file)):null;}}
const wait=()=>new Promise(resolve=>setTimeout(resolve,30));
(async()=>{
 let rows=products.map((data,i)=>({id:data.id,data,version:1,sort_order:i,published:true})),user=null,listener,writes=0,fail=false;
 const api={auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user}}),signInWithPassword:async()=>{user={id:'admin'};return{data:{session:{user}}};},onAuthStateChange:fn=>listener=fn,signOut:async()=>{listener('SIGNED_OUT');return{};}},rpc:async()=>({data:true}),from:table=>{
  let patch,id,version;const q={select:()=>q,order:()=>q,range:()=>q,eq:(key,value)=>{if(key==='id')id=value;else version=value;return q;},update:value=>{patch=value;return q;},maybeSingle:async()=>{if(fail)return{error:new Error('offline')};const row=rows.find(row=>row.id===id&&row.version===version);if(!row)return{data:null};writes++;Object.assign(row,structuredClone(patch),{version:row.version+1});return{data:structuredClone(row)};},then:(resolve,reject)=>Promise.resolve({data:structuredClone(table==='kp_products'?rows:[])}).then(resolve,reject)};return q;
 }};
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(read('admin/index.html'),{url:'https://kp.test/admin/',runScripts:'dangerously',resources:new Loader(),virtualConsole:vc,beforeParse(w){w.supabase={createClient:()=>api};w.structuredClone=structuredClone;w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 $('email').value='test@example.test';$('password').value='test';$('login-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await wait();
 w.KP_ADMIN_UI.editProduct(box.id);assert.equal($('edit-packs').hidden,false);assert.equal($('edit-manual-pricing').hidden,true);assert.equal($('edit-auto-price').disabled,true);
 const row=index=>$('edit-pack-rows').children[index],field=(index,key)=>row(index).querySelector('[data-pack-'+key+']');
 function set(index,key,value){const input=field(index,key);input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));}
 async function save(){ $('edit-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await wait();}
 set(0,'unit','440');assert.match(row(0).querySelector('output').textContent,/11\.000/);assert.match($('edit-price').value,/440/);
 await save();assert.equal(writes,1);let stored=rows.find(row=>row.id===box.id).data;assert.equal(stored.packs[0].unitPrice,440);assert.equal(stored.packs[0].totalNet,11000);assert.equal(stored.priceNum,440);assert(stored.variants.includes(stored.packs[0].label));scope.window.KP_CATALOG.validate(stored);
 // Price shown first is independent of row order; logos keep valid configurations.
 set(2,'quantity','200');set(2,'sku','KP-REP-A3-P200-LOGO');field(1,'initial').checked=true;field(1,'initial').dispatchEvent(new w.Event('change',{bubbles:true}));await save();stored=rows.find(row=>row.id===box.id).data;assert.equal(stored.priceNum,350);assert.match(stored.price,/Pack 50 u/);assert(stored.configurations.includes('200 unidades'));scope.window.KP_CATALOG.validate(stored);
 set(0,'quantity','0');await save();assert.equal(writes,2);assert.match($('save-status').textContent,/unidades/);set(0,'quantity','25');set(0,'unit','');await save();assert.equal(writes,2);set(0,'unit','450');set(0,'sku',field(1,'sku').value);await save();assert.equal(writes,2);assert.match($('save-status').textContent,/SKU/);set(0,'sku','KP-REP-A3-P025-SI');
 fail=true;await save();assert.match($('save-status').textContent,/No se guardaron/);assert.equal(field(0,'unit').value,'450');assert.equal(field(0,'unit').disabled,false);assert.equal($('edit-auto-price').disabled,true);fail=false;await save();assert.equal(writes,3);
 // Concurrent writes do not overwrite the server or discard entered prices.
 rows.find(row=>row.id===box.id).version++;set(0,'unit','460');await save();assert.equal(writes,3);assert.match($('save-status').textContent,/otra sesión/);assert.equal(field(0,'unit').value,'460');
 $('cancel').click();assert.equal(field(0,'unit').value,'450');
 // New pack, removal and first-price selection remain usable by keyboard.
 $('edit-pack-add').click();set(3,'quantity','75');set(3,'unit','345');set(3,'sku','KP-REP-A3-P075-SI');assert.equal(w.KP_PACK_EDITOR.read().packs.length,4);row(3).querySelector('button').click();assert.equal(w.KP_PACK_EDITOR.read().packs.length,3);
 row(1).querySelector('button').click();assert(row(1).querySelector('[data-pack-initial]').checked);assert.equal(w.KP_PACK_EDITOR.read().packs.length,2);
 // Non-pack editors retain their original controls and editable text.
 const manual=products.find(p=>!p.packs);w.KP_ADMIN_UI.editProduct(manual.id);assert.equal($('edit-packs').hidden,true);assert.equal($('edit-manual-pricing').hidden,false);assert.equal($('edit-number').readOnly,false);
 assert.equal(errors.length,0,errors.join('\n'));w.close();console.log('OK H2: packs sincronizados, precio inicial, logo/configuración, validación, guardado, fallo/reintento, conflicto, descarte y agregar/quitar.');
})().catch(error=>{console.error(error);process.exit(1);});
