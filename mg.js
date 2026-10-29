// Optimizo · motion graphics. Cada escena se dibuja en un lienzo de 800 × 600 que se ajusta al contenedor; depende solo del tiempo (t, en segundos), así el loop es exacto y se puede renderizar a video.
// Guion visual de la v6: fondo claro, tinta y gris, tarjetas blancas con sombra larga, una sola tinta de color por superpoder.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const K = { tinta: "#0B131B", gris: "#A1A9AD", gris2: "#5E6A71", nube: "#F5F5F7", linea: "rgba(11,19,27,.08)", verde: "#1F9D5A" };
const LETRA = (px, w = 600) => `${w} ${px}px Inter, -apple-system, "SF Pro Text", system-ui, sans-serif`;
const GEIST = (px, w = 500) => `${w} ${px}px Geist, Inter, system-ui, sans-serif`;
export const COLOR = { tareas: "#3FA99D", seguridad: "#FFAE1A", inteligencia: "#1B75FD", calidad: "#6E56CF", rentabilidad: "#1F9D5A", continuidad: "#F2557A" };

const IMG = {};
["gmail.svg", "bsale.png", "microsoftexcel.svg", "whatsapp.svg", "zoho.svg"].forEach((f) => { const i = new Image(); i.src = `recursos/logos/${f}`; IMG[f] = i; });
{ const i = new Image(); i.src = "recursos/medula-marca.svg"; IMG.medula = i; }

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
function tarjeta(c, x, y, w, h, r = 18, a = 1, fondo = "#fff") {
  c.save(); c.globalAlpha *= a;
  c.shadowColor = "rgba(11,19,27,.10)"; c.shadowBlur = 40; c.shadowOffsetY = 18;
  rr(c, x, y, w, h, r); c.fillStyle = fondo; c.fill();
  c.shadowColor = "transparent"; c.strokeStyle = "rgba(11,19,27,.05)"; c.lineWidth = 1; c.stroke();
  c.restore();
}
function texto(c, s, x, y, px, w, col, alin = "left", fuente = LETRA) { c.font = fuente(px, w); c.fillStyle = col; c.textAlign = alin; c.textBaseline = "middle"; c.fillText(s, x, y); }
function escribir(s, k) { const a = Array.from(s); return a.slice(0, Math.round(a.length * clamp(k))).join(""); }
function cursor(c, s, x, y, px, w, col, t, fuente = LETRA) { c.font = fuente(px, w); const ancho = c.measureText(s).width; if (Math.floor(t * 2.2) % 2 === 0) { c.fillStyle = col; c.fillRect(x + ancho + 2, y - px * .55, 2, px * 1.1); } }
function imagen(c, im, x, y, s) { if (im && im.complete && im.naturalWidth) c.drawImage(im, x, y, s, s); }
function alfa(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function pildora(c, s, x, y, col, a = 1, fondo = "#fff") {
  c.save(); c.globalAlpha *= a; c.font = LETRA(13, 600); const w = c.measureText(s).width + 30;
  rr(c, x, y - 13, w, 26, 13); c.fillStyle = fondo; c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x + 12, y, 4, 0, 7); c.fill();
  texto(c, s, x + 21, y + .5, 13, 600, K.tinta); c.restore(); return w;
}

/* ── 01 · Eficiencia: la fila de tareas se resuelve sola ── */
const TAREAS = [["gmail.svg", "Cotización a Quillay", "Enviada"], ["bsale.png", "Factura de octubre", "Emitida"], ["microsoftexcel.svg", "Inventario semanal", "Actualizado"], ["whatsapp.svg", "Aviso de despacho", "Avisado"]];
function tareas(c, t) {
  const col = COLOR.tareas, L = 8, u = t % L;
  const sale = eio(seg(u, 6.6, 7.4)), entra = eo(seg(u, 0, .7));
  TAREAS.forEach(([ic, nom, ok], i) => {
    const y = 150 + i * 84, ini = .5 + i * 1.25, fin = ini + .9;
    const k = seg(u, ini, fin), hecha = u > fin;
    const dx = lerp(60, 0, entra) - sale * 80, a = entra * (1 - sale);
    c.save(); c.translate(dx + i * 0, 0);
    tarjeta(c, 160, y, 480, 66, 18, a);
    c.globalAlpha = a;
    if (k > 0 && k < 1) { // barrido de luz
      c.save(); rr(c, 160, y, 480, 66, 18); c.clip();
      const gx = lerp(100, 700, eio(k)), g = c.createLinearGradient(gx - 120, 0, gx + 120, 0);
      g.addColorStop(0, alfa(col, 0)); g.addColorStop(.5, alfa(col, .22)); g.addColorStop(1, alfa(col, 0));
      c.fillStyle = g; c.fillRect(160, y, 480, 66); c.restore();
    }
    // barra de avance en el borde inferior
    c.save(); rr(c, 160, y, 480, 66, 18); c.clip(); c.fillStyle = col; c.fillRect(160, y + 63, 480 * eio(k), 3); c.restore();
    imagen(c, IMG[ic], 184, y + 22, 22);
    texto(c, nom, 222, y + 33, 17, 600, K.tinta);
    const estado = hecha ? escribir(ok, seg(u, fin, fin + .35)) : "En curso";
    const ce = hecha ? col : K.gris;
    c.font = LETRA(14, 600); const we = c.measureText(hecha ? ok : "En curso").width;
    c.fillStyle = ce; c.beginPath(); c.arc(612 - we - 10, y + 33, 4, 0, 7); c.fill();
    texto(c, estado, 612 - we, y + 33.5, 14, 600, ce);
    c.restore();
  });
  // contador de la cola, arriba
  const n = TAREAS.filter((_, i) => u > .5 + i * 1.25 + .9).length;
  c.globalAlpha = entra * (1 - sale);
  texto(c, "Cola de hoy", 160, 108, 13, 600, K.gris2);
  texto(c, `${n} / 4 resueltas`, 640, 108, 13, 600, n === 4 ? col : K.gris2, "right");
  c.globalAlpha = 1;
}

/* ── 02 · Seguridad: plano de bodega; la zona de riesgo se enciende cuando se acercan ── */
function seguridad(c, t) {
  const col = COLOR.seguridad, L = 9, u = t % L;
  // piso
  rr(c, 90, 70, 620, 460, 26); c.fillStyle = "#fff"; c.fill(); c.strokeStyle = K.linea; c.stroke();
  c.fillStyle = "#EEF0F2"; [[130, 110, 150, 46], [130, 186, 150, 46], [130, 262, 150, 46], [520, 110, 150, 46], [520, 186, 150, 46]].forEach(([x, y, w, h]) => { rr(c, x, y, w, h, 10); c.fill(); });
  c.strokeStyle = "rgba(11,19,27,.06)"; c.setLineDash([8, 10]); c.beginPath(); c.moveTo(400, 100); c.lineTo(400, 500); c.stroke(); c.setLineDash([]);
  // zona restringida
  const cerca = eio(seg(u, 2.6, 3.4)) * (1 - eio(seg(u, 6.2, 7)));
  const zx = 470, zy = 320, zw = 210, zh = 170;
  c.save(); rr(c, zx, zy, zw, zh, 18);
  c.fillStyle = alfa(col, .06 + .16 * cerca * (.75 + .25 * Math.sin(t * 7))); c.fill();
  c.setLineDash([10, 8]); c.lineDashOffset = -t * 20; c.strokeStyle = alfa(col, .5 + .5 * cerca); c.lineWidth = 2; c.stroke(); c.restore();
  texto(c, "Zona restringida", zx + 16, zy + zh - 20, 12, 600, cerca > .5 ? "#A35C00" : K.gris2);
  // montacargas: recorre el pasillo
  const fy = lerp(470, 150, eio(seg(u, .4, 6.5))), fx = 400;
  c.save(); c.translate(fx, fy);
  rr(c, -26, -34, 52, 64, 12); c.fillStyle = "#3A4650"; c.fill();
  c.fillStyle = "#5B6873"; rr(c, -18, -24, 36, 26, 7); c.fill();
  c.fillStyle = "#9AA4AC"; c.fillRect(-18, -54, 6, 22); c.fillRect(12, -54, 6, 22);
  c.restore();
  // persona: entra a la zona y sale
  const pk = eio(seg(u, 1.2, 3.2)), pv = eio(seg(u, 5.6, 7.6));
  const px = lerp(lerp(700, 560, pk), 720, pv), py = lerp(lerp(500, 400, pk), 520, pv);
  c.fillStyle = alfa(K.tinta, .1); c.beginPath(); c.arc(px, py, 20, 0, 7); c.fill();
  c.fillStyle = K.tinta; c.beginPath(); c.arc(px, py, 9, 0, 7); c.fill();
  // detecciones
  const det = (x, y, w, h, s, a) => { if (a <= 0) return; c.save(); c.globalAlpha = a; rr(c, x, y, w, h, 12); c.strokeStyle = col; c.lineWidth = 2; c.fillStyle = alfa(col, .08); c.fill(); c.stroke(); c.restore(); pildora(c, s, x, y - 18, col, a, "rgba(255,255,255,.95)"); };
  const ad = eo(seg(u, .3, .9)) * (1 - eo(seg(u, 8.2, 8.8)));
  det(fx - 40, fy - 68, 80, 112, "Montacargas", ad);
  det(px - 30, py - 30, 60, 60, "Persona", ad * (1 - pv * .9));
  // alerta
  const al = eo(seg(u, 3.3, 3.9)) * (1 - eo(seg(u, 6.6, 7.2)));
  if (al > 0) {
    c.save(); c.translate(0, (1 - al) * 16);
    tarjeta(c, 110, 410, 330, 78, 18, al);
    c.globalAlpha = al;
    rr(c, 126, 426, 46, 46, 13); c.fillStyle = col; c.fill();
    c.strokeStyle = "#241600"; c.lineWidth = 2.4; c.lineJoin = "round"; c.beginPath(); c.moveTo(149, 438); c.lineTo(137, 460); c.lineTo(161, 460); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(149, 446); c.lineTo(149, 452); c.stroke();
    texto(c, "LUMINA · AHORA", 186, 434, 11, 700, "#A35C00");
    const s = escribir("Persona en zona restringida", seg(u, 3.6, 4.6));
    texto(c, s, 186, 455, 16, 650, K.tinta); cursor(c, s, 186, 455, 16, 650, col, t);
    texto(c, "Pasillo 4 · CAM 02", 186, 475, 12.5, 500, K.gris2);
    c.restore();
  }
}

/* ── 03 · Inteligencia: los datos fluyen desde las fuentes y forman la tendencia; Médula escribe el hallazgo ── */
const PUNTOS = [[0, .22], [1, .3], [2, .2], [3, .42], [4, .38], [5, .62], [6, .66], [7, .8]];
function inteligencia(c, t) {
  const col = COLOR.inteligencia, L = 9, u = t % L, a = eo(seg(u, 0, .5)) * (1 - eo(seg(u, 8.3, 8.9)));
  c.globalAlpha = a;
  // fuentes
  [["bsale.png", "Bsale", 140], ["zoho.svg", "Zoho CRM", 240]].forEach(([im, n, y]) => { tarjeta(c, 70, y - 30, 150, 60, 16, 1); c.globalAlpha = a; imagen(c, IMG[im], 90, y - 11, 22); texto(c, n, 122, y + .5, 15, 600, K.tinta); });
  // gráfico
  tarjeta(c, 300, 90, 430, 250, 22, 1); c.globalAlpha = a;
  texto(c, "Ventas · zona norte", 326, 120, 13, 600, K.gris2);
  const X = (i) => 336 + i * 52, Y = (v) => 150 + v * 160;
  c.strokeStyle = K.linea; c.lineWidth = 1; [0, 1, 2, 3].forEach((j) => { c.beginPath(); c.moveTo(326, 160 + j * 50); c.lineTo(704, 160 + j * 50); c.stroke(); });
  const kl = eio(seg(u, .8, 3.6)), n = kl * (PUNTOS.length - 1);
  c.save(); c.beginPath();
  PUNTOS.forEach(([i, v], j) => { if (j > Math.ceil(n)) return; const kk = j <= n ? 1 : n - (j - 1); const x = lerp(X(Math.max(0, i - 1)), X(i), j === 0 ? 1 : clamp(kk)), y = lerp(Y(PUNTOS[Math.max(0, j - 1)][1]), Y(v), j === 0 ? 1 : clamp(kk)); j ? c.lineTo(x, y) : c.moveTo(x, y); });
  c.strokeStyle = col; c.lineWidth = 3; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); c.restore();
  PUNTOS.forEach(([i, v], j) => { if (j > n) return; c.fillStyle = "#fff"; c.beginPath(); c.arc(X(i), Y(v), 5, 0, 7); c.fill(); c.strokeStyle = col; c.lineWidth = 2.5; c.stroke(); });
  // partículas: de las fuentes al gráfico
  for (let p = 0; p < 14; p++) {
    const fase = (u * .55 + p / 14) % 1, desde = p % 2 ? 240 : 140, hasta = PUNTOS[p % 8];
    if (u > 4) break;
    const x0 = 222, y0 = desde, x1 = X(hasta[0]), y1 = Y(hasta[1]), cx = 280, cy = lerp(y0, y1, .5) - 40;
    const k = eio(fase), x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * cx + k * k * x1, y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * cy + k * k * y1;
    c.fillStyle = alfa(col, .7 * Math.sin(fase * Math.PI)); c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill();
  }
  // Médula escribe
  const am = eo(seg(u, 3.4, 4));
  if (am > 0) {
    c.save(); c.translate(0, (1 - am) * 20);
    tarjeta(c, 160, 370, 570, 150, 22, am); c.globalAlpha = a * am;
    imagen(c, IMG.medula, 186, 392, 22); texto(c, "Médula", 216, 404, 15, 600, "#06102E", "left", GEIST);
    const l1 = "Las ventas de la zona norte bajaron este mes.", l2 = "Tres clientes no han vuelto a comprar.";
    const s1 = escribir(l1, seg(u, 4, 5.4)), s2 = escribir(l2, seg(u, 5.4, 6.6));
    texto(c, s1, 186, 440, 19, 500, "#06102E", "left", GEIST);
    texto(c, s2, 186, 468, 19, 500, "#06102E", "left", GEIST);
    if (u < 5.4) cursor(c, s1, 186, 440, 19, 500, col, t, GEIST); else cursor(c, s2, 186, 468, 19, 500, col, t, GEIST);
    const ac = eo(seg(u, 6.7, 7.2));
    c.globalAlpha = a * am * ac;
    [["bsale.png", "Bsale", 186], ["zoho.svg", "Zoho CRM", 266]].forEach(([im, n, x]) => { c.font = GEIST(12.5, 500); const w = c.measureText(n).width + 36; rr(c, x, 492, w, 24, 7); c.fillStyle = "#F2F7FE"; c.fill(); imagen(c, IMG[im], x + 8, 497, 14); texto(c, n, x + 27, 504.5, 12.5, 500, "#06102E", "left", GEIST); });
    c.restore();
  }
  c.globalAlpha = 1;
}

/* ── 04 · Calidad: la cinta pasa bajo el escáner y la pieza fuera de parámetro sale de la fila ── */
function calidad(c, t) {
  const col = COLOR.calidad, P = 1.1, sx = 400;
  // cinta
  rr(c, 60, 330, 680, 74, 37); c.fillStyle = "#E9ECEE"; c.fill();
  c.save(); rr(c, 60, 330, 680, 74, 37); c.clip(); c.strokeStyle = "rgba(11,19,27,.07)"; c.lineWidth = 2;
  for (let x = -40 + (t * 90) % 40; x < 760; x += 40) { c.beginPath(); c.moveTo(x, 334); c.lineTo(x - 12, 400); c.stroke(); } c.restore();
  // piezas
  const n0 = Math.floor(t / P);
  for (let j = n0 - 8; j <= n0; j++) {
    const x = 20 + (t - j * P) * 90 * 1.0 * 0 + ((t - j * P) / P) * 99;
    if (x < 20 || x > 780) continue;
    const mala = ((j % 6) + 6) % 6 === 3;
    const pasada = x > sx;
    let y = 367, rot = mala ? .22 : 0, a = 1;
    if (mala && pasada) { const k = eio((x - sx) / 150); y = lerp(367, 210, k); a = 1 - seg(x, sx + 200, sx + 300); }
    c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot);
    c.shadowColor = "rgba(11,19,27,.12)"; c.shadowBlur = 14; c.shadowOffsetY = 6;
    rr(c, -24, -24, 48, 48, 12); c.fillStyle = "#fff"; c.fill(); c.shadowColor = "transparent";
    c.strokeStyle = mala && pasada ? col : "rgba(11,19,27,.08)"; c.lineWidth = mala && pasada ? 2.5 : 1; c.stroke();
    c.fillStyle = mala ? "#C9CFD2" : "#DCE1E4"; c.beginPath(); mala ? c.ellipse(4, 2, 11, 7, .6, 0, 7) : c.arc(0, 0, 10, 0, 7); c.fill();
    c.restore();
    if (pasada) {
      const kk = seg(x, sx, sx + 40);
      if (mala) pildora(c, "Revisar", x - 34, y - 46, col, kk * a);
      else { c.globalAlpha = kk * (1 - seg(x, 640, 740)); texto(c, "OK", x, 312, 12, 700, K.verde, "center"); c.globalAlpha = 1; }
    }
  }
  // escáner
  const g = c.createLinearGradient(sx - 60, 0, sx + 60, 0); g.addColorStop(0, alfa(col, 0)); g.addColorStop(.5, alfa(col, .18 + .06 * Math.sin(t * 9))); g.addColorStop(1, alfa(col, 0));
  c.fillStyle = g; c.fillRect(sx - 60, 300, 120, 134);
  c.fillStyle = col; rr(c, sx - 1.5, 286, 3, 162, 2); c.fill();
  rr(c, sx - 46, 250, 92, 32, 16); c.fillStyle = "#fff"; c.fill(); c.strokeStyle = alfa(col, .35); c.stroke();
  texto(c, "Escáner", sx, 266.5, 12.5, 600, col, "center");
  // contador
  texto(c, "Línea de inspección", 70, 120, 13, 600, K.gris2);
  texto(c, "Lote 0414", 70, 146, 22, 650, K.tinta);
}

/* ── 05 · Rentabilidad: las horas manuales se achican y se libera valor ── */
const MESES = [["Jun", .86, .06], ["Jul", .74, .16], ["Ago", .62, .28], ["Sep", .5, .4], ["Oct", .4, .5]];
function rentabilidad(c, t) {
  const col = COLOR.rentabilidad, L = 8, u = t % L, sale = eio(seg(u, 7.2, 7.9));
  const base = 450, H = 300, w = 76, gap = 34, x0 = 400 - (5 * w + 4 * gap) / 2;
  c.strokeStyle = K.linea; c.beginPath(); c.moveTo(x0 - 20, base + .5); c.lineTo(x0 + 5 * w + 4 * gap + 20, base + .5); c.stroke();
  MESES.forEach(([m, man, val], i) => {
    const k = eio(seg(u, .3 + i * .5, 1.3 + i * .5)) * (1 - sale), kv = eio(seg(u, 1 + i * .5, 2 + i * .5)) * (1 - sale);
    const x = x0 + i * (w + gap), hm = H * man * k, hv = H * val * kv;
    rr(c, x, base - hm, w, hm, 12); c.fillStyle = "#DDE3E5"; if (hm > 1) c.fill();
    if (hv > 1) { const g = c.createLinearGradient(0, base - hm - hv, 0, base - hm); g.addColorStop(0, alfa(col, .95)); g.addColorStop(1, alfa(col, .55)); rr(c, x, base - hm - hv - 6, w, hv, 12); c.fillStyle = g; c.fill(); }
    texto(c, m, x + w / 2, base + 24, 13, 500, K.gris, "center");
  });
  const a = 1 - sale;
  c.globalAlpha = a;
  c.fillStyle = "#DDE3E5"; rr(c, 150, 92, 14, 14, 4); c.fill(); texto(c, "Horas en tareas manuales", 172, 99.5, 13, 600, K.gris2);
  c.fillStyle = col; rr(c, 380, 92, 14, 14, 4); c.fill(); texto(c, "Tiempo recuperado", 402, 99.5, 13, 600, K.gris2);
  texto(c, "ejemplo", 650, 99.5, 12, 500, K.gris, "right");
  c.globalAlpha = 1;
}

/* ── 06 · Continuidad: el pulso de la línea cae, salta la alerta y se recupera ── */
function continuidad(c, t) {
  const col = COLOR.continuidad, L = 9, u = t % L;
  const falla = eio(seg(u, 3, 3.6)) * (1 - eio(seg(u, 5.6, 6.4)));
  tarjeta(c, 90, 120, 620, 360, 24, 1);
  // cabecera
  const estado = falla > .5 ? "Línea 2 · desviación detectada" : u > 5.6 && u < 8 ? "Línea 2 · operando" : "Línea 2 · operando";
  const cd = falla > .5 ? col : K.verde;
  c.fillStyle = alfa(cd, .15); c.beginPath(); c.arc(124, 160, 9, 0, 7); c.fill(); c.fillStyle = cd; c.beginPath(); c.arc(124, 160, 4.5, 0, 7); c.fill();
  texto(c, estado, 142, 160.5, 15, 650, K.tinta);
  if (u > 6 && u < 8.6) { c.globalAlpha = eo(seg(u, 6, 6.5)) * (1 - eo(seg(u, 8.2, 8.6))); texto(c, "Alerta resuelta 09:14", 684, 160.5, 13, 600, K.gris2, "right"); c.globalAlpha = 1; }
  // pulso que corre
  c.save(); rr(c, 110, 190, 580, 260, 16); c.clip();
  c.beginPath();
  for (let x = 110; x <= 690; x += 2) {
    const fase = (x - 110) / 150 - t * 1.1, f = fase - Math.floor(fase);
    let y = 0;
    if (f > .35 && f < .41) y = -60 * Math.sin((f - .35) / .06 * Math.PI);
    else if (f > .41 && f < .47) y = 48 * Math.sin((f - .41) / .06 * Math.PI);
    const cerca = clamp(1 - Math.abs(x - 520) / 170);
    y = lerp(y, 18 * Math.sin(x * .05 + t * 6) * .35 + 30, falla * cerca);
    x === 110 ? c.moveTo(x, 320 + y) : c.lineTo(x, 320 + y);
  }
  const g = c.createLinearGradient(110, 0, 690, 0); g.addColorStop(0, alfa("#387E80", .2)); g.addColorStop(.6, "#387E80"); g.addColorStop(.75, falla > .1 ? col : "#387E80"); g.addColorStop(1, falla > .1 ? col : "#387E80");
  c.strokeStyle = g; c.lineWidth = 3; c.lineJoin = "round"; c.stroke(); c.restore();
  // alerta
  const al = eo(seg(u, 3.5, 4)) * (1 - eo(seg(u, 5.8, 6.3)));
  if (al > 0) { const w = pildora(c, "Desviación en Línea 2 · avisado", 0, -100, col, 0); pildora(c, "Desviación en Línea 2 · avisado", 400 - w / 2, 230 - (1 - al) * 12, col, al); }
}

export const ESCENAS = { tareas, seguridad, inteligencia, calidad, rentabilidad, continuidad };

/* Dibuja una escena en su lienzo, ajustada (contain) al tamaño del contenedor */
export function cuadro(cv, nombre, t) {
  const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext("2d"), s = Math.min(w / 800, h / 600);
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  c.translate((w - 800 * s) / 2, (h - 600 * s) / 2); c.scale(s, s);
  ESCENAS[nombre](c, t);
}
