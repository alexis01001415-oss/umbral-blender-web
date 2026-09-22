# Cotizador UMBRAL

El cotizador es una simulación local para el prototipo. No contiene precios comerciales confirmados. Todos los importes aparecen como estimados, en MXN; el PDF no es un comprobante fiscal ni una oferta vinculante.

## Integración

```js
import { initQuote } from './quote.js';
const widget = initQuote(document.querySelector('#quote-app'));
// widget.getData() devuelve una copia del proyecto actual.
// widget.setFirstWindow({ fabric: 'duo', color: 'espresso' }) actualiza la primera ventana.
// widget.destroy() retira eventos y vacía el contenedor.
```

El módulo importa su CSS. Requiere Brawler, Nunito Sans Variable y Material Symbols Outlined en la página. Usa los iconos Google `add`, `close`, `download` y `lock`.

`setFirstWindow` admite uno o ambos campos `fabric` y `color`. Devuelve `true` si aplica la selección; ante una clave o valor desconocido devuelve `false` sin cambios parciales. Actualiza controles, tarifas y total, anuncia la actualización sin mover el foco ni desplazar la página. Los colores internos son `ivory` (Lino), `sand` (Arena), `coffee` (Café), `espresso` (Espresso) y `charcoal` (Carbón). El resto de los datos de las ventanas se conserva.

## Tarifas y cálculo

Editar `QUOTE_CONFIG` y `FABRICS` en `src/quote-pricing.js`. Las tarifas ilustrativas son screen $720/m², translúcido $850/m², blackout $980/m² y dúo $1,150/m². La cadena está incluida; motor +$2,400 y colocación +$350, ambos por pieza. El color no cambia el precio. La UI y el PDF reflejan estos supuestos.

1. Ancho y alto son centímetros enteros: ancho 40–500, alto 50–500. Son límites de simulación, no promesa de fabricación.
2. Área física = ancho × alto / 10,000.
3. Área facturable por pieza = el mayor entre 1 m² y el área física redondeada hacia arriba a 0.01 m².
4. Precio por pieza = tejido por área facturable + motor opcional + instalación opcional.
5. Total de renglón = precio por pieza × cantidad. De 1 a 20 piezas por renglón; de 1 a 20 espacios.
6. Subtotal = suma de renglones. Impuesto ilustrativo = subtotal × 16% (o 0%, seleccionable), redondeado una sola vez a centavos. Total = subtotal + impuesto.

Las operaciones monetarias principales se realizan en centavos enteros. Los tests cubren mínimo por pieza, cantidades, combinaciones, límites, redondeos e impuestos. No acepta medidas inválidas al exportar; el foco vuelve al primer error.

## PDF y privacidad

`buildQuotePdf(data, { date, reference })` se exporta desde `quote-pricing.js` y se reexporta desde `quote.js`. Devuelve una instancia de jsPDF. La librería se importa dinámicamente solo al exportar. La UI descarga un Blob y revoca su URL después de la descarga. No hay envío de formularios, almacenamiento persistente ni conexión con un CRM.

La fecha se captura una sola vez al solicitar la descarga. El encabezado, la referencia automática y el nombre del archivo usan el mismo día calendario de `America/Mexico_City`, incluso después de medianoche UTC o si la generación cruza la medianoche local.

El documento incluye referencia, fecha, cliente, notas, cantidades, medidas, área física y facturable, tejido/color/mecanismo, precios unitarios, extras, subtotal, impuesto, total, exclusiones y condiciones. Usa fuentes estándar PDF compatibles con acentos españoles; normaliza puntuación tipográfica y omite caracteres fuera del repertorio latino. Los nombres pueden tener hasta 80 caracteres por espacio; cliente hasta 100 y notas hasta 600. El motor pagina automáticamente, repite cabecera y numera todas las páginas.

La medición, cobertura, compatibilidad del motor y los términos de una venta real deben confirmarse por separado. Envío, visita, desmontaje, adecuaciones y accesorios especiales no están incluidos.

## Verificación

```sh
node --test tests/quote.test.mjs
node scripts/verify-quote.mjs
```

El segundo comando genera un ejemplo de dos espacios y una prueba de veinte espacios en `output/pdf/`. Renderizar con Poppler para revisar tablas, encabezados, subtotales y paginación antes de publicar cambios al PDF.
