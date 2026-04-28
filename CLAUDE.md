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

| Route                | Module        | Layout                    | Status      |
| -------------------- | ------------- | ------------------------- | ----------- |
| `/ehis-dashboard`    | Dashboard     | ModuleLayout              | 🔧 Scaffold |
| `/ehis-care`         | Clinical Care | Sidebar (main) + Fullpage | 🚧 Active   |
| `/ehis-registration` | Registration  | ModuleLayout              | 🔧 Scaffold |
| `/ehis-billing`      | Billing       | ModuleLayout              | 🔧 Scaffold |
| `/ehis-master`       | Master Data   | ModuleLayout              | 🔧 Scaffold |
| `/ehis-report`       | Reports       | ModuleLayout              | 🔧 Scaffold |

Shared layout: `Navbar` · `Sidebar` · `ModuleSwitcher` · `ModuleLayout` → `src/components/layout/`

---

## EHIS-Care: Component Status

### IGD (~90% done)

| Layer                                                            | File                                 | Status |
| ---------------------------------------------------------------- | ------------------------------------ | ------ |
| Board                                                            | `components/igd/IGDBoard.tsx`        | ✅     |
| Patient card                                                     | `components/igd/PatientCard.tsx`     | ✅     |
| Room panel                                                       | `components/igd/IGDRuanganPanel.tsx` | ✅     |
| Patient header                                                   | `components/igd/PatientHeader.tsx`   | ✅     |
| Tab router                                                       | `components/igd/IGDRecordTabs.tsx`   | ✅     |
| triase · ttv · asesmen · diagnosa · cppt                         | tabs/                                | ✅     |
| tindakan · disposisi · rekonsiliasi · keperawatan                | tabs/                                | ✅     |
| pemeriksaan · penilaian · resep · order-lab · order-rad · pulang | tabs/                                | ✅     |
| rujukan                                                          | `tabs/RujukanKeluarTab.tsx`          | ✅     |
| Penandaan Gambar                                                 | tabs/penandaanGambar.tsx             | ✅     |

### Pasien Master

| File                                     | Status                         |
| ---------------------------------------- | ------------------------------ |
| `components/pasien/PatientDashboard.tsx` | ✅ Full (tabs, search, modals) |

---

## TODO Queue

Work items in priority order. Pick top item each session.

### 🔴 Now

- [ ] **Redesign: IGD pasien page components components/igd/tabs/Diagnosa** — current: terdapat bug pada halaman diagnosa, ketika user memilih dropdown itu sepertinya, dropdownya ter cutting di card, jadi terlihat terpotong, yang mana ini tidak sesuai dengan user interaface yang friendly, perbaiki, terapkan frontend Design Skill
  - Scope: `components/igd/DiagnosaTab.tsx`,

### 🟡 Next (EHIS-Care)

- [ ] **IGD → Admission flow** — dari DisposisiTab "Rawat Inap" trigger create rawat-inap record

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
`TipePenjamin`: `BPJS_Non_PBI | BPJS_PBI | Umum | Asuransi | Jamkesda`  
`UnitKunjungan`: `IGD | Rawat Jalan | Rawat Inap | Laboratorium | Radiologi | Farmasi`

---
