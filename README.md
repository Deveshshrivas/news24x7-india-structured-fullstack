# NEWS24x7 India

Full-stack Hindi news application with a Vinext/Next.js frontend and a Node.js, Express, TypeScript and MongoDB backend.

## Features

- Responsive Hindi news website with light and dark themes
- Dynamic categories, article pages, search and SEO metadata
- SEO is automatic from the article title, summary, category and cover photo; the dashboard has no manual SEO form
- Automatic Hindi, English and Hinglish article slugs
- Optional custom slugs in the news editor, with duplicate protection and redirects from previous article URLs
- Email/password and optional Google OAuth login
- HTTP-only JWT session cookies
- Super admin, admin, editor, reporter and advertisement-manager roles
- Protected newsroom dashboard
- Persistent parent categories and subcategories managed from the dashboard
- Reporter profiles with designation, phone, email, address and GridFS photo upload
- Hindi/English dashboard language preference saved per browser
- MongoDB-backed articles, users and breaking news
- News photo uploads (JPG, PNG and WebP up to 8 MB) stored in MongoDB GridFS
- Article galleries: up to 8 extra photos and 2 MP4/WebM videos, with previews, ordering and removal in the news editor
- MongoDB GridFS audio uploads and playlist
- Dynamic sitemap, robots rules, Open Graph and `NewsArticle` schema

## Requirements

Install these before starting:

- [Node.js](https://nodejs.org/) 22.13 or newer
- npm 10 or newer
- A MongoDB Atlas database or local MongoDB server
- Git (required only for cloning)

Google OAuth credentials are optional. Email/password login works without them.

## 1. Clone the project

```bash
git clone https://github.com/Deveshshrivas/news24x7-india-structured-fullstack.git
cd news24x7-india-structured-fullstack
```

The backend and frontend must run in separate terminals.

## 2. Configure and run the backend

### Windows PowerShell

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Open `backend/.env` and replace the MongoDB and JWT placeholders:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=news24x7
MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1
JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BACKEND_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:5173
COOKIE_SECURE=false
ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

Start the Node.js API:

```powershell
npm run dev
```

### macOS or Linux

```bash
cd backend
npm install
cp .env.example .env
# Edit backend/.env before continuing.
npm run dev
```

Verify the backend at [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health). A working API returns:

```json
{"ok": true}
```

The first backend startup creates the required MongoDB indexes and inserts sample news if the articles collection is empty.

## 3. Configure and run the frontend

Open a second terminal in the project root, not inside `backend`.

### Windows PowerShell

```powershell
npm install
Copy-Item env.example .env
$env:WRANGLER_LOG_PATH = ".wrangler/wrangler.log"
npx vite --host 127.0.0.1 --port 5173
```

### macOS or Linux

```bash
npm install
cp env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

The root `.env` should contain:

```env
BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:5173
GOOGLE_SITE_VERIFICATION=
```

Open the application at [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Application URLs

| Page | URL |
| --- | --- |
| News website | `http://127.0.0.1:5173` |
| Team login | `http://127.0.0.1:5173/login` |
| Admin dashboard | `http://127.0.0.1:5173/admin` |
| All news/search | `http://127.0.0.1:5173/latest` |
| Backend health | `http://127.0.0.1:8000/health` |
| Backend endpoint guide | `http://127.0.0.1:8000/docs` |
| Sitemap | `http://127.0.0.1:5173/sitemap.xml` |
| Robots | `http://127.0.0.1:5173/robots.txt` |

## First login and administrator

1. Open `/login`.
2. Sign in with an existing account provided by the super admin.
3. Public email signup and automatic Google account creation are disabled.
4. Only the super admin can create accounts and manage roles in **Team and roles**.
5. Google login requires a verified email matching an existing active account.

Existing accounts are preserved. A fresh database needs a super admin provisioned by its operator; the public login page cannot bootstrap privileged accounts.

## Article photos and videos

In **New post** or **Edit news**, choose the main cover photo and add extra media in **Photos and videos**. Save the article to apply additions, removals and ordering. Existing gallery media stays attached when editing unless explicitly removed.

- Gallery photos accept JPG, PNG and WebP up to 8 MB each. The editor resizes them to a maximum 1920-pixel edge and uses WebP compression when it reduces size.
- Videos accept MP4 and WebM up to 40 MB each. Use browser-compatible codecs (for example H.264/AAC in MP4); videos are not transcoded by the server.
- New gallery uploads can total up to 72 MB in the editor; the API permits 80 MB including a cover photo.
- Published photos load lazily. Videos use controls, no autoplay and no automatic preload, with byte-range streaming for seeking.
- Draft media requires an authorized session. Removing saved media takes effect when the article is saved; deleting the article also removes its gallery files.

## Optional Google OAuth

Create OAuth credentials in Google Cloud Console and add these local redirect URLs:

```text
http://127.0.0.1:8000/auth/google/callback
http://localhost:8000/auth/google/callback
```

Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`, then restart the backend. Both are required. Google login remains limited to existing accounts authorized by the super admin; it does not enable public signup.

Keep database credentials, `JWT_SECRET`, OAuth secrets, cookie settings and allowed origins only in `backend/.env`. The root `.env` only needs `BACKEND_URL`, `NEXT_PUBLIC_SITE_URL`, and optional `GOOGLE_SITE_VERIFICATION` (Search Console, unrelated to Google login).

For local development, set backend `BACKEND_URL=http://127.0.0.1:8000` and `FRONTEND_URL=http://127.0.0.1:5173`. A placeholder hosting URL in `BACKEND_URL` will produce an incorrect Google callback. For deployment, replace these with your real HTTPS addresses, update the OAuth redirect URI and allowed origins, and set `COOKIE_SECURE=true`. `PORT`, `NODE_ENV`, and `MONGODB_DNS_SERVERS` are optional runtime overrides; do not remove them from hosting settings if your host supplies them.

## Stop the application

Press `Ctrl+C` in both terminals. On the next start, run `npm run dev` again inside `backend`, then start the frontend from the project root.

## Common problems

### `MONGODB_URI is required`

Run the backend with `--env-file .env` from the `backend` directory and confirm `backend/.env` contains a valid MongoDB URI.

### Frontend shows API errors or `401 Unauthorized`

- Confirm the backend health URL returns `{"ok": true}`.
- Confirm root `.env` has `BACKEND_URL=http://127.0.0.1:8000`.
- Confirm `ALLOWED_ORIGINS` contains the exact frontend origin.
- Restart both processes after changing environment files.
- A `401` during login normally means the email or password is incorrect.

### Registration returns `409 Conflict`

The email is already registered. Use the login form instead of creating the account again.

### Port already in use

Stop the old process using `Ctrl+C`, or find it in PowerShell:

```powershell
netstat -ano | Select-String ':5173|:8000'
```

### `npm run dev` fails on Windows

The package script uses Unix environment-variable syntax. Use the documented PowerShell commands instead:

```powershell
$env:WRANGLER_LOG_PATH = ".wrangler/wrangler.log"
npx vite --host 127.0.0.1 --port 5173
```

### Google login redirects incorrectly

The Google Cloud redirect URI, `BACKEND_URL`, `FRONTEND_URL` and the URL in your browser must use matching hosts and ports.

## Production build

The verified build scripts require Bash. Run this through Git Bash, WSL, macOS or Linux:

```bash
npm ci
npm run build
```

For the Node.js backend, `backend/render.yaml` provides a Render Blueprint. Set all production secrets in the hosting dashboard—never commit them.

## Project structure

```text
app/          Frontend routes, components, styles and SEO
backend/      Node.js/Express API, authentication and MongoDB integration
db/           Historical D1 schema retained for migration tooling
drizzle/      Historical D1 migrations included in hosting builds
public/       Public static assets
scripts/      Install, build and environment helpers
tests/        Rendered HTML checks
worker/       Cloudflare Worker entry point
```

## News URL language

News titles and automatic SEO keep the language entered (Hindi, English or Hinglish). New automatic news slugs use Roman letters: `भारत की खबर` becomes `bharat-ki-khabar`. The admin slug preview and backend use the same converter. Roman spellings can vary; editors can enter their preferred Hinglish spelling manually. To change an existing saved URL, use **Generate from title** and save; its old URL remains an alias. Existing published database URLs are not bulk-renamed.

Run the slug tests from `backend` with `npx tsx --test src/news-slug.test.ts`.

## Reporter directory

- The homepage **हमारे रिपोर्टर** link opens `/reporters`, listing active reporter profiles.
- News articles show the creator's byline and a profile link at the bottom. The profile lists only their published stories, with pagination.
- To attach a photo and designation to an author's byline, create or edit their profile in **Admin → Reporters** using the same email as their login account. Matching happens on the server; names alone are never used to assign authorship.
- Only name, designation and photo are public. Phone, email and address stay in the protected admin API. Authors without a matching profile retain a name-only public author page when they have published work.
- With the backend running, check public API privacy with `node --test tests/public-reporters.test.mjs`.

## Secrets

Never commit `.env`, `backend/.env`, MongoDB credentials, JWT secrets or Google client secrets. Commit only the provided example environment files.
