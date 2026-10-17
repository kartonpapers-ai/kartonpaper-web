(function () {
 "use strict";
 const categories=['all','cerveza','reposteria','gastronomia','bolsas','doypack','posavasos'];
 const escape=v=>window.KP_CATALOG.escape(v);
 function validate(p) {
  if (!p || typeof p!=='object') throw new Error('Campaña inválida.');
  for (const f of ['title','lead','image','alt']) if(typeof p[f]!=='string'||!p[f].trim()||p[f].length>500) throw new Error('Completa el campo '+f+'.');
  if(p.title.length>120)throw new Error('El título admite hasta 120 caracteres.');
  for(const f of ['highlight','badge','badgeStatus'])if(typeof p[f]!=='string'||p[f].length>120)throw new Error('Revisa los textos breves.');
  if(!/^images\/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$/.test(p.image)) {
   const c=window.KP_CATALOG.configuration(),prefix=c&&c.supabaseUrl.replace(/\/$/,'')+'/storage/v1/object/public/';
   if(!prefix||!p.image.startsWith(prefix)||!/^kp-(heroes|productos)\/[a-z0-9-]+\.webp$/.test(p.image.slice(prefix.length)))throw new Error('Selecciona una imagen del hero o sube una nueva.');
  }
  if(!Array.isArray(p.trust)||p.trust.length>3||p.trust.some(x=>typeof x!=='string'||!x.trim()||x.length>120))throw new Error('Usa hasta tres características, una por línea.');
  for(const f of ['primary','secondary']) {
   const a=p[f];if(f==='secondary'&&a===null)continue;
   if(!a||typeof a.label!=='string'||!a.label.trim()||a.label.length>100||typeof a.target!=='string')throw new Error('Completa el botón '+(f==='primary'?'principal':'secundario')+'.');
   if(!['categoria','producto','personalizar','whatsapp'].includes(a.kind)|| (a.kind==='categoria'&&!categories.includes(a.target)) || (['producto','personalizar'].includes(a.kind)&&!/^[a-z0-9-]+$/.test(a.target)) || (a.kind==='whatsapp'&&a.target!==''))throw new Error('Revisa el destino del botón.');
  }
  if(p.layout!==undefined&&!['scene','layered'].includes(p.layout))throw new Error('Composición inválida.');
  if(p.layout==='layered') {
   const b=p.background,pos=p.product;
   if(!b||!['solid','gradient'].includes(b.kind)||!/^#[0-9a-fA-F]{6}$/.test(b.color)||!/^#[0-9a-fA-F]{6}$/.test(b.color2))throw new Error('Revisa los colores del fondo.');
   if(pos?.shadow!==undefined&&typeof pos.shadow!=='boolean')throw new Error('Sombra de producto inválida.');
   const bounds={size:[25,80],x:[55,85],mobileSize:[50,100],mobileX:[35,65]};
   for(const [key,[min,max]]of Object.entries(bounds))if(!pos||!Number.isInteger(pos[key])||pos[key]<min||pos[key]>max)throw new Error('Revisa el tamaño y la posición del producto.');
  }
  if(p.colors!==undefined){if(!p.colors||typeof p.colors!=='object'||['title','text','accent','button','buttonText'].some(k=>!/^#[0-9a-fA-F]{6}$/.test(p.colors[k])))throw new Error('Colores de campaña inválidos.');}
  return p;
 }
 function visible(row,products,now=Date.now()) {
  return row.published && (!row.starts_at||Date.parse(row.starts_at)<=now) && (!row.ends_at||Date.parse(row.ends_at)>now) && ['primary','secondary'].every(f=>{
   const a=row.data[f];return !a||!['producto','personalizar'].includes(a.kind)||products.some(p=>p.id===a.target&&(a.kind!=='personalizar'||p.type!=='stock'));
  });
 }
 function button(a,secondary=false) {
  if(!a)return '';
  const cls=secondary?'btn-secondary':'btn-primary';
  if(a.kind==='whatsapp')return `<a class="${cls}" href="https://wa.me/56930332416" target="_blank" rel="noopener noreferrer">${escape(a.label)}</a>`;
  const action={categoria:'filter-cat',producto:'view-product',personalizar:'customize-product'}[a.kind];
  return `<button class="${cls}" type="button" data-hero-action="${action}" data-target="${escape(a.target)}">${escape(a.label)} <span aria-hidden="true">→</span></button>`;
 }
 function slide(p,index=0) {
  validate(p); const tag=index===0?'h1':'h2';
  const layered=p.layout==='layered';
  const background=layered ? (p.background.kind==='gradient' ? `linear-gradient(120deg, ${p.background.color}, ${p.background.color2})` : p.background.color) : '';
  const vars=[];
  if(layered)vars.push(`--hero-background:${background}`,`--product-shadow:${p.product.shadow===false?'none':'drop-shadow(0 18px 20px rgba(30,45,38,.14))'}`,`--product-size:${p.product.size}%`,`--product-x:${p.product.x}%`,`--mobile-size:${p.product.mobileSize}%`,`--mobile-x:${p.product.mobileX}%`);
  if(p.colors)for(const key of ['title','text','accent','button','buttonText'])vars.push(`--hero-${key}:${p.colors[key]}`);
  const style=vars.length?` style="${vars.join(';')}"`:'';

  return `<div class="hero-slide${layered?' hero-layered':''}${p.colors?' hero-colors':''}${index===0?' active':''}" aria-hidden="${index!==0}"${index!==0?' inert':''} data-slide-index="${index}"${style}><div class="hero-grid"><div class="hero-copy"><${tag} class="hero-title">${escape(p.title)}${p.highlight?' <span>'+escape(p.highlight)+'</span>':''}</${tag}><p class="hero-lead">${escape(p.lead)}</p><div class="hero-actions">${button(p.primary)}${button(p.secondary,true)}</div>${p.trust.length?'<div class="hero-trust-bar">'+p.trust.map(t=>'<div class="trust-item"><span class="trust-icon">✓</span> <span>'+escape(t)+'</span></div>').join('')+'</div>':''}</div><div class="hero-media-wrapper"><img src="${escape(p.image)}" alt="${escape(p.alt)}" width="1920" height="1080" decoding="async"${index===0?' fetchpriority="high"':' loading="lazy"'}>${p.badge||p.badgeStatus?'<div class="hero-media-badge"><span>'+escape(p.badge)+'</span><span>'+escape(p.badgeStatus)+'</span></div>':''}</div></div></div>`;
 }
 async function load() {
  const c=window.KP_CATALOG.configuration();if(!c)return null;
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);
  try {
   const res=await fetch(c.supabaseUrl.replace(/\/$/,'')+'/rest/v1/kp_campaigns?select=id,data,published,sort_order,starts_at,ends_at&order=sort_order.asc,id.asc',{headers:{apikey:c.publishableKey},cache:'no-store',signal:abort.signal});
   if(!res.ok)throw new Error('No se pudieron cargar las campañas.');
   const rows=await res.json();if(!Array.isArray(rows))throw new Error('Respuesta inválida.');
   const ids=new Set();for(const r of rows){validate(r.data);if(!/^[a-z0-9-]+$/.test(r.id)||ids.has(r.id))throw new Error('Campaña duplicada o inválida.');ids.add(r.id);}
   return rows;
  }finally{clearTimeout(timer);}
 }
 function render(rows,products) {
  if(document.getElementById("hero-slider-section")?.dataset.editorial)return window.KP_EDITORIAL.render(rows,products);
  const section=document.getElementById('hero-slider-section'),carousel=section.querySelector('.hero-carousel'),controls=carousel.querySelector('.hero-controls');
  carousel.querySelectorAll('.hero-slide').forEach(x=>x.remove());
  section.dataset.ready="true";
  const active=rows.filter(r=>visible(r,products));section.hidden=!active.length;
  active.forEach((r,i)=>controls.insertAdjacentHTML('beforebegin',slide(r.data,i)));
  document.getElementById('hero-dots').innerHTML=active.map((r,i)=>`<button class="hero-dot${i===0?' active':''}" type="button" data-dot-index="${i}" aria-label="Ver ${escape(r.data.title)}"${i===0?' aria-current="true"':''}></button>`).join('');
  controls.hidden=active.length<2;
  return active;
 }
 window.KP_HERO=Object.freeze({validate,visible,slide,load,render});
})();
