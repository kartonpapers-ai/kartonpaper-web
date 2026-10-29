(function(){
 'use strict';
 const nullable=['base','labor','extras','waste','fee','fixed','sale','purchase_total','purchase_units'];
 const orderFields=['preparation','packaging'];
 const required=['printing','prints','quantity','discount','target','floor'];
 const alfajores=new Set(['reposteria-caja-3-alfajores','reposteria-caja-4-alfajores','reposteria-caja-6-alfajores']);
 function policy(product,variant,id=product?.id){
  const box=alfajores.has(id),pack=window.KP_CATALOG.packFor(product,variant);
  const mode=box?(pack?(pack.withoutPrint?'blanca':'logo'):product?.configurations?.includes(variant)?'logo':null):null;
  return {box,mode,floor:product?.category==='gastronomia'?45:box?40:0,withoutPrint:product?.category==='cerveza'||box&&mode==='blanca'};
 }
 function validatePolicy(p,product){
  const rule=policy(product,p.variant,p.product_id);
  if(rule.box&&(p.floor<rule.floor||p.target<rule.floor))throw new Error((rule.box?'Alfajores':'Gastronomía')+' requiere al menos '+rule.floor+'% de margen.');
  if(rule.box){
   if(!rule.mode)throw new Error('Alfajores: selecciona un pack de blancas sin impresión o una opción con logo del catálogo.');
   if(rule.mode==='logo'&&p.quantity<100)throw new Error('Alfajores con logo: el mínimo es 100 unidades.');
   if(rule.mode==='blanca'&&(p.printing!==0||p.prints!==0))throw new Error('Alfajores blancos: usa cero en impresión y pasadas.');
   if(rule.mode==='logo'&&p.prints<1)throw new Error('Alfajores con logo: registra al menos una pasada de impresión.');
  }
  return rule;
 }
 function blank(product){const first=window.KP_CATALOG.embalajeOptions(product)[0],variant=first?.label||product?.packs?.[0]?.label||'Unidad de producto',rule=policy(product,variant);return {product_id:product?.id||'',variant,supplier:'',note:'',base:null,printing:rule.withoutPrint?0:40,prints:rule.withoutPrint?0:1,labor:null,extras:null,waste:null,fee:null,fixed:null,preparation:null,packaging:null,quantity:first?.quantity||product?.packs?.[0]?.quantity||product?.orderStep||100,sale:null,discount:0,target:45,floor:rule.floor||40,reviewed:false,purchase_total:null,purchase_units:null};}
 function validate(p){
  if(!p||typeof p!=='object'||Array.isArray(p))throw new Error('Ficha de costos inválida.');
  if(typeof p.product_id!=='string'||!/^[a-z0-9-]{1,100}$/.test(p.product_id))throw new Error('Selecciona un producto.');
  for(const [key,max]of [['variant',200],['supplier',150],['note',1000]])if(typeof p[key]!=='string'||p[key].length>max||(key==='variant'&&!p[key].trim()))throw new Error('Revisa variante, proveedor y notas.');
  for(const key of [...nullable,...required,...orderFields]){const value=p[key];if(orderFields.includes(key)&&value==null)continue;if(nullable.includes(key)&&value===null)continue;if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e9)throw new Error('Revisa los importes: usa números positivos o cero.');}
  for(const key of ['quantity','prints'])if(!Number.isInteger(p[key])||p[key]<(key==='quantity'?1:0)||p[key]>1e6)throw new Error('Cantidad e impresiones deben ser enteros válidos.');
  if(p.purchase_units!==null&&(!Number.isInteger(p.purchase_units)||p.purchase_units<1))throw new Error('Revisa las unidades del embalaje.');
  if(p.waste!==null&&p.waste>=100||p.fee!==null&&p.fee>=100||p.discount>=100||p.target<=0||p.target>=100||p.floor<=0||p.floor>p.target||(p.fee??0)+p.target>=100)throw new Error('Revisa merma, comisión y márgenes: deben dejar un precio calculable.');
  if(typeof p.reviewed!=='boolean')throw new Error('Revisa la confirmación de costos.');return p;
 }
 function calculate(p,product){
  validate(p);validatePolicy(p,product);const baseSubtotal=p.base===null?null:p.base+p.printing*p.prints;
  const missing=['base','labor','extras','waste','fee','fixed',...orderFields].filter(key=>p[key]==null);
  if(product?.orderStep&&(p.quantity<product.orderStep||p.quantity%product.orderStep!==0))missing.push('cantidad por embalaje');
  if(!p.reviewed)missing.push('revisión de costos');
  if(missing.length)return {complete:false,missing,baseSubtotal};
  const orderCosts=p.fixed+p.preparation+p.packaging;
  const production=(baseSubtotal+p.labor+p.extras)/(1-p.waste/100),cost=production+orderCosts/p.quantity;
  const price=margin=>Math.ceil(cost/(1-p.fee/100-margin/100)-1e-9);
  const floor=Math.max(p.floor,product?.category==='gastronomia'?45:0),target=Math.max(p.target,floor);
  const targetPrice=price(target),floorPrice=price(floor),breakEven=price(0);
  const sale=p.sale===null?null:Math.floor(p.sale*(1-p.discount/100)+1e-9);
  const commission=sale===null?null:sale*p.fee/100,profit=sale===null?null:sale-cost-commission;
  const margin=sale>0?profit/sale*100:null;
  const revenue=sale===null?null:sale*p.quantity,iva=revenue===null?null:Math.round(revenue*.19);
  if([production,cost,targetPrice,floorPrice,breakEven,revenue,iva,revenue===null?null:revenue*1.19,profit===null?null:profit*p.quantity].some(value=>value!==null&&(!Number.isFinite(value)||Math.abs(value)>Number.MAX_SAFE_INTEGER)))throw new Error('Los importes calculados son demasiado grandes. Revisa merma, comisión y cantidad.');
  return {complete:true,missing:[],baseSubtotal,production,orderCosts,cost,targetPrice,floorPrice,breakEven,sale,commission,profit,margin,revenue,iva,total:revenue===null?null:revenue+iva,totalProfit:profit===null?null:profit*p.quantity,maxDiscount:p.sale>0?Math.floor(Math.max(0,(1-targetPrice/p.sale)*100)*10+1e-9)/10:null,status:margin===null?'Sin venta':margin>=target?'Cumple objetivo':margin>=floor?'Solo excepcional':profit>=0?'Bajo mínimo':'Pérdida'};
 }
 function catalogSale(product,variant){return window.KP_CATALOG.catalogSale(product,variant);}
 window.KP_FINANCE_CALC=Object.freeze({blank,validate,policy,validatePolicy,calculate,catalogSale});
})();
