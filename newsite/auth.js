// ============================================
// AUTH.JS — Système d'authentification (localStorage)
// Note : pour démo. Pour la prod, il faut un backend.
// ============================================

const AUTH_KEY = 'aditcg_auth_v1';
const USERS_KEY = 'aditcg_users_v1';

// ============================================
// HELPERS
// ============================================

function hashPassword(password) {
  // Hash simple pour démo. PROD : utiliser bcrypt côté serveur.
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'hash_' + hash.toString(36) + '_' + password.length;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    if (!auth) return null;
    const users = getUsers();
    return users.find(u => u.id === auth.userId) || null;
  } catch { return null; }
}

function setSession(userId) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId, since: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

// ============================================
// PUBLIC API
// ============================================

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function signup({ name, email, password, username }) {
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Nom invalide (min 2 caractères)');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('Email invalide');
  if (!password || password.length < 6) errors.push('Mot de passe trop court (min 6 caractères)');
  if (!username || username.trim().length < 3) errors.push('Nom d\'utilisateur invalide (min 3 caractères)');

  const users = getUsers();
  if (users.find(u => u.email === email.toLowerCase())) errors.push('Cet email est déjà utilisé');
  if (users.find(u => u.username === username.toLowerCase())) errors.push('Ce nom d\'utilisateur est déjà pris');

  if (errors.length > 0) return { success: false, errors };

  const user = {
    id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    username: username.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    avatar: name.trim().charAt(0).toUpperCase(),
    createdAt: Date.now(),
    stats: {
      rating: 5.0,
      sales: 0,
      trades: 0,
      reviews: 0,
    },
    location: 'France',
  };

  users.push(user);
  saveUsers(users);
  setSession(user.id);
  return { success: true, user };
}

function login({ email, password }) {
  const errors = [];
  if (!email) errors.push('Email requis');
  if (!password) errors.push('Mot de passe requis');
  if (errors.length > 0) return { success: false, errors };

  const users = getUsers();
  const user = users.find(u => u.email === email.toLowerCase().trim());
  if (!user) return { success: false, errors: ['Email ou mot de passe incorrect'] };
  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, errors: ['Email ou mot de passe incorrect'] };
  }
  setSession(user.id);
  return { success: true, user };
}

function logout() {
  clearSession();
}

function updateProfile(updates) {
  const user = getCurrentUser();
  if (!user) return false;
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx < 0) return false;
  Object.assign(users[idx], updates);
  saveUsers(users);
  return true;
}

// ============================================
// DEMO USER (existe pour se connecter facilement, sans auto-login)
// ============================================
function ensureDemoUser() {
  const users = getUsers();
  if (users.length === 0) {
    // Create demo user WITHOUT setting session
    const user = {
      id: 'u_demo_alex',
      name: 'Alex Dresseur',
      email: 'demo@aditcg.fr',
      username: 'alex_pkmn',
      passwordHash: hashPassword('demo1234'),
      avatar: 'A',
      createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000, // il y a 1 an
      stats: { rating: 4.9, sales: 23, trades: 17, reviews: 87 },
      location: 'France',
    };
    users.push(user);
    saveUsers(users);
  }
}

window.Auth = {
  isLoggedIn,
  getCurrentUser,
  signup,
  login,
  logout,
  updateProfile,
  ensureDemoUser,
};
