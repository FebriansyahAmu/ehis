# EHIS — Completed Work History

> Archive semua item yang sudah selesai. Jangan hapus — berguna untuk audit dan referensi arsitektur.
>
> **Workflow docs**:
> - [CLAUDE.md](../CLAUDE.md) — current state + active work
> - [TODO.md](../TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TECH_DEBT.md](../TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](../TODOS_BACKEND.md) — backend implementation roadmap
> - [GAP_ANALYSIS.md](GAP_ANALYSIS.md) — clinical gap audit
> - [STANDARDS.md](STANDARDS.md) — clinical standards reference

---

## ✅ Selesai — Registration Backend Integration RJ (2026-06-04)

> Backend nyata pertama (layered **Route→Service→DAL→Prisma** + PostgreSQL multi-schema). Spec: [docs/BACKEND-PATIENT.md](../docs/BACKEND-PATIENT.md) · [docs/BACKEND-ENCOUNTER.md](../docs/BACKEND-ENCOUNTER.md). Roadmap [TODO-REGISTRASI.md](../TODO-REGISTRASI.md#phase-reg-be--backend-integration-loket--db-2026-06-04) Phase REG-BE.

1. **No. RM `YYMMNNNN`** — format `26060001` (YY+MM+seq) reset/bulan. Counter table `pendaftaran.rm_counter` + atomic upsert (`ON CONFLICT … RETURNING`), anti-race (uji 10-serentak: 0 duplikat) + `noRm @unique` backstop. Periode zona WIB. Migration `20260602140000_rm_counter` + model `RmCounter`.
2. **Pasien API** — `patientService`/`patientDal`: `POST /patients` dedup-first (NIK/paspor blind-index → existing, anti double-MRN) · `GET /patients` (NIK/RM exact + nama trigram cursor) · `GET /patients/:id` · `PATCH /patients/:id` complete (version guard) · **`PATCH /patients/:id/penjamin`** (upsert by tipe + set primer, single-primary invariant `pasien_penjamin_one_primer_uq`; nomor absen = skip anti-korupsi masked).
3. **Kunjungan API (RJ)** — `kunjunganService`/`kunjunganDal`: `POST /kunjungan` register RJ (wajib `dataLengkap`) · `GET /kunjungan` worklist (unit/status/**patientId** cursor, listInclude≠detailInclude split) · `GET /kunjungan/:id`. Spine `encounter.Kunjungan` = sumbu tunggal. noKunjungan `RJ/2026/NNNNN` sequence atomik.
4. **SEP mock (BPJS RJ)** — `bpjsService`/`bpjsDal`: V-Claim belum di-hit → SEP digenerate lokal (Rujukan+SEP, noSep `{ppk}{yymmdd}V{seq}`) dalam transaksi yang sama; tersimpan DB + cetak A4 (`SepCetak`). Migration `20260602130000_encounter_kunjungan_sequences`.
5. **Lifecycle worklist (state machine)** — `PATCH /kunjungan/:id/status` transisi `checkIn/call/recall/receive/complete/cancel/reopen` (callState/recallCount/selesaiAt immutable), version-guarded 2-lapis (422 ilegal · 409 stale). Board RJ `RJBoardLive`: kunjungan API → kartu, aksi Panggil/Terima/Selesai/Batal/Ulang → transisi server + patch idempoten; kartu seed demo tetap queue mock (ruang id terpisah, nol regresi).
6. **Wiring modal + dashboard** — DaftarKunjunganModal fungsional (`registerKunjungan` + toast + cetak SEP + validasi + guard demo). Riwayat dashboard fetch `GET /kunjungan?patientId` → `dtoToKunjunganRecord` (format mock + `detailPath`), replace idempoten + **guard post-sukses (StrictMode-safe)**. Resolver muat pasien DB **by noRM** (link Beranda/KunjunganHeader). Jaminan: persist BPJS terverifikasi (No.Kartu enc + kelas → primer, jaminan ikut kunjungan terakhir) + tab tampil tipe/No.Kartu masked/kelas/No.SEP. **Modal Ubah Penjamin → 3 jenis** (Umum/Mandiri · BPJS/JKN · Asuransi Lainnya; subtipe PBI/Non-PBI dipertahankan). Backfill data lama dari SEP.

**Infra ditegakkan:** envelope `{ok,data,message,meta}` · `route()` wrapper (auth→RBAC→Zod→handler) · `AppError`/`handleError` · cursor pagination `(createdAt,id)` · optimistic concurrency `version` · soft-delete · PII AES-256-GCM + HMAC blind-index · clock seam injectable · DEV actor (auth belum). `tsc` clean. **Sisa:** board realtime (SSE) · PasienBaru submit→API · IGD/RI unit · nama DPJP (master Dokter) · Invoice draft · Antrean · Auth/RBAC nyata.

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

---

## ✅ Selesai — Tier 2 SNARS (Wave 2)

- **HAM Label IGD ResepTab** — badge `⚠ HAM` merah di setiap item obat HAM + `HAMConfirmModal` double-check wajib (checkbox konfirmasi + daftar obat HAM) intercept sebelum order. 7 obat HAM di-flag di `resepShared.ts` katalog. `HAM_BADGE` shared style. SKP 3 · PMK 72/2016 ✅
- **Isolasi dan PPI Documentation (RI)** — isolasi flag chip (Contact/Droplet/Airborne) di `RIPatientHeader` + inline form (tanggal, alasan, dokter, cabut) · Bundle HAI (VAP 5 item / CAUTI 3 item / CLABSI 4 item) di `KeperawatanTab` kondisional ICU/HCU, toggle per alat terpasang · **checklist per shift** (Pagi 07–14 / Siang 15–21 / Malam 22–06) dengan auto-detect `currentShift()` + manual selector + reset ke otomatis · SummaryCard real-time shift dots P/S/M per bundle · history strip 7-hari (3 squares/hari) + history list grouped-by-date · simpan per perawat·shift · liveChecks reset otomatis setelah simpan (shift berikutnya mulai bersih) · badge "X/3 shift kmrn" di card header. Files: `ppiIsolasi/{ppiIsolasiShared,BundleHAISection}`. Types: `Shift` · `SHIFT_ORDER` · `SHIFT_CFG` · `DailyRecord.shift`. Mock history ri-3 (3 shift/hari, 6 hari). SNARS PPI 1–7 ✅
- **Identifikasi 2 Identitas Sebelum Tindakan (IGD + RI)** — lazy intercept: banner amber muncul saat masuk tab aksi (Tindakan · Resep · Order Lab · Order Rad · Pasien Pulang), bukan saat buka rekam medis. Banner tampilkan 3 identity card (Nama / Tgl Lahir / No RM) dengan staggered animation + checkbox konfirmasi + input nama perawat. Setelah verifikasi: banner collapse smooth → emerald chip "Identitas terverifikasi · [perawat] · [jam]" · konten tab di-blur + `pointer-events:none` sampai terverifikasi · state shared antar tab dalam satu sesi. `RawatInapPatientDetail` ditambah field `tanggalLahir`. Files: `shared/medical-records/IdentitasVerifikasiBanner.tsx` · modifikasi `IGDRecordTabs.tsx` + `RIRecordTabs.tsx`. SKP 1 · JCI IPSG 1 ✅

---

## ✅ Selesai — Rawat Jalan (Poliklinik) — Lengkap 100%

Scope: rekam medis per-kunjungan (13 tab). Route: `app/ehis-care/(fullpage)/rawat-jalan/[id]/`. Mock IDs: `rj-1` · `rj-2`.

- **Fondasi RJ** ✅ — `RJPatientDetail` type + mock data (rj-1, rj-2) + route `/ehis-care/rawat-jalan/[id]` + `RJPatientHeader` + `RJRecordTabs` skeleton (13 tab router, semua shared di-wire)
- **Promote KonsultasiTab → shared** ✅ — pindah `rawat-inap/tabs/KonsultasiTab.tsx` + `rawat-inap/konsultasi/{konsultasiShared,RequestPane,DetailPane}` → `shared/medical-records/`. Update import RI.
- **AsesmenAwalTab RJ** ✅ — adapt dari RI: hanya 3 sub-tab (Anamnesis + Riwayat + Alergi). Tanpa Skrining Gizi + Penilaian Risiko. SNARS AP 1.1
- **SuratDokumenTab** ✅ — baru (shared): Surat Keterangan Sakit · Surat Kontrol · Surat Keterangan Sehat · Resume Medis Kunjungan. 4-card selector + form auto-fill + riwayat expandable + cetak. Sub: `suratDokumen/{suratDokumenShared,SuratFormPane,SuratHistoryPane}`. PMK 269/2008
- **DisposisiRJTab** ✅ — adapt dari IGD: Rujuk Internal (poli tujuan, prioritas Segera/Elektif/Konsultasi) + Rujuk Eksternal (surat rujukan full: jenis pelayanan 4 opsi, jenis rujukan 5 opsi, live preview, tujuan PPK/poli, diagnosa multi-select) + Admisi Rawat Inap (kelas 7 opsi, konfirmasi dokter, pengantar admisi). Tanpa Pulang/APS/Meninggal. File: `rawat-jalan/tabs/DisposisiRJTab.tsx`.

13 tab final: Asesmen Awal · TTV · CPPT · Diagnosa · Pemeriksaan · Konsultasi · IC · Daftar Order · Resep · Lab · Rad · Surat · Disposisi.

---

## ✅ Selesai — Farmasi Worklist + Detail (`/ehis-care/farmasi`) — 4 Layer

**Layer 1 — Halaman Apoteker (cross-patient worklist):** ✅
- `farmasiShared.ts` — Types + config maps + `deriveResepOrders()` + `updateFarmasiWorkflow()` + `workflowStore` + `getOrderById()` + `getPatientInfo()`. Pricing/stock mock (`lookupPrice`, `lookupStock`, `parseSatuan`). `PatientInfoEntry` dengan demographics (usia, jenisKelamin, ruangan, noBed).
- `OrderCard.tsx` — Card per order: HAM badge, status badge, progress bar, action button → Link navigasi ke `/ehis-care/farmasi/[id]`.
- `FarmasiBoard.tsx` — Stat bar + depo tabs + filter + HAM toggle + search + grid + pagination. Modals dihapus — workflow pindah ke halaman detail.

**Layer 2 — Tab Farmasi di rekam medis pasien:** ✅
- `FarmasiTab.tsx` (shared) — Summary cards + order list accordion + catatan apoteker + link ke halaman farmasi. Pakai `deriveResepOrders(noRM)`.
- Wire ke IGDRecordTabs + RIRecordTabs + RJRecordTabs — Tab "Status Farmasi" (icon: Tablets) di grup LAYANAN ketiga modul.

**Layer 3 — Data Bridge (ORDERS_MOCK ↔ Farmasi):** ✅
- Standarisasi tujuan: `"Depo Rawat Inap"` → `"Apotek RI"`, `"Apotek Rawat Jalan"` → `"Apotek RJ"`.
- `updateOrderStatus()` — fungsi mutasi status order di `ORDERS_MOCK`, dipanggil saat apoteker submit telaah/dispensasi → `DaftarOrderTab` pasien ikut terupdate dalam sesi yang sama.
- Single source of truth: `ORDERS_MOCK` adalah satu-satunya sumber. Saat migrasi ke DB, cukup ganti `ORDERS_MOCK` dengan Prisma query — semua UI tidak perlu disentuh.

**Layer 4 — Halaman Detail Order Farmasi (`/ehis-care/farmasi/[id]`):** ✅
- Route fullpage `app/ehis-care/(fullpage)/farmasi/[id]/` layout + page. Server component, `getOrderById(id)`.
- `FarmasiOrderHeader.tsx` — Back button, patient info (nama, RM, usia, gender, ruangan, bed), order info (dokter, depo, tanggal, jam, item count), status badge animated, HAM + prioritas badge, progress strip 4-step.
- `FarmasiOrderTabs.tsx` — Sidebar 2 tab (Layanan Farmasi · CPPT Apoteker) + AnimatePresence content.
- `TelaahPane.tsx` — Two-panel layout: alerts (AllergyBanner + HAM) full width · Left panel `Administratif & Farmasetis` · Right panel `Klinis & Keputusan`. Centang Semua per seksi. Locked view setelah submit.
- `DispensingSerahPane.tsx` — Combined pane: tabel obat + Lot/Batch/Exp/label input → serah terima form (penerima + cara pemberian + edukasi checklist). Footer: total tagihan IDR. Locked setelah selesai.
- `RiwayatResepPane.tsx` — Dedicated 4th sub-tab. Stats strip + `OrderHistCard` expandable per-item detail.
- `DokumenPane.tsx` — Pure cetak dokumen: 4 DocCard (Resep, Kwitansi, Label Obat, Etiket Aturan Pakai) + Cetak Semua.
- CPPT Apoteker — Shared `CPPTTab` dengan `initialEntries=[]` + `showDate=true`.

Alur data: Dokter order resep di `DaftarOrderTab` → `ORDERS_MOCK` → `deriveResepOrders()` → FarmasiBoard overview → klik action → halaman detail → Telaah + Dispensasi + Serah Terima → `workflowStore` + `ORDERS_MOCK` sync → FarmasiTab pasien terupdate. PMK 72/2016 · SKP 3 ✅

---

## ✅ Selesai — Farmasi Gap SNARS / PMK 72/2016 (Tier 1+2+3)

**Tier 1 — Kritis (wajib akreditasi):** ✅
- **MAR (Medication Administration Record)** — `shared/medical-records/MARTab.tsx` + `mar/marShared.ts`. Shift tabs (Pagi/Siang/Malam) + date nav 7 hari. Drug cards per obat aktif dari `resepRI.items` dengan time slot per signa. Input modal: status (Diberikan/Ditunda/Ditolak/TidakTersedia) + waktu + perawat + catatan. HAM double-check: field perawat ke-2 wajib. Tab "MAR" di RIRecordTabs LAYANAN. SNARS PKPO 6 · PMK 72/2016 Ps. 25
- **Register Narkotika & Psikotropika** — `farmasi/narPsi/narPsiShared.ts` + `RegisterNarPsiPane.tsx`. Catalog 5 N + 5 P drugs. Register table + Saldo card per obat + alert stok minimum. Tambah Pengeluaran modal. Stok Opname modal + selisih alert. Cetak Laporan Bulanan. Tab "Register N/P" di FarmasiViewTabs. UU 35/2009 · UU 5/1997 · PMK 3/2015
- **LASA Warning System** — `LASA_PAIRS` + `getLASAPair()` di `farmasiShared.ts`. `isLASA` auto-detect di `deriveItems()`. `LASAConfirmPanel` di TelaahPane. Toggle LASA per item di DispensingSerahPane Step 1. Badge amber di OrderCard + TelaahAkhirItem. PMK 72/2016 Ps. 8 · SKP 3
- **Formularium RS Check + Non-Formularium Justification** — `FORMULARIUM_LIST` + `isFormularium` auto-detect. `FormulariumPanel` di left panel TelaahPane: badge FORM/NON-FORM per item, justifikasi wajib untuk non-formularium (blocks submit). SNARS PKPO 2 · PMK 72/2016 Ps. 5-7
- **TAT Tracking (Waktu Tunggu Pelayanan)** — `OrderTimestamps` + `calcTATMenit()` + `getTATStatus()` + `TAT_TARGET_UNIT`. `TATTimeline` strip di `FarmasiOrderHeader`. `TATChip` di `OrderCard`. Standar: IGD ≤30 mnt · RI ≤60 mnt · RJ ≤30 mnt. SNARS PKPO 6

**Tier 2 — Klinis Penting:** ✅
- **PTO (Pemantauan Terapi Obat)** — `farmasi/pto/ptoShared.ts` + `tabs/PTOPane.tsx`. Two-panel: drug cards + status terbaru / sparkline SVG trend + riwayat observasi + form tambah. Drug-to-parameter template 9 drug class. `calcPTOStatus()` Kritis/Tinggi/Rendah/Normal. SNARS PKPO 7 · PMK 72/2016 Ps. 30–32
- **MESO (Monitoring Efek Samping Obat)** — `farmasi/meso/mesoShared.ts` + `tabs/MESOPane.tsx`. WHO-UMC causality 5 level. Severitas Ringan/Sedang/Berat/Fatal. Outcome + tindakan diambil. Flag dikirim BPOM. PMK 72/2016 Ps. 33
- **DRP (Drug-Related Problems)** — `farmasi/drp/drpShared.ts` + `tabs/DRPPane.tsx`. PCNE V9: 9 problem code (P1–P3), 13 cause code (C1–C5), 6 intervensi code (I0–I3), 4 outcome (O0–O3). PMK 72/2016
- **Konseling Obat Pulang** — `konseling/konselingShared.ts` + `shared/medical-records/KonselingTab.tsx`. Drug checklist + info obat + form penilaian (metode/penerima/pemahaman/durasi/TTD). `getDrugInfo()` lookup 6 drug class. SNARS PP 5 · PMK 72/2016 Ps. 27

**Tier 3 — Operasional:** ✅
- **Pengembalian Obat Pasien Pulang** — `farmasi/pengembalian/pengembalianShared.ts` + `PengembalianPane.tsx`. Two-panel: list item per resep + summary card + panduan prosedur 5-step. Tab "Kembalian Obat" di PasienPulangTab RI. Verifikasi apoteker per record. PMK 72/2016 Ps. 20
- **PIO Log (Pelayanan Informasi Obat)** — `farmasi/pio/pioShared.ts` + `PIOPane.tsx`. 6 mock entries (Dosis, Interaksi, ESO, Farmakokinetik, Ketersediaan). Tab "Pelayanan Informasi Obat" di FarmasiViewTabs. PMK 72/2016 Ps. 27-29

---

## ✅ Selesai — Laboratorium (`/ehis-care/laboratorium`) — Tier 1+2+3

Arsitektur: worklist cross-patient → detail per-order → hasil tampil di `OrderLabTab` pasien. Alur: Dokter order via `OrderLabTab` → `ORDERS_MOCK` → Lab Worklist → proses tiap fase → hasil rilis → `OrderLabTab` pasien terupdate. Standar: ISO 15189:2022 · SNARS AP 5.9/5.11 · PMK 43/2013 · JCI AOP.5.

**Tier 1 — Kritis (Wajib Akreditasi):** ✅
- **`labShared.ts`** — `LabOrder` · `HasilItem` · `SpecimenInfo` · `PenolakanInfo` · `CriticalNotif` · `LabTimestamps` types. Config maps (8 status · 7 kategori · prioritas · unit · flag). `deriveLabOrders()` · `getLabOrderById()` · `updateLabWorkflow()`. `autoFlag()` · `calcTATMenit()` · `getTATStatus()`. 6 mock orders lintas unit.
- **Lab Worklist (`LabBoard.tsx`)** — Stats bar (CITO aktif/Antrian/Proses/Selesai) + Critical value alert banner + Filter unit + status group + CITO toggle + search + Skeleton + Pagination. `LabOrderCard.tsx` dengan TAT chip + progress bar + CITO stripe.
- **Lab Order Detail** — `LabOrderHeader` (TAT timeline 7-step + status progress bar) + `LabOrderTabs` sidebar (4 workflow + 1 dokumen). ISO 15189
- **Penerimaan Order + Verifikasi Identitas** — `PenerimaanPane.tsx`: 3 identity cards + 3-checkbox confirm + petugas input. SKP 1 · ISO 15189
- **Pengambilan + Registrasi Sampel** — `SampelPane.tsx` Step A (jenis tabung/volume/waktu/petugas/lokasi) + Step B (no. registrasi/waktu terima/kondisi). ISO 15189 §5.4
- **Penolakan Sampel** — kondisi dropdown (Hemolisis/Lipemia/Bekuan/dst) → reject flow dengan instruksi pengambilan ulang. ISO 15189 §5.4.5
- **Entry Hasil + Validasi** — `HasilPane.tsx` (input + autoFlag N/H/L/C real-time) + `ValidasiPane.tsx` (review SpPK + 2-checkbox + TTD digital). ISO 15189 §5.5/5.6
- **Critical Value Alert** — `CriticalValueModal` intercept wajib sebelum save, per-test konfirmasi (Telepon/SMS/WA/Langsung + dokter + pelapor + log). SNARS AP 5.9 · ISO 15189 §5.6.2
- **TAT Tracking** — `LabTimestamps` 7 fase + `TATTimeline` strip + `TATChip`. CITO ≤60 mnt · RI/RJ ≤120 mnt. SNARS AP 5.11

**Tier 2 — Klinis Penting:** ✅
- **Trend & Riwayat Hasil** — `trend/trendShared.ts` + `tabs/TrendPane.tsx`. Mini sparkline per parameter + full sparkline + history table. Click-to-select parameter.
- **Delta Check** — `DELTA_THRESHOLDS` (15 parameter). `calcDelta()` + `getPreviousResult()`. Inline amber banner real-time di `HasilPane.tsx`. Badge ⚠ di TrendPane. ISO 15189 §5.6.2
- **Add-on Test** — `tabs/AddOnPane.tsx`. Catalog 30 pemeriksaan. Specimen validity check per jenis tabung (EDTA 4 jam, SST 6 jam, dll).
- **POCT** — `poct/poctShared.ts` + `tabs/POCTPane.tsx`. 10 jenis tes + 7 device config. Auto-flag N/H/L/C real-time. PMK 43/2013 · ISO 15189 §5.7
- **Cetak Hasil Lab** — `PrintPreviewModal` di `RiwayatPane.tsx`. iframe+srcdoc (no document.write). KOP RS + watermark "HASIL RESMI". PMK 269/2008

**Tier 3 — QC & Manajemen:** ✅
- **Internal QC** — `manajemen/InternalQCPane.tsx`. Levey-Jennings SVG chart per parameter (mean ±1/2/3SD color bands). Westgard auto-check (6 rules). Form input run QC baru + WestgardPreview real-time. ISO 15189 §5.6.3
- **Register Pemeriksaan** — `manajemen/RegisterPane.tsx`. Filter 1/7/30 hari + stats cards + horizontal bar chart distribusi + volume sparkline + log tabel harian. PMK 43/2013
- **Manajemen Reagen** — `manajemen/ReagenPane.tsx`. Kartu stok per alat + stock progress bar + alert kritis/kadaluarsa. Form penerimaan reagen. ISO 15189 §5.3.2
- **Kalibrasi Alat** — `manajemen/KalibrasiPane.tsx`. List instrumen + status Valid/Overdue/Segera + log kalibrasi 2 entry. ISO 15189 §5.3.4
- **EQA / PT** — `manajemen/EQAPane.tsx`. Provider list + siklus table (nilai RS vs target, deviasi bar bidirectional + status Lulus/Tidak Lulus/Pending). CAPA banner otomatis. ISO 15189 §5.6.4
- **Laporan Bulanan** — `manajemen/LaporanPane.tsx`. KPI cards + mini bar chart + distribusi unit/kategori + tabel harian. Tombol Cetak. PMK 43/2013

`LabManajemenTabs.tsx` — sidebar 6 tab. `LabPageView.tsx` — view switcher Worklist ↔ QC & Manajemen.

---

## ✅ Selesai — Radiologi (`/ehis-care/radiologi`) — Tier 1+2+3

Arsitektur mengikuti pola Lab. Standar: SNARS AP 6 · PMK 1014/2008 · PMK 24/2020 · Perka BAPETEN No. 2/2018 · JCI AOP.6 · ACR · IAEA HH-19.

**Modalitas:** Konvensional (X-Ray) · USG · CT · MRI · Fluoroskopi · Mammografi · DEXA. **TAT:** CITO ≤60 mnt · Semi-Cito ≤180 mnt · Rutin ≤360 mnt. **9 Status:** Menunggu → Dijadwalkan → Verifikasi → Persiapan → Akuisisi → Expertise → Verifikasi Hasil → Selesai | Ditolak.

**Tier 1 — Kritis:** ✅
- **`radShared.ts`** — types lengkap + config maps (9 status · 7 modalitas · urgensi · DRL values PMK 1014/2008). Helpers + `PROTAP_MAP` per modalitas + `CRITICAL_KATEGORI_LIST` 8 temuan. 5 mock orders.
- **RadBoard + Order Detail** — Stats bar + Critical finding banner + filter + `RadOrderCard` (CITO stripe, TATChip, progress bar). `RadOrderHeader` (8-step TATTimeline) + `RadOrderTabs` (5 workflow + 1 dokumen).
- **Verifikasi Identitas** — `VerifikasiPane.tsx`: 3 identity cards + 3-checkbox confirm + radiografer. SKP 1
- **Persiapan + Kontras** — `PersiapanPane.tsx` + `persiapan/KontrasPanel.tsx`: protap per modalitas + kontras panel (jenis IV/oral/rektal/Gadolinium + dosis + premedikasi + reaksi grading). Kontraindikasi checklist. PMK 24/2020 · ACR
- **Akuisisi + Proteksi Radiasi** — `AkuisisiPane.tsx`: parameter teknis per modalitas + `DRLGauge` (CTDIvol+DLP CT / DAP+waktu Fluoroskopi / entrance dose Konvensional/Mammografi). Auto-alert DRL exceeded + proteksi checklist + ALARA reminder. BAPETEN · IAEA
- **Expertise + Critical Findings** — `EkspertasiPane.tsx`: 5 report fields (Indikasi/Teknik/Temuan/Kesan/Saran). `CriticalFindingModal`: blocking full-screen rose, per-temuan konfirmasi (Telepon/SMS/WA/Langsung + dokter + pelapor + jamLapor + log). Cannot dismiss without confirming all. SNARS AP 6.1 · JCI AOP.6
- **Validasi & Verifikasi Laporan** — `ValidasiPane.tsx`: 2-checkbox + validator. `updateRadWorkflow` → status: "Selesai". SNARS AP 6
- **TAT Tracking** — `RadTimestamps` 8 fase + `TATTimeline` + `TATChip`.

**Tier 2 — Klinis Penting:** ✅
- **Riwayat & Perbandingan** — `tabs/RiwayatRadPane.tsx`. Stats strip + `HistCard` expandable. Current order highlighted teal ring. ACR
- **Cetak Laporan Radiologi** — `PrintPreviewModal` di `RiwayatRadPane.tsx`. iframe-based print: KOP RS + laporan terformat + kolom TTD SpRad + watermark "LAPORAN RESMI". Tersedia hanya jika status "Selesai". PMK 269/2008
- **Image Viewer (Basic DICOM Preview)** — `tabs/ViewerPane.tsx` + `MockImage.tsx`. Grid viewer 1×1/2×2 + CSS window/level presets (Standard/Paru/Mediastinum/Tulang/Otak/Jaringan Lunak) + Zoom ±0.25 + mode anotasi. Upload PNG/JPG/DICOM thumbnail. Watermark "HANYA PREVIEW — BUKAN PENGGANTI DICOM VIEWER". Mock SVG anatomy per modalitas.
- **Alergi Kontras & Premedikasi Tracker** — `tabs/KontrasPane.tsx`. Two-panel: banner peringatan + current order kontras info + history list expandable. `AddReaksiForm`: grade selector + manifestasi chips + onset + tatalaksana + dokter. Protokol premedikasi steroid 3-step auto-muncul. ACR Manual on Contrast Media Ed. 11

**Tier 3 — QC & Manajemen:** ✅
- **QC Pesawat** — `manajemen/QCPane.tsx`. Two-panel: list 5 pesawat per modalitas dengan status Valid/Overdue/Segera + uji kesesuaian expandable per parameter (kolimasi/keluaran/resolusi/HVL/CTDIvol/SNR) + log kalibrasi + form tambah. BAPETEN · IAEA HH-19 §7
- **Register Pemeriksaan** — `manajemen/RegisterPane.tsx`. Filter 1/7/30 hari + stats cards + volume sparkline SVG + horizontal bar chart distribusi modalitas + log tabel harian 14 baris.
- **Log Dosis Radiasi (DRL)** — `manajemen/DosisPane.tsx`. Two-panel + DRLGauge animated + DRLSummary panel + Form Tambah Log dengan DRLPreview real-time. 12 mock entries. Perka BAPETEN · IAEA Safety Reports 39
- **EQA / Phantom Test** — `manajemen/EQAPane.tsx`. 3 program (AAPM CT Phantom · SMPTE USG · ACR MRI). ProgramCard collapsible + SiklusTable + CAPA banner. IAEA · ACR
- **Laporan Bulanan** — `manajemen/LaporanPane.tsx`. KPI 5 cards + mini bar chart 7 hari + distribusi modalitas/unit/urgensi + tabel rekapitulasi DRL.

`RadManajemenTabs.tsx` — sidebar 5 tab. `RadPageView.tsx` view switcher Worklist ↔ QC & Manajemen.

---

## ✅ Selesai — Master Data (`/ehis-master`) — Phase 0–3 Lengkap 100%

**Total:** 30 task lintas 4 phase. 25 sub-master + 8 mapping hub sub-page. Lihat [TODO.md](../TODO.md) untuk detail per-task.

### Phase 0 — Foundation ✅ (7/7)
- Module routes scaffolding
- `masterNav` di `lib/navigation.ts`
- Master Template Layer: `MasterPageLayout` · `MasterListPanel` · `MasterDetailPanel` · `MasterEmptyState` · `MasterTabNav` · `StatCard` · `useSkeletonDelay` · `useMasterCrud` · `FormPrimitives` (Field/TextInput/NumberInput/TextArea/Select/ToggleSwitch/ChipToggle/SectionGroup) · `masterAccent` (8 tone palette purge-safe)
- `MappingSourceBadge` (3 variant: card/banner/inline) untuk cross-link entitas → Mapping Hub

### Phase 1 — Refactor (Strip FHIR) ✅ (6/6)
**Refactor Strip FHIR dari Master (2026-05-19):**
- **Strip FHIR dari Ruangan** — hapus `SyncSection.tsx`, `SYNC_CFG`/`SyncStatus`/`canSyncNode`/`countSyncedAll`, `fhirId`/`syncStatus` dari `OrganizationNode`/`LocationNode`/`BedSubRecord`. Hapus per-bed sync chip + stat card SatuSehat + sync dot indicator. RS root banner di-rephrase: "Profil RS — Read Only". TETAP: `Organization.active` + `Organization.type`.
- **Strip FHIR dari Dokter & Nakes** — hapus `NIKLookupPanel.tsx`, `SatuSehatPractitioner` interface + `SATUSEHAT_PRACTITIONER_DB` + `lookupSatuSehatByNIK()`, `fhirId`/`verifiedAt`. `DokterDetail` di-restruktur: section "Data dari SatuSehat" read-only diganti "Data Profesi" editable. Stat card "Terverifikasi SatuSehat" diganti "Dokter Spesialis".
- **Strip rsConfig.ts** — hapus `fhirId`, `SATUSEHAT_ORG_IDENTIFIER_SYSTEM`, `SATUSEHAT_LOC_IDENTIFIER_SYSTEM`. RS_PROFIL hanya berisi data RS sebagai seed root Organization. Konfigurasi SatuSehat **pindah ke modul `/ehis-fhir`** (belum dibangun).

**Refactor Duplikasi Master vs Mapping Hub (2026-05-22):**
- Shared `MappingSourceBadge` (3 variant card/banner/inline).
- **DokterDetail — hapus Penugasan Poli/Unit** + refactor ke tabs (Profil & Lisensi / Jadwal Praktik). `MappingSourceBadge` card pointer ke SDM Assignment.
- **PenggunaFormModal — hapus Penugasan Unit** + validasi terkait. `MappingSourceBadge` card.

### Phase 2 — 13 Master Baru ✅ (13/13)

**Tier 1 Foundation Master (Resource klinis dasar):**
- **Unit & Ruangan — Unified Tree** ✅ — Organization n-level nested via `parentId`, Bed sebagai sub-collection `LocationNode.beds[]`. Komponen: `RuanganPage` + `TreePanel` 360px + `TreeNode` recursive + `OrganizationForm` 5 section + `LocationForm` + `BedManagerPanel`. Cascading Kemendagri 5 provinsi. RS root readonly.
- **Dokter & Nakes** ✅ — `dokterShared.ts` + 15 kode spesialis + `DokterPage` + `DokterList` + `DokterDetail` (2-tab: Profil & Lisensi / Jadwal Praktik) dengan max-w field cap. 4 mock dokter.
- **Pengguna Sistem** ✅ — `penggunaShared.ts` (9 role, 3 status, 10 unit). Table-based: 3 stat card + toolbar (search + 3 filter dropdown) + table 5 kolom + menu aksi. `PenggunaFormModal` slide-in.

**Kategori A — Skala Klinis ✅** (2026-05-23):
- **Skala Risiko** (teal) — 5 skala: Barthel/Morse/Braden/NRS/MUST. Mahoney 1965 · Morse 1989 · Braden 1987 · BAPEN MUST.
- **Skala Umum** (sky) — 5 skala: GCS/Kesadaran/KU/NEWS2/MEWS. Teasdale 1974 · RCP 2017 · Subbe 2001.
- **Skala Penyakit** (violet) — 5 skala: Killip/NYHA/TIMI/ECOG/Stadium Kanker. AJCC 8th ed. 2017.
- **Triase IGD** (amber) — `TriaseRecord` matrix levels × parameters. 1 protokol default 6 level × 8 parameter (ESI + DOA). Sticky-header matrix + tone swatch picker + inline textarea cells.

Shared layer zero-duplication: 3 master skala struktur data identik → ekstraksi ke `components/master/skala-shared/`. Per-master page jadi thin wrapper ~113 lines.

**Kategori B — Reference Klinis ✅** (2026-05-23):
- **ICD-10 & ICD-9-CM** (sky) — `lib/master/icdMock.ts` ~80 ICD-10 (lintas 22 chapter WHO) + ~30 ICD-9-CM. `IcdItem` dengan `jenis` discriminator + chapter/blok + `inaCbg?` mapping BPJS.
- **Asesmen Katalog** (violet) — 120 entries lintas 11 kategori (Alergi 45 · Penyakit 50 · Sosial 8 · Reproduksi 14). SNOMED CT mapping pada 10 allergen tervalidasi.
- **SDKI/SIKI/SLKI** (rose) — ~30 diagnosa lintas 5 kategori × 3 jenis. Schema lengkap: dataMayor + dataMinor + kriteriaHasil (SLKI) + intervensi (SIKI 4 sub-kategori). 3-tab structure (Identitas + Klinis + Intervensi) + shared `ListEditor`.

Strategi mock representative: 30–120 entry per master dengan schema 1:1 ke target real (saat backend ready swap dengan `prisma.X.findMany()`).

**Kategori C — Template & Enum ✅** (2026-05-23):
- **Status Enum** (violet) — 9 enum group, 50 entries total, 9 tone palette + 30+ icon registry.
- **Template Anamnesis** (teal) — 17 template lintas 3 context (IGD 8 · RI 4 · RJ 5) × 12 kategori keluhan. Placeholder ___ untuk field user.
- **Template Form** (sky) — discriminated union (sbar/ic-risiko/surat/quick-text), 20 mock template. Custom orchestrator multi-collection per jenis.

**Kategori D — Workflow Klinis ✅** (2026-05-24):
- **Discharge Klasifikasi** (emerald) — 5 sub-master shape berbeda: Homecare 10 / Alat Bantu 9 / Checklist 11 / Phase Planning 3 fase × 11 target / Risiko Readmisi rule engine.
- **Operasional Klinis** (slate) — 4 sub-koleksi (77 entries total): Sumber Cairan I/O 31 / Diet & Tekstur 16 / Bundle HAI 12 / Penyakit Isolasi 18. Pattern: sidebar nav + switch-by-key pane.
- **Workflow Edukasi** (amber) — 7 koleksi (57 entries) lintas workflow edukasi: Topik 14 / Media 7 / Metode 5 / Hambatan 8 / Pemahaman 3 / Tanda Bahaya 14 / Tipe Instruksi 6. SNARS PP 5 · PMK 269/2008

**Tier 2 — Katalog Klinis:**
- **Katalog Obat** ✅ — schema full `ObatRecord` 25+ field. 30 mock obat. GOLONGAN_CFG UU 35/2009 + PMK 3/2015. LASA pairs. 4 tabs (Identitas/Klasifikasi/Klinis/Harga). PMK 72/2016 · UU 35/2009 · BPOM HET · Fornas BPJS · PMK 3/2015
- **Katalog Tindakan** ✅ — 35 tindakan ICD-9-CM lintas 11 kategori, 4 level kompleksitas. 2 tab (Identitas / Relasi Default). Source-of-truth untuk Kewenangan Klinis + Layanan Unit + Tarif Matrix. PMK 755
- **Katalog Laboratorium** ✅ — 31 item lintas 4 kategori. 3 tab (Identitas / Nilai Rujukan / Delta & Kritis). ISO 15189:2022 · SNARS AP 5.9 · PMK 43/2013
- **Katalog Radiologi** ✅ — 15 pemeriksaan lintas 7 modalitas (Konvensional/CT/MRI/USG/Fluoroskopi/Mammografi/DEXA). 3 tab (Identitas / Persiapan & DRL / Reporting Template). PMK 1014/2008 · PMK 24/2020 · BAPETEN · IAEA HH-19 · ACR

**Tier 3 — Operasional:**
- **Tarif & Paket Layanan** ✅ — 18 item lintas 7 kategori + 3 paket. Two-panel: Tarif Dasar (2 tab Identitas+Harga) ↔ Paket Layanan (Identitas+Komposisi).
- **Penjamin & Kontrak** ✅ — 7 mock penjamin (BPJS/Umum/Allianz/AXA/Inhealth/Jamkesda/Astra). 40+ kode SMF/Poli BPJS V-Claim. 4-tab (Identitas/Kelas&Coverage/Kontrak/BPJS). Cross-link banner ke Mapping Hub. BPJS V-Claim · PMK 56/2014 · PMK 28/2014

**Tier 4 — Konfigurasi RS:**
- **Profil RS** ✅ — singleton record. 5 seksi via sidebar nav (Identitas/Alamat/Akreditasi/Konfigurasi Shift/KOP Surat). Konfigurasi Shift **unblock** `SHIFT_CFG` di `ppiIsolasiShared.ts` & `marShared.ts`. KOP **unblock** semua `PrintPreviewModal`. PMK 1045/2006 · UU 44/2009

**Tier 5 — Mapping Hub Terpadu ✅ (8 sub-page complete):**
- **MappingHubPage + sidebar shell** — `SUBPAGE_REGISTRY` 8 entri + `MappingHubSidebar` 260px + `ComingSoonPane`. **Density Toggle**: 3 level (Compact/Comfortable default/Cozy) via CSS custom properties + utility classes `.m-mini/.m-tiny/.m-xs/.m-sm/.m-base/.m-lg`. Toggle button top-right header dengan localStorage persist.
- **SDM Assignment** — `AssignmentMap` SDM × Unit. SDM 13 entries (4 dokter + 9 pengguna), unit 18 entries. `UnitListPanel` + `SDMRosterPanel` (tab Bertugas/Tersedia + chip filter kategori + bulk action bar + `BulkMoveModal`).
- **Kewenangan Klinis** — Dokter × Tindakan matrix. PMK 755 credentialing. `KewenanganMatrix` per-dokter view dengan kategori accordion + 3-filter status + bulk actions per-kategori + bulk global "Sesuai Spesialis"/"Hapus Semua".
- **Layanan Unit** — Tindakan × Unit matrix (14 unit). Compact matrix table sticky header & first column. Bulk: klik judul kolom/baris → toggle all. Heatmap visual.
- **Tarif Matrix** — 3D map `[penjamin][tindakan][kelas] → harga`. 6 penjamin × 35 tindakan × 7 kelas = ~1470 cell. Inline-edit + `BulkAdjustModal` (percent stepper + preset chips + warning amber pembulatan).
- **Formularium Penjamin** — `[penjamin][obat][kelas] → { allowed, alasan? }`. Default rules per tipe penjamin (Umum=all/BPJS=formularium-only+no VIP/Asuransi=allow kecuali HAM Kelas_3/Jamkesda=formularium-only+Kelas 2-3+RJ). Cell 3-state (allowed/revoked-with-reason/revoked). PMK 51/2009 · SNARS PKPO 2 · BPJS Fornas
- **Distribusi Obat** — `[depo][obat] → StokCell { stok, min, max }`. 6 depo (Gudang Pusat + Depo IGD/ICU/OK + Apotek RI/RJ). 6-status stock (Habis/Kritis/Rendah/Aman/Penuh/TidakStock). PMK 72/2016 Bab IV
- **Penjamin × Ruangan** — Kode SMF BPJS V-Claim × Ruangan RS. AddForm cascading penjamin → kelas/SMF → ruangan. Sticky-header table inline edit. BPJS V-Claim · PMK 56/2014
- **RBAC (Role × Permission)** — `PERMISSION_TREE` 5 modul × 27 leaf permission × 5 action (read/create/update/delete/export). 9 role default grants realistis. Accordion collapsible per modul + bulk actions. NIST RBAC

**Query-param routing:** `MappingHubPage` baca `?sub=<key>` dari URL untuk deep-link. `useSearchParams` re-sync saat URL berubah, route wrapped Suspense.

### Phase 3 — UX Polish ✅ (4/4)

- **3.1 Beranda Master** ✅ (2026-05-24) — `src/components/master/beranda/` + route `/ehis-master`. Dashboard custom 12-col (bukan `MasterPageLayout`). Hero violet + KPI Strip 5 hero card + Quick-Nav Grid 9 kelompok × 24 nav card + Mapping Coverage Panel (8 mini-meter dengan progress bar tone semantik rose<25%/amber<60%/emerald≥60%) + Recent Edits Panel (8 entri mock dengan timeline rail). Aggregator `getBerandaStats()` consume 20+ mock source. `TONE_PALETTE` 9 tone purge-safe static. 6 file <300L (BerandaMasterPage 133L · berandaShared 286L · KPIStrip 71L · QuickNavGrid 109L · MappingCoveragePanel 111L · RecentEditsPanel 127L).
- **3.2 Banner Default-Flag Katalog Obat** ✅ — `<MappingSourceBadge subpage="formularium" variant="banner" />` di [KlasifikasiTab.tsx:33-50](../src/components/master/katalog-obat/tabs/KlasifikasiTab.tsx#L33-L50). Formularium row dibungkus `sm:col-span-2 flex flex-col gap-2` sehingga banner full 2 kolom grid. Copy: title "Default global — coverage final dikelola di Mapping Hub" + desc + CTA "Atur Coverage". Cegah user mengira flag obat = keputusan final coverage.
- **3.3 Restruktur masterNav** ✅ — di [navigation.ts:168-242](../src/lib/navigation.ts#L168-L242): Katalog Klinis sekarang 6 item (tambah ICD-10 & ICD-9 + SDKI/SIKI/SLKI dari Reference). Reference → Referensi (Indonesian). Sync ke `berandaShared.ts` `getQuickNavGroups()`.
- **3.4 Update CLAUDE.md** ✅ — pointer ke TODO.md di header. Tier 0 Beranda done. Tier 2 ICD done. Tier 2 Banner default-flag done.

---

## ✅ Selesai — Workflow Docs Sterilization (2026-05-24)

- **Splitting CLAUDE.md** menjadi 4 file:
  - [CLAUDE.md](../CLAUDE.md) — lean overview (current state + active work + pointers + key data contracts)
  - [TECH_DEBT.md](../TECH_DEBT.md) — per-modul tech debt registry
  - [TODOS_BACKEND.md](../TODOS_BACKEND.md) — backend implementation roadmap (B0 Foundation → B4 Polish, ~21–28 minggu)
  - [.claude/DONE.md](DONE.md) — completed work archive (file ini)
- Cross-link semua docs satu sama lain di header masing-masing supaya context navigable.

---

## ✅ Selesai — EHIS-Eklaim Foundation EK0.1 Types (2026-05-26)

- **`src/lib/eklaim/eklaimShared.ts`** (572 ln) — single source of truth types untuk modul `/ehis-eklaim`. Pivot iDRG-first (resmi 1 Okt 2025 Kemenkes) + INA-CBG active secondary (industri SIMRS dual support). Field `eraGrouper: "iDRG" | "INA_CBG_Legacy"` routing logic.
- **Money:** `Rupiah = bigint` (bulat rupiah tanpa sen subdivision — sesuai akuntansi RS Indonesia, hindari floating-point drift untuk klaim ratusan juta) · helpers `money.ts` di EK0.3.
- **Result/Error:** `Result<T, E>` discriminated union + `Ok()`/`Err()` constructors · `ClaimError` taxonomy 7 type (NetworkError/AuthError/ValidationError/EligibilityError 5 reason/DuplicateClaimError/GrouperError/ConcurrencyError).
- **Domain enums:** `TipePenjamin` (bpjs/asuransi/jamkesda) · `EraGrouper` · `TipePelayanan` (RI/RJ/SameDay) · `CaraPulang` (Sembuh/PulangAPS/Rujuk/Meninggal) · `Gender` · `KelasRawat` (KRIS default + VIP/K1/K2/K3 legacy + ICU/HCU/Isolasi) · `TingkatKompetensiRS` (dasar/menengah/utama/komprehensif per Perpres 59/2024).
- **`ClaimStatus`** — 13 state granular (+`Susulan Required` distinct dari Rejected, +`Sengketa` nominal sebelum write-off). Transition rules di `stateMachine.ts` EK0.3. `CLAIM_STATUS_LABEL` map terpisah (code stable, label mutable).
- **ICD (Indonesian Modification):** `KodeICD10IM` + `KodeICD9CMIM` — sumber Pedoman Pengodean iDRG 2025 Kemenkes (BUKAN ICD WHO). Flag `hospitalAcquired` untuk CC/MCC PPI (PMK 27/2017).
- **`SEPRecord`** — V-Claim rich struct (noKartu 13-digit, masaBerlaku, kontrolKe, jenisRawat) — match spek V-Claim API.
- **`BerkasKlaim`** — checklist item + `BerkasVersion` append-only (UU PDP 27/2022 integrity) + `BerkasFile` (SHA-256 hash) + `BerkasSumber` discriminated (upload-manual vs auto-pull dengan sumberType+id) + `BerkasKategori` 10 jenis + `BerkasStatus` (+`Reject Verifikator`).
- **Grouper Results:**
  - **`iDRGResult`** (PRIMARY) — kode 7-digit numerik, `mdc`, `iDRGSeverity` (level/label/ccList/mccList per ICS v1), `tarifAktual` + `tarifPerTingkat` (4 tingkat kompetensi RS), `TopUpCmg[]`, `versiGrouper`, `timestampGroup`, `sumberRegulasi: "Pedoman_iDRG_2025_Kemenkes"`.
  - **`InaCbgLegacyResult`** (active secondary) — kode 4-digit alphanumeric, severity 1/2/3, tarif per kelas {kelas3/kelas2/kelas1/vip}, versiGrouper e.g. "INA-CBG_v6.2" / "v5.9".
  - **`iDRGLookupEntry`** — master untuk IDRG_LOOKUP_MOCK (severityLevels 1/2/3 dengan TarifPerTingkat per level + icd10IMList/icd9CMIMList mapping).
- **`ClaimTimelineEntry`** — discriminated union 10 event type (claim-created/coding-changed/berkas-uploaded/berkas-rejected/grouper-resolved/status-transition/submitted-batch/verifikator-comment/banding-submitted/payment-received) — type-safe audit per UU PDP 27/2022 + PMK 269/2008.
- **`BandingRecord`** — 2-tingkat per PMK 26/2021 (tingkat 1 cabang, tingkat 2 pusat) + `BandingStatus` + dokumenPendukung pakai BerkasKlaim type konsisten.
- **`ReconciliationRecord`** — multi-criteria match + `ReconciliationMatch` dengan `matchingConfidence` 0-1 + `matchingReason` audit string + `matchedBy`/`matchedAt` + `SelisihStatus` (Write-off/Refund/Pending).
- **Concurrency:** `OptimisticLock { version, updatedBy, updatedAt }` + `SoftLock { lockedBy, lockedAt, expiresAt }` (TTL 15min default untuk multi-coder edit safety).
- **`Penjamin`** + **`ClaimRecord`** (entity utama, ~35 field) — source of truth di-host di modul ini. Billing read-only via `claimReadCache.getClaimStatusForInvoice()`.
- **`CoderShift`** — scaffold type only (implementasi di EK8.4).
- **Best practices applied:** `interface` untuk object types · `type` untuk unions · `ReadonlyArray` untuk audit collections · discriminated unions dengan literal `type` field · JSDoc minimal explaining WHY (regulasi reference, non-obvious convention) · `// ── Section ──` headers · `npx tsc --noEmit` zero output.
- Verifikasi: `npx tsc --noEmit` clean, 572 lines (under 800 limit).

---

## ✅ Selesai — EHIS-Eklaim Foundation EK0.2 Mock Seed (2026-05-26)

7 file mock data + 1 infra change (~2350 ln total). All `npx tsc --noEmit` clean. **tsconfig target bumped ES2017 → ES2020** untuk support BigInt literals (zero browser regression untuk Next.js 16 + Node 18+).

- **`src/lib/eklaim/icdIMMock.ts`** (400 ln) — `ICD10_IM_MOCK` 30 kode (kardiovaskular/endokrin/obstetri/pernapasan/pencernaan/ginjal/infeksi) + `ICD9_CM_IM_MOCK` 20 kode prosedur (kardio/obstetri/pencernaan/ginjal/ICU/imaging). Versi `ICD-10-IM_2025` & `ICD-9-CM-IM_2025`. Flag `hospitalAcquired` untuk CC/MCC PPI (PMK 27/2017). Helpers `findICD10IM()` & `findICD9CMIM()`.
- **`src/lib/eklaim/iDRGLookupMock.ts`** (486 ln) — `IDRG_LOOKUP_MOCK` 30 entries 7-digit numerik lintas 7 MDC (sirkulasi 8 · endokrin 4 · obstetri 5 · pernapasan 4 · pencernaan 3 · ginjal 3 · infeksi 3). Setiap entry punya 3 severity (Ringan/Sedang/Berat) × 4 tingkat kompetensi RS (dasar/menengah/utama/komprehensif) = 12 tarif. Internal helper `tpt()` factory (multiplier dasar 70% · menengah 85% · utama 100% · komprehensif 120%). Helpers `findIDRG()` & `findIDRGByICD10IM()`. Sumber `Pedoman_iDRG_2025_Kemenkes`.
- **`src/lib/eklaim/inaCbgLegacyMock.ts`** (126 ln) — `INA_CBG_LEGACY_MOCK` 10 entries CBG paling umum (AMI I/II/III · CHF I/II · DM II · Sectio I/II · Persalinan I · Pneumonia I). Format kode 4-digit alphanumeric (e.g. `I-1-01-II`). Tarif per kelas pasien {kelas3/kelas2/kelas1/vip} dengan multiplier 1.0x/1.2x/1.4x/1.6x. Versi `INA-CBG_v5.9` (Permenkes 3/2023). Helper `findInaCbgLegacy()`. Type `InaCbgLegacyLookupEntry = Omit<InaCbgLegacyResult, "timestampGroup">` (timestamp populated saat grouper call, bukan static).
- **`src/lib/eklaim/berkasTemplatesMock.ts`** (284 ln) — 4 templates: `BERKAS_TEMPLATE_BPJS_RI` (11 berkas: SEP + Identitas + Rujukan + Resume Medis + Tindakan + Lab + Rad + Billing + iDRG Grouper + Khusus anestesi/kemo/dialisis) · `BERKAS_TEMPLATE_BPJS_RJ` (8 berkas, tanpa tindakan operasi) · `BERKAS_TEMPLATE_BPJS_IGD` (9 berkas, rujukan optional P1/P2 emergency) · `BERKAS_TEMPLATE_ASURANSI` (8 berkas AAJI + form penjamin per perusahaan + pre-authorization cashless conditional). Type `BerkasTemplate` + helpers `getBerkasTemplate(penjamin, tipePelayanan)` + factory `instansiBerkasFromTemplate(template, claimId)` untuk generate `BerkasKlaim[]` per-claim.
- **`src/lib/eklaim/claimMockFactory.ts`** (297 ln) — internal factory `buildClaim(input: BuildClaimInput)` + 5 helpers (`icd10`/`icd9` lookups · `resolveIDRG` resolves severity & tarif per tingkat · `resolveInaCbg` adds timestamp · `makeSEP` generates SEP dengan masaBerlaku 30-hari · `makeTimeline` append-only events per status). Auto-calculate `selisih`, `batchId`, `noKlaim` (DRAFT prefix jika belum submit), berkas populated dari template dengan status "Siap" jika status !== Draft Coding.
- **`src/lib/eklaim/claimsMock.ts`** (715 ln) — `CLAIM_BOARD_MOCK` 25 happy path ClaimRecord lintas distribusi: penjamin (BPJS 16 · Asuransi 8 · Jamkesda 1) · status (Belum Submit 3 · Pending Verifikasi 5 · Approved 4 · Paid 4 · Draft Coding 2 · Rejected 1 · Susulan Required 1 · Banding Submitted 1 · Banding Approved 1) · era (iDRG 24 · INA-CBG Legacy 1) · kelas (KRIS dominan post-Okt · VIP/K1/K2 untuk legacy + ICU sepsis) · tingkat kompetensi RS (dasar/menengah/utama/komprehensif mix) · unit (RI 17 · RJ 7 · 1 admitted-via-IGD). Helpers `findClaim()` · `findClaimsByStatus()` · `findClaimsByPenjamin()`.
- **`src/lib/eklaim/reconciliationMock.ts`** (150 ln) — `RECONCILIATION_MOCK` 5 transfer batch: BPJS multi-klaim exact match (auto, confidence 1.0) · Mandiri Inhealth cashless single · Prudential reimbursement · BPJS partial paid dengan `selisih: 320_000n` `statusSelisih: "Write-off"` (manual match, confidence 0.85) · BPJS unmatched Pending (transfer baru masuk, empty matchedClaims). Helpers `findReconciliation()` & `findReconciliationsByPenjamin()`.
- **Infra:** `tsconfig.json` `target` bumped `ES2017` → `ES2020` untuk support BigInt literals (`123n` syntax). Zero breaking change — Next.js 16 + Node 18+ sudah modern stack. Lib `["dom", "dom.iterable", "esnext"]` tetap.
- **DEFERRED:** `CLAIM_EDGE_CASES_MOCK` (10 edge cases — pickup saat helper EK0.3 atau adapter EK0.4 butuh test robustness) · `__fixtures__/claimsTestFixtures.ts` (deterministic minimal — pickup saat unit testing helper).
- **Best practices applied:** Factory pattern untuk DRY mock entries · Lookup helper functions (`findX` by code/status/penjamin) · `Omit<>` utility type untuk lookup-vs-result distinction · `ReadonlyArray<T>` everywhere · BigInt literals (`123n`) untuk Rupiah · file split saat exceed 800 ln limit (claimsMock 999 → claimMockFactory 297 + claimsMock 715) · sumber regulasi traceable di setiap mock (Pedoman iDRG 2025 · PMK 26/2021 · PMK 3/2023 · AAJI Standar Klaim).
- Verifikasi: `npx tsc --noEmit` clean, semua file under 800 ln limit (terbesar claimsMock.ts 715 ln).

---

## ✅ Selesai — EHIS-Eklaim Foundation EK0.3 Helpers (2026-05-26)

8 helper file (~1600 ln total) + 1 deferred (`zodSchemas.ts` ke EK0.4 karena depends zod install + adapter shape final). All `npx tsc --noEmit` clean.

- **`src/lib/eklaim/money.ts`** — Rupiah arithmetic & format. `formatRupiah()` (id-ID "Rp 1.250.000") · `formatRupiahShort()` (rb/jt/M untuk KPI card) · `parseRupiah()` (accept "Rp 1.250.000" / "1,250,000" / raw) · `addRupiah/subtractRupiah/multiplyRupiah` (BigInt-safe) · `applyPercent()` (banker's rounding via `(rp * num + denom/2) / denom`) · `eqRupiah/maxRupiah/minRupiah` (comparison). Boundary-only: `rupiahFromNumber()` (throw if float) + `rupiahToDisplayNumber()` (unsafe annotated, DISPLAY ONLY). Spek awal `parseRupiah → sen` di-revise karena `Rupiah = bigint` bulat tanpa sen (sesuai EK0.1 decision).
- **`src/lib/eklaim/stateMachine.ts`** — 13-status state machine. `ALLOWED_TRANSITIONS: Record<ClaimStatus, ReadonlySet<ClaimStatus>>` + `REQUIRED_ROLE: Record<ClaimStatus, ReadonlySet<ClaimActorRole>>` (Coder/TimKlaim/VerifikatorBPJS/Kasir/system). Predicates: `canTransition(from, to, role)` · `isTerminal()` · `allowedNextStatuses()` untuk UI dropdown. Executor: `transitionClaim(claim, input) → Result<ClaimRecord, ClaimError>` (append timeline `status-transition` event + bump `optimisticLock.version` + auto-set `submittedAt/rejectionReason/bandingCount/paidAt` sesuai target). `STATUS_REQUIRE_REASON` Set: Rejected/Susulan Required/Write-off/Sengketa/Banding Rejected. Status terminal: Paid + Write-off.
- **`src/lib/eklaim/softLock.ts`** — Multi-coder concurrency. In-memory `Map<claimId, SoftLock>` REGISTRY (sesuai mock-stage). `acquireSoftLock(claimId, userId, opts)` (re-acquire by same user OK + perpanjang TTL) · `releaseSoftLock()` (no-op kalau bukan owner, idempotent) · `isLockedByOther(claimId, currentUserId)` (UI banner predicate) · `getLockInfo()` (return remaining menit + expiresAt). Maintenance: `purgeExpiredLocks()` + test-only `_resetSoftLockRegistry()`. TTL default 15 menit. Production swap → Redis SETNX TTL zero refactor caller.
- **`src/lib/eklaim/claimCalc.ts`** — Pure aggregates. `totalApproved/totalPaid/totalTarifRS` (sum dengan undefined filter) · `approvalRate()` (exclude in-progress status) · `avgDaysToPaid()` (days dari submittedAt → paidAt, rounded .1) · `agingBucket()` 4-bucket "0-30"/"31-60"/"61-90"/">90" + `bucketByAging()` Record map untuk chart · `cbgMarginPercent()` (renamed dari marginCbg untuk clarity grouper vs RS) + `avgMarginPercent()` · `countByStatus()` untuk filter chip Board · filter predicates `isBelumSubmit/isPendingBPJS/isButuhBanding`.
- **`src/lib/eklaim/berkasChecker.ts`** — Validasi kelengkapan berkas. `checkBerkas(claim) → BerkasCheckResult { ready, missing, optional, progressPercent, items }`. Resolve template via `getBerkasTemplate(penjamin, tipePelayanan)` lalu match instance by (kategori, nama). "Siap" + "Tidak Berlaku" dianggap satisfied. Convenience: `isBerkasReady()` fast predicate (early exit) + `missingBerkasCategories()` ringkas untuk banner.
- **`src/lib/eklaim/eligibilityChecker.ts`** — V-Claim API parity. `checkEligibility({noKartu, tanggalSEP, jnsPelayanan}) → Promise<Result<EligibilityCheckResult, ClaimError>>`. Validation order fail-fast: shape (13-digit numerik) → ISO date format → transient fail simulation → SEP lookup di CLAIM_BOARD_MOCK → masaBerlaku boundary → jnsPelayanan vs SEP.jenisRawat consistency. Options: `transientFailRate` (default 0 deterministic) + `forceResult` test override. Latency 200-500ms match real V-Claim. Production swap → `vClaimAdapter.checkEligibility()` call.
- **`src/lib/eklaim/reconciliationMatcher.ts`** — 3-strategy matching. `matchTransfer(transfer, pool)` order: (1) exact nominal subset 1.0 conf via greedy desc sort, (2) periode+count ±2% 0.9 conf, (3) fuzzy ±5% 0.7 conf, (4) unmatched. Output `MatchResult { matched, unmatched, selisih, recommendedStatus: "AutoMatched" | "NeedsReview" | "Unmatched" }`. `matchBatch()` untuk N transfer dengan exclude-after-match (avoid double-count). `toReconciliationRecord()` bridge ke storage. Filter eligible: status Approved/Sengketa + approvedAmount defined + penjamin tipe + periode submittedAt YYYY-MM match.
- **`src/lib/eklaim/groupingResolver.ts`** — Dual-engine router (AD-19). `resolveGrouping(ctx) → Promise<Result<iDRGResult | InaCbgLegacyResult, ClaimError>>` route by `ctx.eraGrouper`. iDRG path: lookup `findIDRGByICD10IM(primer.kode)` → pick entry matching procedure (fallback first) → severity scorer heuristik (sekunder count + LOS 5/10 threshold + caraPulang Meninggal/kelas ICU + age <=1/>=70) → return dengan tarif per tingkat kompetensi RS. INA-CBG Legacy path: prefix mapping ICD-10-IM letter → CBG group letter (I→I-1, E→I-4, O→O-6, J→J-1, K→K-1, U→U-1) + severity Roman dari LOS. `resolveComparator(ctx)` resolve KEDUA engine paralel untuk EK4 dual preview. Helpers `countIDRGCandidates()` + `hasIDRGMapping()` untuk UI hint. Latency 500-1500ms match real grouper. CC vs MCC split via `hospitalAcquired` flag.
- **DEFERRED:** `zodSchemas.ts` ke EK0.4 — depends on zod install (dependency baru) + adapter shape harus stable dulu sebelum schema runtime validation make sense. Sementara: TypeScript compile-time types + manual shape check di adapter mock.
- **Best practices applied:** `Result<T, E>` discriminated union via `Ok()/Err()` constructors (no throw) · `ReadonlySet`/`ReadonlyArray` untuk immutable contracts · pure functions semua kecuali softLock (intentional in-memory registry) · `// ── Section ──` headers · JSDoc explain WHY non-obvious (regulasi reference + production swap path) · interface match spek V-Claim/iDRG resmi (zero-refactor saat backend ready) · helper extraction untuk readability (e.g. `scoreSeverity`, `findExactSubset`, `buildChecklist`) · test override params (`now`, `forceResult`) untuk deterministic testing.
- Verifikasi: `npx tsc --noEmit` clean, semua file under 800 ln limit (terbesar reconciliationMatcher.ts ~260 ln).

---

## ✅ Selesai — EHIS-Eklaim Foundation EK0.4 Adapter Stubs (2026-05-26)

5 adapter file + 2 refactor (~1200 ln total). All `npx tsc --noEmit` clean. **Architecture pattern:** Adapter (transport layer, raw response shape match spek resmi) ↔ Resolver/Checker (orchestration + raw→domain mapping). Production swap = ganti body adapter function ke real `fetch()` call; caller (resolver/UI) tidak berubah.

- **`src/lib/eklaim/iDRGGrouperAdapter.ts`** (PRIMARY) — Bridge ke INA-Grouper iDRG (Pedoman iDRG 2025 Kemenkes). `groupiDRG(ctx, config) → Promise<Result<iDRGGrouperRawResponse, ClaimError>>` (raw shape `{ status, metadata: { grouperVersion, requestId, timestamp, elapsedMs }, result, error }`) + `toIDRGResult(raw, tingkat) → iDRGResult` mapper. Severity scorer heuristik (sekunder count + LOS + caraPulang + age extreme + kelas ICU). Tarif as bigint string (JSON precision safety). `iDRGGrouperConfig` opts: `failRate` (default 5%) + `fixedLatencyMs`. Latency 500-1500ms match real grouper. Status "ERROR" envelope return Ok (caller decide map ke ClaimError).
- **`src/lib/eklaim/inaCbgLegacyAdapter.ts`** (LEGACY — parked) — E-Klaim Kemenkes desktop file-based integration. `exportToEklaimXml(claim) → string` minimal XML serializer (no XML lib dep, manual escape `<&>"`) + `importGrouperResult(xml) → Result<InaCbgRawResult, ClaimError>` regex parser + `groupInaCbg(ctx, config)` in-memory convenience untuk EK4 Comparator + `toInaCbgLegacyResult(raw) → InaCbgLegacyResult` mapper. Raw shape: `{ cbgCode, groupDescription, severityRoman: "I"/"II"/"III", tarifKelas3/2/1/VIP as string, versiGrouper, generatedAt }`. PARKED — hanya dipakai klaim transisi pre-Okt 2025 + dual-engine Comparator.
- **`src/lib/eklaim/vClaimAdapter.ts`** — BPJS V-Claim REST. 3 methods: `checkSEP(noSEP, config)` · `getEligibility(noKartu, tanggalSEP, jnsPelayanan, config)` · `submitClaim(claim, batchId, config)` semua return `Promise<Result<VClaimEnvelope<T>, ClaimError>>`. Envelope shape match spek: `{ metaData: { code, message }, response? }`. 3 mappers: `toSEPRecord/toEligibilityDomain/toClaimStatus`. Header pattern annotated JSDoc (`X-cons-id` consumer ID · `X-timestamp` Unix epoch · `X-signature` HMAC-SHA256 base64 · `user_key`). LZ-String compression absent di mock (real production decompress di adapter, caller zero-change). Submit distribusi: 60% Pending Verifikasi · 35% Approved · 5% Rejected. `VClaimConfig` opts: `consId/userKey/failRate/fixedLatencyMs/forceResult`.
- **`src/lib/eklaim/vedikaAdapter.ts`** — Verifikasi Digital Klaim BPJS (pull pattern, bukan polling). `pullVerifikatorStatus(batchId, config) → Promise<Result<VedikaBatchResponse, ClaimError>>` filter `CLAIM_BOARD_MOCK` by batchId + generate random per-klaim status. Raw shape per klaim: `{ noKlaim, klaimId, statusVerifikator: BELUM_DIPROSES/DALAM_PROSES/DISETUJUI/DITOLAK/PENDING_BERKAS, tarifDisetujui, alasanReject, daftarBerkasSusulan, verifierNama, verifiedAt }`. Distribusi default: 60% Approved · 25% Pending · 10% Susulan Required · 5% Rejected (overridable via `VedikaConfig.distribution` untuk deterministic test). `statusBatch` derived: QUEUED/PROCESSING/COMPLETED. Mapper `toClaimStatusFromVedika()`.
- **`src/lib/eklaim/apolAdapter.ts`** — STUB PHASE LATER. Interfaces `APOLResepRecord` + `APOLBatchSubmitInput` defined. Methods `submitAPOLBatch/pullAPOLStatus` return `Err({ type: "ValidationError", field: "apol", message: "PHASE_LATER" })` — eksplisit reject (no silent no-op). APOL = Aplikasi Pelayanan Obat Layanan FKTL untuk klaim obat kronis FKTL. Diimplementasi saat EK7 reconciliation obat kronis aktif.
- **Refactor `groupingResolver.ts`** — Sekarang delegate ke `iDRGGrouperAdapter.groupiDRG()` + `inaCbgLegacyAdapter.groupInaCbg()`. Lookup logic + severity scorer extracted ke adapter; resolver tinggal orchestrate + map raw "ERROR" envelope ke `ClaimError` via `toIDRGResult()`/`toInaCbgLegacyResult()`. `resolveComparator()` paralel kedua engine via `Promise.all([..])` + secondary failure attach (tidak block).
- **Refactor `eligibilityChecker.ts`** — Sekarang delegate ke `vClaimAdapter.getEligibility()`. Pakai `toEligibilityDomain()` mapper + business rules tambahan: `mapMetaDataToEligibilityError()` pattern match V-Claim message → typed `EligibilityError.reason` (SEP_EXPIRED/NIK_NOT_FOUND/KELAS_NOT_COVERED) + `resolveFallbackContext()` derive `tingkatKompetensiRS` dari klaim mock (V-Claim tidak return field ini, production resolve dari master RS profile).
- **Best practices applied:** Adapter pattern (transport ↔ orchestration separation) · raw response shape match spek resmi (BPJS V-Claim envelope · iDRG INA-Grouper · VEDIKA distribution) · bigint as string di JSON shapes (avoid precision loss) · header pattern annotated JSDoc untuk production swap reference · config overridable per-call (`failRate`/`fixedLatencyMs`/`forceResult`/`distribution`) untuk deterministic test · explicit PHASE_LATER stub (apol) — no silent no-op · mapper functions exposed (`toX(raw)`) untuk caller reuse · `Promise.all` + `.catch` pattern di Comparator untuk paralel resolve dengan graceful degradation.
- Verifikasi: `npx tsc --noEmit` clean, semua file under 800 ln limit (terbesar vClaimAdapter.ts ~320 ln).

**EK0 Foundation 100% selesai** — 4/4 sub-phase done (Types · Mocks · Helpers · Adapters). Total `src/lib/eklaim/` = 15 file, ~5150 ln. Siap pickup EK1 (Beranda) atau EK2 (Klaim Board) atau EK3 (Klaim Detail) sesuai prioritas business.

---

## ✅ Selesai — EHIS-Eklaim EK1 Beranda (2026-05-26)

Frontend dashboard landing untuk `/ehis-eklaim` — 7 file komponen + 2 file route + nav wiring (~1368 ln total komponen). All `npx tsc --noEmit` clean. Dev server `GET /ehis-eklaim` → HTTP 200 (skeleton 500ms → fade-in client-side hydration). Frontend-design skill diterapkan.

- **Accent teal** dipilih (distinct dari modul lain: care=rose · dashboard=indigo · master=violet · registration=sky · billing=amber · report=emerald). Hindari indigo per preferensi user.
- **Layout 12-kolom** anti long-scroll: kiri (col-7) = QuickNav 2x2 · kanan (col-5) = 3 panel stacked. Fit dalam 1 viewport ~720p+. Skeleton 500ms via `useSkeletonDelay()` (existing helper di master/shared).
- **`src/components/eklaim/beranda/berandaEklaimShared.ts`** (374 ln) — single source: tone palette (`EKLAIM_TONE` 6 tone: teal/amber/rose/emerald/sky/slate) · helper format Rupiah (`fmtRupiahKpi` short suffix · `fmtRupiahFull` thousand sep) · derived stats functions (`getEklaimStats` 5 KPI · `getQuickNavCards` 4 nav · `getButuhBanding` sort hari desc · `getAkanExpired` sort kunjungan desc · `getRecentSubmissions` sort agoSec asc) · `daysUntilDeadlineSubmit()` countdown ke tgl 10 next month · penjamin tipe config · `fmtAgo()` relative time.
- **`KPIStripEklaim.tsx`** (173 ln) — 5 KPI card grid-5 (Klaim Hari Ini teal · Pending Verifikasi amber · Belum Submit rose dengan meter · Approval Rate emerald dengan meter · Total Pembayaran sky). Each card: icon ring + label + value (text-2xl black tabular-nums) + sub + optional meter bar + hover underline bar. Framer stagger 0.04s.
- **`QuickNavGridEklaim.tsx`** (138 ln) — section card 2x2 grid. Per card: icon-bg ring + label + badge mono + desc line-clamp + chevron/lock. Card disabled tampil opacity-70 + border-dashed + lock icon. Hover translate-x chevron.
- **`ButuhBandingPanel.tsx`** (179 ln) — Header icon rose + total potensi rugi. List 5 klaim Rejected/Banding Rejected sort hari desc. Row: pasienId + noKlaim + penjamin badge + hari + selisih chip. Empty state Inbox. Footer link banding (Soon badge).
- **`AkanExpiredPanel.tsx`** (190 ln) — Header amber + total tertahan. List 5 klaim belum-submit sort hari kunjungan desc. Row: badge "{hari}h lalu" rose ≥20h amber otherwise + urgency bar (% dari 30-hari window). Empty state CheckCircle2. Footer link `/ehis-eklaim/klaim?status=belum-submit`.
- **`RecentSubmissionPanel.tsx`** (164 ln) — Header teal + total nominal. List 8 submission terbaru. Row: kind badge (Submitted amber · Approved emerald · Paid teal · Rejected rose) + penjamin badge + pasienId + noKlaim mono + nominal (approvedAmount kalau ada) + agoSec compact.
- **`BerandaEklaimPage.tsx`** (150 ln) — Page shell: hero teal-accent + KPIStrip + 12-col body grid. Skeleton match section heights. Framer `AnimatePresence mode="wait"` skel → page transition 0.2s. Timestamp pill jam (id-ID).
- **Route wiring `src/app/ehis-eklaim/{layout,page}.tsx`** — `ModuleLayout moduleKey="eklaim"` shell + metadata "E-Klaim · Beranda". Plus `src/lib/navigation.ts`: new `ModuleKey "eklaim"`, descriptor (icon ShieldCheck · accent teal), `eklaimNav` (Beranda LayoutGrid · Klaim Board Inbox · iDRG Calculator Scale · Banding FileText · Reconciliation ArrowDownUp), `NAV_MAP.eklaim`. Module switcher otomatis include via MODULES array.
- **Best practices applied:** Skeleton 500ms (no jarring flash) · framer stagger animation (0.04-0.05s delay per item) · density-friendly typography (text-[10px]-[12.5px] hierarchy) · tabular-nums untuk numerik · semantic HTML (header/section/aside/footer/ul/li) · accessibility focus-visible ring · responsive mobile-first (grid-cols-1 → md → lg break) · component file size 138-374 ln (all <800) · single source of truth pattern (shared file) · no indigo per user preference · no bright font in body content · no long scroll (12-col split) · clickable rows via Link href deep-link (UI siap saat klaim detail dibangun).
- Verifikasi: `npx tsc --noEmit` clean, dev server boot 591ms · `curl /ehis-eklaim` HTTP 200, no runtime errors.

---

## ✅ Selesai — EHIS-Eklaim EK1 Beranda V2 Redesign (2026-05-26)

User feedback V1 ("layout tidak optimal · tidak interaktif · scroll panjang"). Total redesign single-viewport interactive dashboard pakai /frontend-design skill. 9 file komponen (~1883 ln · all <800). `npx tsc --noEmit` clean.

**Innovation utama:**
- **Anti-scroll**: 3 panel stacked (V1) → 1 tabbed panel (V2). Eliminates 3x vertical scroll segments.
- **Hero composite card**: Featured stat besar (3-4xl tabular-nums) + SVG sparkline 14-hari animated + trend chip ↑/↓% vs periode lalu + Period segmented control 3-opsi (Hari Ini · 7 Hari · Bulan Ini) dengan `motion.layoutId` smooth indicator + 4 mini KPI 2x2 grid di kolom kanan.
- **Interactive pipeline funnel**: 5-stage horizontal (Draft → Belum Submit → Pending → Approved → Paid) dengan bar fill proportional + click stage → deep-link `/ehis-eklaim/klaim?status=<key>` filter pre-applied.
- **Tabbed activity sidebar**: 3 tab (Banding · Expired · Recent) dengan count badge + active indicator `motion.layoutId` + content `AnimatePresence` slide-fade 0.18s + adaptive footer per tab.

**File changes:**
- **NEW** `HeroSummaryCard.tsx` (290 ln) — Composite featured card 2-col layout. LEFT: featured stat + sparkline SVG + period segmented + CTA button. RIGHT: 4 mini KPI tiles. Subtle gradient bg `from-white via-white to-teal-50/30` + radial blur accent.
- **NEW** `PipelinePanel.tsx` (143 ln) — Horizontal funnel 5-stage clickable. Per stage: tone dot + label + count (text-xl black) + nominal + bar fill animated (delay stagger). Hover translate-y + shadow boost.
- **NEW** `ActivityTabPanel.tsx` (239 ln) — Tabbed sidebar orchestrator. Tab bar: 3 button dengan count badge. `motion.layoutId="activity-tab-active"` indicator. Content area `flex-1 min-h-0 overflow-y-auto` (single scroll). Adaptive footer link per active tab.
- **REWRITE** `QuickNavGridEklaim.tsx` (137 ln) — Compact 4-col grid (sm:2 / lg:4). Per card: icon ring with hover rotate-3 + scale-110, count badge mono, 1-line desc truncate, bottom bar animation. Lebih dense + interactive.
- **REWRITE** `BerandaEklaimPage.tsx` (144 ln) — New layout 4-section vertical: HeroBar slim (1-line) · HeroSummaryCard · PipelinePanel · MainGrid (col-7 QuickNav + col-5 ActivityTabPanel). Target ~640px fit 720p.
- **REWRITE** `ButuhBandingPanel.tsx` (86 ln) · `AkanExpiredPanel.tsx` (107 ln) · `RecentSubmissionPanel.tsx` (101 ln) — Strip outer card + header + footer. Return flat list saja (now content untuk ActivityTabPanel tabs). Empty state inline tetap.
- **EXTEND** `berandaEklaimShared.ts` (374 → 636 ln) — `PipelineStage` type + `getPipelineStages()` builder (5-stage Draft/Belum Submit/Pending/Approved/Paid · status mapping ke ClaimStatus[]) · `SparklineDatum` + `getSparkline14d()` last-14-day createdAt groupBy + `buildSparklinePath()` SVG path constructor (M/L commands + area close) · `Period` type + `PERIOD_OPTIONS` + `calcTrend(period)` window comparator (current vs previous same-length window) + `periodRanges()` helper · `MiniKpi` type + `getMiniKpis()` 4-tile builder dari EklaimStats.
- **DELETED** `KPIStripEklaim.tsx` — superseded by HeroSummaryCard mini KPIs.

**Design tokens applied (frontend-design skill):**
- **Visual hierarchy**: Featured stat 3-4xl `font-black tracking-tight tabular-nums` → 4 mini KPI text-lg → support meta 10-11px
- **Color discipline**: teal primary (E-Klaim accent) · 5 tone variations untuk pipeline + activity tabs · slate base · no indigo · no bright colors di body content (slate-500 untuk meta, slate-800 untuk title)
- **Micro-interactions**: SVG path-draw 0.7s easeOut (sparkline) · scale-spring on tab indicator (stiffness 380 damping 30) · stagger reveal 0.04-0.05s per item · hover rotate-3 + scale-110 icon · chevron translate-x · border-bottom bar grow
- **Accessibility**: role="tab"/"tablist" + aria-selected · focus-visible ring-2 ring-slate-300 ring-offset · button vs Link semantic · aria-label deskriptif (sparkline + stage click)
- **Spacing scale**: base-4 (gap-1 / gap-1.5 / gap-2 / gap-3 / gap-4) · padding p-2.5 / p-3 / p-4 / p-5 (responsive)
- **Surface**: rounded-xl border-slate-200 bg-white shadow-sm — konsisten semua card · gradient hero only · hover -translate-y-0.5 + shadow-md

**Verifikasi:** `npx tsc --noEmit` clean. File sizes 86-636 ln (all <800 limit). 9 file total ~1883 ln di `src/components/eklaim/beranda/`. Pattern berbeda dari Beranda Billing/Master (lebih interactive + featured-card-driven instead of KPI-strip-driven).
