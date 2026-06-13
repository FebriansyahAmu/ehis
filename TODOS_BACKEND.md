# EHIS — Backend Implementation Roadmap

> Backend tasks dipetakan dari frontend yang sudah dibangun (lihat [CLAUDE.md](CLAUDE.md) untuk module map). Setiap modul frontend punya schema mock 1:1 dengan target real → backend tinggal implementasi API + database tanpa refactor UI.
>
> **Workflow docs**:
> - [CLAUDE.md](CLAUDE.md) — frontend state & module map
> - [TODO.md](TODO.md) — Master phase roadmap (frontend Phase 0–3 ✅)
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt & refactor pending
> - [.claude/DONE.md](.claude/DONE.md) — completed work archive
> - [.claude/STANDARDS.md](.claude/STANDARDS.md) — clinical standards reference

---

## 🎯 Strategi Migrasi

**Prinsip dasar:**
1. **Mock-first → swap pattern**: semua mock di `src/lib/master/*Mock.ts` punya schema 1:1 dengan target Prisma. Migrasi backend = ganti `import { X_MOCK } from "..."` → `await prisma.x.findMany()`. **Zero refactor UI**.
2. **Single source of truth**: `ORDERS_MOCK` adalah satu sumber untuk Lab/Rad/Farmasi/Resep. Saat migrasi, tabel `Order` jadi single source — UI tidak berubah.
3. **Workflow store pattern**: state mutasi (telaah farmasi, hasil lab, dosis rad) saat ini di `workflowStore` client-side. Backend perlu commit ke database + push update via real-time (WebSocket/SSE) atau polling.
4. **Audit trail wajib**: semua CUD operation harus tersimpan di `AuditLog` (siapa/kapan/apa). Beranda Master & Mapping Hub butuh ini untuk Recent-Edit feed.

---

## Phase B0 — Foundation Backend

### Setup
- [ ] **Database setup** — PostgreSQL 16+ (rekomendasi). Pertimbangkan: TimescaleDB extension untuk TTV history time-series.
- [ ] **Prisma schema** — `prisma/schema.prisma`. Mulai dari `PatientMaster`, expand ke modul lain.
- [ ] **Prisma generator output** — pindah dari `src/generated/prisma/` ke standar `@prisma/client`.
- [ ] **Database seeding** — script `prisma/seed.ts` yang import semua mock files dan populate database.
- [ ] **Migration strategy** — convention: `prisma migrate dev --name <descriptive>` per fitur.

### API Layer
- [ ] **API routes structure** — `src/app/api/<module>/<resource>/route.ts` (Next.js App Router). Konvensional: 1 file per resource, GET/POST/PUT/DELETE handlers.
- [ ] **Response envelope** — `{ ok: boolean, data?: T, error?: { code, message } }`. Konsisten untuk semua endpoints.
- [ ] **Pagination** — `?page=N&limit=M` dengan response `{ data, total, page, limit }`.
- [ ] **Error handler middleware** — wrap semua handlers, convert Prisma errors ke user-friendly messages.
- [ ] **Request validation** — pakai Zod schemas. Schema co-located di `src/lib/schemas/<module>.ts`.

### Authentication & RBAC
- [ ] **NextAuth.js setup** — credentials provider (username + password hash bcrypt). JWT session.
- [ ] **Auth middleware** — `src/middleware.ts` cek session di setiap route protected.
- [ ] **Role enforcement** — server-side check via `requireRole(req, role)`. Reject 403 jika role tidak sesuai.
- [ ] **Permission enforcement** — pakai `RBACMap` dari `mapping/rbac` untuk per-resource permission. Helper `hasPermission(user, resource, action)`.
- [ ] **Audit log** — log siapa login, logout, CUD operation. Tabel `AuditLog` (userId, action, resource, resourceId, payload, timestamp).

### Real-time Updates
- [ ] **WebSocket / SSE** — untuk live updates di worklist (Lab/Rad/Farmasi). Saat hasil rilis, pasien-side `OrderLabTab` auto-refresh.
- [ ] **Polling fallback** — kalau WebSocket tidak feasible, polling tiap 30s untuk worklist.

### Infrastructure
- [ ] **Docker setup** — `docker-compose.yml` untuk PostgreSQL + Redis + Next.js dev.
- [ ] **CI/CD pipeline** — GitHub Actions: lint + type check + test + build.
- [ ] **Backup strategy** — daily pg_dump ke S3 / object storage.
- [ ] **Monitoring** — logs (pino), metrics (Prometheus), error tracking (Sentry).
- [ ] **Performance** — Redis cache untuk master data (Obat/Tindakan/Penjamin) yang jarang berubah. Indexes pada `noRM`, `kode`, `tanggal`.
- [ ] **Security audit** — OWASP Top 10 review. Rate limiting (Upstash atau in-memory). Input sanitization.

---

## Phase B1 — Master Data Backend

Memetakan 25 master sub-module yang sudah dibangun di [/ehis-master](src/app/ehis-master/) (lihat [.claude/DONE.md](.claude/DONE.md) untuk detail UI).

### B1.1 Sumber Daya
- [✅] **`/api/v1/master/pegawai`** — Pegawai (HR/SDM) **layered penuh (2026-06-04)**: schema `master.Pegawai` (+ JadwalShift/Absensi/PegawaiKontakDarurat, eks-`sdm`, Jabatan/Golongan dibuang) · Zod [pegawai.ts](src/lib/schemas/pegawai.ts) · DAL [pegawaiDal.ts](src/lib/dal/pegawaiDal.ts) (cursor list+trigram, version-guard, soft-delete) · Service [pegawaiService.ts](src/lib/services/pegawaiService.ts) (PII NIK enc/hash, dedup NIK+NIP, clock-injected DTO mask) · Route [route.ts](src/app/api/v1/master/pegawai/route.ts)+[\[id\]](src/app/api/v1/master/pegawai/[id]/route.ts) (GET list/detail · POST · PATCH · DELETE soft) · **Unit test ✅** [pegawaiService.test.ts](src/lib/services/pegawaiService.test.ts) (19 test: dedup NIK/NIP · version guard · DTO mask · guard tanggal · profesi→isDokter · punyaAkun). **Contract align + wiring FE ✅ (2026-06-04/05):** enum `StatusPegawai` → `ASN/Outsourcing/Honorer/Magang/Mitra` (migrasi data-preserving remap PNS|PPPK→ASN, Kontrak→Outsourcing) + kolom baru `agama` & `profesi` (sumber kebenaran Dokter/Perawat/…; `isDokter` diturunkan dari profesi∈{Dokter,Dokter Gigi,Dokter Spesialis} ∨ practitionerId) + DTO `punyaAkun` (relasi balik `user`, deteksi pegawai tanpa akun). API client [pegawai.ts](src/lib/api/pegawai.ts): `createPegawai` (form→CreateInput) · `listPegawai` · `getPegawai` (detail) · `updatePegawai` (PATCH+version). **Wiring tabel Pengguna ([/ehis-master/pengguna](src/app/ehis-master/pengguna/)) FULL:** Step 1 Tambah Pengguna → `POST` · **baris kuning** = pegawai `punyaAkun:false` (GET list) + menu **"Buatkan Akun"** (wizard mode provisioning, mulai Step 2 dgn pegawaiId existing) + menu **"Ubah Data Pegawai"** → modal [PegawaiEditModal](src/components/master/pengguna/PegawaiEditModal.tsx) (GET detail→PATCH, NIK locked, version guard) · menu aksi via **portal** (`RowActionsMenu`, lepas overflow tabel). Error CONFLICT/CONFLICT_VERSION/VALIDATION tampil di banner. **Smoke test live ✅** (GET detail · PATCH update+isDokter derive · CONFLICT_VERSION). **Sisa:** NIP auto-generate non-ASN (butuh counter/sequence) · scopeBy(actor) saat auth siap · cek akun-yatim saat delete (use-case auth) · integration test DAL (Testcontainers) · paginasi tabel (limit 50, belum ada "muat lebih"/cursor UI).

- [✅] **`/api/v1/auth/users`** — Akun (provisioning, **WIRED 2026-06-05**, login/JWT BELUM): hash password [password.ts](src/lib/crypto/password.ts) (scrypt node:crypto — swappable argon2id) · Zod [user.ts](src/lib/schemas/user.ts) · DAL [userDal.ts](src/lib/dal/userDal.ts) (username citext-unik, 1 akun/pegawai, replaceRoles, resolve key→Role) · Service [userService.ts](src/lib/services/userService.ts) (zero-orphan: pegawai wajib ada via pegawaiDal · createUser · assignRoles transaksional) · Route [GET (list)](src/app/api/v1/auth/users/route.ts) + [POST /auth/users](src/app/api/v1/auth/users/route.ts) + [PATCH /auth/users/:id/roles](src/app/api/v1/auth/users/[id]/roles/route.ts) · **GET list WIRED ke tabel Pengguna** (gabung identitas pegawai · roles · status · map enum server→FE) · seed 9 Role [migration](prisma/migrations/20260604150000_seed_auth_roles/) · **Unit test ✅** [userService.test.ts](src/lib/services/userService.test.ts) (8 test) · **Smoke test live ✅** (create→assign→CONFLICT→VALIDATION). Wizard **Step 2 (Akun) & Step 3 (Peran) WIRED** ([users.ts](src/lib/api/users.ts) client). **Sisa (modul auth runtime):** login/verifyPassword · JWT+Redis revoke · getActor nyata · UserUnitScope (butuh master ruangan id) · status enum refine (`Non_Aktif`→`Locked` sementara) · swap scrypt→argon2id · DELETE/list akun · audit.

> **Provisioning ≠ runtime auth.** Akun + peran sudah bisa ditulis ke DB, TAPI belum ada login: `getActor()` masih DEV actor (super-akses), password belum pernah diverifikasi, tak ada sesi/JWT. Bangun di Phase B-Auth (BACKEND-AUTH.md).

> **Test infra (2026-06-04):** Vitest 4 dipasang — `vitest.config.ts` (resolve.tsconfigPaths native, env node) + script `npm run test` / `test:watch`. Pola unit Service: mock `@/lib/db/prisma` (`transaction` passthrough) + inject fake DAL & `fixedClock`. Integration DAL (Testcontainers Postgres) = `src/**/__tests__/integration/` (di-exclude unit run), fase later.
- [✅] **`/api/v1/master/{unit,ruangan,bed}`** — Organization tree (n-level) + Location + Bed sub-collection (2026-06-06). Layered (tree read + CUD, optimistic concurrency, soft-delete, kode auto `UN/R/BD<YYMM><NNN>`) WIRED ke [/ehis-master/ruangan](src/app/ehis-master/ruangan/) (SSR hybrid). **Sisa:** SD6 tests.
- [✅] **`/api/v1/master/dokter`** — Practitioner = **ekstensi klinis 1:1 Pegawai** (`pegawaiId @unique`; identitas read-only dari Pegawai — TIDAK diduplikasi; `Pegawai.practitionerId` pointer denormalized) (2026-06-06). Field kredensial: spesialis · STR · SIP · statusPraktik · ihsPractitionerId (**bukan** jadwal/poliAssignment — itu modul Jadwal Dokter & Mapping Hub). Provisioning dari pegawai profesi-dokter "tanpa-profil". Layered + SSR hybrid WIRED ke [/ehis-master/dokter](src/app/ehis-master/dokter/). **Sisa:** DK6 tests · seed by-NIK.
- [🚧] `/api/master/pengguna` (User) — **GET list + POST create + assign roles ✅ WIRED** via `/api/v1/auth/users` (tabel Pengguna tampil akun real, gabung pegawai-tanpa-akun baris kuning). **Sisa:** GET detail · PATCH edit akun (persist) · DELETE · `unitAssignment` (derived Mapping Hub, butuh master ruangan) · `dokterId?` link role klinis.

### B1.2 Katalog Klinis
> Spec lengkap → [docs/BACKEND-MASTER-KATALOG-KLINIS.md](docs/BACKEND-MASTER-KATALOG-KLINIS.md).
- [✅] `GET/POST/PATCH/DELETE /api/v1/master/obat` — `ObatRecord`. **(2026-06-13)** layered + SSR-hybrid wired ([KatalogObatPage](src/components/master/katalog-obat/KatalogObatPage.tsx)). HAM/LASA/Formularium flags · golongan UU 35/2009 · leaf tanpa version · **pemetaan KFA = kolom JSONB** (POA/POV/Rute/Bentuk+BZA → FHIR SatuSehat, tab Mapping KFA). **`OBAT_MOCK` dihapus** → [obatSeed.ts](src/lib/master/obatSeed.ts), **seeded 28 obat / 17 KFA / 4 LASA**; konsumen mock (Formularium/Distribusi/Beranda/billing) dimigrasi. Sisa: KO8 tests · KO9 KFA-live + cache. Spec §C.1.
- [✅] `GET/POST/PATCH/DELETE /api/v1/master/tindakan` — `TindakanRecord`. **(2026-06-12)** layered + SSR-hybrid wired ([KatalogTindakanPage](src/components/master/katalog-tindakan/KatalogTindakanPage.tsx)). Kode ICD-9 **opsional** · 16 kategori · status KPTL · leaf tanpa version. **Dikonsumsi Mapping Hub Layanan Unit** (baris). Sisa: KT8 tests · cache. Spec §A.
- [ ] `POST/GET/PUT/DELETE /api/master/katalog-lab` — `LabKatalogItem`. Nilai rujukan per gender/usia (**anak 1:N**). Critical low/high. Delta absolute/percent.
- [ ] `POST/GET/PUT/DELETE /api/master/katalog-radiologi` — `RadCatalogRecord`. Persiapan & protap. Kontras info. DRL referensi PMK 1014/2008.
- [✅] `GET/POST/PATCH/DELETE /api/v1/master/icd` (+`/import` bulk) — `IcdItem` (ICD-10 + ICD-9-CM). **(2026-06-07)** layered + FE wired + import Excel/CSV. Spec §B.
- [ ] `POST/GET/PUT/DELETE /api/master/sdki` — `SdkiItem` (SDKI/SIKI/SLKI). 5 kategori × 3 jenis. Import bulk PPNI dataset.

### B1.3 Skala Klinis
- [ ] `POST/GET/PUT/DELETE /api/master/skala-risiko` — `SkalaRisikoRecord` (Barthel/Morse/Braden/NRS/MUST).
- [ ] `POST/GET/PUT/DELETE /api/master/skala-umum` — `SkalaUmumRecord` (GCS/Kesadaran/KU/NEWS2/MEWS).
- [ ] `POST/GET/PUT/DELETE /api/master/skala-penyakit` — `SkalaPenyakitRecord` (Killip/NYHA/TIMI/ECOG/AJCC).
- [ ] `POST/GET/PUT/DELETE /api/master/triase-igd` — `TriaseRecord` (matrix levels × parameters).

### B1.4 Referensi
- [ ] `POST/GET/PUT/DELETE /api/master/asesmen-katalog` — `AsesmenItem` (120 entries × 11 kategori). SNOMED CT mapping.

### B1.5 Template & Enum
- [ ] `POST/GET/PUT/DELETE /api/master/status-enum` — `EnumGroup` (9 grup × 50 entri).
- [ ] `POST/GET/PUT/DELETE /api/master/template-anamnesis` — `TemplateAnamnesisItem`. Multi-context (IGD/RI/RJ).
- [ ] `POST/GET/PUT/DELETE /api/master/template-form` — `TemplateFormItem` (discriminated union: sbar/ic-risiko/surat/quick-text).

### B1.6 Workflow Klinis
- [ ] `POST/GET/PUT/DELETE /api/master/workflow-edukasi` — 7 koleksi × 57 entries. Topik/Media/Metode/Hambatan/Pemahaman/TandaBahaya/TipeInstruksi.
- [ ] `POST/GET/PUT/DELETE /api/master/discharge` — 5 sub-master shape berbeda. Homecare · Alat · Checklist · PhasePlanning · RisikoReadmisi (rule engine).
- [ ] `POST/GET/PUT/DELETE /api/master/operasional` — 4 sub-koleksi. Cairan I/O · Diet/Tekstur · Bundle HAI · Penyakit Isolasi.

### B1.7 Operasional
- [ ] `POST/GET/PUT/DELETE /api/master/tarif` — `TarifRecord` + `PaketLayanan`. Base price untuk Tarif Matrix di Mapping Hub.
- [ ] `POST/GET/PUT/DELETE /api/master/penjamin` — `PenjaminRecord`. BPJS V-Claim kode SMF.
- [ ] `POST/GET/PUT/DELETE /api/master/ppk` — `PPKRecord`. Faskes Rujukan.

### B1.8 Konfigurasi
- [ ] `POST/GET/PUT/DELETE /api/master/profil-rs` — Single record (singleton). Identitas/Alamat/Akreditasi/Shift/KOP.
  - Field `Shift` (jam Pagi/Siang/Malam) **unblock** `SHIFT_CFG` hardcode di `ppiIsolasiShared.ts` + `marShared.ts`.
  - Field `KOP` **unblock** semua `PrintPreviewModal` lintas modul.

### B1.9 Mapping Hub (8 sub-pages)
- [✅] **`/api/v1/master/penugasan-ruangan`** — SDM Assignment **per-RUANGAN** (revisi dari "× Unit", 2026-06-06): link N:M **Pegawai⇄Location** (`master.PenugasanRuangan`, hard-delete join table, unik pasangan, idempoten). Layered + SSR hybrid + optimistik POST/DELETE WIRED ke [Mapping Hub → SDM Assignment](src/components/master/mapping/sdm/). Roster = dokter REAL dari API. **TIDAK** push-back ke `poliAssignment` (field itu dibuang dari Dokter). Beda dari `auth.UserUnitScope` (ABAC, level Unit) & `Pegawai.unitKerja` (HR). Lihat [§C BACKEND-MASTER-SUMBER-DAYA](docs/BACKEND-MASTER-SUMBER-DAYA.md). **Sisa:** PR3 tests · tenaga non-dokter (saat Pengguna di-wire ke Pegawai).
- [🚧] `GET/PUT /api/master/mapping/kewenangan` — `KewenanganMap` (Dokter × Tindakan). PMK 755 credentialing. **Dokter source = API real ✅** (2026-06-06); map kewenangan masih **state-only** (default per spesialis) — persist tabel `DokterKewenangan` belum dibuat.
- [✅] `GET/POST/DELETE /api/v1/master/layanan-unit` — `LayananMap` (Tindakan × Ruangan). Heatmap matrix. **Sumber data REAL ✅ (2026-06-12)**: baris = tindakan DB (`/master/tindakan`), kolom = **Location aktif** dari master Unit & Ruangan (`unitsFromTree`, SSR hybrid). **Persist FULL ✅ (2026-06-12)**: tabel `master.LayananUnit` (join Tindakan⇄Location, hard-delete, grant/revoke idempoten, RBAC `master.mapping`) + DAL/Service(`list` actor-less)/client + **matriks ter-wire** (toggle sel/baris/kolom = grant/revoke optimistik + revert + auto-save, seed edge SSR) — pola `PenugasanRuangan`. Sisa (chargemaster CM2): selaraskan kode `unitDefault`↔Location + federasi Lab/Rad + pindah ke `Tarif.unitTerkait`.
- [ ] `GET/PUT /api/master/mapping/tarif` — `TarifMap[penjamin][tindakan][kelas] → harga`. 1470+ cell. Bulk adjust.
- [ ] `GET/PUT /api/master/mapping/formularium` — `FormulariumMap[penjamin][obat][kelas] → { allowed, alasan? }`. Per-tipe penjamin default rules.
- [ ] `GET/PUT /api/master/mapping/distribusi` — `DistribusiMap[depo][obat] → { stok, min, max }`. FEFO/FIFO untuk stock movement.
- [ ] `GET/PUT /api/master/mapping/penjamin-ruangan` — `MappingRuanganRecord`. BPJS V-Claim ruangan code.
- [ ] `GET/PUT /api/master/mapping/rbac` — `RBACMap[role][leafKey] → CrudAction[]`. 9 role × 27 permission × 5 action.

### B1.10 Beranda Master (Aggregator)
- [ ] `GET /api/master/stats` — aggregator untuk KPI Strip + Quick Nav count.
- [ ] `GET /api/master/recent-edits?limit=8` — query `AuditLog` lintas master, urut DESC by timestamp.
- [ ] `GET /api/master/mapping-coverage` — compute `filled/total` per matrix Mapping Hub.

---

## Phase B2 — Clinical Workflow Backend

### B2.1 Patient Management
- [ ] `POST/GET/PUT /api/pasien` — CRUD + search by NIK / RM. Demographics + alergi awal.
- [ ] `POST/GET /api/pasien/[id]/kunjungan` — visit registration. Link ke IGD/RI/RJ episode.
- [ ] `GET /api/pasien/[id]/timeline` — aggregator semua visit + medical event.

### B2.2 IGD
- [ ] `GET /api/igd/board` — worklist filter status/dokter/urgency. Pagination.
- [ ] `POST /api/igd/[id]/triase` — triase 5 level ESI + DOA.
- [ ] `POST/GET /api/igd/[id]/ttv` — vitals dengan trigger NEWS2 + GCS auto-calc server-side (atau client, decide).
- [ ] `POST/GET /api/igd/[id]/asesmen` — asesmen medis + alergi + riwayat.
- [ ] `POST/GET /api/igd/[id]/diagnosa` — diagnosa ICD-10 + ICD-9.
- [ ] `POST/GET /api/igd/[id]/cppt` — SOAP entries dengan verifikasi DPJP.
- [ ] `POST/GET /api/igd/[id]/tindakan` — tindakan medis dilakukan.
- [ ] `POST/GET /api/igd/[id]/informed-consent` — IC per tindakan + TTD digital.
- [ ] `POST/GET /api/igd/[id]/rekonsiliasi` — rekonsiliasi obat 3 fase (admisi/transfer/discharge).
- [ ] `POST/GET /api/igd/[id]/handover` — SBAR per shift.
- [ ] `POST/GET /api/igd/[id]/pulang/sbar-transfer` — transfer IGD→RI dengan read-back gate.

### B2.3 Rawat Inap
- [ ] `GET /api/ri/board` — worklist per ruangan + filter kelas/DPJP/status discharge.
- [ ] `POST/GET /api/ri/[id]/asesmen-awal` — 5 sub-tab (Anamnesis · Riwayat · Alergi · Skrining Gizi · Risiko).
- [ ] `POST/GET /api/ri/[id]/care-plan` — RAT 3 fase + multi-PPA (lihat [TECH_DEBT.md](TECH_DEBT.md#careplantab-rat) untuk multi-PPA extension).
- [ ] `POST/GET /api/ri/[id]/ttv` — vitals harian/per-shift.
- [ ] `POST/GET /api/ri/[id]/diagnosa` — diagnosa per kunjungan RI.
- [ ] `POST/GET /api/ri/[id]/cppt` — SOAP date-grouped + DPJP co-sign.
- [ ] `POST/GET /api/ri/[id]/keperawatan` — SDKI/SIKI/SLKI per masalah.
- [ ] `POST/GET /api/ri/[id]/pemeriksaan` — status fisik 11 sistem head-to-toe.
- [ ] `POST/GET /api/ri/[id]/intake-output` — I/O harian + IWL auto-calc + balance.
- [ ] `POST/GET /api/ri/[id]/gizi-nutrisi` — diet order + dietitian addendum + monitoring 3 makan/hari.
- [ ] `POST/GET /api/ri/[id]/handover` — SBAR per shift.
- [ ] `POST/GET /api/ri/[id]/isolasi` — flag isolasi + bundle HAI per shift (VAP/CAUTI/CLABSI).
- [ ] `POST/GET /api/ri/[id]/icu-scoring` — SOFA + APACHE II (conditional ICU/HCU).
- [ ] `POST/GET /api/ri/[id]/discharge` — Discharge Planning 3-step.
- [ ] `POST/GET /api/ri/[id]/pasien-pulang` — 5 sub-tab (Status/Obat/Surat/Resume Medik/Resume Pulang).
- [ ] `POST/GET /api/ri/[id]/mar` — Medication Admin Record per shift (gate setelah farmasi `Selesai` — lihat [TECH_DEBT.md](TECH_DEBT.md#mar-medication-administration-record)).
- [ ] `POST/GET /api/ri/[id]/konseling` — konseling obat pulang.

### B2.4 Rawat Jalan
- [ ] `GET /api/rj/board` — antrian per poli.
- [ ] `POST/GET /api/rj/[id]/asesmen-awal` — 3 sub-tab (Anamnesis · Riwayat · Alergi).
- [ ] `POST/GET /api/rj/[id]/ttv` — vitals tunggal.
- [ ] `POST/GET /api/rj/[id]/cppt` — SOAP per visit.
- [ ] `POST/GET /api/rj/[id]/diagnosa` — diagnosa per visit.
- [ ] `POST/GET /api/rj/[id]/pemeriksaan` — status fisik.
- [ ] `POST/GET /api/rj/[id]/konsultasi` — SBAR closed-loop antar SMF.
- [ ] `POST/GET /api/rj/[id]/informed-consent` — IC per tindakan.
- [ ] `POST/GET /api/rj/[id]/surat-dokumen` — 4 jenis surat (Sakit/Kontrol/Sehat/Resume Medis).
- [ ] `POST/GET /api/rj/[id]/disposisi` — Rujuk Internal/Eksternal + Admisi RI.

### B2.5 Shared Medical Records
- [ ] `POST/GET/PUT /api/orders` — single source `Order` table. Tipe: `Lab | Rad | Resep | Tindakan`. Status workflow. Replace `ORDERS_MOCK` di `daftarOrderShared.ts`.
- [ ] `POST/GET /api/medical-records/diagnosa` — shared types (Utama/Sekunder/Komplikasi/Komorbid + INA-CBG preview).
- [ ] `POST/GET /api/medical-records/informed-consent` — template per tindakan + TTD digital + saksi + nomor IC. PMK 290/2008.
- [ ] `POST/GET /api/medical-records/rekonsiliasi` — 3 fase per context (IGD/RI). HAM detection.

### B2.6 Farmasi
- [ ] `GET /api/farmasi/board` — cross-patient worklist. Filter depo/HAM/prioritas.
- [ ] `GET /api/farmasi/order/[id]` — detail order per resep.
- [ ] `POST /api/farmasi/order/[id]/telaah` — 3-checklist (Adm/Farm/Klin) + HAM warning + Setujui/Kembalikan + formularium justifikasi.
- [ ] `POST /api/farmasi/order/[id]/dispensing` — Lot/Batch/Expired/label entry.
- [ ] `POST /api/farmasi/order/[id]/serah-terima` — penerima + cara pemberian + edukasi.
- [ ] `POST/GET /api/farmasi/narpsi` — Register Narkotika/Psikotropika. UU 35/2009.
- [ ] `POST/GET /api/farmasi/order/[id]/pto` — Pemantauan Terapi Obat.
- [ ] `POST/GET /api/farmasi/order/[id]/meso` — Monitoring Efek Samping Obat (WHO-UMC causality + BPOM flag).
- [ ] `POST/GET /api/farmasi/order/[id]/drp` — Drug-Related Problems (PCNE V9).
- [ ] `POST/GET /api/farmasi/order/[id]/konseling` — discharge counseling.
- [ ] `POST/GET /api/farmasi/order/[id]/pengembalian` — pengembalian obat pasien pulang.
- [ ] `POST/GET /api/farmasi/pio` — Pelayanan Informasi Obat log.

### B2.7 Laboratorium
- [ ] `GET /api/lab/board` — worklist. Filter unit/status/CITO. Critical value alert banner.
- [ ] `GET /api/lab/order/[id]` — detail order + timestamps 7 fase TAT.
- [ ] `POST /api/lab/order/[id]/penerimaan` — verifikasi identitas (3 identity card SKP 1).
- [ ] `POST /api/lab/order/[id]/sampel` — pengambilan + registrasi (jenis tabung, volume, kondisi).
- [ ] `POST /api/lab/order/[id]/penolakan` — specimen rejection flow.
- [ ] `POST /api/lab/order/[id]/hasil` — entry hasil + autoFlag(N/H/L/C) + delta check banner.
- [ ] `POST /api/lab/order/[id]/critical-value` — wajib intercept sebelum save. Method (Telepon/SMS/WA/Langsung) + dokter + pelapor.
- [ ] `POST /api/lab/order/[id]/validasi` — review SpPK + 2-checkbox + TTD digital.
- [ ] `POST/GET /api/lab/order/[id]/poct` — Point of Care Testing entry.
- [ ] `POST /api/lab/order/[id]/add-on` — add-on test (specimen validity check).
- [ ] `GET /api/lab/trend/[noRM]` — trend & riwayat hasil per pasien lintas kunjungan.
- [ ] `POST/GET /api/lab/qc/internal` — Levey-Jennings + Westgard rule auto-check.
- [ ] `POST/GET /api/lab/reagen` — stok reagen + alert kritis/kadaluarsa.
- [ ] `POST/GET /api/lab/kalibrasi` — log kalibrasi per instrumen.
- [ ] `POST/GET /api/lab/eqa` — EQA / Proficiency Testing siklus.
- [ ] `GET /api/lab/register` — register harian + filter periode.
- [ ] `GET /api/lab/laporan/bulanan` — KPI bulanan (total/TAT/% target/kritis).

### B2.8 Radiologi
- [ ] `GET /api/rad/board` — worklist. Filter unit/modalitas/CITO. Critical finding banner.
- [ ] `GET /api/rad/order/[id]` — detail order + timestamps 8 fase TAT.
- [ ] `POST /api/rad/order/[id]/verifikasi` — verifikasi identitas + radiografer.
- [ ] `POST /api/rad/order/[id]/persiapan` — protap per modalitas + kontras panel (jenis/dosis/premedikasi).
- [ ] `POST /api/rad/order/[id]/akuisisi` — parameter teknis per modalitas + DRL log (CTDIvol/DLP/DAP/entrance dose) + proteksi checklist.
- [ ] `POST /api/rad/order/[id]/ekspertise` — 5 report fields (Indikasi/Teknik/Temuan/Kesan/Saran) + critical findings selector.
- [ ] `POST /api/rad/order/[id]/critical-finding` — intercept sebelum rilis. Per-temuan konfirmasi + log.
- [ ] `POST /api/rad/order/[id]/validasi` — review + 2-checkbox + validator name.
- [ ] `POST/GET /api/rad/kontras-history/[noRM]` — alergi kontras & premedikasi tracker.
- [ ] `POST/GET /api/rad/qc/pesawat` — kalibrasi & uji kesesuaian per pesawat.
- [ ] `POST/GET /api/rad/dosis` — log dosis radiasi + DRL monitoring + alert exceeded.
- [ ] `POST/GET /api/rad/eqa` — EQA / Phantom Test.
- [ ] `GET /api/rad/register` — register harian + filter periode.
- [ ] `GET /api/rad/laporan/bulanan` — KPI bulanan + DRL exceeded rate.

---

## Phase B3 — Integration & Compliance

### B3.1 SatuSehat / FHIR (`/ehis-fhir` module — frontend belum dibangun, lihat [TECH_DEBT.md](TECH_DEBT.md#modul-belum-dibangun))
- [ ] **Konfigurasi** — endpoint env (sandbox/prod) + credential storage encrypted + Org_id Root SatuSehat.
- [ ] **Adapter layer** — `lib/fhir/adapters/{toFhirOrganization,toFhirLocation,toFhirPractitioner,toFhirPatient,toFhirEncounter,toFhirObservation,toFhirCondition,toFhirMedicationRequest,toFhirServiceRequest,toFhirDiagnosticReport}`. DB EHIS-first → FHIR R4 payload.
- [ ] **Sync resource** — endpoints untuk push/pull per resource. Status: NotSynced/Synced/Error.
- [ ] **NIK lookup Practitioner** — GET by NIK ke SatuSehat untuk auto-populate data dokter.
- [ ] **Sync log** — `FHIRSyncLog` tabel (resource, action, request, response, status, timestamp).
- [ ] **Conflict resolution** — payload diff bila inconsistency antara EHIS state vs SatuSehat response.

### B3.2 BPJS V-Claim
- [ ] **SEP creation** — POST ke V-Claim saat admisi RI / kunjungan RJ. Validasi peserta + cocokkan poli/ruangan dengan kode BPJS (lihat `bpjsRuanganCatalog.ts`).
- [ ] **Claim submission** — POST ke V-Claim saat resume medik finalize. Kirim ICD-10 + ICD-9 + tindakan + LOS + tarif INA-CBG.
- [ ] **Kepesertaan check** — verifikasi status peserta BPJS (aktif/non-aktif/tunggakan).
- [ ] **Rujukan FKTP** — terima rujukan dari FKTP via API gateway BPJS.

### B3.5 BPJS Integration Hub Backend (Phase B-BPJS)

> Frontend **100% selesai** di `/ehis-bpjs` (lihat [TODO-BPJS.md](TODO-BPJS.md)). Semua adapter sekarang mock `simulateLatency` + `shouldSimulateNetworkError`. Backend swap = ganti body adapter function + hapus mock preflight.

#### Credentials & Security
- [ ] **Secret manager** — `consId` / `consSecret` / `userKey` wajib di-store di Vault / AWS Secrets Manager / env-encrypted, **bukan** plaintext di `.env`. Inject ke adapter via server-side env di `credentialsStore.ts`.
- [ ] **Real HMAC-SHA256 signature** — ganti `authHeader.ts` mock dengan Node.js `crypto.createHmac('sha256', consSecret).update(payload).digest('base64')`. Timestamp Unix second mandatory.
- [ ] **Real LZ-String compression** — `npm install lz-string`. Ganti no-op di `lzStringHelper.ts` dengan `LZString.compressToEncodedURIComponent(payload)` (V-Claim wajib untuk payload large).

#### HTTP Transport
- [ ] **V-Claim HTTP client** — wrapper `fetch` / Axios ke `https://apijkn.bpjs-kesehatan.go.id/vclaim-rest/` + Aplicares base URL. Headers: `x-cons-id`, `x-timestamp`, `x-signature`, `user_key`, `Content-Type: application/json`.
- [ ] **Timeout + circuit breaker** — timeout 10s per call. Circuit breaker pattern: open setelah 5 consecutive error, half-open probe setiap 60s. Library: `cockatiel` atau custom.
- [ ] **Rate limiting per cons-id** — BPJS impose ~1000 req/hari per cons-id. Counter di Redis, reject early (HTTP 429 ke UI) jika quota hampir habis.
- [ ] **Retry queue** — failed mutation (POST/PUT/DELETE) queue via BullMQ + Redis. Exponential backoff: 30s → 2m → 10m → manual. Same idempotency key (sudah di-generate frontend di `idempotencyKey.ts`).

#### Audit Log Persistence
- [ ] **`BPJSAuditLog` DB table** — persist `BPJSAuditEntry` ke PostgreSQL. Retention 5 tahun per UU PDP 27/2022. Columns: id, timestamp, endpoint, method, requestHash, responseCode, success, durationMs, actor, actorRole, consId, idempotencyKey, errorType, retryCount.
- [ ] **Swap `auditStore.ts`** — client-side ring buffer cukup untuk demo. Backend: ganti `logAuditEntry()` → `POST /api/bpjs/audit/log`. Sync tetap ke client store untuk real-time Beranda panel.
- [ ] **`GET /api/bpjs/audit`** — filter endpoint/method/actor/periode/status. Pagination. Export CSV endpoint.

#### Reference Sync Scheduler
- [ ] **Cron job referensi** — BullMQ repeatable job sync kode referensi BPJS (poli, faskes, diagnosa, spesialis, dokter) dengan interval configurable (default 24h). Endpoint: `POST /api/bpjs/admin/sync-references`.
- [ ] **`referenceCache.ts` persistence** — swap in-memory Map → Redis dengan TTL sesuai `CACHE_TTL` per kind. Key: `bpjs:ref:{kind}`. Atomic update via `SET EX`.
- [ ] **Notifikasi stale** — jika referensi expired saat UI cek, trigger background re-sync + push WebSocket event ke Beranda panel (Reference tab staleness dot update).

#### Aplicares Bed Sync
- [ ] **WebSocket push untuk bed status** — Aplicares kirim update ketersediaan kamar via polling atau webhook. Backend polling 5 menit ke `getKetersediaan()` → update `AplicaresKamar` table → push via WebSocket/SSE ke `KetersediaanKamarPage`.
- [ ] **`AplicaresKamar` DB table** — sync dari `APLICARES_KAMAR_MOCK`. Update `lastSyncISO`, `tersedia`, `terisi`, `maintenance` per row.
- [ ] **Maintenance log** — `AplicaresMaintenanceLog` table: kamarId, startedAt, endAt, alasan, userId. Untuk audit dan reporting BOR.

#### Integration Points (consumer modules)
- [ ] **`/ehis-registration` admisi** — saat admisi pasien BPJS, call `insertSEP()` dari `vClaimSEP.ts` (sudah ada mock). Inject consId dari server env.
- [ ] **`/ehis-care/rawat-inap` pulang** — saat discharge finalized, call `updateTglPulang()` + `updateKamar()` (set bed Tersedia). Sudah di-wire di frontend `PasienPulangTab` via mock.
- [ ] **`/ehis-eklaim` submit** — `vClaimAdapter.submitClaim()` di `SubmissionTab.tsx` sudah consume real adapter path. Backend tinggal ganti mock transport → real HTTP.

#### Effort Estimate B-BPJS
| Sub-task | Estimasi |
|---|---|
| Credentials + HMAC + LZ | 2–3 hari |
| HTTP transport + circuit breaker + rate limit | 3–4 hari |
| Audit DB + swap auditStore | 2–3 hari |
| Reference cache Redis + cron | 3–4 hari |
| Aplicares bed sync + WebSocket | 3–5 hari |
| Integration points (Reg/RI/Eklaim) | 2–3 hari |
| **Total** | **~15–22 hari (3–4.5 minggu)** |

### B3.3 Audit Trail
- [ ] **`AuditLog` table** — userId, action (CREATE/UPDATE/DELETE/LOGIN/LOGOUT/VIEW), resource (entity name), resourceId, payloadBefore, payloadAfter, ipAddress, userAgent, timestamp.
- [ ] **Middleware** — wrap semua CUD operation otomatis log.
- [ ] **Query endpoints** — `GET /api/audit-log?resource=&user=&from=&to=`. Filter + pagination.
- [ ] **Beranda Master integration** — query untuk `RecentEditsPanel` (lihat `berandaShared.ts` `RECENT_EDITS_MOCK`).

### B3.4 Reports
- [ ] `GET /api/reports/lab/bulanan` — total/TAT avg/% target/kritis/ditolak/distribusi kategori.
- [ ] `GET /api/reports/rad/bulanan` — total/TAT/DRL exceeded/distribusi modalitas.
- [ ] `GET /api/reports/farmasi/narpsi-bulanan` — register N/P bulanan untuk BPOM.
- [ ] `GET /api/reports/billing/harian` — pendapatan harian per kasir.
- [ ] `GET /api/reports/clinical/quality-indicators` — SNARS KPIs (HAI rate, LOS, mortality, readmission, dll).
- [ ] **Export Excel/PDF** — pakai `exceljs` atau `xlsx`. PDF via `@react-pdf/renderer`.

---

## Phase B4 — Performance & Polish

### Caching
- [ ] **Redis cache** — master data (Obat/Tindakan/Penjamin) di-cache dengan TTL 1 jam. Invalidate saat CUD.
- [ ] **Edge caching** — Next.js `revalidatePath()` untuk worklist after status mutation.

### Indexing
- [ ] **Database indexes** — `Patient.noRM`, `Order.status`, `Order.tanggalOrder`, `CPPT.tanggal`, `TTV.tanggal`, `Diagnosa.kodeIcd10`.
- [ ] **Composite indexes** — `(noRM, tanggal)` untuk timeline queries.

### Optimasi
- [ ] **N+1 query audit** — pakai Prisma `include`/`select` strategis.
- [ ] **Pagination wajib** — semua list endpoint default `limit=20`.
- [ ] **Streaming SSR** — pakai React 19 Suspense untuk slow endpoints (laporan bulanan).

### Security
- [ ] **CSRF protection** — NextAuth.js built-in.
- [ ] **Rate limiting** — Upstash Ratelimit di edge middleware.
- [ ] **SQL injection** — Prisma parameterized query (default safe).
- [ ] **XSS** — React auto-escape (default safe). Sanitize Markdown jika ada di catatan klinis.
- [ ] **HIPAA-equivalent compliance** — encrypted at rest + in transit. Access log per record sensitif (CPPT, diagnosa).

---

## 📊 Estimasi Effort

| Phase | Scope | Estimasi |
|---|---|---|
| B0 — Foundation | Prisma + Auth + RBAC + Infra | 3–4 minggu |
| B1 — Master Data | 25 sub-master + 8 mapping + 3 aggregator | 4–5 minggu |
| B2 — Clinical Workflow | IGD + RI + RJ + Farmasi + Lab + Rad | 8–10 minggu |
| B3 — Integration | FHIR + BPJS + Audit + Reports | 4–6 minggu |
| B4 — Performance & Polish | Cache + Index + Security | 2–3 minggu |
| **Total** | | **~21–28 minggu (5–7 bulan)** |

**Catatan:** estimasi single developer. Bisa diparalelkan dengan tim 2–3 backend dev.

---

## 🔗 Cross-References

- Untuk **schema mock** yang jadi target Prisma: `src/lib/master/*Mock.ts` (master) + `src/lib/data.ts` (clinical).
- Untuk **types yang harus dipertahankan** (data contracts): lihat `## Key Data Contracts` di [CLAUDE.md](CLAUDE.md#key-data-contracts).
- Untuk **tech debt** terkait migrasi backend: lihat [TECH_DEBT.md](TECH_DEBT.md#-cross-module).
- Untuk **clinical standards** yang harus dipatuhi (SNARS, PMK, ISO): lihat [.claude/STANDARDS.md](.claude/STANDARDS.md).
