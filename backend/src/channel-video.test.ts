import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANNEL_ID,latestFromFeed} from './channel-video.js';
const entry=(id:string,date:string,title='News &amp; updates',channel=CHANNEL_ID)=>`<entry><yt:videoId>${id}</yt:videoId><yt:channelId>${channel}</yt:channelId><title>${title}</title><published>${date}</published></entry>`;
test('picks only the newest upload and decodes titles',()=>{
  const result=latestFromFeed(entry('abcdefghijk','2026-01-01')+entry('12345678901','2026-02-01','हिंदी &#38; English'));
  assert.equal(result?.id,'12345678901');assert.equal(result?.title,'हिंदी & English');
});
test('rejects malformed IDs, unrelated channels, invalid dates and missing feed',()=>{
  assert.equal(latestFromFeed(entry('bad','2026-01-01')),null);
  assert.equal(latestFromFeed(entry('abcdefghijk','bad-date')),null);
  assert.equal(latestFromFeed(entry('abcdefghijk','2026-01-01','Title','different')),null);
  assert.equal(latestFromFeed('<html>unavailable</html>'),null);
});
