const fs = require('fs');
let code = fs.readFileSync('app/WeatherWidget.tsx', 'utf8');

code = code.replace(
  "if (text.includes('Unknown') || text.includes('ERROR')) throw new Error('Invalid location');",
  "if (text.includes('Unknown') || text.includes('ERROR') || text.trim().startsWith('<')) throw new Error('Invalid response');"
);

fs.writeFileSync('app/WeatherWidget.tsx', code);
console.log("Fixed HTML response parsing");
