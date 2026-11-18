# L13 · `diagnosaToCondition` — Diagnosa → Condition

| | |
|---|---|
| Status | 🟡 S6a 2026-11-18 — dirapikan: display master ICD-10 · diagnosa masuk AD · gerbang Utama tepat satu · sisa: SNOMED pendamping, `CM` komorbid (FG-142) |
| Kamar | **Condition** category `encounter-diagnosis` (system `condition-category`) + `Encounter.diagnosis` |
| Playbook | RJ/IGD/RI §Diagnosis [S] + Pembaharuan Data Kunjungan [V] |
| Contoh resmi | RJ: `icd-10|A15.0` + `icd-10|E11.9` · RI: `icd-10|N18.5` **+ `sct|433146000`** (ICD-10 & SNOMED dalam 1 `code`) |

## Sumber EHIS

`medicalrecord.Diagnosa` (kodeIcd10 · namaDiagnosis · tipe Utama/Sekunder/Komplikasi/Komorbid · status
Pasti/Dicurigai/Diferensial · deletedAt) · `Kunjungan.diagnosaMasuk/kodeIcdMasuk` (diagnosa masuk).

## Pemetaan elemen (`*` wajib)

| Elemen | Aturan |
|---|---|
| `category` | `encounter-diagnosis` ✅ |
| `code*` | ICD-10 `http://hl7.org/fhir/sid/icd-10` (+ SNOMED bila tersedia) · `display` = display WHO dari master ICD, nama lokal di `code.text` (FG-39) |
| `clinicalStatus` | `active` ✅ |
| `verificationStatus` | Pasti→`confirmed` · Dicurigai→`provisional` · Diferensial→`differential` · dihapus→`entered-in-error` ✅ |
| `subject*` · `encounter*` | ✅ |
| `recordedDate` | `createdAt` |

Satu diagnosis = satu Condition [S]. `localId` = `<diagnosaId>`.

## `Encounter.diagnosis` (diisi oleh L01 saat `finished`)

| Diagnosa EHIS | `use` (diagnosis-role) | `rank` |
|---|---|---|
| Utama | `DD` | 1 |
| Sekunder / Komplikasi / Komorbid | `DD` | 2, 3, … (urut input) |
| Diagnosa masuk (`kodeIcdMasuk`) | `AD` Admission diagnosis | — (contoh resmi IGD memakai `AD`) |
| Keluhan utama (L03) | `CC` | — |

`CM` (Comorbidity) untuk tipe Komorbid **tidak** dipakai dulu: tidak tertulis di playbook → tunggu uji sandbox.

## Gerbang pra-kirim

Kode ICD-10 valid format & ada di master ICD · diagnosa `Utama` ada tepat satu saat `finished`.

## Jangan salah kamar

- Diagnosis **bukan** `problem-list-item` (itu keluhan penyerta / kondisi pulang) dan bukan `previous-condition`.
- Diagnosa keperawatan SDKI **tidak** dikirim sebagai Condition.

## Dibangun S6a

- `code.coding.display` = **display master ICD-10** (`master.icd_code.display`, dibaca saat kirim; FG-39 ✅) · nama lokal → `code.text`
  bila berbeda · kode yang **tidak ada di master** → Issue `kode-tidak-valid` (ditahan) — [links/diagnosa.ts](../../src/lib/fhir/links/diagnosa.ts) `diagnosaSiap`.
- **Diagnosa masuk** `kunjungan.kode_icd_masuk` → Condition `encounter-diagnosis` (bentuk contoh resmi IGD "Diagnosis Awal": tanpa
  verificationStatus, `onsetDateTime` = waktu kunjungan) + `Encounter.diagnosis` use **AD** (tanpa rank). localId `<kunjunganId>:diagnosa-masuk`.
- Gerbang finished ([encounterFinal.ts](../../src/lib/fhir/links/encounterFinal.ts) `finishedBlockers`): diagnosis **Utama terkirim tepat satu**;
  kosong / ganda → Encounter tetap `in-progress` + Issue `syarat-finished`.
- Komplikasi/Komorbid tetap di luar `Encounter.diagnosis` (Condition-nya terkirim); `CM` menunggu uji sandbox (FG-142).
