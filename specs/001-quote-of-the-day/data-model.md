# Data Model: Quote of the Day

## Quote

A read-only catalog entry bundled with the page.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `id` | string | Yes | Stable, non-empty, unique across the catalog; never derived from array position. |
| `text` | string | Yes | Non-empty quote content; rendered in full without truncation. |
| `attribution` | string | Yes | Non-empty display value; normalize a missing source value to `Unknown`. |

### Validation

- The catalog contains at least five valid Quotes for the delivered feature.
- Duplicate IDs are invalid because Favorite identity depends on uniqueness.
- Similar or duplicate text may exist only when IDs intentionally distinguish separate entries.

## FavoriteCollection

The current visitor's saved set of favorite Quote identities.

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `version` | integer | Yes | Exactly `1` for the initial schema. |
| `quoteIds` | array of strings | Yes | Unique, known Quote IDs; serialized in stable sorted order. |

### Relationships

- Each saved ID refers to one Quote.
- A Quote can appear at most once in FavoriteCollection.
- FavoriteCollection can contain zero, one, or many Quote IDs.
- Removing one ID has no effect on any other ID.

### Validation and recovery

- Missing storage produces an empty FavoriteCollection.
- Invalid JSON, an unsupported version, or a non-array `quoteIds` value produces an empty in-memory
  FavoriteCollection without blocking quote discovery.
- Duplicate IDs are collapsed and IDs absent from the current catalog are ignored.
- A storage read or write exception leaves the page usable with the current in-memory state.

### State transitions

| Current state for selected Quote | Action | Next state | Other favorites |
|----------------------------------|--------|------------|-----------------|
| Not favorited | Add favorite | Favorited | Unchanged |
| Favorited | Add favorite | Favorited | Unchanged |
| Favorited | Remove favorite | Not favorited | Unchanged |
| Not favorited | Remove favorite | Not favorited | Unchanged |

## PageState

Transient state used to render the page; it is not persisted as a separate record.

| Field | Type | Rules |
|-------|------|-------|
| `currentQuoteId` | string or null | References one catalog Quote, or null for an empty catalog. |
| `favorites` | FavoriteCollection | Loaded through the persistence boundary. |
| `persistenceAvailable` | boolean | False after a storage access or write failure. |
| `statusMessage` | string | Concise, non-blocking feedback for favorite changes or persistence failure. |

### Page transitions

- **Initial load**: validate catalog and favorites, then choose one random Quote.
- **New quote**: choose a Quote other than `currentQuoteId` when at least two are available; retain
  FavoriteCollection and derive the new quote's pressed state.
- **Favorite current quote**: add only `currentQuoteId`, persist once, and update status.
- **Unfavorite current quote**: remove only `currentQuoteId`, persist once, and update status.
- **Empty catalog**: set `currentQuoteId` to null and disable quote-dependent controls.
