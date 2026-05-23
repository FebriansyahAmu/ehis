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
- [ ] `POST/GET/PUT/DELETE /api/master/ruangan` — Organization tree (n-level) + Location + Bed sub-collection. Hirarki via `parentId`. Type: Organization | Location dengan discriminator.
- [ ] `POST/GET/PUT/DELETE /api/master/dokter` — Practitioner. Field: NIK · STR · SIP · spesialis · jadwal · `poliAssignment` (derived dari Mapping Hub).
- [ ] `POST/GET/PUT/DELETE /api/master/pengguna` — User. Field: username · email · roleId · `unitAssignment` (derived dari Mapping Hub) · `dokterId?` (link untuk role klinis).

### B1.2 Katalog Klinis
- [ ] `POST/GET/PUT/DELETE /api/master/katalog-obat` — `ObatRecord` (30+ field). HAM/LASA/Formularium flags. Golongan UU 35/2009.
- [ ] `POST/GET/PUT/DELETE /api/master/katalog-tindakan` — `TindakanRecord`. ICD-9-CM. Kompleksitas. Spesialis & unit default.
- [ ] `POST/GET/PUT/DELETE /api/master/katalog-lab` — `LabKatalogItem`. Nilai rujukan per gender/usia. Critical low/high. Delta absolute/percent.
- [ ] `POST/GET/PUT/DELETE /api/master/katalog-radiologi` — `RadCatalogRecord`. Persiapan & protap. Kontras info. DRL referensi PMK 1014/2008.
- [ ] `POST/GET/PUT/DELETE /api/master/icd` — `IcdItem` (ICD-10 + ICD-9-CM). **Import bulk CSV** untuk full WHO dataset (~15.000 ICD-10).
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
- [ ] `GET/PUT /api/master/mapping/sdm` — `AssignmentMap` (SDM × Unit). Push back ke `Dokter.poliAssignment` / `Pengguna.unitAssignment` saat update (lihat [TECH_DEBT.md](TECH_DEBT.md#mapping-hub) Bidirectional sync).
- [ ] `GET/PUT /api/master/mapping/kewenangan` — `KewenanganMap` (Dokter × Tindakan). PMK 755 credentialing.
- [ ] `GET/PUT /api/master/mapping/layanan` — `LayananMap` (Tindakan × Unit). Heatmap matrix.
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
