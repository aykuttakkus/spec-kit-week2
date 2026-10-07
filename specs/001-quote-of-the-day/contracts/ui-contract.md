# UI Contract: Quote of the Day Page

## Page regions

1. A `main` landmark contains the complete experience.
2. One `h1` identifies the page.
3. The current Quote appears as a `figure` containing:
   - a `blockquote` with the complete quote text;
   - a `figcaption` with attribution, using `Unknown` when no attribution is available.
4. The quote-and-attribution region is present on initial render and exposes polite, atomic updates.
5. Controls follow the content in logical reading and focus order.
6. A non-blocking status region communicates favorite changes and persistence failures without
   interrupting the visitor.

## New quote control

- Native `button` with the accessible name `New quote`.
- Enabled only when a Quote can be displayed.
- Pointer click, Enter, and Space activate the same action.
- With two or more Quotes, activation displays a Quote different from the current one.
- Focus remains on the button after activation.
- The quote update is announced politely once, including text and attribution.
- The Favorite control immediately reflects the newly displayed Quote's independent state.

## Favorite control

- Native toggle `button` with the stable accessible name `Favorite quote`.
- `aria-pressed="true"` means the current Quote is favorited; `false` means it is not.
- Visual state cannot rely only on color and remains consistent with `aria-pressed`.
- Pointer click, Enter, and Space toggle only the current Quote.
- Focus remains on the same button after activation.
- Toggling one Quote does not change any other Quote's saved state.
- No separate favorites-list control or view is present.

## Empty and degraded states

- An empty catalog displays a clear unavailable message and disables both controls.
- Unavailable or malformed saved data does not hide the Quote or disable New quote.
- A persistence write failure communicates that the current preference may not survive reload, but
  does not block further quote discovery.

## Layout and accessibility

- All content and controls reflow without clipping or horizontal page scrolling at a 320 CSS-pixel
  viewport and at 400% zoom.
- Quote text is never truncated and containers have no fixed content height.
- Long unbroken content wraps safely.
- Keyboard focus is visibly distinguishable with a contrasting outline.
- Control targets meet a practical 44 by 44 CSS-pixel size where layout permits.
- Motion, if added, respects reduced-motion preferences and is not required to understand state.

## Browser contract tests

1. Tab order reaches New quote and Favorite quote in logical order; Enter and Space activate each.
2. New quote changes content, retains focus, announces one update, and refreshes favorite state.
3. Favorite two Quotes, reload and revisit each, and observe `aria-pressed="true"` for both.
4. Unfavorite one of multiple Quotes, reload and revisit them, and observe only that Quote as false.
5. Seed malformed saved data and verify quote viewing and New quote remain operational.
6. At narrow width and high zoom, all text and controls remain visible without horizontal scrolling.
