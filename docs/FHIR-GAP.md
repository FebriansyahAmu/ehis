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
| FG-27 | ✅ **(2026-11-17 — S2: gerbang "blokir finished" — tanpa CC/DD Encounter tetap `in-progress`)** | **Encounter `finished` kemungkinan wajib `diagnosis` (Condition)** — FH4 belum ada, jadi `diagnosis` kosong → bisa ditolak SatuSehat. | FH4: kirim Condition dulu (job berantai) sebelum Encounter finished; verifikasi aturan di sandbox. |
| FG-28 | ⚪ | **ServiceClass RI**: kelas ICU/HCU/Isolasi tak punya kode → extension dihilangkan; kode `vip`/`naik-kelas`/`turun-kelas`/`titip-rawat` belum diverifikasi ke CodeSystem resmi. | Cocokkan dengan terminologi `locationServiceClass-Inpatient` & `locationUpgradeClass` SatuSehat. |
| FG-29 | 🟡 | **Batal Selesai (reopen)** mengirim status mundur `finished → in-progress` — kemungkinan ditolak SatuSehat. | Kebijakan: jangan PUT mundur; tahan job sampai kunjungan diselesaikan ulang (skip event reopen) — putuskan setelah uji sandbox. |
| FG-30 | 🟡 (S2: `location.period` dikirim; multi-lokasi menunggu fitur pindah ruangan/bed — belum ada di EHIS) | **Riwayat lokasi tidak dilacak** — Encounter hanya memuat ruangan terakhir (contoh resmi IGD: triase → ruang tindakan dengan period masing-masing). | Bangun dari `encounter.BedAllocation` (riwayat okupansi) saat FH7 bundle. |
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
| FG-36 | 🟡 **(S3 2026-11-17: alergi obat kini dikirim via KFA zat aktif `bzaKode` — 4/4 data uji siap; makanan/lainnya tetap butuh SNOMED → Issue L06 di konsol)** | **AllergyIntolerance tanpa SNOMED dilewati** — data uji 4/4 tanpa `snomedCode` → praktis tak ada alergi terkirim. | Pastikan AllergyPane mengisi `snomedCode` (quick-pick katalog asesmen ber-SNOMED); validasi lokal R12 (G-4). |
| FG-37 | 🟡 **(S3: tindakan tanpa ICD-9 kini tampil sebagai Issue L14 di konsol — bukan hilang diam-diam; pengisian kode tetap perlu)** | **TindakanMedis tanpa kode ICD-9-CM tak jadi Procedure** — data uji 4/4 tanpa kode; hanya DiagnosaProsedur (koding ICD-9) yang pasti terkirim. | Lengkapi kode ICD-9 di master Katalog Tindakan (kolom sudah ada, opsional) untuk tindakan yang wajib dilaporkan. |
| FG-38 | ⚪ | **Procedure tanpa `category` & `bodySite`** (SNOMED) — contoh resmi memakai keduanya. | Tambah mapping kategori tindakan → SNOMED (diagnostic/therapeutic) bila diwajibkan validasi sandbox. |
| FG-39 | ⚪ | **Display ICD-10 = nama diagnosis lokal** (bisa Bahasa Indonesia), bukan display resmi WHO (Inggris). | Ambil display dari master ICD bila tersedia; cek apakah SatuSehat memvalidasi display. |
| FG-40 | ✅ **(FH7 2026-10-26: mode bundle default — 1 POST per kunjungan)** | **Volume TTV**: 1 baris TTV = hingga 10 Observation (1 POST masing-masing). Rawat inap multi-shift → ratusan panggilan per kunjungan. | FH7: kirim sebagai Bundle transaction. |
| FG-41 | ✅ **(2026-11-17 — dijawab riset playbook → lihat FG-78)** | **Kode LOINC tanda vital belum diverifikasi** ke use case SatuSehat (SpO₂ `59408-5` vs `2708-6`, GCS total `9269-2`, nyeri `72514-3`). | Cocokkan dengan bundle resmi IGD/RI di `docs/fhir-postman/bundles/`. |
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
| FG-63 | ✅ **(S3: section bersarang ber-`entry` sesuai contoh resmi; narasi hanya Perjalanan Kunjungan 8648-8; section kosong dihilangkan)** | **Composition**: narasi `section.text.div` = XHTML sesuai spesifikasi FHIR (contoh resmi memakai teks polos); kode LOINC section hanya Ringkasan (8648-8) & Diagnosis Keluar (11535-2) — Kondisi Masuk/Pulang tanpa kode. | Verifikasi di sandbox; tambahkan kode section bila diwajibkan. |
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
| FG-70 | 🟡 | **Payload yang ditampilkan = rekonstruksi dari data TERKINI, bukan salinan yang benar-benar terkirim** (payload tak disimpan — R14). Status "Terkirim" berarti hash identik dengan yang diterima SatuSehat (jadi payload = yang terkirim); "Berubah" berarti data lokal sudah beda — isi persis kiriman lama tidak bisa ditampilkan. | Bila audit/medikolegal butuh bukti kiriman persis: simpan snapshot payload terenkripsi (`fhir.resource_map.last_payload_enc` / tabel versi) + retensi — keputusan PII bersama (R14). |
| FG-71 | ⚪ | **Resource klinis lama belum tertaut kunjungan** — `kunjungan_id` baru di-backfill untuk Encounter & Composition; Condition/Observation/dst. tertaut otomatis saat job kunjungannya jalan lagi (termasuk noop). Sebelum itu, drawer menampilkan catatan "kunjungan pemilik belum tertaut". | Antre sinkron ulang kunjungan lama sekali, atau backfill per tipe via join tabel sumber bila jumlahnya banyak. |
| FG-72 | ⚪ | **Detail 1 resource membangun ulang seluruh rencana kunjungannya** (semua query builder FH4–FH7) — wajar untuk konsol operator, bisa terasa lambat untuk kunjungan RI panjang. | Cache rencana per kunjungan singkat (mis. 30 dtk) atau endpoint builder per resource bila dibutuhkan. |
| FG-73 | 🔴 | **Config URL DevHub belum diuji ke sandbox** — `.env` berisi `SATUSEHAT_BASE_URL=…/fhir-r4/v1` & `SATUSEHAT_AUTH_URL=…/oauth2/v1` (format DevHub); config kini menormalkan keduanya, tapi `SATUSEHAT_MODE` masih `mock`. Bagian dari FG-02. | Set `SATUSEHAT_MODE=sandbox`, restart server, Beranda → **Uji Token** sekali. |
| FG-74 | 🟡 | **Payload di konsol memuat PII klinis** (nama pasien di `display`, diagnosis, hasil) — dibatasi `fhir.sync:read` (Admin) dan tidak di-log. | Pertimbangkan izin baca payload terpisah (mis. `fhir.payload:read`) bila operator interop bukan tenaga klinis. |
| FG-75 | ⚪ | **Halaman Resource & Kunjungan belum dibuka di browser** — diverifikasi diagnostik editor + smoke SQL daftar kunjungan (20 kandidat, peta env mock masih kosong). | Buka `/ehis-fhir/kunjungan` → pilih kunjungan Selesai → cek kartu "Belum terkirim" + payload → **Kirim sekarang** (mock) → kartu jadi "Terkirim" → `/ehis-fhir/resource` terisi. |

## Audit pemetaan EMR → FHIR (2026-11-17)

**Riset:** playbook resmi RJ v7.0 · IGD v5.2 · RI v6.0 + bundle Postman resmi, dibandingkan dengan adapter FH3–FH7.
Spesifikasi per link (L01–L26), arsitektur, dan keputusan D1–D16 ada di **[fhir-mapping/](fhir-mapping/README.md)**.
Temuan "salah kamar" pada kode yang **sudah ada**:

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-76 | ✅ **(2026-11-17 — S2 `feat/fhir-encounter-finished`)** | **Encounter `finished` tanpa `diagnosis` use `CC`** — playbook RJ/IGD/RI mewajibkan keluhan utama (Condition `chief-complaint`) saat PUT `finished`; adapter hanya mengirim `DD`, dan Condition keluhan utama belum dibangun (lanjutan FG-27). | [L03](fhir-mapping/L03-keluhan-to-condition.md) + [L01](fhir-mapping/L01-kunjungan-to-encounter.md). Butuh kode SNOMED keluhan (D4). |
| FG-77 | ✅ **(2026-11-17 — S2)** | **Disposisi Meninggal dikirim `exp` (system HL7)** — playbook memakai `exp-lt48h` / `exp-gt48h` system `http://terminology.kemkes.go.id/CodeSystem/discharge-disposition`. | [L24](fhir-mapping/L24-disposisi-to-kondisi-pulang.md): hitung 48 jam dari masuk. |
| FG-78 | ✅ **(S3: nyeri & GCS keluar dari vital-signs — nyeri menyusul di L11, GCS menunggu D5; nilai 0 = kosong)** | **Skor nyeri & GCS dikirim sebagai `vital-signs`** (LOINC `72514-3`, `9269-2`) — playbook menaruh nyeri di asesmen nyeri `survey` (SNOMED `22253000` + NRS `1172399009`); GCS tidak ada di playbook. | Keluarkan dari [L08](fhir-mapping/L08-ttv-to-observation.md); nyeri → [L11](fhir-mapping/L11-nyeri-to-observation.md); GCS & SpO₂ ditahan (D5). Menggantikan FG-41. |
| FG-79 | 🟡 **(S3: kode alergi obat → KFA 91 ✅; `reaction.manifestation` masih belum — butuh kode item reaksi, S5)** | **Alergi obat dikirim dengan SNOMED** — contoh resmi memakai KFA bahan zat aktif `91…` (`AsesmenAlergi.bzaKode` sudah ada). `reaction.manifestation` (wajib di IGD) tidak dikirim. | [L06](fhir-mapping/L06-alergi-to-allergyintolerance.md). |
| FG-80 | ✅ **(S3: Medication per paket Request/Dispense, dispense wajib KFA 93; lihat FG-99 untuk mode single)** | **Pola Medication berbeda dari resmi** — FH5 memakai 1 Medication per master obat; contoh resmi = Medication per MedicationRequest dan per MedicationDispense (dalam Bundle / `contained`); POST Medication terpisah "tidak dapat digunakan mulai 2025". Dispense wajib KFA `93…`. | [L18](fhir-mapping/L18-resep-to-medicationrequest.md) · [L20](fhir-mapping/L20-dispensing-to-medicationdispense.md) (D6). |
| FG-81 | 🟡 | **`dosageInstruction.timing.repeat` wajib** tapi adapter hanya mengirim signa teks (memperberat FG-49). | Parser signa atau field terstruktur di form resep (L18). |
| FG-82 | ✅ **(S3: type per unit + section diagnosis 78375-3)** | **Composition `type` `18842-5` untuk semua unit** — resmi: RJ `88645-7` · IGD `97663-9` · RI `34105-7`; section diagnosis `11535-2` → `78375-3`. | [L26](fhir-mapping/L26-resume-to-composition.md). |
| FG-83 | ✅ **(2026-11-17 — S1 `feat/fhir-mapping-fondasi`: `toFhirDateTime` kini UTC `+00:00`)** | **Waktu dikirim `+07:00`** — playbook menulis eksplisit UTC+00 (`…+00:00`); instant sama, tapi ikuti ketentuan resmi. | `toFhirDateTime` → UTC (D9). |
| FG-84 | ✅ **(2026-11-17 — S2)** | **`Encounter.classHistory` tidak dikirim** (bertanda wajib di playbook) & `length` tidak dikirim saat selesai; status `triaged` IGD tidak dikirim. | [L01](fhir-mapping/L01-kunjungan-to-encounter.md). |
| FG-85 | 🟡 **(S3: category per bagian HM/CH/BG/MB/SR/IMM/TX ✅; status puasa belum — tak ada field puasa di order)** | **`DiagnosticReport.category` lab selalu `LAB`** — contoh resmi memakai `HM`/`CH` per bagian; status puasa (Procedure `792805006`) tidak dikirim. | [L16](fhir-mapping/L16-lab-to-diagnostic.md). |
| FG-86 | ⚪ | **Kunci API Postman di `.env` tidak valid (401)** — contoh payload resmi di `docs/fhir-postman/` tidak bisa di-refresh. | Buat API key baru di akun Postman yang mem-fork `satusehat/satusehat-public`. |
| FG-87 | 🟡 | **Kamus SNOMED lokal (sementara) dari dump Kemenkes berkualitas terbatas** — `master.snomed_concept/description` di-seed dari `docs/snomend_ct.sql` (file lokal, tidak di-commit): rilis 2002-01-31 (tag semantik model lama), tiap deskripsi tercatat 2× (dibuang unique index), hanya 79.801 dari 325.768 konsep punya FSN, 358 istilah rusak encoding (dilewati), ID metadata 18 digit terbulatkan. Cakupan kode SNOMED playbook **50/77** — hilang a.l. `404684003`, `417662000`, `450847001`, `422768004`, `1172399009`, `409073007`, `792805006`, `736372004`, `737481003`. | Gerbang pra-kirim: kode dari ConceptMap playbook tetap sah walau tak ada di kamus; kamus hanya untuk kode pilihan petugas. Ganti dengan rilis SNOMED terbaru (skrip `prisma/scripts/seed-snomed.mts` sama). |
| FG-88 | ⚪ | **Terminologi Lab resmi SatuSehat ter-seed (2026-11-17)** — `master.terminologi_lab` (6.532 baris, 3.294 kode, 5 lampiran) + `terminologi_lab_jawaban` (5.177). Kualitas sumber: 28 kode Kemenkes (`X…`/`PR…`/`TK…`) berlabel `loinc.org` → dikoreksi saat seed; PK1 (v1.1) & PK2 (v1.2) tumpang tindih sebagian; sheet pendukung (daftar bakteri/parasit/jamur, syndromic panel, SITB) belum dimuat. Belum dipakai kode: picker LOINC Katalog Lab & gerbang Permintaan/Hasil (FG-52 lanjutan). | Bangun picker di `LoincField` (sumber `terminologi_lab`) + cek kategori di `readiness()` L16. Unduh ulang lampiran tiap rilis (±6 bulan, Drive id di skrip seed). |

## S1 Fondasi mapping (2026-11-17, branch `feat/fhir-mapping-fondasi`)

**Dibangun:** waktu UTC (`toFhirDateTime`) · hash kanonik (`canonicalJson`, dipakai `hashOf` klinis & onboarding) · [conceptMap.ts](../src/lib/fhir/conceptMap.ts) (enum lokal → kode, exhaustive; adapter Encounter/klinis/obat/diagnostik memakainya) · kontrak & registry link [links/](../src/lib/fhir/links/) (L01–L26) · snapshot per kunjungan [encounterSnapshot.ts](../src/lib/services/fhir/encounterSnapshot.ts) (1 putaran query paralel; diagnosa tak lagi dibaca ±5× per job) · item "dilewati" menjadi **Issue** terstruktur (`EncounterPlan.issues`). Test murni [conceptMap.test.ts](../src/lib/fhir/conceptMap.test.ts) lulus.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-89 | ⚪ | **Semua resource akan terkirim ulang sekali (PUT)** — hash berubah karena format waktu UTC, JSON kanonik, dan display indikator kelas (playbook). Mode masih `mock` → tak berdampak ke SatuSehat; bila kelak sudah ada data di sandbox, job pertama sesudah S1 = gelombang PUT. | Diterima (sekali). Tidak perlu tindakan. |
| FG-90 | 🟡 | **Typecheck layanan FHIR tidak bisa dijalankan lokal** — tsc terbatas pada file layanan kehabisan heap 1 GB (tipe Prisma hasil generate ±16 MB); yang lolos lokal: tsc file murni (`fhir/*`, `links/*`, adapters) + ESLint semua file + review manual. | Andalkan `tsc --noEmit` penuh di CI (SG-14/`fix/ci-baseline`). |
| FG-91 | ✅ **(S3: panel Data ditahan per link di detail kunjungan)** | **Issue belum tampil terstruktur di konsol** — konsol masih membaca `notes` (teks) dari pratinjau; `issues` (link · kode · localId) sudah tersedia di `EncounterPlan`. | S3: tampilkan Issue per link di halaman detail kunjungan `/ehis-fhir/kunjungan/:id`. |

## S2 Encounter finished (2026-11-17, branch `feat/fhir-encounter-finished`)

**Dibangun:** L03 keluhan utama → Condition `chief-complaint` (kode SNOMED dari picker Anamnesis, subset master
asesmen kategori **Keluhan Utama** — 54 kode ter-seed, migrasi `20261117140000_keluhan_snomed`) · L01 `diagnosis`
CC + DD, `classHistory`, `length`, `triaged` (IGD), `location.period`, gerbang "blokir finished" · L24 meninggal
`exp-lt48h`/`exp-gt48h` + Condition kondisi pulang (D11). Test murni [encounterFinal.test.ts](../src/lib/fhir/links/encounterFinal.test.ts)
+ conceptMap: 21 lulus. Tutup FG-27 · FG-76 · FG-77 · FG-84.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-92 | ⚪ | **Display `exp-lt48h`/`exp-gt48h` belum terverifikasi verbatim** — "Meninggal < 48 jam" / "Meninggal > 48 jam" diambil dari ringkasan tabel Cara Keluar playbook IGD/RI (halaman terlalu besar untuk dibaca utuh). SatuSehat memvalidasi `code`. | Cocokkan saat uji sandbox / baca tabel langsung di browser. |
| FG-93 | 🟡 **(2026-11-17 — mitigasi: peringatan non-blokir, keputusan user)** | **Kunjungan terkunci tanpa kode keluhan → Encounter tertahan `in-progress` selamanya** — setelah `complete`, tulis `clinical.*` diblokir (lock); bila Anamnesis belum dikodekan, satu-satunya jalan = Batal Selesai → isi kode → Selesaikan lagi. | ✅ Peringatan [KeluhanKodeWarning](../src/components/shared/medical-records/KeluhanKodeWarning.tsx) (amber, tak menghalangi) di **SelesaikanDialog** (header IGD/RI/RJ) + **tab Pasien Pulang** (IGD, dipakai ulang RI). Belum tercakup: RJ "Selesaikan Kembali" (kunci ulang langsung tanpa dialog). Penegakan wajib → FG-98. |
| FG-98 | 🟡 terbuka | **Wajibkan kode keluhan utama sebelum Selesaikan Kunjungan** — gerbang server di transisi `complete` (pola gerbang "≥1 Diagnosa Utama Pasti"): tolak bila Anamnesis terbaru tanpa `keluhan_snomed_kode`. Menutup FG-93 tuntas. Ditunda atas keputusan user 2026-11-17 (peringatan dulu). | Saat diputuskan: cek di `kunjunganService.transition` (`complete`) + pesan FE; pertimbangkan pengecualian (mis. Meninggal saat tiba / DOA tanpa anamnesis) dan dampak ke alur RJ "Selesaikan Kembali". |
| FG-94 | 🟡 | **Encounter yang sudah pernah `finished` bisa dikirim `in-progress` lagi** bila datanya kini tak memenuhi gerbang (mis. dikirim finished sebelum S2 tanpa CC) — status mundur, kemungkinan ditolak (sejenis FG-29). Mode `mock` → belum berdampak. | Simpan status terakhir terkirim di `resource_map`; gerbang hanya menahan Encounter yang belum pernah finished. |
| FG-95 | 🟡 | **Kondisi pulang Rujuk/APS dari form Pasien Pulang tidak dinilai** — `kondisiUmum` diturunkan dari status ("Dirujuk ke faskes lain", …) → Condition kondisi pulang tidak dikirim (Issue L24). | Keputusan D17: kembalikan pilihan kondisi (kosakata D11) untuk Rujuk & APS. |
| FG-96 | ⚪ | **Keluhan penyerta & Triase sebagai sumber keluhan cadangan belum dibangun** (L03) — ikut L02 yang ditunda (D2). | Bersama L02. |
| FG-97 | ⚪ | **Error tipe lama di `adapters/organization.ts`** (filter `telecom` tak menyaring `""`) — ada sejak FH1, terdeteksi typecheck terbatas S2. | ✅ diperbaiki di S2 (type guard `Exclude<…, "" \| null \| undefined>`). |

## S3 Koreksi kamar (2026-11-17, branch `fix/fhir-mapping-kamar`)

**Dibangun:** L08 nyeri & GCS keluar dari `vital-signs` + nilai 0 = kosong (SpO₂ tetap, D5 belum diputuskan) · L06 alergi obat →
KFA zat aktif `91…` dari `bzaKode` ([links/alergi.ts](../src/lib/fhir/links/alergi.ts)) · L14 `category` SNOMED dari kategori katalog
tindakan, `reasonReference` ke Condition Utama, tindakan tanpa ICD-9 = Issue · L26 Composition `type` per unit + section bersarang
ber-`entry` (`SectionRefs` dari tiap layanan sinkron) + `attester` saat TTE · L18/L20 **D6** Medication per paket Request/Dispense,
dispense wajib KFA `93…` · L16 gerbang Lampiran LOINC Laboratorium resmi (Permintaan/Hasil, [links/labTerminologi.ts](../src/lib/fhir/links/labTerminologi.ts))
+ `DiagnosticReport.category` per bagian · konsol: panel **Data ditahan** per link ([IssuePanel](../src/components/fhir/kunjungan/IssuePanel.tsx)) — tutup FG-91.
Test murni [kamar.test.ts](../src/lib/fhir/links/kamar.test.ts) + test S1/S2: 32 lulus. Tutup FG-63 · FG-78 · FG-80 · FG-82 · FG-91; sebagian FG-36 · FG-37 · FG-79 · FG-85.

| ID | Status | Gap | Cara tutup |
|---|---|---|---|
| FG-99 | 🟡 | **Mode `single` masih POST Medication berdiri sendiri** — playbook: "tidak dapat digunakan mulai 2025"; mode `bundle` (default) sudah benar (Medication = entry bersama Request/Dispense). | Bila mode single dipakai: kirim Medication sebagai `contained` di MedicationRequest/Dispense. |
| FG-100 | ⚪ | **Resource lama salah kamar jadi yatim di `resource_map` (mock)** — Observation `<ttvId>:pain`/`:gcs` dan Medication per master obat (localId = id Obat) tidak dibangun lagi; konsol menampilkannya di "orphans". Tidak ditarik (`entered-in-error`) karena belum pernah terkirim ke SatuSehat nyata. | Bila kelak ada data sandbox/prod dari sebelum S3: kirim `entered-in-error` untuk localId tsb. sekali jalan. |
| FG-101 | ⚪ | **`Procedure.category` kosong untuk kategori ambigu** — Obstetri · Pediatrik · Spesialistik · Anestesi · Tindakan_Invasif · Non_Kategori (bisa diagnostik ATAU terapeutik). | Tambah atribut tipe (diagnostik/terapeutik/bedah) di master Katalog Tindakan, atau tetapkan peta per kategori secara klinis. |
| FG-102 | ⚪ | **Gerbang L16 ketat: kode LOINC yang tidak ada di Lampiran resmi ditahan** (meski LOINC valid). Belum berdampak (LOINC master Lab 0%). | Verifikasi di sandbox apakah lampiran = daftar wajib; longgarkan bila SatuSehat menerima LOINC di luar lampiran. |
| FG-103 | ⚪ | **Display alergi obat = nama allergen (produk, mis. "Ibuprofen 400 mg")**, bukan display BZA KFA ("Ibuprofen") — EHIS tidak menyimpan display BZA. | Simpan `bzaDisplay` saat allergen dipilih dari Katalog Obat (KFA `zatAktif`). |
