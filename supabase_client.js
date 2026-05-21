// ===============================================
// SUPABASE-CLIENT.JS
// Wrapper centralisé pour parler à Supabase
// ===============================================

const SUPABASE_URL = "https://gokzpxfcjcequjilfezi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ToAttdBfi1mIfS4DXNIZV_aSeJweQP";

let supabaseClient = null;

function initSupabase() {
  if (supabaseClient) return supabaseClient;

  if (typeof window.supabase === "undefined") {
    console.error("Supabase SDK pas chargé. Vérifie le script CDN dans le HTML.");
    return null;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  console.log("Supabase initialisé :", supabaseClient);
  return supabaseClient;
}

window.initSupabase = initSupabase;
window.supabaseClient = initSupabase();