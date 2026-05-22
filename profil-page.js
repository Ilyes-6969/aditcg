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
    if (usernameEl) usernameEl.textContent = '@' + user.username + ' · Membre depuis ' + dateStr;
    if (metaEl) {
      metaEl.innerHTML =
        '<span>⭐ ' + user.stats.rating + '/5 (' + user.stats.reviews + ' avis)</span>' +
        '<span class="dot"></span>' +
        '<span>📦 ' + user.stats.sales + ' ventes</span>' +
        '<span class="dot"></span>' +
        '<span>🤝 ' + user.stats.trades + ' échanges</span>' +
        '<span class="dot"></span>' +
        '<span>📍 ' + user.location + '</span>';
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

  const uniqueSets = new Set();
  allCards.forEach(c => { if (c.set?.id) uniqueSets.add(c.set.id); });
  document.getElementById('stat-sets').textContent = uniqueSets.size;

  window.Storage.recordPortfolioValue(totalValue);

  const history = window.Storage.getPortfolioHistory();
  const perfEl = document.getElementById('stat-perf');
  if (history.length >= 2) {
    const old = history[Math.max(0, history.length - 30)].value;
    const cur = history[history.length - 1].value;
    if (old > 0) {
      const pct = ((cur - old) / old) * 100;
      perfEl.textContent = (pct >= 0 ? '↑ +' : '↓ ') + pct.toFixed(1) + '%';
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
      '<div class="pkmn-card-trend ' + (trend >= 0 ? '' : 'down') + '">' + (trend >= 0 ? '↑' : '↓') + Math.abs(trend) + '%</div>' +
      '</div></div></a></div>';
  }

  const collGrid = document.getElementById('collection-grid');
  if (allCards.length === 0) {
    collGrid.innerHTML =
      '<div class="empty-state" style="grid-column:1/-1;">' +
      '<div class="emoji">🃏</div>' +
      '<h3>Votre collection est vide</h3>' +
      '<p>Commencez à collectionner ! Parcourez les séries et marquez les cartes que vous possédez.</p>' +
      '<a href="series.html" class="btn btn-primary" style="margin-top:16px;">Parcourir les séries</a>' +
      '</div>';
  } else {
    collGrid.innerHTML = allCards.map(renderCard).join('');
  }

  // 6. FAVORITES TAB
  const favTabContent = document.getElementById('tab-wishlist');
  if (favoriteIds.length === 0) {
    favTabContent.innerHTML =
      '<div class="empty-state">' +
      '<div class="emoji">♡</div>' +
      '<h3>Aucun favori pour le moment</h3>' +
      '<p>Cliquez sur l\'icône cœur d\'une carte pour l\'ajouter ici.</p>' +
      '<a href="marche.html" class="btn btn-primary" style="margin-top:16px;">Explorer le marché</a>' +
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
    window.UI.toast(nowFav ? 'Ajouté aux favoris ♥' : 'Retiré des favoris', nowFav ? 'success' : 'info');

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
      '<div class="emoji">📊</div>' +
      '<h3>Aucune activité encore</h3>' +
      '<p>Vos achats, ventes et échanges apparaîtront ici.</p>' +
      '</div>';
  } else {
    const timeAgo = (ts) => {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "à l'instant";
      if (mins < 60) return 'il y a ' + mins + ' min';
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return 'il y a ' + hrs + 'h';
      const days = Math.floor(hrs / 24);
      return 'il y a ' + days + 'j';
    };
    const icons = { collection: '🃏', trade: '⇌', listing: '🏷', system: '⭐' };
    activityTab.innerHTML = '<div class="activity-list">' +
      activity.slice(0, 30).map(a =>
        '<div class="activity-item">' +
        '<div class="activity-icon">' + (icons[a.type] || '•') + '</div>' +
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

  const AVATAR_CARD_IDS = [
    'base1-4', 'base1-2', 'base1-15', 'base1-58',
    'neo1-9', 'xy12-12', 'swsh4-44', 'swsh7-150',
    'base1-1', 'base1-3', 'base1-10', 'base1-25',
  ];

  function getAvatarHtml(u) {
    if (u.avatarImage) {
      const isCard = u.avatarImage.startsWith('http');
      const pos = isCard ? 'center 28%' : 'center';
      return '<img src="' + u.avatarImage + '" alt="" style="width:100%;height:100%;object-fit:cover;object-position:' + pos + ';border-radius:50%;">';
    }
    return u.avatar || (u.name || '?').charAt(0).toUpperCase();
  }

  function refreshAvatarEverywhere() {
    const u = window.Auth.getCurrentUser();
    if (!u) return;
    const headerAv = document.querySelector('.profil-avatar');
    if (headerAv) {
      headerAv.innerHTML = u.avatarImage ? getAvatarHtml(u) : '';
      if (!u.avatarImage) headerAv.textContent = u.avatar;
      headerAv.style.padding = u.avatarImage ? '0' : '';
      headerAv.style.overflow = u.avatarImage ? 'hidden' : '';
    }
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

    const _previewIsCard = (u.avatarImage || '').startsWith('http');
    const _previewPos = _previewIsCard ? 'center 28%' : 'center';
    const avatarPreviewHtml = u.avatarImage
      ? '<img src="' + u.avatarImage + '" alt="" style="width:100%;height:100%;object-fit:cover;object-position:' + _previewPos + ';">'
      : '<span style="font-family:var(--font-display);font-size:42px;font-weight:800;color:#1a1a2e;">' + (u.avatar || '?') + '</span>';

    window.UI.openModal(
      '<div class="modal" style="max-width:560px;">' +
        '<div class="modal-close">×</div>' +
        '<div class="modal-header">' +
          '<div class="pokeball-mini"></div>' +
          '<h2>Paramètres du <span class="accent">compte</span></h2>' +
          '<p>Gérez votre avatar et votre pseudo public.</p>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div style="margin-bottom:24px;">' +
            '<label style="display:block;font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:var(--gray-text);margin-bottom:12px;font-weight:600;">Photo de profil</label>' +
            '<div style="display:flex;gap:16px;align-items:center;margin-bottom:14px;">' +
              '<div id="avatar-preview" style="width:84px;height:84px;border-radius:50%;background:var(--yellow);border:3px solid var(--ink);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">' +
                avatarPreviewHtml +
              '</div>' +
              '<div style="flex:1;">' +
                '<div style="font-weight:700;font-size:14px;margin-bottom:4px;">Choisissez votre avatar</div>' +
                '<div style="font-size:12px;color:var(--gray-text);">Une carte icônique ou votre propre photo (max 2&nbsp;Mo).</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;margin-bottom:12px;">' +
              '<button class="filter-chip active" data-av-tab="cards" type="button">Cartes Pokémon</button>' +
              '<button class="filter-chip" data-av-tab="upload" type="button">Charger une photo</button>' +
              (u.avatarImage ? '<button class="filter-chip" data-av-tab="reset" type="button" style="margin-left:auto;color:var(--red);">Réinitialiser</button>' : '') +
            '</div>' +
            '<div id="av-tab-cards" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:12px;background:var(--gray-bg);border-radius:var(--radius);max-height:220px;overflow-y:auto;">' +
              '<div style="grid-column:1/-1;text-align:center;font-size:12px;color:var(--gray-text);padding:10px;">Chargement des cartes…</div>' +
            '</div>' +
            '<div id="av-tab-upload" style="display:none;padding:16px;background:var(--gray-bg);border-radius:var(--radius);text-align:center;">' +
              '<input type="file" id="avatar-file-input" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none;">' +
              '<button class="btn btn-primary" id="avatar-pick-file" type="button">📁 Choisir une image</button>' +
              '<div style="font-size:11px;color:var(--gray-text);margin-top:10px;">PNG, JPG, WEBP ou GIF · 2&nbsp;Mo max · sera recadrée en rond</div>' +
            '</div>' +
          '</div>' +
          '<div id="settings-error" style="display:none;"></div>' +
          '<div class="form-field">' +
            '<label>Nom d\'utilisateur (pseudo)</label>' +
            '<input type="text" id="new-username" value="' + u.username + '" ' + (canChange ? '' : 'disabled') + ' autocomplete="off" maxlength="24">' +
            '<div class="hint">' + (canChange
              ? 'Lettres min., chiffres, underscore. 3-24 caractères.<br><strong style="color:var(--blue);">⚠ Vous ne pourrez changer à nouveau qu\'après 14 jours.</strong>'
              : '<strong style="color:var(--orange);">Verrouillé</strong> · prochain changement possible dans <strong>' + cd.remainingDays + ' jour' + (cd.remainingDays > 1 ? 's' : '') + '</strong>.' + (lastDate ? '<br>Dernier changement : ' + lastDate : '')) +
            '</div>' +
          '</div>' +
          '<div style="padding:14px;background:var(--gray-bg);border-radius:var(--radius);font-size:12px;color:var(--gray-text);line-height:1.5;margin-top:8px;">' +
            '<strong style="color:var(--ink);">Pourquoi cette limite&nbsp;?</strong> Pour préserver la réputation des dresseurs et éviter les arnaques d\'identité sur les échanges, le pseudo n\'est modifiable qu\'une fois tous les <strong style="color:var(--ink);">14 jours</strong>.' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-primary btn-large" id="settings-save" type="button">Enregistrer</button>' +
        '</div>' +
      '</div>'
    );

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
        const selected = pendingAvatar === img ? 'border-color:var(--blue);box-shadow:0 0 0 3px rgba(79,99,245,.2);' : '';
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
      cardsTabEl.querySelectorAll('[data-av-pick]').forEach(b => {
        if (b.dataset.avPick === dataUrl) {
          b.style.borderColor = 'var(--blue)';
          b.style.boxShadow = '0 0 0 3px rgba(79,99,245,0.2)';
        } else {
          b.style.borderColor = 'var(--gray-line)';
          b.style.boxShadow = '';
        }
      });
    }

    cardsTabEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-av-pick]');
      if (!btn) return;
      setPendingAvatar(btn.dataset.avPick);
    });

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

    const fileInput = document.getElementById('avatar-file-input');
    document.getElementById('avatar-pick-file').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        window.UI.toast('Image trop lourde (2 Mo max)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          const ratio = Math.max(size / img.width, size / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          const dataUrl = canvas.toDataURL('image/webp', 0.82);
          setPendingAvatar(dataUrl);
          window.UI.toast('Image chargée. Cliquez sur Enregistrer.', 'info');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('settings-save').addEventListener('click', () => {
      const errEl = document.getElementById('settings-error');
      const errors = [];
      let usernameChanged = false;

      const newU = document.getElementById('new-username').value.trim().toLowerCase();
      if (canChange && newU && newU !== u.username) {
        const res = window.Auth.changeUsername(newU);
        if (!res.success) {
          errors.push(...res.errors);
        } else {
          usernameChanged = true;
        }
      }

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
        window.UI.toast('Compte mis à jour. Rechargement…', 'success');
        setTimeout(() => window.location.reload(), 600);
      } else {
        window.UI.toast('Avatar mis à jour ✓', 'success');
        refreshAvatarEverywhere();
      }
    });
  }

})();
