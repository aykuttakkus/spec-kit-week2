# Storage Contract: Favorite Quotes

## Storage location

- **Mechanism**: Browser `localStorage`
- **Key**: `quote-of-the-day:favorites`
- **Scope**: Current origin, browser profile, and device
- **Backend synchronization**: None

## Version 1 document

```json
{
  "version": 1,
  "quoteIds": ["quote-001", "quote-004"]
}
```

### Contract rules

1. `version` is the integer `1`.
2. `quoteIds` is an array of unique stable Quote IDs known to the current catalog.
3. IDs are sorted before serialization for deterministic output.
4. Adding a Quote ID preserves every existing ID.
5. Removing a Quote ID removes only that exact ID.
6. Adding an existing ID and removing a missing ID are successful no-op operations.
7. The full valid document is written through one `setItem` call per mutation.

## Read behavior

| Stored condition | Result |
|------------------|--------|
| Key absent | Empty FavoriteCollection |
| Valid version 1 document | Valid, known IDs loaded as a set |
| Duplicate IDs | Duplicates collapsed |
| Unknown IDs | Unknown IDs ignored |
| Invalid JSON or shape | Empty in-memory FavoriteCollection |
| Unsupported version | Empty in-memory FavoriteCollection |
| Storage access throws | Empty in-memory FavoriteCollection and persistence warning |

## Write behavior

- Read and validate the latest stored set before each targeted mutation.
- Apply only the requested add or remove operation.
- If serialization or `setItem` fails, keep quote discovery operational and retain the intended
  favorite state for the current page session where possible.
- Announce persistence failure non-disruptively; do not claim the state will survive reload.
- Never clear or rewrite unrelated origin storage.

## Compatibility

Future schema changes require a version increment and an explicit migration or safe fallback.
Quote IDs are compatibility identifiers: catalog reordering and quote-text edits MUST retain an
existing ID when the entry remains the same conceptual Quote.

## Concurrency boundary

This contract does not guarantee conflict-free simultaneous writes from multiple tabs.
`localStorage` lacks transactional compare-and-swap. A later feature may synchronize visible state
with storage events, but that does not make concurrent read-modify-write operations atomic.
