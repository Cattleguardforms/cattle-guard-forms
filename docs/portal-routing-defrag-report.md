# Portal Routing Defrag Report

## Canonical portal routes

- Admin Portal: /admin
- Distributor Portal: /distributor
- Marketing Portal: /marketing
- Portal access hub: /portals

## Legacy route retirement

- /reseller is retired as an active UI route.
- /reseller now redirects permanently to /distributor from next.config.ts.
- The old duplicate src/app/reseller/page.tsx page was removed so the previous distributor/reseller UI cannot reappear as a competing live route.

## Reconnection work completed

- Added /portals as the canonical access hub for Admin, Distributor, and Marketing.
- Added a persistent Portal Access floating link from the root app shell so the public website can reach the portals.
- Connected Marketing Portal navigation back to Portal Access, Admin Portal, and Distributor Portal.
- Confirmed Admin Portal already links to Marketing Portal and Distributor Portal.
- Preserved /distributor as the canonical active distributor route.

## Defrag findings

Found and fixed:

- Duplicate distributor experience existed at /reseller and /distributor.
- /reseller contained a separate large distributor ordering UI that competed with the active Distributor Portal.
- Public/internal access to portals lacked a single canonical hub.

Intentionally left alone:

- Admin auth/session logic remains temporary and should be hardened in a separate auth/security pass.
- Distributor login/order flow still contains setup placeholders pending Supabase role enforcement and backend fulfillment wiring.
- Marketing module routes remain as-is; this pass focused on routing and portal reconnection, not rebuilding module logic.

Remaining risk:

- Some individual portal subpages may still use their own local headers instead of a shared portal header component.
- A future hardening pass should consolidate repeated portal headers/navigation into shared components after route behavior is verified.
- Full production security still requires Supabase-backed admin/distributor role checks.

## Hardening checklist

Routes that should be verified after deployment/build:

- /
- /portals
- /admin
- /admin/settings
- /admin/settings/admin-users
- /admin/orders
- /admin/distributors
- /marketing
- /marketing/email
- /marketing/ai
- /distributor
- /reseller redirects to /distributor
- /engineering/hs20 redirects to /engineering/hs20-updated

Build checks to run in the deployment environment:

- npm install
- npm run lint
- npm run build

## Next recommended hardening pass

After this PR is merged and route behavior is verified, the next pass should:

1. Consolidate portal headers into shared components.
2. Audit every Link target under src/app for retired paths.
3. Replace temporary admin/distributor browser gates with Supabase server-side role enforcement.
4. Add route-level middleware or server guards for production portal protection.
5. Remove any remaining placeholder-only portal flows once real backend tables are wired.
