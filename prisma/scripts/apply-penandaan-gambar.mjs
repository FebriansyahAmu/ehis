// Apply DDL medicalrecord.penandaan_gambar via pg langsung (tsx tak terpasang; db execute tak
// menerima schema-folder). Idempoten (IF NOT EXISTS). Jalankan: node --env-file=.env prisma/scripts/apply-penandaan-gambar.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260615230000_init_medicalrecord_penandaan_gambar/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const { rows } = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='medicalrecord' AND table_name='penandaan_gambar' ORDER BY ordinal_position`,
  );
  console.log("OK penandaan_gambar kolom:", rows.map((r) => r.column_name).join(", "));
} finally {
  await c.end();
}
