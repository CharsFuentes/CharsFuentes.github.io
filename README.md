# Portafolio — Charles Fuentes Flores

Sitio web personal publicado con GitHub Pages: **https://charsfuentes.github.io**

Es un sitio estático (HTML, CSS y JavaScript sin dependencias ni paso de compilación).

## Estructura

```
index.html               página única
assets/css/styles.css    estilos
assets/js/data.js        contenido: perfil, proyectos, experiencia y tecnologías
assets/js/main.js        tarjetas, filtros y galería
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

Las capturas usan datos de demostración; no contienen datos personales reales.
