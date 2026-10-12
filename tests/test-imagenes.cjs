const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
(async()=>{
 let dimensions={width:3000,height:2000},closed=0,drawn,blobSize=400000,convertedType='image/webp';
 const canvas={getContext:()=>({drawImage:(_b,_x,_y,w,h)=>drawn=[w,h]}),toBlob:fn=>fn({size:blobSize,type:convertedType})};
 const ctx={window:{},createImageBitmap:async()=>({...dimensions,close:()=>closed++}),document:{createElement:()=>canvas}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('admin/imagenes.js','utf8'),ctx);const prepare=ctx.window.KP_IMAGES.prepare;
 const file={size:5000000,type:'image/png'};await prepare(file);assert.deepEqual(drawn,[1600,1067]);assert.equal(closed,1);
 dimensions={width:400,height:200};await prepare(file);assert.deepEqual(drawn,[400,200]);
 await assert.rejects(prepare({...file,type:'image/svg+xml'}));await assert.rejects(prepare({...file,size:11*1024*1024}));
 dimensions={width:10000,height:10000};await assert.rejects(prepare(file));
 dimensions={width:3000,height:2000};blobSize=2000000;await assert.rejects(prepare(file));assert.deepEqual(drawn,[1000,667]);
 blobSize=400000;convertedType='image/png';await assert.rejects(prepare(file));
 console.log('OK fotos: dimensiones, sin ampliar originales, MIME, límites, conversión y liberación de imagen.');
})().catch(e=>{console.error(e);process.exit(1)});
