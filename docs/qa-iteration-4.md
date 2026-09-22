# Auditoría de la iteración 4

Estado: iteración publicada y comprobada en GitHub Pages. La auditoría móvil pública obtuvo 99 en rendimiento y 100 en accesibilidad automática, buenas prácticas y SEO. Incluye aves del hero, entradas de texto y nuevo footer de contacto.

## Método

Lighthouse CLI oficial 13.5.0, Chrome Headless 153.0.0.0 en Windows, mediante `npx` sin añadir dependencias. Dos ejecuciones secuenciales sobre `http://127.0.0.1:4173/`, el 21 de septiembre de 2026 a las 22:11:16 y 22:11:39, hora de Ciudad de México. Se verificaron HTTP 200, el nuevo footer y los assets `index-UbHjUkzA.js` / `index-BZDNL6Hp.css` antes de ejecutar las auditorías. [Documentación del CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli).

La comprobación pública móvil se ejecutó a las 22:20:38 del mismo día sobre [UMBRAL en GitHub Pages](https://alexis01001415-oss.github.io/umbral-blender-web/), después de concluir con éxito [Actions 35686423427](https://github.com/alexis01001415-oss/umbral-blender-web/actions/runs/35686423427) para el commit `617955cb8885edea1ec71ee4e8a1cd8bcdbc8cc6`. El GET previo devolvió HTTP 200, el nuevo footer/formulario y los mismos assets. El hash del HTML público coincide con el build local auditado. Se utilizó la misma versión y configuración móvil; no se repitió escritorio sobre la publicación.

- Móvil: 412 × 823 px, DPR 1.75, RTT simulado de 150 ms, 1,638.4 Kbps y CPU 4×.
- Escritorio: preset `desktop`, 1350 × 940 px, DPR 1, RTT simulado de 40 ms, 10,240 Kbps y CPU 1×.
- Una ejecución local por perfil y una ejecución móvil pública. Son mediciones de laboratorio de la carga inicial, sin desplazarse por la página ni activar Three.js. No son datos de campo ni miden el INP de usuarios reales.
- La interacción con el formulario y las animaciones activadas al hacer scroll necesita la comprobación funcional separada. La puntuación automática de accesibilidad no certifica por sí sola conformidad WCAG completa.

## Resultado móvil público

| Indicador | GitHub Pages |
| --- | ---: |
| Rendimiento | 99 |
| Accesibilidad automática | 100 |
| Buenas prácticas | 100 |
| SEO automático | 100 |
| First Contentful Paint | 1.4 s |
| Largest Contentful Paint | 1.6 s |
| Speed Index | 2.5 s |
| Total Blocking Time | 60 ms |
| Cumulative Layout Shift | 0.003 |
| Transferencia registrada | 188 KiB |
| Solicitudes registradas | 13 |

Las cuatro categorías pertenecen a la misma ejecución. El JSON contiene `runWarnings: []`, ningún `runtimeError` y ningún control de accesibilidad fallido. `robots-txt` e `is-crawlable` están aprobados. El GET al robots efectivo de raíz confirmó `Disallow: /` junto a la excepción específica `Allow: /umbral-blender-web/` y los dos sitemaps. El proyecto se puede rastrear; esto no garantiza indexación ni posiciones de búsqueda.

El LCP público sigue siendo la imagen de la ventana abierta. El desplazamiento registrado corresponde al párrafo del hero, con CLS total 0.003. La carga inicial no solicita Three.js ni el GLB. Quedan oportunidades estimadas de caché del alojamiento (160 KiB para visitas repetidas), CSS que bloquea el render (330 ms), fuente de iconos (30 ms) y cadena de descubrimiento de recursos. Son estimaciones de Lighthouse, no ahorros medidos ni fallos funcionales.

## Resultados locales

| Indicador | Móvil | Escritorio |
| --- | ---: | ---: |
| Rendimiento | 99 | 100 |
| Accesibilidad automática | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO automático del preview | 92 | 92 |
| First Contentful Paint | 1.4 s | 0.3 s |
| Largest Contentful Paint | 1.8 s | 0.5 s |
| Speed Index | 1.4 s | 0.5 s |
| Total Blocking Time | 60 ms | 10 ms |
| Cumulative Layout Shift | 0.002 | 0.002 |
| Transferencia registrada | 188 KiB | 214 KiB |
| Solicitudes registradas | 13 | 16 |

Ambos JSON contienen `runWarnings: []`, ningún `runtimeError` y ningún control de accesibilidad fallido. No aparecen fallos automáticos nuevos por los campos, sus etiquetas o el footer. Las solicitudes iniciales siguen sin incluir Three.js ni el GLB, y no incorporan recursos externos.

## Animaciones, LCP y CLS

En las mediciones locales, el elemento LCP sigue siendo la imagen de la ventana abierta del hero en ambos perfiles. Los desplazamientos registrados se atribuyen al H1 y, en móvil, al párrafo del hero; el informe identifica carga de fuentes entre sus causas. Ninguno de esos elementos es el nuevo grupo de aves. El CLS local total permanece en 0.002, frente a 0.003 móvil y 0.002 escritorio del build local de la iteración 3.

El LCP móvil conserva los 1.8 s locales de la iteración anterior; escritorio pasa de 0.4 a 0.5 s. TBT pasa de 40 a 60 ms móvil y de 0 a 10 ms escritorio. La transferencia aumenta aproximadamente 7 KiB por perfil, sin solicitudes adicionales. Una ejecución por versión no permite atribuir estas diferencias pequeñas a una función concreta ni separar toda la variabilidad del entorno.

Los encabezados H2 están fuera de la vista inicial, por lo que estas ejecuciones no miden su animación de escritura al recorrer la página. No se presenta el CLS de carga inicial como prueba de ausencia de desplazamientos durante todas las interacciones. La conservación de nodos originales, el overlay absoluto, la restauración al seleccionar/focalizar y el movimiento reducido se comprueban en la revisión de código y en la prueba funcional separada.

## Hallazgos y límites

1. **SEO del preview:** el único fallo SEO es `robots-txt`. El servidor local devuelve el HTML para `/robots.txt`, interpretado como 1,356 líneas inválidas. Esto no describe las reglas del dominio de GitHub Pages. La revisión pública final obtuvo 100 y confirmó que el proyecto permite el rastreo.
2. **Trabajo inicial en móvil:** Lighthouse señala 2.1 s de trabajo del hilo principal, incluidos aproximadamente 1.0 s de estilo/layout. La TBT medida es 60 ms; estas cifras describen conceptos distintos y no deben sumarse. También identifica aproximadamente 48.8 ms de reflow en el ajuste de dimensiones del módulo de ambientes. No se cambió ese módulo durante la auditoría.
3. **CSS y fuentes:** se mantiene una oportunidad estimada de 430 ms por CSS que bloquea el render móvil y la cadena de descubrimiento de recursos. La fuente de iconos tiene una estimación de 10 ms móvil / 30 ms escritorio; su `font-display: block` evita mostrar nombres de ligaduras. Los ahorros son estimaciones, no mejoras demostradas.
4. **Imágenes de escritorio:** oportunidad estimada de 13 KiB, con rendimiento total 100. No se comprimieron más las imágenes durante esta medición.
5. **Limpieza de Lighthouse en Windows:** los tres procesos guardaron informes completos y posteriormente devolvieron `EPERM` al limpiar el perfil temporal de Chrome. El error procede de `chrome-launcher`, no de la página. Los informes no contienen errores ni advertencias de ejecución de Lighthouse. No se borraron perfiles del usuario.

## Comprobación funcional

Se revisó el build en el navegador integrado con viewports de 1440 × 1000, 1024 × 768, 768 × 1024, 390 × 844 y 320 × 568 px. No se detectó desbordamiento horizontal. El footer ocupa al menos una pantalla y crece cuando lo necesita el formulario; no recorta contenido en móvil. Los campos conservan 16 px y el control de ambientación un área mínima de 44 px.

- **Aves:** vuelo visible detrás del vidrio, pausa y reanudación operativas; al cerrar completamente la persiana, el estado pasa a `covered` y el recorte queda sin área visible. Fuera del hero pasa a `hidden`. La suspensión de RAF, el límite de DPR, movimiento reducido y limpieza se comprobaron además con un entorno DOM/canvas controlado. No se cambió la preferencia del sistema operativo.
- **Texto:** se observó la escritura intermedia del encabezado del footer y su retorno al texto original, sin cambio visible de línea o posición. La selección, el foco y los cambios de tamaño conservan un mecanismo de finalización inmediata; los lectores de pantalla reciben el encabezado original y la copia animada permanece oculta a accesibilidad.
- **Formulario:** enviar vacío enfoca el primer campo obligatorio; un mensaje compuesto solo por espacios se rechaza. Con datos ficticios válidos aparece una vista previa enfocada, con el espacio elegido o «Sin especificar». «Seguir editando» conserva los valores y devuelve el foco al mensaje.
- **Demostración y seguridad:** la cadena `<strong>Texto de prueba</strong>` aparece literalmente, sin convertirse en HTML. La URL no cambia ni incorpora datos. El módulo no solicita red ni persiste los datos; el HTML mantiene el fieldset deshabilitado hasta conectar los eventos y la CSP conserva `form-action 'none'`. La preferencia de pausa sí puede guardarse en sessionStorage, sin información del formulario.
- **Navegación y consola:** el acceso Contacto del menú móvil llega al footer y cierra el menú. No se registraron advertencias ni errores de consola durante estas comprobaciones.
- **Regresión:** `npm test` pasó sus 21 pruebas existentes y `npm run build` terminó correctamente. No se modificaron el generador de PDF, las escenas, los renders ni los archivos del visor 3D durante esta iteración.

Estas comprobaciones usan emulación de tamaño en escritorio; no sustituyen pruebas en dispositivos táctiles físicos ni una auditoría manual completa con lector de pantalla.

Después del despliegue también se revisó la URL pública: aves visibles en estado `running`, nuevo footer presente y formulario con datos ficticios válidos. Se comprobó la vista previa enfocada, el aviso de que no se envió un mensaje y una URL sin parámetros; al volver a editar se conserva el contenido y el foco regresa al mensaje. No se observó desbordamiento horizontal ni advertencias o errores de consola en esa comprobación.

## Archivos de evidencia

HTML local capturado en `output/qa/v4-local-page.html`; coincide con `dist/index.html`. SHA-256:

`13b90a4156e5d612d4a7604143f5024a625b7cb61854b21c5b6d67cfdc210754`

| Informe | Fecha UTC | SHA-256 del JSON |
| --- | --- | --- |
| `output/qa/lighthouse-v4-mobile.report.json` | `2026-09-22T04:11:16.334Z` | `f78818af2ff79f685d3f1e1f218c6fba33973815b07be4ee92570081e233239a` |
| `output/qa/lighthouse-v4-desktop.report.json` | `2026-09-22T04:11:39.643Z` | `e963f61ff35788489141f2e995d11dd74c03cb820bddaf4fcc803e02ba018c40` |

Se guardaron también los informes `.report.html` con los mismos nombres.

El HTML público está capturado en `output/qa/v4-public-page.html`, con el mismo SHA-256 del build local:

`13b90a4156e5d612d4a7604143f5024a625b7cb61854b21c5b6d67cfdc210754`

Informe público: `output/qa/lighthouse-v4-public-mobile.report.json` y su versión `.report.html`, tiempo UTC `2026-09-22T04:20:38.771Z`. SHA-256 del JSON:

`0047283adb77fb9d919b77f1fb26860b50c0dba0214728a8e17b803e6ac59d69`

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-v4-mobile' --only-categories=performance,accessibility,best-practices,seo --quiet
npx --yes lighthouse@13.5.0 'http://127.0.0.1:4173/' --preset=desktop --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-v4-desktop' --only-categories=performance,accessibility,best-practices,seo --quiet
npx --yes lighthouse@13.5.0 'https://alexis01001415-oss.github.io/umbral-blender-web/' --chrome-flags='--headless' --output=html --output=json --output-path='output/qa/lighthouse-v4-public-mobile' --only-categories=performance,accessibility,best-practices,seo --quiet
```
