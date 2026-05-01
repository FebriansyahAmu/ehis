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

### Pasien Master (di bawah `ehis-registration`)

| File                                              | Route                                                    | Status                                             |
| ------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `components/registration/PatientDashboard.tsx`    | `/ehis-registration/pasien/[id]`                         | ✅ Full (tabs, search, modals, riwayat kunjungan)  |
| `components/registration/KunjunganDetailPage.tsx` | `/ehis-registration/pasien/[id]/kunjungan/[kunjunganId]` | ✅ Halaman detail pendaftaran kunjungan (fullpage) |

---

## TODO Queue

Work items in priority order. Pick top item each session.

### 🔴 Now

- [ ] **ehis-registration → /PatientDashboard** — kalau kita liat di layout pasien dashboard, penjamin dan jaminan memiliki ukuran paling besar card, gimna kalau layoutnya kita buat :

1. dua kolom saja yang sama besar,
2. dua kolom tapi ada beberapa card yang memuat informasi
3. jadi card penjamin dan jaminan itu kita buat simpel saja, jangan terlalu memakan ruang seperti yang sekarang,
4. dua kolom, kolom kanan itu ada berupa profil, serta rincian tagihan,
5. kolom kanan itu ada informasi pasien
6. lalu akan kita bagi cardnya misal ada card, Riwayat History pendaftaran Kunjungan, yang akan memuat pendaftaran terakhir dengan beberapa informasi seperti Tanggal pendaftaran / kunjungan, Status seperti Nomor SEP nomor BPJS, aktif atau tidak dll.
7. Riwayat kunjungan modal itu kita ganti dengan riwayat pendaftaran saja
8. lalu tabel Riwayat kunjungan di bawah itu, kita buat saja button untuk trigger modalnya, dan show semua kunjungan berdasarkan statusnya,

saya ingin, buat rapi dan ui uxnya interaktif, gunakan front end desing skills, buat presisi dan estetika, buat juga dia responsive di multidevice.

terapkan best practices.

### ✅ Selesai (EHIS-Care)

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
`TipePenjamin`: `BPJS_Non_PBI | BPJS_PBI | Umum | Asuransi | Jamkesda`  
`UnitKunjungan`: `IGD | Rawat Jalan | Rawat Inap | Laboratorium | Radiologi | Farmasi`

---
