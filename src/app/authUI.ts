/** Account modal: sign-in, sign-up, sign-out and the demo identity switcher. */
import { TEST_USERS } from '../auth/authService';
import type { ServilistApp } from '../main';

export function initAuthUI(app: ServilistApp) {
  const userPill = document.getElementById('userProfilePill');
  const signOutBtn = document.getElementById('authSignOutBtn');
  const phoneForm = document.getElementById('phoneAuthForm') as HTMLFormElement | null;
  const emailForm = document.getElementById('emailAuthForm') as HTMLFormElement | null;
  const regForm = document.getElementById('registerAuthForm') as HTMLFormElement | null;

  userPill?.addEventListener('click', () => {
    app.dialogs['authModalOverlay']?.open();
    if (!app.cloud) app.renderTestUsersList();
  });

  // Auth Modal Tabs
  document.querySelectorAll('#authModalTabs .modal-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('#authModalTabs .modal-tab-btn')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = (btn as HTMLElement).dataset.authTab;

      document
        .querySelectorAll('.auth-tab-panel')
        .forEach((p) => ((p as HTMLElement).style.display = 'none'));
      if (tab === 'switch') {
        const p = document.getElementById('authPanelSwitch');
        if (p) p.style.display = 'block';
        app.renderTestUsersList();
      } else if (tab === 'phone') {
        const p = document.getElementById('authPanelPhone');
        if (p) p.style.display = 'block';
      } else if (tab === 'email') {
        const p = document.getElementById('authPanelEmail');
        if (p) p.style.display = 'block';
      } else if (tab === 'register') {
        const p = document.getElementById('authPanelRegister');
        if (p) p.style.display = 'block';
      }
    });
  });

  phoneForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code =
      (document.getElementById('authPhoneCountry') as HTMLSelectElement)?.value || '+234';
    const num = (document.getElementById('authPhoneNumber') as HTMLInputElement)?.value || '';
    const user = app.authService.signInWithPhone(`${code}${num}`);
    app.syncAuthUserUI();
    app.dialogs['authModalOverlay']?.close();
    app.showToast(`Signed in via mobile phone as ${user.name}`, 'success');
  });

  emailForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (document.getElementById('authEmailInput') as HTMLInputElement)?.value || '';
    if (app.cloud) {
      const passwordInput = document.getElementById('authPasswordInput') as HTMLInputElement;
      void app.cloud.signIn(email.trim(), passwordInput?.value || '');
      if (passwordInput) passwordInput.value = '';
      return;
    }
    const user = app.authService.signInWithEmail(email);
    app.syncAuthUserUI();
    app.dialogs['authModalOverlay']?.close();
    app.showToast(`Signed in as ${user.name}`, 'success');
  });

  regForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('regFullName') as HTMLInputElement)?.value || '';
    const email = (document.getElementById('regEmail') as HTMLInputElement)?.value || '';
    const phone = (document.getElementById('regPhone') as HTMLInputElement)?.value || '';
    const city =
      (document.getElementById('regCity') as HTMLSelectElement)?.value || 'Lagos, Nigeria';
    if (app.cloud) {
      const passwordInput = document.getElementById('regPassword') as HTMLInputElement;
      void app.cloud.signUp({
        name: name.trim(),
        email: email.trim(),
        password: passwordInput?.value || '',
        city,
      });
      if (passwordInput) passwordInput.value = '';
      return;
    }
    const user = app.authService.signUp({ name, email, phone, city, country: 'Africa' });
    app.syncAuthUserUI();
    app.dialogs['authModalOverlay']?.close();
    app.showToast(`Welcome to Servilist Africa, ${user.name}!`, 'success');
  });

  signOutBtn?.addEventListener('click', () => {
    if (app.cloud) {
      void app.cloud.signOut();
      return;
    }
    app.authService.signOut();
    app.syncAuthUserUI();
    app.dialogs['authModalOverlay']?.close();
    app.showToast('Signed out to guest test profile', 'info');
  });

  app.authService.onAuthStateChange(() => {
    app.syncAuthUserUI();
  });

  app.syncAuthUserUI();
}

export function renderTestUsersList(app: ServilistApp) {
  const grid = document.getElementById('testUsersGrid');
  if (!grid) return;

  const current = app.authService.getCurrentUser();
  grid.innerHTML = TEST_USERS.map((u) => {
    const isActive = u.id === current.id;
    return `
      <div class="test-user-card ${isActive ? 'active-user' : ''}" data-user-id="${u.id}">
        <div class="test-user-avatar">${u.avatar}</div>
        <div class="test-user-info">
          <div class="test-user-name">${u.name} ${isActive ? '✓' : ''}</div>
          <div class="test-user-city">📍 ${u.city} &bull; ${u.role}</div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.test-user-card').forEach((card) => {
    card.addEventListener('click', () => {
      const uid = (card as HTMLElement).dataset.userId;
      if (uid) {
        const user = app.authService.switchUser(uid);
        app.syncAuthUserUI();
        app.showToast(`Switched active profile to ${user.name} (${user.city})`, 'info');
        app.dialogs['authModalOverlay']?.close();
        app.renderListings();
      }
    });
  });
}

export function syncAuthUserUI(app: ServilistApp) {
  const user = app.authService.getCurrentUser();
  const avatar = document.getElementById('navUserAvatar');
  const name = document.getElementById('navUserName');
  if (avatar) avatar.textContent = user.avatar;
  if (name) {
    name.textContent = user.id === 'guest' ? 'Sign in' : `${user.name} (${user.rating} ★)`;
  }

  const modalAvatar = document.getElementById('authCurrentAvatar');
  const modalName = document.getElementById('authCurrentName');
  const modalDetails = document.getElementById('authCurrentDetails');
  const modalRole = document.getElementById('authCurrentRole');
  if (modalAvatar) modalAvatar.textContent = user.avatar;
  if (modalName) modalName.textContent = user.name;
  if (modalDetails) {
    modalDetails.textContent = `📍 ${user.city || 'Africa Hub'} • ${user.verified ? 'Verified Merchant' : 'Community Trader'} (${user.rating} ★)`;
  }
  if (modalRole) modalRole.textContent = `Role: ${user.role.toUpperCase()}`;
  app.updateActivityBadges();
}
