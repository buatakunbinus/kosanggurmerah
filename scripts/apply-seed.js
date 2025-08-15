// Applies seed SQL to Supabase Postgres using PG connection string.
// REQUIREMENT: set environment variable PG_CONNECTION (postgresql://user:pass@host:port/db)
// Example (Supabase): postgresql://postgres:<PASSWORD>@<HOST>.supabase.co:5432/postgres
// CAUTION: This script runs raw SQL from docs/seed_data.sql.

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const dsn = process.env.PG_CONNECTION;
if (!dsn) {
  console.error("Missing PG_CONNECTION env var.");
  process.exit(1);
}

const seedPath = path.resolve(process.cwd(), "docs", "seed_data.sql");
if (!fs.existsSync(seedPath)) {
  console.error("Seed file not found at", seedPath);
  process.exit(1);
}

const sql = fs.readFileSync(seedPath, "utf8");

// Use psql if available
const p = spawn("psql", [dsn], { stdio: ["pipe", "inherit", "inherit"] });
p.stdin.write(sql);
p.stdin.end();

p.on("exit", (code) => {
  if (code === 0) process.stdout.write("Seed applied successfully.\n");
  else process.stderr.write("psql exited with code " + code + "\n");
});
