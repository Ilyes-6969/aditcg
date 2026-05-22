// ============================================
// SUPABASE-CLIENT.JS
// Wrapper centralisé pour parler à Supabase
// Safe contre les doubles inclusions
// ============================================

(function() {
  'use strict';

  // Already loaded? Skip re-initialization
  if (window.SupabaseClient && window.SupabaseClient.client) {
    return;
  }

  const SUPABASE_URL = 'https://gokzpxfcjregjuilfezi.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_ToAttdBfi1mIfS4DXNIZVQ_aSeJweQP';

  let supabaseInstance = null;

  function initSupabase() {
    if (supabaseInstance) return supabaseInstance;
    if (typeof window.supabase === 'undefined') {
      console.error('[Supabase] SDK pas chargé. Vérifie le <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"> dans le HTML.');
      return null;
    }
    try {
      supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
      console.log('[Supabase] Client initialisé OK');
      return supabaseInstance;
    } catch (e) {
      console.error('[Supabase] Erreur d\'initialisation:', e);
      return null;
    }
  }

  // ============================================
  // EXPORT
  // ============================================

  window.SupabaseClient = {
    init: initSupabase,
    get client() { return supabaseInstance || initSupabase(); },
    url: SUPABASE_URL,
  };

  // Auto-init immediately
  initSupabase();

})();
