const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
  '            </div>\n        </div>\n        <aside>',
  '            </div>\n            <div style={{marginTop: "30px", minHeight: "150px"}}>\n              <AdPlacement placement="homeTop" fallback={<GoogleAd client="ca-pub-1979035915333459" slot="6277887241"/>}/>\n            </div>\n        </div>\n        <aside>'
);
fs.writeFileSync('app/page.tsx', code);
console.log("Ad added to page.tsx");
