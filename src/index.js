// optimizo.ai · la portada es la v6. Lumina vive en lumina.optimizo.ai (su propio Worker); la dirección antigua redirige ahí.
// El resto de los archivos se sirven tal cual desde los assets estáticos.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/superpoder-lumina" || url.pathname.startsWith("/superpoder-lumina/")) return Response.redirect("https://lumina.optimizo.ai/", 301);
    if (url.pathname === "/" || url.pathname === "/index.html") { url.pathname = "/v6"; return env.ASSETS.fetch(new Request(url, request)); }
    return env.ASSETS.fetch(request);
  },
};
