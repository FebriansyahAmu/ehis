# L12 · `penilaianToObservation` — Skala Risiko & Skrining → Observation

| | |
|---|---|
| Status | 🟡 S4 2026-11-17 — Morse · Humpty Dumpty · Edmonson ✅ (pemetaan master skala `fhir_pemetaan`, [links/skalaPemetaan.ts](../../src/lib/fhir/links/skalaPemetaan.ts)) · Braden/Braden Q ditahan (D13) · Barthel ditahan (D5) · status psikologis ⛔ |
| Kamar | **Observation** — category `exam` (risiko jatuh, dekubitus) · `survey` (fungsional/psikologis) |
| Playbook | IGD §5b Kajian risiko jatuh · §6 Skrining · §7 Pemeriksaan Fungsional · RI §5 [V] |
| Contoh resmi | IGD: `exam loinc|59461-4 Fall risk level [Morse Fall Scale]` · RI: `survey loinc|8693-4 Mental Status` · `survey sct|715823002 WHODAS 2.0 score` |

## Sumber EHIS

`medicalrecord.PenilaianSkala` (skalaKode `SR-NNNN` · skalaNama · totalSkor · interpretasiLabel · jawaban JSON ·
waktu) — instrumen dari `master.SkalaInstrument` (13 instrumen ter-seed).

## ConceptMap instrumen → kamar

| Instrumen EHIS | Kamar | `code` | `value[x]` / interpretasi |
|---|---|---|---|
| Morse Fall Scale | `exam` | LOINC `59461-4` | `valueQuantity` `{score}` · `OI000026` 0–24 rendah · `OI000027` 25–44 sedang · `OI000028` ≥45 tinggi |
| Humpty Dumpty | `exam` | clinical-term `OC000035` "Humpty Dumpty Scale" | `{score}` · `OI000021` 7–11 rendah · `OI000022` >12 tinggi (skor tepat 12 tidak tercakup playbook → tanpa interpretation, FG-105) |
| Edmonson (psikiatri) | `exam` | clinical-term `OC000036` "Edmonson Psychiatric Fall Risk Assessment" | `{score}` · `OI000023` 0–89 · `OI000024` >90 — pemetaan siap; EHIS belum punya instrumennya (admin bisa menambah) |
| Braden / Braden Q | `exam` — **skrining dekubitus** | SNOMED `285304000` At risk of pressure injury | `valueBoolean` diturunkan dari skor (ambang perlu keputusan klinis — D13) |
| NRS · Wong-Baker · FLACC · NIPS · CPOT | → **L11** (nyeri) | | |
| Barthel Index | ⛔ playbook memakai WHODAS 2.0 (`715823002`), bukan Barthel → tahan (D5) | | |
| MUST · MST · STRONGkids | ⛔ milik Modul Gizi (fase lanjut) | | |
| Status psikologis | `survey` LOINC `8693-4` (17326005 tidak ada kelainan · 48694002 cemas · 1402001 takut · 75408008 marah · 420038007 sedih · 74964007 lainnya) | ⛔ belum ada field terstruktur (kandidat: `Anamnesis.sosial` JSON — perlu cek) | |

Elemen: `status` `final` · category · `code` · `subject` · `encounter` · `performer` · `effectiveDateTime` ·
`interpretation` (system `http://terminology.kemkes.go.id/CodeSystem/clinical-term`).
`localId` = `<penilaianSkalaId>`.

## Masalah kualitas data

Pemetaan **jangan berdasarkan nama instrumen** (nama bisa diubah admin). Interpretasi dihitung dari skor dengan batas
playbook, bukan dari `interpretasiLabel` lokal.

**Dibangun S4 (2026-11-17):** kolom `master.skala_instrument.fhir_pemetaan` menyimpan **kunci** (`morse`, `humpty-dumpty`,
`edmonson`, `wong-baker`, `nrs`, `nips`, `flacc`, `cpot`, `braden`, `braden-q`, `barthel`, `tidak-dikirim`); system/code/kategori/pita
interpretasi ada di kode ([links/skalaPemetaan.ts](../../src/lib/fhir/links/skalaPemetaan.ts)) sehingga admin memilih dari daftar,
tidak mengetik kode. Admin mengatur di Master Skala → Identitas → "Pemetaan SatuSehat". Backfill sekali 19 instrumen bawaan dari nama
(migrasi `20261117160000`). `null` = belum dipetakan → Issue L12 `kode-kosong`.

Pita interpretasi verbatim playbook IGD §5: Morse `OI000026` "0 - 24 (Risiko rendah)" · `OI000027` "25 - 44 (Risiko sedang)" ·
`OI000028` "≥ 45 (Risiko tinggi)"; Humpty Dumpty `OI000021` "7 - 11 (Risiko rendah)" · `OI000022` "> 12 (Risiko tinggi)";
Edmonson `OI000023` "0 - 89 (Risiko rendah)" · `OI000024` "> 90 (Risiko tinggi)". Skor di celah pita (Humpty Dumpty 12,
Edmonson 90) dikirim tanpa `interpretation` (FG-105). `effectiveDateTime` = waktu simpan penilaian (FG-108).

## Jangan salah kamar

- Risiko jatuh **bukan** RiskAssessment (RiskAssessment = risiko penyakit) dan bukan `vital-signs`.
- `PenilaianStatus` (Stabil/Tidak Stabil/Kritis) **bukan** kondisi saat pulang (L24) — status selama rawat → tidak dikirim.
