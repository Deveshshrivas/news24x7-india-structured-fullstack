const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/dashboard.ts', 'utf8');

code = code.replace(
  'isLimited?0:db.collection("users").countDocuments({role:"reporter", active:true}),',
  'isLimited?0:db.collection("users").countDocuments({role:"reporter", active:{$ne:false}}),'
);

fs.writeFileSync('backend/src/routes/dashboard.ts', code);
console.log("Updated dashboard.ts to count undefined as active");
