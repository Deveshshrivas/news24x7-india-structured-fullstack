const fs = require('fs');
let code = fs.readFileSync('src/media-library.ts', 'utf8');

if (!code.includes('optimizeImage')) {
  code = code.replace(
    `import {uploadsRoot,uploadPath,mediaStore} from './local-media.js';`,
    `import {uploadsRoot,uploadPath,mediaStore} from './local-media.js';\nimport {optimizeImage} from './optimize-image.js';`
  );

  code = code.replace(
    `export async function uploadLibraryFile(file:Express.Multer.File,ownerId:string){`,
    `export async function uploadLibraryFile(file:Express.Multer.File,ownerId:string){\n file = await optimizeImage(file);`
  );
  
  fs.writeFileSync('src/media-library.ts', code);
  console.log("Updated media-library.ts");
}
