import { expect, test } from '@playwright/test';

import { quotes } from '../../src/quotes.js';
import { STORAGE_KEY, openCleanPage, useCatalog, useDeterministicRandom } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await useDeterministicRandom(page, 0);
});

test('shows exactly one complete catalog quote on initial load', async ({ page }) => {
  await openCleanPage(page);

  const region = page.locator('#quote-region');
  await expect(region).toBeVisible();
  await expect(region).toHaveAttribute('data-quote-id', quotes[0].id);
  await expect(page.locator('#quote-text')).toHaveText(quotes[0].text);
  await expect(page.locator('#quote-attribution')).toHaveText(quotes[0].attribution);
  await expect(page.locator('blockquote')).toHaveCount(1);
});

test('normalizes a missing attribution to Unknown', async ({ page }) => {
  await useCatalog(page, [{ id: 'test-quote', text: 'A complete thought.', attribution: '' }]);
  await page.goto('/');

  await expect(page.locator('#quote-text')).toHaveText('A complete thought.');
  await expect(page.locator('#quote-attribution')).toHaveText('Unknown');
});

test('shows a safe unavailable state for an empty catalog', async ({ page }) => {
  await useCatalog(page, []);
  await page.goto('/');

  await expect(page.locator('#unavailable-message')).toBeVisible();
  await expect(page.getByRole('button', { name: 'New quote' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Favorite quote' })).toBeDisabled();
  await expect(page.locator('#quote-region')).toBeHidden();
});

test('New quote replaces content without navigation and retains focus', async ({ page }) => {
  await openCleanPage(page);
  const button = page.getByRole('button', { name: 'New quote' });
  const originalId = await page.locator('#quote-region').getAttribute('data-quote-id');
  const navigationCount = await page.evaluate(
    () => performance.getEntriesByType('navigation').length,
  );

  const startedAt = Date.now();
  await button.click();

  await expect(page.locator('#quote-region')).not.toHaveAttribute('data-quote-id', originalId);
  expect(Date.now() - startedAt).toBeLessThan(1000);
  await expect(button).toBeFocused();
  expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(
    navigationCount,
  );
  await expect(page.locator('#quote-region')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#quote-region')).toHaveAttribute('aria-atomic', 'true');
});

test('New quote supports native keyboard activation', async ({ page }) => {
  await openCleanPage(page);
  const button = page.getByRole('button', { name: 'New quote' });
  const originalId = await page.locator('#quote-region').getAttribute('data-quote-id');

  await button.focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('#quote-region')).not.toHaveAttribute('data-quote-id', originalId);
  await expect(button).toBeFocused();
});

test('New quote remains stable with one catalog entry', async ({ page }) => {
  await useCatalog(page, [{ id: 'only-quote', text: 'Only one.', attribution: 'One Author' }]);
  await page.goto('/');
  const button = page.getByRole('button', { name: 'New quote' });

  await button.click();

  await expect(page.locator('#quote-region')).toHaveAttribute('data-quote-id', 'only-quote');
  await expect(page.locator('#quote-text')).toHaveText('Only one.');
});

test('persists multiple favorites and removes only the selected quote', async ({ page }) => {
  await openCleanPage(page);
  const favorite = page.getByRole('button', { name: 'Favorite quote' });
  const next = page.getByRole('button', { name: 'New quote' });
  const firstId = await page.locator('#quote-region').getAttribute('data-quote-id');

  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await next.click();
  const secondId = await page.locator('#quote-region').getAttribute('data-quote-id');
  expect(secondId).not.toBe(firstId);
  await favorite.click();

  await page.reload();
  await expect(page.locator('#quote-region')).toHaveAttribute('data-quote-id', firstId);
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await next.click();
  await expect(page.locator('#quote-region')).toHaveAttribute('data-quote-id', secondId);
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');

  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.locator('#quote-region')).toHaveAttribute('data-quote-id', firstId);
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await next.click();
  await expect(page.locator('#quote-region')).toHaveAttribute('data-quote-id', secondId);
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');

  await expect(page.getByRole('button', { name: 'Favorite quote' })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /favorites/i })).toHaveCount(0);
});

test('malformed favorite data falls back safely and keeps quote discovery usable', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{malformed-json');
  }, STORAGE_KEY);
  await page.goto('/');

  await expect(page.locator('#quote-text')).not.toBeEmpty();
  await expect(page.getByRole('button', { name: 'Favorite quote' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  const originalId = await page.locator('#quote-region').getAttribute('data-quote-id');
  await page.getByRole('button', { name: 'New quote' }).click();
  await expect(page.locator('#quote-region')).not.toHaveAttribute('data-quote-id', originalId);
});

test('unavailable storage keeps session favorites usable and warns without blocking', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage blocked');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage blocked');
    };
  });
  await page.goto('/');

  const favorite = page.getByRole('button', { name: 'Favorite quote' });
  await expect(page.locator('#status-message')).toContainText('could not be read');
  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#status-message')).toContainText('could not be saved');
  await expect(page.locator('#status-message')).toContainText('only last for this visit');
  await page.getByRole('button', { name: 'New quote' }).click();
  await expect(page.locator('#quote-text')).not.toBeEmpty();
});

test('write failures retain independent favorites for the current visit', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage quota exceeded');
    };
  });
  await page.goto('/');

  const favorite = page.getByRole('button', { name: 'Favorite quote' });
  const next = page.getByRole('button', { name: 'New quote' });

  await favorite.click();
  await expect(page.locator('#status-message')).toContainText('could not be saved');
  await next.click();
  await favorite.click();

  await next.click();
  await expect(page.locator('#quote-region')).toHaveAttribute('data-quote-id', quotes[0].id);
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');

  await next.click();
  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');

  await next.click();
  await expect(page.locator('#quote-region')).toHaveAttribute('data-quote-id', quotes[0].id);
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
});

test('meets sampled initial-load and new-quote response targets', async ({ page }) => {
  test.setTimeout(60_000);
  const sampleCount = 20;
  const initialLoadDurations = [];

  for (let sample = 0; sample < sampleCount; sample += 1) {
    const startedAt = Date.now();
    await page.goto(`/?performance-sample=${sample}`);
    await expect(page.locator('#quote-text')).not.toBeEmpty();
    initialLoadDurations.push(Date.now() - startedAt);
  }

  const quoteChangeDurations = [];
  const next = page.getByRole('button', { name: 'New quote' });
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const previousId = await page.locator('#quote-region').getAttribute('data-quote-id');
    const startedAt = Date.now();
    await next.click();
    await expect(page.locator('#quote-region')).not.toHaveAttribute('data-quote-id', previousId);
    quoteChangeDurations.push(Date.now() - startedAt);
  }

  const initialLoadPassRate =
    initialLoadDurations.filter((duration) => duration <= 2_000).length / sampleCount;
  const quoteChangePassRate =
    quoteChangeDurations.filter((duration) => duration <= 1_000).length / sampleCount;

  expect(
    initialLoadPassRate,
    `initial-load samples: ${initialLoadDurations.join(', ')} ms`,
  ).toBeGreaterThanOrEqual(0.95);
  expect(
    quoteChangePassRate,
    `new-quote samples: ${quoteChangeDurations.join(', ')} ms`,
  ).toBeGreaterThanOrEqual(0.95);
});

test('favorite recovery never clears unrelated origin storage', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem('unrelated-preference', 'keep-me');
    localStorage.setItem(key, '{malformed-json');
  }, STORAGE_KEY);
  await page.goto('/');

  await page.getByRole('button', { name: 'Favorite quote' }).click();

  expect(await page.evaluate(() => localStorage.getItem('unrelated-preference'))).toBe('keep-me');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  expect(saved.version).toBe(1);
  expect(saved.quoteIds).toHaveLength(1);
});
