# Phase 0 Research: Quote of the Day

## Standards-based static application

**Decision**: Use semantic HTML, plain CSS, and ES2022 modules with no runtime dependencies or
backend. Serve the same static files in development, tests, and production.

**Rationale**: The feature is one small interactive page whose catalog and state are fully local.
Native platform capabilities meet the requirements with less operational and dependency overhead.

**Alternatives considered**: A component framework was rejected because it adds dependency and
build complexity without solving a demonstrated problem. A backend was rejected because the spec
requires neither accounts nor cross-device synchronization.

## Favorite persistence schema

**Decision**: Store one versioned JSON document at `quote-of-the-day:favorites`:

```json
{
  "version": 1,
  "quoteIds": ["quote-001", "quote-004"]
}
```

Quote IDs are stable catalog identifiers, never array positions or quote text. Loads validate the
document, retain only known unique IDs, and represent the active collection as a set. Writes sort
IDs before serialization so saved output and tests are deterministic.

**Rationale**: A namespaced, versioned document supports later migration. Stable IDs survive quote
reordering or copy edits, while set semantics guarantee independent favorites without duplicates.

**Alternatives considered**: A raw array lacks a migration marker. One storage key per quote makes
schema migration and cleanup harder. Storing quote text as identity breaks when wording changes.

## Persistence boundary and failure recovery

**Decision**: Isolate storage behind operations equivalent to `loadFavorites`, `saveFavorites`,
`addFavorite`, `removeFavorite`, and `isFavorite`. Inject a Storage-compatible adapter for tests.
Guard storage access, parsing, validation, and writes. Invalid or unavailable storage falls back to
an empty in-memory set; quote browsing continues, and failed persistence produces a non-blocking
status message.

Each mutation reads the latest valid set, changes only the selected quote ID, and commits the full
document with one `setItem` operation. Adding an existing ID and removing an absent ID are harmless.
The design does not promise conflict-free simultaneous writes across browser tabs because
`localStorage` has no transactional compare-and-swap operation.

**Rationale**: A narrow boundary makes failures directly testable and prevents persistence concerns
from spreading into event handlers. Targeted set mutations enforce the requirement that removing
one favorite preserves every other favorite.

**Alternatives considered**: Direct storage calls inside click handlers were rejected as coupled
and difficult to test. Clearing malformed data during load was rejected because recovery should not
depend on a potentially failing write.

## Random quote selection

**Decision**: Put selection in a pure function that accepts the catalog, current quote ID, and an
injectable random-number function. Empty input returns no quote, one entry returns that entry, and
two or more entries select from all entries except the current one.

**Rationale**: Excluding the current quote by construction meets the non-repeat requirement without
unbounded retries. Injected randomness makes boundary cases deterministic in tests.

**Alternatives considered**: Repeated random draws until a different quote appears can loop under a
bad random source and produces flaky tests. Sequential rotation does not satisfy random discovery.

## Accessible interaction contract

**Decision**: Use a `main` landmark, one `h1`, and a `figure` containing a `blockquote` plus
`figcaption`. Use native buttons for "New quote" and the favorite toggle. The favorite button keeps
a stable accessible name and exposes state with `aria-pressed`. Quote changes use an existing polite,
atomic live region and do not move focus. Both controls retain visible focus, native keyboard
behavior, and practical target sizes. Long quotes reflow without clipping or fixed heights.

**Rationale**: Native semantics provide reliable keyboard behavior. Stable toggle naming and
pressed state avoid ambiguous announcements, while retaining focus supports repeated exploration.

**Alternatives considered**: Custom clickable elements and a toolbar pattern add unnecessary ARIA
and keyboard work. Moving focus to each new quote is disruptive. Assertive announcements are not
warranted for non-urgent content.

## Test strategy

**Decision**: Use Node's built-in test runner for pure quote-selection and favorite-persistence
modules. Use Playwright as a development-only dependency for real-browser workflows, with axe as a
development-only automated accessibility helper. Run Chromium for the routine gate; broader browser
coverage can run before release.

Unit cases cover catalog boundaries, deterministic selection, multiple favorites, removing one
while preserving others, idempotent operations, round trips, invalid JSON, unknown IDs, unsupported
schema versions, and storage exceptions. Browser cases cover initial display, new-quote behavior,
multi-favorite persistence across reloads, independent unfavoriting, malformed storage recovery,
keyboard interaction, focus retention, accessible pressed state, and narrow/zoomed layouts.

**Rationale**: Browser-free unit tests stay fast and dependency-light, while a real browser is
necessary to verify DOM behavior and actual `localStorage` persistence. Automated accessibility
scans complement rather than replace explicit keyboard and state assertions.

**Alternatives considered**: DOM emulation with a larger unit-test framework was rejected as extra
configuration for this small app. Manual browser testing alone fails the constitution's repeatable
automated-testing requirement.
