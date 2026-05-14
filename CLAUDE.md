# EHIS — Project Context & Work Queue

> **Read this first every new session.**
> **Before switching tasks:** (1) check off completed items, (2) promote next item to 🔴 Now, (3) add findings to Tech Debt.
> References: Clinical standards → `.claude/STANDARDS.md` | Gap analysis → `.claude/GAP_ANALYSIS.md` | Completed history → `.claude/DONE.md`
> Skill refs: `@.claude/skills/frontend-design/SKILL.md`

---

## Stack

Next.js 16.2.3 App Router · React 19.2.4 · TypeScript 5 · Tailwind v4 (`@tailwindcss/postcss`) · Framer Motion 12 · Lucide React 1.8 · Prisma 7.7 (generated at `src/generated/prisma/`) · ESLint 9  
Utilities: `cn()` · `src/lib/utils.ts` | Navigation: `src/lib/navigation.ts` | Mock data: `src/lib/data.ts`

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
| `/ehis-lab`          | Laboratorium  | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-rad`          | Radiologi     | ModuleLayout                            | 🔧 Scaffold |

Shared layout: `Navbar` · `Sidebar` · `ModuleSwitcher` · `ModuleLayout` → `src/components/layout/`

---

## Component Status

### Shared Medical Records (`src/components/shared/medical-records/`)

| Component            | File                              | Used By  | Key Props / Notes                                                             |
| -------------------- | --------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `TTVTab`             | `TTVTab.tsx`                      | IGD · RI | `triage?` → IGD obs mode (interval strip) · `history?` → multi-shift RI mode |
| `CPPTTab`            | `CPPTTab.tsx`                     | IGD · RI | `showDate` date-grouped (RI) · `requiresVerification` DPJP co-sign           |
| `DiagnosaTab`        | `DiagnosaTab.tsx`                 | IGD · RI | ICD-10 + ICD-9, status kepastian, alasan/analisa, INA-CBG preview             |
| `HandoverTab`        | `HandoverTab.tsx`                 | IGD · RI | `HandoverPatient` interface, date nav, 3 shift, SBAR, auto-populate TTV       |
| `DaftarOrderTab`     | `DaftarOrderTab.tsx`              | IGD · RI | Animated expand/collapse, search, stats cards, cancel dialog                  |
| `OrderLabTab`        | `OrderLabTab.tsx`                 | IGD · RI | `OrderLabPatient` interface                                                   |
| `OrderRadTab`        | `OrderRadTab.tsx`                 | IGD · RI | `OrderRadPatient` interface                                                   |
| `InformedConsentTab` | `InformedConsentTab.tsx`          | IGD      | Template per tindakan, TTD + saksi + nomor IC. PMK 290/2008                   |
| `StatusFisikPane`    | `pemeriksaan/StatusFisikPane.tsx` | IGD · RI | 11-sistem head-to-toe, quick-normal, temuan abnormal                          |
| `CPPTEntryCard`      | `CPPTEntryCard.tsx`               | CPPTTab  | Flag, verification footer, SOAP rows                                          |
| `cpptShared`         | `cpptShared.ts`                   | CPPT     | `PROFESI_CLS`, `SOAP_BADGE`, `fmtDate`, `todayISO`                            |
| `diagnosaShared`     | `diagnosaShared.ts`               | Diagnosa | Katalog ICD10/ICD9, `TIPE_CONFIG`, `STATUS_CONFIG`, `INA_CBG_MAP`             |

Shared asesmen: `src/components/shared/asesmen/` → `AllergyPane` · `RiwayatPane` · `GiziPane` · `asesmenShared.ts`

### IGD (✅ 100% — semua tab aktif)

Files: `src/components/igd/` — `IGDBoard` · `PatientCard` · `IGDRuanganPanel` · `PatientHeader` · `IGDRecordTabs`  
Tabs: `triase · ttv · asesmen · diagnosa · cppt · tindakan · informed-consent · rekonsiliasi · keperawatan · pemeriksaan · penilaian · penandaan · handover · daftar-order · resep · order-lab · order-rad · rujukan · pulang`  
Key arch: TTVTab passes `triage={patient.triage}` for timed obs mode · SBAR Transfer IGD→RI via `pasienPulang/SBARTransferPanel.tsx`

### Rawat Inap (✅ 100% — semua 14 tab aktif)

Files: `src/components/rawat-inap/` — `RIBoard` · `RIRuanganPanel` · `RIPatientHeader` · `RIRecordTabs`  
Tabs: `asesmen-awal · cppt · ttv · diagnosa · keperawatan · pemeriksaan · intake-output · resep · order-lab · order-rad · konsultasi · discharge-plan · daftar-order · handover · pasien-pulang`  
Route: `app/ehis-care/(fullpage)/rawat-inap/[id]/`

### Rawat Jalan (🔜 Planned — ~0%)

| Layer                                  | File                                         | Status |
| -------------------------------------- | -------------------------------------------- | ------ |
| Board / Antrian                        | `components/rawat-jalan/RJBoard.tsx`         | 🔜     |
| Patient header                         | `components/rawat-jalan/RJPatientHeader.tsx` | 🔜     |
| Tab router                             | `components/rawat-jalan/RJRecordTabs.tsx`    | 🔜     |
| Skrining TTV                           | `tabs/TTVTab.tsx` → shared                   | 🔜     |
| CPPT / Konsultasi                      | `tabs/CPPTTab.tsx` → shared                  | 🔜     |
| Diagnosa                               | `tabs/DiagnosaTab.tsx` → shared              | 🔜     |
| Pemeriksaan Fisik                      | `tabs/PemeriksaanTab.tsx`                    | 🔜     |
| Penilaian / Scoring                    | `tabs/PenilaianTab.tsx`                      | 🔜     |
| Resep & Obat                           | `tabs/ResepTab.tsx` → shared                 | 🔜     |
| Order Lab                              | `tabs/OrderLabTab.tsx` → shared              | 🔜     |
| Order Radiologi                        | `tabs/OrderRadTab.tsx` → shared              | 🔜     |
| Informed Consent (prosedur minor poli) | `tabs/InformedConsentTab.tsx` → shared       | 🔜     |
| Disposisi / Surat                      | `tabs/DisposisiRJTab.tsx`                    | 🔜     |
| Route (fullpage)                       | `app/ehis-care/(fullpage)/rawat-jalan/[id]/` | 🔜     |

### Pasien Master (`ehis-registration`)

| File                                  | Route                                               | Status |
| ------------------------------------- | --------------------------------------------------- | ------ |
| `registration/PatientDashboard.tsx`   | `/ehis-registration/pasien/[id]`                    | ✅     |
| `registration/KunjunganDetailPage.tsx`| `/ehis-registration/pasien/[id]/kunjungan/[id]`     | ✅     |

---

## TODO Queue

### 🔴 Next — Tier 2 (Poin SNARS Berkurang Kalau Tidak Ada)

- [ ] **GCS + NEWS2 Auto-calculation** — total GCS otomatis (E+V+M) + NEWS2/MEWS score dari TTV (TD sistol, RR, SpO2, suhu, kesadaran) + badge warna hijau/kuning/merah di shared TTVTab. Benefit IGD + RI sekaligus. SNARS AP 2 · Clinical decision support
- [ ] **HAM Label IGD Resep & Rekonsiliasi** — pelabelan High-Alert Medication + peringatan double-check di `ResepPasienTab` + `RekonsiliasTab` IGD. RI sudah ada HAM badge. SKP 3 · PMK 72/2016
- [ ] **Isolasi dan PPI Documentation (RI)** — jenis isolasi (Contact/Droplet/Airborne) + bundle VAP/CAUTI/CLABSI. Tab baru RI. SNARS PPI 1–7
- [ ] **Rencana Asuhan Terintegrasi / Care Plan (RI)** — care plan bersama DPJP + Perawat + PPA, target outcome harian. Sub-tab di CPPTTab atau tab baru. SNARS PP 1
- [ ] **Print / Export Rekam Medis PDF (RI)** — cetak dokumen legal: CPPT, TTV, Resume Medis. PMK 269/2008

### 🟠 Backlog — Tier 3 (Klinis Penting, Sprint Berikutnya)

- [ ] **Konsultasi Gizi / Monitoring Nutrisi (RI)** — konsultasi dietitian + rencana diet harian + monitoring asupan vs I/O. SNARS AP 1.4
- [ ] **ICU/HCU Scoring APACHE II / SOFA (RI)** — severity scoring harian + trending (ri-3 Syok Sepsis kandidat). SNARS PP · ICU international
- [ ] **Clinical Pathway Integration (RI)** — alur tatalaksana standar per diagnosis, CBG-aligned. PERMENKES 1438/2010
- [ ] **Identifikasi 2 Identitas Sebelum Tindakan (IGD)** — konfirmasi nama + tgl lahir/noRM sebelum prosedur. SKP 1 · JCI IPSG 1

### ⏸ Ditunda / Roadmap

- [ ] **Rawat Jalan (Poliklinik)** — kerjakan setelah Tier 2 selesai agar RJ inherit GCS/NEWS2 + HAM. Sub-modul `/ehis-care/rawat-jalan`
- [ ] **Laporan IKP** — form KTD/KNC/Sentinel. Kemungkinan modul EHIS-Safety. PMK 11/2017
- [ ] **Transfusi Darah (RI)** — pre/intra/post-transfusi checklist. SNARS PP 4

### ⚙️ Tech Debt

- [ ] **AllergyPane IGD** — masih local, padahal `shared/asesmen/AllergyPane.tsx` sudah ada. Refactor `AsesmenMedisTab` sub-pane Alergi ke thin wrapper.
- [ ] **RekonsiliasTab IGD** — audit duplikasi dengan `resep/RekonsiliasiPane.tsx` RI (SNARS PP 3.1). Jika scope serupa, promote ke shared.
- [ ] **PenilaianTab IGD** — audit overlap Morse/Braden/Barthel dengan `PenilaianRisikoPane.tsx` RI. Ekstrak konstanta ke `shared/asesmen/penilaianShared.ts`.
- [ ] Replace mock data dengan Prisma queries, mulai dari `PatientMaster`
- [ ] Error boundary + loading skeleton untuk semua fullpage routes
- [ ] `SidebarContext` — belum dipakai konsisten di semua modul

### 🟢 Backlog (Other Modules)

- [ ] `ehis-registration` — form pendaftaran pasien baru + kunjungan, search existing
- [ ] `ehis-billing` — kasir: invoice, tindakan + obat, print struk
- [ ] `ehis-dashboard` — stats cards, BOR chart, recent activity
- [ ] `ehis-master` — CRUD: dokter, ruangan, tarif, obat/lab catalog
- [ ] `ehis-report` — laporan per periode, export Excel/PDF
- [ ] `ehis-lab` — order tracking, entry hasil, verifikasi, history per pasien
- [ ] `ehis-rad` — order tracking, upload/view hasil, verifikasi

---

## Key Data Contracts

**Mock IDs** (jangan ubah tanpa update semua tab):

- IGD: `igd-1` (Joko Prasetyo ♂55, `RM-2025-005`) · `igd-2` (Siti Rahayu ♀32, `RM-2025-012`)
- RI: `ri-1` (GJK NYHA III, dr. Budi Santoso Sp.JP, `RM-2025-003`) · `ri-3` (Syok Sepsis, dr. Hendra Wijaya Sp.EM, `RM-2025-007`)
- Mock keyed by `RM-2025-003`: `KONSULTASI_MOCK` · `OrderLabMock` · `OrderRadMock` · `DISCHARGE_MOCK` · `PASIEN_PULANG_MOCK` · `GIZI_HISTORY_MOCK`
- Mock keyed by `RM-2025-005`: `HANDOVER_MOCK` (IGD)

**Core types** (semua di `src/lib/data.ts`):  
`IGDPatientDetail` · `PatientMaster` · `KunjunganRecord` · `RawatInapPatientDetail`  
`TipePenjamin`: `BPJS_Non_PBI | BPJS_PBI | Umum | Asuransi | Jamkesda`  
`RIKelas`: `VIP | Kelas_1 | Kelas_2 | Kelas_3 | ICU | HCU | Isolasi`  
`DiagnosaTipe`: `Utama | Sekunder | Komplikasi | Komorbid`  
`DiagnosaStatus`: `Pasti | Dicurigai | Diferensial`  
`IGDDiagnosa`: `id · kodeIcd10 · namaDiagnosis · tipe · status? · alasan? · analisa?`  
`CPPTEntry`: `id · waktu · tanggal? · profesi · penulis · SOAP fields · verified? · verifiedBy? · verifiedAt? · flagged?`
