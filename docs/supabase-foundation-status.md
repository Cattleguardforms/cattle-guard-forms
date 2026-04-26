# Supabase Foundation Status

## Current goal

Stabilize the Supabase foundation before more portal/backend feature work.

## Completed in this branch

- Hardened `.gitignore` so local env files and build artifacts are not committed.
- Removed committed `.env.local` from the repository.
- Replaced `.env.example` with placeholder-only values.
- Added `src/lib/supabase/env.ts` for centralized Supabase env validation.
- Added `src/lib/supabase/server.ts` for server and service-role admin clients.

## Existing Supabase assets already present

- `src/lib/supabase/client.ts` browser helper.
- `src/app/api/supabase-health/route.ts` health route for checking env and table access.
- `src/app/api/quote-intake/route.ts` quote/order intake route using Supabase.
- `supabase/live-setup.sql` additive live setup SQL for app profiles, distributor profiles, CRM, products, events, storage buckets, RLS enablement, and setup policies.
- `supabase/migrations/001_quote_intake_schema.sql` quote intake schema migration draft.
- `scripts/check-supabase-connection.mjs` and `scripts/inspect-supabase-schema.mjs` support scripts.

## Required Supabase env vars

Set these locally and later in Vercel/project hosting settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not commit actual values to GitHub.

## Required Supabase dashboard steps

1. In Supabase SQL Editor, review and run `supabase/live-setup.sql`.
2. Confirm these base tables exist:
   - `customers`
   - `orders`
   - `app_profiles`
   - `distributor_profiles`
   - `abandoned_checkouts`
   - `crm_activity`
   - `site_events`
   - `marketing_campaigns`
   - `marketing_posts`
3. Create or confirm the admin auth user for `support@cattleguardforms.com`.
4. Run the commented admin profile upsert at the bottom of `supabase/live-setup.sql` after the auth user exists.
5. Add env vars to the deployment platform before deploying.
6. Visit `/api/supabase-health` after deployment to verify table access.

## Security warning

The current admin and distributor portals still use temporary client-side gates. Production hardening still requires server-side Supabase session checks and role enforcement before real customer/distributor/admin data is trusted.

## Next backend pass

After env values and SQL setup are confirmed:

1. Replace temporary admin login with Supabase Auth session and `app_profiles.role = admin` checks.
2. Replace temporary distributor login with Supabase Auth session and `app_profiles.role = distributor` checks.
3. Move distributor profile and pricing data out of hardcoded arrays and into `distributor_profiles`.
4. Wire Stripe webhook completion to create/update `orders` and send distributor/manufacturer emails.
5. Connect admin dashboard metrics to real Supabase counts.
6. Tighten RLS policies from setup/testing rules into role-scoped production policies.
