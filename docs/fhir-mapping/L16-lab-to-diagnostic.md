# L16 · `labToDiagnostic` — Order & Hasil Laboratorium → ServiceRequest · Specimen · Observation · DiagnosticReport

| | |
|---|---|
| Status | 🟡 S3 2026-11-17: gerbang Lampiran LOINC resmi Permintaan/Hasil ✅ ([links/labTerminologi.ts](../../src/lib/fhir/links/labTerminologi.ts)) · `DiagnosticReport.category` per bagian ✅ · **S6b 2026-11-19: Specimen ✅** (sesudah SR) · sisa: LOINC master 0% (FG-52), waktu ambil & status puasa (FG-143) |
| Kamar | **ServiceRequest** (cat SNOMED `108252007`) → **Specimen** → **Observation** (`laboratory`) → **DiagnosticReport** |
| Playbook | RJ/IGD/RI §Pemeriksaan Penunjang Laboratorium [V] |
| Contoh resmi | IGD: SR `58410-2 CBC panel` → Specimen → Obs `718-7` + `787-2` → DR `HM 58410-2` · RI: SR `2093-3` + `kptl|30326` → … → DR `CH` |

## Sumber EHIS

`LabOrder`/`LabOrderItem` (tes diorder, CITO, labTestId) · `LabResult` (validasi, analis, validator) ·
`LabResultValue` (nilai per parameter, flag, rujukan) · master `LabTest`/`LabParameter` (`loinc_code`).

## Aturan inti [V]

- **Satu kode per payload**: 1 tes tunggal = 1 SR + 1 Specimen + 1 Observation + 1 DR. Panel = 1 SR (LOINC panel) + 1 Specimen + N Observation (LOINC parameter) + 1 DR.
- `DiagnosticReport.code` **harus sama** dengan `ServiceRequest.code`.
- Hanya hasil **tervalidasi** yang dikirim (`final`) (FG-57).

## Pemetaan per resource

| Resource | Elemen kunci | Sumber |
|---|---|---|
| ServiceRequest | identifier `…/servicerequest/{Org_id}` · `status` · `intent` order · category `108252007` · `code*` LOINC tes ("Permintaan"/"Permintaan & Hasil") atau KPTL · `requester*` dokter pengirim · `performer*` · `priority` `stat` (CITO) / `routine` · `reasonReference` Condition · `supportingInfo` → Procedure puasa | LabOrderItem |
| Procedure status puasa | category `103693007` · code SNOMED `792805006` Fasting · `status` `done`/`not-done` | ⛔ belum ada field puasa di order (contoh resmi selalu menyertakan) |
| Specimen | `status*` · `type*` SNOMED (ECL `< 123038009`) · `subject*` · `collection.collectedDateTime` · `collection.fastingStatusCodeableConcept` v2-0916 `F`/`NF` · `request` | ✅ S6b: type dari `lab_test.spesimen_snomed` · receivedTime/ReceivedPerson dari aksi Terima Lab; `collection` ⛔ (FG-143) |
| Observation | category `laboratory` · `code*` LOINC parameter ("Hasil") · `value[x]*` Quantity (UCUM) / CodeableConcept / String · `referenceRange` (dianjurkan) · `interpretation` v3-ObservationInterpretation · `performer*` analis · `specimen` · `basedOn` SR | LabResultValue |
| DiagnosticReport | `status` · category v2-0074 (**per bagian lab**, lihat bawah) · `code*` = SR.code · `basedOn*` · `result*` · `specimen*` · `performer*` validator · `conclusion` | LabResult |

## ConceptMap KategoriLab → `DiagnosticReport.category` (v2-0074)

Contoh resmi memakai `HM` (hematologi) & `CH` (kimia), sedangkan adapter sekarang mengirim `LAB` generik untuk
semua. Usulan peta (cek terhadap 10 kategori lab EHIS): Hematologi→`HM` · Kimia klinik→`CH` · Mikrobiologi→`MB` ·
Serologi/Imunologi→`SR`/`IMM` · lainnya→`LAB`.

## Terminologi resmi (keputusan 2026-11-17: pakai Lampiran LOINC Laboratorium SatuSehat, bukan LOINC penuh)

Tabel `master.terminologi_lab` (6.532 baris · 3.294 kode · 5 lampiran: Patologi Klinik bag. 1 v1.1 & bag. 2 v1.2,
Patologi Anatomi, Mikrobiologi Klinik, Parasitologi Klinik) + `master.terminologi_lab_jawaban` (5.177 jawaban berkode),
model [terminologiLab.prisma](../../prisma/schema/terminologiLab.prisma), seed
[seed-terminologi-lab.mts](../../prisma/scripts/seed-terminologi-lab.mts) dari file lokal `docs/terminologi/loinc-lab/`
(tidak di-commit).

| Dipakai untuk | Aturan |
|---|---|
| Picker LOINC di Katalog Lab | Cari `nama_pemeriksaan`/`display`; admin memilih — kecocokan nama hanya **saran** (uji 2026-11-17: 42/88 parameter cocok persis, 63/88 mengandung) |
| `ServiceRequest.code` | Kode harus punya baris `permintaan_hasil` ∈ {Permintaan, Permintaan & Hasil} |
| `Observation.code` | Kode harus punya baris `permintaan_hasil` ∈ {Hasil, Permintaan & Hasil} |
| `Observation.valueCodeableConcept` (Nominal/Ordinal) | Jawaban dari `terminologi_lab_jawaban` untuk kode tsb. (mis. Positive `LA6576-8`) |
| Kode tanpa padanan LOINC | Kode pemeriksaan Kemenkes (`X…`, `PA…`, `PR…`) system `http://terminology.kemkes.go.id/CodeSystem/examination` — sah dipakai |

## Gerbang pra-kirim

LOINC terisi di master untuk tes **dan** setiap parameter (FG-52; tanpa LOINC = belum siap, jangan pakai kode
lokal) · kode ada di `master.terminologi_lab` dengan kategori Permintaan/Hasil yang sesuai resource · satuan valid UCUM (FG-55) · validator punya IHS · `DiagnosticReport.specimen*` wajib → selama Specimen ⛔,
paket lab tidak lolos gerbang untuk profil yang mewajibkannya → **verifikasi sandbox** apakah DR tanpa specimen ditolak.

## Jangan salah kamar

- Hasil lab **bukan** `vital-signs` / `exam` — selalu `laboratory`.
- Interpretasi kritis (HH/LL) tetap di `interpretation`, bukan Observation terpisah.
- KPTL adalah kode **tarif/tindakan**, bukan pengganti LOINC parameter hasil.

## Dibangun S6b — Specimen

- **Urutan:** ServiceRequest **terkirim dulu** → Specimen (`request` → `ServiceRequest/{id}`, seperti contoh resmi RI) →
  Observation (`specimen`) → DiagnosticReport (`specimen*`). Dikirim saat sampel sudah di Lab: order **diterima lewat aksi
  Terima** atau **hasil sudah dientri** (order RJ langsung "Diterima" saat dibuat). Gerbang murni
  [links/specimen.ts](../../src/lib/fhir/links/specimen.ts).
- **1 Specimen per item tes** (localId = id item, identifier `…/specimen/{Org_id}` + assigner). Bentuk = contoh resmi IGD:
  status `available` · `type` SNOMED · `subject` · `request` · `receivedTime` + extension `ReceivedPerson`. Order dihapus →
  `entered-in-error`.
- **Jenis spesimen:** kolom `master.lab_test.spesimen_snomed` (migrasi `20261119120000`, backfill dari teks spesimen — 38/38 tes
  terpetakan) dari daftar terkurasi [`SPESIMEN_SNOMED`](../../src/lib/fhir/conceptMap.ts) (15 jenis; display dibaca saat kirim).
  Dropdown "Jenis Spesimen SatuSehat" di Katalog Lab › Identitas. Kosong → Issue `kode-kosong`.
- **Penerimaan:** kolom `lab_order.diterima_at/diterima_oleh/diterima_oleh_pegawai_id` di-stamp server saat aksi Terima (worklist
  maupun tab Penerimaan di detail order — yang terakhir sebelumnya hanya mengubah tampilan lokal).
- **DiagnosticReport lab tanpa Specimen terkirim → ditahan** (Observation tetap terkirim).
