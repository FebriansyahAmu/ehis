# FHIR / SatuSehat — GAP Register (yang perlu diperbaiki / diverifikasi)

> Catatan berjalan selama pengerjaan [TODO-FHIR.md](../TODO-FHIR.md). Setiap gap = **apa · kenapa · cara tutup**.
> Gap prasyarat desain (G-1..G-9) tetap di [TODO-FHIR.md §4](../TODO-FHIR.md); file ini untuk temuan **implementasi**.
> Tutup gap → ubah status ke ✅ + tanggal (jangan hapus baris, jejak audit).

| Status | Arti |
|---|---|
| 🔴 | Blocker untuk DoD fase terkait |
| 🟡 | Perlu diperbaiki sebelum produksi |
| ⚪ | Verifikasi tertunda / nice-to-have |

---

## FH0 — Connector Spine (2026-10-26)

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-01 | 🟡 **(sebagian ✅ 2026-10-26 — diagnostik TS server editor (VS Code) bersih 0 error untuk ±60 file FHIR/master/lab yang tersentuh, termasuk kunjunganService/resepService/lab-rad result service & semua komponen /ehis-fhir; tinggal `tsc` penuh + eslint sekali jalan)** | **(naik prioritas FH3 — menyentuh `kunjunganService.transition`/`cancelKunjungan` + `kunjunganDal` + `encounter.prisma`, jalur klinis inti)** **`tsc --noEmit` + eslint belum dijalankan** untuk file FH0 — sengaja ditunda karena RAM/disk laptop dev terbatas (RAM bebas ~700 MB, C: ~3 GB). Kode di-review manual; Prisma client sudah di-generate & tabel terverifikasi di DB. | Jalankan saat resource longgar: `npx tsc --noEmit` lalu `npx eslint src/lib/fhir src/lib/dal/fhir src/lib/services/fhir src/lib/api/fhir src/lib/schemas/fhir src/app/api/v1/fhir`. |
| FG-02 | 🔴 | **Token nyata ke sandbox belum diuji** (DoD FH0) — kredensial DevHub belum ada (G-1). Mode default `mock`. | Isi `SATUSEHAT_CLIENT_ID/SECRET/ORG_ID` di `.env`, set `SATUSEHAT_MODE=sandbox`, panggil `POST /api/v1/fhir/status/probe` **sekali** (gagal → cooldown 60 dtk, rate-limit SatuSehat). |
| FG-03 | 🟡 | **Outbox worker belum ada** — DAL siap (`syncLogDal.listDue/claim/markAcked/markFailed`), tapi belum ada runner yang mengeksekusi (G-7). | Bangun di FH3 bersama payload Encounter pertama: runner interval (long-running Node) → `listDue` → `claim` → `callSatuSehat` → `markAcked`/`markFailed(retryAt)`; backoff eksponensial, maks percobaan → `Failed`. |
| FG-04 | 🟡 | **Token cache & circuit breaker in-memory per proses** (`globalThis`). Multi-instance → tiap proses minta token sendiri (risiko kena rate-limit 1/menit). | Pindah ke Redis (seam: isi `token.ts` state + `circuit.ts` map) saat deploy multi-instance. |
| FG-05 | ⚪ | **PATCH Content-Type diasumsikan `application/json-patch+json`** (JSON Patch array). Belum dicocokkan dengan contoh resmi. | Cek koleksi Postman resmi (`docs/fhir-postman/`) / docs kemkes saat pertama memakai PATCH (FH2 Patient). |
| FG-06 | ⚪ | **Target `kfa` default `/kfa-v2`**; `/kfa-v3` & `/kfa` lama belum bisa dipilih per panggilan. | Tambah target/opsi versi saat FH8 (KFA sync). |
| FG-07 | ⚪ | **Audit `retryCount` = 0 pada jalur gagal** — `FhirError` tak membawa jumlah percobaan (jalur sukses sudah benar). | Tambah `attempts?` ke `FhirError` bila analisis retry dibutuhkan. |
| FG-08 | 🟡 | **Retensi audit 5 tahun belum ada kebijakan** (partisi/arsip `fhir.fhir_audit_log`) — sama dengan `bpjs.bpjs_audit_log`. | Kebijakan retensi/partisi bulanan bersama audit BPJS (cross-cutting, TECH_DEBT). |
| FG-09 | ⚪ | **`fhir.Consent` belum dibuat** (sengaja) — path Consent SatuSehat belum terkonfirmasi (G-3). | Tambah tabel di FH2 setelah path Consent dipastikan dari koleksi Postman resmi. |
| FG-10 | ✅ **(FH9 2026-10-26 — konsol /ehis-fhir)** | **Belum ada konsol UI** untuk endpoint status/probe (`/ehis-fhir`). | FH9 — FE konsumsi `getFhirStatus()` / `probeFhirToken()` di [src/lib/api/fhir/status.ts](../src/lib/api/fhir/status.ts). |

## FH1 — Onboarding Organization / Location / Practitioner (2026-10-26)

**Keputusan desain:** `fhir.resource_map` kini ber-kolom **`env`** (unik `env+localType+localId`, migrasi `20261026130000`) — IHS id sandbox ≠ prod, id mock palsu; ganti `SATUSEHAT_MODE` otomatis "mulai bersih" per env. Kolom denormalisasi `Dokter.ihsPractitionerId` (dan nanti `Pasien.idSatusehat`) **hanya diisi id PRODUKSI**; untuk env lain baca `ResourceMap`.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-11 | 🔴 | **Onboarding belum dijalankan ke sandbox** (kredensial, sama FG-02). Di mock: Organization/Location selalu "created" (pencarian mock kosong), Practitioner selalu ketemu (id `mock-prac-…`). | Setelah FG-02 hijau: jalankan `POST /api/v1/fhir/onboarding/organization` → `/location` → `/practitioner` (urutan wajib). NIK uji sandbox di [docs/FHIR-PAYLOADS.md](FHIR-PAYLOADS.md). |
| FG-12 | ⚪ | **`OrgType.dept_clin` tak ada di CodeSystem HL7 organization-type** → dikirim sebagai `dept`. | Konfirmasi ke docs SatuSehat apakah ada kode departemen klinis khusus; bila ada, ganti di [adapters/organization.ts](../src/lib/fhir/adapters/organization.ts). |
| FG-13 | 🟡 | **Bed belum dikirim sebagai Location** (`physicalType=bd`, `partOf` ruangan). Encounter RI mungkin butuh referensi bed. | Tambah saat FH3 (Encounter IMP) bila bundle RI resmi mereferensikan bed. |
| FG-14 | ⚪ | **Contoh Postman resmi Location menukar latitude/longitude** (lat −6.23 ditaruh di `longitude`). Adapter mengikuti spesifikasi FHIR (longitude=bujur). Master Location tak punya GPS → pakai GPS Organization induk. | Verifikasi di sandbox; tambah GPS per ruangan bila diwajibkan. |
| FG-15 | 🟡 | **Resolve Organization via `?partof=` lalu cocokkan identifier** — bila hasil ter-paginasi (banyak sub-unit), sub-unit yang sudah ada bisa terlewat → POST ganda. | Uji di sandbox: cek dukungan `Organization?identifier=` atau ikuti `link[next]`; perbaiki di `syncOrganizations`. |
| FG-16 | 🟡 | **Guard run paralel in-memory per proses** (`running` Set). Multi-instance → bisa 2 run bersamaan. | Advisory lock Postgres (`pg_try_advisory_lock`) atau Redis lock saat multi-instance. |
| FG-17 | ⚪ | **Master Location tak punya telepon** → `telecom` Location tak dikirim (opsional di SatuSehat). | Tambah kolom bila dibutuhkan. |
| FG-18a | ⚪ | (catatan) Guard "run paralel" FG-16 berlaku juga untuk batch resolve pasien FH2. | idem FG-16. |
| FG-18 | 🟡 | **Nakes tanpa IHS** (NIK tak terdaftar SISDMK/KKI) → `failed`, belum ada alur tindak lanjut di UI. | FH9: daftar "Practitioner belum terpetakan" + tombol resolve ulang (`force`). |

## FH2 — Patient IHS (2026-10-26)

**Keputusan desain:** pasien ber-NIK **hanya di-resolve** (`GET Patient?identifier=nik|…`), tidak pernah di-POST — SatuSehat = owner master pasien (Dukcapil). Peta → `ResourceMap(env, Patient)`; `Pasien.idSatusehat` hanya env prod. Verifikasi gender + tanggal lahir lokal vs SatuSehat = peringatan, bukan blokir (NIK = anchor). Resolve = **lazy** (tombol per pasien / batch ≤100) — bukan di dalam tx registrasi (R4).

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-19 | 🔴 | **Resolve Patient belum diuji ke sandbox** (kredensial, FG-02). Mock selalu "ketemu" tanpa gender/tgl lahir → verifikasi = `null`. | Setelah FG-02: `POST /api/v1/fhir/patient-lookup` dengan NIK uji sandbox, lalu `/fhir/patient/:id/resolve`. Cek field apa saja yang dikembalikan SatuSehat (nama/gender/birthDate bisa ter-mask). |
| FG-20 | 🟡 | **Pasien tanpa NIK belum didukung** — bayi baru lahir (POST Patient ber-`nik-ibu`), WNA (paspor), Mr.X → status `no_nik`. Encounter FH3 untuk pasien ini akan tertahan. | Tentukan alur: bayi → POST Patient by NIK ibu (payload resmi Postman "Patient - by NIK Ibu"); WNA → cek identifier paspor SatuSehat; Mr.X → tunda kirim sampai identitas dilengkapi. |
| FG-21 | 🟡 | **Belum di-hook ke registrasi & belum ada badge IHS di UI** — resolve hanya via endpoint. | Registrasi: setelah pasien tersimpan, panggil `resolvePatientIhs` dari FE (di luar tx) + badge di PatientDashboard; FH3 encounter builder juga resolve dulu bila belum ada peta. |
| FG-22 | ⚪ | **Verifikasi tidak membandingkan nama** (format nama Dukcapil vs lokal sering beda gelar/kapital → false positive). | Pertimbangkan pembandingan ternormalisasi (tanpa gelar, uppercase) setelah tahu bentuk respons sandbox. |
| FG-23 | 🟡 | **Merge pasien belum memindahkan peta** — `ResourceMap` milik rekam yang digabung tak dialihkan ke survivor. | Hook di service merge pasien: pindahkan/hapus peta Patient (env semua) ke survivor bila survivor belum punya. |
| FG-24 | ⚪ | **Consent (bagian FH2) masih ditunda** — lihat FG-09. | — |

## FH3 — Encounter + Outbox Worker (2026-10-26)

**Keputusan desain:**
- Transisi kunjungan `receive/complete/reopen/cancel` (+ Batalkan Kunjungan) → **enqueue di tx yang sama** (`fhir.sync_log`, trigger `encounter.sync`). Isi baris = **deskripsi job** (`{kind, kunjunganId, event}`), BUKAN payload FHIR — payload dibangun worker dari state TERKINI saat kirim (IHS pasien/nakes/lokasi bisa baru ter-resolve). Coalesce: 1 job Pending per kunjungan.
- Efek samping FHIR **tak pernah menggagalkan aksi klinis** (config invalid → enqueue dilewati).
- Kolom baru `encounter.kunjungan.dilayani_at` (migrasi `20261026140000`, set sekali saat receive) = awal `in-progress`.
- Worker: retry network/5xx/429 dengan backoff 30 dtk → maks 1 jam, maks 8 percobaan; referensi kurang (DPJP/ruangan belum onboarding) = **Failed non-retry** → antre ulang manual (`POST /fhir/outbox/:id/retry`) setelah onboarding.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-25 | 🔴 | **Encounter belum diuji ke sandbox** (kredensial, FG-02). | Setelah FG-02 + onboarding FH1: terima 1 kunjungan uji → `POST /fhir/outbox/run` → cek `fhir.sync_log` Acked + `GET Encounter/{id}` di sandbox. |
| FG-26 | 🟡 | **Runner outbox default MATI** (`SATUSEHAT_OUTBOX_INTERVAL_MS` kosong) — job menumpuk Pending sampai dijalankan manual. Guard tick hanya per-proses. | Prod: set interval (mis. 30000). Multi-instance: klaim `FOR UPDATE SKIP LOCKED` / advisory lock. |
| FG-27 | 🔴 | **Encounter `finished` kemungkinan wajib `diagnosis` (Condition)** — FH4 belum ada, jadi `diagnosis` kosong → bisa ditolak SatuSehat. | FH4: kirim Condition dulu (job berantai) sebelum Encounter finished; verifikasi aturan di sandbox. |
| FG-28 | ⚪ | **ServiceClass RI**: kelas ICU/HCU/Isolasi tak punya kode → extension dihilangkan; kode `vip`/`naik-kelas`/`turun-kelas`/`titip-rawat` belum diverifikasi ke CodeSystem resmi. | Cocokkan dengan terminologi `locationServiceClass-Inpatient` & `locationUpgradeClass` SatuSehat. |
| FG-29 | 🟡 | **Batal Selesai (reopen)** mengirim status mundur `finished → in-progress` — kemungkinan ditolak SatuSehat. | Kebijakan: jangan PUT mundur; tahan job sampai kunjungan diselesaikan ulang (skip event reopen) — putuskan setelah uji sandbox. |
| FG-30 | 🟡 | **Riwayat lokasi tidak dilacak** — Encounter hanya memuat ruangan terakhir (contoh resmi IGD: triase → ruang tindakan dengan period masing-masing). | Bangun dari `encounter.BedAllocation` (riwayat okupansi) saat FH7 bundle. |
| FG-31 | ⚪ | **Status `arrived` tidak dikirim saat pendaftaran** — Encounter baru dibuat saat diterima (langsung in-progress dengan history arrived). | Cukup untuk MVP; tambahkan hook registrasi bila SatuSehat mewajibkan real-time arrived. |
| FG-32 | ⚪ | **Crash di antara POST sukses & simpan ResourceMap** → retry membuat Encounter ganda (belum ada resolve by identifier untuk Encounter). | Cek dukungan `Encounter?identifier=<system>|<noKunjungan>` di sandbox → tambahkan resolve-first sebelum POST. |
| FG-33 | ⚪ | **Kunjungan lama** (`dilayani_at` NULL) → arrived & in-progress berimpit di `waktu_kunjungan`. | Terima apa adanya (data historis). |
| FG-34 | ⚪ | **IGD → Rawat Inap = 2 Encounter terpisah** (EMER & IMP) tanpa tautan (`basedOn` ServiceRequest pra-ranap seperti contoh resmi RI). | FH6/FH7 (ServiceRequest SPRI). |

## FH4 — Clinical Core: Condition · Procedure · Observation · AllergyIntolerance (2026-10-26)

**Keputusan desain:** dikirim di DALAM job `encounter.sync` (bukan job terpisah) dengan urutan wajib **Encounter ada → resource klinis → Encounter final** (resource klinis mereferensikan Encounter; Encounter `finished` butuh Condition). Primitif tunggal [resourceUpsert](../src/lib/services/fhir/resourceUpsert.ts) (noop bila hash sama · PUT · POST). Data soft-deleted yang sudah terkirim → `entered-in-error`. TindakanMedis yang kodenya sama dengan DiagnosaProsedur tidak dikirim ganda. Condition gagal → Encounter TIDAK di-finish.

**Profil data uji (2026-10-26):** Diagnosa 11/11 format ICD-10 valid · Alergi **4/4 tanpa SNOMED** · TindakanMedis **4/4 tanpa kode ICD-9**.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-35 | 🔴 | **Resource klinis belum diuji ke sandbox** (kredensial, FG-02). Validasi terminologi SatuSehat (kode ICD/LOINC/SNOMED salah → OperationOutcome) baru terlihat di sana. | Setelah FG-02/FG-25: selesaikan 1 kunjungan uji lengkap (diagnosa + TTV) → `POST /fhir/outbox/run` → cek `ihs_refs` job. |
| FG-36 | 🟡 | **AllergyIntolerance tanpa SNOMED dilewati** — data uji 4/4 tanpa `snomedCode` → praktis tak ada alergi terkirim. | Pastikan AllergyPane mengisi `snomedCode` (quick-pick katalog asesmen ber-SNOMED); validasi lokal R12 (G-4). |
| FG-37 | 🟡 | **TindakanMedis tanpa kode ICD-9-CM tak jadi Procedure** — data uji 4/4 tanpa kode; hanya DiagnosaProsedur (koding ICD-9) yang pasti terkirim. | Lengkapi kode ICD-9 di master Katalog Tindakan (kolom sudah ada, opsional) untuk tindakan yang wajib dilaporkan. |
| FG-38 | ⚪ | **Procedure tanpa `category` & `bodySite`** (SNOMED) — contoh resmi memakai keduanya. | Tambah mapping kategori tindakan → SNOMED (diagnostic/therapeutic) bila diwajibkan validasi sandbox. |
| FG-39 | ⚪ | **Display ICD-10 = nama diagnosis lokal** (bisa Bahasa Indonesia), bukan display resmi WHO (Inggris). | Ambil display dari master ICD bila tersedia; cek apakah SatuSehat memvalidasi display. |
| FG-40 | ✅ **(FH7 2026-10-26: mode bundle default — 1 POST per kunjungan)** | **Volume TTV**: 1 baris TTV = hingga 10 Observation (1 POST masing-masing). Rawat inap multi-shift → ratusan panggilan per kunjungan. | FH7: kirim sebagai Bundle transaction. |
| FG-41 | ⚪ | **Kode LOINC tanda vital belum diverifikasi** ke use case SatuSehat (SpO₂ `59408-5` vs `2708-6`, GCS total `9269-2`, nyeri `72514-3`). | Cocokkan dengan bundle resmi IGD/RI di `docs/fhir-postman/bundles/`. |
| FG-42 | ⚪ | **Belum dipetakan:** manifestasi reaksi alergi (SNOMED), onset Condition, kategori Komplikasi/Komorbid (problem-list), Encounter.diagnosis hanya Utama+Sekunder Pasti. | Sesuai kebutuhan klaim/use case berikutnya. |
| FG-43 | 🟡 | **Data klinis hanya terkirim saat transisi kunjungan** (receive/complete/reopen) — isian di antara keduanya baru terkirim saat selesai; dokumen yang diubah SETELAH selesai (allowWhenLocked) tidak tersinkron ulang. | Enqueue juga dari aksi simpan klinis (coalesce sudah ada), atau tombol "Sinkron ulang" (`POST /fhir/encounter/:id/sync`). |

## FH5 — Rantai Obat: Medication · MedicationRequest · MedicationDispense (2026-10-26)

**Keputusan desain:** dikirim di fase 2 job `encounter.sync` (setelah resource klinis). **Medication = 1 per master Obat** (identifier `medication/{orgId}` = id Obat, kode KFA POA → fallback POV), dipakai ulang lintas resep — bukan 1 per resep seperti contoh bundle resmi (hemat panggilan; hash berubah bila master/KFA berubah → PUT). MedicationRequest per `ResepItem`, MedicationDispense per `ResepDispensing × item` (`authorizingPrescription` → MedicationRequest). Hook baru: **dispensing Farmasi** (`resepService.dispensing`) ikut enqueue job kunjungan (event `dispense`, di tx yang sama).

**Profil data uji:** 17 item resep → 17 terhubung master Obat · **14 ber-KFA** (3 akan dilewati) · rute `Oral` 13 / kosong 4 · 6 dispensing.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-44 | 🔴 | **Rantai obat belum diuji ke sandbox** (kredensial, FG-02). Validasi KFA SatuSehat (kode POA salah/kedaluwarsa) baru terlihat di sana. | Setelah FG-02: dispensing 1 resep uji → `POST /fhir/outbox/run` → cek Medication/MedicationRequest/MedicationDispense di `ihs_refs`. |
| FG-45 | 🟡 | **Obat tanpa KFA tak terkirim** — 3/17 item uji; KFA seed sebagian dari `kfaMock` (kode POA 9 digit belum tentu valid di KFA nyata). | FH8: sinkron KFA v2/v3 nyata → lengkapi `master.Obat.kfa`; validasi lokal sebelum kirim. |
| FG-46 | 🟡 | **Racikan (compound) belum didukung** — semua Medication dikirim `NC` (Non-compound). | Bila ada resep racikan: Medication `SD`/compound dengan ingredient per bahan. |
| FG-47 | ⚪ | **Strength `denominator` tanpa satuan bentuk** (contoh resmi: `code: TAB` v3-orderableDrugForm); `quantity` MedicationRequest/Dispense tanpa unit/code. | Map `bentuk`/`dosisPerSatuan` lokal → v3-orderableDrugForm (TAB/CAP/VIAL…). |
| FG-48 | ⚪ | **Rute → kode ATC route** dipetakan manual (Oral/PO→O, IV/IM/SC→P, …); rute kosong (4/17) → tanpa `route`. | Pakai `kfa.ruteKode` bila tersedia; verifikasi sistem kode rute yang diterima SatuSehat. |
| FG-49 | ⚪ | **`timing`/`doseAndRate` terstruktur tidak dikirim** — hanya `dosageInstruction.text` (signa bebas). | Parse signa (mis. "3x1") → `timing.repeat` + `doseQuantity` bila diwajibkan. |
| FG-50 | ⚪ | **Satu dispensing = semua item order** (model lokal tak mencatat qty diserahkan per item / substitusi telaah). | Bila dispensing parsial/substitusi dicatat per item, gunakan qty & obat pengganti di MedicationDispense. |

## FH6 — Diagnostik: ServiceRequest · Observation hasil · DiagnosticReport (2026-10-26)

**Keputusan desain:** dikirim di fase 2 job `encounter.sync`; hook baru di **validasi Lab** (`labResultService.validate`) + **terbit/validasi Rad** (`radResultService.saveHasil(finalize)`/`validate`) — event `diagnostic`, di tx yang sama. Lab: ServiceRequest per item tes → **hanya hasil TERVALIDASI**: Observation per parameter (peta `<labOrderId>:<rowKey>` stabil lintas revisi → PUT) → DiagnosticReport per tes. Rad: ServiceRequest per item → Observation temuan → DiagnosticReport per order (conclusion = kesan + saran). **Kolom baru LOINC** (`loinc_code`/`loinc_display`) di `master.lab_test`, `master.lab_parameter`, `master.rad_catalog` (migrasi `20261026150000`, nullable).

**Profil data:** LOINC terisi **0/38 tes · 0/88 parameter · 0/24 pemeriksaan rad** → saat ini Lab/Rad **TIDAK terkirim sama sekali** (dicatat sebagai `notes` job). Data uji: 2 order lab (tervalidasi), 1 order rad (tervalidasi), 3/3 item lab ber-katalog.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-51 | 🔴 | **Diagnostik belum diuji ke sandbox** (kredensial, FG-02). | Setelah FG-52: validasi 1 order lab & 1 rad uji → `POST /fhir/outbox/run`. |
| FG-52 | 🟡 **(UI ✅ 2026-10-26 — tinggal pengisian data)** | **LOINC master Lab/Rad kosong** + ~~belum ada UI~~ (field LOINC kini ada — lihat "FG-52 lanjutan" di bawah). Sengaja TIDAK di-seed otomatis — LOINC salah lebih berbahaya daripada kosong (bisa diterima dengan makna klinis keliru). | (1) Tambah field LOINC (+display) di form Katalog Lab (tes & parameter) dan Katalog Radiologi + Zod/DAL/DTO. (2) Pemetaan awal oleh petugas lab/rad dengan acuan daftar LOINC SatuSehat (Kamus Pemeriksaan Lab), dicek ulang sebelum dipakai prod. |
| FG-53 | 🟡 | **Specimen tidak dikirim** — sampel diambil di luar aplikasi (step Pengambilan Sampel dihapus 2026-06-21); `LabTest.spesimen` teks bebas tanpa SNOMED; tak ada waktu ambil/terima. | Bila SatuSehat mewajibkan Specimen untuk use case lab: catat waktu ambil/terima + jenis spesimen ber-SNOMED, lalu Specimen terhubung ke ServiceRequest & DiagnosticReport. |
| FG-54 | 🟡 | **ImagingStudy tidak dikirim** — butuh DICOM Study/Series/Instance UID dari PACS/DICOM router; belum ada integrasi PACS. | Integrasi DICOM router SatuSehat (umumnya PACS mengirim ImagingStudy, SIMRS cukup ACSN di ServiceRequest) — tambahkan identifier ACSN di ServiceRequest rad saat PACS tersedia. |
| FG-55 | ⚪ | **Satuan hasil lab belum divalidasi UCUM** — `satuan` lokal dikirim apa adanya sebagai `valueQuantity.code` (mis. "sel/uL" bukan UCUM). | Peta satuan lokal → UCUM di master parameter (bersamaan FG-52). |
| FG-56 | ⚪ | **DiagnosticReport rad multi-pemeriksaan** memakai LOINC pemeriksaan pertama sebagai `code`. | Pertimbangkan 1 DiagnosticReport per item bila ekspertise per pemeriksaan dipisah. |
| FG-57 | ⚪ | **Hanya hasil tervalidasi yang dikirim** (status `final`) — hasil preliminary/belum validasi tidak. Item lab non-katalog (`labTestId` null) dilewati. | Sesuai kebutuhan klinis; preliminary bisa ditambah dengan status `preliminary`. |

### FG-52 lanjutan — UI LOINC Katalog Lab/Rad (2026-10-26)

**Dibangun:** validator lokal [terminology.ts](../src/lib/fhir/terminology.ts) (`isValidLoinc` = format `N{1,7}-N` + check digit Mod-10 resmi Regenstrief; diuji: 718-7, 2345-7, 8867-4, 8480-6, 2160-0, 6690-2, 777-3 valid · 718-8 ditolak) · Zod `LoincCodeInput` (""/null = kosongkan) di [labTest](../src/lib/schemas/master/labTest.ts) (tes + parameter) & [radCatalog](../src/lib/schemas/master/radCatalog.ts) · DAL/Service/DTO · komponen bersama [LoincField](../src/components/master/shared/LoincField.tsx) (badge live valid/format/check digit/kosong + tautan cek loinc.org) di tab Identitas Lab, editor Parameter Lab, tab Identitas Radiologi · simpan diblokir bila LOINC terisi tapi tidak valid.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-58 | ✅ **(2026-10-26)** — FE [buildHasilFromCatalog](../src/components/lab/labShared.ts)/`dtoValueToHasil` membawa `labTestId`/`labParameterId` + [HasilPane](../src/components/lab/tabs/HasilPane.tsx) mengirimnya · server [labResultService.saveHasil](../src/lib/services/lab/labResultService.ts) menurunkan dari `rowKey` bila klien tak mengirim · backfill migrasi `20261026160000` (33/33 baris terisi). Fallback `withIds` di sinkron FH6 dipertahankan sebagai pengaman. | **BUG data Entry Hasil Lab: `lab_result_value.lab_test_id` & `lab_parameter_id` selalu NULL** (33/33 baris uji) — id hanya ada di `row_key` (`<testId>:<paramId>`). Sinkron FH6 kini menurunkan id dari `row_key` (33/33 terhubung), tapi kolom relasional tetap kosong. | Perbaiki jalur simpan hasil Lab (`labResultService.saveHasil`/DAL) agar mengisi kedua kolom; backfill baris lama dari `row_key`. |
| FG-59 | ⚪ | **Update Katalog Lab = replace-all parameter (id parameter baru tiap simpan)** → id parameter di hasil lama jadi basi. Sinkron FH6 punya fallback cocokkan by (tes + nama parameter). | Pertimbangkan update parameter by id (upsert) di labTestDal agar id stabil. |

## FH7 — Bundle transaction + Composition (2026-10-26)

**Keputusan desain:** abstraksi [ResourceSink](../src/lib/services/fhir/resourceSink.ts) — `SATUSEHAT_SYNC_MODE=bundle` (DEFAULT) mengumpulkan semua resource 1 kunjungan → **1 POST Bundle `transaction`** (atomik, R16); `single` = POST/PUT per resource (perilaku FH3–FH6). Resource baru dapat id sementara `urn:uuid:`; referensi adapter `Type/urn:uuid:X` ditulis ulang → `urn:uuid:X`; respons `location` dipetakan balik ke ResourceMap dengan hash bentuk ber-id ASLI (run berikutnya noop). Encounter = entry pertama; Encounter final menimpa entry yang sama (bukan entry ganda). **Composition** resume medis: 1 per kunjungan (localId = kunjunganId), dari revisi `ResumeMedik` terbaru — `final` bila sudah TTE, `preliminary` bila belum; penulis = practitioner penulis resume → fallback DPJP.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-60 | 🔴 | **Bundle transaction belum diuji ke sandbox** — format `response.location` transaction-response SatuSehat & batas jumlah entry belum terverifikasi (mock mengikuti spesifikasi FHIR). | Setelah FG-02: kirim 1 kunjungan uji → cek `ihs_refs` job + GET Encounter/Condition di sandbox. |
| FG-61 | 🟡 | **Atomik = 1 resource invalid menggagalkan seluruh kunjungan** (mis. 1 kode LOINC salah → Encounter, diagnosis, obat ikut tertolak); mode single mengirim sebagian. | Parse `OperationOutcome.issue[].expression` (index entry) → tampilkan item penyebab di konsol; opsi fallback otomatis ke single bila bundle ditolak karena validasi. |
| FG-62 | ⚪ | **Bundle besar** — rawat inap panjang (ratusan Observation TTV) bisa melebihi batas ukuran/entry; pemecahan bundle belum didukung (referensi lintas bundle). | Bila kena batas: kirim TTV dalam bundle terpisah setelah Encounter punya id nyata. |
| FG-63 | ⚪ | **Composition**: narasi `section.text.div` = XHTML sesuai spesifikasi FHIR (contoh resmi memakai teks polos); kode LOINC section hanya Ringkasan (8648-8) & Diagnosis Keluar (11535-2) — Kondisi Masuk/Pulang tanpa kode. | Verifikasi di sandbox; tambahkan kode section bila diwajibkan. |
| FG-64 | ⚪ | **Composition dikirim walau resume belum TTE** (`preliminary`), revisi → PUT. | Konfirmasi apakah SatuSehat menerima `preliminary`; bila tidak, kirim hanya setelah TTE. |
| FG-65 | ⚪ | **Penulisan ulang referensi berbasis teks** — string JSON yang diawali `"Type/urn:uuid:` di teks bebas ikut ditulis ulang (kemungkinan sangat kecil). | Ganti ke penulisan ulang terstruktur (walk field `reference`) bila diperlukan. |

## FH9 — Konsol `/ehis-fhir` (2026-10-26)

**Dibangun:** modul ke-11 **EHIS SatuSehat** (`ModuleKey "fhir"`, accent teal, gate modul & menu `fhir.sync`, ikon Waypoints) — [Beranda](../src/components/fhir/FhirBeranda.tsx) (mode/kredensial terisi-kosong tanpa nilai rahasia · token OAuth2 + tombol **Uji Token** · circuit · antrean per status · peta resource · 20 panggilan audit terakhir) · [Onboarding](../src/components/fhir/FhirOnboarding.tsx) (3 kartu berurutan Organisasi → Ruangan → Nakes, progres terpetakan/lokal, daftar belum terpetakan, jalankan + opsi resolve ulang nakes, tabel hasil run) · [Antrean Kirim](../src/components/fhir/FhirAntrean.tsx) (filter status, jalankan antrean, antre ulang job Gagal/Dilewati, sinkron ulang 1 kunjungan by UUID, detail error OperationOutcome + resource terkirim + catatan) · [Pasien & NIK](../src/components/fhir/FhirPasien.tsx) (cek NIK tanpa simpan, resolve massal 25/50/100 + daftar perlu perhatian). UI kit [fhirShared](../src/components/fhir/fhirShared.tsx). Tombol aksi di-gate `useCan` (server tetap penjaga).

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-66 | ✅ **(FH9b 2026-10-26 — halaman Resource + Kunjungan)** | **Belum ada browser Resource Map** (daftar lokal ↔ IHS id per jenis + cari) — Beranda hanya menampilkan jumlah per jenis. | Ditutup oleh FH9b di bawah: `GET /fhir/resources[/summary\|/:id]` + kartu per jenis + drawer payload. |
| FG-67 | ⚪ | **Belum ada UI konflik/rekonsiliasi** (FH9 roadmap "Conflict resolution") — mis. identitas lokal ≠ SatuSehat hanya tampil sebagai pesan. | Halaman daftar ketidakcocokan dari hasil resolve pasien + aksi koreksi di registrasi. |
| FG-68 | ⚪ | **Status tidak live** — konsol dimuat sekali + tombol Muat ulang (tanpa polling/SSE). | Polling ringan (30 dtk) di Beranda/Antrean bila dibutuhkan; SSE saat infrastruktur realtime siap. |
| FG-69 | ⚪ | **Konsol belum dicoba di browser** (pembatasan resource dev; diverifikasi via diagnostik TS editor saja). | Buka `/ehis-fhir` dengan akun Admin (mode mock): Uji Token → Onboarding 3 langkah → terima/selesaikan 1 kunjungan → Antrean → Jalankan. |

## FH9b — Konsol Resource & Kunjungan (2026-10-26)

**Dibangun:** menu baru grup **Data Terkirim** — [Kunjungan](../src/components/fhir/kunjungan/FhirKunjungan.tsx) (cari no. kunjungan/nama/RM/ID kunjungan/**IHS Encounter id**, filter unit + status kirim Terkirim/Belum/Antre/Gagal, kartu per kunjungan) → [detail kunjungan](../src/components/fhir/kunjungan/FhirKunjunganDetail.tsx) `/ehis-fhir/kunjungan/:id` (hero pasien + IHS Patient/Encounter, **progres kirim** terkirim/berubah/belum, prasyarat kurang, data dilewati, **kartu semua resource** per kategori dengan filter status → drawer ringkasan + referensi + **payload JSON** (pohon lipat + salin), riwayat job, tombol Antre sinkron / Kirim sekarang) · [Resource](../src/components/fhir/resource/FhirResources.tsx) (kartu per resourceType 15 jenis × 5 kategori, jumlah terpetakan + sinkron terakhir → daftar per jenis + cari awalan id → drawer detail + payload). Backend: `PreviewSink` (tangkap tanpa kirim/tulis) + `previewEncounter` (logika 3 fase yang SAMA dengan job kirim) + `onboardingService.previewMaster` + kolom `fhir.resource_map.kunjungan_id` (migrasi `20261026170000`) + `consoleService`/`consoleDal` + route `GET /fhir/resources`, `/resources/summary`, `/resources/:id`, `GET /fhir/encounter`, `/encounter/:kunjunganId`. Config: `SATUSEHAT_BASE_URL` boleh berisi path `/fhir-r4/v1` (dinormalkan ke host) + `SATUSEHAT_AUTH_URL` opsional.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-70 | 🟡 | **Payload yang ditampilkan = rekonstruksi dari data TERKINI, bukan salinan yang benar-benar terkirim** (payload tak disimpan — R14). Status "Terkirim" berarti hash identik dengan yang diterima SatuSehat (jadi payload = yang terkirim); "Berubah" berarti data lokal sudah beda — isi persis kiriman lama tidak bisa ditampilkan. | **Sebagian tertutup 2026-11-21:** isi persis tiap kiriman kini ada di tab **Log pengiriman** (lihat bagian di bawah) untuk panggilan sejak fitur aktif, selama masa retensi. Tab Payload tetap = rekonstruksi terkini. |
| FG-71 | ⚪ | **Resource klinis lama belum tertaut kunjungan** — `kunjungan_id` baru di-backfill untuk Encounter & Composition; Condition/Observation/dst. tertaut otomatis saat job kunjungannya jalan lagi (termasuk noop). Sebelum itu, drawer menampilkan catatan "kunjungan pemilik belum tertaut". | Antre sinkron ulang kunjungan lama sekali, atau backfill per tipe via join tabel sumber bila jumlahnya banyak. |
| FG-72 | ⚪ | **Detail 1 resource membangun ulang seluruh rencana kunjungannya** (semua query builder FH4–FH7) — wajar untuk konsol operator, bisa terasa lambat untuk kunjungan RI panjang. | Cache rencana per kunjungan singkat (mis. 30 dtk) atau endpoint builder per resource bila dibutuhkan. |
| FG-73 | ✅ 2026-11-21 (`MODE=sandbox`: token HTTP 200 + `Organization/{ORG_ID}` aktif via skrip probe) | **Config URL DevHub belum diuji ke sandbox** — `.env` berisi `SATUSEHAT_BASE_URL=…/fhir-r4/v1` & `SATUSEHAT_AUTH_URL=…/oauth2/v1` (format DevHub); config kini menormalkan keduanya, tapi `SATUSEHAT_MODE` masih `mock`. Bagian dari FG-02. | Set `SATUSEHAT_MODE=sandbox`, restart server, Beranda → **Uji Token** sekali. |
| FG-74 | 🟡 | **Payload di konsol memuat PII klinis** (nama pasien di `display`, diagnosis, hasil) — dibatasi `fhir.sync:read` (Admin) dan tidak di-log. | Pertimbangkan izin baca payload terpisah (mis. `fhir.payload:read`) bila operator interop bukan tenaga klinis. |
| FG-75 | ⚪ | **Halaman Resource & Kunjungan belum dibuka di browser** (sejak 2026-11-17 drawer detail = `Sheet`+`Tabs` shadcn — pilot UI, ikut dicek: buka/tutup, Esc, Tab terkunci di drawer, panah kiri/kanan antar tab) — diverifikasi diagnostik editor + smoke SQL daftar kunjungan (20 kandidat, peta env mock masih kosong). | Buka `/ehis-fhir/kunjungan` → pilih kunjungan Selesai → cek kartu "Belum terkirim" + payload → **Kirim sekarang** (mock) → kartu jadi "Terkirim" → `/ehis-fhir/resource` terisi. |

## Log pengiriman per data (2026-11-21)

**Dibangun:** tiap panggilan SatuSehat kini tertaut ke data lokalnya dan isinya tercatat. `fhir.fhir_audit_log` +`local_type`/`local_id`/`kunjungan_id`/`local_refs` (isi Bundle berurutan)/`request_path` (NIK dimasker) · tabel BARU `fhir.fhir_audit_payload` 1:1 (request/response **terenkripsi AES-256-GCM**, NIK/KK/paspor dimasker sebelum disimpan, batas 512 KB/body, dipangkas `SATUSEHAT_LOG_BODY_DAYS` default 90 secara oportunistik ≤1×/jam) — migrasi `20261121140000`. Endpoint `GET /fhir/log` (keyset `started_at,id`; total hanya di halaman pertama) + `GET /fhir/log/:id` (dekripsi + log akses rekam medis). UI tab **Log pengiriman** ([SendLogPanel](../src/components/fhir/log/SendLogPanel.tsx)) di drawer Prerequisites, Resource, dan kartu resource Kunjungan: baris `<details>` (method · status · path · durasi · pelaku · entry Bundle) → dibuka = muat isi request/response (pilihan "Entry data ini" / "Bundle lengkap"). Optimasi ikut: detail Prerequisites & pratinjau Organization/Location kini lookup PK (dulu memuat seluruh master lalu `.find`), label daftar Resource diambil paralel, index `resource_map (env, resource_type, last_sync_at DESC)`.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-146 | ⚪ | **Log sebelum 2026-11-21 tak tertaut ke data** (kolom tautan NULL, tanpa isi) → tak muncul di tab Log. | Wajar; riwayat terisi sejak sinkron berikutnya. |
| FG-147 | 🟡 | **Isi log memuat data klinis** (terenkripsi, NIK dimasker) — siapa pun ber-`fhir.sync:read` bisa membuka; tiap pembukaan dicatat di log akses rekam medis. | Sama dengan FG-74: izin baca payload terpisah bila operator interop bukan tenaga klinis. |
| FG-148 | ⚪ | **Pemangkasan retensi oportunistik** (saat ada panggilan baru, ≤1×/jam/proses) — tanpa panggilan, isi lama menunggu panggilan berikutnya. | Pindahkan ke runner terjadwal saat infrastruktur job ada (pola `instrumentation.ts`). |
| FG-149 | ⚪ | **Kunci enkripsi `PII_ENC_KEY` berganti** → isi log lama tak bisa dibuka (metadata tetap; UI menampilkan "(isi log tidak dapat didekripsi)"). | Rotasi kunci berversi (kid di depan ciphertext) bila rotasi dijadwalkan. |
| FG-151 | ⚪ | **Kirim per item (2026-11-21)** — tombol **Kirim**/**Cari IHS** per baris daftar Prerequisites + kaki drawer (**Kirim item ini** · **Kirim ulang** = PUT paksa · **Cari ulang IHS**), `POST /fhir/onboarding/:jenis/items/:localId/sync` (logika = sinkron massal, kunci per item anti-dobel-klik, tolak saat sinkron massal jenis sama berjalan), notifikasi berhasil/gagal/tak berubah/dilewati (daftar = toast; drawer = alert inline karena drawer dialog modal membuat toast di luarnya tak terbaca pembaca layar). Induk **tidak** dikirim berantai: unit induk / unit pengelola belum terpetakan → gagal + petunjuk "kirim induk dulu". | Bila diperlukan: opsi "kirim beserta induk" (urut kedalaman) di drawer. |
| FG-152 | ⚪ | **GET by Nomor IHS (2026-11-21)** — sesuai API Catalogue Onboarding: `GET /Practitioner/{id}` · `GET /Patient/{id}` (1 resource, bukan Bundle) via `POST /fhir/ihs-lookup` (IHS di body; gate `fhir.sync:read`; tidak mengubah peta; tercatat di log pengiriman, tertaut `localId` bila dari drawer). UI: tombol **GET by IHS** di daftar Practitioner/Patient + tab **Data SatuSehat** di drawer (prefill IHS terpetakan, cek kecocokan peta & data lokal pemilik IHS). Uji sandbox: `Practitioner/10009880728` 200 (memuat identifier **NIK** → dimasker server) · `Patient/P02478375538` 200 **hanya identifier + meta** (tanpa nama/kelamin/tgl lahir — UI menjelaskan). Catatan: pencarian by NIK dummy `7209061211900001` mengembalikan 27 entri dan entry[0] ≠ IHS di tabel dummy playbook (`10009880728`) — data sandbox bersama berisi duplikat. **Re-cek 2026-11-21:** `Practitioner/10009880728` kini berisi nakes lain (nama tersamar `NO** LA**`, `meta.lastUpdated` 2026-01-29) dan **tidak** termasuk 27 hasil NIK dummy itu (semuanya bernama tersamar `d** Na** Ha**` / `d** Ru** Sp**`). Artinya tabel dummy Playbook (dr. Alexander) **sudah tidak mencerminkan isi Sandbox**; EHIS menampilkan respons apa adanya. SatuSehat **menyamarkan nama & NIK** di respons GET/search, jadi UI memberi keterangan "nama disamarkan oleh SatuSehat" dan contoh IHS di hint tak lagi menjanjikan nama. **Petakan manual (Sandbox) ✅ 2026-11-21** — NIK data asli RS tak ada di Sandbox sehingga Cari IHS tak pernah ketemu, padahal Encounter dst. butuh referensi valid → tab Data SatuSehat: hasil Ambil bisa **Petakan ke data ini** (`POST /fhir/ihs-lookup/map`, `fhir.sync:create`, **server menolak di luar mode sandbox**, IHS diverifikasi GET dulu & tercatat di log pengiriman sebagai `{Type}/{ihs} · petakan manual`, kolom master Dokter/Pasien tak disentuh, konfirmasi inline 2 langkah). Di Sandbox 1 IHS boleh dipakai >1 data (peringatan ditampilkan) karena IHS dummy valid sedikit (`N10000001`, `N10000002`, `10009880728`, …; `N10000003`–`07` = 410). **Cari IHS Practitioner kini menolak hasil ganda** (>1 id → `failed`, peta lama dibiarkan; dulu diam-diam ambil `entry[0]`). | Patient resolve by NIK (`patientIhsService.searchByNik`) masih ambil `entry[0]` — samakan penjaga hasil ganda bila ditemukan duplikat. |
| FG-150 | ⚪ | **Tab Log belum dibuka di browser** — diverifikasi diagnostik editor + uji SQL (insert CTE, UNION ALL, rollback) + EXPLAIN (index `fhir_audit_log_local_idx`/`_kunjungan_idx` dipakai, tanpa Sort). | Restart dev server → Onboarding → Organization/Location → Jalankan sinkron → Detail → tab **Log pengiriman** → buka baris. |
