/**
 * Accessible Dialog and Modal Manager.
 * Handles ARIA attributes, focus trapping, Escape key closing, and focus restoration.
 */

export interface DialogOptions {
  onClose?: () => void;
  initialFocusSelector?: string;
  closeBtnSelector?: string;
}

export class AccessibleDialog {
  public overlay: HTMLElement;
  private previousActiveElement: HTMLElement | null = null;
  private options: DialogOptions;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(overlayElement: HTMLElement, options: DialogOptions = {}) {
    this.overlay = overlayElement;
    this.options = options;
    this.initAria();
  }

  private initAria() {
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');

    const card = this.overlay.querySelector('.modal-card') as HTMLElement | null;
    if (card) {
      const heading = card.querySelector('h2, h3, h4');
      if (heading) {
        if (!heading.id) {
          heading.id = `dialog-title-${Math.random().toString(36).slice(2, 8)}`;
        }
        this.overlay.setAttribute('aria-labelledby', heading.id);
      }
    }
  }

  public open() {
    this.previousActiveElement = document.activeElement as HTMLElement | null;
    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Trap focus inside modal
    this.setupFocusTrap();

    // Set initial focus
    if (this.options.initialFocusSelector) {
      const initial = this.overlay.querySelector(
        this.options.initialFocusSelector
      ) as HTMLElement | null;
      if (initial) {
        initial.focus();
        return;
      }
    }

    const firstFocusable = this.getFocusableElements()[0];
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  public close() {
    this.overlay.style.display = 'none';
    document.body.style.overflow = '';

    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    if (this.options.onClose) {
      this.options.onClose();
    }

    // Restore focus
    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      this.previousActiveElement.focus();
    }
  }

  public isOpen(): boolean {
    return this.overlay.style.display !== 'none' && this.overlay.style.display !== '';
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(this.overlay.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  private setupFocusTrap() {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = this.getFocusableElements();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
  }
}
