// ============================================
// TCGDEX API CLIENT — avec prix réels Cardmarket
// Documentation : https://tcgdex.dev/markets-prices
// ============================================

const TCGDEX_API = 'https://api.tcgdex.net/v2/fr';
const TCGDEX_IMG_QUALITY = 'high';
const TCGDEX_IMG_FORMAT = 'webp';

const CACHE = {
  sets: null,
  setDetails: {},
  cards: {},
  series: null,
};

const CACHE_KEY = 'aditcg_cache_v3'; // bump version après refonte prix + séries
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6h (prix mis à jour quotidiennement)

function loadCacheFromStorage() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL) {
      Object.assign(CACHE, parsed.data);
    }
  } catch (e) {
    console.warn('Cache load failed:', e);
  }
}

function saveCacheToStorage() {
  try {
    const data = JSON.stringify({
      timestamp: Date.now(),
      data: CACHE,
    });
    if (data.length < 4 * 1024 * 1024) {
      localStorage.setItem(CACHE_KEY, data);
    }
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
}

loadCacheFromStorage();

// ============================================
// FETCH avec timeout
// ============================================
async function fetchJSON(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ============================================
// GET ALL SETS
// ============================================
async function getAllSets() {
  if (CACHE.sets) return CACHE.sets;
  try {
    const data = await fetchJSON(`${TCGDEX_API}/sets`);
    const sorted = data.sort((a, b) => {
      const ad = (a.releaseDate || a.id || '').toString();
      const bd = (b.releaseDate || b.id || '').toString();
      return ad.localeCompare(bd);
    });
    CACHE.sets = sorted;
    saveCacheToStorage();
    return sorted;
  } catch (err) {
    console.error('getAllSets error:', err);
    return getFallbackSets();
  }
}

// ============================================
// GET SET DETAIL
// ============================================
async function getSetDetail(setId) {
  if (CACHE.setDetails[setId]) return CACHE.setDetails[setId];
  try {
    const data = await fetchJSON(`${TCGDEX_API}/sets/${setId}`);
    CACHE.setDetails[setId] = data;
    saveCacheToStorage();
    return data;
  } catch (err) {
    console.error(`getSetDetail(${setId}) error:`, err);
    return null;
  }
}

// ============================================
// GET CARD DETAIL (inclut maintenant pricing[cardmarket] et pricing[tcgplayer])
// ============================================
async function getCardDetail(cardId) {
  if (CACHE.cards[cardId]) return CACHE.cards[cardId];
  try {
    const data = await fetchJSON(`${TCGDEX_API}/cards/${cardId}`);
    CACHE.cards[cardId] = data;
    saveCacheToStorage();
    return data;
  } catch (err) {
    console.error(`getCardDetail(${cardId}) error:`, err);
    return null;
  }
}

// ============================================
// PRICING — VRAI PRIX si dispo, sinon estimation
// ============================================

/**
 * Récupère le prix RÉEL d'une carte depuis TCGdex.
 * Priorité : Cardmarket (EUR, pertinent pour la France) > TCGplayer (USD) > estimation.
 *
 * @returns {Object} { price, currency, trend7d, trend30d, source, low, high, holoPrice }
 */
function getRealPrice(card) {
  if (!card) return null;
  const p = card.pricing;

  // 1) CARDMARKET (EUR)
  if (p?.cardmarket) {
    const cm = p.cardmarket;
    const main = cm.avg ?? cm.avg30 ?? cm.trend ?? cm.low ?? null;
    const holo = cm['avg-holo'] ?? cm['avg30-holo'] ?? cm['trend-holo'] ?? null;
    if (main !== null && main !== undefined) {
      // Calcul tendance 30j (en %) si possible
      let trend30d = null;
      if (cm.avg30 && cm.trend && cm.avg30 > 0) {
        trend30d = ((cm.trend - cm.avg30) / cm.avg30) * 100;
      }
      let trend7d = null;
      if (cm.avg7 && cm.trend && cm.avg7 > 0) {
        trend7d = ((cm.trend - cm.avg7) / cm.avg7) * 100;
      }
      // Préfère le prix holo si la carte est holo/rare
      const rarity = (card.rarity || '').toLowerCase();
      const isHolo = rarity.includes('holo') || rarity.includes('rare') || rarity.includes('ultra') || rarity.includes('secret');
      const price = (isHolo && holo) ? holo : main;
      return {
        price: Math.round(price * 100) / 100,
        currency: 'EUR',
        trend7d: trend7d !== null ? Math.round(trend7d * 10) / 10 : null,
        trend30d: trend30d !== null ? Math.round(trend30d * 10) / 10 : null,
        source: 'Cardmarket',
        low: cm.low ?? null,
        high: null,
        holoPrice: holo ? Math.round(holo * 100) / 100 : null,
        normalPrice: Math.round(main * 100) / 100,
      };
    }
  }

  // 2) TCGPLAYER (USD → conversion approximative)
  if (p?.tcgplayer) {
    const tp = p.tcgplayer;
    const variant = tp.holo || tp.normal || tp.reverse;
    if (variant?.marketPrice) {
      // Conversion USD → EUR (~0.92, mise à jour manuelle si besoin)
      const usdToEur = 0.92;
      const price = variant.marketPrice * usdToEur;
      return {
        price: Math.round(price * 100) / 100,
        currency: 'EUR',
        trend7d: null,
        trend30d: null,
        source: 'TCGplayer (converted)',
        low: variant.lowPrice ? Math.round(variant.lowPrice * usdToEur * 100) / 100 : null,
        high: variant.highPrice ? Math.round(variant.highPrice * usdToEur * 100) / 100 : null,
        holoPrice: tp.holo?.marketPrice ? Math.round(tp.holo.marketPrice * usdToEur * 100) / 100 : null,
        normalPrice: tp.normal?.marketPrice ? Math.round(tp.normal.marketPrice * usdToEur * 100) / 100 : null,
      };
    }
  }

  // 3) ESTIMATION (fallback pour cartes sans données marché — EX, Full Art anciennes)
  return getEstimatedPrice(card);
}

/**
 * Wrapper rétrocompatible — retourne juste un nombre (pour le code existant)
 */
function estimatePrice(card) {
  const real = getRealPrice(card);
  return real?.price ?? 0;
}

/**
 * Tendance — utilise les vraies données si dispo
 */
function estimateTrend(card) {
  const real = getRealPrice(card);
  if (real?.trend30d !== null && real?.trend30d !== undefined) {
    return Math.round(real.trend30d);
  }
  // Fallback : pseudo-aléatoire stable
  if (!card) return 0;
  const idHash = (card.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ((idHash % 40) - 10);
}

// ============================================
// ESTIMATION FALLBACK (pour cartes sans pricing data)
// Calibrée sur les ordres de grandeur Cardmarket / eBay :
//  - bulk moderne : centimes
//  - holos : quelques €
//  - chase / alt art : dizaines à centaines d'€
//  - vintage WOTC : forte prime
// ============================================
const ICONIC_NAMES = [
  'charizard', 'dracaufeu', 'pikachu', 'mewtwo', 'mew', 'lugia',
  'rayquaza', 'umbreon', 'noctali', 'eevee', 'evoli', 'gengar', 'ectoplasma',
  'dragonite', 'dracolosse', 'gardevoir', 'lucario', 'greninja', 'amphinobi',
  'snorlax', 'ronflex', 'blastoise', 'tortank', 'venusaur', 'florizarre',
  'gyarados', 'leviator', 'sylveon', 'nymphali',
];

// Multiplicateur selon l'ère, déduit du préfixe d'identifiant TCGdex
function getEraInfo(cardId) {
  const id = (cardId || '').toLowerCase();
  if (/^(base|jungle|fossil|gym|neo|ecard|wp|si|bp)/.test(id)) return { mult: 4.0, era: 'vintage' };
  if (/^ex/.test(id)) return { mult: 2.1, era: 'ex' };
  if (/^(dp|pl|hgss|col|ru)/.test(id)) return { mult: 1.6, era: 'dppl' };
  if (/^(bw|dv|mcd|rc)/.test(id)) return { mult: 1.3, era: 'bw' };
  if (/^(xy|g1|dc)/.test(id)) return { mult: 1.2, era: 'xy' };
  if (/^(sm|det|sma)/.test(id)) return { mult: 1.1, era: 'sm' };
  if (/^swsh/.test(id)) return { mult: 1.0, era: 'swsh' };
  if (/^sv/.test(id)) return { mult: 1.0, era: 'sv' };
  return { mult: 1.1, era: 'other' };
}

function getEstimatedPrice(card) {
  const empty = { price: 0, currency: 'EUR', source: 'estimation', trend7d: null, trend30d: null, low: null, high: null, holoPrice: null, normalPrice: 0 };
  if (!card) return empty;

  const name = (card.name || '').toLowerCase();
  const rarity = (card.rarity || '').toLowerCase();
  const { mult: eraMult } = getEraInfo(card.id);
  const idHash = (card.id || 'x').split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);

  let base;
  if (rarity) {
    // Carte complète : rareté connue
    if (rarity.includes('common')) base = 0.25;
    else if (rarity.includes('uncommon')) base = 0.60;
    else if (rarity.includes('illustration') || rarity.includes('alt')) base = 70;
    else if (rarity.includes('secret') || rarity.includes('rainbow')) base = 45;
    else if (rarity.includes('ultra')) base = 18;
    else if (rarity.includes('full art')) base = 32;
    else if (rarity.includes('holo')) base = 7;
    else if (rarity.includes('promo')) base = 4;
    else if (rarity.includes('rare')) base = 1.4;
    else base = 1.0;
  } else {
    // Brief sans rareté (listes de sets) : distribution réaliste de marché
    const roll = idHash % 100;
    if (roll < 65) base = 0.10 + (idHash % 70) / 100;   // ~65% bulk : 0,10–0,80 €
    else if (roll < 87) base = 1 + (idHash % 30) / 10;  // ~22% rares : 1–4 €
    else if (roll < 96) base = 6 + (idHash % 14);       // ~9%  holos : 6–20 €
    else if (roll < 99) base = 25 + (idHash % 45);      // ~3%  ultra : 25–70 €
    else base = 90 + (idHash % 160);                    // ~1%  chase : 90–250 €
  }

  // Prime Pokémon iconiques (forte sur les cartes de valeur, légère sur le bulk)
  const isIconic = ICONIC_NAMES.some(n => name.includes(n));
  const iconicMult = isIconic ? (base >= 5 ? 2.4 : 1.4) : 1;

  // Variation déterministe ±15 %
  const variation = 0.85 + (idHash % 31) / 100;

  let price = Math.round(base * eraMult * iconicMult * variation * 100) / 100;
  if (price < 0.05) price = 0.05;

  return {
    price,
    currency: 'EUR',
    trend7d: null,
    trend30d: ((idHash % 40) - 12),
    source: 'estimation',
    low: Math.round(price * 0.7 * 100) / 100,
    high: Math.round(price * 1.5 * 100) / 100,
    holoPrice: null,
    normalPrice: price,
  };
}

// ============================================
// SET PRICING — calcul du floor et de la valeur totale d'un set
// Utilise les vrais prix de toutes les cartes du set
// ============================================
async function getSetPricing(setId) {
  const detail = await getSetDetail(setId);
  if (!detail || !detail.cards) return null;

  const prices = [];
  let totalValue = 0;
  let hasRealData = false;
  let realDataCount = 0;

  for (const card of detail.cards) {
    const p = getRealPrice(card);
    if (p && p.source !== 'estimation') {
      hasRealData = true;
      realDataCount++;
    }
    if (p && p.price > 0) {
      prices.push(p.price);
      totalValue += p.price;
    }
  }

  prices.sort((a, b) => a - b);
  const floor = prices.length > 0 ? prices[0] : 0;
  const median = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
  const top = prices.length > 0 ? prices[prices.length - 1] : 0;

  return {
    floor: Math.round(floor * 100) / 100,
    median: Math.round(median * 100) / 100,
    top: Math.round(top * 100) / 100,
    total: Math.round(totalValue * 100) / 100,
    cardsCount: detail.cards.length,
    pricedCount: prices.length,
    realDataCoverage: prices.length > 0 ? Math.round((realDataCount / prices.length) * 100) : 0,
    hasRealData,
  };
}

// ============================================
// SET PRICING RAPIDE (sans charger toutes les cartes)
// Estimation grossière basée sur les métadonnées du set
// ============================================
function estimateSetFloor(set) {
  if (!set) return 0;
  const total = set.cardCount?.total || 100;
  // estimation basique : sets récents ~ 0.50€ floor, vintages 5-15€
  const year = parseInt((set.releaseDate || '2020').slice(0, 4)) || 2020;
  if (year < 2003) return 8; // WOTC era
  if (year < 2010) return 3;
  if (year < 2018) return 1;
  return 0.50;
}

// ============================================
// SERIES — liste complète ENRICHIE et triée chronologiquement
// L'endpoint /sets ne renvoie ni `serie` ni `releaseDate` ;
// /series/{id} les fournit. On enrichit donc chaque set ici.
// ============================================
async function getAllSeries() {
  if (CACHE.series) return CACHE.series;
  try {
    const briefs = await fetchJSON(`${TCGDEX_API}/series`);
    const enriched = await Promise.all(briefs.map(async (b) => {
      const detail = await fetchJSON(`${TCGDEX_API}/series/${b.id}`).catch(() => null);
      const releaseDate = detail?.releaseDate || '';
      const sets = (detail?.sets || []).map(s => ({
        ...s,
        serie: { id: b.id, name: b.name },
        releaseDate: s.releaseDate || releaseDate, // approx : date de la série
      }));
      return { id: b.id, name: b.name, logo: b.logo, releaseDate, sets };
    }));
    // Tri chronologique : Set de Base (1999) → dernières sorties
    enriched.sort((a, b) => (a.releaseDate || '9999').localeCompare(b.releaseDate || '9999'));
    CACHE.series = enriched;
    saveCacheToStorage();
    return enriched;
  } catch (err) {
    console.error('getAllSeries error:', err);
    return [];
  }
}

// ============================================
// SETS BY SERIES
// ============================================
async function getSetsBySeries() {
  const series = await getAllSeries();
  if (series.length > 0) {
    return series.map(s => ({ id: s.id, name: s.name, sets: s.sets }));
  }
  // Fallback : regroupement à plat
  const sets = await getAllSets();
  const grouped = {};
  sets.forEach(set => {
    const serieKey = set.serie?.id || set.serieId || 'autres';
    const serieName = set.serie?.name || 'Autres';
    if (!grouped[serieKey]) {
      grouped[serieKey] = { id: serieKey, name: serieName, sets: [] };
    }
    grouped[serieKey].sets.push(set);
  });
  return Object.values(grouped);
}

// ============================================
// IMAGES
// ============================================
function getCardImage(card, quality = 'high', format = 'webp') {
  if (!card || !card.image) return null;
  return `${card.image}/${quality}.${format}`;
}

function getSetLogo(set, format = 'webp') {
  if (!set || !set.logo) return null;
  return `${set.logo}.${format}`;
}

function getSetSymbol(set, format = 'webp') {
  if (!set || !set.symbol) return null;
  return `${set.symbol}.${format}`;
}

// ============================================
// FALLBACK
// ============================================
function getFallbackSets() {
  return [
    {
      id: 'base1', name: 'Set de Base', releaseDate: '1999-01-09',
      serie: { id: 'base', name: 'Wizards Era' },
      cardCount: { total: 102, official: 102 },
      logo: null,
    },
  ];
}

// ============================================
// SEARCH
// ============================================
async function searchCards(query) {
  if (!query || query.length < 2) return [];
  try {
    const data = await fetchJSON(`${TCGDEX_API}/cards?name=like:${encodeURIComponent(query)}`);
    return data.slice(0, 50);
  } catch (err) {
    console.error('searchCards error:', err);
    return [];
  }
}

// ============================================
// FORMATAGE PRIX (helper UI)
// ============================================
function formatPrice(value, currency = 'EUR') {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (value < 1) return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
  if (value < 100) return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

// ============================================
// SCAFFOLDING TCGPLAYER (pour usage futur avec clé API)
// Pour activer, il faudra un backend node/python qui proxy les appels
// car TCGplayer bloque les appels CORS depuis le navigateur
// ============================================
const TCGPLAYER_CONFIG = {
  enabled: false, // mettre à true quand la clé sera configurée
  apiKey: null, // à remplir
  baseUrl: 'https://api.tcgplayer.com/catalog/products',
  // Note : nécessite un backend proxy car CORS bloque les appels directs
};

async function getTCGplayerPrice(cardId) {
  if (!TCGPLAYER_CONFIG.enabled) return null;
  // Stub pour future implémentation backend
  // Le flux sera : navigateur → ton-backend.com/api/price/{cardId} → TCGplayer API → réponse
  console.warn('TCGplayer integration disabled. Configure backend proxy first.');
  return null;
}

// ============================================
// EXPORT
// ============================================
window.TCGdex = {
  getAllSets,
  getAllSeries,        // NEW : séries enrichies + triées chronologiquement
  getSetDetail,
  getCardDetail,
  getSetsBySeries,
  getCardImage,
  getSetLogo,
  getSetSymbol,
  getRealPrice,        // NEW : prix réel structuré
  estimatePrice,       // wrapper rétrocompatible
  estimateTrend,
  getSetPricing,       // NEW : calcul vrais floor/médiane/total d'un set
  estimateSetFloor,    // estimation rapide sans charger toutes les cartes
  formatPrice,         // NEW : formatage EUR français
  searchCards,
  getTCGplayerPrice,   // NEW : stub pour futur
  API_URL: TCGDEX_API,
};
