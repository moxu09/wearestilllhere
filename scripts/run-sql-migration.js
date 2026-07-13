const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

async function main() {
  const migrationName = process.argv[2];
  const databaseUrl = process.env.MIGRATION_DATABASE_URL;

  if (!migrationName || path.basename(migrationName) !== migrationName) {
    throw new Error("Provide a migration filename from supabase/migrations.");
  }
  if (!databaseUrl) {
    throw new Error("MIGRATION_DATABASE_URL is required.");
  }

  const migrationDir = path.resolve(process.cwd(), "supabase/migrations");
  const migrationPath = path.resolve(migrationDir, migrationName);
  if (!migrationPath.startsWith(`${migrationDir}${path.sep}`)) {
    throw new Error("Migration path is outside supabase/migrations.");
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();
  try {
    await client.query(sql);
    console.log(`Applied ${migrationName}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
