# TODO — Rekam Medis Klinis (Backend) · mulai dari IGD

> **Tujuan:** bangun domain klinis (medical record) di backend, menggantung pada spine `encounter.Kunjungan`.
> **Mulai dari IGD** karena alurnya paling lengkap (19 tab) & sebagian besar tab-nya **shared** ke RI/RJ → satu set tabel klinis dipakai lintas modul.
> Acuan: [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md) · [docs/API-RULES.md](docs/API-RULES.md) · [TODOS_BACKEND.md](TODOS_BACKEND.md). Dibuat 2026-06-07.

## Titik berangkat (temuan)

- ✅ **Spine `Kunjungan` siap** ([encounter.prisma](prisma/schema/encounter.prisma)) — doc-nya eksplisit: _"data klinis TIDAK di sini → menggantung via `kunjunganId`."_ Belum ada satupun tabel klinis.
- ✅ **Seam swap siap** — [igdDetailApi.ts](src/components/igd/igdDetailApi.ts) mengisi `diagnosa/cppt/tindakan/vitalSigns/disposisi` dengan nilai kosong + komentar _"domain backend belum ada"_. Integrasi = isi array ini per-domain. **Zero refactor UI.**
- ✅ **Pola layered matang** — Route(`route()`)→Service(factory)→DAL(`db(tx)`)→Prisma, `transaction`, optimistic concurrency, soft-delete. Mirror persis dari `kunjungan`/`bedAllocation`.
- ✅ **RBAC klinis ter-seed** — `clinical.igd|ri|rj|cppt|diagnosa|tindakan|resep` (read/create/update/delete) sudah ada di PERMISSION_TREE + DB. Tak perlu permission baru untuk domain klinis.
- ⚠️ **ABAC unit-scope belum** — `assertCan` baru RBAC. Tulis klinis oleh akun unit-scoped (Dokter/Perawat) **belum fail-closed**. Keputusan: **bangun domain dulu (RBAC), ABAC `requireScope` menyusul sebelum akun klinis live** (BACKEND-AUTH §11).

## Konsolidasi 19 tab IGD → ~9 domain klinis

Tab ≠ tabel. Banyak tab = view berbeda atas domain yang sama; komponen `shared/medical-records/` membuktikan bentuk data seragam lintas IGD/RI/RJ.

| Domain (tabel target) | Tab terkait                                                           | Shared?    | Catatan                                                                                 |
| --------------------- | --------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| **Triase**            | Triase                                                                | IGD-only   | sebagian sudah di `Kunjungan.triaseLevel/caraDatang`                                    |
| **Observation**       | TTV · Penilaian (skor Morse/Braden/Barthel/NRS/NEWS2)                 | ✅         | time-series (pertimbangkan TimescaleDB)                                                 |
| **CPPT**              | CPPT/SOAP                                                             | ✅         | append-only + co-sign DPJP                                                              |
| **Condition**         | Diagnosa                                                              | ✅         | ICD-10; dibutuhkan billing/e-klaim                                                      |
| **Procedure**         | Tindakan IGD                                                          | IGD-only\* | ICD-9-CM; trigger charge billing                                                        |
| **Assessment**        | Asesmen Medis · Pemeriksaan (status fisik 11-sistem) · Riwayat/Alergi | ✅ inti    | narasi + head-to-toe                                                                    |
| **Consent**           | Informed Consent                                                      | ✅         | PMK 290/2008                                                                            |
| **MedReconciliation** | Rekonsiliasi                                                          | ✅         | HAM badge                                                                               |
| **NursingCare**       | Keperawatan (asuhan keperawatan SDKI/SLKI/SIKI)                       | ✅         | proses keperawatan; bisa berbagi pola CPPT                                              |
| **Handover**          | Serah Terima (SBAR)                                                   | ✅         | auto-populate TTV                                                                       |
| **Order** (REUSE)     | Daftar Order · Resep · Order Lab · Order Rad                          | ✅         | **domain Order tersendiri** (`ORDERS_MOCK` single source) — rekam medis cukup _membaca_ |
| **Outcome/Disposisi** | Pasien Pulang · Rujukan Keluar · Penandaan Gambar                     | IGD-only   | outcome episode                                                                         |

\* "IGD-only" = wrapper di folder `igd/`, domainnya tetap sama → **satu** tabel lintas-unit.

## Pelacak 19 Tab IGD (status backend per-tab)

Urutan persis seperti di [IGDRecordTabs.tsx](src/components/igd/IGDRecordTabs.tsx) (Rekam Medis 13 + Layanan 6). **FE 19/19 ✅** (mock). Yang dilacak di sini = **backend**: kolom **BE** (schema+DAL+service+endpoint, ~Fase A) & **Wiring** (resolver + tab konsumsi DB, ~Fase B/C).
Legenda: 🟢 selesai · 🟡 sebagian · ⬜ belum.

**Status global backend: 3/19 dimulai** (Triase BE ✅ + wiring tab ✅; Observation/TTV BE ✅ + wiring tab ✅; Asesmen Medis BE 🟡 — sub-menu Anamnesis + Riwayat Medis (9/9 pane) + **Alergi** + **Skrining Gizi** BE+wiring ✅, sisa sub Edukasi ⬜; sisa Fase C/wiring + 16 tab lain ⬜).

| #   | Tab (grup)               | Domain target     | FE  | BE  | Wiring | Catatan                                              |
| --- | ------------------------ | ----------------- | --- | --- | ------ | ---------------------------------------------------- |
| 1   | **Triase** (RM)          | Triase            | ✅  | 🟢  | 🟡     | Fase A ✅ + Fase B tab ✅; sisa Fase C (modal/board)  |
| 2   | **TTV** (RM)             | Observation       | ✅  | 🟢  | 🟢     | Fase A ✅ (schema+endpoint) + Fase B ✅ (wiring TTVTab) |
| 3   | **Asesmen Medis** (RM)   | Assessment        | ✅  | 🟡  | 🟡     | Anamnesis + Riwayat (9/9) + Alergi + Skrining Gizi BE+wiring ✅; Edukasi ⬜ |
| 4   | **Diagnosa** (RM)        | Condition         | ✅  | ⬜  | ⬜     | ICD-10; dibutuhkan billing/e-klaim                   |
| 5   | **CPPT / SOAP** (RM)     | CPPT              | ✅  | ⬜  | ⬜     | append-only + co-sign DPJP → domain ke-3             |
| 6   | **Tindakan IGD** (RM)    | Procedure         | ✅  | ⬜  | ⬜     | ICD-9-CM; trigger charge billing                     |
| 7   | **Informed Consent** (RM)| Consent           | ✅  | ⬜  | ⬜     | PMK 290/2008                                         |
| 8   | **Rekonsiliasi** (RM)    | MedReconciliation | ✅  | ⬜  | ⬜     | HAM badge; context igd/ri                            |
| 9   | **Keperawatan** (RM)     | NursingCare       | ✅  | ⬜  | ⬜     | asuhan keperawatan; bisa berbagi pola CPPT           |
| 10  | **Pemeriksaan** (RM)     | Assessment        | ✅  | ⬜  | ⬜     | status fisik 11-sistem (StatusFisikPane)             |
| 11  | **Penilaian** (RM)       | Observation       | ✅  | ⬜  | ⬜     | skor Morse/Braden/Barthel/NRS/NEWS2 (= Observation)  |
| 12  | **Penandaan Gambar** (RM)| Outcome/Annotation| ✅  | ⬜  | ⬜     | body-diagram markup (anatomis)                       |
| 13  | **Serah Terima** (RM)    | Handover          | ✅  | ⬜  | ⬜     | SBAR; auto-populate TTV                              |
| 14  | **Daftar Order** (Lyn)   | Order (REUSE)     | ✅  | ⬜  | ⬜     | domain Order tersendiri — rekam medis cukup _membaca_|
| 15  | **Resep Pasien** (Lyn)   | Order (REUSE)     | ✅  | ⬜  | ⬜     | MedicationRequest                                    |
| 16  | **Order Lab** (Lyn)      | Order (REUSE)     | ✅  | ⬜  | ⬜     | ServiceRequest (lab)                                 |
| 17  | **Order Radiologi** (Lyn)| Order (REUSE)     | ✅  | ⬜  | ⬜     | ServiceRequest (rad)                                 |
| 18  | **Rujukan Keluar** (Lyn) | Outcome/Disposisi | ✅  | ⬜  | ⬜     | referral keluar                                      |
| 19  | **Pasien Pulang** (Lyn)  | Outcome/Disposisi | ✅  | ⬜  | ⬜     | outcome episode (5 panel: sembuh/rujuk/APS/transfer/meninggal) |

> Beberapa tab berbagi satu domain (mis. TTV+Penilaian → Observation; Asesmen+Pemeriksaan → Assessment; Daftar/Resep/Lab/Rad → Order) → satu tabel/endpoint melayani >1 tab. Menyelesaikan satu domain bisa mencentang beberapa baris sekaligus.

## Keputusan terkunci (2026-06-07)

1. **Satu set tabel klinis lintas-unit** — keyed `kunjunganId`, di schema Postgres baru **`medicalrecord`**. BUKAN `igd_cppt`/`ri_cppt`. Komponen shared sudah membuktikan bentuk data seragam.
2. **Normalized & FHIR-mappable, bukan JSON blob** — kolom terstruktur untuk field queryable (kode diagnosa, level triase, skor); `text[]` untuk multi-select; `text` untuk narasi bebas. Adapter `toFhir*` ([TODOS_BACKEND.md](TODOS_BACKEND.md)) menyusul. Enum Postgres hanya untuk field keputusan-kritis (mis. `TriaseLevel`).
3. **Append-only / immutable** untuk catatan klinis (CPPT, Observation, Triase) — medico-legal/SNARS. Koreksi = addendum/baris baru; verifikasi DPJP = state-transition (co-sign), bukan edit. `kunjungan.*` denormalisasi = pointer ke baris terbaru.
4. **RBAC-first, ABAC-later** — endpoint pakai `clinical.*` RBAC sekarang; `requireScope`/`scopeBy(actor)` MUST sebelum akun klinis unit-scoped diaktifkan.
5. **Author dari `actor`** — `authorUserId`/`authorPegawaiId` dari token (server-side), nama denormalisasi untuk tampilan. Bukan free-text murni.
6. **Reuse Order** — Daftar/Resep/Lab/Rad = domain Order tersendiri, bukan bagian rekam medis.

## Urutan domain (prioritas)

1. **Triase** ← **domain pertama** (pintu masuk IGD, sebagian field sudah di spine, membuktikan pola E2E).
2. **Observation** (TTV + skor Penilaian) — shared, simpel, tanpa co-sign.
3. **CPPT** — tulang punggung dokumentasi + pola append-only & co-sign.
4. **Condition** (Diagnosa) — dibutuhkan billing/e-klaim hilir.
5. **Procedure** (Tindakan) — trigger charge billing.
6. Sisanya: Assessment · Consent · MedReconciliation · Handover · Outcome/Disposisi.

---

## Domain 1 — TRIASE 🚧

**Model `medicalrecord.Triase`** (append-only, keyed `kunjunganId`):

- Tiap simpan = baris immutable; re-triase = baris baru; latest by `createdAt` = current. `kunjungan.triaseLevel` (Int 1..4) = pointer/cache ke yang terbaru (sinkron dalam transaksi).
- Kolom terstruktur mirror `TriaseEntryForm` ([TriasePrimaryForm.tsx](src/components/igd/TriasePrimaryForm.tsx)): kedatangan · anamnesis · ABCDE primary survey · diagnosa sementara · tindakan triase · keputusan `TriaseLevel` (enum P1–P4) · PJ. Multi-select (`gejalaPenyerta`/`suaraNapasAbnormal`/`tindakanTriase`) = `text[]`. Author dari actor.
- **Dua pintu masuk, satu endpoint**: [TriaseTab](src/components/igd/tabs/TriaseTab.tsx) (dalam rekam medis) + [TriaseModal/IGDTriaseButton](src/components/igd/TriaseModal.tsx) (board/pendaftaran) → keduanya panggil endpoint yang sama.

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-07)

- [x] **A1** `prisma/schema/medicalrecord.prisma` — schema baru `medicalrecord`; enum `TriaseLevel`; model `Triase` (+ relasi balik `triase Triase[]` di `Kunjungan`). `"medicalrecord"` ditambah ke `schemas` di [config.prisma](prisma/schema/config.prisma).
- [x] **A2** migration `20260607150000_init_clinical_triase` (enum+tabel+index+FK→`encounter.kunjungan`) + rename `20260608120000_rename_clinical_to_medicalrecord` (`ALTER SCHEMA clinical RENAME TO medicalrecord`, data-preserving). Applied via `prisma migrate deploy` + `prisma generate`.
- [x] **A3** Zod [`src/lib/schemas/triase.ts`](src/lib/schemas/triase.ts) — `TriaseLevel`, `TriaseInput` (field wajib + opsional + `text[]`), `TriaseDTO`, `triaseLevelToInt`.
- [x] **A4** DAL [`src/lib/dal/triaseDal.ts`](src/lib/dal/triaseDal.ts) — `create(tx)` · `latestByKunjungan(tx)` + [`kunjunganDal.setTriaseLevel`](src/lib/dal/kunjunganDal.ts).
- [x] **A5** Service [`src/lib/services/triaseService.ts`](src/lib/services/triaseService.ts) — `save` = tx { insert + sync `triaseLevel` } · `getLatest` · validasi kunjungan ada & unit IGD · author dari actor.
- [x] **A6** Endpoint [`src/app/api/v1/kunjungan/[id]/triase/route.ts`](src/app/api/v1/kunjungan/[id]/triase/route.ts) — `GET` (`clinical.igd:read`) + `POST` 201 (`clinical.igd:create`).
- **DoD A:** ✅ `tsc` bersih · ✅ `migrate status` up-to-date. ⏳ smoke HTTP (POST/GET via curl) butuh dev server + token — belum dijalankan.

### Fase B — Wiring TriaseTab + resolver ✅ SELESAI (2026-06-08)

- [x] **B1** Client [`src/lib/api/triase.ts`](src/lib/api/triase.ts) — `getTriase(kunjunganId)` · `saveTriase(kunjunganId, input)` (tipe reuse dari schema server).
- [x] **B2** **Self-fetch di TriaseTab** (bukan via `igdDetailApi`/resolver) — `getTriase` saat mount bila `patient.id` = UUID → seed form penuh via `dtoToForm`. Keputusan: tab konsumsi DB sendiri → resolver tetap lean, `IGDPatientDetail` tak perlu di-extend. Pasien mock (non-UUID) → form awal dari `patient.triage/complaint` (perilaku demo dipertahankan).
- [x] **B3** [TriaseTab](src/components/igd/tabs/TriaseTab.tsx) — tombol "Simpan" → `saveTriase`; guard field wajib + Keputusan Triase; state loading/saving/error/savedAt; input "Waktu Triase" di-bind; banner demo utk pasien non-DB.
- [x] **B4** **Nama Perawat Triase = dropdown** — filter `profesi` ditambah ke list pegawai (`ListQuery`+`pegawaiDal.list`+service+`api/pegawai`); TriaseTab fetch `listPegawai({ profesi:"Perawat", aktif:"true" })` → `<select>` (sertakan nilai tersimpan walau perawat nonaktif). ⚠️ **Follow-up RBAC**: endpoint `GET /master/pegawai` di-gate `master.pegawai:read` — akun klinis (Perawat/Dokter) belum tentu punya izin itu saat live; perlu grant `master.pegawai:read` ke role klinis **atau** endpoint roster tenaga khusus (gate `clinical.*`). Tak memblok sekarang (akun klinis belum live; superadmin OK).
- **DoD B:** ✅ `tsc` bersih. ⏳ verifikasi in-browser (login superadmin): simpan dari tab → board IGD pasien itu tak lagi "Belum Triase"; re-triase → level ter-update; reload konsisten. *(HTTP smoke otomatis tak bisa dijalankan agen: `AUTH_ENFORCE=true` + kredensial tak tersedia.)*

### Fase B+ — Kriteria observasi terpilih (centang panduan) ✅ SELESAI (2026-06-08)

> Perawat/dokter mencentang item di "Tabel Kriteria Triase" (per protokol pilihan) sebagai tambahan observasi yang **ikut tersimpan & tercetak** bersama pengkajian. Pilih protokol (Default/Obgyn/dst) langsung di tab tanpa mengubah default master.

- [x] **BP1** Schema [`medicalrecord.prisma`](prisma/schema/medicalrecord.prisma) — `Triase` + `protocolId/Kode/Nama` (snapshot protokol panduan, nullable) + relasi `selectedCriteria`. Model anak baru **`TriaseCriteria`** = 1 baris/item dicentang, **SNAPSHOT** `parameterKode/Label · levelKode/Label · nilai` (+ `sourceCriteriaId` jejak lunak, `urutan`). TANPA FK riil ke `master.TriaseProtocolCriteria` (master di-replace tiap edit → append-only medico-legal). Cascade dari `Triase`.
- [x] **BP2** Migration `20260608170000_triase_criteria_selection` — `ALTER triase ADD protocol_*` + `CREATE TABLE triase_criteria` + FK cascade. Data-preserving (`migrate deploy` + `generate`).
- [x] **BP3** Zod/DTO [`schemas/triase.ts`](src/lib/schemas/triase.ts) — `TriaseCriteriaInput` (natural key parameter/level/nilai) · `TriaseInput` +`protocolId/Kode/Nama`+`selectedCriteria[]` · `TriaseCriteriaDTO` + `TriaseDTO` diperluas. DAL nested-create + `include` urut · Service map snapshot (`urutan`=posisi kirim) dalam tx yang sama. Endpoint tetap (field opsional mengalir lewat `TriaseInput`).
- [x] **BP4** [TriaseTab](src/components/igd/tabs/TriaseTab.tsx) — `CriteriaTable` jadi presentational: pemilih protokol (shared `Select`) + **checkbox per item kriteria** (key=`parameterKode|levelKode|nilai`), reset pilihan saat ganti protokol, default protokol setelah pengkajian DB termuat (anti-balapan), footer hitung terpilih. `dtoToForm` memulihkan protokol + centang.
- **DoD B+:** ✅ `tsc` bersih · ✅ `eslint` bersih · ✅ `migrate status` up-to-date. ⏳ verifikasi in-browser (centang → simpan → reload tetap tercentang). **Cetak (print template) = follow-up** — data sudah tersimpan & ter-DTO.

### Fase C — Satukan board/modal

- [ ] **C1** [TriaseModal/IGDTriaseButton](src/components/igd/TriaseModal.tsx) → endpoint yang sama; sinkron status board IGD.
- **DoD C:** triase dari board & dari tab menulis ke baris yang sama; satu source of truth.

---

## Domain 2 — OBSERVATION (TTV / tanda-tanda vital) 🚧

**Model `medicalrecord.Observation`** (append-only time-series, keyed `kunjunganId`, **shared** IGD/RI/RJ):

- Tiap simpan = baris immutable; **banyak baris per kunjungan** (monitoring berkala) — beda dari Triase (≈1 baris). Latest by `waktuObservasi` = TTV terkini. Tak ada cache di spine `Kunjungan` → tanpa transaksi (single insert).
- Kolom mirror `IGDVitalSigns` + `RITTVRecord` ([TTVTab.tsx](src/components/shared/medical-records/TTVTab.tsx)): TD sistolik/diastolik · nadi · respirasi · suhu · SpO₂ · GCS (E/V/M) · skala nyeri (NRS) · BB/TB opsional · `statusKesadaran` · `shift` opsional · `perawat`. **NEWS2 TIDAK disimpan** → derived di FE (hindari drift). `statusKesadaran`/`shift` = `TEXT` (vocab terkontrol divalidasi Zod; enum Postgres hanya field keputusan-kritis).

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-09)

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model `Observation` (+ relasi balik `observation Observation[]` di `Kunjungan`).
- [x] **A2** migration `20260608180000_init_observation` (tabel + index `(kunjungan_id, waktu_observasi)` + FK→`encounter.kunjungan` cascade). Applied via `prisma migrate deploy` + `prisma generate`.
- [x] **A3** Zod [`src/lib/schemas/observation.ts`](src/lib/schemas/observation.ts) — `ObservationInput` (vital flat + rentang fisiologis + `StatusKesadaran`/`RIShift` enum) · `ObservationDTO` (nested `vitalSigns` mirror FE) · `tanggal`/`jam` diturunkan dari `waktuObservasi`. **Batas bawah > 0** (TD≥40, nadi≥20, RR≥4, suhu≥25, SpO₂≥40) → field kosong (coerce `""`→0) GAGAL validasi, bukan diam-diam tersimpan 0 (anti-NEWS2 menyesatkan).
- [x] **A4** DAL [`src/lib/dal/observationDal.ts`](src/lib/dal/observationDal.ts) — `create(tx?)` · `listByKunjungan(tx?)` (terbaru dulu, **cap `LIST_LIMIT=100`** — cegah response gemuk saat monitoring berkala panjang RI).
- [x] **A5** Service [`src/lib/services/observationService.ts`](src/lib/services/observationService.ts) — `record` (append + derive shift bila kosong) · `list` · validasi kunjungan ada (tanpa batasan unit, TTV shared) · author dari actor. **Nama pencatat (`perawat`) diturunkan SERVER dari user login (actor→pegawai), BUKAN free-text** (integritas medico-legal); `input.perawat` jadi opsional/fallback saja.
- [x] **A6** Endpoint [`src/app/api/v1/kunjungan/[id]/observasi/route.ts`](src/app/api/v1/kunjungan/[id]/observasi/route.ts) — `GET` list (`clinical.igd:read`) + `POST` 201 (`clinical.igd:create`). Client [`src/lib/api/observation.ts`](src/lib/api/observation.ts).
- **DoD A:** ✅ `tsc` bersih · ✅ `migrate status` up-to-date · ✅ `eslint` 0 error (1 warning `_actor` — sama precedent Triase, sengaja utk ABAC). ⏳ smoke HTTP butuh dev server + token.
- ⚠️ **Follow-up RBAC:** endpoint di-gate `clinical.igd` (mirror Triase) — TTV **shared** RI/RJ, jadi sebelum akun klinis live perlu gate yang benar (perm `clinical.observation` baru **atau** per-unit). Tak memblok sekarang (superadmin OK; akun klinis belum live).

### Fase B — Wiring TTVTab ✅ SELESAI (2026-06-09)

- [x] **B1** Wrapper [igd/tabs/TTVTab.tsx](src/components/igd/tabs/TTVTab.tsx) self-fetch `listObservasi(patient.id)` saat mount bila UUID → seed `history` + `vitalSigns`/`statusKesadaran` dari item terbaru; loading banner; pasien mock → teruskan `patient.ttvHistory` (perilaku demo).
- [x] **B2** Shared [TTVTab](src/components/shared/medical-records/TTVTab.tsx) +prop opsional `onSave(payload)→Promise<RITTVRecord>` + `recordedBy` (+`TTVSavePayload`): bila diberi → mode DB (persist via `recordObservasi`, pakai record terpersist utk state, toast sukses/gagal, tombol loading); **field "Nama Perawat" jadi read-only "Dicatat oleh: <user login>"** (`recordedBy` dari `useSession().namaTampil`) — bukan free-text. Tanpa `onSave` → perilaku in-memory lama (RI/RJ mock dipertahankan, tak ada regresi). IGD wrapper rakit `waktuObservasi` dari jam observasi + tanggal lokal; shift IGD diturunkan backend dari jam, RI kirim shift terpilih.
- **DoD B:** ✅ `tsc` bersih · ✅ `eslint` bersih. Endpoint unit-agnostik → RI/RJ tinggal pasang `onSave` serupa saat dibutuhkan. ⏳ verifikasi in-browser (login superadmin): catat TTV dari tab pasien IGD DB → muncul di timeline + tersimpan; reload konsisten.

---

## Domain 3 — ASSESSMENT (Asesmen Medis) 🚧

Tab **Asesmen Medis** = 5 sub-menu ([AsesmenMedisTab.tsx](src/components/igd/tabs/AsesmenMedisTab.tsx)): **Anamnesis** · Riwayat Medis · Alergi · Skrining Gizi · Edukasi. Dikerjakan **per sub-menu** (tabel terpisah, bukan satu blob) — mulai dari Anamnesis.

### Sub 3.1 — ANAMNESIS · Fase A (schema → endpoint) ✅ SELESAI (2026-06-09)

**Model `medicalrecord.Anamnesis`** (append-only "latest wins" ≈1 baris/kunjungan, keyed `kunjunganId`, shared IGD/RI/RJ): asesmen medis awal (AP 1.1) — dilakukan saat intake, koreksi = baris baru, latest by `createdAt` = berlaku.

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model `Anamnesis` (+ relasi balik `anamnesis Anamnesis[]` di `Kunjungan`). Kolom mirror `AnamnesisIGDForm` ([AnamnesisPane](src/components/igd/tabs/AsesmenMedisTab.tsx)): `sumberAnamnesis` · `keluhanUtama` · `rps` · `onsetDurasi?` · `mekanismeCedera?` · `faktorPemberat?` · `faktorPeringan?` · `statusGeneralis` · `obatSaatIni?` + `pemeriksa`/author. `sumberAnamnesis` = `TEXT` (vocab terkontrol divalidasi Zod).
- [x] **A2** migration `20260609120000_init_anamnesis` (tabel + index `(kunjungan_id, created_at)` + FK→`encounter.kunjungan` cascade). Applied via `migrate deploy` + `generate`.
- [x] **A3** Zod [`src/lib/schemas/asesmenMedis/anamnesis.ts`](src/lib/schemas/asesmenMedis/anamnesis.ts) — `SumberAnamnesis` enum · `AnamnesisInput` (wajib: sumber/keluhan/RPS/status generalis; sisanya opsional) · `AnamnesisDTO` mirror FE. **`faktorPeringan` membetulkan typo form FE `faktorPemerut`** → di-map saat wiring. `rps` (abbr. baku) dipertahankan.
- [x] **A4** DAL [`src/lib/dal/asesmenMedis/anamnesisDal.ts`](src/lib/dal/asesmenMedis/anamnesisDal.ts) — `create(tx?)` · `latestByKunjungan(tx?)`.
- [x] **A5** Service [`src/lib/services/asesmenMedis/anamnesisService.ts`](src/lib/services/asesmenMedis/anamnesisService.ts) — `save` (append) · `getLatest` · validasi kunjungan ada (tanpa batasan unit, shared) · **`pemeriksa` diturunkan dari user login (actor→pegawai)**, bukan free-text.
- [x] **A6** Endpoint [`src/app/api/v1/kunjungan/[id]/anamnesis/route.ts`](src/app/api/v1/kunjungan/[id]/anamnesis/route.ts) — `GET` (`clinical.igd:read`) + `POST` 201 (`clinical.igd:create`). Client [`src/lib/api/asesmenMedis/anamnesis.ts`](src/lib/api/asesmenMedis/anamnesis.ts).
- **DoD A:** ✅ `tsc` bersih · ✅ `migrate status` up-to-date · ✅ `eslint` 0 error (1 warning `_actor` — sama precedent, sengaja utk ABAC). ⏳ smoke HTTP butuh dev server + token.
- ⚠️ **Follow-up RBAC:** di-gate `clinical.igd` (mirror Triase/TTV) — asesmen **shared** RI/RJ; gate yang benar (perm baru / per-unit) sebelum akun klinis live. Tak memblok sekarang (superadmin OK).

### Sub 3.1 — ANAMNESIS · Fase B (wiring AnamnesisPane) ✅ SELESAI (2026-06-09)

- [x] **B1** [AnamnesisPane](src/components/igd/tabs/AsesmenMedisTab.tsx) self-fetch `getAnamnesis(patient.id)` saat mount bila UUID → seed form via `dtoToAnamnesisForm` (map `dto.faktorPeringan → form.faktorPemerut`); loading banner; pasien mock (non-UUID) → form awal dari `patient.*` (perilaku demo). `onComplete` = `setDoneAnamnesis` (setState stabil → aman di effect deps).
- [x] **B2** Tombol "Simpan Anamnesis" → `saveAnamnesis` (map `form.faktorPemerut → faktorPeringan`); guard field wajib (sumber/keluhan/RPS/status generalis); toast sukses; state loading/saving/error/savedAt; **nama pemeriksa read-only "Dicatat oleh: <user login>"** dari `useSession().namaTampil`; pasien demo → blok simpan + banner.
- **DoD B:** ✅ `tsc` bersih · ✅ `eslint` bersih (1 warning pre-existing `TI` unused, tak terkait). ⏳ verifikasi in-browser (login superadmin): isi & simpan anamnesis pasien IGD DB → reload tetap terisi; progress header sub-tab "Anamnesis" jadi hijau.

### Sub 3.2 — RIWAYAT MEDIS (9 pane) 🚧

> **Keputusan:** tiap pane = domain/tabel sendiri, prefix **`asesmen_`**, endpoint dikelompokkan di `/kunjungan/:id/asesmen/<pane>`. Single-record → append-only "latest wins" (pola Anamnesis). Pane berdaftar → parent + child snapshot (pola Triase+TriaseCriteria). Helper nama pencatat diekstrak ke [`actorName.ts`](src/lib/services/actorName.ts) (dipakai semua domain klinis).
>
> **Konvensi folder lib (2026-06-09, berlaku domain baru):** dikelompokkan **per TAB** di dalam tiap layer, **nama file dipertahankan** → `lib/schemas/asesmenMedis/<fitur>.ts` · `lib/dal/asesmenMedis/<fitur>Dal.ts` · `lib/services/asesmenMedis/<fitur>Service.ts` · `lib/api/asesmenMedis/<fitur>.ts`. Tab Asesmen Medis (anamnesis + 5 pane) sudah dimigrasi ke `asesmenMedis/`; triase/observation + domain lama dibiarkan (konvensi maju ke depan). Helper lintas-domain (mis. `actorName`) tetap di root layer-nya. Route `app/api/**` ikut URL (tak terpengaruh).

| # | Pane | Tabel | Bentuk | BE | Wiring |
|---|---|---|---|---|---|
| 1 | Penyakit Dahulu | `asesmen_penyakit_dahulu` | single (penyakit `text[]` + catatan) | ✅ | ✅ |
| 2 | Pemberian Obat | `asesmen_obat` (+item) | list | ✅ | ✅ |
| 3 | Lainnya (merokok/paparan/gaya hidup) | `asesmen_gaya_hidup` | single | ✅ | ✅ |
| 4 | Faktor Resiko | `asesmen_faktor_resiko` | single (2× `text[]`) | ✅ | ✅ |
| 5 | Penyakit Keluarga | `asesmen_penyakit_keluarga` (+item) | list/anggota | ✅ | ✅ |
| 6 | Tuberkulosis | `asesmen_tuberkulosis` | single | ✅ | ✅ |
| 7 | Ginekologi | `asesmen_ginekologi` | single | ✅ | ✅ |
| 8 | Perawatan & Tindakan | `asesmen_perawatan` (+rawat & pembedahan item) | 2 list | ✅ | ✅ |
| 9 | Obstetri | `asesmen_obstetri` (+persalinan item) | single+list | ✅ | ✅ |

- [x] **Pane 1 — Penyakit Dahulu · Fase A** ✅ (2026-06-09) — model `AsesmenPenyakitDahulu` + migration `20260609130000_init_asesmen_penyakit_dahulu` + Zod/DAL/Service/Route/Client. Pakai helper `resolveActorNama`. `tsc`+`migrate` ✅. Wiring ⬜.
- [x] **Batch 1 — Pane 3·4·6·7 single-record · Fase A** ✅ (2026-06-09) — Gaya Hidup · Faktor Resiko · Tuberkulosis · Ginekologi. Migration `20260609140000_init_asesmen_riwayat_single` (4 tabel) + Zod/DAL/Service/Route/Client per pane (endpoint `/kunjungan/:id/asesmen/{gaya-hidup,faktor-resiko,tuberkulosis,ginekologi}`). Field opsional (form tanpa wajib); `boolean` nullish (YesNoRadio bisa null). `tsc`+`migrate` ✅. Wiring ⬜.
- [x] **Batch 2 — Pane 2·5·8·9 list · Fase A** ✅ (2026-06-09) — Pemberian Obat · Penyakit Keluarga · Perawatan&Pembedahan · Obstetri. **Parent + child snapshot** (pola Triase+TriaseCriteria), append-only "latest wins", nested-create atomik (tanpa transaction eksplisit). Migration `20260609150000_init_asesmen_riwayat_list` (9 tabel: 4 parent + 5 child). Zod/DAL/Service/Route/Client di `asesmenMedis/` (endpoint `/kunjungan/:id/asesmen/{obat,penyakit-keluarga,perawatan,obstetri}`). `tsc`+`migrate` ✅. **→ Riwayat Medis BE 9/9 pane SELESAI.**
- [x] **Wiring 9/9 pane · Fase B** ✅ SELESAI (2026-06-09) — semua pane di inline `RiwayatPane` ([AsesmenMedisTab.tsx](src/components/igd/tabs/AsesmenMedisTab.tsx)) ter-wire: `useSession` + UUID-guard `isPersisted` (mock `igd-*` tak hit DB), load latest via `getX`, save via `saveX` + **toast sukses**, footer reusable `SaveRwyFooter` ("Dicatat oleh" dari user login + status tersimpan/error + Loader2). Map field FE↔DTO diterapkan (Obstetri `kbKet→kbKeterangan`/`ancUsia→ancUsiaKehamilan`/`ancKet→ancCatatan`/`usiaKeh→usiaKehamilan`; Anamnesis `faktorPemerut→faktorPeringan`; list-pane filter baris kosong sebelum POST). `SaveRwyBtn`/`TI` mati dihapus. `tsc`+`eslint` ✅. **Catatan:** shared `RiwayatPane.tsx` (dipakai RI/RJ) belum di-wire — IGD pakai salinan inline-nya sendiri.

### Sub 3.3 — ALERGI · Fase A + B ✅ SELESAI (2026-06-09)

> **Keputusan arsitektur (penting — DEVIASI dari pola snapshot):** Alergi = **daftar hidup** (FHIR `AllergyIntolerance`-aligned), BUKAN snapshot point-in-time seperti pane asesmen lain. Model **per-item**: 1 baris = 1 alergen, mutable, soft-delete. Tulis hanya delta (tambah=1 INSERT, hapus=1 soft-delete) — bukan foto-ulang seluruh daftar tiap simpan (cegah resource membengkak). **Scope per-kunjungan** untuk sekarang (bisa pindah `pasienId` bila dipakai lintas-kunjungan untuk alert farmasi/e-resep). Latar diskusi: model snapshot awal (parent+child append) ditolak user karena re-save menumpuk baris.

- [x] **A — Backend** ✅ — model `medicalrecord.AsesmenAlergi` (per-item: category/allergen/reactions[]/severity/status, `version`+`updatedAt`+`deletedAt`) + `AsesmenAlergiNka` (header per-kunjungan, assertion NKA, unik `kunjunganId`). Migrations: `20260609160000_init_asesmen_alergi` (snapshot awal) → `20260609170000_alergi_per_item` (drop-replace ke per-item) → `20260609180000_rename_alergi_tables` (rename `alergi`→`asesmen_alergi`, `alergi_asesmen`→`asesmen_alergi_nka` agar konsisten keluarga `asesmen_*`). Zod/DAL/Service/Route/Client di `asesmenMedis/`. **Per-aksi REST:** `GET` (daftar aktif+NKA) · `POST` (tambah 1) · `PATCH` (set NKA) `/kunjungan/:id/asesmen/alergi` + `DELETE /…/alergi/:itemId` (soft-delete + guard kepemilikan). NKA & daftar saling eksklusif (divalidasi Service). `tsc`+`migrate`+`eslint` ✅.
- [x] **B — Wiring (per-aksi, AllergyPane inline IGD)** ✅ — `useSession` + UUID-guard `isPersisted`. **Tambah** → POST langsung; **Hapus** → `ConfirmDialog` (reuse master/ruangan) → soft-delete; **Toggle NKA** → PATCH langsung (guard: tak bisa ON bila ada alergi). Tombol "Simpan" bulk **dihapus** (per-aksi). "Dicatat oleh" dari user login. Pasien mock → operasi lokal (demo). `tsc`+`eslint` ✅.
- ⚠️ Shared `AllergyPane.tsx` (RI/RJ) belum di-wire — IGD pakai salinan inline-nya (sama precedent Riwayat).

### Sub 3.4 — SKRINING GIZI (MUST) · Fase A + B ✅ SELESAI (2026-06-09)

**Model `medicalrecord.AsesmenGizi`** (append-only time-series — point-in-time screening AP 1.3, BANYAK baris/kunjungan = riwayat skrining berkala). Mirror `GiziHistoryEntry`+`GiziState` ([GiziPane](src/components/shared/asesmen/GiziPane.tsx)).

- [x] **A — Backend** ✅ — model `AsesmenGizi` (3 skor MUST `skorBmi/skorBb/skorAkut` + ahliGizi/catatan/tanggal + petugas/author) + backref Kunjungan. Migration `20260609190000_init_asesmen_gizi`. Zod/DAL (`create`+`listByKunjungan` cap 100)/Service/Route/Client di `asesmenMedis/`. **Total & tingkat risiko = DERIVED di Service** (tak disimpan — prinsip sama NEWS2 Observation). Endpoint `GET` (riwayat) + `POST` (append) `/kunjungan/:id/asesmen/gizi`. Petugas dari actor. `tsc`+`migrate`+`eslint` ✅.
- [x] **B — Wiring (GiziPane SHARED, pola TTVTab)** ✅ — prop opsional `kunjunganId` (UUID→mode DB) + `recordedBy`. Mode DB: self-fetch riwayat saat mount, Simpan→POST append→prepend ke riwayat, "Nama Petugas" read-only (user login), banner loading/error + tombol spinner. RI/RJ (hanya `noRM`) → perilaku demo dipertahankan (tanpa regresi). `tsc`+`eslint` ✅.

### Sub 3.5 (Edukasi) — ⬜ BELUM

> Edukasi ([EdukasiPane](src/components/igd/tabs/EdukasiPane.tsx)) — slice terakhir tab Asesmen Medis. HPK 2.

---

## Catatan

- ABAC `requireScope` (unit-scope) = slice terpisah, MUST sebelum akun klinis unit-scoped live ([TECH_DEBT.md](TECH_DEBT.md#-auth--rbac-security) §🔑).
- Real-time board (commit + SSE) menggantikan `workflowStore` client-side — di luar slice rekam medis (lihat Key Architecture Decisions di [CLAUDE.md](CLAUDE.md)).
- Audit/access-log catatan sensitif (CPPT/diagnosa) — TODOS_BACKEND §security; desain tabel klinis sudah siapkan kolom audit.
