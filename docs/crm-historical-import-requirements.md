# CRM Historical Import Requirements

This document defines how 2019, 2020, and 2021 historical customer and sales records should be imported into the Cattle Guard Forms CRM.

## Import goal

Historical customer and sale records should become searchable CRM data without corrupting current customer, order, distributor, or analytics data.

The import should support:

- 2019 customer/sales records
- 2020 customer/sales records
- 2021 customer/sales records
- CowStop historical sales quantity tracking
- Archived Texan product tracking
- Old vendor / reseller attribution, including Tractor Supply Company

## Required sale/import fields

Each imported sale row should capture as much of the following as available:

- Date of sale
- Customer name, if available
- Customer email, if available
- Customer address, if available
- Customer phone number, if available
- Distributor/vendor that sold the unit
- CowStop quantity sold
- Product sold
- Notes/source row details

A row should not require company information.

## Optional company fields

These fields are optional and should never block an import:

- Company name
- Company email
- Company phone number

If provided, they should be stored with the customer/import metadata. If missing, the import should still proceed as long as there is enough customer/sale information to identify the record.

## Vendor normalization

Historical source files may use abbreviations or old labels.

Special rule:

- `TSC` must be normalized as old vendor `Tractor Supply Company`.

The CRM should preserve both:

- Raw imported distributor/vendor value
- Normalized vendor name

This allows the business to track old vendor relationships separately from current distributor accounts.

## Products

Current primary product:

- CowStop Reusable Form

Archived legacy product:

- Texan

The old legacy Texan product should not be deleted from historical data. It should be created as an archived product so old sales can be reviewed and analyzed later. This allows the business to determine whether there is enough historical demand to put the product back to use.

## CowStop quantity

The import should explicitly capture how many CowStops were sold on each historical sale row.

Preferred field:

- cowstop_quantity

If the file has a generic quantity column, it can be mapped to cowstop_quantity when the product is CowStop.

## Validation rules

A sale row should warn or fail validation when:

- Sale date is missing or invalid
- Distributor/vendor is missing
- CowStop quantity is missing or not numeric for CowStop rows
- No identifying customer information exists at all

A sale row should not fail simply because company name, company email, or company phone is missing.

## Duplicate handling

The importer should avoid creating duplicate customers by matching in this order:

1. Email
2. Phone number
3. Customer name plus address
4. Company name plus address, if company name exists

Uncertain matches should be flagged for review instead of blindly merged.

## Recommended import order

1. Import one year first, preferably 2019.
2. Review customer and sale records.
3. Adjust mapping if needed.
4. Import 2020.
5. Review.
6. Import 2021.
7. Review totals by year, product, and vendor.

## Backend requirement

The browser preview/mapping step is allowed to run client-side, but final import must be performed by a secure server route using Supabase service-role access and admin authorization.

The final backend importer should:

- Create an import batch record
- Normalize vendor names
- Upsert old vendor records
- Upsert product records
- Upsert customers
- Create sales/order records
- Create CRM activity records
- Record row-level import errors
- Return imported/skipped/error counts
