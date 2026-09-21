# Blender → Three.js → GitHub Pages

Notas verificadas el 21 de septiembre de 2026.

## Control de la animación

Sí: una animación de Blender exportada en GLB puede reproducirse, pausarse, invertirse y recorrerse con un deslizador desde Three.js. `GLTFLoader` entrega `gltf.animations` y `gltf.cameras`; `AnimationMixer` reproduce los clips. `AnimationAction.timeScale` negativo invierte el sentido, `paused` pausa una acción y `clampWhenFinished` conserva el último fotograma al terminar. `AnimationMixer.setTime()` permite ir a un tiempo preciso; su argumento se multiplica por `mixer.timeScale`, por lo que un mezclador pausado con escala cero debe restaurarse antes de usar ese método.

Fuentes: [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html), [AnimationAction](https://threejs.org/docs/pages/AnimationAction.html), [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).

## Decisiones de exportación

- Conservar jerarquías de empties y nombres estables. Animar transformaciones de objetos, huesos o shape keys para compatibilidad estándar.
- Mantener movimientos de persiana y cámara en clips separados cuando deban controlarse de forma independiente.
- Activar muestreo de animación para movimientos generados por restricciones; verificar el GLB resultante en Three.js.
- Los modos Actions, Active Actions merged, NLA Tracks y Scene producen agrupaciones distintas. Las acciones deben estar asociadas a objetos o guardadas en pistas NLA para que el modo Actions las incluya.
- El exportador documenta que las animaciones de propiedades de luces, materiales y físicas no se transfieren como animaciones estándar. Recrear esas variaciones en la web.
- Las luces Area y la iluminación World de Blender no se exportan. Point, Spot y Sun usan `KHR_lights_punctual`; ajustar de nuevo iluminación y exposición en el navegador.

Fuente: [manual actual de exportación glTF de Blender](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html). El contenido se verificó mediante una consulta HTTP directa al sitio oficial.

`KHR_animation_pointer` existe, pero la documentación actual de `GLTFLoader` lo enumera como un complemento que requiere registro separado. La integración más sencilla para este proyecto es GLB estándar para geometría y movimiento, con iluminación controlada en JavaScript. La apariencia de Cycles no se reproduce automáticamente mediante un archivo GLB.

## Publicación

Vite construye el sitio estático en `dist`. Para `https://USUARIO.github.io/REPO/`, establecer `base: '/REPO/'`; los modelos y demás archivos cargados desde `public` deben respetar esa base, por ejemplo `import.meta.env.BASE_URL + 'models/scene.glb'`. Verificar primero el resultado con `npm run build` y `npm run preview`.

En GitHub Pages, seleccionar GitHub Actions como origen. El workflow necesita permisos `contents: read`, `pages: write` e `id-token: write`; debe instalar con `npm ci`, compilar, subir `dist` y desplegar el artefacto de Pages.

Fuente: [guía oficial de Vite para GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages).

## Evaluación de skills

La búsqueda de `find-skills` revisó el directorio y los resultados de Blender y Three.js. `cloudai-x/threejs-skills` tiene adopción amplia (aproximadamente 15 mil instalaciones de `threejs-animation` y 3.3 mil estrellas), pero algunos ejemplos requieren revisión frente a la API vigente; no se instaló. `affaan-m/ECC` ofrece inspección estructurada de movimiento, principalmente orientada a personajes y retargeting, por lo que no es necesaria para una persiana. Se priorizaron las fuentes oficiales y las skills de diseño ya disponibles.

Fuentes: [threejs-animation](https://skills.sh/cloudai-x/threejs-skills/threejs-animation), [repositorio Three.js skills](https://github.com/CloudAI-X/threejs-skills), [Blender motion state inspection](https://github.com/affaan-m/ECC/blob/main/skills/blender-motion-state-inspection/SKILL.md).
