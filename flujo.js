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
        <div class="vj__orbita">
          <svg class="vj__rayos" viewBox="-50 -50 100 100">${APPS.map((_, i) => `<line x1="0" y1="0" x2="${(Math.cos(ang(i)) * 36).toFixed(2)}" y2="${(Math.sin(ang(i)) * 36).toFixed(2)}" pathLength="100"/>`).join("")}</svg>
          <div class="vj__med"><i class="vj__onda"></i><i class="vj__onda vj__onda--2"></i><span class="vj__sim"><img src="recursos/marca/medula-simbolo-blanco.png" alt=""></span></div>
          ${APPS.map(([img, n, dato], i) => `<div class="vj__app" style="--x:${(50 + Math.cos(ang(i)) * 36).toFixed(2)}%;--y:${(50 + Math.sin(ang(i)) * 36).toFixed(2)}%;--i:${i}"><span class="vj__ic"><img src="recursos/logos/${img}" alt=""><i class="vj__ok"></i></span><small>${n}</small>${dato ? `<em>${dato}</em>` : ""}</div>`).join("")}
        </div>
      </section>
    </div>
    <div class="vj__viajero"><span></span></div>
    <ol class="vj__pasos">${PASOS.map((t, i) => `<li><i></i><span>${i + 1}. ${t}</span></li>`).join("")}</ol>
  </div>`;
  const vj = caja.firstElementChild, pista = vj.querySelector(".vj__pista"), viajero = vj.querySelector(".vj__viajero"), vtxt = viajero.querySelector("span");
  const qTxt = vj.querySelector(".vj__bur--q .vj__txt"), rTxt = vj.querySelector(".vj__bur--r .vj__txt"), pasos = [...vj.querySelectorAll(".vj__pasos li")];
  const ag = vj.querySelector(".vj__agente"), med = vj.querySelector(".vj__orbita"), apps = [...vj.querySelectorAll(".vj__app")];
  const camara = (n) => { pista.style.transform = `translateX(${-n * 100 / 3}%)`; vj.dataset.escena = n; };
  const paso = (i) => pasos.forEach((li, j) => { li.classList.toggle("on", j === i); li.classList.toggle("hecho", j < i); });
  const escribir = async (el, txt, ms, sigue) => { for (let k = 1; k <= txt.length; k++) { if (!sigue()) return; el.textContent = txt.slice(0, k); await esperar(ms); } };
  const viajar = async (destino, texto, tipo) => { vtxt.textContent = texto; viajero.className = `vj__viajero on ${tipo}`; await esperar(200); camara(destino); await esperar(1450); viajero.classList.add("llega"); await esperar(380); viajero.className = "vj__viajero"; };
  let vivo = false, turno = 0;
  async function ciclo(mio) {
    const sigue = () => vivo && mio === turno;
    while (sigue()) {
      vj.className = "vj"; pista.style.transition = "none"; camara(0); pista.offsetWidth; pista.style.transition = "";
      qTxt.textContent = ""; rTxt.textContent = ""; apps.forEach((a) => a.classList.remove("on", "ok")); med.classList.remove("activa", "junta"); paso(0);
      await esperar(500); vj.classList.add("pregunta");
      await escribir(qTxt, PREGUNTA, 34, sigue); await esperar(900); if (!sigue()) return;
      paso(1); vj.classList.add("enviada"); await viajar(1, PREGUNTA, "ida"); ag.classList.add("piensa"); await esperar(1300); if (!sigue()) return;
      ag.classList.remove("piensa"); await viajar(2, "Consultando a Médula…", "ida"); if (!sigue()) return;
      paso(2); med.classList.add("activa");
      for (const a of apps) { a.classList.add("on"); await esperar(240); }
      await esperar(450);
      for (const a of apps) { a.classList.add("ok"); await esperar(380); }
      await esperar(1600); if (!sigue()) return;
      med.classList.add("junta"); await esperar(800);
      paso(3); await viajar(1, "Respuesta lista", "vuelta"); await viajar(0, "Respuesta lista", "vuelta"); if (!sigue()) return;
      vj.classList.add("responde");
      await escribir(rTxt, RESPUESTA, 18, sigue); await esperar(4500);
    }
  }
  if (QUIETO) { camara(0); vj.classList.add("pregunta", "responde"); rTxt.textContent = RESPUESTA; qTxt.textContent = PREGUNTA; paso(3); return; }
  alVer(caja, () => { if (vivo) return; vivo = true; ciclo(++turno); }, () => { vivo = false; turno++; }, .3);
}
