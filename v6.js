// Optimizo · sitio v6. Sin dependencias. Siempre claro; el texto se escribe y se borra, las columnas fijas guían y una sola frase se lee al ritmo del scroll.
import { cuadro as mgCuadro } from "./mg.js";
import { banner } from "./banner.js";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOVIL = () => innerWidth < 1020;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const azar = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ── Títulos que se arman palabra por palabra ── */
$$(".arma").forEach((h) => {
  let i = 0;
  const partir = (txt, cls) => txt.split(/(\s+)/).map((w) => (w.trim() ? `<span class="pal"><span class="${cls || ""}" style="--i:${i++}">${w}</span></span>` : w)).join("");
  h.innerHTML = [...h.childNodes].map((n) => (n.nodeType === 3 ? partir(n.textContent) : partir(n.textContent, n.className) )).join("");
});
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } }), { threshold: .15 });
$$("[data-r], .arma, .escenario").forEach((n) => io.observe(n));

function alVer(el, entrar, salir, umbral = .1) {
  new IntersectionObserver(([e]) => (e.isIntersecting ? entrar() : salir && salir()), { threshold: umbral }).observe(el);
}
function bucleVisible(el, cuadro, fps = 60) {
  let vivo = false, raf = 0, ultimo = 0; const t0 = performance.now();
  const paso = (ahora) => { if (!vivo) return; raf = requestAnimationFrame(paso); if (ahora - ultimo < 1000 / fps - 2) return; ultimo = ahora; cuadro((ahora - t0) / 1000); };
  alVer(el, () => { if (!vivo) { vivo = true; raf = requestAnimationFrame(paso); } }, () => { vivo = false; cancelAnimationFrame(raf); }, 0);
  if (QUIETO) requestAnimationFrame(() => cuadro(6));
}
const avance = (sec) => { const r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };


/* ── Detecciones reales sobre video (Lumina) ── */
const DET = window.DETECCIONES || [];
const LETRA = (px) => `600 ${px}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
function lienzo(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h); return { c, w, h };
}
function mapa(w, h) { const s = Math.max(w / 16, h / 9), vw = 16 * s, vh = 9 * s, ox = (w - vw) / 2, oy = (h - vh) / 2; return { X: (n) => ox + n * vw, Y: (n) => oy + n * vh }; }
function cajas(t) {
  const f = DET.length ? DET[Math.min(DET.length - 1, Math.round(t * 25))] : null, out = [];
  if (!f) return out;
  if (f.m) { const [mx, my, mw, mh] = f.m, x0 = Math.max(mx, .43), x1 = Math.min(mx + mw, .84 - .08 * t / 5.96); out.push({ x: x0, y: Math.max(my, .02) + 40 / 630, w: x1 - x0, h: mh - 70 / 630, col: "#FF8A00", txt: "Montacargas", m: 1 }); }
  f.p.slice(0, 2).forEach((p) => out.push({ x: p[0], y: p[1] + 30 / 630, w: p[2], h: p[3], col: "#FFD37A", txt: "Persona" }));
  return out;
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
function pildora(c, x, y, txt, col, k, e) {
  const fs = 12.5 * e; c.font = LETRA(fs); const tw = c.measureText(txt).width + 22 * e, hh = 24 * e, ly = Math.max(y - hh - 6 * e, 4);
  c.globalAlpha = k; c.fillStyle = "rgba(15,11,6,.82)"; rr(c, x, ly, tw, hh, hh / 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x + 11 * e, ly + hh / 2, 3.5 * e, 0, 7); c.fill();
  c.fillStyle = "#fff"; c.textBaseline = "middle"; c.fillText(txt, x + 19 * e, ly + hh / 2 + .5); c.globalAlpha = 1;
}
function dibujarCajas(c, M, lista, k, e) {
  lista.forEach((b, i) => {
    const ki = eo(clamp(k * 1.4 - i * .15)); if (ki <= 0) return;
    const g = (1 - ki) * 10, x = M.X(b.x) - g, y = M.Y(b.y) - g, w = M.X(b.x + b.w) - M.X(b.x) + 2 * g, h = M.Y(b.y + b.h) - M.Y(b.y) + 2 * g;
    c.globalAlpha = ki; c.strokeStyle = b.col; c.lineWidth = 2 * e; c.fillStyle = b.col + "18"; rr(c, x, y, w, h, 14 * e); c.fill(); c.stroke(); c.globalAlpha = 1;
    pildora(c, x, y, b.txt, b.col, ki, e);
  });
}
function dibujarRiesgo(c, M, lista, k, t, e) {
  if (k <= .01) return;
  const P = [[.66, .99], [.7, .33], [.78, .25], [.995, .2], [.995, .99]];
  c.globalAlpha = eo(k); c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(M.X(x), M.Y(y)) : c.moveTo(M.X(x), M.Y(y)))); c.closePath();
  c.fillStyle = `rgba(229,72,77,${.1 + .06 * Math.sin(t * 5)})`; c.fill(); c.strokeStyle = "#E5484D"; c.lineWidth = 2 * e; c.setLineDash([8 * e, 6 * e]); c.stroke(); c.setLineDash([]);
  c.globalAlpha = 1; pildora(c, M.X(.69), M.Y(.97), "Zona de riesgo", "#E5484D", eo(k), e);
  const m = lista.find((b) => b.m), p = lista.find((b) => !b.m);
  if (m && p) {
    const ax = M.X(m.x + m.w), ay = M.Y(m.y + m.h * .45), bx = M.X(p.x), by = M.Y(p.y + p.h * .5), kk = eo(clamp(k * 1.5 - .3));
    c.globalAlpha = kk; c.strokeStyle = "#FFAE1A"; c.lineWidth = 2.5 * e; c.setLineDash([6 * e, 6 * e]); c.lineDashOffset = -t * 30;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(lerp(ax, bx, kk), lerp(ay, by, kk)); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    pildora(c, (ax + bx) / 2 - 44 * e, (ay + by) / 2 + 6 * e, "Proximidad", "#FFAE1A", kk, e);
  }
}
function videoConCapa(cont, alCuadro) {
  const video = $("video", cont);
  bucleVisible(cont, () => alCuadro(video.currentTime), 60);
  alVer(cont, () => video.play().catch(() => {}), () => video.pause(), 0);
}

/* puerta de Lumina: siempre detectando */
{ const puerta = $(".pt--lumina .pt__vista"), cv = $("canvas", puerta);
  videoConCapa(puerta, (t) => { const { c, w, h } = lienzo(cv); dibujarCajas(c, mapa(w, h), cajas(t), 1, clamp(w / 700, .75, 1)); }); }

/* Lumina por dentro: cuatro pasos atados al scroll */
const secLum = $("#lum-escena");
const lum = { mon: $("#monitor"), pasos: $$(".lum__paso"), marcas: $$("#lum-marcas i"), aviso: $(".aviso"), registro: $$(".registro div"), tablero: $(".tablero"), num: $("#num-eventos"), conteo: $("#conteo-cam"), paso: -1, k: { c: 1, r: 0 } };
function pintarLumina() {
  if (!secLum.offsetParent) return;
  const p = MOVIL() ? (lum.paso < 0 ? 0 : lum.paso) / 4 + .01 : avance(secLum);
  const paso = Math.min(3, Math.floor(p * 4.05));
  lum.marcas.forEach((m, i) => m.style.setProperty("--k", clamp(p * 4 - i)));
  if (!MOVIL()) { const r = secLum.getBoundingClientRect(); lum.mon.style.setProperty("--esc", lerp(.86, 1, eo(1 - r.top / innerHeight))); }
  if (paso === lum.paso) return;
  lum.paso = paso; lum.mon.dataset.paso = paso;
  lum.pasos.forEach((s, i) => s.classList.toggle("activo", i === paso));
  lum.aviso.classList.toggle("on", paso === 2); lum.registro.forEach((r) => r.classList.toggle("on", paso === 2)); lum.tablero.classList.toggle("on", paso === 3);
  $$(".zona__barra i", lum.tablero).forEach((b) => (b.style.width = paso === 3 ? b.dataset.w : "0"));
  $$(".semana i", lum.tablero).forEach((b) => (b.style.height = paso === 3 ? b.dataset.h : "0"));
  if (paso === 3) { const t0 = performance.now(); const sube = () => { const q = clamp((performance.now() - t0) / 1200); lum.num.firstChild.textContent = Math.round(eo(q) * 10); if (q < 1 && lum.paso === 3) requestAnimationFrame(sube); }; sube(); }
}
videoConCapa(lum.mon, (t) => {
  const { c, w, h } = lienzo($("canvas", lum.mon)), M = mapa(w, h), e = clamp(w / 900, .75, 1.3), ahora = performance.now() / 1000, paso = Math.max(0, lum.paso);
  lum.k.c += ((paso <= 2 ? 1 : 0) - lum.k.c) * .1; lum.k.r += ((paso === 1 || paso === 2 ? 1 : 0) - lum.k.r) * .07;
  const lista = cajas(t);
  dibujarRiesgo(c, M, lista, lum.k.r, ahora, e); dibujarCajas(c, M, lista, lum.k.c, e);
  const np = lista.filter((b) => !b.m).length; lum.conteo.innerHTML = `<b>${np}</b> ${np === 1 ? "PERSONA" : "PERSONAS"} · <b>${lista.some((b) => b.m) ? 1 : 0}</b> MONTACARGAS`;
});
if (MOVIL()) setInterval(() => { if (secLum.offsetParent) { lum.paso = (Math.max(0, lum.paso) + 1) % 4; const p = lum.paso; lum.paso = -1; const fake = p; lum.pasos.forEach((s, i) => s.classList.toggle("activo", i === fake)); lum.paso = fake; lum.mon.dataset.paso = fake; lum.aviso.classList.toggle("on", fake === 2); lum.tablero.classList.toggle("on", fake === 3); $$(".zona__barra i", lum.tablero).forEach((b) => (b.style.width = fake === 3 ? b.dataset.w : "0")); $$(".semana i", lum.tablero).forEach((b) => (b.style.height = fake === 3 ? b.dataset.h : "0")); lum.marcas.forEach((m, i) => m.style.setProperty("--k", i <= fake ? 1 : 0)); if (fake === 3) lum.num.firstChild.textContent = "10"; } }, 4500);

/* héroe de Lumina: el video de fondo, detectando, detrás del vidrio */
{ const f = $("#lum7"), cv = $("canvas", f);
  videoConCapa(f, (t) => { const { c, w, h } = lienzo(cv); dibujarCajas(c, mapa(w, h), cajas(t), 1, clamp(w / 900, .8, 1.2)); }); }

/* ── El aura de Médula (portada de su guion: un fluido que se arma con puntos; el grano ES el degradado) ── */
const AURA_V = "attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }";
const RUIDO = `vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}
float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<3;i++){s+=a*snoise(p);p*=2.02;a*=0.5;}return s;}`;
const CAMPO_F = `precision highp float; varying vec2 vUv; uniform float uTiempo, uScroll, uAspecto, uFuerza, uIntensidad; uniform vec2 uPuntero, uCentro; ${RUIDO}
void main(){
  float aspecto = uAspecto; vec2 p = vec2(vUv.x * aspecto, vUv.y); float t = uTiempo * 0.045;
  vec2 dp = p - vec2(uPuntero.x * aspecto, uPuntero.y); float cerca = exp(-dot(dp, dp) * 7.0) * uFuerza; p += normalize(dp + 1e-4) * cerca * 0.06;
  vec2 q = vec2(fbm(p * 0.55 + vec2(0.0, t)), fbm(p * 0.55 + vec2(5.2, -t * 0.8)));
  vec2 r = vec2(fbm(p * 0.5 + 1.1 * q + vec2(1.7 - t * 0.6, 9.2 + uScroll * 0.3)), fbm(p * 0.5 + 1.1 * q + vec2(8.3, 2.8 + t * 0.5)));
  float campo = fbm(p * 0.42 + 0.9 * r);
  vec2 centro = vec2(uCentro.x * aspecto + 0.14 * sin(uScroll * 1.3 + t * 1.2), uCentro.y - 0.2 * sin(uScroll * 0.9));
  float masa = 1.0 - smoothstep(0.0, 1.15, length((vec2(vUv.x * aspecto, vUv.y) - centro) * vec2(0.8, 1.05)));
  float d = clamp((masa * 1.3 + campo * 0.32 - 0.1) * uIntensidad, 0.0, 1.0);
  vec2 flujo = 1.1 * q + 0.9 * r + vec2(t * 1.5, uScroll * 0.6);
  gl_FragColor = vec4(d, flujo, 1.0);
}`;
const PUNTOS_F = `precision highp float; varying vec2 vUv; uniform sampler2D uCampo; uniform float uPuntillismo, uTamPunto, uArrastre, uPixel;
uniform vec3 uNucleo, uMedula, uImpulso, uAire, uBruma, uHielo;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 degradado(float d){ vec3 col = uHielo; col = mix(col, uBruma, smoothstep(0.02, 0.32, d)); col = mix(col, uAire, smoothstep(0.22, 0.52, d)); col = mix(col, uImpulso, smoothstep(0.42, 0.7, d)); col = mix(col, uMedula, smoothstep(0.6, 0.84, d)); col = mix(col, uNucleo, smoothstep(0.76, 1.0, d)); return col; }
void main(){
  vec4 c = texture2D(uCampo, vUv); float d = c.r; vec2 flujo = c.gb;
  float celda = max(1.0, uTamPunto * uPixel); vec2 coord = gl_FragCoord.xy / celda + flujo * uArrastre;
  float umbral = hash(floor(coord)) - 0.5; float amplitud = uPuntillismo * (0.1 + 0.16 * smoothstep(0.0, 0.25, d));
  gl_FragColor = vec4(degradado(clamp(d + umbral * amplitud, 0.0, 1.0)), 1.0);
}`;
const AZULES = { uNucleo: "#013ecc", uMedula: "#0853e0", uImpulso: "#1b75fd", uAire: "#63a7fc", uBruma: "#c6dffd", uHielo: "#f2f7fe" };
const hexA = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
function aura(cv, op) {
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  // respaldo: el degradado azul de Médula, para que el logo blanco nunca quede sobre blanco
  cv.parentElement.style.background = "radial-gradient(70% 80% at 50% 45%, #0853e0, #1b75fd 40%, #63a7fc 70%, #c6dffd)";
  if (!gl) return;
  const flotante = !!(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float"));
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const prog = (f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, AURA_V)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); return p; };
  const pc = prog(CAMPO_F), pp = prog(PUNTOS_F);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(), fbo = gl.createFramebuffer();
  let w = 1, h = 1, cw = 1, ch = 1, dpr = 1, roto = false;
  const ajustar = () => {
    dpr = Math.min(2, devicePixelRatio || 1); w = Math.max(2, Math.round(cv.clientWidth * dpr)); h = Math.max(2, Math.round(cv.clientHeight * dpr)); cv.width = w; cv.height = h;
    cw = Math.max(2, w >> 1); ch = Math.max(2, h >> 1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (flotante) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cw, ch, 0, gl.RGBA, gl.HALF_FLOAT, null); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cw, ch, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    roto = gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE; gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  ajustar(); addEventListener("resize", ajustar); addEventListener("ruta", ajustar);
  const ptr = { x: .5, y: .5, px: .5, py: .5, vel: 0 };
  cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width; ptr.y = 1 - (e.clientY - r.top) / r.height; });
  gl.useProgram(pp); Object.entries(AZULES).forEach(([k, v]) => gl.uniform3fv(gl.getUniformLocation(pp, k), hexA(v)));
  gl.uniform1f(gl.getUniformLocation(pp, "uPuntillismo"), .7); gl.uniform1f(gl.getUniformLocation(pp, "uTamPunto"), 1.6); gl.uniform1f(gl.getUniformLocation(pp, "uArrastre"), 18);
  const U = (p, n) => gl.getUniformLocation(p, n);
  let tiempo = 12, scroll = 0, ultimo = performance.now();
  cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); roto = true; cv.style.opacity = 0; });
  bucleVisible(cv, () => {
    if (roto) { cv.style.opacity = 0; return; } // queda el degradado de respaldo del contenedor
    const ahora = performance.now(), dt = Math.min(.1, (ahora - ultimo) / 1000); ultimo = ahora;
    tiempo += dt * .35;
    const suav = 1 - Math.pow(1 - .027, dt * 60), dx = ptr.x - ptr.px, dy = ptr.y - ptr.py; ptr.px += dx * suav; ptr.py += dy * suav;
    ptr.vel = Math.min(1, ptr.vel * Math.pow(.97, dt * 60) + Math.hypot(dx, dy) * .17);
    scroll += (scrollY / innerHeight - scroll) * (1 - Math.pow(.96, dt * 60));
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, cw, ch); gl.useProgram(pc);
    gl.uniform1f(U(pc, "uTiempo"), tiempo); gl.uniform1f(U(pc, "uScroll"), scroll * (op.scroll ?? 1)); gl.uniform1f(U(pc, "uAspecto"), w / h);
    gl.uniform2f(U(pc, "uPuntero"), ptr.px, ptr.py); gl.uniform1f(U(pc, "uFuerza"), ptr.vel); gl.uniform2f(U(pc, "uCentro"), op.centro[0], op.centro[1]); gl.uniform1f(U(pc, "uIntensidad"), op.intensidad || 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.useProgram(pp);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U(pp, "uCampo"), 0); gl.uniform1f(U(pp, "uPixel"), dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, 30);
}
const AURAS = { puerta: { centro: [.5, .82], intensidad: 1.1, scroll: .4 }, escenario: { centro: [.4, .5], intensidad: 1.25 }, demo: { centro: [.28, .52], intensidad: 1.5 } };
$$("canvas[data-aura]").forEach((cv) => aura(cv, AURAS[cv.dataset.aura]));

/* Médula Lite: la píldora que cuenta lo que está haciendo */
const LITE = ["Leyendo Bsale…", "Cruzando con Gmail…", "Actualizando Zoho CRM…", "Listo · 3 cotizaciones abiertas"];
$$("[data-lite]").forEach((el, j) => {
  const txt = $(".lite__txt", el); let i = j;
  setInterval(() => { i = (i + 1) % LITE.length; txt.style.opacity = 0; setTimeout(() => { txt.textContent = LITE[i]; txt.style.opacity = 1; }, 280); }, 2200);
});

/* Integraciones: dos cintas que corren en sentidos opuestos */
{
  const A = [["zoho.svg", "Zoho", "ERP y CRM"], ["defontana.svg", "Defontana", "ERP"], ["bsale.png", "Bsale", "Boletas y ventas"], ["softland.png", "Softland", "ERP"], ["shopify.svg", "Shopify", "Ecommerce"], ["mercadolibre.svg", "Mercado Libre", "Marketplace"], ["googlecalendar.svg", "Calendario", "Agenda"]];
  const B = [["gmail.svg", "Gmail", "Correo"], ["whatsapp.svg", "WhatsApp", "Mensajería"], ["microsoftexcel.svg", "Excel", "Planillas"], ["googlesheets.svg", "Sheets", "Planillas"], ["microsoftoutlook.svg", "Outlook", "Correo"], ["microsoftteams.svg", "Teams", "Reuniones"], ["notion.svg", "Notion", "Documentos"], ["slack.svg", "Slack", "Equipo"]];
  const placa = ([img, n, t]) => `<div class="placa"><img src="recursos/logos/${img}" alt=""><div><b>${n}</b><small>${t}</small></div></div>`;
  $("#fila-a").innerHTML = [...A, ...A].map(placa).join(""); $("#fila-b").innerHTML = [...B, ...B].map(placa).join("");
}

/* Conversación de Médula */
{
  const chat = $("#chat"), partes = $$(".msj", chat); let hablando = false;
  async function conversar() {
    if (hablando) return; hablando = true;
    while (hablando) {
      partes.forEach((p) => p.classList.remove("on")); await esperar(600);
      for (const [i, p] of partes.entries()) { p.classList.add("on"); await esperar([1200, 1800, 2600, 3800][i]); }
    }
  }
  if (QUIETO) partes.forEach((p) => p.classList.add("on")); else alVer(chat, conversar, () => (hablando = false), .3);
}

/* ── El camino se divide ── */
const rutas = $("#rutas");
function abrir(ruta, ir = true) {
  rutas.classList.add("con-ruta");
  $$(".ruta", rutas).forEach((r) => r.classList.toggle("abierta", r.dataset.ruta === ruta));
  $$(".pt").forEach((p) => p.classList.toggle("elegida", p.dataset.ruta === ruta));
  $$(".cambiar button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.ruta === ruta));
  lum.paso = -1;
  dispatchEvent(new Event("ruta")); dispatchEvent(new Event("resize"));
  if (ir) requestAnimationFrame(() => $(`#ruta-${ruta}`).scrollIntoView({ behavior: QUIETO ? "auto" : "smooth" }));
}
$$("[data-ruta]").forEach((b) => b.tagName === "BUTTON" && b.addEventListener("click", () => abrir(b.dataset.ruta)));
$$("[data-ir]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); abrir(a.dataset.ir); }));

/* ── Texto que se escribe y se borra, como un teclado ── */
function maquina(el, { una = false, lento = false, ms = 0 } = {}) {
  const palabras = el.dataset.palabras.split("|");
  let i = el.textContent ? 1 : 0, vivo = false, turno = 0;
  const tipear = ms || (lento ? 28 : 62), borrar = 30;
  async function correr() {
    const mio = ++turno, sigue = () => vivo && mio === turno;
    if (el.textContent) { await esperar(2200); }
    while (sigue()) {
      el.classList.add("escribiendo");
      let letras = Array.from(el.textContent);
      while (letras.length && sigue()) { letras.pop(); el.textContent = letras.join(""); await esperar(borrar); }
      const w = Array.from(palabras[i % palabras.length]);
      for (let k = 1; k <= w.length && sigue(); k++) { el.textContent = w.slice(0, k).join(""); await esperar(tipear + Math.random() * (ms ? ms * .6 : lento ? 18 : 45)); }
      el.classList.remove("escribiendo");
      if (una || !sigue()) { vivo = false; return; }
      i++; await esperar(2400);
    }
  }
  return {
    iniciar() { if (vivo) return; if (QUIETO) { el.textContent = palabras[0]; return; } vivo = true; return correr(); },
    reiniciar() { el.textContent = ""; i = 0; if (QUIETO) { el.textContent = palabras[0]; return; } vivo = true; return correr(); },
    parar() { vivo = false; turno++; el.classList.remove("escribiendo"); },
  };
}

/* Héroe: el motion graphic del banner, dibujado en vivo */
{
  const cv = $("#banner"), t0 = performance.now();
  bucleVisible(cv, () => {
    const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    banner(c, w, h, QUIETO ? 13 : (performance.now() - t0) / 1000);
  }, 60);
}

/* Héroe: la palabra se escribe, espera, se borra y llega la siguiente */
{ const m = maquina($("#tipeo")); m.iniciar(); }

/* ── Navegación ── */
const nav = $("#nav");
function pintarNav() { nav.classList.toggle("bajo", scrollY > 8); }

/* ── El desafío: el dolor que cruza el centro de la pantalla se enciende y escribe su síntoma ── */
const dolores = $$(".dolor7").map((li) => ({ li, m: maquina($(".tipeo", li), { una: true }), visto: false }));
function pintarDesafio() {
  const y = innerHeight * .55;
  let activo = -1;
  dolores.forEach((d, i) => { if (d.li.getBoundingClientRect().top < y) activo = i; });
  const ultimo = dolores[dolores.length - 1].li.getBoundingClientRect();
  if (ultimo.bottom < innerHeight * .25) activo = -1;
  dolores.forEach((d, i) => {
    const on = i === activo; d.li.classList.toggle("on", on);
    if (on && !d.visto) { d.visto = true; d.li.classList.add("visto"); d.m.iniciar(); }
  });
}

/* ── Scroll suave (solo con mouse o trackpad; en el celular queda el nativo) y bloqueo mientras algo se escribe ── */
const suave = { y: scrollY, meta: scrollY, activo: false, bloqueado: false };
{
  const fino = !QUIETO && matchMedia("(pointer: fine)").matches;
  const paso = () => {
    suave.y += (suave.meta - suave.y) * .12;
    if (Math.abs(suave.meta - suave.y) < .5) { suave.y = suave.meta; suave.activo = false; suave.viaje = false; }
    scrollTo(0, suave.y);
    if (suave.activo) requestAnimationFrame(paso);
  };
  addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;
    if (suave.bloqueado) { e.preventDefault(); return; }
    if (!fino || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); suave.viaje = false;
    if (!suave.activo) suave.y = suave.meta = scrollY;
    const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1);
    suave.meta = clamp(suave.meta + d, 0, document.documentElement.scrollHeight - innerHeight);
    if (!suave.activo) { suave.activo = true; requestAnimationFrame(paso); }
  }, { passive: false });
  addEventListener("touchmove", (e) => suave.bloqueado && e.preventDefault(), { passive: false });
  addEventListener("keydown", (e) => { if (suave.bloqueado && [" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "End", "Home"].includes(e.key)) e.preventDefault(); });
  addEventListener("scroll", () => { if (!suave.activo) suave.y = suave.meta = scrollY; }, { passive: true });
  // los enlaces internos viajan suave y no se detienen en la frase
  $$('a[href^="#"]:not([data-ir])').forEach((a) => a.addEventListener("click", (e) => {
    const t = a.getAttribute("href") === "#inicio" ? document.body : $(a.getAttribute("href")); if (!t || QUIETO) return;
    e.preventDefault(); suave.viaje = true; suave.y = scrollY;
    suave.meta = clamp(t.getBoundingClientRect().top + scrollY - (t === document.body ? 0 : 64), 0, document.documentElement.scrollHeight - innerHeight);
    if (!suave.activo) { suave.activo = true; requestAnimationFrame(paso); }
  }));
}
function irA(y) { suave.activo = false; suave.y = suave.meta = y; scrollTo(0, y); }

/* ── La frase: al llegar, la página se detiene hasta que termina de escribirse ── */
let pintarFrase = () => {};
{
  const sec = $("#frase"), ls = $$(".fr7__l", sec), op = $("#fr7-op"), ms = ls.map((l) => maquina($(".tipeo", l), { una: true, ms: 6 }));
  let estado = 0; // 0 esperando · 1 escribiendo · 2 listo
  async function escribir() {
    estado = 1; suave.bloqueado = true;
    const r = sec.getBoundingClientRect(); irA(Math.round(scrollY + r.top + r.height / 2 - innerHeight / 2));
    const suelta = setTimeout(() => (suave.bloqueado = false), 5000);
    for (const [i, l] of ls.entries()) { l.classList.add("on"); await ms[i].iniciar(); await esperar(150); if (i < ls.length - 1) l.classList.remove("on"); }
    op.classList.add("on"); await esperar(250);
    clearTimeout(suelta); suave.bloqueado = false; estado = 2;
  }
  pintarFrase = () => {
    if (estado || suave.viaje) return;
    const r = sec.getBoundingClientRect(), centro = r.top + r.height / 2;
    if (QUIETO) { if (r.top < innerHeight) { estado = 2; ms.forEach((m) => m.iniciar()); op.classList.add("on"); } return; }
    if (centro <= innerHeight * .55 && r.bottom > innerHeight * .3) escribir();
  };
}

/* ── Propuesta: las áreas entran una a una ── */
{
  const ob = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); ob.unobserve(e.target); } }), { threshold: .2, rootMargin: "0px 0px -8% 0px" });
  $$(".area7").forEach((a) => ob.observe(a));
}

/* ── Superpoderes: tarjetas que entran una a una y se apilan; cada una con su motion graphic y su color ── */
let pintarPoderes = () => {};
{
  const sec = $("#sp7"), cartas = $$(".sp7c", sec);
  cartas.forEach((carta) => {
    const esc = $(".sp7c__esc", carta), cv = $("canvas", esc), nombre = esc.dataset.mg;
    let t0 = 0, previo = 0;
    bucleVisible(esc, () => {
      const ahora = performance.now() / 1000;
      if (!t0 || ahora - previo > .5) t0 = ahora; // vuelve a empezar cuando reaparece
      previo = ahora;
      mgCuadro(cv, nombre, QUIETO ? 7 : ahora - t0);
    }, 60);
  });
  pintarPoderes = () => {
    cartas.forEach((c, i) => {
      const r = c.getBoundingClientRect(), sig = cartas[i + 1];
      const k = sig ? clamp(1 - (sig.getBoundingClientRect().top - r.top) / r.height) : 0;
      c.style.setProperty("--esc", 1 - .06 * k); c.style.setProperty("--luz", 1 - .6 * k);
    });
  };
}

/* ── Cómo trabajamos: la etapa activa se levanta y avanza sola; un clic elige ── */
{
  const sec = $("#mt7"), pasos = $$(".paso7", sec), DUR = 5000;
  let actual = 0, t0 = performance.now(), pausa = false, previo = performance.now();
  const ir = (i) => { actual = i; t0 = performance.now(); pasos.forEach((p, j) => { p.classList.toggle("activo", j === i); p.style.setProperty("--prog", 0); }); };
  pasos.forEach((p, i) => p.addEventListener("click", () => ir(i)));
  sec.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && (pausa = true));
  sec.addEventListener("pointerleave", () => (pausa = false));
  bucleVisible(sec, () => {
    const ahora = performance.now(), dt = ahora - previo; previo = ahora;
    if (QUIETO) return;
    if (pausa) { t0 += Math.min(dt, 100); return; }
    const k = clamp((ahora - t0) / DUR); pasos[actual].style.setProperty("--prog", k);
    if (k >= 1) ir((actual + 1) % pasos.length);
  }, 30);
}

/* ── Cierre: lo que quizás tienes hoy se escribe y se borra ── */
{
  const m = maquina($(".fin7__linea .tipeo"));
  alVer($("#conversemos"), () => m.iniciar(), () => m.parar(), .2);
}

/* ── Menú del celular y progreso de lectura ── */
{
  const boton = $("#nav-menu"), menu = $("#menu-movil");
  const cerrar = () => { nav.classList.remove("abierto"); boton.setAttribute("aria-expanded", false); boton.setAttribute("aria-label", "Abrir el menú"); };
  boton.addEventListener("click", () => { const ab = nav.classList.toggle("abierto"); boton.setAttribute("aria-expanded", ab); boton.setAttribute("aria-label", ab ? "Cerrar el menú" : "Abrir el menú"); });
  $$("a", menu).forEach((a) => a.addEventListener("click", cerrar));
  addEventListener("keydown", (e) => e.key === "Escape" && cerrar());
}
const progreso = $("#progreso");
function pintarProgreso() { progreso.style.setProperty("--p", clamp(scrollY / (document.documentElement.scrollHeight - innerHeight))); }

/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarProgreso(); pintarDesafio(); pintarFrase(); pintarPoderes(); pintarLumina(); }); }
addEventListener("scroll", alScroll, { passive: true }); addEventListener("resize", alScroll); addEventListener("ruta", alScroll);
alScroll();
