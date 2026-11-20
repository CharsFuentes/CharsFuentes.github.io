// Pozo de tecnologías: los logos caen con gravedad, chocan entre sí y se pueden agarrar y lanzar.
// Motor propio de círculos (integración de Euler con corrección de solapes), sin librerías.
window.Pozo = (() => {
  const GRANDES = new Set(["python", "django", "react", "flutter", "postgresql", "docker", "anthropic", "typescript"]);

  function crear(cont, logos, { alNombre = () => {} } = {}) {
    let W = cont.clientWidth, H = cont.clientHeight;
    const escala = W < 520 ? 0.62 : W < 900 ? 0.8 : 1;
    const cuerpos = logos.map((l, i) => {
      const r = Math.round((GRANDES.has(l.slug) ? 48 : 37) * escala + (i % 3) * 2);
      const el = document.createElement("div");
      el.className = "bola";
      el.style.width = el.style.height = `${r * 2}px`;
      el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${l.d}"/></svg>`;
      cont.append(el);
      return { el, r, m: r * r, x: 0, y: -200, vx: 0, vy: 0, ang: 0, w: 0, suelo: false, nombre: l.nombre };
    });
    const n = cuerpos.length;

    function sembrar() {
      cont.classList.add("activo");
      cuerpos.forEach((b, i) => {
        b.x = b.r + Math.random() * Math.max(1, W - 2 * b.r);
        b.y = -b.r - 40 - i * 46 - Math.random() * 60;
        b.vx = (Math.random() - 0.5) * 160;
        b.vy = 0;
        b.w = (Math.random() - 0.5) * 5;
      });
    }

    let agarrado = null, px = 0, py = 0;
    function paso(dt) {
      for (const b of cuerpos) {
        if (b === agarrado) { b.vx = (px - b.x) * 20; b.vy = (py - b.y) * 20; }
        else b.vy += 2300 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.ang += b.w * dt;
        b.suelo = false;
      }
      for (let it = 0; it < 6; it++) {
        for (let i = 0; i < n; i++) {
          const a = cuerpos[i];
          if (a.x < a.r) { a.x = a.r; if (a.vx < 0) a.vx *= -0.4; }
          else if (a.x > W - a.r) { a.x = W - a.r; if (a.vx > 0) a.vx *= -0.4; }
          if (a.y > H - a.r) { a.y = H - a.r; if (a.vy > 0) a.vy *= a.vy > 240 ? -0.32 : 0; a.suelo = true; }
          for (let j = i + 1; j < n; j++) {
            const b = cuerpos[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, d2 = dx * dx + dy * dy;
            if (d2 >= min * min || d2 === 0) continue;
            const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = min - d;
            const ia = a === agarrado ? 0 : 1 / a.m, ib = b === agarrado ? 0 : 1 / b.m, suma = ia + ib;
            if (!suma) continue;
            a.x -= nx * pen * (ia / suma); a.y -= ny * pen * (ia / suma);
            b.x += nx * pen * (ib / suma); b.y += ny * pen * (ib / suma);
            const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (vn < 0) {
              const j2 = (-(1 + (vn < -280 ? 0.28 : 0)) * vn) / suma;
              a.vx -= j2 * ia * nx; a.vy -= j2 * ia * ny;
              b.vx += j2 * ib * nx; b.vy += j2 * ib * ny;
            }
          }
        }
      }
      for (const b of cuerpos) {
        if (b.suelo) { b.vx *= 0.97; b.w += (b.vx / b.r - b.w) * 0.3; }
        else b.w *= 0.995;
        b.vx *= 0.9992;
      }
    }

    let visible = false, corriendo = false, sembrado = false, ultimo = 0;
    function cuadro(ahora) {
      if (!visible) { corriendo = false; return; }
      const dt = Math.min((ahora - ultimo) / 1000, 1 / 30);
      ultimo = ahora;
      paso(dt / 2);
      paso(dt / 2);
      for (const b of cuerpos) b.el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0) rotate(${b.ang}rad)`;
      requestAnimationFrame(cuadro);
    }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) return;
      if (!sembrado) { sembrado = true; sembrar(); }
      if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(cuadro); }
    }, { threshold: 0.15 }).observe(cont);
    new ResizeObserver(() => { W = cont.clientWidth; H = cont.clientHeight; }).observe(cont);

    // Agarrar, lanzar y tocar
    const local = (e) => { const r = cont.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; };
    const bajo = () => { for (let i = n - 1; i >= 0; i--) { const b = cuerpos[i]; if ((px - b.x) ** 2 + (py - b.y) ** 2 <= b.r * b.r) return b; } return null; };
    let inicio = null;
    cont.addEventListener("pointerdown", (e) => {
      local(e);
      const b = bajo();
      if (!b) return;
      agarrado = b;
      inicio = { x: e.clientX, y: e.clientY, t: performance.now() };
      b.el.classList.add("agarrada");
      alNombre(b.nombre);
      try { cont.setPointerCapture(e.pointerId); } catch {}
    });
    cont.addEventListener("pointermove", (e) => {
      local(e);
      if (!agarrado && e.pointerType === "mouse") { const b = bajo(); alNombre(b ? b.nombre : null); cont.style.cursor = b ? "grab" : ""; }
    });
    const soltar = (e) => {
      if (!agarrado) return;
      const b = agarrado;
      agarrado = null;
      b.el.classList.remove("agarrada");
      const quieto = inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 5 && performance.now() - inicio.t < 350;
      if (quieto) { b.vy = -1050; b.vx = (Math.random() - 0.5) * 500; b.w = (Math.random() - 0.5) * 14; }
      else { const v = Math.hypot(b.vx, b.vy), tope = 3200; if (v > tope) { b.vx *= tope / v; b.vy *= tope / v; } }
      if (e.pointerType !== "mouse") alNombre(null);
    };
    cont.addEventListener("pointerup", soltar);
    cont.addEventListener("pointercancel", soltar);
    cont.addEventListener("pointerleave", () => { if (!agarrado) alNombre(null); });

    return {
      sacudir(fuerza = 1) {
        cuerpos.forEach((b) => { b.vy -= (500 + Math.random() * 900) * fuerza; b.vx += (Math.random() - 0.5) * 900 * fuerza; b.w += (Math.random() - 0.5) * 12; });
      },
    };
  }

  return { crear };
})();
