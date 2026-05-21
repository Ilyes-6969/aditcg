// ============================================
// STORAGE.JS — Données persistantes utilisateur
// Collections, favoris, échanges, activité
// ============================================

const DATA_KEY_PREFIX = 'aditcg_userdata_';

function getUserKey() {
  const user = window.Auth?.getCurrentUser();
  if (!user) return DATA_KEY_PREFIX + 'guest';
  return DATA_KEY_PREFIX + user.id;
}

function getUserData() {
  try {
    const raw = localStorage.getItem(getUserKey());
    if (!raw) return getDefaultData();
    return { ...getDefaultData(), ...JSON.parse(raw) };
  } catch {
    return getDefaultData();
  }
}

function saveUserData(data) {
  localStorage.setItem(getUserKey(), JSON.stringify(data));
}

function getDefaultData() {
  return {
    collection: [], // tableau d'IDs de cartes possédées
    favorites: [],  // IDs cartes
    listings: [],   // [{ cardId, type:'sale'|'trade', price, condition, createdAt }]
    trades: [],     // [{ id, give:[ids], receive:[ids], partner, status, createdAt }]
    activity: [],   // [{ type, message, createdAt }]
    portfolio: {}, // { 'YYYY-MM-DD': totalValue }
  };
}

// ============================================
// COLLECTION
// ============================================

function getCollection() { return getUserData().collection; }

function isOwned(cardId) {
  return getUserData().collection.includes(cardId);
}

function toggleOwned(cardId) {
  const data = getUserData();
  const idx = data.collection.indexOf(cardId);
  if (idx >= 0) {
    data.collection.splice(idx, 1);
    addActivity('collection', `Carte retirée de la collection : ${cardId}`);
  } else {
    data.collection.push(cardId);
    addActivity('collection', `Carte ajoutée : ${cardId}`);
  }
  saveUserData(data);
  return data.collection.includes(cardId);
}

function addToCollection(cardId) {
  const data = getUserData();
  if (!data.collection.includes(cardId)) {
    data.collection.push(cardId);
    addActivity('collection', `Carte ajoutée : ${cardId}`);
    saveUserData(data);
    return true;
  }
  return false;
}

function removeFromCollection(cardId) {
  const data = getUserData();
  const idx = data.collection.indexOf(cardId);
  if (idx >= 0) {
    data.collection.splice(idx, 1);
    saveUserData(data);
    return true;
  }
  return false;
}

// ============================================
// FAVORITES
// ============================================

function getFavorites() { return getUserData().favorites; }

function isFavorite(cardId) { return getUserData().favorites.includes(cardId); }

function toggleFavorite(cardId) {
  const data = getUserData();
  const idx = data.favorites.indexOf(cardId);
  if (idx >= 0) data.favorites.splice(idx, 1);
  else data.favorites.push(cardId);
  saveUserData(data);
  return data.favorites.includes(cardId);
}

// ============================================
// LISTINGS (annonces de vente/échange)
// ============================================

function getListings() { return getUserData().listings; }

function addListing({ cardId, type, price, condition }) {
  const data = getUserData();
  data.listings.push({
    id: 'l_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    cardId, type, price, condition: condition || 'NM',
    createdAt: Date.now(),
  });
  addActivity('listing', `Mise en ${type === 'sale' ? 'vente' : 'échange'} : ${cardId}`);
  saveUserData(data);
}

function removeListing(listingId) {
  const data = getUserData();
  data.listings = data.listings.filter(l => l.id !== listingId);
  saveUserData(data);
}

// ============================================
// TRADES
// ============================================

function getTrades() { return getUserData().trades; }

function createTrade({ give, receive, partner, message }) {
  const data = getUserData();
  const trade = {
    id: 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    give, receive, partner: partner || 'Communauté', message: message || '',
    status: 'pending', // pending | accepted | rejected | completed
    createdAt: Date.now(),
  };
  data.trades.push(trade);
  addActivity('trade', `Échange proposé à ${trade.partner}`);
  saveUserData(data);
  return trade;
}

function updateTradeStatus(tradeId, status) {
  const data = getUserData();
  const trade = data.trades.find(t => t.id === tradeId);
  if (trade) {
    trade.status = status;
    addActivity('trade', `Échange ${status === 'accepted' ? 'accepté' : status === 'rejected' ? 'refusé' : 'mis à jour'}`);
    saveUserData(data);
  }
}

// ============================================
// ACTIVITY
// ============================================

function getActivity() { return getUserData().activity; }

function addActivity(type, message) {
  const data = getUserData();
  data.activity.unshift({
    type, message,
    createdAt: Date.now(),
  });
  // Garde uniquement les 100 dernières
  if (data.activity.length > 100) data.activity = data.activity.slice(0, 100);
  saveUserData(data);
}

// ============================================
// PORTFOLIO (snapshot quotidien de la valeur)
// ============================================

function recordPortfolioValue(value) {
  const data = getUserData();
  const today = new Date().toISOString().slice(0, 10);
  data.portfolio[today] = value;
  // Garde uniquement les 12 derniers mois
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const cutoffStr = new Date(cutoff).toISOString().slice(0, 10);
  Object.keys(data.portfolio).forEach(d => {
    if (d < cutoffStr) delete data.portfolio[d];
  });
  saveUserData(data);
}

function getPortfolioHistory() {
  const p = getUserData().portfolio;
  return Object.entries(p)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================
// SEED DEMO DATA (pour avoir une démo riche dès la 1re visite)
// ============================================

function seedDemoData() {
  const data = getUserData();
  if (data.collection.length > 0) return; // déjà seedée

  const demoCards = [
    'base1-4', 'base1-15', 'base1-25', 'base1-11',
    'sv03.5-9', 'sv03.5-25', 'sv03.5-150',
    'swsh4-44', 'swsh4-29',
    'neo1-9', 'xy12-12', 'swsh7-150',
  ];
  data.collection = demoCards;
  data.favorites = ['base1-4', 'sv03.5-9', 'neo1-9'];

  // Activité initiale
  data.activity = [
    { type: 'collection', message: 'Bienvenue sur ADITCG !', createdAt: Date.now() },
    { type: 'system', message: 'Compte démo créé avec 12 cartes', createdAt: Date.now() - 3600000 },
  ];

  // Pas de portfolio mock : l'historique se construit naturellement à chaque visite
  // via recordPortfolioValue() avec la VRAIE valeur du portefeuille

  saveUserData(data);
}

window.Storage = {
  getCollection, isOwned, toggleOwned, addToCollection, removeFromCollection,
  getFavorites, isFavorite, toggleFavorite,
  getListings, addListing, removeListing,
  getTrades, createTrade, updateTradeStatus,
  getActivity, addActivity,
  recordPortfolioValue, getPortfolioHistory,
  seedDemoData,
};
