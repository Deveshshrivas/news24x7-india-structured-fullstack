# NEWS24x7 FastAPI backend

FastAPI and MongoDB backend for NEWS24x7 India. It provides authentication, role-based access, news articles, breaking news and GridFS audio storage.

## Windows PowerShell

```powershell
cd backend
py -3.12 -m venv .venv
Set-ExecutionPolicy -Scope Process Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
# Fill MONGODB_URI and JWT_SECRET in .env.
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000 --env-file .env
```

## macOS or Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
# Fill MONGODB_URI and JWT_SECRET in .env.
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000 --env-file .env
```

Check [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) and API documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

For Google OAuth, configure `${BACKEND_URL}/auth/google/callback` as an authorized redirect URI.

Do not commit `backend/.env`. The repository includes `.env.example` only as a safe template.
