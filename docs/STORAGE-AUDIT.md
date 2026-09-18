# Read-only MongoDB storage audit — 2026-09-18

Audited the configured application database. No records or indexes were modified.
Re-run with `cd backend` then `npx tsx scripts/audit-storage.mjs`.
This scans all articles and transfers their contents; avoid frequent runs on the free tier.

## Findings

- 20,501 live articles, all imported from WordPress.
- No repeated migration keys: the same source record was not imported twice.
- 138 groups with identical trimmed title and body, representing 148 extra records.
  Estimated extra document bytes: 1,570,110 (1.50 MiB), excluding indexes.
  These are distinct source records and URLs; do not delete automatically.
- 389 groups of repeated titles (478 extra records). Titles alone do not establish duplicates.
- Article BSON data: 215,154,286 bytes (205.19 MiB).
- Archived `legacy_html` field: 83,599,956 bytes (79.73 MiB).
  This is original HTML, not necessarily byte-identical to `body`; only 173 are identical.
  The current reader serves plain-text `body`, not the archived HTML.
  Media migration scripts still use the archive. Preserve it in an external archive before removal.

## Article indexes

| Index | Bytes | Recommendation |
| --- | ---: | --- |
| `title_text_excerpt_text_body_text` | 202,088,448 | Removal candidate: current application search uses regex, not `$text`. |
| `slug_keys_1` | 16,920,576 | Keep: historical URL aliases and uniqueness. |
| `slug_1` | 5,607,424 | Keep: canonical slug lookups and uniqueness. |
| `_id_` | 1,556,480 | Keep: required identity index. |
| `category_1_published_at_-1` | 946,176 | Keep: category feed. |
| `status_1_published_at_-1` | 475,136 | Keep: published feed. |

The text index alone occupies 192.73 MiB. No `$text` or text-score queries were
found in the current application source. Atlas rejected `$indexStats`, so this
is a code-based recommendation, not proof of zero historical usage by external clients.
Startup currently creates the text index in `backend/src/database.ts`; remove
that creation call as part of any approved index removal or startup will recreate it.

Other findings: a recovery collection contains 28 archived original posts (36,540
document bytes); it is not the live article collection. Existing GridFS audio
contains about 1.16 MB of actual data. Allocated storage sizes can differ greatly
from document sizes, and these measurements need not match the Atlas UI metric.

## Safe next step

Approve removing only the unused text index and its startup creation call first.
Do not remove URL indexes, security/TTL indexes, GridFS chunk indexes, or article
records. Re-measure after the change. Archive removal and deduplication require
separate approval and, for deduplication, alias/metadata preservation.
