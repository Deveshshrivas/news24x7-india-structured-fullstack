const fs = require('fs');
let code = fs.readFileSync('backend/src/sitemap-data.ts', 'utf8');

code = code.replace(
  '{projection:{_id:0,slug:1,category:1,published_at:1,updated_at:1,image_url:1,image_file_id:1}}',
  '{projection:{_id:1,slug:1,category:1,published_at:1,updated_at:1,image_url:1,image_file_id:1}}'
);

code = code.replace(
  'row.slug+"/image"',
  'row._id+"/image"'
);

fs.writeFileSync('backend/src/sitemap-data.ts', code);
console.log("Fixed sitemap-data.ts");
