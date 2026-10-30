// Optimizo · los visuales de cada superpoder. Un escenario teñido de su color, un panel de vidrio inclinado en 3D con la interfaz
// del superpoder a tamaño real y fichas de vidrio flotando a distintas profundidades. Cada escena es una línea de tiempo que se repite.

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const LOGO = (f) => `<img src="recursos/logos/${f}" alt="">`;
const ESCENAS = {
  tareas: {
    html: `<div class="pn pn--tareas"><div class="pn__cab"><b>Tareas automáticas</b><span class="pn__vivo"><i></i>Agente activo</span></div>
      ${[["gmail.svg", "Cotización a Quillay", "Enviada"], ["bsale.png", "Factura de octubre", "Emitida"], ["microsoftexcel.svg", "Inventario semanal", "Actualizado"], ["whatsapp.svg", "Aviso de despacho", "Avisado"], ["zoho.svg", "Seguimiento en CRM", "Registrado"]]
        .map(([l, n, ok]) => `<div class="tk">${LOGO(l)}<span>${n}</span><em data-ok="${ok}">En cola</em><i class="tk__barra"></i></div>`).join("")}</div>
      <div class="fx fx--a"><small>Cola de hoy</small><b class="fx__num" data-cuenta>0/5</b><i class="fx__barra"><i></i></i></div>
      <div class="fx fx--b"><span class="fx__punto"></span>Las personas, en lo que importa</div>`,
    async correr(e, vivo) {
      const filas = [...e.querySelectorAll(".tk")], n = e.querySelector("[data-cuenta]"), barra = e.querySelector(".fx__barra i");
      const [fa, fb] = e.querySelectorAll(".fx");
      filas.forEach((f) => { f.className = "tk"; f.querySelector("em").textContent = "En cola"; }); n.textContent = "0/5"; barra.style.transform = "scaleX(0)"; fa.classList.remove("on"); fb.classList.remove("on");
      await esperar(300); fa.classList.add("on"); await esperar(300);
      for (const [i, f] of filas.entries()) {
        if (!vivo()) return; f.classList.add("corre"); f.querySelector("em").textContent = "Procesando";
        await esperar(900); if (!vivo()) return;
        f.classList.replace("corre", "hecha"); f.querySelector("em").textContent = f.querySelector("em").dataset.ok;
        n.textContent = `${i + 1}/5`; barra.style.transform = `scaleX(${(i + 1) / 5})`; await esperar(250);
      }
      fb.classList.add("on");
      await esperar(2400);
    },
  },
  seguridad: {
    html: `<div class="pn pn--cam"><div class="pn__cab pn__cab--sobre"><b><i class="rec"></i>CAM 02 · Pasillo 4</b><span>Lumina</span></div>
      <video muted loop playsinline preload="none" poster="recursos/video/lumina-trafico.jpg"><source src="recursos/video/lumina-trafico.mp4" type="video/mp4"></video><canvas></canvas>
      <div class="zona"></div></div>
      <div class="fx fx--a fx--alerta"><span class="fx__ico">!</span><div><small>Lumina · ahora</small><b>Persona en zona restringida</b><span>Pasillo 4 · CAM 02</span></div></div>
      <div class="fx fx--b"><span class="fx__baliza"></span>Baliza encendida · aviso a Operaciones</div>`,
    async correr(e, vivo, ctx) {
      const a = e.querySelector(".fx--alerta"), b = e.querySelector(".fx--b"), z = e.querySelector(".zona");
      [a, b, z].forEach((x) => x.classList.remove("on"));
      ctx.video(true);
      await esperar(1400); if (!vivo()) return; z.classList.add("on");
      await esperar(700); if (!vivo()) return; a.classList.add("on");
      await esperar(900); if (!vivo()) return; b.classList.add("on");
      await esperar(3400);
    },
  },
  inteligencia: {
    html: `<div class="pn pn--chat"><div class="pn__cab"><b><img src="recursos/marca/medula-simbolo.png?v=1793368873" alt="">Médula</b><span>Contexto compartido</span></div>
      <p class="burbuja burbuja--yo">¿Cómo van las ventas de la zona norte?</p>
      <div class="burbuja burbuja--med"><p class="esc"></p>
        <svg viewBox="0 0 300 70" class="graf"><defs><linearGradient id="gi" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#34529D" stop-opacity=".28"/><stop offset="1" stop-color="#34529D" stop-opacity="0"/></linearGradient></defs>
          <path class="graf__area" d="M0 14 L40 18 L80 10 L120 24 L160 22 L200 38 L240 42 L300 56 L300 70 L0 70Z" fill="url(#gi)"/>
          <path class="graf__linea" d="M0 14 L40 18 L80 10 L120 24 L160 22 L200 38 L240 42 L300 56" fill="none" stroke="#34529D" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" pathLength="100"/></svg></div></div>
      <div class="fx fx--a">${LOGO("bsale.png")}Bsale · ventas</div>
      <div class="fx fx--b">${LOGO("zoho.svg")}Zoho CRM · clientes</div>
      <div class="fx fx--c">${LOGO("gmail.svg")}Gmail · pedidos</div>`,
    async correr(e, vivo) {
      const p = e.querySelector(".esc"), med = e.querySelector(".burbuja--med"), yo = e.querySelector(".burbuja--yo"), fx = [...e.querySelectorAll(".fx")];
      p.textContent = ""; [med, yo, ...fx].forEach((x) => x.classList.remove("on"));
      await esperar(400); yo.classList.add("on");
      for (const [i, f] of fx.entries()) { await esperar(350); if (!vivo()) return; f.classList.add("on"); }
      await esperar(500); med.classList.add("on");
      const txt = "Bajaron este mes. Tres clientes no han vuelto a comprar; dos tienen cotizaciones abiertas.";
      for (let k = 1; k <= txt.length; k++) { if (!vivo()) return; p.textContent = txt.slice(0, k); await esperar(22); }
      await esperar(3200);
    },
  },
  calidad: {
    html: `<div class="pn pn--lotes"><div class="pn__cab"><b>Inspección de lotes</b><span>Línea 1</span></div>
      <div class="lt__cab"><span>Lote</span><span>Medida</span><span>Estado</span></div>
      ${[["0411", "50,1 mm", "OK"], ["0412", "49,9 mm", "OK"], ["0413", "50,0 mm", "OK"], ["0414", "51,6 mm", "Revisar"], ["0415", "50,2 mm", "OK"], ["0416", "49,8 mm", "OK"]]
        .map(([l, m, s]) => `<div class="lt${s !== "OK" ? " lt--mal" : ""}"><span>${l}</span><span>${m}</span><em>${s}</em></div>`).join("")}
      <i class="escaner"></i></div>
      <div class="fx fx--a fx--aviso"><div><small>Desviación detectada</small><b>Lote 0414 · +1,6 mm</b><span>Fuera de tolerancia · ejemplo</span></div></div>
      <div class="fx fx--b"><span class="fx__punto"></span>Trazabilidad registrada</div>`,
    async correr(e, vivo) {
      const filas = [...e.querySelectorAll(".lt")], esc = e.querySelector(".escaner"), a = e.querySelector(".fx--a"), b = e.querySelector(".fx--b");
      filas.forEach((f) => f.classList.remove("vista")); [a, b].forEach((x) => x.classList.remove("on")); esc.classList.remove("corre");
      await esperar(300); esc.classList.add("corre");
      for (const f of filas) { await esperar(430); if (!vivo()) return; f.classList.add("vista"); if (f.classList.contains("lt--mal")) { await esperar(200); a.classList.add("on"); } }
      await esperar(400); b.classList.add("on");
      await esperar(3000);
    },
  },
  rentabilidad: {
    html: `<div class="pn pn--graf"><div class="pn__cab"><b>Tiempo recuperado</b><span>ejemplo</span></div>
      <div class="rb">${["Jun", "Jul", "Ago", "Sep", "Oct", "Nov"].map((m, i) => `<div class="rb__col" style="--m:${[.88, .76, .64, .52, .42, .34][i]};--v:${[.08, .18, .3, .42, .52, .6][i]};--i:${i}"><i class="rb__v"></i><i class="rb__m"></i><span>${m}</span></div>`).join("")}</div>
      <div class="rb__ley"><span><i class="m"></i>Horas en tareas manuales</span><span><i class="v"></i>Tiempo recuperado</span></div></div>
      <div class="fx fx--a"><small>Costo por pedido</small><b>↓ cada mes</b></div>
      <div class="fx fx--b"><span class="fx__punto"></span>Recursos que generan más valor</div>`,
    async correr(e, vivo) {
      const pn = e.querySelector(".pn"), fx = [...e.querySelectorAll(".fx")];
      pn.classList.remove("crece"); fx.forEach((x) => x.classList.remove("on"));
      await esperar(300); pn.classList.add("crece");
      await esperar(1600); if (!vivo()) return; fx[0].classList.add("on"); await esperar(500); fx[1].classList.add("on");
      await esperar(3600);
    },
  },
  continuidad: {
    html: `<div class="pn pn--mon"><div class="pn__cab"><b>Monitoreo de líneas</b><span class="pn__vivo"><i></i>En vivo</span></div>
      ${[1, 2, 3].map((l) => `<div class="ln" data-l="${l}"><span>Línea ${l}</span><svg viewBox="0 0 300 40" preserveAspectRatio="none"><path d="" fill="none" stroke-width="2" stroke-linejoin="round"/></svg><em>OK</em></div>`).join("")}</div>
      <div class="fx fx--a fx--aviso"><div><small>Alerta</small><b>Desviación en Línea 2</b><span>Aviso enviado · 09:12</span></div></div>
      <div class="fx fx--b fx--ok"><span class="fx__punto"></span>Resuelta · 09:14</div>`,
    async correr(e, vivo) {
      const ln = e.querySelector('.ln[data-l="2"]'), a = e.querySelector(".fx--a"), b = e.querySelector(".fx--b");
      ln.classList.remove("cae"); [a, b].forEach((x) => x.classList.remove("on"));
      await esperar(1800); if (!vivo()) return; ln.classList.add("cae"); ln.querySelector("em").textContent = "Alerta";
      await esperar(500); a.classList.add("on");
      await esperar(2000); if (!vivo()) return; ln.classList.remove("cae"); ln.querySelector("em").textContent = "OK"; b.classList.add("on"); a.classList.remove("on");
      await esperar(2600);
    },
    cuadro(e, t) { // los pulsos corren siempre
      e.querySelectorAll(".ln").forEach((l) => {
        const cae = l.classList.contains("cae"), path = l.querySelector("path"); let d = "";
        for (let x = 0; x <= 300; x += 3) { const f = ((x / 60 - t * 1.2 - +l.dataset.l * .3) % 1 + 1) % 1; let y = 20; if (f > .4 && f < .46) y = 20 - 14 * Math.sin((f - .4) / .06 * Math.PI); else if (f > .46 && f < .52) y = 20 + 10 * Math.sin((f - .46) / .06 * Math.PI); if (cae && x > 150) y = 30 + 3 * Math.sin(x * .2 + t * 8); d += (x ? "L" : "M") + x + " " + y.toFixed(1); }
        path.setAttribute("d", d);
      });
    },
  },
};

export function montar(esc, nombre, { alVer, bucleVisible, dibujarCamara, QUIETO }) {
  const E = ESCENAS[nombre]; if (!E) return;
  esc.innerHTML = `<div class="esc8 esc8--${nombre}">${E.html}</div>`;
  const raiz = esc.firstElementChild;
  let turno = 0, visible = false;
  const video = raiz.querySelector("video"), cv = raiz.querySelector("canvas");
  const ctx = { video: (on) => video && (on ? video.play().catch(() => {}) : video.pause()) };
  if (video && cv) bucleVisible(raiz, () => dibujarCamara(cv, video), 30);
  if (E.cuadro) { const t0 = performance.now(); bucleVisible(raiz, () => E.cuadro(raiz, (performance.now() - t0) / 1000), 30); }
  async function ciclo(mio) { while (visible && mio === turno) { await E.correr(raiz, () => visible && mio === turno, ctx); await esperar(200); } }
  if (QUIETO) { raiz.classList.add("quieto"); return; }
  alVer(raiz, () => { if (visible) return; visible = true; raiz.classList.add("vivo"); ciclo(++turno); }, () => { visible = false; turno++; raiz.classList.remove("vivo"); ctx.video(false); }, .35);
}
