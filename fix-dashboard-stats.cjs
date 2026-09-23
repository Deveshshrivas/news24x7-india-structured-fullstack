const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/dashboard.ts', 'utf8');

code = code.replace(
  'isLimited?0:reporters.countDocuments({}),',
  'isLimited?0:db.collection("users").countDocuments({role:"reporter"}),'
);
code = code.replace(
  'isLimited?0:reporters.countDocuments({active:true}),',
  'isLimited?0:db.collection("users").countDocuments({role:"reporter", active:true}),'
);

fs.writeFileSync('backend/src/routes/dashboard.ts', code);
console.log("Updated dashboard.ts to count users instead of public reporter profiles");
