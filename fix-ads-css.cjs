const fs = require('fs');
let code = fs.readFileSync('app/ads/ads.css', 'utf8');

code = code.replace(
  '.articleAdRailRight{grid-column:1;grid-row:2;flex-direction:row;flex-wrap:wrap;justify-content:center;gap:24px}',
  '.articleAdRailRight{display:none}'
);
code = code.replace(
  '.articleAdRailRight .siteAd{flex:1 1 250px}',
  ''
);

fs.writeFileSync('app/ads/ads.css', code);
console.log("Updated ads.css to hide right rail on narrow screens");
