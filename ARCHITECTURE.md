# NEWS24x7 India architecture

## Frontend

- `app/features/` — public feature boundaries for news, breaking ticker, search, audio, and theme.
- `app/admin/` — role-aware newsroom dashboard and feature managers.
- `app/news/[slug]/` — article detail page and opt-in text-to-speech reader.
- `app/api/backend/` — same-origin proxy to the FastAPI service.
- `app/*.css` — global tokens plus feature-specific stylesheets imported by `layout.tsx`.

Pages import features through each feature's `index.ts`, keeping route files small and preventing deep cross-feature imports.

## Backend

- `backend/app/config.py` — environment configuration.
- `backend/app/database.py` — MongoDB/GridFS connection, indexes, and initial seeding.
- `backend/app/security.py` — JWT sessions, password hashing, and role permissions.
- `backend/app/schemas.py` — validated API request models.
- `backend/app/serializers.py` — stable API response formatting.
- `backend/app/routers/` — independent auth, users, articles, breaking-news, and audio APIs.
- `backend/app/main.py` — application assembly only.
- `backend/main.py` — compatibility entry point for existing Render commands.

This structure keeps feature logic isolated while preserving all existing URLs and deployment commands.
