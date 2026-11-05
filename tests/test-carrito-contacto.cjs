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
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);
 await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 const opened=[];w.open=(...args)=>opened.push(args);
 $('checkout-wa-btn').click();assert.equal(opened.length,0);assert.equal($('customer-name').hasAttribute('aria-invalid'),false);
 const card=d.querySelector('[data-product-id="reposteria-caja-3-alfajores"]');card.querySelector('[data-action="add-stock"]').click();
 for(const id of ['customer-name','customer-city','customer-notes']) {
  assert.equal($(id).labels.length,1);assert($(id).labels[0].textContent.trim());
 }
 const change=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 // Both channels block blanks, including whitespace, and keep focus in the cart.
 for(const button of ['checkout-wa-btn','checkout-email-btn']) {
  change('customer-name',' \t ');change('customer-city','\u00a0');$(button).click();
  assert.equal(d.activeElement,$('customer-name'));assert.equal(opened.length,0);assert.deepEqual(errors,[]);
  for(const id of ['customer-name','customer-city']) {
   assert.equal($(id).getAttribute('aria-invalid'),'true');
   assert.equal($(id+'-error').hidden,false);assert($(id+'-error').textContent);
   assert.equal($(id).getAttribute('aria-describedby'),id+'-error');
  }
 }
 change('customer-name','  José & Hijos 🧁  ');assert.equal($('customer-name-error').hidden,true);
 $('checkout-email-btn').click();assert.equal(d.activeElement,$('customer-city'));assert.equal(opened.length,0);assert.deepEqual(errors,[]);
 assert.equal($('customer-name').value,'  José & Hijos 🧁  ');
 change('customer-city','  Ñuñoa  ');assert.equal($('customer-city-error').hidden,true);
 change('customer-notes','  Retiro & consulta #1  ');
 $('checkout-wa-btn').click();assert.equal(opened.length,1);
 let url=new URL(opened[0][0]),message=url.searchParams.get('text');
 assert.equal(url.origin+url.pathname,'https://wa.me/56930332416');
 assert.match(message,/Nombre \/ Negocio:\* José & Hijos 🧁\n/);assert.match(message,/Comuna \/ Ciudad:\* Ñuñoa\n/);
 assert.match(message,/Nota adicional:\* Retiro & consulta #1\n/);assert.equal(message,w.buildOrderMessage());
 assert.equal(opened[0][2],'noopener,noreferrer');
 // Notes remain optional. Revalidation also catches fields cleared without an input event.
 $('customer-name').value='';$('checkout-email-btn').click();assert.equal(d.activeElement,$('customer-name'));assert.deepEqual(errors,[]);
 change('customer-name','Ana');change('customer-notes','');$('checkout-email-btn').click();
 assert.equal(opened.length,1);
 // JSDOM reports attempted navigation; the browser QA inspects the exact mailto URL.
 assert.equal(errors.length,1);assert.match(errors[0],/Not implemented: navigation/);
 assert(!w.buildOrderMessage().includes('Nota adicional:'));
 errors.length=0;
 // A submit without a submitter (keyboard default) follows the WhatsApp path.
 $('cart-footer-view').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(opened.length,2);
 assert.equal(new URL(opened[1][0]).searchParams.get('text'),w.buildOrderMessage());assert.deepEqual(errors,[]);
 w.close();console.log('OK H5: etiquetas persistentes, ambos canales bloquean vacíos/espacios, foco y errores asociados, corrección, datos conservados, notas opcionales y mensaje codificado.');
})().catch(error=>{console.error(error);process.exit(1);});
