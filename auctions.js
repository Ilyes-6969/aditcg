// ============================================
// AUCTIONS.JS — Données enchères pseudo-réalistes
// Inspiré de gradedcardcenter.com : listings auction/fixed-price
// Toutes les données sont déterministes par card.id pour stabilité au refresh.
// ============================================

(() => {

  // ============================================
  // POOL DE VENDEURS — pseudo, avec initiales pour avatar coloré
  // ============================================
  const SELLERS = [
    { name: '@madarra',         rating: 4.9, sales: 187, avatarColor: '#5b8def' },
    { name: '@elite.tcg',       rating: 5.0, sales: 312, avatarColor: '#dc0a2d' },
    { name: '@pdeuxr',          rating: 4.8, sales: 94,  avatarColor: '#16a34a' },
    { name: '@dazh_tcg',        rating: 4.9, sales: 156, avatarColor: '#9333ea' },
    { name: '@xxc.collect',     rating: 4.7, sales: 67,  avatarColor: '#f59e0b' },
    { name: '@arno.collec',     rating: 5.0, sales: 421, avatarColor: '#0ea5e9' },
    { name: '@vintage.fr',      rating: 4.8, sales: 203, avatarColor: '#e11d48' },
    { name: '@lucas_collector', rating: 5.0, sales: 142, avatarColor: '#7c3aed' },
    { name: '@marie_dresseuse', rating: 4.8, sales: 32,  avatarColor: '#ec4899' },
    { name: '@thomas_94',       rating: 4.9, sales: 78,  avatarColor: '#06b6d4' },
    { name: '@pca_master',      rating: 4.9, sales: 256, avatarColor: '#10b981' },
    { name: '@bordeaux_pkmn',   rating: 4.8, sales: 88,  avatarColor: '#f97316' },
  ];

  // ============================================
  // HASH STABLE pour pseudo-aléatoire déterministe
  // ============================================
  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function pick(arr, seed) {
    return arr[seed % arr.length];
  }

  // ============================================
  // CONFIG ENCHÈRES
  // Types : "auction" (avec fin programmée) ou "fixed" (achat immédiat)
  // ============================================
  // Auctions répétitives à des horaires fixes (style GCC)
  // - Weekly auction : finit chaque dimanche 17h
  // - Premium       : finit fin de mois
  // - Private/event : aléatoire
  function getNextSundayAt17() {
    const d = new Date();
    const day = d.getDay(); // 0=dim
    const daysUntilSunday = (7 - day) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(17, 0, 0, 0);
    return d.getTime();
  }

  function getNextMonthEnd() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0); // dernier jour du mois courant
    d.setHours(21, 0, 0, 0);
    return d.getTime();
  }

  // ============================================
  // GRADES — distribution réaliste
  // ============================================
  function pickGrade(card, seed) {
    // 30% raw NM, 18% raw EX, 30% PSA 10, 14% PSA 9, 5% PCA 10, 3% PSA 8
    const roll = seed % 100;
    if (roll < 30) return { code: 'NM',    label: 'Near Mint',     graded: false, color: '#82a8ff' };
    if (roll < 48) return { code: 'EX',    label: 'Excellent',     graded: false, color: '#94a3b8' };
    if (roll < 78) return { code: 'PSA10', label: 'PSA 10',        graded: true,  color: '#d97706' };
    if (roll < 92) return { code: 'PSA9',  label: 'PSA 9',         graded: true,  color: '#ca8a04' };
    if (roll < 97) return { code: 'PCA10', label: 'PCA 10',        graded: true,  color: '#16a34a' };
    return            { code: 'PSA8',  label: 'PSA 8',         graded: true,  color: '#6b7280' };
  }

  // ============================================
  // LISTING ENRICHI pour une carte
  // Retourne tout ce dont l'UI a besoin pour afficher un "annonce GCC"
  // ============================================
  function getListing(card) {
    if (!card || !card.id) return null;
    const seed = hashStr(card.id);
    const seller = pick(SELLERS, seed);
    const grade = pickGrade(card, seed >> 3);

    // Prix de base : prix Cardmarket ou estimation
    const base = window.TCGdex.getRealPrice(card)?.price || 0;
    const mults = window.TCGdex.getConditionMultipliers(card, base);
    const gradedPrice = Math.round(base * (mults[grade.code] || 1) * 100) / 100;

    // Type d'annonce : 55% fixed-price, 35% weekly auction, 10% premium auction
    const typeRoll = (seed >> 6) % 100;
    let type, endsAt, kind;
    if (typeRoll < 55) {
      type = 'fixed';
      kind = 'Achat immédiat';
      endsAt = null;
    } else if (typeRoll < 90) {
      type = 'auction';
      kind = 'Weekly Auction';
      endsAt = getNextSundayAt17();
    } else {
      type = 'auction';
      kind = 'Premium Auction';
      endsAt = getNextMonthEnd();
    }

    // Nb d'enchères (pour les auctions)
    let bidCount = 0;
    let currentBid = gradedPrice;
    if (type === 'auction') {
      bidCount = ((seed >> 9) % 14) + 1;
      // Prix de départ ~70% du prix estimé, qui monte avec les enchères
      currentBid = Math.round(gradedPrice * (0.55 + bidCount * 0.025) * 100) / 100;
    }

    // Tendance prix
    const trend = ((seed >> 12) % 40) - 12;

    // Lieu du vendeur
    const cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Nantes', 'Toulouse', 'Strasbourg'];
    const city = cities[seed % cities.length];

    return {
      seller: { ...seller, city },
      grade,
      type,
      kind,
      price: gradedPrice,
      currentBid,
      bidCount,
      endsAt,
      trend,
      isLive: type === 'auction',
    };
  }

  // ============================================
  // COUNTDOWN — format compact "2j 4h 17min"
  // ============================================
  function formatCountdown(endsAt) {
    if (!endsAt) return '—';
    const remaining = endsAt - Date.now();
    if (remaining <= 0) return 'Terminée';
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins} min`;
  }

  // Statut visuel : LIVE (< 24h) / SOON (>24h) / ENDED
  function getAuctionStatus(endsAt) {
    if (!endsAt) return 'fixed';
    const remaining = endsAt - Date.now();
    if (remaining <= 0) return 'ended';
    if (remaining < 24 * 60 * 60 * 1000) return 'live';
    return 'soon';
  }

  // ============================================
  // INITIALES depuis un pseudo
  // ============================================
  function sellerInitials(name) {
    const clean = (name || '').replace(/^@/, '');
    return clean.slice(0, 1).toUpperCase();
  }

  window.Auctions = {
    getListing,
    formatCountdown,
    getAuctionStatus,
    sellerInitials,
    SELLERS,
  };

})();
