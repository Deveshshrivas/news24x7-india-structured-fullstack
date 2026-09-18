# Media library

Open `/admin` and select **Media library**. The catalog reads images, videos and MP3 files from `uploads/YYYY/MM/` and includes migrated database-backed media. Files are indexed in MySQL; their contents remain on disk rather than being duplicated in the database.

- Search filenames/display titles; filter by type, year and month; browse 24 files per page.
- Upload images (8 MB), videos (40 MB), or MP3 audio (25 MB).
- Edit display title, image alternative text, and caption. Replace files using the same format without changing existing URLs. Display metadata is stored in the library; it does not rewrite existing article text/captions.
- Delete moves unused files to `uploads/.trash/`. Switch the status filter to **Trash** to restore them. Referenced news, reporter, and audio files cannot be deleted. There is no permanent-delete action.
- Replaced disk files are retained in `uploads/.versions/`. Back up these folders with the rest of uploads; restoration of replacement versions is not exposed in the dashboard.
- Admins and super admins manage all media. Editors can browse all media but only change their own uploads; reporters and advertising managers can browse/manage only their own uploads.
- Private article/profile/audio storage remains protected behind authenticated preview endpoints. Only public library files offer a reusable public URL.

Click **Refresh** after copying additional files into uploads. The initial folder scan can take several minutes. Only supported media extensions in year/month folders are indexed; arbitrary documents and external YouTube videos are not copied into the library.

Manual indexing from the backend directory:

```powershell
node --import tsx scripts/sync-media-library.mjs
```

With the backend running, verify CRUD on a disposable image:

```powershell
node --import tsx scripts/test-media-library.mjs
```
