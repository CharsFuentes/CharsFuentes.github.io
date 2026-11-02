(() => {
  const P = window.PERFIL;
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const chips = (lista) => lista.map((s) => `<span class="chip">${escapar(s)}</span>`).join("");
  const ruta = (archivo) => `${IMG}/${archivo}`;
  const vistas = (n) => `${n} ${n === 1 ? "vista" : "vistas"}`;

  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const punteroFino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hayGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const animar = hayGsap && !reducir;
  if (animar) document.documentElement.classList.add("anima");

  /* ---------- Contenido ---------- */

  // Contacto
  const enlaces = { whatsapp: `https://wa.me/${P.whatsapp}`, linkedin: P.linkedin, github: P.github };
  $$("[data-enlace]").forEach((a) => (a.href = enlaces[a.dataset.enlace]));
  $("#correo-texto").textContent = P.correo;
  $("#anio").textContent = new Date().getFullYear();

  // Cinta de logos (dos copias para el bucle continuo)
  const logo = (l) => `<span class="cinta__logo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${l.d}"/></svg>${escapar(l.nombre)}</span>`;
  const grupo = window.LOGOS.map(logo).join("");
  $("#cinta").innerHTML = grupo + `<span style="display:contents" aria-hidden="true">${grupo}</span>`;

  // Destacados (panel horizontal)
  const destacados = window.PROYECTOS.filter((p) => p.destacado);
  const resto = window.PROYECTOS.filter((p) => !p.destacado);

  $("#pista").innerHTML = destacados.map((p) => {
    const media = p.portadaMovil
      ? `<button class="panel__media panel__media--movil" type="button" data-abrir="${p.id}" aria-label="Ver pantallas de ${escapar(p.nombre)}">${p.imagenes.slice(0, 3).map(([s]) => `<img src="${ruta(s)}" alt="" loading="lazy">`).join("")}</button>`
      : `<button class="panel__media" type="button" data-abrir="${p.id}" aria-label="Ver pantallas de ${escapar(p.nombre)}"><img src="${ruta(p.imagenes[0][0])}" alt="${escapar(p.imagenes[0][1])}" loading="lazy"></button>`;
    const vivo = p.enlaces[0];
    return `
      <article class="panel">
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
    <button class="tile" type="button" data-abrir="${p.id}" data-revelar-lote aria-label="Ver detalle de ${escapar(p.nombre)}">
      <div class="tile__img"><img src="${ruta(p.imagenes[0][0])}" alt="${escapar(p.imagenes[0][1])}" loading="lazy"></div>
      <div class="tile__cuerpo">
        <div class="tile__fila"><h3>${escapar(p.nombre)}</h3><span class="tile__vistas">${vistas(p.imagenes.length)} <i class="ph ph-arrow-up-right" aria-hidden="true"></i></span></div>
        <p>${escapar(p.subtitulo)}. ${escapar(p.estado)}.</p>
      </div>
    </button>`).join("");

  // Otros proyectos
  $("#otros").innerHTML = window.OTROS.map((o) => `
    <article class="otro">
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

  /* ---------- Tema ---------- */
  const raiz = document.documentElement;
  const botonTema = $("#tema");
  const pintarIconoTema = () => {
    const oscuro = raiz.dataset.tema === "oscuro";
    botonTema.innerHTML = `<i class="ph ${oscuro ? "ph-sun" : "ph-moon-stars"}" aria-hidden="true"></i>`;
    $('meta[name="theme-color"]').content = oscuro ? "#0d0e10" : "#f4f4f5";
  };
  pintarIconoTema();
  botonTema.addEventListener("click", () => {
    raiz.dataset.tema = raiz.dataset.tema === "oscuro" ? "claro" : "oscuro";
    localStorage.setItem("tema", raiz.dataset.tema);
    pintarIconoTema();
  });

  /* ---------- Copiar correo ---------- */
  const aviso = $("#aviso");
  $("#copiar").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(P.correo);
      aviso.textContent = "Correo copiado";
    } catch {
      location.href = `mailto:${P.correo}`;
      aviso.textContent = "Abriendo tu correo";
    }
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
  window.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    if (!arrastre.movido && Math.abs(dx) > 5) { arrastre.movido = true; carrusel.classList.add("arrastrando"); }
    if (arrastre.movido) carrusel.scrollLeft = arrastre.inicio - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!arrastre) return;
    carrusel.classList.remove("arrastrando");
    arrastre = null;
  });

  /* ---------- Inclinación y luz en el mosaico ---------- */
  if (punteroFino && !reducir) {
    $$(".tile").forEach((t) => {
      t.addEventListener("pointermove", (e) => {
        const r = t.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        t.style.setProperty("--ry", `${(px - 0.5) * 9}deg`);
        t.style.setProperty("--rx", `${(0.5 - py) * 7}deg`);
        t.style.setProperty("--mx", `${px * 100}%`);
        t.style.setProperty("--my", `${py * 100}%`);
      });
      t.addEventListener("pointerleave", () => {
        t.style.setProperty("--ry", "0deg");
        t.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* ---------- Modal con galería ---------- */
  const modal = $("#modal");
  const visorImg = $("#visor-img");
  let actual = null;
  let indice = 0;

  function mostrar(i, inmediato) {
    const imgs = actual.imagenes;
    indice = (i + imgs.length) % imgs.length;
    const [src, texto] = imgs[indice];
    $("#visor-texto").textContent = `${indice + 1} de ${imgs.length}. ${texto}`;
    $$("#miniaturas button").forEach((b, j) => {
      b.setAttribute("aria-current", j === indice);
      if (j === indice) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    const poner = () => {
      visorImg.src = ruta(src);
      visorImg.alt = texto;
    };
    if (inmediato || reducir) return poner();
    visorImg.classList.add("cambiando");
    setTimeout(() => {
      poner();
      const listo = () => visorImg.classList.remove("cambiando");
      if (visorImg.complete) requestAnimationFrame(listo);
      else visorImg.onload = listo;
    }, 160);
  }

  function abrir(id) {
    actual = window.PROYECTOS.find((p) => p.id === id);
    if (!actual) return;
    const p = actual;
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
    mostrar(0, true);
    modal.showModal();
    raiz.style.overflow = "hidden";
    $(".modal__cuerpo").scrollTop = 0;
    history.replaceState(null, "", `#${p.id}`);
  }

  modal.addEventListener("close", () => {
    raiz.style.overflow = "";
    history.replaceState(null, "", location.pathname + location.search);
  });
  $("#modal-cerrar").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  $("#visor-prev").addEventListener("click", () => mostrar(indice - 1));
  $("#visor-next").addEventListener("click", () => mostrar(indice + 1));
  document.addEventListener("keydown", (e) => {
    if (!modal.open || !actual || actual.imagenes.length < 2) return;
    if (e.key === "ArrowRight") mostrar(indice + 1);
    if (e.key === "ArrowLeft") mostrar(indice - 1);
  });
  // Deslizar con el dedo en el visor
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
    if (b && !carrusel.classList.contains("arrastrando")) abrir(b.dataset.abrir);
  });

  const abrirDesdeHash = () => {
    const id = location.hash.slice(1);
    if (window.PROYECTOS.some((p) => p.id === id) && !modal.open) abrir(id);
  };
  window.addEventListener("hashchange", abrirDesdeHash);
  abrirDesdeHash();

  /* ---------- Animaciones ---------- */
  if (!animar) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Titular palabra por palabra (jerarquía: lo primero que se lee)
  const titulo = $("#titulo");
  const envolver = (nodo) => {
    [...nodo.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((pedazo) => {
          if (!pedazo) return;
          if (/^\s+$/.test(pedazo)) return frag.append(pedazo);
          const w = document.createElement("span");
          w.className = "palabra";
          w.innerHTML = `<span>${escapar(pedazo)}</span>`;
          frag.append(w);
        });
        n.replaceWith(frag);
      } else envolver(n);
    });
  };
  envolver(titulo);

  const capas = $$(".capa");
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(".hero__ceja", { y: 16, opacity: 0, duration: 0.8 })
    .from(".palabra > span", { yPercent: 115, duration: 1.1, stagger: 0.07 }, "-=0.5")
    .from(".hero__sub", { y: 20, opacity: 0, duration: 0.9 }, "-=0.7")
    .from(".hero__acciones > *", { y: 18, opacity: 0, duration: 0.8, stagger: 0.08 }, "-=0.7")
    .from(capas, { y: 90, opacity: 0, rotate: (i) => (i % 2 ? 4 : -3), duration: 1.4, stagger: 0.12 }, 0.25);

  // Profundidad en la portada: siguen al puntero y se separan al bajar
  if (punteroFino) {
    const movs = capas.map((c) => ({ prof: +c.dataset.prof, x: gsap.quickTo(c, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(c, "y", { duration: 0.9, ease: "power3" }) }));
    $(".hero").addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      movs.forEach((m) => { m.x(nx * 34 * m.prof); m.y(ny * 26 * m.prof); });
    });
  }
  capas.forEach((c) => {
    gsap.to(c, { yPercent: -14 * +c.dataset.prof, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });

  // Botones magnéticos (respuesta al puntero)
  if (punteroFino) {
    $$(".magnetico").forEach((b) => {
      const x = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" });
      const y = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.22);
        y((e.clientY - (r.top + r.height / 2)) * 0.32);
      });
      b.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  // Aparición al entrar en pantalla
  $$("[data-revelar]").forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });
  gsap.set("[data-revelar-lote]", { opacity: 0, y: 48 });
  ScrollTrigger.batch("[data-revelar-lote]", {
    start: "top 90%",
    once: true,
    onEnter: (lote) => gsap.to(lote, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.09, overwrite: true }),
  });

  // Contadores
  $$("[data-contar]").forEach((el) => {
    const meta = +el.dataset.contar;
    const o = { v: 0 };
    el.textContent = "0";
    ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(o, { v: meta, duration: meta > 50 ? 2.2 : 1.4, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v)) }),
    });
  });

  // Destacados: el scroll vertical recorre los proyectos en horizontal
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const pista = $("#pista");
    const distancia = () => pista.scrollWidth - innerWidth;
    gsap.to(pista, {
      x: () => -distancia(),
      ease: "none",
      scrollTrigger: {
        trigger: ".destacados",
        start: "top top",
        end: () => `+=${distancia()}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (st) => gsap.set("#progreso", { scaleX: st.progress }),
      },
    });
  });
  mm.add("(max-width: 900px)", () => {
    gsap.set("#pista .panel", { opacity: 0, y: 48 });
    ScrollTrigger.batch("#pista .panel", { start: "top 90%", once: true, onEnter: (l) => gsap.to(l, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.1 }) });
  });

  // Línea de tiempo que se llena con el avance
  gsap.to("#relleno", { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#linea", start: "top 70%", end: "bottom 60%", scrub: true } });

  // Barra superior: se esconde al bajar y vuelve al subir
  const nav = $("#nav");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (st) => nav.classList.toggle("nav--oculta", st.direction === 1 && st.scroll() > 160 && !modal.open),
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
