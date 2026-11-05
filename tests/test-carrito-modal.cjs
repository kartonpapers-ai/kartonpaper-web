const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
class Loader extends ResourceLoader{fetch(url){const u=new URL(url);if(u.hostname!=='kp.test'||!u.pathname.endsWith('.js'))return null;if(u.pathname==='/data/config.js')return Promise.resolve(Buffer.from('window.KP_CONFIG={enabled:false}'));return Promise.resolve(Buffer.from(read(u.pathname.slice(1))));}}
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('index.html'),{url:'https://kp.test/',runScripts:'dangerously',resources:new Loader(),virtualConsole:vc,beforeParse(w){w.matchMedia=()=>Object.assign(new w.EventTarget(),{matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};}});
 const w=dom.window,d=w.document,$=id=>d.getElementById(id);await new Promise(r=>w.addEventListener('load',r,{once:true}));await new Promise(r=>setTimeout(r,30));
 const dialog=$('cart-drawer'),opener=$('open-cart-btn'),close=$('close-cart-btn');
 const press=(key,shift=false)=>{const e=new w.KeyboardEvent('keydown',{key,shiftKey:shift,bubbles:true,cancelable:true});d.activeElement.dispatchEvent(e);return e;};
 assert.equal(dialog.tagName,'DIALOG');assert.equal(dialog.open,false);assert.equal(dialog.getAttribute('aria-labelledby'),'cart-title');
 const preserved=d.createElement('div');preserved.setAttribute('inert','');d.body.append(preserved);
 d.body.style.overflow='clip';opener.focus();opener.click();assert(dialog.open);assert.equal(d.activeElement,close);assert.equal(d.body.style.overflow,'hidden');assert(opener.closest('[inert]'));assert.equal(dialog.getAttribute('aria-hidden'),'false');
 assert(press('Tab',true).defaultPrevented);assert.equal(d.activeElement,$('empty-catalog-btn'));assert(press('Tab').defaultPrevented);assert.equal(d.activeElement,close);
 // Programmatic focus cannot escape the fallback either.
 opener.focus();assert.equal(d.activeElement,close);
 opener.click();press('Escape');assert(!dialog.open);assert.equal(d.activeElement,opener);assert.equal(d.body.style.overflow,'clip');assert(!opener.closest('[inert]'));assert(preserved.hasAttribute('inert'));
 opener.click();dialog.dispatchEvent(new w.Event('cancel',{cancelable:true}));assert(!dialog.open);assert.equal(d.activeElement,opener);
 // Add via the detail modal and return to its original opener on close.
 const card=d.querySelector('[data-product-id="beer-maleta-3x330"]'),trigger=card.querySelector('.btn-view-product');trigger.focus();trigger.click();card.querySelector('[data-action="add-stock"]').click();assert(dialog.open);assert(!$('product-detail-modal').open);
 close.focus();press('Tab',true);assert.equal(d.activeElement,$('checkout-email-btn'));press('Tab');assert.equal(d.activeElement,close);
 let plus=dialog.querySelector('[data-action="plus"]');plus.focus();plus.click();assert(dialog.contains(d.activeElement));assert.equal(d.activeElement.dataset.action,'plus');assert.equal(d.activeElement.dataset.index,'0');
 const remove=dialog.querySelector('[data-action="remove"]');remove.focus();remove.click();assert.equal(d.activeElement,$('empty-catalog-btn'));assert.equal($('cart-footer-view').hidden,true);close.focus();press('Tab',true);assert.equal(d.activeElement,$('empty-catalog-btn'));
 close.click();assert.equal(d.activeElement,trigger);assert.equal(d.body.style.overflow,'clip');
 // Personalization closes before the cart and retains its original opener.
 trigger.focus();trigger.click();card.querySelector('[data-action="customize"]').click();assert($('custom-modal').classList.contains('open'));$('custom-product-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert(dialog.open);assert(!$('custom-modal').classList.contains('open'));close.click();assert.equal(d.activeElement,trigger);
 // Detached openers fall back to the header cart button.
 const transient=d.createElement('button');d.body.append(transient);transient.focus();w.KP_CART_MODAL.open(transient);transient.remove();close.click();assert.equal(d.activeElement,opener);
 opener.click();dialog.dispatchEvent(new w.Event('close'));assert(dialog.open); // stale close event must not close a reopened dialog
 w.KP_CART_MODAL.close();assert.equal(dialog.getAttribute('aria-hidden'),'true');assert.equal(errors.length,0,errors.join('\n'));w.close();console.log('OK H3: diálogo, Tab/Shift+Tab vacío/con productos, Escape/cancel, foco al actualizar/eliminar, retorno, fondo inerte y scroll restaurados.');
})().catch(error=>{console.error(error);process.exit(1);});
