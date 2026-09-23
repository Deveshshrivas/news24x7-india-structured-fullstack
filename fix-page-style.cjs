const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
  '<div style={{marginTop: "30px", minHeight: "150px", maxWidth: "728px", margin: "30px auto"}}>',
  '<div style={{minHeight: "150px", maxWidth: "728px", margin: "30px auto"}}>'
);

fs.writeFileSync('app/page.tsx', code);
console.log("Fixed page.tsx inline styles");
