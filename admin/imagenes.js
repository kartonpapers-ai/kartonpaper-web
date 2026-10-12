(function () {
  "use strict";
  async function prepare(file) {
    if (!file || !["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Elige una foto JPG, PNG o WebP.");
    if (file.size > 10*1024*1024) throw new Error("La foto supera 10 MB. Reduce su peso y vuelve a seleccionarla.");
    let bitmap;
    try { bitmap = await createImageBitmap(file); } catch (_) { throw new Error("No se pudo leer la foto. Prueba con otro JPG, PNG o WebP."); }
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width*bitmap.height > 24000000) throw new Error("La foto supera 24 megapíxeles. Reduce sus dimensiones antes de subirla.");
      for (const limit of [1600,1000]) {
        const scale = Math.min(1,limit/Math.max(bitmap.width,bitmap.height));
        const canvas = document.createElement("canvas"); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
        const blob = await new Promise(resolve => canvas.toBlob(resolve,"image/webp",0.82));
        if (!blob || blob.type !== "image/webp") throw new Error("Este navegador no puede convertir a WebP. Usa Chrome actualizado.");
        if (blob.size <= 1024*1024) return blob;
      }
      throw new Error("No se pudo reducir la foto a 1 MB. Selecciona una imagen más sencilla.");
    } finally { bitmap.close(); }
  }
  window.KP_IMAGES = Object.freeze({prepare});
})();
