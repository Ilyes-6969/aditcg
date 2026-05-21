// ============================================
// STORAGE.JS — Données persistantes via Supabase
// Collections, favoris, échanges, activité
// ============================================
//
// Stratégie : on lit/écrit en direct sur Supabase.
// Pour la perf, on cache les listes en mémoire pendant la session.
// Toute écriture invalide le cache.

const _cache = {
  collection: null,    // [{ id, card_id, condition, quantity }]
  favorites: null,     // [{ id, card_id }]
  trades: null,
  activity: null,
  listings: null,
};

function invalidate(key) {
  if (key) _cache[key] = null;
  else Object.keys(_cache).forEach(k => _cache[k] = null);
}

function getUserId() {
  return window.Auth?.getCurrentUser()?.id || null;
}

// ============================================
// COLLECTION
// ============================================

async function getCollection() {
  if (_cache.collection) return _cache.collection.map(c => c.card_id);
  const userId = getUserId();
  if (!userId) return [];
  const sb = window.SupabaseClient?.client;
  const { data, error } = await sb
    .from('collections')
    .select('id, card_id, condition, quantity, added_at')
    .eq('user_id', userId);
  if (error) { console.warn(error); return []; }
  _cache.collection = data || [];
  return _cache.collection.map(c => c.card_id);
}

async function isOwned(cardId) {
  const list = await getCollection();
  return list.includes(cardId);
}

async function addToCollection(cardId, options = {}) {
  const userId = getUserId();
  if (!userId) return false;
  const sb = window.SupabaseClient?.client;
  const { error } = await sb.from('collections').insert({
    user_id: userId,
    card_id: cardId,
    condition: options.condition || 'NM',
    quantity: options.quantity || 1,
  });
  if (error && !error.message.includes('duplicate')) {
    console.error('addToCollection:', error);
    return false;
  }
  invalidate('collection');
  await addActivity('collection', `Carte ajoutée : ${cardId}`);
  return true;
}

async function removeFromCollection(cardId) {
  const userId = getUserId();
  if (!userId) return false;
  const sb = window.SupabaseClient?.client;
  const { error } = await sb.from('collections')
    .delete()
    .eq('user_id', userId)
    .eq('card_id', cardId);
  if (error) { console.error(error); return false; }
  invalidate('collection');
  await addActivity('collection', `Carte retirée : ${cardId}`);
  return true;
}

async function toggleOwned(cardId) {
  const owned = await isOwned(cardId);
  if (owned) {
    await removeFromCollection(cardId);
    return false;
  }
  await addToCollection(cardId);
  return true;
}

// ============================================
// FAVORITES
// ============================================

async function getFavorites() {
  if (_cache.favorites) return _cache.favorites.map(f => f.card_id);
  const userId = getUserId();
  if (!userId) return [];
  const sb = window.SupabaseClient?.client;
  const { data, error } = await sb
    .from('favorites')
    .select('id, card_id, added_at')
    .eq('user_id', userId);
  if (error) { console.warn(error); return []; }
  _cache.favorites = data || [];
  return _cache.favorites.map(f => f.card_id);
}

async function isFavorite(cardId) {
  const list = await getFavorites();
  return list.includes(cardId);
}

async function toggleFavorite(cardId) {
  const userId = getUserId();
  if (!userId) return false;
  const sb = window.SupabaseClient?.client;
  const isFav = await isFavorite(cardId);

  if (isFav) {
    await sb.from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId);
    invalidate('favorites');
    return false;
  } else {
    await sb.from('favorites').insert({ user_id: userId, card_id: cardId });
    invalidate('favorites');
    return true;
  }
}

// ============================================
// LISTINGS (annonces de vente/échange)
// ============================================

async function getListings(filter = {}) {
  const sb = window.SupabaseClient?.client;
  let q = sb.from('listings').select('*').eq('status', 'active');
  if (filter.userId) q = q.eq('seller_id', filter.userId);
  if (filter.cardId) q = q.eq('card_id', filter.cardId);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) { console.warn(error); return []; }
  return data || [];
}

async function addListing({ cardId, type, price, condition, description }) {
  const userId = getUserId();
  if (!userId) return false;
  const sb = window.SupabaseClient?.client;
  const { data, error } = await sb.from('listings').insert({
    seller_id: userId,
    card_id: cardId,
    type: type || 'sale',
    price: price || null,
    condition: condition || 'NM',
    description: description || null,
    status: 'active',
  }).select().single();
  if (error) { console.error(error); return false; }
  await addActivity('listing', `Mise en ${type === 'sale' ? 'vente' : 'échange'} : ${cardId}`);
  return data;
}

async function removeListing(listingId) {
  const userId = getUserId();
  if (!userId) return false;
  const sb = window.SupabaseClient?.client;
  const { error } = await sb.from('listings')
    .update({ status: 'cancelled' })
    .eq('id', listingId)
    .eq('seller_id', userId);
  if (error) { console.error(error); return false; }
  return true;
}

// ============================================
// TRADES
// ============================================

async function getTrades() {
  if (_cache.trades) return _cache.trades;
  const userId = getUserId();
  if (!userId) return [];
  const sb = window.SupabaseClient?.client;
  const { data, error } = await sb
    .from('trades')
    .select('*')
    .or(`proposer_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) { console.warn(error); return []; }
  _cache.trades = data || [];
  return _cache.trades;
}

async function createTrade({ give, receive, partner, recipientId, message }) {
  const userId = getUserId();
  if (!userId) return null;
  const sb = window.SupabaseClient?.client;

  // Normalize: arrays of card IDs OR { card_id, condition } objects
  const normGive = give.map(g => typeof g === 'string' ? { card_id: g, condition: 'NM' } : g);
  const normRecv = receive.map(r => typeof r === 'string' ? { card_id: r, condition: 'NM' } : r);

  const { data, error } = await sb.from('trades').insert({
    proposer_id: userId,
    recipient_id: recipientId || null,
    give_cards: normGive,
    receive_cards: normRecv,
    message: message || null,
    status: 'pending',
  }).select().single();

  if (error) { console.error(error); return null; }
  invalidate('trades');
  await addActivity('trade', `Échange proposé${partner ? ' à ' + partner : ''}`);
  return data;
}

async function updateTradeStatus(tradeId, status) {
  const userId = getUserId();
  if (!userId) return false;
  const sb = window.SupabaseClient?.client;
  const { error } = await sb.from('trades')
    .update({ status })
    .eq('id', tradeId);
  if (error) { console.error(error); return false; }
  invalidate('trades');
  await addActivity('trade', `Échange ${status === 'accepted' ? 'accepté' : status === 'rejected' ? 'refusé' : 'mis à jour'}`);
  return true;
}

// ============================================
// ACTIVITY
// ============================================

async function getActivity() {
  if (_cache.activity) return _cache.activity;
  const userId = getUserId();
  if (!userId) return [];
  const sb = window.SupabaseClient?.client;
  const { data, error } = await sb
    .from('activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.warn(error); return []; }
  _cache.activity = (data || []).map(a => ({
    type: a.type,
    message: a.message,
    createdAt: new Date(a.created_at).getTime(),
  }));
  return _cache.activity;
}

async function addActivity(type, message, metadata) {
  const userId = getUserId();
  if (!userId) return;
  const sb = window.SupabaseClient?.client;
  await sb.from('activity').insert({
    user_id: userId,
    type,
    message,
    metadata: metadata || null,
  });
  invalidate('activity');
}

// ============================================
// PORTFOLIO (calculé en temps réel à partir de la collection)
// On stocke pas l'historique pour l'instant — pourra être ajouté plus tard
// avec une table dédiée ou un cron Supabase
// ============================================

async function recordPortfolioValue(value) {
  // No-op for now — would require a portfolio_history table
}

async function getPortfolioHistory() {
  return []; // Empty — chart will show "Pas encore assez de données"
}

// ============================================
// SEED DEMO DATA — n'est plus appelé avec Supabase
// (les vrais users s'inscrivent et commencent vide)
// ============================================
function seedDemoData() {
  // No-op
}

// ============================================
// EXPORT
// ============================================

window.Storage = {
  getCollection, isOwned, toggleOwned, addToCollection, removeFromCollection,
  getFavorites, isFavorite, toggleFavorite,
  getListings, addListing, removeListing,
  getTrades, createTrade, updateTradeStatus,
  getActivity, addActivity,
  recordPortfolioValue, getPortfolioHistory,
  seedDemoData,
  invalidate,
};
