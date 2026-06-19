// Apply: buat tabel master.bmhp + master.bmhp_counter (Katalog BMHP/BHP).
// Idempoten via guard information_schema. Via pg langsung (drift-safe — JANGAN migrate dev).
// Jalankan: node --env-file=.env prisma/scripts/apply-bmhp.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260619140000_init_master_bmhp/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  const exists = await c.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='master' AND table_name='bmhp'`,
  );
  if (exists.rowCount) {
    console.log("SKIP: tabel master.bmhp sudah ada");
  } else {
    await c.query(sql);
    console.log("OK: tabel bmhp + bmhp_counter dibuat");
  }
  const check = await c.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='master' AND table_name IN ('bmhp','bmhp_counter') ORDER BY table_name`,
  );
  console.log("Tabel ada:", check.rows.map((r) => r.table_name).join(", "));
} finally {
  await c.end();
}
