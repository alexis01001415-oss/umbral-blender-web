# Auditoría local de la iteración 3

Estado: build de producción comprobado en localhost. Este documento no atribuye estos resultados a una publicación posterior ni sustituye el informe de la versión publicada anterior.

Las mediciones locales de abajo preceden ajustes posteriores de foco, zoom táctil y respaldo de imagen; identifican su build mediante hash. La revisión pública final, cuando se añada al documento, corresponde al sitio desplegado.

## Método

Lighthouse CLI oficial 13.5.0, Chrome Headless 153.0.0.0 y Windows, mediante `npx` sin añadir dependencias. URL: `http://127.0.0.1:4173/`. Una ejecución por perfil el 21 de septiembre de 2026: móvil a las 21:38:05 y escritorio a las 21:38:47, hora de Ciudad de México. [Documentación del CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli).

- Móvil: 412 × 823 px, DPR 1.75, RTT simulado de 150 ms, 1,638.4 Kbps y CPU 4×.
- Escritorio: preset `desktop`, 1350 × 940 px, DPR 1, RTT simulado de 40 ms, 10,240 Kbps y CPU 1×.
- Son mediciones de laboratorio sobre la carga inicial, sin activación del modelo 3D. No son datos de campo, ni miden INP de usuarios reales.
- El scroll de ambientes, las pestañas, sus controles de teclado, el movimiento reducido y el PDF requieren la verificación funcional separada. Un 100 automático de accesibilidad no certifica conformidad WCAG completa.

## Resultados

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

1. **SEO del preview:** el único control SEO fallido es `robots-txt`. El servidor local devuelve el HTML de la página para `/robots.txt`; Lighthouse lo interpreta como 1,105 líneas inválidas. No representa las reglas del dominio publicado. La excepción de rastreo de UMBRAL en la raíz de GitHub Pages fue comprobada en la iteración anterior; una revisión de esta publicación debe medirse sobre su URL real.
2. **Primer pintado:** la hoja de estilos bloquea el render inicial. Lighthouse estima una oportunidad de 430 ms en móvil y señala la cadena de descubrimiento de fuentes. Esta estimación no debe restarse directamente del LCP medido. La carga total obtiene 99 móvil y 100 escritorio; cualquier división adicional de CSS merece otra medición antes de asumir una mejora.
3. **Fuente de iconos:** oportunidad estimada de 10 ms por `font-display`. El subconjunto local de Material Symbols usa `block` para evitar mostrar nombres de ligaduras mientras carga. No se cambió ese comportamiento durante la auditoría.
4. **Imágenes de escritorio:** oportunidad estimada de 13 KiB. La transferencia móvil aumentó respecto a la comprobación local anterior de 151 a 181 KiB; incluye la nueva imagen de comparación diurna, aproximadamente 23 KB transferidos, y el crecimiento de JS/CSS de esta iteración.
5. **Herramienta en Windows:** ambos procesos guardaron los informes completos y después devolvieron `EPERM` al limpiar el perfil temporal de Chrome. Es un fallo de limpieza de `chrome-launcher`, no un error de ejecución de la página. No se borraron perfiles ajenos ni se alteró el navegador del usuario.

## Evidencia y reproducción

### Comprobación funcional y visual

- Build de producción revisado en navegador a 1440×1000, 1024×768, 768×1024, 390×844 y 320×568. Sin desbordamiento horizontal en esos tamaños. Revisados hero, colección, ambientes, acabados y preguntas.
- En escritorio: body 16 px/22.4 px con tracking 1.5 px; H1 con tracking 1.5 px y line-height 120%. Tablet: tracking de texto .75 px y line-height 145%; móvil .25 px y 150%. La escala y los controles se ajustan por breakpoint.
- Visor activado: luz de día y atardecer, Lino/Negro, selección de Detalle y cierre hasta 0% comprobados. Siete muestras de 44×44 px. Se conservan inversión, cámaras y recorrido.
- Comparador arrastrado en escritorio y viewport móvil; teclado Inicio/Fin comprobado a 0/100 y flechas con lectura porcentual. Código permite `pan-y pinch-zoom`; no se simuló un dispositivo táctil físico.
- Ambientes comprobados por scroll Dormitorio → Sala → Home office y regreso, con clic y teclado. El scroll no cambia el foco. En 320×568 entra en modo de pestañas estáticas; en 390×844 y ambos tamaños de tablet el contenido cabe y se activa el recorrido.
- Acabados: altura 920 px con viewport de 1000 y header de 80; 772 px con viewport de 844 y header de 72. Seleccionar Arena actualiza el acabado del visor y la primera ventana del cotizador.
- Botones de ambos tonos del hero mantienen sincronizados sus estados de teclado mediante CSS. Entradas terminan al recibir foco; si el foco precede al observador se omite la entrada. Movimiento reducido revisado en código: no se inician las entradas y los ambientes conservan tabs sin fijación. No se cambió la preferencia del sistema del usuario.
- 15 preguntas disponibles; respuestas abiertas y legibles a 320 px. Los datos de formulario y el generador PDF permanecen sin cambios de código.
- `npm test`: 21/21; `npm run build`: correcto. Verificación sin cambios en `src/quote.js`, `src/quote-pricing.js`, `src/quote.css`, el GLB y el proyecto Blender del hero. El `.blend` original con cambios locales del usuario se excluye de esta publicación.

### Auditorías locales

SHA-256 del `dist/index.html` auditado:

`cfa043e31a42bbb2146aaa25ee9c86fe8626eb64b406cc31160654f6c2a0172b`

| Informe | SHA-256 del JSON |
| --- | --- |
| `output/qa/lighthouse-v3-mobile.report.json` | `2ae52bb542fa463f8af5b3515c37f42e190ea63f83cc51df722ad1af22d77c51` |
| `output/qa/lighthouse-v3-desktop.report.json` | `e7f066b9b31f8410000578ecab2ff96187cec64c1677ba738fc18533d1f0ba45` |

También se guardaron las versiones `.report.html` con los mismos nombres. Sus tiempos UTC son `2026-09-22T03:38:05.381Z` y `2026-09-22T03:38:47.921Z`, respectivamente.

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-v3-mobile' --only-categories=performance,accessibility,best-practices,seo --quiet
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --preset=desktop --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-v3-desktop' --only-categories=performance,accessibility,best-practices,seo --quiet
```
