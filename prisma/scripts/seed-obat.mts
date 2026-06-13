// Seed Katalog Obat (master.obat) dari src/lib/master/obatSeed.ts. Pakai `pg`
// langsung (hindari resolusi alias `@/`). KFA di-derive dari src/lib/master/kfaMock.ts
// via pointer `kfaCode` (POA) → kolom JSONB `kfa`. `lasaPairIds` (seedKey) di-remap
// ke UUID. Idempoten: TRUNCATE lalu insert ulang (katalog awal otoritatif).
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-obat.mts

import pg from "pg";
import { randomUUID } from "node:crypto";
import { OBAT_SEED } from "../../src/lib/master/obatSeed.ts";
import { KFA_MOCK } from "../../src/lib/master/kfaMock.ts";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-obat.mts).");
  process.exit(1);
}

const MAPPED_AT = "2026-06-13T00:00:00.000Z";

/** Produk KFA (POA) → blok KfaMapping siap simpan JSONB. */
function deriveKfa(kfaCode) {
  const p = KFA_MOCK.find((x) => x.kfaCode === kfaCode);
  if (!p) return null;
  return {
    poaKode: p.kfaCode,
    poaNama: p.name,
    nie: p.nie,
    povKode: p.productTemplate.code,
    povNama: p.productTemplate.name,
    ruteKode: p.rutePemberian.code,
    ruteNama: p.rutePemberian.name,
    bentukKode: p.dosageForm.code,
    bentukNama: p.dosageForm.name,
    zatAktif: p.activeIngredients.map((i) => {
      const unit = p.uom?.name ? ` / 1 ${p.uom.name.toLowerCase()}` : "";
      return {
        kode: i.kode,
        display: i.zatAktif,
        ...(i.kekuatan != null ? { dosis: i.kekuatan } : {}),
        ...(i.satuan ? { satuan: i.satuan } : {}),
        ...(i.kekuatan != null ? { dosisPerSatuan: `${i.kekuatan} ${i.satuan ?? ""}`.trim() + unit } : {}),
      };
    }),
    sumber: "KFA_API",
    mappedAt: MAPPED_AT,
  };
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
/** Periode "YYMM" zona WIB — sama dgn obatService.obatPeriode. */
function seedPeriode() {
  const wib = new Date(Date.now() + WIB_OFFSET_MS);
  const yy = String(wib.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}${mm}`;
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query('TRUNCATE "master"."obat", "master"."obat_counter" CASCADE');

    // Map seedKey (obt-xxx) → UUID untuk PK + remap lasaPairIds.
    const idMap = new Map();
    for (const o of OBAT_SEED) idMap.set(o.id, randomUUID());

    const periode = seedPeriode();
    let nObat = 0;
    let nKfa = 0;

    for (const o of OBAT_SEED) {
      const id = idMap.get(o.id);
      const kode = `OBT-${periode}${String(nObat + 1).padStart(3, "0")}`; // auto-gen, sama pola Service
      const lasa = (o.lasaPairIds ?? [])
        .map((k) => idMap.get(k))
        .filter((x) => x != null);
      const kfa = o.kfaCode ? deriveKfa(o.kfaCode) : null;
      if (kfa) nKfa += 1;

      await client.query(
        `INSERT INTO "master"."obat" (
           "id","kode","nama_generik","nama_dagang","pabrik","kategori","bentuk","kekuatan",
           "satuan_terkecil","rute","is_formularium","is_ham","is_lasa","lasa_pair_ids",
           "golongan","is_cold_chain","is_restricted","indikasi","kontraindikasi","dosis_dewasa",
           "dosis_anak","efek_samping","interaksi_obat","catatan_khusus","harga_satuan","hpp","het",
           "kode_fornas","bpjs_coverage","batas_resep_per_kunjungan","kfa","status","updated_at"
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
           $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31::jsonb,$32, now()
         )`,
        [
          id, kode, o.namaGenerik, o.namaDagang, o.pabrik ?? null,
          o.kategori, o.bentuk, o.kekuatan, o.satuanTerkecil ?? null, o.rute ?? null,
          o.isFormularium ?? false, o.isHAM ?? false, o.isLASA ?? false, lasa,
          o.golongan ?? null, o.isColdChain ?? false, o.isRestricted ?? false,
          o.indikasi ?? null, o.kontraindikasi ?? null, o.dosisDewasa ?? null,
          o.dosisAnak ?? null, o.efekSamping ?? null, o.interaksiObat ?? null, o.catatanKhusus ?? null,
          o.hargaSatuan ?? 0, o.hpp ?? null, o.het ?? null, o.kodeFornas ?? null,
          o.bpjsCoverage ?? false, o.batasResepPerKunjungan ?? null,
          kfa ? JSON.stringify(kfa) : null, o.status ?? "Aktif",
        ],
      );
      nObat += 1;
    }

    // Counter = seq terakhir → obat baru via API lanjut dari OBT-<periode><nObat+1>.
    await client.query(
      `INSERT INTO "master"."obat_counter" ("periode","last_seq") VALUES ($1,$2)`,
      [periode, nObat],
    );

    await client.query("COMMIT");
    const last = String(nObat).padStart(3, "0");
    console.log(`✅ Seed obat selesai: ${nObat} obat (${nKfa} ter-KFA) · kode OBT-${periode}001..${last} · counter[${periode}]=${nObat}.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed obat gagal:", e);
  process.exit(1);
});
