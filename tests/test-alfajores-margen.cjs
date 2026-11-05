const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{PGlite}=require('@electric-sql/pglite');
const scope={window:{}};vm.createContext(scope);
for(const file of ['data/productos.js','js/catalogo-remoto.js','admin/finanzas-calculo.js'])vm.runInContext(fs.readFileSync(file,'utf8'),scope);
vm.runInContext('globalThis.products=productsDB',scope);
const products=JSON.parse(JSON.stringify(scope.products)),calc=scope.window.KP_FINANCE_CALC;
const boxes=products.filter(p=>/^reposteria-caja-[346]-alfajores$/.test(p.id));
function complete(product){return {...calc.blank(product),base:100,labor:0,extras:0,waste:0,fee:0,fixed:0,preparation:0,packaging:0,sale:200,reviewed:true};}
for(const p of boxes){
 const white=complete(p);assert.equal(white.floor,40);assert.equal(white.target,45);assert.equal(white.printing,0);assert.equal(white.prints,0);assert.equal(white.quantity,25);
 for(const floor of [20,39.99])assert.throws(()=>calc.calculate({...white,floor},p),/40%/);
 assert.throws(()=>calc.calculate({...white,floor:20,target:25},p),/40%/);
 assert.throws(()=>calc.calculate({...white,variant:'Unidad de producto'},p),/selecciona/);
 assert.throws(()=>calc.calculate({...white,printing:40,prints:1},p),/blancos/);
 const logo={...white,variant:p.packs.find(pack=>pack.requiresLogo).sku,quantity:100,printing:40,prints:1,sale:300};
 assert.throws(()=>calc.calculate({...logo,quantity:99},p),/100 unidades/);
 assert.throws(()=>calc.calculate({...logo,prints:0},p),/pasada/);
 assert.equal(calc.calculate(logo,p).complete,true);
 for(const variant of [p.packs[0].sku,p.packs[0].label,'Pack 25 u. · Sin impresión'])assert.equal(calc.calculate({...white,variant},p).complete,true);
 for(const variant of ['100 unidades','250 unidades','500 unidades'])assert.equal(calc.calculate({...logo,variant,quantity:parseInt(variant)},p).complete,true);
 assert.equal(calc.calculate({...white,sale:150},p).status,'Bajo mínimo');
 assert.equal(calc.calculate({...white,base:null},p).complete,false);
}
(async()=>{
 const db=new PGlite();await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
 await db.exec(fs.readFileSync('supabase/01-esquema.sql','utf8'));await db.exec(fs.readFileSync('supabase/09-finanzas-privadas.sql','utf8'));
 for(const p of products)await db.query('insert into kp_products(id,data,sort_order) values($1,$2,0)',[p.id,p]);
 const legacy={...complete(boxes[0]),variant:'Unidad de producto',floor:20,target:25};
 await db.query('insert into kp_finance(id,data) values($1,$2)',['legacy',legacy]);
 const before=(await db.query('select * from kp_finance order by id')).rows,publicBefore=(await db.query('select * from kp_products order by id')).rows;
 const migration=fs.readdirSync('supabase/migrations').find(name=>name.endsWith('_alfajores_margen_minimo.sql'));const sql=fs.readFileSync('supabase/migrations/'+migration,'utf8');
 await db.exec(sql);await db.exec(sql);assert.deepEqual((await db.query('select * from kp_finance order by id')).rows,before);assert.deepEqual((await db.query('select * from kp_products order by id')).rows,publicBefore);
 let n=0;
 for(const p of boxes){
  const white=complete(p),logo={...white,variant:'100 unidades',quantity:100,printing:40,prints:1};
  for(const bad of [{...white,floor:20,target:25},{...white,floor:39.99},{...white,variant:'Unidad de producto'},{...white,printing:40,prints:1},{...logo,quantity:99},{...logo,prints:0},{...logo,printing:'40'},{...logo,variant:'Con logo inventado'}])await assert.rejects(db.query('insert into kp_finance(id,data) values($1,$2)',['bad-'+n++,bad]),/Alfajores/);
  for(const data of [white,{...white,variant:'Pack 25 u. · Sin impresión'},logo,{...logo,variant:p.packs.find(pack=>pack.requiresLogo).sku},{...logo,variant:'250 unidades',quantity:250}]){
   calc.calculate(data,p);await db.query('insert into kp_finance(id,data) values($1,$2)',['good-'+n++,data]);
  }
 }
 await assert.rejects(db.query("update kp_finance set data=jsonb_set(data,'{floor}','20') where id='good-8'"),/Alfajores/);
 await db.query("update kp_finance set data=jsonb_set(data,'{target}','46') where id='good-8'");assert.equal((await db.query("select version from kp_finance where id='good-8'")).rows[0].version,2);
 const count=(await db.query('select count(*) n from kp_finance')).rows[0].n;
 await assert.rejects(db.query('insert into kp_finance(id,data) values($1,$2),($3,$4)',['atomic-good',complete(boxes[0]),'atomic-bad',{...complete(boxes[0]),floor:20,target:25}]),/Alfajores/);
 assert.equal((await db.query('select count(*) n from kp_finance')).rows[0].n,count);
 // Other families retain their existing schema and permissions.
 const other=complete(products.find(p=>p.category==='cerveza'));await db.query('insert into kp_finance(id,data) values($1,$2)',['other-family',{...other,floor:20,target:25}]);
 assert.equal((await db.query("select prosecdef from pg_proc where oid='kp_private.validate_alfajores_finance()'::regprocedure")).rows[0].prosecdef,false);
 assert.deepEqual((await db.query('select * from kp_products order by id')).rows,publicBefore);
 await db.close();console.log('OK H9: tres formatos, piso 40%, modalidades, logo desde 100, blancas sin impresión, simulación bajo mínimo, costos incompletos, SQL repetible, INSERT/UPDATE/lotes protegidos y datos existentes intactos.');
})().catch(error=>{console.error(error);process.exit(1);});
