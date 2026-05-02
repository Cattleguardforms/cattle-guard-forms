# Full Backend Portal Defrag Audit

Date: 2026-05-01
Repo: Cattleguardforms/cattle-guard-forms
Branch: main

## Purpose

This document is the current defrag source of truth for the Cattle Guard Forms site and backend portal surfaces. It replaces the older distributor-portal assumptions that referenced deleted legacy routes.

No new portal feature work should be started until the high-priority defrag items below are resolved or intentionally deferred.

## Current canonical routes

- Public home: `/`
- Portal hub: `/portals`
- Admin portal: `/admin`
- Admin orders: `/admin/orders`
- Admin shipping execution: `/admin/shipping-execution`
- Admin distributors: `/admin/distributors`
- Distributor landing: `/distributor`
- Distributor home/dashboard: `/distributor/home`
- Distributor shop/checkout entry: `/distributor/shop`
- Distributor order detail: `/distributor/orders/[orderId]`
- Distributor warranty paperwork: `/distributor/orders/[orderId]/warranty`
- Distributor documents: `/distributor/documents`
- Manufacturer/internal fulfillment portal: `/manufacturer`
- Marketing portal: `/marketing`

## Retired / legacy routes

These routes must not be used as canonical architecture:

- `/distributor/portal` — deleted/retired legacy route. Do not route traffic here.
- `/distributor/order-portal` — retired route returning `notFound()`.
- `/distributor/stripe` — compatibility redirect only; currently redirects to `/distributor/home`.

Important distinction:

- Distributor-arranged freight is **not** legacy. It is a valid shipping lane.
- The old split route `/distributor/own-freight-checkout` is the legacy architecture risk, not the business rule itself.
- Current/future distributor checkout must support both CGF/Echo freight and distributor-arranged freight with required distributor document upload.

## Current operating workflow

### Distributor order workflow

Status: Active / live-tested in parts.

Current expected sequence:

1. Distributor signs in.
2. Distributor orders through `/distributor/shop`.
3. Customer warranty name, email, and phone are required.
4. Distributor chooses one shipping lane:
   - Cattle Guard Forms / Echo freight.
   - Distributor-arranged freight, requiring distributor-uploaded freight/BOL documents.
5. Stripe checkout collects payment.
6. Stripe webhook marks order paid.
7. Payment/order notification emails send.
8. If CGF/Echo freight is selected, Echo booking runs after payment.
9. If CGF/Echo booking succeeds, order shows carrier and BOL code/reference.
10. If CGF/Echo freight is selected, BOL document is fetched later by `/api/admin/fetch-bol-documents` and/or scheduled Vercel cron.
11. If distributor-arranged freight is selected, uploaded distributor freight/BOL documents must be stored in Supabase Storage and `order_files` before/with checkout as required by that lane.
12. Distributor portal shows Download BOL once a BOL/freight document exists in `order_files`.

### Shipping lane rules

#### Lane 1: Cattle Guard Forms / Echo freight

- Distributor requests quote.
- Distributor selects freight option.
- Checkout includes product + freight/handling.
- Stripe payment succeeds.
- Echo booking runs.
- BOL code/reference appears after booking.
- BOL document may not be available immediately.
- Scheduled/admin BOL fetch stores `echo_bol` when Echo makes the document available.

#### Lane 2: Distributor-arranged freight

- Distributor selects own shipping / arrange freight.
- Distributor must upload their own freight/BOL documents.
- Checkout should not proceed unless required freight documents are present for this lane.
- Uploaded documents should be stored in `order_files` as `original_bol`, `distributor_bol`, or equivalent approved file type.
- Supplier/support emails and admin views should clearly show that distributor arranged freight and uploaded the documents.

### Email workflow

Status: Active after Resend domain verification.

Current rule:

- Basic payment/order emails send immediately after payment.
- BOL/manufacturer packet emails should not block payment workflow.
- BOL/document emails should only be sent after the BOL document exists, or should reference distributor-uploaded freight documents when distributor-arranged freight is selected.

Verified sender domain requirement:

- Resend must keep `cattleguardforms.com` verified.
- Transactional sender should be `orders@cattleguardforms.com`.
- Reply-to should be `support@cattleguardforms.com`.

### Echo/BOL workflow

Status: Echo booking works; delayed BOL fetch automation is being deployed/hardened.

Current rule:

- Echo booking and BOL code can be available before the downloadable BOL file.
- The scheduled BOL fetch job checks Echo-booked orders every 15 minutes.
- The BOL fetch route should accept `CRON_SECRET`, `CGF_AUTOMATION_SECRET`, or `STRIPE_WEBHOOK_SECRET`.

## Portal status summary

### Portal hub

Status: Active.

Defrag status: Keep.

### Admin portal

Status: Active / partially hardened.

Working:

- Supabase sign-in is used from admin surfaces.
- Admin dashboard links to distributors, orders, manufacturer portal, analytics, CRM activity, import, and settings.
- `/admin/orders` has real order management behavior.
- `/admin/shipping-execution` can book Echo shipments and is being aligned with stored-BOL behavior.
- `/admin/distributors` loads distributor profile/order information.

Risks:

- Some admin module cards may still point to shallow or placeholder pages.
- Admin auth is repeated across routes and should eventually be centralized.
- `/admin/shipping-execution` must support both Echo-stored BOL and distributor-uploaded BOL/freight documents.
- Archive/destructive admin actions need stronger confirmation and audit logging.

Priority: High.

### Distributor portal

Status: Active / core flow working.

Working:

- `/distributor/home` is the live distributor dashboard target.
- `/distributor/shop` handles current distributor checkout.
- `/distributor/orders/[orderId]` displays order/payment/shipping/BOL status.
- BOL code/status messaging is aligned with the delayed document fetch model.
- Download BOL appears when `order_files` contains a BOL file.

Risks:

- Need to verify no remaining links point to `/distributor/portal`.
- Need to verify distributor-arranged freight upload lane is fully live and cannot proceed without required documents.
- Distributor document pages should be reviewed for real downloadable content vs static placeholders.
- Distributor profile/settings self-service remains shallow unless proven otherwise.

Priority: Highest until route cleanup and both shipping lanes are verified.

### Manufacturer/internal fulfillment portal

Status: Active internal/admin-gated fulfillment surface.

Working:

- `/manufacturer` exists and loads fulfillment orders through admin APIs.
- Manufacturer/support email route exists.

Risks:

- This is not a separate external manufacturer-login portal.
- Manufacturer workflow should be tied to stored BOL/freight files, not premature BOL fetch attempts.
- If external manufacturer access is needed, a separate role/access model is required.

Priority: Medium-high.

### Marketing portal

Status: Broad surface exists; module depth not fully verified.

Risks:

- Many marketing modules may be scaffolded or shallow.
- Marketing module sprawl should not distract from order/fulfillment hardening.
- Audit each marketing route as Real / Partial / Placeholder / Delete before operational use.

Priority: Medium-low until core fulfillment is stable.

## Shared backend API status

### `/api/distributor-checkout`

Status: Functional but crowded.

Responsibilities currently include auth validation, distributor lookup, validation, order insert, customer/warranty CRM storage, Stripe checkout creation, freight data, and optional file handling.

Defrag recommendation:

Split later into reusable helpers:

- distributor auth helper
- customer/warranty CRM helper
- distributor order creation helper
- shipping lane validation helper
- freight/pallet helper
- order file/BOL helper
- Stripe checkout helper

Priority: Medium-high after live flow stabilizes.

### `/api/stripe/webhook`

Status: Functional.

Current rule:

- Mark paid order.
- Send payment/order workflow emails.
- Run Echo booking only for CGF/Echo freight orders.
- Do not block payment workflow on BOL document email.

Priority: Keep and monitor.

### `/api/admin/fetch-bol-documents`

Status: New delayed BOL automation route.

Purpose:

- Find Echo-booked orders without stored BOL files.
- Ask Echo for documents.
- Store BOL as `order_files.file_type = echo_bol` when available.

Priority: High verification.

### Order files API

Status: Functional dependency for distributor/manufacturer BOL workflow.

Risk:

- Needs repeated live verification for `original_bol`, `distributor_bol`, `signed_bol`, and `echo_bol` download behavior.

Priority: High.

## High-priority defrag queue

1. Verify Vercel production deploys latest cron/BOL commits:
   - `908db39` schedule automated BOL document fetch.
   - `6bdfa79` allow Vercel cron secret for BOL fetch.

2. Verify Vercel Cron:
   - Cron path exists: `/api/admin/fetch-bol-documents?limit=10`.
   - `CRON_SECRET` is set in production environment.
   - `crm_activity` records `BOL document stored for order...` once Echo provides the document.

3. Verify both distributor shipping lanes:
   - CGF/Echo freight quote + payment + booking + BOL code + delayed BOL fetch.
   - Distributor-arranged freight + required document upload + payment + supplier/support visibility.

4. Remove or fix remaining links to deleted routes:
   - Search all links/navigation for `/distributor/portal`.
   - Delete retired route stubs if they are not needed.

5. Update admin shipping execution:
   - Use stored-BOL fetch action against `/api/admin/fetch-bol-documents` for Echo orders.
   - Show whether BOL/freight files exist in `order_files`.
   - Support distributor-uploaded BOL/freight files for own-shipping orders.

6. Harden admin and manufacturer auth boundaries:
   - Centralize role checks.
   - Confirm `app_profiles.role = admin` and `status = active` are enforced on write APIs.
   - Decide whether `/manufacturer` remains admin-only or gets a manufacturer role.

7. Distributor documents audit:
   - Mark each distributor document route as real/static/downloadable/placeholder.
   - Remove or hide anything not production-ready.

8. Marketing module audit:
   - Mark each marketing module as Real / Partial / Placeholder / Delete.
   - Hide unfinished operational modules until core fulfillment is stable.

## Do not build yet

Do not expand these until the high-priority defrag queue is handled:

- New marketing automation modules
- Additional dashboard metrics
- External manufacturer login
- Admin analytics expansion
- Distributor profile self-service expansion
- New freight carrier features beyond current Echo flow

## Next safest code tasks

1. Confirm latest Vercel deploy and cron job.
2. Verify distributor-arranged freight upload lane still works under current `/distributor/shop` flow.
3. Update `/admin/shipping-execution` to show stored BOL/freight file status for both shipping lanes.
4. Audit distributor documents for placeholder/static content.
