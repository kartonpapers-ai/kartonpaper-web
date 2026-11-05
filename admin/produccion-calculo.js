(function(){
 'use strict';
 const states={cola:'En cola',preparacion:'Preparando archivo',imprimiendo:'Imprimiendo',terminada:'Terminada',cancelada:'Cancelada'};
 const active=p=>['cola','preparacion','imprimiendo'].includes(p.state);
 function blank(){return {sale_id:null,sale_line:null,product_id:null,product_name:'',variant:'',customer:'',quantity:100,printed:0,waste:0,passes:1,ml_per_print:.1,setup_ml:0,ink_actual:null,state:'cola',priority:2,queue_order:100,due_date:'',file_ref:'',notes:''};}
 function calculate(p){
  if(!p||typeof p!=='object'||Array.isArray(p))throw new Error('OT inválida.');
  for(const [key,limit,required]of [['product_name',200,true],['variant',200,false],['customer',150,false],['file_ref',300,false],['notes',2000,false]])if(typeof p[key]!=='string'||p[key].length>limit||required&&!p[key].trim())throw new Error('Completa el producto y revisa los textos de la OT.');
  if(!(p.product_id===null||typeof p.product_id==='string'&&/^[a-z0-9-]{1,100}$/.test(p.product_id)))throw new Error('Producto de catálogo inválido.');
  if(p.sale_id===null){if(p.sale_line!==null)throw new Error('Origen de venta inválido.');}else if(typeof p.sale_id!=='string'||!/^sale-[a-z0-9-]{1,100}$/.test(p.sale_id)||!Number.isInteger(p.sale_line)||p.sale_line<0||p.sale_line>49)throw new Error('Selecciona venta y producto de origen.');
  for(const [key,min,max]of [['quantity',1,1e6],['printed',0,1e6],['waste',0,1e6],['passes',1,10],['priority',1,3],['queue_order',0,1e6]])if(!Number.isSafeInteger(p[key])||p[key]<min||p[key]>max)throw new Error('Revisa cantidades, pasadas, prioridad y orden.');
  for(const [key,max,digits]of [['ml_per_print',100,6],['setup_ml',1e6,3],['ink_actual',1e9,3]]){const value=p[key];if(key==='ink_actual'&&value===null)continue;const factor=10**digits;if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max||Math.abs(value*factor-Math.round(value*factor))>.00001)throw new Error('Revisa los ml de tinta y sus decimales.');}
  if(typeof p.due_date!=='string'||p.due_date!==''&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.due_date)||p.due_date<'2000-01-01'||p.due_date>'2100-12-31'||Number.isNaN(Date.parse(p.due_date+'T00:00:00Z'))||new Date(p.due_date+'T00:00:00Z').toISOString().slice(0,10)!==p.due_date))throw new Error('Revisa la fecha objetivo.');
  if(!Object.hasOwn(states,p.state)||p.printed>p.quantity)throw new Error('Revisa el estado y la cantidad conforme.');
  if(p.state==='terminada'&&p.printed!==p.quantity)throw new Error('Para terminar la OT, las unidades conformes deben igualar la cantidad del pedido.');
  const scaled=(p.quantity+p.waste)*p.passes*Math.round(p.ml_per_print*1e6)+Math.round(p.setup_ml*1e6);
  const estimated=Math.floor((scaled+500)/1000)/1000;
  if(estimated>1e9)throw new Error('La estimación de tinta excede el límite.');
  return {estimated,remaining:active(p)?p.quantity-p.printed:0,actual:p.ink_actual,difference:p.ink_actual===null?null:(Math.round(p.ink_actual*1000)-Math.round(estimated*1000))/1000};
 }
 function compare(a,b){const aa=active(a.data),bb=active(b.data);if(aa!==bb)return aa?-1:1;const priority=a.data.priority-b.data.priority,order=a.data.queue_order-b.data.queue_order;if(aa&&(priority||order))return priority||order;const an=BigInt(a.number||0),bn=BigInt(b.number||0);return an===bn?0:an<bn?(aa?-1:1):(aa?1:-1);}
 window.KP_PRODUCTION_CALC=Object.freeze({states,active,blank,calculate,compare});
})();
