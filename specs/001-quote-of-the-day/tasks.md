# Tasks: Quote of the Day

**Input**: Design documents from `/specs/001-quote-of-the-day/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated tests are required by the project constitution. Within every user-story phase,
write the listed tests first and confirm they fail before implementing the behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as
an independent increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it uses different files and has no incomplete dependency
- **[Story]**: Maps the task to User Story 1, 2, or 3 from spec.md
- Every task includes the exact file path it creates or changes

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the static application and repeatable quality commands.

- [ ] T001 Create `package.json` as an ES module project with `test`, `test:e2e`, `test:all`, and `serve` scripts plus development-only Playwright and axe dependencies
- [ ] T002 [P] Configure Chromium browser tests and the test-only static server in `playwright.config.js` and `tests/static-server.js`
- [ ] T003 [P] Add dependency, browser-report, and test-result exclusions to `.gitignore`
- [ ] T004 Install the declared development dependencies and record the resolved versions in `package-lock.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the semantic page, responsive visual foundation, and deterministic browser-test
helpers required by every user story.

**Critical**: No user-story implementation begins until this phase is complete.

- [ ] T005 [P] Create the semantic page shell in `index.html` with one `main`, one `h1`, a `figure` containing `blockquote` and `figcaption`, a pre-existing polite atomic quote region, native `New quote` and `Favorite quote` buttons, and a non-blocking status region
- [ ] T006 [P] Create the responsive baseline in `styles.css` with visible focus, practical 44-by-44 CSS-pixel controls, full quote wrapping, no fixed quote height, 320 CSS-pixel reflow, and reduced-motion-safe defaults
- [ ] T007 [P] Create deterministic browser navigation, random-selection control, clean-context, and storage-seeding helpers in `tests/e2e/helpers.js`

**Checkpoint**: The page shell can be served, and unit and browser test commands can discover tests.

---

## Phase 3: User Story 1 - Discover a Quote (Priority: P1) — MVP

**Goal**: Display exactly one complete randomly selected built-in quote and attribution on initial
page load, with a safe empty-catalog state.

**Independent Test**: Open the page with a non-empty catalog and verify exactly one catalog quote
and attribution are visible without interaction; verify an empty catalog shows the unavailable state
and disables quote-dependent controls.

### Tests for User Story 1

- [ ] T008 [P] [US1] Write failing unit tests for empty, single-entry, multi-entry, deterministic boundary selection, and catalog membership in `tests/unit/quote-selection.test.js`
- [ ] T009 [P] [US1] Write failing browser tests for initial quote rendering, `Unknown` attribution normalization, and the empty-catalog disabled state in `tests/e2e/quote-page.spec.js`

### Implementation for User Story 1

- [ ] T010 [US1] Create at least five catalog entries in `src/quotes.js` where `id` is "Stable, non-empty, unique across the catalog; never derived from array position", `text` is "Non-empty quote content; rendered in full without truncation", and `attribution` has a non-empty display value normalized to `Unknown` when missing
- [ ] T011 [US1] Implement catalog validation and injectable initial random selection with empty and single-entry handling in `src/quote-selection.js`
- [ ] T012 [US1] Implement page initialization, quote rendering, attribution normalization, and the empty-catalog unavailable state in `src/app.js`

**Checkpoint**: User Story 1 passes its unit and browser tests and is independently demonstrable as
a quote-of-the-day MVP.

---

## Phase 4: User Story 2 - Request Another Quote (Priority: P2)

**Goal**: Let the visitor request another random quote without a reload and without immediately
repeating the current quote when alternatives exist.

**Independent Test**: Record the displayed quote, activate `New quote`, and verify a different
catalog quote appears without navigation; with one catalog entry, verify the page remains stable.

### Tests for User Story 2

- [ ] T013 [P] [US2] Add failing unit cases proving two-or-more-entry selection excludes the current quote without retries and one-entry selection remains stable in `tests/unit/quote-selection.test.js`
- [ ] T014 [P] [US2] Add failing pointer and keyboard browser cases for content replacement, one-second completion, focus retention, and one polite atomic announcement in `tests/e2e/quote-page.spec.js`

### Implementation for User Story 2

- [ ] T015 [US2] Extend the pure selector to accept `currentQuoteId` and select from all other entries with injected randomness in `src/quote-selection.js`
- [ ] T016 [US2] Wire `New quote` pointer and native keyboard activation, content updates, focus retention, and favorite-state refresh hooks in `src/app.js`

**Checkpoint**: User Story 2 passes independently with multi-entry and single-entry catalogs while
User Story 1 remains green.

---

## Phase 5: User Story 3 - Remember Favorite Quotes (Priority: P3)

**Goal**: Save multiple quote favorites independently across reloads and remove one without changing
any other saved favorite.

**Independent Test**: Favorite Quotes A and B, reload and verify both; unfavorite B, reload and
verify A remains favorited while B does not.

### Tests for User Story 3

- [ ] T017 [P] [US3] Write failing unit tests for the version-1 schema, missing and malformed values, unsupported versions, unknown and duplicate IDs, sorted serialization, storage exceptions, idempotent add/remove, multi-favorite reload, and remove-one-preserves-others behavior in `tests/unit/favorites.test.js`
- [ ] T018 [P] [US3] Add failing browser tests for stable `aria-pressed`, two independently persisted favorites, removing one while preserving another after reload, and no separate favorites-list view in `tests/e2e/quote-page.spec.js`

### Implementation for User Story 3

- [ ] T019 [US3] Implement the `quote-of-the-day:favorites` version-1 persistence boundary with injectable storage, validated known IDs, unique sorted `quoteIds`, safe reads, single-write targeted mutations, and in-memory failure fallback in `src/favorites.js`
- [ ] T020 [US3] Integrate favorite loading, per-quote pressed-state derivation, targeted add/remove actions, reload persistence, and non-blocking failure messages in `src/app.js`
- [ ] T021 [US3] Add non-color-only favorite styling for true and false pressed states without changing the stable `Favorite quote` accessible name in `styles.css`

**Checkpoint**: All three user stories pass independently, and unfavoriting one quote never changes
another quote's state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete accessibility, degraded-state, documentation, and full quality-gate coverage.

- [ ] T022 [P] Add axe scans for initial and interacted states plus explicit keyboard order, Enter/Space activation, visible focus, focus retention, live-region, pressed-state, 320 CSS-pixel, 400% zoom, and long-quote assertions in `tests/e2e/accessibility.spec.js`
- [ ] T023 [P] Add browser coverage for malformed saved JSON, unavailable storage, non-blocking persistence warnings, continued quote discovery, and no unrelated storage clearing in `tests/e2e/quote-page.spec.js`
- [ ] T024 [P] Document static preview, unit, browser, full-gate, and manual accessibility commands in `README.md`
- [ ] T025 Run `npm run test:all`, complete the manual dynamic-announcement and reflow checks, and record the final validation evidence in `specs/001-quote-of-the-day/quickstart.md`

**Checkpoint**: The complete quality gate passes with no constitution exceptions, no backend or
external quote requests, and no unresolved validation notes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: No dependencies; begins immediately.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 — User Story 1**: Depends on Phase 2 and supplies the MVP quote display.
- **Phase 4 — User Story 2**: Depends on Phase 2; integrates with the PageState rendering path from
  User Story 1, so the recommended sequence is after Phase 3.
- **Phase 5 — User Story 3**: Depends on Phase 2; can develop its persistence module independently,
  then integrates with the current-quote rendering supplied by User Stories 1 and 2.
- **Phase 6 — Polish**: Depends on every user story selected for delivery.

### User Story Dependencies

- **US1 (P1)**: No dependency on another story after the shared foundation.
- **US2 (P2)**: Its selector tests and implementation are independently testable after foundation;
  final UI wiring reuses US1's current-quote rendering.
- **US3 (P3)**: Its persistence module is independently testable after foundation; final browser
  flow uses US1 display and US2 navigation to revisit multiple quotes deterministically.

### User Story Completion Order

```text
Setup → Foundation → US1 (MVP) → US2 → US3 → Polish
                         └──────────┴─────── persistence work may proceed in parallel
```

### Within Each User Story

1. Write tests and confirm they fail for the expected missing behavior.
2. Implement data/domain behavior before browser coordination.
3. Integrate UI behavior and state.
4. Run the story-specific unit and browser tests.
5. Stop at the checkpoint before advancing to the next priority.

## Parallel Opportunities

- T002 and T003 can proceed alongside T001; T004 waits for T001.
- T005, T006, and T007 touch separate files and can run together after setup.
- T008 and T009 can run together before US1 implementation.
- T013 and T014 can run together before US2 implementation.
- T017 and T018 can run together before US3 implementation.
- The core work in T019 can begin after foundation while US1 and US2 are developed, but T020 waits
  for current-quote rendering and navigation integration.
- T022, T023, and T024 can proceed in parallel after the story implementations stabilize.

## Parallel Examples

### User Story 1

```text
Task T008: Unit-test deterministic quote selection in tests/unit/quote-selection.test.js
Task T009: Browser-test initial and empty quote states in tests/e2e/quote-page.spec.js
```

### User Story 2

```text
Task T013: Unit-test non-repeating selection in tests/unit/quote-selection.test.js
Task T014: Browser-test New quote interaction in tests/e2e/quote-page.spec.js
```

### User Story 3

```text
Task T017: Unit-test FavoriteCollection persistence in tests/unit/favorites.test.js
Task T018: Browser-test independent favorite persistence in tests/e2e/quote-page.spec.js
```

## Implementation Strategy

### MVP First — User Story 1

1. Complete Setup and Foundational phases.
2. Write and run the failing US1 tests.
3. Implement US1 and run its focused tests.
4. Stop and demonstrate the initial random Quote experience.

### Incremental Delivery

1. Deliver US1 as the independently useful quote-of-the-day MVP.
2. Add US2 without changing persistence or adding a backend.
3. Add US3 behind the tested storage boundary without adding a favorites-list view.
4. Complete the cross-cutting accessibility and degraded-state gate.

### Parallel Team Strategy

After the shared foundation, separate contributors can own selection/UI work and favorite-persistence
work. Integration remains ordered through T016 and T020 so simultaneous edits to `src/app.js` do not
conflict.

## Notes

- `[P]` identifies only tasks that can modify separate files without awaiting incomplete work.
- Every user-story task carries its `[US1]`, `[US2]`, or `[US3]` traceability label.
- Keep production code dependency-free; Playwright and axe remain development-only.
- Do not create a backend, external quote integration, cross-device synchronization, or separate
  favorites-list view.
- Commit after each task or cohesive task group and retain failing-before-passing test evidence.
