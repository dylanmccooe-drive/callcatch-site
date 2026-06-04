# CallCatch site

Static landing page for CallCatch.

This version is the simple no-Supabase, no-Stripe website so it can deploy green without paid services.

## View locally

```bash
npm install
npm run dev
```

Or open `index.html` directly in a browser.

## Build

```bash
npm run build
```

The website is copied to `dist/`.

## Deploy

### Vercel

Use:

- Build command: `npm run build`
- Output directory: `dist`

### Cloudflare

This repo includes `wrangler.toml` and `src/worker.js` for a static Workers deployment.
Build command:

```bash
npm run build
```
