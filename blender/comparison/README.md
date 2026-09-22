# Dúo · Día y noche

`Duo-Day-Night.blend` es una copia independiente del hero. Los archivos de Blender de la habitación y del hero no se modifican. Incluye dos capas de tejido con bandas opacas y translúcidas alineadas, imagen exterior empaquetada, materiales y los mismos empties de organización.

**Frame 1 = día; frame 2 = noche.** La cámara y el tejido tienen exactamente la misma posición en ambos estados. Cambian la iluminación interior y la iluminación exterior. La vista nocturna conserva luz cálida interior y exterior oscuro. La transparencia es ilustrativa: esta comparación no representa una certificación de apertura solar, blackout ni privacidad nocturna.

`build_comparison.py` abre el hero únicamente como fuente y guarda solo este nuevo proyecto. Renderiza en **Eevee**. `optimize_comparison.py` convierte los dos PNG a WebP, calidad 86, a 480×540 y 768×864 píxeles. Las imágenes publicadas están en `public/comparison/`.

## Integración del comparador

El corte es **vertical**: **Día a la izquierda**, **Noche a la derecha**. El valor 0 muestra toda la noche; 100 muestra todo el día. El valor inicial 50 muestra la mitad de cada imagen. Esto compara luz ambiental con la misma posición de la persiana, no una animación de apertura.

Markup estático propuesto para sustituir el contenedor de imagen de la tarjeta Dúo:

```html
<div class="collection-image duo-comparison" data-duo-comparison>
  <img
    src="./comparison/duo-day-768.webp"
    srcset="./comparison/duo-day-480.webp 480w, ./comparison/duo-day-768.webp 768w"
    sizes="(max-width:540px) calc(100vw - 48px), 30vw"
    width="768" height="864"
    alt="Persiana dúo de bandas café y translúcidas frente a una ventana de día"
    loading="lazy" decoding="async"
  />
  <span class="image-tag">UN TEJIDO. DOS MOMENTOS.</span>
</div>
```

```js
import { initComparison } from './comparison.js';
initComparison(document.querySelector('[data-duo-comparison]'));
```

El módulo importa su propio CSS, mantiene el fallback estático cuando JavaScript está desactivado y habilita el comparador cuando ambas imágenes están listas. En un error de carga de la imagen nocturna mantiene la imagen diurna. Expone `setValue(0..100)` y `destroy()` para integraciones adicionales; llamadas repetidas a `initComparison` no duplican controles.

Se usa un `input[type=range]` nativo, con etiqueta y `aria-valuetext` en español. Las flechas, Inicio y Fin funcionan mediante el navegador. El foco tiene indicador visible. El arrastre horizontal admite puntero y táctil; `touch-action: pan-y` y la detección de dirección permiten seguir desplazando la página verticalmente en móvil. El icono de contraste usa la fuente de Google ya incluida. No hay reproducción automática, transiciones ni librerías adicionales.
