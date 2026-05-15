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
| `InformedConsentTab` | `InformedConsentTab.tsx`          | IGD · RI | Template per tindakan, TTD + saksi + nomor IC. PMK 290/2008                   |
| `RekonsiliasTab`     | `RekonsiliasTab.tsx`              | IGD · RI | `context:"igd"\|"ri"` → phase labels · 3 fase (admisi/transfer/discharge) · HAM badge+banner · progress bar · `RekonPatient` interface. Sub: `rekonsiliasi/{rekonsiliasiShared,ObatEntryRow,RekonSection}` |
| `StatusFisikPane`    | `pemeriksaan/StatusFisikPane.tsx` | IGD · RI | 11-sistem head-to-toe, quick-normal, temuan abnormal                          |
| `CPPTEntryCard`      | `CPPTEntryCard.tsx`               | CPPTTab  | Flag, verification footer, SOAP rows                                          |
| `cpptShared`         | `cpptShared.ts`                   | CPPT     | `PROFESI_CLS`, `SOAP_BADGE`, `fmtDate`, `todayISO`                            |
| `diagnosaShared`     | `diagnosaShared.ts`               | Diagnosa | Katalog ICD10/ICD9, `TIPE_CONFIG`, `STATUS_CONFIG`, `INA_CBG_MAP`             |
| `KonsultasiTab`      | `KonsultasiTab.tsx`               | RI · RJ  | `noRM` + `dokterPeminta` props. Promote dari RI ke shared.                    |
| `SuratDokumenTab`    | `SuratDokumenTab.tsx`             | RJ       | `SuratPatient` interface · 4 jenis surat · sub: `suratDokumen/{suratDokumenShared,SuratFormPane,SuratHistoryPane}` · PMK 269/2008 |
| `ResepTab`           | `ResepTab.tsx`                    | IGD · RI · RJ | `showMAR` flag · HAM badge + HAMConfirmModal · `withIdentitas` wrapper di RJ |

Shared asesmen: `src/components/shared/asesmen/` → `AllergyPane` · `RiwayatPane` · `GiziPane` · `asesmenShared.ts`

### IGD (✅ 100% — semua tab aktif)

Files: `src/components/igd/` — `IGDBoard` · `PatientCard` · `IGDRuanganPanel` · `PatientHeader` · `IGDRecordTabs`  
Tabs: `triase · ttv · asesmen · diagnosa · cppt · tindakan · informed-consent · rekonsiliasi · keperawatan · pemeriksaan · penilaian · penandaan · handover · daftar-order · resep · order-lab · order-rad · rujukan · pulang`  
Key arch: TTVTab passes `triage={patient.triage}` for timed obs mode · SBAR Transfer IGD→RI via `pasienPulang/SBARTransferPanel.tsx`

### Rawat Inap (✅ 100% — semua 19 tab aktif)

Files: `src/components/rawat-inap/` — `RIBoard` · `RIRuanganPanel` · `RIPatientHeader` · `RIRecordTabs`  
Tabs (Rekam Medis): `asesmen-awal · care-plan · cppt · ttv · diagnosa · keperawatan · pemeriksaan · intake-output · gizi-nutrisi · handover · informed-consent · rekonsiliasi`  
Tabs (Layanan): `daftar-order · resep · order-lab · order-rad · konsultasi · discharge · pasien-pulang`  
Route: `app/ehis-care/(fullpage)/rawat-inap/[id]/`

### Rawat Jalan (✅ 100% — semua 13 tab aktif)

Scope: rekam medis per-kunjungan (board/antrian = modul tersendiri nanti).  
Route: `app/ehis-care/(fullpage)/rawat-jalan/[id]/`  
Mock IDs: `rj-1` · `rj-2`

| # | Tab              | File                                              | Source                        | Status |
| - | ---------------- | ------------------------------------------------- | ----------------------------- | ------ |
| — | Patient Header   | `rawat-jalan/RJPatientHeader.tsx`                 | 🆕 baru                       | ✅     |
| — | Tab Router       | `rawat-jalan/RJRecordTabs.tsx`                    | 🆕 baru                       | ✅     |
| 1 | Asesmen Awal     | `rawat-jalan/tabs/AsesmenAwalRJTab.tsx`           | 🔁 adapt dari RI (3 sub-tab)  | ✅     |
| 2 | TTV              | `shared/medical-records/TTVTab.tsx`               | ✅ shared                     | ✅     |
| 3 | CPPT / SOAP      | `shared/medical-records/CPPTTab.tsx`              | ✅ shared                     | ✅     |
| 4 | Diagnosa         | `shared/medical-records/DiagnosaTab.tsx`          | ✅ shared                     | ✅     |
| 5 | Pemeriksaan Fisik| `rawat-jalan/tabs/PemeriksaanRJTab.tsx`           | ✅ shared (StatusFisikPane)   | ✅     |
| 6 | Konsultasi       | `shared/medical-records/KonsultasiTab.tsx`        | 🔁 promote dari RI            | ✅     |
| 7 | Informed Consent | `shared/medical-records/InformedConsentTab.tsx`   | ✅ shared                     | ✅     |
| 8 | Daftar Order     | `shared/medical-records/DaftarOrderTab.tsx`       | ✅ shared                     | ✅     |
| 9 | Resep & Obat     | `shared/medical-records/ResepTab.tsx`             | ✅ shared + withIdentitas     | ✅     |
| 10| Order Lab        | `shared/medical-records/OrderLabTab.tsx`          | ✅ shared + withIdentitas     | ✅     |
| 11| Order Radiologi  | `shared/medical-records/OrderRadTab.tsx`          | ✅ shared + withIdentitas     | ✅     |
| 12| Surat & Dokumen  | `shared/medical-records/SuratDokumenTab.tsx`      | 🆕 baru (shared)              | ✅     |
| 13| Disposisi        | `rawat-jalan/tabs/DisposisiRJTab.tsx`             | 🔁 adapt dari IGD (Rujuk + RI)| ✅     |

Urutan pengerjaan: ✅ Fondasi → ✅ KonsultasiTab → ✅ AsesmenAwalTab → ✅ SuratDokumenTab → ✅ DisposisiRJTab

### Pasien Master (`ehis-registration`)

| File                                  | Route                                               | Status |
| ------------------------------------- | --------------------------------------------------- | ------ |
| `registration/PatientDashboard.tsx`   | `/ehis-registration/pasien/[id]`                    | ✅     |
| `registration/KunjunganDetailPage.tsx`| `/ehis-registration/pasien/[id]/kunjungan/[id]`     | ✅     |

---

## TODO Queue

### ✅ Selesai — Tier 2 (Poin SNARS Berkurang Kalau Tidak Ada)

- [x] **GCS + NEWS2 Auto-calculation** ✅ — total GCS otomatis (E+V+M) + NEWS2/MEWS score dari TTV (TD sistol, RR, SpO2, suhu, kesadaran) + badge warna hijau/kuning/merah di shared TTVTab. Benefit IGD + RI sekaligus. SNARS AP 2 · Clinical decision support
- [x] **Shared RekonsiliasTab (IGD + RI)** ✅ — single source of truth `shared/medical-records/RekonsiliasTab.tsx` + 3 sub-components. 3 fase per context (`admisi/transfer/discharge` IGD · `MRS/Transfer/KLRS` RI), HAM detection badge + banner + count, progress bar animated, accordion per fase, ObatSearch inline, RI home-meds banner. Hapus `RekonsiliasiPane.tsx` + sub-tab dari ResepTab. SNARS PP 3.1 · SKP 3 · PMK 72/2016
- [x] **HAM Label IGD ResepTab** ✅ — badge `⚠ HAM` merah di setiap item obat HAM + `HAMConfirmModal` double-check wajib (checkbox konfirmasi + daftar obat HAM) intercept sebelum order. 7 obat HAM di-flag di `resepShared.ts` katalog. `HAM_BADGE` shared style. SKP 3 · PMK 72/2016
- [x] **Isolasi dan PPI Documentation (RI)** ✅ — isolasi flag chip (Contact/Droplet/Airborne) di `RIPatientHeader` + inline form (tanggal, alasan, dokter, cabut) · Bundle HAI (VAP 5 item / CAUTI 3 item / CLABSI 4 item) di `KeperawatanTab` kondisional ICU/HCU, toggle per alat terpasang · **checklist per shift** (Pagi 07–14 / Siang 15–21 / Malam 22–06) dengan auto-detect `currentShift()` + manual selector + reset ke otomatis · SummaryCard real-time shift dots P/S/M per bundle · history strip 7-hari (3 squares/hari) + history list grouped-by-date · simpan per perawat·shift · liveChecks reset otomatis setelah simpan (shift berikutnya mulai bersih) · badge "X/3 shift kmrn" di card header. Files: `ppiIsolasi/{ppiIsolasiShared,BundleHAISection}`. Types: `Shift` · `SHIFT_ORDER` · `SHIFT_CFG` · `DailyRecord.shift`. Mock history ri-3 (3 shift/hari, 6 hari). SNARS PPI 1–7
- [x] **Rencana Asuhan Terintegrasi / Care Plan (RI)** ✅ — tab baru `CarePlanTab` di REKAM_MEDIS (antara Asesmen Awal & CPPT). Masalah aktif list, 3 fase accordion (Admisi/Perawatan/Pre-Discharge) masing-masing dengan DPJP panel + Perawat panel + evaluasi + status, progress bar animated, sign-off DPJP muncul saat semua fase selesai. Files: `tabs/CarePlanTab.tsx` + `carePlan/{carePlanShared,PhaseSection}`. SNARS PP 1

### ✅ Selesai — Tier 3

- [x] **Konsultasi Gizi / Monitoring Nutrisi (RI)** ✅ — `GiziNutrisiTab` + 3 sub-components (`giziNutrisiShared.ts` · `DietOrderPane.tsx` · `MonitoringPane.tsx`). NRS summary card + rujuk dietitian toggle, diet order form (tipe+kalori+tekstur+batasan), dietitian addendum collapsible, week strip 7-hari color dots, monitoring harian % per makan (pagi/siang/malam), mini bar chart collapsible history. SNARS AP 1.4
- [x] **ICU/HCU Scoring APACHE II / SOFA (RI)** ✅ — `ICUScoringTab` (conditional: `kelas ICU | HCU`). Input nilai aktual terukur dengan auto-kalkulasi standar internasional. SOFA: PaO₂/FiO₂/vent → P/F ratio, trombosit, bilirubin, MAP+vasopressor+dosis, GCS, kreatinin+UO → higher wins. APACHE II: 9 param bidirectional Knaus 1985 range tables + oxygenation (A-aDO₂ = (713×FiO₂/100)−(PaCO₂/0.8)−PaO₂ bila FiO₂≥50%) + creatinine×2 bila AKI (max 8) + GCS contrib 15−GCS (0–12) + age NumInput → auto agePoints + kronik selector. Mortalitas: ln(odds) = −3.517 + total×0.146. Trend 7-hari bar chart + summary table. Files: `tabs/ICUScoringTab.tsx` + `icuScoring/{icuScoringShared,SOFAPane,APACHEPane,TrendPane}`. Mock ri-3 (RM-2025-007, nilai aktual). SNARS PP · ICU international
- [x] **Identifikasi 2 Identitas Sebelum Tindakan (IGD + RI)** ✅ — lazy intercept: banner amber muncul saat masuk tab aksi (Tindakan · Resep · Order Lab · Order Rad · Pasien Pulang), bukan saat buka rekam medis. Banner tampilkan 3 identity card (Nama / Tgl Lahir / No RM) dengan staggered animation + checkbox konfirmasi + input nama perawat. Setelah verifikasi: banner collapse smooth → emerald chip "Identitas terverifikasi · [perawat] · [jam]" · konten tab di-blur + `pointer-events:none` sampai terverifikasi · state shared antar tab dalam satu sesi. `RawatInapPatientDetail` ditambah field `tanggalLahir`. Files: `shared/medical-records/IdentitasVerifikasiBanner.tsx` · modifikasi `IGDRecordTabs.tsx` + `RIRecordTabs.tsx`. SKP 1 · JCI IPSG 1

### ✅ Selesai — Rawat Jalan (Poliklinik)

- [x] **Fondasi RJ** ✅ — `RJPatientDetail` type + mock data (rj-1, rj-2) + route `/ehis-care/rawat-jalan/[id]` + `RJPatientHeader` + `RJRecordTabs` skeleton (13 tab router, semua shared di-wire)
- [x] **Promote KonsultasiTab → shared** ✅ — pindah `rawat-inap/tabs/KonsultasiTab.tsx` + `rawat-inap/konsultasi/{konsultasiShared,RequestPane,DetailPane}` → `shared/medical-records/`. Update import RI.
- [x] **AsesmenAwalTab RJ** ✅ — adapt dari RI: hanya 3 sub-tab (Anamnesis + Riwayat + Alergi). Tanpa Skrining Gizi + Penilaian Risiko. SNARS AP 1.1
- [x] **SuratDokumenTab** ✅ — baru (shared): Surat Keterangan Sakit · Surat Kontrol · Surat Keterangan Sehat · Resume Medis Kunjungan. 4-card selector + form auto-fill + riwayat expandable + cetak. Sub: `suratDokumen/{suratDokumenShared,SuratFormPane,SuratHistoryPane}`. PMK 269/2008
- [x] **DisposisiRJTab** ✅ — adapt dari IGD: Rujuk Internal (poli tujuan, prioritas Segera/Elektif/Konsultasi) + Rujuk Eksternal (surat rujukan full: jenis pelayanan 4 opsi, jenis rujukan 5 opsi, live preview, tujuan PPK/poli, diagnosa multi-select) + Admisi Rawat Inap (kelas 7 opsi, konfirmasi dokter, pengantar admisi). Tanpa Pulang/APS/Meninggal. File: `rawat-jalan/tabs/DisposisiRJTab.tsx`.

### 🔴 Active — Dashboard & Modul Pendukung

- [ ] **Dashboard (`ehis-dashboard`)** — stats cards (pasien hari ini per unit: IGD/RI/RJ), BOR chart (bed occupancy rate), recent activity feed, quick-nav ke masing-masing modul. Route: `/ehis-dashboard`. Layout: ModuleLayout sudah ada.
- [ ] **Billing Kasir (`ehis-billing`)** — invoice per kunjungan, rincian tindakan + obat, status pembayaran (Lunas/Proses Klaim/Belum), print struk. `KasirData` type + mock sudah tersedia di `data.ts`.

### ⏸ Ditunda / Roadmap

- [ ] **Laporan IKP** — form KTD/KNC/Sentinel. Kemungkinan modul EHIS-Safety. PMK 11/2017
- [ ] **Transfusi Darah (RI)** — pre/intra/post-transfusi checklist. SNARS PP 4

### ⚙️ Tech Debt

- [ ] **AllergyPane IGD** — masih local, padahal `shared/asesmen/AllergyPane.tsx` sudah ada. Refactor `AsesmenMedisTab` sub-pane Alergi ke thin wrapper.
- [x] **RekonsiliasTab IGD** ✅ — resolve: promote ke shared `shared/medical-records/RekonsiliasTab.tsx`, `RekonsiliasiPane.tsx` RI dihapus.
- [ ] **PenilaianTab IGD** — audit overlap Morse/Braden/Barthel dengan `PenilaianRisikoPane.tsx` RI. Ekstrak konstanta ke `shared/asesmen/penilaianShared.ts`.
- [ ] **CarePlanTab — Link ke DiagnosaTab** — masalah aktif di RAT idealnya pull dari entri ICD-10 di `DiagnosaTab` (bukan diketik ulang). Perlu shared state atau props `diagnosaList` dari parent `RIRecordTabs` diteruskan ke `CarePlanTab`.
- [ ] **CarePlanTab — Template per diagnosis** — library template RAT per diagnosis umum (GJK, Pneumonia, Sepsis, App Akut, dll). Target/intervensi pre-fill saat masalah dikenali. Kandidat: `carePlan/careplanTemplates.ts`.
- [ ] **CarePlanTab — Multi-PPA** — tambah kolom Gizi, Farmasi, Fisioterapis saat modul tersebut aktif. `PPASection` sudah generic — tinggal extend `PhaseData` dan tambah panel baru di `PhaseSection`.
- [ ] **CarePlanTab — Riwayat revisi / audit trail** — RAT bisa berubah saat kondisi pasien berubah drastis; simpan snapshot per-edit dengan `revisedAt` + `revisedBy`. Perlu Prisma schema.
- [ ] Replace mock data dengan Prisma queries, mulai dari `PatientMaster`
- [ ] Error boundary + loading skeleton untuk semua fullpage routes
- [ ] `SidebarContext` — belum dipakai konsisten di semua modul
- [ ] **GiziNutrisiTab — Diet Order dari DaftarOrderTab** — saat ini diet order diisi standalone di GiziTab. Idealnya DPJP order diet dari `DaftarOrderTab` (tipe baru `"Diet"`), GiziTab hanya membaca order aktif (read-only) + dietitian addendum + monitoring tetap di sini. Perlu: tambah tipe `"Diet"` di `daftarOrderShared.ts`, filter di `GiziNutrisiTab`, hapus form `DietOrderForm`. Kerjakan saat DaftarOrder pakai real data.
- [ ] **Print / Export Dokumen PDF** — cetak dokumen legal per tab: CPPT (per tanggal), TTV chart, Resume Medis (INA-CBG), Resume Pulang (PMK 24/2022), Surat-surat (Keterangan Sakit, Rujukan, dll), Informed Consent, RAT. Kandidat: `window.print()` + print stylesheet, atau `@react-pdf/renderer`. PMK 269/2008 · PMK 24/2022
- [ ] **Clinical Pathway Integration (RI)** — alur tatalaksana standar per diagnosis (GJK, Pneumonia, Sepsis, dll), CBG-aligned. Kandidat: tab baru di RI, pull diagnosis dari `DiagnosaTab`, template per ICD-10. PERMENKES 1438/2010

### 🟢 Backlog (Other Modules)

- [ ] `ehis-registration` — form pendaftaran pasien baru + kunjungan, search existing
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
