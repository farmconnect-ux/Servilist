/** Sidebar filters: price range, formats and fulfilment. */
import { CURRENCY_CONFIGS, toMinorUnits } from '../money';
import type { ServilistApp } from '../main';

const LISTING_FORMATS = ['auction', 'buy_now', 'service', 'free_barter'];
/** Matches nothing, so "no boxes ticked" shows no listings instead of all of them. */
const NONE = ['__none__'];

function checkedValues(name: string): string[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(`input[name='${name}']:checked`)
  ).map((input) => input.value);
}

/** Bounds are typed in the display currency; the filter converts each listing to it. */
export function applyPriceRange(app: ServilistApp) {
  const read = (id: string) => {
    const raw = (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
    const value = parseFloat(raw);
    return raw.trim() !== '' && value >= 0 ? toMinorUnits(value, app.activeCurrency) : null;
  };
  app.filters.minPriceMinor = read('minPriceInput');
  app.filters.maxPriceMinor = read('maxPriceInput');
  app.filters.priceCurrency = app.activeCurrency;
  app.renderListings();
}

export function applyFormatFilter(app: ServilistApp) {
  const formats = checkedValues('formatFilter').filter((v) => LISTING_FORMATS.includes(v));
  app.filters.formatCheckboxes = formats.length ? formats : NONE;
  app.renderListings();
}

export function applyFulfillmentFilter(app: ServilistApp) {
  const chosen = checkedValues('fulfillmentFilter');
  // A listing offering both pickup and shipping satisfies either choice
  app.filters.fulfillmentCheckboxes = chosen.length ? [...chosen, 'both'] : NONE;
  app.renderListings();
}

export function syncPricePrefix(app: ServilistApp) {
  const symbol = CURRENCY_CONFIGS[app.activeCurrency]?.symbol.trim() || '';
  ['priceCurrencyPrefixMin', 'priceCurrencyPrefixMax'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = symbol;
  });
}

export function resetFilterControls() {
  ['minPriceInput', 'maxPriceInput'].forEach((id) => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (input) input.value = '';
  });
  document
    .querySelectorAll<HTMLInputElement>(
      "input[name='formatFilter'], input[name='fulfillmentFilter']"
    )
    .forEach((input) => (input.checked = true));
  const radius = document.getElementById('radiusFilterSelect') as HTMLSelectElement | null;
  if (radius) radius.value = 'any';
}

export function bindFilterControls(app: ServilistApp) {
  document.getElementById('applyPriceBtn')?.addEventListener('click', () => applyPriceRange(app));
  ['minPriceInput', 'maxPriceInput'].forEach((id) =>
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') applyPriceRange(app);
    })
  );
  document
    .querySelectorAll("input[name='formatFilter']")
    .forEach((input) => input.addEventListener('change', () => applyFormatFilter(app)));
  document
    .querySelectorAll("input[name='fulfillmentFilter']")
    .forEach((input) => input.addEventListener('change', () => applyFulfillmentFilter(app)));

  // Currency calculator recalculates as you type
  ['calcAmountInput', 'calcFromCurrency', 'calcToCurrency'].forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', () => app.updateConverterResults());
    el?.addEventListener('change', () => app.updateConverterResults());
  });
  document.getElementById('calcSwapBtn')?.addEventListener('click', () => {
    const from = document.getElementById('calcFromCurrency') as HTMLSelectElement | null;
    const to = document.getElementById('calcToCurrency') as HTMLSelectElement | null;
    if (!from || !to) return;
    [from.value, to.value] = [to.value, from.value];
    app.updateConverterResults();
  });
}
