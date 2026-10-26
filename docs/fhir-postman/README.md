# FHIR Postman — contoh payload RESMI SatuSehat (verbatim)

Contoh payload FHIR R4 **verbatim** dari **workspace Postman RESMI SatuSehat**
(`https://www.postman.com/satusehat/satusehat-public`), ditarik via **Postman API** dari collection yang
sudah di-fork ke akun kita. Dipakai sebagai **referensi payload** saat membangun adapter `toFhir*`
([../FHIR-RULES.md](../FHIR-RULES.md) §Adapter · [../FHIR-PAYLOADS.md](../FHIR-PAYLOADS.md) · [../../TODO-FHIR.md](../../TODO-FHIR.md)).

> **Sumber:** collection `00. FHIR Resource - Contoh Penggunaan` (per-resource) + `01/02/03. Pelayanan -
> Rawat Jalan/Rawat Inap/IGD` (bundle). Diambil 2026-08-19. Ini **data contoh publik** dari SatuSehat —
> tak ada PII/secret nyata. Jangan tambahkan data pasien asli ke sini.

## Isi

- **`resources/`** — 1 contoh `POST Create` kanonik per resource FHIR (25 file): onboarding
  (Patient/Organization/Location) · klinis (Encounter/Condition/Observation/Procedure/Medication(+Request/
  Dispense)/ServiceRequest/Specimen/DiagnosticReport/AllergyIntolerance/ClinicalImpression/ImagingStudy/
  Immunization/EpisodeOfCare/CarePlan/QuestionnaireResponse/RelatedPerson/Composition) · pembiayaan
  (Coverage-BPJS/Account/ChargeItem). Practitioner = GET-only (tak ada body create).
- **`bundles/`** — **`Bundle type=transaction`** utuh per Service Module: `bundle-rawat-jalan.json`,
  `bundle-igd.json`, `bundle-rawat-inap.json`. Ini **blueprint FH7** (urutan + referensi antar-resource
  lengkap sesuai playbook resmi).

## Cara baca

- Payload memakai **variabel environment Postman** `{{...}}` — ganti saat runtime:
  | Var | Arti |
  |---|---|
  | `{{base_url}}` | `https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1` (sandbox) |
  | `{{auth_url}}` | `.../oauth2/v1` |
  | `{{Org_id}}` | IHS Organization id RS |
  | `{{Patient_id}}` | IHS Patient id (hasil resolve NIK) |
  | `{{Encounter_uuid}}` | id Encounter aktif |
  | `{{privateHost}}` | DICOM router internal (radiologi) |
- **`meta.profile`** = URL StructureDefinition SatuSehat (profil validasi server) — pertahankan saat kirim.
- Referensi di dalam `bundles/*` pakai `urn:uuid:<x>` + `request.method/url` (pola transaction).
- Kode/`system` = kanonik SatuSehat (lihat [../FHIR-RULES.md](../FHIR-RULES.md) R17): NIK
  `https://fhir.kemkes.go.id/id/nik` · IHS `.../id/ihs-number` · KFA `http://sys-ids.kemkes.go.id/kfa` ·
  ICD-10 `http://hl7.org/fhir/sid/icd-10` · ICD-9-CM `.../icd-9-cm` · LOINC `http://loinc.org` · SNOMED
  `http://snomed.info/sct`.

## Cara refresh (bila SatuSehat rilis versi baru)

1. Fork workspace `satusehat/satusehat-public` ke akun Postman (Free cukup).
2. `GET https://api.getpostman.com/collections` (header `X-Api-Key: <key>`) → daftar uid collection.
3. `GET https://api.getpostman.com/collections/{uid}` → ambil `collection.item[].request.body.raw`.
4. Ekstrak → pretty-print → simpan ke `resources/` atau `bundles/`.

Collection uid (fork akun kita, per 2026-08-19): base FHIR `36617333-c2c87650-…` · RJ `36617333-fb490da9-…` ·
RI `36617333-21997e1b-…` · IGD `36617333-3a4981eb-…` · Farmasi `36617333-179bc79b-…`
(+ 25+ use-case tematik: ANC/INC/PNC/Neonatus/SHK/MTBS/Imunisasi/Gizi/Tumbuh Kembang/PKPR/PTM/Registri
Kanker-Jantung-Stroke-Uronefro-Mata-Telinga/Gigi/Klaim Asuransi & BPJS/TB/HIV/Geriatri/UBM/Rabies/Anthrax/SMPK).
API key = env `POSTMAN_API_KEYS` (server-only, jangan commit).
