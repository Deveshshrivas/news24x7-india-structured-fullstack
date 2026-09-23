const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
  'minHeight: "150px", maxWidth: "728px", margin: "30px auto", overflow: "hidden"',
  'width: "100%", minHeight: "150px", maxWidth: "728px", margin: "30px auto", overflow: "hidden"'
);

fs.writeFileSync('app/page.tsx', code);
console.log("Added width: 100% to page.tsx ad");
