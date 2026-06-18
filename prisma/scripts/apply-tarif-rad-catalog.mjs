// Apply: master.tarif_rad_catalog (Tarif Matrix grup Rad) via pg langsung (tsx tak terpasang).
// Jalankan: node --env-file=.env prisma/scripts/apply-tarif-rad-catalog.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260617170000_init_master_tarif_rad_catalog/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const t = await c.query(
    `SELECT to_regclass('master.tarif_rad_catalog') AS tbl`,
  );
  console.log("OK tarif_rad_catalog:", t.rows[0].tbl);
} finally {
  await c.end();
}
