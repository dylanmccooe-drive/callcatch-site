// Rate limit: 10 requests per IP per minute, per isolate (in-memory).
// For global rate limiting add a Cloudflare WAF Rate Limiting rule in the dashboard.
const rlMap = new Map(); // ip -> { ts: number, count: number }
const RL_WINDOW_MS = 60_000;
const RL_MAX = 10;

const FALLBACK_ORIGIN = "https://callcatch.uk";

function trimTrailingSlash(value) {
  return String(value || "").endsWith("/") ? String(value).slice(0, -1) : String(value || "");
}

function siteUrl(request, env) {
  return trimTrailingSlash(env.PUBLIC_SITE_URL || new URL(request.url).origin);
}

// CORS is locked to PUBLIC_SITE_URL (callcatch.uk). The Vary: Origin header
// tells caches not to serve a callcatch.uk-scoped response to other origins.
function buildHeaders(request, env) {
  const allowed = trimTrailingSlash(env.PUBLIC_SITE_URL || FALLBACK_ORIGIN);
  const origin = request.headers.get("origin") || "";
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin === allowed ? origin : allowed,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "vary": "Origin",
    "x-content-type-options": "nosniff"
  };
}

function json(data, status = 200, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rlMap.get(ip);
  if (!entry || now - entry.ts > RL_WINDOW_MS) {
    rlMap.set(ip, { ts: now, count: 1 });
    return true;
  }
  if (entry.count >= RL_MAX) return false;
  entry.count++;
  return true;
}

async function getSupabaseUser(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("Please log in first.");
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured yet.");
  }

  const response = await fetch(trimTrailingSlash(env.SUPABASE_URL) + "/auth/v1/user", {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: "Bearer " + token
    }
  });

  if (!response.ok) throw new Error("Your login expired. Please log in again.");
  return response.json();
}

async function createCheckoutSession(request, env, headers) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
    return json({ error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Cloudflare." }, 503, headers);
  }

  let user;
  try {
    user = await getSupabaseUser(request, env);
  } catch (error) {
    return json({ error: error.message }, 401, headers);
  }

  const base = siteUrl(request, env);
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("customer_email", user.email || "");
  params.set("line_items[0][price]", env.STRIPE_PRICE_ID);
  params.set("line_items[0][quantity]", "1");
  params.set("subscription_data[trial_period_days]", "21");
  params.set("payment_method_collection", "always");
  params.set("allow_promotion_codes", "true");
  params.set("success_url", base + "/dashboard.html?checkout=success");
  params.set("cancel_url", base + "/dashboard.html?checkout=cancelled");
  params.set("metadata[user_id]", user.id);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.STRIPE_SECRET_KEY,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const payload = await response.json();

  if (!response.ok) {
    return json({ error: payload.error?.message || "Stripe checkout failed." }, 400, headers);
  }

  return json({ url: payload.url }, 200, headers);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = buildHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === "/api/config") {
      return json({
        supabaseUrl: env.SUPABASE_URL || "",
        supabaseAnonKey: env.SUPABASE_ANON_KEY || "",
        stripePriceId: env.STRIPE_PRICE_ID || "",
        siteUrl: siteUrl(request, env)
      }, 200, headers);
    }

    if (url.pathname === "/api/create-checkout-session" && request.method === "POST") {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      if (!checkRateLimit(ip)) {
        return json({ error: "Too many requests. Please wait a minute and try again." }, 429, headers);
      }
      return createCheckoutSession(request, env, headers);
    }

    return env.ASSETS.fetch(request);
  }
};
