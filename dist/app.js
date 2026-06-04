const SUPABASE_CDN = "https://esm.sh/@supabase/supabase-js@2";

let cachedConfig;
let cachedSupabase;

export async function getConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    cachedConfig = response.ok ? await response.json() : {};
  } catch {
    cachedConfig = {};
  }
  return cachedConfig;
}

export function hasSupabase(config) {
  return Boolean(config?.supabaseUrl && config?.supabaseAnonKey);
}

export function hasStripe(config) {
  return Boolean(config?.stripePriceId);
}

export async function getSupabase() {
  if (cachedSupabase) return cachedSupabase;
  const config = await getConfig();
  if (!hasSupabase(config)) return null;
  const { createClient } = await import(SUPABASE_CDN);
  cachedSupabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return cachedSupabase;
}

export function showMessage(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
  el.classList.toggle("error", isError);
}

export function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export async function getSession() {
  const supabase = await getSupabase();
  if (!supabase) return { supabase: null, session: null, user: null };
  const { data } = await supabase.auth.getSession();
  return { supabase, session: data.session, user: data.session?.user ?? null };
}

export async function requireUser() {
  const auth = await getSession();
  if (!auth.supabase) return auth;
  if (!auth.user) window.location.href = "/login.html";
  return auth;
}

export async function ensureCustomerProfile(supabase, user, extra = {}) {
  const metadata = user.user_metadata || {};
  const profile = {
    user_id: user.id,
    email: user.email,
    first_name: extra.first_name || metadata.first_name || null,
    last_name: extra.last_name || metadata.last_name || null,
    business_name: extra.business_name || metadata.business_name || null,
    mobile: extra.mobile || metadata.mobile || null,
    trade: extra.trade || metadata.trade || null,
    onboarding_status: "signup"
  };

  const { error } = await supabase.from("customers").upsert(profile, { onConflict: "user_id" });
  if (error) throw error;
  return profile;
}

export async function signOut() {
  const supabase = await getSupabase();
  if (supabase) await supabase.auth.signOut();
  window.location.href = "/login.html";
}

export async function startCheckout(accessToken) {
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken
    }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Could not start Stripe checkout");
  window.location.href = payload.url;
}
