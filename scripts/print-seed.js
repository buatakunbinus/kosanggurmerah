// Prints seed SQL to stdout so you can pipe or copy.
import fs from "node:fs";
import path from "node:path";

const seedPath = path.resolve(process.cwd(), "docs", "seed_data.sql");
if (!fs.existsSync(seedPath)) {
  console.error("Seed file not found at", seedPath);
  process.exit(1);
}
process.stdout.write(fs.readFileSync(seedPath, "utf8"));
