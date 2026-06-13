// Seed Katalog Keperawatan (master.sdki) dari src/lib/master/sdkiSeed.ts. Pakai `pg`
// langsung (hindari resolusi alias `@/`). Kode resmi PPNI (D.NNNN) di-seed apa adanya;
// counter `sdki_counter` (scope="D") di-set ke numerik tertinggi → entri baru via API
// mulai D.0149. Blok dataMayor/dataMinor/intervensi → kolom JSONB. kriteriaHasil → text[].
// Idempoten: TRUNCATE lalu insert ulang (katalog awal otoritatif).
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-sdki.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { SDKI_SEED } from "../../src/lib/master/sdkiSeed.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-sdki.mts).");
  process.exit(1);
}

/** Numerik dari kode "D.NNNN" → 148 (untuk D.0148). 0 bila tak cocok. */
function kodeSeq(kode) {
  const m = /^D\.(\d+)$/.exec(kode ?? "");
  return m ? parseInt(m[1], 10) : 0;
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query('TRUNCATE "master"."sdki", "master"."sdki_counter" CASCADE');

    let n = 0;
    let maxSeq = 0;
    for (const d of SDKI_SEED) {
      maxSeq = Math.max(maxSeq, kodeSeq(d.kode));
      await client.query(
        `INSERT INTO "master"."sdki" (
           "id","kode","nama","kategori","sub_kategori","jenis","penyebab_umum","faktor_resiko",
           "data_mayor","data_minor","kriteria_hasil","intervensi","status","updated_at"
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13, now()
         )`,
        [
          randomUUID(), d.kode, d.nama, d.kategori, d.subKategori ?? "", d.jenis,
          d.penyebabUmum ?? "", d.faktorResiko ?? null,
          JSON.stringify(d.dataMayor ?? { subjektif: [], objektif: [] }),
          JSON.stringify(d.dataMinor ?? { subjektif: [], objektif: [] }),
          d.kriteriaHasil ?? [],
          JSON.stringify(d.intervensi ?? { observasi: [], terapeutik: [], edukasi: [], kolaborasi: [] }),
          d.status ?? "Aktif",
        ],
      );
      n += 1;
    }

    // Counter = numerik tertinggi → entri baru via API lanjut dari D.<maxSeq+1>.
    await client.query(
      `INSERT INTO "master"."sdki_counter" ("scope","last_seq") VALUES ('D',$1)`,
      [maxSeq],
    );

    await client.query("COMMIT");
    console.log(`✅ Seed SDKI selesai: ${n} diagnosa · counter[D]=${maxSeq} → entri baru mulai D.${String(maxSeq + 1).padStart(4, "0")}.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed SDKI gagal:", e);
  process.exit(1);
});
