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

/* ── El isotipo hecho de puntos: se arma al llegar, gira en 3D y se dispersa con el scroll ── */
function nubeIsotipo(cv, op) {
  const c = cv.getContext("2d");
  const MORD = 2.36, HUECO = .265, puntos = [];
  const s = op.densidad || .036;
  for (let y = -1, fila = 0; y <= 1; y += s * .866, fila++) for (let x = -1 + (fila % 2) * s / 2; x <= 1; x += s) {
    const r = Math.hypot(x, y); if (r > 1 || r < HUECO || Math.hypot(x - Math.cos(MORD) * .93, y - Math.sin(MORD) * .93) < .34) continue;
    puntos.push({ u: x, v: y, punto: false });
  }
  const pcx = Math.cos(MORD) * 1.3, pcy = Math.sin(MORD) * 1.3;
  for (let y = -.3; y <= .3; y += s * .866) for (let x = -.3; x <= .3; x += s) if (Math.hypot(x, y) <= .3) puntos.push({ u: pcx + x, v: pcy + y, punto: true });
  puntos.forEach((p, i) => {
    const a = azar(i) * Math.PI * 2, b = Math.acos(2 * azar(i + .5) - 1), d = 2 + azar(i + .7) * 2.5;
    p.su = Math.sin(b) * Math.cos(a) * d; p.sv = Math.sin(b) * Math.sin(a) * d; p.sw = Math.cos(b) * d;
    p.du = Math.sin(b) * Math.cos(a); p.dv = Math.sin(b) * Math.sin(a); p.dw = Math.cos(b);
    p.retraso = (Math.hypot(p.u, p.v) / 1.6) * .9 + azar(i + .3) * .35;
  });
  let w = 0, h = 0, mx = 0, my = 0, sx = 0, sy = 0;
  const ajustar = () => { const dpr = Math.min(2, devicePixelRatio || 1); w = cv.clientWidth; h = cv.clientHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0); };
  ajustar(); addEventListener("resize", ajustar);
  cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; });
  return (t) => {
    if (!w) return;
    sx += (mx - sx) * .04; sy += (my - sy) * .04;
    const disp = op.dispersion ? op.dispersion() : 0, o = op();
    const ccx = w * o.x, ccy = h * o.y, f = h * 1.25, D = 10, R = o.radio * h * D / f;
    const fi = Math.sin(t * .2) * .5 + sx * .6 + disp * 1.4 + (op.giro || 0), ta = .2 + Math.sin(t * .15) * .08 - sy * .3 - disp * .5;
    const cf = Math.cos(fi), sf = Math.sin(fi), ct = Math.cos(ta), st = Math.sin(ta);
    const U = [cf, 0, -sf], V = [sf * st, ct, cf * st], N = [sf * ct, -st, cf * ct];
    const sale = .25 * (.5 + .5 * Math.sin(t * .7)), intro = QUIETO ? 9 : t * 1.1, barrido = (t * .13) % 1.7 - .35;
    c.clearRect(0, 0, w, h);
    const halo = c.createRadialGradient(ccx, ccy, 0, ccx, ccy, o.radio * h * 1.6); halo.addColorStop(0, `rgba(89,189,177,${.12 * o.alfa})`); halo.addColorStop(1, "rgba(89,189,177,0)"); c.fillStyle = halo; c.fillRect(0, 0, w, h);
    for (const p of puntos) {
      const k = eio((intro - p.retraso) / 1.3);
      let u = lerp(p.su, p.u, k), v = lerp(p.sv, p.v, k), ww = lerp(p.sw, 0, k);
      if (p.punto) ww -= sale * k;
      const dd = disp * disp * 2.4; u += p.du * dd; v += p.dv * dd; ww += p.dw * dd;
      const X = (U[0] * u + V[0] * v + N[0] * ww) * R, Y = (U[1] * u + V[1] * v + N[1] * ww) * R, Z = D + (U[2] * u + V[2] * v + N[2] * ww) * R;
      if (Z < 1) continue;
      const px = ccx + X / Z * f, py = ccy - Y / Z * f;
      if (px < -10 || px > w + 10 || py < -10 || py > h + 10) continue;
      const r = Math.hypot(p.u, p.v);
      const onda = p.punto ? 1 : Math.pow(.5 + .5 * Math.sin(r * 9 - t * 1.5), 6);
      const luzB = Math.pow(clamp(1 - Math.abs((p.u + 1) / 2 - barrido) * 5), 2);
      const luz = Math.max(onda, luzB);
      const g = clamp((p.u + 1) / 2);
      const a = (p.punto ? 1 : .32 + .68 * luz) * (.6 + .4 * k) * o.alfa * (1 - disp * .6);
      const rr = Math.max(.6, (op.punto || 1.45) * (D / Z) * (p.punto ? 1.25 : 1) * (.8 + .5 * luz));
      c.fillStyle = `rgba(${lerp(lerp(145, 89, g), 225, luz * .6) | 0},${lerp(lerp(206, 189, g), 248, luz * .6) | 0},${lerp(lerp(196, 177, g), 243, luz * .6) | 0},${a.toFixed(3)})`;
      c.beginPath(); c.arc(px, py, rr, 0, 6.2832); c.fill();
    }
  };
}
{
  const heroe = $("#heroe");
  const ver = () => (MOVIL() ? { x: .5, y: .3, radio: .21, alfa: .6 } : { x: .74, y: .5, radio: .3, alfa: 1 });
  ver.dispersion = () => { const r = heroe.getBoundingClientRect(); return clamp(-r.top / (r.height * .9)); };
  bucleVisible($("#lienzo-heroe"), nubeIsotipo($("#lienzo-heroe"), ver), 60);
  const cierre = $("#conversemos");
  const ver2 = () => (MOVIL() ? { x: .5, y: .45, radio: .26, alfa: .3 } : { x: .5, y: .5, radio: .4, alfa: .32 });
  ver2.dispersion = () => { const r = cierre.getBoundingClientRect(); return clamp(r.top / innerHeight) * .7; };
  ver2.giro = .35; ver2.densidad = .04;
  bucleVisible($("#lienzo-cierre"), nubeIsotipo($("#lienzo-cierre"), ver2), 60);
}

/* ── Del caos al orden ── */
const secCaos = $("#caos"), mesa = $("#mesa"), cables = $("#cables");
const piezas = $$(".pieza", mesa).map((el) => ({ el, tipo: el.dataset.p }));
const CAOS = {
  app: [[.1, .44, -14], [.88, .38, 11], [.22, .78, 9], [.76, .74, -9], [.05, .66, 7], [.95, .62, -12], [.4, .9, -7], [.62, .52, 13]],
  prob: [[.3, .58, -5], [.68, .88, 4], [.84, .5, -3], [.16, .9, 5], [.5, .7, 2]],
};
function pintarCaos(t) {
  if (MOVIL()) return;
  const p = avance(secCaos), w = innerWidth, h = innerHeight;
  secCaos.classList.toggle("orden", p > .42);
  const entra = eo(p / .14), ordena = eio((p - .36) / .3), resultado = eo((p - .66) / .2);
  let ia = 0, ip = 0, ir = 0;
  const nucleo = [w * .5, h * .74];
  const posApps = [];
  piezas.forEach(({ el, tipo }, n) => {
    const ew = el.offsetWidth, eh = el.offsetHeight;
    let x, y, rot = 0, esc = 1, op = 1;
    const flota = (k) => Math.sin(t * .8 + n * 1.7) * 8 * k;
    if (tipo === "app") {
      const [cx, cy, cr] = CAOS.app[ia]; const ox = lerp(.14, .86, ia / 7);
      x = lerp(w * cx, w * ox, ordena) + flota(1 - ordena); y = lerp(h * cy, h * .55, ordena) + flota(1 - ordena) * .7;
      rot = cr * (1 - ordena); esc = lerp(.4, 1, entra) * lerp(1, .82, ordena); op = entra;
      posApps.push([x, y + 34 * esc]); ia++;
    } else if (tipo === "prob") {
      const [cx, cy, cr] = CAOS.prob[ip];
      const absorbe = eio((p - .3) / .22);
      x = lerp(w * cx, nucleo[0], absorbe) + flota(1 - absorbe); y = lerp(h * cy, nucleo[1], absorbe) + flota(1 - absorbe);
      rot = cr * (1 - absorbe); esc = lerp(.6, 1, eo((p - .03 - ip * .02) / .14)) * lerp(1, .2, absorbe); op = eo((p - .03 - ip * .02) / .12) * (1 - absorbe); ip++;
    } else if (tipo === "nucleo") {
      x = nucleo[0]; y = nucleo[1]; esc = lerp(.5, 1, eo((p - .4) / .2)); op = eo((p - .4) / .16);
    } else {
      x = w * [.27, .5, .73][ir]; y = h * .92; esc = lerp(.85, 1, resultado); op = eo((p - .68 - ir * .04) / .12); ir++;
    }
    el.style.transform = `translate(${(x - ew / 2).toFixed(1)}px, ${(y - eh / 2).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${esc.toFixed(3)})`;
    el.style.opacity = op.toFixed(3);
  });
  // los cables: de cada app al núcleo y del núcleo a cada resultado
  const kc = eio((p - .5) / .18), kr = eio((p - .66) / .16);
  cables.setAttribute("viewBox", `0 0 ${w} ${h}`);
  let html = posApps.map(([x, y]) => `<path d="M${x} ${y} C${x} ${(y + nucleo[1]) / 2}, ${nucleo[0]} ${(y + nucleo[1]) / 2 - 10}, ${nucleo[0]} ${nucleo[1] - 42}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1 - kc}" fill="none" stroke="#59BDB1" stroke-opacity=".55" stroke-width="1.5"/>`).join("");
  html += [.27, .5, .73].map((fx) => { const x = w * fx, y = h * .92 - 26; return `<path d="M${nucleo[0]} ${nucleo[1] + 42} C${nucleo[0]} ${y - 20}, ${x} ${nucleo[1] + 50}, ${x} ${y}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1 - kr}" fill="none" stroke="#14212F" stroke-opacity=".35" stroke-width="1.5"/>`; }).join("");
  if (kc > .05 && kc < 1) html += posApps.map(([x, y], i) => { const q = (t * .6 + i / 8) % 1; const yy = lerp(y, nucleo[1] - 42, q), xx = lerp(x, nucleo[0], q * q); return `<circle cx="${xx}" cy="${yy}" r="3" fill="#59BDB1"/>`; }).join("");
  cables.innerHTML = html;
}
{ let t0 = performance.now(); bucleVisible(secCaos, () => pintarCaos((performance.now() - t0) / 1000), 60); }

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

/* ── Superpoderes: el scroll vertical mueve la pista en horizontal ── */
const secPoderes = $("#superpoderes"), pista = $("#pista"), tarjetas = $$(".poder", pista), nPoder = $("#poder-n"), barraViaje = $("#barra-viaje");
let recorrido = 0;
function medirPoderes() {
  if (MOVIL()) { secPoderes.style.height = ""; return; }
  recorrido = Math.max(0, pista.scrollWidth - innerWidth + Math.max(40, (innerWidth - 1240) / 2));
  secPoderes.style.height = `${innerHeight + recorrido}px`;
}
function pintarPoderes() {
  if (MOVIL()) return;
  const p = avance(secPoderes);
  pista.style.transform = `translate3d(${(-p * recorrido).toFixed(1)}px,0,0)`;
  barraViaje.style.setProperty("--p", p);
  let mejor = 0, dist = 1e9;
  tarjetas.forEach((t, i) => { const r = t.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - innerWidth * .42); if (d < dist && !t.classList.contains("poder--fin")) { dist = d; mejor = i; } });
  tarjetas.forEach((t, i) => t.classList.toggle("activo", i === mejor));
  nPoder.textContent = String(mejor + 1).padStart(2, "0");
}
medirPoderes(); addEventListener("resize", medirPoderes);

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
{ const puerta = $(".puerta--lumina"), cv = $("canvas", puerta);
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
  $$(".puerta").forEach((p) => p.classList.toggle("elegida", p.dataset.ruta === ruta));
  $$(".cambiar button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.ruta === ruta));
  lum.paso = -1;
  dispatchEvent(new Event("ruta")); dispatchEvent(new Event("resize"));
  if (ir) requestAnimationFrame(() => $(`#ruta-${ruta}`).scrollIntoView({ behavior: QUIETO ? "auto" : "smooth" }));
}
$$("[data-ruta]").forEach((b) => b.tagName === "BUTTON" && b.addEventListener("click", () => abrir(b.dataset.ruta)));
$$("[data-ir]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); abrir(a.dataset.ir); }));

/* ── Cómo trabajamos ── */
const secMetodo = $("#metodo"), via = $("#via"), etapas = $$(".etapa", via);
function pintarMetodo() {
  if (MOVIL()) return;
  const p = avance(secMetodo), q = eio((p - .06) / .7);
  via.style.setProperty("--p", q);
  etapas.forEach((e, i) => e.classList.toggle("on", q >= i / 3 - .02));
  secMetodo.style.setProperty("--p-nota", eo((p - .8) / .12));
}

/* ── Conversemos: arma tu frase ── */
$$("#armador .armador__grupo").forEach((g) => {
  const destino = $(g.dataset.grupo === "que" ? "#f-que" : "#f-donde");
  $$(".opcion", g).forEach((o) => o.addEventListener("click", () => {
    $$(".opcion", g).forEach((x) => x.setAttribute("aria-pressed", x === o)); destino.textContent = o.dataset.v;
    destino.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" });
  }));
});

/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarPoderes(); pintarLumina(); pintarMetodo(); }); }
addEventListener("scroll", alScroll, { passive: true }); addEventListener("resize", alScroll); addEventListener("ruta", alScroll);
alScroll();
