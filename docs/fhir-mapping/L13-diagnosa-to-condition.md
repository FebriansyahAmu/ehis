# L13 · `diagnosaToCondition` — Diagnosa → Condition

| | |
|---|---|
| Status | ⚠️ ada (FH4, `toFhirCondition`) — kamar benar, perlu perapian |
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
