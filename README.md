# Optimizo · sitio para la feria (TechAI Summit)

**v3 (27-oct, noche):** upgrade masivo tras el segundo feedback de Max. Tipografía del guion de Optimizo (SF 700, rótulos SF semibold, botones píldora). Héroe: isotipo como nube de puntos que se arma, gira y se dispersa con el scroll (`nubeIsotipo`). Escena fija caos→orden (apps y problemas → Optimizo → resultados). Superpoderes en viaje horizontal con un emblema SVG animado propio por cada uno. Bifurcación «Elige tu camino»: Lumina (cámaras con IA, ámbar #FFAE1A, logo provisorio) y Médula (su guion: Geist, aura de puntos portada de `medula/guion-visual/src/componentes/aura.ts` a WebGL2, Médula Lite, isotipo blanco; nunca el orbe). Lumina: detección desde el primer cuadro y 4 pasos atados al scroll.

**v2 (27-oct, noche):** rehecha tras el feedback de Max («super claude, nada distinto»). Disección de composio.dev: tipografía delgada + rótulos/botones mono, marco de plano con líneas finas y cruces, degradado WebGL (port de su shader de 4 colores en OKLab, aquí en RGB) bajo objetos nítidos, microanimaciones de píxeles 22×6. Firma propia: el isotipo de Optimizo hecho de LED, de pie y girando en 3D (`discoDeLuz` en app.js); piso de luz en el cierre (`pisoDeLuz`). Médula con su identidad real (Orbe, isotipo negro, auras azul-lavanda, `recursos/medula-marca*.svg` del repo medula).

Página principal de Optimizo, versión feria. HTML + CSS + JS sin dependencias ni compilación.

- **Ver en local:** `python3 -m http.server 4410 --bind 127.0.0.1` y abrir http://127.0.0.1:4410/ (los módulos JS necesitan http, no file://).
- **Texto:** narrativa V1.0 de Bastián (`Optimizo_Cerebro_Obsidian_2026-10-27.zip`: OPT-02, CAM-02, MED-02/09), condensada en 8 bloques.
- **Lenguaje visual:** el de la TV del stand (`~/Proyectos/optimizo-tv-feria/escenas/optimizo.css`): hueso, navy, menta/teal, tarjetas blancas sólidas, SF; sin vidrio ni grano de fondo; mandarina solo para riesgo. Médula conserva su cobalto con el sello «de Optimizo».
- **Referentes estudiados:** Composio (palabra clave sobre bloque de color, demo viva bajo el héroe, acordeón + demo) y Sintra (cada capacidad con personalidad, pasos atados al scroll, diagrama fuentes → cerebro).
- **Demo de cámaras:** `recursos/video/bodega.mp4` (cuadros de `optimizo-tv-feria/cuadros/cctv169`, H.264) + `detecciones.js` (detecciones reales de Vision, 25 cps, cajas normalizadas desde arriba a la izquierda). Los indicadores por zona son de demostración y la página lo dice.
- **Pendiente:** canal real del CTA (hoy apunta a #conversemos), dominio y publicación, QR para el stand.
