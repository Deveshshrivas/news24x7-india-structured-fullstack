const fs = require('fs');

function fixAdUnit(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(
    'data-full-width-responsive="true"',
    'data-full-width-responsive="false"'
  );
  fs.writeFileSync(filePath, code);
}

fixAdUnit('app/ads/AdUnit.tsx');
console.log("Fixed AdUnit");
