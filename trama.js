// Optimizo · el banner en trama de píxeles. Cuatro escenas dibujadas con código (nada de video) que se entienden de un vistazo:
// un brazo robótico que mueve cajas, una grúa de puerto que carga un contenedor, una red neuronal procesando y engranajes que
// optimizan una curva. Cada cuadro se dibuja en gris y se escribe con caracteres estilo Matrix en los colores de Optimizo.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
const DUR = 6500;
const azar = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;

// utilidades de dibujo en un lienzo de 400 × 300 (tinta = negro con alfa; 1 = trama llena)
const tinta = (c, a) => { c.fillStyle = c.strokeStyle = `rgba(0,0,0,${a})`; };
const caja = (c, x, y, w, h, a = .8) => { tinta(c, a); c.fillRect(x, y, w, h); c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(x, y, w, h * .22); c.fillRect(x + w * .46, y, w * .08, h); };
const linea = (c, x1, y1, x2, y2, g, a = 1) => { tinta(c, a); c.lineWidth = g; c.lineCap = "round"; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
const punto = (c, x, y, r, a = 1) => { tinta(c, a); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
const blanco = (c, x, y, r) => { c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
const suelo = (c, y) => { const g = c.createLinearGradient(0, y, 0, 300); g.addColorStop(0, "rgba(0,0,0,.2)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, y, 400, 300 - y); };

// 1 · Automatización: un brazo robótico toma una caja de la cinta y la deja en la pila
function brazo(c, t) {
  suelo(c, 240);
  tinta(c, .6); c.fillRect(6, 226, 176, 12); for (let x = 14 - (t * 30) % 22; x < 182; x += 22) blanco(c, x, 232, 3);
  const ciclo = (t % 4) / 4, toma = ciclo > .18 && ciclo < .62;
  // cajas que avanzan por la cinta hasta el punto de recogida (x = 140)
  for (let k = 0; k < 3; k++) { const x = Math.min(140, ((ciclo + k / 3) % 1) * 200 - 40); if (!(k === 0 && toma) && x > -30) caja(c, x, 198, 30, 28, .8); }
  caja(c, 296, 214, 34, 26, .7); caja(c, 334, 214, 34, 26, .7); caja(c, 315, 188, 34, 26, .7);
  // ángulos: 0 = sobre la cinta, 1 = sobre la pila
  const k = eio(clamp((ciclo - .18) / .3)) - eio(clamp((ciclo - .66) / .3)), lleva = ciclo > .18 && ciclo < .62;
  const bx = 236, by = 218, a1 = lerp(-2.25, -1.0, k), a2 = lerp(1.35, 1.05, k), L1 = 92, L2 = 80;
  tinta(c, .95); c.beginPath(); c.moveTo(bx - 36, by + 20); c.lineTo(bx + 36, by + 20); c.lineTo(bx + 24, by - 4); c.lineTo(bx - 24, by - 4); c.fill();
  const x1 = bx + Math.cos(a1) * L1, y1 = by - 4 + Math.sin(a1) * L1, x2 = x1 + Math.cos(a1 + a2) * L2, y2 = y1 + Math.sin(a1 + a2) * L2;
  linea(c, bx, by - 4, x1, y1, 22, .95); linea(c, x1, y1, x2, y2, 16, .9);
  punto(c, bx, by - 4, 17); blanco(c, bx, by - 4, 6); punto(c, x1, y1, 14); blanco(c, x1, y1, 5); punto(c, x2, y2, 9);
  linea(c, x2, y2, x2, y2 + 12, 8); linea(c, x2 - 10, y2 + 12, x2 + 10, y2 + 12, 5); linea(c, x2 - 10, y2 + 12, x2 - 10, y2 + 24, 4); linea(c, x2 + 10, y2 + 12, x2 + 10, y2 + 24, 4);
  if (lleva) caja(c, x2 - 15, y2 + 22, 30, 28, .8);
}

// 2 · Logística: una grúa portuaria levanta un contenedor del barco y lo deja en el patio
function grua(c, t) {
  for (let x = 0; x < 400; x += 7) punto(c, x, 266 + Math.sin(x * .07 + t * 2) * 2, 1.6, .4);
  tinta(c, .9); c.beginPath(); c.moveTo(0, 232); c.lineTo(186, 232); c.lineTo(172, 258); c.lineTo(14, 258); c.fill();
  for (let i = 0; i < 4; i++) caja(c, 18 + i * 40, 204, 36, 28, .55 + (i % 2) * .2);
  suelo(c, 254); for (let i = 0; i < 3; i++) caja(c, 288 + i * 36, 228, 32, 26, .6 + (i % 2) * .2);
  tinta(c, .95); c.fillRect(214, 44, 11, 212); c.fillRect(264, 44, 11, 212);
  linea(c, 220, 150, 270, 96, 5, .75); linea(c, 270, 150, 220, 96, 5, .75);
  c.fillRect(28, 36, 330, 13); c.fillRect(239, 8, 11, 34); linea(c, 244, 10, 46, 38, 3, .85); linea(c, 244, 10, 350, 38, 3, .85);
  const ciclo = (t % 6) / 6, sube = eio(clamp((ciclo - .06) / .2)), viaja = eio(clamp((ciclo - .3) / .34)), baja = eio(clamp((ciclo - .68) / .18));
  const x = lerp(98, 322, viaja), y = lerp(204, 92, sube) + lerp(0, 108, baja), lleva = ciclo < .9;
  tinta(c, 1); c.fillRect(x - 15, 44, 30, 15); linea(c, x - 8, 59, x - 16, lleva ? y : 120, 2, .9); linea(c, x + 8, 59, x + 16, lleva ? y : 120, 2, .9);
  if (lleva) caja(c, x - 24, y, 48, 28, .95);
}

// 3 · Inteligencia artificial: una red neuronal; los datos cruzan capa por capa y la salida se enciende
function red(c, t) {
  const capas = [4, 6, 6, 3], X = (i) => 46 + i * 103, Y = (i, n) => 150 + (i - (n - 1) / 2) * 42;
  for (let l = 0; l < capas.length - 1; l++) for (let a = 0; a < capas[l]; a++) for (let b = 0; b < capas[l + 1]; b++) linea(c, X(l), Y(a, capas[l]), X(l + 1), Y(b, capas[l + 1]), 1.3, .3);
  const fase = ((t * .55) % 1) * 3.6;
  for (let l = 0; l < capas.length - 1; l++) for (let a = 0; a < capas[l]; a++) for (let b = 0; b < capas[l + 1]; b++) {
    if (azar(l * 97 + a * 13 + b) > .4) continue;
    const k = fase - l; if (k <= 0 || k >= 1) continue;
    punto(c, lerp(X(l), X(l + 1), k), lerp(Y(a, capas[l]), Y(b, capas[l + 1]), k), 3.6, 1);
  }
  capas.forEach((n, l) => { for (let i = 0; i < n; i++) { const on = fase - l > -.1 && fase - l < .5; punto(c, X(l), Y(i, n), 13, .95); if (!on) blanco(c, X(l), Y(i, n), 8); } });
}

// 4 · Optimización: engranajes que giran y una curva de resultados que sube
function engranaje(c, x, y, r, dientes, ang) {
  tinta(c, .92); c.beginPath();
  for (let i = 0; i < dientes * 2; i++) { const a = ang + i * Math.PI / dientes, rr = i % 2 ? r : r + r * .24; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill(); blanco(c, x, y, r * .45); punto(c, x, y, r * .2, .9);
}
function engranajes(c, t) {
  engranaje(c, 86, 168, 54, 12, t * .7); engranaje(c, 168, 100, 33, 8, -t * .7 * 12 / 8 + .19); engranaje(c, 174, 228, 27, 7, -t * .7 * 12 / 7 + .05);
  tinta(c, .55); c.fillRect(228, 52, 3, 200); c.fillRect(228, 250, 160, 3);
  const k = clamp(((t % 6.5) / 6.5) * 1.35);
  for (let i = 0; i < 5; i++) if (i / 5 < k) { const h = 34 + i * 30; tinta(c, .32); c.fillRect(240 + i * 29, 250 - h, 18, h); }
  c.lineWidth = 7; c.lineCap = c.lineJoin = "round"; tinta(c, 1); c.beginPath();
  for (let i = 0; i <= 32 * k; i++) { const x = 236 + i * 4.5, y = 226 - Math.pow(i / 32, 1.6) * 160; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  if (k >= 1) { linea(c, 374, 66, 386, 54, 6); linea(c, 386, 54, 386, 68, 5); linea(c, 386, 54, 372, 54, 5); }
}

const ESCENAS = [[brazo, "Automatización"], [grua, "Logística"], [red, "Inteligencia artificial"], [engranajes, "Optimización"]];

export function montarTrama(caja, { QUIETO, alVer }) {
  const cv = caja.querySelector("canvas"), c = cv.getContext("2d"), rotulo = caja.querySelector(".tr__rotulo");
  const lienzo = document.createElement("canvas"), lc = lienzo.getContext("2d");
  const baja = document.createElement("canvas"), bc = baja.getContext("2d", { willReadFrequently: true });
  const puntero = { x: -1e4, y: -1e4 };
  caja.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); puntero.x = e.clientX - r.left; puntero.y = e.clientY - r.top; });
  caja.addEventListener("pointerleave", () => { puntero.x = puntero.y = -1e4; });
  let actual = 0, previa = -1, tCambio = performance.now(), t0 = performance.now(), vivo = false, raf = 0, ultimo = 0;
  lienzo.width = 800; lienzo.height = 600;

  // dibuja una escena y la baja a la resolución de la trama: tinta 0–1 por celda
  function tintaDe(i, cols, rows, t) {
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.fillStyle = "#fff"; lc.fillRect(0, 0, 800, 600); lc.setTransform(2, 0, 0, 2, 0, 0); ESCENAS[i][0](lc, t);
    baja.width = cols; baja.height = rows; bc.fillStyle = "#fff"; bc.fillRect(0, 0, cols, rows); bc.imageSmoothingQuality = "high";
    const esc = Math.min(cols / 400, rows / 300), w = 400 * esc, h = 300 * esc;
    bc.drawImage(lienzo, (cols - w) / 2, (rows - h) / 2, w, h);
    const d = bc.getImageData(0, 0, cols, rows).data, out = new Float32Array(cols * rows);
    for (let p = 0, o = 0; p < out.length; p++, o += 4) out[p] = 1 - d[o] / 255;
    return out;
  }
  // ── Efecto Matrix: la escena se escribe con caracteres que cambian, columnas de lluvia caen por encima
  // y el cambio de escena lo hace la misma lluvia, barriendo de arriba hacia abajo.
  const GLIFOS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ<>/*+=#".split(""), NIV = 7;
  const COLORES = [[205, 236, 230], [145, 206, 196], [104, 176, 167], [70, 145, 141], [56, 126, 128], [33, 84, 90], [15, 27, 38]];
  let atlas = null, atlasCel = 0;
  function armarAtlas(cel, dpr) {
    atlas = document.createElement("canvas"); atlas.width = GLIFOS.length * cel * dpr; atlas.height = (NIV + 1) * cel * dpr;
    const a = atlas.getContext("2d"); a.scale(dpr, dpr); a.font = `600 ${cel * .92}px ui-monospace, "SF Mono", Menlo, monospace`; a.textAlign = "center"; a.textBaseline = "middle";
    for (let n = 0; n <= NIV; n++) { const col = n < NIV ? COLORES[n] : [255, 255, 255]; a.fillStyle = `rgb(${col})`; if (n === NIV) { a.shadowColor = "#91CEC4"; a.shadowBlur = 6; }
      GLIFOS.forEach((g, i) => a.fillText(g, i * cel + cel / 2, n * cel + cel / 2 + .5)); }
    atlasCel = cel;
  }
  const columnas = Array.from({ length: 400 }, (_, i) => ({ v: 7 + azar(i) * 16, o: azar(i + 99) * 60, r: 3 + azar(i + 7) * 9, l: 6 + Math.floor(azar(i + 3) * 14) }));
  function cuadro(ahora) {
    raf = requestAnimationFrame(cuadro);
    if (ahora - ultimo < 33) return; ultimo = ahora;
    const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const vertical = W < 700, cel = vertical ? 7 : 9;
    if (atlasCel !== cel || !atlas) armarAtlas(cel, dpr);
    const zx = vertical ? 0 : W * .42, zy = vertical ? 64 : 60, zw = W - zx - (vertical ? 0 : W * .02), zh = vertical ? H * .42 : H - 120;
    const cols = Math.floor(zw / cel), rows = Math.floor(zh / cel), t = QUIETO ? 1.6 : (ahora - t0) / 1000;
    if (!QUIETO && ahora - tCambio > DUR) { previa = actual; actual = (actual + 1) % ESCENAS.length; tCambio = ahora; rotulo.textContent = ESCENAS[actual][1]; rotulo.classList.remove("on"); void rotulo.offsetWidth; rotulo.classList.add("on"); }
    const dc = (ahora - tCambio) / 1000;   // segundos desde el cambio
    const A = tintaDe(actual, cols, rows, t), B = previa >= 0 && dc < 2.2 ? tintaDe(previa, cols, rows, t) : null;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    const mx = (puntero.x - zx) / cel, my = (puntero.y - zy) / cel, cd = cel * dpr;
    for (let i = 0; i < cols; i++) {
      const co = columnas[i % 400], cabeza = ((t * co.v + co.o) % (rows + 40)) - 10;   // la gota que cae en esta columna
      const barrido = B ? (dc - azar(i) * .6) * rows * 1.1 : 1e9;              // hasta dónde llegó el barrido del cambio
      for (let j = 0; j < rows; j++) {
        const p = j * cols + i;
        let v = j < barrido ? A[p] : B[p];
        const d = cabeza - j, enGota = d >= 0 && d < co.l, frente = B && Math.abs(j - barrido) < 1.2;
        if (Math.hypot(i - mx, j - my) < 7) v = Math.max(v, .55);
        let n = -1;
        if (v > .12) n = Math.min(NIV - 1, Math.floor(v * NIV));            // la escena
        if (enGota) n = d < 1 ? NIV : Math.max(n, d < 3 ? 1 : 0);            // la lluvia: cabeza blanca, cola menta
        if (frente) n = NIV;
        if (n < 0) continue;
        const g = Math.floor(azar(p * 3 + Math.floor(t * co.r + azar(p) * 10)) * GLIFOS.length), X = (zx + i * cel) * dpr, Y = (zy + j * cel) * dpr;
        // la figura: un bloque sólido de su tono, con el carácter claro encima (se lee como forma y se ve como código)
        if (v > .12 && n < NIV) { const col = COLORES[Math.min(NIV - 1, Math.floor(v * NIV))]; c.fillStyle = `rgb(${col})`; c.fillRect(X, Y, cd - dpr, cd - dpr); c.globalAlpha = .8; c.drawImage(atlas, g * cd, (v > .5 ? 0 : NIV - 1) * cd, cd, cd, X, Y, cd, cd); c.globalAlpha = 1; continue; }
        c.drawImage(atlas, g * cd, n * cd, cd, cd, X, Y, cd, cd);
      }
    }
  }
  rotulo.textContent = ESCENAS[0][1]; rotulo.classList.add("on");
  alVer(caja, () => { if (vivo) return; vivo = true; tCambio = performance.now(); raf = requestAnimationFrame(cuadro); }, () => { vivo = false; cancelAnimationFrame(raf); }, 0);
}
