# NEWS24x7 FastAPI backend

MongoDB Atlas backend with Google OAuth, email/password authentication, JWT cookies, role-based authorization, breaking-news APIs, and unlimited MP3 storage through MongoDB GridFS.

## Local run

1. Copy `.env.example` to `.env` and fill the values.
2. Run `python -m venv .venv` and activate it.
3. Run `pip install -r requirements.txt`.
4. Run `uvicorn main:app --reload --port 8000`.

For Google OAuth, add `${BACKEND_URL}/auth/google/callback` as an authorized redirect URI in Google Cloud Console.
