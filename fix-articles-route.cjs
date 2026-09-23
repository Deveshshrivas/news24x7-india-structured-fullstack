const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/articles.ts', 'utf8');

code = code.replace(
  'response.json({items:items.map(item=>({...articleResponse(item),views:item.views||0,readingSeconds:item.reading_seconds||0}))});return;',
  'response.json({items:items.map(item=>articleResponse(item))});return;'
);

fs.writeFileSync('backend/src/routes/articles.ts', code);
console.log("Cleaned up redundant views map in articles.ts");
