const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
class Loader extends ResourceLoader{fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from('window.KP_CONFIG={enabled:false}'));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 const custom=$('custom-modal'),detail=$('product-detail-modal'),cart=$('cart-drawer');
 assert(custom.hidden);assert(custom.hasAttribute('inert'));assert.equal($('modal-product-img').hasAttribute('src'),false);
 for(const card of d.querySelectorAll('.product-card')){const img=card.querySelector('.product-card-media img');assert(img.alt.includes(card.querySelector('.product-card-title').textContent));assert(img.alt.length>20);}
 for(const category of d.querySelectorAll('[data-hero-category]')){
  assert.equal(category.querySelector('img').alt,'');assert(category.querySelector('span').textContent.trim());
  category.click();await new Promise(resolve=>setImmediate(resolve));assert($('eh-photo').alt.length>25);
 }
 const press=(key,shift=false)=>d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key,shiftKey:shift,bubbles:true,cancelable:true}));
 const card=d.querySelector('[data-product-id="bagasse-pollo-1"]'),opener=card.querySelector('.btn-view-product');
 const preserved=d.createElement('div');preserved.setAttribute('inert','');d.body.append(preserved);
 d.body.style.overflow='clip';opener.focus();opener.click();assert.equal(detail.getAttribute('aria-hidden'),'false');
 card.querySelector('[data-action="customize"]').click();assert(!detail.open);assert.equal(detail.getAttribute('aria-hidden'),'true');
 assert.equal(custom.hidden,false);assert(!custom.hasAttribute('inert'));assert.equal(custom.getAttribute('aria-hidden'),'false');assert.equal(d.activeElement,$('close-modal-btn'));
 assert($('open-cart-btn').closest('[inert]'));assert.match($('modal-product-img').alt,/Caja para pollo.*Fibra/);
 assert($('modal-variant-group').hidden);assert($('modal-variant-select').disabled);assert($('modal-quantity-input').disabled);assert.equal($('modal-bulk-quantity').value,'200');
 $('open-cart-btn').focus();assert.equal(d.activeElement,$('close-modal-btn'));
 press('Tab',true);assert.equal(d.activeElement,custom.querySelector('button[type="submit"]'));press('Tab');assert.equal(d.activeElement,$('close-modal-btn'));
 // A drag beginning inside the form must not be interpreted as a backdrop tap.
 $('modal-bulk-quantity').dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));custom.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));assert.equal(custom.hidden,false);
 custom.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));custom.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));assert(custom.hidden);assert.equal(custom.getAttribute('aria-hidden'),'true');assert(custom.hasAttribute('inert'));assert.equal(d.activeElement,opener);assert.equal(d.body.style.overflow,'clip');assert(preserved.hasAttribute('inert'));assert(!$('open-cart-btn').closest('[inert]'));
 assert.equal($('modal-product-name').textContent,'');assert.equal($('modal-product-img').hasAttribute('src'),false);
 opener.click();card.querySelector('[data-action="customize"]').click();$('custom-product-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert(custom.hidden);assert(cart.open);assert.equal(custom.getAttribute('aria-hidden'),'true');assert.equal(cart.getAttribute('aria-hidden'),'false');
 $('cart-items-container').querySelector('[data-action="remove"]').click();assert($('cart-footer-view').hidden);assert($('cart-summary').hidden);assert.equal($('cart-items-container').querySelectorAll('.cart-item').length,0);
 $('close-cart-btn').click();assert.equal(d.activeElement,opener);assert.equal(d.body.style.overflow,'clip');
 // Switch to a different quantity control without retaining compostable helpers.
 const beer=d.querySelector('[data-product-id="beer-wrap-4x330"]');beer.querySelector('.btn-view-product').click();beer.querySelector('[data-action="customize"]').click();assert.equal($('modal-bulk-quantity').value,'');assert($('modal-bulk-quantity').disabled);assert.equal($('modal-order-price').textContent,'');assert.equal($('modal-bulk-help').textContent,'');assert.equal($('modal-variant-select').disabled,false);
 assert([...$('modal-quantity-input').options].every(option=>!option.textContent.includes('o más')&&!option.textContent.includes('recomendado')));
 $('close-modal-btn').focus();press('Escape');assert(custom.hidden);assert(!custom.contains(d.activeElement));
 assert.deepEqual(errors,[]);w.close();console.log('OK prelanzamiento: alt de catálogo/hero, miniaturas decorativas, ocultación y foco, fondo inerte, toque/arrastre, scroll, transición al carrito, vaciado y controles de cantidad sin datos residuales.');
})().catch(error=>{console.error(error);process.exit(1);});
