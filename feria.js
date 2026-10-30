// Registro del stand: una pregunta por pantalla. Al final se envía a /api/visitante (el Worker lo pasa al servicio de la feria)
// y María llama. Si se cae internet, el registro queda en una cola local y se manda solo después.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ORDEN = ["inicio", "nombre", "empresa", "cargo", "celular", "correo", "interes", "listo"];
  const pasos = Object.fromEntries($$(".paso").map((p) => [p.dataset.paso, p]));
  const datos = { nombre: "", empresa: "", cargo: "", celular: "", correo: "", interes: new Set() };
  let actual = "inicio", ocupado = false, volverAListo = false;

  const guardado = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };
  const primerNombre = () => { const n = datos.nombre.trim().split(/\s+/)[0] || ""; return n.charAt(0).toUpperCase() + n.slice(1); };

  // ── Navegación ──
  function preparar(paso) {
    if (paso === "empresa") $("[data-saludo]").textContent = `Hola, ${primerNombre()}`;
    if (paso === "cargo") $("[data-empresa]").textContent = datos.empresa.trim() || "tu empresa";
    if (paso === "correo") {
      const sinCel = !datos.celular;
      $("[data-titulo-correo]").textContent = sinCel ? "¿Cuál es tu correo?" : "¿Y tu correo?";
      $("[data-omitir-correo]").hidden = sinCel;
    }
    if (paso === "interes") pintarInteres();
    if (paso === "listo") pintarResumen();
  }

  function ir(destino, atras = false) {
    if (ocupado || destino === actual) return;
    ocupado = true;
    const de = pasos[actual], a = pasos[destino];
    preparar(destino);
    de.classList.remove("entra", "vuelve");
    de.classList.add("sale");
    setTimeout(() => {
      de.hidden = true; de.classList.remove("sale");
      $$(".aviso", de).forEach((x) => (x.textContent = ""));
      [...a.children].forEach((h, i) => h.style.setProperty("--i", i));
      a.hidden = false;
      a.classList.add(atras ? "vuelve" : "entra");
      actual = destino;
      const i = ORDEN.indexOf(destino);
      $("#avance").style.transform = `scaleX(${i / (ORDEN.length - 1)})`;
      $("#atras").hidden = i === 0;
      document.body.dataset.tono = destino === "interes" || destino === "listo" ? tono() : "";
      const campo = $("input:not([type=checkbox])", a);
      if (campo) setTimeout(() => campo.focus({ preventScroll: true }), 120);
      else $(".boton", a)?.focus({ preventScroll: true });
      ocupado = false;
    }, 300);
  }

  function siguiente() {
    const i = ORDEN.indexOf(actual);
    if (volverAListo && actual !== "inicio") {
      // Si la persona vino a corregir desde el resumen, vuelve al resumen (salvo que falte un medio de contacto).
      if (!(actual === "celular" && !datos.celular && !datos.correo)) { volverAListo = false; return ir("listo"); }
    }
    ir(ORDEN[i + 1]);
  }
  function anterior() {
    volverAListo = false;
    const i = ORDEN.indexOf(actual);
    if (i > 0) ir(ORDEN[i - 1], true);
  }

  function avisar(paso, texto) {
    const p = pasos[paso];
    $(".aviso", p).textContent = texto;
    const c = $(".campo", p);
    if (c) { c.classList.remove("tiembla"); void c.offsetWidth; c.classList.add("tiembla"); }
    $("input", p)?.focus();
  }

  // ── Validación por paso ──
  const soloDigitos = (s) => s.replace(/\D/g, "");
  function formatoCelular(v) {
    let d = soloDigitos(v);
    if (d.startsWith("56") && d.length > 9) d = d.slice(2);
    d = d.slice(0, 9);
    if (d.length <= 1) return d;
    if (d.length <= 5) return `${d[0]} ${d.slice(1)}`;
    return `${d[0]} ${d.slice(1, 5)} ${d.slice(5)}`;
  }
  const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);

  function continuar() {
    if (actual === "inicio") return ir("nombre");
    if (actual === "listo") return enviar();
    const v = $("input", pasos[actual])?.value.trim() ?? "";
    switch (actual) {
      case "nombre": if (v.length < 2) return avisar("nombre", "Escribe tu nombre para seguir."); datos.nombre = v; break;
      case "empresa": if (v.length < 2) return avisar("empresa", "Escribe el nombre de tu empresa."); datos.empresa = v; break;
      case "cargo": datos.cargo = v; break;
      case "celular": {
        if (!v) { datos.celular = ""; break; }
        const d = soloDigitos(v);
        if (d.length < 8) return avisar("celular", "Ese número parece incompleto.");
        datos.celular = "+56 " + formatoCelular(v);
        break;
      }
      case "correo":
        if (!v && !datos.celular) return avisar("correo", "Necesitamos un correo o un celular para contactarte.");
        if (v && !correoValido(v)) return avisar("correo", "Revisa el correo, parece que falta algo.");
        datos.correo = v; break;
    }
    siguiente();
  }

  function omitir() {
    if (actual === "cargo") { datos.cargo = ""; $("#cargo").value = ""; }
    if (actual === "celular") { datos.celular = ""; $("#celular").value = ""; return ir("correo"); }
    if (actual === "correo") { datos.correo = ""; $("#correo").value = ""; }
    siguiente();
  }

  $("#celular").addEventListener("input", (e) => {
    const el = e.target;
    if (el.value.trim().startsWith("+") && !el.value.trim().startsWith("+56")) return;
    el.value = formatoCelular(el.value);
  });

  // ── Intereses ──
  function tono() {
    const l = datos.interes.has("Lumina"), m = datos.interes.has("Médula");
    return l && m ? "mezcla" : l ? "lumina" : m ? "medula" : "";
  }
  function pintarInteres() {
    $$(".opcion").forEach((b) => b.setAttribute("aria-pressed", String(datos.interes.has(b.dataset.v))));
    $("[data-boton-interes]").textContent = datos.interes.size ? "Continuar" : "Omitir";
    document.body.dataset.tono = tono();
  }
  $(".opciones").addEventListener("click", (e) => {
    const b = e.target.closest(".opcion"); if (!b) return;
    datos.interes.has(b.dataset.v) ? datos.interes.delete(b.dataset.v) : datos.interes.add(b.dataset.v);
    pintarInteres();
  });

  // ── Resumen y permiso ──
  const NOMBRES_INTERES = { "Lumina": "Lumina", "Médula": "Medula", "Agentes de IA": "Agentes de IA" };
  function pintarResumen() {
    $("[data-nombre]").textContent = primerNombre();
    const filas = [
      ["Nombre", datos.nombre, "nombre"],
      ["Empresa", datos.cargo ? `${datos.empresa} · ${datos.cargo}` : datos.empresa, "empresa"],
      ["Contacto", [datos.celular, datos.correo].filter(Boolean).join(" · "), "celular"],
      ["Interés", [...datos.interes].map((x) => NOMBRES_INTERES[x]).join(", ") || "Por conversar", "interes"],
    ];
    const dl = $("#resumen"); dl.textContent = "";
    for (const [et, val, paso] of filas) {
      const dt = document.createElement("dt"); dt.textContent = et;
      const dd = document.createElement("dd");
      const s = document.createElement("span"); s.textContent = val;
      const b = document.createElement("button"); b.type = "button"; b.textContent = "Editar";
      b.addEventListener("click", () => { volverAListo = true; ir(paso, true); });
      dd.append(s, b); dl.append(dt, dd);
    }
    pintarEnviar();
  }
  function pintarEnviar() {
    const llama = $("#llamar").checked, ok = $("#permiso").checked;
    $("[data-texto-enviar]").textContent = llama ? "Que María me llame" : "Registrarme";
    $(".boton-llamar").classList.toggle("solo-texto", !llama);
    $(".boton-llamar").disabled = !ok;
    $(".aviso", pasos.listo).textContent = ok ? "" : "Sin tu permiso no podemos contactarte.";
  }
  $("#permiso").addEventListener("change", pintarEnviar);

  // ── Envío y cola sin internet ──
  const COLA = "cola_visitantes";
  const leerCola = () => { try { return JSON.parse(localStorage.getItem(COLA) || "[]"); } catch { return []; } };
  const guardarCola = (c) => guardado(COLA, JSON.stringify(c));
  async function mandar(cuerpo) {
    const r = await fetch("/api/visitante", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || "No se pudo enviar"); e.validacion = r.status === 422; throw e; }
    return d;
  }
  async function vaciarCola() {
    const c = leerCola(); if (!c.length) return;
    const quedan = [];
    for (const x of c) { try { await mandar({ ...x, llamar: false }); } catch (e) { if (!e.validacion) quedan.push(x); } }
    guardarCola(quedan);
    pintarCola();
  }
  setInterval(vaciarCola, 30000); vaciarCola();

  async function enviar() {
    if (!$("#permiso").checked) return pintarEnviar();
    const btn = $(".boton-llamar");
    if (btn.classList.contains("cargando")) return;
    const cuerpo = {
      nombre: datos.nombre, empresa: datos.empresa, cargo: datos.cargo, celular: datos.celular, correo: datos.correo,
      interes: [...datos.interes], registrado_por: guardado("registrado_por") || "", llamar: $("#llamar").checked, consentimiento: true,
    };
    btn.classList.add("cargando");
    try { const d = await mandar(cuerpo); pantallaFinal(d.llamando ? "llama" : "listo"); }
    catch (err) {
      if (err.validacion) $(".aviso", pasos.listo).textContent = err.message;
      else { const c = leerCola(); c.push(cuerpo); guardarCola(c); pintarCola(); pantallaFinal("sin-red"); }
    } finally { btn.classList.remove("cargando"); }
  }

  // ── Pantalla final ──
  let reloj = null;
  function pantallaFinal(modo) {
    const n = primerNombre();
    const textos = {
      llama: ["María te está llamando", "Contesta el teléfono del stand."],
      listo: [`Listo, ${n}.`, "Gracias por visitarnos. Te escribiremos después del Summit."],
      "sin-red": [`Quedaste registrado, ${n}.`, "Sin internet por un momento: tus datos se envían solos apenas vuelva."],
    }[modo];
    $("#ll-titulo").textContent = textos[0];
    $("#ll-texto").textContent = textos[1];
    $("#llamada").classList.toggle("sin-llamada", modo !== "llama");
    $("#llamada").hidden = false;
    $("#otro").focus({ preventScroll: true });
    let s = modo === "llama" ? 120 : 10;
    clearInterval(reloj);
    $("#ll-seg").textContent = "";
    reloj = setInterval(() => {
      s--;
      $("#ll-seg").textContent = s <= 10 ? `Volviendo al inicio en ${s} s` : "";
      if (s <= 0) reiniciar();
    }, 1000);
  }

  function reiniciar() {
    clearInterval(reloj);
    $("#llamada").hidden = true;
    Object.assign(datos, { nombre: "", empresa: "", cargo: "", celular: "", correo: "" });
    datos.interes.clear();
    $$(".paso input:not([type=checkbox])").forEach((i) => (i.value = ""));
    $("#permiso").checked = true;
    volverAListo = false;
    ocupado = false;
    $$(".paso").forEach((p) => { p.hidden = p.dataset.paso !== "inicio"; p.classList.remove("entra", "sale", "vuelve"); });
    const ini = pasos.inicio;
    [...ini.children].forEach((h, i) => h.style.setProperty("--i", i));
    ini.classList.add("entra");
    actual = "inicio";
    $("#avance").style.transform = "scaleX(0)";
    $("#atras").hidden = true;
    document.body.dataset.tono = "";
  }
  $("#otro").addEventListener("click", reiniciar);

  // ── Botones y teclado ──
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-accion]"); if (!a) return;
    ({ empezar: () => ir("nombre"), seguir: continuar, omitir, enviar })[a.dataset.accion]?.();
  });
  $("#atras").addEventListener("click", anterior);
  document.addEventListener("keydown", (e) => {
    if (!$("#hoja").hidden) { if (e.key === "Escape") cerrarHoja(); return; }
    if (!$("#llamada").hidden) { if (e.key === "Enter") reiniciar(); return; }
    if (e.key === "Enter" && !e.isComposing) {
      if (e.target.closest?.("button")) return; // el botón enfocado ya responde con su propio clic
      e.preventDefault(); continuar();
    }
    if (e.key === "Escape" && actual !== "inicio") anterior();
  });

  // Si el notebook queda abandonado a mitad de camino, vuelve solo al inicio.
  let quieto = 0;
  ["pointerdown", "keydown", "input"].forEach((t) => document.addEventListener(t, () => (quieto = 0), { passive: true }));
  setInterval(() => { if (actual !== "inicio" && $("#llamada").hidden && ++quieto >= 180) reiniciar(); }, 1000);

  // ── Hoja del equipo ──
  function pintarRegistrado() {
    const r = guardado("registrado_por");
    $$("#registrado button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === r)));
  }
  function pintarCola() {
    const n = leerCola().length;
    $("#cola-estado").textContent = n ? `${n} registro${n > 1 ? "s" : ""} esperando internet.` : "";
  }
  function cerrarHoja() { $("#hoja").hidden = true; $("#equipo-abrir").focus(); }
  $("#equipo-abrir").addEventListener("click", () => { pintarRegistrado(); pintarCola(); $("#hoja").hidden = false; });
  $("#hoja-cerrar").addEventListener("click", cerrarHoja);
  $("#hoja").addEventListener("click", (e) => { if (e.target.id === "hoja") cerrarHoja(); });
  $("#registrado").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    guardado("registrado_por", b.dataset.v); pintarRegistrado();
  });
  $("#llamar").checked = guardado("llamar") !== "0";
  $("#llamar").addEventListener("change", () => { guardado("llamar", $("#llamar").checked ? "1" : "0"); pintarEnviar(); });

  reiniciar();
})();
