// Run each test in isolation and report every failure, including later files.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const files=fs.readdirSync(__dirname).filter(file=>/^test-.+\.cjs$/.test(file)).sort();
const failures=[];
if(!files.length){console.error('No se encontraron pruebas.');process.exit(1);}
for(const [index,file] of files.entries()){
 console.log(`\n[${index+1}/${files.length}] ${file}`);
 const result=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:root,stdio:'inherit',timeout:60000});
 if(result.error||result.signal||result.status!==0){
  failures.push(file);
  console.error(`FALLÓ ${file}${result.error?' · '+result.error.message:result.signal?' · señal '+result.signal:''}`);
 }
}
console.log(`\nResultado: ${files.length-failures.length}/${files.length} archivos de pruebas aprobados.`);
if(failures.length)console.error('Pendientes:\n'+failures.map(file=>'  '+file).join('\n'));
process.exitCode=failures.length?1:0;
