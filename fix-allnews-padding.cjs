const fs = require('fs');
let code = fs.readFileSync('app/all-news.css', 'utf8');

code = code.replace(
  '.allNewsTitle h1{font-size:30px}',
  '.allNewsTitle h1{font-size:30px}.allNews{padding:24px 16px 50px}'
);

fs.writeFileSync('app/all-news.css', code);
console.log("Updated mobile padding in all-news.css");
