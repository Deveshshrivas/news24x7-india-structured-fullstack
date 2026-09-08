# Automatic daily e-paper

Open `/e-paper`. The latest 30 publication dates appear automatically from published MongoDB articles, grouped in Asia/Kolkata time. Each date links to `/e-paper/YYYY-MM-DD` and contains all currently published stories from that date, latest first. New publications appear on refresh. Dates with no published stories have no edition; future-dated stories and drafts are excluded.

This is a combined daily **news digest**, with real titles, summaries, photos, authors and links to full articles. Regional editions are not fabricated. The reader groups four summaries per screen; printed pagination can differ for long content.

Select **PDF सहेजें / प्रिंट**, then choose **Save as PDF** in your browser. All reader pages are included, not only the visible page. A4 print styles keep text dark on white. Remote photos must remain accessible to appear in the PDF.

No scheduler, Chromium server dependency, uploaded PDF or permanent snapshot is required. Editions are generated on request from current published records; editing/unpublishing a story changes its edition. This is not an immutable historical archive or a one-click server-generated PDF download.

API: `GET /epaper`, `GET /epaper/YYYY-MM-DD`. Existing numeric edition links 1–4 redirect to the latest available edition. No article data is changed by generation.

With backend and frontend running, test with `node --test tests/epaper.test.mjs`.
