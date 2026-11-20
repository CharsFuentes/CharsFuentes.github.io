(() => {
  const P = window.PERFIL;
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const chips = (lista) => lista.map((s) => `<span class="chip">${escapar(s)}</span>`).join("");
  const ruta = (archivo) => `${IMG}/${archivo}`;
  const vistas = (n) => `${n} ${n === 1 ? "vista" : "vistas"}`;
  const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  const raiz = document.documentElement;
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const punteroFino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hayGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const animar = hayGsap && !reducir;
  const transiciones = !!document.startViewTransition && !reducir;
  if (animar) raiz.classList.add("anima");
  else raiz.classList.remove("intro");
  let lenis = null;

  /* ---------- Contenido ---------- */

  const enlaces = { whatsapp: `https://wa.me/${P.whatsapp}`, linkedin: P.linkedin, github: P.github };
  $$("[data-enlace]").forEach((a) => (a.href = enlaces[a.dataset.enlace]));
  $("#correo-texto").textContent = P.correo;
  $("#anio").textContent = new Date().getFullYear();

  // Cinta de logos (dos copias para el bucle continuo)
  const logo = (l) => `<span class="cinta__logo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${l.d}"/></svg>${escapar(l.nombre)}</span>`;
  const grupo = window.LOGOS.map(logo).join("");
  $("#cinta").innerHTML = grupo + `<span style="display:contents" aria-hidden="true">${grupo}</span>`;

  const destacados = window.PROYECTOS.filter((p) => p.destacado);
  const resto = window.PROYECTOS.filter((p) => !p.destacado);

  // Destacados (panel horizontal)
  $("#pista").innerHTML = destacados.map((p) => {
    const media = p.portadaMovil
      ? `<button class="panel__media panel__media--movil" type="button" data-abrir="${p.id}" data-cursor="Ver" aria-label="Ver pantallas de ${escapar(p.nombre)}">${p.imagenes.slice(0, 3).map(([s]) => `<img src="${ruta(s)}" alt="" loading="lazy">`).join("")}</button>`
      : `<button class="panel__media" type="button" data-abrir="${p.id}" data-cursor="Ver" aria-label="Ver pantallas de ${escapar(p.nombre)}"><img src="${ruta(p.imagenes[0][0])}" alt="${escapar(p.imagenes[0][1])}" loading="lazy"></button>`;
    const vivo = p.enlaces[0];
    return `
      <article class="panel" data-nombre="${escapar(p.nombre)}">
        ${media}
        <div class="panel__info">
          <span class="panel__estado"><i class="ph ph-check-circle" aria-hidden="true"></i>${escapar(p.estado)}</span>
          <h3>${escapar(p.nombre)}</h3>
          <p class="panel__sub">${escapar(p.subtitulo)}</p>
          <p>${escapar(p.resumen)}</p>
          <span class="panel__meta">${escapar(p.rol)}. ${escapar(p.cliente)}.</span>
          <div class="chips">${chips(p.stack.slice(0, 6))}</div>
          <div class="panel__acciones">
            <button class="boton magnetico" type="button" data-abrir="${p.id}">Ver pantallas <i class="ph ph-images" aria-hidden="true"></i></button>
            ${vivo ? `<a class="boton boton--fantasma magnetico" href="${vivo.url}" target="_blank" rel="noopener">${escapar(vivo.texto)} <i class="ph ph-arrow-up-right" aria-hidden="true"></i></a>` : ""}
          </div>
        </div>
      </article>`;
  }).join("");

  // Mosaico
  $("#mosaico").innerHTML = resto.map((p) => `
    <button class="tile luz" type="button" data-abrir="${p.id}" data-cursor="Ver" data-revelar-lote aria-label="Ver detalle de ${escapar(p.nombre)}">
      <div class="tile__img"><img src="${ruta(p.imagenes[0][0])}" alt="${escapar(p.imagenes[0][1])}" loading="lazy"></div>
      <div class="tile__cuerpo">
        <div class="tile__fila"><h3>${escapar(p.nombre)}</h3><span class="tile__vistas">${vistas(p.imagenes.length)} <i class="ph ph-arrow-up-right" aria-hidden="true"></i></span></div>
        <p>${escapar(p.subtitulo)}. ${escapar(p.estado)}.</p>
      </div>
    </button>`).join("");

  // Otros proyectos
  $("#otros").innerHTML = window.OTROS.map((o) => `
    <article class="otro luz">
      <span class="otro__icono"><i class="ph ${o.icono || "ph-code"}" aria-hidden="true"></i></span>
      <span class="otro__etiqueta">${escapar(o.etiqueta)}</span>
      <h3>${escapar(o.nombre)}</h3>
      <p>${escapar(o.texto)}</p>
      <div class="chips">${chips(o.stack)}</div>
      ${o.url ? `<a href="${o.url}" target="_blank" rel="noopener">Ver <i class="ph ph-arrow-up-right" aria-hidden="true"></i></a>` : ""}
    </article>`).join("");

  // Experiencia
  $("#linea").insertAdjacentHTML("beforeend", window.EXPERIENCIA.map((e) => `
    <li data-revelar-lote>
      <span class="linea__periodo">${escapar(e.periodo)}</span>
      <h3>${escapar(e.cargo)}</h3>
      <div class="linea__lugar">${escapar(e.lugar)}</div>
      <ul>${e.puntos.map((x) => `<li>${escapar(x)}</li>`).join("")}</ul>
    </li>`).join(""));

  // Tecnologías
  $("#stack-lista").innerHTML = window.STACK.map(([g, items]) => `
    <div data-revelar-lote><h3>${escapar(g)}</h3><ul>${items.map((i) => `<li>${escapar(i)}</li>`).join("")}</ul></div>`).join("");

  // Anillos: hasta cuatro pantallas por proyecto, intercaladas para que no se repitan vecinas
  const esMovil = (src) => /^zivo\/|movil|bienvenida|dato-delicado/.test(src);
  const descartar = /arquitectura|flujo|portada|login|registro|qr-sala/;
  const porProyecto = window.PROYECTOS.map((p) => p.imagenes
    .map(([src, alt], indice) => ({ src: ruta(src), alt, indice, id: p.id, nombre: escapar(p.nombre), movil: esMovil(src), clave: src }))
    .filter((it) => !descartar.test(it.clave)));
  const tope = innerWidth < 700 ? 28 : 40;
  const elegidas = [];
  for (let ronda = 0; ronda < 5; ronda++) for (const lista of porProyecto) if (lista[ronda] && elegidas.length < tope) elegidas.push(lista[ronda]);
  $("#anillo-total").textContent = elegidas.length;
  const anillos = window.Anillos.crear($("#anillos"), [elegidas.filter((_, i) => i % 2 === 0), elegidas.filter((_, i) => i % 2 === 1)], { quieto: reducir });

  /* ---------- Fluido de calor ---------- */
  const F = window.Fluido;
  const hayFluido = animar && F.iniciar($("#fluido"));
  if (!hayFluido) $("#fluido").hidden = true;
  const modoBajo = { fuerza: punteroFino ? 0.38 : 0, ambiente: false };
  const modoAlto = { fuerza: innerWidth < 700 ? 0.8 : 1, ambiente: true };
  let modoActual = modoAlto;
  const fijarModo = (m) => { modoActual = m; if (hayFluido) F.modo(m); };
  fijarModo(modoAlto);
  let vueltaFuego = 0;
  function fuego() {
    if (!hayFluido) return;
    F.modo({ fuerza: 1 });
    F.barrido();
    for (let i = 0; i < 6; i++) setTimeout(() => F.estallido(innerWidth * (0.12 + Math.random() * 0.76), innerHeight * (0.15 + Math.random() * 0.7), 1.5), i * 170);
    clearTimeout(vueltaFuego);
    vueltaFuego = setTimeout(() => F.modo(modoActual), 6000);
  }

  /* ---------- Bloqueo de scroll y navegación interna ---------- */
  const bloquear = (si) => { if (lenis) si ? lenis.stop() : lenis.start(); else raiz.style.overflow = si ? "hidden" : ""; };
  function ir(sel) {
    const el = $(sel);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.5 });
    else el.scrollIntoView({ behavior: reducir ? "auto" : "smooth" });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2 || !$(a.getAttribute("href"))) return;
    e.preventDefault();
    ir(a.getAttribute("href"));
  });

  /* ---------- Tema con revelado circular ---------- */
  const botonTema = $("#tema");
  const pintarIconoTema = () => {
    const oscuro = raiz.dataset.tema === "oscuro";
    botonTema.innerHTML = `<i class="ph ${oscuro ? "ph-sun" : "ph-moon-stars"}" aria-hidden="true"></i>`;
    $('meta[name="theme-color"]').content = oscuro ? "#0d0e10" : "#f4f4f5";
  };
  pintarIconoTema();
  function aplicarTema(valor) {
    raiz.dataset.tema = valor;
    try { localStorage.setItem("tema", valor); } catch {}
    pintarIconoTema();
    if (hayFluido) F.tema();
  }
  function cambiarTema(valor, origen) {
    const nuevo = valor || (raiz.dataset.tema === "oscuro" ? "claro" : "oscuro");
    if (nuevo === raiz.dataset.tema) return nuevo;
    if (!transiciones) { aplicarTema(nuevo); return nuevo; }
    const r = origen ? origen.getBoundingClientRect() : null;
    const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2;
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    raiz.classList.add("vt-tema");
    const vt = document.startViewTransition(() => aplicarTema(nuevo));
    vt.ready.then(() => raiz.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
      { duration: 800, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
    )).catch(() => {});
    vt.finished.finally(() => raiz.classList.remove("vt-tema"));
    return nuevo;
  }
  botonTema.addEventListener("click", () => cambiarTema(undefined, botonTema));

  /* ---------- Copiar correo ---------- */
  const aviso = $("#aviso");
  $("#copiar").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(P.correo);
      aviso.textContent = "Correo copiado";
    } catch {
      location.href = `mailto:${P.correo}`;
      aviso.textContent = "Abriendo tu correo";
    }
    if (hayFluido) F.estallido(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 1.3);
    aviso.classList.add("visible");
    clearTimeout(aviso._t);
    aviso._t = setTimeout(() => aviso.classList.remove("visible"), 1800);
  });

  /* ---------- Carrusel arrastrable ---------- */
  const carrusel = $("#otros");
  const paso = () => (carrusel.firstElementChild?.getBoundingClientRect().width || 320) + 16;
  $("#otros-prev").addEventListener("click", () => carrusel.scrollBy({ left: -paso() * 2, behavior: reducir ? "auto" : "smooth" }));
  $("#otros-next").addEventListener("click", () => carrusel.scrollBy({ left: paso() * 2, behavior: reducir ? "auto" : "smooth" }));
  let arrastre = null;
  carrusel.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    arrastre = { x: e.clientX, inicio: carrusel.scrollLeft, movido: false };
  });
  addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    if (!arrastre.movido && Math.abs(dx) > 5) { arrastre.movido = true; carrusel.classList.add("arrastrando"); }
    if (arrastre.movido) carrusel.scrollLeft = arrastre.inicio - dx;
  });
  addEventListener("pointerup", () => {
    if (!arrastre) return;
    carrusel.classList.remove("arrastrando");
    arrastre = null;
  });

  /* ---------- Luz que sigue al cursor e inclinación 3D ---------- */
  if (punteroFino && !reducir) {
    $$(".luz").forEach((t) => {
      const inclina = t.classList.contains("tile");
      t.addEventListener("pointermove", (e) => {
        const r = t.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        t.style.setProperty("--mx", `${px * 100}%`);
        t.style.setProperty("--my", `${py * 100}%`);
        if (inclina) { t.style.setProperty("--ry", `${(px - 0.5) * 9}deg`); t.style.setProperty("--rx", `${(0.5 - py) * 7}deg`); }
      });
      if (inclina) t.addEventListener("pointerleave", () => { t.style.setProperty("--ry", "0deg"); t.style.setProperty("--rx", "0deg"); });
    });
  }

  /* ---------- Tu visita, en datos ---------- */
  const visita = { activo: 0, scrollPx: 0, cursorPx: 0, abiertos: new Set(), tiempos: new Map() };
  let yPrevio = scrollY, cxPrevio = null, cyPrevio = null;
  addEventListener("scroll", () => { visita.scrollPx += Math.abs(scrollY - yPrevio); yPrevio = scrollY; }, { passive: true });
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (cxPrevio !== null) visita.cursorPx += Math.hypot(e.clientX - cxPrevio, e.clientY - cyPrevio);
    cxPrevio = e.clientX; cyPrevio = e.clientY;
  }, { passive: true });
  const fTiempo = (s) => (s < 60 ? `${Math.floor(s)} s` : `${Math.floor(s / 60)} min ${String(Math.floor(s % 60)).padStart(2, "0")} s`);
  const fMetros = (px) => { const m = px * 0.000264583; return m < 10 ? `${m.toFixed(1)} m` : `${Math.round(m)} m`; };
  const zonas = $$("[data-zona]");
  const modal = $("#modal");
  let actual = null;
  function dondeEstoy() {
    if (modal.open && actual) return actual.nombre;
    const cy = innerHeight / 2;
    for (const z of zonas) {
      const r = z.getBoundingClientRect();
      if (r.top > cy || r.bottom < cy) continue;
      if (z.id !== "proyectos") return z.dataset.zona;
      let mejor = z.dataset.zona, menor = Infinity;
      $$(".panel", z).forEach((p) => {
        const b = p.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - innerWidth / 2) + Math.abs(b.top + b.height / 2 - cy);
        if (d < menor) { menor = d; mejor = p.dataset.nombre; }
      });
      return mejor;
    }
    return null;
  }
  const masVisto = () => {
    let mejor = null, max = 0;
    visita.tiempos.forEach((t, k) => { if (k !== "el contacto" && t > max) { max = t; mejor = k; } });
    return mejor ? [mayuscula(mejor), max] : null;
  };
  if (!punteroFino) $("#v-extra-titulo").textContent = "Proyectos abiertos";
  function pintarVisita() {
    $("#visita-frase").textContent = `Llevas ${fTiempo(visita.activo)} recorriendo mi trabajo.`;
    $("#v-tiempo").textContent = fTiempo(visita.activo);
    $("#v-scroll").textContent = fMetros(visita.scrollPx);
    $("#v-extra").textContent = punteroFino ? fMetros(visita.cursorPx) : String(visita.abiertos.size);
    const top = masVisto();
    if (top) $("#v-top").textContent = top[0];
  }
  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    visita.activo += 0.5;
    const k = dondeEstoy();
    if (k) visita.tiempos.set(k, (visita.tiempos.get(k) || 0) + 0.5);
    pintarVisita();
  }, 500);
  const lineasVisita = () => {
    const top = masVisto();
    return [
      `Tiempo en la página: ${fTiempo(visita.activo)}`,
      `Scroll recorrido: ${fMetros(visita.scrollPx)}`,
      punteroFino ? `Tu cursor viajó: ${fMetros(visita.cursorPx)}` : null,
      `Proyectos abiertos: ${visita.abiertos.size}`,
      top ? `Lo que más miraste: ${escapar(top[0])} (${fTiempo(top[1])})` : null,
      "Todo se calcula en tu navegador. No se envía a ningún lado.",
    ].filter(Boolean);
  };

  /* ---------- Modal con galería y transición compartida ---------- */
  const visorImg = $("#visor-img");
  let indice = 0, origenFoto = null;
  const enPantalla = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };

  function mostrar(i, inmediato) {
    const imgs = actual.imagenes;
    indice = (i + imgs.length) % imgs.length;
    const [src, texto] = imgs[indice];
    $("#visor-texto").textContent = `${indice + 1} de ${imgs.length}. ${texto}`;
    $$("#miniaturas button").forEach((b, j) => {
      b.setAttribute("aria-current", j === indice);
      if (j === indice && !inmediato) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    const poner = () => { visorImg.src = ruta(src); visorImg.alt = texto; };
    if (inmediato || reducir) return poner();
    visorImg.classList.add("cambiando");
    setTimeout(() => {
      poner();
      const listo = () => visorImg.classList.remove("cambiando");
      if (visorImg.complete) requestAnimationFrame(listo);
      else visorImg.onload = listo;
    }, 160);
  }

  function llenar(p, i0) {
    actual = p;
    const varias = p.imagenes.length > 1;
    $("#visor-prev").hidden = $("#visor-next").hidden = !varias;
    $("#miniaturas").hidden = !varias;
    $("#miniaturas").innerHTML = p.imagenes.map(([src, texto]) => `<button type="button" title="${escapar(texto)}"><img src="${ruta(src)}" alt="" loading="lazy"></button>`).join("");
    $$("#miniaturas button").forEach((b, j) => b.addEventListener("click", () => mostrar(j)));
    $("#detalle").innerHTML = `
      <div>
        <h2 id="modal-titulo">${escapar(p.nombre)}</h2>
        <p class="detalle__sub">${escapar(p.subtitulo)}</p>
        <p>${escapar(p.descripcion)}</p>
        <h3>Lo más destacado</h3>
        <ul>${p.destacados.map((d) => `<li><i class="ph ph-check" aria-hidden="true"></i><span>${escapar(d)}</span></li>`).join("")}</ul>
      </div>
      <dl class="ficha">
        <div><dt>Estado</dt><dd>${escapar(p.estado)}</dd></div>
        <div><dt>Mi rol</dt><dd>${escapar(p.rol)}</dd></div>
        <div><dt>Para</dt><dd>${escapar(p.cliente)}</dd></div>
        <div><dt>Tecnologías</dt><dd><div class="chips">${chips(p.stack)}</div></dd></div>
        ${p.enlaces.length ? `<div class="ficha__enlaces">${p.enlaces.map((e) => `<a class="boton boton--chico" href="${e.url}" target="_blank" rel="noopener">${escapar(e.texto)} <i class="ph ph-arrow-up-right" aria-hidden="true"></i></a>`).join("")}</div>` : ""}
      </dl>`;
    mostrar(i0, true);
  }

  function abrir(id, { indice: i0 = 0, origen = null } = {}) {
    const p = window.PROYECTOS.find((x) => x.id === id);
    if (!p) return;
    const foto = origen ? (origen.matches("img") ? origen : origen.querySelector("img")) : null;
    const hacer = () => {
      llenar(p, i0);
      if (!modal.open) modal.showModal();
      bloquear(true);
      $(".modal__cuerpo").scrollTop = 0;
      history.replaceState(null, "", `#${p.id}`);
      visita.abiertos.add(p.id);
    };
    if (!transiciones || !foto || modal.open || !enPantalla(foto)) { modal.classList.remove("sin-anim"); origenFoto = null; return hacer(); }
    // La foto en la que se hizo clic viaja y crece hasta ser la imagen de la galería
    origenFoto = foto.closest(".anillos") ? null : foto;
    foto.style.viewTransitionName = "foto";
    modal.classList.add("sin-anim");
    raiz.classList.add("vt-modal");
    const vt = document.startViewTransition(async () => {
      foto.style.viewTransitionName = "";
      hacer();
      visorImg.style.viewTransitionName = "foto";
      try { await Promise.race([visorImg.decode(), new Promise((r) => setTimeout(r, 450))]); } catch {}
    });
    vt.finished.finally(() => { visorImg.style.viewTransitionName = ""; raiz.classList.remove("vt-modal"); });
  }

  function cerrar() {
    if (!modal.open) return;
    const destino = origenFoto && origenFoto.isConnected && enPantalla(origenFoto) ? origenFoto : null;
    if (!transiciones || !destino) return modal.close();
    visorImg.style.viewTransitionName = "foto";
    raiz.classList.add("vt-modal");
    const vt = document.startViewTransition(() => {
      visorImg.style.viewTransitionName = "";
      modal.close();
      destino.style.viewTransitionName = "foto";
    });
    vt.finished.finally(() => { destino.style.viewTransitionName = ""; raiz.classList.remove("vt-modal"); });
  }

  modal.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); });
  modal.addEventListener("close", () => {
    bloquear(false);
    history.replaceState(null, "", location.pathname + location.search);
  });
  $("#modal-cerrar").addEventListener("click", cerrar);
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrar(); });
  $("#visor-prev").addEventListener("click", () => mostrar(indice - 1));
  $("#visor-next").addEventListener("click", () => mostrar(indice + 1));
  document.addEventListener("keydown", (e) => {
    if (!modal.open || !actual || actual.imagenes.length < 2) return;
    if (e.key === "ArrowRight") mostrar(indice + 1);
    if (e.key === "ArrowLeft") mostrar(indice - 1);
  });
  let toque = null;
  $("#visor").addEventListener("pointerdown", (e) => (toque = e.clientX));
  $("#visor").addEventListener("pointerup", (e) => {
    if (toque === null || !actual || actual.imagenes.length < 2) return;
    const dx = e.clientX - toque;
    if (Math.abs(dx) > 50) mostrar(indice + (dx < 0 ? 1 : -1));
    toque = null;
  });

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-abrir]");
    if (!b || carrusel.classList.contains("arrastrando")) return;
    abrir(b.dataset.abrir, { indice: +(b.dataset.indice || 0), origen: b.querySelector("img") ? b : null });
  });

  const abrirDesdeHash = () => {
    const id = location.hash.slice(1);
    if (window.PROYECTOS.some((p) => p.id === id) && !modal.open) abrir(id);
  };
  addEventListener("hashchange", abrirDesdeHash);
  abrirDesdeHash();

  /* ---------- Terminal ---------- */
  window.Terminal.iniciar({
    perfil: P, proyectos: window.PROYECTOS, stack: window.STACK, experiencia: window.EXPERIENCIA,
    abrir: (id) => abrir(id), ir, visita: lineasVisita, fuego,
    tema: (v) => cambiarTema(v === "claro" || v === "oscuro" ? v : undefined),
    paleta: () => (hayFluido ? (F.modo({ fuerza: 1 }), clearTimeout(vueltaFuego), (vueltaFuego = setTimeout(() => F.modo(modoActual), 8000)), F.paleta()) : 0),
    alAbrir: () => bloquear(true),
    alCerrar: () => { if (!modal.open) bloquear(false); },
  });

  /* ---------- Pozo de tecnologías ---------- */
  if (animar) {
    const rotulo = $("#pozo-nombre"), base = rotulo.textContent;
    const pozo = window.Pozo.crear($("#pozo"), window.LOGOS, { alNombre: (n) => { rotulo.textContent = n || base; rotulo.classList.toggle("activo", !!n); } });
    $("#sacudir").addEventListener("click", () => pozo.sacudir(1));
  } else {
    $("#pozo").hidden = true;
    $("#sacudir").hidden = true;
  }

  /* ---------- Animaciones ---------- */
  if (!animar) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Scroll con inercia (solo con mouse o trackpad; en táctil se queda el nativo)
  if (punteroFino && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    if (modal.open) lenis.stop();
  }

  // Divide un titular en palabras (y letras) para animarlo sin perder su lectura accesible
  function dividir(el, conLetras, etiquetar = true) {
    if (etiquetar) el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    const procesar = (nodo) => [...nodo.childNodes].forEach((n) => {
      if (n.nodeType !== 3) return procesar(n);
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((pedazo) => {
        if (!pedazo) return;
        if (/^\s+$/.test(pedazo)) return frag.append(" ");
        const w = document.createElement("span");
        w.className = "palabra";
        if (etiquetar) w.setAttribute("aria-hidden", "true");
        w.innerHTML = `<span>${conLetras ? [...pedazo].map((c) => `<span class="letra">${escapar(c)}</span>`).join("") : escapar(pedazo)}</span>`;
        frag.append(w);
      });
      n.replaceWith(frag);
    });
    procesar(el);
  }

  // Texto que se descifra letra por letra
  function descifrar(el, duracion = 1.1) {
    const final = el.textContent, glifos = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/#";
    const o = { p: 0 };
    gsap.to(o, {
      p: 1, duration: duracion, ease: "power2.out",
      onUpdate: () => {
        const hechas = Math.floor(o.p * final.length);
        el.textContent = final.slice(0, hechas) + [...final.slice(hechas)].map((c) => (c === " " || c === "," ? c : glifos[Math.floor(Math.random() * glifos.length)])).join("");
      },
      onComplete: () => { el.textContent = final; },
    });
  }

  /* Portada */
  const hero = $(".hero"), titulo = $("#titulo"), escena = $("#escena"), capas = $$(".capa");
  dividir(titulo, true);
  const letras = $$(".letra", titulo);
  let centros = [];
  const medirLetras = () => { centros = letras.map((l) => { const r = l.getBoundingClientRect(); return [r.left + r.width / 2 + scrollX, r.top + r.height / 2 + scrollY]; }); };
  gsap.set(escena, { rotationY: -10, rotationX: 5 });
  capas.forEach((c) => gsap.set(c, { z: +c.dataset.z }));

  function entradaHero() {
    gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: () => { titulo.classList.add("libre"); medirLetras(); } })
      .from("#ceja", { y: 16, opacity: 0, duration: 0.8 })
      .add(() => descifrar($("#ceja")), "<")
      .from($$(".palabra > span", titulo), { yPercent: 120, duration: 1.15, stagger: 0.07 }, "-=0.55")
      .from(".hero__sub", { y: 20, opacity: 0, duration: 0.9 }, "-=0.75")
      .from(".hero__acciones > *", { y: 18, opacity: 0, duration: 0.8, stagger: 0.08 }, "-=0.7")
      .from(capas, { y: 150, opacity: 0, rotationX: 38, duration: 1.6, stagger: 0.13 }, 0.15);
    if (hayFluido) F.barrido(120);
  }

  if (raiz.classList.contains("intro")) {
    window.__introLista = true;
    const o = { v: 0 }, num = $("#cargador-num");
    const listas = Promise.race([Promise.all(capas.map((c) => c.querySelector("img").decode().catch(() => {}))), new Promise((r) => setTimeout(r, 2200))]);
    const salir = () => {
      try { sessionStorage.setItem("intro", "1"); } catch {}
      gsap.timeline({ onComplete: () => raiz.classList.remove("intro") })
        .to(".cargador > *", { y: -70, opacity: 0, duration: 0.45, ease: "power3.in", stagger: 0.04 })
        .to("#cargador", { yPercent: -100, duration: 0.95, ease: "expo.inOut" }, "-=0.2")
        .add(entradaHero, "-=0.6");
    };
    gsap.to(o, {
      v: 100, duration: 1.3, ease: "power2.inOut",
      onUpdate: () => { num.textContent = Math.round(o.v); gsap.set("#cargador-barra", { scaleX: o.v / 100 }); },
      onComplete: () => listas.then(salir),
    });
  } else entradaHero();

  // Las letras del titular se levantan y se encienden cerca del cursor
  if (punteroFino) {
    const subir = letras.map((l) => gsap.quickTo(l, "y", { duration: 0.5, ease: "power3" }));
    hero.addEventListener("pointermove", (e) => {
      if (!centros.length) return;
      const px = e.clientX + scrollX, py = e.clientY + scrollY;
      letras.forEach((l, i) => {
        const f = Math.max(0, 1 - Math.hypot(px - centros[i][0], py - centros[i][1]) / 190) ** 2;
        subir[i](-f * 14);
        l.style.setProperty("--calor", f.toFixed(3));
      });
    });
    hero.addEventListener("pointerleave", () => letras.forEach((l, i) => { subir[i](0); l.style.setProperty("--calor", 0); }));
    addEventListener("resize", () => setTimeout(medirLetras, 300));

    // La escena 3D gira hacia el cursor
    const ry = gsap.quickTo(escena, "rotationY", { duration: 1, ease: "power3" });
    const rx = gsap.quickTo(escena, "rotationX", { duration: 1, ease: "power3" });
    hero.addEventListener("pointermove", (e) => { ry(-10 + (e.clientX / innerWidth - 0.5) * 24); rx(5 - (e.clientY / innerHeight - 0.5) * 16); });
  } else {
    gsap.to(escena, { rotationY: 9, rotationX: -3, duration: 5.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }

  // Los teléfonos cambian de pantalla como si alguien usara la app
  let heroVisible = true;
  addEventListener("load", () => {
    $$(".capa[data-ciclo]").forEach((capa, k) => {
      const imgs = [capa.querySelector("img")];
      capa.dataset.ciclo.split(",").forEach((s) => { const im = new Image(); im.alt = ""; im.src = ruta(s); gsap.set(im, { yPercent: 101 }); capa.append(im); imgs.push(im); });
      let i = 0, z = 1;
      setInterval(() => {
        if (!heroVisible || document.hidden) return;
        const sale = imgs[i], entra = imgs[(i + 1) % imgs.length];
        if (!entra.complete) return;
        i = (i + 1) % imgs.length;
        entra.style.zIndex = ++z;
        gsap.fromTo(entra, { yPercent: 101 }, { yPercent: 0, duration: 1, ease: "expo.inOut" });
        gsap.to(sale, { yPercent: -25, duration: 1, ease: "expo.inOut" });
      }, 3000 + k * 900);
    });
  });

  // Al bajar, la portada se aleja y el calor queda solo para el cursor
  gsap.to("#visual", { yPercent: -10, scale: 0.9, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__texto", { yPercent: -22, opacity: 0.15, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom 15%", scrub: true } });
  // El calor va a toda fuerza en la portada y en el contacto; en el resto solo acompaña al cursor.
  // Se observa la posición real (no las transiciones) para que también funcione al recargar a mitad de página.
  const calientes = new Set();
  const zonasCalientes = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? calientes.add(e.target) : calientes.delete(e.target)));
    heroVisible = calientes.has(hero);
    fijarModo(calientes.size ? modoAlto : modoBajo);
  }, { rootMargin: "-25% 0px -20% 0px" });
  zonasCalientes.observe(hero);
  zonasCalientes.observe($("#contacto"));

  /* Titulares de sección: suben palabra por palabra */
  $$("[data-titulo]").forEach((el) => {
    dividir(el, false);
    gsap.from($$(".palabra > span", el), { yPercent: 120, duration: 1.1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });

  /* La frase de cómo trabajo se enciende palabra por palabra mientras se baja */
  const manifiesto = $("#manifiesto");
  dividir(manifiesto, false, false);
  gsap.fromTo($$(".palabra", manifiesto), { opacity: 0.13 }, { opacity: 1, ease: "none", stagger: 0.14, scrollTrigger: { trigger: manifiesto, start: "top 84%", end: "bottom 52%", scrub: true } });

  /* Cursor con etiqueta */
  let revisarCursor = null;
  if (punteroFino) {
    const cursor = $("#cursor"), cursorTexto = $("#cursor-texto");
    const cx = gsap.quickTo(cursor, "x", { duration: 0.32, ease: "power3" }), cy = gsap.quickTo(cursor, "y", { duration: 0.32, ease: "power3" });
    let ux = -1, uy = -1, ultimaRevision = 0;
    const vestir = (el) => {
      const t = el && el.closest ? el.closest("[data-cursor]") : null;
      const interactivo = !t && el && el.closest && el.closest("a, button, input, .bola");
      cursor.classList.toggle("etiqueta", !!t);
      cursor.classList.toggle("enlace", !!interactivo);
      if (t) cursorTexto.textContent = t.dataset.cursor;
    };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      ux = e.clientX; uy = e.clientY;
      cx(ux); cy(uy);
      cursor.classList.add("visible");
      vestir(e.target);
    }, { passive: true });
    raiz.addEventListener("mouseleave", () => cursor.classList.remove("visible"));
    // Al hacer scroll sin mover el mouse cambia lo que hay debajo: se vuelve a mirar
    revisarCursor = () => {
      const ahora = performance.now();
      if (ux < 0 || ahora - ultimaRevision < 140) return;
      ultimaRevision = ahora;
      vestir(document.elementFromPoint(ux, uy));
    };
    setInterval(revisarCursor, 320);
  }

  /* Botones magnéticos */
  if (punteroFino) {
    $$(".magnetico").forEach((b) => {
      const x = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" }), y = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.22);
        y((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      b.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  /* Aparición al entrar en pantalla */
  $$("[data-revelar]").forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });
  gsap.set("[data-revelar-lote]", { opacity: 0, y: 56 });
  ScrollTrigger.batch("[data-revelar-lote]", {
    start: "top 92%", once: true,
    onEnter: (lote) => gsap.to(lote, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.09, overwrite: true }),
  });

  /* Contadores */
  $$("[data-contar]").forEach((el) => {
    const meta = +el.dataset.contar, o = { v: 0 };
    el.textContent = "0";
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => gsap.to(o, { v: meta, duration: meta > 50 ? 2.2 : 1.4, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v)) }),
    });
  });

  /* Cinta de logos: acelera y se inclina con la velocidad del scroll */
  const cinta = gsap.to("#cinta", { xPercent: -50, duration: 46, ease: "none", repeat: -1 }).totalTime(46 * 400);
  const sesgoCinta = gsap.quickTo("#cinta", "skewX", { duration: 0.4, ease: "power3" });
  let calmaCinta = null;

  /* Destacados: el scroll vertical recorre los proyectos en horizontal */
  const mm = gsap.matchMedia();
  let sesgoPista = null;
  mm.add("(min-width: 901px)", () => {
    const pista = $("#pista");
    const distancia = () => pista.scrollWidth - innerWidth;
    sesgoPista = gsap.quickTo(pista, "skewX", { duration: 0.5, ease: "power3" });
    const pan = gsap.to(pista, {
      x: () => -distancia(), ease: "none",
      scrollTrigger: {
        trigger: ".destacados", start: "top top", end: () => `+=${distancia()}`,
        pin: true, scrub: lenis ? true : 1, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (st) => gsap.set("#progreso", { scaleX: st.progress }),
      },
    });
    // Cada captura se desliza dentro de su marco mientras el panel cruza la pantalla
    $$(".panel__media:not(.panel__media--movil) img", pista).forEach((img) => {
      gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: img.closest(".panel"), containerAnimation: pan, start: "left right", end: "right left", scrub: true } });
    });
    $$(".panel__media--movil", pista).forEach((m) => {
      gsap.fromTo($$("img", m), { yPercent: (i) => 10 + i * 9 }, { yPercent: (i) => -6 - i * 5, ease: "none", scrollTrigger: { trigger: m.closest(".panel"), containerAnimation: pan, start: "left right", end: "right left", scrub: true } });
    });
    return () => { sesgoPista = null; };
  });
  mm.add("(max-width: 900px)", () => {
    gsap.set("#pista .panel", { opacity: 0, y: 56 });
    ScrollTrigger.batch("#pista .panel", { start: "top 92%", once: true, onEnter: (l) => gsap.to(l, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.1 }) });
  });

  /* Línea de tiempo que se llena con el avance */
  gsap.to("#relleno", { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#linea", start: "top 70%", end: "bottom 60%", scrub: true } });

  /* Scroll global: barra de avance, navegación que se esconde y todo lo que reacciona a la velocidad */
  const nav = $("#nav");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (st) => {
      const v = st.getVelocity();
      nav.classList.toggle("nav--oculta", st.direction === 1 && st.scroll() > 160);
      gsap.set("#avance", { scaleX: st.progress });
      gsap.to(cinta, { timeScale: gsap.utils.clamp(1, 8, 1 + Math.abs(v) / 260) * (v < 0 ? -1 : 1), duration: 0.25, overwrite: true });
      sesgoCinta(gsap.utils.clamp(-14, 14, v / -130));
      if (sesgoPista) sesgoPista(gsap.utils.clamp(-4, 4, v / -500));
      anillos.empujar(v);
      if (revisarCursor) revisarCursor();
      if (calmaCinta) calmaCinta.kill();
      calmaCinta = gsap.delayedCall(0.18, () => {
        gsap.to(cinta, { timeScale: 1, duration: 1.2, overwrite: true });
        sesgoCinta(0);
        if (sesgoPista) sesgoPista(0);
      });
    },
  });

  /* Código Konami: arriba, arriba, abajo, abajo, izquierda, derecha, izquierda, derecha, B, A */
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pasoKonami = 0;
  addEventListener("keydown", (e) => {
    const tecla = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pasoKonami = tecla === konami[pasoKonami] ? pasoKonami + 1 : tecla === konami[0] ? 1 : 0;
    if (pasoKonami === konami.length) { pasoKonami = 0; if (hayFluido) F.paleta(1); fuego(); }
  });

  addEventListener("load", () => { ScrollTrigger.refresh(); medirLetras(); });
})();
