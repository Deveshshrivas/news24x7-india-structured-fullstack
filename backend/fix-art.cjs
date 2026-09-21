const fs = require('fs');
let code = fs.readFileSync('src/routes/articles.ts', 'utf8');

if (!code.includes('optimizeImage')) {
  code = code.replace(
    `import {uploadArticleMedia`,
    `import {optimizeImage} from "../optimize-image.js";\nimport {uploadArticleMedia`
  );

  code = code.replace(
    `async function saveImage(file:Express.Multer.File){`,
    `async function saveImage(file:Express.Multer.File){file = await optimizeImage(file);`
  );
  
  fs.writeFileSync('src/routes/articles.ts', code);
  console.log("Updated articles.ts");
}
