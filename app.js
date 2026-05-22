// ============================================
// APP.JS — Interactions partagées + Dark mode
// ============================================

(() => {
  // ============================================
  // DARK MODE — sombre premium par défaut
  // ============================================
  const THEME_KEY = 'aditcg_theme';

  function getInitialTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  applyTheme(getInitialTheme());

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function injectThemeToggle() {
    const navCta = document.querySelector('.nav-cta');
    if (!navCta) return;
    if (document.querySelector('.theme-toggle')) return;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Changer de thème');
    btn.title = 'Basculer mode sombre/clair';
    btn.innerHTML = `
      <span class="icon-sun">☀</span>
      <span class="icon-moon">☾</span>
    `;
    btn.addEventListener('click', toggleTheme);
    navCta.prepend(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectThemeToggle);
  } else {
    injectThemeToggle();
  }

  // ============================================
  // Recherche nav
  // ============================================
  document.addEventListener('keypress', (e) => {
    const input = e.target.closest?.('.nav-search input');
    if (input && e.key === 'Enter' && input.value.trim()) {
      window.location.href = `marche.html?q=${encodeURIComponent(input.value)}`;
    }
  });

  // ============================================
  // Toggle favoris (générique)
  // ============================================
  document.addEventListener('click', (e) => {
    if (e.target.closest('.fav-btn')) {
      e.target.closest('.fav-btn').classList.toggle('active');
    }
  });

  // ============================================
  // Card tilt effect (grande image carte)
  // ============================================
  function attachTilt(el) {
    if (el.dataset.tilt) return;
    el.dataset.tilt = '1';
    el.addEventListener('mousemove', (ev) => {
      const rect = el.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / rect.width - 0.5;
      const y = (ev.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  }
  document.querySelectorAll('.big-card-img').forEach(attachTilt);

})();
