// Terminal interactiva (Ctrl + K). Navega el portafolio con comandos de verdad.
window.Terminal = (() => {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const enlace = (url, texto) => `<a href="${url}" target="_blank" rel="noopener">${esc(texto)}</a>`;

  function iniciar(api) {
    const dlg = document.getElementById("terminal");
    const salida = document.getElementById("terminal-salida");
    const entrada = document.getElementById("terminal-entrada");
    const historial = [];
    let cursorHist = 0, saludado = false;
    const P = api.perfil;
    const SECCIONES = { inicio: "#inicio", proyectos: "#proyectos", pantallas: "#pantallas", experiencia: "#experiencia", stack: "#stack", contacto: "#contacto" };

    function decir(lineas, clase = "") {
      [].concat(lineas).forEach((html, i) => {
        const p = document.createElement("p");
        p.className = `terminal__renglon ${clase}`;
        p.style.animationDelay = `${i * 28}ms`;
        p.innerHTML = html || "&nbsp;";
        salida.append(p);
      });
      salida.scrollTop = salida.scrollHeight;
    }
    const fila = (a, b) => `<span class="terminal__clave">${esc(a)}</span>${b}`;

    const comandos = {
      ayuda: { d: "muestra esta lista", f: () => Object.entries(comandos).filter(([, c]) => c.d).map(([k, c]) => fila(k + (c.arg ? ` ${c.arg}` : ""), esc(c.d))) },
      sobre: { d: "quién soy", f: () => [
        `${esc(P.nombre)}. Ingeniero de Sistemas en ${esc(P.ubicacion)}.`,
        "Desarrollo full stack y móvil: base de datos, API, web, app y despliegue.",
        "Sistemas en producción para municipalidades, una app en Play Store y App Store, e IA aplicada a un ERP.",
      ] },
      proyectos: { d: "lista los proyectos", f: () => [...api.proyectos.map((p) => fila(p.id, `${esc(p.nombre)}. ${esc(p.subtitulo)}`)), "", "Escribe <b>abrir zivo</b> para ver sus pantallas."] },
      abrir: { d: "abre un proyecto con su galería", arg: "<id>", f: (arg) => {
        const p = api.proyectos.find((x) => x.id === arg || x.nombre.toLowerCase() === arg);
        if (!p) return [`No encuentro el proyecto "${esc(arg || "")}". Prueba <b>proyectos</b> para ver los ids.`];
        dlg.close();
        setTimeout(() => api.abrir(p.id), 60);
        return [`Abriendo ${esc(p.nombre)}...`];
      } },
      ir: { d: "salta a una sección", arg: "<sección>", f: (arg) => {
        if (!SECCIONES[arg]) return [`Secciones: ${Object.keys(SECCIONES).join(", ")}.`];
        dlg.close();
        setTimeout(() => api.ir(SECCIONES[arg]), 60);
        return [`Yendo a ${esc(arg)}...`];
      } },
      stack: { d: "tecnologías que uso", f: () => api.stack.map(([g, items]) => fila(g, esc(items.join(", ")))) },
      experiencia: { d: "dónde he trabajado", f: () => api.experiencia.map((e) => fila(e.periodo, `${esc(e.cargo)}, ${esc(e.lugar)}`)) },
      contacto: { d: "cómo escribirme", f: () => [
        fila("correo", enlace(`mailto:${P.correo}`, P.correo)),
        fila("whatsapp", enlace(`https://wa.me/${P.whatsapp}`, "+51 900 442 514")),
        fila("linkedin", enlace(P.linkedin, "charles-fuentes-flores")),
        fila("github", enlace(P.github, "CharsFuentes")),
      ] },
      visita: { d: "tu recorrido por esta página, en datos", f: () => api.visita() },
      tema: { d: "cambia entre claro y oscuro", arg: "[claro|oscuro]", f: (arg) => [`Tema ${api.tema(arg)}.`] },
      fuego: { d: "enciende la pantalla", f: () => { api.fuego(); return ["Calor liberado. Mira detrás de esta ventana."]; } },
      calor: { d: "pinta el fluido como mapa de calor clásico", f: () => [api.paleta() ? "Paleta de mapa de calor activada, como en Serenazgo Digital." : "Paleta de brasas restaurada."] },
      ruleta: { d: "abre un proyecto al azar", f: () => comandos.abrir.f(api.proyectos[Math.floor(Math.random() * api.proyectos.length)].id) },
      contratar: { d: "la mejor decisión del día", f: (arg, sudo) => {
        if (!sudo) return ["Permiso denegado. Prueba con <b>sudo contratar charles</b>."];
        api.fuego();
        return ["[sudo] contraseña para reclutador: ********", "Acceso concedido. Buena elección.", `Siguiente paso: ${enlace(`https://wa.me/${P.whatsapp}`, "escríbeme por WhatsApp")} o a ${enlace(`mailto:${P.correo}`, P.correo)}.`];
      } },
      limpiar: { d: "limpia la pantalla", f: () => { salida.innerHTML = ""; return []; } },
      salir: { d: "cierra la terminal", f: () => { dlg.close(); return []; } },
    };
    const ALIAS = { help: "ayuda", "?": "ayuda", ls: "proyectos", dir: "proyectos", whoami: "sobre", about: "sobre", clear: "limpiar", cls: "limpiar", exit: "salir", quit: "salir", open: "abrir", cd: "ir", theme: "tema", contact: "contacto", skills: "stack", hire: "contratar" };

    function ejecutar(texto) {
      const crudo = texto.trim();
      decir(`<span class="terminal__eco">charles@portafolio:~$</span> ${esc(crudo)}`);
      if (!crudo) return;
      historial.push(crudo);
      cursorHist = historial.length;
      let linea = crudo.toLowerCase().replace(/\s+/g, " ");
      const sudo = linea.startsWith("sudo ");
      if (sudo) linea = linea.slice(5);
      if (/^rm\s+-rf/.test(linea)) return decir("Buen intento. Este portafolio tiene respaldos.");
      if (linea === "pwd") return decir("/home/charles/portafolio");
      if (linea === "date") return decir(esc(new Date().toLocaleString("es-PE")));
      if (linea.startsWith("echo ")) return decir(esc(crudo.slice(crudo.toLowerCase().indexOf("echo ") + 5)));
      const [nombre, ...resto] = linea.split(" ");
      const clave = comandos[nombre] ? nombre : ALIAS[nombre];
      if (!clave) return decir(sudo ? "charles no está en el archivo sudoers. Este incidente será reportado." : `Comando no encontrado: ${esc(nombre)}. Escribe <b>ayuda</b>.`, "terminal__error");
      if (sudo && clave !== "contratar") return decir("No hace falta sudo aquí. Todo el portafolio es de lectura libre.");
      decir(comandos[clave].f(resto.join(" "), sudo));
    }

    function completar() {
      const v = entrada.value.toLowerCase();
      const partes = v.split(" ");
      let opciones = [];
      if (partes.length === 1) opciones = Object.keys(comandos).filter((k) => k.startsWith(partes[0]));
      else if (["abrir", "open"].includes(partes[0])) opciones = api.proyectos.map((p) => p.id).filter((id) => id.startsWith(partes[1])).map((id) => `${partes[0]} ${id}`);
      else if (["ir", "cd"].includes(partes[0])) opciones = Object.keys(SECCIONES).filter((s) => s.startsWith(partes[1])).map((s) => `${partes[0]} ${s}`);
      if (opciones.length === 1) entrada.value = opciones[0] + (partes.length === 1 && comandos[opciones[0]].arg ? " " : "");
      else if (opciones.length > 1) decir(esc(opciones.join("   ")), "terminal__tenue");
    }

    document.getElementById("terminal-form").addEventListener("submit", (e) => {
      e.preventDefault();
      ejecutar(entrada.value);
      entrada.value = "";
    });
    entrada.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); completar(); }
      else if (e.key === "ArrowUp" && historial.length) { e.preventDefault(); cursorHist = Math.max(0, cursorHist - 1); entrada.value = historial[cursorHist]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); cursorHist = Math.min(historial.length, cursorHist + 1); entrada.value = historial[cursorHist] || ""; }
      else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); salida.innerHTML = ""; }
    });
    document.getElementById("terminal-atajos").addEventListener("click", (e) => {
      const b = e.target.closest("[data-comando]");
      if (b) { ejecutar(b.dataset.comando); entrada.focus(); }
    });
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) return dlg.close();
      if (!e.target.closest("a, button") && !getSelection().toString()) entrada.focus();
    });
    document.getElementById("terminal-cerrar").addEventListener("click", () => dlg.close());
    dlg.addEventListener("close", () => api.alCerrar());

    function abrir() {
      if (dlg.open) return;
      dlg.showModal();
      api.alAbrir();
      if (!saludado) {
        saludado = true;
        decir(["Portafolio de Charles Fuentes, versión terminal.", "Escribe <b>ayuda</b> para ver los comandos. Tab autocompleta y las flechas recorren el historial.", ""]);
      }
      entrada.focus();
    }

    document.addEventListener("keydown", (e) => {
      const escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? dlg.close() : abrir(); }
      else if (e.key === "/" && !escribiendo && !document.querySelector("dialog[open]")) { e.preventDefault(); abrir(); }
    });
    document.querySelectorAll("[data-terminal]").forEach((b) => b.addEventListener("click", abrir));

    return { abrir };
  }

  return { iniciar };
})();
