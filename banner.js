// Optimizo · motion graphic del banner: «tu operación se conecta». 18 s en loop, sin sonido, depende solo del tiempo.
// 0–3 calma · 3–7 piezas sueltas · 7–11 conexión · 11–15 superpoderes · 15–18 respira y vuelve. La acción vive arriba a la derecha (o arriba en el celular); el titular queda libre.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const LETRA = (px, w = 600) => `${w} ${px}px Inter, -apple-system, "SF Pro Text", system-ui, sans-serif`;
const TINTA = "#0B131B", GRIS = "#5E6A71", TEAL = "#387E80", MENTA = "#91CEC4", AMBAR = "#FFAE1A", VERDE = "#1F9D5A";
export const DURACION = 18;

const img = (src) => { const i = new Image(); i.src = src; return i; };
const IM = { iso: img("recursos/optimizo-isotipo.svg"), wa: img("recursos/logos/whatsapp.svg"), gm: img("recursos/logos/gmail.svg"), xl: img("recursos/logos/microsoftexcel.svg"), bs: img("recursos/logos/bsale.png"), med: img("recursos/medula-marca.svg"), cam: img("recursos/video/bodega.jpg") };
const listo = (i) => i && i.complete && i.naturalWidth;
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
const azar = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const escribir = (s, k) => { const a = Array.from(s); return a.slice(0, Math.round(a.length * clamp(k))).join(""); };
const alfa = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// Las seis piezas: antes (el problema, de la narrativa) y después (el superpoder)
const PIEZAS = [
  { ic: "wa", de: "Equipo operaciones", antes: "¿Cuál Excel? 😅", despues: "Avisado", col: VERDE },
  { ic: "gm", de: "Recibidos", antes: "RE: RE: RE: Cotización", despues: "Enviada", col: VERDE },
  { ic: "xl", de: "Inventario_FINAL_v3 (2).xlsx", antes: "#REF!", despues: "Actualizado", col: VERDE, mono: true },
  { ic: "cam", de: "CAM 01", antes: "Pasillo 2", despues: "Persona", col: AMBAR, camara: true },
  { ic: "bs", de: "Factura de octubre", antes: "En curso", despues: "Emitida", col: VERDE },
  { ic: "med", de: "Médula", antes: "Ventas · zona norte", despues: "Tendencia lista", col: "#1B75FD", grafico: true },
];

/* Aurora dibujada (solo para el render a video; en la página la pone el CSS) */
function aurora(c, w, h, t) {
  c.fillStyle = "#fff"; c.fillRect(0, 0, w, h);
  const ph = (t / DURACION) * Math.PI * 2;
  [[.62, .1, .55, MENTA, .75], [.82, .32, .42, "#59BDB1", .42], [.3, .3, .48, "#CFEDE7", .8], [.86, .62, .34, "#A9DCD3", .5], [.52, .52, .36, "#E6F5F1", .9]].forEach(([x, y, r, col, a], i) => {
    const cx = (x + .05 * Math.sin(ph + i * 1.7)) * w, cy = (y + .05 * Math.cos(ph * 1 + i)) * h, R = r * Math.max(w, h);
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, alfa(col, a)); g.addColorStop(1, alfa(col, 0));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const f = c.createLinearGradient(0, 0, 0, h); f.addColorStop(.45, "rgba(255,255,255,0)"); f.addColorStop(.97, "#fff"); c.fillStyle = f; c.fillRect(0, 0, w, h);
}

/* Geometría: dónde vive la acción según el formato */
function zona(w, h, centrado) {
  const vertical = w / h < .9;
  if (vertical) { const s = clamp(w / 640, .5, 1.4), dy = 158 * s, cy = centrado ? h * .54 : h * .31; return { cx: w * .5, cy, s, dx: w * .22, dy, px: w * .5, py: cy - dy - 95 * s, vertical }; }
  const s = clamp(w / 1250, .75, 1.4), cy = centrado ? h * .5 : h * .34, cx = centrado ? w * .5 : w * .72;
  return { cx, cy, s, dx: Math.max(w * .15, 190 * s), dy: h * (centrado ? .22 : .17), px: cx, py: cy, vertical };
}

export function banner(c, w, h, t, { conAurora = false, centrado = false } = {}) {
  const u = ((t % DURACION) + DURACION) % DURACION;
  if (conAurora) aurora(c, w, h, u); else c.clearRect(0, 0, w, h);
  const Z = zona(w, h, centrado), s = Z.s;
  const llega = eo(seg(u, .8, 1.8)), vaSe = eio(seg(u, 15.6, 17.4));
  const ordena = eio(seg(u, 7.2, 9.6)), lineas = eo(seg(u, 7, 9)) * (1 - eio(seg(u, 15, 16.4)));

  // posiciones: desorden (piezas sueltas) → orden (grilla de 2 × 3 alrededor del punto)
  const pos = PIEZAS.map((_, i) => {
    const col = i % 2 ? 1 : -1, fila = Math.floor(i / 2) - 1;
    const ox = Z.cx + col * Z.dx, oy = Z.cy + fila * Z.dy;
    const ang = azar(i + 3) * Math.PI * 2, rad = (Z.vertical ? .32 : .2) * Math.min(w, h);
    const sx = Z.cx + Math.cos(ang) * rad * (1.1 + azar(i) * .5) * (Z.vertical ? .9 : 1.2), sy = Z.cy + Math.sin(ang) * rad * (.8 + azar(i + 9) * .4);
    const m = 135 * Z.s, sx2 = Z.vertical || centrado ? clamp(sx, m + 8, w - m - 8) : clamp(sx, w * .6, w - m - 16), sy2 = centrado ? clamp(sy, h * .12, h * .88) : Z.vertical ? clamp(sy, h * .1, h * .4) : clamp(sy, h * .14, h * .7);
    return { x: lerp(sx2, ox, ordena), y: lerp(sy2, oy, ordena), rot: lerp((azar(i + 5) - .5) * .16, 0, ordena), prof: azar(i + 1) };
  });

  // líneas desde el punto, con pulsos que viajan
  if (lineas > 0) {
    pos.forEach((p, i) => {
      const k = eo(seg(u, 7 + i * .15, 8.6 + i * .15)) * lineas;
      if (k <= 0) return;
      const x = lerp(Z.px, p.x, k), y = lerp(Z.py, p.y, k);
      c.strokeStyle = alfa(TEAL, .45 * lineas); c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(Z.px, Z.py); c.lineTo(x, y); c.stroke();
      const f = ((u * .6 + i * .17) % 1);
      if (u > 8.4 && u < 15) { c.fillStyle = alfa(TEAL, .9 * Math.sin(f * Math.PI)); c.beginPath(); c.arc(lerp(Z.px, p.x, f), lerp(Z.py, p.y, f), 3.2 * s, 0, 7); c.fill(); }
    });
  }

  // el punto de Optimizo
  const kp = llega * (1 - vaSe);
  if (kp > 0) {
    const r = 34 * s * (.6 + .4 * kp), y = Z.py - (1 - llega) * 60 * s, X = Z.px;
    const halo = c.createRadialGradient(X, y, 0, X, y, r * 3.2); halo.addColorStop(0, alfa(MENTA, .45 * kp)); halo.addColorStop(1, alfa(MENTA, 0));
    c.fillStyle = halo; c.beginPath(); c.arc(X, y, r * 3.2, 0, 7); c.fill();
    const late = 1 + .04 * Math.sin(u * 2.4);
    c.save(); c.globalAlpha = kp; c.shadowColor = "rgba(56,126,128,.35)"; c.shadowBlur = 30 * s; c.shadowOffsetY = 10 * s;
    c.beginPath(); c.arc(X, y, r * 1.35 * late, 0, 7); c.fillStyle = "#fff"; c.fill(); c.shadowColor = "transparent";
    if (listo(IM.iso)) c.drawImage(IM.iso, X - r * .95, y - r * .95, r * 1.9, r * 1.9);
    c.restore();
  }

  // las piezas
  PIEZAS.forEach((pz, i) => {
    const ent = eo(seg(u, 3 + i * .45, 4.2 + i * .45)), sal = vaSe;
    const a = ent * (1 - sal);
    if (a <= 0) return;
    const p = pos[i], W = (pz.camara || pz.grafico ? 230 : 250) * s, H = (pz.camara || pz.grafico ? 128 : 74) * s;
    const desen = (1 - ent) * 14 + sal * 12 + (1 - ordena) * p.prof * 2.5 * (u > 7 ? 1 : 0);
    c.save();
    c.translate(p.x, p.y + (1 - ent) * 30 * s - sal * 20 * s); c.rotate(p.rot);
    if ("filter" in c) c.filter = desen > .3 ? `blur(${desen.toFixed(1)}px)` : "none";
    c.globalAlpha = a;
    c.shadowColor = "rgba(11,19,27,.12)"; c.shadowBlur = 36 * s; c.shadowOffsetY = 16 * s;
    rr(c, -W / 2, -H / 2, W, H, 18 * s); c.fillStyle = "#fff"; c.fill(); c.shadowColor = "transparent";
    c.strokeStyle = "rgba(11,19,27,.05)"; c.lineWidth = 1; c.stroke();
    const despues = u > 11 + i * .35, kd = seg(u, 11 + i * .35, 11.6 + i * .35);
    const x0 = -W / 2 + 16 * s;
    if (pz.camara) {
      c.save(); rr(c, -W / 2 + 8 * s, -H / 2 + 8 * s, W - 16 * s, H - 16 * s, 12 * s); c.clip();
      if (listo(IM.cam)) { const iw = W - 16 * s, ih = iw * IM.cam.naturalHeight / IM.cam.naturalWidth; c.drawImage(IM.cam, -W / 2 + 8 * s, -ih / 2, iw, ih); }
      c.restore();
      c.font = LETRA(11 * s, 600); c.fillStyle = "rgba(255,255,255,.88)"; rr(c, x0 - 2 * s, -H / 2 + 16 * s, 72 * s, 20 * s, 6 * s); c.fill();
      c.fillStyle = "#E5484D"; c.beginPath(); c.arc(x0 + 8 * s, -H / 2 + 26 * s, 3.2 * s, 0, 7); c.fill();
      c.fillStyle = TINTA; c.textBaseline = "middle"; c.fillText("CAM 01", x0 + 16 * s, -H / 2 + 26.5 * s);
      if (despues) { // la detección de Lumina
        const k = eo(kd); c.globalAlpha = a * k;
        const bx = W * .12, by = -H * .28, bw = W * .26, bh = H * .5;
        rr(c, bx - 6 * s * (1 - k), by, bw, bh, 10 * s); c.strokeStyle = AMBAR; c.lineWidth = 2 * s; c.fillStyle = alfa(AMBAR, .1); c.fill(); c.stroke();
        c.font = LETRA(11 * s, 600); const tw = c.measureText("Persona").width + 22 * s;
        rr(c, bx, by - 24 * s, tw, 20 * s, 10 * s); c.fillStyle = "rgba(15,11,6,.82)"; c.fill();
        c.fillStyle = AMBAR; c.beginPath(); c.arc(bx + 10 * s, by - 14 * s, 3 * s, 0, 7); c.fill();
        c.fillStyle = "#fff"; c.fillText("Persona", bx + 17 * s, by - 13.5 * s);
      }
    } else if (pz.grafico) {
      if (listo(IM.med)) c.drawImage(IM.med, x0, -H / 2 + 14 * s, 18 * s, 18 * s);
      c.font = LETRA(12.5 * s, 600); c.fillStyle = GRIS; c.textBaseline = "middle"; c.fillText(pz.antes, x0 + 26 * s, -H / 2 + 23.5 * s);
      const P = [.25, .32, .22, .45, .4, .62, .7, .82], k = eio(seg(u, 4.6 + i * .4, 6.6 + i * .4)), n = k * (P.length - 1);
      c.beginPath(); P.forEach((v, j) => { if (j > n + 1) return; const kk = j <= n ? 1 : n - (j - 1); const X = lerp(x0 + (j - 1) * (W - 32 * s) / 7, x0 + j * (W - 32 * s) / 7, j ? clamp(kk) : 1), Y = lerp(-H / 2 + 44 * s + P[Math.max(0, j - 1)] * 60 * s, -H / 2 + 44 * s + v * 60 * s, j ? clamp(kk) : 1); j ? c.lineTo(X, Y) : c.moveTo(X, Y); });
      c.strokeStyle = "#1B75FD"; c.lineWidth = 2.4 * s; c.lineJoin = "round"; c.lineCap = "round"; c.stroke();
      if (despues) { c.globalAlpha = a * eo(kd); c.font = LETRA(11.5 * s, 600); c.fillStyle = "#1B75FD"; c.textAlign = "right"; c.fillText(pz.despues, W / 2 - 16 * s, -H / 2 + 23.5 * s); c.textAlign = "left"; }
    } else {
      if (listo(IM[pz.ic])) c.drawImage(IM[pz.ic], x0, -H / 2 + 14 * s, 18 * s, 18 * s);
      c.font = LETRA(12 * s, 600); c.fillStyle = "#A1A9AD"; c.textBaseline = "middle"; c.fillText(pz.de, x0 + 26 * s, -H / 2 + 23.5 * s);
      const txt = escribir(pz.antes, seg(u, 3.6 + i * .45, 4.8 + i * .45));
      c.font = pz.mono ? `600 ${15 * s}px ui-monospace, Menlo, monospace` : LETRA(15.5 * s, 600);
      c.globalAlpha = a * (1 - eo(kd * 1.6));
      c.fillStyle = pz.mono ? "#C2410C" : TINTA; c.fillText(txt, x0, -H / 2 + 50 * s);
      if (despues) { // el problema se borra y en su lugar se escribe el resultado
        const kk = seg(u, 11.25 + i * .35, 11.9 + i * .35);
        c.globalAlpha = a; c.font = LETRA(15 * s, 650);
        c.fillStyle = pz.col; c.beginPath(); c.arc(x0 + 4 * s, -H / 2 + 50 * s, 4 * s, 0, 7); c.globalAlpha = a * eo(kk * 2); c.fill();
        c.globalAlpha = a; c.fillStyle = pz.col; c.fillText(escribir(pz.despues, kk), x0 + 16 * s, -H / 2 + 50.5 * s);
      }
    }
    c.restore();
  });
}
