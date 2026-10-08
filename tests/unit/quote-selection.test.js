import assert from 'node:assert/strict';
import test from 'node:test';

import { selectQuote, validateCatalog } from '../../src/quote-selection.js';

const catalog = [
  { id: 'quote-a', text: 'Alpha', attribution: 'Author A' },
  { id: 'quote-b', text: 'Beta', attribution: 'Author B' },
  { id: 'quote-c', text: 'Gamma', attribution: 'Author C' },
];

test('selectQuote returns null for an empty catalog', () => {
  assert.equal(
    selectQuote([], null, () => 0),
    null,
  );
});

test('selectQuote returns the only entry in a one-item catalog', () => {
  const only = [catalog[0]];
  assert.equal(
    selectQuote(only, null, () => 0.99),
    only[0],
  );
});

test('selectQuote always returns a catalog member', () => {
  for (const randomValue of [0, 0.2, 0.5, 0.999999]) {
    assert.ok(catalog.includes(selectQuote(catalog, null, () => randomValue)));
  }
});

test('selectQuote handles deterministic lower and upper boundaries', () => {
  assert.equal(
    selectQuote(catalog, null, () => 0),
    catalog[0],
  );
  assert.equal(
    selectQuote(catalog, null, () => 0.999999),
    catalog[2],
  );
});

test('validateCatalog accepts stable unique entries', () => {
  assert.deepEqual(validateCatalog(catalog), catalog);
});

test('validateCatalog rejects duplicate IDs and empty text', () => {
  assert.throws(() => validateCatalog([catalog[0], { ...catalog[0] }]), /unique/i);
  assert.throws(
    () => validateCatalog([{ id: 'quote-a', text: '', attribution: 'Author' }]),
    /text/i,
  );
});

test('selectQuote excludes the current quote when alternatives exist', () => {
  assert.equal(
    selectQuote(catalog, 'quote-a', () => 0),
    catalog[1],
  );
  assert.equal(
    selectQuote(catalog, 'quote-b', () => 0),
    catalog[0],
  );
});

test('selectQuote does not retry randomness to avoid the current quote', () => {
  let calls = 0;
  const selected = selectQuote(catalog, 'quote-a', () => {
    calls += 1;
    return 0;
  });

  assert.equal(selected.id, 'quote-b');
  assert.equal(calls, 1);
});

test('selectQuote keeps a one-entry catalog stable when it is current', () => {
  assert.equal(
    selectQuote([catalog[0]], 'quote-a', () => 0.5),
    catalog[0],
  );
});
