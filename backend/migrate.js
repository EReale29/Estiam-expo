import { runMigrations, dbPath } from "./db.js";

runMigrations();
console.log(`Database ready at ${dbPath}`);
