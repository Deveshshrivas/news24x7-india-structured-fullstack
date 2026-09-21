const fs = require('fs');
let code = fs.readFileSync('app/ads/ads.css', 'utf8');

// Hide the label by default
code = code.replace(
  '.siteAd>span{display:block;',
  '.siteAd>span{display:none;'
);

// Show the label only when AdSense successfully fills the slot OR if it's a custom backend ad
code += `\n/* Only show the Advertisement label when an ad is actually filled */\n`;
code += `.siteAd:has(.adsbygoogle[data-ad-status="done"]) > span {\n  display: block;\n}\n`;

// Custom backend ads are just <img> tags inside <a>, so they don't have .adsbygoogle
code += `.siteAd:not(:has(.adsbygoogle)) > span {\n  display: block;\n}\n`;

fs.writeFileSync('app/ads/ads.css', code);
console.log("Updated ads.css for smart labels");
