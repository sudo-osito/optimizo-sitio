// Optimizo · sitio de la feria. Sin dependencias: cada escena se enciende solo cuando se ve.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Aparición ── */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } }), { threshold: .18 });
$$("[data-r], .palabra").forEach((n) => io.observe(n));

/* Corre una función mientras el elemento está en pantalla. */
function alVer(el, alEntrar, alSalir, umbral = .2) {
  new IntersectionObserver(([e]) => (e.isIntersecting ? alEntrar() : alSalir && alSalir()), { threshold: umbral }).observe(el);
}

/* Avance de una sección alta con contenido fijo: 0 al entrar, 1 al salir. */
function avance(sec) {
  const r = sec.getBoundingClientRect();
  return clamp(-r.top / (r.height - innerHeight));
}

/* ── Navegación: sólida al bajar, oscura sobre las secciones de noche ── */
const nav = $("#nav"), noches = $$(".camaras, .cierre");
function pintarNav() {
  nav.classList.toggle("solida", scrollY > 20);
  const y = 36;
  nav.classList.toggle("oscura", noches.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
}

/* ── Detecciones sobre video (datos reales de Vision, 25 cuadros por segundo) ── */
const DET = window.DETECCIONES || [];
const LETRA = '600 {t}px -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif';

function lienzoListo(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  return { c, w, h };
}

/* El video se ve con object-fit: cover; traduce coordenadas normalizadas del cuadro a la caja visible. */
function mapa(w, h) {
  const s = Math.max(w / 16, h / 9), vw = 16 * s, vh = 9 * s, ox = (w - vw) / 2, oy = (h - vh) / 2;
  return { X: (n) => ox + n * vw, Y: (n) => oy + n * vh, s: vw / 1120 };
}

function cuadro(t) { return DET.length ? DET[Math.min(DET.length - 1, Math.round(t * 25))] : null; }

/* Las cajas: las del montacargas se ajustan igual que en la TV (el modelo agarra también la sombra). */
function cajas(f, t) {
  const out = [];
  if (!f) return out;
  if (f.m) {
    const [mx, my, mw, mh] = f.m, x0 = Math.max(mx, .43), x1 = Math.min(mx + mw, .84 - .08 * t / 5.96);
    out.push({ x: x0, y: Math.max(my, .02) + 40 / 630, w: x1 - x0, h: mh - 70 / 630, col: "#FF6A13", txt: "Montacargas", tipo: "m" });
  }
  f.p.slice(0, 2).forEach((p) => out.push({ x: p[0], y: p[1] + 30 / 630, w: p[2], h: p[3], col: "#59BDB1", txt: "Persona", tipo: "p" }));
  return out;
}

function redondeado(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }

function pildora(c, x, y, txt, col, k, esc) {
  const fs = Math.max(10, 13 * esc), padX = 10 * esc, hh = 24 * esc;
  c.font = LETRA.replace("{t}", fs.toFixed(1));
  const tw = c.measureText(txt).width, w = tw + padX * 2 + 12 * esc;
  c.globalAlpha = k; c.fillStyle = "#fff"; redondeado(c, x, y - hh - 6 * esc, w, hh, hh / 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x + padX + 3 * esc, y - 6 * esc - hh / 2, 3.5 * esc, 0, 7); c.fill();
  c.fillStyle = "#26405B"; c.textBaseline = "middle"; c.fillText(txt, x + padX + 12 * esc, y - 6 * esc - hh / 2 + .5);
  c.globalAlpha = 1;
}

function dibujarCajas(c, M, lista, k, esc) {
  lista.forEach((b, i) => {
    const ki = clamp(k * 1.4 - i * .15); if (ki <= 0) return;
    const g = (1 - eo(ki)) * 10, x = M.X(b.x) - g, y = M.Y(b.y) - g, w = M.X(b.x + b.w) - M.X(b.x) + 2 * g, h = M.Y(b.y + b.h) - M.Y(b.y) + 2 * g;
    c.globalAlpha = eo(ki); c.lineWidth = 2.2 * esc; c.strokeStyle = b.col; c.fillStyle = b.col + "14";
    redondeado(c, x, y, w, h, 12 * esc); c.fill(); c.stroke(); c.globalAlpha = 1;
    pildora(c, x, y, b.txt, b.col, eo(ki), esc);
  });
}

/* Zona de riesgo (la misma de la TV) y la línea de proximidad. */
function dibujarRiesgo(c, M, lista, k, t, esc) {
  if (k <= 0) return;
  const P = [[.66, .99], [.7, .33], [.78, .25], [.995, .2], [.995, .99]];
  c.globalAlpha = eo(k); c.beginPath();
  P.forEach(([x, y], i) => (i ? c.lineTo(M.X(x), M.Y(y)) : c.moveTo(M.X(x), M.Y(y)))); c.closePath();
  c.fillStyle = `rgba(229,72,77,${.12 + .06 * Math.sin(t * 5)})`; c.fill();
  c.lineWidth = 2 * esc; c.strokeStyle = "#E5484D"; c.setLineDash([8 * esc, 6 * esc]); c.stroke(); c.setLineDash([]);
  c.globalAlpha = 1;
  const m = lista.find((b) => b.tipo === "m"), p = lista.find((b) => b.tipo === "p");
  if (m && p) {
    const ax = M.X(m.x + m.w), ay = M.Y(m.y + m.h * .45), bx = M.X(p.x), by = M.Y(p.y + p.h * .5), kk = eo(clamp(k * 1.5 - .3));
    c.globalAlpha = kk; c.strokeStyle = "#FF6A13"; c.lineWidth = 2.5 * esc; c.setLineDash([6 * esc, 6 * esc]); c.lineDashOffset = -t * 30;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (bx - ax) * kk, ay + (by - ay) * kk); c.stroke(); c.setLineDash([]);
    [[ax, ay], [bx, by]].forEach(([x, y]) => { c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, 5 * esc, 0, 7); c.fill(); c.fillStyle = "#FF6A13"; c.beginPath(); c.arc(x, y, 3 * esc, 0, 7); c.fill(); });
    c.globalAlpha = 1;
    pildora(c, (ax + bx) / 2 - 40 * esc, (ay + by) / 2 - 4 * esc, "Proximidad", "#FF6A13", kk, esc);
  }
}

/* Barrido de «observar»: una luz menta cruza el cuadro. */
function dibujarBarrido(c, w, h, fase) {
  const x = -w * .3 + fase * w * 1.6, g = c.createLinearGradient(x - w * .15, 0, x + w * .15, 0);
  g.addColorStop(0, "rgba(145,206,196,0)"); g.addColorStop(.5, "rgba(145,206,196,.28)"); g.addColorStop(1, "rgba(145,206,196,0)");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}

/* Video que solo corre cuando se ve. */
function videoVisible(contenedor, video, alCuadro) {
  let vivo = false, raf = 0;
  const bucle = () => { if (!vivo) return; alCuadro(video.currentTime); raf = requestAnimationFrame(bucle); };
  alVer(contenedor, () => { vivo = true; video.play().catch(() => {}); cancelAnimationFrame(raf); bucle(); },
    () => { vivo = false; video.pause(); cancelAnimationFrame(raf); }, .05);
}

/* ── 01 · Cámara chica del héroe ── */
(() => {
  const cont = $("#cam-mini"), video = $("video", cont), cv = $("canvas", cont);
  const llegada = performance.now();
  videoVisible(cont, video, (t) => {
    const { c, w, h } = lienzoListo(cv), M = mapa(w, h), esc = clamp(w / 560, .7, 1);
    const k = clamp((performance.now() - llegada - 900) / 900);
    dibujarCajas(c, M, cajas(cuadro(t), t), k, esc);
  });
})();

/* ── 02 · Médula chica: apps que laten hacia el núcleo ── */
(() => {
  const svg = $("#medula-mini svg"), cx = 160, cy = 110;
  const apps = [["gmail.svg", 46, 44], ["whatsapp.svg", 46, 176], ["microsoftexcel.svg", 274, 44], ["zoho.svg", 274, 176], ["bsale.png", 160, 22], ["googlecalendar.svg", 160, 198]];
  const NS = "http://www.w3.org/2000/svg";
  svg.innerHTML = apps.map(([, x, y], i) => `<path id="nm${i}" d="M${x} ${y} Q${(x + cx) / 2 + (y < cy ? 18 : -18)} ${(y + cy) / 2} ${cx} ${cy}" fill="none" stroke="#C6DFFD" stroke-width="2"/>`).join("")
    + apps.map((_, i) => `<circle r="4" fill="#1B75FD" opacity="0"><animateMotion dur="2.4s" begin="${i * .4}s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .2 1"><mpath href="#nm${i}"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" dur="2.4s" begin="${i * .4}s" repeatCount="indefinite"/></circle>`).join("")
    + apps.map(([img, x, y]) => `<g><rect x="${x - 21}" y="${y - 21}" width="42" height="42" rx="12" fill="#fff" style="filter:drop-shadow(0 4px 8px rgba(6,16,46,.08))"/><image href="recursos/logos/${img}" x="${x - 11}" y="${y - 11}" width="22" height="22"/></g>`).join("")
    + `<circle cx="${cx}" cy="${cy}" r="40" fill="#63A7FC" opacity=".18"><animate attributeName="r" values="36;52;36" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".25;0;.25" dur="2.4s" repeatCount="indefinite"/></circle>
       <rect x="${cx - 34}" y="${cy - 34}" width="68" height="68" rx="20" fill="url(#gm)"/><defs><linearGradient id="gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B75FD"/><stop offset="1" stop-color="#013ECC"/></linearGradient></defs>
       <image href="recursos/medula.svg" x="${cx - 19}" y="${cy - 21}" width="38" height="42"/>`;
  svg.setAttribute("xmlns", NS);
})();

/* ── 03 · Tareas que se hacen solas ── */
(() => {
  const caja = $("#tareas");
  const T = [["gmail.svg", "Responder cotización a Quillay"], ["microsoftexcel.svg", "Actualizar inventario semanal"], ["whatsapp.svg", "Avisar despacho al cliente"], ["zoho.svg", "Registrar reunión en el CRM"], ["googlecalendar.svg", "Agendar visita técnica"], ["bsale.png", "Emitir factura de octubre"]];
  const fila = ([img, txt]) => { const d = document.createElement("div"); d.className = "tarea"; d.innerHTML = `<span class="tarea__ico"><img src="recursos/logos/${img}" alt=""></span><span class="tarea__txt">${txt}</span><span class="tarea__estado"><svg viewBox="0 0 24 24" style="color:#fff"><use href="#i-ok"/></svg></span>`; return d; };
  let i = 0; const filas = T.slice(0, 4).map(fila); filas.forEach((f) => caja.append(f)); i = 4;
  let corriendo = false;
  async function ciclo() {
    if (corriendo) return; corriendo = true;
    while (corriendo) {
      for (const f of $$(".tarea:not(.lista)", caja)) {
        if (!corriendo) break;
        f.classList.add("trabajando"); await esperar(1100);
        f.classList.remove("trabajando"); f.classList.add("lista"); await esperar(500);
      }
      await esperar(900);
      const vieja = $(".tarea", caja); vieja.style.opacity = "0"; vieja.style.transform = "translateY(-10px)"; await esperar(450);
      vieja.remove(); caja.append(fila(T[i++ % T.length]));
      $$(".tarea", caja).forEach((f, j) => { if (j >= 2) f.classList.remove("lista"); });
    }
  }
  alVer(caja, () => !QUIETO && ciclo(), () => (corriendo = false));
  if (QUIETO) $$(".tarea", caja).forEach((f) => f.classList.add("lista"));
})();

/* ── Desafío: los problemas caen desordenados con el scroll ── */
const mesa = $("#mesa"), problemas = $$(".problema", mesa), secDesafio = $("#desafio");
const DESORDEN = [[-110, -200, -5], [120, -100, 4], [-90, 0, 3], [110, 100, -4], [-60, 200, 2]];
function pintarDesafio() {
  if (innerWidth < 980) { problemas.forEach((n) => ["--o", "--x", "--y", "--rot", "--s"].forEach((v) => n.style.removeProperty(v))); return; }
  const p = avance(secDesafio), f = 1;
  problemas.forEach((n, i) => {
    const k = eo(clamp((p - .04 - i * .13) / .16)), [x, y, r] = DESORDEN[i];
    n.style.setProperty("--o", k);
    n.style.setProperty("--x", `${x * f}px`); n.style.setProperty("--y", `${(y + (1 - k) * 60) * f}px`);
    n.style.setProperty("--rot", `${r * (0.6 + (1 - k))}deg`); n.style.setProperty("--s", .9 + .1 * k);
  });
  secDesafio.style.setProperty("--p-cierre", eo(clamp((p - .76) / .16)));
}

/* ── Propuesta: la frase se enciende palabra por palabra ── */
const frase = $("[data-frase]");
(() => {
  const partes = [];
  frase.childNodes.forEach((n) => {
    if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((w) => partes.push(w.trim() ? `<span>${w}</span>` : w));
    else n.textContent.split(/(\s+)/).forEach((w) => partes.push(w.trim() ? `<span class="acento">${w}</span>` : w));
  });
  frase.innerHTML = partes.join("");
})();
const palabras = $$("span", frase);
function pintarFrase() {
  const r = frase.getBoundingClientRect(), p = clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .35));
  const n = Math.round(p * palabras.length);
  palabras.forEach((s, i) => s.classList.toggle("on", QUIETO || i < n));
}

/* ── Superpoderes ── */
const PODERES = [
  ["Eficiencia", "Aprovecha mejor cada recurso.", "Simplificamos tareas, automatizamos procesos y reducimos actividades que consumen tiempo sin generar valor."],
  ["Seguridad", "Anticipa riesgos y protege tu operación.", "Herramientas inteligentes que identifican condiciones de riesgo y generan alertas oportunas, junto a tus protocolos."],
  ["Inteligencia", "Convierte información en decisiones ágiles.", "Conectamos información e identificamos patrones para entender lo que ocurre y anticiparte."],
  ["Calidad", "Mejora la precisión y la consistencia.", "Estandarizamos procesos, detectamos desviaciones y fortalecemos la trazabilidad."],
  ["Rentabilidad", "Haz que tus recursos generen más valor.", "Reducimos costos y desperdicios, recuperamos tiempo y aprovechamos mejor lo que ya tienes."],
  ["Continuidad", "Mantén tus procesos bajo control.", "Monitoreo, alertas y análisis para detectar desviaciones a tiempo y evitar interrupciones."],
];
const M_ = "#91CEC4", T_ = "#59BDB1", D_ = "rgba(237,238,232,.18)";
const GLIFOS = [
  // eficiencia: la barra larga se acorta, el tiempo vuelve
  `<svg viewBox="0 0 150 150"><rect x="20" y="40" width="110" height="14" rx="7" fill="${D_}"/><rect x="20" y="40" height="14" rx="7" fill="${M_}"><animate attributeName="width" values="110;44;44;110" keyTimes="0;.35;.85;1" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines=".2 .8 .2 1;0 0 1 1;.4 0 .2 1"/></rect><rect x="20" y="68" width="80" height="14" rx="7" fill="${D_}"/><rect x="20" y="96" width="96" height="14" rx="7" fill="${D_}"/><circle cx="128" cy="47" r="0" fill="${T_}"><animate attributeName="r" values="0;0;9;9;0" keyTimes="0;.3;.4;.85;1" dur="4s" repeatCount="indefinite"/></circle></svg>`,
  // seguridad: escudo con ondas
  `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="30" fill="none" stroke="${M_}" stroke-width="2"><animate attributeName="r" values="30;68" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="2.4s" repeatCount="indefinite"/></circle><circle cx="75" cy="75" r="30" fill="none" stroke="${M_}" stroke-width="2"><animate attributeName="r" values="30;68" dur="2.4s" begin="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="2.4s" begin="1.2s" repeatCount="indefinite"/></circle><path d="M75 44l24 10v17c0 15-10 26-24 30-14-4-24-15-24-30V54z" fill="${M_}"/><path d="M64 74l8 8 15-16" fill="none" stroke="#26405B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // inteligencia: puntos sueltos que se ordenan en una tendencia
  `<svg viewBox="0 0 150 150">${[[22, 70, 30, 110], [48, 120, 54, 92], [74, 34, 78, 80], [100, 96, 102, 62], [126, 40, 128, 40]].map(([x1, y1, x2, y2], i) => `<circle r="7" fill="${i === 4 ? T_ : M_}"><animate attributeName="cx" values="${x1};${x2};${x2};${x1}" keyTimes="0;.35;.8;1" dur="4.4s" repeatCount="indefinite" calcMode="spline" keySplines=".2 .8 .2 1;0 0 1 1;.4 0 .2 1"/><animate attributeName="cy" values="${y1};${y2};${y2};${y1}" keyTimes="0;.35;.8;1" dur="4.4s" repeatCount="indefinite" calcMode="spline" keySplines=".2 .8 .2 1;0 0 1 1;.4 0 .2 1"/></circle>`).join("")}<polyline points="30,110 54,92 78,80 102,62 128,40" fill="none" stroke="${M_}" stroke-width="2.5" stroke-dasharray="130" stroke-dashoffset="130"><animate attributeName="stroke-dashoffset" values="130;130;0;0;130" keyTimes="0;.3;.5;.8;1" dur="4.4s" repeatCount="indefinite"/></polyline></svg>`,
  // calidad: una pieza distinta en la grilla, detectada
  `<svg viewBox="0 0 150 150">${Array.from({ length: 9 }, (_, i) => `<rect x="${28 + (i % 3) * 34}" y="${28 + Math.floor(i / 3) * 34}" width="26" height="26" rx="7" fill="${i === 5 ? "#FF6A13" : D_}">${i === 5 ? `<animate attributeName="fill" values="#FF6A13;#FF6A13;${M_};${M_};#FF6A13" keyTimes="0;.45;.55;.9;1" dur="4s" repeatCount="indefinite"/>` : ""}</rect>`).join("")}<rect x="91" y="57" width="32" height="32" rx="10" fill="none" stroke="${M_}" stroke-width="2.5" opacity="0"><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.15;.45;.55;1" dur="4s" repeatCount="indefinite"/></rect></svg>`,
  // rentabilidad: la curva sube
  `<svg viewBox="0 0 150 150"><line x1="20" y1="120" x2="130" y2="120" stroke="${D_}" stroke-width="2"/><path d="M22 108 C50 104, 60 92, 76 84 S108 50, 128 32" fill="none" stroke="${M_}" stroke-width="4" stroke-linecap="round" stroke-dasharray="160" stroke-dashoffset="160"><animate attributeName="stroke-dashoffset" values="160;0;0;160" keyTimes="0;.45;.85;1" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines=".3 0 .2 1;0 0 1 1;.4 0 .2 1"/></path><circle cx="128" cy="32" r="0" fill="${T_}"><animate attributeName="r" values="0;0;8;8;0" keyTimes="0;.4;.5;.85;1" dur="4s" repeatCount="indefinite"/></circle></svg>`,
  // continuidad: pulso estable que no se corta
  `<svg viewBox="0 0 150 150"><defs><clipPath id="cc"><rect x="14" y="30" width="122" height="90" rx="10"/></clipPath></defs><g clip-path="url(#cc)"><path d="M-110 75h30l8-20 10 40 8-20h44l8-20 10 40 8-20h44l8-20 10 40 8-20h44" fill="none" stroke="${M_}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0 0;108 0" dur="2.2s" repeatCount="indefinite"/></path></g></svg>`,
];
const fila = $("#fila-poderes");
fila.innerHTML = PODERES.map(([n, f, t], i) => `<button class="poder${i === 0 ? " activo" : ""}" role="tab" aria-selected="${i === 0}" style="--dur:5s">
  <span class="poder__num">0${i + 1}</span><span class="poder__glifo" aria-hidden="true">${GLIFOS[i]}</span>
  <span class="poder__nombre">${n}</span><span class="poder__frase">${f}</span><span class="poder__texto">${t}</span><span class="poder__barra"><i></i></span></button>`).join("");
const botonesPoder = $$(".poder", fila);
let poderActivo = 0, relojPoder = 0, poderVivo = false;
function elegirPoder(i, manual) {
  poderActivo = i;
  botonesPoder.forEach((b, j) => { b.classList.toggle("activo", j === i); b.setAttribute("aria-selected", j === i); });
  clearTimeout(relojPoder);
  if (poderVivo && !QUIETO) relojPoder = setTimeout(() => elegirPoder((poderActivo + 1) % PODERES.length), manual ? 9000 : 5000);
  botonesPoder[i].style.setProperty("--dur", manual ? "9s" : "5s");
}
botonesPoder.forEach((b, i) => {
  b.addEventListener("click", () => elegirPoder(i, true));
  b.addEventListener("mouseenter", () => matchMedia("(hover: hover)").matches && poderActivo !== i && elegirPoder(i, true));
});
alVer(fila, () => { poderVivo = true; fila.classList.remove("pausa"); elegirPoder(poderActivo); }, () => { poderVivo = false; fila.classList.add("pausa"); clearTimeout(relojPoder); }, .3);

/* ── Cámaras con IA: cuatro pasos sobre el mismo video ── */
(() => {
  const demo = $("#demo-cam"), mon = $("#monitor"), video = $("video", mon), cv = $("canvas", mon);
  const pasos = $$(".paso", demo), alerta = $(".alerta", mon), acciones = $$(".accion", mon), tablero = $(".tablero", mon);
  const DUR = [4500, 5000, 7000, 6000];
  let paso = 0, desde = performance.now(), reloj = 0, vivo = false;
  const k = { cajas: 0, riesgo: 0 };

  $("#plano").innerHTML = `<rect x="8" y="8" width="384" height="224" rx="18" fill="#F6F6F1" stroke="#E1E3DC" stroke-width="2"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${40 + i * 70}" y="30" width="34" height="56" rx="6" fill="#E3E6E0"/><rect x="${40 + i * 70}" y="164" width="34" height="48" rx="6" fill="#E3E6E0"/>`).join("")}
    ${[[90, 70, 1, "Zona 1"], [200, 126, 7, "Zona 2"], [318, 78, 2, "Zona 3"], [322, 186, 0, "Zona 4"]].map(([x, y, n, z]) => `<circle cx="${x}" cy="${y}" r="${18 + n * 5}" fill="${n > 4 ? "#FF6A13" : "#91CEC4"}" fill-opacity=".28"/>
      <circle cx="${x}" cy="${y}" r="15" fill="#fff" stroke="${n > 4 ? "#FF6A13" : "#59BDB1"}" stroke-width="3"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif" font-weight="700" font-size="14" fill="#26405B">${n}</text>`).join("")}`;

  function ir(i, manual) {
    paso = i; desde = performance.now(); mon.dataset.paso = i;
    pasos.forEach((b, j) => { b.classList.toggle("activo", j === i); b.setAttribute("aria-selected", j === i); b.style.setProperty("--dur", `${(manual ? 12000 : DUR[j]) / 1000}s`); });
    alerta.classList.toggle("on", i === 2);
    acciones.forEach((a) => a.classList.toggle("on", i === 2));
    tablero.classList.toggle("on", i === 3);
    $$(".zona__barra i", tablero).forEach((b) => (b.style.width = i === 3 ? b.style.getPropertyValue("--w") : "0"));
    // reinicia la barra de progreso del paso
    pasos.forEach((b) => { const l = $(".paso__luz", b); l.style.animation = "none"; l.offsetWidth; l.style.animation = ""; });
    clearTimeout(reloj);
    if (vivo && !QUIETO) reloj = setTimeout(() => ir((paso + 1) % 4), manual ? 12000 : DUR[i]);
  }
  pasos.forEach((b, i) => b.addEventListener("click", () => ir(i, true)));

  videoVisible(mon, video, (t) => {
    const { c, w, h } = lienzoListo(cv), M = mapa(w, h), esc = clamp(w / 900, .65, 1.25), dt = (performance.now() - desde) / 1000;
    const metaCajas = paso === 1 || paso === 2 ? 1 : 0, metaRiesgo = paso === 2 ? 1 : 0;
    k.cajas += (metaCajas - k.cajas) * .08; k.riesgo += (metaRiesgo - k.riesgo) * .06;
    if (paso === 0) dibujarBarrido(c, w, h, (dt / 2.2) % 1);
    const lista = cajas(cuadro(t), t);
    dibujarRiesgo(c, M, lista, k.riesgo, performance.now() / 1000, esc);
    dibujarCajas(c, M, lista, k.cajas, esc);
  });
  alVer(demo, () => { vivo = true; demo.classList.remove("pausa"); ir(paso); }, () => { vivo = false; demo.classList.add("pausa"); clearTimeout(reloj); }, .35);
})();

/* ── Médula: la pregunta viaja por los nervios y vuelve como acción ── */
(() => {
  const red = $("#red"), svg = $("#nervios"), nucleo = $("#nucleo"), chat = $("#chat");
  const apps = Object.fromEntries($$(".app", red).map((a) => [a.dataset.app, a]));
  let caminos = {};
  function trazar() {
    const R = red.getBoundingClientRect(), n = nucleo.getBoundingClientRect(), cx = n.left - R.left + n.width / 2, cy = n.top - R.top + n.height / 2;
    svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
    const ch = chat.getBoundingClientRect(), chx = ch.left - R.left, chy = ch.top - R.top + ch.height / 2;
    let html = "";
    caminos = {};
    Object.entries(apps).forEach(([k, a]) => {
      const r = a.getBoundingClientRect(), x = r.right - R.left, y = r.top - R.top + r.height / 2;
      const d = `M${x} ${y} C${x + (cx - x) * .55} ${y}, ${cx - (cx - x) * .45} ${cy}, ${cx - n.width / 2} ${cy}`;
      caminos[k] = d;
      html += `<path d="${d}" fill="none" stroke="#C6DFFD" stroke-width="2"/>`;
    });
    caminos.chat = `M${cx + n.width / 2} ${cy} C${(cx + chx) / 2} ${cy}, ${(cx + chx) / 2} ${chy}, ${chx} ${chy}`;
    html += `<path d="${caminos.chat}" fill="none" stroke="#C6DFFD" stroke-width="2"/><g id="impulsos"></g>`;
    svg.innerHTML = html;
  }
  /* Un impulso de luz recorre un nervio. */
  function impulso(d, ms = 900, alReves = false) {
    return new Promise((ok) => {
      const g = $("#impulsos", svg); if (!g) return ok();
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#1B75FD"); p.setAttribute("stroke-width", "3"); p.setAttribute("stroke-linecap", "round"); g.append(p);
      const L = p.getTotalLength(), seg = Math.min(70, L * .4); p.style.strokeDasharray = `${seg} ${L}`;
      const t0 = performance.now();
      const paso = (ahora) => {
        const k = clamp((ahora - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, pos = alReves ? (1 - e) * L : e * L - seg;
        p.style.strokeDashoffset = -pos; p.style.opacity = k > .9 ? (1 - k) * 10 : 1;
        if (k < 1) requestAnimationFrame(paso); else { p.remove(); ok(); }
      };
      requestAnimationFrame(paso);
    });
  }
  const pulso = () => { nucleo.style.setProperty("--pulso", 1); setTimeout(() => nucleo.style.setProperty("--pulso", 0), 350); };
  const msj = (cls, html) => { const d = document.createElement("div"); d.className = `msj ${cls}`; d.innerHTML = html; chat.append(d); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("on"))); return d; };
  const F = (img, n) => `<span class="fuente"><img src="recursos/logos/${img}" alt="">${n}</span>`;

  let corriendo = false, vuelta = 0;
  async function escena() {
    chat.innerHTML = ""; $$(".app", red).forEach((a) => a.classList.remove("on"));
    await esperar(500);
    msj("msj--yo", "¿Qué cotizaciones de Quillay siguen abiertas?");
    await esperar(700); await impulso(caminos.chat, 800, true); pulso();
    const usadas = ["bsale", "gmail", "excel"];
    await Promise.all(usadas.map(async (k, i) => { await esperar(i * 180); apps[k].classList.add("on"); await impulso(caminos[k], 900); }));
    pulso();
    const pensando = msj("msj--medula", `<span class="escribiendo"><i></i><i></i><i></i></span>`);
    await impulso(caminos.chat, 800); await esperar(500);
    pensando.innerHTML = `Tres, por <b>$18,4 M</b>. La más antigua lleva <b>12 días</b> sin respuesta. ¿Le escribo a Camila para hacer seguimiento?
      <div class="msj__fuentes">${F("bsale.png", "Bsale")}${F("gmail.svg", "Gmail")}${F("microsoftexcel.svg", "Precios.xlsx")}</div>
      <div class="msj__botones"><span class="si">Sí, escríbele</span><span>Ahora no</span></div>`;
    usadas.forEach((k) => apps[k].classList.remove("on"));
    await esperar(2600);
    const si = $(".si", pensando); si.classList.add("pulsado"); await esperar(220); si.classList.remove("pulsado");
    await impulso(caminos.chat, 700, true); pulso();
    apps.gmail.classList.add("on"); apps.zoho.classList.add("on");
    await Promise.all([impulso(caminos.gmail, 800, true), impulso(caminos.zoho, 800, true)]);
    const h = document.createElement("div"); h.className = "hecho"; h.innerHTML = `<svg viewBox="0 0 24 24"><use href="#i-ok"/></svg>Correo enviado a Camila · Seguimiento en Zoho CRM`; chat.append(h);
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add("on")));
    await esperar(4200);
  }
  async function ciclo() {
    if (corriendo) return; corriendo = true;
    while (corriendo) { trazar(); await escena(); vuelta++; }
  }
  addEventListener("resize", () => innerWidth >= 980 && trazar());
  if (QUIETO) { trazar(); return; }
  alVer(red, () => ciclo(), () => (corriendo = false), .3);
})();

/* ── Cómo trabajamos: el punto recorre las cuatro etapas ── */
const secMetodo = $("#metodo"), via = $("#via"), etapas = $$(".etapa", via);
function pintarMetodo() {
  if (innerWidth < 980) { etapas.forEach((e) => e.classList.add("on")); return; }
  const p = avance(secMetodo), q = eo(clamp((p - .08) / .72));
  via.style.setProperty("--p", q);
  etapas.forEach((e, i) => e.classList.toggle("on", q >= i / 3 - .02));
  secMetodo.style.setProperty("--p-nota", eo(clamp((p - .82) / .12)));
}

/* ── Conversemos: arma tu frase ── */
$$("#armador .armador__grupo").forEach((g) => {
  const destino = $(g.dataset.grupo === "que" ? "#f-que" : "#f-donde");
  $$(".opcion", g).forEach((o) => o.addEventListener("click", () => {
    $$(".opcion", g).forEach((x) => x.setAttribute("aria-pressed", x === o));
    destino.textContent = o.dataset.v;
    destino.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: "cubic-bezier(.16,1,.3,1)" });
  }));
});

/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() {
  if (pendiente) return; pendiente = true;
  requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarDesafio(); pintarFrase(); pintarMetodo(); });
}
addEventListener("scroll", alScroll, { passive: true });
addEventListener("resize", alScroll);
alScroll();
