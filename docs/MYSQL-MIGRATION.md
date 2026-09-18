# Local MySQL migration

## Verified local status — 2026-09-18

- Local MySQL 8.0.46, database `news24x7`; backend `.env` selects `DATABASE_ENGINE=mysql`.
- 16 source collections copied and verified: 20,670 total source records,
  including 20,501 articles, 126 categories, 3 reporters, and 2 users.
- A full source-to-target hash comparison reported zero mismatches or extra
  target records before cutover. Run `npx tsx scripts/verify-mysql-copy.mjs`
  only before edits; normal MySQL activity after cutover creates valid differences.
- API tests passed for feeds, popular ranking, search, categories/subcategories,
  e-paper, original article content/aliases, existing MP3 bytes, password login,
  role restrictions, single-use OAuth exchange, drafts, unique-slug rollback,
  and private cover/gallery image uploads. Temporary test records were removed.
- Browser checks passed on homepage and a real article at port 5173: meaningful
  content, local image loaded, no error overlay/console errors, no horizontal overflow.
- Atlas data remains unchanged. External Google consent and real video playback
  were not tested. No claim of full production readiness is made.

## Configuration

MySQL 8.0 is running locally on port 3306. Configure `MYSQL_HOST`, `MYSQL_PORT`,
`MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD` in `backend/.env`.
The migration also accepts these settings from the root `.env` when the backend
value is blank. Passwords are never printed. Do not commit either `.env` file.

## Lossless data copy

From `backend`:

```powershell
npx tsx scripts/migrate-mongo-mysql.mjs
npx tsx scripts/migrate-mongo-mysql.mjs --apply
```

First command is a dry run. Destination must be empty; existing tables are not
overwritten. This script reads Atlas without running database initialization or
modifying its records/indexes. It copies every collection to a separate MySQL
table, using canonical BSON Extended JSON to retain IDs, dates, binary media,
password hashes, arrays, legacy URLs, and all other fields. `migration_manifest`
maps source collection names to tables and records verification status.

Each table stores an original ID key, lossless document, and SHA-256 checksum.
Verification compares counts before/after copying, verifies all stored hashes in
MySQL, and checks sample BSON round trips. A failed run leaves partial data marked
unverified; do not serve it or overwrite it automatically. Choose a new empty
database after inspecting the failure. Copying during application writes is not
a transactionally consistent source snapshot. Stop editorial changes during the
copy, and do a final sync/verification before cutover.

## Runtime cutover

After the copy is verified, set `DATABASE_ENGINE=mysql` in `backend/.env` and
restart the backend with `npm run dev`. Keep the frontend's existing
`BACKEND_URL=http://127.0.0.1:8000`. MySQL startup initializes generated SQL columns
and indexes for feeds/search, a transaction-backed unique-key table for slug
aliases/email/reporter IDs, and minute-based expiry cleanup for login/reading
records. First-time schema preparation can take several minutes; later startups
reuse it. IDs and API/media URLs remain unchanged.

Data is deliberately stored losslessly in SQL document tables, with indexed
generated columns, rather than discarding legacy fields during conversion.
`mysql-database.ts` translates supported application operations to parameterized
SQL; unsupported query/aggregation operators fail explicitly. Existing BSON
serialization is retained so old IDs, password hashes, dates, and media bytes
remain compatible. Runtime MySQL mode does not connect to Atlas.

To test an isolated API first, use a second terminal:

```powershell
cd backend
$env:DATABASE_ENGINE='mysql'
$env:PORT='8001'
npx tsx src/server.ts
```

Then from another backend terminal:

```powershell
npx tsx scripts/test-mysql-runtime.mjs
```

The test creates temporary draft articles, a reporter, categories, a user and
uploads, verifies API flows, and removes its test records/media afterward.
It uses an existing super-admin identity locally; no tokens/passwords are printed.
Actual external Google consent is not automated by this test.

A verified copy alone does not free Atlas space. Keep Atlas credentials/data
until runtime verification is complete. Rollback is `DATABASE_ENGINE=mongodb`
and a restart, but new MySQL edits are not synced back automatically; reconcile
them before rollback. Do not switch engines while editorial changes are running.

The project `uploads` directory stays on disk unchanged. Include it in deployment
and backups, along with MySQL data; it is not copied into MySQL.
