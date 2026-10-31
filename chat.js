// Optimizo · asistente de preguntas. Si ENDPOINT tiene una URL (un Worker con el modelo), le pregunta a la IA con la base como contexto;
// si no, responde buscando la respuesta más cercana en la base (preguntas frecuentes + narrativa).
import { BASE } from "./chat-base.js?v=1793308266";
const ENDPOINT = "";
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]/g, " ");
const VACIAS = new Set("que es el la los las de del en un una y o a mi mis tu se con por para como lo al sus su me hay puedo pueden tengo tienen son esta este eso".split(" "));
const palabras = (t) => norm(t).split(/\s+/).filter((w) => w.length > 2 && !VACIAS.has(w));
function buscar(pregunta) {
  const q = palabras(pregunta); if (!q.length) return null;
  let mejor = null, top = 0;
  for (const e of BASE) {
    const enQ = new Set(palabras(e.q)), enR = new Set(palabras(e.r));
    let p = 0; for (const w of q) { if (enQ.has(w)) p += 3; else if ([...enQ].some((x) => x.length > 4 && w.length > 4 && (x.startsWith(w.slice(0, 6)) || w.startsWith(x.slice(0, 6))))) p += 2; else if (enR.has(w)) p += 1; }
    p = p / Math.sqrt(enQ.size + 1);
    if (p > top) { top = p; mejor = e; }
  }
  return top >= .9 ? mejor.r.replace(/^\(Lumina\) /, "") : null;
}
async function preguntarIA(pregunta, historial) {
  const r = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pregunta, historial }) });
  if (!r.ok) throw new Error(r.status); return (await r.json()).respuesta;
}
export function montarChat() {
  const msjs = document.getElementById("ch-msjs"), form = document.getElementById("ch-form"), input = document.getElementById("ch-in"), sugs = document.getElementById("ch-sugs");
  if (!msjs) return;
  const historial = []; let ocupado = false;
  // el chat parte como una burbuja chica y se abre al escribir o elegir una pregunta
  const ch = form.closest(".ch"), abrirChat = () => ch.classList.add("abierto");
  input.addEventListener("focus", abrirChat); input.addEventListener("input", abrirChat);
  const burbuja = (quien, html) => { const d = document.createElement("div"); d.className = `ch__m ch__m--${quien}`; d.innerHTML = html; msjs.append(d); msjs.scrollTo({ top: msjs.scrollHeight, behavior: "smooth" }); return d; };
  async function enviar(texto) {
    texto = texto.trim(); if (!texto || ocupado) return; ocupado = true; input.value = ""; abrirChat();
    burbuja("yo", `<p></p>`).firstChild.textContent = texto;
    const b = burbuja("bot", `<p class="ch__pensando"><i></i><i></i><i></i></p>`);
    let resp = null;
    try { resp = ENDPOINT ? await preguntarIA(texto, historial) : (await esperar(650), buscar(texto)); } catch { resp = buscar(texto); }
    resp = resp || "Esa no la tengo resuelta todavía. Es justo el tipo de pregunta que conviene ver en un Discovery, con tu operación sobre la mesa.";
    historial.push({ q: texto, r: resp });
    const p = b.firstChild; p.className = ""; p.textContent = "";
    for (let k = 1; k <= resp.length; k += 2) { p.textContent = resp.slice(0, k); if (k % 12 === 1) msjs.scrollTop = msjs.scrollHeight; await esperar(9); }
    p.textContent = resp; msjs.scrollTop = msjs.scrollHeight;
    if (/discovery/i.test(resp) || resp.startsWith("Esa no")) { const a = document.createElement("a"); a.className = "ch__cta"; a.href = "#conversemos"; a.textContent = "Agenda tu Discovery →"; b.append(a); }
    ocupado = false;
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); enviar(input.value); });
  sugs.addEventListener("click", (e) => { const b = e.target.closest(".ch__sug"); if (!b || ocupado) return; b.remove(); enviar(b.textContent); });
}
