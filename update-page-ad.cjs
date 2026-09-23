const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
  'fallback={<GoogleAd client="ca-pub-1979035915333459" slot="6277887241"/>}/></div>\n        <aside>',
  'fallback={<GoogleAd client="ca-pub-1979035915333459" slot="8651402161" format="fluid" layoutKey="-6r+di+5g-2m-8y"/>}/></div>\n        <aside>'
);

fs.writeFileSync('app/page.tsx', code);
console.log("Updated page.tsx with new ad slot");
