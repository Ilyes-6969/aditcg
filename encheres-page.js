// ============================================
// ENCHERES-PAGE.JS — Salle des enchères
// ============================================
(async () => {
  const STORE_KEY = 'aditcg_auctions_v2';
  const MIN = 60000, HOUR = 3600000, DAY = 86400000;

  // Lots : cartes réelles + délai avant clôture
  const LOT_DEFS = [
    { cardId: 'xy12-12',    endsIn: 14 * MIN },
    { cardId: 'base1-4',    endsIn: 38 * MIN },
    { cardId: 'neo1-9',     endsIn: 52 * MIN },
    { cardId: 'base1-2',    endsIn: 3 * HOUR + 20 * MIN },
    { cardId: 'base1-15',   endsIn: 7 * HOUR },
    { cardId: 'swsh7-150',  endsIn: 14 * HOUR },
    { cardId: 'swsh4-44',   endsIn: 27 * HOUR },
    { cardId: 'sv03.5-006', endsIn: 2 * DAY + 5 * HOUR },
    { cardId: 'base1-3',    endsIn: 3 * DAY },
  ];

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
  }
  function saveStore(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function seedStore() {
    const now = Date.now();
    const lots = LOT_DEFS.map((d, i) => ({
      id: 'auc_' + i,
      cardId: d.cardId,
      endsAt: now + d.endsIn,
      currentBid: null,
      bidCount: 3 + ((d.cardId.length * 7 + i * 13) % 28),
    }));
    const s = { seededAt: now, lots };
    saveStore(s);
    return s;
  }

  let store = loadStore();
  // (Re)génère si absent ou si tous les lots sont déjà clôturés
  if (!store || !store.lots || !store.lots.length || store.lots.every(l => l.endsAt <= Date.now())) {
    store = seedStore();
  }

  // Charge le détail des cartes (image, nom, prix réel)
  const cardMap = {};
  await Promise.all(store.lots.map(async (lot) => {
    const card = await window.TCGdex.getCardDetail(lot.cardId).catch(() => null);
    if (card) cardMap[lot.cardId] = card;
  }));

  // Initialise l'enchère de départ depuis le prix réel × grade
  let storeChanged = false;
  store.lots.forEach((lot) => {
    if (lot.currentBid == null) {
      const card = cardMap[lot.cardId];
      const grade = window.TCGdex.getCardGrade(lot.cardId);
      const base = card ? (window.TCGdex.getRealPrice(card)?.price || 20) : 20;
      lot.currentBid = Math.max(1, Math.round(base * grade.mult * 0.6));
      storeChanged = true;
    }
  });
  if (storeChanged) saveStore(store);

  let activeFilter = 'all';
  const fmt = (v) => window.TCGdex.formatPrice(v);

  function timeLeft(endsAt) {
    const ms = endsAt - Date.now();
    if (ms <= 0) return { ended: true, text: 'Terminée', urgent: false };
    const d = Math.floor(ms / DAY);
    const h = Math.floor((ms % DAY) / HOUR);
    const m = Math.floor((ms % HOUR) / MIN);
    const s = Math.floor((ms % MIN) / 1000);
    let text;
    if (d > 0) text = d + 'j ' + h + 'h';
    else if (h > 0) text = h + 'h ' + String(m).padStart(2, '0') + 'm';
    else text = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return { ended: false, text, urgent: ms < HOUR };
  }

  function statusOf(endsAt) {
    const ms = endsAt - Date.now();
    if (ms <= 0) return { cls: 'ended', label: 'Terminée', pulse: false };
    if (ms <= HOUR) return { cls: 'live', label: 'En direct', pulse: true };
    if (ms <= 6 * HOUR) return { cls: 'soon', label: 'Bientôt', pulse: false };
    return { cls: 'open', label: 'En cours', pulse: false };
  }

  function renderLots() {
    const grid = document.getElementById('lots-grid');
    if (!grid) return;
    let lots = store.lots.slice();
    if (activeFilter === 'live') {
      lots = lots.filter(l => { const ms = l.endsAt - Date.now(); return ms > 0 && ms <= 6 * HOUR; });
    } else if (activeFilter === 'graded') {
      lots = lots.filter(l => window.TCGdex.getCardGrade(l.cardId).tier !== 'raw');
    }
    lots.sort((a, b) => {
      const ae = a.endsAt <= Date.now(), be = b.endsAt <= Date.now();
      if (ae !== be) return ae ? 1 : -1;
      return a.endsAt - b.endsAt;
    });

    if (lots.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="emoji">🃏</div><h3>Aucun lot</h3><p>Aucun lot ne correspond à ce filtre.</p></div>';
      return;
    }

    grid.innerHTML = lots.map((lot) => {
      const card = cardMap[lot.cardId];
      const grade = window.TCGdex.getCardGrade(lot.cardId);
      const st = statusOf(lot.endsAt);
      const tl = timeLeft(lot.endsAt);
      const img = card ? window.TCGdex.getCardImage(card, 'high', 'webp') : null;
      const name = card ? card.name : lot.cardId;
      const setName = card ? (card.set?.name || 'Pokémon') : 'Pokémon';
      const myBid = window.Storage.getBidForAuction(lot.id);
      return `
        <div class="lot-card ${tl.ended ? 'ended' : ''}" data-lot="${lot.id}">
          <div class="lot-img">
            <div class="lot-status ${st.cls}">${st.pulse ? '<span class="pulse"></span>' : ''}${st.label}</div>
            <div class="lot-grade"><div class="grade-badge grade-${grade.tier}">${grade.tier === 'raw' ? 'Brut' : grade.label}</div></div>
            ${img ? `<img src="${img}" alt="${name}" onerror="this.parentNode.innerHTML='<div class=&quot;skel&quot;></div>'">` : '<div class="skel"></div>'}
          </div>
          <div class="lot-body">
            <div class="lot-name">${name}</div>
            <div class="lot-sub">${setName} · ${lot.bidCount} enchères</div>
            <div class="lot-bid-row">
              <div>
                <div class="lot-bid-label">Enchère actuelle</div>
                <div class="lot-bid">${fmt(lot.currentBid)}</div>
              </div>
              <div class="lot-countdown">
                <div class="lot-bid-label">${tl.ended ? 'Clôturée' : 'Temps restant'}</div>
                <div class="lot-timer ${tl.urgent ? 'urgent' : ''}" data-ends="${lot.endsAt}">${tl.text}</div>
              </div>
            </div>
            ${myBid ? `<div class="lot-mybid">✓ Votre offre : ${fmt(myBid.amount)}</div>` : ''}
            <button class="btn ${tl.ended ? 'btn-ghost' : 'btn-primary'} lot-bid-btn" data-bid="${lot.id}" ${tl.ended ? 'disabled' : ''}>
              ${tl.ended ? 'Enchère terminée' : (myBid ? 'Surenchérir' : 'Placer une enchère')}
            </button>
          </div>
        </div>`;
    }).join('');
  }

  function renderMyBids() {
    const table = document.getElementById('mybids-table');
    if (!table) return;
    table.querySelectorAll('.mybid-row:not(.head)').forEach(r => r.remove());
    const empty = document.getElementById('mybids-empty');
    const bids = window.Storage.getBids();
    if (bids.length === 0) { if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';

    bids.slice().reverse().forEach((bid) => {
      const lot = store.lots.find(l => l.id === bid.auctionId);
      const card = lot ? cardMap[lot.cardId] : null;
      const img = card ? window.TCGdex.getCardImage(card, 'low', 'webp') : '';
      const name = card ? card.name : (bid.cardId || 'Carte');
      let status;
      if (!lot || lot.endsAt <= Date.now()) status = { cls: 'ended', txt: 'Terminée' };
      else if (bid.amount >= lot.currentBid) status = { cls: 'winning', txt: 'En tête' };
      else status = { cls: 'outbid', txt: 'Dépassé' };
      const row = document.createElement('div');
      row.className = 'mybid-row';
      row.innerHTML = `
        <img src="${img}" alt="" onerror="this.style.visibility='hidden'">
        <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
        <div class="col-hide" style="font-family:var(--font-mono);">${fmt(bid.amount)}</div>
        <div style="font-family:var(--font-display); font-weight:800;">${lot ? fmt(lot.currentBid) : '—'}</div>
        <div><span class="mybid-status ${status.cls}">${status.txt}</span></div>`;
      table.appendChild(row);
    });
  }

  function openBidModal(lotId) {
    const lot = store.lots.find(l => l.id === lotId);
    if (!lot) return;
    if (lot.endsAt <= Date.now()) { window.UI.toast('Cette enchère est terminée', 'warning'); return; }
    if (!window.Auth.isLoggedIn()) { window.UI.openLogin(); return; }
    const card = cardMap[lot.cardId];
    const minBid = lot.currentBid + Math.max(1, Math.round(lot.currentBid * 0.05));
    window.UI.openModal(`
      <div class="modal">
        <div class="modal-close">×</div>
        <div class="modal-header">
          <div class="pokeball-mini"></div>
          <h2>Placer une <span class="accent">enchère</span></h2>
          <p>${card ? card.name : lot.cardId} — offre actuelle ${fmt(lot.currentBid)}</p>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label>Votre enchère (€)</label>
            <input type="number" id="bid-amount" min="${minBid}" step="1" value="${minBid}">
            <div class="hint">Enchère minimum : ${fmt(minBid)}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary btn-large" id="bid-submit">Confirmer l'enchère</button>
        </div>
      </div>
    `);
    document.getElementById('bid-submit').addEventListener('click', () => {
      const amount = parseFloat(document.getElementById('bid-amount').value);
      if (!amount || amount < minBid) {
        window.UI.toast("L'enchère doit être d'au moins " + fmt(minBid), 'error');
        return;
      }
      lot.currentBid = Math.round(amount * 100) / 100;
      lot.bidCount += 1;
      saveStore(store);
      window.Storage.placeBid({ auctionId: lot.id, cardId: lot.cardId, amount: lot.currentBid });
      window.UI.closeModal();
      window.UI.toast('Enchère placée : ' + fmt(lot.currentBid) + ' !', 'success');
      renderLots();
      renderMyBids();
    });
    const inp = document.getElementById('bid-amount');
    inp.focus();
    inp.addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('bid-submit').click(); });
  }

  // Événements
  document.getElementById('lots-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.lot-bid-btn');
    if (btn && !btn.disabled) openBidModal(btn.dataset.bid);
  });
  document.querySelectorAll('#auction-filter .filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#auction-filter .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderLots();
    });
  });

  renderLots();
  renderMyBids();

  // Comptes à rebours en direct
  setInterval(() => {
    let endedNow = false;
    document.querySelectorAll('.lot-timer').forEach((el) => {
      const endsAt = parseInt(el.dataset.ends, 10);
      const tl = timeLeft(endsAt);
      const lotCard = el.closest('.lot-card');
      if (tl.ended && lotCard && !lotCard.classList.contains('ended')) endedNow = true;
      el.textContent = tl.text;
      el.classList.toggle('urgent', tl.urgent);
    });
    if (endedNow) { renderLots(); renderMyBids(); }
  }, 1000);

})();
