// Seed Tarif Matrix — Lab + Rad (penjamin UMUM, flat lintas tier).
// Riset harga "Umum" RS tipe C/B Indonesia (2024-2025, kisaran tengah). Harga TOTAL dipecah komponen
// PMK 85: Lab = Sarana 65% / Medis 10% / Paramedis 25% · Rad = Sarana 55% / Medis 30% / Paramedis 15%
// (medis & paramedis di-round 500, sarana = sisa → total tetap eksak). Flat: harga sama di semua tier
// (Lab/Rad tak bervariasi per kelas). Upsert by triple → idempoten (re-run aman).
//
// Jalankan: node --env-file=.env prisma/scripts/seed-tarif-lab-rad.mts
import { Client } from "pg";

const PENJAMIN = "UMUM";

// ── Harga Umum per tes lab (IDR) — key = nama persis di master.lab_test ──
const LAB_HARGA: Record<string, number> = {
  "Feses Rutin": 35_000,
  "Darah Rutin (Hematologi Lengkap)": 60_000,
  "Laju Endap Darah (LED)": 25_000,
  "Golongan Darah (ABO / Rhesus)": 35_000,
  "Plano Test (Tes Kehamilan)": 30_000,
  "Albumin": 30_000,
  "Alkali Fosfatase (ALP)": 45_000,
  "Amilase": 90_000,
  "Asam Urat (Uric Acid)": 30_000,
  "Bilirubin Total / Direk": 45_000,
  "Elektrolit (Na / K / Cl)": 110_000,
  "Gamma GT (GGT)": 50_000,
  "Glukosa Darah Puasa (GDP)": 25_000,
  "Glukosa Darah Sewaktu (GDS)": 25_000,
  "HbA1c": 150_000,
  "HDL Kolesterol": 45_000,
  "Kolesterol Total": 40_000,
  "Kreatinin": 30_000,
  "Lipase": 95_000,
  "Prokalsitonin (PCT)": 350_000,
  "SGOT (AST)": 35_000,
  "SGPT (ALT)": 35_000,
  "Total Protein": 35_000,
  "Trigliserida": 45_000,
  "Troponin I": 250_000,
  "Ureum": 35_000,
  "aPTT": 75_000,
  "Bleeding Time (Masa Perdarahan)": 25_000,
  "Clotting Time (Masa Pembekuan)": 25_000,
  "D-Dimer": 250_000,
  "Protrombin Time (PT/INR)": 75_000,
  "Malaria": 50_000,
  "Widal Test": 60_000,
  "Benzodiazepin (BZO)": 90_000,
  "Cocaine (COC)": 90_000,
  "Morfin / Opiat (MOP)": 90_000,
  "THC (Cannabis)": 90_000,
  "Urine Rutin (Urinalisis Lengkap)": 40_000,
};

// Fallback per kategori lab (bila nama tak ter-map).
const LAB_FALLBACK: Record<string, number> = {
  Hematologi: 60_000, "Kimia Klinik": 40_000, Koagulasi: 75_000, Imunologi: 40_000,
  Serologi: 60_000, Urinalisis: 40_000, Feses: 35_000, Mikrobiologi: 50_000, Toksikologi: 90_000,
};

// ── Harga Umum per pemeriksaan radiologi (IDR) — key = nama persis di master.rad_catalog ──
const RAD_HARGA: Record<string, number> = {
  "CT Abdomen dengan Kontras": 1_200_000,
  "CT Kepala Non-Kontras": 750_000,
  "CT Pulmonary Angiography (CTPA)": 1_500_000,
  "CT Thorax dengan Kontras": 1_300_000,
  "CT Thorax Non-Kontras": 850_000,
  "DEXA Bone Densitometry": 400_000,
  "Mammografi Bilateral (Skrining)": 350_000,
  "Mammografi Tomosintesis (DBT)": 600_000,
  "MRA Brain (Time-of-Flight)": 1_800_000,
  "MRI Brain Non-Kontras": 1_500_000,
  "MRI Knee": 1_600_000,
  "Bone Scan (Sidik Tulang)": 1_400_000,
  "SPECT Perfusi Miokard": 2_500_000,
  "HSG (Hysterosalpingografi)": 600_000,
  "OMD (Oesophago-Maag-Duodenografi)": 450_000,
  "USG Abdomen Lengkap": 250_000,
  "USG Doppler Karotis": 350_000,
  "USG Mammae Bilateral": 250_000,
  "USG Tiroid": 200_000,
  "Foto Abdomen 3 Posisi (BNO)": 180_000,
  "Foto Antebrachii AP/Lateral": 120_000,
  "Foto Cranium AP/Lateral": 130_000,
  "Foto Thorax AP (Portable)": 130_000,
  "Foto Thorax PA": 100_000,
};

// Fallback per modalitas rad (bila nama tak ter-map).
const RAD_FALLBACK: Record<string, number> = {
  XR: 120_000, CT: 1_000_000, MR: 1_500_000, US: 250_000, MG: 400_000, DXA: 400_000, NM: 1_500_000, RF: 500_000,
};

const round500 = (x: number) => Math.round(x / 500) * 500;

/** Pecah total → {sarana, medis, paramedis}. Medis/paramedis di-round 500; sarana = sisa (total eksak). */
function split(total: number, rMedis: number, rParamedis: number) {
  const medis = round500(total * rMedis);
  const paramedis = round500(total * rParamedis);
  const sarana = total - medis - paramedis;
  return { sarana, medis, paramedis };
}

/** Tier "Jenis Ruangan" dari (locationType, kelas) — replika tierKeyOf FE. null = non-billable. */
function tierKeyOf(lt: string, kelas: string | null): string | null {
  if (["Penunjang", "Laboratorium", "Radiologi", "Farmasi", "Gudang"].includes(lt)) return null;
  if (lt === "Rawat_Inap") return kelas ? `RAWAT_INAP:${kelas}` : null;
  if (lt === "Rawat_Jalan") return "RAWAT_JALAN";
  return lt; // IGD | ICU | HCU | Isolasi | OK
}

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  // 1) Derive tier dari Location aktif (distinct).
  const locRes = await c.query<{ location_type: string; kelas: string | null }>(
    `SELECT DISTINCT location_type, kelas FROM master.location WHERE deleted_at IS NULL`,
  );
  const tiers = [...new Set(locRes.rows.map((r) => tierKeyOf(r.location_type, r.kelas)).filter((t): t is string => !!t))];
  console.log(`Tier terdeteksi (${tiers.length}):`, tiers.join(", "));
  if (tiers.length === 0) throw new Error("Tak ada tier billable — cek master.location");

  // 2) Katalog.
  const labs = (await c.query<{ id: string; nama: string; kategori: string }>(
    `SELECT id, nama, kategori FROM master.lab_test WHERE deleted_at IS NULL`,
  )).rows;
  const rads = (await c.query<{ id: string; nama: string; modalitas: string }>(
    `SELECT id, nama, modalitas FROM master.rad_catalog WHERE deleted_at IS NULL`,
  )).rows;

  const upsertLab = (id: string, tier: string, harga: number, s: number, m: number, p: number) =>
    c.query(
      `INSERT INTO master.tarif_lab_test (id, lab_test_id, penjamin_kode, jenis_ruangan, harga, jasa_sarana, jasa_medis, jasa_paramedis, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (lab_test_id, penjamin_kode, jenis_ruangan)
       DO UPDATE SET harga = EXCLUDED.harga, jasa_sarana = EXCLUDED.jasa_sarana, jasa_medis = EXCLUDED.jasa_medis, jasa_paramedis = EXCLUDED.jasa_paramedis, updated_at = now()`,
      [id, PENJAMIN, tier, harga, s, m, p],
    );
  const upsertRad = (id: string, tier: string, harga: number, s: number, m: number, p: number) =>
    c.query(
      `INSERT INTO master.tarif_rad_catalog (id, rad_catalog_id, penjamin_kode, jenis_ruangan, harga, jasa_sarana, jasa_medis, jasa_paramedis, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (rad_catalog_id, penjamin_kode, jenis_ruangan)
       DO UPDATE SET harga = EXCLUDED.harga, jasa_sarana = EXCLUDED.jasa_sarana, jasa_medis = EXCLUDED.jasa_medis, jasa_paramedis = EXCLUDED.jasa_paramedis, updated_at = now()`,
      [id, PENJAMIN, tier, harga, s, m, p],
    );

  await c.query("BEGIN");
  let labRows = 0, radRows = 0;
  const unmatched: string[] = [];

  for (const lab of labs) {
    const harga = LAB_HARGA[lab.nama] ?? LAB_FALLBACK[lab.kategori];
    if (!harga) { unmatched.push(`LAB: ${lab.nama}`); continue; }
    const { sarana, medis, paramedis } = split(harga, 0.10, 0.25); // dokter Sp.PK 10% · analis 25%
    for (const tier of tiers) { await upsertLab(lab.id, tier, harga, sarana, medis, paramedis); labRows++; }
  }
  for (const rad of rads) {
    const harga = RAD_HARGA[rad.nama] ?? RAD_FALLBACK[rad.modalitas];
    if (!harga) { unmatched.push(`RAD: ${rad.nama}`); continue; }
    const { sarana, medis, paramedis } = split(harga, 0.30, 0.15); // radiolog 30% · radiografer 15%
    for (const tier of tiers) { await upsertRad(rad.id, tier, harga, sarana, medis, paramedis); radRows++; }
  }

  await c.query("COMMIT");
  console.log(`OK seed: tarif_lab_test ${labRows} baris (${labs.length} tes × ${tiers.length} tier) · tarif_rad_catalog ${radRows} baris (${rads.length} pemeriksaan × ${tiers.length} tier)`);
  if (unmatched.length) console.log("⚠ Tak ter-map (di-skip):", unmatched);
} catch (e) {
  await c.query("ROLLBACK").catch(() => {});
  throw e;
} finally {
  await c.end();
}
