# Supabase database TLS trust

`supabase-ca.json` contains Supabase's public production CA certificate downloaded
over HTTPS from the source URL recorded in that file. It is public trust material,
not a private key or a database credential.

Subject: Supabase Root 2021 CA, Supabase Inc.
Valid until: 2031-04-26.
SHA-256 fingerprint:
`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`.

The application and activation script supply this CA to Postgres.js with
`rejectUnauthorized: true`. Certificate and hostname verification remain enabled.
The JSON import bundles the certificate with the application for Vercel.

When Supabase rotates its CA, obtain the replacement from the project's Database
Settings > SSL Configuration and verify its provenance before updating this file.
See https://supabase.com/docs/guides/platform/ssl-enforcement.
