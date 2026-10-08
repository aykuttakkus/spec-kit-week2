function normalizedAttribution(attribution) {
  return typeof attribution === 'string' && attribution.trim() ? attribution.trim() : 'Unknown';
}

export function validateCatalog(catalog) {
  if (!Array.isArray(catalog)) {
    throw new TypeError('Quote catalog must be an array.');
  }

  const seenIds = new Set();

  return catalog.map((quote) => {
    if (!quote || typeof quote !== 'object') {
      throw new TypeError('Each quote must be an object.');
    }

    const id = typeof quote.id === 'string' ? quote.id.trim() : '';
    const text = typeof quote.text === 'string' ? quote.text.trim() : '';

    if (!id) {
      throw new TypeError('Each quote must have a stable, non-empty ID.');
    }
    if (seenIds.has(id)) {
      throw new TypeError('Quote IDs must be unique.');
    }
    if (!text) {
      throw new TypeError('Each quote must have non-empty text.');
    }

    seenIds.add(id);
    return { id, text, attribution: normalizedAttribution(quote.attribution) };
  });
}

export function selectQuote(catalog, currentQuoteId = null, random = Math.random) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return null;
  }
  if (catalog.length === 1) {
    return catalog[0];
  }

  const candidates = currentQuoteId
    ? catalog.filter((quote) => quote.id !== currentQuoteId)
    : catalog;
  const pool = candidates.length > 0 ? candidates : catalog;
  const value = Number(random());
  const bounded = Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.9999999999999999) : 0;
  return pool[Math.floor(bounded * pool.length)];
}
