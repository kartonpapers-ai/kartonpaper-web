(function(){
 'use strict';
 const panel=document.getElementById('box-preview-panel'),modal=document.querySelector('#custom-modal .modal-dialog');
 const status=document.getElementById('box-preview-status'),faces=document.getElementById('box-preview-faces'),reset=document.getElementById('box-preview-reset');
 const controls=Object.fromEntries(['size','x','y'].map(k=>[k,document.getElementById('box-preview-'+k)]));
 const images=Array.from(panel.querySelectorAll('.box-print-image'));
 let enabled=false,ready=false,url=null,ticket=0;
 const names={front:'Frente',back:'Reverso'};
 function faceList(){return faces.value==='both'?['front','back']:[faces.value];}
 function render(){
  const size=Number(controls.size.value),x=Number(controls.x.value),y=Number(controls.y.value),selected=faceList();
  for(const [key,control]of Object.entries(controls))document.getElementById('box-preview-'+key+'-value').textContent=control.value+'%';
  for(const image of images){const active=selected.includes(image.dataset.face);image.hidden=!ready||!active;Object.assign(image.style,{width:size+'%',height:size+'%',left:(100-size)*x/100+'%',top:(100-size)*y/100+'%'});const empty=image.parentElement.querySelector('.box-print-empty');empty.hidden=ready&&active;empty.textContent=active?'Tu gráfica aquí':'Sin impresión';}
  for(const control of [faces,reset,...Object.values(controls)])control.disabled=!ready;
 }
 function clear(){ticket++;ready=false;if(url){URL.revokeObjectURL(url);url=null;}for(const image of images){image.hidden=true;image.removeAttribute('src');}status.textContent='Carga un JPG o PNG para ver tu gráfica.';render();}
 function begin(product){enabled=product?.id==='beer-wrap-4x330';clear();panel.hidden=!enabled;modal.classList.toggle('has-box-preview',enabled);faces.value='both';controls.size.value='60';controls.x.value='50';controls.y.value='50';render();}
 function load(file){
  clear();if(!enabled||!file)return;
  if(!/\.(jpe?g|png)$/i.test(file.name)||file.type&&!['image/jpeg','image/png'].includes(file.type)){status.textContent='Archivo adjunto. La previsualización está disponible para JPG y PNG; revisaremos contigo el montaje de otros formatos.';return;}
  if(!Number.isFinite(file.size)||file.size<=0||file.size>10485760){status.textContent='Para previsualizar, usa una imagen de hasta 10 MB.';return;}
  const current=++ticket;try{url=URL.createObjectURL(file);}catch(error){status.textContent='No pudimos abrir esta imagen. Prueba otro JPG o PNG.';return;}
  const source=url,probe=new Image();
  probe.onload=()=>{if(current!==ticket)return;if(!probe.naturalWidth||!probe.naturalHeight||probe.naturalWidth*probe.naturalHeight>40000000){clear();status.textContent='Usa una imagen de hasta 40 megapíxeles.';return;}ready=true;for(const image of images)image.src=source;status.textContent='Previsualización de '+file.name;render();};
  probe.onerror=()=>{if(current!==ticket)return;clear();status.textContent='No pudimos leer esta imagen. Adjunta otro JPG o PNG.';};status.textContent='Preparando previsualización…';probe.src=source;
 }
 function valid(v){return v&&v.schema===1&&v.dieline==='wrap-4x330-v1'&&Array.isArray(v.faces)&&v.faces.length>=1&&v.faces.length<=2&&new Set(v.faces).size===v.faces.length&&v.faces.every(f=>['front','back'].includes(f))&&['size','x','y'].every(k=>Number.isInteger(v[k])&&v[k]>=({size:20,x:0,y:0}[k])&&v[k]<=100);}
 function snapshot(){return enabled&&ready?{schema:1,dieline:'wrap-4x330-v1',faces:faceList(),size:Number(controls.size.value),x:Number(controls.x.value),y:Number(controls.y.value),rotationInDieline:{front:180,back:0}}:null;}
 function describe(v){return valid(v)?v.faces.map(f=>names[f]).join(' y ')+' · tamaño '+v.size+'% · horizontal '+v.x+'%, vertical '+v.y+'% · referencia Wrap 4×330 (frente 180°, reverso 0° en el troquel)':'';}
 for(const control of [faces,...Object.values(controls)])control.addEventListener('input',render);faces.addEventListener('change',render);
 reset.addEventListener('click',()=>{controls.size.value='60';controls.x.value='50';controls.y.value='50';render();});
 const compact=window.matchMedia('(max-width:850px)');function layout(){const form=document.getElementById('custom-product-form');if(compact.matches)form.insertBefore(panel,form.querySelector('.modal-actions'));else document.querySelector('.customizer-layout').append(panel);}compact.addEventListener('change',layout);layout();
 window.addEventListener('pagehide',clear);window.KP_BOX_PREVIEW=Object.freeze({begin,load,clear,snapshot,describe});begin(null);
})();
