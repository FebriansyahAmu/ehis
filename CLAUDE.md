# EHIS — Project Context & Work Queue

> **Read this first every new session.**
> **Before switching tasks or features:** (1) check off completed items, (2) move next item to 🔴 Now, (3) add any new findings to Tech Debt if needed.
> Skill refs: `@.claude/skills/frontend-design/SKILL.md`

---

## Stack

Next.js 14 App Router · TypeScript · Tailwind v4 · Framer Motion · Lucide React · Prisma (generated at `src/generated/prisma/`)  
Utilities: `cn()` · `src/lib/utils.ts` | Navigation config: `src/lib/navigation.ts` | Mock data: `src/lib/data.ts`

---

## Module Map

| Route                | Module        | Layout                                  | Status      |
| -------------------- | ------------- | --------------------------------------- | ----------- |
| `/ehis-dashboard`    | Dashboard     | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-care`         | Clinical Care | Sidebar (main) + Fullpage               | 🚧 Active   |
| `/ehis-registration` | Registration  | (main) ModuleLayout + (fullpage) Pasien | 🚧 Active   |
| `/ehis-billing`      | Billing       | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-master`       | Master Data   | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-report`       | Reports       | ModuleLayout                            | 🔧 Scaffold |

Shared layout: `Navbar` · `Sidebar` · `ModuleSwitcher` · `ModuleLayout` → `src/components/layout/`

---

## EHIS-Care: Component Status

### Shared Medical Records (`src/components/shared/medical-records/`)

| Component       | File            | Used By         | Notes                                      |
| --------------- | --------------- | --------------- | ------------------------------------------ |
| `CPPTTab`       | `CPPTTab.tsx`   | IGD · Rawat Inap | `showDate` prop: date-grouped mode for RI |
| `TTVTab`        | `TTVTab.tsx`    | IGD · Rawat Inap | `history` prop: multi-shift timeline for RI |

### IGD (~90% done)

| Layer                                                            | File                                 | Status |
| ---------------------------------------------------------------- | ------------------------------------ | ------ |
| Board                                                            | `components/igd/IGDBoard.tsx`        | ✅     |
| Patient card                                                     | `components/igd/PatientCard.tsx`     | ✅     |
| Room panel                                                       | `components/igd/IGDRuanganPanel.tsx` | ✅     |
| Patient header                                                   | `components/igd/PatientHeader.tsx`   | ✅     |
| Tab router                                                       | `components/igd/IGDRecordTabs.tsx`   | ✅     |
| triase · ttv · asesmen · diagnosa · cppt                         | tabs/ (ttv+cppt → thin wrappers)     | ✅     |
| tindakan · disposisi · rekonsiliasi · keperawatan                | tabs/                                | ✅     |
| pemeriksaan · penilaian · resep · order-lab · order-rad · pulang | tabs/                                | ✅     |
| rujukan                                                          | `tabs/RujukanKeluarTab.tsx`          | ✅     |
| Penandaan Gambar                                                 | tabs/penandaanGambar.tsx             | ✅     |

### Rawat Inap (~30% done)

| Layer          | File                                              | Status                               |
| -------------- | ------------------------------------------------- | ------------------------------------ |
| Board          | `components/rawat-inap/RIBoard.tsx`               | ✅ + link ke detail page             |
| Bed panel      | `components/rawat-inap/RIRuanganPanel.tsx`        | ✅                                   |
| Patient header | `components/rawat-inap/RIPatientHeader.tsx`       | ✅ status-based theme, vitals bar    |
| Tab router     | `components/rawat-inap/RIRecordTabs.tsx`          | ✅ 2 tab aktif, 8 "Segera Hadir"     |
| CPPT/SOAP      | `components/rawat-inap/tabs/CPPTTab.tsx`          | ✅ date-grouped, Framer Motion       |
| TTV            | `components/rawat-inap/tabs/TTVTab.tsx`           | ✅ multi-shift history, expandable   |
| Diagnosa       | tabs/DiagnosaTab.tsx                              | 🔜 next (reuse shared)               |
| Asuhan Kep.    | tabs/KeperawatanTab.tsx                           | 🔜 (reuse shared)                    |
| Pemeriksaan    | tabs/PemeriksaanTab.tsx                           | 🔜 (reuse shared)                    |
| Intake/Output  | tabs/IntakeOutputTab.tsx                          | 🔜 new (RI-specific)                 |
| Resep & Obat   | tabs/ResepTab.tsx                                 | 🔜 (reuse shared)                    |
| Order Lab      | tabs/OrderLabTab.tsx                              | 🔜 (reuse shared)                    |
| Order Radiologi| tabs/OrderRadTab.tsx                             | 🔜 (reuse shared)                    |
| Konsultasi     | tabs/KonsultasiTab.tsx                            | 🔜 new (RI-specific)                 |
| Discharge Plan | tabs/DischargePlanTab.tsx                         | 🔜 new (RI-specific)                 |
| Route (fullpage)| `app/ehis-care/(fullpage)/rawat-inap/[id]/`      | ✅ page.tsx + layout.tsx             |
| Mock data      | `data.ts` `rawatInapPatientDetails`               | ✅ ri-1 (GJK) + ri-3 (Syok Sepsis)  |

### Pasien Master (di bawah `ehis-registration`)

| File                                              | Route                                                    | Status                                             |
| ------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `components/registration/PatientDashboard.tsx`    | `/ehis-registration/pasien/[id]`                         | ✅ Full (tabs, search, modals, riwayat kunjungan)  |
| `components/registration/KunjunganDetailPage.tsx` | `/ehis-registration/pasien/[id]/kunjungan/[kunjunganId]` | ✅ Halaman detail pendaftaran kunjungan (fullpage) |

---

## TODO Queue

Work items in priority order. Pick top item each session.

### 🔴 Now

- [ ] **Rawat Inap — sisa 8 tabs** — Diagnosa, Asuhan Keperawatan, Pemeriksaan, Intake/Output, Resep & Obat, Order Lab, Order Radiologi, Discharge Planning (Konsultasi optional). Prioritas: Diagnosa (shared) → Asuhan Keperawatan → Discharge Planning

### ✅ Selesai (EHIS-Registration)

- [x] **PatientDashboard redesign** — 2-column layout (info+penjamin+jadwal / profil+riwayat terkini+tagihan), compact penjamin card, new "Riwayat Pendaftaran Terkini" card, bottom CTA replaces table, modal renamed ke "Riwayat Pendaftaran", responsive multidevice

### ✅ Selesai (EHIS-Care)

- [x] **Rawat Inap — fullpage detail (CPPT + TTV)** — route `/ehis-care/rawat-inap/[id]`, `RIPatientHeader` (status-based theme, vitals bar, ward/bed chips), `RIRecordTabs` (10 tabs, 2 aktif), shared `CPPTTab` (date-grouped, Framer Motion stagger) + shared `TTVTab` (multi-shift history expandable rows, kesadaran selector). `RawatInapPatientDetail` type + mock data ri-1/ri-3 di `data.ts`.
- [x] **IGD Triase Modal** — tombol "+ Triase" di page header IGD, modal fullscreen dengan primary survey (ABCDE), backdrop shake on outside-click, portal-based z-index, `IGDTriaseButton` client component, `TriaseModal` + `TriasePrimaryForm` components
- [x] **Rawat Inap — halaman utama** — `/ehis-care/rawat-inap`: header + BOR gauge + 6 stats card, `RIRuanganPanel` (7 kelas dengan occupancy ring + bed map modal), `RIBoard` (filter status/kelas/DPJP/search + patient cards), mock data di `data.ts` (`rawatInapPatients`, `rawatInapRuangan`, `rawatInapStats`)
- [x] **Redesign: IGD tabs/PenilaianTab** — multi-tab (Fisik, Jantung, Kanker, dll.), two-panel layout, auto-resize textarea
- [x] **Pasien → Detail Pendaftaran Kunjungan** — fullpage `/pasien/[id]/kunjungan/[kunjunganId]`, dokumen, aksi, cetak, modals

### 🟢 Backlog (Other Modules)

- [ ] `ehis-registration` — form pendaftaran pasien baru + kunjungan, search existing pasien
- [ ] `ehis-billing` — kasir: invoice generation, item tindakan + obat, print struk
- [ ] `ehis-dashboard` — stats cards, recent activity, bed occupancy chart
- [ ] `ehis-master` — CRUD: dokter, ruangan, tarif, obat/lab catalog
- [ ] `ehis-report` — tabel laporan per periode, export Excel/PDF

### ⚙️ Tech Debt

- [ ] Replace mock data (`src/lib/data.ts`) dengan Prisma queries bertahap, mulai dari `PatientMaster`
- [ ] `SidebarContext` — belum dipakai konsisten di semua modul
- [ ] Error boundary + loading skeleton untuk semua fullpage routes

---

## Key Data Contracts

**Mock IDs** (jangan ubah tanpa update semua tab):

- IGD: `igd-1` (Joko Prasetyo, ♂ 55y, RM-2025-005) · `igd-2` (Siti Rahayu, ♀ 32y, RM-2025-012)
- PatientMaster keyed by noRM: `RM-2025-005`, `RM-2025-012`

**Core types** (semua di `src/lib/data.ts`):
`IGDPatientDetail` · `PatientMaster` · `KunjunganRecord` · `BillingRecord` · `KasirData`  
`RawatInapPatient` · `RIBed` · `RIRuangan` · `RawatInapStats`  
`TipePenjamin`: `BPJS_Non_PBI | BPJS_PBI | Umum | Asuransi | Jamkesda`  
`RIPenjamin`: `BPJS_PBI | BPJS_Non_PBI | Umum | Asuransi | Jamkesda`  
`RIKelas`: `VIP | Kelas_1 | Kelas_2 | Kelas_3 | ICU | HCU | Isolasi`  
`UnitKunjungan`: `IGD | Rawat Jalan | Rawat Inap | Laboratorium | Radiologi | Farmasi`

---
