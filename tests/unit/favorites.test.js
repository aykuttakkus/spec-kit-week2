import assert from 'node:assert/strict';
import test from 'node:test';

import { FAVORITES_STORAGE_KEY, createFavoritesStore } from '../../src/favorites.js';

const knownQuoteIds = ['quote-a', 'quote-b', 'quote-c'];

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    value(key) {
      return values.get(key);
    },
  };
}

test('missing storage loads an empty favorite set', () => {
  const store = createFavoritesStore({ storage: createStorage(), knownQuoteIds });
  const result = store.load();

  assert.deepEqual([...result.favorites], []);
  assert.equal(result.persistenceAvailable, true);
});

test('loads known unique IDs and ignores duplicates and unknown IDs', () => {
  const storage = createStorage({
    [FAVORITES_STORAGE_KEY]: JSON.stringify({
      version: 1,
      quoteIds: ['quote-a', 'missing', 'quote-a', 'quote-b'],
    }),
  });
  const store = createFavoritesStore({ storage, knownQuoteIds });

  assert.deepEqual([...store.load().favorites].sort(), ['quote-a', 'quote-b']);
});

test('invalid JSON, shape, and unsupported versions recover to empty', () => {
  for (const storedValue of [
    '{not-json',
    JSON.stringify({ version: 1, quoteIds: 'quote-a' }),
    JSON.stringify({ version: 2, quoteIds: ['quote-a'] }),
  ]) {
    const storage = createStorage({ [FAVORITES_STORAGE_KEY]: storedValue });
    const store = createFavoritesStore({ storage, knownQuoteIds });
    assert.deepEqual([...store.load().favorites], []);
  }
});

test('serializes version 1 with unique sorted quote IDs', () => {
  const storage = createStorage();
  const store = createFavoritesStore({ storage, knownQuoteIds });

  store.add('quote-c');
  store.add('quote-a');
  store.add('quote-c');

  assert.equal(
    storage.value(FAVORITES_STORAGE_KEY),
    JSON.stringify({ version: 1, quoteIds: ['quote-a', 'quote-c'] }),
  );
});

test('adding several favorites survives a new store load', () => {
  const storage = createStorage();
  const firstVisit = createFavoritesStore({ storage, knownQuoteIds });
  firstVisit.add('quote-a');
  firstVisit.add('quote-b');

  const nextVisit = createFavoritesStore({ storage, knownQuoteIds });
  assert.deepEqual([...nextVisit.load().favorites].sort(), ['quote-a', 'quote-b']);
});

test('removing one favorite preserves every other favorite', () => {
  const storage = createStorage();
  const store = createFavoritesStore({ storage, knownQuoteIds });
  store.add('quote-a');
  store.add('quote-b');
  store.remove('quote-b');

  assert.equal(store.isFavorite('quote-a'), true);
  assert.equal(store.isFavorite('quote-b'), false);
  assert.deepEqual(JSON.parse(storage.value(FAVORITES_STORAGE_KEY)).quoteIds, ['quote-a']);
});

test('adding an existing ID and removing an absent ID are harmless', () => {
  const storage = createStorage();
  const store = createFavoritesStore({ storage, knownQuoteIds });
  store.add('quote-a');
  store.add('quote-a');
  store.remove('quote-c');

  assert.deepEqual([...store.getFavorites()], ['quote-a']);
});

test('read exceptions preserve current-session functionality', () => {
  const storage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  const store = createFavoritesStore({ storage, knownQuoteIds });

  assert.equal(store.load().persistenceAvailable, false);
  const result = store.add('quote-a');
  assert.equal(result.persistenceAvailable, false);
  assert.equal(store.isFavorite('quote-a'), true);
});

test('a failed write does not delete unrelated in-memory favorites', () => {
  let writes = 0;
  const storage = createStorage({
    [FAVORITES_STORAGE_KEY]: JSON.stringify({ version: 1, quoteIds: ['quote-a', 'quote-b'] }),
  });
  storage.setItem = () => {
    writes += 1;
    throw new Error('quota');
  };
  const store = createFavoritesStore({ storage, knownQuoteIds });
  store.load();

  const result = store.remove('quote-b');
  assert.equal(writes, 1);
  assert.equal(result.persistenceAvailable, false);
  assert.deepEqual([...result.favorites], ['quote-a']);
});
