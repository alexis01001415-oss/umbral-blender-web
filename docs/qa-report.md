# Auditoría Lighthouse de UMBRAL

Estado: sitio publicado y auditado. El bloqueo de rastreo de la raíz del dominio se corrigió mediante una excepción limitada a UMBRAL, y la comprobación pública final de SEO pasó.

## Método y alcance

Lighthouse CLI oficial 13.5.0, Chrome Headless 153.0.0.0 en Windows. Auditorías iniciales del build de producción servido en `http://127.0.0.1:4173/` el 21 de septiembre de 2026, a las 20:56 y 20:57, hora de Ciudad de México; reauditoría local del build actualizado a las 21:00 y 21:01. La publicación se auditó a las 21:08 en [la URL real de UMBRAL](https://alexis01001415-oss.github.io/umbral-blender-web/), después de confirmar el nuevo H1 y la retirada del nombre ARIA redundante. A las 21:13 se repitió únicamente SEO tras corregir el robots raíz; el contenido de la página no cambió y no se repitió rendimiento. Ejecución mediante `npx`, sin añadir dependencias al proyecto. [CLI oficial de Lighthouse](https://github.com/GoogleChrome/lighthouse#using-the-node-cli).

- Móvil: simulación de 412 × 823 px, DPR 1.75, RTT 150 ms, 1,638.4 Kbps y ralentización de CPU de 4×.
- Escritorio: preset `desktop`, 1350 × 940 px, DPR 1, RTT 40 ms, 10,240 Kbps y CPU de 1×.
- Una ejecución inicial y una posterior a las correcciones por perfil en localhost, más una ejecución móvil completa y una comprobación final de SEO sobre GitHub Pages. Son mediciones de laboratorio con Lighthouse CLI; no son datos de usuarios reales ni un informe de campo de PageSpeed Insights.
- La auditoría cubre la navegación inicial. Las funciones de 3D, scroll, teclado y PDF requieren la verificación funcional y visual adicional de esta iteración.

## Resultado sobre la publicación real

| Indicador | Móvil en GitHub Pages |
| --- | ---: |
| Rendimiento | 100 |
| Accesibilidad automática | 100 |
| Buenas prácticas | 100 |
| SEO automático, reauditoría independiente | 100 |
| First Contentful Paint | 1.4 s |
| Largest Contentful Paint | 1.5 s |
| Speed Index | 2.5 s |
| Total Blocking Time | 30 ms |
| Cumulative Layout Shift | 0.001 |
| Transferencia registrada | 151 KiB |
| Solicitudes registradas | 12 |

Rendimiento, accesibilidad, buenas prácticas y métricas de carga corresponden a la ejecución móvil completa de las 21:08. En esa ejecución SEO obtuvo 69 por un bloqueo en el `robots.txt` raíz. Tras aplicar la excepción de UMBRAL se repitió exclusivamente SEO a las 21:13: obtuvo 100, sin fallos ni advertencias, con los controles `is-crawlable` y `robots-txt` aprobados. Esta tabla reúne resultados de esas dos ejecuciones identificadas; no presenta las cuatro categorías como una sola corrida.

## Resultados locales después de las correcciones

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
2. **Resuelto: coincidencia del nombre de marca.** Se retiró el `aria-label` redundante y el contenido visible da nombre al enlace. La auditoría sobre la publicación confirmó que desapareció el hallazgo experimental `label-content-name-mismatch`.
3. **Resuelto: bloqueo real de rastreo.** El preview devolvía HTML al pedir `/robots.txt`, explicando su 92 local. La primera revisión pública encontró `Disallow: /` en [el robots efectivo del dominio](https://alexis01001415-oss.github.io/robots.txt), causando el 69 público. Se añadió `Allow: /umbral-blender-web/` en el mismo grupo y se anunció el sitemap del proyecto. El GET público confirmó las reglas y la reauditoría SEO obtuvo 100. La excepción está limitada a este proyecto y conserva el bloqueo de otras rutas. Un archivo dentro del proyecto no puede sustituir al de raíz; Google aplica la regla de ruta más específica. [Google: precedencia de reglas robots](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec#order-of-precedence-for-rules).
4. **Mejorado: miniaturas de colección.** La oportunidad estimada de imágenes de escritorio bajó de aproximadamente 153 KiB a 25 KiB después de añadir versiones WebP y tamaños responsivos. El peso de navegación de escritorio bajó en 235 KiB. El ahorro remanente es pequeño frente a la puntuación de rendimiento 100; comprobar la calidad visual antes de comprimir más.
5. **CSS inicial y fuentes.** Lighthouse señaló la hoja de estilo como recurso que bloquea el primer pintado y una cadena de descubrimiento de fuentes. El rendimiento móvil inicial ya obtuvo 99. La fuente local de iconos usa `font-display: block` intencionalmente para evitar que se vean nombres de ligaduras; el ahorro estimado de cambiarlo fue de unos 10 ms. Priorizar la legibilidad y una medición posterior antes de añadir mecanismos de carga más complejos.

## Cabeceras públicas

La respuesta pública del 21 de septiembre de 2026 a las 21:08 fue HTTP 200 e incluyó `Strict-Transport-Security: max-age=31556952` y `Cache-Control: max-age=600`. No incluyó cabeceras HTTP CSP, X-Frame-Options, X-Content-Type-Options o Referrer-Policy. El HTML sí contiene CSP y política de referrer mediante meta. La ausencia de cabeceras no se oculta bajo el 100 de buenas prácticas: ese resultado es una lista limitada de comprobaciones, no una auditoría de penetración ni una garantía frente a ataques. La CSP meta no implementa `frame-ancestors`; esa defensa necesita control de cabeceras del alojamiento.

## Archivos y reproducción

Informes completos locales:

- `output/qa/lighthouse-mobile.report.html` y `.json`.
- `output/qa/lighthouse-desktop.report.html` y `.json`.
- `output/qa/lighthouse-mobile-final.report.html` y `.json` (build actualizado).
- `output/qa/lighthouse-desktop-final.report.html` y `.json` (build actualizado).
- `output/qa/lighthouse-public-mobile.report.html` y `.json` (publicación, antes de corregir el bloqueo de robots).
- `output/qa/lighthouse-public-seo-final.report.html` y `.json` (comprobación SEO pública después de corregir robots).

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-mobile' --only-categories=performance,accessibility,best-practices,seo --quiet
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --preset=desktop --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-desktop' --only-categories=performance,accessibility,best-practices,seo --quiet
npx --yes lighthouse@13.5.0 'https://alexis01001415-oss.github.io/umbral-blender-web/' --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-public-seo-final' --only-categories=seo --quiet
```

La herramienta terminó de guardar los informes y después devolvió `EPERM` al limpiar su perfil temporal de Chrome en Windows. Los JSON contienen resultados completos, sin `runtimeError` ni `runWarnings`; el error corresponde a la limpieza de la herramienta. No se borraron perfiles ajenos ni se alteró el navegador del usuario.

La comprobación de rastreo está resuelta. El movimiento reducido pertenece a la verificación funcional separada; estas ejecuciones usan las preferencias predeterminadas de Lighthouse. La disponibilidad para rastreo y la puntuación SEO automática no garantizan indexación, resultados enriquecidos ni posiciones en Google.
