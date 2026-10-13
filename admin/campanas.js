(async function () {
 "use strict";
 const $=id=>document.getElementById(id),status=(id,text,kind='')=>{$(id).textContent=text;$(id).className=kind;};
 const categories={all:'Todo el catálogo',cerveza:'Cerveza',reposteria:'Repostería',gastronomia:'Gastronomía',bolsas:'Bolsas',doypack:'Doypack',posavasos:'Posavasos'};
 let client,rows=[],products=[],selected=null,dirty=false,saving=false,activeUser=null,pending=null,imageBusy=false,revision=0,mobile=false,previewTimer;
 const mayDiscard=()=>!dirty||window.confirm('Tienes cambios sin guardar. ¿Quieres descartarlos?');
 const resetImage=()=>{if(pending?.preview)URL.revokeObjectURL(pending.preview);revision++;pending=null;imageBusy=false;$('hero-file').value='';status('image-status','');};
 function setLogin(){resetImage();activeUser=null;rows=[];products=[];selected=null;dirty=false;$('workspace').hidden=true;$('login-view').hidden=false;$('logout').hidden=true;$('campaign-form').hidden=true;$('preview-section').hidden=true;$('campaign-list').replaceChildren();$('campaign-form').reset();$('preview').srcdoc='';}
 function dateInput(value){if(!value)return '';const d=new Date(value);const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
 function dateValue(id){const v=$(id).value;if(!v)return null;const d=new Date(v);if(!Number.isFinite(d.getTime()))throw new Error('Revisa las fechas.');return d.toISOString();}
 function state(row){if(!row.published)return 'Oculta';if(row.ends_at&&Date.parse(row.ends_at)<=Date.now())return 'Finalizada';if(row.starts_at&&Date.parse(row.starts_at)>Date.now())return 'Programada';return 'Activa';}
 function renderList(){
  const query=$('search').value.trim().toLocaleLowerCase('es');$('campaign-list').replaceChildren();
  const filtered=rows.filter(r=>(r.data.title+' '+r.data.highlight).toLocaleLowerCase('es').includes(query)).sort((a,b)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id));
  for(const row of filtered){const button=document.createElement('button');button.type='button';button.className='product-row';button.disabled=saving;button.setAttribute('aria-pressed',String(selected?.id===row.id));const image=document.createElement('img');image.src=row.data.image.startsWith('https://')?row.data.image:'../'+row.data.image;image.alt='';const text=document.createElement('span'),title=document.createElement('strong'),note=document.createElement('small');title.textContent=row.data.title;note.textContent=state(row)+' · orden '+row.sort_order;text.append(title,note);button.append(image,text);button.addEventListener('click',()=>{if(!saving&&mayDiscard())select(row);});$('campaign-list').append(button);}
  $('campaign-count').textContent=`${rows.length} campañas · ${rows.filter(r=>state(r)==='Activa').length} activas por fecha`;
  status('list-status',filtered.length?'':'No hay campañas que coincidan. Puedes crear una nueva.');
 }
 function targets(key,value=''){
  const kind=$(key+'-kind').value,select=$(key+'-target');select.replaceChildren();
  if(kind==='categoria')for(const [id,label] of Object.entries(categories))select.add(new Option(label,id));
  else if(kind==='producto'||kind==='personalizar'){
   select.add(new Option('Selecciona un producto',''));
   for(const p of products)if(kind!=='personalizar'||p.data.type!=='stock')select.add(new Option(p.data.name+(p.published?'':' · oculto'),p.id));
  } else select.add(new Option(kind==='whatsapp'?'WhatsApp de KartonPaper':'Sin destino',''));
  select.disabled=saving||['none','whatsapp'].includes(kind);$(key+'-label').disabled=saving||kind==='none';$(key+'-label').required=key==='primary'||kind!=='none';
  if(value)select.value=value;
 }
 function layerControls(){
  const layered=$('layout').value==='layered';$('layer-controls').hidden=!layered;
  $('background-secondary').hidden=$('background-kind').value!=='gradient';
  $('hero-file').accept=layered?'image/png,image/webp':'image/jpeg,image/png,image/webp';
  $('hero-image-help').textContent=layered?'Sube el producto recortado en PNG o WebP con transparencia real. El fondo se define con los colores de arriba. Conserva una sombra suave si forma parte del recorte. Hasta 10 MB; se convierte a WebP sin perder la transparencia. El panel no elimina fondos.':'Escena editorial completa, recomendada 1920 × 1080 px, con espacio limpio a la izquierda. JPG, PNG o WebP hasta 10 MB; se optimiza a WebP.';
  for(const key of ['product-size','product-x','mobile-size','mobile-x'])$(key+'-value').textContent=$(key).value+' %';
 }
 function select(row){
  resetImage();selected=row;dirty=false;$('editor-empty').hidden=true;$('campaign-form').hidden=false;$('preview-section').hidden=false;$('edit-heading').textContent=row.isNew?'Nueva campaña':row.data.title;$('save').textContent=row.isNew?'Crear campaña':'Guardar campaña';
  for(const f of ['title','highlight','lead','alt','badge','badgeStatus'])$(f).value=row.data[f];
  $('layout').value=row.data.layout||'scene';
  $('background-kind').value=row.data.background?.kind||'solid';$('background-color').value=row.data.background?.color||'#c3e6d0';$('background-color-2').value=row.data.background?.color2||'#f6eee5';
  for(const [id,key,defaultValue]of [['product-size','size',50],['product-x','x',75],['mobile-size','mobileSize',90],['mobile-x','mobileX',50]])$(id).value=row.data.product?.[key]??defaultValue;
  layerControls();
  $('trust').value=row.data.trust.join('\n');$('sort-order').value=row.sort_order;$('published').checked=row.published;$('starts-at').value=dateInput(row.starts_at);$('ends-at').value=dateInput(row.ends_at);
  $('existing-image').replaceChildren(new Option('Selecciona una imagen o sube una nueva',''));const seen=new Set();for(const r of rows)if(!seen.has(r.data.image)){seen.add(r.data.image);$('existing-image').add(new Option(r.data.title,r.data.image));}
  if(row.data.image&&!seen.has(row.data.image))$('existing-image').add(new Option('Imagen actual',row.data.image));$('existing-image').value=row.data.image;
  for(const key of ['primary','secondary']){const a=row.data[key];$(key+'-kind').value=a?.kind||'none';$(key+'-label').value=a?.label||'';targets(key,a?.target);}
  status('save-status','');renderList();preview();
 }
 function read(){
  const data={};for(const f of ['title','highlight','lead','alt','badge','badgeStatus'])data[f]=$(f).value.trim();
  data.image=pending?pending.url:$('existing-image').value;data.trust=$('trust').value.split('\n').map(x=>x.trim()).filter(Boolean);
  for(const key of ['primary','secondary'])data[key]=$(key+'-kind').value==='none'?null:{kind:$(key+'-kind').value,label:$(key+'-label').value.trim(),target:$(key+'-target').value};
  data.layout=$('layout').value;
  if(data.layout==='layered'){data.background={kind:$('background-kind').value,color:$('background-color').value,color2:$('background-color-2').value};data.product={size:Number($('product-size').value),x:Number($('product-x').value),mobileSize:Number($('mobile-size').value),mobileX:Number($('mobile-x').value)};}
  window.KP_HERO.validate(data);
  const order=Number($('sort-order').value);if(!$('sort-order').value.trim()||!Number.isInteger(order)||order<0||order>9999)throw new Error('Usa un orden entre 0 y 9999.');
  const starts_at=dateValue('starts-at'),ends_at=dateValue('ends-at');if(starts_at&&ends_at&&Date.parse(ends_at)<=Date.parse(starts_at))throw new Error('La fecha de término debe ser posterior al inicio.');
  for(const key of ['primary','secondary']){const a=data[key];if(a&&['producto','personalizar'].includes(a.kind)){
   const p=products.find(p=>p.id===a.target);if(!p)throw new Error('Selecciona un producto existente.');
   if($('published').checked&&!p.published)throw new Error('El producto de destino está oculto. Muéstralo en Productos antes de activar esta campaña.');
   if(a.kind==='personalizar'&&p.data.type==='stock')throw new Error('Ese producto no permite personalización.');
  }}
  return {data,published:$('published').checked,sort_order:order,starts_at,ends_at};
 }
 function resizePreview(){const height=mobile&&$('layout').value==='layered'?1100:850;const width=mobile?375:1440,scale=Math.min(1,Math.max(200,$('preview-shell').clientWidth||760)/width);$('preview').style.width=width+'px';$('preview').style.height=height+'px';$('preview').style.transform=`scale(${scale})`;$('preview-shell').style.height=Math.ceil(height*scale)+'px';}
 function preview(){
  if(!selected)return;
  try{const row=read();const data={...row.data};if(pending?.preview)data.image=pending.preview;
   // Validate the stored URL first. The local blob only replaces the image in the trusted template.
   let html=window.KP_HERO.slide(row.data);if(pending?.preview)html=html.replace(window.KP_CATALOG.escape(row.data.image),window.KP_CATALOG.escape(pending.preview));
   const base=new URL('../',window.location.href).href;
   $('preview').srcdoc=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${window.KP_CATALOG.escape(base)}"><link rel="stylesheet" href="css/styles.css"><style>body{margin:0}.hero{margin:0}</style></head><body><section class="hero"><div class="container hero-carousel">${html}</div></section></body></html>`;
   status('preview-status','');status('schedule-status',row.published?state(row)+(row.ends_at?' · termina '+new Date(row.ends_at).toLocaleString('es-CL'): ''):'Campaña oculta. Puedes revisar la vista previa antes de activarla.');resizePreview();
  }catch(error){$('preview').srcdoc='';status('preview-status',error.message);status('schedule-status','');}
 }
 function setBusy(value){saving=value;for(const input of $('campaign-form').elements)input.disabled=value;$('logout').disabled=value;$('reload').disabled=value;$('new-campaign').disabled=value;for(const key of ['primary','secondary'])if(!value)targets(key,$(key+'-target').value);renderList();}
 async function loadRows(){
  $('reload').disabled=true;$('new-campaign').disabled=true;
  try{const [campaign,product]=await Promise.all([client.from('kp_campaigns').select('id,data,published,sort_order,starts_at,ends_at,version').order('sort_order').order('id'),client.from('kp_products').select('id,data,published').order('sort_order')]);
   if(campaign.error||product.error)throw campaign.error||product.error;
   for(const r of campaign.data)window.KP_HERO.validate(r.data);rows=campaign.data;products=product.data;resetImage();selected=null;dirty=false;$('campaign-form').hidden=true;$('preview-section').hidden=true;$('editor-empty').hidden=false;
   $('draft-product').replaceChildren(new Option('Selecciona un producto visible',''));for(const p of products)if(p.published)$('draft-product').add(new Option(p.data.name,p.id));renderList();
  }catch(error){status('list-status','No se pudieron cargar las campañas. Comprueba la conexión y que ejecutaste 05-heroes.sql, y pulsa Actualizar lista.','error');}
  finally{$('reload').disabled=false;$('new-campaign').disabled=false;}
 }
 $('new-campaign').addEventListener('click',()=>{if(saving||!mayDiscard())return;select({isNew:true,id:'campana-'+crypto.randomUUID(),published:false,sort_order:Math.min(9999,Math.max(-1,...rows.map(r=>r.sort_order))+1),starts_at:null,ends_at:null,data:{layout:'layered',background:{kind:'solid',color:'#c3e6d0',color2:'#f6eee5'},product:{size:50,x:75,mobileSize:90,mobileX:50},title:'',highlight:'',lead:'',image:'',alt:'',primary:{kind:'categoria',target:'all',label:'Explorar envases'},secondary:null,trust:[],badge:'',badgeStatus:''}});dirty=true;$('title').focus();});
 $('draft-button').addEventListener('click',()=>{const p=products.find(p=>p.id===$('draft-product').value);if(!p){status('save-status','Selecciona un producto para preparar el texto.');return;}if(($('title').value||$('lead').value)&&!window.confirm('¿Reemplazar título, descripción y botón principal con los datos de este producto?'))return;$('title').value=p.data.name;$('highlight').value='';$('lead').value=p.data.subtitle;$('primary-kind').value='producto';$('primary-label').value='Ver producto';targets('primary',p.id);dirty=true;status('save-status','Texto preparado. Selecciona una escena para el hero y revisa antes de guardar.');preview();});
 $('campaign-form').addEventListener('input',()=>{layerControls();dirty=true;status('save-status','Cambios pendientes de guardar.');clearTimeout(previewTimer);previewTimer=setTimeout(preview,150);});
 $('layout').addEventListener('change',()=>{layerControls();dirty=true;preview();});$('background-kind').addEventListener('change',()=>{layerControls();dirty=true;preview();});
 for(const key of ['primary','secondary'])$(key+'-kind').addEventListener('change',()=>{targets(key);dirty=true;preview();});
 $('existing-image').addEventListener('change',()=>{resetImage();dirty=true;preview();});
 $('hero-file').addEventListener('change',async()=>{
  const file=$('hero-file').files[0];resetImage();if(!file)return;
  const rev=revision;imageBusy=true;dirty=true;status('image-status','Preparando escena…');
  try{const blob=await window.KP_IMAGES.prepare(file,{hero:true,transparent:$('layout').value==='layered'});if(rev!==revision)return;const name=crypto.randomUUID()+'.webp';pending={blob,name,url:window.KP_CATALOG.configuration().supabaseUrl.replace(/\/$/,'')+'/storage/v1/object/public/kp-heroes/'+name,preview:URL.createObjectURL(blob),uploaded:false};$('existing-image').value='';status('image-status',`Escena lista: ${Math.ceil(blob.size/1024)} KB. Se subirá al guardar.`,'success');preview();}
  catch(error){if(rev===revision)status('image-status',error.message,'error');}finally{if(rev===revision)imageBusy=false;}
 });
 $('campaign-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!selected||saving)return;if(imageBusy){status('save-status','Espera a que termine la preparación de la imagen.','error');return;}
  let values;try{values=read();}catch(error){status('save-status',error.message,'error');return;}
  const row=selected;setBusy(true);status('save-status','Guardando campaña…');
  try{if(pending&&!pending.uploaded){status('save-status','Subiendo escena…');const upload=await client.storage.from('kp-heroes').upload(pending.name,pending.blob,{contentType:'image/webp',cacheControl:'31536000',upsert:false});if(upload.error)throw upload.error;pending.uploaded=true;}
   const columns='id,data,published,sort_order,starts_at,ends_at,version';const q=client.from('kp_campaigns');const result=row.isNew?await q.insert({id:row.id,...values}).select(columns).single():await q.update(values).eq('id',row.id).eq('version',row.version).select(columns).maybeSingle();
   if(result.error)throw result.error;if(!result.data){status('save-status','La campaña cambió en otra sesión. Conserva tus textos, actualiza la lista y revisa antes de reintentar.','error');return;}
   rows=row.isNew?[...rows,result.data]:rows.map(r=>r.id===row.id?result.data:r);$('search').value='';select(result.data);status('save-status','Campaña guardada. Recarga Ver tienda para comprobarla.','success');
  }catch(error){status('save-status','No se guardó la campaña. Revisa conexión, sesión y la activación de 05-heroes.sql. Si se creó en un intento anterior, actualiza la lista.','error');}finally{setBusy(false);}
 });
 $('cancel').addEventListener('click',()=>{if(selected&&!saving&&mayDiscard())select(selected);});$('reload').addEventListener('click',()=>{if(!saving&&mayDiscard())loadRows();});$('search').addEventListener('input',renderList);
 for(const [id,value]of [['preview-desktop',false],['preview-mobile',true]])$(id).addEventListener('click',()=>{mobile=value;$('preview-mobile').setAttribute('aria-pressed',String(mobile));$('preview-desktop').setAttribute('aria-pressed',String(!mobile));resizePreview();});
 window.addEventListener('resize',resizePreview);window.addEventListener('beforeunload',event=>{if(dirty||saving){event.preventDefault();event.returnValue='';}});
 $('timezone-help').textContent='Fechas en la zona de tu equipo: '+Intl.DateTimeFormat().resolvedOptions().timeZone+'. Deja vacío para no establecer ese límite. Las fechas se guardan con su zona horaria.';
 async function openSession(session){if(!session){setLogin();return;}if(activeUser===session.user.id)return;
  try{const user=await client.auth.getUser(),permission=await client.rpc('kp_is_admin');if(user.error||!user.data.user||permission.error||permission.data!==true)throw new Error('Sin acceso');activeUser=user.data.user.id;$('login-view').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;$('password').value='';await loadRows();}
  catch(error){await client.auth.signOut({scope:'local'});setLogin();status('login-status','Esta cuenta no tiene acceso al administrador.','error');}
 }
 $('show-password').addEventListener('click',()=>{const show=$('password').type==='password';$('password').type=show?'text':'password';$('show-password').textContent=show?'Ocultar':'Mostrar';$('show-password').setAttribute('aria-pressed',String(show));});
 $('login-form').addEventListener('submit',async event=>{event.preventDefault();if(!client)return;$('login-button').disabled=true;status('login-status','Comprobando acceso…');try{const result=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});$('password').value='';if(result.error)throw result.error;await openSession(result.data.session);}catch(error){status('login-status','Revisa correo, contraseña y conexión.','error');}finally{$('login-button').disabled=false;}});
 $('logout').addEventListener('click',async()=>{if(saving||!mayDiscard())return;$('logout').disabled=true;const result=await client.auth.signOut({scope:'local'});$('logout').disabled=false;if(result.error){status('list-status','No se pudo cerrar sesión. Reintenta.','error');return;}setLogin();status('login-status','Sesión cerrada.');});
 try{const c=window.KP_CATALOG.configuration();if(!c){$('login-button').disabled=true;status('login-status','Panel pendiente de conexión.');return;}
  client=window.supabase.createClient(c.supabaseUrl,c.publishableKey,{auth:{storage:window.sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'kp-admin-auth'}});
  client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')setLogin();else if(event==='TOKEN_REFRESHED'&&!activeUser)setTimeout(()=>openSession(session),0);});
  const result=await client.auth.getSession();if(result.error)throw result.error;await openSession(result.data.session);
 }catch(error){$('login-button').disabled=true;status('login-status','No se pudo preparar el acceso. Revisa la configuración y recarga.','error');}
})();
