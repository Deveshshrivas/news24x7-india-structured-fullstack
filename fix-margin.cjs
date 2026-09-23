const fs = require('fs');
let css = fs.readFileSync('app/home-editorial.css', 'utf8');
css = css.replace('.newsHome .headerSearch{margin-left:0}', '');
fs.writeFileSync('app/home-editorial.css', css);
console.log("Removed margin-left: 0");
