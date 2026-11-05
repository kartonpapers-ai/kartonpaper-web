const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),scope={window:{}};vm.createContext(scope);vm.runInContext(read('js/carrito-resumen.js'),scope);const calc=scope.window.KP_CART_SUMMARY;
const pack={name:'Pack',qty:2,totalNet:17500,isCustom:false};let r=calc.calculate([pack]);assert.equal(r.net,35000);assert.equal(r.iva,6650);assert.equal(r.total,41650);
const quote={name:'Logo',qty:100,isCustom:true,totalNet:39100,price:'$391 + IVA c/u'};r=calc.calculate([pack,quote,{name:'Souvenir',qty:2,stockUnits:20,stockUnitPrice:1000}]);assert.equal(r.total,44030);assert.equal(r.pending.length,1);assert.equal(r.priced.length,2);
assert.equal(calc.lineNet({qty:2,variant:'Dorado metalizado (Pack 500 u. $61.500 + IVA)',price:'$12.300 + IVA (Pack 100 u.)'}),123000);
assert.equal(calc.lineNet({qty:1,variant:'Pack 50 u. ($17.500)'}),17500);
assert.equal(calc.lineNet({qty:1,variant:'Con logo',price:'$123 + IVA c/u'}),null);
for(const value of [NaN,Infinity,-1,1.5,'100'])assert.equal(calc.lineNet({qty:1,totalNet:value}),null);
assert.equal(calc.lineNet({...pack,qty:0}),null);assert.equal(calc.lineNet({...pack,qty:1e15}),null);assert.equal(calc.lineNet({qty:1,variant:'Dorado (Pack 500 u. $61.50 + IVA)'}),null);
r=calc.calculate([{qty:1,totalNet:1},{qty:1,totalNet:1},{qty:1,totalNet:1}]);assert.equal(r.net,3);assert.equal(r.iva,1);assert.equal(r.total,4);
r=calc.calculate([{qty:1,totalNet:Number.MAX_SAFE_INTEGER}]);assert(r.overflow);assert.equal(r.total,null);
assert.equal(calc.calculate([quote]).priced.length,0);assert.equal(calc.lineNet({qty:1,totalNet:0}),0);
class Loader extends ResourceLoader{fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from('window.KP_CONFIG={enabled:false}'));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};}});const w=dom.window,d=w.document,$=id=>d.getElementById(id);await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal($('cart-summary').hidden,true);
 const card=d.querySelector('[data-product-id="reposteria-caja-3-alfajores"]');card.querySelectorAll('.variant-btn')[1].click();card.querySelector('[data-action="add-stock"]').click();
 assert.equal($('cart-summary').hidden,false);assert.equal($('cart-pending-summary').hidden,true);assert.equal($('cart-net').textContent,'$17.500');assert.equal($('cart-iva').textContent,'$3.325');assert.equal($('cart-total').textContent,'$20.825');
 $('cart-drawer').querySelector('[data-action="plus"]').click();assert.equal($('cart-total').textContent,'$41.650');let text=w.buildOrderMessage();assert.match(text,/Subtotal neto: \$35\.000/);assert.match(text,/Total con IVA: \$41\.650/);
 w.addToCart({...quote,id:'test-quote',variant:'100 unidades',image:'images/test.webp',logoFile:'logo.png'});assert.equal($('cart-total').textContent,'$41.650');assert.equal($('cart-pending-summary').hidden,false);assert.match($('cart-summary-note').textContent,/solo/);assert.match($('cart-pending-items').textContent,/Logo · 100 unidades/);text=w.buildOrderMessage();assert.match(text,/SOLICITUDES POR COTIZAR/);assert.match(text,/no incluidas en el total/);assert.match(text,/Despacho Starken por pagar/);assert(!text.includes('39.100'));assert.equal((text.match(/IVA \(19%\)/g)||[]).length,1);
 // Both outbound channels use the same summary; intercept instead of sending.
 $('customer-name').value='Cliente de prueba';$('customer-city').value='Santiago';text=w.buildOrderMessage();
 let url='';w.open=value=>url=value;$('checkout-wa-btn').click();assert.equal(new URL(url).searchParams.get('text'),text);
 const priced=$('cart-items-container').querySelector('[data-action="remove"]');priced.click();assert.equal($('cart-priced-summary').hidden,true);assert.match($('cart-pending-note').textContent,/total.*confirmará/);text=w.buildOrderMessage();assert(!text.includes('Total con IVA: $0'));assert(!text.includes('Subtotal neto:'));assert.match(text,/total por confirmar/);
 $('cart-items-container').querySelector('[data-action="remove"]').click();assert.equal($('cart-summary').hidden,true);assert.equal($('cart-footer-view').hidden,true);
 const metal=d.querySelector('[data-product-id="reposteria-papel-metalizado"]');metal.querySelectorAll('.variant-btn')[2].click();metal.querySelector('[data-action="add-stock"]').click();assert.equal($('cart-net').textContent,'$61.500');assert.match($('cart-items-container').querySelector('.cart-item-price').textContent,/61\.500/);assert.match(w.buildOrderMessage(),/Subtotal neto: \$61\.500/);
 assert.deepEqual(errors,[]);w.close();console.log('OK H4: packs/cajas/variantes, cantidades, IVA agregado, mixto, solo cotización, totales de pantalla/mensaje, despacho, vaciado e importes inválidos.');
})().catch(error=>{console.error(error);process.exit(1);});
