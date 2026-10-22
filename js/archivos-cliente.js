(function(){
 'use strict';
 const maxSize=10*1024*1024;
 const types={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',svg:'image/svg+xml',ai:'application/postscript',eps:'application/postscript'};
 function check(file){
  const extension=String(file?.name||'').split('.').at(-1).toLowerCase();
  if(!file||!Object.hasOwn(types,extension))throw new Error('Adjunta tu logo en PDF, PNG, JPG, SVG, AI o EPS.');
  if(!Number.isFinite(file.size)||file.size<=0||file.size>maxSize)throw new Error('El archivo debe tener contenido y pesar hasta 10 MB.');
  return {extension,contentType:types[extension]};
 }
 async function upload(file){
  const {extension,contentType}=check(file),config=window.KP_CATALOG.configuration();
  if(!config)throw new Error('La carga de archivos aún no está activa. Contáctanos por WhatsApp para enviar tu logo.');
  const stem=file.name.replace(/\.[^.]*$/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,60)||'logo';
  const path='posavasos/'+crypto.randomUUID()+'--'+stem+'.'+extension;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const result=await fetch(config.supabaseUrl+'/storage/v1/object/kp-logos/'+path,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':contentType,'x-upsert':'false'},body:file,signal:controller.signal});
   if(!result.ok)throw new Error('No se pudo guardar el logo. Reintenta; si continúa, envíanos el archivo por WhatsApp.');
   return {path,name:file.name};
  }catch(error){if(error.name==='AbortError')throw new Error('La carga tardó demasiado. Conserva el archivo y vuelve a intentarlo.');throw error;}
  finally{clearTimeout(timer);}
 }
 window.KP_CUSTOMER_FILES=Object.freeze({check,upload});
})();
