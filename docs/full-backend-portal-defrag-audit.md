# Full Backend Portal Defrag Audit

Date: 2026-04-29
Repo: Cattleguardforms/cattle-guard-forms
Branch: main

## Purpose

This document is the current defrag source of truth for all backend portal surfaces:

- Portal hub
- Admin portal
- Distributor portal
- Own-freight/BOL checkout
- Manufacturer fulfillment portal
- Marketing portal
- Shared order/payment/email/file APIs

No new portal feature work should be started until the high-priority defrag items below are resolved or intentionally deferred.

## Canonical portal routes

- Portal hub: `/portals`
- Admin portal: `/admin`
- Admin orders: `/admin/orders`
- Admin distributors: `/admin/distributors`
- Distributor landing: `/distributor`
- Distributor portal: `/distributor/portal`
- Temporary own-freight/BOL checkout: `/distributor/own-freight-checkout`
- Manufacturer fulfillment portal: `/manufacturer`
- Marketing portal: `/marketing`

## Portal status summary

### Portal hub

Status: Active.

The hub exists at `/portals` and links to Admin, Distributor, Manufacturer, and Marketing portal areas. This is the canonical portal access page.

Defrag status: Keep.

### Admin portal

Status: Active / partially hardened.

Working:

- Supabase sign-in is used from the admin portal.
- Admin dashboard links to distributors, orders, manufacturer portal, analytics, CRM activity, import, and settings.
- `/admin/orders` has real paid-order and fulfillment update behavior.
- `/admin/distributors` loads distributor profiles and order summary information.

Risks:

- Admin auth is still largely client-page driven.
- Some module cards may still point to shallow/placeholder pages.
- Admin settings should be tested route-by-route.
- `POST /api/admin/orders` archive behavior should be protected with a stronger confirmation if kept.

Defrag priority: High.

### Distributor portal

Status: Active but fragmented.

Working:

- `/distributor` is canonical distributor entry.
- Distributor orders API now uses `distributor_profile_id` and does not query missing `orders.order_contact_email`.
- Own-freight/BOL checkout exists and requires customer warranty data plus BOL upload before Stripe.
- BOL is stored before Stripe and PO email is sent only after payment succeeds.

Risks:

- Own-freight flow currently lives at `/distributor/own-freight-checkout`, separate from `/distributor/portal`.
- Main portal should eventually absorb the own-freight lane so distributors do not have two order paths.
- Distributor order history/status is still shallower than admin/manufacturer fulfillment views.

Defrag priority: Highest.

### Manufacturer fulfillment portal

Status: Active internal/admin-gated fulfillment portal.

Working:

- `/manufacturer` exists and loads paid/ready fulfillment orders via `/api/admin/manufacturer-orders`.
- Manufacturer portal can show order status, carrier/BOL/tracking fields, download original BOL, and upload signed BOL.
- Schema fallback cleanup was applied to stop relying on old missing order contact columns.

Risks:

- This is not a separate manufacturer-login portal. It is an admin-session gated internal fulfillment view.
- If external manufacturer access is desired, it needs a separate role model and access policy.
- Manufacturer email + portal data should be verified after one paid own-freight order.

Defrag priority: Medium-high.

### Marketing portal

Status: Broad surface exists; module depth not fully verified.

Working:

- `/marketing` exists and links to CRM, AI content, SEO, email, blog, campaign, lead inbox, distributor accounts, order pipeline, files, and automation modules.
- Marketing portal links across to portal hub, Admin, Distributor, and Manufacturer.

Risks:

- Many marketing modules may be scaffolded or shallow.
- Marketing should get its own module-by-module audit after order/admin/distributor core is stable.
- Do not let marketing module sprawl distract from order fulfillment stabilization.

Defrag priority: Medium.

## Shared backend API status

### `/api/distributor-checkout`

Status: Functional but crowded.

Responsibilities currently include:

- Auth validation
- Distributor lookup
- Form/multipart parsing
- Order validation
- Order insert
- BOL storage
- Order file metadata insert
- Stripe checkout session creation
- Stripe session attachment to order

Defrag recommendation:

Split into reusable helpers after live verification:

- distributor auth helper
- distributor order creation helper
- order file/BOL helper
- Stripe checkout helper

Priority: Medium-high.

### Stripe webhook

Status: Functional and now aligned with PO email rule.

Current rule:

- BOL can be uploaded before payment.
- Manufacturer/support PO email is sent only after Stripe payment succeeds.
- Webhook downloads stored BOL and attaches it to paid PO email.

Priority: Keep and verify live.

### Order files API

Status: Functional dependency for distributor/manufacturer BOL workflow.

Risk:

- Needs live test for BOL upload, BOL download, and signed BOL upload.

Priority: High for verification.

## High-priority defrag queue

1. Live test full own-freight flow:
   - distributor sign-in
   - own-freight checkout page
   - customer info required
   - BOL required
   - Stripe checkout
   - webhook paid update
   - PO email with BOL attached
   - manufacturer portal sees paid order and BOL

2. Merge own-freight lane back into `/distributor/portal`:
   - Remove split route after merge.
   - Keep `/distributor/own-freight-checkout` only as a temporary fallback until verified.

3. Harden admin and manufacturer auth boundaries:
   - Admin role should come from `app_profiles.role = admin` and `status = active`.
   - Manufacturer role should be decided: admin-only internal view or separate manufacturer user role.

4. Clean shared portal navigation:
   - Use shared portal header/navigation components later.
   - Ensure all portal pages can return to `/portals` and main site.

5. Marketing module audit:
   - Mark each marketing module as real, partial, or placeholder.
   - Remove or label placeholder modules before using the portal operationally.

6. Echo freight hold:
   - Do not expand Echo freight until rates response and selected-rate mapping are verified.

## Known temporary fragmentation

- `/distributor/own-freight-checkout` exists only because direct replacement of the large `/distributor/portal/page.tsx` file was unstable through the GitHub wrapper.
- This is acceptable short-term but should not remain final product architecture.

## Do not build yet

Do not start these until the high-priority defrag queue is handled:

- New marketing automation modules
- Additional dashboard metrics
- Echo booking UI
- Distributor profile self-service expansion
- Manufacturer external login
- Admin analytics expansion

## Next safest code task

Merge the own-freight/BOL fields and multipart checkout behavior into `/distributor/portal`, then remove or redirect `/distributor/own-freight-checkout` after verification.
