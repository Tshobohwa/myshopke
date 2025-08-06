const crypto = require("crypto");

console.log("🔐 Generating JWT Secrets...\n");

const jwtSecret = crypto.randomBytes(64).toString("hex");
const jwtRefreshSecret = crypto.randomBytes(64).toString("hex");

console.log("Copy these to your .env file:");
console.log("=====================================");
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`JWT_REFRESH_SECRET="${jwtRefreshSecret}"`);
console.log("=====================================\n");

console.log("✅ Secrets generated successfully!");
console.log(
  "⚠️  Keep these secrets secure and never commit them to version control."
);
