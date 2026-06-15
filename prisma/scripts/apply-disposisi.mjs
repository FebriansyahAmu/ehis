// Apply DDL "Selesaikan Kunjungan" (ALTER kunjungan + CREATE medicalrecord.disposisi) via pg
// langsung (tsx tak terpasang). Jalankan: node --env-file=.env prisma/scripts/apply-disposisi.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260616160000_selesai_kunjungan_disposisi/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const kol = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='encounter' AND table_name='kunjungan'
       AND column_name IN ('selesai_pertama_at','disposisi','alasan_reopen') ORDER BY column_name`,
  );
  const disp = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='medicalrecord' AND table_name='disposisi' ORDER BY ordinal_position`,
  );
  console.log("OK kunjungan kolom baru:", kol.rows.map((r) => r.column_name).join(", "));
  console.log("OK disposisi kolom:", disp.rows.map((r) => r.column_name).join(", "));
} finally {
  await c.end();
}
