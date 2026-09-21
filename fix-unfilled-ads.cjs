const fs = require('fs');
let code = fs.readFileSync('app/ads/ads.css', 'utf8');

code += `\n/* Hide ad containers when Google AdSense cannot find an ad to display */\n`;
code += `.siteAd:has(.adsbygoogle[data-ad-status="unfilled"]) {\n  display: none !important;\n}\n`;
code += `.siteAd:has(> .adsbygoogle:empty:not([data-ad-status])) {\n  /* Optional: hide while loading if desired, but AdSense needs space to load. */\n}\n`;

fs.writeFileSync('app/ads/ads.css', code);
console.log("Added CSS fix for unfilled ads");
