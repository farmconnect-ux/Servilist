/**
 * Mobile Bottom Sheet Manager.
 * Enhances standard modal overlays into touch-friendly full-screen sheets on small Android screens.
 */
export function setupMobileSheetEnhancements(modalOverlay: HTMLElement) {
  const card = modalOverlay.querySelector('.modal-card') as HTMLElement | null;
  if (!card) return;

  // Add sheet drag indicator if not present
  if (!card.querySelector('.sheet-drag-handle')) {
    const handle = document.createElement('div');
    handle.className = 'sheet-drag-handle';
    handle.setAttribute('aria-hidden', 'true');
    handle.innerHTML = `<span class="handle-bar"></span>`;
    card.insertBefore(handle, card.firstChild);
  }
}
