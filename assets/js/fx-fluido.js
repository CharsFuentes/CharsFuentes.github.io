// Campo térmico: simulación de fluido (método "stable fluids") pintada como un mapa de isotermas.
// El puntero inyecta calor; el calor sube, se arremolina y se enfría. Sin dependencias: WebGL2 puro.
window.Fluido = (() => {
  let gl, lienzo, vel, tinta, pres, div, rot;
  const prog = {};
  let activo = false, fuerza = 0, fuerzaMeta = 0, ambiente = false, paleta = 0, claro = 0, ultimo = 0, ultimaEntrada = 0;
  const cola = [];      // salpicaduras pendientes: {x, y, vx, vy, calor, radio}
  const cometas = [];   // emisores que cruzan la pantalla durante un tiempo
  const punt = { x: null, y: null };
  let proximoCometa = 0, muestras = 0, sumaDt = 0, nivel = 0, medirDesde = performance.now() + 4000;
  const chico = matchMedia("(max-width: 900px)").matches;
  const CFG = { sim: chico ? 96 : 128, tinta: chico ? 384 : 512, presion: chico ? 14 : 20, rizo: 22, boya: 16, disipaVel: 0.5, disipaTinta: 1.05, relleno: chico ? 0.45 : 1, emision: chico ? 0.55 : 1 };

  const VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0); vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y); vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;
  const CAB = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`;
  const FS = {
    salpica: `uniform sampler2D uBase; uniform float uAspecto; uniform vec3 uValor; uniform vec2 uPunto; uniform float uRadio;
void main() { vec2 p = vUv - uPunto; p.x *= uAspecto; o = vec4(texture(uBase, vUv).xyz + exp(-dot(p, p) / uRadio) * uValor, 1.0); }`,
    adveccion: `uniform sampler2D uVel; uniform sampler2D uFuente; uniform vec2 uTexelVel; uniform float uDt; uniform float uDisipa;
void main() { vec2 c = vUv - uDt * texture(uVel, vUv).xy * uTexelVel; o = texture(uFuente, c) / (1.0 + uDisipa * uDt); }`,
    rotacional: `uniform sampler2D uVel;
void main() { o = vec4(0.5 * (texture(uVel, vR).y - texture(uVel, vL).y - texture(uVel, vT).x + texture(uVel, vB).x), 0.0, 0.0, 1.0); }`,
    vorticidad: `uniform sampler2D uVel; uniform sampler2D uRot; uniform sampler2D uTinta; uniform float uRizo; uniform float uBoya; uniform float uDt;
void main() {
  float L = texture(uRot, vL).x, R = texture(uRot, vR).x, T = texture(uRot, vT).x, B = texture(uRot, vB).x, C = texture(uRot, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f = f / (length(f) + 0.0001) * uRizo * C; f.y *= -1.0;
  vec2 v = texture(uVel, vUv).xy + f * uDt;
  v.y += uBoya * texture(uTinta, vUv).r * uDt;
  o = vec4(clamp(v, -1200.0, 1200.0), 0.0, 1.0);
}`,
    divergencia: `uniform sampler2D uVel;
void main() {
  float L = texture(uVel, vL).x, R = texture(uVel, vR).x, T = texture(uVel, vT).y, B = texture(uVel, vB).y;
  vec2 C = texture(uVel, vUv).xy;
  if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x; if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
    atenua: `uniform sampler2D uBase; uniform float uFactor;
void main() { o = uFactor * texture(uBase, vUv); }`,
    presion: `uniform sampler2D uPres; uniform sampler2D uDiv;
void main() { o = vec4((texture(uPres, vL).x + texture(uPres, vR).x + texture(uPres, vT).x + texture(uPres, vB).x - texture(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0); }`,
    gradiente: `uniform sampler2D uPres; uniform sampler2D uVel;
void main() { o = vec4(texture(uVel, vUv).xy - vec2(texture(uPres, vR).x - texture(uPres, vL).x, texture(uPres, vT).x - texture(uPres, vB).x), 0.0, 1.0); }`,
    pinta: `uniform sampler2D uTinta; uniform float uClaro; uniform float uFuerza; uniform float uPaleta; uniform float uTiempo; uniform float uRelleno;
float ruido(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 brasa(float t) {
  vec3 a = mix(vec3(0.40, 0.07, 0.02), vec3(0.99, 0.76, 0.62), uClaro);
  vec3 b = mix(vec3(0.937, 0.42, 0.227), vec3(0.86, 0.36, 0.14), uClaro);
  vec3 c = mix(vec3(1.0, 0.80, 0.50), vec3(0.60, 0.17, 0.05), uClaro);
  return mix(mix(a, b, smoothstep(0.0, 0.5, t)), c, smoothstep(0.5, 1.0, t));
}
vec3 clasico(float t) {
  vec3 c = mix(vec3(0.14, 0.24, 0.95), vec3(0.0, 0.80, 0.90), smoothstep(0.0, 0.25, t));
  c = mix(c, vec3(0.20, 0.85, 0.30), smoothstep(0.25, 0.5, t));
  c = mix(c, vec3(1.0, 0.90, 0.10), smoothstep(0.5, 0.75, t));
  return mix(c, vec3(1.0, 0.20, 0.10), smoothstep(0.75, 1.0, t));
}
void main() {
  float t = 1.0 - exp(-1.5 * texture(uTinta, vUv).r);
  vec3 col = mix(brasa(t), clasico(t), uPaleta);
  float a = smoothstep(0.012, 0.85, t) * 0.58 * uRelleno;
  // Isotermas: curvas de nivel de ancho constante en pantalla
  float n = t * 10.0;
  float w = fwidth(n);
  float d = abs(fract(n - 0.5) - 0.5) / max(w, 0.0001);
  float linea = (1.0 - smoothstep(0.5, 1.5, d)) * smoothstep(0.03, 0.14, t) * smoothstep(0.0006, 0.004, w);
  vec3 trazo = mix(mix(vec3(1.0, 0.88, 0.74), vec3(0.42, 0.11, 0.03), uClaro), vec3(1.0), uPaleta * (1.0 - uClaro));
  col = mix(col, trazo, linea * 0.8);
  a = (max(a, linea * 0.6) + (ruido(gl_FragCoord.xy + uTiempo) - 0.5) * 0.012) * uFuerza;
  a = clamp(a, 0.0, 1.0);
  o = vec4(col * a, a);
}`,
  };

  function compilar(tipo, fuente) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function programa(vs, fuente) {
    const h = gl.createProgram();
    gl.attachShader(h, vs);
    gl.attachShader(h, compilar(gl.FRAGMENT_SHADER, CAB + fuente));
    gl.linkProgram(h);
    if (!gl.getProgramParameter(h, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(h));
    const u = {};
    const n = gl.getProgramParameter(h, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nombre = gl.getActiveUniform(h, i).name; u[nombre] = gl.getUniformLocation(h, nombre); }
    return { h, u };
  }
  function crearFbo(w, h, filtro) {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo incompleto");
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h };
  }
  function doble(w, h, filtro) {
    let a = crearFbo(w, h, filtro), b = crearFbo(w, h, filtro);
    return { get lee() { return a; }, get escribe() { return b; }, cambia() { const t = a; a = b; b = t; }, w, h };
  }
  const usar = (p, t) => { gl.useProgram(p.h); if (p.u.uTexel) gl.uniform2f(p.u.uTexel, 1 / t.w, 1 / t.h); return p.u; };
  const tex = (unidad, t) => { gl.activeTexture(gl.TEXTURE0 + unidad); gl.bindTexture(gl.TEXTURE_2D, t.tex); return unidad; };
  const pegar = (destino) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, destino ? destino.fbo : null);
    gl.viewport(0, 0, destino ? destino.w : lienzo.width, destino ? destino.h : lienzo.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  function tamanos() {
    const escala = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.max(2, Math.round(innerWidth * escala)), h = Math.max(2, Math.round(innerHeight * escala));
    if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
    const asp = w / h;
    const res = (base) => (asp >= 1 ? [Math.round(base * asp), base] : [base, Math.round(base / asp)]);
    const [sw, sh] = res(CFG.sim), [tw, th] = res(CFG.tinta);
    if (vel && vel.w === sw && vel.h === sh) return;
    vel = doble(sw, sh, gl.LINEAR);
    tinta = doble(tw, th, gl.LINEAR);
    pres = doble(sw, sh, gl.NEAREST);
    div = crearFbo(sw, sh, gl.NEAREST);
    rot = crearFbo(sw, sh, gl.NEAREST);
  }

  function salpicar(s) {
    const asp = lienzo.width / lienzo.height;
    let u = usar(prog.salpica, vel);
    gl.uniform1i(u.uBase, tex(0, vel.lee));
    gl.uniform1f(u.uAspecto, asp);
    gl.uniform2f(u.uPunto, s.x, s.y);
    gl.uniform3f(u.uValor, s.vx, s.vy, 0);
    gl.uniform1f(u.uRadio, s.radio);
    pegar(vel.escribe); vel.cambia();
    u = usar(prog.salpica, tinta);
    gl.uniform1i(u.uBase, tex(0, tinta.lee));
    gl.uniform3f(u.uValor, s.calor, 0, 0);
    pegar(tinta.escribe); tinta.cambia();
  }

  function paso(dt, ahora) {
    const t = ahora / 1000;
    if (ambiente) {
      // En reposo, cada tanto cruza un cometa para que la escena nunca quede quieta
      if (ahora > proximoCometa) {
        if (proximoCometa) {
          const izq = Math.random() < 0.5;
          cometas.push({ t0: ahora, dur: 1500, x0: izq ? -0.08 : 1.08, y0: 0.12 + Math.random() * 0.4, x1: izq ? 1.08 : -0.08, y1: 0.35 + Math.random() * 0.45, arco: (Math.random() - 0.5) * 0.24, empuje: 1700, calor: 7, radio: 0.0026 });
        }
        proximoCometa = ahora + 7000 + Math.random() * 6000;
      }
      for (let i = 0; i < 2; i++) {
        const f = i * 2.6 + 0.4;
        cola.push({
          x: 0.56 + 0.34 * Math.sin(t * 0.19 + f) + 0.08 * Math.sin(t * 0.47 + f * 2.0),
          y: 0.06 + 0.05 * Math.sin(t * 0.33 + f),
          vx: Math.sin(t * 0.7 + f) * 160 * dt, vy: 300 * dt, calor: 1.5 * CFG.emision * dt, radio: 0.0026,
        });
      }
    }
    for (let i = cometas.length - 1; i >= 0; i--) {
      const c = cometas[i], p = (ahora - c.t0) / c.dur;
      if (p >= 1) { cometas.splice(i, 1); continue; }
      if (p < 0) continue;
      const e = p * p * (3 - 2 * p);
      const x = c.x0 + (c.x1 - c.x0) * e, y = c.y0 + (c.y1 - c.y0) * e + Math.sin(p * Math.PI) * c.arco;
      cola.push({ x, y, vx: (c.x1 - c.x0) * c.empuje * dt, vy: (c.y1 - c.y0) * c.empuje * dt, calor: c.calor * CFG.emision * Math.min(1, lienzo.width / lienzo.height) * dt, radio: c.radio });
    }
    while (cola.length) salpicar(cola.shift());

    let u = usar(prog.rotacional, vel);
    gl.uniform1i(u.uVel, tex(0, vel.lee));
    pegar(rot);

    u = usar(prog.vorticidad, vel);
    gl.uniform1i(u.uVel, tex(0, vel.lee));
    gl.uniform1i(u.uRot, tex(1, rot));
    gl.uniform1i(u.uTinta, tex(2, tinta.lee));
    gl.uniform1f(u.uRizo, CFG.rizo);
    gl.uniform1f(u.uBoya, CFG.boya);
    gl.uniform1f(u.uDt, dt);
    pegar(vel.escribe); vel.cambia();

    u = usar(prog.divergencia, vel);
    gl.uniform1i(u.uVel, tex(0, vel.lee));
    pegar(div);

    u = usar(prog.atenua, pres);
    gl.uniform1i(u.uBase, tex(0, pres.lee));
    gl.uniform1f(u.uFactor, 0.8);
    pegar(pres.escribe); pres.cambia();

    u = usar(prog.presion, pres);
    gl.uniform1i(u.uDiv, tex(0, div));
    for (let i = 0; i < CFG.presion; i++) {
      gl.uniform1i(u.uPres, tex(1, pres.lee));
      pegar(pres.escribe); pres.cambia();
    }

    u = usar(prog.gradiente, vel);
    gl.uniform1i(u.uPres, tex(0, pres.lee));
    gl.uniform1i(u.uVel, tex(1, vel.lee));
    pegar(vel.escribe); vel.cambia();

    u = usar(prog.adveccion, vel);
    gl.uniform2f(u.uTexelVel, 1 / vel.w, 1 / vel.h);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1i(u.uVel, tex(0, vel.lee));
    gl.uniform1i(u.uFuente, tex(0, vel.lee));
    gl.uniform1f(u.uDisipa, CFG.disipaVel);
    pegar(vel.escribe); vel.cambia();

    gl.uniform1i(u.uVel, tex(0, vel.lee));
    gl.uniform1i(u.uFuente, tex(1, tinta.lee));
    gl.uniform1f(u.uDisipa, CFG.disipaTinta);
    pegar(tinta.escribe); tinta.cambia();
  }

  function pintar(ahora) {
    const u = usar(prog.pinta, tinta);
    gl.uniform1i(u.uTinta, tex(0, tinta.lee));
    gl.uniform1f(u.uClaro, claro);
    gl.uniform1f(u.uFuerza, fuerza);
    gl.uniform1f(u.uPaleta, paleta);
    gl.uniform1f(u.uRelleno, CFG.relleno);
    gl.uniform1f(u.uTiempo, (ahora % 1000) / 1000);
    pegar(null);
  }

  function cuadro(ahora) {
    if (!activo) return;
    const crudo = (ahora - ultimo) / 1000;
    const dt = Math.min(Math.max(crudo, 0.001), 1 / 30);
    ultimo = ahora;
    // Calidad adaptable: si el equipo no llega a 30 cuadros por segundo, baja la resolución y luego se apaga
    if (ahora > medirDesde && crudo < 0.25) {
      sumaDt += crudo;
      if (++muestras === 120) {
        if (sumaDt / 120 > 0.034) degradar();
        muestras = 0; sumaDt = 0;
      }
    }
    fuerza += (fuerzaMeta - fuerza) * Math.min(1, dt * 3.5);
    const dormido = !ambiente && !cometas.length && ahora - ultimaEntrada > 7000;
    if ((fuerzaMeta <= 0.001 && fuerza < 0.01) || dormido) {
      activo = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    paso(dt, ahora);
    pintar(ahora);
    requestAnimationFrame(cuadro);
  }
  function degradar() {
    nivel++;
    medirDesde = performance.now() + 2000;
    if (nivel === 1) { CFG.sim = 64; CFG.tinta = 256; CFG.presion = 10; vel = null; tamanos(); return; }
    fuerzaMeta = 0; fuerza = 0;
    lienzo.style.display = "none";
  }
  function despertar() {
    if (!gl || activo || fuerzaMeta <= 0.001) return;
    activo = true;
    ultimo = performance.now();
    requestAnimationFrame(cuadro);
  }

  function mover(cx, cy) {
    if (!gl || fuerzaMeta <= 0.001) return;
    const x = cx / innerWidth, y = 1 - cy / innerHeight;
    if (punt.x !== null) {
      const dx = x - punt.x, dy = y - punt.y, v = Math.hypot(dx, dy);
      if (v > 0.0004 && v < 0.4) {
        if (cola.length > 10) cola.shift();
        cola.push({ x, y, vx: dx * vel.w * 6, vy: dy * vel.h * 6, calor: Math.min(0.5, v * 11), radio: 0.002 });
      }
    }
    punt.x = x; punt.y = y;
    ultimaEntrada = performance.now();
    despertar();
  }

  return {
    iniciar(elemento) {
      lienzo = elemento;
      try {
        gl = lienzo.getContext("webgl2", { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true });
        if (!gl || !gl.getExtension("EXT_color_buffer_float")) throw new Error("sin soporte");
        const vs = compilar(gl.VERTEX_SHADER, VS);
        for (const k in FS) prog[k] = programa(vs, FS[k]);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.disable(gl.BLEND);
        tamanos();
      } catch (e) {
        gl = null;
        return false;
      }
      this.tema();
      let espera = 0;
      addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(() => { if (gl) { tamanos(); despertar(); } }, 200); });
      addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") mover(e.clientX, e.clientY); }, { passive: true });
      addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) mover(t.clientX, t.clientY); }, { passive: true });
      addEventListener("touchend", () => { punt.x = null; }, { passive: true });
      lienzo.addEventListener("webglcontextlost", (e) => { e.preventDefault(); activo = false; gl = null; lienzo.style.display = "none"; });
      return true;
    },
    // fuerza: opacidad general (0 a 1). ambiente: emisores propios encendidos.
    modo(opciones) {
      if (!gl) return;
      if (opciones.fuerza !== undefined) fuerzaMeta = nivel > 1 ? 0 : opciones.fuerza;
      if (opciones.ambiente !== undefined) ambiente = opciones.ambiente;
      ultimaEntrada = performance.now();
      despertar();
    },
    tema() { claro = document.documentElement.dataset.tema === "claro" ? 1 : 0; despertar(); },
    paleta(valor) { paleta = valor === undefined ? 1 - paleta : valor; ultimaEntrada = performance.now(); despertar(); return paleta; },
    // Cometa que cruza la pantalla dejando una estela de calor
    barrido(retraso = 0) {
      if (!gl) return;
      const t0 = performance.now() + retraso;
      cometas.push({ t0, dur: 1100, x0: -0.08, y0: 0.16, x1: 1.08, y1: 0.62, arco: 0.16, empuje: 2400, calor: 13, radio: 0.003 });
      cometas.push({ t0: t0 + 260, dur: 1200, x0: 1.08, y0: 0.05, x1: 0.3, y1: 0.4, arco: -0.08, empuje: 2000, calor: 8, radio: 0.0024 });
      ultimaEntrada = t0 + 2000;
      despertar();
    },
    // Estallido radial en un punto de la pantalla (coordenadas de cliente)
    estallido(cx, cy, potencia = 1) {
      if (!gl || fuerzaMeta <= 0.001) return;
      const x = cx / innerWidth, y = 1 - cy / innerHeight, n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        cola.push({ x: x + Math.cos(a) * 0.012, y: y + Math.sin(a) * 0.012, vx: Math.cos(a) * 150 * potencia, vy: Math.sin(a) * 150 * potencia, calor: 0.16 * potencia, radio: 0.0014 });
      }
      cola.push({ x, y, vx: 0, vy: 0, calor: 0.45 * potencia, radio: 0.003 });
      ultimaEntrada = performance.now();
      despertar();
    },
    get disponible() { return !!gl; },
  };
})();
