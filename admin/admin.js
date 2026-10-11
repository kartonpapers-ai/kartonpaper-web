(async function () {
  "use strict";
  const $ = id => document.getElementById(id);
  let client, rows = [], selected = null, dirty = false, saving = false, activeUser = null;
  const categoryNames = {cerveza:"Cerveza",reposteria:"Repostería",gastronomia:"Gastronomía",bolsas:"Bolsas",doypack:"Doypack",posavasos:"Posavasos"};
  function status(id, message, kind = "") { $(id).textContent = message; $(id).className = kind; }
  function setLogin() {
    $("workspace").hidden = true; $("logout").hidden = true; $("login-view").hidden = false;
    rows = []; selected = null; dirty = false; activeUser = null;
    $("product-list").replaceChildren(); $("edit-form").reset(); $("edit-form").hidden = true;
  }
  function mayDiscard() { return !dirty || window.confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?"); }
  function renderList() {
    const query = $("search").value.trim().toLocaleLowerCase("es");
    const filtered = rows.filter(r => [r.data.name, r.data.category, categoryNames[r.data.category]].join(" ").toLocaleLowerCase("es").includes(query));
    $("product-list").replaceChildren();
    for (const row of filtered) {
      const button = document.createElement("button"); button.type = "button"; button.className = "product-row";
      button.setAttribute("aria-pressed", String(row.id === selected?.id));
      const image = document.createElement("img"); image.src = "../" + row.data.image; image.alt = "";
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
    selected = row; dirty = false;
    $("editor-empty").hidden = true; $("edit-form").hidden = false;
    $("edit-title").textContent = row.data.name; $("edit-id").textContent = categoryNames[row.data.category] + " · " + row.id;
    $("edit-image").src = "../" + row.data.image;
    for (const field of ["name", "subtitle", "price"]) $("edit-" + field).value = row.data[field];
    $("edit-number").value = row.data.priceNum ?? "";
    $("edit-variants").value = row.data.variants.join("\n"); $("edit-specs").value = row.data.specs.join("\n");
    $("edit-published").checked = row.published;
    status("save-status", ""); renderList();
  }
  async function loadRows() {
    $("reload").disabled = true;
    try {
      const {data, error} = await client.from("kp_products").select("id,data,published,version,updated_at,sort_order").order("sort_order").order("id");
      if (error) throw error;
      for (const row of data) { window.KP_CATALOG.validate(row.data); if (row.data.id !== row.id) throw new Error("Producto inválido"); }
      rows = data; selected = null; dirty = false;
      $("edit-form").hidden = true; $("editor-empty").hidden = false;
      $("product-count").textContent = `${rows.length} productos · ${rows.filter(r => r.published).length} visibles en la tienda`;
      renderList();
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
      $("login-view").hidden = true; $("workspace").hidden = false; $("logout").hidden = false;
      $("password").value = ""; status("login-status", ""); await loadRows();
    } catch (error) {
      await client.auth.signOut({scope:"local"}); setLogin();
      status("login-status", "Esta cuenta no tiene acceso al administrador. Revisa el usuario autorizado en Supabase.", "error");
    }
  }
  $("show-password").addEventListener("click", () => {
    const show = $("password").type === "password"; $("password").type = show ? "text" : "password";
    $("show-password").textContent = show ? "Ocultar" : "Mostrar"; $("show-password").setAttribute("aria-pressed", String(show));
  });
  $("search").addEventListener("input", renderList);
  $("edit-form").addEventListener("input", () => { dirty = true; status("save-status", "Cambios pendientes de guardar."); });
  $("cancel").addEventListener("click", () => { if (selected && !saving && mayDiscard()) selectRow(selected); });
  $("reload").addEventListener("click", () => { if (!saving && mayDiscard()) loadRows(); });
  window.addEventListener("beforeunload", event => { if (dirty || saving) { event.preventDefault(); event.returnValue = ""; } });
  $("edit-form").addEventListener("submit", async event => {
    event.preventDefault(); if (!selected || saving) return;
    const row = selected;
    let data;
    try {
      data = {...row.data};
      for (const field of ["name", "subtitle", "price"]) data[field] = $("edit-" + field).value.trim();
      for (const field of ["variants", "specs"]) data[field] = $("edit-" + field).value.split("\n").map(s => s.trim()).filter(Boolean);
      const numeric = $("edit-number").value.trim();
      if (numeric) data.priceNum = Number(numeric); else delete data.priceNum;
      window.KP_CATALOG.validate(data);
    } catch (error) { status("save-status", error.message, "error"); return; }
    saving = true;
    const published = $("edit-published").checked;
    for (const input of $("edit-form").elements) input.disabled = true;
    $("logout").disabled = true; $("reload").disabled = true; renderList();
    status("save-status", "Guardando cambios…");
    try {
      const result = await client.from("kp_products").update({data, published}).eq("id", row.id).eq("version", row.version).select("id,data,published,version,updated_at,sort_order").maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) { status("save-status", "El producto cambió en otra sesión. Conserva tus cambios, pulsa Actualizar lista y vuelve a revisarlos.", "error"); return; }
      rows = rows.map(r => r.id === row.id ? result.data : r); selectRow(result.data);
      $("product-count").textContent = `${rows.length} productos · ${rows.filter(r => r.published).length} visibles en la tienda`;
      status("save-status", "Cambios guardados. Recarga la tienda para verlos.", "success");
    } catch (error) {
      status("save-status", "No se guardaron los cambios. Revisa tu conexión y tu sesión antes de reintentar.", "error");
    } finally {
      saving = false;
      for (const input of $("edit-form").elements) input.disabled = false;
      $("logout").disabled = false; $("reload").disabled = false; renderList();
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
