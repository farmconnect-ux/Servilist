export type MemberNavActions = Record<string, () => void>;

/**
 * Member navigation sidebar (desktop).
 * Feed items forward to an existing filter control via `data-nav-click`;
 * the rest run a named action from `actions` via `data-nav-action`.
 */
export function initMemberNav(
  actions: MemberNavActions = {},
  root: HTMLElement | null = document.getElementById('memberNav')
) {
  if (!root) return;

  const items = Array.from(root.querySelectorAll<HTMLButtonElement>('.member-nav-item'));

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const action = item.dataset.navAction;
      if (action) {
        actions[action]?.();
        return;
      }

      const selector = item.dataset.navClick;
      const target = selector ? document.querySelector<HTMLElement>(selector) : null;
      if (!target) return;
      target.click();

      // Only feed views stay selected; actions open a panel over the feed.
      items.forEach((i) => {
        i.classList.remove('active');
        i.removeAttribute('aria-current');
      });
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}
