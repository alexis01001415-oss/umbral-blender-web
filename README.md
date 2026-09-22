# UMBRAL · Estudio de luz

[Abrir experiencia](https://alexis01001415-oss.github.io/umbral-blender-web/) · [Repositorio](https://github.com/alexis01001415-oss/umbral-blender-web)

Un estudio de persianas con un hero que responde al scroll, una habitación interactiva creada en Blender y un cotizador que descarga un PDF. El sitio tiene 13 secciones: hero, experiencia 3D, beneficios, colección, materiales, ambientes, acabados, proceso, medidas, cotizador, cuidados, preguntas y cierre.

La segunda iteración aplica la paleta café `#523822 / #41250c / #2d1805 / #261405 / #190e03`, Brawler y Nunito Sans, espaciado basado en 8 px e iconos oficiales Google Material Symbols. Las fuentes y los recursos se sirven localmente.

La tercera iteración añade botones con relieve y barrido al interactuar, tipografía con espaciado de 1.5 px en escritorio (títulos 120%, texto 140%), más luz y siete colores en el visor, comparador Dúo día/noche, ambientes vinculados al scroll, acabados a pantalla completa y 15 preguntas frecuentes. El generador y el diseño del PDF se conservan.

La cuarta iteración incorpora aves en el paisaje del hero, escritura progresiva en los encabezados y un footer con luz cálida y formulario de contacto de demostración. El formulario valida los campos y muestra una vista previa editable; no envía mensajes. El resto de la habitación, los renders y el PDF se mantienen.

## Archivos principales

- `blender/Umbral.blend`: proyecto editable, materiales empaquetados, colecciones, empties y animaciones.
- `blender/build_scene.py`: construcción reproducible del modelo, materiales, animación y exportación.
- `public/models/umbral-room.glb`: escena web con geometría, texturas y clips incorporados.
- `public/models/scene-config.json`: nombres, medidas, posiciones y convenciones de la escena.
- `src/room.js`: carga del GLB, AnimationMixer, cámara, iluminación, sombras y materiales.
- `blender/hero/Hero-Umbral.blend`: nuevo proyecto frontal independiente, renderizado en Eevee; el proyecto original no se modifica.
- `blender/hero/README.md`: edición manual, empties, animación, regeneración y auditoría de la escena frontal.
- `public/hero/`: renders WebP para escritorio y móvil, sprites del riel y coordenadas de registro.
- `src/hero.js`: cierre con scroll y recorte sincronizado de texto oscuro/claro.
- `src/room-controls.js`: carga diferida del visor original y controles de la habitación.
- `src/room-palette.js`: siete acabados del visor, incluidos negro y arcilla.
- `blender/comparison/Duo-Day-Night.blend`: proyecto independiente Eevee con dos estados de iluminación registrados.
- `src/comparison.js`: comparación día/noche mediante arrastre o teclado y WebP responsivos.
- `src/room-story.js`: ambientes por scroll, clic y teclado; vuelve a tabs estáticas cuando el contenido no cabe o se solicita movimiento reducido.
- `src/section-motion.js` y `src/refinements.css`: entradas, barrido de acabados, botones y ritmo tipográfico responsivo, sin librería adicional.
- `src/hero-life.js` y `src/hero-life.css`: vuelo ambiental en canvas, recortado por la abertura real de la ventana y el riel de la persiana.
- `src/text-reveal.js` y `src/text-reveal.css`: escritura por carácter de 1.4–2.2 segundos con texto original y dimensiones preservadas.
- `src/contact.js` y `src/contact.css`: formulario de demostración y footer a una altura mínima de pantalla, adaptable al contenido.
- `src/quote-pricing.js`: tarifas ilustrativas, validación, cálculos en centavos y PDF local.
- `src/quote.js`: formulario de varias ventanas, resumen y descarga.
- `docs/quote-guide.md`: configuración del cotizador y sus límites.
- `docs/web-quality.md` y `docs/qa-report.md`: decisiones de accesibilidad, SEO, seguridad y mediciones de laboratorio.
- `docs/qa-iteration-3.md`: mediciones y comprobaciones de la tercera iteración.
- `docs/qa-iteration-4.md`: mediciones y comprobaciones de aves, texto y contacto.
- `docs/model-guide.md`: guía de edición en Blender.
- `docs/pipeline-notes.md`: explicación del intercambio Blender → glTF → Three.js.

## Ejecutar la web

Requiere Node.js 24. En esta carpeta:

```sh
npm ci
npm run dev
```

Abrir la dirección que muestre Vite. Para producción:

```sh
npm test
npm run build
npm run preview
```

La salida es `dist/`. El sitio funciona bajo una subcarpeta: Vite genera rutas relativas y el cargador usa `import.meta.env.BASE_URL`. No necesita servidor de aplicación, claves ni servicios externos durante su uso.

## Animación y controles

El hero combina dos renders registrados de Eevee y un riel transparente. El borde de recorte avanza con el scroll y revela también una copia decorativa clara del texto. Existe un único H1 y un único conjunto de enlaces accesibles. El cálculo respeta el recorte `object-fit: cover` en cada pantalla. Con movimiento reducido, en pantallas de poca altura o sin JavaScript, se ofrece una composición estable sin recorrido obligatorio.

La habitación se descarga al pulsar **Explorar en 3D**; Three.js y el GLB no forman parte de la carga inicial. Se conserva una imagen de respaldo. El generador PDF también se descarga solo cuando se solicita.

El clip `Blind_Close` dura 6 segundos: tiempo 0 = abierta, tiempo 6 = cerrada. El tejido se despliega desde su origen superior, la barra inferior desciende y el rodillo gira. El control de apertura muestrea este clip con `AnimationMixer` y conserva la posición durante las pausas. El botón Invertir cambia el destino sin saltar de posición.

`Camera_Travel` es una animación separada de la cámara `CAMERA_Hero`. La vista Recorrido la reproduce lentamente de ida y vuelta. Espacio, Detalle y Restablecer permiten salir del recorrido. Las flechas del teclado giran la cámara; `+` / `-` acercan y alejan; `Inicio` la restablece. En pantallas pequeñas se explora con dos dedos y se puede desplazar la página con uno.

La web ofrece tres atmósferas y siete colores de tejido. Día y Atardecer tienen más luz ambiente y de relleno para descubrir las superficies sin perder las sombras. Las luces se recrean en Three.js: las luces Area y el World de Blender no se exportan en el núcleo de glTF. Es una adaptación para tiempo real; el render Cycles puede tener diferencias de rebotes, reflejos y sombras.

El comparador Dúo muestra la misma posición de persiana con luz de día y de noche: arrastre horizontal, flechas, Inicio y Fin. La sección de ambientes recorre Dormitorio → Sala → Home office al desplazarse en ambas direcciones; pulsar una pestaña sincroniza el recorrido. No captura la rueda ni impide salir de la sección. Si la pantalla es baja, el contenido no cabe o se solicita movimiento reducido, conserva las pestañas sin fijar el contenido.

Los acabados entran con un barrido lateral y una secuencia breve de círculos. Al usar teclado se completan las entradas para que ningún control enfocado quede oculto. Con movimiento reducido todo aparece directamente. Los cinco acabados del catálogo se aplican también al visor; negro y arcilla son opciones adicionales del estudio 3D.

Las aves cruzan el cielo en grupos pequeños, alternando aleteo y planeo. El canvas queda detrás de la cortina y recortado por las coordenadas del render. Su control permite pausar y reanudar; solo esta preferencia se recuerda en `sessionStorage` durante la sesión de la pestaña. El dibujo se limita a 30 fps y se detiene fuera de vista, con la pestaña oculta, la cortina cerrada o la preferencia de movimiento reducido.

Los encabezados H2 estáticos se revelan una sola vez, carácter a carácter. Los nodos originales conservan saltos, énfasis, altura y lectura accesible; una capa decorativa temporal reproduce sus posiciones. Selección de texto, foco dentro de la sección, redimensionado o movimiento reducido terminan la entrada. El H1 del hero conserva sus dos tonos sincronizados con la persiana.

El footer tiene una lámpara decorativa con un cono de luz suave. Su altura mínima es una pantalla y crece en móvil o cuando se abre la vista previa para evitar recortes. El formulario pide nombre, correo e idea, con espacio opcional. Los campos permanecen desactivados hasta conectar la lógica de demostración; el resumen usa `textContent`, no HTML. No hay endpoint, envío, `mailto` ni almacenamiento de los campos. La CSP mantiene `form-action 'none'`.

El renderizado se detiene cuando el visor queda fuera de pantalla o la pestaña está oculta, y no dibuja continuamente una escena quieta. En móvil limita resolución y sombras. Respeta `prefers-reduced-motion` en transiciones de interfaz y cámara; el usuario inicia los movimientos deliberadamente.

## GitHub Pages

El workflow `.github/workflows/pages.yml` instala las dependencias fijadas, valida el modelo, compila y publica `dist`. Se ejecuta al subir cambios a `main`. En el repositorio, Pages debe usar **GitHub Actions** como origen. El `.blend` y el script permanecen disponibles en el repositorio, sin formar parte de los archivos que descarga la web.

El build inserta una Content Security Policy, limita los recursos al mismo origen y autoriza el JSON-LD mediante un hash. No hay formularios remotos, analítica, claves privadas, cobros ni base de datos. El cotizador mantiene la información solo en memoria; no envía nombres, notas ni medidas. Las tarifas e impuestos son supuestos de demostración, no una oferta comercial. La política y las limitaciones del alojamiento están documentadas en la web y en `docs/web-quality.md`.

Los datos estructurados describen únicamente el sitio y la página. La navegación, el contenido en HTML, las preguntas, los metadatos y el sitemap facilitan comprensión e indexación; no garantizan posiciones en Google ni presencia en respuestas generadas por IA.

## Créditos

Modelado y texturas de madera, tejidos y acabado: originales de este proyecto. Panorama **Alps Field**, de Andreas Mischok, distribuido por [Poly Haven](https://polyhaven.com/a/alps_field) bajo CC0. Brawler y Nunito Sans se incluyen localmente mediante Fontsource bajo OFL. Los iconos y el favicon proceden de Google Material Symbols, bajo Apache 2.0; licencia y procedencia en `public/fonts/` y `docs/web-quality.md`. Three.js, jsPDF y Vite conservan sus licencias en las dependencias.

## Documentación técnica

- [Three.js AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)
- [Blender: glTF 2.0](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html)
- [Vite: GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages)
