# Hostinger deployment

## GitHub deployment: one Business Node.js app

Connect this repository in Hostinger and choose **Other/Express**, not Next.js.
Use Node 24 (or 22.13+), root `./`, npm, build command `npm run build:hostinger`,
output directory `.` (retain both backend and frontend build directories), and
entry file `server.mjs`. An entry file is a filename, **not** `npm start`.
Alternatively, a start-command field accepts `npm run start:hostinger`.

Add the variables from `hostinger.env.example` to Hostinger before building.
Replace database placeholders and generate a real random JWT secret. Do not add
real `.env` files to GitHub. The launcher defaults to production, waits for the
database/API health check, then serves the frontend on Hostinger's assigned
`PORT`. The API is a supervised private process on loopback; public API requests
use `/api/backend`. There is no separate public backend domain.

Google login remains supported. Fill both OAuth credentials and register the
exact `GOOGLE_REDIRECT_URL` in Google Cloud Console. Public registration remains
disabled and Google login does not grant administrator privileges.

GitHub does **not** transfer the existing database or ignored `uploads/` files.
Import the protected SQL export into an empty hosting database and transfer the
uploads separately, preserving year/month paths. Never put the SQL export into
GitHub or public web storage. This adapter requires **MySQL 8**; verify the actual
hosting database version (MariaDB is not automatically compatible). Ask Hostinger
to confirm writable upload storage survives GitHub redeploys before uploading
the complete library. Hosting compatibility and production operation still need
verification on the real account.

The older VPS deployment instructions below are an alternative, not required
for the managed GitHub entry point above.

This ZIP contains source code, not Windows node_modules or compiled binaries. Real .env files, Git history, caches, backups and the old WordPress SQL dump are excluded. Configure secrets on your host; never upload this package to a public download location.

## Hosting requirements

Use Node 24 (or Node 22.13+), MySQL 8, persistent writable uploads storage and enough disk/inodes for approximately 130,000 media files. The managed entry point supervises the frontend and Express backend together. Confirm the managed hosting plan supports child processes and persistent uploads before deployment. Do not use static Vite hosting or assume standard Next.js build commands apply: this project uses vinext.

## VPS installation

1. Extract into a private application directory such as /srv/news24x7, not public_html. Install Node and MySQL 8.
2. Create a restricted MySQL application user and database. Import private-migration/database.sql into the **new empty database only**, using an operator account. The export includes existing users/password hashes and all database records. It is not automatically imported by Hostinger's ZIP uploader. Never serve or publish that file.
3. Configure backend/.env from backend/.env.hostinger.example and the root .env from env.hostinger.example. These production templates assume a VPS with the supplied same-origin HTTPS proxy; separate managed apps require their real backend address and assigned ports instead. Replace every placeholder. Set DATABASE_ENGINE=mysql, MYSQL_HOST/PORT/DATABASE/USER/PASSWORD, a strong new JWT_SECRET, NODE_ENV=production, COOKIE_SECURE=true, and actual HTTPS FRONTEND_URL/ALLOWED_ORIGINS. Backend internal BACKEND_URL is http://127.0.0.1:8000 on a VPS. Set the public site URL used by SEO, and set Google credentials/registered callback separately. See PRODUCTION-READINESS.md for the complete configuration.
4. If using separate archives, extract the media archive so uploads/ is directly inside the project root. Preserve every year/month filename. Do not expose uploads/_private or hidden trash/version directories directly through a web server; use the API's controlled routes.
5. Build on Linux:

```sh
npm ci
npm run build
cd backend
npm ci
npm run build
cd ..
```

6. Install/configure PM2 and Nginx using deployment/ecosystem.config.cjs and deployment/nginx.conf.example. Adapt the project directory, actual domain and TLS certificate paths. API listens internally on 8000; frontend on 3000; only the HTTPS proxy is public.
7. Test login, a migrated article/image, an authenticated media upload, a YouTube embed, and sitemap.xml. Configure local-server backups outside public files. Delete the hosting copy of private-migration/database.sql only after verifying import and retaining a protected backup.

## Managed Node Web App upload screen

For managed deployment, use the GitHub settings at the top of this guide: `npm run build:hostinger`, output `.`, entry `server.mjs`. The supplied VPS configuration is not automatically applied by this screen. The database import, media transfer and persistent-storage verification are still separate operator steps.

The full private archive additionally includes uploads/ and private-migration/database.sql. A smaller application-only archive excludes these for services with upload-size limits; transfer data/media separately through a secure hosting method. Both require hosting environment configuration.
