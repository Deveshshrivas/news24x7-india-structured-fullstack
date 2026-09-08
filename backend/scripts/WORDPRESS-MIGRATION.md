# WordPress content import

From `backend`, inspect or import the source dump:

```powershell
npx tsx scripts/import-wordpress.mjs ../u655803177_Q12Dc.sql
npx tsx scripts/import-wordpress.mjs ../u655803177_Q12Dc.sql --apply
```

The first command is a dry run. Only published, non-password-protected `post` records and categories are imported. Existing categories with identical names are reused. Existing articles are not overwritten. Stable source IDs and insert-only upserts make reruns safe; imported articles carry `migration_source` and `migration_key` fields.

Original dates and public author display names are retained; login accounts, passwords, plugin settings/logs, drafts and trashed posts are excluded. WordPress HTML is retained as `legacy_html` but the article reader receives plain text, never executable HTML. Main images use existing remote URLs. Other inline image URLs and original category IDs are archived as legacy fields; this does not copy the uploads folder or render all inline images.

Roman slugs are generated, and unclaimed old slug forms are kept as aliases under `/news/`. This does not configure redirects from the old domain or its root-level WordPress permalinks. Main images continue to depend on the old site's hosting.

Source SQL dumps are private and must never be committed or placed in `public/`.
