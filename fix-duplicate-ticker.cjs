const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Remove import
code = code.replace(/import \{ BreakingTicker \} from "\.\/features\/breaking";\r?\n/, '');

// Remove component
code = code.replace(/<BreakingTicker \/>\r?\n/, '');

fs.writeFileSync('app/page.tsx', code);
console.log("Removed duplicate BreakingTicker");
