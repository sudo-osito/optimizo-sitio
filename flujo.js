// Médula · el flujo, al estilo n8n: la persona le pregunta al agente, el agente consulta a Médula, Médula dispara acciones en las herramientas,
// las respuestas vuelven a Médula, de Médula al agente y del agente a la persona. Un paquete de luz recorre cada tramo en orden.
let W = 1000, H = 440;
const HORIZ = {
  persona: { x: 100, y: 220, t: "Persona", s: "Pregunta", ico: "persona" },
  agente: { x: 300, y: 220, t: "Agente de IA", s: "Claude · ChatGPT", ico: "agente" },
  medula: { x: 535, y: 220, t: "Médula", s: "Contexto compartido", ico: "medula", grande: true },
  bsale: { x: 845, y: 70, t: "Bsale", s: "Ventas", img: "bsale.png" },
  gmail: { x: 845, y: 170, t: "Gmail", s: "Correo", img: "gmail.svg" },
  zoho: { x: 845, y: 270, t: "Zoho CRM", s: "Clientes", img: "zoho.svg" },
  wa: { x: 845, y: 370, t: "WhatsApp", s: "Avisos", img: "whatsapp.svg" },
};
// en el celular: de arriba hacia abajo, con las herramientas en 2 × 2
const VERT = {
  persona: { x: 220, y: 92, t: "Persona", s: "Pregunta", ico: "persona" },
  agente: { x: 220, y: 210, t: "Agente de IA", s: "Claude · ChatGPT", ico: "agente" },
  medula: { x: 220, y: 340, t: "Médula", s: "Contexto compartido", ico: "medula", grande: true },
  bsale: { x: 116, y: 490, t: "Bsale", s: "Ventas", img: "bsale.png" },
  gmail: { x: 324, y: 490, t: "Gmail", s: "Correo", img: "gmail.svg" },
  zoho: { x: 116, y: 590, t: "Zoho CRM", s: "Clientes", img: "zoho.svg" },
  wa: { x: 324, y: 590, t: "WhatsApp", s: "Avisos", img: "whatsapp.svg" },
};
let NODOS = HORIZ, VERTICAL = false;
const TOOLS = ["bsale", "gmail", "zoho", "wa"];
const ICO = {
  persona: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
  agente: '<rect x="4" y="7" width="16" height="12" rx="3.5"/><path d="M12 3.5V7M9 12.5h.01M15 12.5h.01M9.5 16h5"/>',
};
const NS = "http://www.w3.org/2000/svg";
const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.append(e); return e; };
const curva = (a, b, sube = 0) => { const dx = (b.x - a.x) * .5; return `M${a.x} ${a.y + sube} C${a.x + dx} ${a.y + sube} ${b.x - dx} ${b.y + sube} ${b.x} ${b.y + sube}`; };

export function montarFlujo(caja, { alVer, QUIETO }) {
  VERTICAL = caja.clientWidth / Math.max(1, caja.clientHeight) < .9;
  if (VERTICAL) { NODOS = VERT; W = 440; H = 720; }
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "xMidYMid meet", class: "flujo__svg" }, caja);
  const defs = el("defs", {}, svg);
  const pat = el("pattern", { id: "fl-pts", width: 22, height: 22, patternUnits: "userSpaceOnUse" }, defs); el("circle", { cx: 1.5, cy: 1.5, r: 1.2, fill: "rgba(6,16,46,.12)" }, pat);
  el("rect", { x: -500, y: -200, width: 2000, height: 900, fill: "url(#fl-pts)" }, svg);
  const borde = (n) => { const N = NODOS[n], dx = N.grande ? 98 : 84, dy = N.grande ? 38 : 30; return VERTICAL ? { der: { x: N.x, y: N.y + dy }, izq: { x: N.x, y: N.y - dy } } : { der: { x: N.x + dx, y: N.y }, izq: { x: N.x - dx, y: N.y } }; };
  const curvaV = (a, b, lado = 0) => { const dy = (b.y - a.y) * .5; return `M${a.x + lado} ${a.y} C${a.x + lado} ${a.y + dy} ${b.x + lado} ${b.y - dy} ${b.x + lado} ${b.y}`; };
  // tramos: ida arriba, vuelta abajo (desfasada) para que se lean dos sentidos
  const tramos = [];
  const tramo = (a, b, vuelta) => { const d = VERTICAL ? (vuelta ? curvaV(borde(a).izq, borde(b).der, 14).replace(/^M/, "M") : curvaV(borde(a).der, borde(b).izq, -14)) : vuelta ? curva(borde(a).izq, borde(b).der, 14) : curva(borde(a).der, borde(b).izq, -14); const g = el("g", { class: "fl__t" + (vuelta ? " fl__t--v" : "") }, svg); const p = el("path", { d, class: "fl__l" }, g); return { p, g, a, b }; };
  const ida1 = tramo("persona", "agente"), ida2 = tramo("agente", "medula");
  const ida3 = TOOLS.map((t) => tramo("medula", t));
  const vu3 = TOOLS.map((t) => tramo(t, "medula", true));
  const vu2 = tramo("medula", "agente", true), vu1 = tramo("agente", "persona", true);
  tramos.push(ida1, ida2, ...ida3, ...vu3, vu2, vu1);
  // nodos
  const nodos = {};
  for (const [k, n] of Object.entries(NODOS)) {
    const w = n.grande ? 196 : 168, h = n.grande ? 76 : 60;
    const g = el("g", { class: `fl__n fl__n--${k}`, transform: `translate(${n.x - w / 2} ${n.y - h / 2})` }, svg);
    el("rect", { width: w, height: h, rx: 16, class: "fl__caja" }, g);
    const ic = el("g", { transform: `translate(12 ${h / 2 - 18})` }, g);
    el("rect", { width: 36, height: 36, rx: 10, class: "fl__icofondo" }, ic);
    if (n.img) el("image", { href: `recursos/logos/${n.img}`, x: 8, y: 8, width: 20, height: 20 }, ic);
    else if (n.ico === "medula") el("image", { href: "recursos/medula-marca-blanca.svg", x: 7, y: 7, width: 22, height: 22 }, ic);
    else { const s = el("g", { transform: "translate(6 6)", fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, ic); s.innerHTML = `<g transform="scale(1)">${ICO[n.ico]}</g>`; }
    const tx = el("text", { x: 58, y: h / 2 - 3, class: "fl__tt" }, g); tx.textContent = n.t;
    const sx = el("text", { x: 58, y: h / 2 + 14, class: "fl__ts" }, g); sx.textContent = n.s;
    const ok = el("g", { class: "fl__ok", transform: `translate(${w - 14} 14)` }, g); el("circle", { r: 8 }, ok); el("path", { d: "M-3.5 0l2.5 2.5 4.5-5", fill: "none", stroke: "#fff", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }, ok);
    nodos[k] = g;
  }
  // los mensajes de la persona
  const globo = (txt, cls) => { const f = el("foreignObject", { x: 20, width: 260, height: 70, class: "fl__globo " + cls }, svg); f.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml">${txt}</div>`; return f; };
  const gPreg = globo("¿Qué cotizaciones de Quillay siguen abiertas?", "fl__globo--q"); gPreg.setAttribute("y", VERTICAL ? 6 : 110);
  const gResp = globo("Tres, por $18,4 M. La más antigua lleva 12 días sin respuesta.", "fl__globo--r"); gResp.setAttribute("y", VERTICAL ? 646 : 268);
  if (VERTICAL) { gPreg.setAttribute("x", 90); gResp.setAttribute("x", 90); }
  const paquete = () => el("circle", { r: 6, class: "fl__pq" }, svg);

  const viajar = (t, ms = 650) => new Promise((ok) => {
    const L = t.p.getTotalLength(), c = paquete(), t0 = performance.now(); t.g.classList.add("on");
    const paso = (ahora) => { const k = Math.min(1, (ahora - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, pt = t.p.getPointAtLength(L * e); c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); if (k < 1) requestAnimationFrame(paso); else { c.remove(); ok(); } };
    requestAnimationFrame(paso);
  });
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const activo = (k, on = true) => nodos[k].classList.toggle("activo", on);
  const hecho = (k, on = true) => nodos[k].classList.toggle("hecho", on);
  let vivo = false, turno = 0;
  async function ciclo(mio) {
    const sigue = () => vivo && mio === turno;
    while (sigue()) {
      Object.keys(nodos).forEach((k) => { activo(k, false); hecho(k, false); }); tramos.forEach((t) => t.g.classList.remove("on")); gPreg.classList.remove("on"); gResp.classList.remove("on");
      await espera(500); if (!sigue()) return;
      activo("persona"); gPreg.classList.add("on"); await espera(900);
      await viajar(ida1); activo("agente"); await espera(250);
      await viajar(ida2); activo("medula"); await espera(350); if (!sigue()) return;
      await Promise.all(ida3.map((t, i) => espera(i * 110).then(() => viajar(t, 700))));
      TOOLS.forEach((k) => { activo(k); hecho(k); }); await espera(600); if (!sigue()) return;
      await Promise.all(vu3.map((t, i) => espera(i * 110).then(() => viajar(t, 700))));
      hecho("medula"); await espera(300);
      await viajar(vu2); hecho("agente"); await espera(250);
      await viajar(vu1); hecho("persona"); gResp.classList.add("on");
      await espera(3600);
    }
  }
  if (QUIETO) { Object.keys(nodos).forEach((k) => { activo(k); hecho(k); }); tramos.forEach((t) => t.g.classList.add("on")); gPreg.classList.add("on"); gResp.classList.add("on"); return; }
  alVer(caja, () => { if (vivo) return; vivo = true; ciclo(++turno); }, () => { vivo = false; turno++; }, .3);
}
