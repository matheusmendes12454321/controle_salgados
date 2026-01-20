// Configuração do Supabase
const SUPABASE_URL = 'sb_publishable_IzWWiA6Pi7HMy00TM6MtcA_eMD9Goxd'; // Substitua pela sua URL
const SUPABASE_ANON_KEY = 'sb_secret_wlSmWM40BSwewWIHlSO0Uw_R-uG83N-'; // Substitua pela sua chave

// Inicializar o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);