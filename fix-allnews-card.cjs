const fs = require('fs');
let code = fs.readFileSync('app/all-news.css', 'utf8');

code = code.replace(
  '.newsArchiveCard{display:block;border:1px solid #e2e6eb;border-radius:10px;overflow:hidden;background:white;color:inherit;text-decoration:none}',
  '.newsArchiveCard{display:block;border:1px solid #e2e6eb;border-radius:10px;overflow:hidden;background:white;color:inherit;text-decoration:none;min-width:0}'
);

fs.writeFileSync('app/all-news.css', code);
console.log("Added min-width: 0 to newsArchiveCard in all-news.css");
