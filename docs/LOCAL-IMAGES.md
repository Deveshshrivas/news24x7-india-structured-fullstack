# Local WordPress cover images

Keep the original `uploads/YYYY/MM/filename` tree at the project root, alongside
`backend`. Node serves supported raster images at `/uploads/YYYY/MM/filename`;
the website accesses them through `/api/backend/uploads/YYYY/MM/filename`.
Copy this uploads directory to the same location when deploying to Hostinger.
Do not flatten filenames: different months can contain different images with
identical names. These files are not stored in MongoDB or bundled by Vite.

From `backend`, run `npx tsx scripts/localize-cover-images.mjs` for a dry run.
Use `--apply` to change only exact matching article cover URLs. Both local
servers must be running for the image-serving preflight. The script checks
the current URL before each update, skips GridFS covers, and is repeatable.
Missing files and ambiguous names remain untouched. No backup is created
(the owner maintains an existing backup). Article dates and archived source
metadata are not changed. Uploaded gallery images are not migrated.

## New admin uploads

New article images/videos, reporter photos, and MP3 tracks are saved in
`uploads/YYYY/MM/private-<unique-id>.<extension>` using India time. MongoDB
`local_uploads` stores their paths and metadata. Existing API URLs and permission
checks still serve these files; the static uploads endpoint blocks `private-`
files. Old GridFS uploads remain readable without moving or deleting them.
Back up both MongoDB and the uploads directory. Hosting must provide persistent
writable disk shared by all backend instances (not an ephemeral serverless disk).

`npx tsx scripts/localize-imported-media.mjs` audits exact local matches in
imported media URL fields and embedded text. Add `--apply` to update them without
creating another backup. Missing files, YouTube links and external domains stay
unchanged. This also updates archived imported HTML/image lists; it does not
create new gallery items from those archived lists.

## Fetch missing imported media

Run `npx tsx scripts/download-imported-media.mjs` from `backend`. This changes
MongoDB as it processes articles, newest first, with eight concurrent workers.
It downloads from the original approved domains, checks response types and image
signatures, enforces file size limits, and never overwrites existing files.
Successful downloads use local API URLs. Unavailable images use the labelled
`/media-unavailable.svg` placeholder; unavailable audio/video references point to
their expected local path (not a fabricated playable file). The original URL and
failure reason are recorded in `uploads/.migration/remote-media.jsonl`.
The job can be rerun after interruption; finished records stay local. Restoring
unavailable originals later requires using the manifest to replace placeholders.
