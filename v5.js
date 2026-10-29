// Optimizo · sitio v5. Sin dependencias. La firma es el punto del isotipo: se escapa en el héroe, tacha los dolores y pone a la empresa en órbita.
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

/* ── Navegación: oscura sobre la noche, clara sobre el día ── */
const nav = $("#nav");
function pintarNav() {
  const y = nav.getBoundingClientRect().bottom + 2;
  const sobre = $$(".oscuro, .lumina.abierta").some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
  nav.classList.toggle("clara", !sobre);
}

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
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) { cv.style.background = "radial-gradient(60% 80% at 30% 50%, #0853e0, #63a7fc 45%, #c6dffd 70%, #f2f7fe)"; return; }
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const prog = (f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, AURA_V)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); return p; };
  const pc = prog(CAMPO_F), pp = prog(PUNTOS_F);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(), fbo = gl.createFramebuffer();
  let w = 1, h = 1, cw = 1, ch = 1, dpr = 1;
  const ajustar = () => {
    dpr = Math.min(2, devicePixelRatio || 1); w = Math.max(2, Math.round(cv.clientWidth * dpr)); h = Math.max(2, Math.round(cv.clientHeight * dpr)); cv.width = w; cv.height = h;
    cw = Math.max(2, w >> 1); ch = Math.max(2, h >> 1);
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cw, ch, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  ajustar(); addEventListener("resize", ajustar); addEventListener("ruta", ajustar);
  const ptr = { x: .5, y: .5, px: .5, py: .5, vel: 0 };
  cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width; ptr.y = 1 - (e.clientY - r.top) / r.height; });
  gl.useProgram(pp); Object.entries(AZULES).forEach(([k, v]) => gl.uniform3fv(gl.getUniformLocation(pp, k), hexA(v)));
  gl.uniform1f(gl.getUniformLocation(pp, "uPuntillismo"), .7); gl.uniform1f(gl.getUniformLocation(pp, "uTamPunto"), 1.6); gl.uniform1f(gl.getUniformLocation(pp, "uArrastre"), 18);
  const U = (p, n) => gl.getUniformLocation(p, n);
  let tiempo = 12, scroll = 0, ultimo = performance.now();
  bucleVisible(cv, () => {
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

/* ── Cómo trabajamos: cada paso muestra su entregable ── */
const secMt = $("#metodo"), mtPasos = $$("#mt-pasos li"), mtVistas = $$(".mtv");
function pintarMt() {
  if (MOVIL()) return;
  const k = Math.min(3, Math.floor(avance(secMt) * 4.1));
  mtPasos.forEach((li, i) => li.classList.toggle("activo", i === k)); mtVistas.forEach((v, i) => v.classList.toggle("activo", i === k));
}

/* ── El isotipo como objeto: disco con agujero y mordida, y su punto que se escapa en órbita ── */
const ISO_V = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }";
const ISO_F = `precision highp float;
uniform vec2 uRes, uCentro; uniform mat3 uRot; uniform vec3 uPunto; uniform float uEscala;
const vec2 MORDIDA = vec2(-.7135, .7086);
float plano(vec2 p){ float r = length(p); return max(max(r - 1., .25 - r), .5 - length(p - MORDIDA)); }
float disco(vec3 p){ const float h = .16, b = .075; vec2 w = vec2(plano(p.xy) + b, abs(p.z) - h + b); return min(max(w.x, w.y), 0.) + length(max(w, 0.)) - b; }
vec2 mapa(vec3 p){ float a = disco(p), b = length(p - uPunto) - .25; return a < b ? vec2(a, 0.) : vec2(b, 1.); }
vec3 normal(vec3 p){ const vec2 e = vec2(.001, -.001); return normalize(e.xyy * mapa(p + e.xyy).x + e.yyx * mapa(p + e.yyx).x + e.yxy * mapa(p + e.yxy).x + e.xxx * mapa(p + e.xxx).x); }
float oclusion(vec3 p, vec3 n){ float o = 0., s = 1.; for (int i = 1; i <= 4; i++){ float h = .06 * float(i); o += (h - mapa(p + n * h).x) * s; s *= .6; } return clamp(1. - 2. * o, 0., 1.); }
void main(){
  vec2 uv = (gl_FragCoord.xy - uCentro * uRes) / (uRes.y * uEscala);
  vec3 ro = uRot * vec3(0., 0., 4.6), rd = uRot * normalize(vec3(uv, -2.4));
  float b = dot(ro, rd), c = dot(ro, ro) - 4.4, d = b * b - c;
  if (d < 0.) { gl_FragColor = vec4(0.); return; }
  float t = max(0., -b - sqrt(d)), tf = -b + sqrt(d); vec2 h = vec2(1., 0.);
  for (int i = 0; i < 96; i++){ h = mapa(ro + rd * t); if (h.x < .0007 || t > tf) break; t += h.x * .92; }
  if (t > tf || h.x > .004) { gl_FragColor = vec4(0.); return; }
  vec3 p = ro + rd * t, n = normal(p);
  vec3 c1 = vec3(.569, .808, .769), c2 = vec3(.22, .494, .502);
  vec3 base = h.y < .5 ? mix(c1, c2, smoothstep(-1.05, 1.05, p.x)) : mix(c1, c2, .12);
  vec3 L = normalize(uRot * vec3(-.55, .75, .85)), L2 = normalize(uRot * vec3(.8, -.45, .4)), U = uRot * vec3(0., 1., 0.);
  float dif = max(dot(n, L), 0.), dif2 = max(dot(n, L2), 0.), amb = .55 + .45 * dot(n, U), ao = oclusion(p, n);
  float fr = pow(1. - max(dot(n, -rd), 0.), 3.), es = pow(max(dot(reflect(rd, n), L), 0.), 30.);
  vec3 col = base * (.2 + .42 * amb * ao + .72 * dif) + vec3(.35, .75, .72) * dif2 * .16 + vec3(.78, 1., .96) * fr * .3 * ao + es * .2;
  gl_FragColor = vec4(col, 1.);
}`;
const MORD = [-.7135, .7086], R_MORD = Math.hypot(...MORD), A_MORD = Math.atan2(MORD[1], MORD[0]);
const ss = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
/* dónde está el punto: quieto en su mordida, y cada tanto da una vuelta en órbita */
function puntoEn(t, ciclo = 11, quieto = .36) {
  const u0 = (t % ciclo) / ciclo; if (u0 < quieto) return [MORD[0], MORD[1], 0];
  const u = (u0 - quieto) / (1 - quieto), env = ss(0, .24, u) * ss(1, .76, u), a = A_MORD + Math.PI * 2 * eio(u);
  const r = lerp(R_MORD, 1.74, env), inc = env * 1.05, x = r * Math.cos(a), y = r * Math.sin(a);
  return [x, y * Math.cos(inc), y * Math.sin(inc) + env * .12];
}
/* rotación del objeto (guiñada y cabeceo) → matriz mundo→objeto, por columnas para WebGL */
function rotacion(gu, ca) {
  const cy = Math.cos(gu), sy = Math.sin(gu), cx = Math.cos(ca), sx = Math.sin(ca);
  const R = [[cy, sy * sx, sy * cx], [0, cx, -sx], [-sy, cy * sx, cy * cx]]; // R = Ry·Rx (filas)
  return new Float32Array([R[0][0], R[0][1], R[0][2], R[1][0], R[1][1], R[1][2], R[2][0], R[2][1], R[2][2]]); // Rᵀ por columnas
}
function isotipo(cv, op) {
  const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: true });
  if (!gl) { cv.outerHTML = `<img class="${cv.className}" src="recursos/optimizo-isotipo.svg" alt="" style="object-fit:contain;padding:12%">`; return () => {}; }
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, ISO_V)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, ISO_F)); gl.bindAttribLocation(pr, 0, "p"); gl.linkProgram(pr); gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ["uRes", "uCentro", "uRot", "uPunto", "uEscala"].forEach((n) => (U[n] = gl.getUniformLocation(pr, n)));
  const ajustar = () => { const dpr = Math.min(1.6, devicePixelRatio || 1); cv.width = Math.max(2, Math.round(cv.clientWidth * dpr)); cv.height = Math.max(2, Math.round(cv.clientHeight * dpr)); gl.viewport(0, 0, cv.width, cv.height); };
  ajustar(); addEventListener("resize", ajustar);
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener("pointermove", (e) => { ptr.x = e.clientX / innerWidth - .5; ptr.y = e.clientY / innerHeight - .5; }, { passive: true });
  return (t) => {
    ptr.sx += (ptr.x - ptr.sx) * .05; ptr.sy += (ptr.y - ptr.sy) * .05;
    const q = op.scroll ? op.scroll() : 0, mov = MOVIL();
    const gu = op.guinada + .16 * Math.sin(t * .31) + ptr.sx * .5 + q * 1.3, ca = op.cabeceo + .08 * Math.sin(t * .23) + ptr.sy * .3 + q * .25;
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform2f(U.uCentro, ...(mov ? op.centroMovil : op.centro));
    gl.uniform1f(U.uEscala, mov ? op.escalaMovil : op.escala); gl.uniformMatrix3fv(U.uRot, false, rotacion(gu, ca));
    gl.uniform3fv(U.uPunto, QUIETO ? [MORD[0], MORD[1], 0] : puntoEn(t + (op.desfase || 0)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
{
  const cv2 = $("#iso-cierre");
  bucleVisible(cv2, isotipo(cv2, { guinada: .55, cabeceo: .18, centro: [.76, .5], escala: .36, centroMovil: [.5, .52], escalaMovil: .36, desfase: 7 }), 60);
}

/* ── Héroe: la palabra del bloque va cambiando ── */
{
  const rota = $("#rota"), txt = $("span", rota), PAL = ["tu operación", "tus ventas", "tu planta", "tu gerencia", "tus finanzas", "tu empresa"];
  let i = 0;
  if (!QUIETO) setInterval(() => { rota.classList.add("sale"); setTimeout(() => { i = (i + 1) % PAL.length; txt.textContent = PAL[i]; rota.classList.remove("sale"); }, 450); }, 2600);
}

/* ── Desafío: el escritorio de un día cualquiera. Cada dolor enfoca su ventana; al final todo se ordena y se conecta ── */
const d6 = { sec: $("#desafio"), t: $(".d6__t"), esc: $("#d6"), dol: $$(".d6__dolor"), vent: $$(".vent6"), marcas: $$(".d6__marcas i"), mk: $$(".marca6"), med: null };
d6.vent.forEach((v) => (v.dolores = new Set($$(".marca6", v).map((m) => +m.dataset.d))));
{ // la frase del remate, palabra por palabra
  const r = $("#d6-frase");
  r.innerHTML = [...r.childNodes].map((n) => n.textContent.split(/\s+/).filter(Boolean).map((w) => `<span class="pa${n.nodeType === 1 ? " acento" : ""}">${w}</span>`).join(" ")).join(" ");
  d6.pa = $$(".pa", r);
}
function medirDesafio() {
  d6.t.style.transform = "none";
  d6.med = { L: d6.t.offsetLeft, T: d6.t.offsetTop, W: d6.t.offsetWidth, H: d6.t.offsetHeight };
  d6.esc.style.setProperty("--alto-t", d6.med.H + "px");
}
addEventListener("resize", () => (d6.med = null));
function pintarDesafio() {
  if (MOVIL()) { if (d6.t.style.transform) { d6.t.style.transform = ""; d6.t.style.opacity = ""; } return; }
  if (!d6.med) medirDesafio();
  const p = avance(d6.sec), m = d6.med;
  // el título entra gigante al centro y se aparta arriba a la izquierda
  const kt = eio((p - .01) / .09), s0 = Math.min(2.3, innerWidth * .84 / m.W);
  const x0 = innerWidth / 2 - s0 * m.W / 2 - m.L, y0 = innerHeight / 2 - s0 * m.H / 2 - m.T;
  const kr = clamp((p - .74) / .2), orden = kr > 0;
  d6.t.style.transform = `translate(${lerp(x0, 0, kt)}px, ${lerp(y0, 0, kt)}px) scale(${lerp(s0, 1, kt)})`;
  d6.t.style.opacity = 1 - eo(kr / .25);
  // las ventanas llegan al escritorio, y cada dolor enfoca la suya
  const q = clamp((p - .13) / .6, 0, .9999), i = Math.floor(q * 5), activo = p > .13 && !orden;
  d6.vent.forEach((v, j) => {
    v.style.setProperty("--ve", eo((p - .06 - j * .012) / .05));
    const foco = activo && v.dolores.has(i);
    v.classList.toggle("foco", foco); v.classList.toggle("tenue", activo && !foco);
  });
  d6.mk.forEach((k) => k.classList.toggle("on", activo && +k.dataset.d === i));
  d6.dol.forEach((d, j) => d.classList.toggle("on", activo && j === i));
  d6.marcas.forEach((k, j) => k.classList.toggle("on", p > .13 && j <= i));
  $(".d6__marcas").style.opacity = 1 - eo(kr / .25);
  // el remate: todo se ordena, se conecta al punto y la frase se enciende
  d6.esc.classList.toggle("orden", orden);
  d6.esc.style.setProperty("--k", eio(kr / .55)); d6.esc.style.setProperty("--kl", eo((kr - .45) / .35)); d6.esc.style.setProperty("--kr", eo((kr - .05) / .3));
  const n = Math.ceil(clamp((kr - .12) / .5) * d6.pa.length); d6.pa.forEach((w, j) => w.classList.toggle("on", j < n));
}
alVer(d6.sec, () => { if (MOVIL()) d6.pa.forEach((w) => w.classList.add("on")); }, null, 0);

/* ── Propuesta de valor: un dial plano. Las áreas giran alrededor de Optimizo y la activa llega al frente ── */
const ICONO = {
  operaciones: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
  logistica: '<path d="M3 6.5h11v9.5H3zM14 10h4l3 3.2V16h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  ventas: '<path d="M4 17l5.5-5.5 4 4L20 9"/><path d="M15 9h5v5"/>',
  finanzas: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  riesgos: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.4"/>',
  gerencia: '<rect x="3.5" y="4" width="17" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4M7 12.5l3-3 2 2 4-4"/>',
};
const AREAS = [ // textos de «Dónde se aplica» (narrativa del sitio)
  ["operaciones", "Operaciones", "Procesos que se coordinan solos y alertas cuando algo se desvía.", [["Médula", "medula"], ["Automatización"]]],
  ["logistica", "Logística", "Tráfico de montacargas, zonas de riesgo, conteos y tiempos de espera.", [["Lumina", "lumina"]]],
  ["ventas", "Ventas", "Cotizaciones, seguimiento de clientes y CRM al día sin trabajo manual.", [["Médula", "medula"], ["Agentes"]]],
  ["finanzas", "Administración y finanzas", "Facturas, conciliaciones y reportes que se arman solos.", [["Automatización"], ["Médula", "medula"]]],
  ["riesgos", "Prevención de riesgos", "EPP, zonas restringidas y registro de eventos con evidencia.", [["Lumina", "lumina"]]],
  ["gerencia", "Gerencia", "La información de toda la empresa, lista para decidir.", [["Médula", "medula"], ["Lumina", "lumina"]]],
];
const svgIco = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONO[k]}</svg>`;
{
  const dial = $("#dial"), caja = $("#dial-areas"), panel = $("#prop-panel"), ticks = $("#dial-ticks"), N = AREAS.length;
  caja.innerHTML = AREAS.map(([k, n], i) => `<button class="dial__a" role="tab" data-i="${i}" aria-label="${n}"><span class="dial__ico">${svgIco(k)}</span><span class="dial__nom">${n}</span></button>`).join("");
  ticks.innerHTML = Array.from({ length: 72 }, (_, i) => { const a = i * 5 * Math.PI / 180, m = i % 12 === 0, r1 = m ? 80 : 83.5; return `<line class="${m ? "mayor" : ""}" x1="${(r1 * Math.cos(a)).toFixed(2)}" y1="${(r1 * Math.sin(a)).toFixed(2)}" x2="${(88 * Math.cos(a)).toFixed(2)}" y2="${(88 * Math.sin(a)).toFixed(2)}"/>`; }).join("");
  const botones = $$(".dial__a", caja);
  let activa = -1, giro = Math.PI, objetivo = Math.PI, t0 = 0, quieto = false;
  const elegir = (i) => {
    if (i === activa) return; activa = i;
    const [k, n, txt, prods] = AREAS[i];
    panel.innerHTML = `<div class="prop__cab">${svgIco(k)}<h3>${n}</h3></div><p>${txt}</p><div class="prop__chips">${prods.map(([p, r]) => (r ? `<a href="#camino" data-ir="${r}" class="${r === "lumina" ? "c-lum" : "c-med"}">${p}</a>` : `<span>${p}</span>`)).join("")}</div>`;
    $$("[data-ir]", panel).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); abrir(a.dataset.ir); }));
    botones.forEach((b, j) => { b.classList.toggle("activo", j === i); b.setAttribute("aria-selected", j === i); });
    // la activa va a la izquierda del dial (mira hacia el texto); se gira por el camino corto
    let o = Math.PI - i * 2 * Math.PI / N; while (o - giro > Math.PI) o -= 2 * Math.PI; while (giro - o > Math.PI) o += 2 * Math.PI; objetivo = o;
  };
  botones.forEach((b, i) => b.addEventListener("click", () => { elegir(i); t0 = performance.now() / 1000; }));
  dial.addEventListener("pointerenter", () => (quieto = true)); dial.addEventListener("pointerleave", () => (quieto = false));
  elegir(0);
  bucleVisible(dial, (t) => {
    if (!t0) t0 = t;
    if (!QUIETO && !quieto && t - t0 > 3.6) { t0 = t; elegir((activa + 1) % N); }
    giro += (objetivo - giro) * (QUIETO ? 1 : .07);
    const w = dial.clientWidth, R = w * .41;
    botones.forEach((b, i) => { const a = giro + i * 2 * Math.PI / N; b.style.transform = `translate(${w / 2 + R * Math.cos(a)}px, ${w / 2 + R * Math.sin(a)}px) translate(-50%, -29px)`; });
    ticks.setAttribute("transform", `rotate(${giro * 180 / Math.PI})`);
  }, 60);
}

/* ── Superpoderes: el panel abierto muestra el superpoder en acción; avanzan solos y el mouse toma el control ── */
{
  const pp = $("#pp"), paneles = $$(".pp__p", pp), DUR = 7000;
  const tiempo = (p, f, ms) => p.timers.push(setTimeout(f, ms));
  const ESCENAS = {
    tareas(p, on) {
      $$(".tarea2", p).forEach((t, i) => {
        const em = $("em", t); t.classList.remove("on", "hecha"); em.textContent = "En curso";
        if (on) { tiempo(p, () => t.classList.add("on"), 250 + i * 650); tiempo(p, () => { t.classList.add("hecha"); em.textContent = em.dataset.ok; }, 850 + i * 650); }
      });
    },
    camara(p, on) {
      const cont = $(".esc-cam", p), video = $("video", cont), cv = $("canvas", cont), aviso = $(".esc-cam__aviso", cont);
      aviso.classList.remove("on"); cancelAnimationFrame(p.raf);
      if (!on) { video.pause(); return; }
      video.play().catch(() => {}); tiempo(p, () => aviso.classList.add("on"), 1600);
      const cuadro = () => { p.raf = requestAnimationFrame(cuadro); const { c, w, h } = lienzo(cv); dibujarCajas(c, mapa(w, h), cajas(video.currentTime), 1, clamp(w / 700, .75, 1)); };
      cuadro();
    },
    insight(p, on) {
      const caja = $(".esc-insight", p), txt = $(".esc-insight__txt", p), todo = txt.dataset.txt;
      caja.classList.remove("on"); txt.textContent = "";
      if (!on) return;
      if (QUIETO) { txt.textContent = todo; caja.classList.add("on"); return; }
      [...todo].forEach((_, i) => tiempo(p, () => (txt.textContent = todo.slice(0, i + 1)), 400 + i * 26));
      tiempo(p, () => caja.classList.add("on"), 400 + todo.length * 26);
    },
    lotes(p, on) { $$(".esc-lotes div", p).forEach((d, i) => { d.classList.remove("on"); if (on) tiempo(p, () => d.classList.add("on"), 300 + i * 500); }); },
    barras() {}, pulso() {},
  };
  const activar = (p, on) => {
    (p.timers || []).forEach(clearTimeout); p.timers = [];
    p.classList.toggle("vivo", on); ESCENAS[p.dataset.escena](p, on);
  };
  let actual = 0, t0 = performance.now(), pausa = false, visible = false;
  const abrirP = (i) => {
    actual = i; t0 = performance.now();
    paneles.forEach((p, j) => { const on = i === j; p.classList.toggle("abierto", on); $(".pp__cab", p).setAttribute("aria-expanded", on); p.style.setProperty("--prog", 0); if (!MOVIL()) activar(p, on && visible); });
  };
  paneles.forEach((p, i) => {
    let espera = 0;
    $(".pp__cab", p).addEventListener("click", () => abrirP(i));
    p.addEventListener("pointerenter", (e) => { if (e.pointerType !== "mouse" || MOVIL() || i === actual) return; espera = setTimeout(() => abrirP(i), 140); });
    p.addEventListener("pointerleave", () => clearTimeout(espera));
  });
  $$("[data-ir]", pp).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); abrir(a.dataset.ir); }));
  pp.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pausa = true; });
  pp.addEventListener("pointerleave", () => { pausa = false; t0 = performance.now(); });
  alVer(pp, () => { if (visible) return; visible = true; if (MOVIL()) return; t0 = performance.now(); activar(paneles[actual], true); }, () => { visible = false; paneles.forEach((p) => activar(p, false)); }, .25);
  bucleVisible(pp, () => {
    if (MOVIL() || QUIETO) return;
    const ahora = performance.now(); if (pausa) t0 = ahora - (paneles[actual].prog || 0) * DUR;
    const k = clamp((ahora - t0) / DUR); paneles[actual].prog = k; paneles[actual].style.setProperty("--prog", k);
    if (k >= 1) abrirP((actual + 1) % paneles.length);
  }, 30);
  // celular: tarjetas que se deslizan; la que se ve es la que se mueve
  if (MOVIL()) {
    paneles.forEach((p) => p.classList.add("abierto"));
    const ob = new IntersectionObserver((es) => es.forEach((e) => activar(e.target, e.isIntersecting)), { root: pp, threshold: .6 });
    paneles.forEach((p) => ob.observe(p));
  }
}

/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarDesafio(); pintarLumina(); pintarMt(); }); }
addEventListener("scroll", alScroll, { passive: true }); addEventListener("resize", alScroll); addEventListener("ruta", alScroll);
alScroll();
