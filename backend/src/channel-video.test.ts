import test from 'node:test';
import assert from 'node:assert/strict';
import {extractFromRss} from './channel-video.js';

test('picks the video ID and title from RSS XML', () => {
  const fakeXml = `<feed><entry><yt:videoId>12345678901</yt:videoId><title>My New Video</title><published>2023-01-01T00:00:00Z</published></entry></feed>`;
  const result = extractFromRss(fakeXml);
  assert.equal(result?.id, '12345678901');
  assert.equal(result?.title, 'My New Video');
  assert.equal(result?.publishedAt, '2023-01-01T00:00:00Z');
});

test('rejects missing data or malformed XML', () => {
  assert.equal(extractFromRss('<feed>unavailable</feed>'), null);
  assert.equal(extractFromRss('<feed><entry><title>No ID here</title></entry></feed>'), null);
});
