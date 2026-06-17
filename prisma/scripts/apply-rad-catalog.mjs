// Apply DDL Master Katalog Radiologi (CREATE master.rad_catalog + counter) via pg langsung
// (tsx tak terpasang). Jalankan: node --env-file=.env prisma/scripts/apply-rad-catalog.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260617150000_init_master_rad_catalog/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const cols = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='master' AND table_name='rad_catalog' ORDER BY ordinal_position`,
  );
  console.log("OK rad_catalog kolom:", cols.rows.map((r) => r.column_name).join(", "));
} finally {
  await c.end();
}
