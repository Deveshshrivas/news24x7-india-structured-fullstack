const fs = require('fs');

function fixGoogleAdCalls(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(
    /format="auto"/g,
    'format="auto" fullWidth={false}'
  );
  fs.writeFileSync(filePath, code);
}

fixGoogleAdCalls('app/page.tsx');
fixGoogleAdCalls('app/CategoryNewsRows.tsx');
console.log("Fixed GoogleAd calls");
