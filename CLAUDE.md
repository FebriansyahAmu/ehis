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
| [TODO-BPJS.md](TODO-BPJS.md) | **BPJS Integration Hub roadmap** — Fase BP0–BP8 (44 section, ~3.5-4.5 minggu). V-Claim 5 sub-menu + Aplicares 3 sub-menu + Audit. **BP0 ✅ + BP1 ✅ + BP2 ✅ + BP3 ✅ + BP4.1+BP4.2 ✅** (16 file `src/lib/bpjs/` + 4 kepesertaan + 14 sep + 6 rujukan). Next: BP4.3 Spesialistik / BP5 Monitoring. |
| [TECH_DEBT.md](TECH_DEBT.md) | Tech debt registry per-modul + cross-cutting. |
| [TODOS_BACKEND.md](TODOS_BACKEND.md) | Backend implementation roadmap (B0–B4, ~5–7 bulan). |
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
| `/ehis-master`             | Master Data      | ✅ 100% (25 sub-master + 8 mapping + Beranda) |
| `/ehis-registration`       | Registration     | 🚧 PatientDashboard + KunjunganDetail ✅, board belum |
| `/ehis-dashboard`          | Dashboard        | 🔧 Scaffold (belum dibangun)    |
| `/ehis-billing`            | Billing Kasir    | ✅ **Core 100% operasional** — BL1 Tagihan Board + BL2 Invoice Detail 4-tab + BL3 Kasir Counter 3-tab + **BL8 Beranda Billing** (KPI Strip + Quick Nav + 3 panel) + **BL6 ~80%** Charge Ingestion reactive `useSyncExternalStore` (Lab/Rad/Farmasi/Akomodasi silent-wired; Discharge Banner RI; Mini Widget RI) + Single-source refactor (registrasi read-only + deep-link). **Sisa:** BL5 Adjustment · BL7 Reports · BL9 Polish · BL6 Tindakan+JasaDokter triggers · BL6 Mini Widget IGD/RJ. Roadmap [TODO-BILLING.md](TODO-BILLING.md) |
| `/ehis-eklaim`             | E-Klaim          | 🚧 **EK0 ✅ · EK1 ✅ · EK2 ✅ · EK3 ✅ · EK4 ✅ · EK5 ✅ · EK6 ✅ · EK7 🚧 75% · EK8 🚧 67%** — EK7 Reconciliation EK7.1+EK7.2+EK7.3 ✅ · **EK8 Dashboard** EK8.1–EK8.4 ✅: `DashboardPage` 2-panel (left nav 4 tab + right AnimatePresence) · KPI strip 4 cards · `ApprovalRatePanel` SVG line chart + rejected reasons · `AgingKlaimPanel` stacked bars + stuck claims table · `MarginAnalysisPanel` diverging bar chart · `CoderProductivityPanel` stacked daily bar + submit latency horizontal bar · `dashboardShared.ts` pure builders · skeleton 500ms · TSC clean. **iDRG-first**. Next: EK7.4 Reconciliation Report. Roadmap [TODO-EKLAIM.md](TODO-EKLAIM.md) |
| `/ehis-bpjs`               | BPJS Integration Hub | 🚧 **BP0 ✅ + BP1 ✅ Beranda + BP2 ✅ Kepesertaan + BP3 ✅ SEP + BP4.1+BP4.2 ✅ Rujukan** — Lib: 16 file [src/lib/bpjs/](src/lib/bpjs/) · **BP3 SEP** ✅ 14 file [src/components/bpjs/sep/](src/components/bpjs/sep/): `SEPPage` **6-tab** scrollable · **BP4 Rujukan** ✅ (partial) — 6 file [src/components/bpjs/rujukan/](src/components/bpjs/rujukan/): `RujukanPage` (RuanganPage-pattern: skeleton 600ms + 3 StatCard + 2-panel) · `CariRujukanForm` (2-mode toggle No Rujukan/No Kartu + FaskesToggle FKTP/FKRTL + `getRujukan`+`listRujukanByPeserta`) · `RujukanResultCard` (PPK arrow + diagnosa + peserta + masa berlaku) · `ListRujukanKhususPanel` (`listRujukanKhusus` bulan+tahun + quick shortcuts + KhususRow table) · `rujukanShared` · TSC clean. **Next: BP4.3 Spesialistik / BP5 Monitoring**. Roadmap [TODO-BPJS.md](TODO-BPJS.md) |
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
- [🚧] **`ehis-eklaim`** Klaim — modul baru hasil scope-split dari billing (workflow batch + persona Tim Klaim/Coder berbeda). **Roadmap [TODO-EKLAIM.md](TODO-EKLAIM.md)** (39 task, fase EK0–EK9 · ~18/39 = 46%). **EK0 ✅ · EK1 ✅ · EK2 ✅ · EK3 ✅ · EK4 ✅ · EK5 ✅ · EK6 ✅ 100% · EK7 🚧 75% · EK8 🚧 67%**. EK8.1–EK8.4 Dashboard done: `DashboardPage` 2-panel (4 tab) · `ApprovalRatePanel` SVG line chart · `AgingKlaimPanel` stacked bars · `MarginAnalysisPanel` diverging bars · `CoderProductivityPanel` stacked daily bar + submit latency · `dashboardShared.ts` pure builders · route `/report` · TSC clean. **Next: EK7.4 Reconciliation Report**.
- [ ] **`ehis-registration`** board + form pendaftaran pasien baru.
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
- **Kode wilayah**: Cascading dropdown Kemendagri (embed JSON ~500KB), bukan free text — kode numerik wajib untuk FHIR `administrativeCode`.
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
