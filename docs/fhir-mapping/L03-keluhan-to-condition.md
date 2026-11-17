# L03 · `keluhanToCondition` — Keluhan Utama & Penyerta → Condition

| | |
|---|---|
| Status | ✅ **keluhan utama** — S2 2026-11-17 ([encounterCondition.ts](../../src/lib/fhir/adapters/encounterCondition.ts) · [encounterFinal.ts](../../src/lib/fhir/links/encounterFinal.ts)) · 📋 keluhan penyerta (sumber Triase, ditunda bersama D2) |
| Kamar | **Condition** — category `chief-complaint` (keluhan utama) / `problem-list-item` (keluhan penyerta) |
| Playbook | RJ/IGD/RI §Anamnesis [V] |
| Contoh resmi | RI: `Condition cat=[chief-complaint] sct|278528006 Facial swelling` + `problem-list-item sct|25064002 Headache` · RJ: `problem-list-item sct|16932000 Batuk darah` — ⚠️ **display contoh RJ salah**: `16932000` = *Nausea and vomiting* (dicek di kamus lokal); batuk darah = `66857006` Hemoptysis |
| Bergantung | L01 |

## Implementasi S2 (2026-11-17)

- **Sumber tunggal:** `Anamnesis` terbaru (IGD/RI/RJ). Kolom baru `keluhan_snomed_kode` + `keluhan_snomed_display`
  (snapshot; CHECK berpasangan + format SCTID). Display **diturunkan server** dari master, bukan dari klien.
- **Subset kode:** master asesmen kategori **Keluhan Utama** (prefix `KU`, kode SNOMED **wajib**, kolom baru
  `snomed_display`). Seed [seed-keluhan-utama.mts](../../prisma/scripts/seed-keluhan-utama.mts): 54 keluhan tersering,
  semua lolos Verhoeff; 48/54 cocok kamus lokal 2002, 6 kode rilis lebih baru (Fever, Nausea, Vomiting,
  Dizziness, Hematochezia, Itching). Admin dapat menambah di Master › Asesmen Katalog.
- **Form:** [KeluhanSnomedPicker](../../src/components/shared/medical-records/KeluhanSnomedPicker.tsx) di bawah teks
  Keluhan Utama (3 pane Anamnesis) — combobox + "saran dari teks". Tidak wajib di form; tanpa kode → Issue
  `kode-kosong` dan Encounter ditahan `in-progress` (Issue `syarat-finished`).
- **Payload:** mengikuti contoh resmi RI — teks bebas di `note[].text`, `recorder` = penulis anamnesis (bila
  Practitioner terpetakan). `localId` = `<kunjunganId>:cc` (**1 per kunjungan**: anamnesis append-only, revisi =
  PUT resource yang sama — bukan per baris anamnesis agar tak menumpuk Condition yatim).
- Triase sebagai sumber cadangan (IGD awal) **belum** — ikut L02 yang ditunda.

## Sumber EHIS

- Keluhan utama: `Anamnesis.keluhanUtama` (RJ/RI/IGD) · `Triase.keluhanUtama` (IGD, lebih awal) · `Kunjungan.keluhan` (pendaftaran)
- Keluhan penyerta: `Triase.gejalaPenyerta[]`
- Onset: `Triase.onset` / `Anamnesis.onsetDurasi`

**Sumber tunggal (usulan):** keluhan utama = `Anamnesis` terbaru; bila belum ada (IGD awal) → `Triase`.
`Kunjungan.keluhan` (teks pendaftaran) tidak dikirim.

## Pemetaan elemen

| Elemen | Keluhan utama | Keluhan penyerta |
|---|---|---|
| `category` | system `http://terminology.kemkes.go.id` code `chief-complaint` | system `http://terminology.hl7.org/CodeSystem/condition-category` code `problem-list-item` |
| `code*` | SNOMED, ECL `< 404684003 |Clinical finding|` | SNOMED, ECL `< 404684003` |
| teks bebas | `note[].text` (pola contoh resmi RI) | teks gejala |
| `clinicalStatus` | `active` | `active` |
| `subject*` · `encounter*` | Patient · Encounter | sama |
| `onsetDateTime` | dari onset bila terstruktur | — |
| `recordedDate` | waktu anamnesis/triase | — |

Lalu **`Encounter.diagnosis`**: `{condition: Condition CC, use: diagnosis-role CC}` tanpa `rank` (contoh RI) (L01).
`localId`: `<kunjunganId>:cc` · (penyerta, nanti) `<triaseId>:penyerta:<n>`.

## Masalah kualitas data → keputusan D4 (✅ dikerjakan S2, lihat atas)

`code*` wajib SNOMED, tetapi keluhan EHIS saat ini **teks bebas**. Prinsip [ARSITEKTUR §5](ARSITEKTUR.md):
teks bebas **tidak** dikodekan otomatis. Usulan:

1. Tambah **picker SNOMED subset keluhan** (kolom `keluhanSnomedKode` + display) di form Anamnesis & Triase — teks bebas tetap sebagai catatan.
2. Subset disimpan sebagai master (katalog asesmen, kategori baru "Keluhan") dengan `snomedCode` — pola yang sama dengan `AsesmenItem`.
3. Keluhan tanpa kode → Condition **belum siap** → Encounter tidak bisa `finished` di SatuSehat → tampil jelas di konsol.

## Jangan salah kamar

- Keluhan utama **bukan** `encounter-diagnosis` (itu L13) — beda category, beda `Encounter.diagnosis.use`.
- Gejala penyerta **bukan** Observation.
- Riwayat penyakit lama → L04 (`previous-condition`), bukan di sini.
