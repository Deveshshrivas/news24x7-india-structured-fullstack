import test from "node:test";
import assert from "node:assert/strict";
import {newsSlug} from "./news-slug.js";

test("Hindi, English and Hinglish titles generate Roman slugs", () => {
  assert.equal(newsSlug("भारत की खबर"), "bharat-ki-khabar");
  assert.equal(newsSlug("Breaking News Today!"), "breaking-news-today");
  assert.equal(newsSlug("Bharat ki Latest Khabar"), "bharat-ki-latest-khabar");
  assert.equal(newsSlug("भारत की Latest News 2026"), "bharat-ki-latest-news-2026");
  assert.equal(newsSlug("खेल और शिक्षा"), "khel-aur-shiksha");
});
test("slugs are bounded, safe and stable", () => {
  for (const title of ["नई ऊर्जा, नया भारत", "मध्य प्रदेश समाचार", "शहरों से गांवों तक", "Café NEWS", "समाचार ".repeat(100)]) {
    const slug = newsSlug(title);
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(slug.length <= 180);
    assert.equal(newsSlug(slug), slug);
  }
  assert.equal(newsSlug("!!! 🎉"), "");
});
