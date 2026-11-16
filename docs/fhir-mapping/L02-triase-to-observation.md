# L02 · `triaseToObservation` — Triase IGD → Observation

| | |
|---|---|
| Status | 📋 belum ada |
| Kamar | **Observation** category `survey` (system `http://terminology.hl7.org/CodeSystem/observation-category`) |
| Playbook | IGD §3 "Triase dan Gawat Darurat" [V] |
| Unit | IGD saja |
| Bergantung | L01 (Encounter) · Practitioner IHS perawat triase |

## Sumber EHIS

`medicalrecord.Triase` (caraMasuk · kondisiTiba · triageLevel P1–P4 · waktuTriase · authorPegawaiId) +
`Kunjungan.caraDatang/asalMasuk` · `Kunjungan.rujukan` (surat rujukan).
Tingkat kesadaran (`Triase.avpu`) → **L09**, keluhan utama → **L03**, tanda vital triase → **L08**.

## Resource yang dibangun (1 Triase → maks. 3 Observation)

| key | Isi | `code` | `value[x]` |
|---|---|---|---|
| `transport` | Sarana transportasi kedatangan | LOINC `74286-6` "Transport mode to hospital" | `valueCodeableConcept` (ConceptMap di bawah) |
| `rujukan` | Surat pengantar rujukan | `http://terminology.kemkes.go.id/CodeSystem/clinical-term` `OC000034` | `valueBoolean` |
| `ctas` | Kondisi pasien tiba (level triase) | LOINC `75910-0` "Canadian triage and acuity scale [CTAS]" | `valueCodeableConcept` |

Elemen wajib setiap Observation [V]: `status` (`final`) · `code` · `subject` · `encounter` · `performer`.
`effectiveDateTime` = `Triase.waktuTriase`. `localId` = `<triaseId>:<key>`.

## ConceptMap

**Level triase → CTAS (D2 — perlu konfirmasi klinis):**

| EHIS | CTAS | Kode |
|---|---|---|
| P1 | 1 Resusitasi | LOINC `LA6112-2` |
| P2 | 2 Emergensi | LOINC `LA6113-0` |
| P3 | 3 Urgent | LOINC `LA6114-8` |
| P4 | 4 Less Urgent | LOINC `LA6115-5` |
| — | 5 Non Urgent | LOINC `LA10137-0` (EHIS tak punya level 5) |
| DOA | 6 Death on Arrival | SNOMED `63238001` "Dead on arrival at hospital" (EHIS belum punya opsi) |

**Sarana transportasi (D10 — perlu keputusan):** pilihan EHIS "Cara Masuk" = `Jalan Kaki` · `Kursi Roda` ·
`Brankar` · `Ambulans RS` · `Ambulans 118` — **mencampur cara mobilisasi dengan sarana transportasi**.

| EHIS | Kode 74286-6 |
|---|---|
| `Ambulans RS`, `Ambulans 118` | LOINC `LA9315-8` Ground ambulance |
| (tidak ada) Mobil | SNOMED `71783008` Car |
| (tidak ada) Motor | SNOMED `90748009` Motorcycle |
| `Jalan Kaki`/`Kursi Roda`/`Brankar` | **bukan sarana transportasi** → jangan dipetakan ke `LA46-8 Other` |

Usulan: tambah field **"Sarana Transportasi"** (Ambulans/Mobil/Motor/Lain-lain) terpisah dari "Cara Masuk".
Sebelum field ada: kirim `transport` hanya bila Ambulans; selain itu belum siap.

## Gerbang pra-kirim

`triageLevel` terisi · perawat triase punya IHS · surat rujukan: kirim `valueBoolean` hanya bila asal rujukan
diketahui (bukan default `false`).

## Jangan salah kamar

- `kondisiTiba` EHIS (Sadar/Penurunan Kesadaran/Tidak Sadar/Gelisah) **bukan** CTAS — itu kesadaran → L09.
- Level triase **bukan** `Encounter.priority` saja; kamar resminya Observation `75910-0`.
- Kriteria triase per parameter (`TriaseCriteria`) tidak dikirim — tidak ada kamar.
