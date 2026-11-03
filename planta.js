// Optimizo · el banner: una planta isométrica hecha en código. Estanterías y pallets claros, vehículos en el teal de Optimizo
// que recorren los pasillos, bahías que se encienden cuando una cámara las lee y la vista que avanza despacio por la planta.
// La planta es una baldosa que se repite: la cámara recorre una baldosa y vuelve al inicio sin que se note.
import * as THREE from "./recursos/lib/three.module.min.js";

const P = 24;                         // largo de la baldosa (la cámara avanza esto y se repite)
const FILAS = [-13, -7, -1, 5, 11];   // las filas de estanterías (en z)
const BAHIAS = 12, ANCHO_B = 1.5, NIVELES = 3, ALTO_N = 1.25;
const azar = (i) => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };

export function montarPlanta(caja, { QUIETO, alVer }) {
  let r;
  try { r = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" }); } catch { return; }
  const movil = innerWidth < 760;
  r.setPixelRatio(Math.min(devicePixelRatio || 1, movil ? 1.5 : 1.75));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.domElement.className = "planta";
  caja.appendChild(r.domElement);

  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#E9EEEE");
  escena.add(new THREE.HemisphereLight("#ffffff", "#cfd8d8", 2.1));
  const sol = new THREE.DirectionalLight("#ffffff", 1.6);
  sol.castShadow = true; sol.shadow.mapSize.set(movil ? 1024 : 2048, movil ? 1024 : 2048);
  Object.assign(sol.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 120 });
  sol.shadow.radius = 4; sol.shadow.bias = -0.0006;
  escena.add(sol, sol.target);

  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: "#E9EEEE" }));
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; escena.add(suelo);

  // ── lo que se repite en cada baldosa: pallets, vigas, parantes, muro con andenes y pallets sueltos ──
  const caja1 = new THREE.BoxGeometry(1, 1, 1);
  const matPallet = new THREE.MeshLambertMaterial({ color: "#ffffff" });
  const matViga = new THREE.MeshLambertMaterial({ color: "#C9D3D4" });
  const pallets = [], vigas = [];
  const nivelesZ = (z) => [z - .62, z + .62];   // estantería de doble cara
  for (const z of FILAS) for (let b = 0; b < BAHIAS; b++) for (let n = 0; n < NIVELES; n++) for (const zz of nivelesZ(z)) {
    const k = pallets.length + z * 97 + b * 13 + n * 7;
    if (azar(k) < .16) { pallets.push(null); continue; }
    const h = .7 + azar(k + 3) * .32;
    pallets.push([b * ANCHO_B + ANCHO_B / 2, n * ALTO_N + .12 + h / 2, zz, 1.22, h, 1.05]);
  }
  for (const z of FILAS) {
    // repisas: una bandeja en cada nivel y, arriba, solo los largueros delanteros y traseros (sin techo: se ven los pallets)
    for (let n = 0; n < NIVELES; n++) vigas.push([BAHIAS * ANCHO_B / 2, n * ALTO_N + .05, z, BAHIAS * ANCHO_B, .08, 2.5]);
    for (const zz of [z - 1.2, z + 1.2]) vigas.push([BAHIAS * ANCHO_B / 2, NIVELES * ALTO_N + .05, zz, BAHIAS * ANCHO_B, .08, .08]);
    for (let b = 0; b <= BAHIAS; b++) for (const zz of [z - 1.2, z + 1.2]) vigas.push([b * ANCHO_B, NIVELES * ALTO_N / 2 + .05, zz, .08, NIVELES * ALTO_N + .1, .08]);
  }
  // pallets sueltos junto a los andenes y el muro del fondo con sus puertas
  for (let i = 0; i < 10; i++) { const x = 19 + (i % 2) * 1.6, z = -12 + Math.floor(i / 2) * 2.2; if (azar(i + 70) > .2) pallets.push([x, .5, z, 1.25, 1 - azar(i) * .3, 1.25]); }
  const muro = [[P / 2, 1.6, -18.5, P, 3.2, .4]];
  for (let d = 0; d < 4; d++) muro.push([3 + d * 6, .9, -18.25, 2.6, 1.8, .2]);

  const lotes = [];
  function lote(lista, mat, sombra = true) {
    const datos = lista.filter(Boolean), m = new THREE.InstancedMesh(caja1, mat, datos.length * 4), o = new THREE.Object3D();
    let i = 0;
    for (let t = -1; t <= 2; t++) for (const [x, y, z, w, h, d] of datos) { o.position.set(x + t * P, y, z); o.scale.set(w, h, d); o.updateMatrix(); m.setMatrixAt(i++, o.matrix); }
    m.castShadow = sombra; m.receiveShadow = true; escena.add(m); lotes.push(m); return m;
  }
  lote(pallets, matPallet); lote(vigas, matViga);
  lote(muro.slice(0, 1), new THREE.MeshLambertMaterial({ color: "#DCE3E3" }));
  lote(muro.slice(1), new THREE.MeshLambertMaterial({ color: "#B9C6C7" }), false);

  // ── bahías leídas: un vidrio teal que se enciende sobre la cara de una bahía y se apaga ──
  const matScan = new THREE.MeshBasicMaterial({ color: "#5FC2B4", transparent: true, opacity: 0, depthWrite: false });
  const scans = [];
  for (let s = 0; s < (movil ? 5 : 8); s++) {
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(ANCHO_B * .94, NIVELES * ALTO_N), matScan.clone(), 4);
    escena.add(m); scans.push({ m, fase: s / (movil ? 5 : 8), vez: -1 });
  }
  function moverScan(s, vez) {
    const fila = FILAS[Math.floor(azar(vez * 3 + s.fase * 50) * FILAS.length)], b = Math.floor(azar(vez * 7 + s.fase * 90) * BAHIAS), cara = azar(vez + s.fase) > .5 ? 1 : -1;
    const o = new THREE.Object3D();
    for (let t = -1; t <= 2; t++) { o.position.set(b * ANCHO_B + ANCHO_B / 2 + t * P, NIVELES * ALTO_N / 2 + .1, fila + cara * 1.24); o.rotation.y = cara > 0 ? 0 : Math.PI; o.updateMatrix(); s.m.setMatrixAt(t + 1, o.matrix); }
    s.m.instanceMatrix.needsUpdate = true;
  }

  // ── vehículos: grúas horquilla teal en los pasillos, con su mástil y su luz de trabajo en el suelo ──
  const matCuerpo = new THREE.MeshLambertMaterial({ color: "#2E9C93" }), matOscuro = new THREE.MeshLambertMaterial({ color: "#1F4E50" });
  const matHalo = new THREE.MeshBasicMaterial({ color: "#91CEC4", transparent: true, opacity: .45, depthWrite: false });
  function grua() {
    const g = new THREE.Group(), pieza = (w, h, d, x, y, z, m) => { const p = new THREE.Mesh(caja1, m); p.scale.set(w, h, d); p.position.set(x, y, z); p.castShadow = true; g.add(p); return p; };
    pieza(1.1, .55, .8, 0, .42, 0, matCuerpo); pieza(.5, .5, .7, -.25, .95, 0, matCuerpo);
    pieza(.06, .7, .06, .1, .95, .3, matOscuro); pieza(.06, .7, .06, .1, .95, -.3, matOscuro); pieza(.5, .05, .7, -.05, 1.3, 0, matOscuro);
    pieza(.08, 1.7, .6, .62, .85, 0, matOscuro); pieza(.7, .05, .14, 1, .12, .2, matOscuro); pieza(.7, .05, .14, 1, .12, -.2, matOscuro);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), matHalo); halo.rotation.x = -Math.PI / 2; halo.position.set(1.1, .02, 0); g.add(halo);
    g.scale.setScalar(1.35);
    return g;
  }
  const pasillos = FILAS.slice(0, -1).map((z, i) => (z + FILAS[i + 1]) / 2);
  const gruas = [];
  pasillos.forEach((z, i) => { for (let t = -1; t <= 2; t++) { const g = grua(); escena.add(g); gruas.push({ g, z, t, vel: .9 + azar(i) * .5, fase: azar(i + 9) }); } });

  // ── la cámara isométrica avanza por la planta ──
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 400);
  const DIR = new THREE.Vector3(1, 1.05, 1.15).normalize();
  function medir() {
    const w = caja.clientWidth, h = caja.clientHeight; r.setSize(w, h, false);
    // en el celular la planta se ve en la mitad de arriba, sobre el texto
    const vert = w / h < .9, vista = vert ? 21 : 17, asp = w / h;
    Object.assign(cam, { left: -vista * asp, right: vista * asp, top: vista * (vert ? .55 : 1), bottom: -vista * (vert ? 1.45 : 1) }); cam.updateProjectionMatrix();
  }
  medir(); addEventListener("resize", medir);

  const t0 = performance.now();
  function cuadro(ahora = performance.now()) {
    const t = (ahora - t0) / 1000, x = (t * .55) % P;
    const foco = new THREE.Vector3(x + 6, 0, -1);
    cam.position.copy(foco).addScaledVector(DIR, 80); cam.lookAt(foco);
    sol.position.copy(foco).add(new THREE.Vector3(-14, 30, 12)); sol.target.position.copy(foco);
    // grúas: van y vuelven por su pasillo, frenando en los extremos
    for (const q of gruas) {
      const u = (t * q.vel / (P * .8) + q.fase) % 2, ida = u < 1, s = ida ? u : 2 - u, e = s * s * (3 - 2 * s);
      q.g.position.set(1 + e * (P - 4) + q.t * P, 0, q.z + (ida ? .45 : -.45));
      q.g.rotation.y = ida ? 0 : Math.PI;
    }
    // bahías: cada vidrio se enciende, se sostiene y se apaga; luego salta a otra bahía
    for (const s of scans) {
      const ciclo = t / 3.2 + s.fase * 3.2, vez = Math.floor(ciclo), f = ciclo - vez;
      if (vez !== s.vez) { s.vez = vez; moverScan(s, vez); }
      s.m.material.opacity = (f < .15 ? f / .15 : f < .55 ? 1 : Math.max(0, 1 - (f - .55) / .3)) * .42;
    }
    r.render(escena, cam);
  }

  if (QUIETO) { cuadro(t0 + 8000); return; }
  let vivo = false, previo = 0;
  const bucle = (ahora) => { if (!vivo) return; requestAnimationFrame(bucle); if (movil && ahora - previo < 30) return; previo = ahora; cuadro(ahora); };
  alVer(caja, () => { if (!vivo) { vivo = true; requestAnimationFrame(bucle); } }, () => (vivo = false), 0);
  cuadro();
}
