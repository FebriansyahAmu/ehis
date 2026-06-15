// Apply DDL medicalrecord.serah_terima via pg langsung (tsx tak terpasang; db execute tak
// menerima schema-folder). Jalankan: node --env-file=.env prisma/scripts/apply-serah-terima.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(
  new URL("../migrations/20260616120000_init_medicalrecord_serah_terima/migration.sql", import.meta.url),
  "utf8",
);

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query(sql);
  const { rows } = await c.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='medicalrecord' AND table_name='serah_terima' ORDER BY ordinal_position`,
  );
  console.log("OK serah_terima kolom:", rows.map((r) => r.column_name).join(", "));
} finally {
  await c.end();
}
