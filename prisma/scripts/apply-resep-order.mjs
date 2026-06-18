// Apply: buat tabel medicalrecord.resep_order + resep_item (tab Resep Pasien → order Farmasi).
// Idempoten via CREATE TABLE IF NOT EXISTS-style guard (cek information_schema). Via pg.
// Jalankan: node --env-file=.env prisma/scripts/apply-resep-order.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260619120000_init_medicalrecord_resep_order/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  const exists = await c.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='medicalrecord' AND table_name='resep_order'`,
  );
  if (exists.rowCount) {
    console.log("SKIP: tabel medicalrecord.resep_order sudah ada");
  } else {
    await c.query(sql);
    console.log("OK: tabel resep_order + resep_item dibuat");
  }
  const check = await c.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='medicalrecord' AND table_name IN ('resep_order','resep_item') ORDER BY table_name`,
  );
  console.log("Tabel ada:", check.rows.map((r) => r.table_name).join(", "));
} finally {
  await c.end();
}
