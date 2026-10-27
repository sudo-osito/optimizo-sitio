// Optimizo · sitio v2. Sin dependencias. Cada escena corre solo mientras se ve.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

/* ── Aparición ── */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } }), { threshold: .2 });
$$("[data-r], .bloque").forEach((n) => io.observe(n));

/* Corre una función mientras el elemento se ve. */
function alVer(el, entrar, salir, umbral = .15) {
  new IntersectionObserver(([e]) => (e.isIntersecting ? entrar() : salir && salir()), { threshold: umbral }).observe(el);
}
/* Bucle de animación que solo vive mientras el elemento se ve (con tope de cuadros por segundo). */
function bucleVisible(el, cuadro, fps = 60) {
  let vivo = false, raf = 0, ultimo = 0; const t0 = performance.now();
  const paso = (ahora) => { if (!vivo) return; raf = requestAnimationFrame(paso); if (ahora - ultimo < 1000 / fps - 2) return; ultimo = ahora; cuadro((ahora - t0) / 1000); };
  alVer(el, () => { if (!vivo) { vivo = true; raf = requestAnimationFrame(paso); } }, () => { vivo = false; cancelAnimationFrame(raf); }, 0);
  if (QUIETO) cuadro(2);
}

/* ── Navegación: oscura sobre la noche, clara sobre el día ── */
const nav = $("#nav"), noches = $$(".noche");
function pintarNav() {
  const y = nav.getBoundingClientRect().bottom + 2;
  nav.classList.toggle("clara", !noches.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
}
addEventListener("scroll", () => requestAnimationFrame(pintarNav), { passive: true });
pintarNav();

/* ── El isotipo hecho de luz: un piso de píxeles LED en perspectiva ──
   Disco con agujero y mordida (el isotipo), acostado y girando lento; una onda lo recorre desde el centro
   y el punto que se escapa flota sobre la mordida. Se pinta a un píxel por celda y se escala sin suavizar. */
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
/* El isotipo de pie, hecho de LED: gira lento en 3D (columpio, no vuelta completa, para que siempre se lea),
   una onda lo recorre desde el agujero y el punto se escapa por la mordida. Proyección por rayo a cada celda. */
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
    sx += (mx - sx) * .04; sy += (my - sy) * .04;
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
        const a = (.22 + .5 * onda + .35 * borde + .35 * barrido + titila) * (.55 + .45 * frente);
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
const NOCHE = "#0A1118";
{
  const movil = innerWidth < 700;
  const cv = $("#lienzo-heroe");
  bucleVisible(cv, discoDeLuz(cv, movil ? { fondo: NOCHE, x: .5, y: .2, radio: .2, alfa: .45, paso: 9, luz: 6.5 } : { fondo: NOCHE, x: .75, y: .5, radio: .285 }), 30);
  const cv2 = $("#lienzo-cierre");
  bucleVisible(cv2, pisoDeLuz(cv2, { fondo: NOCHE, horizonte: movil ? .7 : .64, foco: movil ? 1.6 : .9, paso: movil ? 9 : 12, luz: movil ? 6.5 : 8.5, z0: 8, angulo: 2.2, giro: -.05, fundido: .9 }), 30);
}

/* ── Microanimaciones de píxeles (22 × 6) ── */
const PIX = {
  fragmentada: (x, y, t) => (hash(x, y) > .72 ? (Math.sin(t * 2 + hash(y, x) * 9) > .1 ? 1 : .15) : 0),
  repetitiva: (x, y, t) => { const p = Math.floor(t * 7) % 22; return y > 0 && y < 5 && ((x - p + 22) % 22) < 3 ? 1 : 0; },
  visibilidad: (x, y, t) => { const dx = (t * 6) % 30 - x; return hash(x, y) > .5 ? (dx >= 0 && dx < 4 ? 1 - dx / 4 : 0) : 0; },
  desconectados: (x, y, t) => { const izq = x < 6 && y > 0 && y < 5, der = x > 15 && y > 0 && y < 5; if (izq || der) return .55 + .45 * Math.sin(t * 2 + (izq ? 0 : 2)); if (y === 3 && x > 6 && x < 15) return (x % 2 === 0 && Math.sin(t * 5 + x) > .6) ? .5 : 0; return 0; },
  reactiva: (x, y, t) => { const c = t % 4, cx = 15, cy = 3; if (x === cx && y === cy) return c > .4 ? [1, "alerta"] : 0; const d = Math.hypot(x - cx, y - cy); return c > 1.6 && Math.abs(d - (c - 1.6) * 6) < .7 ? .6 : 0; },
  eficiencia: (x, y, t) => { const c = (t % 4) / 4, largo = c < .45 ? 22 - 14 * eo(c / .45) : c < .85 ? 8 : 8 + 14 * eo((c - .85) / .15); if (y === 1 || y === 2) return x < largo ? 1 : 0; if (y === 4) return x < 18 ? .25 : 0; return 0; },
  seguridad: (x, y, t) => { const d = Math.hypot((x - 11) * .9, (y - 2.5) * 1.6), r = (t * 4) % 12; if (d < 1.2) return 1; return Math.abs(d - r) < .8 ? 1 - r / 12 : 0; },
  inteligencia: (x, y, t) => { const c = (t % 5) / 5, k = eo(clamp((c - .15) / .4)), ly = Math.round(5 - x / 21 * 5); if (k > .05 && y === ly && x % 2 === 0) return k; return hash(x, y) > .82 ? (1 - k) * .9 : 0; },
  calidad: (x, y, t) => { const s = (t * 5) % 26; if (y === 0 || y === 5) return 0; if (x === 14 && y === 2) return s > x + 2 ? 1 : [1, "alerta"]; return Math.abs(s - x) < 1 ? 1 : .35; },
  rentabilidad: (x, y, t) => { const c = (t % 4.5) / 4.5, col = Math.floor(x / 3), alto = Math.min(6, col + 1) * eo(clamp((c - col * .08) / .3)); return x % 3 !== 2 && 6 - y <= alto ? .5 + .5 * (6 - y) / 6 : 0; },
  continuidad: (x, y, t) => { const p = (x + Math.floor(t * 9)) % 11, ly = p === 4 ? 0 : p === 5 ? 5 : p === 6 ? 1 : 3; return y === ly ? 1 : 0; },
  semana: (x, y, t) => { const dias = [2, 1, 3, 5, 2, 1, 0], d = Math.floor(x / 3); if (x % 3 === 2 || d > 6) return 0; const alto = dias[d] * eo(clamp((t - d * .08) / .6)); return 5 - y < alto ? (d === 3 ? [1, "alerta"] : 1) : .06; },
};
function pixeles(cv, fn, oscuro) {
  const c = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = 264 * dpr; cv.height = 72 * dpr; c.scale(dpr, dpr);
  const ON = oscuro ? "145,206,196" : "17,128,122", OFF = oscuro ? "237,238,232" : "15,27,39", AL = "255,106,19";
  bucleVisible(cv, (t) => {
    c.clearRect(0, 0, 264, 72);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 22; x++) {
      let v = fn(x, y, t), tono = ON; if (Array.isArray(v)) { tono = v[1] === "alerta" ? AL : ON; v = v[0]; }
      c.fillStyle = v > .02 ? `rgba(${tono},${(.2 + .8 * v).toFixed(3)})` : `rgba(${OFF},${oscuro ? .05 : .06})`;
      c.fillRect(x * 12, y * 12, 9, 9);
    }
  }, 24);
}
$$("canvas[data-pix]").forEach((cv) => pixeles(cv, PIX[cv.dataset.pix]));

/* ── Seis superpoderes ── */
const SEIS = [
  ["eficiencia", "Eficiencia", "Aprovecha mejor cada recurso.", "Simplificamos tareas y automatizamos lo que consume tiempo sin generar valor."],
  ["seguridad", "Seguridad", "Anticipa riesgos.", "Detectamos condiciones de riesgo y avisamos a tiempo, junto a tus protocolos."],
  ["inteligencia", "Inteligencia", "Decide con información.", "Conectamos datos e identificamos patrones para entender y anticiparte."],
  ["calidad", "Calidad", "Precisión y consistencia.", "Estandarizamos procesos, detectamos desviaciones y fortalecemos la trazabilidad."],
  ["rentabilidad", "Rentabilidad", "Más valor por recurso.", "Reducimos costos y desperdicios, y recuperamos tiempo."],
  ["continuidad", "Continuidad", "Procesos bajo control.", "Monitoreo y alertas para evitar interrupciones evitables."],
];
$("#seis").innerHTML = SEIS.map(([k, n, f, p], i) => `<div class="poder" data-r style="--d:${(i % 3) * .06}s"><span class="mono">0${i + 1} · ${n}</span><canvas data-pix2="${k}"></canvas><b>${n}</b><em>${f}</em><p>${p}</p></div>`).join("");
$$("#seis [data-r]").forEach((n) => io.observe(n));
$$("canvas[data-pix2]").forEach((cv) => pixeles(cv, PIX[cv.dataset.pix2]));

/* ── Degradado vivo (WebGL): cuatro colores que se pliegan con ruido, con un poco de grano ── */
const PALETAS = {
  vision: ["#91CEC4", "#F3FBF8", "#59BDB1", "#BCE3F1"],
  medula: ["#7DB4FF", "#F4F7FF", "#C7BDFF", "#D9E8FF"],
  agentes: ["#A7D8CF", "#EEF6F3", "#9FC3F2", "#59BDB1"],
};
const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uT, uSemilla; uniform vec3 uC0, uC1, uC2, uC3;
float h(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z) * 2.0 - 1.0; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float a = uRes.x / uRes.y; vec2 p = (uv - .5) * vec2(a, 1.0);
  float t = uT * .07, s = uSemilla;
  float ang = n(vec3(p * .8 + vec2(t * .4, -t * .25), s)) * 3.6;
  p = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p;
  p += .06 * vec2(sin(p.y * 5.0 + t * 2.0), sin(p.x * 7.5 + t * 2.0));
  vec3 q = vec3(p * 2.0, t * .5 + s);
  float wx = n(q + vec3(5.2, 1.3, 0)), wy = n(q + vec3(1.7, 9.2, 0));
  vec2 r = p + .25 * vec2(wx, wy);
  float zona = n(vec3(r * 1.8, t * .3 + s));
  float dureza = pow(wx * .5 + .5, 1.5), ancho = mix(.5, .02, dureza);
  float t1 = smoothstep(-ancho, ancho, zona), t2 = smoothstep(-ancho, ancho, wy);
  float pliegue = max(1.0 - abs(t1 * 2.0 - 1.0), 1.0 - abs(t2 * 2.0 - 1.0)) * dureza;
  vec3 col = mix(mix(uC0, uC1, t1), mix(uC2, uC3, t1), t2) * ((wx * .5 + .5) * .08 + .95) * (1.0 + pliegue * .12);
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .03;
  gl_FragColor = vec4(col, 1.0);
}`;
const hexA = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
function malla(cv, paleta, semilla) {
  const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) { cv.style.background = `linear-gradient(135deg, ${paleta.join(",")})`; return; }
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}"));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr); gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const lp = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(pr, n);
  paleta.forEach((c, i) => gl.uniform3fv(U("uC" + i), hexA(c))); gl.uniform1f(U("uSemilla"), semilla);
  const ajustar = () => { cv.width = Math.max(1, Math.round(cv.clientWidth * .6)); cv.height = Math.max(1, Math.round(cv.clientHeight * .6)); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U("uRes"), cv.width, cv.height); };
  ajustar(); addEventListener("resize", ajustar);
  bucleVisible(cv, (t) => { gl.uniform1f(U("uT"), t + semilla * 10); gl.drawArrays(gl.TRIANGLES, 0, 3); }, 30);
}
$$("canvas[data-malla]").forEach((cv, i) => malla(cv, PALETAS[cv.dataset.malla], i * 1.7 + .4));

/* ── Detecciones reales sobre video ── */
const DET = window.DETECCIONES || [];
const LETRA = (px) => `500 ${px}px ui-monospace, "SF Mono", Menlo, monospace`;
function lienzo(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h); return { c, w, h };
}
function mapa(w, h) { const s = Math.max(w / 16, h / 9), vw = 16 * s, vh = 9 * s, ox = (w - vw) / 2, oy = (h - vh) / 2; return { X: (n) => ox + n * vw, Y: (n) => oy + n * vh }; }
function cajas(t) {
  const f = DET.length ? DET[Math.min(DET.length - 1, Math.round(t * 25))] : null, out = [];
  if (!f) return out;
  if (f.m) { const [mx, my, mw, mh] = f.m, x0 = Math.max(mx, .43), x1 = Math.min(mx + mw, .84 - .08 * t / 5.96); out.push({ x: x0, y: Math.max(my, .02) + 40 / 630, w: x1 - x0, h: mh - 70 / 630, col: "#FF6A13", txt: "MONTACARGAS", m: 1 }); }
  f.p.slice(0, 2).forEach((p) => out.push({ x: p[0], y: p[1] + 30 / 630, w: p[2], h: p[3], col: "#91CEC4", txt: "PERSONA" }));
  return out;
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
/* Cajas finas con esquinas marcadas y rótulo en mono: lectura de máquina, sin ruido. */
function dibujarCajas(c, M, lista, k, esc) {
  lista.forEach((b, i) => {
    const ki = eo(clamp(k * 1.4 - i * .15)); if (ki <= 0) return;
    const g = (1 - ki) * 8, x = M.X(b.x) - g, y = M.Y(b.y) - g, w = M.X(b.x + b.w) - M.X(b.x) + 2 * g, h = M.Y(b.y + b.h) - M.Y(b.y) + 2 * g, e = Math.min(18, w / 4, h / 4) * esc;
    c.globalAlpha = ki; c.strokeStyle = b.col; c.fillStyle = b.col + "12"; c.lineWidth = 1.2; rr(c, x, y, w, h, 4); c.fill(); c.stroke();
    c.lineWidth = 3 * esc; c.beginPath();
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) => { c.moveTo(px + sx * e, py); c.lineTo(px, py); c.lineTo(px, py + sy * e); });
    c.stroke();
    const fs = 11 * esc; c.font = LETRA(fs); const tw = c.measureText(b.txt).width + 12 * esc, ly = Math.max(y - 20 * esc, 2);
    c.fillStyle = b.col; c.fillRect(x, ly, tw, 18 * esc); c.fillStyle = "#0A1118"; c.textBaseline = "middle"; c.fillText(b.txt, x + 6 * esc, ly + 9 * esc);
    c.globalAlpha = 1;
  });
}
function dibujarRiesgo(c, M, lista, k, t, esc) {
  if (k <= .01) return;
  const P = [[.66, .99], [.7, .33], [.78, .25], [.995, .2], [.995, .99]];
  c.globalAlpha = eo(k); c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(M.X(x), M.Y(y)) : c.moveTo(M.X(x), M.Y(y)))); c.closePath();
  c.fillStyle = `rgba(229,72,77,${.1 + .06 * Math.sin(t * 5)})`; c.fill(); c.strokeStyle = "#E5484D"; c.lineWidth = 1.5; c.setLineDash([6, 5]); c.stroke(); c.setLineDash([]);
  const m = lista.find((b) => b.m), p = lista.find((b) => !b.m);
  if (m && p) {
    const ax = M.X(m.x + m.w), ay = M.Y(m.y + m.h * .45), bx = M.X(p.x), by = M.Y(p.y + p.h * .5);
    c.strokeStyle = "#FF6A13"; c.lineWidth = 2 * esc; c.setLineDash([4, 4]); c.lineDashOffset = -t * 24; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
    const fs = 11 * esc; c.font = LETRA(fs); const tx = "PROXIMIDAD", tw = c.measureText(tx).width + 12 * esc, mx = (ax + bx) / 2 - tw / 2, my = (ay + by) / 2 - 9 * esc;
    c.fillStyle = "#FF6A13"; c.fillRect(mx, my, tw, 18 * esc); c.fillStyle = "#fff"; c.textBaseline = "middle"; c.fillText(tx, mx + 6 * esc, my + 9 * esc);
  }
  c.globalAlpha = 1;
}
function videoConCapa(cont, alCuadro) {
  const video = $("video", cont);
  bucleVisible(cont, () => alCuadro(video.currentTime), 60);
  alVer(cont, () => video.play().catch(() => {}), () => video.pause(), 0);
}
/* tarjeta: cámara chica, siempre analizando */
{ const cont = $("#camarita"), cv = $("canvas", cont);
  videoConCapa(cont, (t) => { const { c, w, h } = lienzo(cv); dibujarCajas(c, mapa(w, h), cajas(t), 1, clamp(w / 520, .7, 1)); }); }

/* ── Demo central: el pedido viaja por Optimizo y vuelve como informe ── */
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
    const mio = ++ciclo; limpiar(); await espera(900);
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

/* ── Cámaras con IA: cuatro pasos sobre el mismo video ── */
{
  const sec = $("#camaras"), mon = $("#monitor"), cv = $("canvas", mon), tabs = $$(".cam__tab", sec);
  const aviso = $(".aviso", mon), registro = $$(".registro div", mon), tablero = $(".tablero", mon), num = $("#num-eventos"), txt = $("#cam-texto"), npaso = $("#cam-paso");
  const TEXTOS = [
    "Cámaras y procesamiento dedicados al análisis de tu operación, aparte de tu CCTV de seguridad.",
    "El modelo reconoce personas, vehículos y condiciones definidas para cada proceso. Cuadro a cuadro.",
    "Cuando ocurre lo que importa: avisa a la persona correcta, enciende balizas y registra el evento.",
    "Cada evento alimenta indicadores para ver tendencias y decidir dónde mejorar.",
  ];
  const DUR = [4500, 5500, 7000, 6500];
  let paso = 0, reloj = 0, vivo = false; const k = { c: 0, r: 0 };
  pixeles($("#pix-semana"), PIX.semana, true);
  function ir(i, manual) {
    paso = i; mon.dataset.paso = i; txt.textContent = TEXTOS[i]; npaso.textContent = `0${i + 1} / 04`;
    tabs.forEach((b, j) => { b.classList.toggle("activo", j === i); b.setAttribute("aria-selected", j === i); b.style.setProperty("--dur", `${(manual ? 12000 : DUR[j]) / 1000}s`); const l = $("i", b); l.style.animation = "none"; l.offsetWidth; l.style.animation = ""; });
    aviso.classList.toggle("on", i === 2); registro.forEach((r) => r.classList.toggle("on", i === 2)); tablero.classList.toggle("on", i === 3);
    $$(".zona__barra i", tablero).forEach((b) => (b.style.width = i === 3 ? b.dataset.w : "0"));
    if (i === 3) { const t0 = performance.now(); const sube = () => { const q = clamp((performance.now() - t0) / 1200); num.firstChild.textContent = Math.round(eo(q) * 10); if (q < 1 && paso === 3) requestAnimationFrame(sube); }; sube(); }
    clearTimeout(reloj); if (vivo && !QUIETO) reloj = setTimeout(() => ir((paso + 1) % 4), manual ? 12000 : DUR[i]);
  }
  tabs.forEach((b, i) => b.addEventListener("click", () => ir(i, true)));
  videoConCapa(mon, (t) => {
    const { c, w, h } = lienzo(cv), M = mapa(w, h), e = clamp(w / 900, .75, 1.3), ahora = performance.now() / 1000;
    k.c += ((paso === 1 || paso === 2 ? 1 : 0) - k.c) * .08; k.r += ((paso === 2 ? 1 : 0) - k.r) * .06;
    if (paso === 0) { const x = ((ahora * .45) % 1.4 - .2) * w, g = c.createLinearGradient(x - 120, 0, x + 120, 0); g.addColorStop(0, "rgba(145,206,196,0)"); g.addColorStop(.5, "rgba(145,206,196,.22)"); g.addColorStop(1, "rgba(145,206,196,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(145,206,196,.9)"; c.fillRect(x, 0, 1, h); }
    const lista = cajas(t); dibujarRiesgo(c, M, lista, k.r, ahora, e); dibujarCajas(c, M, lista, k.c, e);
  });
  alVer(sec, () => { vivo = true; sec.classList.remove("pausada"); ir(paso); }, () => { vivo = false; sec.classList.add("pausada"); clearTimeout(reloj); }, .25);
}

/* ── Médula: los nervios llevan pulsos al Orbe; la conversación termina en una acción aprobada ── */
{
  const red = $("#red"), svg = $("#nervios"), orbe = $("#orbe"), integ = $$(".integ", red), charla = $("#charla");
  let caminos = [];
  function trazar() {
    if (innerWidth < 1020) return;
    const R = red.getBoundingClientRect(), o = orbe.getBoundingClientRect(), ox = o.left - R.left + o.width / 2, oy = o.top - R.top + o.height / 2;
    svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
    caminos = integ.map((n) => { const r = n.getBoundingClientRect(), izq = r.left - R.left < ox, x = izq ? r.right - R.left : r.left - R.left, y = r.top - R.top + r.height / 2, ex = ox + (izq ? -1 : 1) * o.width / 2;
      return `M${x} ${y} C${x + (ex - x) * .5} ${y}, ${x + (ex - x) * .5} ${oy}, ${ex} ${oy}`; });
    svg.innerHTML = caminos.map((d) => `<path d="${d}" fill="none" stroke="#D5DEF0" stroke-width="1.2"/>`).join("") + `<g id="pulsos"></g>`;
  }
  function pulso(i) {
    const g = $("#pulsos", svg); if (!g || !caminos[i]) return;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", caminos[i]); p.setAttribute("fill", "none"); p.setAttribute("stroke", "#1B75FD"); p.setAttribute("stroke-width", "2.4"); p.setAttribute("stroke-linecap", "round"); g.append(p);
    const L = p.getTotalLength(), seg = 60; p.style.strokeDasharray = `${seg} ${L + seg}`; integ[i].classList.add("on");
    const t0 = performance.now(), paso = (a) => { const k = clamp((a - t0) / 1100), e = k * k * (3 - 2 * k); p.style.strokeDashoffset = -(e * (L + seg) - seg); if (k < 1) requestAnimationFrame(paso); else { p.remove(); integ[i].classList.remove("on"); orbe.style.setProperty("--pulso", 1); setTimeout(() => orbe.style.setProperty("--pulso", 0), 260); } };
    requestAnimationFrame(paso);
  }
  trazar(); addEventListener("resize", trazar);
  let tic = 0;
  alVer(red, () => { trazar(); clearInterval(tic); if (!QUIETO) tic = setInterval(() => pulso(Math.floor(Math.random() * integ.length)), 650); }, () => clearInterval(tic), .2);
  const partes = [...charla.children];
  let hablando = false;
  async function conversar() {
    if (hablando) return; hablando = true;
    while (hablando) {
      partes.forEach((p) => p.classList.remove("on")); await esperar(700);
      for (const [i, p] of partes.entries()) { p.classList.add("on"); await esperar(i === 0 ? 1300 : 2200); }
      await esperar(3500);
    }
  }
  if (QUIETO) partes.forEach((p) => p.classList.add("on"));
  else alVer(charla, conversar, () => (hablando = false), .3);
}

/* ── Conversemos: arma tu frase ── */
$$("#armador .armador__grupo").forEach((g) => {
  const destino = $(g.dataset.grupo === "que" ? "#f-que" : "#f-donde");
  $$(".opcion", g).forEach((o) => o.addEventListener("click", () => {
    $$(".opcion", g).forEach((x) => x.setAttribute("aria-pressed", x === o)); destino.textContent = o.dataset.v;
    destino.animate([{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" });
  }));
});
