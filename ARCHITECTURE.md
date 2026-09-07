# NEWS24x7 India architecture

## Frontend

- `app/features/` — public feature boundaries for news, breaking ticker, search, audio, and theme.
- `app/admin/` — role-aware newsroom dashboard and feature managers.
- `app/news/[slug]/` — article detail page and opt-in text-to-speech reader.
- `app/api/backend/` — same-origin proxy to the Node.js service.
- `app/*.css` — global tokens plus feature-specific stylesheets imported by `layout.tsx`.

Pages import features through each feature's `index.ts`, keeping route files small and preventing deep cross-feature imports.

## Backend

- `backend/src/config.ts` — environment configuration.
- `backend/src/database.ts` — MongoDB/GridFS connection, indexes, and initial seeding.
- `backend/src/security.ts` — JWT sessions, password hashing, and role permissions.
- `backend/src/validation.ts` — validated API request models.
- `backend/src/serializers.ts` — stable API response formatting.
- `backend/src/routes/` — auth, users, articles, categories, reporters, dashboard, breaking-news, and audio APIs.
- `backend/src/server.ts` — Express application assembly and startup.
- `backend/.env.example` — backend configuration template; the root `env.example` configures the frontend.

News images, reporter photos and audio uploads are stored in MongoDB GridFS. See `README.md` and `backend/README.md` for startup and deployment commands.

## Hosting and build support

The frontend uses Vite, Vinext and the Cloudflare plugin. `vite.config.ts` imports `build/sites-vite-plugin.ts` and `.openai/hosting.json`; `worker/index.ts` provides the worker entry point. The `db/` and `drizzle/` directories support existing D1-backed routes and remain part of the application.
