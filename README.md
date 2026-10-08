# Quote of the Day

A dependency-free static page that shows a random built-in quote, requests another without a page
reload, and saves multiple independent favorites in browser `localStorage`. It has no backend,
account system, external quote service, or separate favorites-list view.

## Requirements

- A current Node.js release with the built-in test runner and ES module support
- Google Chrome for the Playwright browser suite

## Install

```sh
npm install
```

## Preview

```sh
npm run serve
```

Open `http://127.0.0.1:4173`. The Node process is a development-only static file server; production
can serve `index.html`, `styles.css`, and `src/` from any static host.

## Quality commands

```sh
npm test
npm run test:e2e
npm run test:all
```

- `npm test` runs deterministic domain and persistence tests with Node's built-in test runner.
- `npm run test:e2e` runs the Chromium interaction and accessibility contract through Playwright.
- `npm run test:all` runs the complete merge gate.

The browser suite covers initial rendering, non-repeating quote selection, keyboard operation,
focus retention, multi-favorite persistence, independent unfavoriting, malformed/unavailable
storage, axe checks, narrow layouts, and long-content reflow.

## Manual accessibility review

After automated tests pass:

1. Navigate with Tab and Shift+Tab; activate each control with Enter and Space.
2. Confirm visible focus and that focus remains on the activated control.
3. With a screen reader, confirm a new quote and attribution are announced politely once.
4. Confirm Favorite quote announces its pressed state without changing its accessible name.
5. At 320 CSS pixels and 400% zoom, confirm text and controls reflow without horizontal scrolling.

## Persistence

Favorites use the namespaced key `quote-of-the-day:favorites` and a versioned JSON document of
stable quote IDs. If storage is unavailable, the page remains usable and explains that changes will
last only for the current visit.
