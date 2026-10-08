import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { openCleanPage, useCatalog, useDeterministicRandom } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await useDeterministicRandom(page, 0);
});

test('initial and interacted states have no detectable accessibility violations', async ({
  page,
}) => {
  await openCleanPage(page);

  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole('button', { name: 'New quote' }).click();
  await page.getByRole('button', { name: 'Favorite quote' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('logical keyboard order, activation, focus, and pressed state remain visible', async ({
  page,
}) => {
  await openCleanPage(page);
  const next = page.getByRole('button', { name: 'New quote' });
  const favorite = page.getByRole('button', { name: 'Favorite quote' });
  const originalId = await page.locator('#quote-region').getAttribute('data-quote-id');

  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();
  await expect(page.locator('#quote-region')).not.toHaveAttribute('data-quote-id', originalId);

  await page.keyboard.press('Tab');
  await expect(favorite).toBeFocused();
  const focusIsVisible = await favorite.evaluate((element) => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2;
  });
  expect(focusIsVisible).toBe(true);

  await page.keyboard.press('Space');
  await expect(favorite).toBeFocused();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#status-message')).toContainText('added to favorites');
});

test('quote changes use a polite atomic region without moving focus', async ({ page }) => {
  await openCleanPage(page);
  const region = page.locator('#quote-region');
  const next = page.getByRole('button', { name: 'New quote' });

  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).toHaveAttribute('aria-atomic', 'true');
  await next.click();
  await expect(next).toBeFocused();
  await expect(region.locator('#quote-text')).not.toBeEmpty();
  await expect(region.locator('#quote-attribution')).not.toBeEmpty();
});

test('long content reflows at narrow width and simulated 400 percent zoom', async ({ page }) => {
  const longWord = 'thought'.repeat(80);
  await useCatalog(page, [{ id: 'long-quote', text: longWord, attribution: longWord }]);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');

  const narrowMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(narrowMetrics.scrollWidth).toBeLessThanOrEqual(narrowMetrics.clientWidth);

  // A 1280 CSS-pixel viewport at 400% zoom exercises the WCAG 320 CSS-pixel reflow target.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '4';
  });

  const zoomedMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    quoteHeight: document.querySelector('#quote-text').getBoundingClientRect().height,
  }));
  expect(zoomedMetrics.scrollWidth).toBeLessThanOrEqual(zoomedMetrics.clientWidth);
  expect(zoomedMetrics.quoteHeight).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'New quote' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Favorite quote' })).toBeVisible();
});
