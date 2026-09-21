# Verificación de Umbral

Estado de esta revisión: 21 de septiembre de 2026. Este registro distingue comprobaciones del archivo y revisión de código de las pruebas visuales en navegador; no certifica estas últimas.

## Archivo 3D: comprobaciones automáticas

Ejecutar `npm test` para validar el GLB real de `public/models/umbral-room.glb` con Node, sin dependencias adicionales. La suite comprueba:

- Integridad del contenedor GLB, sus bloques binarios y las imágenes embebidas.
- Jerarquía editable de la habitación, persiana, arquitectura, sillón, lámpara, cámaras y exterior bajo empties.
- Existencia de tejido, contrapeso y rodillo dentro del conjunto de persiana, permitiendo empties intermedios.
- Geometría del tejido, coordenadas UV y texturas de color y normales independientes.
- Descenso del contrapeso sobre el eje vertical Y, sin separarse lateralmente de las guías.
- Extensión vertical del tejido, anchura y espesor constantes, anclaje superior y unión con el contrapeso en ambos extremos.
- Movimiento real del rodillo y recorrido de cámara exportado en clips separados.

Estas pruebas detectan pérdidas de animación o materiales durante una nueva exportación. No evalúan la belleza de los materiales ni simulan Three.js, WebGL, el navegador o Cycles.

Resultado de esta ejecución: **6 pruebas aprobadas, 0 fallos** mediante `npm test` sobre el GLB disponible en esta revisión.

## Problemas atendidos, confirmados por lectura de código o del GLB

- La selección del recorrido usa `CAMERA_Hero`, que es el objetivo de `Camera_Travel`.
- La transición al recorrido obtiene la posición y dirección iniciales de la cámara exportada.
- La interfaz conserva el sentido al pausar y ofrece una acción para invertirlo.
- La salida de página conserva los recursos cuando el navegador guarda la página en BFCache.
- La repetición vertical del color y de los mapas de superficie acompaña la escala animada del tejido.
- Las imágenes de normales exportadas son independientes de las texturas de color.
- Los objetos del conjunto exterior se reconocen por sus ancestros, y la sombra puntual de la lámpara se desactiva para la configuración móvil inicial.

Cada punto necesita todavía confirmación visual cuando corresponde. La lectura de una rama de código no demuestra que la interacción funcione correctamente en todos los dispositivos.

## Revisión de navegador y comprobaciones adicionales

- [ ] Carga inicial y recuperación después de un error de red o pérdida de contexto WebGL.
- [x] Abrir, pausar a mitad del movimiento, continuar sin saltos, invertir y llegar a ambos extremos.
- [ ] Arrastrar el deslizador durante una animación; comprobar que no compitan dos movimientos.
- [ ] Verificar el tejido a 0 %, 50 % y 100 %: textura estable, contrapeso unido y ausencia de huecos visibles.
- [x] Entrar y salir de Espacio, Detalle y Recorrido; comprobar transiciones y orientación de cámara.
- [x] Comparar Día, Atardecer y Noche con la persiana abierta y cerrada: luz, sombras y exterior coherentes.
- [ ] Probar teclado: Tab, flechas, +, − y Home; foco visible y nombres comprensibles.
- [ ] Revisar anuncios del lector de pantalla; evitar que cada fotograma anuncie de nuevo el porcentaje.
- [ ] Probar desplazamiento vertical táctil sobre la escena y acceso cómodo a los controles móviles.
- [ ] Verificar tamaños estrechos y cambio de orientación, incluida reducción de carga gráfica tras redimensionar.
- [ ] Salir de la página y volver mediante Atrás para verificar restauración desde BFCache.
- [ ] Medir fluidez durante movimiento en un móvil real; revisar sombras y número de llamadas de dibujo.
- [ ] Probar reducción de movimiento, cambio de pestaña y escena fuera de pantalla.
- [ ] Revisar liberación de listeners, texturas y recursos GPU al fallar una carga o reiniciar la vista.
- [x] Verificar la compilación publicada en GitHub Pages: rutas de GLB, poster, fuentes y descarga del archivo.

El responsable de las pruebas de navegador debe marcar estos puntos únicamente después de ejecutarlos, indicando navegador, tamaño de pantalla y resultado.


Revisión ejecutada en el navegador integrado de Codex (Chromium), a 1440 × 1000 y 390 × 844. Carga inicial correcta, extremos 0 % y 100 %, pausa/reanudación en apertura, cambio de sentido, vistas de cámara, colores y atmósferas. El deslizador también respondió a Home y flechas. En móvil, el ancho del documento coincide con el área disponible y los tres botones de atmósfera no desbordan; se verificó visualmente el encuadre completo. La política táctil usa pan-y. No se ha ensayado un teléfono físico ni un lector de pantalla. Los puntos sin marcar son comprobaciones adicionales, no resultados afirmados.

Publicación verificada: página y GLB responden HTTP 200; la escena llegó al estado listo y permitió iniciar/pausar el cierre en https://alexis01001415-oss.github.io/umbral-blender-web/. Sin errores de consola del origen publicado. GitHub Actions completó compilación, pruebas y despliegue correctamente.
