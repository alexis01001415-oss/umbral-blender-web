# UMBRAL · Guía de la escena 3D

La escena editable está en `blender/Umbral.blend`. El archivo web es `public/models/umbral-room.glb`. Las texturas se encuentran empaquetadas dentro de ambos archivos; sus copias se conservan en `public/textures/`.

## Abrir y editar en Blender

Abra `Umbral.blend` con Blender 5.1 o posterior. La escena usa metros, 24 fotogramas por segundo y un intervalo de 1 a 145: seis segundos exactos entre la posición abierta y la cerrada. La cámara activa es `CAMERA_Hero`. Presione el botón de reproducción de la línea de tiempo para ver el cierre y el desplazamiento de cámara.

Las colecciones y empties tienen el mismo nombre descriptivo. Para mover un conjunto, seleccione su empty en el Outliner y use G, R o S:

| Empty | Contenido |
| --- | --- |
| `ROOT_Umbral` | Toda la escena |
| `GROUP_Architecture` | Ventana, bastidores, paneles, zoclos y piso de roble |
| `GROUP_Blind` | Cassette, soportes, tejido, barra inferior y mecanismo |
| `GROUP_Armchair` | Sillón, cojines, ribetes, patas y manta |
| `GROUP_Lamp` | Lámpara, pantalla, difusor y estructura |
| `GROUP_SideTable` | Mesa, taza y libro |
| `GROUP_Rug` | Tapete y flecos |
| `GROUP_Exterior` | Panorama exterior |
| `GROUP_Cameras` | Tres cámaras y el recorrido animado |
| `GROUP_Lighting` | Luces de ventana, relleno, lámpara y sol |

Los objetos tienen mallas independientes: se puede modificar el sillón o mover la ventana sin desmontar toda la habitación. El conjunto arquitectónico se extiende fuera del encuadre para evitar que aparezca el borde de una maqueta al cambiar de formato de pantalla.

## Animaciones y control desde Three.js

El GLB contiene dos clips independientes, exportados desde pistas NLA:

Para mantener fluidez en móvil, la exportación agrupa la geometría estática por material y por padre: **482 mallas editables en Blender se convierten en 31 mallas para la web**. El `.blend` conserva las piezas originales. Los nombres de los objetos animados y los empties principales se mantienen.

| Clip | Duración | Canales |
| --- | --- | --- |
| `Blind_Close` | 6 s | Escala del tejido, posición de la barra, rotación del rodillo |
| `Camera_Travel` | 6 s | Posición y orientación de `CAMERA_Hero` |

En `Blind_Close`, tiempo 0 significa abierta y tiempo 6 significa cerrada. La longitud del tejido pasa de 0.15 m a 3.225 m. Su origen permanece en el borde superior y la barra inferior sigue el extremo de la tela. El rodillo gira en su eje local dentro de `Blind_RollerAxis`.

Three.js puede reproducir, pausar, invertir y recorrer estos clips mediante `AnimationMixer` y `AnimationAction`. También puede controlar cámaras, intensidad de luz y colores de materiales sin volver a exportar Blender. Para un control deslizante, asigne el tiempo del clip y actualice el mixer; el cierre equivale a `6 * (1 - apertura / 100)`.

El tejido conserva su densidad visual al desplegarse. En Blender, el nodo Mapping del material `MAT_BlackoutWoven` usa un driver que sigue la escala vertical del tejido. El formato glTF no exporta ese driver: en Three.js, después de actualizar el mixer, se asigna `BLIND_Fabric.scale.y` a `map.repeat.y` y a `normalMap.repeat.y`. El efecto visual reproduce la salida de tela desde el cassette sin estirar su trama.

Las curvas de aceleración y frenado están horneadas a 24 fps en el GLB. `Blind_Close` y `Camera_Travel` pueden reproducirse juntos o de forma independiente. Un cambio de tiempo no debe activar automáticamente el recorrido de cámara.

## Coordenadas, cámaras y luces

Blender usa Z como eje vertical. La exportación convierte automáticamente a Y vertical de glTF / Three.js. La ventana queda frente a la cámara, en Z ≈ -2.5, con centro X = -1.

`public/models/scene-config.json` contiene dimensiones, nombres exactos, posiciones de cámaras y luces. La fuente luminosa bajo la pantalla de la lámpara está en Three.js `[2.44, 2.02, -1.35]`. Las potencias de Blender sirven como referencia de autoría; Three.js necesita su propia calibración de intensidad y exposición.

Las luces de área y los drivers de nodos no forman parte de la exportación glTF base. La página reconstruye la iluminación en tiempo real. Los renders de Blender usan Cycles, AgX, sombras físicas y eliminación de ruido; el navegador usa su propio renderizador, por lo que ambos no producirán píxeles idénticos.

No calcule el encuadre con el bounding box de toda la escena: `Landscape_Panorama` es una esfera exterior de 60 m de radio. Exclúyala también de la generación y recepción de sombras del navegador. La composición se basa en la habitación y en las cámaras suministradas.

## Materiales y recursos

Las mallas de la habitación y del mobiliario son originales. Los materiales incluyen roble ahumado, lino carbón, tejido blackout, yeso oscuro, aluminio anodizado, bronce, lana y cerámica. El GLB incluye mapas de color y normales tangentes reales; los valores de rugosidad y metalicidad usan el modelo PBR estándar.

El único recurso externo es **Alps Field**, panorama de **Andreas Mischok**, publicado por **Poly Haven** con licencia **CC0**: <https://polyhaven.com/a/alps_field>. El original HDR se conserva en `blender/sources/alps_field_2k.hdr`; la versión JPEG se convierte con gestión de color para incorporarla al GLB. No hay peticiones a ese servidor durante el uso de la web.

## Regenerar

Desde la carpeta principal del proyecto, en PowerShell:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --factory-startup --python blender/build_scene.py
```

El script reconstruye la escena, exporta el GLB, renderiza el póster y guarda el `.blend` con texturas empaquetadas y el driver de densidad de tejido. Usa un proceso nuevo de Blender y no modifica otros proyectos abiertos. La regeneración reemplaza los archivos de salida de UMBRAL; guarde con otro nombre cualquier variante que quiera conservar.

`blender/optimize_export.py` vuelve a exportar el `.blend` existente con las mallas estáticas agrupadas, sin guardar cambios en ese archivo editable. `blender/render_previews.py` verifica y renderiza los extremos de la animación. Los scripts de render utilizan OptiX cuando está disponible y limitan el trabajo de CPU cuando no lo está.
