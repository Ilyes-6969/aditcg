// TRADE-PAGE.JS — Logique de la page Échanges
(async () => {

  // Wait for Auth to be ready
  if (window.Auth?.init) await window.Auth.init();

  // STATE
  const composer = {
    give: [],      // [{ id, card, price }]
    receive: [],
  };

  // ============================================
  // RENDER COMPOSER
  // ============================================
  function renderComposer() {
    const giveContainer = document.getElementById('give-slots');
    const recvContainer = document.getElementById('receive-slots');

    function renderSlots(items, side) {
      const slots = [];
      // existing items
      items.forEach((item, idx) => {
        const img = window.TCGdex.getCardImage(item.card, 'low', 'webp');
        slots.push(
          '<div class="slot filled" data-side="' + side + '" data-idx="' + idx + '">' +
          '<div class="slot-remove" data-remove="' + side + ':' + idx + '">\u00d7</div>' +
          '<img src="' + img + '" alt="' + item.card.name + '">' +
          '</div>'
        );
      });
      // empty slots (up to 4 total)
      const remaining = 4 - items.length;
      for (let i = 0; i < remaining; i++) {
        slots.push(
          '<div class="slot empty" data-side="' + side + '"><span class="plus">+</span></div>'
        );
      }
      return slots.join('');
    }

    giveContainer.innerHTML = renderSlots(composer.give, 'give');
    recvContainer.innerHTML = renderSlots(composer.receive, 'receive');

    // Update totals
    const giveTotal = composer.give.reduce((s, i) => s + i.price, 0);
    const recvTotal = composer.receive.reduce((s, i) => s + i.price, 0);
    document.getElementById('give-value').textContent = window.TCGdex.formatPrice(giveTotal);
    document.getElementById('receive-value').textContent = window.TCGdex.formatPrice(recvTotal);

    const balance = recvTotal - giveTotal;
    const balEl = document.getElementById('balance');
    balEl.textContent = (balance >= 0 ? '+' : '\u2212') + window.TCGdex.formatPrice(Math.abs(balance));
    balEl.className = 'v ' + (balance >= 0 ? '' : 'neg');
  }

  // ============================================
  // INITIAL DEMO CARDS in composer
  // ============================================
  async function loadInitialCards() {
    const initialIds = {
      give: ['base1-4', 'swsh4-44'],
      receive: ['sv03.5-9'],
    };
    for (const side of ['give', 'receive']) {
      for (const id of initialIds[side]) {
        const card = await window.TCGdex.getCardDetail(id).catch(() => null);
        if (card) {
          const price = window.TCGdex.estimatePrice(card);
          composer[side].push({ id, card, price });
        }
      }
    }
    renderComposer();
  }

  // ============================================
  // CARD PICKER MODAL
  // ============================================
  async function openCardPicker(side) {
    if (!window.Auth.isLoggedIn()) {
      window.UI.openLogin();
      return;
    }

    window.UI.openModal(
      '<div class="modal" style="max-width: 700px;">' +
      '<div class="modal-close">\u00d7</div>' +
      '<div class="modal-header">' +
      '<div class="pokeball-mini"></div>' +
      '<h2>Ajouter une <span class="accent">carte</span></h2>' +
      '<p>Recherchez une carte ou choisissez parmi vos cartes possédées.</p>' +
      '</div>' +
      '<div class="modal-body">' +
      '<div class="form-field">' +
      '<input type="text" id="card-search" placeholder="Tapez le nom d\'un Pokémon..." autocomplete="off">' +
      '</div>' +
      '<div id="picker-tabs" style="display:flex; gap:6px; margin-bottom: 16px;">' +
      '<button class="filter-chip active" data-picker-tab="collection">Ma collection</button>' +
      '<button class="filter-chip" data-picker-tab="search">Rechercher</button>' +
      '</div>' +
      '<div id="picker-results" style="max-height: 50vh; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px;"></div>' +
      '</div>' +
      '</div>'
    );

    let currentTab = 'collection';

    async function renderPickerResults(query) {
      const results = document.getElementById('picker-results');
      if (!results) return;
      results.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px;"><div class="pokeball-loader" style="margin: 0 auto;"></div></div>';

      let cards = [];
      try {
        if (currentTab === 'collection') {
          const ids = await window.Storage.getCollection();
          cards = (await Promise.all(ids.map(id =>
            window.TCGdex.getCardDetail(id).catch(() => null)
          ))).filter(Boolean);
          if (query) {
            const q = query.toLowerCase();
            cards = cards.filter(c => c.name.toLowerCase().includes(q));
          }
        } else {
          if (!query || query.length < 2) {
            results.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--gray-text); font-size:14px;">Tapez au moins 2 caractères pour rechercher dans TCGdex.</div>';
            return;
          }
          cards = await window.TCGdex.searchCards(query);
          cards = cards.slice(0, 30);
        }
      } catch (e) {
        console.error(e);
      }

      if (cards.length === 0) {
        results.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--gray-text); font-size:14px;">Aucune carte trouvée.</div>';
        return;
      }

      results.innerHTML = cards.map(c => {
        const img = window.TCGdex.getCardImage(c, 'low', 'webp');
        const price = window.TCGdex.estimatePrice(c);
        return '<div class="picker-card" data-card-id="' + c.id + '" style="cursor:pointer; border: 2px solid var(--gray-line); border-radius: var(--radius); padding: 4px; transition: all 0.2s; background: var(--white);">' +
          '<div style="aspect-ratio: 245/342; background: var(--gray-bg); border-radius: 6px; padding: 4px;">' +
          '<img src="' + img + '" alt="' + c.name + '" style="width:100%; height:100%; object-fit:contain;" loading="lazy">' +
          '</div>' +
          '<div style="padding: 6px 4px 2px; font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + c.name + '</div>' +
          '<div style="padding: 0 4px 4px; font-size: 11px; color: var(--red); font-weight: 800;">' + window.TCGdex.formatPrice(price) + '</div>' +
          '</div>';
      }).join('');

      // Add hover and click
      results.querySelectorAll('.picker-card').forEach(el => {
        el.addEventListener('mouseenter', () => { el.style.borderColor = 'var(--red)'; el.style.transform = 'translateY(-2px)'; });
        el.addEventListener('mouseleave', () => { el.style.borderColor = 'var(--gray-line)'; el.style.transform = ''; });
        el.addEventListener('click', async () => {
          const id = el.dataset.cardId;
          const card = await window.TCGdex.getCardDetail(id);
          if (!card) return;
          if (composer[side].length >= 4) {
            window.UI.toast('Maximum 4 cartes par côté', 'warning');
            return;
          }
          if (composer[side].some(i => i.id === id)) {
            window.UI.toast('Cette carte est déjà ajoutée', 'warning');
            return;
          }
          composer[side].push({ id, card, price: window.TCGdex.estimatePrice(card) });
          renderComposer();
          window.UI.closeModal();
          window.UI.toast(card.name + ' ajouté à l\'échange', 'success');
        });
      });
    }

    document.querySelectorAll('[data-picker-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-picker-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.pickerTab;
        const query = document.getElementById('card-search').value;
        renderPickerResults(query);
      });
    });

    let searchTimeout;
    document.getElementById('card-search').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const q = e.target.value;
      searchTimeout = setTimeout(() => renderPickerResults(q), 300);
    });

    document.getElementById('card-search').focus();
    renderPickerResults('');
  }

  // ============================================
  // CLICK HANDLERS for composer
  // ============================================
  document.addEventListener('click', (e) => {
    const empty = e.target.closest('.slot.empty');
    if (empty) {
      openCardPicker(empty.dataset.side);
      return;
    }
    const remove = e.target.closest('.slot-remove');
    if (remove) {
      const [side, idx] = remove.dataset.remove.split(':');
      composer[side].splice(parseInt(idx), 1);
      renderComposer();
      return;
    }
  });

  // ============================================
  // SUBMIT TRADE
  // ============================================
  document.querySelector('.composer-foot .btn-primary')?.addEventListener('click', async () => {
    if (!window.Auth.isLoggedIn()) {
      window.UI.openLogin();
      return;
    }
    if (composer.give.length === 0 || composer.receive.length === 0) {
      window.UI.toast('Ajoutez au moins une carte de chaque côté', 'warning');
      return;
    }
    const giveTotal = composer.give.reduce((s, i) => s + i.price, 0);
    const recvTotal = composer.receive.reduce((s, i) => s + i.price, 0);
    const ok = await window.UI.confirm({
      title: 'Confirmer l\'échange ?',
      message: 'Vous proposez d\'échanger <strong>' + composer.give.length + ' cartes</strong> (' + window.TCGdex.formatPrice(giveTotal) + ') contre <strong>' + composer.receive.length + ' cartes</strong> (' + window.TCGdex.formatPrice(recvTotal) + ').<br><br><em style="color:var(--gray-text); font-size:13px;">Démo : l\'échange est enregistré dans votre historique.</em>',
      confirmText: 'Confirmer la proposition',
    });
    if (!ok) return;

    const trade = await window.Storage.createTrade({
      give: composer.give.map(i => i.id),
      receive: composer.receive.map(i => i.id),
      partner: 'Communauté',
    });
    window.UI.toast('Échange proposé ! Vous serez notifié de la réponse.', 'success', 4500);

    // Refresh history
    setTimeout(() => location.reload(), 1200);
  });

  // Cancel button
  document.querySelector('.composer-foot .btn-ghost')?.addEventListener('click', () => {
    composer.give = [];
    composer.receive = [];
    renderComposer();
    window.UI.toast('Échange réinitialisé', 'info');
  });

  // ============================================
  // PUBLIC TRADE FEED
  // ============================================
  const publicTrades = [
    { who: 'M', name: '@marie_dresseuse', meta: '\u2b50 4.8 \u00b7 32 \u00e9changes', give: ['base1-4'], receive: ['sv03.5-9', 'sv03.5-25'], time: '12 min' },
    { who: 'T', name: '@thomas_94', meta: '\u2b50 4.9 \u00b7 78 \u00e9changes', give: ['neo1-9'], receive: ['swsh7-150'], time: '1h' },
    { who: 'L', name: '@lucas_collector', meta: '\u2b50 5.0 \u00b7 142 \u00e9changes', give: ['xy12-12', 'xy12-25'], receive: ['base1-15'], time: '3h' },
  ];

  async function renderTradeFeed() {
    const feed = document.getElementById('trade-feed');
    if (!feed) return;
    try {
      const allIds = [...new Set(publicTrades.flatMap(t => [...t.give, ...t.receive]))];
      const cardMap = {};
      await Promise.all(allIds.map(async id => {
        const c = await window.TCGdex.getCardDetail(id).catch(() => null);
        if (c) cardMap[id] = c;
      }));

      feed.innerHTML = publicTrades.map((t, idx) => {
        const renderMini = (id) => {
          const c = cardMap[id];
          if (!c) return '<div class="mini-card"><div class="skel"></div></div>';
          const img = window.TCGdex.getCardImage(c, 'low', 'webp');
          return '<div class="mini-card"><img src="' + img + '" alt="' + c.name + '" loading="lazy"></div>';
        };
        return '<div class="trade-card" data-public-trade="' + idx + '">' +
          '<div class="trader-info">' +
          '<div class="trader-avatar">' + t.who + '</div>' +
          '<div>' +
          '<div class="trader-name">' + t.name + '</div>' +
          '<div class="trader-meta">' + t.meta + '</div>' +
          '</div>' +
          '</div>' +
          '<div class="trade-cards-row">' +
          '<div class="mini-cards">' + t.give.map(renderMini).join('') + '</div>' +
          '<div class="vs-divider">\u21cc</div>' +
          '<div class="mini-cards">' + t.receive.map(renderMini).join('') + '</div>' +
          '</div>' +
          '<div class="trade-action">' +
          '<div class="trade-time">Il y a ' + t.time + '</div>' +
          '<button class="btn btn-primary btn-small" data-respond="' + idx + '">Répondre</button>' +
          '</div>' +
          '</div>';
      }).join('');

      // Respond handlers
      feed.querySelectorAll('[data-respond]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!window.Auth.isLoggedIn()) {
            window.UI.openLogin();
            return;
          }
          const idx = parseInt(btn.dataset.respond);
          const trade = publicTrades[idx];
          const ok = await window.UI.confirm({
            title: 'Accepter cet échange ?',
            message: 'Échanger avec <strong>' + trade.name + '</strong> : ' + trade.give.length + ' cartes contre ' + trade.receive.length + ' cartes.<br><br><em style="color:var(--gray-text); font-size:13px;">Démo : la transaction est enregistrée dans votre historique.</em>',
            confirmText: 'Accepter',
          });
          if (ok) {
            // Demo : we virtually give our cards (receive[]) and gain (give[])
            await window.Storage.createTrade({
              give: trade.give,
              receive: trade.receive,
              partner: trade.name,
            });
            // Add the received cards to collection
            for (const id of trade.give) {
              await window.Storage.addToCollection(id);
            }
            window.UI.toast('Échange accepté ! Nouvelles cartes ajoutées à votre collection.', 'success', 4500);
            btn.outerHTML = '<span class="status-pill done">Accepté</span>';
          }
        });
      });
    } catch (e) {
      console.error(e);
      feed.innerHTML = '<div class="empty-state"><div class="emoji">\u26a0\ufe0f</div><h3>Erreur</h3></div>';
    }
  }

  // ============================================
  // HISTORY (real trades from Storage)
  // ============================================
  async function renderHistory() {
    const trades = await window.Storage.getTrades();
    const table = document.querySelector('.history-table');
    if (!table) return;

    const head = '<div class="history-row head"><div>État</div><div>Échange</div><div>Partenaire</div><div>Différentiel</div><div>Date</div></div>';

    if (trades.length === 0) {
      table.innerHTML = head + '<div style="padding:30px; text-align:center; color:var(--gray-text); font-size:14px;">Aucun échange pour le moment. Proposez votre premier échange ci-dessus !</div>';
      return;
    }

    const timeAgo = (ts) => {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "à l'instant";
      if (mins < 60) return 'Il y a ' + mins + 'min';
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return 'Il y a ' + hrs + 'h';
      const days = Math.floor(hrs / 24);
      return 'Il y a ' + days + 'j';
    };
    const statusPills = {
      pending: '<span class="status-pill pending">En cours</span>',
      accepted: '<span class="status-pill done">Validé</span>',
      completed: '<span class="status-pill done">Terminé</span>',
      rejected: '<span class="status-pill cancel">Refusé</span>',
    };

    table.innerHTML = head + trades.map(t => {
      // Supabase returns give_cards/receive_cards (jsonb arrays) + created_at as timestamp
      const giveCount = (t.give_cards || t.give || []).length;
      const recvCount = (t.receive_cards || t.receive || []).length;
      const partner = t.partner || (t.recipient_id ? '@' + t.recipient_id.slice(0, 8) : 'Communauté');
      const ts = t.created_at ? new Date(t.created_at).getTime() : (t.createdAt || Date.now());
      return '<div class="history-row">' +
        '<div>' + (statusPills[t.status] || statusPills.pending) + '</div>' +
        '<div>' + giveCount + ' cartes \u21cc ' + recvCount + ' cartes</div>' +
        '<div>' + partner + '</div>' +
        '<div style="color:var(--gray-text); font-weight:600;">—</div>' +
        '<div style="color:var(--gray-text); font-size:12px;">' + timeAgo(ts) + '</div>' +
        '</div>';
    }).join('');
  }

  // INIT
  loadInitialCards();
  renderTradeFeed();
  renderHistory();

})();
