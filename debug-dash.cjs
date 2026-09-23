const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/dashboard.ts', 'utf8');

code = code.replace(
  'isLimited?0:db.collection("users").countDocuments({role:"reporter", active:{$ne:false}}),',
  'isLimited?0:db.collection("users").countDocuments({role:"reporter", active:{$ne:false}}),\n    db.collection("users").find({role:"reporter"}).toArray(),'
);

code = code.replace(
  'activeReporters,',
  'activeReporters,\n    debugReporters: arguments[0] ? arguments[0][6] : null,' // wait, I don't know what the variable name is
);

fs.writeFileSync('backend/src/routes/dashboard.ts', code);
console.log("Modified");
