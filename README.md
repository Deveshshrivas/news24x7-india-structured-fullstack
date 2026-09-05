# NEWS24x7 India

Full-stack Hindi news application with a Vinext/Next.js frontend and a Node.js, Express, TypeScript and MongoDB backend.

## Features

- Responsive Hindi news website with light and dark themes
- Dynamic categories, article pages, search and SEO metadata
- Automatic Hindi, English and Hinglish article slugs
- Email/password and optional Google OAuth login
- HTTP-only JWT session cookies
- Super admin, admin, editor, reporter and advertisement-manager roles
- Protected newsroom dashboard
- Persistent parent categories and subcategories managed from the dashboard
- Reporter profiles with designation, phone, email, address and GridFS photo upload
- Hindi/English dashboard language preference saved per browser
- MongoDB-backed articles, users and breaking news
- News photo uploads (JPG, PNG and WebP up to 8 MB) stored in MongoDB GridFS
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
| Login/register | `http://127.0.0.1:5173/login` |
| Admin dashboard | `http://127.0.0.1:5173/admin` |
| All news/search | `http://127.0.0.1:5173/latest` |
| Backend health | `http://127.0.0.1:8000/health` |
| Backend endpoint guide | `http://127.0.0.1:8000/docs` |
| Sitemap | `http://127.0.0.1:5173/sitemap.xml` |
| Robots | `http://127.0.0.1:5173/robots.txt` |

## First login and administrator

1. Open `/login`.
2. Register the first account.
3. The first registered account automatically becomes `super_admin`.
4. Later accounts start with the `reporter` role.
5. Only the super admin can create administrators and manage all user roles.

An `Email already registered` response means the account already exists. Select **Login** and use the password originally registered for that email.

## Optional Google OAuth

Create OAuth credentials in Google Cloud Console and add these local redirect URLs:

```text
http://127.0.0.1:8000/auth/google/callback
http://localhost:8000/auth/google/callback
```

Put the client ID and secret in `backend/.env`, then restart the backend.

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
db/           Cloudflare/D1 schema used by platform-side features
drizzle/      Database migrations
public/       Public static assets
scripts/      Install, build and environment helpers
tests/        Rendered HTML checks
worker/       Cloudflare Worker entry point
```

## Security

Never commit `.env`, `backend/.env`, MongoDB credentials, JWT secrets or Google client secrets. Commit only the provided example environment files.
