# UMBRAL · Estudio de luz

[Abrir experiencia](https://alexis01001415-oss.github.io/umbral-blender-web/) · [Repositorio](https://github.com/alexis01001415-oss/umbral-blender-web)

Un estudio de persianas con un hero que responde al scroll, una habitación interactiva creada en Blender y un cotizador que descarga un PDF. El sitio tiene 13 secciones: hero, experiencia 3D, beneficios, colección, materiales, ambientes, acabados, proceso, medidas, cotizador, cuidados, preguntas y cierre.

La segunda iteración aplica la paleta café `#523822 / #41250c / #2d1805 / #261405 / #190e03`, Brawler y Nunito Sans, espaciado basado en 8 px e iconos oficiales Google Material Symbols. Las fuentes y los recursos se sirven localmente.

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
- `src/quote-pricing.js`: tarifas ilustrativas, validación, cálculos en centavos y PDF local.
- `src/quote.js`: formulario de varias ventanas, resumen y descarga.
- `docs/quote-guide.md`: configuración del cotizador y sus límites.
- `docs/web-quality.md` y `docs/qa-report.md`: decisiones de accesibilidad, SEO, seguridad y mediciones de laboratorio.
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

La web ofrece tres atmósferas y tres colores de tejido. Las luces se recrean en Three.js: las luces Area y el World de Blender no se exportan en el núcleo de glTF. Es una adaptación para tiempo real; el render Cycles puede tener diferencias de rebotes, reflejos y sombras.

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
