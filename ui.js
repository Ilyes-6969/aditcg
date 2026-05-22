// ============================================
// UI.JS — Modals, toasts, composants UI partagés
// ============================================

(() => {

  // ============================================
  // INJECTION CSS (composants)
  // ============================================

  const style = document.createElement('style');
  style.textContent = `
    /* MODAL OVERLAY */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s;
      padding: 20px;
    }
    .modal-overlay.open { opacity: 1; }
    .modal-overlay.closing { opacity: 0; pointer-events: none; }

    .modal {
      background: var(--white);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 440px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
      transform: scale(0.95);
      transition: transform 0.2s;
      border: 1px solid var(--gray-line);
    }
    .modal-overlay.open .modal { transform: scale(1); }

    .modal-header {
      padding: 28px 32px 12px;
      position: relative;
    }
    .modal-header .pokeball-mini {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(180deg, var(--red) 50%, #fff 50%);
      border: 2.5px solid #1a1a2e;
      position: relative;
      margin-bottom: 16px;
    }
    .modal-header .pokeball-mini::before {
      content: '';
      position: absolute;
      top: 50%; left: -2.5px; right: -2.5px;
      height: 2.5px;
      background: #1a1a2e;
      transform: translateY(-50%);
    }
    .modal-header .pokeball-mini::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 11px; height: 11px;
      background: #fff;
      border: 2.5px solid #1a1a2e;
      border-radius: 50%;
    }
    .modal-header h2 {
      font-family: var(--font-display);
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--ink);
      margin-bottom: 6px;
    }
    .modal-header h2 .accent { color: var(--red); font-style: italic; font-weight: 300; }
    .modal-header p {
      color: var(--gray-text);
      font-size: 14px;
    }
    .modal-close {
      position: absolute;
      top: 20px; right: 20px;
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--gray-bg);
      color: var(--ink);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s;
    }
    .modal-close:hover { background: var(--gray-line); }

    .modal-body { padding: 16px 32px 28px; }

    .form-field {
      margin-bottom: 16px;
    }
    .form-field label {
      display: block;
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--gray-text);
      margin-bottom: 6px;
      font-weight: 600;
    }
    .form-field input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid var(--gray-line);
      border-radius: var(--radius);
      background: var(--surface, var(--white));
      color: var(--ink);
      font-size: 15px;
      font-family: var(--font-body);
      transition: border 0.2s;
    }
    .form-field input:focus {
      outline: none;
      border-color: var(--blue);
    }
    .form-field .hint {
      font-size: 12px;
      color: var(--gray-text);
      margin-top: 4px;
    }

    .form-error {
      background: rgba(220, 10, 45, 0.08);
      border: 1.5px solid var(--red);
      color: var(--red);
      padding: 10px 14px;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .form-error ul { margin: 4px 0 0 16px; }

    .modal-footer {
      padding: 0 32px 28px;
      display: flex;
      gap: 10px;
      flex-direction: column;
    }
    .modal-footer .btn { width: 100%; }
    .modal-footer .switch-text {
      text-align: center;
      font-size: 13px;
      color: var(--gray-text);
      padding-top: 8px;
    }
    .modal-footer .switch-text a {
      color: var(--blue);
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
    }

    /* AVATAR NAV (quand connecté) */
    .nav-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px 4px 4px;
      background: var(--gray-bg);
      border: 1.5px solid var(--gray-line);
      border-radius: var(--radius-pill);
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }
    .nav-user:hover { border-color: var(--blue); }
    .nav-user-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: var(--yellow);
      border: 2px solid #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      color: #1a1a2e;
      overflow: hidden;
    }
    .nav-user-name {
      font-weight: 700;
      font-size: 13px;
      color: var(--ink);
    }
    .nav-user-chevron { color: var(--gray-text); font-size: 10px; }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--white);
      border: 1px solid var(--gray-line);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      width: 220px;
      padding: 8px;
      z-index: 200;
      opacity: 0;
      transform: translateY(-8px);
      pointer-events: none;
      transition: all 0.18s;
    }
    .user-dropdown.open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    .user-dropdown a, .user-dropdown button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
      text-align: left;
      cursor: pointer;
      transition: background 0.15s;
    }
    .user-dropdown a:hover, .user-dropdown button:hover {
      background: var(--gray-bg);
    }
    .user-dropdown .divider {
      height: 1px;
      background: var(--gray-line);
      margin: 6px 0;
    }
    .user-dropdown .danger { color: var(--red); }

    /* TOAST */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast {
      background: var(--ink);
      color: #fff;
      padding: 14px 20px;
      border-radius: var(--radius);
      box-shadow: var(--shadow-xl);
      font-size: 14px;
      font-weight: 600;
      min-width: 280px;
      max-width: 380px;
      display: flex;
      align-items: center;
      gap: 12px;
      transform: translateX(120%);
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      pointer-events: auto;
      border-left: 4px solid var(--blue);
    }
    .toast.show { transform: translateX(0); }
    .toast.success { border-left-color: var(--green); }
    .toast.error { border-left-color: var(--red); }
    .toast.warning { border-left-color: var(--yellow); }
    .toast .icon {
      width: 28px; height: 28px;
      flex-shrink: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
    }
    .toast.success .icon { background: var(--green); color: #fff; }
    .toast.error .icon { background: var(--red); color: #fff; }
    .toast.warning .icon { background: var(--yellow); color: #1a1a2e; }
    .toast.info .icon { background: var(--blue); color: #fff; }

    /* FAVORITE BUTTON */
    .fav-toggle {
      position: absolute;
      top: 8px; right: 8px;
      width: 32px; height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 5;
      transition: all 0.2s;
      box-shadow: var(--shadow-sm);
      font-size: 16px;
      color: var(--gray-text);
      border: none;
    }
    .fav-toggle:hover { transform: scale(1.1); }
    .fav-toggle.active { color: var(--red); }
    .fav-toggle.active::before { content: '♥'; }
    .fav-toggle:not(.active)::before { content: '♡'; }

    [data-theme="dark"] .fav-toggle {
      background: rgba(30, 30, 50, 0.95);
      color: #d4d6e5;
    }
    [data-theme="dark"] .fav-toggle.active { color: var(--red); }

    /* COLLECTION BADGE */
    .owned-toggle {
      position: absolute;
      top: 8px; left: 8px;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      z-index: 5;
      transition: all 0.2s;
      border: none;
      background: rgba(255, 255, 255, 0.95);
      color: var(--gray-text);
    }
    .owned-toggle:hover { transform: scale(1.05); }
    .owned-toggle.active {
      background: var(--green);
      color: #fff;
    }
    [data-theme="dark"] .owned-toggle {
      background: rgba(30, 30, 50, 0.95);
      color: #d4d6e5;
    }
    [data-theme="dark"] .owned-toggle.active {
      background: var(--green);
      color: #fff;
    }

    /* CONFIRM MODAL */
    .confirm-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    .confirm-actions .btn { flex: 1; }
  `;
  document.head.appendChild(style);

  // ============================================
  // MODAL SYSTEM
  // ============================================

  function openModal(html) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // Force layout for animation
    requestAnimationFrame(() => overlay.classList.add('open'));

    // Close handlers
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('.modal-close')) {
        closeModal();
      }
    });

    document.addEventListener('keydown', escClose);
    return overlay;
  }

  function escClose(e) {
    if (e.key === 'Escape') closeModal();
  }

  function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (!overlay) return;
    overlay.classList.add('closing');
    document.removeEventListener('keydown', escClose);
    setTimeout(() => overlay.remove(), 200);
  }

  // ============================================
  // LOGIN MODAL
  // ============================================

  function openLogin() {
    const overlay = openModal(`
      <div class="modal">
        <div class="modal-close">×</div>
        <div class="modal-header">
          <div class="pokeball-mini"></div>
          <h2>Bon retour <span class="accent">Dresseur</span></h2>
          <p>Connectez-vous pour accéder à votre collection.</p>
        </div>
        <div class="modal-body">
          <div id="login-error" style="display:none;"></div>
          <div class="form-field">
            <label>Email</label>
            <input type="email" id="login-email" placeholder="vous@exemple.fr" autocomplete="email">
          </div>
          <div class="form-field">
            <label>Mot de passe</label>
            <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password">
            <div class="hint">Compte démo : demo@aditcg.fr / demo1234</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary btn-large" id="login-submit">Se connecter</button>
          <div class="switch-text">Pas encore de compte ? <a id="switch-signup">Créer un compte</a></div>
        </div>
      </div>
    `);

    document.getElementById('login-submit').addEventListener('click', handleLogin);
    document.getElementById('switch-signup').addEventListener('click', () => { closeModal(); setTimeout(openSignup, 220); });
    ['login-email','login-password'].forEach(id => {
      document.getElementById(id).addEventListener('keypress', e => {
        if (e.key === 'Enter') handleLogin();
      });
    });
    document.getElementById('login-email').focus();
  }

  async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Connexion…'; }
    try {
      const res = await window.Auth.login({ email, password });
      if (res.success) {
        closeModal();
        toast(`Bienvenue, ${res.user.name} !`, 'success');
        setTimeout(() => window.location.reload(), 400);
      } else {
        showFormError('login-error', res.errors);
      }
    } catch (e) {
      console.error('Login error:', e);
      showFormError('login-error', [e.message || 'Erreur inconnue']);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Se connecter'; }
    }
  }

  // ============================================
  // SIGNUP MODAL
  // ============================================

  function openSignup() {
    openModal(`
      <div class="modal">
        <div class="modal-close">×</div>
        <div class="modal-header">
          <div class="pokeball-mini"></div>
          <h2>Devenir <span class="accent">Dresseur</span></h2>
          <p>Créez votre compte ADITCG gratuitement.</p>
        </div>
        <div class="modal-body">
          <div id="signup-error" style="display:none;"></div>
          <div class="form-field">
            <label>Nom complet</label>
            <input type="text" id="signup-name" placeholder="Sacha Ketchum">
          </div>
          <div class="form-field">
            <label>Nom d'utilisateur</label>
            <input type="text" id="signup-username" placeholder="sacha_pkmn">
            <div class="hint">Utilisé publiquement. Min 3 caractères.</div>
          </div>
          <div class="form-field">
            <label>Email</label>
            <input type="email" id="signup-email" placeholder="sacha@exemple.fr">
          </div>
          <div class="form-field">
            <label>Mot de passe</label>
            <input type="password" id="signup-password" placeholder="••••••••">
            <div class="hint">Min 6 caractères.</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary btn-large" id="signup-submit">Créer mon compte</button>
          <div class="switch-text">Déjà un compte ? <a id="switch-login">Se connecter</a></div>
        </div>
      </div>
    `);

    document.getElementById('signup-submit').addEventListener('click', handleSignup);
    document.getElementById('switch-login').addEventListener('click', () => { closeModal(); setTimeout(openLogin, 220); });
    document.getElementById('signup-name').focus();
  }

  async function handleSignup() {
    const data = {
      name: document.getElementById('signup-name').value,
      username: document.getElementById('signup-username').value,
      email: document.getElementById('signup-email').value,
      password: document.getElementById('signup-password').value,
    };
    const submitBtn = document.getElementById('signup-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Création…'; }
    try {
      const res = await window.Auth.signup(data);
      if (res.success) {
        closeModal();
        toast(`Compte créé ! Bienvenue ${res.user.name} 🎉`, 'success');
        setTimeout(() => window.location.reload(), 600);
      } else {
        showFormError('signup-error', res.errors);
      }
    } catch (e) {
      console.error('Signup error:', e);
      showFormError('signup-error', [e.message || 'Erreur inconnue']);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Créer mon compte'; }
    }
  }

  function showFormError(id, errors) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'block';
    el.className = 'form-error';

    // Defensive: ensure errors is a non-empty array of strings
    if (!Array.isArray(errors) || errors.length === 0) {
      errors = ['Une erreur est survenue. Vérifie la console (F12) pour plus de détails.'];
    }
    errors = errors.filter(e => e).map(e => String(e));
    if (errors.length === 0) errors = ['Erreur inconnue'];

    el.innerHTML = errors.length === 1
      ? errors[0]
      : `Veuillez corriger :<ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`;
  }

  // ============================================
  // CONFIRM MODAL
  // ============================================

  function confirm({ title, message, confirmText = 'Confirmer', cancelText = 'Annuler', dangerous = false }) {
    return new Promise(resolve => {
      openModal(`
        <div class="modal">
          <div class="modal-close">×</div>
          <div class="modal-header">
            <h2>${title}</h2>
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <div class="confirm-actions">
              <button class="btn btn-ghost" id="confirm-cancel">${cancelText}</button>
              <button class="btn ${dangerous ? 'btn-primary' : 'btn-dark'}" id="confirm-ok">${confirmText}</button>
            </div>
          </div>
        </div>
      `);
      document.getElementById('confirm-cancel').addEventListener('click', () => { closeModal(); resolve(false); });
      document.getElementById('confirm-ok').addEventListener('click', () => { closeModal(); resolve(true); });
    });
  }

  // ============================================
  // TOAST
  // ============================================

  function getToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function toast(message, type = 'info', duration = 3500) {
    const c = getToastContainer();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
    el.innerHTML = `<div class="icon">${icons[type] || 'i'}</div><div>${message}</div>`;
    c.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 320);
    }, duration);
  }

  // ============================================
  // SETTINGS MODAL (avatar customization)
  // ============================================

  // Pokémon avatars: official artwork (PokéAPI sprites) — clean centered headshots
  // Source: https://github.com/PokeAPI/sprites (free, official Nintendo artwork)
  const POKEMON_AVATARS = [
    { id: 'pikachu',    name: 'Pikachu',     dexNum: 25 },
    { id: 'charizard',  name: 'Dracaufeu',   dexNum: 6 },
    { id: 'mewtwo',     name: 'Mewtwo',      dexNum: 150 },
    { id: 'blastoise',  name: 'Tortank',     dexNum: 9 },
    { id: 'venusaur',   name: 'Florizarre',  dexNum: 3 },
    { id: 'eevee',      name: 'Évoli',       dexNum: 133 },
    { id: 'snorlax',    name: 'Ronflex',     dexNum: 143 },
    { id: 'gengar',     name: 'Ectoplasma',  dexNum: 94 },
    { id: 'gyarados',   name: 'Léviator',    dexNum: 130 },
    { id: 'dragonite',  name: 'Dracolosse',  dexNum: 149 },
    { id: 'mew',        name: 'Mew',         dexNum: 151 },
    { id: 'lugia',      name: 'Lugia',       dexNum: 249 },
    { id: 'hooh',       name: 'Ho-Oh',       dexNum: 250 },
    { id: 'rayquaza',   name: 'Rayquaza',    dexNum: 384 },
    { id: 'lucario',    name: 'Lucario',     dexNum: 448 },
    { id: 'umbreon',    name: 'Noctali',     dexNum: 197 },
    { id: 'espeon',     name: 'Mentali',     dexNum: 196 },
    { id: 'sylveon',    name: 'Nymphali',    dexNum: 700 },
    { id: 'greninja',   name: 'Amphinobi',   dexNum: 658 },
    { id: 'arceus',     name: 'Arceus',      dexNum: 493 },
    { id: 'garchomp',   name: 'Carchacrok',  dexNum: 445 },
    { id: 'tyranitar',  name: 'Tyranocif',   dexNum: 248 },
    { id: 'metagross',  name: 'Métalosse',   dexNum: 376 },
    { id: 'gardevoir',  name: 'Gardevoir',   dexNum: 282 },
  ];

  // Build URL from dex number — instant, no network call needed
  function getPokemonAvatarUrl(pokemonAvatarId) {
    const av = POKEMON_AVATARS.find(p => p.id === pokemonAvatarId);
    if (!av) return null;
    // Official artwork from PokéAPI (free, hosted on GitHub)
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${av.dexNum}.png`;
  }

  async function openSettings() {
    const user = window.Auth.getCurrentUser();
    if (!user) {
      openLogin();
      return;
    }

    openModal(`
      <div class="modal" style="max-width: 560px;">
        <div class="modal-close">×</div>
        <div class="modal-header">
          <div class="pokeball-mini"></div>
          <h2>Paramètres du <span class="accent">profil</span></h2>
          <p>Personnalisez votre photo de profil et vos informations.</p>
        </div>
        <div class="modal-body">

          <div style="margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--gray-text); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 14px;">Avatar</div>

            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 18px; padding: 14px; background: var(--gray-bg); border-radius: 12px;">
              <div id="avatar-preview" style="width: 64px; height: 64px; border-radius: 50%; background: var(--yellow); border: 3px solid #1a1a2e; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 800; font-size: 28px; color: #1a1a2e; flex-shrink: 0; overflow: hidden;"></div>
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 15px;" id="avatar-label">Avatar par défaut</div>
                <div style="font-size: 12px; color: var(--gray-text);">Cliquez sur un Pokémon pour le choisir</div>
              </div>
            </div>

            <div style="margin-bottom: 12px; font-size: 13px; font-weight: 600;">Pokémon emblématiques</div>
            <div id="avatar-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; max-height: 240px; overflow-y: auto; padding: 4px;"></div>

            <div style="margin-top: 16px; font-size: 13px;">
              <button class="btn btn-ghost btn-small" id="reset-avatar" style="width: 100%;">↺ Avatar par défaut (initiale)</button>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--gray-text); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 14px;">Informations</div>

            <div class="form-field">
              <label>Nom affiché publiquement</label>
              <input type="text" id="setting-name" placeholder="Sacha Ketchum" value="${user.name || ''}" maxlength="40">
              <div class="hint">Affiché en grand sur votre profil.</div>
            </div>

            <div class="form-field">
              <label>Nom d'utilisateur (@username)</label>
              <input type="text" id="setting-username" placeholder="sacha_pkmn" value="${user.username || ''}" maxlength="20">
              <div class="hint">Sert à vous trouver dans la barre de recherche. 3-20 caractères, lettres/chiffres/underscore.</div>
            </div>

            <div class="form-field">
              <label>Localisation</label>
              <input type="text" id="setting-location" placeholder="France" value="${user.location || ''}" maxlength="40">
            </div>

            <div id="settings-error" style="display:none;"></div>
          </div>

        </div>
        <div class="modal-footer">
          <button class="btn btn-primary btn-large" id="save-settings">Enregistrer</button>
        </div>
      </div>
    `);

    // Render current avatar
    async function renderPreview() {
      const u = window.Auth.getCurrentUser();
      const preview = document.getElementById('avatar-preview');
      const label = document.getElementById('avatar-label');
      if (u.avatarType === 'pokemon' && u.avatarValue) {
        const url = await getPokemonAvatarUrl(u.avatarValue);
        if (url) {
          preview.innerHTML = `<img src="${url}" alt="" style="width:100%; height:100%; object-fit:cover;">`;
          const av = POKEMON_AVATARS.find(p => p.id === u.avatarValue);
          if (label) label.textContent = av?.name || 'Pokémon';
          return;
        }
      }
      preview.textContent = u.avatar || (u.name || '?').charAt(0).toUpperCase();
      if (label) label.textContent = 'Avatar par défaut (initiale)';
    }
    renderPreview();

    // Render Pokemon grid
    const grid = document.getElementById('avatar-grid');
    const current = window.Auth.getCurrentUser();
    grid.innerHTML = POKEMON_AVATARS.map(p => {
      const url = getPokemonAvatarUrl(p.id);
      const isSelected = current?.avatarType === 'pokemon' && current?.avatarValue === p.id;
      return `
      <button class="avatar-option" data-avatar="${p.id}" title="${p.name}" style="
        position: relative;
        width: 100%; aspect-ratio: 1; border-radius: 50%; cursor: pointer;
        background: linear-gradient(135deg, #f0f1f5, #d4d6e5);
        border: 3px solid ${isSelected ? 'var(--red)' : 'transparent'};
        overflow: hidden; transition: all 0.2s; padding: 0;
        display: flex; align-items: center; justify-content: center;
      ">
        <img src="${url}" alt="${p.name}" loading="lazy" style="width: 90%; height: 90%; object-fit: contain; transition: transform 0.2s;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display:none; font-size: 9px; font-weight: 700; color: var(--gray-text); padding: 4px; text-align: center;">${p.name}</div>
      </button>
    `;
    }).join('');

    // Add hover scaling
    grid.querySelectorAll('.avatar-option img').forEach(img => {
      img.parentElement.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.1)'; });
      img.parentElement.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)'; });
    });

    let selectedAvatar = current.avatarType === 'pokemon' ? current.avatarValue : null;
    grid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.avatar-option');
      if (!btn) return;
      const id = btn.dataset.avatar;
      selectedAvatar = id;
      // Update borders
      grid.querySelectorAll('.avatar-option').forEach(b => {
        b.style.border = b.dataset.avatar === id ? '3px solid var(--red)' : '3px solid transparent';
      });
      // Update preview
      const url = await getPokemonAvatarUrl(id);
      const preview = document.getElementById('avatar-preview');
      const label = document.getElementById('avatar-label');
      if (url) {
        preview.innerHTML = `<img src="${url}" alt="" style="width:100%; height:100%; object-fit:cover;">`;
        const av = POKEMON_AVATARS.find(p => p.id === id);
        if (label) label.textContent = av?.name || 'Pokémon';
      }
    });

    document.getElementById('reset-avatar')?.addEventListener('click', () => {
      selectedAvatar = null;
      grid.querySelectorAll('.avatar-option').forEach(b => { b.style.border = '3px solid transparent'; });
      const u = window.Auth.getCurrentUser();
      const preview = document.getElementById('avatar-preview');
      const label = document.getElementById('avatar-label');
      preview.textContent = (u.name || '?').charAt(0).toUpperCase();
      if (label) label.textContent = 'Avatar par défaut (initiale)';
    });

    document.getElementById('save-settings')?.addEventListener('click', async () => {
      const saveBtn = document.getElementById('save-settings');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Enregistrement…';

      const newName = document.getElementById('setting-name')?.value?.trim() || '';
      const newUsername = (document.getElementById('setting-username')?.value || '').toLowerCase().trim();
      const newLocation = document.getElementById('setting-location')?.value?.trim() || '';

      // Validation
      const errors = [];
      if (newName.length < 2) errors.push('Le nom doit faire au moins 2 caractères');
      if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
        errors.push('Username invalide : 3-20 caractères, lettres minuscules, chiffres et underscore uniquement');
      }
      if (errors.length > 0) {
        showFormError('settings-error', errors);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Enregistrer';
        return;
      }

      // Check username availability if changed
      if (newUsername !== user.username) {
        const sb = window.SupabaseClient?.client;
        const { data: existing } = await sb
          .from('profiles')
          .select('id')
          .eq('username', newUsername)
          .neq('id', user.id)
          .maybeSingle();
        if (existing) {
          showFormError('settings-error', ['Ce nom d\'utilisateur est déjà pris']);
          saveBtn.disabled = false;
          saveBtn.textContent = 'Enregistrer';
          return;
        }
      }

      // Build update payload
      const updates = {
        name: newName,
        location: newLocation,
      };
      // Username update via direct Supabase call (not in updateProfile signature)
      if (newUsername !== user.username) {
        const sb = window.SupabaseClient?.client;
        const { error } = await sb.from('profiles').update({ username: newUsername }).eq('id', user.id);
        if (error) {
          console.error(error);
          showFormError('settings-error', ['Erreur lors de la mise à jour du nom d\'utilisateur']);
          saveBtn.disabled = false;
          saveBtn.textContent = 'Enregistrer';
          return;
        }
      }

      if (selectedAvatar) {
        const url = getPokemonAvatarUrl(selectedAvatar);
        updates.avatarType = 'pokemon';
        updates.avatarValue = selectedAvatar;
        updates.avatarUrl = url;
      } else {
        updates.avatarType = 'default';
        updates.avatarValue = null;
        updates.avatarUrl = null;
      }

      await window.Auth.updateProfile(updates);
      toast('Paramètres enregistrés !', 'success');
      closeModal();
      setTimeout(() => location.reload(), 600);
    });
  }

  // ============================================
  // SETTINGS MODAL END
  // ============================================

  // ============================================
  // MOBILE MENU (burger + drawer)
  // ============================================
  function installMobileMenu() {
    const navInner = document.querySelector('.nav-inner');
    if (!navInner) return;
    if (document.querySelector('.mobile-menu-toggle')) return;

    // Add burger button (before .nav-cta)
    const burger = document.createElement('button');
    burger.className = 'mobile-menu-toggle';
    burger.setAttribute('aria-label', 'Menu');
    burger.innerHTML = '<span></span><span></span><span></span>';
    const navCta = navInner.querySelector('.nav-cta');
    if (navCta) navInner.insertBefore(burger, navCta); else navInner.appendChild(burger);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-drawer-overlay';
    document.body.appendChild(overlay);

    // Create drawer
    const drawer = document.createElement('div');
    drawer.className = 'mobile-drawer';

    const navLinks = document.querySelector('.nav-links');
    const linksHTML = navLinks ? navLinks.innerHTML : '';

    const user = window.Auth?.getCurrentUser();
    const userSection = user
      ? `
        <div class="mobile-drawer-section">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div style="width:42px; height:42px; border-radius:50%; background:var(--yellow); border:2px solid #1a1a2e; display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:800; font-size:18px; color:#1a1a2e;">${user.avatar}</div>
            <div>
              <div style="font-weight:700; font-size:14px;">${user.name}</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--gray-text);">@${user.username}</div>
            </div>
          </div>
          <button class="btn btn-ghost" id="mobile-logout">Déconnexion</button>
        </div>
      `
      : `
        <div class="mobile-drawer-section">
          <button class="btn btn-primary" id="mobile-signup">S'inscrire</button>
          <button class="btn btn-ghost" id="mobile-login">Connexion</button>
        </div>
      `;

    drawer.innerHTML = `
      <div class="mobile-drawer-search">
        <span style="color: var(--gray-text);">⌕</span>
        <input type="text" placeholder="Rechercher une carte…" id="mobile-search-input">
      </div>
      <ul>${linksHTML}</ul>
      ${userSection}
    `;
    document.body.appendChild(drawer);

    function open() {
      drawer.classList.add('open');
      overlay.classList.add('open');
      burger.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    }

    burger.addEventListener('click', () => {
      drawer.classList.contains('open') ? close() : open();
    });
    overlay.addEventListener('click', close);
    // Close on link click
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

    // Mobile auth buttons
    document.getElementById('mobile-login')?.addEventListener('click', () => { close(); openLogin(); });
    document.getElementById('mobile-signup')?.addEventListener('click', () => { close(); openSignup(); });
    document.getElementById('mobile-logout')?.addEventListener('click', async () => {
      close();
      const ok = await confirm({ title: 'Déconnexion ?', message: 'Vous serez déconnecté.', confirmText: 'Me déconnecter' });
      if (ok) {
        window.Auth.logout();
        window.location.href = 'index.html';
      }
    });

    // Mobile search (same logic as desktop)
    const mInput = document.getElementById('mobile-search-input');
    let mTimeout;
    mInput?.addEventListener('input', (e) => {
      clearTimeout(mTimeout);
      const q = e.target.value;
      mTimeout = setTimeout(async () => {
        if (!q || q.length < 2) return;
        try {
          const cards = await window.TCGdex.searchCards(q);
          // Show results in drawer (simple version)
          let resultsDiv = drawer.querySelector('.mobile-search-results');
          if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.className = 'mobile-search-results';
            drawer.querySelector('.mobile-drawer-search').after(resultsDiv);
          }
          const top = cards.slice(0, 5);
          if (top.length === 0) {
            resultsDiv.innerHTML = '<div style="padding:12px; text-align:center; color:var(--gray-text); font-size:13px;">Aucun résultat</div>';
            return;
          }
          resultsDiv.innerHTML = '<div style="margin-bottom:20px;">' + top.map(c => `
            <a href="carte.html?id=${c.id}" style="display:flex; align-items:center; gap:10px; padding:8px; border-radius: 8px; font-size:13px; color:inherit;">
              <div style="width:30px; height:42px; background:var(--gray-bg); border-radius:4px; flex-shrink:0; overflow:hidden;">
                <img src="${window.TCGdex.getCardImage(c, 'low', 'webp')}" alt="" style="width:100%; height:100%; object-fit:contain;">
              </div>
              <div style="font-weight:600;">${c.name}</div>
            </a>
          `).join('') + '</div>';
        } catch (e) { console.error(e); }
      }, 300);
    });
  }

  // ============================================
  // NAVBAR SEARCH
  // ============================================
  function installNavbarSearch() {
    const searchInput = document.querySelector('.nav-search input');
    if (!searchInput) return;

    let searchTimeout;
    let resultsBox;

    function ensureResultsBox() {
      if (resultsBox) return resultsBox;
      resultsBox = document.createElement('div');
      resultsBox.className = 'nav-search-results';
      resultsBox.style.cssText = `
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--white);
        border: 1px solid var(--gray-line);
        border-radius: var(--radius);
        box-shadow: var(--shadow-xl);
        max-height: 400px;
        overflow-y: auto;
        z-index: 200;
        display: none;
      `;
      searchInput.parentElement.style.position = 'relative';
      searchInput.parentElement.appendChild(resultsBox);
      return resultsBox;
    }

    async function doSearch(query) {
      const box = ensureResultsBox();
      if (!query || query.length < 2) {
        box.style.display = 'none';
        return;
      }
      box.style.display = 'block';
      box.innerHTML = '<div style="padding:16px; text-align:center; font-size:13px; color:var(--gray-text);">Recherche…</div>';

      // Search users via Supabase (real users from database)
      let userMatches = [];
      try {
        if (window.Auth?.searchUsers) {
          userMatches = await window.Auth.searchUsers(query);
          userMatches = userMatches.slice(0, 3);
        }
      } catch (e) { console.warn(e); }

      // Search cards via TCGdex API
      let cardMatches = [];
      try {
        const cards = await window.TCGdex.searchCards(query);
        cardMatches = cards.slice(0, 5);
      } catch (e) {}

      if (userMatches.length === 0 && cardMatches.length === 0) {
        box.innerHTML = '<div style="padding:16px; text-align:center; font-size:13px; color:var(--gray-text);">Aucun résultat</div>';
        return;
      }

      let html = '';

      if (userMatches.length > 0) {
        html += '<div style="padding:8px 14px 4px; font-size:10px; font-weight:700; color:var(--gray-text); text-transform:uppercase; letter-spacing:0.1em; background:var(--gray-bg);">Utilisateurs</div>';
        html += userMatches.map(u => {
          // Supabase returns snake_case: avatar_type, avatar_value, avatar_url
          const avatarHtml = u.avatar_type === 'pokemon' && u.avatar_url
            ? `<img src="${u.avatar_url}" alt="" style="width:100%; height:100%; object-fit:cover;">`
            : (u.name || '?').charAt(0).toUpperCase();
          return `
            <a href="profil.html?user=${u.username}" style="display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom: 1px solid var(--gray-line); color:inherit; font-size:13px;">
              <div style="width:36px; height:36px; background:var(--yellow); border-radius:50%; border:2px solid #1a1a2e; display:flex; align-items:center; justify-content:center; font-weight:800; color:#1a1a2e; overflow:hidden;">${avatarHtml}</div>
              <div style="flex:1; min-width:0;">
                <div style="font-weight:700;">${u.name}</div>
                <div style="font-size:11px; color:var(--gray-text);">@${u.username}</div>
              </div>
            </a>
          `;
        }).join('');
      }

      if (cardMatches.length > 0) {
        html += '<div style="padding:8px 14px 4px; font-size:10px; font-weight:700; color:var(--gray-text); text-transform:uppercase; letter-spacing:0.1em; background:var(--gray-bg);">Cartes</div>';
        html += cardMatches.map(c => `
          <a href="carte.html?id=${c.id}" style="display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom: 1px solid var(--gray-line); color:inherit; font-size:13px;">
            <div style="width:32px; height:44px; background:var(--gray-bg); border-radius:4px; flex-shrink:0; overflow:hidden;">
              <img src="${window.TCGdex.getCardImage(c, 'low', 'webp')}" alt="" style="width:100%; height:100%; object-fit:contain;">
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name}</div>
              <div style="font-size:10px; color:var(--gray-text); text-transform:uppercase; letter-spacing:0.08em; font-weight:600;">${c.id}</div>
            </div>
          </a>
        `).join('');
      }

      box.innerHTML = html;
    }

    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const q = e.target.value;
      searchTimeout = setTimeout(() => doSearch(q), 300);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-search')) {
        if (resultsBox) resultsBox.style.display = 'none';
      }
    });
  }

  // ============================================
  // INSTALL NAVBAR (user dropdown OR login/signup buttons)
  // ============================================

  function installNavbar() {
    const navCta = document.querySelector('.nav-cta');
    if (!navCta) return;

    // Clear existing login/signup buttons (keep theme toggle)
    const existing = navCta.querySelectorAll('.btn-ghost.btn-small, .btn-primary.btn-small, .nav-user');
    existing.forEach(el => el.remove());

    const user = window.Auth.getCurrentUser();

    if (user) {
      // Logged in : show user dropdown
      const wrap = document.createElement('div');
      wrap.className = 'nav-user';
      const avatarHtml = user.avatarType === 'pokemon' && user.avatarUrl
        ? `<img src="${user.avatarUrl}" alt="" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
        : (user.avatar || (user.name || '?').charAt(0).toUpperCase());
      wrap.innerHTML = `
        <div class="nav-user-avatar">${avatarHtml}</div>
        <div class="nav-user-name">${user.name.split(' ')[0]}</div>
        <span class="nav-user-chevron">▼</span>
        <div class="user-dropdown">
          <a href="profil.html">👤 Ma collection</a>
          <a href="profil.html#favorites">♥ Favoris</a>
          <a href="trade.html">⇌ Mes échanges</a>
          <a href="marche.html">🛒 Marché</a>
          <div class="divider"></div>
          <button id="open-settings-btn">⚙ Paramètres</button>
          <button id="logout-btn" class="danger">⎋ Déconnexion</button>
        </div>
      `;
      navCta.appendChild(wrap);

      // Settings button
      wrap.querySelector('#open-settings-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.remove('open');
        openSettings();
      });

      const dropdown = wrap.querySelector('.user-dropdown');
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('.user-dropdown')) return;
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) dropdown.classList.remove('open');
      });

      wrap.querySelector('#logout-btn').addEventListener('click', async () => {
        const ok = await confirm({
          title: 'Déconnexion ?',
          message: 'Vous serez déconnecté. Vos données restent sauvegardées.',
          confirmText: 'Me déconnecter',
        });
        if (ok) {
          window.Auth.logout();
          toast('Vous êtes déconnecté.', 'info');
          setTimeout(() => window.location.href = 'index.html', 500);
        }
      });
    } else {
      // Not logged in
      const ghost = document.createElement('button');
      ghost.className = 'btn btn-ghost btn-small';
      ghost.textContent = 'Connexion';
      ghost.addEventListener('click', openLogin);

      const primary = document.createElement('button');
      primary.className = 'btn btn-primary btn-small';
      primary.textContent = "S'inscrire";
      primary.addEventListener('click', openSignup);

      navCta.appendChild(ghost);
      navCta.appendChild(primary);
    }
  }

  // ============================================
  // GLOBAL CLICK INTERCEPTOR
  // For "Connexion" / "S'inscrire" buttons embedded in pages
  // ============================================

  document.addEventListener('click', (e) => {
    // Catch CTAs that aren't part of nav
    const btn = e.target.closest('button');
    if (!btn) return;
    const txt = btn.textContent.trim().toLowerCase();

    // Buttons that should trigger signup
    if (btn.matches('.btn-primary.btn-large') && (txt.includes("s'inscrire") || txt.includes("rejoindre") || txt === "s'inscrire gratuitement")) {
      if (!window.Auth.isLoggedIn()) { e.preventDefault(); openSignup(); }
    }
  });

  // ============================================
  // EXPORT
  // ============================================

  window.UI = {
    openModal, closeModal,
    openLogin, openSignup,
    openSettings,
    confirm, toast,
    installNavbar,
    POKEMON_AVATARS,
    getPokemonAvatarUrl,
  };

  // Auto-install when DOM ready
  async function init() {
    // Init Supabase Auth FIRST (loads session if exists)
    if (window.Auth?.init) {
      await window.Auth.init();
    }
    // Install UI components
    installNavbar();
    installNavbarSearch();
    installMobileMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
