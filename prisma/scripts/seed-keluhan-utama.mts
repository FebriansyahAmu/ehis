// Seed subset KELUHAN UTAMA ber-SNOMED → master.asesmen_item kategori "KeluhanUtama" (prefix KU).
// Dipakai picker keluhan di sub-menu Anamnesis IGD/RI/RJ → FHIR Condition chief-complaint
// (docs/fhir-mapping/L03 · keputusan D4, 2026-11-17).
//
// Kurasi: keluhan tersering IGD/RJ/RI. Setiap kode:
//   - lolos validasi SCTID (6–18 digit, partisi konsep 00/10, check digit Verhoeff) — gagal = skrip berhenti;
//   - semuanya dalam hierarki Clinical finding (ECL < 404684003, syarat playbook);
//   - dicocokkan ke kamus lokal master.snomed_concept (rilis 2002): kode yang ADA dicetak display-nya
//     untuk pemeriksaan; kode rilis lebih baru (mis. Fever 386661006) tidak ada di kamus → ditandai.
//   - `display` = istilah SNOMED preferred (Inggris) → coding.display; `nama` = label Indonesia di UI.
//
// Idempoten & NON-destruktif: item yang kode SNOMED-nya sudah ada (kategori sama, belum dihapus) dilewati;
// item baru mendapat kode KU-NNN lanjutan dari counter. Catatan: seed-asesmen-katalog.mts MENGHAPUS semua
// item → bila dijalankan ulang, jalankan skrip ini sesudahnya.
//
//   Jalankan:  node --env-file=.env prisma/scripts/seed-keluhan-utama.mts

import pg from "pg";
import { randomUUID } from "node:crypto";

// [nama (UI), kode SNOMED, display SNOMED, deskripsi singkat]
const KELUHAN: [string, string, string, string][] = [
  ["Demam", "386661006", "Fever", "Suhu tubuh meningkat"],
  ["Sakit kepala", "25064002", "Headache", "Nyeri kepala"],
  ["Batuk", "49727002", "Cough", ""],
  ["Sesak napas", "267036007", "Dyspnea", "Sulit bernapas"],
  ["Mengi", "56018004", "Wheezing", "Napas berbunyi"],
  ["Nyeri dada", "29857009", "Chest pain", ""],
  ["Berdebar-debar", "80313002", "Palpitations", ""],
  ["Nyeri perut", "21522001", "Abdominal pain", ""],
  ["Nyeri ulu hati", "79922009", "Epigastric pain", ""],
  ["Perut kembung", "116289008", "Abdominal bloating", ""],
  ["Mual", "422587007", "Nausea", ""],
  ["Muntah", "422400008", "Vomiting", ""],
  ["Diare", "62315008", "Diarrhea", "Buang air besar cair"],
  ["Sulit buang air besar", "14760008", "Constipation", "Sembelit"],
  ["Sulit menelan", "40739000", "Dysphagia", ""],
  ["Pusing", "404640003", "Dizziness", ""],
  ["Badan lemas", "13791008", "Asthenia", ""],
  ["Mudah lelah", "84229001", "Fatigue", ""],
  ["Kejang", "91175000", "Seizure", ""],
  ["Penurunan kesadaran", "3006004", "Disturbance of consciousness", ""],
  ["Pingsan", "271594007", "Syncope", ""],
  ["Lemah separuh badan", "20022000", "Hemiparesis", ""],
  ["Bicara pelo", "8011004", "Dysarthria", ""],
  ["Kesemutan", "91019004", "Paresthesia", ""],
  ["Batuk darah", "66857006", "Hemoptysis", ""],
  ["Muntah darah", "8765009", "Hematemesis", ""],
  ["BAB berdarah", "405729008", "Hematochezia", "Darah segar bersama tinja"],
  ["Mimisan", "249366005", "Bleeding from nose", "Epistaksis"],
  ["Perdarahan dari vagina", "289530006", "Bleeding from vagina", ""],
  ["Keputihan", "271939006", "Vaginal discharge", ""],
  ["Nyeri haid", "266599000", "Dysmenorrhea", ""],
  ["Kencing berdarah", "34436003", "Blood in urine", "Hematuria"],
  ["Nyeri saat buang air kecil", "49650001", "Dysuria", ""],
  ["Nyeri tenggorokan", "162397003", "Pain in throat", ""],
  ["Pilek", "64531003", "Nasal discharge", "Hidung berair"],
  ["Nyeri telinga", "301354004", "Pain of ear", ""],
  ["Sakit gigi", "27355003", "Toothache", ""],
  ["Pandangan kabur", "111516008", "Blurring of visual image", ""],
  ["Nyeri pinggang", "279039007", "Low back pain", ""],
  ["Nyeri sendi", "57676002", "Pain of joint", ""],
  ["Bengkak", "65124004", "Swelling", ""],
  ["Wajah bengkak", "278528006", "Facial swelling", ""],
  ["Ruam kulit", "271807003", "Eruption of skin", ""],
  ["Gatal", "418290006", "Itching", ""],
  ["Kuning", "18165001", "Jaundice", "Kulit / mata menguning"],
  ["Menggigil", "43724002", "Chill", ""],
  ["Keringat malam", "42984000", "Night sweats", ""],
  ["Nafsu makan menurun", "79890006", "Loss of appetite", ""],
  ["Berat badan turun", "89362005", "Weight loss", ""],
  ["Sulit tidur", "193462001", "Insomnia", ""],
  ["Cemas", "48694002", "Anxiety", ""],
  ["Nyeri", "22253000", "Pain", "Nyeri (lokasi dijelaskan di teks keluhan)"],
  ["Luka robek", "312608009", "Laceration", ""],
  ["Luka bakar", "125666000", "Burn", ""],
];

// ── Validasi SCTID (Verhoeff) — identik seed-snomed.mts ─────────────────────
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
function isConceptId(id: string): boolean {
  if (!/^[1-9]\d{5,17}$/.test(id)) return false;
  const part = id.slice(-3, -1);
  if (part !== "00" && part !== "10") return false;
  let c = 0;
  for (let i = 0; i < id.length; i++) c = D[c][P[i % 8][id.charCodeAt(id.length - 1 - i) - 48]];
  return c === 0;
}

const KATEGORI = "KeluhanUtama";
const PREFIX = "KU";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum di-set (jalankan: node --env-file=.env prisma/scripts/seed-keluhan-utama.mts).");
  process.exit(1);
}

const bad = KELUHAN.filter(([, kode]) => !isConceptId(kode));
const dup = KELUHAN.map(([, k]) => k).filter((k, i, a) => a.indexOf(k) !== i);
if (bad.length || dup.length) {
  console.error(`❌ Data kurasi tidak valid — SCTID gagal: ${bad.map((b) => b[1]).join(", ") || "-"} · duplikat: ${dup.join(", ") || "-"}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });

async function main() {
  await client.connect();
  try {
    // Laporan silang ke kamus lokal (rilis 2002) — informatif, tidak memblokir.
    const dict = await client.query<{ concept_id: string; display: string }>(
      `SELECT concept_id, display FROM "master"."snomed_concept" WHERE concept_id = ANY($1)`,
      [KELUHAN.map(([, k]) => k)],
    ).catch(() => ({ rows: [] as { concept_id: string; display: string }[] }));
    const inDict = new Map(dict.rows.map((r) => [r.concept_id, r.display]));

    await client.query("BEGIN");
    const existing = await client.query<{ snomed_code: string }>(
      `SELECT snomed_code FROM "master"."asesmen_item"
        WHERE kategori = $1 AND deleted_at IS NULL AND snomed_code IS NOT NULL`,
      [KATEGORI],
    );
    const have = new Set(existing.rows.map((r) => r.snomed_code));

    let inserted = 0;
    for (const [nama, kode, display, deskripsi] of KELUHAN) {
      if (have.has(kode)) continue;
      const { rows } = await client.query<{ last_seq: number }>(
        `INSERT INTO "master"."asesmen_counter" ("scope","last_seq") VALUES ($1, 1)
         ON CONFLICT ("scope") DO UPDATE SET "last_seq" = "master"."asesmen_counter"."last_seq" + 1
         RETURNING "last_seq"`,
        [PREFIX],
      );
      const kodeKatalog = `${PREFIX}-${String(rows[0].last_seq).padStart(3, "0")}`;
      await client.query(
        `INSERT INTO "master"."asesmen_item"
           ("id","kode","nama","kategori","deskripsi","snomed_code","snomed_display","status","created_at","updated_at")
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Aktif',now(),now())`,
        [randomUUID(), kodeKatalog, nama, KATEGORI, deskripsi, kode, display],
      );
      inserted++;
    }
    await client.query("COMMIT");

    const luar = KELUHAN.filter(([, k]) => !inDict.has(k)).map(([n, k]) => `${n} ${k}`);
    console.log(`✅ Keluhan utama: ${inserted} baru · ${KELUHAN.length - inserted} sudah ada · total kurasi ${KELUHAN.length}.`);
    console.log(`   Cocok kamus lokal 2002: ${KELUHAN.length - luar.length}/${KELUHAN.length}.`);
    if (luar.length) console.log(`   Di luar kamus 2002 (kode rilis lebih baru, lolos Verhoeff): ${luar.join(" · ")}`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌ Seed keluhan utama gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
