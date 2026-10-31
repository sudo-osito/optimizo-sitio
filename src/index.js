// optimizo.ai · la portada es la v6. Lumina vive en lumina.optimizo.ai (su propio Worker); la dirección antigua redirige ahí.
// /feria es el registro del stand (feria.html); su formulario envía a /api/visitante, que se reenvía al servicio de la feria.
// El resto de los archivos se sirven tal cual desde los assets estáticos.
const API_FERIA = "https://feria.optimizo.ai/api/visitante";

// Los assets estáticos no responden por tramos (Range) y Safari del iPhone no reproduce un video sin eso:
// los videos pasan por el Worker, que corta el tramo pedido y responde 206.
async function video(request, env) {
  const r = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  if (!r.ok) return r;
  const datos = await r.arrayBuffer(), total = datos.byteLength, h = new Headers(r.headers);
  h.set("Accept-Ranges", "bytes"); h.delete("Content-Encoding");
  const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get("Range") || "");
  if (!m) { h.set("Content-Length", total); return new Response(request.method === "HEAD" ? null : datos, { status: 200, headers: h }); }
  let ini = m[1] === "" ? Math.max(0, total - Number(m[2])) : Number(m[1]), fin = m[1] !== "" && m[2] !== "" ? Math.min(Number(m[2]), total - 1) : total - 1;
  if (ini >= total || ini > fin) { h.set("Content-Range", `bytes */${total}`); return new Response(null, { status: 416, headers: h }); }
  h.set("Content-Range", `bytes ${ini}-${fin}/${total}`); h.set("Content-Length", fin - ini + 1);
  return new Response(request.method === "HEAD" ? null : datos.slice(ini, fin + 1), { status: 206, headers: h });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/superpoder-lumina" || url.pathname.startsWith("/superpoder-lumina/")) return Response.redirect("https://lumina.optimizo.ai/", 301);
    if (url.pathname === "/api/visitante") {
      if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
      const r = await fetch(API_FERIA, { method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text() });
      return new Response(r.body, { status: r.status, headers: { "Content-Type": r.headers.get("Content-Type") || "application/json", "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/feria/") return Response.redirect(url.origin + "/feria", 301);
    if (url.pathname === "/" || url.pathname === "/index.html") { url.pathname = "/v6"; return env.ASSETS.fetch(new Request(url, request)); }
    if (url.pathname.startsWith("/recursos/video/")) return video(request, env);
    return env.ASSETS.fetch(request);
  },
};
