// Regression H1: shared store/admin prices; all costs below are synthetic.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),scope={window:{}};vm.createContext(scope);
for(const file of ['data/productos.js','js/catalogo-remoto.js','admin/finanzas-calculo.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),scope);
vm.runInContext('globalThis.catalog=productsDB',scope);
const catalog=scope.window.KP_CATALOG,finance=scope.window.KP_FINANCE_CALC;
let count=0;
for(const product of scope.catalog){
 if(!product.packs)continue;
 for(const pack of product.packs){
  for(const key of [pack.label,pack.sku,pack.label.split(' · $')[0],pack.configuration].filter(Boolean)){
   assert.equal(catalog.packFor(product,key),pack);
   assert.equal(catalog.catalogSale(product,key),pack.unitPrice);
   assert.equal(finance.catalogSale(product,key),pack.unitPrice);
  }
  const fields=catalog.packFields(product,pack.sku);
  assert.equal(fields.unitPrice*fields.unitsPerPack,pack.totalNet);
  count++;
 }
 assert.equal(finance.catalogSale(product,'opción desconocida'),null);
 assert.equal(finance.catalogSale(product,'Unidad de producto'),null);
 assert.equal(finance.catalogSale(product,undefined),null);
}
assert.equal(catalog.catalogSale({packs:[{sku:'ZERO',label:'Gratis',quantity:1,unitPrice:0,totalNet:0}]},'ZERO'),0);
const box=scope.catalog.find(p=>p.id==='reposteria-caja-3-alfajores'),pack=box.packs[1];
const data={...finance.blank(box),variant:pack.label,quantity:pack.quantity,sale:finance.catalogSale(box,pack.sku),base:100,labor:0,extras:0,waste:0,fee:0,fixed:0,preparation:0,packaging:0,reviewed:true};
const result=finance.calculate(data,box);
assert.equal(result.revenue,17500);assert.equal(result.iva,3325);assert.equal(result.total,20825);assert.equal(result.margin,60);
assert.equal(finance.blank(box).variant,box.packs[0].label);assert.equal(finance.blank(box).quantity,25);
assert.equal(catalog.catalogSale({...box,price:'$999 + IVA c/u'},pack.sku),350);
const ambiguous={...box,packs:[pack,{...pack,sku:'OTHER',label:pack.label.replace('17.500','18.000')}]};
assert.equal(catalog.catalogSale(ambiguous,'Pack 50 u. · Sin impresión'),null);
assert.equal(catalog.catalogSale({price:'$12.900 por caja',variants:[]},'Caja'),null);
assert.equal(catalog.catalogSale({price:'Desde $100',variants:['Medida · $174 + IVA c/u']},'Medida'),174);
console.log(`OK H1: ${count} packs por SKU/etiqueta/configuración, neto, IVA y margen; opciones desconocidas y ambiguas sin precio genérico.`);
