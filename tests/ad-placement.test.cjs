const {test, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const {renderToStaticMarkup} = require('react-dom/server');
const React = require('react');

const originalLoader = require.extensions['.tsx'];
require.extensions['.tsx'] = (module, filename) => {
 const source = fs.readFileSync(filename, 'utf8');
 module._compile(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true}}).outputText, filename);
};
const AdPlacement = require('../app/ads/AdPlacement.tsx').default;
const AdUnit = require('../app/ads/AdUnit.tsx').default;
const originalFetch = global.fetch;
after(() => {global.fetch = originalFetch; require.extensions['.tsx'] = originalLoader;});

async function header(items) {
 global.fetch = async () => ({ok:true,json:async()=>({items})});
 return renderToStaticMarkup(await AdPlacement({placement:'homeTop',header:true}));
}
test('header uses uploaded campaign without mounting Google slot', async () => {
 const html = await header([{placement:'homeTop',imageUrl:'/banner.png',name:'Campaign'}]);
 assert.match(html, /headerCampaign/);
 assert.match(html, /banner.png/);
 assert.doesNotMatch(html, /adsbygoogle/);
});
test('header uses horizontal Google fallback without a matching banner', async () => {
 for(const items of [[],[{placement:'sidebar',imageUrl:'/sidebar.png'}],[{placement:'homeTop',imageUrl:''}]]) {
  const html = await header(items);
  assert.match(html, /adsbygoogle/);
  assert.match(html, /data-ad-format="horizontal"/);
  assert.match(html, /data-full-width-responsive="false"/);
 }
});
test('incomplete campaign does not mask an older valid header banner', async () => {
 const html = await header([{placement:'homeTop',imageUrl:''},{placement:'homeTop',imageUrl:'/valid.png'}]);
 assert.match(html, /valid.png/);
 assert.doesNotMatch(html, /adsbygoogle/);
});
test('campaign service failure keeps Google fallback available', async () => {
 global.fetch = async () => {throw Error('offline')};
 assert.match(renderToStaticMarkup(await AdPlacement({placement:'homeTop',header:true})), /adsbygoogle/);
});
test('separate top banner renders independently of uploaded header campaign', async () => {
 const html = renderToStaticMarkup(React.createElement(AdUnit,{client:'ca-pub-1979035915333459',slot:'6277887241',placement:'topBanner'})) + await header([{placement:'homeTop',imageUrl:'/banner.png'}]);
 assert.equal((html.match(/class="adsbygoogle"/g)||[]).length, 1);
 assert.match(html, /headerCampaign/);
 assert.match(html, /siteAd-topBanner/);
});
