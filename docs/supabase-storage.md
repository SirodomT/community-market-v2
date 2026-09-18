# Product-image Storage phase — validation complete

Update: the separately approved five-image migration is now completed. See
[product-image-migration-report.md](product-image-migration-report.md) for exact
old/new URL mappings, hashes, unchanged-data verification and rollback information.
The inventory and unapplied plan below describe the earlier validation checkpoint.

After the computer shutdown, the existing code and bucket were inspected before
continuing. Bucket setup and database migrations were not rerun. The existing
bucket was empty before validation and is empty again after disposable test cleanup.
No existing product images were migrated or deleted.

## Bucket and credentials

`product-images` is public because marketplace product images are public content.
Allowed MIME types: image/jpeg, image/png, image/webp. Maximum size: 921600 bytes
(900 KiB), matching the prior application limit. No storage.objects policies exist;
anonymous/browser uploads are denied. Public object download does not need a read
policy. The trusted Node server uses SUPABASE_SECRET_KEY, or
SUPABASE_SERVICE_ROLE_KEY as fallback, only from the server-only image module.
Set the server-only credential in the deployment environment before deploying;
never use a NEXT_PUBLIC_ name for it. No SQL/schema migration is needed.

## Upload and cleanup behavior

- Existing SELLER/ACTIVE authorization and database-resolved shop ownership guard
  create/edit/delete. Form data cannot supply a storage path or image URL.
- New objects use products/{shopId}/{uuid-v4}.{jpg|png|webp}, with upsert:false.
- MIME and size validation precede upload; products.imageUrl is saved only after
  upload succeeds. The existing varchar(500) column is sufficient for these URLs.
- An edit without a replacement or explicit removal omits imageUrl from UPDATE,
  preserving the current database image even if another request changes it.
- Replacement uploads first, then updates only if the stored old URL still matches.
  A stale edit fails rather than overwriting a concurrent replacement.
- Cleanup happens after database success. Failed writes attempt cleanup only after
  checking that no product references the new image; an ambiguous committed write
  therefore retains its referenced object.
- Product deletion returns the actual deleted row's image URL from its ownership-
  scoped DELETE. Cleanup accepts only this project's bucket, the correct shop path,
  UUID filename and allowed extension, and checks all product references.
- Local URLs, other hosts/buckets/shops, traversal, URL parameters and still-used
  objects are never deleted. Local files are retained even on replacement/removal.
- Cleanup errors retain a possible orphan and log a generic warning; they do not
  reverse a saved product. Cross-service atomicity is unavailable. Any orphan audit
  or cleanup requires a separately reviewed object inventory.

## Existing-image inventory (unchanged)

All five products have images; every image points into /uploads/products and all
five corresponding files exist. There are no extra files in that directory.

| Product ID | Shop ID | Path after /uploads/products/ | Bytes |
| --- | --- | --- | ---: |
| 1 | 1 | ea235494-f6dc-4b94-aba0-6b74e385ccf0.png | 572869 |
| 3 | 1 | 0cb723ae-14f8-471d-8673-b9437d2b40de.jpg | 237319 |
| 4 | 1 | 19564b9f-e777-4b9d-886e-73bc56242ec5.png | 548284 |
| 5 | 2 | af828aaa-1b0b-4b3a-8762-72080db4557c.png | 455593 |
| 6 | 2 | a17e6678-5113-4ee0-bf28-1cf42c2d56cb.jpg | 199050 |

## Proposed old-image migration — NOT executed

1. Obtain separate approval; refresh row/file inventory and full-row fingerprints.
2. Record a manifest of product ID, shop ID, exact original URL, local content hash
   and planned new UUID path. Never infer product associations from filenames alone.
3. Validate each file's type/size, upload a copy with no overwrite, and verify both
   downloaded bytes/hash and public rendering before any product update.
4. Update only image_url, guarded by the expected product ID, shop ID and exact old
   URL. Abort conflicts. Preserve IDs, stock, descriptions, orders and ownership.
5. Verify all five new references and that every non-image field remains unchanged.
6. Retain original files and the manifest for rollback. Rollback restores only
   matching migrated URLs; do not overwrite subsequent seller edits. No local-file
   deletion is part of this plan. Clean only verified unreferenced run-owned objects.

## Validation

- npx tsc --noEmit: passed.
- npm run lint: passed.
- npm run build: passed; existing unrelated external package-lock warning remains.
- Isolated failure suite: 12 passing tests including the parent test; two live-only
  checks skipped here and executed in the live suite.
- Live Storage integration: all 10 tests passed, including new-product upload,
  edit without replacement, replacement and old-object cleanup, product deletion,
  local-file preservation, invalid MIME/size/role rejection and anonymous-write denial.
- Anonymous public download returned HTTP 200 and exact fixture bytes. The production
  Next image optimizer returned HTTP 200 with image content for the Storage URL.
- Failure suite additionally covers upload failure, failed database insert, lost
  insert acknowledgement and stale concurrent image replacement.
- Actual seller action modules ran against an isolated PGlite PostgreSQL fixture
  and real Supabase Storage. Seller identity was supplied by the test harness; this
  was not a live seller-browser form submission or a live marketplace-row mutation.
- Disposable fixture objects were removed through Storage API; final inventory:
  zero objects, unchanged bucket settings and zero Storage object policies.
- Final independent live verification: all 61 marketplace rows/IDs remain
  fingerprint-identical; all four Auth users/mappings and roles/status remain intact.

## Files in this Storage phase

- src/lib/product-images.ts: server-only uploads and guarded cleanup.
- src/app/seller/products/new/actions.ts: Storage upload before product creation.
- src/app/seller/products/[id]/edit/actions.ts: safe replacement and no-image preservation.
- src/app/seller/products/actions.ts: cleanup using the deleted owned row.
- next.config.ts: exact project host and product-images public-object path allowlist.
- scripts/product-image-inventory.mjs: read-only local/live inventory, including objects.
- scripts/setup-product-image-bucket.mjs: initial bucket setup; not rerun after shutdown.
- tests/product-images.test.cjs: isolated failure and live Storage integration tests.
- docs/supabase-storage.md: this report and the unapplied old-image migration plan.

Public product/shop pages, cards, cart and seller pages already use imageUrl through
Next Image and need no component changes. Authentication, order/cart/stock business
logic and database schemas were not changed.
