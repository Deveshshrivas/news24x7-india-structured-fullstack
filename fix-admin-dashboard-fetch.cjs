const fs = require('fs');
let code = fs.readFileSync('app/admin/AdminDashboard.tsx', 'utf8');

code = code.replace(
  'fetch("/api/backend/articles?limit=10", {cache: "no-store"})',
  'fetch("/api/backend/articles?limit=10&admin=true", {cache: "no-store"})'
);

fs.writeFileSync('app/admin/AdminDashboard.tsx', code);
console.log("Updated AdminDashboard to fetch with admin=true");
