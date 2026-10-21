(function(){
 'use strict';
 const defaults={"reposteria": {"label": "Repostería", "image": "images/reposteria-caja-6-alfajores.webp", "support": "El sabor conquista. La presentación invita.", "intro": "Cajas para alfajores, personalizadas con tu logo.", "detail": "Caja con ventana · 6 alfajores"}, "gastronomia": {"label": "Gastronomía", "image": "images/bagasse-caja-pollo-1.webp", "support": "Tu cocina tiene identidad. Tu envase también.", "intro": "Envases de bagazo de caña con personalización en la tapa.", "detail": "Bagazo de caña · Caja Pollo 1"}, "bolsas": {"label": "Bolsas", "image": "images/bolsa-papel-kraft-asa-plana.webp", "support": "Que tu marca acompañe cada entrega.", "intro": "Bolsas de papel kraft y blancas, personalizadas con tu logo.", "detail": "Papel kraft · Asa plana"}, "doypack": {"label": "Doypack", "image": "images/doypack-kraft-ventana.webp", "support": "Una buena presentación empieza por fuera.", "intro": "Doypack kraft con ventana y cierre zip, personalizados.", "detail": "Kraft con ventana · Cierre zip"}, "cerveza": {"label": "Cerveza", "image": "images/beer-maleta-3x330-approved.webp", "support": "Tu cerveza tiene carácter. Su caja también.", "intro": "Packs personalizados para tu cerveza artesanal.", "detail": "Maleta kraft · 3 botellas de 330 cc"}, "posavasos": {"label": "Posavasos", "image": "images/posavasos-chile-souvenir.webp", "support": "Pequeños detalles. Una marca que se recuerda.", "intro": "Posavasos de pulpa absorbente con tu gráfica.", "detail": "Pulpa absorbente · Gráfica personalizada"}};
 Object.assign(defaults.reposteria,{
  campaign:true,
  thumbnail:'images/reposteria-caja-6-alfajores.webp',
  image:'images/campanas/cajas-alfajores-mixed-media/hero/cajas-alfajores-mixed-media-escritorio.webp',
  mobileImage:'images/campanas/cajas-alfajores-mixed-media/vertical/cajas-alfajores-mixed-media-vertical.webp',
  headline:['Dulces por dentro.','Inolvidables','por fuera.'],
  support:'Cajas que le dan protagonismo a tus alfajores.',
  intro:'Cartulina blanca con visor de mica. Formatos para 3, 4 y 6 alfajores.',
  detail:'Cajas con visor · 3, 4 y 6 alfajores',
  alt:'Cajas de cartulina blanca con visor de mica para 3, 4 y 6 alfajores, acompañadas de pequeños pasteleros ilustrados.',
  quoteLabel:'Cotizar cajas',quoteSubject:'cajas de cartulina con visor para 3, 4 y 6 alfajores',
  exploreLabel:'Ver repostería'
 });
 let entries={...defaults},selected='reposteria',hooks={},animations=[],paused=false,run=0;
 const section=()=>document.getElementById('hero-slider-section');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const el=id=>document.getElementById('eh-'+id);
 const buttons=()=>section().querySelectorAll('[data-hero-category]');
 function cancel(){run++;animations.forEach(a=>a.cancel());animations=[];}
 async function animate(intro=false){
  cancel();if(reduced.matches||!Element.prototype.animate)return;
  const easing='cubic-bezier(.16,1,.3,1)';
  if(intro)section().querySelectorAll('.eh-line-inner').forEach((line,i)=>animations.push(line.animate([{transform:'translateY(105%)',filter:'blur(3px)'},{transform:'translateY(0)',filter:'blur(0)'}],{duration:1800,delay:i*260,easing,fill:'backwards'})));
  animations.push(el('photo').animate([{transform:'translateY(18px) scale(.97)',opacity:.35},{transform:'translateY(0) scale(1)',opacity:1}],{duration:intro?2400:1600,easing,fill:'backwards'}));
  if(!intro)for(const id of ['support','intro'])animations.push(el(id).animate([{opacity:.3,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:1200,easing}));
  if(paused)animations.forEach(a=>a.pause());
 }
 function choose(category,motion=false,automatic=false){
  if(!entries[category])return;selected=category;const p=entries[category];
  el('support').parentElement.setAttribute('aria-live',automatic?'off':'polite');
  section().classList.toggle('eh-campaign',Boolean(p.campaign));
  section().querySelectorAll('.eh-line-inner').forEach((line,i)=>{line.textContent=(p.headline||['Tu marca','merece','ser vista.'])[i];});
  const mobile=el('photo-mobile');
  if(mobile){if(p.mobileImage)mobile.srcset=p.mobileImage;else mobile.removeAttribute('srcset');}
  el('quote-label').textContent=p.quoteLabel||'Cotizar con mi logo';
  el('photo').width=p.campaign?1942:1100;el('photo').height=p.campaign?809:1000;
  el('photo').src=p.image;el('photo').alt=p.alt||p.detail;el('support').textContent=p.support;el('intro').textContent=p.intro;el('caption').textContent=p.detail;
  el('quote').href='https://wa.me/56930332416?text='+encodeURIComponent('Hola, quiero cotizar '+(p.quoteSubject||p.label.toLowerCase())+' con mi logo.');
  el('explore-label').textContent=p.action?.label||p.exploreLabel||'Explorar envases';
  buttons().forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.heroCategory===category));button.querySelector('img').src=entries[button.dataset.heroCategory].thumbnail||entries[button.dataset.heroCategory].image;});
  if(motion)animate();
 }
 function render(rows,products){
  const active=rows.filter(row=>window.KP_HERO.visible(row,products));entries={...defaults};const assigned=new Set();
  for(const row of active){
   const p=row.data;
   // This composition uses separate product photos on white, never full scene backgrounds.
   if(p.layout!=='layered'||p.background?.kind!=='solid'||p.background.color.toLowerCase()!=='#ffffff')continue;
   const action=p.primary;
   const category=action.kind==='categoria'?action.target:products.find(product=>product.id===action.target)?.category;
   if(!defaults[category]||assigned.has(category))continue;assigned.add(category);
   entries[category]={...defaults[category],campaign:false,mobileImage:null,headline:null,quoteLabel:null,quoteSubject:null,exploreLabel:null,image:p.image,alt:p.alt,detail:p.alt,support:[p.title,p.highlight].filter(Boolean).join(' '),intro:p.lead,action};
  }
  section().hidden=false;section().dataset.ready='true';choose(selected);return active;
 }
 function init(options){
  hooks=options;const events=new AbortController();let disposed=false,timer=null,hovered=false,inView=true;
  const stop=()=>{clearTimeout(timer);timer=null;};
  function sync(){stop();if(!disposed&&!paused&&!reduced.matches&&!document.hidden&&!hovered&&inView&&!section().contains(document.activeElement))timer=setTimeout(()=>{const order=Object.keys(entries);choose(order[(order.indexOf(selected)+1)%order.length],true,true);sync();},3000);}
  function label(){el('pause').disabled=reduced.matches;el('pause').textContent=paused?'Reanudar':'Pausar';el('pause').setAttribute('aria-pressed',String(paused));el('pause').setAttribute('aria-label',paused?'Reanudar rotación automática del hero':'Pausar rotación automática del hero');}
  const listen=(target,type,handler)=>target.addEventListener(type,handler,{signal:events.signal});
  buttons().forEach(button=>listen(button,'click',()=>{choose(button.dataset.heroCategory,true);sync();}));
  listen(el('replay'),'click',()=>{animate(true);sync();});
  listen(el('pause'),'click',()=>{if(el('pause').disabled)return;paused=!paused;animations.forEach(a=>paused?a.pause():a.play());label();sync();});
  listen(reduced,'change',()=>{if(reduced.matches)cancel();label();sync();});
  listen(section(),'mouseenter',()=>{hovered=true;sync();});
  listen(section(),'mouseleave',()=>{hovered=false;sync();});
  listen(section(),'focusin',sync);listen(section(),'focusout',()=>queueMicrotask(sync));
  listen(document,'visibilitychange',sync);
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync();}):null;observer?.observe(section());
  listen(el('explore'),'click',event=>{
   event.preventDefault();const action=entries[selected].action||{kind:'categoria',target:selected};
   const behavior=reduced.matches?'auto':'smooth';
   if(action.kind==='whatsapp'){el('quote').click();return;}
   const product=hooks.products.find(p=>p.id===action.target);
   if(action.kind==='personalizar'&&product&&product.type!=='stock'){hooks.openCustomizer(product);return;}
   const category=action.kind==='categoria'?action.target:product?.category||selected;
   document.querySelector(`.filter-tab[data-category="${category}"]`)?.click();
   document.getElementById('catalogo').scrollIntoView({behavior});
   if(action.kind==='producto'&&product){const control=document.querySelector(`[data-action][data-id="${product.id}"]`);control?.closest('.product-card')?.scrollIntoView({behavior,block:'center'});control?.focus({preventScroll:true});}
  });
  choose(selected);label();sync();
  (document.fonts?.ready||Promise.resolve()).then(()=>{if(!disposed)animate(true);});
  return ()=>{disposed=true;stop();cancel();observer?.disconnect();events.abort();};
 }
 window.KP_EDITORIAL=Object.freeze({render,init});
})();
