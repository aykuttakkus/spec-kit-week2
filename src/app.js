import { createFavoritesStore } from './favorites.js';
import { selectQuote, validateCatalog } from './quote-selection.js';
import { quotes as builtInQuotes } from './quotes.js';

const elements = {
  favoriteButton: document.querySelector('#favorite-quote'),
  favoriteIcon: document.querySelector('.favorite-icon'),
  figure: document.querySelector('#quote-region'),
  newQuoteButton: document.querySelector('#new-quote'),
  status: document.querySelector('#status-message'),
  attribution: document.querySelector('#quote-attribution'),
  text: document.querySelector('#quote-text'),
  unavailable: document.querySelector('#unavailable-message'),
};

function loadCatalog() {
  const suppliedCatalog = globalThis.__QUOTE_APP_CATALOG__;
  try {
    return validateCatalog(Array.isArray(suppliedCatalog) ? suppliedCatalog : builtInQuotes);
  } catch (error) {
    console.error('Quote catalog is invalid.', error);
    return [];
  }
}

const catalog = loadCatalog();
let browserStorage;
try {
  browserStorage = globalThis.localStorage;
} catch {
  browserStorage = {
    getItem() {
      throw new Error('Storage is unavailable.');
    },
    setItem() {
      throw new Error('Storage is unavailable.');
    },
  };
}

const favoriteStore = createFavoritesStore({
  storage: browserStorage,
  knownQuoteIds: catalog.map((quote) => quote.id),
});
const loadedFavorites = favoriteStore.load();
let currentQuote = selectQuote(catalog, null, Math.random);

function persistenceFailureMessage(storageFailure) {
  const action = storageFailure?.operation === 'read' ? 'read' : 'saved';
  return `Favorites could not be ${action}. Changes will only last for this visit.`;
}

function renderFavoriteState() {
  const isFavorite = Boolean(currentQuote && favoriteStore.isFavorite(currentQuote.id));
  elements.favoriteButton.setAttribute('aria-pressed', String(isFavorite));
  elements.favoriteIcon.textContent = isFavorite ? '♥' : '♡';
}

function renderQuote() {
  if (!currentQuote) {
    elements.figure.hidden = true;
    elements.unavailable.hidden = false;
    elements.newQuoteButton.disabled = true;
    elements.favoriteButton.disabled = true;
    return;
  }

  elements.figure.hidden = false;
  elements.unavailable.hidden = true;
  elements.figure.dataset.quoteId = currentQuote.id;
  elements.text.textContent = currentQuote.text;
  elements.attribution.textContent = currentQuote.attribution;
  elements.newQuoteButton.disabled = false;
  elements.favoriteButton.disabled = false;
  renderFavoriteState();
}

function showNewQuote() {
  currentQuote = selectQuote(catalog, currentQuote?.id, Math.random);
  elements.status.textContent = '';
  renderQuote();
}

function toggleFavorite() {
  if (!currentQuote) {
    return;
  }

  const wasFavorite = favoriteStore.isFavorite(currentQuote.id);
  const update = wasFavorite
    ? favoriteStore.remove(currentQuote.id)
    : favoriteStore.add(currentQuote.id);

  renderFavoriteState();
  const action = wasFavorite ? 'removed from favorites' : 'added to favorites';
  const persistenceNote = update.persistenceAvailable
    ? ''
    : ` ${persistenceFailureMessage(update.failure)}`;
  elements.status.textContent = `Quote ${action}.${persistenceNote}`;
}

elements.newQuoteButton.addEventListener('click', showNewQuote);
elements.favoriteButton.addEventListener('click', toggleFavorite);

renderQuote();

if (!loadedFavorites.persistenceAvailable) {
  elements.status.textContent = persistenceFailureMessage(loadedFavorites.failure);
}
