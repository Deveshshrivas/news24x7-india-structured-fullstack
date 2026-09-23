const fs = require('fs');
let code = fs.readFileSync('app/CategoryNewsRows.tsx', 'utf8');

code = code.replace(
  '<div style={{gridColumn: "1 / -1", width: "100%", margin: "20px 0"}}>',
  '<div style={{gridColumn: "1 / -1", width: "100%", maxWidth: "728px", margin: "30px auto"}}>'
);

fs.writeFileSync('app/CategoryNewsRows.tsx', code);
console.log("Updated CategoryNewsRows ad wrapper");
