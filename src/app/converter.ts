/** Currency converter modal. */
import { CurrencyCode } from '../types';
import {
  toMinorUnits,
  fromMinorUnits,
  convertMinor,
  formatMoney,
  CURRENCY_CONFIGS,
} from '../money';
import type { ServilistApp } from '../main';

export function openConverterModal(app: ServilistApp) {
  app.dialogs['converterModalOverlay']?.open();
  app.updateConverterResults();
}

export function updateConverterResults(_app: ServilistApp) {
  const input = document.getElementById('calcAmountInput') as HTMLInputElement | null;
  const fromSel = document.getElementById('calcFromCurrency') as HTMLSelectElement | null;
  const toSel = document.getElementById('calcToCurrency') as HTMLSelectElement | null;
  const display = document.getElementById('convMainResultDisplay');
  const breakdown = document.getElementById('convRateBreakdown');

  if (!input || !fromSel || !toSel || !display) return;

  const amount = parseFloat(input.value) || 0;
  const fromCurr = fromSel.value as CurrencyCode;
  const toCurr = toSel.value as CurrencyCode;

  const fromMinor = toMinorUnits(amount, fromCurr);
  const convertedMinor = convertMinor(fromMinor, fromCurr, toCurr);
  display.textContent = formatMoney(convertedMinor, toCurr);

  // The same amount in every supported currency
  const matrix = document.getElementById('converterMatrixGrid');
  if (matrix) {
    matrix.innerHTML = (Object.keys(CURRENCY_CONFIGS) as CurrencyCode[])
      .filter((code) => code !== fromCurr)
      .map(
        (code) =>
          `<div class="matrix-cell"><span class="matrix-code">${code}</span><strong>${formatMoney(convertMinor(fromMinor, fromCurr, code), code)}</strong></div>`
      )
      .join('');
  }

  if (breakdown) {
    const oneFromInTo = convertMinor(toMinorUnits(1, fromCurr), fromCurr, toCurr);
    breakdown.textContent = `1 ${fromCurr} = ${fromMinorUnits(oneFromInTo, toCurr).toFixed(4)} ${toCurr}`;
  }
}
