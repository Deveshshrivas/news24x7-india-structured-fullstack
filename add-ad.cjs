const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

if (!code.includes('AdPlacement placement="homeTop"')) {
  code = code.replace(
    '</article>\n            ))}\n          </div>\n        </div>',
    '</article>\n            ))}\n          </div>\n          <div style={{marginTop: "30px", minHeight: "150px"}}>\n            <AdPlacement placement="homeTop" fallback={<GoogleAd client="ca-pub-1979035915333459" slot="6277887241"/>}/>\n          </div>\n        </div>'
  );
  fs.writeFileSync('app/page.tsx', code);
  console.log("Ad added to page.tsx");
} else {
  console.log("Already added");
}
