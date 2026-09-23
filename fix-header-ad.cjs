const fs = require('fs');
let code = fs.readFileSync('app/SiteHeader.tsx', 'utf8');

code = code.replace(
  'className="headerAdContainer"',
  'className="headerAdContainer headerad"'
);

fs.writeFileSync('app/SiteHeader.tsx', code);
console.log("Added headerad class to headerAdContainer");
