const fs = require('fs');
let code = fs.readFileSync('app/sitemap.ts', 'utf8');

code = code.replace(/url:absoluteUrl\(([^)]+)\)/g, 'url: siteUrl + $1');
code = code.replace("import {absoluteUrl} from './seo';", "import {siteUrl} from './seo';");

fs.writeFileSync('app/sitemap.ts', code);
console.log("Replaced absoluteUrl with manual concat");
