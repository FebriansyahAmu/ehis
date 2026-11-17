# L11 · `nyeriToObservation` — Asesmen Nyeri → Observation

| | |
|---|---|
| Status | 🟡 S4 2026-11-17 — NRS dari TTV ✅ · Wong-Baker dari Penilaian Skala ✅ (pemetaan master skala, [links/skalaPemetaan.ts](../../src/lib/fhir/links/skalaPemetaan.ts)) · sisa: NIPS ditahan (FG-107), interpretasi tak dikirim (FG-106), durasi/lokasi PQRST masih teks |
| Kamar | **Observation** induk "Pain" SNOMED `22253000` category `survey` `valueBoolean` + **`hasMember`** → Observation skala |
| Playbook | IGD §5a "Asesmen nyeri" [V]; RJ/RI merujuk pola yang sama |

## Sumber EHIS

| Data | Sumber | Catatan |
|---|---|---|
| Skor NRS 0–10 | `Observation.skalaNyeri` (TTV) | **Sumber tunggal skor** (keputusan 2026-06-15: NRS = vital sign ke-5 di TTV) |
| Skala lain (Wong-Baker, NIPS, FLACC, CPOT) | `PenilaianSkala` (master `SkalaInstrument`) | per instrumen |
| Detail PQRST | `PenilaianNyeri` (lokasi · karakter · durasi · faktor · tipe · dampak) | teks bebas |

## Struktur kirim (per waktu observasi)

| Resource | `code` | `value[x]` | Sumber |
|---|---|---|---|
| Induk "Pain" | SNOMED `22253000` Pain | `valueBoolean` (skor > 0) | TTV |
| NRS | SNOMED `1172399009` Numeric rating scale score | `valueInteger` | `skalaNyeri` |
| Wong-Baker FACES | LOINC `38221-8` | `valueInteger` | PenilaianSkala |
| NIPS (neonatus) | LOINC `101967-8` panel + komponen (`95624-3`, `95622-7`, `98009-4`, `98010-2`, `98011-0`, `95623-5`) + total `98012-8` `{score}` | panel | PenilaianSkala (jawaban per item) |
| Durasi nyeri | LOINC `38207-7` | `valueQuantity` UCUM `d`/`h`/`min` | `PenilaianNyeri.durasi` — **teks**, perlu terstruktur |
| Frekuensi nyeri | SNOMED `700469003` | `valueString` | belum ada field khusus |
| Penyebab nyeri | `clinical-term` `OC000023` (component) | `valueString` | belum ada field khusus |
| Lokasi | `bodySite` SNOMED (body structure) | — | `PenilaianNyeri.lokasi` teks → belum berkode |

Induk & anggota: category `survey`, `status` `final`, `subject`, `encounter`, `performer`, `effectiveDateTime` =
`waktuObservasi`. `localId` = `<observationId>:nyeri` (induk) / `:nyeri-nrs` (anggota) — **bukan** `:pain`, karena localId itu
milik Observation lama salah kamar (LOINC 72514-3, FG-100) dan tidak ditimpa dengan kode lain. Dari Penilaian Skala:
anggota = `<penilaianSkalaId>`, induk = `<penilaianSkalaId>:nyeri`. Anggota dikirim dulu (id-nya dirujuk `hasMember`).
Skor 0 = "tidak nyeri" (nilai sah, form TTV wajib isi) → induk `valueBoolean: false` + NRS 0.
Display diverifikasi verbatim 2026-11-17 (Wong-Baker: "Pain severity Wong-Baker FACES pain rating scale").

**Interpretasi** (`OI000019` Mild to No Pain · `OI000020` Mild to Moderate Pain · SNOMED `76948002` Severe pain):
batas skor tidak tertulis di bagian playbook yang terbaca → **jangan kirim `interpretation`** sampai batasnya diverifikasi.

## Di luar playbook (tahan — D5)

FLACC, CPOT, BPS tidak ditemukan kodenya di playbook → tidak dikirim.

## Jangan salah kamar

- Skor nyeri **bukan** `vital-signs` dan bukan LOINC `72514-3` (yang dipakai L08 sekarang).
- PQRST teks bebas tidak dipaksa ke kode; hanya elemen yang punya field terstruktur yang dikirim.
