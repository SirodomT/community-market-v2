# Archived MySQL definitions

These files preserve the exact pre-Phase-2 schema, auth mapping, driver and
Drizzle configuration. The `.ts.txt` suffix excludes them from compilation and
schema generation after the MySQL driver is removed.

The original MySQL SQL migrations and snapshots remain unchanged in `drizzle/`.
Historical MySQL scripts remain in `scripts/` for reference only. Do not run them
or restore their connection strings. The active application only uses PostgreSQL.

The new, unapplied PostgreSQL history is in `drizzle-postgres/`.
