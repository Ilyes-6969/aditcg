// ============================================
// SUPABASE-CLIENT.JS
// Wrapper centralisé pour parler à Supabase
// ============================================

const SUPABASE_URL = 'https://gokzpxfcjregjuilfezi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ToAttdBfi1mIfS4DXNIZVQ_aSeJweQP';

// Le client Supabase est chargé via CDN dans les HTML
// On crée le client global ici
let supabase = null;

function initSupabase() {
  if (supabase) return supabase;
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase SDK pas chargé. Vérifie le <script> CDN dans le HTML.');
    return null;
  }
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return supabase;
}

// ============================================
// EXPORT (sera utilisé par auth.js, storage.js, etc.)
// ============================================

window.SupabaseClient = {
  init: initSupabase,
  get client() { return supabase || initSupabase(); },
  url: SUPABASE_URL,
};

// Auto-init immediately
initSupabase();
