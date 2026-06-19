/**
 * Supabase Database Configuration
 * 
 * It reads credentials from `window.ENV` (configured in `env.js`).
 * If no configuration is supplied, the application falls back to LocalStorage.
 */

// Read from global ENV configuration object
const SUPABASE_URL = (window.ENV && window.ENV.SUPABASE_URL) || ""; 
const SUPABASE_ANON_KEY = (window.ENV && window.ENV.SUPABASE_ANON_KEY) || ""; 

window.SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,
  enabled: !!(
    SUPABASE_URL.trim() && 
    SUPABASE_ANON_KEY.trim() && 
    !SUPABASE_URL.includes("your-project-id")
  )
};

window.supabaseClientInstance = null;

// Global helper to get the initialized client
window.getSupabaseClient = function() {
  if (window.supabaseClientInstance) {
    return window.supabaseClientInstance;
  }
  if (window.SUPABASE_CONFIG.enabled && typeof supabase !== 'undefined') {
    try {
      window.supabaseClientInstance = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
      return window.supabaseClientInstance;
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
    }
  }
  return null;
};

// Auto-initialize the client state
if (window.getSupabaseClient()) {
  console.log("Supabase client initialized successfully from env.js configuration.");
}
