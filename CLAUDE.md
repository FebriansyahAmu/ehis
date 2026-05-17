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
| `/ehis-care/farmasi` | Farmasi       | ModuleLayout (main) + Fullpage detail   | ✅ Done     |
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

### ✅ Selesai — Farmasi Worklist + Detail (`/ehis-care/farmasi`)

**Layer 1 — Halaman Apoteker (cross-patient worklist):** ✅
- [x] **`farmasiShared.ts`** ✅ — Types + config maps + `deriveResepOrders()` + `updateFarmasiWorkflow()` + `workflowStore` + `getOrderById()` + `getPatientInfo()`. Pricing/stock mock (`lookupPrice`, `lookupStock`, `parseSatuan`). `PatientInfoEntry` dengan demographics (usia, jenisKelamin, ruangan, noBed). `src/components/farmasi/`
- [x] **`OrderCard.tsx`** ✅ — Card per order: HAM badge, status badge, progress bar, **action button → Link navigasi ke `/ehis-care/farmasi/[id]`** (tidak ada modal lagi).
- [x] **`TelaahModal.tsx`** ✅ — 3-checklist accordion (Adm/Farm/Klin) + HAM warning + Setujui/Kembalikan.
- [x] **`DispensasiModal.tsx`** ✅ — 2-step: lot/batch/expired/label → serah terima (nama perawat).
- [x] **`FarmasiBoard.tsx`** ✅ — Stat bar + depo tabs + filter + HAM toggle + search + grid + pagination. Modals dihapus — workflow pindah ke halaman detail.
- [x] **`page.tsx`** ✅ — Route `src/app/ehis-care/(main)/farmasi/page.tsx`. Workflow guide strip + header stats dari `deriveResepOrders()`.

**Layer 2 — Tab Farmasi di rekam medis pasien (per-patient status tracker):** ✅
- [x] **`FarmasiTab.tsx`** ✅ (shared) — Summary cards + order list accordion + catatan apoteker + link ke halaman farmasi. Pakai `deriveResepOrders(noRM)`. `src/components/shared/medical-records/FarmasiTab.tsx`
- [x] **Wire ke IGDRecordTabs + RIRecordTabs + RJRecordTabs** ✅ — Tab "Status Farmasi" (icon: Tablets) di grup LAYANAN ketiga modul.

**Layer 3 — Data Bridge (ORDERS_MOCK ↔ Farmasi):** ✅
- [x] **Standarisasi tujuan** ✅ — `"Depo Rawat Inap"` → `"Apotek RI"`, `"Apotek Rawat Jalan"` → `"Apotek RJ"` di `daftarOrderShared.ts`.
- [x] **`updateOrderStatus()`** ✅ — fungsi mutasi status order di `ORDERS_MOCK`, dipanggil saat apoteker submit telaah/dispensasi → `DaftarOrderTab` pasien ikut terupdate dalam sesi yang sama.
- [x] **Single source of truth** ✅ — `ORDERS_MOCK` adalah satu-satunya sumber. Saat migrasi ke DB, cukup ganti `ORDERS_MOCK` dengan Prisma query — semua UI tidak perlu disentuh.

**Layer 4 — Halaman Detail Order Farmasi (`/ehis-care/farmasi/[id]`):** ✅
- [x] **Route fullpage** ✅ — `app/ehis-care/(fullpage)/farmasi/[id]/` layout + page. Server component, `getOrderById(id)`.
- [x] **`FarmasiOrderHeader.tsx`** ✅ — Back button, patient info (nama, RM, usia, gender, ruangan, bed), order info (dokter, depo, tanggal, jam, item count), status badge animated, HAM + prioritas badge, progress strip 4-step.
- [x] **`FarmasiOrderTabs.tsx`** ✅ — Sidebar 2 tab (Layanan Farmasi · CPPT Apoteker) + AnimatePresence content. Live order re-derived dari `workflowStore` client-side. Callbacks: `onTelaahSubmit`, `onDispensasiSubmit`, `onCatatanAdd`.
- [x] **`tabs/LayananFarmasiTab.tsx`** ✅ — 4-tab card nav: Telaah Resep (step 1) · Dispensing & Serah (step 2) · Dokumen (step 3) · Riwayat Resep (info tab). `step: number | null` pattern — null = non-workflow tab (no step badge, icon always visible). `TabBtn` handles both variants.
- [x] **`TelaahPane.tsx`** ✅ — Two-panel layout (`sm:grid-cols-2`): alerts (AllergyBanner + HAM) full width · Left panel `Administratif & Farmasetis` · Right panel `Klinis & Keputusan` (Klinis + Substitusi + catatan + Setujui/Kembalikan). Centang Semua per seksi. Alasan dikembalikan + Simpan Simpan button full width. Locked view setelah submit.
- [x] **`DispensingSerahPane.tsx`** ✅ *(menggantikan DispensingPane.tsx + SerahTerimaPane.tsx)* — Combined pane: tabel obat + Lot/Batch/Exp/label input → serah terima form (penerima + cara pemberian + edukasi checklist). Footer: total tagihan IDR. Locked setelah selesai.
- [x] **`RiwayatResepPane.tsx`** ✅ *(menggantikan RiwayatPane.tsx)* — Dedicated 4th sub-tab. Stats strip (Total/Selesai/Aktif/Dikembalikan). `OrderHistCard` per order: prioritas/HAM/status badges, item chips, dispensing overview (LOT+label count), serah overview (penerima+waktu+verifikatorAkhir), expandable per-item detail. Current order highlighted sky. Link ke halaman detail.
- [x] **`DokumenPane.tsx`** ✅ *(menggantikan CetakPane.tsx)* — Pure cetak dokumen: 4 DocCard (Resep, Kwitansi, Label Obat, Etiket Aturan Pakai) + Cetak Semua. Order summary grid. Printed state tracking. Riwayat Resep dipindah ke tab tersendiri.
- [x] **CPPT Apoteker** ✅ — Shared `CPPTTab` dengan `initialEntries=[]` + `showDate=true`.

> Alur data: Dokter order resep di `DaftarOrderTab` → `ORDERS_MOCK` → `deriveResepOrders()` → FarmasiBoard overview → klik action → halaman detail `/farmasi/[id]` → Telaah + Dispensasi + Serah Terima → `workflowStore` + `ORDERS_MOCK` sync → FarmasiTab pasien terupdate. PMK 72/2016 · SKP 3

### 🔴 Active — Dashboard (`/ehis-dashboard`)

### 🟡 Next — Dashboard & Modul Pendukung

- [ ] **Dashboard (`ehis-dashboard`)** — stats cards (pasien hari ini per unit: IGD/RI/RJ), BOR chart (bed occupancy rate), recent activity feed, quick-nav ke masing-masing modul. Route: `/ehis-dashboard`. Layout: ModuleLayout sudah ada.
- [ ] **Billing Kasir (`ehis-billing`)** — invoice per kunjungan, rincian tindakan + obat, status pembayaran (Lunas/Proses Klaim/Belum), print struk. `KasirData` type + mock sudah tersedia di `data.ts`.

### 🟡 Farmasi — Gap SNARS / PMK 72/2016 (Hasil Gap Analysis 2026-05-17)

> Core workflow farmasi sudah selesai (telaah → dispensing → serah terima). Items di bawah adalah gap yang ditemukan dari komparasi PMK 72/2016, SNARS PKPO, dan praktik RS terakreditasi di Indonesia.

**Tier 1 — Kritis (wajib akreditasi / legal requirement):**

- [x] **MAR (Medication Administration Record)** ✅ — `shared/medical-records/MARTab.tsx` + `mar/marShared.ts`. Shift tabs (Pagi/Siang/Malam) + date nav 7 hari. Drug cards per obat aktif dari `resepRI.items` dengan time slot per signa. Input modal: status (Diberikan/Ditunda/Ditolak/TidakTersedia) + waktu + perawat + catatan. HAM double-check: field perawat ke-2 wajib. Read-only history view untuk tanggal lampau. Stats bar: obat aktif / diberikan / tertunda. Ringkasan hari ini 3 shift. Tab "MAR" di RIRecordTabs grup LAYANAN. SNARS PKPO 6 · PMK 72/2016 Ps. 25
- [x] **Register Narkotika & Psikotropika** ✅ — `farmasi/narPsi/narPsiShared.ts` + `RegisterNarPsiPane.tsx`. Catalog 5 N + 5 P drugs. Register table dengan kolom: no. urut, tanggal, jenis mutasi, pasien/RM, jumlah keluar, saldo. Expandable row untuk detail (dokter, no. resep, pengambil). Filter per obat. Saldo card per obat + alert stok minimum. Tambah Pengeluaran modal (no. RM, pasien, dokter, no. resep, pengambil). Stok Opname modal + selisih alert. Cetak Laporan Bulanan. Tab "Register N/P" di FarmasiViewTabs (tab ke-2 farmasi page). UU 35/2009 · UU 5/1997 · PMK 3/2015
- [x] **LASA Warning System** ✅ — `LASA_PAIRS` + `getLASAPair()` di `farmasiShared.ts`. `isLASA` auto-detect di `deriveItems()`. `LASAConfirmPanel` (full-width, per-item confirm) di TelaahPane. Toggle LASA per item di DispensingSerahPane Step 1 + hint pair. Badge amber di OrderCard + TelaahAkhirItem. PMK 72/2016 Ps. 8 · SKP 3
- [x] **Formularium RS Check + Non-Formularium Justification** ✅ — `FORMULARIUM_LIST` + `isFormularium` auto-detect di `farmasiShared.ts`. `FormulariumPanel` di left panel TelaahPane: badge FORM/NON-FORM per item, justifikasi wajib untuk non-formularium (blocks submit). Data disimpan di `TelaahData.justifikasiNonFormularium`. SNARS PKPO 2 · PMK 72/2016 Ps. 5-7
- [x] **TAT Tracking (Waktu Tunggu Pelayanan)** ✅ — `OrderTimestamps` + `calcTATMenit()` + `getTATStatus()` + `TAT_TARGET_UNIT` + `deriveMockTimestamps()` di `farmasiShared.ts`. `TATTimeline` strip di `FarmasiOrderHeader`. `TATChip` di `OrderCard`. `workflowStore` merge timestamps. Standar: IGD ≤30 mnt · RI ≤60 mnt · RJ ≤30 mnt. SNARS PKPO 6 · Indikator mutu RS

**Tier 2 — Klinis Penting (SNARS bintang 2+):** ✅ Selesai

- [x] **PTO (Pemantauan Terapi Obat)** ✅ — `farmasi/pto/ptoShared.ts` + `tabs/PTOPane.tsx`. Two-panel: kiri drug cards + status terbaru, kanan sparkline SVG trend + riwayat observasi + form tambah. Drug-to-parameter template 9 drug class. `calcPTOStatus()` dengan Kritis/Tinggi/Rendah/Normal. Tab "Monitoring Terapi" di sidebar klinis `FarmasiOrderTabs`. Mock ri-1: Heparin aPTT + KSR K+. SNARS PKPO 7 · PMK 72/2016 Ps. 30–32
- [x] **MESO (Monitoring Efek Samping Obat)** ✅ — `farmasi/meso/mesoShared.ts` + `tabs/MESOPane.tsx`. Two-panel: kiri timeline laporan + severitas badge, kanan form baru atau detail. WHO-UMC causality 5 level. Severitas Ringan/Sedang/Berat/Fatal. Outcome + tindakan diambil. Flag dikirim BPOM. Tab "Pelaporan ESO" di sidebar klinis. PMK 72/2016 Ps. 33
- [x] **DRP (Drug-Related Problems) Documentation** ✅ — `farmasi/drp/drpShared.ts` + `tabs/DRPPane.tsx`. PCNE V9: 9 problem code (P1–P3), 13 cause code (C1–C5), 6 intervensi code (I0–I3), 4 outcome (O0–O3). Two-panel: kiri problem list + domain tag, kanan detail + form baru. Tab "Masalah Terkait Obat" di sidebar klinis. PMK 72/2016
- [x] **Konseling Obat Pulang (Discharge Counseling)** ✅ — `konseling/konselingShared.ts` + `shared/medical-records/KonselingTab.tsx`. Two-panel: kiri drug checklist dari resepRI.items aktif, kanan info obat (indikasi/ESO/penyimpanan) + form penilaian (metode/penerima/pemahaman Baik/Cukup/Kurang/durasi/TTD). `getDrugInfo()` lookup 6 drug class. Tab "Konseling Obat" di RIRecordTabs LAYANAN. SNARS PP 5 · PMK 72/2016 Ps. 27

**Tier 3 — Operasional/Infrastruktur (scope besar):**

- [x] **Pengembalian Obat Pasien Pulang** ✅ — `farmasi/pengembalian/pengembalianShared.ts` + `PengembalianPane.tsx`. Two-panel: kiri list item per resep (jumlah dispensasi/diberikan/dikembalikan, kondisi Baik/Rusak/Kadaluarsa, alasan, HAM double-check) + kanan summary card + panduan prosedur 5-step. Tab "Kembalian Obat" di PasienPulangTab RI. Verifikasi apoteker per record. PMK 72/2016 Ps. 20
- [x] **PIO Log (Pelayanan Informasi Obat)** ✅ — `farmasi/pio/pioShared.ts` + `PIOPane.tsx`. Two-panel: kiri log list (filter kategori + status, stats strip avg respons) + kanan detail jawaban + referensi. Form tambah inline. 6 mock entries (Dosis, Interaksi, ESO, Farmakokinetik, Ketersediaan). Tab "Pelayanan Informasi Obat" di FarmasiViewTabs. PMK 72/2016 Ps. 27-29
- [ ] **Gudang Farmasi (Inventory & Stok)** — modul terpisah: kartu stok digital per depo, FEFO/FIFO enforcement, min-max stock alert, permintaan depo ke gudang, transfer antar depo, penerimaan dari supplier. Scope: modul baru atau sub-modul di `/ehis-care/farmasi`. PMK 72/2016 Bab IV (Manajemen Perbekalan Farmasi)

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
- [ ] **MAR — Gate dispensasi selesai** — obat seharusnya muncul di MAR hanya setelah farmasi `status: "Selesai"` (serah terima sudah dilakukan). Saat ini `MARTab` langsung baca `resepRI.items` tanpa cek status farmasi. Fix: tambah filter `isDispensed(item.id)` yang cek `workflowStore` atau field status di `ResepRIItem`. Tanpa ini perawat bisa "mencatat pemberian" obat yang belum diterima dari apotek.
- [ ] **MAR — Overdue alert** — tidak ada indikasi obat yang jadwal jam-nya sudah lewat tapi belum dicatat. Tambah visual `overdue` di `DrugCard`: jika `timeSlot.waktu < now` dan belum ada entri untuk slot itu, tampilkan ring amber + label "Terlambat X mnt" di samping time chip. Hanya aktif di tab "Hari ini".
- [ ] **MAR → FarmasiTab bridge** — tab "Status Farmasi" di rekam medis pasien tidak menampilkan ringkasan administrasi MAR. Tambah section "Administrasi Hari Ini" di `FarmasiTab`: 3 shift dots (Pagi/Siang/Malam) dengan `X/total diberikan`, pull dari `resepRI.mar` filtered by today. Link ke tab MAR.
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
- Farmasi mock orders: 5 order lintas unit — `igd-1` (HAM, Depo IGD) · `igd-2` (Depo IGD) · `ri-1` (HAM, Apotek RI) · `ri-3` (Apotek RI) · `rj-1` (Apotek RJ) → di `farmasi/farmasiShared.ts`

**Core types** (semua di `src/lib/data.ts`):  
`IGDPatientDetail` · `PatientMaster` · `KunjunganRecord` · `RawatInapPatientDetail`  
`TipePenjamin`: `BPJS_Non_PBI | BPJS_PBI | Umum | Asuransi | Jamkesda`  
`RIKelas`: `VIP | Kelas_1 | Kelas_2 | Kelas_3 | ICU | HCU | Isolasi`  
`DiagnosaTipe`: `Utama | Sekunder | Komplikasi | Komorbid`  
`DiagnosaStatus`: `Pasti | Dicurigai | Diferensial`  
`IGDDiagnosa`: `id · kodeIcd10 · namaDiagnosis · tipe · status? · alasan? · analisa?`  
`CPPTEntry`: `id · waktu · tanggal? · profesi · penulis · SOAP fields · verified? · verifiedBy? · verifiedAt? · flagged?`
