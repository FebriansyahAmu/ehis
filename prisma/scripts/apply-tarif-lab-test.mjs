// Apply DDL Master Tarif Lab Test (CREATE master.tarif_lab_test) via pg langsung
// (tsx tak terpasang). Jalankan: node --env-file=.env prisma/scripts/apply-tarif-lab-test.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260617140000_init_master_tarif_lab_test/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const cols = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='master' AND table_name='tarif_lab_test' ORDER BY ordinal_position`,
  );
  console.log("OK tarif_lab_test kolom:", cols.rows.map((r) => r.column_name).join(", "));
} finally {
  await c.end();
}
