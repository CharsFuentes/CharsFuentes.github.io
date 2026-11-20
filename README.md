# Portafolio de Charles Fuentes Flores

Sitio web personal publicado con GitHub Pages: **https://charsfuentes.github.io**

Es un sitio estático (HTML, CSS y JavaScript sin paso de compilación; las librerías van incluidas en assets/vendor).

## Estructura

```
index.html               página única
assets/css/styles.css    estilos
assets/js/data.js        contenido: perfil, proyectos, experiencia y tecnologías
assets/js/main.js        render, animaciones (GSAP + ScrollTrigger), galería y medición de la visita
assets/js/fx-fluido.js   campo térmico: simulación de fluido en WebGL2 pintada como isotermas
assets/js/fx-anillo.js   anillos 3D de pantallas (CSS 3D, arrastre con inercia)
assets/js/fx-fisica.js   pozo de logos con física propia (gravedad, choques, agarrar y lanzar)
assets/js/terminal.js    terminal interactiva (Ctrl + K)
assets/js/logos.js       logos de tecnologías (Simple Icons, CC0)
assets/vendor/           GSAP, ScrollTrigger, Lenis e íconos Phosphor, servidos localmente
assets/fonts/            Geist y Geist Mono
assets/img/proyectos/    capturas en WebP, una carpeta por proyecto
perfil/README.md         README para el repositorio de perfil CharsFuentes/CharsFuentes
```

## Agregar o editar un proyecto

1. Copia las capturas a `assets/img/proyectos/<id>/` (de preferencia en WebP, máximo 1400 px de ancho).
2. Agrega un objeto a `PROYECTOS` en `assets/js/data.js` con el mismo `id`. La primera imagen es la portada de la tarjeta.
3. Cada proyecto tiene enlace directo: `https://charsfuentes.github.io/#<id>`.

## Ver en local

```bash
python -m http.server 8000
# abre http://localhost:8000
```

## Efectos y cómo se degradan

- El fluido solo corre a toda fuerza en la portada y en el contacto; en el resto acompaña al cursor y se duerme si no hay movimiento. Si el equipo no llega a 30 cuadros por segundo baja la resolución y, si aun así no alcanza, se apaga solo. Sin WebGL2 simplemente no se muestra.
- Los anillos y el pozo de logos solo calculan mientras están en pantalla.
- Con "reducir movimiento" activado en el sistema no hay intro, fluido, scroll con inercia ni animaciones: todo queda visible y estático.
- Las transiciones de vista (la foto que viaja a la galería y el cambio de tema en círculo) usan la View Transitions API; donde no existe, el cambio es inmediato.
- Terminal: `Ctrl + K` o `/`. Prueba `ayuda`, `abrir zivo`, `visita`, `fuego`, `calor` y `sudo contratar charles`.

Las capturas usan datos de demostración; no contienen datos personales reales.
