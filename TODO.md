# EHIS Master — Phase Roadmap

> **Source of truth untuk konsolidasi master data EHIS.**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
> Konteks proyek & convention: lihat [CLAUDE.md](CLAUDE.md). Skill design: `.claude/skills/frontend-design`.
>
> **Last updated:** 2026-05-23
> **Estimasi total:** ~6 minggu (Phase 0–3)
> **Status global:** Phase 0 — Foundation (belum dimulai)

---

## 📌 Konteks Singkat

Analisis lintas modul (IGD + RI + RJ + Farmasi/Lab/Rad) menemukan **~50 konstanta hardcoded** dengan banyak duplikasi lintas file. Strategi konsolidasi:

1. **Phase 0** — Bangun Master Template Layer (foundation reusable component) — supaya tambah master baru jadi ~1 hari/master
2. **Phase 1** — Refactor wiring: component klinis consume master existing (hapus ~200 lines hardcoded)
3. **Phase 2** — Bangun 13 halaman master baru dengan template layer
4. **Phase 3** — UX polish (Beranda Master + badge)

Prinsip: **"satu pintu master"** — semua data referensi klinis di `/ehis-master`, di-konsumsi via prop oleh component klinis. No hardcoded constants in workflow.

---

## Phase 0 — Foundation: Master Template Layer

**Effort:** 2-3 hari · **ROI:** time saver semua phase berikutnya

### 0.1 Buat shared layer `src/components/master/shared/` ✅ Selesai (2026-05-23)

- [x] **`masterAccent.ts`** ✅ — accent token system. 8 accent (rose/sky/teal/violet/emerald/amber/slate/pink) × `AccentClasses` (bgSolid/softBg/borderIdle/ringFocus/textAccent/dot/activeBg/...). Plus static maps purge-safe: `SEARCH_FOCUS_WITHIN`, `ADD_CTA_HOVER`, `ADD_CTA_BORDER`, `EMPTY_GRADIENT`, `EMPTY_ICON_RING`. Helper `getAccent(accent)`.
- [x] **`MasterPageLayout.tsx`** ✅ — orchestrator: skeleton 500ms + AnimatePresence transition + header (eyebrow + title + description + stats slot) + 2-panel container responsive (lg:flex-row). Sub-component `StatCard` dengan 8 tone (`StatTone`). 206 lines.
- [x] **`MasterListPanel.tsx`** ✅ — search input + filter toggle + collapsible filter slot + add CTA dashed + scroll body + empty state + footer slot. Width default `w-[340px]` configurable. Rows tetap rendered by page (slot via children). 215 lines.
- [x] **`MasterDetailPanel.tsx`** ✅ — header dengan animated bg (isNew = emerald), `headerContent` slot, action buttons (delete ghost/cancel/save dengan dirty+valid gating), optional tab nav via `MasterTabNav`, content slot wrapped AnimatePresence. Generic atas tab key `K extends string`. 173 lines.
- [x] **`MasterEmptyState.tsx`** ✅ — gradient bg per accent (`EMPTY_GRADIENT`) + ring icon (`EMPTY_ICON_RING`) + animated icon (rotate-in) + title/desc + count chip + add CTA. 116 lines.
- [x] **`MasterTabNav.tsx`** ✅ — tab list horizontal dengan `MasterTab<K>` (key/label/icon/accentText opsional/disabled). `renderBadge` render prop untuk completeness/status badge. Active state border bawah putih + accent text. 99 lines.
- [x] **`FormPrimitives.tsx`** ✅ — semua 8 primitives accept `accent` prop. Field/TextInput (maxW default 420px)/NumberInput (suffix support, maxW 180px)/TextArea (monospace toggle)/Select (SVG chevron, maxW 260px)/ToggleSwitch (track on color per accent)/ChipToggle (5 active variants + sm/md size)/SectionGroup (icon + action + accent header). Static maps: `FOCUS_BY_ACCENT`, `TOGGLE_TRACK_ON`, `CHIP_ACTIVE_BY_ACCENT`. 395 lines.
- [x] **`useMasterCrud.ts`** ✅ — generic hook `<T extends { id: string }>`. State: items/setItems/selectedId/selected/draft/isNew/isDirty + handlers (handleSelect/handleAddNew/handlePatch/handleSave/handleCancel/handleDelete/reset). `structuredClone` untuk draft isolation. Configurable `isDirtyEqual` + `confirmDirty`. Plus bonus `useSkeletonDelay(ms)` helper. 211 lines.
- [x] **`index.ts`** ✅ — barrel export: layout components + form primitives + hooks + accent system + MappingSourceBadge (existing). 54 lines.

**Acceptance:** ✅ Bisa import `<MasterPageLayout>` + `useMasterCrud()` dari `@/components/master/shared` dan compose halaman master baru dengan ~80 lines orchestrator + 3-5 tab files. Total 9 file (1946 lines), terbesar 395 lines (FormPrimitives), jauh di bawah 800 limit. TypeScript clean.

### 0.2 Refactor 4 katalog existing ke template layer

- [ ] **Katalog Obat** — replace `KatalogObatPage` orchestrator + local FormPrimitives → pakai shared
- [ ] **Katalog Tindakan** — sama
- [ ] **Katalog Laboratorium** — sama
- [ ] **Katalog Radiologi** — sama (yang baru dibuat, paling fresh, paling mudah)

**Acceptance:** 4 katalog masih jalan persis sama, tapi code 30-40% lebih ringkas. Tidak ada regresi visual.

---

## Phase 1 — Refactor Wiring (consume master existing)

**Effort:** ~1 minggu · **ROI:** -200 lines hardcoded, satu sumber kebenaran

- [ ] **R1: IGD `TindakanTab` → Katalog Tindakan** — replace [TindakanTab.tsx:32](src/components/igd/tabs/TindakanTab.tsx#L32) `CATALOG` (25 item ICD-9-CM hardcoded) dengan `TINDAKAN_MOCK` dari `lib/master/tindakanMock.ts`
- [ ] **R2: OrderLabTab → Katalog Lab** — replace [OrderLabTab.tsx:82](src/components/shared/medical-records/OrderLabTab.tsx#L82) `LAB_CATALOG` (~50 item) dengan `LAB_KATALOG_MOCK` dari `lib/master/labCatalogMock.ts`. Dipakai IGD + RI + RJ via shared.
- [ ] **R3: OrderRadTab → Katalog Radiologi** — replace [OrderRadTab.tsx:89](src/components/shared/medical-records/OrderRadTab.tsx#L89) `RAD_CATALOG` (~60 item) dengan `RAD_KATALOG_MOCK` dari `lib/master/radCatalogMock.ts`. Dipakai IGD + RI + RJ via shared.
- [ ] **R4: Shift configs unify → Profil RS** — 7 file punya duplicate SHIFT_CFG/SHIFT_CLS:
  - [ ] `rawat-inap/tabs/handover/handoverShared.ts:6`
  - [ ] `rawat-inap/ppiIsolasi/ppiIsolasiShared.ts:11`
  - [ ] `shared/medical-records/TTVTab.tsx:204`
  - [ ] `rawat-inap/tabs/intakeOutput/ioShared.ts:9`
  - [ ] `shared/medical-records/mar/marShared.ts:7`
  - [ ] `shared/medical-records/keperawatan/AsuhanCard.tsx:16`
  - [ ] `shared/medical-records/keperawatanShared.ts`
  - Single source: `lib/master/rsProfilStore.ts` → `RS_PROFIL.shift`
- [ ] **R5: SMF → Master Dokter Spesialis** — replace [konsultasiShared.ts:42](src/components/shared/medical-records/konsultasi/konsultasiShared.ts#L42) `SMF_LIST` (23 SMF) — derive dari `SPESIALIS_LABEL` di `dokterShared.ts` + tambah subkategori bedah jika perlu
- [ ] **R6: RUTE_OBAT unify → Katalog Obat** — 3 duplicate:
  - [ ] `shared/asesmen/asesmenShared.ts:176`
  - [ ] `igd/tabs/AsesmenMedisTab.tsx:549`
  - [ ] `katalog-obat/katalogObatShared.ts` `RutePemberian` type
  - Single source: tipe `RutePemberian` di katalog-obat

**Acceptance:** Workflow lab/rad/tindakan masih jalan sama, tapi data diambil dari master. Shift labels seragam lintas 7 file.

---

## Phase 2 — Bangun 13 Master Baru

**Effort:** 3-4 minggu (asumsi 1 master/hari dengan template) · **Output:** 13 halaman master baru

### Kategori A — Klinis Penilaian (4 master, prioritas tinggi)

#### 2.1 Master Skala Risiko — `/ehis-master/skala-risiko`
**Konsumen:** IGD `PenilaianTab` · RI `PenilaianRisikoPane` · RJ skrining

- [ ] Schema `lib/master/skalaRisikoMock.ts`: `SkalaRisikoRecord` dengan items (label + scoring options + maxScore) + interpretasi (threshold + action)
- [ ] 5 skala mock:
  - [ ] **Barthel Index** (ADL) — 10 items, 5-tier interpretasi
  - [ ] **Morse Fall Scale** (risiko jatuh) — 6 items, 3-tier
  - [ ] **Braden Scale** (risiko dekubitus, inverse) — 6 items, 5-tier
  - [ ] **NRS Pain Scale** (0–10) — 11 level labels
  - [ ] **MUST** (skrining gizi) — 3 pertanyaan, 3-tier
- [ ] Components: `KatalogSkalaRisikoPage.tsx` + `SkalaRisikoList.tsx` + `SkalaRisikoDetail.tsx` + tabs (Identitas/Items/Interpretasi)
- [ ] Sumber hardcoded yang di-replace:
  - [ ] `rawat-inap/asesmenAwal/asesmenAwalShared.ts:62-142`
  - [ ] `igd/tabs/PenilaianTab.tsx:481-665` (Morse/Braden/Barthel duplicate)

#### 2.2 Master Skala Umum — `/ehis-master/skala-umum`
**Konsumen:** TTVTab (semua modul) · StatusFisikPane · IGD Triase preview

- [ ] Schema: similar Skala Risiko tapi lebih sederhana (kategori label + threshold)
- [ ] 5 skala mock:
  - [ ] **GCS** (Glasgow Coma Scale) — Eye/Verbal/Motor + total interpretasi
  - [ ] **Tingkat Kesadaran Klinis** — Compos Mentis/Apatis/Delirium/Somnolen/Sopor/Koma (6 level)
  - [ ] **Keadaan Umum (KU)** — Baik/Sedang/Berat/Kritis (4 level)
  - [ ] **NEWS2** — National Early Warning Score 2 (param: RR/SpO2/Suhu/TD/HR/Kesadaran)
  - [ ] **MEWS** — Modified Early Warning Score
- [ ] Sumber hardcoded:
  - [ ] `shared/medical-records/TTVTab.tsx:175-183`
  - [ ] `rawat-inap/tabs/pemeriksaan/StatusFisikPane.tsx:14-16`

#### 2.3 Master Skala Penyakit — `/ehis-master/skala-penyakit`
**Konsumen:** IGD `PenilaianTab` JantungPanel + OnkoPanel

- [ ] Schema dengan sub-kategori per spesialisasi (Kardio · Onko · Neuro · etc)
- [ ] Skala mock:
  - [ ] **Kardiologi:** Killip Class (I-IV) + NYHA (I-IV) + TIMI Score (7 items)
  - [ ] **Onkologi:** ECOG Performance Status (0-5) + TNM Staging (T0-T4 / N0-N3 / M0-M1) + Stadium (0-IV) + Histologi opts + Lateralitas + Grade
  - [ ] **Lainnya** (placeholder untuk skala specialty lain — Neuro mRS, Endo HbA1c target, dll)
- [ ] Sumber hardcoded:
  - [ ] `igd/tabs/PenilaianTab.tsx:685-707` (kardio)
  - [ ] `igd/tabs/PenilaianTab.tsx:933-946` (onko)

#### 2.4 Master Triase IGD — `/ehis-master/triase-igd`
**Konsumen:** IGD `TriaseTab` + `TriaseModal` · IGD Board urgensi indicator

- [ ] Schema: `TriaseLevel` (5-6 level: Resusitasi/Emergency/Urgent/Less Urgent/Non Urgent/DOA) + matrix criteria per parameter
- [ ] Mock content:
  - [ ] 6 level dengan warna + waktu respons (Segera/<10mnt/<30mnt/<60mnt/<120mnt/Verifikasi)
  - [ ] 8 parameter kriteria: Airway · Breathing/RR · Sirkulasi/TD · Nadi · Kesadaran/GCS · Skala Nyeri VAS · Waktu Respons · Contoh Kasus
- [ ] UI: Matrix table (parameter × level) inline editable, atau two-panel: kiri level list + kanan kriteria editor per level
- [ ] Sumber: [TriaseTab.tsx:178-208](src/components/igd/tabs/TriaseTab.tsx#L178)

### Kategori B — Reference Klinis (3 master)

#### 2.5 Master ICD-10 & ICD-9 — `/ehis-master/icd`
**Konsumen:** DiagnosaTab (semua modul) · Resume Medik · INA-CBG mapping

- [ ] Schema: `IcdRecord` dengan kode (canonical) + nama (ID/EN) + chapter + blok + parent kode + status active
- [ ] Import dataset CSV/Excel resmi WHO/Kemkes (~15.000 ICD-10 + ~4.000 ICD-9-CM)
- [ ] UI: search engine dengan filter chapter/blok + tree view chapter expand · pagination · status toggle
- [ ] Special: INA-CBG mapping preview (link ke `INA_CBG_MAP` existing)
- [ ] Sumber: [diagnosaShared.ts](src/components/shared/medical-records/diagnosaShared.ts) `ICD10_CATALOG` (30 hardcoded, butuh 15.000+)
- [ ] **Catatan dataset:** butuh konfirmasi user — sumber file CSV mana yang dipakai (Kemkes-style atau WHO-style)

#### 2.6 Master Asesmen Katalog — `/ehis-master/asesmen-katalog`
**Konsumen:** AllergyPane · RiwayatPane · AsesmenMedisTab (shared+IGD)

- [ ] **Sub-tab Alergi:**
  - [ ] Allergen library dengan kategori (Obat/Makanan/Lainnya) + SNOMED code mapping
  - [ ] Quick picks per kategori (default penicillin/aspirin/peanut/lateks/dll)
  - [ ] Reactions library (10+ jenis reaksi)
  - [ ] Severity config (Ringan/Sedang/Berat)
- [ ] **Sub-tab Penyakit:**
  - [ ] Penyakit Dahulu (20+ items)
  - [ ] Penyakit Beresiko (12+)
  - [ ] Penyakit Keluarga (10+)
  - [ ] Perilaku Beresiko (8+)
- [ ] **Sub-tab Obstetri & Reproduksi:**
  - [ ] Metode KB (9 opsi)
  - [ ] Jenis Persalinan (5 opsi)
- [ ] **Sub-tab Anggota Keluarga:** Suami/Istri/Anak/Ortu/Saudara/Kakek-Nenek per garis
- [ ] Sumber: [asesmenShared.ts:88-188](src/components/shared/asesmen/asesmenShared.ts#L88) (sudah dedup) + IGD AsesmenMedisTab local duplicate

#### 2.7 Master SDKI/SIKI/SLKI — `/ehis-master/sdki`
**Konsumen:** KeperawatanTab RI

- [ ] Schema: `SdkiRecord` dengan kode (D.NNNN) + nama + penyebab umum + kriteriaHasil[] (SLKI) + intervensi (observasi/terapeutik/edukasi/kolaborasi, SIKI)
- [ ] Dataset PPNI 200+ diagnosa keperawatan resmi
- [ ] UI: search + filter per kategori SDKI (Fisiologis/Psikologis/Perilaku/Relasional/Lingkungan) + detail view dengan 4 kolom intervensi
- [ ] **Catatan dataset:** butuh PPNI SDKI/SIKI/SLKI book reference (PDF/CSV) atau procurement license
- [ ] Sumber: [keperawatanShared.ts:77](src/components/shared/medical-records/keperawatanShared.ts#L77) `SDKI_CATALOG` (15 hardcoded)

### Kategori C — Template & Enum (3 master)

#### 2.8 Master Status Enum — `/ehis-master/status-enum`
**Konsumen:** semua modul · 1 page multi-tab untuk enum kecil

- [ ] 9 sub-tab:
  - [ ] **Status Pulang** (Sembuh/Membaik/Rawat Inap/Dirujuk/APS/Meninggal/Belum Sembuh) — unify IGD + RI
  - [ ] **Kondisi Umum** (Baik/Sedang/Buruk/Kritis)
  - [ ] **Tingkat Kesadaran** (6 level — share dengan Skala Umum?)
  - [ ] **Kondisi Transfer** (Stabil/Tidak Stabil/Kritis)
  - [ ] **Mode Transport** (Brankar/Kursi Roda/Jalan Kaki/Ambulance Internal/Ambulance Eksternal)
  - [ ] **Kelas Perawatan** (replace `RIKelas` hardcoded enum)
  - [ ] **Hubungan Keluarga / Caregiver** (Suami/Istri/Anak/Ortu/Saudara/Wali/Lainnya)
  - [ ] **Profesi Edukator** (Perawat/Dokter/Apoteker/Ahli Gizi/Fisioterapis/Psikolog)
  - [ ] **Rute Pemberian Obat** (Oral/IV/IM/SC/Sublingual/Topikal/Inhalasi/Rektal/Per Nasal/Per NGT)
- [ ] Sumber: [pasienPulangShared.tsx (IGD):35](src/components/igd/tabs/pasienPulang/pasienPulangShared.tsx#L35) · [dischargeShared.ts:1-30](src/components/rawat-inap/discharge/dischargeShared.ts) · [pasienPulangShared.ts (RI):187](src/components/rawat-inap/pasienPulang/pasienPulangShared.ts#L187) · `data.ts` RIKelas type

#### 2.9 Master Template Anamnesis — `/ehis-master/template-anamnesis`
**Konsumen:** AnamnesisPane (IGD+RI+RJ)

- [ ] Schema: `AnamnesisTemplate` dengan id + label + context_tags ["IGD","RI","RJ"] + keluhanUtama + rps + onsetDurasi + faktorPemberat + faktorPemerut + statusGeneralis
- [ ] Mock templates:
  - [ ] **IGD:** Sesak (GJK) · Demam (Sepsis) · Stroke · Nyeri Dada · Kejang · Trauma · Syok
  - [ ] **RI:** Long-form admission GJK · Pneumonia · ACS · DM Komplikasi
  - [ ] **RJ:** ISPA · Nyeri Dada · Kontrol DM · Kontrol Hipertensi · Lanjutan PCT
- [ ] UI: search + filter chip per context (IGD/RI/RJ) + filter per chief complaint
- [ ] Sumber: [asesmenAwalShared.ts:151](src/components/rawat-inap/asesmenAwal/asesmenAwalShared.ts#L151) · [AsesmenMedisTab.tsx:204](src/components/igd/tabs/AsesmenMedisTab.tsx#L204) `IGD_TEMPLATES` · [asesmenAwalRJShared.ts:18](src/components/rawat-jalan/asesmenAwal/asesmenAwalRJShared.ts#L18)

#### 2.10 Master Template Form — `/ehis-master/template-form`
**Konsumen:** HandoverTab · KonsultasiTab · InformedConsentTab · PasienPulang · CPPT

- [ ] 4 sub-tab:
  - [ ] **SBAR Template** — context (handover/konsultasi/transfer IGD→RI), 4 section (S/B/A/R) dengan deskripsi tiap section
  - [ ] **Informed Consent Risiko** — risiko library per Tindakan (link ke Katalog Tindakan) + risiko umum default
  - [ ] **Surat Pulang** — 5 jenis (Kontrol/Sakit/Dirawat/Rujukan Balik/Kematian) — body template dengan placeholder
  - [ ] **CPPT Quick-text** — smart phrases "/normal-thorax", "/normal-abdomen" yang auto-expand
- [ ] Sumber: [handoverShared.ts:47](src/components/rawat-inap/tabs/handover/handoverShared.ts#L47) + IGD SBARTransferPanel + RI konsultasiShared · [InformedConsentTab.tsx:104](src/components/shared/medical-records/InformedConsentTab.tsx#L104) `RISIKO_UMUM` · [pasienPulangShared.ts:199](src/components/rawat-inap/pasienPulang/pasienPulangShared.ts#L199) `SURAT_TEMPLATE`

### Kategori D — Workflow & Operasional (3 master)

#### 2.11 Master Workflow Edukasi — `/ehis-master/workflow-edukasi`
**Konsumen:** EdukasiPane (IGD + RI Discharge)

- [ ] 7 sub-tab:
  - [ ] **Topik Edukasi** + kategori (Medis/Farmasi/Nutrisi/Rehabilitasi/Keperawatan/Administratif/Preventif)
  - [ ] **Media Edukasi** (Verbal/Leaflet/Booklet/Demo/Video/Poster/Aplikasi Digital)
  - [ ] **Metode Edukasi** (Ceramah/Diskusi/Demo/Simulasi/Tanya Jawab)
  - [ ] **Hambatan Komunikasi** (8 jenis)
  - [ ] **Tingkat Pemahaman** (Paham/Perlu Ulang/Tidak Paham)
  - [ ] **Tanda Bahaya** per kondisi (untuk discharge education)
  - [ ] **Tipe Instruksi Pulang**
- [ ] Sumber: [EdukasiPane.tsx (IGD):146-189](src/components/igd/tabs/EdukasiPane.tsx#L146) · [dischargeShared.ts:196](src/components/rawat-inap/discharge/dischargeShared.ts#L196) duplicate

#### 2.12 Master Discharge Klasifikasi — `/ehis-master/discharge`
**Konsumen:** RI DischargePlanTab + PasienPulangTab

- [ ] 5 sub-tab:
  - [ ] **Homecare Services** (8+ jenis)
  - [ ] **Alat Bantu Pulang** (8+ jenis)
  - [ ] **Discharge Checklist Template** (10+ items, required toggle)
  - [ ] **Phase Discharge Planning** (Hari 1-2 MRS / Sepanjang Rawat / H-1 Pulang)
  - [ ] **Risiko Readmisi Config** (RENDAH/SEDANG/TINGGI rules)
- [ ] Sumber: [dischargeShared.ts:170-246](src/components/rawat-inap/discharge/dischargeShared.ts#L170)

#### 2.13 Master Operasional Klinis — `/ehis-master/operasional`
**Konsumen:** IntakeOutputTab · GiziNutrisiTab · PPI Isolasi

- [ ] 4 sub-tab:
  - [ ] **Sumber Cairan & Output:**
    - Intake: Oral · IV (NaCl/RL/D5/D10/Albumin/Norepi/Dobutamin/Antibiotik) · NGT (Formula/Air/Obat) · Transfusi (PRC/FFP/TC/Whole Blood)
    - Output: Urine · Drainase (NGT/WSD/Drain Bedah/CVC) · Feses · Muntah · Perdarahan
  - [ ] **Tipe Diet & Tekstur** — 12 diet + 4 tekstur (biasa/lunak/saring/cair)
  - [ ] **Bundle HAI Items:**
    - VAP Bundle (5 items)
    - CAUTI Bundle (3 items)
    - CLABSI Bundle (4 items)
  - [ ] **Penyakit Wajib Isolasi:**
    - Contact (MRSA/VRE/C.diff/Luka Terbuka)
    - Droplet (Influenza/Meningitis/Pertussis)
    - Airborne (TB Paru/Campak/Aerosol COVID-19)
- [ ] Sumber: [ioShared.ts:42-112](src/components/rawat-inap/tabs/intakeOutput/ioShared.ts#L42) · [giziNutrisiShared.ts:50-70](src/components/rawat-inap/tabs/giziNutrisi/giziNutrisiShared.ts#L50) · [ppiIsolasiShared.ts:35-135](src/components/rawat-inap/ppiIsolasi/ppiIsolasiShared.ts#L35)

---

## Phase 3 — UX Polish

**Effort:** ~1 minggu

### 3.1 Beranda Master — `/ehis-master`
- [ ] Replace placeholder violet box di [app/ehis-master/page.tsx](src/app/ehis-master/page.tsx)
- [ ] Stats cards: total unit/dokter/obat/tindakan/lab/rad/skala/template
- [ ] Quick-nav grid (~19 sub-modul setelah Phase 2 selesai)
- [ ] **Mapping Coverage tile** — % cell terisi per matriks Mapping Hub (Tarif/Formularium/Distribusi/Kewenangan)
- [ ] Recent-edit feed master (audit trail jika ready)
- [ ] Skeleton loading + Framer Motion

### 3.2 Banner Default-Flag Katalog Obat
- [ ] Tambah `<MappingSourceBadge subpage="formularium" />` inline pada ToggleSwitch `isFormularium` di tab Klasifikasi Katalog Obat
- [ ] Copy: "Flag ini = default global. Coverage final per-penjamin × kelas dikelola di Mapping Hub → Formularium"

### 3.3 Update masterNav (`lib/navigation.ts`)
- [ ] Restruktur group dengan tambahan Phase 2:
  - Utama: Beranda
  - Sumber Daya: Unit & Ruangan · Dokter & Nakes · Pengguna
  - Katalog Klinis: Obat · Tindakan · Lab · Radiologi · ICD-10 · SDKI
  - Skala Klinis: Skala Risiko · Skala Umum · Skala Penyakit · Triase IGD
  - Template & Enum: Status Enum · Template Anamnesis · Template Form
  - Workflow Klinis: Workflow Edukasi · Discharge · Operasional
  - Reference: Asesmen Katalog
  - Penugasan: Mapping Hub
  - Operasional: Tarif · Penjamin · Poliklinik (Tier 3)
  - Konfigurasi: Profil RS · PPK

### 3.4 Update CLAUDE.md
- [ ] Tambah pointer ke TODO.md di header CLAUDE.md ("Detail Phase Master: lihat [TODO.md](TODO.md)")
- [ ] Update Tier 2 status setelah Phase 2 selesai
- [ ] Mark Tier 0 Beranda Master done setelah 3.1

---

## 📊 Progress Tracker

| Phase | Tasks | Done | % |
|---|---|---|---|
| Phase 0 — Foundation | 7 | 0 | 0% |
| Phase 1 — Refactor | 6 | 0 | 0% |
| Phase 2 — Master Baru | 13 | 0 | 0% |
| Phase 3 — Polish | 4 | 0 | 0% |
| **Total** | **30** | **0** | **0%** |

---

## 🔗 Roadmap Berikutnya (After Phase 0–3)

### Backend Integration
- [ ] Prisma schema design (master tables + workflow tables)
- [ ] API routes per master (`/api/master/<name>/...`)
- [ ] Authentication + session
- [ ] RBAC enforcement (permission-aware UI di Master Template Layer)
- [ ] Bidirectional sync helper (Mapping Hub ↔ source entity)

### Mapping Hub Expansion (Tier 5)
- [ ] Beranda Mapping (coverage dashboard)
- [ ] Mapping Validator / Health Check
- [ ] Jadwal Praktik Dokter (weekly grid)
- [ ] Tindakan × Penjamin Coverage
- [ ] Dokter × Penjamin Rekanan
- [ ] PPK × Spesialis
- [ ] RBAC Role × Unit Scope
- [ ] Tarif Matrix base-price refactor

### Modul Operasional Besar
- [ ] Poliklinik & Jadwal Dokter (Tier 3)
- [ ] Registration end-to-end (`/ehis-registration/baru`, `/antrian`)
- [ ] Billing Kasir (`ehis-billing`)
- [ ] Dashboard operasional (`/ehis-dashboard`)
- [ ] Report harian/bulanan (`/ehis-report`)

### Compliance & Integrasi
- [ ] `/ehis-fhir` — SatuSehat integration module
- [ ] BPJS V-Claim integration
- [ ] SISRUTE (sistem rujukan Kemkes)
- [ ] Indikator Mutu Nasional (INM)

### Operasional Master Layer
- [ ] Audit trail per master record
- [ ] Import/Export Excel (xlsx)
- [ ] Snapshot/Template per RS Tipe (preset RS Tipe C / RS Khusus Jantung)
- [ ] Versioning + diff viewer

---

## 🛠️ Convention & Standards

### File Structure per Master Page
```
src/lib/master/<name>Mock.ts             # types + mock data + helpers
src/app/ehis-master/<name>/page.tsx      # route entry (Suspense + import)
src/components/master/<name>/
├── <Name>Page.tsx                       # orchestrator (~80 lines, pakai MasterPageLayout)
├── <Name>List.tsx                       # left panel (atau pakai MasterListPanel langsung)
├── <Name>Detail.tsx                     # right panel orchestrator
├── <Name>EmptyState.tsx                 # empty state
├── <name>Shared.ts                      # UI helpers (tab registry, validators, config maps)
└── tabs/
    ├── <Tab1>Tab.tsx
    ├── <Tab2>Tab.tsx
    └── ...
```

### Design Principles (apply setiap halaman)
1. **Invoke `frontend-design` skill** sebelum coding UI (memory-persisted preference)
2. **Skeleton loading 500ms** via Framer Motion AnimatePresence
3. **Two-panel layout** (List + Detail) untuk Master Data; **Form modal** untuk Master Config
4. **No long-scroll** — split ke tabs jika section >5
5. **Form width capped** — `max-w-md`/`max-w-xs`/`max-w-sm` per field
6. **Dark font in fields** (`text-slate-800`), label uppercase `text-slate-500`
7. **No indigo** as primary — pakai teal/sky/emerald/amber/violet/rose/slate
8. **Density `m-*` utility classes** untuk pages di Mapping Hub atau halaman kompleks
9. **File limit ≤800 lines** — split ke sub-components jika lebih
10. **Accent per master** — distinct color per halaman master (lihat MODALITAS_CFG pattern di Katalog Radiologi)

### Acceptance per Master Page
- [ ] Route accessible
- [ ] Stats di header sesuai data
- [ ] List dengan search + filter + add CTA jalan
- [ ] Detail dengan tab + content + save/cancel/delete jalan
- [ ] Empty state animasi smooth
- [ ] Dirty indicator + confirm guard saat switch item
- [ ] TypeScript clean (no errors)
- [ ] File terbesar <800 lines

### Tracking Workflow
Setiap selesai task:
1. Centang `[x]` di TODO.md
2. Tambah catatan ringkas + tanggal di item (mis. `[x] Master Skala Risiko ✅ (2026-06-01) — 5 skala mock, 3 tab, accent teal`)
3. Update progress tracker di atas
4. Update `## 📊 Progress Tracker` count
5. Commit dengan message format: `master: phase X.Y — <singkat>`
