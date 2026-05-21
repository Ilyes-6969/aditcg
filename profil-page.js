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

    // Avatar: Pokemon image if set, else initial
    if (avatarEl) {
      if (user.avatarType === 'pokemon' && user.avatarUrl) {
        avatarEl.innerHTML = `<img src="${user.avatarUrl}" alt="" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        avatarEl.style.padding = '0';
        avatarEl.style.overflow = 'hidden';
      } else if (user.avatarType === 'pokemon' && user.avatarValue && window.UI?.getPokemonAvatarUrl) {
        // Resolve URL if missing
        window.UI.getPokemonAvatarUrl(user.avatarValue).then(url => {
          if (url) {
            avatarEl.innerHTML = `<img src="${url}" alt="" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            avatarEl.style.padding = '0';
            avatarEl.style.overflow = 'hidden';
            window.Auth.updateProfile({ avatarUrl: url });
          } else {
            avatarEl.textContent = user.avatar;
          }
        });
      } else {
        avatarEl.textContent = user.avatar || (user.name || '?').charAt(0).toUpperCase();
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
  } else {
    // Not enough data yet — show a friendly placeholder
    const portfolioChart = document.querySelector('#tab-portfolio .portfolio-chart');
    if (portfolioChart) {
      const svg = portfolioChart.querySelector('.chart-svg');
      if (svg) {
        svg.innerHTML = `
          <text x="300" y="80" text-anchor="middle" font-family="Inter" font-size="14" font-weight="600" fill="rgba(255,255,255,0.4)">
            Pas encore assez de données
          </text>
          <text x="300" y="105" text-anchor="middle" font-family="Inter" font-size="12" fill="rgba(255,255,255,0.3)">
            Revenez chaque jour pour suivre votre portefeuille
          </text>
        `;
      }
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

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    window.UI.openSettings();
  });

})();
