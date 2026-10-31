// Optimizo · la transición de las manos. Al bajar, la mano humana (La creación de Adán, Miguel Ángel, dominio público) llega
// desde la derecha y la mano robótica (generada con Codex) se arma en píxeles de Optimizo desde la izquierda.
// Cuando los dedos se tocan hay un cuadro de impacto, una onda de píxeles y la energía cruza los dos brazos.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const azar = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

export function montarManos(sec, { QUIETO }) {
  const fijo = sec.querySelector(".mn__fijo"), humana = sec.querySelector(".mn__humana"), cv = sec.querySelector(".mn__ia"), c = cv.getContext("2d");
  const PH = [0, .6], PR = [1, .238];   // la punta del índice en cada imagen (fracción de ancho y alto)
  const txt = sec.querySelector(".mn__txt");
  const img = new Image(); img.src = "recursos/fotos/mano-robot.png";
  let puntos = null;   // los píxeles de la mano de IA: posición final, color y desorden inicial
  const CEL = 5; let antes = 0, t0 = 0, mascara = null;
  const reloj = () => { pintar(); if (t0 && performance.now() - t0 < 1700) requestAnimationFrame(reloj); };
  const armarMascara = () => {   // la silueta de la mano humana en celdas, para pixelarla durante el toque
    const w = 150, h = Math.round(w * humana.naturalHeight / humana.naturalWidth), t = document.createElement("canvas"); t.width = w; t.height = h;
    const tc = t.getContext("2d", { willReadFrequently: true }); tc.drawImage(humana, 0, 0, w, h);
    const d = tc.getImageData(0, 0, w, h).data; mascara = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 120) mascara.push({ i, j, u: i / w });
    mascara.w = w;
  };
  if (humana.complete && humana.naturalWidth) armarMascara(); else humana.addEventListener("load", armarMascara);
  img.onload = () => {
    const w = Math.round(img.naturalWidth / CEL * 1.1), h = Math.round(img.naturalHeight / CEL * 1.1);
    const t = document.createElement("canvas"); t.width = w; t.height = h; const tc = t.getContext("2d", { willReadFrequently: true });
    tc.drawImage(img, 0, 0, w, h);
    const d = tc.getImageData(0, 0, w, h).data; puntos = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const o = (j * w + i) * 4; if (d[o + 3] < 90) continue;
      const l = (d[o] * .3 + d[o + 1] * .59 + d[o + 2] * .11) / 255, tinta = Math.pow(1 - l, .8) * .9 + .25;
      if (tinta <= BAYER[(j & 3) * 4 + (i & 3)] * .95) continue;
      const k = j * w + i; puntos.push({ i, j, u: i / w, r: azar(k), s: azar(k + 7) });
    }
    puntos.w = w; puntos.h = h; pintar();
  };
  function pintar() {
    const r = sec.getBoundingClientRect(), p = QUIETO ? 1 : clamp(-r.top / Math.max(1, r.height - innerHeight));
    const W = fijo.clientWidth, H = fijo.clientHeight, dpr = Math.min(2, devicePixelRatio || 1), mov = W < 760;
    // acercamiento: de 0 a .7 se acercan; en .7 se tocan; de .8 en adelante, los píxeles del toque y el texto
    // cada brazo mide más de media pantalla: al tocarse, sale desde el borde
    const k = eio(p / .7), hueco = (1 - k) * W * (mov ? .5 : .3), cy = H * .46, mx = W / 2;
    const anchoH = W * (mov ? .62 : .52), altoH = anchoH * (humana.naturalHeight / humana.naturalWidth || .48);
    humana.style.width = anchoH + "px";
    humana.style.transform = `translate(${mx + hueco / 2 - PH[0] * anchoH}px, ${cy - PH[1] * altoH}px)`;
    const anchoR = W * (mov ? .66 : .56), altoR = anchoR * (img.naturalHeight / img.naturalWidth || .31), rx = mx - hueco / 2 - PR[0] * anchoR, ry = cy - PR[1] * altoR;
    const metal = 0;   // la mano de la IA se queda en píxeles de Optimizo
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    if (puntos && metal < 1) {
      const esc = anchoR / puntos.w, arma = clamp(p / .5), ePix = t0 ? (performance.now() - t0) / 1000 : 9, cuadroPix = ePix < .07 ? 1 : ePix < .13 ? 2 : 0;
      for (const q of puntos) {
        // cada píxel llega a su lugar con su propio ritmo; los de la punta de los dedos son los últimos
        const kk = eio(clamp((arma - q.r * .45 * q.u) / .55)); if (kk <= 0) continue;
        const dx = (1 - kk) * (-160 - q.s * 260), dy = (1 - kk) * (q.r - .5) * 220;
        const u = clamp(q.u * .9 + .1); c.globalAlpha = (.35 + .65 * kk) * (1 - metal);
        const ola = t0 ? (1 - q.u) - (ePix - .06) * 1.4 : 9;   // la energía viaja de la punta del dedo al hombro
        let empuje = 0;
        if (cuadroPix) c.fillStyle = cuadroPix === 1 ? "#fff" : "#10393A";
        else if (ola < 0 && ola > -.16) { c.fillStyle = ola > -.03 ? "#10393A" : "#2E9C93"; empuje = (1 + ola / .16) * 6; }
        else c.fillStyle = `rgb(${Math.round(145 - 89 * u)},${Math.round(206 - 80 * u)},${Math.round(196 - 68 * u)})`;
        c.fillRect(rx + q.i * esc + dx, ry + q.j * esc + dy - empuje * (q.r - .5), esc * .82, esc * .82);
      }
      c.globalAlpha = 1;
    }
    // el toque es un evento con su propio reloj (no depende de qué tan rápido bajes):
    // 1) cuadro de impacto: la pantalla entera en el teal de Optimizo con las dos manos en blanco, y su negativo
    // 2) onda de choque hecha de los mismos píxeles de la IA, que barre toda la pantalla
    // 3) la energía cruza: recorre el brazo robot hasta el hombro y pixela el brazo humano hasta salir de cuadro
    if (p > .66 && antes <= .66 && !QUIETO && !t0) { t0 = performance.now(); fijo.classList.remove("golpe"); void fijo.offsetWidth; fijo.classList.add("golpe"); if (navigator.vibrate) navigator.vibrate([20, 30, 45]); requestAnimationFrame(reloj); }
    if (p < .6) t0 = 0;
    antes = p;
    const e = t0 ? (performance.now() - t0) / 1000 : 9;
    const cuadro = e < .07 ? 1 : e < .13 ? 2 : 0;
    fijo.classList.toggle("impacto", cuadro === 1); fijo.classList.toggle("negativo", cuadro === 2);
    if (e < 1.6) {
      const G = mov ? 7 : 9, maxR = Math.hypot(W, H) * .62, R = (1 - Math.pow(1 - clamp(e / 1.05), 3)) * maxR, banda = 40 + R * .5;
      if (e > .05 && e < 1.05) {
        c.fillStyle = cuadro === 1 ? "#fff" : "#387E80";
        for (let y = 0, j = 0; y < H; y += G, j++) for (let x = 0, i = 0; x < W; x += G, i++) {
          const d = Math.hypot(x - mx, (y - cy) * 1.25), f = R - d; if (f < 0 || f > banda) continue;
          const dens = Math.pow(1 - f / banda, 2.2) * (1 - clamp((e - .55) / .5)); if (dens <= BAYER[(j & 3) * 4 + (i & 3)]) continue;
          c.globalAlpha = .85; c.fillRect(x, y, G - 2, G - 2);
        }
      }
      if (mascara && e < 1.6) {   // el brazo humano se vuelve píxeles por donde pasa la energía, del dedo hacia el borde
        const frente = clamp((e - .08) / 1.1) * 1.25, cel = anchoH / mascara.w, hx = mx + hueco / 2 - PH[0] * anchoH, hy = cy - PH[1] * altoH;
        for (const q of mascara) {
          const f = frente - q.u; if (f < 0 || f > .28) continue;
          const dens = 1 - f / .28; if (dens * 1.1 <= BAYER[(q.j & 3) * 4 + (q.i & 3)]) continue;
          c.globalAlpha = .9; c.fillStyle = f < .04 ? "#91CEC4" : "#387E80";
          c.fillRect(hx + q.i * cel, hy + q.j * cel, cel * .82, cel * .82);
        }
      }
    }
    c.globalAlpha = 1;
    txt.style.opacity = clamp((p - .76) / .12); txt.style.transform = `translateY(${(1 - clamp((p - .76) / .12)) * 20}px)`;
  }
  addEventListener("scroll", () => requestAnimationFrame(pintar), { passive: true }); addEventListener("resize", pintar);
  if (img.complete) img.onload();
}
