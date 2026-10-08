# Quickstart and Validation: Quote of the Day

## Prerequisites

- A current Node.js release that supports the built-in test runner and ES modules
- A Chromium-compatible browser installed through the browser-test tooling

The delivered application itself has no runtime packages and requires only static file hosting.

## Setup

From the repository root:

```sh
npm install
npm run test:all
```

The package scripts established during implementation MUST provide:

- `npm test` for deterministic unit tests;
- `npm run test:e2e` for Chromium browser and automated accessibility tests;
- `npm run test:all` for the complete quality gate;
- `npm run serve` for a local static preview URL.

Start the preview with `npm run serve`, then open the printed local URL. The server is development
tooling only and is not a production backend.

## End-to-end validation

### 1. Initial quote

1. Open a clean browser context at the preview URL.
2. Confirm exactly one complete quote and attribution are visible.
3. Confirm New quote and Favorite quote are native, enabled controls.

Expected: The page is usable immediately and no action is required to reveal a quote.

### 2. New quote behavior

1. Record the current Quote identity or visible text.
2. Activate New quote without reloading.

Expected: With at least two catalog entries, a different valid Quote appears within one second;
focus stays on New quote and assistive technology receives one polite content update.

### 3. Independent favorite persistence

1. Favorite Quote A and confirm Favorite quote exposes pressed state.
2. Request Quote B and favorite it.
3. Reload, revisit A and B, and verify both remain favorited.
4. Unfavorite B, reload, and revisit both Quotes.

Expected: A remains favorited and B remains unfavorited. The persisted document follows
[the storage contract](contracts/storage-schema.md) and contains no duplicate IDs.

### 4. Keyboard and accessibility

1. Navigate only with Tab and Shift+Tab.
2. Activate each control with Enter and Space.
3. Confirm visible focus, stable accessible names, and accurate `aria-pressed` state.
4. Inspect the page at a 320 CSS-pixel viewport and 400% zoom with a long Quote.

Expected: Reading/focus order is logical, no pointer is required, state is not color-only, and no
content is clipped or forces horizontal page scrolling. See [the UI contract](contracts/ui-contract.md).

### 5. Storage recovery

1. Replace the favorite storage value with malformed JSON and reload.
2. If test tooling permits, simulate storage read and write exceptions.
3. Continue requesting Quotes and toggling the current session's favorite state.

Expected: Quote discovery remains operational. The page uses a safe empty favorite state for invalid
data and communicates a non-blocking warning when persistence is unavailable.

## Evidence required before implementation completion

- All unit tests pass, including removing one favorite while preserving all others.
- All browser tests pass in the routine Chromium gate.
- Automated accessibility scans report no detectable A/AA violations in initial and interacted states.
- Manual checks confirm dynamic announcements, focus visibility, long-content wrapping, and reflow.
- No production request depends on a backend or external quote service.

## Validation evidence — 2026-10-07

- `npm run test:all` passed: 18 unit tests and 14 Chromium browser tests, with zero failures.
- Axe reported no detectable A/AA violations in the initial or interacted page states.
- Browser assertions passed for keyboard order, Enter and Space activation, visible focus, focus
  retention, stable favorite naming and pressed state, polite atomic quote updates, 320 CSS-pixel
  reflow, simulated 400% zoom, and long unbroken content.
- Degraded-state assertions passed for malformed JSON, blocked storage, session-only fallback,
  non-blocking warnings, and preservation of unrelated origin storage.
- Visual inspection confirmed the desktop layout, complete quote rendering, responsive card,
  distinct favorite states, and readable focus/action controls. Accessibility-tree inspection after
  interaction confirmed updated quote content, favorite state, and status messaging.
- Production code performs no network requests and contains no backend or external quote dependency.
