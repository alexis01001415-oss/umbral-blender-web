# UMBRAL · Estudio de luz

[Abrir experiencia](https://alexis01001415-oss.github.io/umbral-blender-web/) · [Repositorio](https://github.com/alexis01001415-oss/umbral-blender-web)

Una habitación creada en Blender y una experiencia web con Three.js. La persiana enrollable se abre, se cierra y se detiene en cualquier punto; la cámara y la iluminación se controlan por separado.

## Archivos principales

- `blender/Umbral.blend`: proyecto editable, materiales empaquetados, colecciones, empties y animaciones.
- `blender/build_scene.py`: construcción reproducible del modelo, materiales, animación y exportación.
- `public/models/umbral-room.glb`: escena web con geometría, texturas y clips incorporados.
- `public/models/scene-config.json`: nombres, medidas, posiciones y convenciones de la escena.
- `src/room.js`: carga del GLB, AnimationMixer, cámara, iluminación, sombras y materiales.
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

El clip `Blind_Close` dura 6 segundos: tiempo 0 = abierta, tiempo 6 = cerrada. El tejido se despliega desde su origen superior, la barra inferior desciende y el rodillo gira. El control de apertura muestrea este clip con `AnimationMixer` y conserva la posición durante las pausas. El botón Invertir cambia el destino sin saltar de posición.

`Camera_Travel` es una animación separada de la cámara `CAMERA_Hero`. La vista Recorrido la reproduce lentamente de ida y vuelta. Espacio, Detalle y Restablecer permiten salir del recorrido. Las flechas del teclado giran la cámara; `+` / `-` acercan y alejan; `Inicio` la restablece. En pantallas pequeñas se explora con dos dedos y se puede desplazar la página con uno.

La web ofrece tres atmósferas y tres colores de tejido. Las luces se recrean en Three.js: las luces Area y el World de Blender no se exportan en el núcleo de glTF. Es una adaptación para tiempo real; el render Cycles puede tener diferencias de rebotes, reflejos y sombras.

El renderizado se detiene cuando el visor queda fuera de pantalla o la pestaña está oculta, y no dibuja continuamente una escena quieta. En móvil limita resolución y sombras. Respeta `prefers-reduced-motion` en transiciones de interfaz y cámara; el usuario inicia los movimientos deliberadamente.

## GitHub Pages

El workflow `.github/workflows/pages.yml` instala las dependencias fijadas, valida el modelo, compila y publica `dist`. Se ejecuta al subir cambios a `main`. En el repositorio, Pages debe usar **GitHub Actions** como origen. El `.blend` y el script permanecen disponibles en el repositorio, sin formar parte de los archivos que descarga la web.

## Créditos

Modelado y texturas de madera, tejidos y acabado: originales de este proyecto. Panorama **Alps Field**, de Andreas Mischok, distribuido por [Poly Haven](https://polyhaven.com/a/alps_field) bajo CC0. Las tipografías DM Sans y Cormorant Garamond se incluyen localmente mediante Fontsource bajo sus licencias abiertas. Three.js y Vite conservan sus licencias en las dependencias.

## Documentación técnica

- [Three.js AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)
- [Blender: glTF 2.0](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html)
- [Vite: GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages)
