# UMBRAL · Hero frontal

`Hero-Umbral.blend` es un proyecto independiente. El archivo original `blender/Umbral.blend` y la habitación interactiva permanecen intactos.

## Edición

La escena usa metros. Los conjuntos `01_Architecture`, `02_Blind_Assembly`, `03_Exterior`, `04_Studio_Lighting`, `05_Cameras` y `06_Architectural_Details` están unidos al empty `ROOT_Hero_Umbral`. Mueve cada empty para mover el conjunto. Todos los materiales y la fotografía exterior están incluidos en el `.blend`.

La persiana tiene una animación lineal de seis segundos a 24 fps: frame 1 abierto y frame 145 cerrado. El borde superior del tejido permanece fijo; `ANIM_Fabric_Deployment` se despliega y `ANIM_Bottom_Rail` acompaña el borde inferior. La textura es opaca, con bandas horizontales sutiles inspiradas en la referencia. La cámara permanece frontal para que la animación siga el scroll sin marear.

Para probarlo manualmente, mueve el cabezal de la línea de tiempo entre los frames 1 y 145 o pulsa Espacio. En el Outliner, selecciona `02_Blind_Assembly` y usa G para mover toda la persiana; R para rotarla y S para escalarla. Para cambiar el color o las bandas, selecciona `ANIM_Fabric_Deployment`, abre el espacio Shading y edita la rampa de color del material `Opaque woven espresso · 2d1805`. Para cambiar el recorrido, modifica los fotogramas clave de escala Z del tejido y de posición Z del riel manteniendo ambos bordes unidos. Los cambios de fotogramas clave se hacen en Dope Sheet o Graph Editor.

`CONTROL_Fixed_Weave_Space` fija las coordenadas del tejido respecto al conjunto. Así, la trama y las bandas mantienen su tamaño durante la bajada: se descubre tela nueva en lugar de estirar su patrón. No hace falta animar ni mover este control por separado.

La vista de escritorio usa `CAM_Desktop_Front_1920x1200`. La variante móvil usa `CAM_Mobile_Front_1080x1440` y escala X = 0.55 en los empties de arquitectura, persiana, detalles y exterior. El script aplica esta variante automáticamente y restaura el diseño de escritorio antes de guardar.

## Reproducir

1. Ejecutar Blender en segundo plano con `--factory-startup --python blender/hero/build_hero.py`.
2. Ejecutar `blender/hero/optimize_hero.py` con Python y Pillow.
3. Ejecutar Blender con `--background --factory-startup --python blender/hero/validate_hero.py` después de editar o regenerar el `.blend`. Esta auditoría no guarda ni modifica el archivo.
4. Ejecutar `node --test tests/hero.test.mjs` para comprobar las imágenes finales, coordenadas, transparencia del riel y correspondencia del informe con el archivo `.blend` mediante SHA-256.

El render usa **Eevee**. Los PNG maestros quedan en esta carpeta; las imágenes WebP y sus metadatos se escriben en `public/hero/`. Las imágenes de apertura y cierre de cada formato comparten exactamente encuadre, exposición e iluminación. No hay secuencia de video que descargar ni una segunda escena WebGL necesaria en el hero.

## Composición web

Colocar la imagen abierta como base y la cerrada sobre ella. Recortar la capa cerrada desde arriba hasta la posición interpolada del riel. `hero-geometry.json` contiene las posiciones normalizadas del rectángulo útil y del riel. Aplicar el mismo factor de escala y desplazamiento de `object-fit: cover` a las imágenes, las coordenadas de recorte y el riel.

Los archivos `hero-bottom-rail*.webp` tienen transparencia y conservan el ancho completo del render. Su centro vertical sigue `openRailCenter + progress × (closedRailCenter − openRailCenter)`. Alinear el riel mediante `translateY(-50%)` después de escalar su altura. El texto claro puede usar el mismo recorte de la cortina sobre el texto oscuro original.

No se reproduce una animación de Blender en el navegador: Blender genera dos estados de la misma escena y el navegador compone el tejido a cualquier altura siguiendo el scroll. El archivo editable conserva la animación real para realizar nuevos renders o exportaciones. El recorte evita cientos de imágenes y mantiene el hero ligero. Al activar movimiento reducido, mostrar una composición estática y conservar los enlaces de navegación. Cualquier duplicado visual del texto debe tener `aria-hidden="true"` para que el lector de pantalla reciba un solo encabezado.

## Fuente exterior

Alps Field, Andreas Mischok / Poly Haven, CC0: https://polyhaven.com/a/alps_field. Hay una copia independiente en `sources/alps-field-panorama.jpg`, reutilizada de la textura ya incluida en el proyecto original sin modificarla. El script generador usa esta copia propia y el nuevo `.blend` también contiene la imagen packed. Ni abrir ni volver a generar este hero requiere el archivo de la habitación original.
