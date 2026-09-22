# Verificación funcional de la segunda iteración

Comprobaciones sobre el build de producción, con CSP, en el navegador integrado de Codex. 21 de septiembre de 2026.

- Hero frontal abierto, intermedio y cerrado: el riel y la transición de texto comparten posición; un solo H1 y enlaces accesibles. La copia clara es decorativa y no recibe foco.
- Vistas de 1440×1000, 768×1024, 390×844 y 360×800: sin desplazamiento horizontal. Revisión visual de hero, materiales, habitación y formulario/resumen. El ancho útil del navegador incluye su barra vertical.
- Carga 3D bajo demanda, cierre hasta 0%, cambio de estado del botón y controles habilitados tras completar la carga; consola sin errores CSP. La escena original y su GLB se mantienen.
- Selección Dúo desde la colección: se refleja en el primer espacio del cotizador y actualiza tarifa y total. Espresso desde la paleta actualiza el color y muestra confirmación.
- Medida fuera de rango: total bloqueado, mensaje asociado al campo y foco devuelto al primer error. Varias ventanas, motor y acabados mantienen importes coherentes.
- Descarga real de PDF: archivo guardado en Descargas, dos páginas comprobadas con extracción de texto y revisión visual. Sala de 180×220 cm con Dúo y motor + dormitorio de 160×220 cm con Blackout = $11,103.60 de subtotal + $1,776.58 de impuesto ilustrativo = $12,880.18 MXN.
- Fecha de descarga corregida para usar el día de Ciudad de México en archivo, referencia y encabezado; nueva descarga confirmada con fecha local 2026-09-21.
- Menú móvil: abre, navega y cierra. Pestañas de ambientes: selección por flechas y nombre del panel actualizado. Diálogo de privacidad: foco inicial, cierre con Escape y retorno al botón.
- Revisión de código adicional: la finalización asíncrona del visor no debe quitar foco al cotizador; la carga tiene un estado enfocable y los errores una región de alerta.
- Servidor de prueba aislado devolviendo 503 para el GLB: escribir en el cotizador durante la carga conserva foco y texto al fallar; si se espera el reintento, el error devuelve foco a «Volver a intentar». Los controles 3D quedan deshabilitados y el resto del sitio sigue utilizable. El fallo no se incorpora al build ni al despliegue.
- Vista horizontal 844×390: hero estático de 600 px en el flujo del documento, sin recorrido pegado ni desbordamiento horizontal.

`npm test`: 21 pruebas de modelo GLB, escena frontal, archivos WebP, importes, entradas y fechas. `npm audit --omit=dev`: cero vulnerabilidades conocidas en la ejecución registrada. Los resultados automáticos y sus límites figuran en `qa-report.md`.

La preferencia de movimiento reducido y las pantallas con poca altura presentan un hero estático mediante media queries y el mismo estado en JavaScript. No se cambiaron preferencias del sistema del usuario. Esta revisión no equivale a una certificación exhaustiva en todos los navegadores, lectores de pantalla o dispositivos físicos.
