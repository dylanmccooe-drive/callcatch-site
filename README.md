# CallCatch SaaS

Production-ready Next.js SaaS conversion of the original CallCatch landing page.

## Stack

- Next.js App Router for Vercel deployment
- Supabase Auth and Postgres customer storage
- Stripe Checkout subscriptions and Billing Portal
- 21-day free trial, then £45/month via the configured Stripe Price

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with Supabase and Stripe credentials.

## Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_saas.sql` in the SQL editor or with the Supabase CLI.
3. Enable email/password authentication.
4. Add your deployed callback URL in Supabase Auth settings:
   - `https://your-domain.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` for local development
5. Add admin users either by:
   - setting `ADMIN_EMAILS=you@example.com`, or
   - inserting a row into `public.admin_users` with the user UUID.

Customers are stored in `public.customers`; Stripe subscription state is mirrored into
`public.subscriptions`.

## Stripe

Create a recurring monthly Price in Stripe:

- Currency: GBP
- Amount: £45.00
- Interval: monthly

Set the Price ID as `STRIPE_PRICE_ID`. The app creates Checkout Sessions with
`trial_period_days: 21`, then Stripe charges £45/month after the trial.

Create a webhook endpoint:

```text
https://your-domain.vercel.app/api/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Vercel deployment

1. Import the repository into Vercel.
2. Add all variables from `.env.example`.
3. Deploy.

The included `vercel.json` selects the Next.js framework and London region.

## Key routes

- `/` - existing landing page design, wired to SaaS signup
- `/signup` - Supabase signup and customer profile creation
- `/login` - Supabase login
- `/dashboard` - protected customer dashboard
- `/admin` - protected admin dashboard
- `/api/stripe/create-checkout-session` - Stripe trial subscription checkout
- `/api/stripe/create-portal-session` - Stripe Billing Portal
- `/api/stripe/webhook` - Stripe subscription sync