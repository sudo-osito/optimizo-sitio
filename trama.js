// Optimizo · el banner en trama de píxeles. Videos reales (Mixkit, licencia libre) convertidos en vivo a una trama ordenada
// (Bayer 4×4) con los colores de Optimizo sobre blanco. Escenas: máquina, brazo robótico, puerto, datos y circuito. Cambian con un fundido de píxeles al azar; el cursor revela más trama a su alrededor.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
const ESCENAS = [
  { capas: [{ src: "maquina", modo: "oscuro", x: 0, y: 0, w: 1 }], txt: "Industria" },
  { capas: [{ src: "brazo", modo: "oscuro", x: 0, y: 0, w: 1 }], txt: "Automatización" },
  { capas: [{ src: "puerto", modo: "oscuro", x: 0, y: 0, w: 1 }], txt: "Logística" },
  { capas: [{ src: "datos", modo: "claro", x: 0, y: 0, w: 1 }], txt: "Datos" },
  { capas: [{ src: "circuito", modo: "claro", x: 0, y: 0, w: 1 }], txt: "Inteligencia" },
];
const DUR = 7000, FUNDIDO = 1400;
const azar = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

export function montarTrama(caja, { QUIETO, alVer }) {
  const cv = caja.querySelector("canvas"), c = cv.getContext("2d"), rotulo = caja.querySelector(".tr__rotulo");
  const peq = document.createElement("canvas"), pc = peq.getContext("2d", { willReadFrequently: true });
  const salida = document.createElement("canvas"), sc = salida.getContext("2d");
  const videos = {};
  for (const e of ESCENAS) for (const k of e.capas) if (!videos[k.src]) { const v = document.createElement("video"); v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto"; v.src = `recursos/video/banner/${k.src}.mp4`; videos[k.src] = v; }
  const puntero = { x: -1e4, y: -1e4 };
  caja.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); puntero.x = e.clientX - r.left; puntero.y = e.clientY - r.top; });
  caja.addEventListener("pointerleave", () => { puntero.x = puntero.y = -1e4; });

  let actual = 0, previa = -1, tCambio = performance.now(), vivo = false, raf = 0, ultimo = 0;
  const reproducir = (i) => ESCENAS[i].capas.forEach((k) => videos[k.src].play().catch(() => {}));
  const pausarOtras = () => Object.entries(videos).forEach(([n, v]) => { const usada = [actual, previa].some((i) => i >= 0 && ESCENAS[i].capas.some((k) => k.src === n)); if (!usada) v.pause(); });

  // la «tinta» de una escena: 0–1 por celda, según el video y su modo
  function tinta(esc, cols, rows) {
    pc.clearRect(0, 0, cols, rows);
    const out = new Float32Array(cols * rows);
    for (const k of esc.capas) {
      const v = videos[k.src]; if (v.readyState < 2) continue;
      peq.width = cols; peq.height = rows; pc.save();
      const w = k.w * cols, h = w * (v.videoHeight / v.videoWidth) * (k.giro ? v.videoWidth / v.videoHeight : 1);
      if (k.w === 1) { const esc2 = Math.max(cols / v.videoWidth, rows / v.videoHeight); pc.drawImage(v, (cols - v.videoWidth * esc2) / 2, (rows - v.videoHeight * esc2) / 2, v.videoWidth * esc2, v.videoHeight * esc2); }
      else if (k.giro) { const hh = w * v.videoWidth / v.videoHeight; pc.translate(k.x * cols + w / 2, k.y * rows + hh / 2); pc.rotate(k.giro * Math.PI / 180); pc.drawImage(v, -hh / 2, -w / 2, hh, w); }
      else pc.drawImage(v, k.x * cols, k.y * rows, w, w * v.videoHeight / v.videoWidth);
      pc.restore();
      const d = pc.getImageData(0, 0, cols, rows).data;
      // niveles automáticos para que cada video llene bien el rango
      let lo = 1, hi = 0; for (let i = 0; i < d.length; i += 28) { const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255; if (l < lo) lo = l; if (l > hi) hi = l; }
      const rango = Math.max(.15, hi - lo);
      for (let i = 0, p = 0; p < out.length; i += 4, p++) {
        const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
        if (!a) continue;
        let t;
        if (k.modo === "croma") { const verde = g - Math.max(r, b); if (verde > 40) continue; t = .55 + .45 * (1 - (r * .3 + g * .59 + b * .11) / 255); }
        else { const l = ((r * .3 + g * .59 + b * .11) / 255 - lo) / rango; t = k.modo === "claro" ? l : 1 - l; t = Math.pow(Math.max(0, Math.min(1, t)), 1.35); }
        if (t > out[p]) out[p] = t;
      }
    }
    return out;
  }

  function cuadro(ahora) {
    raf = requestAnimationFrame(cuadro);
    if (ahora - ultimo < 40) return; ultimo = ahora;
    const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const vertical = W < 700, celda = vertical ? 4 : 5;
    // la escena vive a la derecha (PC) o arriba (celular); el texto queda libre
    const zx = vertical ? 0 : W * .42, zy = vertical ? 64 : 0, zw = W - zx, zh = vertical ? H * .42 : H;
    const cols = Math.floor(zw / celda), rows = Math.floor(zh / celda);
    if (!QUIETO && ahora - tCambio > DUR) { previa = actual; actual = (actual + 1) % ESCENAS.length; tCambio = ahora; reproducir(actual); pausarOtras(); rotulo.textContent = ESCENAS[actual].txt; rotulo.classList.remove("on"); void rotulo.offsetWidth; rotulo.classList.add("on"); }
    const k = Math.min(1, (ahora - tCambio) / FUNDIDO);
    const A = tinta(ESCENAS[actual], cols, rows), B = previa >= 0 && k < 1 ? tinta(ESCENAS[previa], cols, rows) : null;
    salida.width = cols; salida.height = rows;
    const img = sc.createImageData(cols, rows), px = img.data;
    const mx = (puntero.x - zx) / celda, my = (puntero.y - zy) / celda;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const p = j * cols + i;
      let t = B && azar(p) > k ? B[p] : A[p];
      // bordes que se desvanecen para que la trama no corte en seco
      const bx = Math.min(i / (cols * .22), (cols - i) / (cols * .05), 1), by = Math.min(j / (rows * .06), (rows - j) / (rows * .08), 1);
      t *= Math.max(0, Math.min(bx, by));
      const dm = Math.hypot(i - mx, j - my); if (dm < 22) t = Math.min(1, t + (1 - dm / 22) * .35);
      if (t <= BAYER[(j & 3) * 4 + (i & 3)]) continue;
      // color: menta → teal → tinta según la densidad y la posición
      const u = Math.min(1, t * .9 + (i / cols) * .25), o = p * 4;
      px[o] = 145 + (56 - 145) * u - 40 * Math.max(0, u - .75) * 4; px[o + 1] = 206 + (126 - 206) * u - 70 * Math.max(0, u - .75) * 4; px[o + 2] = 196 + (128 - 196) * u - 70 * Math.max(0, u - .75) * 4; px[o + 3] = 255;
    }
    sc.putImageData(img, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H); c.imageSmoothingEnabled = false;
    c.drawImage(salida, zx, zy, cols * celda, rows * celda);
    // la separación entre píxeles: una rejilla blanca de 1 px
    c.fillStyle = "#fff";
    for (let x = zx; x <= zx + cols * celda; x += celda) c.fillRect(x, zy, 1, rows * celda);
    for (let y = zy; y <= zy + rows * celda; y += celda) c.fillRect(zx, y, cols * celda, 1);
  }
  rotulo.textContent = ESCENAS[0].txt; rotulo.classList.add("on");
  alVer(caja, () => { if (vivo) return; vivo = true; tCambio = performance.now(); reproducir(actual); raf = requestAnimationFrame(cuadro); }, () => { vivo = false; cancelAnimationFrame(raf); Object.values(videos).forEach((v) => v.pause()); }, 0);
}
