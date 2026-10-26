# TODO-FHIR — Integrasi SatuSehat (Kemenkes) · Analisis & Roadmap

> 📋 **Planned (2026-08-19).** Modul `/ehis-fhir` = jembatan RS → **Platform SatuSehat** (HL7 **FHIR R4**).
> Katalog modul + peta resource + fase kerja **FH0–FH9**. Belum ada kode (`src/lib/fhir/**` kosong).
> **Prinsip arsitektur = MIRROR [TODO-BPJS-WS.md](TODO-BPJS-WS.md)**: secrets server-only · FE→BFF→SatuSehat ·
> connector berlapis · panggilan eksternal di luar DB tx (outbox) · audit DB · `SATUSEHAT_MODE=mock|sandbox|prod`.
> Aturan kanonik: **[docs/FHIR-RULES.md](docs/FHIR-RULES.md) (DESAIN ✅ 2026-08-19)** — layering · R1–R17 · skema `fhir` · kontrak connector · sequence flow (pola [docs/BPJS-WS-RULES.md](docs/BPJS-WS-RULES.md)).
> Referensi payload: **[docs/FHIR-PAYLOADS.md](docs/FHIR-PAYLOADS.md)** (ringkas) + **[docs/fhir-postman/](docs/fhir-postman/)** — payload VERBATIM RESMI dari Postman `satusehat/satusehat-public` (di-fork + Postman API): 25 resource `resources/*.json` + Bundle transaction RJ/IGD/RI `bundles/*.json`.

**Sumber (RESMI SatuSehat/Kemenkes saja — first-party):**
[SATUSEHAT Platform Docs — API Catalogue](https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/) (dokumentasi resmi Kemenkes = sumber utama) ·
[Postman Workspace `satusehat/satusehat-public`](https://www.postman.com/satusehat/satusehat-public/overview) (workspace RESMI SatuSehat — mirror katalog API yang sama) ·
[SATUSEHAT FHIR R4 Implementation Guide](https://simplifier.net/guide/SATUSEHAT-FHIR-R4-Implementation-Guide) (profil FHIR resmi).
Katalog di bawah diverifikasi langsung dari halaman `satusehat.kemkes.go.id/platform/docs/id/...` (2026-08-19). **Tidak memakai sumber pihak ketiga** (bukan lib/blog; catatan: documenter "SATUSEHAT FHIR with Use Case" = akun pihak ketiga `rs-mata`, BUKAN resmi → tidak dipakai).

---

## 0. Konteks & regulasi

- **Wajib**: PMK 24/2022 (RME) → semua faskes kirim data ke **SatuSehat Platform**. RME wajib terhubung.
- **Standar**: **HL7 FHIR R4** (4.0.1). Terminologi: **ICD-10** v2010 (diagnosis) · **ICD-9-CM** v2010 (prosedur) · **LOINC** (lab/observasi) · **SNOMED-CT** (klinis/bodySite) · **KFA** (obat & alkes) · **DICOM** (modalitas rad) + ICD-O/ICD-MM/ICD-PM (kasus khusus).
- **SatuSehat = OWNER master Patient/Practitioner** → RS **tidak membuat** nakes (Practitioner **GET-only**), dan **resolve** IHS-number pasien via NIK. RS **membuat** resource klinis (Encounter, Condition, dst) yang mereferensikan IHS id.
- **Validasi terminologi = implisit server-side** saat POST resource (kode salah → error). **SatuSehat TIDAK menyediakan terminology server yang bisa di-query** ($lookup/$validate-code/$translate TIDAK ADA) → validasi lokal harus dibangun sendiri.

**Base URL (per `SATUSEHAT_MODE`)** — 2 environment resmi (sandbox = staging `stg`):
| Mode | Base host | Paths |
|---|---|---|
| `mock` | — (lokal, tanpa kredensial) | seam swap `callSatuSehat` |
| `sandbox`/`stg` | `https://api-satusehat-stg.dto.kemkes.go.id` | `/oauth2/v1` · `/fhir-r4/v1` · `/kyc/v1` · `/kfa` · `/kfa-v2` · `/kfa-v3` · `/masterdata/v1` |
| `prod` | `https://api-satusehat.kemkes.go.id` | idem |

**Identifier system kanonik** (dipakai di semua search & payload):
`NIK` = `https://fhir.kemkes.go.id/id/nik` · `NIK ibu` (bayi baru lahir) = `.../id/nik-ibu` · `IHS-number` = `.../id/ihs-number` · `KFA` = `http://sys-ids.kemkes.go.id/kfa`. Format param: `identifier=<system>|<value>`.

---

## 1. Peta Modul SatuSehat (katalog resmi lengkap)

Kolom **"Sumber lokal EHIS"** = tabel/master yang sudah ada untuk memberi makan resource itu (mayoritas SUDAH ADA).

### 1a. Authentication (OAuth2)
| Endpoint | Detail |
|---|---|
| `POST /oauth2/v1/accesstoken?grant_type=client_credentials` | `client_id`+`client_secret` di **body** (`x-www-form-urlencoded`), `grant_type` di query. Respons: `access_token` (BearerToken), `expires_in=3599` (~1 jam). Header lanjutan: `Authorization: Bearer <token>`. **Rate-limit 1 req/menit per client_id** setelah gagal → token WAJIB di-cache + auto-refresh. |

### 1b. FHIR — Resource **Onboarding** (prasyarat, resolve-first)
| Resource | Method | Kegunaan | Sumber lokal EHIS |
|---|---|---|---|
| **Organization** | GET·POST·PUT·PATCH | Entitas RS + sub-unit; search `?name`/`?partof` | `master.Location` (Org tree) · `master.RsProfil` |
| **Location** | GET·POST·PUT·PATCH | Ruangan/bed; search `?identifier`/`?name`/`?organization` | `master.Location` (Ruangan/Bed) |
| **Practitioner** | **GET-only** | Nakes — **read-only** (RS resolve IHS, tak create); search `?identifier=<nik>` atau `?name+?birthdate+?gender` | `master.Pegawai` + `master.Dokter` (NIK nakes) |
| **Patient** | GET·POST·PATCH | Demografi; **resolve IHS** `GET /Patient?identifier=<nik-system>\|<nik>` → Bundle (IHS = `Patient.id` + identifier ihs-number) | `pendaftaran.Pasien` — **`idSatusehat` SUDAH ADA** |

### 1c. FHIR — Resource **Interoperability** (klinis, RS menulis) + terminologi
| Resource | Kode/terminologi | Sumber lokal EHIS (medicalrecord.*) |
|---|---|---|
| **Encounter** | class `AMB`/`EMER`/`IMP` (v3-ActCode); status arrived→(triaged)→in-progress→finished | `encounter.Kunjungan` (+ `BedAllocation`, `Disposisi`) |
| **Condition** | **ICD-10** (`hl7.org/fhir/sid/icd-10`) — 1 payload = 1 kode | `Diagnosa` |
| **Procedure** | **ICD-9-CM** (`.../icd-9-cm`) + SNOMED bodySite + ICD-10 reasonCode | `TindakanMedis` · `DiagnosaProsedur` |
| **Observation** | **LOINC** + SNOMED bodySite/method | `Observation` (TTV) · `LabResultValue` · `PenilaianFisik` |
| **AllergyIntolerance** | **SNOMED-CT** (allergen + manifestasi) + clinical-term Kemkes | `AsesmenAlergi` (+ `AsesmenAlergiNka`) |
| **Medication** | **KFA** (`sys-ids.kemkes.go.id/kfa`) | `master.Obat` (KFA JSONB SUDAH ADA) |
| **MedicationRequest** | rujuk Medication (KFA) via `medicationReference` | `ResepOrder` + `ResepItem` |
| **MedicationDispense** | rujuk Medication (KFA); + `ChargeItemDefinition` (harga) | `ResepDispensing` |
| **ServiceRequest** | SNOMED-CT (per use case) — order lab/rad/rujukan | `LabOrder` · `RadOrder` · `Konsultasi` |
| **Specimen** | SNOMED-CT (`snomed.info/sct`) | `LabOrder` (sampel) |
| **DiagnosticReport** | **LOINC** (+ fallback kode nasional) | `LabResult` · `RadResult` |
| **ImagingStudy** | **DICOM** modality + SNOMED bodySite + LOINC | `RadOrder` · `RadAkuisisi` |
| **Composition** | dokumen (resume medis/CPPT) — struktur document | `ResumeMedik` · `Cppt` · `Anamnesis` |
| **ClinicalImpression** | (per use case) | `Cppt` (assessment/penalaran) |
| **CarePlan** | rencana asuhan | `CarePlanMasalah` + `CarePlanGoal` |
| **EpisodeOfCare** | episode lintas-Encounter | `encounter.Kunjungan` (grup) |
| **FamilyMemberHistory** | ICD-10 + SNOMED | `AsesmenPenyakitKeluarga(+Item)` |
| **Immunization** | **KFA** vaksin (93xxxxxx) + CVX | (belum ada domain — Phase later) |
| **QuestionnaireResponse** | (form terstruktur) — mis. telaah resep | `ResepTelaah` (PMK 72/2016 3-aspek) |
| **RelatedPerson** | identifier NIK | `pendaftaran.PasienKontakDarurat` |
| **HealthcareService** | `specialty` code (mis. S001.09) | `master` poliklinik/layanan unit |

**Resource pendukung yang muncul di bundle Service Module (belum punya domain khusus, sebagian derivable):** `MedicationStatement` (riwayat obat) · `Goal` (tujuan asuhan) · `RiskAssessment` (penilaian risiko/skala) · `MedicationAdministration` (MAR — `MarEntry`) · `NutritionOrder` (order diet — `AsesmenGizi`) · `DocumentReference` (dokumen resep) · `ChargeItemDefinition` (harga di dispense).

### 1d. FHIR — Resource **Scheduling / Provider**
| Resource | Method | Kegunaan |
|---|---|---|
| **HealthcareService** | GET·POST·PUT·PATCH | Direktori layanan/poli faskes |
| **Appointment** | GET·POST·PUT·PATCH | Janji temu |
| **AppointmentResponse** | GET·POST·PUT·PATCH | Balasan janji temu |
| **PractitionerRole** | GET·POST·PUT·PATCH | Peran+afiliasi nakes (`master.PenugasanRuangan`) |
| **Slot** | GET(:id)·POST·PUT·PATCH | Slot waktu (tak ada resource `Schedule` terpisah) |

### 1e. **Service Modules** (Modul Pelayanan — use-case dasar) → **blueprint bundle MVP**
Tiap modul = **1 Bundle transaction** berurut mengikuti alur klinis. Ini cetak biru urutan kirim per unit.
| Modul | Encounter | Urutan resource inti (ringkas) |
|---|---|---|
| **Rawat Jalan** (Resume Medis) | class `AMB`; arrived→in-progress→finished | Patient → Encounter → Condition → FamilyMemberHistory → AllergyIntolerance → MedicationStatement → Observation → ClinicalImpression → Goal → CarePlan → ServiceRequest → Specimen → DiagnosticReport → ImagingStudy → RiskAssessment → Procedure → Medication → MedicationRequest → MedicationDispense → QuestionnaireResponse → MedicationAdministration → NutritionOrder → **Composition** |
| **IGD** | class `EMER`; arrived→**triaged**→in-progress→finished | Patient → Encounter → **Observation(triase)** → Condition → FamilyMemberHistory → AllergyIntolerance → MedicationStatement → ClinicalImpression → Goal → CarePlan → ServiceRequest(lab) → Specimen → DiagnosticReport → **ServiceRequest(rad)** → ImagingStudy → RiskAssessment → Procedure → Medication → MedicationRequest → MedicationDispense → MedicationAdministration → **Composition** |
| **Rawat Inap** | class `IMP`; arrived→in-progress→finished | Patient → Encounter → Condition → FamilyMemberHistory → AllergyIntolerance → MedicationStatement → Observation(fisik) → **Observation(fungsional)** → ClinicalImpression → Goal → CarePlan → ServiceRequest → Specimen → DiagnosticReport → RiskAssessment → Procedure → **Medication+MedicationRequest (berpasangan)** → QuestionnaireResponse → MedicationDispense → MedicationAdministration → NutritionOrder → ServiceRequest(rujukan) → **Composition** |
| **Kefarmasian** | `serviceType`=64 (Pharmacy); 2-fase | **Fase Resep** (faskes): Encounter → Observation(BB/TB) → Medication → MedicationRequest → DocumentReference. **Fase Serah** (apotek): Encounter → Medication → MedicationDispense (+ChargeItemDefinition/substitusi) |

### 1f. **Implementation Modules** (Modul Penerapan — 29 kasus tematik)
ANC · INC · PNC · Gigi · Gizi · HIV · Imunisasi · Imunisasi COVID-19 · Kematian Maternal & Perinatal · MTBS · Neonatus · PKPR Remaja (luar gedung) · Rujukan Pasien · Klaim Asuransi Swasta/Non-BPJS · **Klaim BPJS Kesehatan** · Registri Jantung · Registri Telinga · Registri Kanker · Registri Mata · Registri Stroke · Registri Uronefrologi · Rujukan Spesimen · Skrining Hipotiroid Kongenital (SHK) · Skrining PTM · Tuberkulosis · Tumbuh Kembang · Rabies (GHPR) · Upaya Berhenti Merokok (UBM) · Sertifikat Medis Penyebab Kematian (SMPK).
→ **Semua DI LUAR MVP** (tematik). "Klaim BPJS/Asuransi" **DITUNDA** — overlap modul e-klaim & BPJS-WS.

### 1g. KFA — Kamus Farmasi & Alat Kesehatan (Master data)
| Endpoint | Fungsi | Sumber lokal |
|---|---|---|
| `GET /kfa/farmalkes-price-jkn` (v1) | Harga farmalkes per region JKN | (harga referensi) |
| `GET /kfa-v2/products` · `/kfa-v2/products/all` | Detail-by-identifier (`kfa\|nie\|lkpp`) · pencarian produk berpaginasi | ganti `src/lib/master/kfaMock.ts` |
| `POST /kfa-v3/alkes/products` · `/kfa-v3/alkes/template` | Pencarian VARIAN alkes/BMHP (`device\|pkrt`) | `master.Bmhp` (kolom `kfa` disiapkan) |

Browser publik: `satusehat.kemkes.go.id/kfa-browser`.

### 1h. Master Wilayah
| Endpoint | Fungsi |
|---|---|
| `GET /masterdata/v1/{provinces,cities,districts,sub-districts}` | Wilayah Kemendagri berjenjang (filter `*_codes`) |
→ Referensi silang untuk `master.Wilayah` (sudah di-seed dari Kemendagri) — untuk verifikasi administrativeCode SatuSehat.

### 1i. Consent & KYC (verifikasi pasien)
| Fitur | Detail |
|---|---|
| **Consent** (general consent) | WAJIB agar SatuSehat membuka data pasien ke faskes; mengembalikan FHIR `Consent`. **Path/method persis TIDAK ada di docs publik** → perlu Postman collection resmi (domain baru `fhir.Consent`, ≠ `medicalrecord.InformedConsent` klinis). |
| **KYC** | `POST /kyc/v1/generate-url` (token+URL validasi) · `POST /kyc/v1/challenge-code` (kode tantangan). Enkripsi **hybrid RSA+AES**, verifikasi via **SATUSEHAT Mobile**. Prioritas rendah (butuh app pasien). |

### 1j. Struktur Postman resmi (untuk mirror penamaan modul kita)
Workspace `satusehat/satusehat-public` = **banyak collection ber-prefix nomor** (bukan satu). Verbatim (parsial):
`00. FHIR Resource - Contoh Penggunaan` · `01. Pelayanan - Rawat Jalan` · `02. Pelayanan - Rawat Inap` · `03. Pelayanan - IGD` · `04. Pelayanan - Farmasi` · `06. Use Case - ANC` · `12. Use Case - MTBS` · `14. Use Case - Gizi` · `15. Use Case - Tumbuh Kembang` · `19. Use Case - Skrining PTM` · `24. Use Case - Gigi` · `26. Use Case - Modul Klaim (BPJS-K)` (+ collection `Archived: …`). Pola: `NN. Pelayanan - <unit>` & `NN. Use Case - <topik>`.

---

## 2. Arsitektur (mirror BPJS-WS connector spine)

```
FE adapter          src/lib/api/fhir/*        ← thin fetch ke BFF (BUKAN ke SatuSehat)
   │ fetch /api/v1/fhir/...
   ▼
ROUTE (BFF)         src/app/api/v1/fhir/*      ← RBAC gate · Zod · Result→HTTP. TIPIS.
   ▼
SERVICE             src/lib/services/fhir/*    ← OTAK: mock/real · resolve id-mapping · build Bundle ·
   │   ├──────────┐                              validasi lokal · audit · idempotency · OUTBOX/retry · SyncLog
   ▼              ▼
CONNECTOR        DAL (Prisma)                  ← connector = SatuSehat (token→fetch→OperationOutcome)
src/lib/fhir/server/*  src/lib/dal/fhir/*         DAL = DB kita (fhir.ResourceMap / SyncLog / Outbox)
   ▼
SatuSehat OAuth2 · FHIR /fhir-r4/v1 · KFA · Masterdata (sandbox/prod)
```

**Konsekuensi kunci** (sama BPJS R4): panggilan eksternal **KELUAR dari DB tx aksi klinis**. Aksi klinis commit
dulu (cepat), lalu **outbox worker** kirim Bundle ke SatuSehat, lalu `SyncLog` di-update
(`Pending → Sent → Acked/Failed`). Token WAJIB di-cache (rate-limit 1/menit). Swap mock→real = ganti isi
connector; Route & FE tak berubah.

**Schema Postgres baru `fhir`** (usulan):
- `ResourceMap` — `localType`(Patient/Encounter/…) · `localId` · `resourceType` · `ihsId` · `versionId` · `hash` · `lastSyncAt`. Resolve-first, anti kirim-ulang.
- `SyncLog` / `Outbox` — antrean: `trigger` · `payload`(JSONB) · `status` · `attempts` · `lastError`(OperationOutcome) · `bundleId`.
- `Consent` (opsional, FH2 lanjut) · `TokenCache` (opsional; default Redis/in-mem).

---

## 3. Fase kerja FH0–FH9

| Fase | Judul | Isi inti | DoD |
|---|---|---|---|
| **FH0** 🟡 **(kode ✅ 2026-10-26 · uji token sandbox menunggu kredensial)** | **Connector Spine** | Token service OAuth2 (secret server-only, cache+auto-refresh, **rate-limit 1/menit**) · HTTP client `/fhir-r4/v1` · `SATUSEHAT_MODE` · schema `fhir` (ResourceMap/SyncLog/Outbox) · audit · error→`OperationOutcome` · identifier-system const · **`docs/FHIR-RULES.md`** | token nyata ke **sandbox** OK; mock jalan tanpa kredensial |
| **FH1** 🟡 **(kode ✅ 2026-10-26 mode mock · sandbox menunggu kredensial)** | **Onboarding Org/Loc/Practitioner** | Resolve-first + create (Org/Loc PUT-able) + Practitioner **GET-only** → simpan `ResourceMap`. Adapter dari master | 3 resource ter-map IHS id; idempoten |
| **FH2** 🟡 **(resolve IHS ✅ 2026-10-26 mock · Consent & pasien tanpa NIK ditunda)** | **Patient IHS + Consent** | `Patient?identifier=<nik-system>\|<nik>` → set `Pasien.idSatusehat`. Tool NIK lookup. Consent (bila path tersedia); KYC opsional | pasien nyata dapat IHS id |
| **FH3** 🟡 **(kode ✅ 2026-10-26 mock · finished menunggu FH4 Condition)** | **Encounter lifecycle** | `Kunjungan`→Encounter (class AMB/EMER/IMP, status arrived/triaged/in-progress/finished, participant+location+serviceProvider). Hook transisi kunjungan | Encounter terkirim per unit |
| **FH4** 🟡 **(kode ✅ 2026-10-26 mock · data uji: alergi/tindakan belum berkode)** | **Clinical core** | Condition (ICD-10) + Procedure (ICD-9) + Observation (TTV/LOINC) + AllergyIntolerance (SNOMED) | 4 resource nempel ke Encounter |
| **FH5** 🟡 **(kode ✅ 2026-10-26 mock · 3/17 item uji belum ber-KFA)** | **Medication chain** | Medication (KFA) + MedicationRequest + MedicationDispense; (MAR/MedicationAdministration bila ada) | resep→dispense terkirim; KFA valid |
| **FH6** 🟡 **(kode ✅ 2026-10-26 mock · UI LOINC ✅ · data LOINC master 0% → belum terkirim, FG-52)** | **Diagnostics** | ServiceRequest + Specimen + DiagnosticReport (LOINC); Rad: ServiceRequest + ImagingStudy (DICOM) + DiagnosticReport | order+hasil lab/rad terkirim |
| **FH7** 🟡 **(kode ✅ 2026-10-26 mock · bundle default)** | **Bundle transaction + Composition** | Kirim **Bundle (transaction)** urut-referensi per **Service Module** (§1e) + retry/backoff + idempotency; Composition (resume medis) | 1 kunjungan = 1 bundle atomik |
| **FH8** | **KFA + validasi lokal** | KFA v2/v3 (ganti `kfaMock`) + Master Wilayah cross-check; **validator lokal** ICD-10/ICD-9/LOINC/SNOMED/KFA (SatuSehat TAK punya terminology server — validasi implisit saat POST) | kode divalidasi sebelum submit |
| **FH9** | **Frontend `/ehis-fhir` (mock-first)** | Dashboard sync health · Kredensial/config · **Resource Map browser** · **Sync Log/Outbox** (+retry) · **NIK lookup** · Onboarding wizard · Conflict resolution · Polish | 100% FE mock→DB, accent non-ungu |

**FH0 terbangun (2026-10-26):** schema `fhir` (ResourceMap · SyncLog+enum SyncStatus · FhirAuditLog; migrasi `20261026120000_fhir_init`, Consent ditunda FH2) + RBAC `fhir.sync` (r/c/u/d → Admin) · connector server-only [config](src/lib/fhir/server/config.ts) (`SATUSEHAT_MODE`, host per env) · [token](src/lib/fhir/server/token.ts) (cache+single-flight+cooldown 60 dtk) · [httpClient](src/lib/fhir/server/httpClient.ts) `callSatuSehat` (retry network/5xx/429, 401→re-auth 1×, OperationOutcome→Result) · [circuit](src/lib/fhir/server/circuit.ts) · [fhirShared](src/lib/fhir/fhirShared.ts) (identifier/code system R17, Result/FhirError, `toFhirDateTime` +07:00) · DAL `dal/fhir/{auditDal,resourceMapDal,syncLogDal}` · service `services/fhir/{audit,statusService}` · `GET /api/v1/fhir/status` + `POST /api/v1/fhir/status/probe` · client `api/fhir/status`. Gap implementasi → **[docs/FHIR-GAP.md](docs/FHIR-GAP.md)**.

**FH1 terbangun (2026-10-26):** `ResourceMap` +kolom **`env`** (migrasi `20261026130000`, IHS id per environment) · seam [transport.fhirRequest](src/lib/services/fhir/transport.ts) (mock/nyata + audit) + [mock](src/lib/fhir/server/mock.ts) · adapter [address](src/lib/fhir/adapters/address.ts) (administrativeCode flat dari kode paling spesifik) · [organization](src/lib/fhir/adapters/organization.ts) · [location](src/lib/fhir/adapters/location.ts) · [onboardingService](src/lib/services/fhir/onboardingService.ts) (root RS → `SATUSEHAT_ORG_ID` tanpa panggilan; sub-unit urut kedalaman; resolve-first → POST/PUT by hash; Practitioner GET-only by NIK, `Dokter.ihsPractitionerId` hanya env prod) · `GET /api/v1/fhir/onboarding` + `POST /api/v1/fhir/onboarding/:jenis` (`fhir.sync` read/create) · client `api/fhir/onboarding`.

**FH2 terbangun (2026-10-26):** [patientIhsService](src/lib/services/fhir/patientIhsService.ts) — resolve-only `GET Patient?identifier=nik|…` (tak pernah POST pasien ber-NIK) → `ResourceMap(env, Patient)` + `Pasien.idSatusehat` hanya prod; verifikasi gender/tgl lahir (peringatan); status `cached/resolved/not_found/no_nik/failed`. Endpoint: `GET /fhir/patient/:id` (registration.pasien:read) · `POST /fhir/patient/:id/resolve` (registration.pasien:update) · `POST /fhir/patient/resolve-batch` (≤100, fhir.sync:create) · `POST /fhir/patient-lookup` (NIK di body, fhir.sync:read). Client `api/fhir/patient`. Gap FG-19..FG-24.

**FH3 terbangun (2026-10-26):** hook [kunjunganService](src/lib/services/kunjunganService.ts) `transition` (receive/complete/reopen/cancel) + `cancelKunjungan` → [outboxEnqueue](src/lib/services/fhir/outboxEnqueue.ts) (deskripsi job di tx yang sama, coalesce, tak pernah gagalkan aksi klinis) · kolom `kunjungan.dilayani_at` (migrasi `20261026140000`) · adapter [encounter](src/lib/fhir/adapters/encounter.ts) (class AMB/EMER/IMP · statusHistory · ServiceClass+upgradeClass/titipan · dischargeDisposition dari Disposisi · diagnosis dari peta Condition) · [encounterSyncService](src/lib/services/fhir/encounterSyncService.ts) (resolve Patient otomatis; DPJP/ruangan wajib onboarding; POST/PUT by hash) · [outboxWorker](src/lib/services/fhir/outboxWorker.ts) (klaim atomik · backoff · maks 8 · pulihkan Sending macet) · runner opsional [instrumentation](src/instrumentation.ts) (`SATUSEHAT_OUTBOX_INTERVAL_MS`, default mati) · konsol `GET /fhir/outbox` · `POST /fhir/outbox/run` · `POST /fhir/outbox/:id/retry` · `POST /fhir/encounter/:kunjunganId/sync` · client `api/fhir/outbox`. Gap FG-25..FG-34.

**FH4 terbangun (2026-10-26):** adapter [clinical](src/lib/fhir/adapters/clinical.ts) (Condition ICD-10 + verificationStatus dari status Pasti/Dicurigai/Diferensial · Procedure ICD-9-CM + reasonCode diagnosa utama · Observation TTV 10 parameter LOINC/UCUM · AllergyIntolerance SNOMED) · [clinicalSourceDal](src/lib/dal/fhir/clinicalSourceDal.ts) (termasuk soft-deleted) · [clinicalSyncService](src/lib/services/fhir/clinicalSyncService.ts) · primitif [resourceUpsert](src/lib/services/fhir/resourceUpsert.ts) · [encounterSyncService](src/lib/services/fhir/encounterSyncService.ts) jadi 3 fase (Encounter ada → klinis → Encounter final + diagnosis; finish ditahan bila Condition gagal) · `ihs_refs` = `{refs, notes}`. Gap FG-35..FG-43.

**FH5 terbangun (2026-10-26):** adapter [medication](src/lib/fhir/adapters/medication.ts) (Medication per master Obat ber-KFA POA→POV + ingredient zat aktif + MedicationType NC · MedicationRequest per ResepItem: status/category/priority/rute ATC/reasonCode · MedicationDispense per dispensing×item: performer apoteker, location depo, authorizingPrescription) · [medicationSourceDal](src/lib/dal/fhir/medicationSourceDal.ts) · [medicationSyncService](src/lib/services/fhir/medicationSyncService.ts) dipanggil di fase 2 encounterSyncService · hook enqueue di [resepService.dispensing](src/lib/services/resep/resepService.ts) (event `dispense`). Gap FG-44..FG-50.

**FH6 terbangun (2026-10-26):** kolom LOINC baru `master.lab_test/lab_parameter/rad_catalog` (migrasi `20261026150000`) · adapter [diagnostic](src/lib/fhir/adapters/diagnostic.ts) (ServiceRequest lab/rad · Observation lab per parameter + interpretation flag + referenceRange · Observation rad temuan · DiagnosticReport LAB/RAD) · [diagnosticSourceDal](src/lib/dal/fhir/diagnosticSourceDal.ts) · [diagnosticSyncService](src/lib/services/fhir/diagnosticSyncService.ts) (hanya hasil tervalidasi; peta Observation lab stabil `<order>:<rowKey>`) di fase 2 · hook enqueue `diagnostic` di [labResultService.validate](src/lib/services/lab/labResultService.ts) + [radResultService](src/lib/services/rad/radResultService.ts) saveHasil(finalize)/validate. Specimen & ImagingStudy ditunda. Gap FG-51..FG-57.

**FH7 terbangun (2026-10-26):** [resourceSink](src/lib/services/fhir/resourceSink.ts) (`single` | `bundle` via `SATUSEHAT_SYNC_MODE`, default bundle: id sementara `urn:uuid:`, rewrite referensi, mapping balik `location`, hash bentuk ber-id asli) · mock Bundle transaction-response · service FH4–FH6 memakai sink (bukan upsert langsung) · adapter [composition](src/lib/fhir/adapters/composition.ts) (resume medis 18842-5, final/preliminary dari TTE, section XHTML) · [encounterSyncService](src/lib/services/fhir/encounterSyncService.ts) ditulis ulang di atas sink. Gap FG-60..FG-65 (FG-40 tertutup).

**Urutan**: FH0 → FH1 → FH2 → FH3 → (FH4–FH6 paralel per domain) → FH7 → FH8 → FH9. Estimasi ±4–6 minggu.

---

## 4. Prasyarat / Gap (putuskan sebelum FH1)

- **G-1 Kredensial**: `client_id`/`client_secret` + `Organization ID` RS dari Developer Hub (`ihs@dto.kemkes.go.id`). Tanpa ini → hanya `mock`.
- **G-2 Token rate-limit**: 1 req/menit per client_id setelah gagal → cache token WAJIB (jangan minta token per-request).
- **G-3 Consent path tak publik**: bentuk/method Consent belum ada di docs publik → butuh **Postman collection resmi** untuk memastikan (FH2 lanjut). Consent ≠ InformedConsent klinis (domain terpisah).
- **G-4 Tanpa terminology server**: harus bangun **validator lokal** (ICD/LOINC/SNOMED/KFA) + andalkan validasi server SatuSehat saat POST. SNOMED butuh lisensi affiliate (browser IHTSDO / release file).
- **G-5 KFA mapping penuh**: `master.Obat.kfa` sebagian; alkes/BMHP KFA belum. KFA v2/v3 (FH8) untuk melengkapi sebelum MedicationRequest valid.
- **G-6 Practitioner IHS**: butuh NIK nakes lengkap di `master.Pegawai` untuk resolve IHS (Practitioner GET-only).
- **G-7 Outbox worker**: runner (cron/queue) kirim asinkron + retry (selaras backend stack: long-running Node + Redis).
- **G-8 Data quality**: NIK 16 digit valid · datetime ISO-8601 +07:00 · ICD-10 **WHO** (bukan CM) — validasi pra-kirim.
- **G-9 Klaim/Coverage DITUNDA**: modul tematik "Klaim BPJS/Asuransi" overlap e-klaim & BPJS-WS → jangan duplikasi.

---

## 5. Keputusan yang perlu dikonfirmasi user

1. **Mulai dari mana**: FH0 Connector Spine (mode `mock`, tanpa kredensial) **atau** FH9 FE mock-first (visual dulu)? → **Saran: FH0 mode `mock`** (spine+schema jadi; flip ke `sandbox` saat kredensial turun).
2. **Target awal**: `mock` (tanpa kredensial) vs `sandbox` (perlu kredensial DevHub)?
3. **Cakupan MVP RME** (per Service Module §1e): Patient + Encounter + Condition + Procedure + Observation + Medication chain dulu; Diagnostics (FH6) & Composition (FH7) menyusul — setuju?
4. **Consent/KYC**: implement sekarang atau tunda sampai path Consent dikonfirmasi + alur app pasien siap?

---

## 6. Aset yang MEMPERCEPAT (sudah ada di repo)

`pendaftaran.Pasien.idSatusehat` (IHS Patient) · `master.Obat` KFA JSONB + preview FHIR `Medication` · `master.Wilayah` administrativeCode Kemendagri · `src/lib/master/kfaMock.ts` + `src/lib/api/kfa/kfa.ts` (seam KFA) · `master.Location` tree (Organization/Location) · `master.Pegawai`+`Dokter` (Practitioner) · `master.PenugasanRuangan` (PractitionerRole) · `medicalrecord.*` 60+ domain (≈1:1 FHIR: Kunjungan→Encounter · Diagnosa→Condition · TindakanMedis→Procedure · Observation→Observation · AsesmenAlergi→AllergyIntolerance · Resep→Medication/Request/Dispense · Lab/Rad→ServiceRequest/DiagnosticReport/Specimen/ImagingStudy · ResumeMedik→Composition) · **Pola connector BPJS-WS** (audit/outbox/mode/rate-limit) = cetak biru langsung.
