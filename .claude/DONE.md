# EHIS — Completed Work History

> Archive semua item yang sudah selesai. Jangan hapus — berguna untuk audit dan referensi arsitektur.
> Untuk TODO aktif → `CLAUDE.md` | Gap analysis → `.claude/GAP_ANALYSIS.md`

---

## ✅ Selesai — Rawat Inap Tabs (Semua)

1. **Asuhan Keperawatan** (`tabs/KeperawatanTab.tsx`) — SDKI katalog 15 dx + auto-fill, evaluasi inline per shift, status luaran badge (Teratasi/Sebagian/Belum/Dipantau), SLKI kriteria hasil, verifikasi supervisor. Sub: `keperawatan/AsuhanForm.tsx` + `AsuhanCard.tsx` + `keperawatanShared.ts`
2. **Pemeriksaan Fisik** (`tabs/PemeriksaanTab.tsx`) — Status generalis pills, 11 sistem head-to-toe accordion, quick-normal template, temuan abnormal checklist, body map, riwayat harian collapsible. Sub: `pemeriksaan/StatusFisikPane.tsx` + `BodyMapPane.tsx` + `RiwayatPane.tsx`
3. **Intake / Output** (`tabs/IntakeOutputTab.tsx`) — Entri per shift (Oral/IV/NGT/Transfusi + Urine/Drainase/Feses/Muntah/Perdarahan), IWL auto-calc (BB×10+koreksi demam), balance, target/restriksi DPJP + progress bar, riwayat multi-hari collapsible. Sub: `intakeOutput/{EntriPane,RingkasanPane,RiwayatPane,ioShared}`
4. **Resep & Obat** (`tabs/ResepTab.tsx`) — 3 sub-tab: Resep Aktif (ObatSearch autocomplete + HAM badge, draft→confirm, Kirim Order, riwayat+salin) · MAR Harian (grid 7-hari × 3-shift, dropdown `fixed`, Panduan Pencatatan) · Rekonsiliasi (SNARS PP 3.1). Shared: `shared/resep/{resepShared,ObatSearch,ResepItemRow}`
5. **Order Lab** (`tabs/OrderLabTab.tsx`) — thin wrapper → `shared/medical-records/OrderLabTab.tsx`. Mock RM-2025-003 (BNP/Ureum/Kreatinin + riwayat abnormal)
6. **Order Radiologi** (`tabs/OrderRadTab.tsx`) — thin wrapper → `shared/medical-records/OrderRadTab.tsx`. Mock RM-2025-003 (Thorax PA + Echo GJK)
7. **Konsultasi Antar SMF** (`tabs/KonsultasiTab.tsx`) — SBAR 4-field + closed-loop (Terkirim→Diterima→Dijawab→Selesai) + 22 SMF dropdown + response timer + CPPT auto-notif + Framer Motion. Sub: `konsultasi/{RequestPane,DetailPane,konsultasiShared}`. Mock RM-2025-003 (GIZ Selesai + RM Dijawab)
8. **Discharge Planning** (`tabs/DischargePlanTab.tsx`) — 3-step stepper (Fase 1 sky: Asesmen MRS / Fase 2 emerald: Edukasi Harian / Fase 3 amber: Checklist H-1 Pulang), `DischargeHeader`, Framer Motion direction-aware, `StepChecklist` (10 item, animated donut), `FinalizeBanner`, DPJP sign-off. Mock RM-2025-003 (7-day). Sub: `discharge/{dischargeShared,StepAsesmen,StepEdukasi,StepChecklist}`
9. **Pasien Pulang** (`tabs/PasienPulangTab.tsx`) — Header orange + 5 sub-tab: Status Kepulangan (4 pilihan + APS warning) · Obat & Jadwal (HAM badge, 22 POLI_OPTIONS, FKTP toggle) · Surat-surat (5 jenis, conditional visibility, terbitkan/cetak) · Resume Medik (klaim BPJS/INA-CBG, prerequisite gate, auto-aggregated TTV/Lab/Rad/MAR/Tindakan, DPJP sign-off, print INA-CBG) · Resume Pulang (salinan pasien PMK 24/2022, print). Sub: `pasienPulang/{pasienPulangShared,StatusPane,ObatJadwalPane,SuratPane,ResumeMedikPane,ResumeMedisPane}`

---

## ✅ Selesai — Gap Kritis

- **Asesmen Awal RI (MRS)** — Tab baru RI: 5 sub-tab (Anamnesis / Riwayat Medis / Alergi / Skrining Gizi / Penilaian Risiko), per-tab completion dots, global progress bar %, Framer Motion direction-aware, SNARS AP 1.1–1.5. Shared di `shared/asesmen/`. PenilaianRisikoPane: tab-per-skala (Barthel/Morse/Braden) + chip options + dashed border. Bug fix: AnamnesisPaneRI form text invisible → `text-slate-900`.
- **Redesign /ehis-care/igd page** — `IGDBoard`: DPJP filter dropdown, pagination 9/hal, AnimatePresence. `PatientCard`: seluruh card clickable Link, urgency indicator pulsing P1/P2, boarding badge ≥6 jam. `IGDRuanganPanel`: collapse toggle + summary chips.
- **Skala Nyeri di TTVTab** — `PainScale` component interaktif (grid 11 tombol NRS 0–10, warna per level) + read-only di history. SNARS AP 1.2 ✅
- **SBAR Transfer IGD→RI** — `SBARTransferPanel.tsx` (497 ln): 4 seksi SBAR warna, progress bar, auto-populate TTV+GCS+NRS+diagnosa, read-back gate. Refactor `PasienPulangTab.tsx` (1271→472 ln, split 7 file). SKP 2 ✅
- **SBAR Serah Terima Shift (Handover)** — `HandoverTab.tsx` (RI) + `handover/`: date nav prev/next, 3 shift pills, `HandoverCard` (collapsible SBAR + TTV strip), `HandoverForm` (SBAR 4-seksi, auto-populate TTV, progress bar, canSubmit gate). Mock RM-2025-003 (4 entry). SKP 2 ✅

---

## ✅ Selesai — Tier 1

- **Informed Consent (IC)** — shared `InformedConsentTab.tsx` + `informedConsent/` sub-components. Template per tindakan, TTD + saksi + nomor IC. PMK 290/2008 · HPK 2.1–2.2
- **Handover IGD** — `shared/medical-records/HandoverTab.tsx` dijadikan shared. RI + IGD thin wrappers. `HandoverPatient` interface dengan `subtitle: string` + `badge?: string`. Mock RM-2025-005 (2 entry Siang+Malam). SKP 2 ✅
- **Monitoring Observasi Terjadwal IGD** — shared `TTVTab.tsx`: prop `triage?: TriageLevel` → `TRIAGE_OBS` config (P1=15mnt/P2=30mnt/P3/P4=60mnt), obs strip (next-due chip, pulsing overdue alert), form ganti shift→jam input, timeline `hideShift`, `timeToShift()` helper. IGD wrapper: pass `triage={patient.triage}`. SNARS AP 2 · PMK 47/2018 ✅

---

## ✅ Selesai — Tier 2 (Care Plan / RAT)

- **Rencana Asuhan Terintegrasi (CarePlanTab)** — tab baru RI disisipkan antara Asesmen Awal & CPPT. `carePlanShared.ts`: types (`PhaseId/PhaseStatus/MasalahEntry/PPASection/PhaseData/CarePlanData`), `PHASE_DEFS` (3 fase: Admisi sky · Perawatan indigo · Pre-Discharge emerald), `STATUS_CFG`, `emptyPhase()/emptyCarePlan()`. `PhaseSection.tsx`: accordion per fase — header (icon+label+status spring-badge+centang emerald AnimatePresence+tanggal range+chevron rotate), body height 0→auto (tanggal mulai/selesai, PPAPanel×2 DPJP+Perawat grid target/intervensi textarea, evaluasi, footer status select+updatedBy+Simpan). `CarePlanTab.tsx`: `ProgressHeader` animated width bar + spring-scale badge, `MasalahPanel` (list stagger AnimatePresence, add via Enter/button, hapus ×), 3 PhaseSection accordion (one-open-at-a-time), `SignOffBanner` amber→hijau setelah DPJP verifikasi. `RIRecordTabs`: icon `Target`, posisi setelah asesmen-awal. TypeScript 0 error. SNARS PP 1 ✅
- **Tech debt 4 item dicatat**: link DiagnosaTab → RAT, template per diagnosis, Multi-PPA, audit trail revisi.

---

## ✅ Selesai — Tier 2 (Shared Rekonsiliasi)

- **Shared RekonsiliasTab (IGD + RI)** — single source of truth `shared/medical-records/RekonsiliasTab.tsx`. 4 file baru: `rekonsiliasiShared.ts` (types `RekonContext/RekonPhase/Keputusan/ObatEntry/RekonData`, `REKON_PHASES` config berbeda label per context, `KEPUTUSAN_CFG` color map, `emptyEntry()/emptyRekon()` factories) · `ObatEntryRow.tsx` (grid compact row: ObatSearch + dosis + keputusan select + expand toggle + delete, AnimatePresence HAM badge spring-scale, expand panel 4-field + gantiDengan conditional + alasan) · `RekonSection.tsx` (accordion per fase: header dengan HAM count badge + selesai spring-check + rotating chevron, height 0→auto panel, tanggal+petugas+obat list+catatan, simpan footer) · `RekonsiliasTab.tsx` (ProgressHeader animated width bar + spring-scale badge, HAMBanner height 0→auto slide-in, HomeMedsBanner untuk RI, `RekonPatient` duck-typing interface). IGD wrapper → `context="igd"` (fase: Admisi/Transfer/Discharge). RI wrapper → `context="ri"` (fase: MRS/Transfer/KLRS). Hapus `resep/RekonsiliasiPane.tsx` (306 ln dead code). ResepTab RI: sub-tab rekonsiliasi dihapus, kini hanya Resep Aktif + MAR. RIRecordTabs: tab "Rekonsiliasi Obat" ditambah di grup Rekam Medis. Tech Debt "RekonsiliasTab IGD" resolved. SNARS PP 3.1 · SKP 3 · PMK 72/2016 ✅

---

## ✅ Selesai — Tier 2 (GCS + NEWS2)

- **GCS Auto-calc + NEWS2 Score** (`shared/medical-records/TTVTab.tsx`) — `calcNEWS2()`: 6 parameter (RR · SpO2 · TD Sistolik · Nadi · Suhu · Kesadaran ACVPU), red-flag logic (any single param=3 pts → min Sedang), 3 level (Rendah 0–4 · Sedang 5–6 · Kritis ≥7). Tampil di: (1) current vitals badge animated + dot, (2) history row compact preview chip, (3) form "Prediksi NEWS2" live preview. GCS live total badge (E+V+M → /15) di form dengan warna status. Benefit IGD + RI sekaligus tanpa perubahan wrapper. SNARS AP 2 ✅

---

## ✅ Selesai — Tier 3 (ICU/HCU Scoring)

- **ICUScoringTab (RI)** — tab kondisional: hanya muncul di sidebar jika `patient.kelas === "ICU" || "HCU"`. `TabDef` diperluas dengan `showFor?: string[]`, filter diterapkan di `visibleRM`. 5 file: `icuScoringShared.ts` · `SOFAPane.tsx` · `APACHEPane.tsx` · `TrendPane.tsx` · `ICUScoringTab.tsx`.

- **Upgrade: Actual Value Inputs (standar internasional)** — Seluruh 3 pane diupgrade dari skor 0–4 manual menjadi input nilai aktual terukur dengan auto-kalkulasi otomatis sesuai standar.

  **SOFA (Vincent 1996 / Sepsis-3 2016):**
  - Respirasi: PaO₂ + FiO₂ (%) → P/F ratio + ventilator checkbox → score 0–4 (`scoreSOFAResirasi`)
  - Koagulasi: trombosit ×10³/µL → score
  - Liver: bilirubin mg/dL → score
  - Kardiovaskular: MAP + vasopressor select (none/dobutamin/dopamin/epi/NE) + dosis µg/kg/min → score (AnimatePresence dose field)
  - Neurologi: GCS total → score
  - Renal: kreatinin + urine output opsional → `Math.max(crScore, uoScore)` (higher wins)
  - `SOFAActualValues` interface, `emptySOFAActual()`, `calcSOFAFromActual()`

  **APACHE II (Knaus 1985 bidirectional range tables):**
  - 9 param standar (Suhu/MAP/Nadi/RR/pH/Na/K/Hkt/WBC): `NumInput` → bidirectional V-shaped range lookup (`T_RNG/MAP_RNG/HR_RNG/RR_RNG/PH_RNG/NA_RNG/K_RNG/HCT_RNG/WBC_RNG`) → `ScoreChip` + collapsible hint ref
  - Oksigenasi (special): FiO₂<50% → skor dari PaO₂ langsung · FiO₂≥50% → A-aDO₂ = (713×FiO₂/100)−(PaCO₂/0.8)−PaO₂ → skor + tampilkan nilai A-aDO₂/P:F ratio
  - Kreatinin + AKI checkbox: `scoreAPACHECr(cr, aki)` → skor dikali 2 bila AKI, maks 8 (Knaus 1985)
  - GCS: `gcsContrib(gcs) = 15 − GCS` → kontribusi APS range 0–12 (bukan dibatasi 4)
  - Usia: `NumInput` → `ageToPoints(age)` → chip +0/2/3/5/6 animated
  - Kronik: radio-style selector (0/2/5)
  - `calcAPACHEFromActual()` → `APACHECalcResult { aps, total, mortalitas, agePoints }`
  - Mortalitas: `ln(odds) = −3.517 + total × 0.146` (general non-operative ICU formula)

  **Mock diupdate** dengan nilai aktual realistis (RM-2025-007, 4 SOFA + 2 APACHE entry). HistoryRow expand → tampilkan nilai aktual lengkap. TypeScript 0 error. SNARS PP · ICU international ✅

---

## ✅ Selesai — Tier 3 (Gizi & Nutrisi)

- **GiziNutrisiTab (RI)** — tab baru di grup Rekam Medis (antara intake-output & handover). 4 file: `giziNutrisiShared.ts` (types `DietOrder/DietitianAddendum/MealEntry/DailyMonitoring/GiziNutrisiData/SkriningSummary`, `PERSEN_CFG` 5-level color map, `TEKSTUR_CFG`, `MONITORING_STATUS_CFG satisfies`, `TIPE_DIET_OPTIONS` 12 item, helpers `calcDailyAvg/getMonitoringStatus`). `DietOrderPane.tsx`: `SkriningSummaryCard` (NRS score badge warna mid/high, rujuk toggle animated), `DietOrderForm` (tipeDiet select + kalori + tekstur 4 pill + batasan), `DietitianAddendumSection` (collapsible teal, nama+catatan+tanggal). `MonitoringPane.tsx`: `PersenSelector` (5 pill whileTap spring, animated progress bar per meal), `MealCard` (icon pagi🌅/siang☀️/malam🌙 + % badge + catatan), `DaySummaryStrip` (avg + status badge), `HistoryRow` (collapsible, mini vertical bar chart P/S/M, expand 3-col detail), `WeekStrip` (7 hari terakhir, color dot emerald/amber/rose/grey, selected=indigo). `GiziNutrisiTab.tsx`: `ProgressHeader` 2 StepPill (Diet Order + Monitoring) + animated width bar, SNARS AP 1.4 note, `xl:grid-cols-2` (DietOrderPane kiri · MonitoringPane kanan), completion banner emerald AnimatePresence. Tech Debt: diet order idealnya dari `DaftarOrderTab` tipe "Diet" (dicatat). SNARS AP 1.4 ✅

---

## ✅ Selesai — Recent (DaftarOrder + GiziPane)

- **Tab Daftar Order RI** — Shared `DaftarOrderTab` di `shared/medical-records/`. IGD refactor thin wrapper (902→12 ln). RI thin wrapper baru. 4 sub-components: `daftarOrderShared.ts` (types+configs+mock IGD+RI), `OrderRow.tsx` (animated expand/collapse, item stagger), `OrderStats.tsx` (Framer Motion StatCard), `CancelDialog.tsx` (confirm modal+toast). RI mock RM-2025-003 (14 order, 4 tipe). RIRecordTabs: tab "Daftar Order" di LAYANAN.
- **GiziPane — Riwayat & Shared IGD** — `shared/asesmen/GiziPane.tsx` direwrite: history/riwayat skrining (HistoryCard collapsible, ScoreChip, Framer Motion new-entry highlight, save toast), `everSaved` pattern. IGD `AsesmenMedisTab` refactor: local `GiziPane` (158 ln) dihapus → import shared + `noRM` prop. `GIZI_HISTORY_MOCK["RM-2025-003"]` (2 entry).

---

## ✅ Selesai — EHIS-Registration

- **PatientDashboard redesign** — 2-column layout (info+penjamin+jadwal / profil+riwayat terkini+tagihan), compact penjamin card, "Riwayat Pendaftaran Terkini" card, bottom CTA replaces table, modal renamed "Riwayat Pendaftaran", responsive multidevice
- **Detail Pendaftaran Kunjungan** — fullpage `/pasien/[id]/kunjungan/[kunjunganId]`, dokumen, aksi, cetak, modals

---

## ✅ Selesai — EHIS-Care (Earlier)

- **Diagnosa — shared + redesign** — `shared/medical-records/DiagnosaTab.tsx` (ICD-10 + ICD-9-CM, status kepastian Pasti/Dicurigai/Diferensial, alasan & analisa inline, INA-CBG preview chip). `diagnosaShared.ts`. IGD refactor ke thin wrapper. RI thin wrapper.
- **CPPT — interaktif + SNARS compliance** — DPJP co-sign verification, Template SOAP (4 template), Search & Filter, Flag Tindak Lanjut. Split: `cpptShared.ts` + `CPPTEntryCard.tsx` + `CPPTTab.tsx`
- **Rawat Inap — fullpage detail** — route `/ehis-care/rawat-inap/[id]`, `RIPatientHeader` (status-based theme, vitals bar), `RIRecordTabs`. `RawatInapPatientDetail` type + mock ri-1/ri-3.
- **IGD Triase Modal** — "+ Triase" button, modal fullscreen, primary survey ABCDE, backdrop shake, portal z-index. `IGDTriaseButton` + `TriaseModal` + `TriasePrimaryForm`
- **Rawat Inap — halaman utama** — header + BOR gauge + 6 stats card, `RIRuanganPanel` (7 kelas, occupancy ring, bed map modal), `RIBoard` (filter status/kelas/DPJP/search)
- **Redesign IGD tabs/PenilaianTab** — multi-tab (Fisik, Jantung, Kanker, dll.), two-panel layout, auto-resize textarea
- **StatusFisikPane shared** — dipindah ke `shared/medical-records/pemeriksaan/`. IGD + RI keduanya import dari shared. IGD tetap punya sub-tab Anatomi + Penunjang tersendiri.

---

## ✅ Selesai — Tech Debt

- **Skala Nyeri (0–10)** — `PainScale` component interaktif + read-only di shared TTVTab. SNARS AP 1.2 ✅
- **PemeriksaanTab IGD** — upgrade ke head-to-toe shared StatusFisikPane (11 sistem), menggantikan FisikPane lama (6 sistem)
- **Audit PenilaianTab IGD** — Morse Fall Scale, Braden Scale, Barthel Index, NRS semua ✅ ada
- **Audit EdukasiPane IGD** — `TOPIK_EDUKASI` checklist, `METODE_EDUKASI`, evaluasi pemahaman ✅ sesuai HPK 2
- **GiziPane shared** — local GiziPane IGD (158 ln) dihapus, diganti import shared + `noRM` prop ✅
