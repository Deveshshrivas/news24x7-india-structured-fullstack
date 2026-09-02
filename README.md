# NEWS24x7 India — frontend and backend

Production-oriented Hindi news portal with a Vinext/Next.js frontend and FastAPI + MongoDB Atlas backend.

## Included

- Public responsive news website
- Google OAuth and email/password login
- HTTP-only JWT session cookie
- Roles: super admin, editor, reporter, ad manager
- Protected admin dashboard
- MongoDB-backed users, breaking news, and MP3 metadata
- Unlimited MP3 uploads using MongoDB GridFS
- Top 10 active audio playlist through the draggable 24×7 logo
- Render deployment blueprint for the backend

## 1. Run the backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp env.example .env
uvicorn main:app --reload --port 8000
```

Fill every value in `backend/.env`. In Google Cloud Console add:

```text
http://localhost:8000/auth/google/callback
https://YOUR-RENDER-SERVICE.onrender.com/auth/google/callback
```

## 2. Run the frontend

Create `.env.local` in the project root:

```env
BACKEND_URL=http://localhost:8000
```

Then run:

```bash
npm install
npm run dev
```

Open `/login`. The first registered account becomes `super_admin`; later accounts start as `reporter`, and a super admin can update roles.

## 3. Deploy backend to Render

Create a Render Blueprint from this repository using `backend/render.yaml`, then enter the secret environment variables. Set `BACKEND_URL` to the Render service URL, `FRONTEND_URL` to the deployed frontend, and `ALLOWED_ORIGINS` to the same frontend origin.

Never commit `.env`, `.env.local`, MongoDB credentials, Google client secret, or JWT secret.
