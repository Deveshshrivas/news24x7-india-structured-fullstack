const fs = require('fs');
let code = fs.readFileSync('src/routes/ads.ts', 'utf8');

if (!code.includes('optimizeImage')) {
  code = code.replace(
    `import {broadcastNotification} from "./notifications.js";`,
    `import {broadcastNotification} from "./notifications.js";\nimport {optimizeImage} from "../optimize-image.js";`
  );

  code = code.replace(
    `if (req.file) {`,
    `if (req.file) {\n    req.file = await optimizeImage(req.file);`
  );
  
  fs.writeFileSync('src/routes/ads.ts', code);
  console.log("Updated ads.ts");
}
