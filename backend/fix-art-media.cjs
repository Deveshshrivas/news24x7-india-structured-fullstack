const fs = require('fs');
let code = fs.readFileSync('src/article-media.ts', 'utf8');

if (!code.includes('optimizeImage')) {
  code = `import {optimizeImage} from './optimize-image.js';\n` + code;
  
  code = code.replace(
    `export const validateArticleMedia: RequestHandler = (req, _res, next) => {`,
    `export const validateArticleMedia: RequestHandler = async (req, _res, next) => {`
  );
  
  code = code.replace(
    `try{for(const file of all){file.originalname=repairFilename(file.originalname);validateMedia(file)}}catch(error){next(error);return}`,
    `try{for(const file of all){file.originalname=repairFilename(file.originalname);validateMedia(file); await optimizeImage(file);}}catch(error){next(error);return}`
  );

  fs.writeFileSync('src/article-media.ts', code);
  console.log("Updated validateArticleMedia");
}
