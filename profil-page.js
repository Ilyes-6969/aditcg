// PROFIL-PAGE.JS — Logique de la page profil
(async () => {

  // 1. UPDATE HEADER from current user
  const user = window.Auth.getCurrentUser();
  if (user) {
    const avatarEl = document.querySelector('.profil-avatar');
    const headerH1 = document.querySelector('.profil-info h1');
    const usernameEl = document.querySelector('.profil-info .username');
    const metaEl = document.querySelector('.profil-meta');
    const dateStr = new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });

    if (avatarEl) {
      if (user.avatarImage) {
        const isCard = user.avatarImage.startsWith('http');
        const pos = isCard ? 'center 28%' : 'center';
        avatarEl.innerHTML = '<img src="' + user.avatarImage + '" alt="" style="width:100%;height:100%;object-fit:cover;object-position:' + pos + ';border-radius:50%;">';
        avatarEl.style.padding = '0';
        avatarEl.style.overflow = 'hidden';
      } else {
        avatarEl.textContent = user.avatar;
      }
    }
    if (headerH1) {
      const parts = user.name.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || 'Dresseur';
      headerH1.innerHTML = firstName + ' <span class="accent">' + lastName + '</span>';
    }
    if (usernameEl) usernameEl.textContent = '@' + user.username + ' \u00b7 Membre depuis ' + dateStr;
    if (metaEl) {
      metaEl.innerHTML =
        '<span>\u2b50 ' + user.stats.rating + '/5 (' + user.stats.reviews + ' avis)</span>' +
        '<span class="dot"></span>' +
        '<span>\ud83d\udce6 ' + user.stats.sales + ' ventes</span>' +
        '<span class="dot"></span>' +
        '<span>\ud83e\udd1d ' + user.stats.trades + ' \u00e9changes</span>' +
        '<span class="dot"></span>' +
        '<span>\ud83d\udccd ' + user.location + '</span>';
    }
  }

  // 2. TABS
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
    });
  });

  // open tab based on URL hash
  if (window.location.hash === '#favorites' || window.location.hash === '#wishlist') {
    document.querySelector('[data-tab="wishlist"]')?.click();
  } else if (window.location.hash === '#portfolio') {
    document.querySelector('[data-tab="portfolio"]')?.click();
  } else if (window.location.hash === '#activity') {
    document.querySelector('[data-tab="activity"]')?.click();
  }

  // 3. LOAD COLLECTION
  const collectionIds = window.Storage.getCollection();
  const favoriteIds = window.Storage.getFavorites();

  let allCards = [];
  try {
    allCards = (await Promise.all(collectionIds.map(id =>
      window.TCGdex.getCardDetail(id).catch(() => null)
    ))).filter(Boolean);
  } catch (e) { console.error(e); }

  // 4. STATS
  const totalValue = allCards.reduce((s, c) => s + window.TCGdex.estimatePrice(c), 0);
  document.getElementById('stat-cards').textContent = allCards.length;
  document.getElementById('stat-value').textContent = window.TCGdex.formatPrice(totalValue);
  document.getElementById('tab-count-coll').textContent = allCards.length;
  document.getElementById('tab-count-fav').textContent = favoriteIds.length;
  document.getElementById('stat-fav').textContent = favoriteIds.length;

  // unique sets
  const uniqueSets = new Set();
  allCards.forEach(c => { if (c.set?.id) uniqueSets.add(c.set.id); });
  document.getElementById('stat-sets').textContent = uniqueSets.size;

  // Record portfolio value for today
  window.Storage.recordPortfolioValue(totalValue);

  // Compute performance vs 30 days ago
  const history = window.Storage.getPortfolioHistory();
  const perfEl = document.getElementById('stat-perf');
  if (history.length >= 2) {
    const old = history[Math.max(0, history.length - 30)].value;
    const cur = history[history.length - 1].value;
    if (old > 0) {
      const pct = ((cur - old) / old) * 100;
      perfEl.textContent = (pct >= 0 ? '\u2191 +' : '\u2193 ') + pct.toFixed(1) + '%';
      perfEl.className = 'v ' + (pct >= 0 ? 'green' : 'red');
    } else {
      perfEl.textContent = '—';
    }
  } else {
    perfEl.textContent = '—';
  }

  // 5. COLLECTION GRID
  function renderCard(c) {
    const img = window.TCGdex.getCardImage(c, 'low', 'webp');
    const priceData = window.TCGdex.getRealPrice(c);
    const trend = window.TCGdex.estimateTrend(c);
    const isFav = window.Storage.isFavorite(c.id);
    return '<div class="pkmn-card">' +
      '<button class="fav-toggle ' + (isFav ? 'active' : '') + '" data-fav-id="' + c.id + '" aria-label="Favori"></button>' +
      '<a href="carte.html?id=' + c.id + '" style="display:block;color:inherit;">' +
      '<div class="pkmn-card-img">' +
      '<img src="' + img + '" alt="' + c.name + '" loading="lazy" onerror="this.parentNode.innerHTML=\'<div class=&quot;skel&quot;></div>\'">' +
      '</div>' +
      '<div class="pkmn-card-info">' +
      '<div class="pkmn-card-name">' + c.name + '</div>' +
      '<div class="pkmn-card-set">' + (c.set?.name || '').substring(0, 22) + '</div>' +
      '<div class="pkmn-card-foot">' +
      '<div class="pkmn-card-price">' + window.TCGdex.formatPrice(priceData.price) + '</div>' +
      '<div class="pkmn-card-trend ' + (trend >= 0 ? '' : 'down') + '">' + (trend >= 0 ? '\u2191' : '\u2193') + Math.abs(trend) + '%</div>' +
      '</div></div></a></div>';
  }

  const collGrid = document.getElementById('collection-grid');
  if (allCards.length === 0) {
    collGrid.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1;">' +
      '<div class="emoji">\ud83c\udccf</div>' +
      '<h3>Votre collection est vide</h3>' +
      '<p>Commencez \u00e0 collectionner ! Parcourez les s\u00e9ries et marquez les cartes que vous poss\u00e9dez.</p>' +
      '<a href="series.html" class="btn btn-primary" style="margin-top:16px;">Parcourir les s\u00e9ries</a>' +
      '</div>';
  } else {
    collGrid.innerHTML = allCards.map(renderCard).join('');
  }

  // 6. FAVORITES TAB
  const favTabContent = document.getElementById('tab-wishlist');
  if (favoriteIds.length === 0) {
    favTabContent.innerHTML =
      '<div class="empty-state">' +
      '<div class="emoji">\u2661</div>' +
      '<h3>Aucun favori pour le moment</h3>' +
      '<p>Cliquez sur l\'ic\u00f4ne c\u0153ur d\'une carte pour l\'ajouter ici.</p>' +
      '<a href="marche.html" class="btn btn-primary" style="margin-top:16px;">Explorer le march\u00e9</a>' +
      '</div>';
  } else {
    const favCards = (await Promise.all(favoriteIds.map(id =>
      window.TCGdex.getCardDetail(id).catch(() => null)
    ))).filter(Boolean);
    favTabContent.innerHTML = '<div class="pokemon-grid">' +
      favCards.map(renderCard).join('') +
      '</div>';
  }

  // 7. FAVORITE TOGGLE LISTENER (delegated)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.fav-toggle');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.dataset.favId;
    const nowFav = window.Storage.toggleFavorite(id);
    document.querySelectorAll('[data-fav-id="' + id + '"]').forEach(b => b.classList.toggle('active', nowFav));
    window.UI.toast(nowFav ? 'Ajout\u00e9 aux favoris \u2665' : 'Retir\u00e9 des favoris', nowFav ? 'success' : 'info');

    // Update fav count
    const newFav = window.Storage.getFavorites();
    document.getElementById('tab-count-fav').textContent = newFav.length;
    document.getElementById('stat-fav').textContent = newFav.length;
  });

  // 8. PORTFOLIO CHART
  if (history.length > 1) {
    const min = Math.min(...history.map(h => h.value));
    const max = Math.max(...history.map(h => h.value));
    const range = max - min || 1;
    const points = history.map((h, i) => {
      const x = (i / (history.length - 1)) * 600;
      const y = 180 - ((h.value - min) / range) * 160;
      return x + ',' + y;
    });
    const svg = document.querySelector('#tab-portfolio .chart-svg');
    if (svg) {
      svg.innerHTML =
        '<defs><linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">' +
        '<stop offset="0%" stop-color="#dc0a2d" stop-opacity="0.3"/>' +
        '<stop offset="100%" stop-color="#dc0a2d" stop-opacity="0"/>' +
        '</linearGradient></defs>' +
        '<path d="M0,180 L' + points.join(' L') + ' L600,180 Z" fill="url(#chartGrad)"/>' +
        '<path d="M' + points.join(' L') + '" fill="none" stroke="#dc0a2d" stroke-width="3"/>';
    }
  }

  // 9. TOP HOLDINGS
  const sorted = [...allCards].sort((a, b) =>
    window.TCGdex.estimatePrice(b) - window.TCGdex.estimatePrice(a)
  ).slice(0, 5);
  document.getElementById('top-holdings').innerHTML = sorted.length === 0
    ? '<div style="text-align:center;padding:20px;color:var(--gray-text);font-size:13px;">Aucune carte dans votre collection.</div>'
    : sorted.map((c, i) => {
      const img = window.TCGdex.getCardImage(c, 'low', 'webp');
      const priceData = window.TCGdex.getRealPrice(c);
      return '<div class="holding-row">' +
        '<div class="holding-rank">#' + (i + 1) + '</div>' +
        '<a href="carte.html?id=' + c.id + '" class="holding-thumb"><img src="' + img + '" alt=""></a>' +
        '<div class="holding-info">' +
        '<div class="holding-name">' + c.name + '</div>' +
        '<div class="holding-set">' + (c.set?.name || '').substring(0, 22) + '</div>' +
        '</div>' +
        '<div class="holding-price">' + window.TCGdex.formatPrice(priceData.price) + '</div>' +
        '</div>';
    }).join('');

  // 10. ACTIVITY TAB
  const activity = window.Storage.getActivity();
  const activityTab = document.getElementById('tab-activity');
  if (activity.length === 0) {
    activityTab.innerHTML =
      '<div class="empty-state">' +
      '<div class="emoji">\ud83d\udcca</div>' +
      '<h3>Aucune activit\u00e9 encore</h3>' +
      '<p>Vos achats, ventes et \u00e9changes appara\u00eetront ici.</p>' +
      '</div>';
  } else {
    const timeAgo = (ts) => {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "\u00e0 l'instant";
      if (mins < 60) return 'il y a ' + mins + ' min';
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return 'il y a ' + hrs + 'h';
      const days = Math.floor(hrs / 24);
      return 'il y a ' + days + 'j';
    };
    const icons = { collection: '\ud83c\udccf', trade: '\u21cc', listing: '\ud83c\udff7', system: '\u2b50' };
    activityTab.innerHTML = '<div class="activity-list">' +
      activity.slice(0, 30).map(a =>
        '<div class="activity-item">' +
        '<div class="activity-icon">' + (icons[a.type] || '\u2022') + '</div>' +
        '<div class="activity-content">' +
        '<div class="activity-msg">' + a.message + '</div>' +
        '<div class="activity-time">' + timeAgo(a.createdAt) + '</div>' +
        '</div></div>'
      ).join('') +
      '</div>';
  }

  // 11. BUTTONS
  document.getElementById('btn-add-card')?.addEventListener('click', () => {
    window.location.href = 'series.html';
  });

  document.getElementById('btn-settings')?.addEventListener('click', openSettingsModal);

  // ============================================
  // 12. SETTINGS MODAL — Avatar, pseudo (1×/14j)
  // ============================================

  // Liste curée d'IDs de cartes pour le picker d'avatar
  // (cartes iconiques, accessibles via TCGdex - les mêmes images que partout sur le site)
  const AVATAR_CARD_IDS = [
    'base1-4', 'base1-2', 'base1-15', 'base1-58',
    'neo1-9', 'xy12-12', 'swsh4-44', 'swsh7-150',
    'base1-1', 'base1-3', 'base1-10', 'base1-25',
  ];

  function getAvatarHtml(u, size = 88) {
    if (u.avatarImage) {
      // Card art : crop sur la zone illustration (haut de la carte)
      // Photo upload : object-position center par défaut
      const isCard = u.avatarImage.startsWith('http');
      const pos = isCard ? 'center 28%' : 'center';
      return '<img src="' + u.avatarImage + '" alt="" style="width:100%;height:100%;object-fit:cover;object-position:' + pos + ';border-radius:50%;">';
    }
    return u.avatar || (u.name || '?').charAt(0).toUpperCase();
  }

  // Met à jour TOUS les rendus d'avatar de la page courante après changement
  function refreshAvatarEverywhere() {
    const u = window.Auth.getCurrentUser();
    if (!u) return;
    // Profil header
    const headerAv = document.querySelector('.profil-avatar');
    if (headerAv) {
      headerAv.innerHTML = u.avatarImage ? getAvatarHtml(u) : '';
      if (!u.avatarImage) headerAv.textContent = u.avatar;
      headerAv.style.padding = u.avatarImage ? '0' : '';
      headerAv.style.overflow = u.avatarImage ? 'hidden' : '';
    }
    // Navbar
    const navAv = document.querySelector('.nav-user-avatar');
    if (navAv) {
      navAv.innerHTML = u.avatarImage ? getAvatarHtml(u) : '';
      if (!u.avatarImage) navAv.textContent = u.avatar;
      navAv.style.padding = u.avatarImage ? '0' : '';
      navAv.style.overflow = u.avatarImage ? 'hidden' : '';
    }
  }

  function openSettingsModal() {
    const u = window.Auth.getCurrentUser();
    if (!u) { window.UI.openLogin(); return; }
    const cd = window.Auth.getUsernameCooldown();
    const canChange = cd.canChange;
    const lastDate = cd.lastChange ? new Date(cd.lastChange).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : null;

    // Récupère les images des cartes du picker (en parallèle, résilient)
    const _previewIsCard = (u.avatarImage || '').startsWith('http');
    const _previewPos = _previewIsCard ? 'center 28%' : 'center';
    const avatarPreviewHtml = u.avatarImage
      ? '<img src="' + u.avatarImage + '" alt="" style="width:100%;height:100%;object-fit:cover;object-position:' + _previewPos + ';">'
      : '<span style="font-family:var(--font-display);font-size:42px;font-weight:800;color:#1a1a2e;">' + (u.avatar || '?') + '</span>';

    window.UI.openModal(
      '<div class="modal" style="max-width:560px;">' +
        '<div class="modal-close">\u00d7</div>' +
        '<div class="modal-header">' +
          '<div class="pokeball-mini"></div>' +
          '<h2>Param\u00e8tres du <span class="accent">compte</span></h2>' +
          '<p>G\u00e9rez votre avatar et votre pseudo public.</p>' +
        '</div>' +
        '<div class="modal-body">' +

          // ============ AVATAR ============
          '<div style="margin-bottom:24px;">' +
            '<label style="display:block;font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:var(--gray-text);margin-bottom:12px;font-weight:600;">Photo de profil</label>' +
            '<div style="display:flex;gap:16px;align-items:center;margin-bottom:14px;">' +
              '<div id="avatar-preview" style="width:84px;height:84px;border-radius:50%;background:var(--yellow);border:3px solid var(--ink);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">' +
                avatarPreviewHtml +
              '</div>' +
              '<div style="flex:1;">' +
                '<div style="font-weight:700;font-size:14px;margin-bottom:4px;">Choisissez votre avatar</div>' +
                '<div style="font-size:12px;color:var(--gray-text);">Une carte ic\u00f4nique ou votre propre photo (max 2&nbsp;Mo).</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;margin-bottom:12px;">' +
              '<button class="filter-chip active" data-av-tab="cards" type="button">Cartes Pok\u00e9mon</button>' +
              '<button class="filter-chip" data-av-tab="upload" type="button">Charger une photo</button>' +
              (u.avatarImage ? '<button class="filter-chip" data-av-tab="reset" type="button" style="margin-left:auto;color:var(--red);">R\u00e9initialiser</button>' : '') +
            '</div>' +
            '<div id="av-tab-cards" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:12px;background:var(--gray-bg);border-radius:var(--radius);max-height:220px;overflow-y:auto;">' +
              '<div style="grid-column:1/-1;text-align:center;font-size:12px;color:var(--gray-text);padding:10px;">Chargement des cartes\u2026</div>' +
            '</div>' +
            '<div id="av-tab-upload" style="display:none;padding:16px;background:var(--gray-bg);border-radius:var(--radius);text-align:center;">' +
              '<input type="file" id="avatar-file-input" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none;">' +
              '<button class="btn btn-primary" id="avatar-pick-file" type="button">\ud83d\udcc1 Choisir une image</button>' +
              '<div style="font-size:11px;color:var(--gray-text);margin-top:10px;">PNG, JPG, WEBP ou GIF \u00b7 2&nbsp;Mo max \u00b7 sera recadr\u00e9e en rond</div>' +
            '</div>' +
          '</div>' +

          // ============ PSEUDO ============
          '<div id="settings-error" style="display:none;"></div>' +
          '<div class="form-field">' +
            '<label>Nom d\'utilisateur (pseudo)</label>' +
            '<input type="text" id="new-username" value="' + u.username + '" ' + (canChange ? '' : 'disabled') + ' autocomplete="off" maxlength="24">' +
            '<div class="hint">' + (canChange
              ? 'Lettres min., chiffres, underscore. 3-24 caract\u00e8res.<br><strong style="color:var(--blue);">\u26a0 Vous ne pourrez changer \u00e0 nouveau qu\'apr\u00e8s 14 jours.</strong>'
              : '<strong style="color:var(--orange);">Verrouill\u00e9</strong> \u00b7 prochain changement possible dans <strong>' + cd.remainingDays + ' jour' + (cd.remainingDays > 1 ? 's' : '') + '</strong>.' + (lastDate ? '<br>Dernier changement : ' + lastDate : '')) +
            '</div>' +
          '</div>' +
          '<div style="padding:14px;background:var(--gray-bg);border-radius:var(--radius);font-size:12px;color:var(--gray-text);line-height:1.5;margin-top:8px;">' +
            '<strong style="color:var(--ink);">Pourquoi cette limite&nbsp;?</strong> Pour pr\u00e9server la r\u00e9putation des dresseurs et \u00e9viter les arnaques d\'identit\u00e9 sur les \u00e9changes, le pseudo n\'est modifiable qu\'une fois tous les <strong style="color:var(--ink);">14 jours</strong>.' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-primary btn-large" id="settings-save" type="button">Enregistrer</button>' +
        '</div>' +
      '</div>'
    );

    // ============ AVATAR PICKER : load card images ============
    let pendingAvatar = u.avatarImage || null;
    const cardsTabEl = document.getElementById('av-tab-cards');
    const uploadTabEl = document.getElementById('av-tab-upload');
    const previewEl = document.getElementById('avatar-preview');

    (async () => {
      const cards = await Promise.all(
        AVATAR_CARD_IDS.map(id => window.TCGdex.getCardDetail(id).catch(() => null))
      );
      const valid = cards.filter(c => c && c.image);
      if (valid.length === 0) {
        cardsTabEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;font-size:12px;color:var(--gray-text);padding:10px;">Aucune carte disponible. Utilisez \xab Charger une photo \xbb.</div>';
        return;
      }
      cardsTabEl.innerHTML = valid.map(c => {
        const img = window.TCGdex.getCardImage(c, 'low', 'webp');
        const selected = pendingAvatar === img ? 'border-color:var(--blue);box-shadow:0 0 0 3px var(--accent-soft, rgba(91,141,239,.2));' : '';
        // Crop agressif : on zoome sur la zone illustration de la carte (haut, ~25-55%)
        // pour faire ressortir le Pokémon. Image en cover sur conteneur rond.
        return '<button type="button" data-av-pick="' + img + '" title="' + (c.name || '') + '" style="aspect-ratio:1;border-radius:50%;border:2.5px solid var(--gray-line);background:var(--white);overflow:hidden;padding:0;cursor:pointer;transition:.15s;position:relative;' + selected + '">' +
          '<img src="' + img + '" alt="' + (c.name || '') + '" style="position:absolute;width:200%;height:200%;top:-30%;left:-50%;object-fit:cover;object-position:center 32%;">' +
        '</button>';
      }).join('');
    })();

    function setPendingAvatar(dataUrl) {
      pendingAvatar = dataUrl;
      if (dataUrl) {
        const isCard = dataUrl.startsWith('http');
        const pos = isCard ? 'center 28%' : 'center';
        previewEl.innerHTML = '<img src="' + dataUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;object-position:' + pos + ';">';
      } else {
        previewEl.innerHTML = '<span style="font-family:var(--font-display);font-size:42px;font-weight:800;color:#1a1a2e;">' + (u.avatar || '?') + '</span>';
      }
      // Highlight selected
      cardsTabEl.querySelectorAll('[data-av-pick]').forEach(b => {
        if (b.dataset.avPick === dataUrl) {
          b.style.borderColor = 'var(--blue)';
          b.style.boxShadow = '0 0 0 3px rgba(91,141,239,0.2)';
        } else {
          b.style.borderColor = 'var(--gray-line)';
          b.style.boxShadow = '';
        }
      });
    }

    // Card click
    cardsTabEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-av-pick]');
      if (!btn) return;
      setPendingAvatar(btn.dataset.avPick);
    });

    // Tab switching
    document.querySelectorAll('[data-av-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.avTab;
        if (tab === 'reset') {
          setPendingAvatar(null);
          return;
        }
        document.querySelectorAll('[data-av-tab="cards"], [data-av-tab="upload"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cardsTabEl.style.display = tab === 'cards' ? 'grid' : 'none';
        uploadTabEl.style.display = tab === 'upload' ? 'block' : 'none';
      });
    });

    // Upload
    const fileInput = document.getElementById('avatar-file-input');
    document.getElementById('avatar-pick-file').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        window.UI.toast('Image trop lourde (2 Mo max)', 'error');
        return;
      }
      // Recadrer/redimensionner via canvas pour avatar compact
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          // Couvre le carré, centré
          const ratio = Math.max(size / img.width, size / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          const dataUrl = canvas.toDataURL('image/webp', 0.82);
          setPendingAvatar(dataUrl);
          window.UI.toast('Image charg\u00e9e. Cliquez sur Enregistrer.', 'info');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    // SAVE
    document.getElementById('settings-save').addEventListener('click', () => {
      const errEl = document.getElementById('settings-error');
      const errors = [];
      let usernameChanged = false;

      // 1) Username (si modifi\u00e9)
      const newU = document.getElementById('new-username').value.trim().toLowerCase();
      if (canChange && newU && newU !== u.username) {
        const res = window.Auth.changeUsername(newU);
        if (!res.success) {
          errors.push(...res.errors);
        } else {
          usernameChanged = true;
        }
      }

      // 2) Avatar (toujours autoris\u00e9)
      if (pendingAvatar !== u.avatarImage) {
        window.Auth.updateProfile({ avatarImage: pendingAvatar || null });
      }

      if (errors.length > 0) {
        errEl.style.display = 'block';
        errEl.className = 'form-error';
        errEl.innerHTML = errors.length === 1
          ? errors[0]
          : 'Veuillez corriger :<ul>' + errors.map(e => '<li>' + e + '</li>').join('') + '</ul>';
        return;
      }

      window.UI.closeModal();
      if (usernameChanged) {
        window.UI.toast('Compte mis \u00e0 jour. Rechargement\u2026', 'success');
        setTimeout(() => window.location.reload(), 600);
      } else {
        window.UI.toast('Avatar mis \u00e0 jour \u2713', 'success');
        refreshAvatarEverywhere();
      }
    });
  }

})();
