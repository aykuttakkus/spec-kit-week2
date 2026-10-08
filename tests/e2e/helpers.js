export const STORAGE_KEY = 'quote-of-the-day:favorites';

export async function useDeterministicRandom(page, value = 0) {
  await page.addInitScript((fixedValue) => {
    Math.random = () => fixedValue;
  }, value);
}

export async function useCatalog(page, catalog) {
  await page.addInitScript((entries) => {
    globalThis.__QUOTE_APP_CATALOG__ = entries;
  }, catalog);
}

export async function seedFavorites(page, quoteIds) {
  await page.addInitScript(({ key, ids }) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, quoteIds: ids }));
  }, { key: STORAGE_KEY, ids: quoteIds });
}

export async function openCleanPage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

export async function currentQuoteId(page) {
  return page.locator('#quote-region').getAttribute('data-quote-id');
}
