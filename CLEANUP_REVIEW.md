# Project cleanup review

Reviewed on 2026-09-07.

## Scope and method

Reviewed tracked source imports across the frontend and Node.js backend, framework route entry points, frontend API call sites, stylesheets, package scripts, build configuration, hosting metadata and documentation. Files without importers were checked manually because pages, API routes and configuration files can be loaded by convention.

This is a source and build review, not a full browser regression test or an audit of external API consumers.

## Removed in this review

| Files or code | Evidence |
| --- | --- |
| `app/api/admin/users/route.ts` | TeamManager calls the Node.js `/api/backend/users` endpoints. |
| `app/api/breaking-news/route.ts` | BreakingManager and BreakingTicker call `/api/backend/breaking`. |
| `app/api/audio-highlights/route.ts` and `file/route.ts` | AudioHighlightsManager and HomeAudioHighlights use `/api/backend/audio`. |
| `app/chatgpt-auth.ts` | Only the retired API routes imported it. Current login uses backend JWT sessions through `app/app-auth.ts`. |
| D1 bootstrap and authorization functions in `app/admin/roles.ts` | Only the retired routes called them. Kept role labels and permissions used by the current dashboard. |
| `app/admin/AccessDenied.tsx` | No importers; the current admin page redirects unauthenticated visitors to login. |
| `app/category-news.css` | No imports; current category styles come from `category-rows.css` and the active shared styles. |
| `db/index.ts` | No callers of its `getDb` helper remained. |

The previous cleanup removed the starter notes example, three unused SVG icons and a duplicate backend environment template.

## Retained intentionally

- All active public pages, admin managers, Node.js routes, SEO files, image uploads and authentication code.
- `app/features/` exports: public pages import these modules.
- Tailwind and PostCSS: `app/globals.css` imports Tailwind.
- Cloudflare/Vinext configuration, `worker/`, `build/` and `.openai/hosting.json`: the frontend build uses these files.
- `db/schema.ts`, `drizzle/`, `drizzle.config.ts` and their dependencies: historical schema and migrations are referenced by the migration command and hosting packaging. No existing D1/R2 data was deleted.
- Package lockfiles, environment templates, local environment files, installed dependencies and runtime state.
- Build output and tool caches were not treated as unused source; production startup and local tooling can depend on them.

## Verification

- Production frontend build: `npx vite build` passed.
- Backend type check: `npm run typecheck` in `backend/` passed.
- Search for references to the removed modules and endpoints in application source found none.
- `git diff --check` passed.

The retired endpoints are no longer available. Any external integration still using them must move to the Node.js API. Removed tracked files remain recoverable from Git history.
