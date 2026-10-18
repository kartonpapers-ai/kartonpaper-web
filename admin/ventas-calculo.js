(function(){
 'use strict';
 const states={pendiente:'Pendiente',confirmada:'Confirmada',produccion:'En producción',lista:'Lista para despacho',despachada:'Despachada',entregada:'Entregada',anulada:'Anulada'};
 const max=9e12;
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 function date(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number(value.slice(0,4))>=2000&&Number(value.slice(0,4))<=2100&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
 function text(value,limit,required=false){return typeof value==='string'&&value.length<=limit&&(!required||Boolean(value.trim()));}
 function whole(value,min=0,limit=max){return Number.isSafeInteger(value)&&value>=min&&value<=limit;}
 function blank(){return {customer:'',contact:'',reference:'',date:today(),due_date:'',state:'pendiente',shipping:0,invoice:'',notes:'',lines:[],payments:[]};}
 function calculate(p,now=today()){
  if(!p||typeof p!=='object'||Array.isArray(p))throw new Error('Venta inválida.');
  for(const [key,limit,required]of [['customer',150,true],['contact',150,false],['reference',100,false],['invoice',100,false],['notes',2000,false]])if(!text(p[key],limit,required))throw new Error('Completa cliente y revisa los textos del pedido.');
  if(!date(p.date)||p.due_date!==''&&(!date(p.due_date)||p.due_date<p.date))throw new Error('Revisa fecha de venta y entrega prevista.');
  if(!Object.hasOwn(states,p.state)||!whole(p.shipping,0,1e9))throw new Error('Revisa estado y despacho neto.');
  if(!Array.isArray(p.lines)||p.lines.length<1||p.lines.length>50)throw new Error('Agrega entre 1 y 50 productos.');
  let net=0;const lineTotals=[];
  for(const line of p.lines){
   if(!line||!(line.product_id===null||typeof line.product_id==='string'&&/^[a-z0-9-]{1,100}$/.test(line.product_id))||!text(line.name,200,true)||!text(line.variant,200)||!whole(line.quantity,1,1e6)||typeof line.unit_price!=='number'||!Number.isFinite(line.unit_price)||line.unit_price<0||line.unit_price>1e9||Math.abs(line.unit_price*100-Math.round(line.unit_price*100))>.00001)throw new Error('Revisa producto, cantidad y precio neto unitario (hasta 2 decimales).');
   const cents=Math.round(line.unit_price*100)*line.quantity;if(!Number.isSafeInteger(cents)||cents>max*100)throw new Error('El total del producto es demasiado grande.');
   const subtotal=Math.round(cents/100);lineTotals.push(subtotal);net+=subtotal;
  }
  net+=p.shipping;if(!whole(net,0,max))throw new Error('El neto excede el límite permitido.');
  const iva=Math.round(net*19/100),total=net+iva;
  if(!Array.isArray(p.payments)||p.payments.length>100)throw new Error('Se admiten hasta 100 movimientos de pago.');
  let paid=0,received=0,refunded=0;
  for(const item of p.payments){
   if(!item||!['abono','devolucion'].includes(item.kind)||!date(item.date)||item.date>now||!whole(item.amount,1,max)||!text(item.method,100,true)||!text(item.note,300))throw new Error('Revisa pagos: fecha válida sin anticipar cobros, importe positivo y medio de pago.');
   if(item.kind==='abono')received+=item.amount;else refunded+=item.amount;
   if(received>max||refunded>max)throw new Error('Los movimientos exceden el límite permitido.');
  }
  paid=received-refunded;if(paid<0||paid>total)throw new Error('El cobro neto debe estar entre cero y el total del pedido. Revisa abonos y devoluciones.');
  if(p.state==='anulada'&&paid!==0)throw new Error('Registra la devolución de los abonos antes de anular la venta.');
  const balance=p.state==='anulada'?0:total-paid,paymentState=p.state==='anulada'?'Anulada':total===0?'Sin importe':paid===0?'Sin pago':balance===0?'Pagada':'Abono parcial';
  return {net,iva,total,lineTotals,paid,balance,received,refunded,paymentState};
 }
 window.KP_SALES_CALC=Object.freeze({states,today,blank,calculate});
})();
