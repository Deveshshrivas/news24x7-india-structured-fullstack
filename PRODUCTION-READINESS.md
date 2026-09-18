# Production deployment and verification

The Node/MySQL build path is implemented. Local test success is not a certification of live hosting. A VPS or Node hosting plan must provide persistent writable disk for `uploads/` and MySQL 8; ordinary static-only hosting and ephemeral serverless disk are unsuitable for this complete deployment.

## Build and run

Requires Node >=22.13 and npm. These commands work in PowerShell and Linux:

```text
npm ci
npm run build
cd backend
npm ci
npm run build
npm start
```

In a separate terminal at the project root: `npm start -- --hostname 127.0.0.1 --port 3000`.

`npm run dev -- --port 5173` starts the Node frontend for local testing; backend `npm run dev` starts the API. The historical Cloudflare build remains available with `DEPLOY_TARGET=cloudflare` and `npm run build:cloudflare` through Bash.

The frontend now uses standard Next.js (`.next` output), not vinext. Its CLI is resolved through Node's package resolver rather than a hardcoded dependency path. The legacy Windows vinext static-cache adapter is no longer loaded. Deploy a separate built release and then switch/restart processes to prevent mixed asset versions. Earlier runtime verification below predates this migration; rerun checks for the new release.

## Required production configuration

Keep real values in ignored environment files or the host's secret manager, not Git.

Backend `backend/.env`:

```dotenv
NODE_ENV=production
DATABASE_ENGINE=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=news24x7
MYSQL_USER=news_app
MYSQL_PASSWORD=YOUR_STRONG_DATABASE_PASSWORD
JWT_SECRET=YOUR_UNIQUE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
FRONTEND_URL=https://YOUR_DOMAIN
BACKEND_URL=http://127.0.0.1:8000
ALLOWED_ORIGINS=https://YOUR_DOMAIN
COOKIE_SECURE=true
TRUST_PROXY=1
LISTEN_HOST=127.0.0.1
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URL=https://YOUR_DOMAIN/api/backend/auth/google/callback
```

Root frontend environment:

```dotenv
BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
DEPLOY_TARGET=node
```

Use a password-protected database application account restricted to this database. Startup currently needs CREATE/ALTER/INDEX privileges for compatibility-table initialization in addition to SELECT/INSERT/UPDATE/DELETE; do not grant server-wide privileges or use root in production. The already-migrated database includes `migration_manifest`; copying only article rows is insufficient.

Register the exact `GOOGLE_REDIRECT_URL` as an authorized Google Web OAuth redirect URI. Use the same public origin for login initiation and callback: browser-bound state cookies will deliberately reject mismatched hosts. Real Google consent cannot be verified without the account/domain configuration.

## Hosting, HTTPS and process management

- Adapt `deployment/nginx.conf.example` with the real domain and certificate paths. Run `nginx -t`; do not replace an existing hosting configuration blindly.
- Point DNS to the hosting server and obtain a valid TLS certificate with automatic renewal.
- Use `deployment/ecosystem.config.cjs` with PM2 if available; set `NEWS_PROJECT_DIR` to the deployed checkout path. Configure PM2 startup/resurrection and log rotation on that server.
- Block public access to ports 3000, 8000 and 3306. Only the HTTPS edge proxy should be public. The Nginx example overwrites forwarded client-IP headers; only then is `TRUST_PROXY=1` safe.
- Run a single API process for now. Authentication/write rate limits use process-local memory; multiple API instances require a shared limiter store first.
- Do not expose `.env`, SQL dumps, backups, `.trash`, or `.versions` through the web root. Keep upload-year/month layout unchanged and provide disk write permission to the application account only.
- Monitor `/api/backend/health` externally, server errors/request IDs, database health, CPU/RAM, disk space, TLS renewal and backup completion. Backend 5xx responses include a request ID; frontend and API process managers must retain/rotate logs.

## Backups and recovery

From `backend`, with the application database configured:

```text
node --import tsx scripts/backup.mjs --include-uploads
node --import tsx scripts/test-backup-restore.mjs
node --import tsx scripts/test-media-backup.mjs
```

The first command creates a dated database SQL dump plus an uploads TAR archive and SHA-256 manifest under ignored `.backups/`. Without `--include-uploads`, it is a **database-only** backup, not a full website backup. Schedule full backups during a maintenance window with uploads/edits paused so SQL and disk correspond. Avoid DDL/schema changes while `mysqldump --single-transaction` is running. Keep encrypted off-server copies with restricted access and a retention policy; local copies on the same disk are not disaster protection.

`test-media-backup.mjs` creates a fresh full backup, validates its archive checksums, extracts its own media archive into an isolated backup subdirectory, and compares every restored file's size and SHA-256 against the original. It retains the archive and restore directory for inspection and never overwrites live uploads. Allow space for the SQL dump plus twice the media size. Do not run with concurrent media edits. This verifies local recovery only: an external destination must still be configured, the backup copied there securely, and recovery checked from that external copy. Never extract an untrusted archive over live files.

### Local-server backup choice

The selected destination is the server's project-local `.backups/` directory, outside public uploads and ignored by Git. These are **local backups**, not off-server disaster recovery. Restrict directory access and monitor free space. Keep several dated successful backups; do not delete the latest verified copy. No automatic deletion is configured.

On the eventual Linux host, a scheduled command can run during a quiet maintenance window (adapt the deployment path and verify the scheduler's Node executable):

```text
cd /srv/news24x7/backend && /usr/bin/node --import tsx scripts/backup.mjs --include-uploads
```

Schedule this only after testing it on that host; the scheduler is not installed or enabled by this documentation. Copy at least one verified backup onto an independent drive/server later if protection against server failure is required.

The restore test creates only a uniquely named `news_restore_test_<random>` database, imports the dump there, compares every table's row count and every canonical document hash, then removes only that temporary database. It does not overwrite the application database. The test requires privileges to create/drop a temporary database; use an operator account, not the restricted live app account. Upload archive restoration and off-server recovery must also be exercised before launch. Verify manifest hashes before recovery, restore SQL into a separate database first, and extract uploads into a separate directory before swapping validated data into service. Never import a dump directly over live data without a verified recovery plan.

## Repeatable tests

With both local servers running:

```text
node --test tests/category-data.test.mjs tests/epaper.test.mjs tests/public-reporters.test.mjs tests/homepage-data.test.mjs
cd backend
npm run typecheck
node --import tsx --test src/*.test.ts
node --import tsx scripts/test-production-security.mjs
node --import tsx scripts/test-media-library.mjs
node scripts/load-check.mjs
```

For the broader runtime test: set `TEST_API_URL=http://127.0.0.1:8000` and run `node --import tsx scripts/test-mysql-runtime.mjs`. These CRUD tests create temporary records and clean them up; run on staging, not during live publication.

Local load testing covers five concurrent clients and basic feeds, not peak production traffic. Repeat on production-equivalent hardware. Sitemap data uses one lightweight feed rather than hundreds of simultaneous requests, with a 60-second API cache. Currently it caps at 49,000 articles; implement sitemap partitioning before approaching that limit.

## Local verification completed

Production frontend/backend builds pass. Backend type checking and 15 unit tests pass; eight public-data integration tests, the production HTML test, security checks and media CRUD checks pass. Frontend and backend dependency audits report zero known vulnerabilities after updates. The homepage, login, robots, sitemap and API health return HTTP 200 in the local production server; the sitemap contains the imported published articles. The database-only backup was restored into an isolated database, with all table counts and canonical document hashes matching; the temporary restore database was then removed. Existing website records and media are preserved.

The latest local smoke load check used 25 requests with five concurrent clients (p50 381 ms; p95 1606 ms). This is not a production capacity test. A full uploads archive/off-site restore has not yet been verified.

## Remaining launch gates

Real-host deployment, HTTPS/domain verification, live Google login, restricted MySQL credentials, full uploads/off-site backup restoration, production hardware load testing, and active monitoring must be completed on the chosen host. AdSense approval, publisher configuration and consent/privacy requirements also remain account/deployment responsibilities; code changes cannot guarantee account approval.
