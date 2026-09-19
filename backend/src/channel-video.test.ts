import test from 'node:test';
import assert from 'node:assert/strict';
import {latestFromHtml} from './channel-video.js';

test('picks the video ID and title from ytInitialData', () => {
  const fakeHtml = `<html><head><script>var ytInitialData = {"videoId":"12345678901","title":{"runs":[{"text":"My New Video"}]}};</script></head><body></body></html>`;
  const result = latestFromHtml(fakeHtml);
  assert.equal(result?.id, '12345678901');
  assert.equal(result?.title, 'My New Video');
});

test('rejects missing data or malformed HTML', () => {
  assert.equal(latestFromHtml('<html>unavailable</html>'), null);
  assert.equal(latestFromHtml('<script>var ytInitialData = {};</script>'), null);
});
