const fs = require('fs');

function replaceAd(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(
    /slot="8651402161" format="fluid" layoutKey="-6r\+di\+5g-2m-8y"/g,
    'slot="2924343470" format="auto"'
  );
  fs.writeFileSync(filePath, code);
}

replaceAd('app/page.tsx');
replaceAd('app/CategoryNewsRows.tsx');
console.log("Updated both files with new ad unit");
