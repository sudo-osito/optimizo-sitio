// Optimizo · sitio v3. Sin dependencias. Cada escena corre solo mientras se ve y casi todo responde al scroll.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOVIL = () => innerWidth < 1020;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const azar = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ── Títulos que se arman palabra por palabra ── */
$$(".arma").forEach((h) => {
  let i = 0;
  const partir = (txt, cls) => txt.split(/(\s+)/).map((w) => (w.trim() ? `<span class="pal"><span class="${cls || ""}" style="--i:${i++}">${w}</span></span>` : w)).join("");
  h.innerHTML = [...h.childNodes].map((n) => (n.nodeType === 3 ? partir(n.textContent) : partir(n.textContent, n.className) )).join("");
});
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } }), { threshold: .15 });
$$("[data-r], .arma, .escenario").forEach((n) => io.observe(n));

function alVer(el, entrar, salir, umbral = .1) {
  new IntersectionObserver(([e]) => (e.isIntersecting ? entrar() : salir && salir()), { threshold: umbral }).observe(el);
}
function bucleVisible(el, cuadro, fps = 60) {
  let vivo = false, raf = 0, ultimo = 0; const t0 = performance.now();
  const paso = (ahora) => { if (!vivo) return; raf = requestAnimationFrame(paso); if (ahora - ultimo < 1000 / fps - 2) return; ultimo = ahora; cuadro((ahora - t0) / 1000); };
  alVer(el, () => { if (!vivo) { vivo = true; raf = requestAnimationFrame(paso); } }, () => { vivo = false; cancelAnimationFrame(raf); }, 0);
  if (QUIETO) requestAnimationFrame(() => cuadro(6));
}
const avance = (sec) => { const r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };

/* ── Navegación: oscura sobre la noche, clara sobre el día ── */
const nav = $("#nav");
function pintarNav() {
  const y = nav.getBoundingClientRect().bottom + 2;
  const sobre = $$(".oscuro, .lumina.abierta").some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
  nav.classList.toggle("clara", !sobre);
}

/* ── El isotipo hecho de LED (héroe) y el piso de luz (cierre) ── */
const hash = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
function pisoDeLuz(cv, op) {
  const P = op.paso || 12, LUZ = op.luz || 8.5;
  const c = cv.getContext("2d"), chico = document.createElement("canvas"), cc = chico.getContext("2d");
  let w = 0, h = 0, cols = 0, filas = 0, img = null, rejilla = null, mx = 0, mxSuave = 0;
  const ajustar = () => {
    const dpr = Math.min(2, devicePixelRatio || 1); w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / P); filas = Math.ceil(h / P); chico.width = cols; chico.height = filas; img = cc.createImageData(cols, filas);
    // la rejilla tapa el borde de cada celda para que se lean como LED separados
    const m = document.createElement("canvas"); m.width = P; m.height = P; const mc = m.getContext("2d");
    mc.fillStyle = op.fondo; mc.fillRect(0, 0, P, P); mc.clearRect(0, 0, LUZ, LUZ); rejilla = c.createPattern(m, "repeat");
  };
  ajustar(); addEventListener("resize", ajustar);
  cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; });
  const MENTA = [145, 206, 196], TEAL = [89, 189, 177], HIELO = [214, 244, 238];
  const R = 5.2, Z0 = op.z0 || 7.2, H = op.altura || 1, MORD = op.mordida ?? -2.36, hueco = .27;
  return (t) => {
    if (!img) return;
    mxSuave += (mx - mxSuave) * .05;
    const d = img.data, hz = h * op.horizonte, cx = w / 2, f = w * (op.foco || .95);
    const th = t * (op.giro || .06) + mxSuave * .5 + (op.angulo || 0), cs = Math.cos(th), sn = Math.sin(th);
    const bx = Math.cos(MORD) * R * .93, bz = Math.sin(MORD) * R * .93, br = R * .34;
    d.fill(0);
    for (let j = 0; j < filas; j++) {
      const sy = j * P + P / 2 - hz; if (sy <= 1) continue;
      const z = H * f / sy; if (z > 22) continue;
      const niebla = clamp(1 - (z - 2.5) / 15) * clamp(sy / 40);
      for (let i = 0; i < cols; i++) {
        const x = (i * P + P / 2 - cx) * z / f, dz = z - Z0;
        const u = x * cs - dz * sn, v = x * sn + dz * cs, r = Math.hypot(u, v) / R;
        const k = (j * cols + i) * 4;
        let a, col;
        if (r <= 1 && r >= hueco && Math.hypot(u - bx, v - bz) > br) {
          const borde = (r > .955 || r < hueco + .04) ? 1 : 0;
          const onda = Math.pow(.5 + .5 * Math.sin(r * 10 - t * 1.7), 4);
          const titila = hash(i, j, Math.floor(t * 3)) * .14;
          a = (.16 + .62 * onda + .4 * borde + titila) * niebla;
          const g = clamp((u / R + 1) / 2);
          col = onda > .7 ? HIELO : [MENTA[0] + (TEAL[0] - MENTA[0]) * g, MENTA[1] + (TEAL[1] - MENTA[1]) * g, MENTA[2] + (TEAL[2] - MENTA[2]) * g];
        } else { a = .045 * niebla; col = [120, 150, 160]; }
        d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = Math.round(clamp(a) * 255);
      }
    }
    // el punto que se escapa: flota fuera de la mordida
    const pu = Math.cos(MORD) * R * 1.32, pv = Math.sin(MORD) * R * 1.32;
    const X = pu * cs + pv * sn, Zp = -pu * sn + pv * cs + Z0, Y = .95 + .18 * Math.sin(t * 1.3);
    const psx = cx + X * f / Zp, psy = hz + (H - Y) * f / Zp, prr = .62 * f / Zp;
    if (Zp > 1) {
      for (let j = Math.max(0, Math.floor((psy - prr) / P)); j <= Math.min(filas - 1, Math.ceil((psy + prr) / P)); j++)
        for (let i = Math.max(0, Math.floor((psx - prr) / P)); i <= Math.min(cols - 1, Math.ceil((psx + prr) / P)); i++) {
          const q = Math.hypot(i * P + P / 2 - psx, j * P + P / 2 - psy) / prr; if (q > 1) continue;
          const k = (j * cols + i) * 4, luz = 1 - q * .55;
          d[k] = 145 + 90 * luz; d[k + 1] = 206 + 40 * luz; d[k + 2] = 196 + 50 * luz; d[k + 3] = 255;
        }
    }
    cc.putImageData(img, 0, 0);
    c.clearRect(0, 0, w, h);
    if (Zp > 1) { const g = c.createRadialGradient(psx, psy, 0, psx, psy, prr * 4); g.addColorStop(0, "rgba(145,206,196,.28)"); g.addColorStop(1, "rgba(145,206,196,0)"); c.fillStyle = g; c.fillRect(psx - prr * 4, psy - prr * 4, prr * 8, prr * 8); }
    c.imageSmoothingEnabled = false; c.drawImage(chico, 0, 0, cols * P, filas * P);
    c.fillStyle = rejilla; c.fillRect(0, 0, w, h);
    // se funde con el fondo abajo, donde van los logos
    const y0 = h * (op.fundido || .8), fin = c.createLinearGradient(0, y0, 0, h); fin.addColorStop(0, op.fondo + "00"); fin.addColorStop(1, op.fondo);
    c.fillStyle = fin; c.fillRect(0, y0, w, h - y0);
  };
}
function discoDeLuz(cv, op) {
  const P = op.paso || 12, LUZ = op.luz || 8.5;
  const c = cv.getContext("2d"), chico = document.createElement("canvas"), cc = chico.getContext("2d");
  let w = 0, h = 0, cols = 0, filas = 0, img = null, rejilla = null, mx = 0, my = 0, sx = 0, sy = 0;
  const ajustar = () => {
    const dpr = Math.min(2, devicePixelRatio || 1); w = cv.clientWidth; h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / P); filas = Math.ceil(h / P); chico.width = cols; chico.height = filas; img = cc.createImageData(cols, filas);
    const m = document.createElement("canvas"); m.width = P; m.height = P; const mc = m.getContext("2d");
    mc.fillStyle = op.fondo; mc.fillRect(0, 0, P, P); mc.clearRect(0, 0, LUZ, LUZ); rejilla = c.createPattern(m, "repeat");
  };
  ajustar(); addEventListener("resize", ajustar);
  cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; });
  const MENTA = [145, 206, 196], TEAL = [74, 168, 160], HIELO = [222, 248, 243], MORD = 2.36, HUECO = .265;
  return (t) => {
    if (!img) return;
    sx += (mx - sx) * .04; sy += (my - sy) * .04; const mx2 = (mx + .5) * w, my2 = (my + .5) * h;
    const d = img.data, ccx = w * op.x, ccy = h * op.y, f = h * 1.25, D = 10, R = op.radio * h * D / f;
    const fi = Math.sin(t * .22) * .55 + sx * .6, ta = .18 + Math.sin(t * .17) * .08 - sy * .3;
    const cf = Math.cos(fi), sf = Math.sin(fi), ct = Math.cos(ta), st = Math.sin(ta);
    // base del plano: u (derecha), v (arriba), n (normal), girada en Y y luego en X
    const u = [cf, 0, -sf], v = [sf * st, ct, cf * st], n = [sf * ct, -st, cf * ct];
    const C = [0, 0, D], Cn = C[0] * n[0] + C[1] * n[1] + C[2] * n[2];
    const bx = Math.cos(MORD) * R * .93, by = Math.sin(MORD) * R * .93, br = R * .34, frente = Math.abs(n[2]);
    d.fill(0);
    for (let j = 0; j < filas; j++) {
      const dy = -(j * P + P / 2 - ccy) / f;
      for (let i = 0; i < cols; i++) {
        const dx = (i * P + P / 2 - ccx) / f, dn = dx * n[0] + dy * n[1] + n[2];
        if (Math.abs(dn) < 1e-4) continue;
        const k2 = Cn / dn, px = dx * k2 - C[0], py = dy * k2 - C[1], pz = k2 - C[2];
        const lu = px * u[0] + py * u[1] + pz * u[2], lv = px * v[0] + py * v[1] + pz * v[2], r = Math.hypot(lu, lv) / R;
        if (r > 1 || r < HUECO || Math.hypot(lu - bx, lv - by) < br) continue;
        const k = (j * cols + i) * 4;
        const borde = (r > .955 || r < HUECO + .045) ? 1 : 0;
        const onda = Math.pow(.5 + .5 * Math.sin(r * 9 - t * 1.5), 5);
        const barrido = Math.pow(clamp(1 - Math.abs(((lu / R + 1) / 2) - ((t * .12) % 1.6 - .3)) * 4), 2);
        const titila = hash(i, j, Math.floor(t * 3)) * .12;
        const cerca = Math.exp(-(((i * P - mx2) ** 2) + ((j * P - my2) ** 2)) / 9000);
        const a = (.22 + .5 * onda + .35 * borde + .35 * barrido + titila + .7 * cerca) * (.55 + .45 * frente);
        const g = clamp((lu / R + 1) / 2), luz = Math.max(onda, barrido);
        const base = [MENTA[0] + (TEAL[0] - MENTA[0]) * g, MENTA[1] + (TEAL[1] - MENTA[1]) * g, MENTA[2] + (TEAL[2] - MENTA[2]) * g];
        d[k] = base[0] + (HIELO[0] - base[0]) * luz; d[k + 1] = base[1] + (HIELO[1] - base[1]) * luz; d[k + 2] = base[2] + (HIELO[2] - base[2]) * luz;
        d[k + 3] = Math.round(clamp(a) * 255 * (op.alfa || 1));
      }
    }
    // el punto que se escapa por la mordida, despegándose del plano
    const ang = MORD + .06 * Math.sin(t * .9), dist = R * (1.3 + .05 * Math.sin(t * 1.3)), sale = R * .25 * (.5 + .5 * Math.sin(t * .7));
    const lu0 = Math.cos(ang) * dist, lv0 = Math.sin(ang) * dist;
    const Px = C[0] + u[0] * lu0 + v[0] * lv0 + n[0] * -sale, Py = C[1] + u[1] * lu0 + v[1] * lv0 + n[1] * -sale, Pz = C[2] + u[2] * lu0 + v[2] * lv0 + n[2] * -sale;
    const psx = ccx + Px / Pz * f, psy = ccy - Py / Pz * f, prr = R * .3 / Pz * f;
    for (let j = Math.max(0, Math.floor((psy - prr) / P)); j <= Math.min(filas - 1, Math.ceil((psy + prr) / P)); j++)
      for (let i = Math.max(0, Math.floor((psx - prr) / P)); i <= Math.min(cols - 1, Math.ceil((psx + prr) / P)); i++) {
        const q = Math.hypot(i * P + P / 2 - psx, j * P + P / 2 - psy) / prr; if (q > 1) continue;
        const k = (j * cols + i) * 4, l = 1 - q * .5;
        d[k] = 160 + 80 * l; d[k + 1] = 215 + 35 * l; d[k + 2] = 205 + 45 * l; d[k + 3] = Math.round(255 * (op.alfa || 1));
      }
    cc.putImageData(img, 0, 0);
    c.clearRect(0, 0, w, h);
    const halo = c.createRadialGradient(ccx, ccy, 0, ccx, ccy, op.radio * h * 1.5); halo.addColorStop(0, `rgba(89,189,177,${.1 * (op.alfa || 1)})`); halo.addColorStop(1, "rgba(89,189,177,0)");
    c.fillStyle = halo; c.fillRect(0, 0, w, h);
    const g2 = c.createRadialGradient(psx, psy, 0, psx, psy, prr * 4); g2.addColorStop(0, "rgba(160,220,210,.3)"); g2.addColorStop(1, "rgba(160,220,210,0)"); c.fillStyle = g2; c.fillRect(psx - prr * 4, psy - prr * 4, prr * 8, prr * 8);
    c.imageSmoothingEnabled = false; c.drawImage(chico, 0, 0, cols * P, filas * P);
    c.fillStyle = rejilla; c.fillRect(0, 0, w, h);
  };
}
const NOCHE = "#0B131B";
{
  const movil = innerWidth < 700, cv = $("#lienzo-heroe");
  bucleVisible(cv, discoDeLuz(cv, movil ? { fondo: NOCHE, x: .5, y: .2, radio: .2, alfa: .5, paso: 9, luz: 6.5 } : { fondo: NOCHE, x: .75, y: .5, radio: .3 }), 30);
  const cv2 = $("#lienzo-cierre");
  bucleVisible(cv2, pisoDeLuz(cv2, { fondo: NOCHE, horizonte: movil ? .62 : .55, foco: movil ? 1.6 : .9, altura: 2.2, z0: 8.5, paso: movil ? 9 : 12, luz: movil ? 6.5 : 8.5, fundido: .97 }), 30);
}

/* ── Desafío: el día se llena de ventanas a medida que bajas ── */
const secDz = $("#desafio"), ventanas = $$(".vent", secDz), dzLista = $$("#dz-lista li"), dzRemate = $(".dz__remate");
function pintarDesafio() {
  if (MOVIL()) return;
  const p = avance(secDz);
  ventanas.forEach((v, i) => v.classList.toggle("on", p > .04 + i * .12));
  dzLista.forEach((li, i) => li.classList.toggle("on", p > .06 + i * .14));
  dzRemate.style.setProperty("--k", eo((p - .78) / .14));
}

/* ── Héroe: la palabra del bloque va cambiando ── */
{
  const rota = $("#rota"), txt = $("span", rota), PAL = ["tu empresa", "tu bodega", "tu equipo", "tu operación", "tus ventas"];
  let i = 0;
  if (!QUIETO) setInterval(() => { rota.classList.add("sale"); setTimeout(() => { i = (i + 1) % PAL.length; txt.textContent = PAL[i]; rota.classList.remove("sale"); }, 450); }, 2600);
}

/* ── Credibilidad: dos cintas de marcas ── */
{
  const A = [["whatsapp", "WhatsApp"], ["gmail", "Gmail"], ["googlesheets", "Google Sheets"], ["slack", "Slack"], ["notion", "Notion"], ["hubspot", "HubSpot"], ["shopify", "Shopify"], ["mercadopago", "Mercado Pago"], ["zoho", "Zoho"], ["salesforce", "Salesforce"], ["sap", "SAP"], ["odoo", "Odoo"], ["openai", "ChatGPT"], ["claude", "Claude"], ["googledrive", "Google Drive"], ["googlecalendar", "Calendar"], ["meta", "Meta"], ["instagram", "Instagram"]];
  const B = [["googlemeet", "Meet"], ["zoom", "Zoom"], ["trello", "Trello"], ["asana", "Asana"], ["clickup", "ClickUp"], ["jira", "Jira"], ["airtable", "Airtable"], ["dropbox", "Dropbox"], ["stripe", "Stripe"], ["woocommerce", "WooCommerce"], ["wordpress", "WordPress"], ["quickbooks", "QuickBooks"], ["xero", "Xero"], ["zapier", "Zapier"], ["make", "Make"], ["n8n", "n8n"], ["telegram", "Telegram"], ["canva", "Canva"]];
  const loc = [["", "Bsale"], ["../logos/defontana.svg", "Defontana"], ["../logos/softland.png", "Softland"]];
  const m = ([f, n]) => `<span class="marca">${f ? `<img src="recursos/marcas/${f.includes(".") ? f : f + ".svg"}" alt="">` : ""}${n}</span>`;
  const a = [...A.slice(0, 9), ...loc, ...A.slice(9)], b = B;
  $("#marcas-a").innerHTML = [...a, ...a].map(m).join(""); $("#marcas-b").innerHTML = [...b, ...b].map(m).join("");
}

/* ── Demo: el pedido viaja por Optimizo y vuelve como informe ── */
{
  const esc = $("#escenario"), llamadas = $$(".llamada", esc), filas = Object.fromEntries($$(".fila", esc).map((f) => [f.dataset.fila, f]));
  const logo = $("#pila-logo"), titulo = $("#doc-titulo"), vacio = $("#doc-vacio"), lineas = $$(".doc__linea", esc), conteo = $("#conteo"), boton = $("#pausa-demo");
  let corriendo = false, pausado = false, ciclo = 0;
  const pulso = () => { logo.style.setProperty("--pulso", 1); setTimeout(() => logo.style.setProperty("--pulso", 0), 300); };
  const espera = async (ms) => { const fin = performance.now() + ms; while (performance.now() < fin || pausado) await esperar(80); };
  function limpiar() {
    llamadas.forEach((l) => l.classList.remove("on", "lista")); Object.values(filas).forEach((f) => f.classList.remove("on"));
    titulo.textContent = "Sin título"; titulo.classList.remove("lleno"); vacio.style.display = ""; lineas.forEach((l) => l.classList.remove("on")); conteo.textContent = "Cada acción";
  }
  async function escena() {
    const mio = ++ciclo; limpiar(); await espera(1100);
    filas.permisos.classList.add("on"); pulso(); await espera(500);
    for (const l of llamadas) {
      if (mio !== ciclo || !corriendo) return;
      l.classList.add("on"); const f = filas[l.dataset.fila]; f.classList.add("on"); pulso();
      await espera(950); l.classList.add("lista"); f.classList.remove("on");
    }
    filas.permisos.classList.remove("on"); filas.registro.classList.add("on"); conteo.textContent = "4 acciones"; pulso();
    titulo.textContent = "Reunión con Quillay · jueves"; titulo.classList.add("lleno"); vacio.style.display = "none";
    for (const l of lineas) { await espera(480); l.classList.add("on"); }
    filas.alertas.classList.add("on"); await espera(900); filas.alertas.classList.remove("on");
    await espera(4200); filas.registro.classList.remove("on");
  }
  boton.addEventListener("click", () => { pausado = !pausado; boton.innerHTML = `<svg><use href="#i-${pausado ? "play" : "pausa"}"/></svg>`; boton.setAttribute("aria-label", pausado ? "Reanudar la demostración" : "Pausar la demostración"); });
  if (QUIETO) { llamadas.forEach((l) => l.classList.add("on", "lista")); titulo.textContent = "Reunión con Quillay · jueves"; titulo.classList.add("lleno"); vacio.style.display = "none"; lineas.forEach((l) => l.classList.add("on")); }
  else alVer(esc, async () => { if (corriendo) return; corriendo = true; while (corriendo) await escena(); }, () => { corriendo = false; ciclo++; }, .3);
}

/* ── Superpoderes: emblemas hechos con la geometría del isotipo (disco, agujero, mordida y el punto) ── */
let nEmb = 0;
function emblema(tipo) {
  const id = "e" + (nEmb++), C = [44, 46], R = 27, H = 7, B = [26.6, 28.6, 10], P = [19.5, 21.5, 8];
  const defs = `<defs><linearGradient id="g${id}" x1="0" x2="1"><stop offset="0" stop-color="#B9E6DE"/><stop offset="1" stop-color="#59BDB1"/></linearGradient>
    <mask id="m${id}"><rect width="80" height="80" fill="#fff"/><circle cx="${C[0]}" cy="${C[1]}" r="${H}" fill="#000"/><circle cx="${B[0]}" cy="${B[1]}" r="${B[2]}" fill="#000"/></mask></defs>`;
  const disco = (extra = "", op = 1) => `<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="url(#g${id})" mask="url(#m${id})" opacity="${op}" ${extra}/>`;
  const punto = (extra = "") => `<circle cx="${P[0]}" cy="${P[1]}" r="${P[2]}" fill="url(#g${id})" ${extra}/>`;
  const A = (attr, vals, dur, extra = "") => `<animate attributeName="${attr}" values="${vals}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;
  const K = (vals, dur, tipo2 = "translate", extra = "") => `<animateTransform attributeName="transform" type="${tipo2}" values="${vals}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;
  const S = 'calcMode="spline" keySplines=".3 0 .2 1;.3 0 .2 1"';
  let cuerpo = "";
  if (tipo === "eficiencia") // el disco es un reloj que se llena rápido; el punto sale disparado
    cuerpo = disco("", .25) + `<circle cx="${C[0]}" cy="${C[1]}" r="13.5" fill="none" stroke="url(#g${id})" stroke-width="27" mask="url(#m${id})" pathLength="100" stroke-dasharray="100" transform="rotate(-90 ${C[0]} ${C[1]})">${A("stroke-dashoffset", "100;0;0;100", 2.4, 'keyTimes="0;.5;.8;1"')}</circle>`
      + `<g>${K("0 0;-6 -6;0 0", 2.4, "translate", 'keyTimes="0;.5;1" ' + S)}${punto()}<path d="M27 29 L33 35 M30 23 L35 28 M23 30 L28 35" stroke="#91CEC4" stroke-width="2.4" stroke-linecap="round">${A("opacity", "0;1;0", 2.4, 'keyTimes="0;.5;1"')}</path></g>`;
  else if (tipo === "seguridad") // el punto vigila: ondas de alerta salen de él y el disco queda protegido
    cuerpo = disco() + [0, .9].map((d) => `<circle cx="${P[0]}" cy="${P[1]}" r="${P[2]}" fill="none" stroke="#FFAE1A" stroke-width="2">${A("r", `${P[2]};${P[2] + 16}`, 1.8, `begin="${d}s"`)}${A("opacity", ".9;0", 1.8, `begin="${d}s"`)}</circle>`).join("")
      + `<circle cx="${P[0]}" cy="${P[1]}" r="${P[2]}" fill="#FFAE1A"/><path d="M38 46 l4.5 4.5 l8 -8.5" fill="none" stroke="#0B131B" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity="0">${A("opacity", "0;0;1;1;0", 3.6, 'keyTimes="0;.35;.45;.9;1"')}</path>`;
  else if (tipo === "inteligencia") // el agujero se conecta con nuevos puntos: información que se cruza
    cuerpo = disco() + [[70, 18], [74, 50], [58, 76]].map(([x, y], i) => `<line x1="${C[0]}" y1="${C[1]}" x2="${x}" y2="${y}" stroke="#91CEC4" stroke-width="2" pathLength="1" stroke-dasharray="1">${A("stroke-dashoffset", "1;1;0;0;1", 3.6, `keyTimes="0;${(.1 + i * .12).toFixed(2)};${(.25 + i * .12).toFixed(2)};.85;1"`)}</line><circle cx="${x}" cy="${y}" r="0" fill="#fff">${A("r", "0;0;4.5;4.5;0", 3.6, `keyTimes="0;${(.22 + i * .12).toFixed(2)};${(.3 + i * .12).toFixed(2)};.85;1"`)}</circle>`).join("")
      + `<circle cx="${C[0]}" cy="${C[1]}" r="4" fill="#fff">${A("r", "3;5;3", 1.2)}</circle>` + punto();
  else if (tipo === "calidad") // el punto encaja exacto en la mordida: precisión
    cuerpo = disco() + `<circle cx="${B[0]}" cy="${B[1]}" r="${B[2] + 1}" fill="none" stroke="#fff" stroke-width="2" opacity="0">${A("opacity", "0;0;1;0;0", 3, 'keyTimes="0;.42;.5;.7;1"')}${A("r", `${B[2]};${B[2]};${B[2] + 1};${B[2] + 8};${B[2] + 8}`, 3, 'keyTimes="0;.42;.5;.7;1"')}</circle>`
      + `<g>${K(`0 0;${(B[0] - P[0]).toFixed(1)} ${(B[1] - P[1]).toFixed(1)};${(B[0] - P[0]).toFixed(1)} ${(B[1] - P[1]).toFixed(1)};0 0`, 3, "translate", 'keyTimes="0;.45;.7;1" calcMode="spline" keySplines=".5 0 .2 1;0 0 1 1;.4 0 .2 1"')}${punto(`r="${B[2] - .4}"`)}</g>`;
  else if (tipo === "rentabilidad") // el punto crece al subir: más valor con el mismo disco
    cuerpo = disco() + `<path d="M20 22 L20 6 M14 12 L20 6 L26 12" fill="none" stroke="#91CEC4" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0" transform="translate(-6 -8)">${A("opacity", "0;0;1;0", 2.8, 'keyTimes="0;.3;.6;1"')}</path>`
      + `<circle cx="${P[0]}" cy="${P[1]}" fill="#fff">${A("r", `${P[2]};${P[2] + 3.5};${P[2] + 3.5};${P[2]}`, 2.8, 'keyTimes="0;.5;.8;1" ' + S.replace(";.3 0 .2 1", ";0 0 1 1;.3 0 .2 1"))}${A("cy", `${P[1]};${P[1] - 7};${P[1] - 7};${P[1]}`, 2.8, 'keyTimes="0;.5;.8;1"')}</circle>`;
  else // continuidad: el punto orbita el disco sin parar
    cuerpo = `<g>${K(`0 ${C[0]} ${C[1]};360 ${C[0]} ${C[1]}`, 14, "rotate")}${disco()}</g><circle cx="${C[0]}" cy="${C[1]}" r="34" fill="none" stroke="rgba(145,206,196,.25)" stroke-width="1.5"/>`
      + `<circle cx="${C[0]}" cy="${C[1]}" r="34" fill="none" stroke="#91CEC4" stroke-width="2.5" stroke-linecap="round" pathLength="100" stroke-dasharray="18 82">${K(`0 ${C[0]} ${C[1]};360 ${C[0]} ${C[1]}`, 2.4, "rotate")}</circle>`
      + `<g>${K(`0 ${C[0]} ${C[1]};360 ${C[0]} ${C[1]}`, 2.4, "rotate")}<circle cx="${C[0] + 24}" cy="${C[1] - 24}" r="6" fill="#fff"/></g>`;
  return `<svg viewBox="0 0 80 80" aria-hidden="true">${defs}${cuerpo}</svg>`;
}
$$("[data-emb]").forEach((e) => (e.innerHTML = emblema(e.dataset.emb)));

/* ── Detecciones reales sobre video (Lumina) ── */
const DET = window.DETECCIONES || [];
const LETRA = (px) => `600 ${px}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
function lienzo(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h); return { c, w, h };
}
function mapa(w, h) { const s = Math.max(w / 16, h / 9), vw = 16 * s, vh = 9 * s, ox = (w - vw) / 2, oy = (h - vh) / 2; return { X: (n) => ox + n * vw, Y: (n) => oy + n * vh }; }
function cajas(t) {
  const f = DET.length ? DET[Math.min(DET.length - 1, Math.round(t * 25))] : null, out = [];
  if (!f) return out;
  if (f.m) { const [mx, my, mw, mh] = f.m, x0 = Math.max(mx, .43), x1 = Math.min(mx + mw, .84 - .08 * t / 5.96); out.push({ x: x0, y: Math.max(my, .02) + 40 / 630, w: x1 - x0, h: mh - 70 / 630, col: "#FF8A00", txt: "Montacargas", m: 1 }); }
  f.p.slice(0, 2).forEach((p) => out.push({ x: p[0], y: p[1] + 30 / 630, w: p[2], h: p[3], col: "#FFD37A", txt: "Persona" }));
  return out;
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
function pildora(c, x, y, txt, col, k, e) {
  const fs = 12.5 * e; c.font = LETRA(fs); const tw = c.measureText(txt).width + 22 * e, hh = 24 * e, ly = Math.max(y - hh - 6 * e, 4);
  c.globalAlpha = k; c.fillStyle = "rgba(15,11,6,.82)"; rr(c, x, ly, tw, hh, hh / 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x + 11 * e, ly + hh / 2, 3.5 * e, 0, 7); c.fill();
  c.fillStyle = "#fff"; c.textBaseline = "middle"; c.fillText(txt, x + 19 * e, ly + hh / 2 + .5); c.globalAlpha = 1;
}
function dibujarCajas(c, M, lista, k, e) {
  lista.forEach((b, i) => {
    const ki = eo(clamp(k * 1.4 - i * .15)); if (ki <= 0) return;
    const g = (1 - ki) * 10, x = M.X(b.x) - g, y = M.Y(b.y) - g, w = M.X(b.x + b.w) - M.X(b.x) + 2 * g, h = M.Y(b.y + b.h) - M.Y(b.y) + 2 * g;
    c.globalAlpha = ki; c.strokeStyle = b.col; c.lineWidth = 2 * e; c.fillStyle = b.col + "18"; rr(c, x, y, w, h, 14 * e); c.fill(); c.stroke(); c.globalAlpha = 1;
    pildora(c, x, y, b.txt, b.col, ki, e);
  });
}
function dibujarRiesgo(c, M, lista, k, t, e) {
  if (k <= .01) return;
  const P = [[.66, .99], [.7, .33], [.78, .25], [.995, .2], [.995, .99]];
  c.globalAlpha = eo(k); c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(M.X(x), M.Y(y)) : c.moveTo(M.X(x), M.Y(y)))); c.closePath();
  c.fillStyle = `rgba(229,72,77,${.1 + .06 * Math.sin(t * 5)})`; c.fill(); c.strokeStyle = "#E5484D"; c.lineWidth = 2 * e; c.setLineDash([8 * e, 6 * e]); c.stroke(); c.setLineDash([]);
  c.globalAlpha = 1; pildora(c, M.X(.69), M.Y(.97), "Zona de riesgo", "#E5484D", eo(k), e);
  const m = lista.find((b) => b.m), p = lista.find((b) => !b.m);
  if (m && p) {
    const ax = M.X(m.x + m.w), ay = M.Y(m.y + m.h * .45), bx = M.X(p.x), by = M.Y(p.y + p.h * .5), kk = eo(clamp(k * 1.5 - .3));
    c.globalAlpha = kk; c.strokeStyle = "#FFAE1A"; c.lineWidth = 2.5 * e; c.setLineDash([6 * e, 6 * e]); c.lineDashOffset = -t * 30;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(lerp(ax, bx, kk), lerp(ay, by, kk)); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    pildora(c, (ax + bx) / 2 - 44 * e, (ay + by) / 2 + 6 * e, "Proximidad", "#FFAE1A", kk, e);
  }
}
function videoConCapa(cont, alCuadro) {
  const video = $("video", cont);
  bucleVisible(cont, () => alCuadro(video.currentTime), 60);
  alVer(cont, () => video.play().catch(() => {}), () => video.pause(), 0);
}

/* puerta de Lumina: siempre detectando */
{ const puerta = $(".pt--lumina .pt__vista"), cv = $("canvas", puerta);
  videoConCapa(puerta, (t) => { const { c, w, h } = lienzo(cv); dibujarCajas(c, mapa(w, h), cajas(t), 1, clamp(w / 700, .75, 1)); }); }

/* Lumina por dentro: cuatro pasos atados al scroll */
const secLum = $("#lum-escena");
const lum = { mon: $("#monitor"), pasos: $$(".lum__paso"), marcas: $$("#lum-marcas i"), aviso: $(".aviso"), registro: $$(".registro div"), tablero: $(".tablero"), num: $("#num-eventos"), conteo: $("#conteo-cam"), paso: -1, k: { c: 1, r: 0 } };
function pintarLumina() {
  if (!secLum.offsetParent) return;
  const p = MOVIL() ? (lum.paso < 0 ? 0 : lum.paso) / 4 + .01 : avance(secLum);
  const paso = Math.min(3, Math.floor(p * 4.05));
  lum.marcas.forEach((m, i) => m.style.setProperty("--k", clamp(p * 4 - i)));
  if (!MOVIL()) { const r = secLum.getBoundingClientRect(); lum.mon.style.setProperty("--esc", lerp(.86, 1, eo(1 - r.top / innerHeight))); }
  if (paso === lum.paso) return;
  lum.paso = paso; lum.mon.dataset.paso = paso;
  lum.pasos.forEach((s, i) => s.classList.toggle("activo", i === paso));
  lum.aviso.classList.toggle("on", paso === 2); lum.registro.forEach((r) => r.classList.toggle("on", paso === 2)); lum.tablero.classList.toggle("on", paso === 3);
  $$(".zona__barra i", lum.tablero).forEach((b) => (b.style.width = paso === 3 ? b.dataset.w : "0"));
  $$(".semana i", lum.tablero).forEach((b) => (b.style.height = paso === 3 ? b.dataset.h : "0"));
  if (paso === 3) { const t0 = performance.now(); const sube = () => { const q = clamp((performance.now() - t0) / 1200); lum.num.firstChild.textContent = Math.round(eo(q) * 10); if (q < 1 && lum.paso === 3) requestAnimationFrame(sube); }; sube(); }
}
videoConCapa(lum.mon, (t) => {
  const { c, w, h } = lienzo($("canvas", lum.mon)), M = mapa(w, h), e = clamp(w / 900, .75, 1.3), ahora = performance.now() / 1000, paso = Math.max(0, lum.paso);
  lum.k.c += ((paso <= 2 ? 1 : 0) - lum.k.c) * .1; lum.k.r += ((paso === 1 || paso === 2 ? 1 : 0) - lum.k.r) * .07;
  const lista = cajas(t);
  dibujarRiesgo(c, M, lista, lum.k.r, ahora, e); dibujarCajas(c, M, lista, lum.k.c, e);
  const np = lista.filter((b) => !b.m).length; lum.conteo.innerHTML = `<b>${np}</b> ${np === 1 ? "PERSONA" : "PERSONAS"} · <b>${lista.some((b) => b.m) ? 1 : 0}</b> MONTACARGAS`;
});
if (MOVIL()) setInterval(() => { if (secLum.offsetParent) { lum.paso = (Math.max(0, lum.paso) + 1) % 4; const p = lum.paso; lum.paso = -1; const fake = p; lum.pasos.forEach((s, i) => s.classList.toggle("activo", i === fake)); lum.paso = fake; lum.mon.dataset.paso = fake; lum.aviso.classList.toggle("on", fake === 2); lum.tablero.classList.toggle("on", fake === 3); $$(".zona__barra i", lum.tablero).forEach((b) => (b.style.width = fake === 3 ? b.dataset.w : "0")); $$(".semana i", lum.tablero).forEach((b) => (b.style.height = fake === 3 ? b.dataset.h : "0")); lum.marcas.forEach((m, i) => m.style.setProperty("--k", i <= fake ? 1 : 0)); if (fake === 3) lum.num.firstChild.textContent = "10"; } }, 4500);

/* ── El aura de Médula (portada de su guion: un fluido que se arma con puntos; el grano ES el degradado) ── */
const AURA_V = "attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }";
const RUIDO = `vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}
float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<3;i++){s+=a*snoise(p);p*=2.02;a*=0.5;}return s;}`;
const CAMPO_F = `precision highp float; varying vec2 vUv; uniform float uTiempo, uScroll, uAspecto, uFuerza, uIntensidad; uniform vec2 uPuntero, uCentro; ${RUIDO}
void main(){
  float aspecto = uAspecto; vec2 p = vec2(vUv.x * aspecto, vUv.y); float t = uTiempo * 0.045;
  vec2 dp = p - vec2(uPuntero.x * aspecto, uPuntero.y); float cerca = exp(-dot(dp, dp) * 7.0) * uFuerza; p += normalize(dp + 1e-4) * cerca * 0.06;
  vec2 q = vec2(fbm(p * 0.55 + vec2(0.0, t)), fbm(p * 0.55 + vec2(5.2, -t * 0.8)));
  vec2 r = vec2(fbm(p * 0.5 + 1.1 * q + vec2(1.7 - t * 0.6, 9.2 + uScroll * 0.3)), fbm(p * 0.5 + 1.1 * q + vec2(8.3, 2.8 + t * 0.5)));
  float campo = fbm(p * 0.42 + 0.9 * r);
  vec2 centro = vec2(uCentro.x * aspecto + 0.14 * sin(uScroll * 1.3 + t * 1.2), uCentro.y - 0.2 * sin(uScroll * 0.9));
  float masa = 1.0 - smoothstep(0.0, 1.15, length((vec2(vUv.x * aspecto, vUv.y) - centro) * vec2(0.8, 1.05)));
  float d = clamp((masa * 1.3 + campo * 0.32 - 0.1) * uIntensidad, 0.0, 1.0);
  vec2 flujo = 1.1 * q + 0.9 * r + vec2(t * 1.5, uScroll * 0.6);
  gl_FragColor = vec4(d, flujo, 1.0);
}`;
const PUNTOS_F = `precision highp float; varying vec2 vUv; uniform sampler2D uCampo; uniform float uPuntillismo, uTamPunto, uArrastre, uPixel;
uniform vec3 uNucleo, uMedula, uImpulso, uAire, uBruma, uHielo;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 degradado(float d){ vec3 col = uHielo; col = mix(col, uBruma, smoothstep(0.02, 0.32, d)); col = mix(col, uAire, smoothstep(0.22, 0.52, d)); col = mix(col, uImpulso, smoothstep(0.42, 0.7, d)); col = mix(col, uMedula, smoothstep(0.6, 0.84, d)); col = mix(col, uNucleo, smoothstep(0.76, 1.0, d)); return col; }
void main(){
  vec4 c = texture2D(uCampo, vUv); float d = c.r; vec2 flujo = c.gb;
  float celda = max(1.0, uTamPunto * uPixel); vec2 coord = gl_FragCoord.xy / celda + flujo * uArrastre;
  float umbral = hash(floor(coord)) - 0.5; float amplitud = uPuntillismo * (0.1 + 0.16 * smoothstep(0.0, 0.25, d));
  gl_FragColor = vec4(degradado(clamp(d + umbral * amplitud, 0.0, 1.0)), 1.0);
}`;
const AZULES = { uNucleo: "#013ecc", uMedula: "#0853e0", uImpulso: "#1b75fd", uAire: "#63a7fc", uBruma: "#c6dffd", uHielo: "#f2f7fe" };
const hexA = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
function aura(cv, op) {
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) { cv.style.background = "radial-gradient(60% 80% at 30% 50%, #0853e0, #63a7fc 45%, #c6dffd 70%, #f2f7fe)"; return; }
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const prog = (f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, AURA_V)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); return p; };
  const pc = prog(CAMPO_F), pp = prog(PUNTOS_F);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(), fbo = gl.createFramebuffer();
  let w = 1, h = 1, cw = 1, ch = 1, dpr = 1;
  const ajustar = () => {
    dpr = Math.min(2, devicePixelRatio || 1); w = Math.max(2, Math.round(cv.clientWidth * dpr)); h = Math.max(2, Math.round(cv.clientHeight * dpr)); cv.width = w; cv.height = h;
    cw = Math.max(2, w >> 1); ch = Math.max(2, h >> 1);
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cw, ch, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  ajustar(); addEventListener("resize", ajustar); addEventListener("ruta", ajustar);
  const ptr = { x: .5, y: .5, px: .5, py: .5, vel: 0 };
  cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width; ptr.y = 1 - (e.clientY - r.top) / r.height; });
  gl.useProgram(pp); Object.entries(AZULES).forEach(([k, v]) => gl.uniform3fv(gl.getUniformLocation(pp, k), hexA(v)));
  gl.uniform1f(gl.getUniformLocation(pp, "uPuntillismo"), .7); gl.uniform1f(gl.getUniformLocation(pp, "uTamPunto"), 1.6); gl.uniform1f(gl.getUniformLocation(pp, "uArrastre"), 18);
  const U = (p, n) => gl.getUniformLocation(p, n);
  let tiempo = 12, scroll = 0, ultimo = performance.now();
  bucleVisible(cv, () => {
    const ahora = performance.now(), dt = Math.min(.1, (ahora - ultimo) / 1000); ultimo = ahora;
    tiempo += dt * .35;
    const suav = 1 - Math.pow(1 - .027, dt * 60), dx = ptr.x - ptr.px, dy = ptr.y - ptr.py; ptr.px += dx * suav; ptr.py += dy * suav;
    ptr.vel = Math.min(1, ptr.vel * Math.pow(.97, dt * 60) + Math.hypot(dx, dy) * .17);
    scroll += (scrollY / innerHeight - scroll) * (1 - Math.pow(.96, dt * 60));
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, cw, ch); gl.useProgram(pc);
    gl.uniform1f(U(pc, "uTiempo"), tiempo); gl.uniform1f(U(pc, "uScroll"), scroll * (op.scroll ?? 1)); gl.uniform1f(U(pc, "uAspecto"), w / h);
    gl.uniform2f(U(pc, "uPuntero"), ptr.px, ptr.py); gl.uniform1f(U(pc, "uFuerza"), ptr.vel); gl.uniform2f(U(pc, "uCentro"), op.centro[0], op.centro[1]); gl.uniform1f(U(pc, "uIntensidad"), op.intensidad || 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.useProgram(pp);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U(pp, "uCampo"), 0); gl.uniform1f(U(pp, "uPixel"), dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, 30);
}
const AURAS = { puerta: { centro: [.5, .82], intensidad: 1.1, scroll: .4 }, escenario: { centro: [.4, .5], intensidad: 1.25 }, demo: { centro: [.28, .52], intensidad: 1.5 } };
$$("canvas[data-aura]").forEach((cv) => aura(cv, AURAS[cv.dataset.aura]));

/* Médula Lite: la píldora que cuenta lo que está haciendo */
const LITE = ["Leyendo Bsale…", "Cruzando con Gmail…", "Actualizando Zoho CRM…", "Listo · 3 cotizaciones abiertas"];
$$("[data-lite]").forEach((el, j) => {
  const txt = $(".lite__txt", el); let i = j;
  setInterval(() => { i = (i + 1) % LITE.length; txt.style.opacity = 0; setTimeout(() => { txt.textContent = LITE[i]; txt.style.opacity = 1; }, 280); }, 2200);
});

/* Integraciones: dos cintas que corren en sentidos opuestos */
{
  const A = [["zoho.svg", "Zoho", "ERP y CRM"], ["defontana.svg", "Defontana", "ERP"], ["bsale.png", "Bsale", "Boletas y ventas"], ["softland.png", "Softland", "ERP"], ["shopify.svg", "Shopify", "Ecommerce"], ["mercadolibre.svg", "Mercado Libre", "Marketplace"], ["googlecalendar.svg", "Calendario", "Agenda"]];
  const B = [["gmail.svg", "Gmail", "Correo"], ["whatsapp.svg", "WhatsApp", "Mensajería"], ["microsoftexcel.svg", "Excel", "Planillas"], ["googlesheets.svg", "Sheets", "Planillas"], ["microsoftoutlook.svg", "Outlook", "Correo"], ["microsoftteams.svg", "Teams", "Reuniones"], ["notion.svg", "Notion", "Documentos"], ["slack.svg", "Slack", "Equipo"]];
  const placa = ([img, n, t]) => `<div class="placa"><img src="recursos/logos/${img}" alt=""><div><b>${n}</b><small>${t}</small></div></div>`;
  $("#fila-a").innerHTML = [...A, ...A].map(placa).join(""); $("#fila-b").innerHTML = [...B, ...B].map(placa).join("");
}

/* Conversación de Médula */
{
  const chat = $("#chat"), partes = $$(".msj", chat); let hablando = false;
  async function conversar() {
    if (hablando) return; hablando = true;
    while (hablando) {
      partes.forEach((p) => p.classList.remove("on")); await esperar(600);
      for (const [i, p] of partes.entries()) { p.classList.add("on"); await esperar([1200, 1800, 2600, 3800][i]); }
    }
  }
  if (QUIETO) partes.forEach((p) => p.classList.add("on")); else alVer(chat, conversar, () => (hablando = false), .3);
}

/* ── El camino se divide ── */
const rutas = $("#rutas");
function abrir(ruta, ir = true) {
  rutas.classList.add("con-ruta");
  $$(".ruta", rutas).forEach((r) => r.classList.toggle("abierta", r.dataset.ruta === ruta));
  $$(".pt").forEach((p) => p.classList.toggle("elegida", p.dataset.ruta === ruta));
  $$(".cambiar button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.ruta === ruta));
  lum.paso = -1;
  dispatchEvent(new Event("ruta")); dispatchEvent(new Event("resize"));
  if (ir) requestAnimationFrame(() => $(`#ruta-${ruta}`).scrollIntoView({ behavior: QUIETO ? "auto" : "smooth" }));
}
$$("[data-ruta]").forEach((b) => b.tagName === "BUTTON" && b.addEventListener("click", () => abrir(b.dataset.ruta)));
$$("[data-ir]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); abrir(a.dataset.ir); }));

/* ── Cómo trabajamos: cada paso muestra su entregable ── */
const secMt = $("#metodo"), mtPasos = $$("#mt-pasos li"), mtVistas = $$(".mtv");
function pintarMt() {
  if (MOVIL()) return;
  const k = Math.min(3, Math.floor(avance(secMt) * 4.1));
  mtPasos.forEach((li, i) => li.classList.toggle("activo", i === k)); mtVistas.forEach((v, i) => v.classList.toggle("activo", i === k));
}

/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarDesafio(); pintarLumina(); pintarMt(); }); }
addEventListener("scroll", alScroll, { passive: true }); addEventListener("resize", alScroll); addEventListener("ruta", alScroll);
alScroll();
