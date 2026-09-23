const fs = require('fs');
let code = fs.readFileSync('backend/src/serializers.ts', 'utf8');

code = code.replace(
  'seoImageUrl:article.image_file_id?`/api/backend/articles/${article._id}/image`:article.image_url};',
  'seoImageUrl:article.image_file_id?`/api/backend/articles/${article._id}/image`:article.image_url,views:article.views||0,readingSeconds:article.reading_seconds||0};'
);

fs.writeFileSync('backend/src/serializers.ts', code);
console.log("Added views to articleResponse in serializers.ts");
