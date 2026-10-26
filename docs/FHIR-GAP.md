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
| FG-01 | 🔴 | **(naik prioritas FH3 — menyentuh `kunjunganService.transition`/`cancelKunjungan` + `kunjunganDal` + `encounter.prisma`, jalur klinis inti)** **`tsc --noEmit` + eslint belum dijalankan** untuk file FH0 — sengaja ditunda karena RAM/disk laptop dev terbatas (RAM bebas ~700 MB, C: ~3 GB). Kode di-review manual; Prisma client sudah di-generate & tabel terverifikasi di DB. | Jalankan saat resource longgar: `npx tsc --noEmit` lalu `npx eslint src/lib/fhir src/lib/dal/fhir src/lib/services/fhir src/lib/api/fhir src/lib/schemas/fhir src/app/api/v1/fhir`. |
| FG-02 | 🔴 | **Token nyata ke sandbox belum diuji** (DoD FH0) — kredensial DevHub belum ada (G-1). Mode default `mock`. | Isi `SATUSEHAT_CLIENT_ID/SECRET/ORG_ID` di `.env`, set `SATUSEHAT_MODE=sandbox`, panggil `POST /api/v1/fhir/status/probe` **sekali** (gagal → cooldown 60 dtk, rate-limit SatuSehat). |
| FG-03 | 🟡 | **Outbox worker belum ada** — DAL siap (`syncLogDal.listDue/claim/markAcked/markFailed`), tapi belum ada runner yang mengeksekusi (G-7). | Bangun di FH3 bersama payload Encounter pertama: runner interval (long-running Node) → `listDue` → `claim` → `callSatuSehat` → `markAcked`/`markFailed(retryAt)`; backoff eksponensial, maks percobaan → `Failed`. |
| FG-04 | 🟡 | **Token cache & circuit breaker in-memory per proses** (`globalThis`). Multi-instance → tiap proses minta token sendiri (risiko kena rate-limit 1/menit). | Pindah ke Redis (seam: isi `token.ts` state + `circuit.ts` map) saat deploy multi-instance. |
| FG-05 | ⚪ | **PATCH Content-Type diasumsikan `application/json-patch+json`** (JSON Patch array). Belum dicocokkan dengan contoh resmi. | Cek koleksi Postman resmi (`docs/fhir-postman/`) / docs kemkes saat pertama memakai PATCH (FH2 Patient). |
| FG-06 | ⚪ | **Target `kfa` default `/kfa-v2`**; `/kfa-v3` & `/kfa` lama belum bisa dipilih per panggilan. | Tambah target/opsi versi saat FH8 (KFA sync). |
| FG-07 | ⚪ | **Audit `retryCount` = 0 pada jalur gagal** — `FhirError` tak membawa jumlah percobaan (jalur sukses sudah benar). | Tambah `attempts?` ke `FhirError` bila analisis retry dibutuhkan. |
| FG-08 | 🟡 | **Retensi audit 5 tahun belum ada kebijakan** (partisi/arsip `fhir.fhir_audit_log`) — sama dengan `bpjs.bpjs_audit_log`. | Kebijakan retensi/partisi bulanan bersama audit BPJS (cross-cutting, TECH_DEBT). |
| FG-09 | ⚪ | **`fhir.Consent` belum dibuat** (sengaja) — path Consent SatuSehat belum terkonfirmasi (G-3). | Tambah tabel di FH2 setelah path Consent dipastikan dari koleksi Postman resmi. |
| FG-10 | ⚪ | **Belum ada konsol UI** untuk endpoint status/probe (`/ehis-fhir`). | FH9 — FE konsumsi `getFhirStatus()` / `probeFhirToken()` di [src/lib/api/fhir/status.ts](../src/lib/api/fhir/status.ts). |

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
