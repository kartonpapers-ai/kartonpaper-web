const {JSDOM}=require('jsdom');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://kp.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,doc=w.document,timers=new Map();let next=0,hidden=false,intersection;
 const preference=new w.EventTarget();preference.matches=false;w.matchMedia=()=>preference;
 w.setTimeout=(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id;};w.clearTimeout=id=>timers.delete(id);
 Object.defineProperty(doc,'hidden',{get:()=>hidden});
 w.IntersectionObserver=class{constructor(fn){intersection=fn;}observe(){}disconnect(){}};
 w.eval(fs.readFileSync(path.join(root,'js/hero-editorial.js'),'utf8'));
 const stop=w.KP_EDITORIAL.init({products:[],openCustomizer(){}});
 const selected=()=>doc.querySelector('[data-hero-category][aria-pressed="true"]').dataset.heroCategory;
 function tick(){assert.equal(timers.size,1);const [id,timer]=timers.entries().next().value;assert.equal(timer.ms,3000);timers.delete(id);timer.fn();}
 assert.equal(selected(),'reposteria');
 assert.equal(doc.getElementById('hero-slider-section').classList.contains('eh-campaign'),true);
 assert.match(doc.querySelector('.eh-headline').textContent,/Dulces por dentro/);
 assert.match(doc.getElementById('eh-photo-mobile').getAttribute('srcset'),/mixed-media-vertical.webp$/);
 assert.match(doc.getElementById('eh-quote').href,/cajas/);
 assert.match(doc.getElementById('eh-photo').src,/cajas-alfajores-mixed-media-escritorio.webp$/);
 assert.match(doc.getElementById('eh-caption').textContent,/3, 4 y 6 alfajores/);
 tick();
 assert.equal(doc.getElementById('hero-slider-section').classList.contains('eh-campaign'),true);
 assert.match(doc.getElementById('eh-photo-mobile').getAttribute('srcset'),/compostables-kp-movil.webp$/);
 assert.match(doc.getElementById('eh-photo').src,/compostables-kp-escritorio.webp$/);
 assert.match(doc.getElementById('eh-quote').href,/bagazo/);
 assert.match(doc.getElementById('eh-caption').textContent,/solo en la tapa/);
 assert.equal(doc.querySelector('.eh-headline').textContent,'Tu cocina.Tu marca.Tu envase.');
 assert.equal(selected(),'gastronomia');assert.equal(doc.getElementById('eh-support').parentElement.getAttribute('aria-live'),'off');
 for(const category of ['bolsas','doypack','cerveza','posavasos','reposteria']){
  tick();assert.equal(selected(),category);
  if(category==='posavasos'){
   assert.match(doc.getElementById('eh-photo').src,/posavasos-mixed-media-escritorio.webp$/);
   assert.match(doc.getElementById('eh-photo-mobile').getAttribute('srcset'),/posavasos-mixed-media-movil.webp$/);
   assert.match(doc.getElementById('eh-quote').href,/posavasos/);
   assert.equal(doc.getElementById('eh-explore-label').textContent,'Ver posavasos');
   assert.equal(doc.getElementById('hero-slider-section').classList.contains('eh-posavasos'),true);
  }
 }
 assert.equal(doc.getElementById('hero-slider-section').classList.contains('eh-posavasos'),false);
 assert.match(doc.getElementById('eh-photo-mobile').getAttribute('srcset'),/mixed-media-vertical.webp$/);
 doc.getElementById('eh-pause').click();assert.equal(timers.size,0);assert.equal(doc.getElementById('eh-pause').getAttribute('aria-pressed'),'true');
 doc.getElementById('eh-pause').click();tick();assert.equal(selected(),'gastronomia');
 const hero=doc.getElementById('hero-slider-section');hero.dispatchEvent(new w.Event('mouseenter'));assert.equal(timers.size,0);hero.dispatchEvent(new w.Event('mouseleave'));assert.equal(timers.size,1);
 hidden=true;doc.dispatchEvent(new w.Event('visibilitychange'));assert.equal(timers.size,0);hidden=false;doc.dispatchEvent(new w.Event('visibilitychange'));assert.equal(timers.size,1);
 intersection([{isIntersecting:false}]);assert.equal(timers.size,0);intersection([{isIntersecting:true}]);assert.equal(timers.size,1);
 const button=doc.querySelector('[data-hero-category="cerveza"]');button.focus();assert.equal(timers.size,0);button.click();assert.equal(selected(),'cerveza');assert.equal(timers.size,0);assert.equal(doc.getElementById('eh-support').parentElement.getAttribute('aria-live'),'polite');button.blur();await Promise.resolve();assert.equal(timers.size,1);
 preference.matches=true;preference.dispatchEvent(new w.Event('change'));assert.equal(timers.size,0);assert.equal(doc.getElementById('eh-pause').disabled,true);
 preference.matches=false;preference.dispatchEvent(new w.Event('change'));assert.equal(timers.size,1);
 stop();assert.equal(timers.size,0);dom.window.close();console.log('OK rotación: 3 segundos, seis categorías, pausa, foco, puntero, visibilidad, movimiento reducido y limpieza.');
})().catch(error=>{console.error(error);process.exit(1);});
