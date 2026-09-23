const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
  '        </div>\n          <div style={{marginTop: "30px", minHeight: "150px"}}><AdPlacement placement="homeTop" fallback={<GoogleAd client="ca-pub-1979035915333459" slot="8651402161" format="fluid" layoutKey="-6r+di+5g-2m-8y"/>}/></div>\n        <aside>',
  '          <div style={{marginTop: "30px", minHeight: "150px"}}><AdPlacement placement="homeTop" fallback={<GoogleAd client="ca-pub-1979035915333459" slot="8651402161" format="fluid" layoutKey="-6r+di+5g-2m-8y"/>}/></div>\n        </div>\n        <aside>'
);

fs.writeFileSync('app/page.tsx', code);
console.log("Fixed page.tsx grid layout");
