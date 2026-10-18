(async function () {
  "use strict";
  const $ = id => document.getElementById(id);
  let client, rows = [], selected = null, dirty = false, saving = false, activeUser = null, pendingImage = null, imageBusy = false, imageRevision = 0;
  const categoryNames = {cerveza:"Cerveza",reposteria:"Repostería",gastronomia:"Gastronomía",bolsas:"Bolsas",doypack:"Doypack",posavasos:"Posavasos"};
  function status(id, message, kind = "") { $(id).textContent = message; $(id).className = kind; }
  function setLogin() {
    $("campaign-nav").hidden = true; $("workspace").hidden = true; $("logout").hidden = true; $("login-view").hidden = false;
    window.KP_PANEL?.clear();
    rows = []; selected = null; dirty = false; activeUser = null; resetImage();
    $("product-list").replaceChildren(); $("edit-form").reset(); $("edit-form").hidden = true;
  }
  const imageSource = value => value.startsWith("https://") ? value : "../" + value;
  function resetImage() { imageRevision++; pendingImage = null; imageBusy = false; $("edit-file").value = ""; status("image-status", ""); }
  function imageOptions(value) {
    $("edit-existing-image").replaceChildren(new Option("Selecciona una imagen o sube una foto", ""));
    const seen = new Set();
    for (const row of rows) if (!seen.has(row.data.image)) { seen.add(row.data.image); $("edit-existing-image").add(new Option(row.data.name, row.data.image)); }
    if (value && !seen.has(value)) $("edit-existing-image").add(new Option("Imagen actual", value));
    $("edit-existing-image").value = value;
  }
  function mayDiscard() { return (!dirty || window.confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?")) && (!window.KP_FINANCE || window.KP_FINANCE.mayLeave()) && (!window.KP_SALES || window.KP_SALES.mayLeave()) && (!window.KP_PRODUCTION || window.KP_PRODUCTION.mayLeave()); }
  function renderList() {
    const query = $("search").value.trim().toLocaleLowerCase("es");
    const filtered = rows.filter(r => [r.data.name, r.data.category, categoryNames[r.data.category]].join(" ").toLocaleLowerCase("es").includes(query));
    $("product-list").replaceChildren();
    for (const row of filtered) {
      const button = document.createElement("button"); button.type = "button"; button.className = "product-row";
      button.setAttribute("aria-pressed", String(row.id === selected?.id));
      const image = document.createElement("img"); image.src = imageSource(row.data.image); image.alt = "";
      const text = document.createElement("span"), name = document.createElement("strong"), note = document.createElement("small");
      name.textContent = row.data.name; note.textContent = categoryNames[row.data.category] + " · " + (row.published ? "Visible" : "Oculto");
      text.append(name, note); button.append(image, text);
      button.disabled = saving;
      button.addEventListener("click", () => { if (!saving && mayDiscard()) selectRow(row); });
      $("product-list").append(button);
    }
    status("list-status", filtered.length ? "" : "No hay productos que coincidan con tu búsqueda.");
  }
  function selectRow(row) {
    resetImage(); selected = row; dirty = false; $("save").textContent = row.isNew ? "Crear producto" : "Guardar cambios";
    $("editor-empty").hidden = true; $("edit-form").hidden = false;
    $("edit-title").textContent = row.data.name; $("edit-id").textContent = categoryNames[row.data.category] + " · " + row.id;
    $("edit-image").src = imageSource(row.data.image); $("edit-image").hidden = !row.data.image;
    $("edit-category").value = row.data.category; $("edit-type").value = row.data.type; imageOptions(row.data.image);
    for (const field of ["name", "subtitle", "price"]) $("edit-" + field).value = row.data[field];
    $("edit-number").value = row.data.priceNum ?? "";
    $("edit-variants").value = row.data.variants.join("\n"); $("edit-specs").value = row.data.specs.join("\n");
    $("edit-published").checked = row.published;
    const eligible = window.KP_PRICES.unitFromText(row.data.price) !== null && window.KP_PRICES.packs(row.data.variants) !== null;
    $("edit-auto-price").disabled = !eligible;
    $("edit-auto-price").checked = eligible && row.data.pricingMode !== "manual";
    if ($("edit-auto-price").checked) $("edit-number").value = window.KP_PRICES.unitFromText(row.data.price);
    $("pricing-help").textContent = eligible ? "Revisa los totales antes de guardar. El cálculo usa el mismo precio por unidad para todos los packs." : "Este producto usa cotización, medidas o precios especiales. Conserva la edición manual.";
    syncPrices(); status("save-status", ""); renderList();
  }
  function syncPrices() {
    const automatic = $("edit-auto-price").checked;
    $("edit-price").readOnly = automatic; $("edit-variants").readOnly = automatic;
    $("number-label").textContent = automatic ? "Precio por unidad, neto (CLP)" : "Precio numérico de referencia (CLP)";
    $("edit-number").required = automatic;
    $("number-help").textContent = automatic ? "Cambia este valor. El texto y los packs se calculan juntos, sin IVA." : "Opcional. En modo manual debes revisar también el texto visible y los precios de los packs.";
    $("variants-help").textContent = automatic ? "Totales netos: cantidad × precio por unidad. Desactiva el cálculo para editar cantidades o aplicar precios especiales." : "Cada opción se edita por separado. Conserva el formato Pack 50 u. ($34.500) si quieres activar el cálculo.";
    status("pricing-status", "");
    if (!automatic) return;
    try {
      const quantities = window.KP_PRICES.packs($("edit-variants").value.split("\n").map(s => s.trim()).filter(Boolean));
      const calculated = window.KP_PRICES.calculate($("edit-number").value.trim(), quantities);
      $("edit-price").value = calculated.price; $("edit-variants").value = calculated.variants.join("\n");
    } catch (error) { status("pricing-status", error.message, "error"); }
  }
  async function loadRows() {
    resetImage(); $("reload").disabled = true;
    try {
      const {data, error} = await client.from("kp_products").select("id,data,published,version,updated_at,sort_order").order("sort_order").order("id");
      if (error) throw error;
      for (const row of data) { window.KP_CATALOG.validate(row.data); if (row.data.id !== row.id) throw new Error("Producto inválido"); }
      rows = data; selected = null; dirty = false;
      $("edit-form").hidden = true; $("editor-empty").hidden = false;
      $("product-count").textContent = `${rows.length} productos · ${rows.filter(r => r.published).length} visibles en la tienda`;
      renderList(); window.KP_PANEL?.setCatalog(rows);
    } catch (error) {
      status("list-status", "No se pudo cargar el catálogo. Revisa la conexión y pulsa Actualizar lista.", "error");
    } finally { $("reload").disabled = false; }
  }
  async function openSession(session) {
    if (!session) { setLogin(); return; }
    if (activeUser === session.user.id) return;
    try {
      const userResult = await client.auth.getUser();
      if (userResult.error || !userResult.data.user) throw new Error("Sesión inválida");
      const {data: allowed, error} = await client.rpc("kp_is_admin");
      if (error || allowed !== true) throw new Error("Sin autorización");
      activeUser = userResult.data.user.id;
      $("campaign-nav").hidden = false; $("login-view").hidden = true; $("workspace").hidden = false; $("logout").hidden = false;
      $("password").value = ""; status("login-status", ""); window.KP_PANEL?.connect(client); await loadRows();
    } catch (error) {
      await client.auth.signOut({scope:"local"}); setLogin();
      status("login-status", "Esta cuenta no tiene acceso al administrador. Revisa el usuario autorizado en Supabase.", "error");
    }
  }
  window.KP_ADMIN_UI={mayLeave:()=>!saving&&mayDiscard(),editProduct:id=>{const row=rows.find(r=>r.id===id);if(row)selectRow(row);}};
  $("show-password").addEventListener("click", () => {
    const show = $("password").type === "password"; $("password").type = show ? "text" : "password";
    $("show-password").textContent = show ? "Ocultar" : "Mostrar"; $("show-password").setAttribute("aria-pressed", String(show));
  });
  $("new-product").addEventListener("click", () => {
    if (saving || !mayDiscard()) return;
    selectRow({isNew:true,id:"producto-" + crypto.randomUUID(),published:false,sort_order:Math.max(-1,...rows.map(r=>r.sort_order))+1,data:{name:"",subtitle:"",category:"reposteria",type:"custom",image:"",price:"Cotización con logo",variants:["100 unidades","250 unidades","500 unidades"],specs:["Personalización con tu logo"]}});
    $("edit-title").textContent = "Nuevo producto"; $("edit-id").textContent = "Completa los datos y guarda. Comienza oculto en la tienda."; $("edit-name").focus();
    dirty = true;
  });
  $("edit-existing-image").addEventListener("change", () => {
    resetImage(); $("edit-image").hidden = !$("edit-existing-image").value;
    if (!$("edit-image").hidden) $("edit-image").src=imageSource($("edit-existing-image").value);
  });
  $("edit-file").addEventListener("change", async () => {
    const file = $("edit-file").files[0]; resetImage(); if (!file) return;
    const revision = imageRevision; imageBusy = true; dirty = true; status("image-status", "Preparando foto…");
    try {
      const blob = await window.KP_IMAGES.prepare(file);
      if (revision !== imageRevision) return;
      const name = crypto.randomUUID() + ".webp";
      pendingImage = {blob,name,url:window.KP_CATALOG.configuration().supabaseUrl.replace(/\/$/,"")+"/storage/v1/object/public/kp-productos/"+name,uploaded:false};
      $("edit-existing-image").value="";
      const preview=URL.createObjectURL(blob); $("edit-image").onload=()=>URL.revokeObjectURL(preview); $("edit-image").src=preview; $("edit-image").hidden=false;
      status("image-status", `Foto lista: ${Math.ceil(blob.size/1024)} KB. Se subirá al guardar.`, "success");
    } catch (error) { if (revision === imageRevision) status("image-status", error.message, "error"); }
    finally { if (revision === imageRevision) imageBusy=false; }
  });
  $("search").addEventListener("input", renderList);
  $("edit-form").addEventListener("input", () => { dirty = true; status("save-status", "Cambios pendientes de guardar."); });
  function refreshPricingEligibility() {
    if (saving) return;
    const packs = window.KP_PRICES.packs($("edit-variants").value.split("\n").map(v=>v.trim()).filter(Boolean));
    $("edit-auto-price").disabled = !packs || (!selected?.isNew && window.KP_PRICES.unitFromText($("edit-price").value) === null);
  }
  $("edit-variants").addEventListener("input", refreshPricingEligibility);
  $("edit-price").addEventListener("input", refreshPricingEligibility);
  $("edit-type").addEventListener("change", () => {
    if (!selected?.isNew) return;
    if ($("edit-type").value !== "custom" && $("edit-variants").value === "100 unidades\n250 unidades\n500 unidades") {
      $("edit-variants").value="Pack 50 u. ($0)\nPack 100 u. ($0)\nPack 200 u. ($0)";
      $("edit-number").value="0"; $("edit-auto-price").checked=true; $("edit-auto-price").disabled=false; syncPrices();
    }
  });
  $("edit-number").addEventListener("input", syncPrices);
  $("edit-auto-price").addEventListener("change", () => { dirty = true; syncPrices(); status("save-status", "Cambios pendientes de guardar."); });
  $("cancel").addEventListener("click", () => { if (selected && !saving && mayDiscard()) selectRow(selected); });
  $("reload").addEventListener("click", () => { if (!saving && mayDiscard()) loadRows(); });
  window.addEventListener("beforeunload", event => { if (dirty || saving) { event.preventDefault(); event.returnValue = ""; } });
  $("edit-form").addEventListener("submit", async event => {
    event.preventDefault(); if (!selected || saving) return;
    if (imageBusy) { status("save-status", "Espera a que termine la preparación de la foto.", "error"); return; }
    const row = selected; const isNew = Boolean(row.isNew);
    let data;
    try {
      data = {...row.data, id:row.id,category:$("edit-category").value,type:$("edit-type").value,image:pendingImage ? pendingImage.url : $("edit-existing-image").value};
      if (!data.image) throw new Error("Selecciona una imagen del catálogo o sube una foto antes de guardar.");
      for (const field of ["name", "subtitle", "price"]) data[field] = $("edit-" + field).value.trim();
      for (const field of ["variants", "specs"]) data[field] = $("edit-" + field).value.split("\n").map(s => s.trim()).filter(Boolean);
      const numeric = $("edit-number").value.trim();
      if (numeric) data.priceNum = Number(numeric); else delete data.priceNum;
      if ($("edit-auto-price").checked) {
        const calculated = window.KP_PRICES.calculate(numeric, window.KP_PRICES.packs(data.variants));
        Object.assign(data, calculated, {pricingMode:"unit"});
      } else data.pricingMode = "manual";
      window.KP_CATALOG.validate(data);
    } catch (error) { status("save-status", error.message, "error"); return; }
    saving = true;
    const published = $("edit-published").checked;
    for (const input of $("edit-form").elements) input.disabled = true;
    $("logout").disabled = true; $("reload").disabled = true; $("new-product").disabled=true; renderList();
    status("save-status", "Guardando cambios…");
    try {
      if (pendingImage && !pendingImage.uploaded) {
        status("save-status", "Subiendo foto…");
        const upload = await client.storage.from("kp-productos").upload(pendingImage.name,pendingImage.blob,{contentType:"image/webp",cacheControl:"31536000",upsert:false});
        if (upload.error) throw upload.error;
        pendingImage.uploaded=true;
      }
      status("save-status", isNew ? "Creando producto…" : "Guardando cambios…");
      const result = isNew ? await client.from("kp_products").insert({id:row.id,data,published,sort_order:row.sort_order}).select("id,data,published,version,updated_at,sort_order").single() : await client.from("kp_products").update({data, published}).eq("id", row.id).eq("version", row.version).select("id,data,published,version,updated_at,sort_order").maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) { status("save-status", "El producto cambió en otra sesión. Conserva tus cambios, pulsa Actualizar lista y vuelve a revisarlos.", "error"); return; }
      rows = isNew ? [...rows,result.data] : rows.map(r => r.id === row.id ? result.data : r); $("search").value=""; selectRow(result.data);
      $("product-count").textContent = `${rows.length} productos · ${rows.filter(r => r.published).length} visibles en la tienda`;
      window.KP_PANEL?.setCatalog(rows);
      status("save-status", isNew ? "Producto creado. Activa Mostrar en el catálogo cuando esté listo." : "Cambios guardados. Recarga la tienda para verlos.", "success");
    } catch (error) {
      status("save-status", "No se guardaron los cambios. Revisa conexión y sesión. Si es la primera carga, comprueba que ejecutaste 04-nuevos-productos.sql. Actualiza la lista si el producto ya se creó en otro intento.", "error");
    } finally {
      saving = false;
      for (const input of $("edit-form").elements) input.disabled = false;
      refreshPricingEligibility();
      $("logout").disabled = false; $("reload").disabled = false; $("new-product").disabled=false; renderList();
    }
  });
  $("logout").addEventListener("click", async () => {
    if (saving || !mayDiscard()) return;
    $("logout").disabled = true;
    const {error} = await client.auth.signOut({scope:"local"});
    $("logout").disabled = false;
    if (error) { status("list-status", "No se pudo cerrar la sesión. Reintenta antes de dejar el equipo.", "error"); return; }
    setLogin(); status("login-status", "Sesión cerrada.");
  });
  $("login-form").addEventListener("submit", async event => {
    event.preventDefault(); if (!client) return;
    $("login-button").disabled = true; status("login-status", "Comprobando acceso…");
    try {
      const {data, error} = await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
      $("password").value = "";
      if (error) { status("login-status", "No pudimos iniciar sesión. Revisa correo, contraseña y conexión.", "error"); return; }
      await openSession(data.session);
    } catch (error) { status("login-status", "No se pudo conectar. Vuelve a intentarlo.", "error"); }
    finally { $("login-button").disabled = false; }
  });
  try {
    const c = window.KP_CATALOG.configuration();
    if (!c) { $("login-button").disabled = true; status("login-status", "Panel pendiente de conexión. Configura Supabase siguiendo docs/ADMINISTRADOR.md."); return; }
    if (!window.supabase) throw new Error("No se cargó la biblioteca de acceso.");
    client = window.supabase.createClient(c.supabaseUrl, c.publishableKey, {auth:{storage:window.sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:"kp-admin-auth"}});
    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setLogin();
      else if (event === "TOKEN_REFRESHED" && !activeUser) setTimeout(() => openSession(session), 0);
    });
    const {data, error} = await client.auth.getSession();
    if (error) throw error;
    await openSession(data.session);
  } catch (error) { $("login-button").disabled = true; status("login-status", "No se pudo preparar el acceso. Revisa la configuración y recarga la página.", "error"); }
})();
