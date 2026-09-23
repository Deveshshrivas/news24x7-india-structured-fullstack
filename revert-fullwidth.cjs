const fs = require('fs');

function revertFullWidth(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // Revert AdUnit
  code = code.replace(
    'data-full-width-responsive="false"',
    'data-full-width-responsive="true"'
  );
  // Revert GoogleAd fullWidth prop
  code = code.replace(
    /fullWidth=\{false\}/g,
    ''
  );
  fs.writeFileSync(filePath, code);
}

revertFullWidth('app/ads/AdUnit.tsx');
revertFullWidth('app/page.tsx');
revertFullWidth('app/CategoryNewsRows.tsx');
console.log("Reverted fullWidth settings");
