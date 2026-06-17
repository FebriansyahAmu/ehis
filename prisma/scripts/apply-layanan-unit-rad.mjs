// Apply DDL Master Layanan Unit Radiologi (CREATE master.layanan_unit_rad) via pg langsung
// (tsx tak terpasang). Jalankan: node --env-file=.env prisma/scripts/apply-layanan-unit-rad.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260617160000_init_master_layanan_unit_rad/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const cols = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='master' AND table_name='layanan_unit_rad' ORDER BY ordinal_position`,
  );
  console.log("OK layanan_unit_rad kolom:", cols.rows.map((r) => r.column_name).join(", "));
} finally {
  await c.end();
}
