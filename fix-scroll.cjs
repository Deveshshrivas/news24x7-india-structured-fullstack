const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');

if (!css.includes('body { overflow-x: hidden; }') && !css.includes('overflow-x: hidden')) {
  css = 'html, body { overflow-x: hidden; width: 100%; }\n' + css;
  fs.writeFileSync('app/globals.css', css);
  console.log("Added overflow-x: hidden to globals.css");
} else {
  console.log("Already has overflow-x hidden");
}
