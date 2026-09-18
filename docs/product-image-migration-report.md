# Existing product image migration — completed

Completed: 2026-09-18T12:24:29.549Z

Exactly five product image_url values were migrated. No authentication or business-logic changes, schema migrations, local file deletions, or deployment occurred.

## Old URL → new URL mappings

| Product ID | Shop ID | Original URL | New public URL |
| --- | --- | --- | --- |
| 1 | 1 | /uploads/products/ea235494-f6dc-4b94-aba0-6b74e385ccf0.png | [products/1/f387757e-3179-4951-a8f3-4f5617c11448.png](https://gufciylnlhyjywonvxsn.supabase.co/storage/v1/object/public/product-images/products/1/f387757e-3179-4951-a8f3-4f5617c11448.png) |
| 3 | 1 | /uploads/products/0cb723ae-14f8-471d-8673-b9437d2b40de.jpg | [products/1/9f413db4-c40c-4e94-bcd1-8675d42677bc.jpg](https://gufciylnlhyjywonvxsn.supabase.co/storage/v1/object/public/product-images/products/1/9f413db4-c40c-4e94-bcd1-8675d42677bc.jpg) |
| 4 | 1 | /uploads/products/19564b9f-e777-4b9d-886e-73bc56242ec5.png | [products/1/98710b88-d0ab-4510-abbe-77587e36c29a.png](https://gufciylnlhyjywonvxsn.supabase.co/storage/v1/object/public/product-images/products/1/98710b88-d0ab-4510-abbe-77587e36c29a.png) |
| 5 | 2 | /uploads/products/af828aaa-1b0b-4b3a-8762-72080db4557c.png | [products/2/ddcfa47c-3464-4e43-8669-dd111d5da843.png](https://gufciylnlhyjywonvxsn.supabase.co/storage/v1/object/public/product-images/products/2/ddcfa47c-3464-4e43-8669-dd111d5da843.png) |
| 6 | 2 | /uploads/products/a17e6678-5113-4ee0-bf28-1cf42c2d56cb.jpg | [products/2/9a77f803-accd-4c01-8b0d-cd50a2967efd.jpg](https://gufciylnlhyjywonvxsn.supabase.co/storage/v1/object/public/product-images/products/2/9a77f803-accd-4c01-8b0d-cd50a2967efd.jpg) |

## Source-file manifest

All files remain under public/uploads/products. Uploaded/public bytes matched source bytes and SHA-256 hashes before any product URL changed.

| Filename | Bytes | SHA-256 |
| --- | ---: | --- |
| ea235494-f6dc-4b94-aba0-6b74e385ccf0.png | 572869 | 995ca248c0e4c7fbbbdb01b246665cd6e05de920cec11742d25bdbe831b02b78 |
| 0cb723ae-14f8-471d-8673-b9437d2b40de.jpg | 237319 | d61a8aa58ad8f14afee2616c91d133dc3c7e21bdcb8b2da60f3cf29df5b18085 |
| 19564b9f-e777-4b9d-886e-73bc56242ec5.png | 548284 | 4c4344e72d162498afbb81c42534c638ed2443740ee9d4cce25e20877f936a42 |
| af828aaa-1b0b-4b3a-8762-72080db4557c.png | 455593 | 554a6bbf103420e0f0c1dbca5510350016ab3379fe512a976e48d52d79b40c71 |
| a17e6678-5113-4ee0-bf28-1cf42c2d56cb.jpg | 199050 | c7246ce531fcacc7e962f591e2cbd6f4869349899da309e3b5346157184c81f9 |

## Verification

- Initial state matched exactly: five reviewed local URLs, five files, five unique associations, empty correctly configured bucket and original 61-row fingerprints.
- Uploaded with collision-resistant shop-scoped UUID paths and upsert:false. Each authenticated download and public HTTP 200 response matched the source size and hash.
- Updated only image_url in one guarded transaction after every upload was verified. Product ID, shop ID and original URL were checked on each update.
- Final inventory has exactly five distinct objects and five matching Storage URLs; no product still references /uploads/products.
- All 61 marketplace rows remain present. Product IDs and every non-image field, including timestamps, match their before-migration fingerprints. Other marketplace tables and Auth mappings are unchanged.
- All five original local files remain and match their source hashes.
- npx tsc --noEmit, npm run lint and npm run build passed. Build retains the unrelated warning about an external package-lock.json.
- Public product listing, all five detail pages, both shop pages and all five Next image-optimizer responses passed.
- Seller login/list and shop 1 seller detail/edit GETs for products 1, 3 and 4 passed with migrated images; logout passed. No edit forms were submitted.
- The existing seller list does not render image thumbnails; its product links were verified. No UI feature was added as part of migration.

## Rollback and recovery

Keep work/product-image-migration/manifest.json and the original local files. The manifest records old/new URLs, IDs, byte sizes/hashes, planned object paths and baseline fingerprints, without credentials.

Do not rerun --preflight or --apply on this completed migration. Use node scripts/migrate-existing-product-images.mjs --verify for a read-only audit. An approved rollback can restore each old URL only when product ID/shop ID/current URL still match the manifest; never overwrite later seller changes. Storage deletion and local-file cleanup are separate decisions and have not been performed.

The historical Auth verifier compares the original full product rows and will now detect the intentional image_url changes. Use this migration verifier for the post-image-migration baseline; do not silently rewrite historical evidence.

Artifacts: scripts/migrate-existing-product-images.mjs, scripts/smoke-migrated-images.mjs, work/product-image-migration/manifest.json and work/product-image-migration/page-tests.json.
