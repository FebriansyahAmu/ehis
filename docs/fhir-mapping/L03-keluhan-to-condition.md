# L03 · `keluhanToCondition` — Keluhan Utama & Penyerta → Condition

| | |
|---|---|
| Status | 📋 belum ada — 🔴 **blocker**: Encounter `finished` wajib `diagnosis` CC |
| Kamar | **Condition** — category `chief-complaint` (keluhan utama) / `problem-list-item` (keluhan penyerta) |
| Playbook | RJ/IGD/RI §Anamnesis [V] |
| Contoh resmi | RI: `Condition cat=[chief-complaint] sct|278528006 Facial swelling` + `problem-list-item sct|25064002 Headache` · RJ: `problem-list-item sct|16932000 Batuk darah` |
| Bergantung | L01 |

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
| `code.text` | teks keluhan asli | teks gejala |
| `clinicalStatus` | `active` | `active` |
| `subject*` · `encounter*` | Patient · Encounter | sama |
| `onsetDateTime` | dari onset bila terstruktur | — |
| `recordedDate` | waktu anamnesis/triase | — |

Lalu **`Encounter.diagnosis`**: `{condition: Condition CC, use: diagnosis-role CC}` (L01).
`localId`: `<anamnesisId>:cc` · `<triaseId>:penyerta:<n>`.

## Masalah kualitas data → keputusan D4

`code*` wajib SNOMED, tetapi keluhan EHIS saat ini **teks bebas**. Prinsip [ARSITEKTUR §5](ARSITEKTUR.md):
teks bebas **tidak** dikodekan otomatis. Usulan:

1. Tambah **picker SNOMED subset keluhan** (kolom `keluhanSnomedKode` + display) di form Anamnesis & Triase — teks bebas tetap sebagai catatan.
2. Subset disimpan sebagai master (katalog asesmen, kategori baru "Keluhan") dengan `snomedCode` — pola yang sama dengan `AsesmenItem`.
3. Keluhan tanpa kode → Condition **belum siap** → Encounter tidak bisa `finished` di SatuSehat → tampil jelas di konsol.

## Jangan salah kamar

- Keluhan utama **bukan** `encounter-diagnosis` (itu L13) — beda category, beda `Encounter.diagnosis.use`.
- Gejala penyerta **bukan** Observation.
- Riwayat penyakit lama → L04 (`previous-condition`), bukan di sini.
