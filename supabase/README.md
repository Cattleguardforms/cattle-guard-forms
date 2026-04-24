# Supabase

This folder stores reviewable database migration drafts for Cattle Guard Forms.

## Migrations

- `migrations/001_quote_intake_schema.sql` expands the current minimal `customers` and `orders` tables for the first quote/order intake workflow.
- Review migration SQL before applying it.
- Do not store secrets, API keys, `.env.local`, or Supabase credentials in this folder.
- Apply migrations deliberately through the Supabase SQL Editor or an approved Supabase CLI workflow.

## Current rule

No migration in this folder should be assumed applied until schema inspection confirms the live Supabase database changed.
