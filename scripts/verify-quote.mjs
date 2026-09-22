import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { buildQuotePdf, calculateQuote, newWindow } from '../src/quote-pricing.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output', 'pdf');
await mkdir(output, { recursive: true });
const samples = [
  { filename: 'umbral-cotizacion-ejemplo.pdf', reference: 'UMB-EJEMPLO-20260921', data: {
    customer: 'María José Hernández', notes: 'Sala: revisar montaje al techo. Recámara: confirmar cobertura lateral y toma de corriente para el motor.', taxRate: 16,
    windows: [newWindow(), { ...newWindow(2), room: 'Recámara principal', width: 210, height: 240, fabric: 'duo', color: 'sand', mechanism: 'motor', quantity: 2 }],
  } },
  { filename: 'umbral-cotizacion-multipagina.pdf', reference: 'UMB-PRUEBA-20-ESPACIOS', data: {
    customer: 'Ángela Muñoz - Proyecto de remodelación de la casa familiar de Ciudad de México',
    notes: 'Revisar medidas, color café y accionamiento según cada habitación. '.repeat(9).slice(0, 600), taxRate: 0,
    windows: Array.from({ length: 20 }, (_, i) => ({ ...newWindow(i + 1),
      room: `Habitación ${i + 1} - Ventana panorámica junto al comedor y espacio de lectura familiar`.slice(0, 80),
      width: 40 + i * 20, height: 50 + i * 20, quantity: 1 + i % 3,
      fabric: ['screen', 'translucent', 'blackout', 'duo'][i % 4], color: ['ivory', 'sand', 'coffee', 'espresso', 'charcoal'][i % 5],
      mechanism: i % 2 ? 'motor' : 'chain', installation: i % 3 !== 0,
    })),
  } },
];
for (const sample of samples) {
  const result = calculateQuote(sample.data);
  const doc = await buildQuotePdf(sample.data, { date: '2026-09-21T18:00:00.000Z', reference: sample.reference });
  const buffer = Buffer.from(doc.output('arraybuffer'));
  assert.ok(buffer.length > 2000 && buffer.subarray(0, 5).toString() === '%PDF-');
  assert.ok(doc.getNumberOfPages() >= (sample.data.windows.length > 10 ? 5 : 2));
  await writeFile(path.join(output, sample.filename), buffer);
  console.log(`${sample.filename}: ${doc.getNumberOfPages()} pages, ${buffer.length} bytes, total ${result.total.toFixed(2)} MXN`);
}
