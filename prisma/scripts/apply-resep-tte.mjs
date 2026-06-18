// Apply: +kolom TTE (tte_token / tte_signed_by / tte_signed_at) di medicalrecord.resep_order.
// Data-preserving (ADD COLUMN IF NOT EXISTS). Via pg.
// Jalankan: node --env-file=.env prisma/scripts/apply-resep-tte.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260619140000_resep_tte/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const cols = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='medicalrecord' AND table_name='resep_order'
       AND column_name IN ('tte_token','tte_signed_by','tte_signed_at') ORDER BY column_name`,
  );
  console.log("OK kolom TTE:", cols.rows.map((r) => r.column_name).join(", "));
} finally {
  await c.end();
}
