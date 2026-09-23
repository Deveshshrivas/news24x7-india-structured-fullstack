const fs = require('fs');
let code = fs.readFileSync('app/ads/AdUnit.tsx', 'utf8');
code = code.replace(
  'style={{display:\'block\'}}',
  'style={{display:\'block\', overflow: \'hidden\'}}'
);
fs.writeFileSync('app/ads/AdUnit.tsx', code);
console.log("Fixed AdUnit style");
