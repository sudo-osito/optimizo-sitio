// Optimizo · vidrio líquido sobre el agua. Un solo pase WebGL: el agua (video o imagen) se gradúa hacia la paleta de Optimizo,
// se ondula donde cae el punto, y cada forma de vidrio la refracta: borde que dobla la luz, aberración leve, brillo especular y sombra suave.
// Las formas se funden entre sí (unión suave), como gotas.

const V = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }";
const F = `precision highp float;
uniform sampler2D uTex; uniform vec2 uRes, uImg; uniform float uDpr, uK, uT;
uniform vec4 uF[10]; uniform vec4 uG[10]; uniform int uN;
uniform vec4 uOnda; // x, y, tiempo desde que cayó, fuerza
uniform float uBlanco, uVert; // velo blanco donde va el titular (abajo a la izquierda, o abajo en vertical)
float sdCaja(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
float escena(vec2 p){
  float d = 1e5;
  for (int i = 0; i < 10; i++) {
    if (i >= uN) break;
    vec4 f = uF[i], g = uG[i]; vec2 q = p - f.xy; float e;
    if (g.y < .5) e = sdCaja(q, f.zw, g.x);           // píldora o caja redondeada
    else if (g.y < 1.5) e = length(q) - f.z;          // círculo
    else { d = max(d, -(length(q) - f.z)); continue; } // agujero (el ojo del isotipo)
    d = smin(d, e, uK * g.z + .001);
  }
  return d;
}
vec2 cubrir(vec2 uv){ float ar = uRes.x / uRes.y, ai = uImg.x / uImg.y; vec2 s = ar > ai ? vec2(1., ai / ar) : vec2(ar / ai, 1.); return (uv - .5) * s + .5; }
vec3 agua(vec2 uv){
  vec3 c = texture2D(uTex, cubrir(uv)).rgb;
  float l = dot(c, vec3(.299, .587, .114));
  c = mix(vec3(l), c, 1.15);                    // turquesa más limpio
  c = c * vec3(.9, 1.03, 1.02);                 // hacia el menta de Optimizo
  c = pow(c, vec3(.78)) * .82 + .2;             // luminosa y aireada, estilo Tahoe
  return c;
}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr, res = uRes / uDpr;
  vec2 uv = px / res;
  // onda: anillos que se abren desde donde cae el punto
  vec2 dq = px - uOnda.xy; float r = length(dq), frente = uOnda.z * 520.;
  float anillo = sin((r - frente) * .045) * exp(-abs(r - frente) * .012) * exp(-uOnda.z * .9) * uOnda.w * step(.001, uOnda.z);
  vec2 uvA = uv + normalize(dq + 1e-4) * anillo * .006;
  float d = escena(px);
  vec3 col = agua(uvA);
  // sombra suave del vidrio sobre el agua
  float ds = escena(px - vec2(0., 14.));
  col *= 1. - .16 * exp(-max(ds, 0.) / 26.) * step(0., d);
  if (d < 1.5) {
    vec2 e = vec2(1., 0.);
    vec2 n = normalize(vec2(escena(px + e.xy) - escena(px - e.xy), escena(px + e.yx) - escena(px - e.yx)) + 1e-5);
    float h = clamp(-d / 26., 0., 1.);              // 0 en el borde, 1 adentro
    float lente = pow(1. - h, 2.2);
    vec2 off = -n * lente * 46. / res;               // el borde dobla la luz hacia adentro
    vec3 v;
    v.r = agua(uvA + off * 1.08).r; v.g = agua(uvA + off).g; v.b = agua(uvA + off * .92).b;
    // un poco esmerilado: promedio de muestras alrededor
    vec3 suma = v; float w = 1.;
    for (int k = 0; k < 8; k++) { float a = float(k) * .785; vec2 o = vec2(cos(a), sin(a)) * 3.5 / res; suma += agua(uvA + off + o); w += 1.; }
    v = mix(v, suma / w, .22);
    v = mix(v, vec3(1.), .07 + .07 * h);             // cuerpo blanco del vidrio
    v *= 1.04 + .05 * (1. - h);
    float luz = pow(max(dot(n, normalize(vec2(-.6, -.8))), 0.), 3.) * (1. - h);
    float borde = smoothstep(2.2, 0., abs(d + 1.2));
    v += vec3(1.) * (luz * .85 + borde * .55);
    float cima = smoothstep(.0, 1., -n.y) * pow(1. - h, 4.); v += vec3(.25) * cima;
    v -= vec3(.05) * smoothstep(.0, .4, h) * (1. - smoothstep(.4, 1., h)) * max(dot(n, vec2(.6, .8)), 0.);
    col = mix(col, v, smoothstep(1.2, -1.2, d));
  }
  // velo blanco que nace abajo a la izquierda (el titular se lee sobre agua clara)
  float velo = mix(smoothstep(1.05, .05, length((uv - vec2(-.05, 1.05)) * vec2(.8, 1.2))), smoothstep(.34, .62, uv.y) * .94, uVert);
  col = mix(col, vec3(1.), velo * uBlanco);
  col = mix(col, vec3(1.), smoothstep(.72, 1., uv.y) * .55 * uBlanco * (1. - uVert));
  gl_FragColor = vec4(col, 1.);
}`;

export function crearVidrio(cv, fuente) {
  const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, V)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, F)); gl.bindAttribLocation(pr, 0, "p"); gl.linkProgram(pr); gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const U = (n) => gl.getUniformLocation(pr, n);
  return {
    dibujar({ formas = [], k = 18, onda = [0, 0, 0, 0], blanco = 1, dpr = 1, vertical = false }) {
      const w = cv.width, h = cv.height, iw = fuente.videoWidth || fuente.naturalWidth || 1, ih = fuente.videoHeight || fuente.naturalHeight || 1;
      gl.viewport(0, 0, w, h);
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, fuente);
      gl.uniform2f(U("uRes"), w, h); gl.uniform2f(U("uImg"), iw, ih); gl.uniform1f(U("uDpr"), dpr); gl.uniform1f(U("uK"), k);
      const f = new Float32Array(40), g = new Float32Array(40);
      formas.slice(0, 10).forEach((s, i) => { f.set([s.x, s.y, s.w / 2 || s.r || 0, s.h / 2 || 0], i * 4); g.set([s.radio ?? Math.min(s.w, s.h) / 2, s.tipo === "circulo" ? 1 : s.tipo === "agujero" ? 2 : 0, s.funde ?? 1, 0], i * 4); });
      gl.uniform4fv(U("uF"), f); gl.uniform4fv(U("uG"), g); gl.uniform1i(U("uN"), Math.min(10, formas.length));
      gl.uniform4f(U("uOnda"), ...onda); gl.uniform1f(U("uBlanco"), blanco); gl.uniform1f(U("uVert"), vertical ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
