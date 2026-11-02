(() => {
  const P = window.PERFIL;
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const crear = (tag, clase, html) => {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (html !== undefined) el.innerHTML = html;
    return el;
  };
  const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const chips = (lista) => lista.map((s) => `<span class="chip">${escapar(s)}</span>`).join("");
  const ruta = (archivo) => `${IMG}/${archivo}`;

  // Datos de perfil y enlaces de contacto
  document.querySelectorAll("[data-perfil]").forEach((el) => (el.textContent = P[el.dataset.perfil]));
  const enlaces = {
    whatsapp: `https://wa.me/${P.whatsapp}`,
    linkedin: P.linkedin,
    github: P.github,
    correo: `mailto:${P.correo}`,
  };
  document.querySelectorAll("[data-enlace]").forEach((a) => (a.href = enlaces[a.dataset.enlace]));
  $("#anio").textContent = new Date().getFullYear();

  // Filtros
  let filtro = "todos";
  const filtros = $("#filtros");
  const opciones = [["todos", "Todos"], ...Object.entries(window.CATEGORIAS)];
  opciones.forEach(([clave, texto]) => {
    const b = crear("button", "filtro", texto);
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", clave === filtro);
    b.addEventListener("click", () => {
      filtro = clave;
      filtros.querySelectorAll(".filtro").forEach((x) => x.setAttribute("aria-selected", x === b));
      pintarGrilla();
    });
    filtros.append(b);
  });

  // Tarjetas de proyectos
  function portada(p) {
    if (!p.imagenes.length) return `<div class="tarjeta__vacia">${escapar(p.nombre)}</div>`;
    if (p.portadaMovil) {
      return p.imagenes.slice(0, 3).map(([src]) => `<img src="${ruta(src)}" alt="" loading="lazy">`).join("");
    }
    const [src, texto] = p.imagenes[0];
    return `<img src="${ruta(src)}" alt="${escapar(texto)}" loading="lazy">`;
  }

  function pintarGrilla() {
    const grilla = $("#grilla");
    grilla.innerHTML = "";
    window.PROYECTOS.filter((p) => filtro === "todos" || p.categorias.includes(filtro)).forEach((p) => {
      const t = crear("button", "tarjeta");
      t.type = "button";
      t.setAttribute("aria-label", `Ver detalle de ${p.nombre}`);
      const n = p.imagenes.length;
      t.innerHTML = `
        <div class="tarjeta__img ${p.portadaMovil ? "tarjeta__img--movil" : ""}">
          ${portada(p)}
          ${n ? `<span class="tarjeta__conteo">${n} ${n === 1 ? "vista" : "vistas"}</span>` : ""}
        </div>
        <div class="tarjeta__cuerpo">
          <span class="tarjeta__estado">${escapar(p.estado)}</span>
          <h3>${escapar(p.nombre)}</h3>
          <p>${escapar(p.resumen)}</p>
          <span class="tarjeta__meta">${escapar(p.rol)} · ${escapar(p.cliente)}</span>
          <div class="chips">${chips(p.stack.slice(0, 6))}</div>
        </div>`;
      t.addEventListener("click", () => abrir(p.id));
      grilla.append(t);
    });
  }
  pintarGrilla();

  // Otros proyectos
  const otros = $("#otros");
  window.OTROS.forEach((o) => {
    const c = crear("article", "otro");
    c.innerHTML = `
      <span class="otro__etiqueta">${escapar(o.etiqueta)}</span>
      <h4>${escapar(o.nombre)}</h4>
      <p>${escapar(o.texto)}</p>
      <div class="chips">${chips(o.stack)}</div>
      ${o.url ? `<a href="${o.url}" target="_blank" rel="noopener">Ver →</a>` : ""}`;
    otros.append(c);
  });

  // Experiencia
  const exp = $("#experiencia-lista");
  window.EXPERIENCIA.forEach((e) => {
    exp.append(crear("li", "", `
      <h3>${escapar(e.cargo)}</h3>
      <div class="linea__lugar">${escapar(e.lugar)}</div>
      <div class="linea__periodo">${escapar(e.periodo)}</div>
      <ul>${e.puntos.map((x) => `<li>${escapar(x)}</li>`).join("")}</ul>`));
  });

  // Tecnologías
  const stack = $("#stack-lista");
  window.STACK.forEach(([grupo, items]) => {
    stack.append(crear("div", "stack__grupo", `<h3>${escapar(grupo)}</h3><ul>${items.map((i) => `<li>${escapar(i)}</li>`).join("")}</ul>`));
  });

  // Modal con galería
  const modal = $("#modal");
  let actual = null;
  let indice = 0;

  function mostrar(i) {
    const imgs = actual.imagenes;
    if (!imgs.length) return;
    indice = (i + imgs.length) % imgs.length;
    const [src, texto] = imgs[indice];
    const img = $("#visor-img");
    img.src = ruta(src);
    img.alt = texto;
    $("#visor-texto").textContent = `${indice + 1} / ${imgs.length} · ${texto}`;
    $("#miniaturas").querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-current", j === indice));
  }

  function abrir(id) {
    actual = window.PROYECTOS.find((p) => p.id === id);
    if (!actual) return;
    const hay = actual.imagenes.length > 0;
    $(".visor").hidden = !hay;
    $("#miniaturas").hidden = actual.imagenes.length < 2;
    $("#visor-prev").hidden = $("#visor-next").hidden = actual.imagenes.length < 2;

    const minis = $("#miniaturas");
    minis.innerHTML = "";
    actual.imagenes.forEach(([src, texto], j) => {
      const b = crear("button", "", `<img src="${ruta(src)}" alt="" loading="lazy">`);
      b.type = "button";
      b.title = texto;
      b.addEventListener("click", () => mostrar(j));
      minis.append(b);
    });

    const p = actual;
    $("#detalle").innerHTML = `
      <div>
        <h2 id="modal-titulo">${escapar(p.nombre)}</h2>
        <div class="detalle__meta">${escapar(p.estado)}</div>
        <p>${escapar(p.descripcion)}</p>
        <h3>Lo más destacado</h3>
        <ul>${p.destacados.map((d) => `<li>${escapar(d)}</li>`).join("")}</ul>
      </div>
      <aside class="detalle__lado">
        <dl class="detalle__ficha">
          <dt>Mi rol</dt><dd>${escapar(p.rol)}</dd>
          <dt>Para</dt><dd>${escapar(p.cliente)}</dd>
          <dt>Tecnologías</dt><dd><div class="chips">${chips(p.stack)}</div></dd>
        </dl>
        ${p.enlaces.length ? `<div class="detalle__enlaces">${p.enlaces.map((e) => `<a class="boton boton--chico" href="${e.url}" target="_blank" rel="noopener">${escapar(e.texto)} ↗</a>`).join("")}</div>` : ""}
      </aside>`;

    if (hay) mostrar(0);
    modal.showModal();
    $(".modal__cuerpo").scrollTop = 0;
    history.replaceState(null, "", `#${p.id}`);
  }

  function cerrar() {
    modal.close();
  }
  modal.addEventListener("close", () => history.replaceState(null, "", location.pathname));
  $("#modal-cerrar").addEventListener("click", cerrar);
  $("#visor-prev").addEventListener("click", () => mostrar(indice - 1));
  $("#visor-next").addEventListener("click", () => mostrar(indice + 1));
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrar(); });
  document.addEventListener("keydown", (e) => {
    if (!modal.open || !actual) return;
    if (e.key === "ArrowRight") mostrar(indice + 1);
    if (e.key === "ArrowLeft") mostrar(indice - 1);
  });

  // Enlace directo a un proyecto: .../#zivo
  const abrirDesdeHash = () => {
    const id = location.hash.slice(1);
    if (window.PROYECTOS.some((p) => p.id === id) && !modal.open) abrir(id);
  };
  window.addEventListener("hashchange", abrirDesdeHash);
  abrirDesdeHash();
})();
