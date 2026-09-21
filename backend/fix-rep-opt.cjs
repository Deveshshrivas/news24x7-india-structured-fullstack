const fs = require('fs');
let code = fs.readFileSync('src/routes/reporters.ts', 'utf8');

if (!code.includes('optimizeImage')) {
  code = code.replace(
    `import {broadcastNotification} from "./notifications.js";`,
    `import {broadcastNotification} from "./notifications.js";\nimport {optimizeImage} from "../optimize-image.js";`
  );

  code = code.replace(
    `if (req.file) {`,
    `if (req.file) {\n      req.file = await optimizeImage(req.file);`
  );
  
  fs.writeFileSync('src/routes/reporters.ts', code);
  console.log("Updated reporters.ts");
}
