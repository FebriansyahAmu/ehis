# L02 · `triaseToObservation` — Triase IGD → Observation

| | |
|---|---|
| Status | ⏸ **ditunda** (keputusan user 2026-11-17) — spesifikasi di bawah disimpan sebagai usulan |
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

**Level triase → CTAS (D2 — usulan, perlu konfirmasi klinis).** EHIS punya **dua lapis** data triase:

| Lapis | Sumber | Nilai |
|---|---|---|
| A. Level protokol (matriks kriteria) | `TriaseCriteria.levelKode` (kriteria yang dicentang perawat, protokol `DEFAULT-IGD`) | `resusitasi` · `emergency` · `urgent` · `lessUrgent` · `nonUrgent` · `doa` — **6 level, sama persis dengan CTAS SatuSehat** |
| B. Keputusan triase (warna) | `Triase.triageLevel` | P1 Merah (kritis, mengancam jiwa) · P2 Kuning (gawat, segera) · P3 Hijau (tidak gawat darurat) · P4 Hitam (meninggal / harapan sangat kecil) |

Warna P **lebih kasar** dari CTAS (4 vs 6) → peta tetap dari P saja pasti salah untuk sebagian pasien. Usulan:
**kode CTAS = level protokol paling gawat di antara kriteria yang dicentang**, lalu dicek terhadap pita warna P:

| Level protokol | CTAS dikirim | Pita P yang konsisten |
|---|---|---|
| `resusitasi` | LOINC `LA6112-2` 1 Resusitasi | P1 |
| `emergency` | LOINC `LA6113-0` 2 Emergensi | P1 · P2 |
| `urgent` | LOINC `LA6114-8` 3 Urgent | P2 |
| `lessUrgent` | LOINC `LA6115-5` 4 Less Urgent | P3 |
| `nonUrgent` | LOINC `LA10137-0` 5 Non Urgent | P3 |
| `doa` | SNOMED `63238001` Dead on arrival at hospital | P4 |

Aturan:
1. Level protokol konsisten dengan pita P → kirim kode level protokol.
2. Tidak ada kriteria dicentang, **atau** level protokol di luar pita P (keputusan klinis menyimpang dari matriks) → Observation CTAS **belum siap**, tampil "perlu tinjau" di konsol. Resource lain di kunjungan tetap terkirim.
3. **P4 bukan otomatis DOA.** `63238001` hanya bila level protokol `doa` (tiba tanpa tanda kehidupan). P4 "harapan sangat kecil" pada pasien yang masih hidup tidak punya kode CTAS → aturan 2.

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
