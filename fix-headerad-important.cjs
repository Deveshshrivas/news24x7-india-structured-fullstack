const fs = require('fs');
let code = fs.readFileSync('app/globals.css', 'utf8');

code = code.replace(
  '.headerad{display:none}',
  '.headerad{display:none !important}'
);

fs.writeFileSync('app/globals.css', code);
console.log("Added !important to .headerad mobile hiding");
