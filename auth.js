// ============================================
// AUTH.JS — Authentification réelle via Supabase
// ============================================

(function() {
  'use strict';

  // Already loaded? Skip
  if (window.Auth && window.Auth.signup) return;

  let _currentUser = null;       // { id, email, ... }
  let _currentProfile = null;    // { id, username, name, avatar_*, ... }
  let _authListeners = [];

// ============================================
// INIT — récupère la session existante au chargement
// ============================================
let _initPromise = null;
function initAuth() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const sb = window.SupabaseClient?.client;
    if (!sb) {
      console.error('Supabase pas initialisé');
      return;
    }

    // Get current session
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      _currentUser = session.user;
      await loadProfile();
    }

    // Listen to auth state changes (once)
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        _currentUser = session.user;
        await loadProfile();
        _authListeners.forEach(cb => cb('signed_in', _currentUser));
      } else if (event === 'SIGNED_OUT') {
        _currentUser = null;
        _currentProfile = null;
        _authListeners.forEach(cb => cb('signed_out'));
      } else if (event === 'USER_UPDATED' && session?.user) {
        _currentUser = session.user;
        await loadProfile();
      }
    });
  })();
  return _initPromise;
}

async function loadProfile() {
  if (!_currentUser) return null;
  const sb = window.SupabaseClient?.client;
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', _currentUser.id)
    .single();

  if (error) {
    console.warn('loadProfile error:', error);
    return null;
  }
  _currentProfile = data;
  return data;
}

// ============================================
// PUBLIC API
// ============================================

function isLoggedIn() {
  return _currentUser !== null;
}

function getCurrentUser() {
  // Returns a merged view (auth user + profile)
  if (!_currentUser) return null;
  return {
    id: _currentUser.id,
    email: _currentUser.email,
    ..._currentProfile,
    // Add legacy field used by some UI code
    avatar: _currentProfile?.name?.charAt(0).toUpperCase() || '?',
    stats: {
      rating: _currentProfile?.rating || 5.0,
      sales: _currentProfile?.sales_count || 0,
      trades: _currentProfile?.trades_count || 0,
      reviews: _currentProfile?.reviews_count || 0,
    },
    createdAt: _currentProfile?.created_at ? new Date(_currentProfile.created_at).getTime() : Date.now(),
    avatarType: _currentProfile?.avatar_type || 'default',
    avatarValue: _currentProfile?.avatar_value,
    avatarUrl: _currentProfile?.avatar_url,
    location: _currentProfile?.location || 'France',
    name: _currentProfile?.name || 'Dresseur',
    username: _currentProfile?.username || 'user',
  };
}

async function signup({ name, email, password, username }) {
  // Validation
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Nom invalide (min 2 caractères)');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('Email invalide');
  if (!password || password.length < 6) errors.push('Mot de passe trop court (min 6 caractères)');
  if (!username || username.trim().length < 3) errors.push('Nom d\'utilisateur invalide (min 3 caractères)');
  if (errors.length > 0) return { success: false, errors };

  const sb = window.SupabaseClient?.client;
  if (!sb) return { success: false, errors: ['Supabase non disponible'] };

  // Check username availability first
  const { data: existing } = await sb
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return { success: false, errors: ['Ce nom d\'utilisateur est déjà pris'] };
  }

  // Sign up via Supabase Auth
  const { data, error } = await sb.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
        name: name.trim(),
      },
    },
  });

  if (error) {
    let msg = error.message;
    if (msg.includes('already registered')) msg = 'Cet email est déjà utilisé';
    return { success: false, errors: [msg] };
  }

  // The trigger handle_new_user() creates the profile automatically
  _currentUser = data.user;
  await loadProfile();

  return { success: true, user: getCurrentUser() };
}

async function login({ email, password }) {
  const errors = [];
  if (!email) errors.push('Email requis');
  if (!password) errors.push('Mot de passe requis');
  if (errors.length > 0) return { success: false, errors };

  const sb = window.SupabaseClient?.client;
  if (!sb) return { success: false, errors: ['Supabase non disponible'] };

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    let msg = error.message;
    if (msg.includes('Invalid login')) msg = 'Email ou mot de passe incorrect';
    return { success: false, errors: [msg] };
  }

  _currentUser = data.user;
  await loadProfile();

  return { success: true, user: getCurrentUser() };
}

async function logout() {
  const sb = window.SupabaseClient?.client;
  if (sb) await sb.auth.signOut();
  _currentUser = null;
  _currentProfile = null;
}

async function updateProfile(updates) {
  if (!_currentUser) return false;
  const sb = window.SupabaseClient?.client;

  // Map JS-style camelCase keys to snake_case DB columns
  const mapped = {};
  if ('avatarType' in updates) mapped.avatar_type = updates.avatarType;
  if ('avatarValue' in updates) mapped.avatar_value = updates.avatarValue;
  if ('avatarUrl' in updates) mapped.avatar_url = updates.avatarUrl;
  if ('name' in updates) mapped.name = updates.name;
  if ('bio' in updates) mapped.bio = updates.bio;
  if ('location' in updates) mapped.location = updates.location;

  const { error } = await sb
    .from('profiles')
    .update(mapped)
    .eq('id', _currentUser.id);

  if (error) {
    console.error('updateProfile error:', error);
    return false;
  }
  await loadProfile();
  return true;
}

// Public utility: search users by username/name
async function searchUsers(query) {
  if (!query || query.length < 2) return [];
  const sb = window.SupabaseClient?.client;
  if (!sb) return [];

  const q = query.toLowerCase().trim();
  const { data, error } = await sb
    .from('profiles')
    .select('id, username, name, avatar_type, avatar_value, avatar_url, location, rating')
    .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
    .limit(8);

  if (error) {
    console.warn('searchUsers error:', error);
    return [];
  }
  return data || [];
}

// Listener for auth state changes (UI updates)
function onAuthChange(callback) {
  _authListeners.push(callback);
}

// Compatibility shim — old code may call ensureDemoUser
function ensureDemoUser() {
  // No-op now : pas de seed avec Supabase, les vrais users s'inscrivent
}

// ============================================
// EXPORT
// ============================================

window.Auth = {
  init: initAuth,
  isLoggedIn,
  getCurrentUser,
  signup,
  login,
  logout,
  updateProfile,
  searchUsers,
  onAuthChange,
  ensureDemoUser,
};

})();
