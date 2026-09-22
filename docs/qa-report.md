# Auditoría Lighthouse de UMBRAL

Estado: build local reauditado después de corregir roles ARIA y optimizar imágenes/fuentes. Pendiente de comprobar SEO y cabeceras sobre la publicación real.

## Método y alcance

Lighthouse CLI oficial 13.5.0, Chrome Headless 153.0.0.0 en Windows, contra el build de producción servido en `http://127.0.0.1:4173/`. Auditorías iniciales secuenciales el 21 de septiembre de 2026, a las 20:56 y 20:57, hora de Ciudad de México; reauditoría del build actualizado a partir de las 21:01. Ejecución mediante `npx`, sin añadir dependencias al proyecto. [CLI oficial de Lighthouse](https://github.com/GoogleChrome/lighthouse#using-the-node-cli).

- Móvil: simulación de 412 × 823 px, DPR 1.75, RTT 150 ms, 1,638.4 Kbps y ralentización de CPU de 4×.
- Escritorio: preset `desktop`, 1350 × 940 px, DPR 1, RTT 40 ms, 10,240 Kbps y CPU de 1×.
- Una ejecución inicial y una posterior a las correcciones por perfil. Son mediciones de laboratorio en localhost; no son resultados de PageSpeed Insights sobre GitHub Pages ni datos de usuarios reales.
- La auditoría cubre la navegación inicial. Las funciones de 3D, scroll, teclado y PDF requieren la verificación funcional y visual adicional de esta iteración.

## Resultados después de las correcciones

| Indicador | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 99 | 100 |
| Accesibilidad automática | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO automático en preview | 92 | 92 |
| First Contentful Paint | 1.4 s | 0.3 s |
| Largest Contentful Paint | 1.7 s | 0.4 s |
| Speed Index | 1.4 s | 0.4 s |
| Total Blocking Time | 10 ms | 0 ms |
| Cumulative Layout Shift | 0.001 | 0.001 |
| Transferencia registrada | 151 KiB | 199 KiB |
| Solicitudes registradas | 12 | 15 |

La navegación inicial móvil no descargó el chunk Three.js ni el archivo GLB; la experiencia permanece diferida hasta activarla. Lighthouse no registró errores de ejecución ni advertencias de la auditoría. Estos resultados no certifican conformidad WCAG completa, seguridad integral ni posiciones de búsqueda. Tampoco miden INP de campo; TBT es la métrica de bloqueo de esta prueba de carga.

La línea base anterior tenía accesibilidad 97 en ambos perfiles y transfería 222 KiB en móvil y 434 KiB en escritorio. Las imágenes responsivas y las fuentes reducidas bajaron esa transferencia a 151 y 199 KiB, respectivamente. El build reauditado de `dist/index.html` tenía SHA-256 `4ADFF8AFA2B0F346100B8FAEC881E36A270411B36DB56F308DFC56CA6085BA83`.

## Hallazgos y estado

1. **Resuelto: nombre ARIA sobre un elemento sin rol compatible.** `#scene` tenía `aria-label` en un `div` genérico. Se añadió `role="region"`; el hallazgo desapareció en la reauditoría y accesibilidad subió a 100 en ambos perfiles.
2. **Pendiente: coincidencia exacta del nombre de marca.** El `aria-label` se amplió para incluir “LA LUZ SE HABITA”, pero la comprobación experimental continúa detectando una diferencia. La separación del texto `UMBRAL` y su `span` puede producir un nombre unido distinto del texto alternativo. Recomendación: dejar que el contenido visible dé nombre al enlace, retirando el `aria-label` redundante. No afecta la puntuación automática, pero conviene resolver la coherencia con la entrada por voz.
3. **SEO del servidor de preview.** Vite respondió al archivo ausente `/robots.txt` con el HTML de la página y estado 200. Lighthouse intentó interpretarlo como robots y encontró 36 líneas inválidas, causando el 92 de SEO. Es una diferencia del servidor de preview; comprobar la URL realmente publicada. No se añadió un robots ficticio para modificar la puntuación. En GitHub Pages bajo una ruta de proyecto, el robots efectivo corresponde a la raíz del dominio.
4. **Mejorado: miniaturas de colección.** La oportunidad estimada de imágenes de escritorio bajó de aproximadamente 153 KiB a 25 KiB después de añadir versiones WebP y tamaños responsivos. El peso de navegación de escritorio bajó en 235 KiB. El ahorro remanente es pequeño frente a la puntuación de rendimiento 100; comprobar la calidad visual antes de comprimir más.
5. **CSS inicial y fuentes.** Lighthouse señaló la hoja de estilo como recurso que bloquea el primer pintado y una cadena de descubrimiento de fuentes. El rendimiento móvil inicial ya obtuvo 99. La fuente local de iconos usa `font-display: block` intencionalmente para evitar que se vean nombres de ligaduras; el ahorro estimado de cambiarlo fue de unos 10 ms. Priorizar la legibilidad y una medición posterior antes de añadir mecanismos de carga más complejos.

## Archivos y reproducción

Informes completos locales:

- `output/qa/lighthouse-mobile.report.html` y `.json`.
- `output/qa/lighthouse-desktop.report.html` y `.json`.
- `output/qa/lighthouse-mobile-final.report.html` y `.json` (build actualizado).
- `output/qa/lighthouse-desktop-final.report.html` y `.json` (build actualizado).

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-mobile' --only-categories=performance,accessibility,best-practices,seo --quiet
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --preset=desktop --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-desktop' --only-categories=performance,accessibility,best-practices,seo --quiet
```

La herramienta terminó de guardar ambos informes y después devolvió `EPERM` al limpiar su perfil temporal de Chrome en Windows. Los JSON contienen resultados completos, sin `runtimeError` ni `runWarnings`; el error corresponde a la limpieza de la herramienta. No se borraron perfiles ajenos ni se alteró el navegador del usuario.

Falta comprobar SEO y cabeceras del alojamiento sobre la publicación real, y la última simplificación del nombre accesible de marca. El movimiento reducido corresponde a la verificación funcional separada; estas ejecuciones usan las preferencias predeterminadas de Lighthouse.
