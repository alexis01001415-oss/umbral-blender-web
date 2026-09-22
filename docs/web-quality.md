# Calidad web de UMBRAL

Revisión de fuentes y criterios para la segunda iteración, 21 de septiembre de 2026. Este documento separa objetivos de calidad de resultados medidos: no es una certificación WCAG ni una promesa de posición en Google.

## Búsqueda, respuestas y contenido

La página debe exponer en HTML su propuesta, diferencias entre materiales, uso por habitación, guía de medidas y preguntas frecuentes. El 3D complementa esa información. Usar un H1 descriptivo, H2 por sección, anclas reales, título y descripción específicos, URL canónica absoluta, imagen social local y sitemap con la URL publicada. El contenido esencial y la navegación deben poder leerse sin ejecutar JavaScript.

En esta URL de proyecto, un archivo `/umbral-blender-web/robots.txt` no controla a los rastreadores: `robots.txt` debe estar en la raíz del dominio. El rastreo está permitido por defecto si no hay restricciones. El sitemap sí puede servirse en la ruta del proyecto; su envío a Search Console requiere acceso a una propiedad verificada. [Google: ubicación de robots.txt](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt).

Google aplica sus fundamentos de SEO a AI Overviews y AI Mode: contenido útil, rastreable y textual, buen funcionamiento y datos estructurados coherentes. No exige archivos de IA ni un esquema especial y no garantiza rastreo, indexación o aparición. El trabajo técnico ayuda a la elegibilidad; no garantiza los primeros lugares. [Google: funciones de IA y sitios web](https://developers.google.com/search/docs/appearance/ai-features).

Para este prototipo, usar `WebSite` y `WebPage` en JSON-LD con nombre, descripción, idioma y URL verdaderos. No añadir domicilio, teléfono, años de operación, reseñas, estrellas, premios, certificaciones ni garantías comerciales no proporcionados por el propietario. Los precios del cotizador deben identificarse como ilustrativos. Reservar `Product`/`Offer` para productos, precios y condiciones comerciales verificados. Google requiere datos relevantes y fieles al contenido visible. [Políticas de datos estructurados](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

Las preguntas frecuentes siguen siendo útiles para las personas. Omitir la promesa de resultados enriquecidos FAQ: Google retiró esa función a partir del 7 de mayo de 2026. [Registro oficial de cambios](https://developers.google.com/search/updates).

## Accesibilidad y diseño

Usar Brawler para títulos, Nunito Sans para cuerpo y controles; cuerpo de 16 px, interlineado aproximado de 1.6, bloques de lectura breves y espaciado basado en 8 px. Los tamaños de encabezado deben adaptarse sin recortar texto. Objetivo: WCAG 2.2 AA, incluyendo navegación por teclado, foco visible, etiquetas de formulario, errores asociados, reflujo, zoom y ausencia de información comunicada solamente con color.

El mínimo para texto normal es 4.5:1 y para texto grande 3:1. Las combinaciones siguientes fueron calculadas mediante luminancia relativa sRGB con colores opacos; no certifican texto sobre fotografías ni mezclas transparentes. [W3C: contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

| Texto / fondo | Contraste | Uso recomendado |
| --- | ---: | --- |
| `#fffaf3` / `#523822` | 10.38:1 | Texto principal sobre café |
| `#f3ebdf` / `#523822` | 9.12:1 | Texto y botones |
| `#dac7ae` / `#523822` | 6.55:1 | Texto secundario |
| `#523822` / `#f3ebdf` | 9.12:1 | Texto sobre crema |
| `#190e03` / `#fffaf3` | 18.29:1 | Texto del hero diurno |
| `#b99b78` / `#523822` | 4.12:1 | Evitar en texto normal |

El hero necesita dos capas de texto con el mismo recorte que la persiana: texto oscuro sobre el fondo claro y texto crema sobre la tela oscura. Una capa duplicada debe ser decorativa (`aria-hidden`, sin foco ni controles adicionales); debe existir solamente un H1 semántico. Comprobar el borde de transición y los estados 0, 25, 50, 75 y 100 %. No confiar en un modo de mezcla para garantizar contraste.

Los indicadores esenciales y bordes de controles requieren 3:1 contra colores adyacentes. [W3C: contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Para este diseño, buscar objetivos táctiles de 48 px; el mínimo AA de WCAG 2.2 es 24 × 24 px, sujeto a excepciones. [W3C: tamaño de objetivos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Con `prefers-reduced-motion`, mostrar una composición estable y navegación directa; no obligar a recorrer una animación larga. El 3D necesita una imagen alternativa, controles de teclado y mensajes de carga/error. El cotizador debe conservar resultados legibles en HTML además del PDF.

## Fuentes e iconos locales

Paquetes comprobados en npm: `@fontsource/brawler@5.3.0` (400/700, normal, latino) y `@fontsource-variable/nunito-sans@5.3.0` (200–900; familia CSS `Nunito Sans Variable`). Importar únicamente el subconjunto latino y los estilos usados, preferir WOFF2 y conservar las licencias. Brawler no ofrece una cursiva auténtica en ese paquete. [Brawler en Fontsource](https://fontsource.org/fonts/brawler/install), [Nunito Sans en Fontsource](https://fontsource.org/fonts/nunito-sans/use).

Usar Google Material Symbols para todos los iconos de interfaz. Google permite autoalojarlos y ofrece `icon_names` con nombres ordenados para descargar solo los glifos usados. Descargar el WOFF2 durante la preparación y servirlo localmente evita solicitudes a Google al visitar el sitio. Usar `font-display: block` para evitar que aparezcan nombres de ligaduras. Los iconos decorativos necesitan `aria-hidden`; los botones deben conservar un nombre accesible. [Guía oficial de Material Symbols](https://developers.google.com/fonts/docs/material_symbols).

Entregado: `public/fonts/material-symbols-outlined.woff2` (5,360 bytes), descargado de la URL real devuelta por Google Fonts; tamaño óptico 24, peso 400, relleno 0 y grado 0. Se verificaron las 40 ligaduras solicitadas dentro de la tabla GSUB del archivo, más 22 alias que Google incluye. Licencia Apache 2.0 guardada junto a la fuente como `material-symbols-LICENSE.txt`. Consulta reproducible:

```text
https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=add,bed,bolt,calculate,check,check_circle,close,contrast,dark_mode,delete,description,download,edit,error,expand_more,info,light_mode,lock,menu,mouse,open_in_full,pause,payments,picture_as_pdf,play_arrow,privacy_tip,restart_alt,schedule,settings,shield,straighten,swap_vert,texture,tune,verified,visibility,wb_twilight,weekend,window,workspaces&display=block
```

Alternativa npm verificada: `@material-symbols/font-400@0.47.4`, importando `@material-symbols/font-400/outlined.css`. El paquete fija peso 400, grado 0 y tamaño óptico 48 y permite variar `FILL`; contiene todos los glifos, por lo que un subconjunto descargado es más ligero. Es un empaquetado comunitario de las fuentes de Google. [Repositorio del paquete](https://github.com/marella/material-symbols).

El favicon usa el símbolo oficial `window`, variante outlined a 24 px, descargado del repositorio de Google. Su geometría permanece intacta; solamente se añadió color café en modo claro y crema en modo oscuro. Comparte la licencia Apache guardada en `public/fonts/material-symbols-LICENSE.txt`. [SVG original de Google](https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/window/materialsymbolsoutlined/window_24px.svg).

## Seguridad y privacidad

GitHub Pages sirve archivos estáticos y ofrece HTTPS. Mantener la página en HTTPS y usar recursos locales; no publicar secretos ni manejar contraseñas o tarjetas en este prototipo. [GitHub Pages: HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), [naturaleza estática de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

El cotizador debe funcionar en el navegador, sin enviar datos del visitante. Validar límites, números finitos y opciones permitidas; insertar los campos libres con `textContent`. No convertirlos en HTML. Limitar dependencias, conservar el lockfile y revisar vulnerabilidades antes de publicar.

`vite.config.js` genera una CSP exclusivamente durante el build; el servidor de desarrollo conserva HMR. El hook `transformIndexHtml` posterior a la transformación calcula SHA-256 sobre el JSON-LD emitido y permite solamente ese contenido inline. Los demás scripts inline siguen bloqueados. [Vite: API de plugins y transformación HTML](https://vite.dev/guide/api-plugin.html#transformindexhtml).

Base de la política generada (el build añade el hash a `script-src`):

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'; media-src 'self'
```

El meta CSP se inserta antes de recursos. La excepción de estilo permite las propiedades visuales dinámicas, sin habilitar scripts inline. `connect-src` permite blobs porque Three.js carga las texturas embebidas del GLB mediante `ImageBitmapLoader` y `fetch`. Si se añaden workers/decodificadores, autorizar solo lo necesario tras verificarlo. La página utiliza `<meta name="referrer" content="strict-origin-when-cross-origin">`. Una CSP en meta es una protección adicional para sitios estáticos y no admite todas las funciones de las cabeceras HTTP. [MDN: CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

No anunciar protección completa frente a clickjacking: `frame-ancestors` no funciona en un meta. Configurar cabeceras de servidor requiere una plataforma o proxy que las permita y comprobar la respuesta real. [MDN: frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

La consulta HEAD de la URL publicada, realizada durante esta revisión, devolvió HSTS (`max-age=31556952`) y caché de 600 s. No devolvió cabeceras CSP, X-Frame-Options, X-Content-Type-Options o Referrer-Policy. Este dato describe esa respuesta de GitHub Pages y puede cambiar; no equivale a una auditoría del servicio.

## Rendimiento y verificación

Presupuestos internos propuestos, pendientes de medir: imagen principal hasta 300 KB, fuentes e iconos iniciales hasta 150 KB, JavaScript inicial hasta 100 KB comprimido. Cargar Three.js/modelo cuando se solicite la experiencia y el generador PDF al descargar. Evitar secuencias pesadas de imágenes si dos renders locales y una composición CSS pueden resolver el hero. Reservar dimensiones, reducir tamaño de texturas, detener renderizado fuera de vista y limitar la resolución del canvas en móvil.

Objetivos de campo: LCP ≤ 2.5 s, INP ≤ 200 ms y CLS ≤ 0.1 en el percentil 75, por tipo de dispositivo. Un resultado de Lighthouse es una medida de laboratorio; no equivale a datos reales de usuarios. [Google: Core Web Vitals](https://web.dev/articles/vitals).

Antes de publicar, comprobar 360, 390, 768 y 1440 px; teclado y movimiento reducido; hero abierto, intermedio y cerrado; cotización vacía/inválida/múltiples partidas; totales y PDF de varias páginas; carga sin WebGL; ausencia de errores CSP y solicitudes externas inesperadas. Registrar las pruebas realizadas y las limitaciones reales en la guía de QA.

Comprobación de la infraestructura realizada durante esta iteración: `npm run build` completado; el hash CSP coincide con los bytes del JSON-LD emitido; la política precede a los scripts y no habilita JavaScript inline; la transformación HTML de desarrollo mantiene el cliente Vite y no incorpora la política de producción. `public/sitemap.xml` contiene únicamente la URL canónica real de la página, sin fechas de modificación inventadas. Estas verificaciones no sustituyen las pruebas funcionales y visuales del sitio integrado.
