// Optimizo · la transición de las manos. Al bajar, la mano humana (La creación de Adán, Miguel Ángel, dominio público) llega
// desde la derecha y su gemela hecha de inteligencia artificial —la misma mano, en píxeles de Optimizo— se arma desde la izquierda.
// Cuando los dedos se tocan, salta la chispa y la página sigue a la siguiente sección.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const azar = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

export function montarManos(sec, { QUIETO }) {
  const fijo = sec.querySelector(".mn__fijo"), humana = sec.querySelector(".mn__humana"), cv = sec.querySelector(".mn__ia"), c = cv.getContext("2d");
  const chispa = sec.querySelector(".mn__chispa"), txt = sec.querySelector(".mn__txt");
  const img = new Image(); img.src = "recursos/fotos/mano.png";
  let puntos = null;   // los píxeles de la mano de IA: posición final, color y desorden inicial
  const CEL = 5;
  img.onload = () => {
    const w = Math.round(img.naturalWidth / CEL * 1.1), h = Math.round(img.naturalHeight / CEL * 1.1);
    const t = document.createElement("canvas"); t.width = w; t.height = h; const tc = t.getContext("2d", { willReadFrequently: true });
    tc.translate(w, 0); tc.scale(-1, 1); tc.drawImage(img, 0, 0, w, h);   // espejo: apunta hacia la derecha
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
    // acercamiento: de 0 a .7 se acercan; en .7 se tocan; de .8 en adelante, la chispa y el texto
    const k = eio(p / .7), hueco = (1 - k) * W * (mov ? .5 : .32);
    const ancho = W * (mov ? .62 : .42), alto = ancho * (img.naturalHeight / img.naturalWidth || .48), cy = H * .46;
    humana.style.width = ancho + "px";
    humana.style.transform = `translate(${W / 2 + hueco / 2 - ancho * .02}px, ${cy - alto / 2}px)`;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    if (puntos) {
      const esc = ancho / puntos.w, x0 = W / 2 - hueco / 2 - ancho * .98, y0 = cy - alto / 2, arma = clamp(p / .55);
      for (const q of puntos) {
        // cada píxel llega a su lugar con su propio ritmo; los de la punta de los dedos son los últimos
        const kk = eio(clamp((arma - q.r * .45 * (q.u)) / .55)); if (kk <= 0) continue;
        const dx = (1 - kk) * (-160 - q.s * 260), dy = (1 - kk) * (q.r - .5) * 220;
        const x = x0 + q.i * esc + dx, y = y0 + q.j * esc + dy;
        const u = clamp(q.u * .9 + .1); c.globalAlpha = .35 + .65 * kk;
        c.fillStyle = `rgb(${Math.round(145 - 89 * u)},${Math.round(206 - 80 * u)},${Math.round(196 - 68 * u)})`;
        c.fillRect(x, y, esc * .82, esc * .82);
      }
      c.globalAlpha = 1;
    }
    const toque = clamp((p - .68) / .1);
    chispa.style.transform = `translate(${W / 2}px, ${cy - alto * .06}px) translate(-50%, -50%) scale(${.2 + toque * 1.1})`; chispa.style.opacity = toque * (1 - clamp((p - .92) / .08) * .6);
    txt.style.opacity = clamp((p - .76) / .12); txt.style.transform = `translateY(${(1 - clamp((p - .76) / .12)) * 20}px)`;
  }
  addEventListener("scroll", () => requestAnimationFrame(pintar), { passive: true }); addEventListener("resize", pintar);
  if (img.complete) img.onload();
}
