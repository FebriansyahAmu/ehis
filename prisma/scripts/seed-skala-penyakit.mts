// Seed Master Skala Penyakit (master.skala_instrument · kategori "Penyakit") dari
// src/lib/master/skalaPenyakitMock.ts. Pakai `pg` langsung (hindari alias `@/`).
// KODE di-generate SP-NNNN berurutan (BUKAN nama mock KILLIP/NYHA); counter scope "SP"
// di-set ke jumlah data → entri baru via API lanjut dari SP-<n+1>.
// items[]/interpretasi[] → kolom JSONB. konsumen_modul → text[].
// Idempoten: hapus baris kategori "Penyakit" + counter "SP", lalu insert ulang.
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-skala-penyakit.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { SKALA_PENYAKIT_MOCK } from "../../src/lib/master/skalaPenyakitMock.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-skala-penyakit.mts).");
  process.exit(1);
}

const SCOPE = "SP";
const KATEGORI = "Penyakit";
const pad = (n) => String(n).padStart(4, "0");

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(`DELETE FROM "master"."skala_instrument" WHERE "kategori" = $1`, [KATEGORI]);
    await client.query(`DELETE FROM "master"."skala_counter" WHERE "scope" = $1`, [SCOPE]);

    let seq = 0;
    for (const s of SKALA_PENYAKIT_MOCK) {
      seq += 1;
      const kode = `${SCOPE}-${pad(seq)}`;
      await client.query(
        `INSERT INTO "master"."skala_instrument" (
           "id","kode","nama","singkat","deskripsi","referensi","kategori",
           "scoring_mode","arah","total_max","items","interpretasi","konsumen_modul","status","updated_at"
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,$14, now()
         )`,
        [
          randomUUID(), kode, s.nama, s.singkat ?? "", s.deskripsi ?? "", s.referensi ?? "", KATEGORI,
          s.scoringMode, s.arah, s.totalMax ?? 0,
          JSON.stringify(s.items ?? []),
          JSON.stringify(s.interpretasi ?? []),
          s.konsumenModul ?? [],
          s.status ?? "Aktif",
        ],
      );
    }

    await client.query(
      `INSERT INTO "master"."skala_counter" ("scope","last_seq") VALUES ($1,$2)`,
      [SCOPE, seq],
    );

    await client.query("COMMIT");
    console.log(`✅ Seed Skala Penyakit selesai: ${seq} skala · counter[${SCOPE}]=${seq} → entri baru mulai ${SCOPE}-${pad(seq + 1)}.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed Skala Penyakit gagal:", e);
  process.exit(1);
});
