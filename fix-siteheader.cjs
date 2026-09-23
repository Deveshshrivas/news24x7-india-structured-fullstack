const fs = require('fs');
let code = fs.readFileSync('app/SiteHeader.tsx', 'utf8');

code = code.replace(
  'return (\n      <>\n        <div className="topline">',
  'return (\n      <div className="newsHome">\n        <div className="topline">'
);

code = code.replace(
  '</header>\n      </>\n    );',
  '</header>\n      </div>\n    );'
);

fs.writeFileSync('app/SiteHeader.tsx', code);
console.log("Wrapped SiteHeader in .newsHome");
