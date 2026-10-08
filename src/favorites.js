export const FAVORITES_STORAGE_KEY = 'quote-of-the-day:favorites';
const SCHEMA_VERSION = 1;

function clone(set) {
  return new Set(set);
}

export function createFavoritesStore({ storage, knownQuoteIds }) {
  const knownIds = new Set(knownQuoteIds);
  let favorites = new Set();
  let persistenceAvailable = true;

  function decode(rawValue) {
    if (rawValue === null) {
      return new Set();
    }

    try {
      const document = JSON.parse(rawValue);
      if (
        document?.version !== SCHEMA_VERSION
        || !Array.isArray(document.quoteIds)
      ) {
        return new Set();
      }

      return new Set(
        document.quoteIds.filter(
          (id) => typeof id === 'string' && knownIds.has(id),
        ),
      );
    } catch {
      return new Set();
    }
  }

  function readLatest() {
    try {
      const latest = decode(storage.getItem(FAVORITES_STORAGE_KEY));
      persistenceAvailable = true;
      return latest;
    } catch {
      persistenceAvailable = false;
      return clone(favorites);
    }
  }

  function result() {
    return {
      favorites: clone(favorites),
      persistenceAvailable,
    };
  }

  function persist() {
    const quoteIds = [...favorites].sort();
    try {
      storage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify({ version: SCHEMA_VERSION, quoteIds }),
      );
      persistenceAvailable = true;
    } catch {
      persistenceAvailable = false;
    }
    return result();
  }

  function mutate(id, operation) {
    favorites = readLatest();

    if (!knownIds.has(id)) {
      return result();
    }

    operation(favorites, id);
    return persist();
  }

  return {
    load() {
      favorites = readLatest();
      return result();
    },
    add(id) {
      return mutate(id, (set, quoteId) => set.add(quoteId));
    },
    remove(id) {
      return mutate(id, (set, quoteId) => set.delete(quoteId));
    },
    isFavorite(id) {
      return favorites.has(id);
    },
    getFavorites() {
      return clone(favorites);
    },
  };
}
