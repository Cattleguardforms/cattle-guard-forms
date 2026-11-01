# Cattle Guard Forms

Foundation repository for the Cattle Guard Forms application.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint
- Neroa database adapter
- Stripe client/server helpers

## Database

Neroa is the canonical operational database for Cattle Guard Forms.

The application currently uses `@supabase/supabase-js` as a compatible PostgREST/Auth transport SDK. That package name does not mean the production database is Supabase.

New code should use:

```txt
src/lib/neroa-db/
```

Legacy `src/lib/supabase/` helpers remain as compatibility wrappers so existing routes and the current production environment do not break during the migration.

Canonical environment variables:

```txt
NEXT_PUBLIC_NEROA_DATABASE_URL
NEXT_PUBLIC_NEROA_DATABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_NEROA_DATABASE_ANON_KEY
NEROA_DATABASE_SERVICE_ROLE_KEY
```

Legacy `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` variables remain supported as fallbacks.

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
3. Start local development server:
   ```bash
   npm run dev
   ```

## Lint
```bash
npm run lint
```

Deploy trigger for Echo BOL button - 2026-05-02
