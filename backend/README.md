# NEWS24x7 Node.js backend

Node.js, Express, TypeScript and MongoDB backend for NEWS24x7 India. It provides authentication, role-based access, news articles, category hierarchies, reporter profiles with GridFS photos, breaking news and GridFS audio storage.

## Setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
# Fill MONGODB_URI and JWT_SECRET in .env.
npm run dev
```

On macOS or Linux, replace `Copy-Item` with `cp`.

The development server watches TypeScript files and runs at `http://127.0.0.1:8000`. Verify it at [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health), and view the endpoint guide at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## Production

```bash
npm ci
npm run build
npm start
```

For Google OAuth, configure `${BACKEND_URL}/auth/google/callback` as an authorized redirect URI.

Existing FastAPI-created MongoDB records, bcrypt password hashes and HS256 JWT sessions remain compatible. Never commit `backend/.env`.
