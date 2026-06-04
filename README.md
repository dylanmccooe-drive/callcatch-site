# CallCatch site

Simple static launch website for CallCatch.

No Supabase. No Stripe. No extra paid services required.

## How it works

- Landing page sells the service
- Start Trial page opens WhatsApp with customer details
- Dashboard/Admin pages are visual mockups for now
- You can manually onboard customers and take payment later

## Build

```bash
npm install
npm run build
```

The site builds to `dist/`.

## Pages

- `/` - landing page
- `/signup.html` - WhatsApp trial request
- `/login.html` - disabled/coming-later login page
- `/dashboard.html` - visual dashboard mockup
- `/admin.html` - visual admin mockup
