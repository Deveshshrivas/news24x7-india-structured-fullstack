const fs = require('fs');
let code = fs.readFileSync('app/sitemap.ts', 'utf8');

code = code.replace(/encodeURIComponent\(category\)/g, 'category');
code = code.replace(/encodeURIComponent\(a\.slug\)/g, 'a.slug');

fs.writeFileSync('app/sitemap.ts', code);
console.log("Removed encodeURIComponent from sitemap");
