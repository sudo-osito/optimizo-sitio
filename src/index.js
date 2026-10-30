// optimizo.ai · la portada es la v6, y /superpoder-lumina sirve la one-page de Lumina (Worker web-lumina, por service binding).
// El resto de los archivos se sirven tal cual desde los assets estáticos.
const LUMINA = "/superpoder-lumina";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === LUMINA) return Response.redirect(`${url.origin}${LUMINA}/${url.search}`, 301);   // la barra final hace que funcionen sus rutas relativas
    if (url.pathname.startsWith(LUMINA + "/")) { url.pathname = url.pathname.slice(LUMINA.length); return env.LUMINA.fetch(new Request(url, request)); }
    if (url.pathname === "/" || url.pathname === "/index.html") { url.pathname = "/v6.html"; return env.ASSETS.fetch(new Request(url, request)); }
    return env.ASSETS.fetch(request);
  },
};
