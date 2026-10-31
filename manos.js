// Optimizo · la transición de las manos. Al bajar, la mano humana (La creación de Adán, Miguel Ángel, dominio público) llega
// desde la derecha y la mano robótica (generada con Codex) se arma en píxeles de Optimizo desde la izquierda.
// Cuando los dedos se tocan se abre un destello desde la punta y de él nace la sección siguiente.
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
  const CEL = 5;
  const sig = document.getElementById("desafio");   // la sección siguiente nace del destello
  if (sig && !QUIETO) sig.classList.add("d7--destello");
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
    // acercamiento: de 0 a .6 se acercan; en .6 se tocan y se abre el destello
    // cada brazo mide más de media pantalla: al tocarse, sale desde el borde
    const k = eio(p / .6), hueco = (1 - k) * W * (mov ? .5 : .3), cy = H * .46, mx = W / 2;
    const anchoH = W * (mov ? .62 : .52), altoH = anchoH * (humana.naturalHeight / humana.naturalWidth || .48);
    humana.style.width = anchoH + "px";
    humana.style.transform = `translate(${mx + hueco / 2 - PH[0] * anchoH}px, ${cy - PH[1] * altoH}px)`;
    const anchoR = W * (mov ? .66 : .56), altoR = anchoR * (img.naturalHeight / img.naturalWidth || .31), rx = mx - hueco / 2 - PR[0] * anchoR, ry = cy - PR[1] * altoR;
    const metal = 0;   // la mano de la IA se queda en píxeles de Optimizo
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    if (puntos && metal < 1) {
      const esc = anchoR / puntos.w, arma = clamp(p / .5);
      for (const q of puntos) {
        // cada píxel llega a su lugar con su propio ritmo; los de la punta de los dedos son los últimos
        const kk = eio(clamp((arma - q.r * .45 * q.u) / .55)); if (kk <= 0) continue;
        const dx = (1 - kk) * (-160 - q.s * 260), dy = (1 - kk) * (q.r - .5) * 220;
        const u = clamp(q.u * .9 + .1); c.globalAlpha = (.35 + .65 * kk) * (1 - metal);
        c.fillStyle = `rgb(${Math.round(145 - 89 * u)},${Math.round(206 - 80 * u)},${Math.round(196 - 68 * u)})`;
        c.fillRect(rx + q.i * esc + dx, ry + q.j * esc + dy, esc * .82, esc * .82);
      }
      c.globalAlpha = 1;
    }
    // el destello: al tocarse los dedos se abre una luz desde la punta y adentro ya está la sección siguiente,
    // que sube mientras la luz crece hasta ocupar toda la pantalla
    const luz = clamp((p - .6) / .34), R = Math.pow(luz, 1.9) * Math.hypot(W, H) * .75;
    if (luz > 0 && luz < 1) {
      const borde = 26 + 90 * (1 - luz), g = c.createRadialGradient(mx, cy, R, mx, cy, R + borde);
      g.addColorStop(0, `rgba(145,206,196,${.95 - .4 * luz})`); g.addColorStop(.35, `rgba(145,206,196,${.35 - .2 * luz})`); g.addColorStop(1, "rgba(145,206,196,0)");
      c.globalAlpha = 1; c.fillStyle = g; c.fillRect(mx - R - borde, cy - R - borde, (R + borde) * 2, (R + borde) * 2);
    }
    if (sig && !QUIETO) {
      const top = sig.getBoundingClientRect().top;
      sig.style.clipPath = luz >= 1 ? "none" : `circle(${R.toFixed(1)}px at ${mx.toFixed(1)}px ${(cy - top).toFixed(1)}px)`;
    }
    c.globalAlpha = 1;
    const tx = clamp((p - .4) / .12); txt.style.opacity = tx; txt.style.transform = `translateY(${(1 - tx) * 20}px)`;
  }
  addEventListener("scroll", () => requestAnimationFrame(pintar), { passive: true }); addEventListener("resize", pintar);
  if (img.complete) img.onload();
}
