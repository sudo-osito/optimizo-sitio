// Médula · cómo funciona, contado en imagen: la persona pregunta, el agente consulta a Médula, Médula actúa en tus sistemas,
// todo vuelve a Médula y la respuesta llega a la persona. Íconos grandes, haces de luz que se encienden y una leyenda de 4 pasos.
const APPS = [["bsale.png", "Bsale"], ["gmail.svg", "Gmail"], ["microsoftexcel.svg", "Excel"], ["zoho.svg", "Zoho CRM"], ["whatsapp.svg", "WhatsApp"]];
const PASOS = ["Preguntas", "El agente consulta a Médula", "Médula actúa en tus sistemas", "Te responde con todo resuelto"];
// posiciones en % del lienzo: horizontal (PC) y vertical (celular)
const POS = {
  h: { persona: [9, 24], agente: [22, 72], medula: [52, 50], apps: [[86, 12], [86, 31], [86, 50], [86, 69], [86, 88]] },
  v: { persona: [50, 8], agente: [50, 39], medula: [50, 59], apps: [[12, 85], [31, 85], [50, 85], [69, 85], [88, 85]] },
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
export function montarFlujo(caja, { alVer, QUIETO }) {
  const vert = caja.clientWidth / Math.max(1, caja.clientHeight) < .9, P = POS[vert ? "v" : "h"];
  caja.classList.add(vert ? "fv" : "fh");
  caja.innerHTML = `<svg class="fx__haces" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
    <div class="fx__n fx__persona" style="left:${P.persona[0]}%;top:${P.persona[1]}%"><span class="fx__av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.9-4 3.9-6 7.5-6s6.6 2 7.5 6"/></svg></span>
      <span class="fx__bur fx__bur--q">¿Qué cotizaciones de Quillay siguen abiertas?</span><span class="fx__bur fx__bur--r">Tres, por $18,4 M. La más antigua lleva 12 días sin respuesta.</span></div>
    <div class="fx__n fx__agente" style="left:${P.agente[0]}%;top:${P.agente[1]}%"><span class="fx__pild"><img src="recursos/logos/claude.svg" alt=""><img src="recursos/logos/openai.svg" alt=""><b>Tu agente de IA</b></span></div>
    <div class="fx__n fx__medula" style="left:${P.medula[0]}%;top:${P.medula[1]}%"><span class="fx__sim"><img src="recursos/marca/medula-simbolo-blanco.png" alt=""></span><b>Médula</b></div>
    ${APPS.map(([img, n], i) => `<div class="fx__n fx__app" style="left:${P.apps[i][0]}%;top:${P.apps[i][1]}%"><span class="fx__ic"><img src="recursos/logos/${img}" alt=""><i class="fx__ok"></i></span><small>${n}</small></div>`).join("")}
    <ol class="fx__pasos">${PASOS.map((t, i) => `<li><span>${i + 1}</span>${t}</li>`).join("")}</ol>`;
  const svg = caja.querySelector(".fx__haces"), NS = "http://www.w3.org/2000/svg";
  const linea = (a, b) => { const p = document.createElementNS(NS, "path"); const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; p.setAttribute("d", vert ? `M${a[0]} ${a[1]} C${a[0]} ${my} ${b[0]} ${my} ${b[0]} ${b[1]}` : `M${a[0]} ${a[1]} C${mx} ${a[1]} ${mx} ${b[1]} ${b[0]} ${b[1]}`); p.setAttribute("vector-effect", "non-scaling-stroke"); p.setAttribute("pathLength", "100"); svg.append(p); return p; };
  const h1 = linea(P.persona, P.agente), h2 = linea(P.agente, P.medula), ha = P.apps.map((a) => linea(P.medula, a));
  const apps = [...caja.querySelectorAll(".fx__app")], pasos = [...caja.querySelectorAll(".fx__pasos li")];
  const per = caja.querySelector(".fx__persona"), age = caja.querySelector(".fx__agente"), med = caja.querySelector(".fx__medula");
  const paso = (i) => pasos.forEach((li, j) => { li.classList.toggle("on", j === i); li.classList.toggle("hecho", j < i); });
  const luz = (p, atras = false) => { p.classList.remove("viaja", "atras"); void p.getBBox(); p.classList.add("viaja"); if (atras) p.classList.add("atras"); p.classList.add("on"); };
  let vivo = false, turno = 0;
  async function ciclo(mio) {
    const sigue = () => vivo && mio === turno;
    while (sigue()) {
      caja.querySelectorAll(".on,.hecha,.viaja").forEach((e) => e.classList.remove("on", "hecha", "viaja", "atras")); paso(-1);
      await esperar(600); if (!sigue()) return;
      paso(0); per.classList.add("on", "pregunta"); await esperar(1100); if (!sigue()) return;
      paso(1); luz(h1); await esperar(500); age.classList.add("on"); luz(h2); await esperar(550); med.classList.add("on"); await esperar(500); if (!sigue()) return;
      paso(2); for (const [i, p] of ha.entries()) { luz(p); setTimeout(() => apps[i].classList.add("on"), 450); await esperar(160); }
      await esperar(700); apps.forEach((a, i) => setTimeout(() => a.classList.add("hecha"), i * 120)); await esperar(900); if (!sigue()) return;
      ha.forEach((p) => luz(p, true)); await esperar(650); luz(h2, true); await esperar(500); luz(h1, true); await esperar(500);
      paso(3); per.classList.remove("pregunta"); per.classList.add("responde"); await esperar(4200);
    }
  }
  if (QUIETO) { caja.querySelectorAll(".fx__n, .fx__haces path").forEach((e) => e.classList.add("on")); per.classList.add("responde"); paso(3); return; }
  alVer(caja, () => { if (vivo) return; vivo = true; ciclo(++turno); }, () => { vivo = false; turno++; }, .3);
}
