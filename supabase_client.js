// ===============================================
// SUPABASE-CLIENT.JS
// Wrapper centralisé pour parler à Supabase
// ===============================================
const SUPABASE_URL = "https://gokzpxfcjregjuilfezi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdva3pweGZjanJlZ2p1aWxmZXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODQ3MzgsImV4cCI6MjA5NDk2MDczOH0.ET0amaYI8K236xqo-CRmFRjEG3aCh5sKsOW2OTpGe4g";

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
window.supabaseClient = initSupabase();


window.supabaseClient = initSupabase();

// ✅ Ajoute ces 2 lignes pour que auth.js le trouve
window.SupabaseClient = { client: window.supabaseClient };