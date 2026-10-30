// optimizo.ai · la portada es la v6. Lumina vive en lumina.optimizo.ai (su propio Worker); la dirección antigua redirige ahí.
// /feria es el registro del stand (feria.html); su formulario envía a /api/visitante, que se reenvía al servicio de la feria.
// El resto de los archivos se sirven tal cual desde los assets estáticos.
const API_FERIA = "https://feria.optimizo.ai/api/visitante";

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
    return env.ASSETS.fetch(request);
  },
};
