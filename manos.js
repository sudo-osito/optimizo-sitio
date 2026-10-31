// Optimizo · la transición de las manos. Al bajar, la mano humana (La creación de Adán, Miguel Ángel, dominio público) llega
// desde la derecha y la mano robótica (generada con Codex) se arma en píxeles de Optimizo desde la izquierda.
// Cuando los dedos se tocan, saltan unos píxeles y la página sigue a la siguiente sección.
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
  const CEL = 5; let antes = 0;
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
    const alto = altoH;
    // el toque: la pantalla tiembla, sale una onda expansiva nítida, un destello breve y unos píxeles
    const toque = clamp((p - .66) / .22);
    if (p > .66 && antes <= .66 && !QUIETO) { fijo.classList.remove("golpe"); void fijo.offsetWidth; fijo.classList.add("golpe"); if (navigator.vibrate) navigator.vibrate(35); }
    antes = p;
    if (toque > 0 && toque < 1) {
      for (const [ret, ancho] of [[0, 2.5], [.12, 1.5]]) {   // dos anillos que se abren
        const k2 = clamp((toque - ret) / (1 - ret)); if (k2 <= 0) continue;
        c.globalAlpha = (1 - k2) * .9; c.strokeStyle = "#387E80"; c.lineWidth = ancho * (1 - k2) + .5;
        c.beginPath(); c.ellipse(mx, cy, eio(k2) * W * .38, eio(k2) * W * .38 * .62, 0, 0, 7); c.stroke();
      }
      const fl = clamp(1 - toque / .18);   // destello: un núcleo blanco y menta pequeño y nítido que se apaga rápido
      if (fl > 0) { const g = c.createRadialGradient(mx, cy, 0, mx, cy, 70); g.addColorStop(0, `rgba(255,255,255,${fl})`); g.addColorStop(.35, `rgba(145,206,196,${.7 * fl})`); g.addColorStop(1, "rgba(145,206,196,0)"); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(mx - 70, cy - 70, 140, 140); }
      for (let n = 0; n < 34; n++) {
        const ang = azar(n) * Math.PI * 2, dist = (10 + azar(n + 5) * 120) * eio(toque), lado = 3 + Math.round(azar(n + 9) * 3);
        c.globalAlpha = 1 - toque; c.fillStyle = n % 3 ? "#91CEC4" : "#387E80";
        c.fillRect(Math.round(mx + Math.cos(ang) * dist), Math.round(cy + Math.sin(ang) * dist * .7), lado, lado);
      }
    }
    c.globalAlpha = 1;
    txt.style.opacity = clamp((p - .76) / .12); txt.style.transform = `translateY(${(1 - clamp((p - .76) / .12)) * 20}px)`;
  }
  addEventListener("scroll", () => requestAnimationFrame(pintar), { passive: true }); addEventListener("resize", pintar);
  if (img.complete) img.onload();
}
