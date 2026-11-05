(function(){
 'use strict';
 const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 const text=value=>typeof value==='string'&&value.trim().length>0;
 const artworkPattern=/^posavasos\/[a-f0-9-]{36}--[a-zA-Z0-9_-]{1,60}\.(pdf|png|jpg|jpeg|svg|ai|eps)$/;
 function read(storage){
  let raw;
  try{raw=storage.getItem('kp_cart');}catch(error){return {items:[],problem:false,storageUnavailable:true,readFailed:true};}
  if(raw===null)return {items:[],problem:false};
  let parsed;
  try{parsed=JSON.parse(raw);}catch(error){return {items:[],problem:true};}
  if(!Array.isArray(parsed))return {items:[],problem:true};
  const items=[];let problem=false;
  for(const entry of parsed){
   if(!object(entry)||!text(entry.id)||!text(entry.variant)||typeof entry.isCustom!=='boolean'||!Number.isSafeInteger(entry.qty)||entry.qty<1||entry.qty>1000000){problem=true;continue;}
   // Solo recuperar identidad, cantidad y personalización. Precios y reglas se
   // reconstruyen con el catálogo actual después de cargarlo correctamente.
   const item={id:entry.id,variant:entry.variant,isCustom:entry.isCustom,qty:entry.qty};
   if(entry.isCustom){
    if(entry.logoFile!==undefined){if(text(entry.logoFile))item.logoFile=entry.logoFile;else problem=true;}
    if(entry.artworkRef!==undefined){if(typeof entry.artworkRef==='string'&&artworkPattern.test(entry.artworkRef))item.artworkRef=entry.artworkRef;else problem=true;}
    if(entry.artworkPreview!==undefined){
     const preview=entry.artworkPreview;
     if(entry.id==='beer-wrap-4x330'&&window.KP_BOX_PREVIEW.describe(preview))item.artworkPreview={schema:1,dieline:'wrap-4x330-v1',faces:[...preview.faces],size:preview.size,x:preview.x,y:preview.y,rotationInDieline:{front:180,back:0}};
     else problem=true;
    }
   }
   items.push(item);
  }
  return {items,problem};
 }
 function reconcile(items,products){
  const catalog=window.KP_CATALOG,result=[];let problem=false;
  for(const item of items){
   const product=products.find(p=>p.id===item.id);
   if(!product||product.pricePending){problem=true;continue;}
   const variants=item.isCustom?(product.configurations||(product.packs?['Personalización con logo · Cotización']:product.variants)):product.variants;
   const validVariant=product.orderStep
    ? item.isCustom&&item.variant==='Embalaje completo de '+product.orderStep+' u. · Impresión en tapa'
    : Array.isArray(variants)&&variants.includes(item.variant);
   if(!validVariant||!catalog.validQuantity(product,item.variant,item.qty)
    ||(item.isCustom?product.type==='stock':product.type==='custom')
    ||(!item.isCustom&&catalog.packFor(product,item.variant)?.requiresLogo)
    ||(product.requiresArtwork&&(!item.isCustom||!artworkPattern.test(item.artworkRef||'')))){problem=true;continue;}
   const rule=catalog.quantityRule(product,item.variant);
   result.push({...item,name:product.name,image:product.image,
    ...(item.isCustom?{
     ...catalog.embalajeFields(product,item.qty),
     ...(rule?.step?{unitsPerBox:rule.step,printingArea:product.printingArea||''}:{}),
     ...(rule?.quantities?{quantityOptions:[...rule.quantities]}:{})
    }:{...catalog.packFields(product,item.variant),...(product.stockUnits?{stockUnits:product.stockUnits,stockUnitPrice:product.priceNum}:{})})});
  }
  return {items:result,problem};
 }
 window.KP_SAVED_CART=Object.freeze({read,reconcile});
})();
