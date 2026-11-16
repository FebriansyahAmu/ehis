# L16 · `labToDiagnostic` — Order & Hasil Laboratorium → ServiceRequest · Specimen · Observation · DiagnosticReport

| | |
|---|---|
| Status | ⚠️ ada (FH6, [diagnostic.ts](../../src/lib/fhir/adapters/diagnostic.ts)) — LOINC kosong, Specimen & status puasa belum |
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
| Specimen | `status*` · `type*` SNOMED (ECL `< 123038009`) · `subject*` · `collection.collectedDateTime` · `collection.fastingStatusCodeableConcept` v2-0916 `F`/`NF` · `request` | ⛔ sampel diambil di luar aplikasi (FG-53) |
| Observation | category `laboratory` · `code*` LOINC parameter ("Hasil") · `value[x]*` Quantity (UCUM) / CodeableConcept / String · `referenceRange` (dianjurkan) · `interpretation` v3-ObservationInterpretation · `performer*` analis · `specimen` · `basedOn` SR | LabResultValue |
| DiagnosticReport | `status` · category v2-0074 (**per bagian lab**, lihat bawah) · `code*` = SR.code · `basedOn*` · `result*` · `specimen*` · `performer*` validator · `conclusion` | LabResult |

## ConceptMap KategoriLab → `DiagnosticReport.category` (v2-0074)

Contoh resmi memakai `HM` (hematologi) & `CH` (kimia), sedangkan adapter sekarang mengirim `LAB` generik untuk
semua. Usulan peta (cek terhadap 10 kategori lab EHIS): Hematologi→`HM` · Kimia klinik→`CH` · Mikrobiologi→`MB` ·
Serologi/Imunologi→`SR`/`IMM` · lainnya→`LAB`.

## Gerbang pra-kirim

LOINC terisi di master untuk tes **dan** setiap parameter (FG-52; tanpa LOINC = belum siap, jangan pakai kode
lokal) · satuan valid UCUM (FG-55) · validator punya IHS · `DiagnosticReport.specimen*` wajib → selama Specimen ⛔,
paket lab tidak lolos gerbang untuk profil yang mewajibkannya → **verifikasi sandbox** apakah DR tanpa specimen ditolak.

## Jangan salah kamar

- Hasil lab **bukan** `vital-signs` / `exam` — selalu `laboratory`.
- Interpretasi kritis (HH/LL) tetap di `interpretation`, bukan Observation terpisah.
- KPTL adalah kode **tarif/tindakan**, bukan pengganti LOINC parameter hasil.
