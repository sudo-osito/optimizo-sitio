// Médula · el viaje de una pregunta. Una cámara recorre tres escenas (persona → agente → Médula) siguiendo a la pregunta;
// en Médula se abren tus sistemas y cada uno aporta su dato; la respuesta hace el camino de vuelta hasta la persona.
// Datos de la conversación de Médula del sitio (Quillay, $18,4 M, 12 días, Camila).
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const APPS = [
  ["bsale.png", "Bsale", "3 cotizaciones · $18,4 M"],
  ["gmail.svg", "Gmail", "Sin respuesta hace 12 días"],
  ["zoho.svg", "Zoho CRM", "Contacto: Camila"],
  ["microsoftexcel.svg", "Excel", ""],
  ["whatsapp.svg", "WhatsApp", ""],
];
// el ecosistema: las tres que responden a la pregunta van primero, luego el resto de los sistemas de la empresa
const CLAVE = [["bsale.png", "Bsale", "3 cotizaciones · $18,4 M"], ["gmail.svg", "Gmail", "Sin respuesta hace 12 días"], ["zoho.svg", "Zoho CRM", "Contacto: Camila"]];
const RESTO = ["microsoftexcel.svg", "whatsapp.svg", "googlesheets.svg", "microsoftoutlook.svg", "microsoftteams.svg", "notion.svg", "slack.svg", "shopify.svg", "mercadolibre.svg", "defontana.svg", "softland.png", "googlecalendar.svg"];
const PASOS = ["Preguntas", "Tu agente consulta a Médula", "Médula actúa en tus sistemas", "Te responde"];
const PREGUNTA = "¿Qué cotizaciones de Quillay siguen abiertas?";
const RESPUESTA = "Tres, por $18,4 M. La más antigua lleva 12 días sin respuesta. ¿Le escribo a Camila para hacer seguimiento?";

export function montarFlujo(caja, { alVer, QUIETO }) {
  const ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / APPS.length;
  caja.innerHTML = `<div class="vj">
    <div class="vj__pista">
      <i class="vj__via"></i>
      <section class="vj__esc vj__esc--persona">
        <div class="vj__persona"><span class="vj__av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.9-4 3.9-6 7.5-6s6.6 2 7.5 6"/></svg></span>
          <div class="vj__globos"><p class="vj__bur vj__bur--q"><span class="vj__txt"></span><i class="vj__cur"></i></p>
          <div class="vj__bur vj__bur--r"><p class="vj__txt"></p><div class="vj__citas">${APPS.slice(0, 3).map(([i, n]) => `<span><img src="recursos/logos/${i}" alt="">${n}</span>`).join("")}</div></div></div></div>
      </section>
      <section class="vj__esc vj__esc--agente">
        <div class="vj__agente"><div class="vj__logos"><span><img src="recursos/logos/claude.svg" alt=""></span><span><img src="recursos/logos/openai.svg" alt=""></span></div><b>Tu agente de IA</b><span class="vj__piensa"><i></i><i></i><i></i></span></div>
      </section>
      <section class="vj__esc vj__esc--medula">
        <div class="vj__eco"><canvas></canvas>${CLAVE.map(([img, n, dato]) => `<div class="vj__chip"><span class="vj__chipok"></span><img src="recursos/logos/${img}" alt=""><b>${n}</b><em>${dato}</em></div>`).join("")}</div>
      </section>
    </div>
    <div class="vj__viajero"><span></span></div>
    <ol class="vj__pasos">${PASOS.map((t, i) => `<li><i></i><span>${i + 1}. ${t}</span></li>`).join("")}</ol>
  </div>`;
  const vj = caja.firstElementChild, pista = vj.querySelector(".vj__pista"), viajero = vj.querySelector(".vj__viajero"), vtxt = viajero.querySelector("span");
  const qTxt = vj.querySelector(".vj__bur--q .vj__txt"), rTxt = vj.querySelector(".vj__bur--r .vj__txt"), pasos = [...vj.querySelectorAll(".vj__pasos li")];
  const ag = vj.querySelector(".vj__agente"), eco = ecosistema(vj.querySelector(".vj__eco"), QUIETO);
  const camara = (n) => { pista.style.transform = `translateX(${-n * 100 / 3}%)`; vj.dataset.escena = n; };
  const paso = (i) => pasos.forEach((li, j) => { li.classList.toggle("on", j === i); li.classList.toggle("hecho", j < i); });
  const escribir = async (el, txt, ms, sigue) => { for (let k = 1; k <= txt.length; k++) { if (!sigue()) return; el.textContent = txt.slice(0, k); await esperar(ms); } };
  const viajar = async (destino, texto, tipo) => { vtxt.textContent = texto; viajero.className = `vj__viajero on ${tipo}`; await esperar(200); camara(destino); await esperar(1450); viajero.classList.add("llega"); await esperar(380); viajero.className = "vj__viajero"; };
  let vivo = false, turno = 0;
  async function ciclo(mio) {
    const sigue = () => vivo && mio === turno;
    while (sigue()) {
      vj.className = "vj"; pista.style.transition = "none"; camara(0); pista.offsetWidth; pista.style.transition = "";
      qTxt.textContent = ""; rTxt.textContent = ""; eco.reiniciar(); paso(0);
      await esperar(500); vj.classList.add("pregunta");
      await escribir(qTxt, PREGUNTA, 34, sigue); await esperar(900); if (!sigue()) return;
      paso(1); vj.classList.add("enviada"); await viajar(1, PREGUNTA, "ida"); ag.classList.add("piensa"); await esperar(1300); if (!sigue()) return;
      ag.classList.remove("piensa"); eco.entrar(); await viajar(2, "Consultando a Médula…", "ida"); if (!sigue()) return;
      paso(2); await esperar(700);
      for (let i = 0; i < CLAVE.length; i++) { eco.consultar(i); await esperar(700); }
      await esperar(2200); if (!sigue()) return;
      eco.juntar(); await esperar(1300);
      paso(3); await viajar(1, "Respuesta lista", "vuelta"); await viajar(0, "Respuesta lista", "vuelta"); if (!sigue()) return;
      vj.classList.add("responde");
      await escribir(rTxt, RESPUESTA, 18, sigue); await esperar(4500);
    }
  }
  if (QUIETO) { eco.reiniciar(); camara(0); vj.classList.add("pregunta", "responde"); rTxt.textContent = RESPUESTA; qTxt.textContent = PREGUNTA; paso(3); return; }
  alVer(caja, () => { if (vivo) return; vivo = true; ciclo(++turno); }, () => { vivo = false; turno++; }, .3);
}

/* El ecosistema en 3D: Médula al centro y los sistemas de la empresa flotando a su alrededor, con perspectiva real,
   conexiones y datos que corren. Lienzo 2D con proyección propia (sin librerías). */
function ecosistema(caja, QUIETO) {
  const cv = caja.querySelector("canvas"), c = cv.getContext("2d"), chips = [...caja.querySelectorAll(".vj__chip")];
  const carga = (src) => { const i = new Image(); i.src = src; return i; };
  const medImg = carga("recursos/marca/medula-simbolo-blanco.png");
  const todas = [...CLAVE.map((x) => x[0]), ...RESTO];
  // posiciones en una esfera (Fibonacci); las tres clave quedan al frente
  const N = todas.length, nodos = todas.map((img, i) => {
    let x, y, z;
    if (i < 3) [x, y, z] = [[-1.55, .25, .25], [1.45, -.5, .15], [1.35, .6, .35]][i];   // Bsale a la izquierda, Gmail y Zoho a la derecha
    else { const k = i - 3 + .5, M = N - 3, phi = Math.acos(1 - 2 * k / M), th = Math.PI * (1 + Math.sqrt(5)) * k; x = Math.cos(th) * Math.sin(phi) * 1.75; y = Math.cos(phi) * .95; z = Math.sin(th) * Math.sin(phi) * 1.1 - .25; }
    const r = i < 3 ? 1 : 1 + (i % 3) * .08; return { img: carga(`recursos/logos/${img}`), p: [x * r, y * r, z * r], on: 0, ok: 0 };
  });
  const enlaces = []; for (let i = 3; i < N; i++) { const j = 3 + ((i - 3 + 4) % (N - 3)); enlaces.push([i, j]); } enlaces.push([0, 4], [1, 6], [2, 9]);
  // polvo de datos: puntos chicos en el espacio
  const polvo = Array.from({ length: 90 }, (_, i) => { const u = Math.sin(i * 91.7) * .5 + .5, v = Math.sin(i * 37.3) * .5 + .5, rr = .5 + (Math.sin(i * 13.1) * .5 + .5) * 1.1; const ph = Math.acos(2 * v - 1), th = u * Math.PI * 2; return [Math.cos(th) * Math.sin(ph) * rr, Math.cos(ph) * rr * .8, Math.sin(th) * Math.sin(ph) * rr]; });
  const pulsos = [];
  let yaw = -.25, cam = 3.4, camObj = 3.4, juntar = 0, juntarObj = 0, t0 = performance.now(), ultimo = t0, vivo = false, raf = 0, ambiente = 0;
  const proyectar = ([x, y, z], w, h, k = 1) => {
    x *= k; y *= k; z *= k;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), X = x * cy + z * sy, Z = -x * sy + z * cy, pit = -.32, cp = Math.cos(pit), sp = Math.sin(pit), Y = y * cp - Z * sp, Z2 = y * sp + Z * cp;
    const d = cam - Z2;
    if (h > w * 1.1) return { x: w / 2 + Y * w * .42 / d, y: h / 2 + X * h * .3 / d, s: cam / d, z: Z2 };   // celular: el ecosistema se reparte a lo alto
    const f = Math.min(w * .3, h * .55);
    return { x: w / 2 + X * f / d, y: h / 2 + Y * f / d, s: cam / d, z: Z2 };
  };
  const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
  function cuadro(ahora) {
    const dt = Math.min(.05, (ahora - ultimo) / 1000); ultimo = ahora;
    const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    yaw = -.15 + Math.sin((ahora - t0) / 1000 * .22) * .32; cam += (camObj - cam) * (1 - Math.pow(.04, dt)); juntar += (juntarObj - juntar) * (1 - Math.pow(.02, dt));
    const k = 1 - juntar * .92, P = nodos.map((n) => proyectar(n.p, w, h, k)), C = proyectar([0, 0, 0], w, h);
    // polvo
    for (const d of polvo) { const q = proyectar([d[0] * 1.6, d[1], d[2]], w, h, k); const a = Math.max(0, Math.min(.5, .35 * q.s)) * (1 - juntar); c.fillStyle = `rgba(52,82,157,${a})`; c.beginPath(); c.arc(q.x, q.y, 1.4 * q.s, 0, 7); c.fill(); }
    // conexiones al centro y entre sistemas
    const linea = (a, b, al, ancho) => { c.strokeStyle = `rgba(52,82,157,${al})`; c.lineWidth = ancho; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); };
    P.forEach((q, i) => linea(C, q, (i < 3 && nodos[i].on ? .55 : .14) * Math.min(1, q.s) * (1 - juntar * .7), i < 3 && nodos[i].on ? 1.6 : 1));
    enlaces.forEach(([a, b]) => linea(P[a], P[b], .08 * (1 - juntar), 1));
    // datos que corren: ambientales y los de la consulta
    ambiente += dt; if (!QUIETO && ambiente > .22) { ambiente = 0; const i = 3 + Math.floor(Math.random() * (N - 3)); pulsos.push({ i, t: 0, v: .7 + Math.random() * .5, vuelta: Math.random() < .5, col: "rgba(138,157,211,.9)", r: 2.2 }); }
    for (let j = pulsos.length - 1; j >= 0; j--) {
      const pu = pulsos[j]; pu.t += dt * pu.v; if (pu.t >= 1) { pulsos.splice(j, 1); if (pu.al) pu.al(); continue; }
      const a = pu.vuelta ? P[pu.i] : C, b = pu.vuelta ? C : P[pu.i], e = pu.t < .5 ? 2 * pu.t * pu.t : 1 - Math.pow(-2 * pu.t + 2, 2) / 2;
      const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e;
      c.fillStyle = pu.col; c.shadowColor = pu.col; c.shadowBlur = 10; c.beginPath(); c.arc(x, y, pu.r, 0, 7); c.fill(); c.shadowBlur = 0;
    }
    // nodos, de atrás hacia adelante
    const orden = P.map((q, i) => [q, i]).sort((a, b) => a[0].z - b[0].z);
    for (const [q, i] of orden) {
      const n = nodos[i], t = 40 * q.s * (i < 3 ? 1.2 : .85) * (1 + n.on * .12), a = Math.max(.18, Math.min(1, .25 + q.s * .8)) * (1 - juntar);
      c.globalAlpha = a; c.shadowColor = "rgba(15,27,61,.22)"; c.shadowBlur = 18 * q.s; c.shadowOffsetY = 8 * q.s;
      rr(q.x - t / 2, q.y - t / 2, t, t, t * .28); c.fillStyle = "#fff"; c.fill(); c.shadowColor = "transparent";
      if (n.on) { c.strokeStyle = "rgba(52,82,157,.9)"; c.lineWidth = 2; c.stroke(); }
      if (n.img.complete && n.img.naturalWidth) { const iw = t * .5, ih = iw * n.img.naturalHeight / n.img.naturalWidth, m = Math.max(iw, ih) / (t * .5); c.drawImage(n.img, q.x - iw / m / 2, q.y - ih / m / 2, iw / m, ih / m); }
      c.globalAlpha = 1;
    }
    // Médula al centro, siempre al frente
    const ms = (78 + 16 * juntar) * Math.min(1.25, C.s) * (1 + .03 * Math.sin(ahora / 400));
    c.shadowColor = "rgba(35,60,122,.55)"; c.shadowBlur = 40; c.shadowOffsetY = 18;
    const g = c.createLinearGradient(C.x - ms / 2, C.y - ms / 2, C.x + ms / 2, C.y + ms / 2); g.addColorStop(0, "#4A66B0"); g.addColorStop(.5, "#34529D"); g.addColorStop(1, "#233C7A");
    rr(C.x - ms / 2, C.y - ms / 2, ms, ms, ms * .27); c.fillStyle = g; c.fill(); c.shadowColor = "transparent";
    if (medImg.complete && medImg.naturalWidth) { const iw = ms * .5, ih = iw * medImg.naturalHeight / medImg.naturalWidth; c.drawImage(medImg, C.x - iw / 2, C.y - ih / 2, iw, ih); }
    // los datos de las tres clave, sobre su sistema
    chips.forEach((ch, i) => { const q = P[i], vis = nodos[i].ok && juntar < .2; ch.style.transform = `translate(${q.x}px, ${q.y + 30 * q.s}px) translate(-50%, 0)`; ch.classList.toggle("on", !!vis); });
    if (vivo) raf = requestAnimationFrame(cuadro);
  }
  const arrancar = () => { if (vivo) return; vivo = true; ultimo = performance.now(); raf = requestAnimationFrame(cuadro); };
  new IntersectionObserver(([e]) => { if (e.isIntersecting) arrancar(); else { vivo = false; cancelAnimationFrame(raf); } }, { threshold: 0 }).observe(caja);
  return {
    reiniciar() { nodos.forEach((n) => { n.on = 0; n.ok = 0; }); camObj = cam = 3.4; juntarObj = juntar = 0; pulsos.length = 0; if (QUIETO) { nodos.slice(0, 3).forEach((n) => { n.on = 1; n.ok = 1; }); camObj = cam = 2.3; } },
    entrar() { camObj = 2.3; },
    consultar(i) { nodos[i].on = 1; pulsos.push({ i, t: 0, v: 1.6, col: "#34529D", r: 4, al: () => { nodos[i].ok = 1; pulsos.push({ i, t: 0, v: 1.3, vuelta: true, col: "#1F9D5A", r: 4 }); } }); },
    juntar() { juntarObj = 1; camObj = 2.6; },
  };
}
