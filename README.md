# kosanggurmerah

Single-page dashboard (React + Vite + TypeScript + Supabase) for boarding house / cost management.

## Stack

- Vite + React 18
- TypeScript
- TailwindCSS
- Supabase (auth + Postgres)
- TanStack Query
- Vitest for tests

## Local Development

1. Copy `.env.example` to `.env` and fill in Supabase credentials.
2. Install deps: `npm install`
3. Run dev server: `npm run dev`

## Environment Variables

Required (public) keys from Supabase:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

These are safe to expose in the frontend (anon key) but keep service role keys out of the repo.

## Deploy to Vercel

1. Push this repository to GitHub (already connected).
2. In Vercel: New Project > Import the repo.
3. Framework Preset: Vite.
4. Build Command: `npm run build` (default)  
   Output Directory: `dist`
5. Add Environment Variables (same names as in `.env.example`). Use Production + Preview scopes.
6. Deploy.

### Post-Deploy Checklist

- Test login with a valid Supabase user (email/password).
- Check console for "Supabase connection failed" toast (should not appear).
- Run a data fetch action to confirm RLS policies allow intended reads.

## Running Tests

`npm test` or `npm run test:coverage`

## Formatting / Linting

`npm run lint` and `npm run typecheck`

## Common Issues

| Issue                                    | Fix                                                                               |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Runtime error: Supabase env vars missing | Ensure Vercel env vars set and new deployment triggered                           |
| 404s on refresh (SPA)                    | Vercel handles index.html automatically for static output; no extra config needed |
| Auth session not persisting              | Check browser blocks third-party cookies; Supabase uses local storage             |

## License

Private / Internal.
