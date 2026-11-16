# L17 · `radToDiagnostic` — Order & Ekspertise Radiologi → ServiceRequest · ImagingStudy · Observation · DiagnosticReport

| | |
|---|---|
| Status | ⚠️ ada (FH6) — tanpa accession number & ImagingStudy |
| Kamar | **ServiceRequest** (cat SNOMED `363679005` Imaging) → **ImagingStudy** (DICOM router) → **Observation** (`imaging`) → **DiagnosticReport** |
| Playbook | RJ/IGD/RI §Pemeriksaan Penunjang Radiologi [S] |
| Contoh resmi | RJ: SR/Obs/DR `24648-8 XR Chest PA` (DR `RAD`) · IGD: `11525-3 US for pregnancy` (DR `OUS`) · RI: `38036-0 US Kidney` + `kptl|31537` (DR `RAD`) |

## Sumber EHIS

`RadOrder`/`RadOrderItem` (pemeriksaan katalog `RAD-NNNN`, modalitas method FHIR XR/CT/MR/US/…, CITO) ·
`RadResult` (laporan tunggal: indikasi · teknik · temuan · kesan · saran · radiolog · validasi) · master
`RadCatalog.loinc_code`. `RadAkuisisi` (dosis/proteksi) **tidak punya kamar** → tidak dikirim.

## Pemetaan per resource

| Resource | Elemen kunci | Sumber |
|---|---|---|
| ServiceRequest | identifier[0] `…/servicerequest/{Org_id}` · **identifier[1] accession number** (type v2-0203 `ACSN`, system `http://sys-ids.kemkes.go.id/acsn/{Org_id}`) · category `363679005` · `code*` LOINC (atau KPTL) · `orderDetail` modalitas DICOM (`http://dicom.nema.org/resources/ontology/DCM`) + AE title (`http://sys-ids.kemkes.go.id/ae-title`) · `priority` stat/routine · `requester*` · `performer*` · `reasonReference` | RadOrderItem |
| Observation status kehamilan | category `survey` · LOINC `82810-3` Pregnancy status · SNOMED `77386006` hamil / `60001007` tidak hamil | ⛔ belum ada field (pane Persiapan masih lokal) |
| Procedure status puasa | sama dengan L16 | ⛔ |
| ImagingStudy | `identifier` (Study UID) · `status` · `modality` · `subject` · `started` · `basedOn` SR · `endpoint` · `series.uid/modality` | ⛔ dikirim **DICOM router**, bukan EHIS (FG-54) |
| Observation | category `imaging` · `code*` = LOINC pemeriksaan · `valueString` = temuan · `derivedFrom` ImagingStudy · `issued` · `performer*` radiolog | RadResult.temuan |
| DiagnosticReport | category v2-0074 (`RAD` default · `OUS` USG obstetri) · `code*` = SR.code · `basedOn*` · `result*` · `imagingStudy*` · `conclusion*` = kesan · `performer*` | RadResult |

## Aturan "satu kode per payload"

Order rad EHIS boleh berisi >1 pemeriksaan, tetapi ekspertise = **1 laporan** untuk seluruh order (FG-56).
Playbook: 1 SR/Observation/DR per kode. Usulan: kirim **SR per item**, dan Observation+DR **hanya bila order
berisi 1 pemeriksaan**; order multi-pemeriksaan ditahan sampai ekspertise per item tersedia (D14).

## Gerbang pra-kirim

LOINC katalog terisi · accession number dibangkitkan saat order (nomor unik per RS) · radiolog punya IHS ·
`imagingStudy*` wajib di DR → tanpa integrasi PACS, verifikasi sandbox apakah DR tanpa ImagingStudy diterima.

## Jangan salah kamar

- Kesan radiologi = `DiagnosticReport.conclusion`, **bukan** Condition diagnosis.
- Alergi kontras (contoh resmi menyertakan AllergyIntolerance kontras) dikirim lewat **L06**, bukan dibuat ulang di sini.
- Dosis radiasi/proteksi bukan Observation klinis → tidak dikirim.
