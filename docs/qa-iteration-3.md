# Auditoría de la iteración 3

Estado: iteración publicada y comprobada en GitHub Pages. La auditoría móvil pública obtuvo 99 en rendimiento y 100 en accesibilidad automática, buenas prácticas y SEO. Los resultados locales se conservan como evidencia de un build anterior.

Las mediciones locales de abajo preceden ajustes posteriores de foco, zoom táctil y respaldo de imagen; identifican su build mediante hash. La revisión pública final corresponde al commit `1a7786d686c98e9cafe1c99fb12ffc2f19911e63` desplegado mediante [Actions 35684429862](https://github.com/alexis01001415-oss/umbral-blender-web/actions/runs/35684429862), concluido con éxito.

## Método

Lighthouse CLI oficial 13.5.0, Chrome Headless 153.0.0.0 y Windows, mediante `npx` sin añadir dependencias. URL: `http://127.0.0.1:4173/`. Una ejecución por perfil el 21 de septiembre de 2026: móvil a las 21:38:05 y escritorio a las 21:38:47, hora de Ciudad de México. [Documentación del CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli).

La comprobación pública móvil se ejecutó el mismo día a las 21:48:13 sobre [UMBRAL en GitHub Pages](https://alexis01001415-oss.github.io/umbral-blender-web/), con la misma versión y configuración móvil. Antes de auditar se verificó HTTP 200, el nuevo atributo `data-duo-comparison` y los assets `index-CmD4HlT2.js` e `index-CKv7Wc0Q.css`. El HTML público se guardó con su hash. No se repitió la auditoría de escritorio sobre la publicación.

- Móvil: 412 × 823 px, DPR 1.75, RTT simulado de 150 ms, 1,638.4 Kbps y CPU 4×.
- Escritorio: preset `desktop`, 1350 × 940 px, DPR 1, RTT simulado de 40 ms, 10,240 Kbps y CPU 1×.
- Son mediciones de laboratorio sobre la carga inicial, sin activación del modelo 3D. No son datos de campo, ni miden INP de usuarios reales.
- El scroll de ambientes, las pestañas, sus controles de teclado, el movimiento reducido y el PDF requieren la verificación funcional separada. Un 100 automático de accesibilidad no certifica conformidad WCAG completa.

## Resultado móvil público

| Indicador | GitHub Pages |
| --- | ---: |
| Rendimiento | 99 |
| Accesibilidad automática | 100 |
| Buenas prácticas | 100 |
| SEO automático | 100 |
| First Contentful Paint | 1.4 s |
| Largest Contentful Paint | 1.6 s |
| Speed Index | 1.4 s |
| Total Blocking Time | 30 ms |
| Cumulative Layout Shift | 0.003 |
| Transferencia registrada | 181 KiB |
| Solicitudes registradas | 13 |

Todas las categorías de esta tabla corresponden a una sola ejecución pública. El informe contiene `runWarnings: []`, ningún `runtimeError` y ningún control de accesibilidad fallido. `robots-txt` e `is-crawlable` están aprobados. El GET al robots raíz confirmó `Disallow: /` junto a la excepción más específica `Allow: /umbral-blender-web/` y ambos sitemaps. Esto permite el rastreo de este proyecto; no garantiza indexación ni posición en buscadores.

La carga inicial pública tampoco solicita Three.js ni el GLB. Las oportunidades estimadas remanentes son CSS que bloquea el render (380 ms), fuente de iconos (20 ms), cadena de descubrimiento de recursos y caché de 10 minutos del alojamiento (155 KiB estimados para visitas repetidas). No son fallos de la página ni ahorros medidos; no se alteró el alojamiento para perseguir esas estimaciones.

## Resultados locales anteriores

| Indicador | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 99 | 100 |
| Accesibilidad automática | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO automático del preview | 92 | 92 |
| First Contentful Paint | 1.4 s | 0.3 s |
| Largest Contentful Paint | 1.8 s | 0.4 s |
| Speed Index | 1.4 s | 0.4 s |
| Total Blocking Time | 40 ms | 0 ms |
| Cumulative Layout Shift | 0.003 | 0.002 |
| Transferencia registrada | 181 KiB | 207 KiB |
| Solicitudes registradas | 13 | 16 |

Los dos JSON contienen `runWarnings: []` y ningún `runtimeError`. No hay comprobaciones de accesibilidad fallidas. Las solicitudes registradas no incluyen el chunk Three.js ni el GLB: la experiencia 3D sigue diferida hasta la interacción.

## Hallazgos y límites

1. **SEO del preview:** el único control SEO fallido es `robots-txt`. El servidor local devuelve el HTML de la página para `/robots.txt`; Lighthouse lo interpreta como 1,105 líneas inválidas. No representa las reglas del dominio publicado. La auditoría de esta publicación sobre su URL real obtuvo 100 y confirmó que el rastreo permanece permitido.
2. **Primer pintado:** la hoja de estilos bloquea el render inicial. Lighthouse estima una oportunidad de 430 ms en móvil y señala la cadena de descubrimiento de fuentes. Esta estimación no debe restarse directamente del LCP medido. La carga total obtiene 99 móvil y 100 escritorio; cualquier división adicional de CSS merece otra medición antes de asumir una mejora.
3. **Fuente de iconos:** oportunidad estimada de 10 ms por `font-display`. El subconjunto local de Material Symbols usa `block` para evitar mostrar nombres de ligaduras mientras carga. No se cambió ese comportamiento durante la auditoría.
4. **Imágenes de escritorio:** oportunidad estimada de 13 KiB. La transferencia móvil aumentó respecto a la comprobación local anterior de 151 a 181 KiB; incluye la nueva imagen de comparación diurna, aproximadamente 23 KB transferidos, y el crecimiento de JS/CSS de esta iteración.
5. **Herramienta en Windows:** los tres procesos guardaron los informes completos y después devolvieron `EPERM` al limpiar el perfil temporal de Chrome. Es un fallo de limpieza de `chrome-launcher`, no un error de ejecución de la página. No se borraron perfiles ajenos ni se alteró el navegador del usuario.

## Evidencia y reproducción

### Comprobación funcional y visual

- Build de producción revisado en navegador a 1440×1000, 1024×768, 768×1024, 390×844 y 320×568. Sin desbordamiento horizontal en esos tamaños. Revisados hero, colección, ambientes, acabados y preguntas.
- En escritorio: body 16 px/22.4 px con tracking 1.5 px; H1 con tracking 1.5 px y line-height 120%. Tablet: tracking de texto .75 px y line-height 145%; móvil .25 px y 150%. La escala y los controles se ajustan por breakpoint.
- Visor activado: luz de día y atardecer, Lino/Negro, selección de Detalle y cierre hasta 0% comprobados. Inicio devuelve la cámara a Espacio y actualiza `aria-pressed` sin cambiar el foco. Siete muestras de 44×44 px. Se conservan inversión, cámaras y recorrido.
- Comparador arrastrado en escritorio y viewport móvil; teclado Inicio/Fin comprobado a 0/100 y flechas con lectura porcentual. Código permite `pan-y pinch-zoom`; no se simuló un dispositivo táctil físico.
- Ambientes comprobados por scroll Dormitorio → Sala → Home office y regreso, con clic y teclado. El scroll no cambia el foco. En 320×568 entra en modo de pestañas estáticas; en 390×844 y ambos tamaños de tablet el contenido cabe y se activa el recorrido.
- Acabados: altura 920 px con viewport de 1000 y header de 80; 772 px con viewport de 844 y header de 72. Seleccionar Arena actualiza el acabado del visor y la primera ventana del cotizador.
- Botones de ambos tonos del hero mantienen sincronizados sus estados de teclado mediante CSS. Entradas terminan al recibir foco; si el foco precede al observador se omite la entrada. Movimiento reducido revisado en código: no se inician las entradas y los ambientes conservan tabs sin fijación. No se cambió la preferencia del sistema del usuario.
- 15 preguntas disponibles; respuestas abiertas y legibles a 320 px. Los datos de formulario y el generador PDF permanecen sin cambios de código.
- Revisión en GitHub Pages: 15 preguntas, siete tonos, selector Dúo a 51%, ambas imágenes WebP cargadas, Sala seleccionada y CSP presente. Sin errores ni advertencias en la consola durante las comprobaciones.
- `npm test`: 21/21; `npm run build`: correcto. Verificación sin cambios en `src/quote.js`, `src/quote-pricing.js`, `src/quote.css`, el GLB y el proyecto Blender del hero. El `.blend` original con cambios locales del usuario se excluye de esta publicación.

### Auditorías locales

SHA-256 del `dist/index.html` auditado:

`cfa043e31a42bbb2146aaa25ee9c86fe8626eb64b406cc31160654f6c2a0172b`

| Informe | SHA-256 del JSON |
| --- | --- |
| `output/qa/lighthouse-v3-mobile.report.json` | `2ae52bb542fa463f8af5b3515c37f42e190ea63f83cc51df722ad1af22d77c51` |
| `output/qa/lighthouse-v3-desktop.report.json` | `e7f066b9b31f8410000578ecab2ff96187cec64c1677ba738fc18533d1f0ba45` |

También se guardaron las versiones `.report.html` con los mismos nombres. Sus tiempos UTC son `2026-09-22T03:38:05.381Z` y `2026-09-22T03:38:47.921Z`, respectivamente.

### Auditoría pública final

HTML de respuesta guardado en `output/qa/v3-public-page.html`, SHA-256:

`1c2097407e3622c496678d54085ba39fa7ec5eb685b39f6d57337752286a2621`

Informe `output/qa/lighthouse-v3-public-mobile.report.json` y su versión `.report.html`, tiempo UTC `2026-09-22T03:48:13.884Z`. SHA-256 del JSON:

`61ac1c2decfa94a3a34dafc785a53f983ea2610f70cdf45e814863a87ce6cb67`

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-v3-mobile' --only-categories=performance,accessibility,best-practices,seo --quiet
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --preset=desktop --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-v3-desktop' --only-categories=performance,accessibility,best-practices,seo --quiet
npx --yes lighthouse@13.5.0 'https://alexis01001415-oss.github.io/umbral-blender-web/' --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-v3-public-mobile' --only-categories=performance,accessibility,best-practices,seo --quiet
```
