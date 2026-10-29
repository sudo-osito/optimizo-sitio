// Optimizo · banner del agua. 20 s en loop, sin sonido, todo depende del tiempo.
// 0–3 calma · 3–6 la gota y su onda · 6–10 emergen los superpoderes · 10–14 orden e hilos de luz · 14–17 se funden · 17–20 el isotipo y vuelve la calma.
// El vidrio (vidrio.js) refracta el agua; esta capa calcula las formas y dibuja encima las etiquetas y los hilos.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const ei = (x) => Math.pow(clamp(x), 2.2);
const resorte = (x) => { x = clamp(x); return 1 - Math.exp(-6 * x) * Math.cos(7.5 * x); }; // llega con un rebote mínimo
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
export const DURACION = 20;
export const PODERES = [["Eficiencia", "#3FA99D"], ["Seguridad", "#FFAE1A"], ["Inteligencia", "#1B75FD"], ["Calidad", "#6E56CF"], ["Rentabilidad", "#1F9D5A"], ["Continuidad", "#F2557A"]];
const LETRA = (px, w = 650) => `${w} ${px}px Inter, -apple-system, "SF Pro Text", system-ui, sans-serif`;
const escribir = (s, k) => { const a = Array.from(s); return a.slice(0, Math.round(a.length * clamp(k))).join(""); };

function geometria(w, h, centrado) {
  const vertical = w / h < .9;
  if (vertical) {
    const s = clamp(w / 820, .42, 1.2);
    if (centrado) { const cy = h * .42; return { vertical, s, cx: w * .5, cy, sueltas: [[-.24, -.12], [.22, -.18], [-.26, .06], [.27, .02], [-.2, .22], [.22, .25]].map(([x, y]) => [w * .5 + x * w, cy + y * h * .55]), fila: (i) => [w * .5 + (i % 2 ? 1 : -1) * w * .23, cy - 60 * s + Math.floor(i / 2) * 84 * s * 1.15], hub: [w * .5, cy + 260 * s] }; }
    return { vertical, s, cx: w * .5, cy: h * .23, sueltas: [[-.24, -.12], [.22, -.18], [-.26, .06], [.27, .02], [-.2, .22], [.22, .25]].map(([x, y]) => [w * .5 + x * w, h * .23 + y * h * .55]),
      fila: (i) => [w * .5 + (i % 2 ? 1 : -1) * w * .23, h * .135 + Math.floor(i / 2) * 84 * s * 1.15], hub: [w * .5, h * .3] };
  }
  const s = clamp(w / 1920, .6, 1.4), cx = w * (centrado ? .5 : .74), cy = h * (centrado ? .45 : .36);
  if (centrado) return { vertical, s, cx, cy, sueltas: [[-230, -190], [150, -240], [-260, 10], [200, -50], [-120, 210], [230, 150]].map(([x, y]) => [cx + x * s, cy + y * s]), fila: (i) => [w * .62, h * .5 + (i - 2.5) * 100 * s], hub: [w * .42, cy + 50 * s] };
  return { vertical, s, cx, cy, sueltas: [[-230, -190], [150, -240], [-260, 10], [200, -50], [-120, 210], [230, 150]].map(([x, y]) => [cx + x * s, cy + y * s]),
    fila: (i) => [w * .86, h * .11 + i * 100 * s], hub: [w * .655, cy] };
}

/* Devuelve lo que hay que dibujar en el tiempo t */
export function cuadro(w, h, t, { centrado = false } = {}) {
  const u = ((t % DURACION) + DURACION) % DURACION, G = geometria(w, h, centrado), s = G.s;
  const formas = [], etiquetas = [], hilos = [];
  let k = 26 * s, onda = [0, 0, 0, 0];
  const pw = 300 * s, ph = 78 * s;
  const mece = (i) => Math.sin(u * 1.1 + i * 1.7) * 5 * s;

  // la gota: cae, toca el agua y flota; luego se va al centro de la columna y al final se vuelve isotipo
  const cae = ei(seg(u, 3, 3.85)), toca = 3.85;
  const ahub = eio(seg(u, 10, 11.6));
  let gx = lerp(G.cx, G.hub[0], ahub), gy = lerp(lerp(-120 * s, G.cy, cae), G.hub[1], ahub) + (u > toca ? mece(9) * .6 : 0);
  let gr = 40 * s * (u < toca ? 1 : 1 + .25 * eo(seg(u, toca, toca + .6)) * (1 - ahub)) * (1 + .5 * ahub);
  if (u > toca) onda = [G.cx, G.cy, u - toca, 1.5];
  if (u > 18.6) onda = [G.hub[0], G.hub[1], u - 18.6, .9];

  // las seis píldoras
  const juntas = eio(seg(u, 14.3, 15.8)); // viajan al punto
  PODERES.forEach(([n, col], i) => {
    const nace = 6 + i * .45, kn = resorte(seg(u, nace, nace + 1.3)), ka = resorte(seg(u, 10.2 + i * .12, 11.8 + i * .12));
    if (u < nace) return;
    const [sx, sy] = G.sueltas[i], [fx, fy] = G.fila(i);
    let x = lerp(lerp(G.cx, sx, kn), fx, ka), y = lerp(lerp(G.cy, sy, kn), fy, ka) + mece(i);
    x = lerp(x, gx, juntas); y = lerp(y, gy, juntas);
    const tam = clamp(kn * 1.15) * (1 - juntas * .85), ancho = lerp(ph, ka > 0 ? lerp(pw, pw * .9, ka) : pw, clamp(kn * 1.4)) * tam, alto = ph * tam * (1 - juntas * .2);
    if (u < 17.4) formas.push({ x, y, w: Math.max(ancho, alto), h: alto, radio: alto / 2 });
    const ke = eo(seg(u, nace + .7, nace + 1.2)) * (1 - eo(seg(u, 14, 14.4)));
    if (ke > 0) etiquetas.push({ x, y, n: escribir(n, seg(u, nace + .7, nace + 1.4)), col, a: ke, s, ancho: Math.max(ancho, alto) });
    const kh = eo(seg(u, 11.4 + i * .1, 12.4 + i * .1)) * (1 - eo(seg(u, 13.9, 14.4)));
    if (kh > 0) hilos.push({ x0: gx, y0: gy, x1: x - Math.max(ancho, alto) / 2, y1: y, a: kh });
  });
  const enFila = eio(seg(u, 10.2, 11.8)) * (1 - juntas);
  k = lerp(26 * s * (1 - .7 * enFila), 90 * s, juntas) * (u > 16.6 ? lerp(1, .05, eio(seg(u, 16.6, 17.6))) : 1);

  // el isotipo de vidrio: crece desde la masa y al final se hunde
  const forma = eio(seg(u, 16.2, 17.6)), hunde = eio(seg(u, 18.6, 19.8));
  const S = 4.4 * s * (1 - hunde * .9), ox = gx - 44 * S, oy = gy - 46 * S;
  if (u < 16.6 || forma <= 0) formas.push({ tipo: "circulo", x: gx, y: gy, r: gr * (1 + 1.2 * juntas) * (u > 16.6 ? 1 - forma : 1) });
  if (forma > 0 && u < 19.8) {
    formas.push({ tipo: "circulo", x: gx, y: gy, r: 27 * S * forma, funde: 1 });
    formas.push({ tipo: "agujero", x: gx, y: gy, r: 7 * S * eo(seg(u, 16.8, 17.7)) });
    formas.push({ tipo: "agujero", x: ox + 26.6 * S, y: oy + 28.6 * S, r: 10 * S * eo(seg(u, 16.9, 17.8)) });
    formas.push({ tipo: "circulo", x: ox + 19.5 * S, y: oy + 21.5 * S, r: 8 * S * eo(seg(u, 17.1, 17.9)), funde: 0 });
  }
  if (u >= 19.8) formas.length = 0;
  return { formas, k, onda, etiquetas, hilos, s };
}

/* La capa de arriba: hilos de luz y nombres dentro del vidrio */
export function capa(c, w, h, q) {
  c.clearRect(0, 0, w, h);
  q.hilos.forEach(({ x0, y0, x1, y1, a }) => {
    const mx = (x0 + x1) / 2, g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(255,255,255,${.95 * a})`); g.addColorStop(1, `rgba(255,255,255,${.3 * a})`);
    c.strokeStyle = g; c.lineWidth = 1.6 * q.s; c.beginPath(); c.moveTo(x0, y0);
    const k = a; c.bezierCurveTo(lerp(x0, mx, k), y0, lerp(x0, mx, k), lerp(y0, y1, k), lerp(x0, x1, k), lerp(y0, y1, k)); c.stroke();
  });
  q.etiquetas.forEach(({ x, y, n, col, a, s, ancho }) => {
    c.globalAlpha = a; const x0 = x - ancho / 2 + 26 * s;
    c.fillStyle = col; c.beginPath(); c.arc(x0, y, 8 * s, 0, 7); c.fill();
    c.font = LETRA(27 * s); c.fillStyle = "#0B131B"; c.textBaseline = "middle"; c.fillText(n, x0 + 20 * s, y + 1 * s);
    c.globalAlpha = 1;
  });
}
