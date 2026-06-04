# CallCatch site

Static Cloudflare/Vercel website with real optional Supabase auth and Stripe checkout.

Supabase has a free tier. Stripe has no monthly fee, but takes a processing fee when someone pays.

## View locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The site builds to `dist/`.

## Free Supabase setup

1. Create a free Supabase project.
2. Go to Supabase SQL Editor.
3. Paste and run `supabase/migrations/001_initial_saas.sql`.
4. Go to Authentication > Providers and enable Email.
5. For easiest testing, turn off email confirmations at first.
6. Copy your Project URL and anon key into Cloudflare Worker variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

To make yourself admin:

1. Sign up on the website.
2. In Supabase, open Authentication > Users and copy your user ID.
3. Run this SQL:

```sql
insert into public.admin_users (user_id)
values ('PASTE-YOUR-USER-ID-HERE');
```

## Free Stripe setup

Stripe has no monthly subscription cost.

1. Create a Stripe account.
2. Use test mode first.
3. Create a product called CallCatch.
4. Add a recurring price: `£45 monthly`.
5. Copy the Price ID into Cloudflare as `STRIPE_PRICE_ID`.
6. Copy your Stripe secret key into Cloudflare as `STRIPE_SECRET_KEY`.

The dashboard button creates a Stripe Checkout subscription with a 21-day free trial.

## Cloudflare variables

Add these Worker variables:

```text
PUBLIC_SITE_URL=https://your-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
```

## Pages

- `/` - landing page
- `/signup.html` - real Supabase signup
- `/login.html` - real Supabase login
- `/dashboard.html` - customer dashboard + Stripe checkout
- `/admin.html` - Supabase admin customer list
