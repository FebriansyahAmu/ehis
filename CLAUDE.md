# EHIS — Project Context & Active Work

> **Read this first every new session.** Lean overview — state of the project + active work only.
> **Before switching tasks:** (1) check off completed items, (2) move them to [.claude/DONE.md](.claude/DONE.md), (3) add new findings to [TECH_DEBT.md](TECH_DEBT.md).

## 🧭 Workflow Docs

| File | Purpose |
|---|---|
| [CLAUDE.md](CLAUDE.md) | **You are here.** Current state · active work · key data contracts. |
| [TODO.md](TODO.md) | Master phase roadmap — Phase 0–3 frontend ✅ 100% (30/30). |
| [TODO-BILLING.md](TODO-BILLING.md) | **Billing Kasir roadmap** — Fase BL0–BL9 (35 task, ~3 minggu). Core operasional ✅ (BL1+BL2+BL3+BL8 100% · BL6 ~80%). |
| [TODO-EKLAIM.md](TODO-EKLAIM.md) | **E-Klaim BPJS/Asuransi roadmap** — Fase EK0–EK9 (38 task, ~3.5-4.5 minggu). Pisah dari billing per scope-split 2026-05-24. **Pivot 2026-05-26: iDRG primary** (resmi 1 Okt 2025 Kemenkes), INA-CBG = legacy adapter Phase later. |
| [TODO-BPJS.md](TODO-BPJS.md) | **BPJS Integration Hub roadmap** — Fase BP0–BP8 (44 section). **✅ 100% SELESAI** (2026-05-30) — V-Claim 5 sub-menu + Aplicares 3 sub-menu + Audit Trail + 3 Print Template + Workflow Docs. |
| [TODO-CLINICAL.md](TODO-CLINICAL.md) | **Rekam Medis Klinis (backend) roadmap** — 19 tab IGD → ~9 domain klinis lintas-unit (schema Postgres baru `medicalrecord`, append-only). **Domain 1 Triase: Fase A backend ✅** (2026-06-07) — `medicalrecord.Triase` + `/api/v1/kunjungan/:id/triase` GET/POST layered, sinkron `kunjungan.triaseLevel`. Sisa: Fase B/C wiring UI + domain berikutnya (Observation→CPPT→Condition→Procedure→…). **TindakanMedis ✅ (2026-06-12)** — `medicalrecord.TindakanMedis` + `/kunjungan/:id/tindakan` (CRUD layered, gate `clinical.tindakan` full CRUD Admin/Dokter/Perawat, snapshot biaya), tab Tindakan IGD persist saat kunjunganId UUID. **Keperawatan ✅ (2026-06-14, Domain 9 A+B+C)** — `medicalrecord.AsuhanKeperawatan` + `/kunjungan/:id/asuhan-keperawatan` (CRUD + verify co-sign; gate **`clinical.keperawatan`** resource baru, Perawat penulis utama); **evaluasi shift = tabel anak `medicalrecord.AsuhanEvaluasi`** append-only + endpoint `/asuhan-keperawatan/:itemId/evaluasi` (GET/POST), form DateTimePicker+Select+perawat sesi (Fase C); template asuhan dari DB `master.sdki` via `/master/sdki-template` (gate klinis); tab Keperawatan IGD wired (tanggal=DateTimePicker · perawat=sesi login · auto-fill template). **Pemeriksaan Fisik ✅ IGD (2026-06-14, Domain 10 A+B+C)** — `medicalrecord.PemeriksaanFisik` append-only "latest wins" + `/kunjungan/:id/pemeriksaan-fisik` (GET/POST); **sub Anatomi = `medicalrecord.PenandaanAnatomi`** (daftar hidup body-map, `/kunjungan/:id/penandaan-anatomi` GET/POST + `/:itemId` PATCH/DELETE — toggle area→create/soft-delete, catatan→update); gate **`clinical.pemeriksaan`** (r/c/u/d Dokter+Perawat); meta waktu=DateTimePicker · dokter=roster ruangan (`/kunjungan/:id/petugas`) · perawat=sesi login; +Mobilitas +Catatan generalis +Temuan manual; IGD head-to-toe (RI/RJ per-sistem ditunda → TECH_DEBT). |
| [TECH_DEBT.md](TECH_DEBT.md) | Tech debt registry per-modul + cross-cutting. |
| [TODOS_BACKEND.md](TODOS_BACKEND.md) | Backend implementation roadmap (B0–B4, ~5–7 bulan). |
| [TODO-CHARGEMASTER.md](TODO-CHARGEMASTER.md) | **Chargemaster / Billable-Service federation (Opsi A)** — Fase CM0–CM5. Pisah katalog klinis vs layer tarif/billable; federasi Tindakan+Lab+Rad → Mapping Hub Tarif + Layanan Unit + billing. 📋 Planned. |
| [docs/BACKEND-MASTER-KATALOG-KLINIS.md](docs/BACKEND-MASTER-KATALOG-KLINIS.md) | **Backend grup Katalog Klinis** — Tindakan ✅ · ICD ✅ · Obat ✅ · Lab ✅ · Keperawatan/SDKI ✅ · Rad 📋. |
| [docs/BACKEND-MAPPING.md](docs/BACKEND-MAPPING.md) | **Backend Mapping Hub** (`/ehis-master/mapping`) — status per sub-pane: SDM ✅ · Layanan Unit ✅ · RBAC ✅ · Tarif ✅ · Formularium ✅ · Kewenangan 🟡 · Distribusi/Penjamin 📋. |
| [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md) | **Kontrak backend INTI** — layering · error · data rules · API · DoD (_mengapa_). Menang bila konflik. |
| [docs/API-RULES.md](docs/API-RULES.md) | **Resep endpoint konkret** — pola `route()`, error handling, peta file kanonik (_bagaimana_ menulis endpoint). Baca sebelum tambah/ubah API. |
| [.claude/DONE.md](.claude/DONE.md) | Completed work archive (history per modul). |
| [.claude/GAP_ANALYSIS.md](.claude/GAP_ANALYSIS.md) | Clinical gap audit (SNARS/PMK/ISO). |
| [.claude/STANDARDS.md](.claude/STANDARDS.md) | Clinical standards reference. |
| `@.claude/skills/frontend-design/SKILL.md` | Frontend design skill. |

---

## 🛠 Stack

Next.js 16.2.3 App Router · React 19.2.4 · TypeScript 5 · Tailwind v4 (`@tailwindcss/postcss`) · Framer Motion 12 · Lucide React 1.8 · Prisma 7.7 (generated at `src/generated/prisma/`) · ESLint 9

**Convention:** `cn()` di `src/lib/utils.ts` · Navigation di `src/lib/navigation.ts` · Mock data klinis di `src/lib/data.ts` · Mock master di `src/lib/master/*Mock.ts` · Shared medical-records di `src/components/shared/medical-records/` · Master Template Layer di `src/components/master/shared/`.

---

## 📦 Module Map

| Route                      | Module           | Status                          |
| -------------------------- | ---------------- | ------------------------------- |
| `/ehis-care/igd`           | IGD              | ✅ 100% (19 tab aktif)          |
| `/ehis-care/rawat-inap`    | Rawat Inap       | ✅ 100% (19 tab aktif)          |
| `/ehis-care/rawat-jalan`   | Rawat Jalan      | ✅ 100% (13 tab aktif)          |
| `/ehis-care/farmasi`       | Farmasi          | ✅ 100% (4 layer + Gap SNARS T1–T3) |
| `/ehis-care/laboratorium`  | Laboratorium     | ✅ 100% (Tier 1+2+3)            |
| `/ehis-care/radiologi`     | Radiologi        | ✅ 100% (Tier 1+2+3)            |
| `/ehis-master`             | Master Data      | ✅ 100% FE (26 sub-master + 8 mapping + Beranda) — incl. **Jadwal Dokter** (single source HFIS, dikonsumsi Antrean/RJ). **Backend: Pegawai + Pengguna ✅ (2026-06-05)** — `/api/v1/master/pegawai` (CRUD layered: list/detail/create/update PATCH+version/soft-delete; enum ASN/Outsourcing + kolom agama/profesi/punyaAkun) + `/api/v1/auth/users` (provisioning: create + assign roles + list; hash scrypt; seed 9 Role) **WIRED penuh ke tabel [/ehis-master/pengguna](src/app/ehis-master/pengguna/)** (Tambah Pengguna 3-step · baris kuning pegawai-tanpa-akun · Buatkan Akun · Ubah Data Pegawai). **Unit & Ruangan ✅ (2026-06-06)** — `/api/v1/master/{unit,ruangan,bed}` (tree + CUD layered, optimistic concurrency, soft-delete) WIRED ke [/ehis-master/ruangan](src/app/ehis-master/ruangan/) (kode auto `UN/R/BD<YYMM><NNN>` · toast · ConfirmDialog · rekonsiliasi bed granular). **Dokter & Nakes ✅ (2026-06-06)** — `/api/v1/master/dokter` (CRUD layered; Dokter = ekstensi 1:1 Pegawai via `pegawaiId`, identitas read-only dari Pegawai, provisioning dari pegawai profesi-dokter "tanpa-profil") WIRED ke [/ehis-master/dokter](src/app/ehis-master/dokter/) (modal **"Lengkapi Profil"** gantikan tombol Tambah · SSR hybrid · STR/SIP expired badge). **SDM Assignment ✅ (2026-06-06)** — `/api/v1/master/penugasan-ruangan` (link N:M **Pegawai⇄Location**, hard-delete join table, idempoten) WIRED ke [Mapping Hub → SDM Assignment](src/components/master/mapping/sdm/) (tree Unit→Ruangan, assign **per-ruangan**, optimistik POST/DELETE + toast sukses/warning, SSR hybrid). **Mapping Hub SDM Assignment + Kewenangan Klinis kini konsumsi dokter REAL dari API** (semua mock dokter dihapus). **Pengguna + Ruangan + Dokter + Penugasan pakai SSR hybrid** (first paint via Service langsung, CUD client — API-RULES §6.1). **Auth AKTIF ✅ (2026-06-07, `AUTH_ENFORCE=true`)** — login/JWT/RBAC ditegakkan (getActor/getServerActor verifikasi token; superadmin Admin global). **RBAC modul + ABAC unit-scope ✅ (2026-06-11, RBAC-MODUL Fase 4)** — visibilitas modul/menu/aksi per-role; gate MODUL≠DATA (`registration.loket`/`master.view`); **ABAC careUnit** dari `Pegawai.unitKerja` ditegakkan 4 titik (nav · worklist · detail · choke-point `route()` utk semua `clinical.*`); penunjang Lab/Rad/Farmasi berdiri-sendiri via `ancillary.*`; rekam medis shared = `clinical.rekammedis`. Lihat [TODO-RBAC-MODUL.md](TODO-RBAC-MODUL.md) · [docs/BACKEND-AUTH.md](docs/BACKEND-AUTH.md) · [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md#6-authentication--authorization--4-lapis) · [docs/API-RULES.md](docs/API-RULES.md) · [docs/BACKEND-MASTER-SUMBER-DAYA.md](docs/BACKEND-MASTER-SUMBER-DAYA.md) · [TODOS_BACKEND.md](TODOS_BACKEND.md#b11-sumber-daya). **Katalog Tindakan ✅ (2026-06-12)** — `/api/v1/master/tindakan` (CRUD layered, **leaf tanpa version**, kode ICD-9 **opsional**, **16 kategori**, status KPTL) WIRED SSR-hybrid ke [/ehis-master/katalog-tindakan](src/app/ehis-master/katalog-tindakan/) + **Mapping Hub → Layanan Unit** kini konsumsi **tindakan DB (baris) + unit dari Location aktif master Unit & Ruangan (kolom)** via SSR hybrid (`unitsFromTree`). **Katalog Laboratorium ✅ (2026-06-12)** — model **Tes→Parameter** (panel): `/api/v1/master/lab-test` (CRUD layered, `LabTest`+`LabParameter`, **rujukan numerik per-parameter = JSONB**, update **replace-all** parameter, **leaf tanpa version**) WIRED SSR-hybrid ke [/ehis-master/katalog-lab](src/app/ehis-master/katalog-lab/); form di-rewrite (tab **Parameter** + **Satuan combobox** satuan-baku + **DiscardDialog** + field **KODE dihapus**); **seeded 38 tes / 88 parameter** standar (PMK 43/2013 · NCEP · WHO · SAMHSA) via [prisma/scripts/seed-lab.mts](prisma/scripts/seed-lab.mts). Lab mock lama (`labCatalogMock.ts`) tetap utk HasilPane/TrendPane. **Lab → Layanan Unit ✅ (2026-06-12)** — Katalog Lab kini dipetakan ke Ruangan di **Mapping Hub → Layanan Unit** sebagai grup baris **"Tindakan Laboratorium"** (matriks terpadu Tindakan+Lab via `LayananRow`/`LayananEdge`); tabel **paralel** `master.LayananUnitLab` (LabTest⇄Location, join hard-delete, idempoten) + `/api/v1/master/layanan-unit-lab` (layered, RBAC `master.mapping`), SSR-hybrid. Bukan polymorphic — tetap tabel berdiri-sendiri sampai federasi chargemaster (TODO-CHARGEMASTER CM2/CM5). Matriks dapat **bulk select-all tri-state 3 level**: per kolom/Location · per baris · per grup kategori (desktop + mobile drill-down), semua batched optimistik. **Konsumen klinis ✅ (2026-06-12)** — `GET /api/v1/master/tindakan-tersedia` (read katalog tindakan ter-assign, gate **`clinical.tindakan:read`** bukan master, distinct + `ruanganKodes[]`, forward-ready `?ruanganKode=`) dipakai **tab Tindakan IGD** (redesign mirip tab Diagnosa: search-first + kartu konfigurasi + daftar tergrup + sidebar ringkasan; pelaksana default dari sesi login; Lab/Rad tereksklusi). Verifikasi identitas IGD kini ambil **nama verifikator dari user login** (`IdentitasVerifikasiBanner.defaultPerawat`). Status backend lengkap → [docs/BACKEND-MAPPING.md](docs/BACKEND-MAPPING.md). **Katalog Obat ✅ (2026-06-13)** — `/api/v1/master/obat` (CRUD layered, **leaf tanpa version**, enum FE-facing TEXT, harga Int, `lasaPairIds` text[], **pemetaan KFA = kolom JSONB** POA/POV/Rute/Bentuk+BZA utk interop FHIR SatuSehat) WIRED SSR-hybrid ke [/ehis-master/katalog-obat](src/app/ehis-master/katalog-obat/) (5 tab incl. **Mapping KFA** — search produk KFA → auto-fill mapping → preview FHIR `Medication`; LASA picker baca list DB; DiscardDialog). **`OBAT_MOCK` dihapus** → tipe+config tetap di `obatMock.ts`, data pindah ke [obatSeed.ts](src/lib/master/obatSeed.ts); **seeded 28 obat / 17 ter-KFA / 4 LASA** via [prisma/scripts/seed-obat.mts](prisma/scripts/seed-obat.mts) (derive KFA dari `kfaMock.ts`, remap lasaPairIds→UUID). Konsumen mock **dimigrasi off `OBAT_MOCK`**: Mapping Hub Formularium/Distribusi → `fetchAllObat` (DB) · Beranda → count indikatif · billing `priceResolver` → snapshot di-hydrate SSR layout billing. KFA search masih mock ([kfaMock.ts](src/lib/master/kfaMock.ts), swap ke BFF KFA v2 saat kredensial SatuSehat siap). Spec → [docs/BACKEND-MASTER-KATALOG-KLINIS.md §C.1](docs/BACKEND-MASTER-KATALOG-KLINIS.md). **Formularium → DB ✅ (2026-06-13)** — Mapping Hub **Formularium** = grant N:N **Obat ⇄ Ruangan (Location)** persis Layanan Unit (matriks baris Obat × kolom Ruangan, **universal lintas penjamin** — tab penjamin & dimensi kelas dihapus). Persist via `master.FormulariumObat` + `/api/v1/master/formularium` (grant idempoten · hard-delete revoke · SSR-hybrid + optimistik + tree-filter kolom). Reuse helper grant-map/kolom-unit + `LayananUnitTreePanel` dari layananShared (cache edge terpisah). Spec → [docs/BACKEND-MAPPING.md §6](docs/BACKEND-MAPPING.md). **ICD-10/9 ✅ (2026-06-07)** — `/api/v1/master/icd` (+import bulk). Spec [docs/BACKEND-MASTER-KATALOG-KLINIS.md](docs/BACKEND-MASTER-KATALOG-KLINIS.md). **Katalog Keperawatan (SDKI/SLKI/SIKI) ✅ (2026-06-14)** — **rename** dari "SDKI / SIKI / SLKI" → [/ehis-master/katalog-keperawatan](src/app/ehis-master/katalog-keperawatan/); `/api/v1/master/sdki` (CRUD layered, **leaf tanpa version**, blok dataMayor/dataMinor/intervensi = **JSONB**, kriteriaHasil text[], **kode `D.NNNN` auto** via `master.SdkiCounter`) WIRED SSR-hybrid ke [SdkiPage](src/components/master/sdki/SdkiPage.tsx) (form Kode dihapus → display "Auto" + DiscardDialog). **`SDKI_MOCK` dihapus** → tipe+helper tetap di `sdkiMock.ts`, data pindah ke [sdkiSeed.ts](src/lib/master/sdkiSeed.ts); **seeded 27 diagnosa** via [seed-sdki.mts](prisma/scripts/seed-sdki.mts) (counter[D]=148 → baru D.0149). Konsumen klinis KeperawatanTab masih `SDKI_CATALOG` mock (follow-up). Spec → [docs/BACKEND-MASTER-KATALOG-KLINIS.md §C.3](docs/BACKEND-MASTER-KATALOG-KLINIS.md). |
| `/ehis-registration`       | Registration     | 🚧 PatientDashboard + KunjunganDetail ✅ · **Backend RJ ✅ (2026-06-04)** — Pasien/Kunjungan/SEP API (layered) + lifecycle worklist + Jaminan persist + noRM `YYMMNNNN` · **IGD/RI Pendaftaran + Bed Allocation ✅ (2026-06-06)** — register IGD (triase opsional+DPJP+ruangan) & RI (kelas+bed reserve); `encounter.BedAllocation` (Reserved/Occupied/Released · partial-unique anti-double-booking · `tersedia`=derived count); IGD occupy-saat-Terima + RI reserve-saat-daftar; board IGD fetch order DB + Terima(pilih bed)/Batalkan + panel ruangan master + okupansi; board loket belum |
| `/ehis-dashboard`          | Dashboard        | 🔧 Scaffold (belum dibangun)    |
| `/ehis-billing`            | Billing Kasir    | ✅ **Core 100% operasional** — BL1 Tagihan Board + BL2 Invoice Detail 4-tab + BL3 Kasir Counter 3-tab + **BL8 Beranda Billing** (KPI Strip + Quick Nav + 3 panel) + **BL6 ~80%** Charge Ingestion reactive `useSyncExternalStore` (Lab/Rad/Farmasi/Akomodasi silent-wired; Discharge Banner RI; Mini Widget RI) + Single-source refactor (registrasi read-only + deep-link). **Sisa:** BL5 Adjustment · BL7 Reports · BL9 Polish · BL6 Tindakan+JasaDokter triggers · BL6 Mini Widget IGD/RJ. Roadmap [TODO-BILLING.md](TODO-BILLING.md) |
| `/ehis-eklaim`             | E-Klaim          | ✅ **EK0–EK9 100% SELESAI** (2026-05-30) — Beranda (KPI+Pipeline+ActivityTab) · Klaim Board 11-col+bulk+density · Klaim Detail 6-tab (Berkas/Coding/Grouper/Submission/Audit/Timeline) · iDRG Calculator 3-mode · Berkas Generator A4 (ResumeMedis/BerkasKlaim/SuratPengantar) · Banding Board+Form+Detail · Reconciliation (ImportCSV+MatchingEngine+SelisihWriteOff+DetailPage+PrintTemplate) · Dashboard 5-tab (ApprovalRate/Aging/MarginAnalysis/CoderProductivity/MarginComparator) · EK9 Polish: print stylesheet + animasi stagger + density toggle + cross-modul links (PenjaminDetail/BillingGateBanner/IGD+RI+RJPatientHeader). iDRG-first · TSC clean. Roadmap [TODO-EKLAIM.md](TODO-EKLAIM.md) |
| `/ehis-bpjs`               | BPJS Integration Hub | ✅ **BP0–BP8 100%** — 16 lib [src/lib/bpjs/](src/lib/bpjs/) · BP1 Beranda (KPI+Sidebar 2-tab Live Calls/Referensi) · BP2 Kepesertaan (cek NIK/NoKartu) · BP3 SEP 6-tab (Cari/Hapus/UpdateTgl/Integrasi/Suplesi JR/SEP Internal/Fingerprint) · BP4 Rujukan (Cari+Khusus+Spesialistik+Sarana+Referensi 3-tab) · BP5 Monitoring 4-tab (Kunjungan/Klaim/Histori/Jasa Raharja) · BP6 Rencana Kontrol 7-tab (11 endpoint+PRB 9 penyakit kronik+SPRI) · BP7 Aplicares 3-halaman (ReferensiKamar+MapKelas CRUD+Ketersediaan BedSync) · BP8 Polish (AuditTrail filter+export · RefSync Scheduler · Error Recovery+Toast · **3 Print Template SEP/RK-SPRI/Audit A4**). Cross-link: `/ehis-eklaim` (klaim consume V-Claim) · `/ehis-registration` (SEP saat admisi) · `/ehis-master/ruangan` (Aplicares bed sync). Roadmap [TODO-BPJS.md](TODO-BPJS.md) |
| `/ehis-report`             | Reports          | 🔧 Scaffold (belum dibangun)    |
| `/ehis-fhir`               | FHIR Integration | 📋 Planned (terpisah dari master) |

Shared layout: `Navbar` · `Sidebar` · `ModuleSwitcher` · `ModuleLayout` → `src/components/layout/`

**Detail tab/feature per modul yang ✅ Done:** lihat [.claude/DONE.md](.claude/DONE.md).

---

## 🔴 Active Work / Next Up

Frontend Phase 0–3 master sudah selesai 100%. Workload selanjutnya bisa dipilih dari:

### Backend Integration (rekomendasi utama)
- Mulai dari [TODOS_BACKEND.md](TODOS_BACKEND.md) Phase B0 — Foundation (Prisma + Auth + RBAC + Infra).
- Schema mock sudah 1:1 dengan target — swap `import { X_MOCK }` → `await prisma.x.findMany()` tanpa refactor UI.

### Modul Baru (frontend lanjutan)
- [ ] **`ehis-dashboard`** — stats cards (pasien hari ini per unit IGD/RI/RJ) + BOR chart + recent activity feed + quick-nav ke modul lain.
- [✅] **`ehis-billing`** Kasir — **Core operasional 100%**. **Roadmap [TODO-BILLING.md](TODO-BILLING.md)** (35 task, ~20.5/35 = 59%). BL1 Tagihan Board ✅ + BL2 Invoice Detail 4-tab ✅ + BL3 Kasir Counter 3-tab ✅ + **BL8 Beranda Billing** ✅ + **BL6 Charge Ingestion** ~80% (foundation libs `priceResolver`/`sourceAdapter`/`billingStore`/`chargeIngest` siap · Lab/Rad/Farmasi/Akomodasi silent-wired reactive · Discharge Banner RI · Mini Widget RI breadcrumb · Single-source refactor `/ehis-registration` jadi read-only). **Sisa fase ditunda** (BL5 Adjustment · BL7 Reports · BL9 Polish · BL0 formal types · BL6 Tindakan+JasaDokter triggers · BL6 Mini Widget IGD/RJ) — akan di-pick up sesuai prioritas business.
- [✅] **`ehis-eklaim`** Klaim — **100% SELESAI** (2026-05-30). **Roadmap [TODO-EKLAIM.md](TODO-EKLAIM.md)** (39/39 task, EK0–EK9 ✅). EK0 Foundation · EK1 Beranda V2 · EK2 Klaim Board 11-col+bulk+density · EK3 Klaim Detail 6-tab+3 modal · EK4 iDRG Calculator 3-mode · EK5 Berkas Generator A4 · EK6 Banding Board+Form+Detail · EK7 Reconciliation (Import+Match+WriteOff+DetailPage+PrintTemplate+CSV) · EK8 Dashboard 5-tab (ApprovalRate+Aging+Margin+Coder+Comparator) + CSV/PDF export · EK9 Polish (print stylesheet + animasi + density toggle + cross-modul links).
- [✅] **`ehis-bpjs`** BPJS Integration Hub — **100% SELESAI** (2026-05-30). **Roadmap [TODO-BPJS.md](TODO-BPJS.md)** (44/44 section). BP0–BP8 selesai: Lib 16 file + Beranda + Kepesertaan + SEP 6-tab + Rujukan + Monitoring + Rencana Kontrol + Aplicares BedSync + Audit Trail + 3 Print Template (SEP/RK-SPRI/Audit) + Workflow Docs. Backend integration → lihat [TODOS_BACKEND.md](TODOS_BACKEND.md) Phase B-BPJS.
- [🚧] **`ehis-registration`** — **Backend RJ Integration ✅ (2026-06-04)** [TODO-REGISTRASI.md](TODO-REGISTRASI.md#phase-reg-be--backend-integration-loket--db-2026-06-04): Pasien API (register dedup-first + complete + **updatePenjamin**) · Kunjungan API (register RJ + worklist cursor + detail) · **SEP mock** (terbit+cetak A4, tersimpan DB) · **lifecycle worklist** (check-in/call/recall/receive/complete/cancel, version-guarded) wired ke board RJ · **Jaminan persist** (jaminan ikut kunjungan terakhir, single-primary invariant) · **noRM `YYMMNNNN`** reset/bulan (counter table atomik) · Riwayat+Jaminan dashboard wired. **Pasien Baru** ([PasienBaruModal](src/components/registration/pasien-baru/PasienBaruModal.tsx)) sudah submit ke `POST /patients` (dedup-first). **Detail Kunjungan** (`/pasien/:id/kunjungan/:kid`) fetch DB via `GET /kunjungan/:id` (REG-BE.7 G-A/G-B/G-H, format mock). **IGD/RI Pendaftaran + Bed Allocation ✅ (2026-06-06, REG-BE.8)** — `registerKunjungan` kini terima IGD (triase opsional+DPJP+ruangan dari master) & RI (kelas+bed); model `encounter.BedAllocation` row-based (`tersedia`=derived, partial-unique anti-double-booking 409); IGD occupy-saat-Terima, RI reserve-saat-daftar, release-saat-cancel/complete; board IGD ([IGDWorkspace](src/components/igd/IGDWorkspace.tsx)) fetch order DB belum-diterima + Terima(pilih bed)/Batalkan + panel ruangan master + okupansi + resolve DPJP/ruangan/bed dari master; mock IGD dihapus kecuali Joko (igd-1). **Sisa:** board loket · realtime board (SSE) · nama DPJP riwayat RJ · rekam medis IGD dari DB (kartu pasien DB belum bisa di-link, detail page masih 100% mock) · board admisi RI penuh · dokumen kunjungan (schema) · tab Aksi kunjungan · auto-redirect pasca daftar pasien.
- [ ] **`ehis-report`** — laporan per periode + export Excel/PDF.
- [ ] **`ehis-fhir`** — modul integrasi SatuSehat (kredensial · sync resource · NIK lookup · sync log · conflict resolution).
- [ ] **Master Tier 3 — Poliklinik & Jadwal Dokter** — kapasitas antrian per poli per hari, jadwal buka, weekly schedule grid. Lihat [TECH_DEBT.md](TECH_DEBT.md#master--other).

### Tech Debt Resolution
- Lihat [TECH_DEBT.md](TECH_DEBT.md) untuk daftar lengkap per-modul + cross-cutting.

---

## 🏗 Key Architecture Decisions (jangan diubah tanpa diskusi)

### Master Data
- **Organization & Location UI**: Unified Tree — 1 route `/ehis-master/ruangan`, n-level Organization nested via `parentId`, Bed sebagai sub-collection `LocationNode.beds[]`. (2026-05-19)
- **FHIR Strategy**: SEMUA interaksi FHIR/SatuSehat (sync action, NIK lookup, Org_id config, mapping config) **pindah ke modul terpisah `/ehis-fhir`** (belum dibangun). Master pages = data RS murni. Adapter Pattern (`toFhirOrganization()`/dst) tetap di `lib/fhir/adapters/` saat backend ready. (2026-05-19, revisi dari rencana awal yang embed FHIR di master)
- **Mapping Strategy (Opsi A — Mapping Hub Terpadu)**: Semua relasi N:N antar entitas master di-host di 1 hub `/ehis-master/mapping` dengan sidebar internal. Source of truth tetap di Hub — UI edit penugasan di entitas master **dihapus** (DokterDetail.poliAssignment + PenggunaFormModal.unitAssignment hanya tinggal MappingSourceBadge cross-link). Field tetap di schema sebagai seed default. (2026-05-22)
- **Address**: Convention over Configuration — Location inherit dari parent Organization secara default, override per record via flag.
- **Kode wilayah** (direvisi 2026-06-02): **source of truth = tabel `master.Wilayah` di DB** (di-seed dataset resmi Kemendagri; provinsi→kab/kota→kec→kelurahan, self-ref `parentKode`), diakses via **internal API `/api/v1/wilayah?level=&parentKode=` lazy per level + cache** (cache-aside Redis + TanStack client). Cascading dropdown konsumsi API ini; embed JSON hanya boleh fallback level-atas (first-paint), bukan source-of-truth. **JANGAN hit API wilayah publik internet** (tak ber-SLA, egress jaringan klinis, tak otoritatif, tak joinable). Kode numerik Kemendagri wajib untuk FHIR `administrativeCode`. **Kode BPJS berbeda** → di-sync dari endpoint referensi BPJS (cron/outbox, bukan live) ke reference terpisah + tabel mapping Kemendagri↔BPJS.
- **Bed status operasional** (`Tersedia/Terisi`): dikelola workflow klinis saat admisi/pulang, **bukan** form master.
- **Practitioner master**: data dokter manual input. NIK lookup ke SatuSehat untuk verifikasi/auto-populate **pindah ke modul `/ehis-fhir`**.

### Data Flow
- **`ORDERS_MOCK` = single source of truth** untuk Lab/Rad/Farmasi/Resep. Saat migrasi ke DB, tabel `Order` jadi single source — UI tidak berubah.
- **Workflow store pattern**: state mutasi (telaah farmasi, hasil lab, dosis rad) saat ini di `workflowStore` client-side. Backend perlu commit ke database + push update via WebSocket/SSE atau polling.
- **Mock-first → swap pattern**: semua mock di `src/lib/master/*Mock.ts` punya schema 1:1 dengan target Prisma. Migrasi = ganti import. Zero refactor UI.

### UI
- **Density tokens** (`m-mini/m-tiny/m-xs/m-sm/m-base/m-lg`): utility classes berbasis CSS custom properties di `globals.css`. Mengikuti `data-density` attribute (Compact/Comfortable/Cozy). Toggle di Mapping Hub header.
- **Skeleton 500ms** via `useSkeletonDelay()` untuk semua master pages + farmasi/lab/rad worklist.
- **MappingSourceBadge** (3 variant: card/banner/inline) untuk cross-link entitas → Mapping Hub sub-page. Tegaskan "source of truth ada di Hub".

---

## 🗂 Key Data Contracts

### Mock IDs (jangan ubah tanpa update semua tab)

- **IGD**: `igd-1` (Joko Prasetyo ♂55, `RM-2025-005`) · `igd-2` (Siti Rahayu ♀32, `RM-2025-012`)
- **RI**: `ri-1` (GJK NYHA III, dr. Budi Santoso Sp.JP, `RM-2025-003`) · `ri-3` (Syok Sepsis, dr. Hendra Wijaya Sp.EM, `RM-2025-007`)
- **RJ**: `rj-1` · `rj-2`
- **Mock keyed by `RM-2025-003`**: `KONSULTASI_MOCK` · `OrderLabMock` · `OrderRadMock` · `DISCHARGE_MOCK` · `PASIEN_PULANG_MOCK` · `GIZI_HISTORY_MOCK`
- **Mock keyed by `RM-2025-005`**: `HANDOVER_MOCK` (IGD)
- **Farmasi orders**: 5 lintas unit — `igd-1` (HAM, Depo IGD) · `igd-2` (Depo IGD) · `ri-1` (HAM, Apotek RI) · `ri-3` (Apotek RI) · `rj-1` (Apotek RJ) → `farmasi/farmasiShared.ts`
- **Radiologi orders**: 5 lintas unit — `igd-1` (Foto Thorax AP CITO) · `igd-2` (USG Abdomen Semi-Cito) · `ri-1` (CT Thorax kontras Rutin) · `ri-3` (Foto BNO 3 posisi) · `rj-1` (USG Tiroid) → `rad/radShared.ts`

### Core Types (semua di `src/lib/data.ts`)

- `IGDPatientDetail` · `PatientMaster` · `KunjunganRecord` · `RawatInapPatientDetail` · `RJPatientDetail`
- `TipePenjamin`: `BPJS_Non_PBI | BPJS_PBI | Umum | Asuransi | Jamkesda`
- `RIKelas`: `VIP | Kelas_1 | Kelas_2 | Kelas_3 | ICU | HCU | Isolasi`
- `DiagnosaTipe`: `Utama | Sekunder | Komplikasi | Komorbid`
- `DiagnosaStatus`: `Pasti | Dicurigai | Diferensial`
- `IGDDiagnosa`: `id · kodeIcd10 · namaDiagnosis · tipe · status? · alasan? · analisa?`
- `CPPTEntry`: `id · waktu · tanggal? · profesi · penulis · SOAP fields · verified? · verifiedBy? · verifiedAt? · flagged?`

### Shared Medical Records (`src/components/shared/medical-records/`)

| Component | Used By | Notes |
|---|---|---|
| `TTVTab` | IGD · RI · RJ | `triage?` IGD obs mode · `history?` RI multi-shift · GCS auto-calc + NEWS2 score |
| `CPPTTab` | IGD · RI · RJ | `showDate` RI · `requiresVerification` DPJP co-sign |
| `DiagnosaTab` | IGD · RI · RJ | ICD-10 + ICD-9 + status + INA-CBG preview |
| `HandoverTab` | IGD · RI | SBAR 4-seksi + auto-populate TTV |
| `DaftarOrderTab` | IGD · RI · RJ | Single source via `ORDERS_MOCK` |
| `OrderLabTab` · `OrderRadTab` | IGD · RI · RJ | Mirror dari worklist lab/rad |
| `InformedConsentTab` | IGD · RI · RJ | Template per tindakan + TTD digital. PMK 290/2008 |
| `RekonsiliasTab` | IGD · RI | `context:"igd"\|"ri"` → phase labels berbeda. HAM badge + progress bar |
| `KonsultasiTab` | RI · RJ | SBAR closed-loop + 22 SMF dropdown |
| `SuratDokumenTab` | RJ | 4 jenis surat. PMK 269/2008 |
| `ResepTab` | IGD · RI · RJ | `showMAR` flag · HAM badge + HAMConfirmModal |
| `FarmasiTab` | IGD · RI · RJ | Per-patient status tracker dari `workflowStore` |
| `MARTab` | RI | Medication Administration Record per shift. SNARS PKPO 6 |
| `KonselingTab` | RI | Discharge counseling. SNARS PP 5 |
| `IdentitasVerifikasiBanner` | IGD · RI | Lazy intercept tab aksi (SKP 1 · JCI IPSG 1) |
| `StatusFisikPane` | IGD · RI · RJ | 11-sistem head-to-toe |

Shared asesmen: `src/components/shared/asesmen/` → `AllergyPane` · `RiwayatPane` · `GiziPane` · `asesmenShared.ts`.

---

## 🚦 Workflow

- **Saat menyelesaikan task**: (1) centang di file aktif (CLAUDE.md atau TODO.md), (2) pindahkan deskripsi detail ke [.claude/DONE.md](.claude/DONE.md), (3) catat tech debt baru di [TECH_DEBT.md](TECH_DEBT.md).
- **Saat menemukan gap klinis**: catat di [.claude/GAP_ANALYSIS.md](.claude/GAP_ANALYSIS.md) sebelum mulai implementasi.
- **Saat mulai modul baru**: cek [TODOS_BACKEND.md](TODOS_BACKEND.md) untuk lihat dependensi backend yang perlu diketahui.
- **Sebelum commit**: jalankan `npx tsc --noEmit` untuk verifikasi types clean.
- **Komitmen file size**: tidak ada file >800 line. Jika lewat → split jadi sub-components (lihat pola di `farmasi/`, `lab/`, `rad/`, `master/mapping/`).
