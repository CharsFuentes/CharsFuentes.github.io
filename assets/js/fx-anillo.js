// Anillos de pantallas: dos cilindros 3D en CSS que giran solos, se arrastran con inercia
// y aceleran con el scroll. Cada carta abre su proyecto en la imagen exacta.
window.Anillos = (() => {
  const HUECO = 22, PIE = 34;
  const finoPuntero = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function crear(raiz, filas, { quieto = false } = {}) {
    const anillos = filas.map((items, f) => {
      const cont = document.createElement("div");
      cont.className = "anillo";
      const eje = document.createElement("div");
      eje.className = "anillo__eje";
      eje.innerHTML = items.map((it) => `
        <button class="carta${it.movil ? " carta--movil" : ""}" type="button" tabindex="-1" data-abrir="${it.id}" data-indice="${it.indice}" data-cursor="Abrir">
          <span class="carta__img"><img data-src="${it.src}" alt="" decoding="async" draggable="false"></span>
          <span class="carta__pie">${it.nombre}</span>
        </button>`).join("");
      cont.append(eje);
      raiz.append(cont);
      return { cont, eje, cartas: [...eje.children], items, ang: f * 37, vel: 0, extra: 0, dir: f % 2 ? -1 : 1, radio: 1 };
    });

    function medir() {
      const alto = anillos[0].cont.clientHeight;
      if (!alto) return;
      let mayor = 0;
      anillos.forEach((a) => {
        const anchos = a.items.map((it) => Math.round((alto - PIE) * (it.movil ? 0.47 : 1.6)));
        const total = anchos.reduce((s, w) => s + w + HUECO, 0);
        a.radio = total / (2 * Math.PI);
        mayor = Math.max(mayor, a.radio);
        let acc = 0;
        a.cartas.forEach((c, i) => {
          const w = anchos[i], centro = acc + (w + HUECO) / 2;
          acc += w + HUECO;
          c.style.width = `${w}px`;
          c.style.marginLeft = `${-w / 2}px`;
          c.style.transform = `rotateY(${(centro / total) * 360}deg) translateZ(${a.radio}px)`;
        });
      });
      // Perspectiva tal que el arco visible llene el ancho en pantallas grandes
      const x = raiz.clientWidth * 0.52;
      const p = mayor > x * 1.08 ? Math.min(4000, Math.max(1100, (x * mayor) / (mayor - x))) : 4000;
      raiz.style.perspective = `${Math.round(p)}px`;
      pintar();
    }
    const pintar = () => anillos.forEach((a) => { a.eje.style.transform = `translateZ(${-a.radio}px) rotateY(${a.ang}deg)`; });

    // Bucle: solo corre mientras la sección está en pantalla
    let visible = false, corriendo = false, ultimo = 0, encima = false, arrastre = null, cargadas = false;
    function cuadro(ahora) {
      if (!visible) { corriendo = false; return; }
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      anillos.forEach((a) => {
        const base = quieto ? 0 : (encima || arrastre ? 0.4 : 2.6) * a.dir;
        if (!arrastre) a.ang += (base + a.vel + a.extra) * dt;
        a.vel *= Math.pow(0.04, dt);
        a.extra *= Math.pow(0.02, dt);
      });
      pintar();
      requestAnimationFrame(cuadro);
    }
    const arrancar = () => { if (corriendo || !visible) return; corriendo = true; ultimo = performance.now(); requestAnimationFrame(cuadro); };

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !cargadas) {
        cargadas = true;
        raiz.querySelectorAll("img[data-src]").forEach((img) => { img.src = img.dataset.src; });
      }
      arrancar();
    }, { rootMargin: "500px 0px" }).observe(raiz);

    // Arrastre con inercia
    let suprimir = false;
    raiz.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      arrastre = { id: e.pointerId, x: e.clientX, x0: e.clientX, t: performance.now(), v: 0, movido: false };
    });
    raiz.addEventListener("pointermove", (e) => {
      if (!arrastre || e.pointerId !== arrastre.id) return;
      const dx = e.clientX - arrastre.x, ahora = performance.now();
      if (!arrastre.movido && Math.abs(e.clientX - arrastre.x0) > 6) {
        arrastre.movido = true;
        raiz.classList.add("arrastrando");
        try { raiz.setPointerCapture(e.pointerId); } catch {}
      }
      if (!arrastre.movido) return;
      anillos.forEach((a) => {
        const grados = (dx / a.radio) * (180 / Math.PI);
        a.ang += grados;
        const dt = Math.max((ahora - arrastre.t) / 1000, 0.001);
        a.vel = a.vel * 0.6 + (grados / dt) * 0.4;
      });
      arrastre.x = e.clientX;
      arrastre.t = ahora;
    });
    const soltar = (e) => {
      if (!arrastre || (e && e.pointerId !== arrastre.id)) return;
      if (arrastre.movido) {
        suprimir = true;
        setTimeout(() => { suprimir = false; }, 0);
        if (performance.now() - arrastre.t > 120) anillos.forEach((a) => { a.vel = 0; });
        anillos.forEach((a) => { a.vel = Math.max(-220, Math.min(220, a.vel)); });
      }
      raiz.classList.remove("arrastrando");
      arrastre = null;
    };
    raiz.addEventListener("pointerup", soltar);
    raiz.addEventListener("pointercancel", soltar);
    raiz.addEventListener("click", (e) => { if (suprimir) { e.stopPropagation(); e.preventDefault(); } }, true);
    if (finoPuntero) {
      raiz.addEventListener("pointerenter", () => { encima = true; });
      raiz.addEventListener("pointerleave", () => { encima = false; });
    }

    let espera = 0;
    new ResizeObserver(() => { clearTimeout(espera); espera = setTimeout(medir, 120); }).observe(raiz);
    medir();

    return {
      // El scroll empuja los anillos en sentidos opuestos (velocidad en px/s)
      empujar(velocidad) { anillos.forEach((a) => { a.extra = Math.max(-90, Math.min(90, velocidad * 0.022)) * a.dir; }); },
    };
  }

  return { crear };
})();
