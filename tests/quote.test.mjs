import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuote, validateWindow, newWindow, selectWindowOptions, quoteDateStamp, FABRICS, COLORS } from '../src/quote-pricing.js';

test('default blackout window: physical area, installation and 16% tax agree to cents', () => {
  const quote = calculateQuote({ windows: [newWindow()], taxRate: 16 });
  assert.equal(quote.lines[0].area, 3.52);
  assert.equal(quote.lines[0].billableArea, 3.52);
  assert.equal(quote.materials, 3449.6);
  assert.equal(quote.installation, 350);
  assert.equal(quote.subtotal, 3799.6);
  assert.equal(quote.tax, 607.94);
  assert.equal(quote.total, 4407.54);
});

test('minimum billable area applies to each piece before quantity, including extras', () => {
  const quote = calculateQuote({ windows: [{ ...newWindow(), width: 40, height: 50, quantity: 3, fabric: 'screen', mechanism: 'motor' }], taxRate: 16 });
  assert.equal(quote.lines[0].area, .2);
  assert.equal(quote.billableArea, 3);
  assert.equal(quote.materials, 2160);
  assert.equal(quote.motors, 7200);
  assert.equal(quote.installation, 1050);
  assert.equal(quote.subtotal, 10410);
  assert.equal(quote.tax, 1665.6);
  assert.equal(quote.total, 12075.6);
});

test('rounds billable area up to a hundredth and tax once on the subtotal', () => {
  const quote = calculateQuote({ windows: [{ ...newWindow(), width: 101, height: 101, installation: false, fabric: 'translucent', quantity: 7 }], taxRate: 16 });
  assert.equal(quote.lines[0].area, 1.0201);
  assert.equal(quote.lines[0].billableArea, 1.03);
  assert.equal(quote.lines[0].material, 875.5);
  assert.equal(quote.subtotal, 6128.5);
  assert.equal(quote.tax, 980.56);
  assert.equal(quote.total, 7109.06);
});

test('mixed materials, quantities, mechanisms and installation sum independently', () => {
  const quote = calculateQuote({ windows: [
    { ...newWindow(1), width: 200, height: 250, fabric: 'duo', quantity: 2, installation: false },
    { ...newWindow(2), width: 100, height: 100, fabric: 'screen', mechanism: 'motor' },
  ], taxRate: 0 });
  assert.equal(quote.pieces, 3);
  assert.equal(quote.materials, 12220);
  assert.equal(quote.motors, 2400);
  assert.equal(quote.installation, 350);
  assert.equal(quote.subtotal, 14970);
  assert.equal(quote.tax, 0);
  assert.equal(quote.total, 14970);
  assert.equal(quote.billableArea, 11);
});

test('minimum and maximum dimensions accepted but invalid data never produce totals', () => {
  for (const values of [{ width: 40, height: 50, quantity: 1 }, { width: 500, height: 500, quantity: 20 }]) {
    assert.deepEqual(validateWindow({ ...newWindow(), ...values }), {});
  }
  for (const [field, value] of [
    ['width', ''], ['height', NaN], ['width', Infinity], ['width', 39], ['width', 501], ['width', 90.5],
    ['height', 49], ['height', 501], ['quantity', 0], ['quantity', 21], ['quantity', 2.5],
    ['room', '  '], ['room', 'a'.repeat(81)], ['fabric', '__proto__'], ['color', 'missing'],
    ['mechanism', 'unknown'], ['installation', 'false'],
  ]) {
    const item = { ...newWindow(), [field]: value };
    assert.ok(validateWindow(item)[field], `${field}=${value} should be invalid`);
    assert.throws(() => calculateQuote({ windows: [item] }));
  }
  assert.throws(() => calculateQuote({ windows: [] }));
  assert.throws(() => calculateQuote({ windows: Array.from({ length: 21 }, (_, i) => newWindow(i + 1)) }));
  assert.throws(() => calculateQuote({ windows: [newWindow()], taxRate: 19 }));
  assert.throws(() => calculateQuote({ windows: [newWindow()], customer: 'a'.repeat(101) }));
  assert.throws(() => calculateQuote({ windows: [newWindow()], notes: 'a'.repeat(601) }));
});

test('every fabric rate reaches output and colour never adds an undisclosed surcharge', () => {
  for (const [fabric, { rate }] of Object.entries(FABRICS)) {
    const data = { windows: [{ ...newWindow(), width: 100, height: 100, installation: false, fabric }], taxRate: 0 };
    assert.equal(calculateQuote(data).total, rate);
    data.windows[0].color = 'ivory';
    assert.equal(calculateQuote(data).total, rate);
  }
});

test('repeated fractional-cent tax totals remain consistent with displayed cent precision', () => {
  const quote = calculateQuote({ windows: Array.from({ length: 20 }, (_, i) => ({ ...newWindow(i + 1), width: 123 + i, height: 217, fabric: 'duo', quantity: 3, mechanism: i % 2 ? 'motor' : 'chain' })), taxRate: 16 });
  assert.equal(Math.round(quote.total * 100), Math.round(quote.subtotal * 100) + Math.round(quote.tax * 100));
  assert.equal(Math.round(quote.subtotal * 100), Math.round(quote.materials * 100) + Math.round(quote.motors * 100) + Math.round(quote.installation * 100));
  assert.equal(quote.pieces, 60);
});

test('collection/finish selections are atomic, allowlisted and preserve other window data', () => {
  const initial = { ...newWindow(), width: 210, quantity: 2 };
  const selected = selectWindowOptions(initial, { fabric: 'duo', color: 'espresso' });
  assert.equal(selected.fabric, 'duo');
  assert.equal(selected.color, 'espresso');
  assert.equal(selected.width, 210);
  assert.equal(selected.quantity, 2);
  assert.equal(initial.fabric, 'blackout');
  assert.equal(initial.color, 'coffee');
  for (const selection of [null, [], {}, { color: '__proto__' }, { fabric: 'duo', color: 'invalid' }, { fabric: undefined }, { width: 999 }, { fabric: 'screen', total: 0 }]) {
    assert.equal(selectWindowOptions(initial, selection), null);
  }
  assert.equal(selectWindowOptions(initial, { color: 'espresso' }).fabric, 'blackout');
  assert.equal(selectWindowOptions(initial, { fabric: 'screen' }).color, 'coffee');
});

test('all five finish selections appear by name and retain the same material price', () => {
  assert.deepEqual(Object.values(COLORS), ['Lino', 'Arena', 'Café', 'Espresso', 'Carbón']);
  for (const color of Object.keys(COLORS)) {
    const item = { ...newWindow(), color };
    assert.deepEqual(validateWindow(item), {});
    assert.equal(calculateQuote({ windows: [item], taxRate: 16 }).total, 4407.54);
  }
});

test('quote dates use Mexico City calendar day consistently across the UTC midnight boundary', () => {
  assert.equal(quoteDateStamp('2026-09-22T00:30:00Z'), '2026-09-21');
  assert.equal(quoteDateStamp('2026-09-22T05:59:59Z'), '2026-09-21');
  assert.equal(quoteDateStamp('2026-09-22T06:00:00Z'), '2026-09-22');
  assert.equal(quoteDateStamp(new Date('2027-01-01T02:00:00Z')), '2026-12-31');
  assert.throws(() => quoteDateStamp('invalid date'));
});
