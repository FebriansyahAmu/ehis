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
| **MedReconciliation** | Rekonsiliasi                                                          | ✅         | HAM badge; append-only snapshot per fase + Riwayat                                      |
| **NursingCare**       | Keperawatan (asuhan keperawatan SDKI/SLKI/SIKI)                       | ✅         | proses keperawatan; bisa berbagi pola CPPT                                              |
| **Handover**          | Serah Terima (SBAR)                                                   | ✅         | **BE ✅** closed-loop (terima-stamp); TTV tidak disimpan (single-source Observation)     |
| **Order** (REUSE)     | Daftar Order · Resep · Order Lab · Order Rad                          | ✅         | **domain Order tersendiri** (`ORDERS_MOCK` single source) — rekam medis cukup _membaca_ |
| **Outcome/Disposisi** | Pasien Pulang · Rujukan Keluar · Penandaan Gambar                     | IGD-only   | **Disposisi BE ✅** (Pasien Pulang = Selesaikan Kunjungan + lock); outcome episode      |

\* "IGD-only" = wrapper di folder `igd/`, domainnya tetap sama → **satu** tabel lintas-unit.

## Pelacak 19 Tab IGD (status backend per-tab)

Urutan persis seperti di [IGDRecordTabs.tsx](src/components/igd/IGDRecordTabs.tsx) (Rekam Medis 13 + Layanan 6). **FE 19/19 ✅** (mock). Yang dilacak di sini = **backend**: kolom **BE** (schema+DAL+service+endpoint, ~Fase A) & **Wiring** (resolver + tab konsumsi DB, ~Fase B/C).
Legenda: 🟢 selesai · 🟡 sebagian · ⬜ belum.

**Status global backend: 15/19 dimulai** (+ **Resep Pasien BE+wiring ✅ 2026-06-19** — `medicalrecord.ResepOrder`+`ResepItem` tabel sendiri + `POST/GET /kunjungan/:id/resep` + worklist `GET /farmasi/resep` + depo dropdown `GET /master/lokasi-farmasi`; submit IGD/RI/RJ → muncul di Worklist Farmasi) (+ Pemeriksaan Fisik Fase A+B ✅ IGD 2026-06-14, + Keperawatan Fase A+B+C ✅ 2026-06-14, + Rekonsiliasi Fase A+B ✅ 2026-06-13) (**Pemeriksaan Fisik/Assessment BE+wiring ✅ IGD** — `medicalrecord.PemeriksaanFisik` append-only "latest wins" + sub **Anatomi = `medicalrecord.PenandaanAnatomi`** (daftar hidup body-map, toggle→create/soft-delete, catatan→update), gate `clinical.pemeriksaan` (r/c/u/d Dokter+Perawat), meta waktu=DateTimePicker + dokter=roster ruangan (`/kunjungan/:id/petugas`) + perawat=sesi login, +Mobilitas +Catatan generalis +Temuan manual, head-to-toe IGD (RI/RJ per-sistem ditunda → TECH_DEBT), wired tab Pemeriksaan IGD (Fisik+Anatomi); **Keperawatan/NursingCare BE+wiring ✅** — `medicalrecord.AsuhanKeperawatan` CRUD + verify co-sign + **evaluasi shift = tabel anak `AsuhanEvaluasi`** (append-only + endpoint `/asuhan-keperawatan/:itemId/evaluasi`), gate `clinical.keperawatan` (resource baru, Perawat penulis utama), template asuhan dari DB `master.sdki` via endpoint klinis `sdki-template`, tanggal+evaluasi DateTimePicker + shift Select + perawat sesi login, wired tab Keperawatan IGD; Triase BE ✅ + wiring tab ✅; Observation/TTV BE ✅ + wiring tab ✅; **Asesmen Medis BE+wiring ✅ LENGKAP** — 5/5 sub-menu: Anamnesis + Riwayat Medis (9/9 pane) + Alergi + Skrining Gizi + Edukasi (3/3: Pasien & Keluarga · Emergency · End of Life); **Diagnosa BE+wiring ✅**; **CPPT BE+wiring ✅** — append-only per-item + co-sign DPJP + SBAR/TBAK (SKP 2), wired IGD/RI/RJ; **Tindakan/Procedure BE+wiring ✅** — `medicalrecord.TindakanMedis` snapshot biaya + CRUD optimistik, tab Tindakan IGD persist saat kunjunganId UUID; **Consent/Informed Consent BE+wiring ✅** — `medicalrecord.InformedConsent` per-item immutable (add/delete) + TTD PNG base64, RBAC leaf `clinical.consent`, redesign FE (tindakan katalog + dokter roster + DateTimePicker gabungan), wired IGD/RI/RJ; **Rekonsiliasi/MedReconciliation BE+wiring ✅** — `medicalrecord.Rekonsiliasi`+`RekonsiliasiObat` append-only snapshot per fase, gate `clinical.resep`, sub-menu Riwayat + obat dari Formularium + DateTimePicker + petugas dari sesi, wired IGD/RI; **Penandaan Gambar BE+wiring ✅** (`medicalrecord.PenandaanGambar` body-diagram per-item add/delete-only soft-delete, gate `clinical.pemeriksaan` reuse, wired IGD); **Serah Terima/Handover BE+wiring ✅ (2026-06-16)** — `medicalrecord.SerahTerima` closed-loop SBAR (tambah=INSERT · terima=UPDATE-stamp sekali · hapus=soft-delete; gate `clinical.keperawatan`; **TTV tidak disimpan** single-source Observation; wired shared IGD/RI); **Pasien Pulang/Disposisi BE+wiring ✅ (2026-06-16, "Selesaikan Kunjungan")** — `medicalrecord.Disposisi` atomik via transisi `complete` (gate Diagnosa Utama + `selesaiAt`/`selesaiPertamaAt` + `lockedAt` lock nyata di `route()` + `reopen`/Batal Selesai + `alasanReopen`; authz klinis; board "Selesai Hari Ini"); sisa Triase Fase C + 3 tab Layanan #14/16/17 + #18 Rujukan ⬜ (Resep #15 ✅ DB-backed)).

| #   | Tab (grup)               | Domain target     | FE  | BE  | Wiring | Catatan                                              |
| --- | ------------------------ | ----------------- | --- | --- | ------ | ---------------------------------------------------- |
| 1   | **Triase** (RM)          | Triase            | ✅  | 🟢  | 🟡     | Fase A ✅ + Fase B tab ✅; sisa Fase C (modal/board)  |
| 2   | **TTV** (RM)             | Observation       | ✅  | 🟢  | 🟢     | Fase A ✅ (schema+endpoint) + Fase B ✅ (wiring TTVTab) |
| 3   | **Asesmen Medis** (RM)   | Assessment        | ✅  | 🟢  | 🟢     | LENGKAP 5/5: Anamnesis + Riwayat (9/9) + Alergi + Skrining Gizi + Edukasi (3/3) ✅ (shared RI/RJ pane belum di-wire) |
| 4   | **Diagnosa** (RM)        | Condition         | ✅  | 🟢  | 🟢     | Fase A+B ✅ (ICD-10 + prosedur ICD-9; per-item; DiagnosaTab shared wired IGD/RI/RJ) |
| 5   | **CPPT / SOAP** (RM)     | CPPT              | ✅  | 🟢  | 🟢     | Fase A+B ✅ (per-item; SOAP/SBAR/TBAK SKP 2; co-sign DPJP; CPPTTab shared wired IGD/RI/RJ) |
| 6   | **Tindakan IGD** (RM)    | Procedure         | ✅  | 🟢  | 🟢     | Fase A+B ✅ (`medicalrecord.TindakanMedis` snapshot biaya; CRUD optimistik; wired). Charge billing hilir; ICD-9-CM coding ada di `DiagnosaProsedur` (#4) |
| 7   | **Informed Consent** (RM)| Consent           | ✅  | 🟢  | 🟢     | Fase A+B ✅ (`medicalrecord.InformedConsent` per-item immutable + TTD PNG base64; gate `clinical.consent`; wired IGD/RI/RJ). PMK 290/2008 |
| 8   | **Rekonsiliasi** (RM)    | MedReconciliation | ✅  | 🟢  | 🟢     | Fase A+B ✅ (`medicalrecord.Rekonsiliasi`+child append-only per fase; gate **`clinical.rekonsiliasi`** dipisah dari resep → Dokter/Perawat/Apoteker create; sub-menu Riwayat; obat dari Formularium; wired IGD/RI). HAM badge; SNARS PP 3.1/SKP 3 |
| 9   | **Keperawatan** (RM)     | NursingCare       | ✅  | 🟢  | 🟢     | Fase A+B+C ✅ (`medicalrecord.AsuhanKeperawatan` CRUD + verify co-sign; **evaluasi shift = tabel anak `AsuhanEvaluasi`** append-only + endpoint sendiri; gate **`clinical.keperawatan`** Perawat penulis utama; wired IGD). Template dari **DB `master.sdki`** via `sdki-template` (gate klinis). tanggal+evaluasi=DateTimePicker · shift=Select · perawat=sesi login. SDKI/SLKI/SIKI PPNI |
| 10  | **Pemeriksaan** (RM)     | Assessment        | ✅  | 🟢  | 🟢     | Fase A+B+C+D ✅ IGD (`medicalrecord.PemeriksaanFisik` append-only "latest wins" + sub **Anatomi = `medicalrecord.PenandaanAnatomi`** daftar hidup + sub **Penunjang = `medicalrecord.PemeriksaanPenunjang`** diagnostik bedside non-Lab/Rad; gate **`clinical.pemeriksaan`** r/c/u/d Dokter+Perawat; wired IGD). Meta: waktu=DateTimePicker · dokter=roster ruangan (`/kunjungan/:id/petugas`) · perawat=sesi login. +Mobilitas +Catatan generalis +Temuan manual + body-map persist + penunjang interpretatif. IGD head-to-toe (RI/RJ per-sistem = TECH_DEBT). SNARS AP 1 |
| 11  | **Penilaian** (RM)       | Penilaian (`penilaian_*`) | 🚧  | 🟡  | 🟡     | **Reframe (2026-06-15):** tiap sub-menu = tabel `penilaian_*` sendiri (BUKAN Observation). Gate **`clinical.penilaian`** (r/c, append-only). **Fisik ✅** (`medicalrecord.PenilaianFisik`, wired IGD). **Nyeri ✅** (`medicalrecord.PenilaianNyeri` = asesmen komprehensif PQRST; **skor NRS single source = TTV/Observation** read-only, bukan disimpan ulang; `/kunjungan/:id/penilaian-nyeri` GET/POST, wired IGD). **Status ✅** (`medicalrecord.PenilaianStatus` + `/kunjungan/:id/penilaian-status` GET/POST, wired IGD; mock riwayat dihapus). **Pediatrik ✅** (`medicalrecord.PenilaianPediatrik` + `/kunjungan/:id/penilaian-pediatrik` GET/POST, wired IGD). **Diagnosis DI-DROP** (redundan tab Diagnosa+CPPT). Sisa: Morse/Braden/Barthel/Jantung/Kanker (skala risiko tarik master) |
| 12  | **Penandaan Gambar** (RM)| Outcome/Annotation| ✅  | 🟢  | 🟢     | body-diagram markup. **Citra nyata + Draw (2026-06-15):** bagan = **PNG anatomi nyata anterior** per jenis kelamin (Laki-laki/Perempuan, `/public/anatomy/*`, transparan di atas backdrop imaging gelap) di [BodyMap2D.tsx](src/components/igd/tabs/penandaan/BodyMap2D.tsx) + **zoom/geser**; **2 alat — Pin (titik) & Draw (coretan bebas SVG, merah)** keduanya + keterangan/severitas + deteksi regio % via [bodyChart.regionAt()](src/components/igd/tabs/penandaan/bodyChart.ts) (kalibrasi citra, sisi pasien). Anak **ditunda**; proyeksi posterior tak ada (citra anterior saja). Three.js TETAP terpasang. Odontogram FDI tak berubah. **BE ✅ (2026-06-15):** `medicalrecord.PenandaanGambar` (daftar hidup per-item: koordinat % + `path` JSONB coretan + region/label/severitas snapshot; add/delete-only soft-delete, TANPA edit) + `/kunjungan/:id/penandaan-gambar` GET/POST + `/:itemId` DELETE (layered, gate **`clinical.pemeriksaan`** reuse — body-map = dokumentasi pemeriksaan, selaras PenandaanAnatomi). **Wiring ✅ IGD (2026-06-15):** [PenandaanGambarTab](src/components/igd/tabs/PenandaanGambarTab.tsx) muat saat mount (UUID-guard) · simpan per-item POST (form Anotasi) · hapus DELETE · Reset = bulk-delete per model; pasien demo (non-UUID) tetap state lokal; pemeriksa=sesi login; "Simpan Semua" dihapus (persist per-item). |
| 13  | **Serah Terima** (RM)    | Handover          | ✅  | 🟢  | 🟢     | **BE+wiring ✅ (2026-06-16):** `medicalrecord.SerahTerima` (daftar hidup per kunjungan; tambah=INSERT · **terima=UPDATE-stamp sekali** guard `perawat_masuk=''` anti double-terima · hapus=soft-delete) + `/kunjungan/:id/serah-terima` GET/POST + `/:itemId` PATCH(Terima)/DELETE (layered, gate **`clinical.keperawatan`**). **Closed-loop SBAR**: perawat keluar=sesi login menyusun → perawat masuk **Terima** (penerima=actor server, jam WIB distempel). `tanggal/jam`=string FE · `created_at/received_at`=anchor timestamptz. **TTV TIDAK disimpan** (single-source Observation; auto-populate dihapus). Wired shared IGD/RI (UUID-guard; demo non-UUID lokal). |
| 14  | **Daftar Order** (Lyn)   | Order (REUSE)     | ✅  | ⬜  | ⬜     | domain Order tersendiri — rekam medis cukup _membaca_|
| 15  | **Resep Pasien** (Lyn)   | MedicationRequest | ✅  | 🟢  | 🟢     | **BE+wiring ✅ (2026-06-19):** `medicalrecord.ResepOrder` (header) + `ResepItem` (baris) append-only — **tabel sendiri, BUKAN domain Order generik** (Daftar/Lab/Rad tetap mock). `POST/GET /kunjungan/:id/resep` (gate `clinical.resep` create/read) + worklist `GET /farmasi/resep` (gate `ancillary.farmasi.telaah`). Depo = dropdown **lokasi kategori Farmasi** master (`GET /master/lokasi-farmasi`, gate `clinical.resep:read`, reuse `ruanganService.listRuanganByType("Farmasi")`; fallback `DEPO_OPTIONS`). Submit POST saat kunjunganId UUID (IGD [ResepPasienTab](src/components/igd/tabs/ResepPasienTab.tsx) + shared [ResepPane](src/components/shared/medical-records/resep/ResepPane.tsx)) → **muncul di Worklist Farmasi** ([FarmasiBoard](src/components/farmasi/FarmasiBoard.tsx) fetch + `mapDbResepOrder` digabung di depan order mock). **Panduan Aturan Resep dihapus.** FE decision-support (2026-06-18) tetap: Select global · Dosis sekali minum · peringatan alergi obat sadar-golongan · 3 dropdown kondisi klinis · no. kontak DPJP. **TTE + Cetak + Doctor-gate ✅ (2026-06-19, IGD):** hanya dokter (`can(clinical.resep:create)`) yang bisa order (tombol "Tanda Tangani & Order"); resep **auto-TTE saat create** (kolom `tteToken`/`tteSignedBy`/`tteSignedAt`, mock always-success) → **barcode TTE** + **preview cetak A4 modern** ([TteBarcode](src/components/shared/resep/TteBarcode.tsx) · [ResepCetakTemplate](src/components/shared/resep/ResepCetakTemplate.tsx) · [ResepCetakModal](src/components/shared/resep/ResepCetakModal.tsx)). **Cari Obat → DB ✅ (2026-06-19, IGD+RI/RJ):** `GET /master/obat-tersedia` (ter-formularium, gate clinical.resep:read; fallback `OBAT_CATALOG` mock bila formularium kosong) gantikan mock hardcode. Follow-up → TECH_DEBT: panel **Riwayat Resep masih mock** (endpoint `listResep` belum dikonsumsi); **TTE+cetak baru IGD** (RI/RJ belum); status workflow Farmasi belum persist utk order DB (board read-only); `bzaKode` belum dibawa dari item IGD |
| 16  | **Order Lab** (Lyn)      | Order (REUSE)     | ✅  | ⬜  | ⬜     | ServiceRequest (lab)                                 |
| 17  | **Order Radiologi** (Lyn)| Order (REUSE)     | ✅  | ⬜  | ⬜     | ServiceRequest (rad)                                 |
| 18  | **Rujukan Keluar** (Lyn) | Outcome/Disposisi | ✅  | ⬜  | ⬜     | referral keluar                                      |
| 19  | **Pasien Pulang** (Lyn)  | Outcome/Disposisi | ✅  | 🟢  | 🟢     | **"Selesaikan Kunjungan" BE+wiring ✅ (2026-06-16):** `medicalrecord.Disposisi` (append latest-wins; jenis Pulang/Rawat_Inap/Rujuk/Meninggal/APS + per-jenis blok) ditulis **atomik** via transisi `complete` (gate ≥1 Diagnosa Utama Pasti → tulis Disposisi → set `selesaiAt` efektif + `selesaiPertamaAt` immutable + `lockedAt` + pointer + lepas bed). **Lock nyata**: `route()` choke-point tolak tulis `clinical.*` saat terkunci (baca lolos) + FE blur/disable. **Batal Selesai** (`reopen`): buka kunci + `alasanReopen`, timestamp dipertahankan. Authz klinis (Dokter/Perawat). 2 pintu: tombol header (SelesaikanDialog mini-form + konfirmasi ekstra) + tab Pasien Pulang. Board **"Selesai Hari Ini"** → rekam medis read-only. Roadmap [TODO-SELESAI-KUNJUNGAN.md](TODO-SELESAI-KUNJUNGAN.md). Follow-up: detail per-jenis panel + deep-link RI |

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
- [x] **B4** **Nama Perawat Triase = dropdown** — filter `profesi` ditambah ke list pegawai (`ListQuery`+`pegawaiDal.list`+service+`api/pegawai`); TriaseTab fetch `listPegawai({ profesi:"Perawat", aktif:"true" })` → `<select>` (sertakan nilai tersimpan walau perawat nonaktif). ✅ **Follow-up RBAC RESOLVED (2026-06-11)**: TriaseTab kini ambil roster via endpoint khusus [`GET /kunjungan/:id/petugas`](src/app/api/v1/kunjungan/[id]/petugas/route.ts) (gate `registration.kunjungan:read`, DTO nama+profesi saja) — **bukan** `master.pegawai:read`. `listPegawai` (gate `master.pegawai`) kini hanya dipakai halaman Master (SDMAssignment/Pengguna). Lihat [TODO-RBAC-MODUL.md](TODO-RBAC-MODUL.md) Fase 4a.
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

### Sub 3.5 — EDUKASI (HPK 2) · 3/3 sub-pane ✅ SELESAI (2026-06-10)

Tab Edukasi = 3 sub-pane ([EdukasiPane](src/components/igd/tabs/EdukasiPane.tsx)): **Pasien & Keluarga** · Emergency · End of Life. Tiap sub-pane = domain/tabel sendiri (prefix `asesmen_edukasi_`).

| Sub-pane | Tabel | Bentuk | BE | Wiring |
|---|---|---|---|---|
| Pasien & Keluarga | `asesmen_edukasi_pasien` | log (append + soft-delete) | ✅ | ✅ |
| Emergency | `asesmen_edukasi_emergency` | log (append + soft-delete) | ✅ | ✅ |
| End of Life | `asesmen_edukasi_eol` + `asesmen_edukasi_eol_meeting` | plan latest-wins + log meeting | ✅ | ✅ |

- [x] **Pasien & Keluarga · Fase A + B** ✅ (2026-06-09/10) — model `AsesmenEdukasiPasien` (append-only log + `deletedAt` soft-delete) + backref. Migrations `20260609200000_init_asesmen_edukasi_pasien` + `20260610120000_edukasi_pasien_soft_delete`. Zod/DAL/Service/Route/Client di `asesmenMedis/`. **Per-aksi:** `GET` (riwayat) · `POST` (append) `/kunjungan/:id/asesmen/edukasi/pasien` + `DELETE /…/pasien/:itemId` (soft-delete + guard kepemilikan). Field terstruktur disimpan utuh; FE menyusun teks penerima/waktu. **Wiring** `PasienKeluargaPane` (inline IGD): self-fetch riwayat, Simpan→POST, **icon hapus + ConfirmDialog** (soft-delete), petugas read-only (user login), banner loading/error. Mock → demo lokal. `tsc`+`migrate`+`eslint` ✅.
- [x] **Emergency · Fase A + B** ✅ (2026-06-10) — model `AsesmenEdukasiEmergency` (log + soft-delete). Migration `20260610130000_init_asesmen_edukasi_emergency`. `tipe` enum (TIPE_INSTRUKSI), `instruksi` wajib + field terstruktur (obat/diet/aktivitas/tandaBahaya[]/followUp/kontak/catatan). **Per-aksi** `GET`/`POST`/`DELETE :itemId` `/kunjungan/:id/asesmen/edukasi/emergency`. **Wiring** `EmergencyPane`: self-fetch, Simpan→POST, icon hapus+ConfirmDialog, petugas read-only. `tsc`+`migrate`+`eslint` ✅.
- [x] **End of Life · Fase A + B** ✅ (2026-06-10) — **2 tabel**: `AsesmenEdukasiEol` (care plan = single-record latest-wins) + `AsesmenEdukasiEolMeeting` (family meeting log, per-item soft-delete, keyed kunjunganId — independen versi plan, hindari re-snapshot). Migration `20260610140000_init_asesmen_edukasi_eol`. Care plan: code status (full_code/dnr/dnar/comfort_only) + alasan + pengambil keputusan/wali + advance directive + terapi diinginkan/ditolak[] + paliatif + detail DNR. Endpoint `GET` agregat `{plan, meetings}` · `POST` plan (append) `/…/edukasi/eol` + `POST` meeting `/…/eol/meeting` + `DELETE /…/eol/meeting/:itemId`. **Wiring** `EndOfLifePane`: load plan→seed form+codeStatus & meetings; **Simpan Rencana**→POST plan (tombol kini ter-wire + "Dicatat oleh"); **Tambah Pertemuan**→POST per-aksi; **hapus pertemuan**→icon+ConfirmDialog soft-delete. `tsc`+`migrate`+`eslint` ✅.
- ⚠️ Shared pane Edukasi (RI/RJ) belum di-wire — IGD pakai `EdukasiPane` sendiri (sama precedent).

**→ Tab Asesmen Medis BE+wiring SELESAI (5/5 sub-menu): Anamnesis · Riwayat (9/9) · Alergi · Skrining Gizi · Edukasi (3/3).**

---

## Domain 4 — DIAGNOSA / Condition (tab Diagnosa) 🚧

**Model `medicalrecord.Diagnosa` + `DiagnosaProsedur`** (per-item daftar hidup — pola Alergi, keyed `kunjunganId`, shared IGD/RI/RJ): tambah = INSERT, ubah tipe/status = UPDATE (+version), hapus = soft-delete. `namaDiagnosis`/`kategori`/`inaCbg` = snapshot master ICD saat dipilih (estimasi grouping). **Invariant deklaratif di DB:** maks 1 `Utama` aktif/kunjungan + kode unik/kunjungan (partial unique index, baris aktif saja); promosi Utama menggeser Utama lama → Sekunder **atomik dalam transaksi** (Service), partial unique = backstop.

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-10)

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model `Diagnosa` (ICD-10: tipe/status/alasan/analisa + snapshot kategori/inaCbg) + `DiagnosaProsedur` (ICD-9-CM: kode/nama/kategori/catatan) + backref `Kunjungan`.
- [x] **A2** migration `20260610160000_init_diagnosa` — 2 tabel + index `(kunjungan_id, deleted_at)` + **partial unique** `diagnosa_utama_satu_per_kunjungan` & `diagnosa_kode_unik_per_kunjungan` & `diagnosa_prosedur_kode_unik_per_kunjungan` + FK cascade. Applied via `migrate deploy` + `generate`.
- [x] **A3** Zod [`schemas/diagnosa/diagnosa.ts`](src/lib/schemas/diagnosa/diagnosa.ts) — enum `DiagnosaTipe`/`DiagnosaStatus` · `DiagnosaItemInput`/`DiagnosaItemUpdate`/`ProsedurItemInput`/`DiagnosaItemParam` · DTO mirror FE (`IGDDiagnosa`/`Icd9ProsedurEntry`) + agregat `DiagnosaDTO { items, prosedur }`.
- [x] **A4** DAL [`dal/diagnosa/diagnosaDal.ts`](src/lib/dal/diagnosa/diagnosaDal.ts) — list/create/find/findAktifByKode/update(+version)/`demoteUtama`/softDelete per tabel; `tx?`; filter `deletedAt: null`.
- [x] **A5** Service [`services/diagnosa/diagnosaService.ts`](src/lib/services/diagnosa/diagnosaService.ts) — `get` agregat · `addDiagnosa`/`updateDiagnosa` dalam `transaction()` (dedup kode → VALIDATION · promosi Utama → demote) **return agregat penuh** (promosi mengubah baris lain) · `deleteDiagnosa`/`addProsedur`/`deleteProsedur` (guard kepemilikan kunjungan) · pemeriksa via `resolveActorNama`.
- [x] **A6** Endpoint `/kunjungan/:id/diagnosa` (GET agregat · POST 201) + `/:itemId` (PATCH · DELETE) + `/prosedur` (POST 201) + `/prosedur/:itemId` (DELETE) — **resource `clinical.diagnosa`** (leaf ter-seed; TIDAK ikut salah-gate `clinical.igd`). Client [`api/diagnosa/diagnosa.ts`](src/lib/api/diagnosa/diagnosa.ts).
- **DoD A:** ✅ `tsc` bersih · ✅ `eslint` 0 error (4 warning `_actor` — precedent, sengaja utk ABAC) · ✅ `migrate status` up-to-date. ⏳ smoke HTTP butuh dev server + token.

### Fase B — Wiring DiagnosaTab ✅ SELESAI (2026-06-10)

- [x] **B1** [DiagnosaTab](src/components/shared/medical-records/DiagnosaTab.tsx) shared (redesign search-first ke master ICD) + prop `kunjunganId?`: UUID-guard `isPersisted` → mode DB. Mount load `getDiagnosa` (agregat `{items, prosedur}`) → seed list + `metaByKode` (kategori/inaCbg dari snapshot DB utk estimasi grouping). **add/update diagnosa** pakai respons agregat authoritative (promosi Utama menggeser baris lain di server → ganti seluruh list); **delete + add/delete prosedur** optimistik dgn rekonsiliasi (`reload`) saat gagal. Banner error + chip "Menyimpan…" + loader per-daftar. Pasien mock (non-UUID) → perilaku demo lokal lama (tanpa regresi RI/RJ).
- [x] **B2** Wrapper [igd/tabs/DiagnosaTab](src/components/igd/tabs/DiagnosaTab.tsx) + [rawat-inap/tabs/DiagnosaTab](src/components/rawat-inap/tabs/DiagnosaTab.tsx) + [RJRecordTabs](src/components/rawat-jalan/RJRecordTabs.tsx) → teruskan `kunjunganId={patient.id}`.
- **DoD B:** ✅ `tsc` bersih · ✅ `eslint` bersih (1 warning `ALL_TABS` pre-existing, tak terkait). ⏳ verifikasi in-browser (login superadmin): tambah/ubah tipe-status/hapus diagnosis & prosedur pasien IGD DB → reload konsisten; promosi Utama menggeser Utama lama.
- **Catatan:** `DiagnosaItemUpdate` pakai `.optional()` polos (bukan `optStr` transform) agar key patch benar-benar opsional (kirim `{tipe}` saja). Estimasi INA-CBG kini pakai `inaCbg`/`kategori` snapshot dari DB bila ada.

---

## Domain 5 — CPPT (Catatan Perkembangan Pasien Terintegrasi) 🚧

**Model `medicalrecord.Cppt`** (per-item lintas profesi, keyed `kunjunganId`, shared IGD/RI/RJ): 1 baris = 1 catatan. Append-only secara klinis, **mutable terbatas** (edit isi · co-sign DPJP · flag tindak lanjut) — TANPA delete (jejak medico-legal; RBAC `clinical.cppt` = read/create/update). `jenisCatatan` = metode komunikasi efektif **SKP 2**: SOAP (naratif S/O/A/P+I) · SBAR (S/O/A/P dipetakan Situation/Background/Assessment/Recommendation) · TBAK (instruksi verbal/telepon: `instruksi` + Tulis-Baca-Konfirmasi + pemberi; **wajib co-sign DPJP 1×24 jam**). `penulis`/`verifiedBy` = nama dari actor (BUKAN free-text).

### Fase FE — SBAR/TBAK toggle (riset SKP 2) ✅ SELESAI (2026-06-11)

- [x] Tipe `CPPTJenis`/`TbakMetode` + field TBAK di `CPPTEntry` ([data.ts](src/lib/data.ts)). Helper `CPPT_JENIS_META`/`areasFor`/`TBAK_STEPS` ([cpptShared.ts](src/components/shared/medical-records/cpptShared.ts)). Form 3-jenis + blok TBAK (pemberi/metode/Tulis-Baca-Konfirmasi) ([CPPTTab.tsx](src/components/shared/medical-records/CPPTTab.tsx)) + render adaptif kartu ([CPPTEntryCard.tsx](src/components/shared/medical-records/CPPTEntryCard.tsx)). TBAK otomatis butuh co-sign.

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-11)

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model `Cppt` (profesi/penulis · jenisCatatan · narasi S/O/A/P+I · TBAK pemberi/metode/Tulis-Baca-Konfirmasi · verified nullable + verifiedBy/At · flagged · waktuCatatan + author) + backref `Kunjungan.cppt`.
- [x] **A2** migration `20260611100000_init_cppt` — tabel + index `(kunjungan_id, waktu_catatan)` + FK cascade. Applied via `migrate deploy` + `generate`.
- [x] **A3** Zod [`schemas/cppt/cppt.ts`](src/lib/schemas/cppt/cppt.ts) — enum `CpptProfesi`/`CpptJenis`/`TbakMetode` · `CpptItemInput` (+`perluVerifikasi`) · `CpptItemUpdate` (patch parsial) · `CpptFlagInput` · `CpptItemParam` · DTO `CpptEntryDTO` mirror `CPPTEntry` 1:1 + agregat `CpptDTO`.
- [x] **A4** DAL [`dal/cppt/cpptDal.ts`](src/lib/dal/cppt/cpptDal.ts) — list (terbaru dulu) / findById / create / update(+version); `tx?`.
- [x] **A5** Service [`services/cppt/cpptService.ts`](src/lib/services/cppt/cpptService.ts) — `get`/`add`/`update`/`verify`/`flag`. **Validasi server-side SKP 2**: TBAK wajib lengkap (pemberi+isi+3 langkah), SOAP/SBAR wajib ≥1 narasi. `needsVerify = perluVerifikasi(RI) ‖ jenis=TBAK`. **Edit membatalkan co-sign** (reset verified). `penulis`/`verifiedBy` via `resolveActorNama`. Waktu via `clock`; DTO format `waktu`/`tanggal`/`verifiedAt` Asia/Jakarta.
- [x] **A6** Endpoint `/kunjungan/:id/cppt` (GET daftar · POST 201) + `/:itemId` (PATCH edit) + `/:itemId/verify` (POST co-sign) + `/:itemId/flag` (PATCH) — **resource `clinical.cppt`** (leaf ter-seed read/create/update; tanpa delete). Client [`api/cppt/cppt.ts`](src/lib/api/cppt/cppt.ts).
- **DoD A:** ✅ `tsc` bersih · ✅ `eslint` 0 error (3 warning `_actor` — precedent, sengaja utk ABAC) · ✅ `migrate status` up-to-date. ⏳ smoke HTTP butuh dev server + token.

### Fase B — Wiring CPPTTab ✅ SELESAI (2026-06-11)

- [x] **B1** [CPPTTab](src/components/shared/medical-records/CPPTTab.tsx) shared + prop `kunjunganId?`: UUID-guard `isPersisted` → mode DB. Mount load `getCppt`; **tambah** → `addCppt` (prepend entri server); **edit** → `updateCppt` (ganti by id); **verify** → `verifyCppt` (verifikator/waktu dari actor — nama ketikan diabaikan); **flag** → `flagCppt` optimistik + rekonsiliasi. Banner error + chip "Menyimpan…" + loader daftar. `CpptEntryDTO`↔`CPPTEntry` passthrough (zero-refactor). Pasien mock (non-UUID) → perilaku demo lokal (tanpa regresi).
- [x] **B2** Wrapper [igd/tabs/CPPTTab](src/components/igd/tabs/CPPTTab.tsx) + [rawat-inap/tabs/CPPTTab](src/components/rawat-inap/tabs/CPPTTab.tsx) + [RJRecordTabs](src/components/rawat-jalan/RJRecordTabs.tsx) → teruskan `kunjunganId={patient.id}`.
- **DoD B:** ✅ `tsc` bersih · ✅ `eslint` bersih (1 warning `ALL_TABS` pre-existing, tak terkait). ⏳ verifikasi in-browser (login superadmin): tambah/edit/verify/flag catatan pasien IGD DB → reload konsisten; TBAK & RI butuh co-sign DPJP.
- ⚠️ **Follow-up RBAC:** `clinical.cppt` (leaf benar, bukan salah-gate `clinical.igd`) — tapi CPPT shared RI/RJ; ABAC unit-scope menyusul sebelum akun klinis live.

---

## Domain 6 — PROCEDURE / TINDAKAN MEDIS (tab Tindakan IGD) ✅

**Model `medicalrecord.TindakanMedis`** (per-item daftar tindakan, keyed `kunjunganId`, shared IGD/RI/RJ): 1 baris = 1 tindakan dicatat. Tambah = INSERT · ubah jumlah/pelaksana = UPDATE · hapus = soft-delete (`deletedAt`). **Snapshot biaya** `kode/nama/kategori` + `harga/penjaminKode/jenisRuangan` **beku saat dicatat** (tarif PERDA bisa berubah; record klinis-finansial harus stabil). `tindakanId?` = pointer lunak ke `master.Tindakan` (nullable; tindakan ad-hoc tetap bisa). Pelaksana/author dari actor.

> **Catatan domain:** TindakanMedis ≠ ICD-9-CM coding. Procedure coding untuk klaim ada di `DiagnosaProsedur` (Domain 4). TindakanMedis = catatan **operasional + charge** (apa yang dikerjakan + berapa biayanya) → hilir ke Billing & Resume Medis. Katalog sumber = tindakan ter-assign Mapping Hub → Layanan Unit (Lab/Rad **dieksklusi** — punya menu Order tersendiri).

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-12)

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model `TindakanMedis` (snapshot kode/nama/kategori/jumlah + harga/penjaminKode/jenisRuangan + pelaksana/author + `dilakukanPada` + soft-delete) + backref `Kunjungan.tindakanMedis`. Index `(kunjungan_id, deleted_at)`.
- [x] **A2** migration `20260612070000_init_medicalrecord_tindakan_medis` — CREATE TABLE `medicalrecord.tindakan_medis` + index + FK→`encounter.kunjungan` cascade. Applied via `migrate deploy` + `generate`.
- [x] **A3** Zod [`schemas/tindakanMedis/tindakanMedis.ts`](src/lib/schemas/tindakanMedis/tindakanMedis.ts) — `TindakanMedisInput` (tindakanId?/kode?/nama/kategori/jumlah/harga?/penjaminKode?/jenisRuangan?/pelaksana?) · `TindakanMedisUpdate` (jumlah?/pelaksana?, refined ≥1 field) · `TindakanItemParam` · `TindakanMedisDTO`.
- [x] **A4** DAL [`dal/tindakanMedis/tindakanMedisDal.ts`](src/lib/dal/tindakanMedis/tindakanMedisDal.ts) — list/findById/create/update/softDelete; filter `deletedAt: null`; `tx?`.
- [x] **A5** Service [`services/tindakanMedis/tindakanMedisService.ts`](src/lib/services/tindakanMedis/tindakanMedisService.ts) — `list`/`add`/`update`/`remove` + `assertKunjungan`/`assertMilik`; `pelaksana` = input atau `resolveActorNama(actor)`; capture `authorUserId`/`authorPegawaiId`.
- [x] **A6** Endpoint `/kunjungan/:id/tindakan` (GET daftar · POST 201) + `/:itemId` (PATCH · DELETE soft) — **resource `clinical.tindakan`** (leaf ter-seed; `scopeKunjungan` default true via prefix `clinical.`). Migration RBAC `20260612080000_rbac_clinical_tindakan_grants` — grant **full CRUD** ke Admin/Dokter/Perawat. Client [`api/tindakanMedis/tindakanMedis.ts`](src/lib/api/tindakanMedis/tindakanMedis.ts).
- **DoD A:** ✅ `tsc` `src/` bersih · ✅ `eslint` bersih (warning `_actor` precedent) · ✅ `migrate status` up-to-date · ✅ DB smoke (struktur 17 kolom · FK cascade · FK-bogus 23503 · insert/update-jumlah/soft-delete/list-filter · RBAC 4 aksi Admin/Dokter/Perawat).

### Fase B — Wiring TindakanTab ✅ SELESAI (2026-06-12)

- [x] **B0** Katalog ter-assign + harga — `GET /master/tindakan-tersedia?penjaminKode=&jenisRuangan=` (gate `clinical.tindakan:read`, `scopeKunjungan:false`) join LayananUnit→Tindakan + left-join Tarif → `harga`. Client [`api/master/tindakanTersedia.ts`](src/lib/api/master/tindakanTersedia.ts).
- [x] **B1** [TindakanTab](src/components/igd/tabs/TindakanTab.tsx) — redesign search-first + ConfigCard (subtotal live) + daftar tergrup + `RingkasanPanel` (Estimasi Biaya animasi). UUID-guard `isPersisted`: mount load `getTindakanMedis`; **add** → `addTindakanMedis` (snapshot konteks UMUM/IGD); **ubah jumlah** → `updateTindakanMedis` optimistik; **hapus** → `deleteTindakanMedis` optimistik + rekonsiliasi (`reload`). Chip "Menyimpan…"/"Memuat katalog…". Pasien mock (non-UUID) → state lokal demo.
- [x] **B2** Verifikasi identitas IGD — `IdentitasVerifikasiBanner.defaultPerawat` dari user login (`useSession().namaTampil`); pelaksana default tindakan juga dari sesi login.
- **DoD B:** ✅ `tsc` `src/` bersih · ✅ `eslint` bersih. **Chain board→detail→persist SUDAH NYAMBUNG** — [igdBoardApi.ts](src/components/igd/igdBoardApi.ts) memetakan `IGDPatient.id = kunjunganId` (UUID); [page.tsx](src/app/ehis-care/(fullpage)/igd/[id]/page.tsx) → [IGDRecordResolver](src/components/igd/IGDRecordResolver.tsx) fetch `GET /kunjungan/:id` + `/patients/:id` → `IGDPatientDetail.id = UUID` → TindakanTab `isPersisted=true`. Pasien seed mock (`igd-1`/Joko) tetap lokal — by-design seam, bukan regresi.
- ⚠️ **Syarat klik dari board:** kartu jadi link ke detail HANYA saat **tanpa tombol aksi** ([PatientCard.tsx](src/components/igd/PatientCard.tsx) `href = !actions ? … : undefined`) → pasien harus **Diterima** (status `InService`, sudah dapat bed) dulu; kartu order-inbox (Registered/Queued, ada Terima/Batalkan) belum bisa di-klik.
- ⚠️ **Follow-up:** per-ruangan scoping katalog (`?ruanganKode=` sudah diterima endpoint, FE belum kirim), trigger charge ke Billing.

---

## Domain 7 — CONSENT / INFORMED CONSENT (tab Informed Consent) ✅

**Model `medicalrecord.InformedConsent`** (per-item daftar hidup, keyed `kunjunganId`, shared IGD/RI/RJ): 1 baris = 1 formulir persetujuan (per tindakan). Tambah = INSERT · hapus = soft-delete (entered-in-error, jejak medico-legal). **IMMUTABLE** setelah dibuat — TANPA update (koreksi = soft-delete + baris baru); RBAC `clinical.consent` = read/create/delete (bentuk sama `clinical.prosedur`). Snapshot tindakan (`tindakanId?`/nama/kategori) beku. **TTD pasien/wali disimpan langsung sebagai PNG data URL base64** (`signatureData` TEXT — draw & webcam) → di-**omit** dari list (anti row-bloat); `hasSignature` derived dari `signatureMethod`. Petugas/author dari actor. PMK 290/2008.

### Fase Redesign FE — prasyarat (2026-06-13) ✅

> Sebelum persist, tab di-redesign (shared, IGD+RI+RJ) memakai endpoint yang sudah ada. **Komponen baru global** [`DateTimePicker`](src/components/shared/inputs/DateTimePicker.tsx) (gabungan kalender + jam, 1 field, portal — melengkapi DatePicker/TimePicker/Select).

- [x] **R1** Tindakan dari katalog — `Nama Tindakan` jadi **combobox** `GET /master/tindakan-tersedia` (katalog ter-assign ruangan) + **fallback manual** (badge "Dari katalog"/"Input manual"), simpan `tindakanId`+`kategori` snapshot.
- [x] **R2** Dropdown → `Select` bersama (tab `hubungan` + modal `hubungan`/`saksiJabatan`); native `<select>` dibuang.
- [x] **R3** Tanggal+Waktu → 1 `DateTimePicker` gabungan (kontrak `YYYY-MM-DDTHH:mm`).
- [x] **R4** Nama Dokter → `Select` di-feed `GET /kunjungan/:id/petugas?profesi=Dokter` (dokter ter-assign ruangan); fallback DPJP header bila roster kosong/pasien demo. Wrapper IGD (`doctor`) + RI (`dpjp`) teruskan `id`+`dpjp`.

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-13)

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model `InformedConsent` (snapshot tindakan + penjelasan tujuan/manfaat/risiko[]/alternatif/konsekuensi/pertanyaan + `keputusan` setuju/menolak + penanda hubungan/nama + saksi1/2 + namaDokter + signatureMethod/Data/signedAt + waktuPersetujuan + petugas/author + soft-delete, **tanpa version/updatedAt**) + backref `Kunjungan.informedConsent`. Index `(kunjungan_id, deleted_at)`.
- [x] **A2** migration `20260613120000_init_informed_consent` (CREATE TABLE 29 kolom + index + FK→`encounter.kunjungan` cascade) + `20260613130000_rbac_clinical_consent` (permission `clinical.consent:read/create/delete` + grant Admin/Dokter/Perawat). Applied via `migrate deploy` + `generate`.
- [x] **A3** Zod [`schemas/informedConsent/informedConsent.ts`](src/lib/schemas/informedConsent/informedConsent.ts) — `InformedConsentInput` (keputusan enum · `signatureData` cap 3MB · `waktuPersetujuan` coerce date) · `ConsentItemParam` · `InformedConsentDTO` (**tanpa `signatureData`** · `hasSignature` derived).
- [x] **A4** DAL [`dal/informedConsent/informedConsentDal.ts`](src/lib/dal/informedConsent/informedConsentDal.ts) — list (**`omit signatureData`**)/findById(full)/create/softDelete; filter `deletedAt: null`; `tx?`.
- [x] **A5** Service [`services/informedConsent/informedConsentService.ts`](src/lib/services/informedConsent/informedConsentService.ts) — `list`/`add`/`remove` + `assertKunjungan`; petugas via `resolveActorNama`; capture `authorUserId`/`authorPegawaiId`.
- [x] **A6** Endpoint `/kunjungan/:id/consent` (GET daftar · POST 201) + `/:itemId` (DELETE soft — **tanpa PATCH**, immutable) — **resource `clinical.consent`** (leaf BARU ter-seed di [rbacShared.ts](src/components/master/mapping/rbac/rbacShared.ts) + DB). Client [`api/informedConsent/informedConsent.ts`](src/lib/api/informedConsent/informedConsent.ts).
- **DoD A:** ✅ `tsc` bersih · ✅ `eslint` bersih (warning `_actor` precedent) · ✅ `prisma generate` · ✅ `migrate deploy` · ✅ DB smoke (29 kolom · FK cascade · index · 3 permission · grants Admin/Dokter/Perawat=3).

### Fase B — Wiring InformedConsentTab ✅ SELESAI (2026-06-13)

- [x] **B1** [InformedConsentTab](src/components/shared/medical-records/InformedConsentTab.tsx) shared + `ICPatient` +`id`/`dpjp`: UUID-guard `isPersisted`. Mount load `getInformedConsent` → riwayat; **Simpan** → `addInformedConsent` (snapshot tindakan + TTD PNG base64 + waktu) → prepend + toast; tombol spinner "Menyimpan…". Pasien mock (non-UUID) → state lokal demo (tanpa regresi).
- [x] **B2** Wrapper [igd/tabs/InformedConsentTab](src/components/igd/tabs/InformedConsentTab.tsx) + [rawat-inap/tabs/InformedConsentTab](src/components/rawat-inap/tabs/InformedConsentTab.tsx) + [RJRecordTabs](src/components/rawat-jalan/RJRecordTabs.tsx) → teruskan `id`+`dpjp`.
- **DoD B:** ✅ `tsc` bersih · ✅ `eslint` bersih (warning `<img>` TTD preview, precedent). ⏳ verifikasi in-browser (login superadmin).
- ⚠️ **Sisa (follow-up):** delete UI (entered-in-error + ConfirmDialog) di daftar tersimpan · endpoint detail+print yang ikut `signatureData` (kini di-omit dari list) · konsolidasi redundansi penanda tab↔modal (vocab `hubungan` beda) · TTD SVG opsional (lebih kecil + crisp cetak A4).

---

## Domain 8 — MED RECONCILIATION / REKONSILIASI (tab Rekonsiliasi) ✅

**Model `medicalrecord.Rekonsiliasi` + child `RekonsiliasiObat`** (parent+child, keyed `kunjunganId`, shared IGD/RI): **append-only "latest wins" per fase** (admisi/transfer/discharge) — tiap **Simpan** = snapshot baru (parent + baris obat). Form menampilkan snapshot **terbaru per fase**; **Riwayat** = semua snapshot (lintas fase & versi, terbaru dulu) = jejak audit. Pola = AsesmenObat+AsesmenObatItem. `waktu` = "Tanggal & Waktu" form; `petugas` = nama user login; `obatList` snapshot (namaObat/dosis/rute/frekuensi/sumber/keputusan/gantiDengan/alasan/isHAM). SNARS PP 3.1 · SKP 3 · PMK 72/2016.

### Fase Form FE — prasyarat (2026-06-13) ✅

- [x] **F1** Tanggal & Waktu → komponen global [`DateTimePicker`](src/components/shared/inputs/DateTimePicker.tsx) (kontrak `YYYY-MM-DDTHH:mm`).
- [x] **F2** Petugas → **chip read-only dari user login** (`useSession().namaTampil`; fallback input bila tak login).
- [x] **F3** Obat dari **Formularium** — `GET /master/obat-tersedia` (gate `clinical.resep:read`, join `FormulariumObat→Obat` distinct + `ruanganKodes[]`) → map `ObatCatalog` → `ObatSearch` prop `catalog` + `showStock=false`. [obatTersedia schema](src/lib/schemas/master/obatTersedia.ts)/[service `listObatTersedia`](src/lib/services/master/formulariumService.ts)/[route](src/app/api/v1/master/obat-tersedia/route.ts)/[client](src/lib/api/master/obatTersedia.ts). Resep tetap pakai mock (degradasi anggun).

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-13)

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — `Rekonsiliasi` (fase/selesai/catatan/waktu/petugas/author + version, append-only **tanpa updatedAt/soft-delete**) + `RekonsiliasiObat` (namaObat/dosis/rute/frekuensi/sumber/keputusan/gantiDengan/alasan/isHAM/urutan) + backref `Kunjungan.rekonsiliasi`. Index `(kunjungan_id, created_at)` + `(rekonsiliasi_id)`.
- [x] **A2** migration `20260613180000_init_medicalrecord_rekonsiliasi` — CREATE TABLE rekonsiliasi + rekonsiliasi_obat + index + FK→`encounter.kunjungan` cascade + child→parent cascade. Applied via `migrate deploy` + `generate`.
- [x] **A3** Zod [`schemas/rekonsiliasi/rekonsiliasi.ts`](src/lib/schemas/rekonsiliasi/rekonsiliasi.ts) — `RekonsiliasiInput` (fase enum · selesai · catatan? · waktu coerce date? · petugas? · obatList[]) · `RekonsiliasiObatInput` (keputusan enum) · `RekonsiliasiDTO`+`RekonsiliasiObatDTO`.
- [x] **A4** DAL [`dal/rekonsiliasi/rekonsiliasiDal.ts`](src/lib/dal/rekonsiliasi/rekonsiliasiDal.ts) — list (riwayat, include obatList urut)/findById/create (nested children); `tx?`.
- [x] **A5** Service [`services/rekonsiliasi/rekonsiliasiService.ts`](src/lib/services/rekonsiliasi/rekonsiliasiService.ts) — `list`/`add` + `assertKunjungan`; petugas via `resolveActorNama`; capture author.
- [x] **A6** Endpoint `/kunjungan/:id/rekonsiliasi` (GET riwayat · POST 201 snapshot) — **resource `clinical.rekonsiliasi`** (read/create). **Tanpa PATCH/DELETE** (append-only). Client [`api/rekonsiliasi/rekonsiliasi.ts`](src/lib/api/rekonsiliasi/rekonsiliasi.ts). _(Katalog obat `obat-tersedia` tetap di-gate `clinical.resep:read`.)_
- [x] **A7** RBAC pisah resource `clinical.rekonsiliasi` — leaf + grant di [rbacShared.ts](src/components/master/mapping/rbac/rbacShared.ts) (Dokter/Perawat/Apoteker read+create) + migrasi `20260614100000_rbac_clinical_rekonsiliasi` (2 perm + grant Admin/Dokter/Perawat/Apoteker, idempoten). Tujuan: penanggung jawab klinis = Apoteker, **tanpa** membuka hak tulis `clinical.resep`. DB smoke: 2 perm + 8 grant terkonfirmasi.
- **DoD A:** ✅ `tsc` bersih · ✅ `eslint` bersih (warning `_actor` precedent) · ✅ `migrate deploy` + `generate` · ✅ DB smoke (parent+child join · FK cascade child · FK-bogus kunjungan 23503).

### Fase B — Wiring RekonsiliasTab ✅ SELESAI (2026-06-13)

- [x] **B1** [RekonsiliasTab](src/components/shared/medical-records/RekonsiliasTab.tsx) shared + `RekonPatient.id`: **sub-menu Rekonsiliasi | Riwayat**. UUID-guard `isPersisted` (kunjunganId): mount `getRekonsiliasi` → seed form dari snapshot **terbaru per fase** + isi Riwayat; **Simpan** per fase → `addRekonsiliasi` (snapshot) → prepend riwayat + re-seed kanonik + toast; spinner per fase. Pasien mock (non-UUID) → lokal demo (toast "Mode demo").
- [x] **B2** [RekonHistory](src/components/shared/medical-records/rekonsiliasi/RekonHistory.tsx) — kartu per snapshot (fase badge + waktu + petugas + jumlah obat + HAM + selesai), expand → daftar obat read-only (keputusan badge) + catatan.
- [x] **B3** [RekonSection](src/components/shared/medical-records/rekonsiliasi/RekonSection.tsx) — Simpan wired (`onSimpan`/`saving`); Tanggal `DateTimePicker`; Petugas chip sesi; obat `catalog` Formularium. Wrapper [igd](src/components/igd/tabs/RekonsiliasTab.tsx)/[ri](src/components/rawat-inap/tabs/RekonsiliasTab.tsx) teruskan `patient` (id mengalir).
- **DoD B:** ✅ `tsc` bersih · ✅ `eslint` bersih (warning `_actor` precedent). ⏳ verifikasi in-browser (login). Riwayat kosong sampai ada obat di Formularium + Simpan dari pasien terdaftar (UUID).
- ⚠️ **Sisa (follow-up):** **ABAC careUnit memblok Apoteker** — RBAC `clinical.rekonsiliasi:create` sudah diberikan, tapi `route()` choke-point men-scope kunjungan ke `careUnit` aktor (turunan `Pegawai.unitKerja`); Apoteker (unit Farmasi) → 404 untuk kunjungan IGD/RI. Butuh keputusan akses lintas-unit farmasi (lihat [TECH_DEBT.md](TECH_DEBT.md)). Realistis hari ini: Dokter/Perawat. · per-unit scoping katalog (`?ruanganKode=` forward-ready) · soft-delete entered-in-error bila dibutuhkan.

---

## Domain 9 — NURSING CARE / KEPERAWATAN (tab Keperawatan, SDKI/SLKI/SIKI) ✅

**Model `medicalrecord.AsuhanKeperawatan`** (keyed `kunjunganId`, shared IGD/RI/RJ): **CRUD** — 1 baris = 1 diagnosa keperawatan (proses asuhan). Edit, **verify** (co-sign supervisor/DPJP), **evaluasi shift** (timeline = tabel anak `AsuhanEvaluasi`, append-only, endpoint sendiri), hapus = soft-delete (entered-in-error). Blok pengkajian (dataMayor/dataMinor) + intervensi SIKI = JSONB; `kriteriaHasil` (SLKI) = text[]. `kodeSdki` = soft-ref `master.sdki.kode` (snapshot saat pilih template). `tanggalInput` = timestamptz (DateTimePicker); `perawat` = denormalisasi sesi login. Mirror pola TindakanMedis. PPNI SDKI 2017 / SLKI 2018 / SIKI 2018.

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-14)

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — `AsuhanKeperawatan` (kodeSdki/diagnosa/penyebab/faktorResiko · dataMayor/dataMinor/intervensi/evaluasi JSONB · kriteriaHasil text[] · tujuanDurasi/Unit/selama/statusLuaran · tanggalInput/perawat/author · verified/verifiedBy/verifiedAt co-sign · aktif · CRUD + soft-delete) + backref `Kunjungan.asuhanKeperawatan`. Index `(kunjungan_id, deleted_at)`.
- [x] **A2** migration `20260614130000_init_medicalrecord_asuhan_keperawatan` — CREATE TABLE + index + FK→`encounter.kunjungan` cascade. Applied `migrate deploy` + `generate`.
- [x] **A3** RBAC resource BARU `clinical.keperawatan` — leaf [rbacShared.ts](src/components/master/mapping/rbac/rbacShared.ts) (Admin/Dokter/Perawat r/c/u/d; **Perawat penulis utama**) + migrasi `20260614140000_rbac_clinical_keperawatan` (4 perm + grant 3 role, idempoten). DB smoke: 4 perm · Admin/Dokter/Perawat ×4.
- [x] **A4** Zod [`schemas/keperawatan/asuhanKeperawatan.ts`](src/lib/schemas/keperawatan/asuhanKeperawatan.ts) — Input/Update (OPTIONAL murni → partial PATCH rapi; normalisasi di Service) + ItemParam + DTO (mirror `AsuhanKeperawatanEntry`, tanggal/verifiedAt ISO). DAL [`dal/keperawatan/asuhanKeperawatanDal.ts`](src/lib/dal/keperawatan/asuhanKeperawatanDal.ts) (list/findById/create/update/softDelete). Service [`services/keperawatan/asuhanKeperawatanService.ts`](src/lib/services/keperawatan/asuhanKeperawatanService.ts) (assertKunjungan/assertMilik · perawat=resolveActorNama · clean list/data/intervensi/evaluasi · verifiedAt saat verified→true).
- [x] **A5** Endpoint `/kunjungan/:id/asuhan-keperawatan` (GET list · POST 201) + `/:itemId` (PATCH · DELETE) — gate **`clinical.keperawatan`**, ABAC careUnit (route choke-point). Client [`api/keperawatan/asuhanKeperawatan.ts`](src/lib/api/keperawatan/asuhanKeperawatan.ts).
- [x] **A6** Konsumen template KLINIS — `GET /master/sdki-template` (gate **`clinical.keperawatan:read`**, `scopeKunjungan:false`) → `sdkiService.listTemplate()` (diagnosa Aktif: kode/nama/penyebab/faktor/SLKI/SIKI). Client [`api/master/sdkiTemplate.ts`](src/lib/api/master/sdkiTemplate.ts). Bentuk = `SdkiCatalogItem` FE. Pola identik tindakan-tersedia/obat-tersedia.
- **DoD A:** ✅ `tsc` bersih · ✅ `eslint` bersih (warning `_actor` precedent) · ✅ `migrate deploy` + `generate` · ✅ DB smoke (JSONB+text[] insert parse · default verified/aktif · FK-bogus 23503 · RBAC grants).

### Fase B — Wiring KeperawatanTab IGD ✅ SELESAI (2026-06-14)

- [x] **B1** [KeperawatanTab IGD](src/components/igd/tabs/KeperawatanTab.tsx) — UUID-guard `isPersisted` (patient.id): mount `getAsuhanKeperawatan` → entries DB + `listSdkiTemplate` → catalog. Persist `handleSave` (create/update) · `handleVerify` (PATCH verified) · `handleAddEval` (POST `addEvaluasiShift` — endpoint anak) · `handleDelete` (soft) — semua via API saat persisted; pasien mock (non-UUID) → mutasi lokal (demo). DTO↔entry map (tanggal/verifiedAt ISO↔local) + `formToInput` (tanggal ISO).
- [x] **B2** [AsuhanForm shared](src/components/shared/medical-records/keperawatan/AsuhanForm.tsx) (IGD-only) — **"Katalog SDKI Cepat" → "Katalog Keperawatan (Template)"**; `catalog` prop (DB) fallback `SDKI_CATALOG`; **Tanggal & Waktu = `DateTimePicker`**; **Perawat = chip read-only sesi login** (`petugasLogin`, di-inject ke payload saat simpan — tanpa setState-in-effect); auto-fill form saat pilih template (`applyTemplate`). [AsuhanCard](src/components/shared/medical-records/keperawatan/AsuhanCard.tsx): `fmtTanggal` (local-dt/ISO → id-ID).
- **DoD B:** ✅ `tsc` bersih · ✅ `eslint` bersih. ⏳ verifikasi in-browser (login). Persist aktif saat kunjunganId UUID; pasien seed `igd-1` lokal (demo).

### Fase C — Evaluasi Shift = contracts table sendiri ✅ SELESAI (2026-06-14)

Ekstraksi `evaluasi` (semula JSONB di `AsuhanKeperawatan`) → tabel anak append-only + endpoint khusus. Form evaluasi pakai komponen global + perawat sesi login.

- [x] **C1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model **`AsuhanEvaluasi`** (FK `asuhan_id`→`AsuhanKeperawatan` cascade; shift/subjektif?/objektif/statusLuaran · `waktu` timestamptz · perawat/author · append-only tanpa updatedAt/soft-delete). Relasi `AsuhanKeperawatan.evaluasiShift[]` (ganti kolom JSONB). Index `(asuhan_id, waktu)`.
- [x] **C2** migration `20260614150000_init_medicalrecord_asuhan_evaluasi` — CREATE TABLE + index + FK cascade + **DROP COLUMN `evaluasi`**. Applied `migrate deploy` + `generate`.
- [x] **C3** Zod `EvaluasiInput` (waktu? ISO · shift? · subjektif? · objektif wajib · statusLuaran · perawat?) di [asuhanKeperawatan.ts](src/lib/schemas/keperawatan/asuhanKeperawatan.ts); DTO `EvaluasiShiftDTO` derive tanggal/jam dari `waktu` (TZ Asia/Jakarta). DAL `createEvaluasi`/`listEvaluasi` + `include evaluasiShift` (urut waktu). Service `addEvaluasi` (perawat=actor · shift derive bila kosong · sinkron `statusLuaran` parent → DTO refresh) + `listEvaluasi`.
- [x] **C4** Endpoint `/kunjungan/:id/asuhan-keperawatan/:itemId/evaluasi` (GET list · POST 201) — gate **`clinical.keperawatan`** (read/create), ABAC careUnit (route choke-point). Client `addEvaluasiShift`/`getEvaluasiShift`.
- [x] **C5** [AsuhanCard](src/components/shared/medical-records/keperawatan/AsuhanCard.tsx) `EvaluasiForm` — **Tanggal & Waktu = `DateTimePicker`** (ganti `<input date/time>`) · **Shift = `Select`** global (ganti `<select>`) · **Perawat = chip read-only sesi login** (`petugasLogin`, no free-text). Callback `onAddEval(EvalDraft)`; RI copy (mock) ikut disesuaikan (build EvaluasiShift display lokal).
- **DoD C:** ✅ `tsc` bersih · ✅ `eslint` 0 error · ✅ `migrate deploy` + `generate` · ✅ DB smoke (kolom + drop JSONB + index + insert + FK-bogus 23503).
- ⚠️ **Sisa (follow-up):** wiring RI/RJ (RI punya copy `AsuhanForm`/`AsuhanCard` sendiri di `rawat-inap/tabs/keperawatan/` — belum dimigrasi) · `SDKI_CATALOG` mock (15 entri) tetap sbg fallback offline · import penuh dataset PPNI.

---

## Domain 10 — ASSESSMENT / PEMERIKSAAN FISIK (tab Pemeriksaan, SNARS AP 1) ✅ IGD

**Model `medicalrecord.PemeriksaanFisik`** (keyed `kunjunganId`, shared-ready IGD/RI/RJ): **append-only "latest wins"** (mirip Anamnesis) — re-pemeriksaan = baris baru; latest by createdAt = berlaku. Status generalis (ku/kesadaran/gizi + mobilitas opsional + orientasi + catatan generalis) + pemeriksaan per region (head-to-toe IGD / per-sistem RI-RJ menyusul) `sistem` JSONB + temuan (preset `temuanAbnormal` + manual `temuanLain`) text[] + `bodyMarkings` JSONB (forward-compat). `waktuPemeriksaan` = timestamptz (DateTimePicker); `dokterPemeriksa` = roster ruangan; `perawat` = sesi login. SNARS AP 1.

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-14)

- [x] **A1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — `PemeriksaanFisik` (ku/kesadaran/gizi · mobilitas? · orientasi/sistem/bodyMarkings JSONB · catatanGeneralis? · temuanAbnormal/temuanLain text[] · catatanUmum? · waktuPemeriksaan/dokterPemeriksa/perawat/author · version · append-only tanpa updatedAt/soft-delete) + backref `Kunjungan.pemeriksaanFisik`. Index `(kunjungan_id, created_at)`.
- [x] **A2** migration `20260614160000_init_medicalrecord_pemeriksaan_fisik` — CREATE TABLE + index + FK→`encounter.kunjungan` cascade. Applied `migrate deploy` + `generate`.
- [x] **A3** RBAC resource BARU `clinical.pemeriksaan` — leaf [rbacShared.ts](src/components/master/mapping/rbac/rbacShared.ts) (Admin/Dokter/Perawat **read/create**; **diperluas update/delete di Fase C** untuk sub Anatomi) + migrasi `20260614170000_rbac_clinical_pemeriksaan` (2 perm) → `20260614190000_rbac_clinical_pemeriksaan_crud` (+2 perm). Grant 3 role, idempoten.
- [x] **A4** Zod [`schemas/pemeriksaan/pemeriksaanFisik.ts`](src/lib/schemas/pemeriksaan/pemeriksaanFisik.ts) (Input OPTIONAL murni + enum KU/Kesadaran/Gizi/Mobilitas + DTO mirror `PemeriksaanFisikEntry`, tanggal/jam derive dari waktuPemeriksaan TZ Asia/Jakarta). DAL [`dal/pemeriksaan/pemeriksaanFisikDal.ts`](src/lib/dal/pemeriksaan/pemeriksaanFisikDal.ts) (list/findLatest/findById/create). Service [`services/pemeriksaan/pemeriksaanFisikService.ts`](src/lib/services/pemeriksaan/pemeriksaanFisikService.ts) (assertKunjungan · perawat=resolveActorNama · JSONB defensif · list/add).
- [x] **A5** Endpoint `/kunjungan/:id/pemeriksaan-fisik` (GET riwayat · POST 201 append) — gate **`clinical.pemeriksaan`**, ABAC careUnit (route choke-point). Client [`api/pemeriksaan/pemeriksaanFisik.ts`](src/lib/api/pemeriksaan/pemeriksaanFisik.ts).
- **DoD A:** ✅ `tsc` bersih · ✅ `eslint` 0 error (warning `_actor` precedent) · ✅ `migrate deploy`+`generate` · ✅ DB smoke (kolom · JSONB+text[] parse · RBAC 2 perm × 3 role · FK-bogus 23503).

### Fase B — Wiring PemeriksaanTab IGD ✅ SELESAI (2026-06-14)

- [x] **B1** [PemeriksaanTab IGD](src/components/igd/tabs/PemeriksaanTab.tsx) — kini terima `patient` prop (dipassing di [IGDRecordTabs](src/components/igd/IGDRecordTabs.tsx)); UUID-guard `isPersisted`. Mount: `getPemeriksaanFisik` → prefill form dari pemeriksaan terbaru (remount via `key`) + `listPetugasKunjungan(id,"Dokter")` → roster. **MetaHeader**: waktu=`DateTimePicker` · dokter=`Select` roster (default `patient.doctor`) · perawat=chip sesi login. `handleSave` → meta menang atas salinan form (anti-stale) → `createPemeriksaanFisik` (persisted) / lokal (mock igd-1).
- [x] **B2** [StatusFisikPane shared](src/components/shared/medical-records/pemeriksaan/StatusFisikPane.tsx) — tambah **Mobilitas** (opsional, clearable) + **Catatan Status Generalis** (free-text) + **Temuan Lain** (input manual → chip removable). Head-to-toe 11 region tetap. Cleanup: hapus copy nyasar `rawat-inap/tabs/pemeriksaan/StatusFisikPane.tsx` (RiwayatPane RI repoint ke shared `SISTEM_DEF`).
- **DoD B:** ✅ `tsc` bersih · ✅ `eslint` 0 error. ⏳ verifikasi in-browser (login). Persist aktif saat kunjunganId UUID; pasien seed `igd-1` lokal (demo).

### Fase C — Sub Anatomi (Penandaan area tubuh / body-map) ✅ SELESAI (2026-06-14)

Domain terpisah `medicalrecord.PenandaanAnatomi` (daftar hidup per-item) untuk sub-tab Anatomi — gantikan state lokal throwaway. Bukan pakai `PemeriksaanFisik.bodyMarkings` (JSONB itu kini vestigial → [TECH_DEBT](TECH_DEBT.md)).

- [x] **C1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model **`PenandaanAnatomi`** (FK kunjungan cascade · region/label/catatan · pemeriksa/author · version · soft-delete medico-legal) + backref `Kunjungan.penandaanAnatomi`. Index `(kunjungan_id, deleted_at)`. Migrasi `20260614180000_init_medicalrecord_penandaan_anatomi`.
- [x] **C2** RBAC — **perluas `clinical.pemeriksaan` → update/delete** (sub Anatomi = daftar hidup: edit catatan + lepas tanda). Leaf [rbacShared.ts](src/components/master/mapping/rbac/rbacShared.ts) jadi r/c/u/d (Admin/Dokter/Perawat) + migrasi `20260614190000_rbac_clinical_pemeriksaan_crud`. Satu resource utk seluruh tab Pemeriksaan.
- [x] **C3** Lapisan — [Zod](src/lib/schemas/pemeriksaan/penandaanAnatomi.ts) (Input/Update/DTO mirror `RegionNote`+id) · [DAL](src/lib/dal/pemeriksaan/penandaanAnatomiDal.ts) (list/findById/create/update/softDelete) · [Service](src/lib/services/pemeriksaan/penandaanAnatomiService.ts) (assertKunjungan/assertMilik · pemeriksa=resolveActorNama · list/add/update/remove) · routes [GET+POST](src/app/api/v1/kunjungan/[id]/penandaan-anatomi/route.ts) + [PATCH+DELETE](src/app/api/v1/kunjungan/[id]/penandaan-anatomi/[itemId]/route.ts) (gate `clinical.pemeriksaan`) · [client](src/lib/api/pemeriksaan/penandaanAnatomi.ts).
- [x] **C4** [AnatomiPane (IGD)](src/components/igd/tabs/PemeriksaanTab.tsx) — terima `kunjunganId`+`isPersisted`; mount `getPenandaanAnatomi` → notes (dengan id). Toggle area → `createPenandaanAnatomi`/`deletePenandaanAnatomi`; edit catatan → `updatePenandaanAnatomi`. `selected` derive dari notes. Mock `igd-1` → lokal (id lokal).
- **DoD C:** ✅ `tsc` bersih · ✅ `eslint` 0 error · ✅ `migrate deploy`+`generate` · ✅ DB smoke (2 tabel · RBAC 4 perm × 3 role · JSONB+text[] · FK-bogus 23503).

### Fase D — Sub Penunjang (diagnostik bedside non-Lab/Rad) ✅ SELESAI (2026-06-15)

Sub-tab Penunjang difokuskan ulang: Lab & Radiologi (USG = modalitas radiologi) punya modul/tab sendiri → **hapus Lab/Rad/USG**, sisakan **EKG** + tambah penunjang bedside lain (Spirometri/EEG/EMG/Audiometri/Ekokardiografi/Treadmill Test/Lainnya). Hasil bersifat **interpretatif** → form di-redesain dari `nilai/satuan/normal` (ala lab) → **Keterangan + Hasil/Interpretasi + Kesimpulan/Kesan**. Tanggal → **DateTimePicker global**. Domain backend sendiri `medicalrecord.PemeriksaanPenunjang` gantikan state lokal throwaway.

- [x] **D1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model **`PemeriksaanPenunjang`** (FK kunjungan cascade · jenis/keterangan/hasil/kesimpulan · waktu timestamptz opsional · pemeriksa/author · **add/delete only** tanpa version/updatedAt; soft-delete medico-legal) + backref `Kunjungan.pemeriksaanPenunjang`. Index `(kunjungan_id, deleted_at)`. Migrasi `20260615120000_init_medicalrecord_pemeriksaan_penunjang`.
- [x] **D2** RBAC — **reuse `clinical.pemeriksaan`** (read/create/delete) — satu resource utk seluruh tab Pemeriksaan (tanpa migrasi baru).
- [x] **D3** Lapisan — [Zod](src/lib/schemas/pemeriksaan/pemeriksaanPenunjang.ts) (Input OPTIONAL murni + DTO mirror `HasilEntry`, tanggal/jam derive dari waktu TZ Asia/Jakarta) · [DAL](src/lib/dal/pemeriksaan/pemeriksaanPenunjangDal.ts) (list/findById/create/softDelete) · [Service](src/lib/services/pemeriksaan/pemeriksaanPenunjangService.ts) (assertKunjungan/assertMilik · pemeriksa=resolveActorNama · list/add/remove) · routes [GET+POST](src/app/api/v1/kunjungan/[id]/pemeriksaan-penunjang/route.ts) + [DELETE](src/app/api/v1/kunjungan/[id]/pemeriksaan-penunjang/[itemId]/route.ts) · [client](src/lib/api/pemeriksaan/pemeriksaanPenunjang.ts).
- [x] **D4** [PenunjangPane (IGD)](src/components/igd/tabs/PemeriksaanTab.tsx) — terima `kunjunganId`+`isPersisted`; jenis chips baru; field tanggal → `DateTimePicker`; mount `getPemeriksaanPenunjang`; add → `createPemeriksaanPenunjang` (+toast) / hapus → `deletePemeriksaanPenunjang`; daftar hasil = kartu per-jenis (interpretasi + chip "Kesan"). Mock `igd-1` → lokal.
- **DoD D:** ✅ `tsc` bersih · ✅ `eslint` 0 error (warning `_actor` precedent) · ✅ `migrate deploy`+`generate` · ✅ DB smoke (kolom · index · FK-bogus 23503). Upload file masih placeholder (butuh storage).
- ⚠️ **Sisa (follow-up):** RI/RJ mode **per-sistem** (keputusan 2026-06-14 → [TECH_DEBT.md](TECH_DEBT.md#-rekam-medis-klinis-shared-igdrirj)) · RI BodyMapPane belum pakai domain Anatomi · riwayat pemeriksaan fisik (list >1 baris) belum ditampilkan · `PemeriksaanFisik.bodyMarkings` JSONB vestigial · Penunjang: upload file butuh storage.

---

## Domain 11 — PENILAIAN / Assessment Klinis (tab Penilaian) 🚧 IGD

**Tab Penilaian = banyak sub-menu** (Fisik · Nyeri · Status Klinis · Pediatrik · Diagnosis · Risiko Jatuh/Morse · Dekubitus/Braden · Barthel · Jantung · Kanker). **Keputusan (2026-06-15):** tiap sub-menu = **domain/tabel sendiri** dengan **prefix `penilaian_`** (mis. `penilaian_fisik`, `penilaian_status`, …), bukan numpang Observation. Sebagian sub-menu (skala risiko/skor) akan **menarik vocab dari master** (Skala Risiko/Penyakit) — dikerjakan per sub-menu. Pola umum: **append-only time-series** (riwayat di panel kanan; tiap simpan = baris baru). RBAC = **satu resource `clinical.penilaian`** (read/create) utk seluruh tab. Dikerjakan **satu per satu**.

### Sub-menu 1 — Fisik ✅ SELESAI (2026-06-15)

Penilaian fisik ringkas (BEDA dari Domain 10 head-to-toe): Pemeriksaan Fisik Umum (free-text) + Keadaan Umum/Kesadaran/Gizi/Mobilitas. Tidak menarik master.

- [x] **F1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model **`PenilaianFisik`** (FK kunjungan cascade · pemeriksaanUmum/keadaanUmum/kesadaran/gizi/mobilitas · pemeriksa/author · version · **append-only** tanpa updatedAt/soft-delete) + backref `Kunjungan.penilaianFisik`. Index `(kunjungan_id, created_at)`. Migrasi `20260615130000_init_medicalrecord_penilaian_fisik`.
- [x] **F2** RBAC resource BARU **`clinical.penilaian`** (read/create) — leaf [rbacShared.ts](src/components/master/mapping/rbac/rbacShared.ts) (Admin/Dokter/Perawat) + migrasi `20260615140000_rbac_clinical_penilaian` (2 perm, idempoten). Satu resource utk seluruh tab Penilaian.
- [x] **F3** Lapisan — [Zod](src/lib/schemas/penilaian/penilaianFisik.ts) (Input OPTIONAL murni + DTO, tanggal/waktu derive dari createdAt TZ Asia/Jakarta) · [DAL](src/lib/dal/penilaian/penilaianFisikDal.ts) (list/findById/create) · [Service](src/lib/services/penilaian/penilaianFisikService.ts) (assertKunjungan · pemeriksa=resolveActorNama · guard all-empty → 422 · list/add) · route [GET+POST](src/app/api/v1/kunjungan/[id]/penilaian-fisik/route.ts) (gate `clinical.penilaian`) · [client](src/lib/api/penilaian/penilaianFisik.ts). Folder per-tab `penilaian/`.
- [x] **F4** [FisikPanel (IGD)](src/components/igd/tabs/PenilaianTab.tsx) — terima ctx `{kunjunganId, isPersisted, perawat}` (via `TabDef.content(ctx)`); mount `getPenilaianFisik` → panel Riwayat; `SaveBtn` diperluas (onClick/disabled/loading) → `createPenilaianFisik` (+toast, reset form, prepend riwayat). Mock `igd-1` → lokal demo.
- **DoD F:** ✅ `tsc` bersih · ✅ `eslint` 0 error (warning `_actor` precedent) · ✅ `migrate deploy`+`generate` · ✅ DB smoke (12 kolom · index · FK-bogus 23503 · `clinical.penilaian` 2 perm × Admin/Dokter/Perawat). ⏳ verifikasi in-browser (login).

### Sub-menu 2 — Nyeri (Asesmen Nyeri Komprehensif) ✅ SELESAI (2026-06-15)

**Keputusan desain (single gate skor NRS):** angka NRS 0–10 = **single source di Observation/TTV** (5th vital sign, di-update tiap shift). Sub-menu Nyeri **TIDAK** menyimpan angka tandingan (hindari drift "skor mana yang terkini") — ia menyimpan **karakterisasi (PQRST)** & menampilkan skor TTV terkini **read-only** sebagai konteks. Selector NRS 0–10 lama (slider+grid) dihapus dari panel ini.

- [x] **N1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model **`PenilaianNyeri`** (FK kunjungan cascade · lokasi/karakter/durasi/faktorPemberat/faktorPeringan/tipeNyeri/dampakFungsional/rencanaReasesmen/catatan = TEXT default '' · pemeriksa/author · version · **append-only** tanpa skor NRS) + backref `Kunjungan.penilaianNyeri`. Index `(kunjungan_id, created_at)`. Migrasi `20260615150000_init_medicalrecord_penilaian_nyeri`.
- [x] **N2** RBAC — **reuse `clinical.penilaian`** (read/create) — tanpa migrasi RBAC baru. Baca skor TTV pakai `clinical.rekammedis:read` (Dokter & Perawat sudah punya).
- [x] **N3** Lapisan — [Zod](src/lib/schemas/penilaian/penilaianNyeri.ts) (Input OPTIONAL murni + DTO, tanggal/waktu derive createdAt TZ Asia/Jakarta) · [DAL](src/lib/dal/penilaian/penilaianNyeriDal.ts) (list/findById/create) · [Service](src/lib/services/penilaian/penilaianNyeriService.ts) (assertKunjungan · pemeriksa=resolveActorNama · guard all-empty → 422 · list/add) · route [GET+POST](src/app/api/v1/kunjungan/[id]/penilaian-nyeri/route.ts) (gate `clinical.penilaian`) · [client](src/lib/api/penilaian/penilaianNyeri.ts).
- [x] **N4** [NyeriPanel (IGD)](src/components/igd/tabs/PenilaianTab.tsx) — di-reposisi: **banner skor NRS terkini read-only** (mount `listObservasi` → ambil terbaru `vitalSigns.skalaNyeri` + waktu; empty-state ajak isi TTV) + field karakterisasi (lokasi/karakter/tipe(pills)/durasi/faktor pemberat-peringan/dampak/reasesmen/catatan). Mount `getPenilaianNyeri` → panel Riwayat; `SaveBtn` (disabled all-empty/loading) → `createPenilaianNyeri` (+toast, reset, prepend). Mock `igd-1` → lokal.
- **DoD N:** ✅ `tsc` bersih · ✅ `eslint` 0 error (warning `_actor` precedent) · ✅ `migrate deploy`+`generate` · ✅ DB smoke (16 kolom · index · FK-bogus 23503 · `clinical.penilaian` 2 perm × 3 role). ⏳ verifikasi in-browser (login).

### Sub-menu 3 — Status Klinis ✅ SELESAI (2026-06-15)

Status klinis: status (Stabil/Tidak Stabil/Kritis/Mengancam Jiwa/Meninggal) + tingkat kesadaran (Compos Mentis/Apatis/Somnolen/Sopor/Koma) + catatan. Append-only. Tidak menarik master.

- [x] **S1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model **`PenilaianStatus`** (FK kunjungan cascade · status/kesadaran/catatan TEXT default '' · pemeriksa/author · version · **append-only**) + backref `Kunjungan.penilaianStatus`. Index `(kunjungan_id, created_at)`. Migrasi `20260615160000_init_medicalrecord_penilaian_status`.
- [x] **S2** RBAC — **reuse `clinical.penilaian`** (read/create) — tanpa migrasi RBAC baru.
- [x] **S3** Lapisan — [Zod](src/lib/schemas/penilaian/penilaianStatus.ts) (Input OPTIONAL murni + DTO, tanggal/waktu derive createdAt TZ Asia/Jakarta) · [DAL](src/lib/dal/penilaian/penilaianStatusDal.ts) (list/findById/create) · [Service](src/lib/services/penilaian/penilaianStatusService.ts) (assertKunjungan · pemeriksa=resolveActorNama · guard all-empty → 422 · list/add) · route [GET+POST](src/app/api/v1/kunjungan/[id]/penilaian-status/route.ts) (gate `clinical.penilaian`; folder `penilaian-status` ≠ `status` transisi kunjungan) · [client](src/lib/api/penilaian/penilaianStatus.ts).
- [x] **S4** [StatusPanel (IGD)](src/components/igd/tabs/PenilaianTab.tsx) — terima ctx `{kunjunganId, isPersisted, perawat}`; mount `getPenilaianStatus` → panel Riwayat; pills status/kesadaran + catatan; `SaveBtn` (disabled all-empty/loading) → `createPenilaianStatus` (+toast, reset, prepend). **Mock `STATUS_NOTES` dihapus** (riwayat murni dari DB; demo `igd-1` → lokal, mulai kosong).
- **DoD S:** ✅ `tsc` bersih · ✅ `eslint` 0 error (warning `_actor` precedent) · ✅ `migrate deploy`+`generate` · ✅ DB smoke (10 kolom · index · FK-bogus 23503). ⏳ verifikasi in-browser (login).

### Sub-menu 4 — Pediatrik ✅ SELESAI (2026-06-15)

Status pediatrik ringkas: berat lahir + usia gestasi + status imunisasi + tumbuh kembang + catatan (semua free-text). Append-only. Tidak menarik master.

- [x] **P1** [medicalrecord.prisma](prisma/schema/medicalrecord.prisma) — model **`PenilaianPediatrik`** (FK kunjungan cascade · beratLahir/usiaGestasi/imunisasi/tumbuhKembang/catatan TEXT default '' · pemeriksa/author · version · **append-only**) + backref `Kunjungan.penilaianPediatrik`. Index `(kunjungan_id, created_at)`. Migrasi `20260615170000_init_medicalrecord_penilaian_pediatrik`.
- [x] **P2** RBAC — **reuse `clinical.penilaian`** (read/create) — tanpa migrasi RBAC baru.
- [x] **P3** Lapisan — [Zod](src/lib/schemas/penilaian/penilaianPediatrik.ts) (Input OPTIONAL murni + DTO, tanggal/waktu derive createdAt TZ Asia/Jakarta) · [DAL](src/lib/dal/penilaian/penilaianPediatrikDal.ts) (list/findById/create) · [Service](src/lib/services/penilaian/penilaianPediatrikService.ts) (assertKunjungan · pemeriksa=resolveActorNama · guard all-empty → 422 · list/add) · route [GET+POST](src/app/api/v1/kunjungan/[id]/penilaian-pediatrik/route.ts) (gate `clinical.penilaian`) · [client](src/lib/api/penilaian/penilaianPediatrik.ts).
- [x] **P4** [PediatrikPanel (IGD)](src/components/igd/tabs/PenilaianTab.tsx) — terima ctx `{kunjunganId, isPersisted, perawat}`; mount `getPenilaianPediatrik` → panel Riwayat; `SaveBtn` (disabled all-empty/loading) → `createPenilaianPediatrik` (+toast, reset, prepend). Mock `igd-1` → lokal (riwayat sudah `[]`, tak ada mock yang dihapus).
- **DoD P:** ✅ `tsc` bersih · ✅ `eslint` 0 error (warning `_actor` precedent) · ✅ `migrate deploy`+`generate` · ✅ DB smoke (12 kolom · index · FK-bogus 23503). ⏳ verifikasi in-browser (login).

### Sisa sub-menu

> **Asesmen Risiko (Morse/Braden/Barthel + dst) ✅ SELESAI (2026-06-15)** — TIDAK lagi 3 sub-tab hardcode; **dikonsolidasi jadi 1 sub-tab generik "Asesmen Risiko"** yang menarik instrumen dari master `master.SkalaInstrument` (ter-assign unit via `konsumenModul`). Render generik (items×opsi + skor live + interpretasi, sadar `arah` inverse & `scoringMode`), simpan snapshot ke **`medicalrecord.penilaian_skala`** (1 tabel utk semua skala skoring; append-only). Endpoint read katalog **`GET /api/v1/master/skala-tersedia?modul=`** gate `clinical.penilaian:read` (pola `sdki-template`). Spec [docs/BACKEND-MASTER-SKALA-KLINIK.md §B.3](docs/BACKEND-MASTER-SKALA-KLINIK.md).

- ~~**Diagnosis**~~ → **DI-DROP (2026-06-15)** — redundan dgn tab **Diagnosa** (ICD terkode: tipe Komorbid · status Diferensial · alasan/analisa per diagnosis = single source billable) + **CPPT** (rencana tatalaksana = SOAP "P"). Sub-tab dihapus dari [PenilaianTab](src/components/igd/tabs/PenilaianTab.tsx); **tidak ada tabel `penilaian_diagnosis`**.
- [x] **Asesmen Risiko (Morse/Braden/Barthel/Humpty/Wong-Baker/FLACC/CPOT/NIPS/Braden Q/MST/STRONGkids)** → `penilaian_skala` (generik, master-driven, append-only snapshot) · [SkalaRisikoPanel](src/components/igd/tabs/penilaian/SkalaRisikoPanel.tsx). **Catatan model:** satu tabel `penilaian_skala` menggantikan rencana `penilaian_jatuh`/`penilaian_dekubitus`/`penilaian_barthel` terpisah — skala skoring berbagi satu bentuk (instrumen+jawaban+skor+interpretasi), beda dgn sub-menu bespoke (Fisik/Nyeri/Status/Pediatrik) yang field-nya unik.
- [x] **Jantung & Kanker (komposit) ✅ (2026-06-15)** — **Master Skala Penyakit dibangun** (`master.SkalaInstrument` kategori Penyakit, kode `SP-NNNN`, 6 instrumen seed: Killip/NYHA/TIMI/ECOG/Grade/Stadium AJCC) + CRUD page [/ehis-master/skala-penyakit](src/app/ehis-master/skala-penyakit/) (SSR-hybrid, accent violet) + service factory generik `makeSkalaService` (DRY: Risiko & Penyakit). Tab Penilaian **Jantung** ([JantungPanel](src/components/igd/tabs/penilaian/JantungPanel.tsx)) & **Kanker** ([KankerPanel](src/components/igd/tabs/penilaian/KankerPanel.tsx)) = **komposit**: klasifikasi baku (Killip/NYHA/TIMI · ECOG/Grade/Stadium) **dikomposisi dari master** via `GET /master/skala-tersedia?kategori=Penyakit&modul=` (dikenali per-nama: cardiac=/killip|nyha|timi/, onco=/ecog|grade|stadium/) + `<ScaleField>` (mesin skoring `computeScale` di shared), narasi/vocab tetap bespoke, **TNM (T/N/M) tetap vocab** (staging lookup site-specific, BUKAN skala). Disimpan snapshot ke **`medicalrecord.penilaian_komposit`** (1 tabel diskriminasi `jenis` Jantung/Kanker; `data` JSONB; append-only; `GET/POST /kunjungan/:id/penilaian-komposit?jenis=`). **Catatan:** asosiasi skala→panel via name-match (kode auto SP-NNNN); jika master di-rename, follow-up = tambah kolom `domain` tag.

---

## Catatan

- ABAC `requireScope` (unit-scope) = slice terpisah, MUST sebelum akun klinis unit-scoped live ([TECH_DEBT.md](TECH_DEBT.md#-auth--rbac-security) §🔑).
- Real-time board (commit + SSE) menggantikan `workflowStore` client-side — di luar slice rekam medis (lihat Key Architecture Decisions di [CLAUDE.md](CLAUDE.md)).
- Audit/access-log catatan sensitif (CPPT/diagnosa) — TODOS_BACKEND §security; desain tabel klinis sudah siapkan kolom audit.
