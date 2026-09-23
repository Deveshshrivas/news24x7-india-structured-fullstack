const fs = require('fs');
let code = fs.readFileSync('app/all-news.css', 'utf8');

code = code.replace(
  '.newsFilters input,.newsFilters select{border:1px solid #dfe3e8;border-radius:7px;padding:12px;background:white;font:inherit}',
  '.newsFilters input,.newsFilters select{border:1px solid #dfe3e8;border-radius:7px;padding:12px;background:white;font:inherit;min-width:0}'
);

fs.writeFileSync('app/all-news.css', code);
console.log("Added min-width: 0 to inputs in all-news.css");
