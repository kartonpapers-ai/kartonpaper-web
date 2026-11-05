(function(){
 'use strict';
 const channels=['instagram','facebook','tiktok','whatsapp'],names={instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok',whatsapp:'WhatsApp Business'};
 const clone=value=>JSON.parse(JSON.stringify(value));
 function date(value){return typeof value==='string'&&/^20\d{2}-\d{2}-\d{2}$|^2100-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
 function add(value,days){const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
 function monday(value){if(!date(value))throw Error('Selecciona una fecha válida.');return add(value,-((new Date(value+'T12:00:00Z').getUTCDay()+6)%7));}
 function currentWeek(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),get=t=>parts.find(p=>p.type===t).value;return monday(`${get('year')}-${get('month')}-${get('day')}`);}
 function url(value){if(value==='')return true;try{const u=new URL(value);return /^https:\/\/[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?([/?#]|$)/.test(value)&&u.protocol==='https:'&&!u.username&&!u.password&&!!u.hostname;}catch{return false;}}
 function blankWeek(week){return {week,title:'De envase a marca · '+week,product_id:'',campaign_id:'',audience:'',goal:'',message:'',cta:'Cuéntanos qué envase necesitas, cantidad y fecha para cotizar.',url:'',posts:[],inquiries:null,quotes:null,orders:null,revenue:null,spend:null,learning:''};}
 function blank(){return {accounts:channels.map(channel=>({channel,status:'por_crear',url:''})),weeks:[]};}
 function text(o,key,max,required=false){if(typeof o[key]!=='string'||o[key].length>max||(required&&!o[key].trim()))throw Error('Revisa el campo '+key+'.');}
 function validate(data){
  if(!data||!Array.isArray(data.accounts)||data.accounts.length!==4||!Array.isArray(data.weeks)||data.weeks.length>104)throw Error('El respaldo admite cuatro cuentas y hasta 104 semanas.');
  const seen=new Set();for(const a of data.accounts){if(!a||!channels.includes(a.channel)||seen.has(a.channel)||!['por_crear','creada','lista'].includes(a.status))throw Error('Estado de cuenta inválido.');seen.add(a.channel);text(a,'url',1000);if(!url(a.url))throw Error('Usa enlaces públicos https, sin credenciales.');if(a.status==='lista'&&!a.url)throw Error('Agrega el enlace público de la cuenta lista.');}
  seen.clear();for(const w of data.weeks){if(!w||!date(w.week)||monday(w.week)!==w.week||seen.has(w.week))throw Error('Cada semana debe comenzar un lunes y ser única.');seen.add(w.week);
   for(const [k,max]of Object.entries({title:150,product_id:100,campaign_id:100,audience:300,goal:300,message:2000,cta:500,url:1000,learning:2000}))text(w,k,max,k==='title');if(!url(w.url))throw Error('Usa un destino https válido.');
   for(const key of ['inquiries','quotes','orders','revenue','spend']){const v=w[key];if(v!==null&&(!Number.isInteger(v)||v<0||v>(['revenue','spend'].includes(key)?1e9:1e6)))throw Error('Revisa los resultados: cantidades y CLP deben ser enteros no negativos.');}
   if(!Array.isArray(w.posts)||w.posts.length>20)throw Error('Una semana admite hasta 20 contenidos.');for(const p of w.posts){if(!channels.includes(p.channel)||!['borrador','lista','publicada'].includes(p.state)||!date(p.date)||p.date<w.week||p.date>add(w.week,6))throw Error('Revisa canal, estado y fecha del contenido.');for(const [k,max]of Object.entries({format:100,copy:5000,asset:2000,url:1000}))text(p,k,max);if(!url(p.url))throw Error('Usa un enlace https para la publicación.');if(p.state==='publicada'&&!p.url&&p.channel!=='whatsapp')throw Error('Agrega el enlace de la publicación para marcarla publicada.');}
  }return clone(data);
 }
 function generate(w,product){
  if(!w.message.trim()||!w.url)throw Error('Completa el mensaje principal y el destino antes de preparar textos.');if(!url(w.url))throw Error('Usa un destino https válido.');
  const name=product?.data?.name||'nuestros envases',base=w.message.trim(),cta=w.cta.trim()||'Cuéntanos producto, cantidad y fecha para cotizar.';
  return [[1,'instagram','Reel · transformación'],[1,'tiktok','Video · proceso'],[2,'facebook','Carrusel · producto y uso'],[3,'instagram','Carrusel · elegir un envase'],[4,'tiktok','Video · detalle de impresión'],[4,'whatsapp','Estado · invitación a cotizar']].map(([day,channel,format],i)=>{
   const tracked=new URL(w.url);tracked.searchParams.set('utm_source',channel);tracked.searchParams.set('utm_medium','organic_social');tracked.searchParams.set('utm_campaign',w.week);tracked.searchParams.set('utm_content',String(i+1));
   const hook=channel==='tiktok'?'Mira cómo un envase se transforma con tu marca.':base;
   const body=`${hook}\n\n${name}. ${channel==='facebook'?'Te ayudamos a revisar el formato para tu producto.':'Conoce sus detalles y opciones de personalización.'}\n\n${cta}`;
   return {date:add(w.week,day),channel,format,state:'borrador',copy:body+(['instagram','tiktok'].includes(channel)?'\n\nConsulta el enlace del perfil o escríbenos.':'\n'+tracked.href),asset:(['instagram','tiktok'].includes(channel)?'Destino sugerido para el enlace del perfil (si tu cuenta permite enlaces): '+tracked.href+'\n':'')+(format.includes('Carrusel')?'Foto de fondo blanco + detalle de medida o uso + cierre para cotizar. Confirmar medidas y precios antes de publicar.':'Grabar vertical: envase sin imprimir → proceso real → resultado final. Usar diseño propio o autorizado. Música original autorizada o biblioteca comercial de la plataforma.'),url:''};
  });
 }
 function results(w){const rate=w.inquiries===null||w.orders===null||w.inquiries===0?null:100*w.orders/w.inquiries,cost=w.spend===null||w.orders===null||w.orders===0?null:w.spend/w.orders;return {rate,cost};}
 window.KP_SOCIAL_MODEL=Object.freeze({channels,names,blank,blankWeek,currentWeek,monday,add,url,validate,generate,results,clone});
})();
