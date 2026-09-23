const fs = require('fs');

function addOverflowHidden(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // CategoryNewsRows
  code = code.replace(
    'width: "100%", maxWidth: "728px", margin: "30px auto"',
    'width: "100%", maxWidth: "728px", margin: "30px auto", overflow: "hidden"'
  );
  // page.tsx
  code = code.replace(
    'minHeight: "150px", maxWidth: "728px", margin: "30px auto"',
    'minHeight: "150px", maxWidth: "728px", margin: "30px auto", overflow: "hidden"'
  );
  fs.writeFileSync(filePath, code);
}

addOverflowHidden('app/page.tsx');
addOverflowHidden('app/CategoryNewsRows.tsx');
console.log("Added overflow: hidden");
