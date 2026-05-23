# EHIS Master — Phase Roadmap

> **Source of truth untuk konsolidasi master data EHIS.**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
> Konteks proyek & convention: lihat [CLAUDE.md](CLAUDE.md). Skill design: `.claude/skills/frontend-design`.
>
> **Last updated:** 2026-05-23
> **Estimasi total:** ~6 minggu (Phase 0–3)
> **Status global:** Phase 2 — Kategori A + B + C ✅ Selesai (10/13 master baru, 77% Phase 2)

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

### 0.2 Refactor 4 katalog existing ke template layer ✅ Selesai (2026-05-23)

- [x] **Katalog Radiologi** ✅ (blueprint refactor — paling fresh) — `KatalogRadiologiPage` 229→91 (-60%), `RadiologiDetail` 194→137 (-29%), `RadiologiList` 259→210 (-19%), `RadiologiEmptyState` 54→24 (-55%), `FormPrimitives` 244→**deleted**. 3 tab files (Identitas/PersiapanDRL/ReportingTemplate) di-update import path `../FormPrimitives` → `@/components/master/shared`. Accent `rose`. Total 980 → 462 lines (**-53%**).
- [x] **Katalog Laboratorium** ✅ — `KatalogLabPage` 226→90 (-60%), `LabItemDetail` 190→132 (-30%), `LabItemList` 245→209 (-15%), `LabItemEmptyState` 31→24 (-23%). Tabs (LabIdentitas/NilaiRujukan/DeltaKritis) sudah custom — tidak perlu update. Accent `sky`. Total 692 → 455 lines (**-34%**).
- [x] **Katalog Tindakan** ✅ — `KatalogTindakanPage` 229→96 (-58%), `TindakanDetail` 419→114 (-73%, **split** ke `tabs/TindakanIdentitasTab.tsx` 144 + `tabs/TindakanRelasiTab.tsx` 146), `TindakanList` 257→203 (-21%), `TindakanEmptyState` 53→24 (-55%). Tab state di-lift dari Detail ke Page (konsisten pattern Radiologi/Lab). Tabs pakai shared FormPrimitives. Accent `teal`. Total 958 → 727 lines (**-24%**, includes 290 baris baru di tabs/).
- [x] **Katalog Obat** ✅ — `KatalogObatPage` 231→95 (-59%), `ObatDetail` 228→154 (-32%), `ObatList` 287→209 (-27%), `ObatEmptyState` 70→24 (-66%), `FormPrimitives` 207→**deleted**. Tab state di-lift dari Detail ke Page. 4 tab files (Identitas/Klasifikasi/Klinis/Harga) di-update import path. 6 `ToggleSwitch checked=` → `value=` (shared API). Accent `violet`. Total 1023 → 482 lines non-tabs (**-53%**).

**Acceptance:** ✅ 4 katalog masih jalan persis sama. TypeScript clean across all files. Total non-shared/non-tabs: **3653 → 2126 lines (-42%, -1527 baris)**. Largest file 237 lines (KlasifikasiTab di Obat), jauh di bawah 800 limit. 2 file `FormPrimitives.tsx` lokal (~450 lines) dihapus — single source of truth di `@/components/master/shared`. Pattern blueprint sudah teruji di 4 katalog dengan accent berbeda (rose/sky/teal/violet) — siap pakai untuk 13 master baru di Phase 2.

---

## Phase 1 — Refactor Wiring (consume master existing) ✅ Selesai (2026-05-23)

**Effort:** Selesai · **ROI:** -250+ lines hardcoded, satu sumber kebenaran untuk 6 area

- [x] **R1: IGD `TindakanTab` → Katalog Tindakan** ✅ — replace [TindakanTab.tsx:32](src/components/igd/tabs/TindakanTab.tsx#L32) `CATALOG` (25 item hardcoded) dengan derivation dari `TINDAKAN_MOCK` di `lib/master/tindakanMock.ts`. Adapter `IGD_KATEGORI_MAP` map 11 enum master → 4 display kategori IGD (Diagnostik/Terapi/Prosedur; Radiologi & Laboratorium dihapus karena seharusnya di-order via DaftarOrderTab, bukan dicatat sebagai tindakan). −50 lines hardcoded.
- [x] **R2: OrderLabTab → Katalog Lab** ✅ — replace [OrderLabTab.tsx](src/components/shared/medical-records/OrderLabTab.tsx) `LAB_CATALOG` (46 item) dengan derivation dari `LAB_KATALOG_MOCK` di `lib/master/labCatalogMock.ts`. Helper `DEFAULT_WAKTU_TUNGGU` per kategori untuk item master tanpa `waktuTunggu` field. Dipakai IGD + RI + RJ via shared. −50 lines hardcoded.
- [x] **R3: OrderRadTab → Katalog Radiologi** ✅ — replace [OrderRadTab.tsx](src/components/shared/medical-records/OrderRadTab.tsx) `RAD_CATALOG` (38 item) dengan derivation dari `RAD_KATALOG_MOCK` di `lib/master/radCatalogMock.ts`. Adapter `MODALITAS_DISPLAY_MAP` map 8 master modalitas → 5 display lokal (Mammografi/DEXA → X-Ray, Intervensi → Fluoroskopi). Helper `formatTAT()` (menit→jam) + `summarizePersiapan()` (puasa+premedikasi+instruksi). Dipakai IGD + RI + RJ via shared. −60 lines hardcoded.
- [x] **R4: Shift configs unify → Profil RS** ✅ — pendekatan **selective unify**: HOURS & DETECTION → single source di `rsProfilStore.ts`, VISUAL CFGs tetap per-context (intentional varian, bukan duplikasi).
  - **Tambah ke `lib/master/rsProfilStore.ts`**: `detectShiftFromMinute()` · `getCurrentShift()` · `detectShiftFromJam()` — semua membaca `RS_PROFIL.shift` jam (07:00-14:59 / 15:00-21:59 / 22:00-06:59)
  - **Refactor `ppiIsolasiShared.ts:currentShift()`** → delegasi ke `getCurrentShift()`. `Shift` type sekarang re-export `ShiftKey` dari rsProfilStore.
  - **Refactor `ioShared.ts:detectShift()`** → delegasi ke `detectShiftFromJam()` (sebelumnya pakai batas 07/14/21, sekarang seragam 07/15/22)
  - **Tidak diubah**: `mar/marShared.ts:SHIFT_CFG` · `handover/handoverShared.ts:SHIFT_CONFIG` · `TTVTab.tsx:SHIFT_CLS` — semua punya field berbeda untuk kebutuhan UI berbeda (amber/sky/indigo vs amber/sky/violet vs simple cls). Inilah varian visual yang valid, bukan duplikasi data.
- [x] **R5: SMF → derive dari SPESIALIS_LABEL Dokter** ✅ — replace [konsultasiShared.ts:42](src/components/shared/medical-records/konsultasi/konsultasiShared.ts#L42) `SMF_LIST` hardcoded (23 entry) dengan 2-tier derivation: **(1)** `SMF_FROM_DOKTER` map 16 `SpesialisCode` → SMF entry (auto-sync dari master); **(2)** `SMF_EXTENSION` 10 sub-spesialis yang belum punya kode (Paru/Bedah Digestif/BTKV/Bedah Saraf/Bedah Plastik/Ortopedi/Rehab Medik/Gizi Klinik/Farmasi Klinik/Onkologi Medik). Saat dokter master diperluas → pindahkan entry dari SMF_EXTENSION ke SPESIALIS_LABEL.
- [x] **R6: RUTE_OBAT unify → Katalog Obat** ✅ — single source di [obatMock.ts](src/lib/master/obatMock.ts) `RUTE_LABELS` (derived dari `RUTE_CFG[r].label` + `RUTE_ORDER` array). `asesmenShared.ts` sekarang `export { RUTE_LABELS as RUTE_OBAT } from "@/lib/master/obatMock"`. `igd/tabs/AsesmenMedisTab.tsx` hapus local `RUTE_OBAT` array → import dari asesmenShared. 3 lokasi sekarang single source.

**Acceptance:** ✅ Workflow lab/rad/tindakan masih jalan sama, tapi data 100% dari master. Shift detection seragam lintas RI/PPI (07/15/22). SMF konsultasi auto-sync saat dokter master diperluas. RUTE_OBAT single source di katalog-obat. **TypeScript clean across all changed files.** Total estimated: ~250+ lines hardcoded dihapus / di-replace dengan derivation pattern.

---

## Phase 2 — Bangun 13 Master Baru

**Effort:** 3-4 minggu (asumsi 1 master/hari dengan template) · **Output:** 13 halaman master baru

### Kategori A — Klinis Penilaian (4 master, prioritas tinggi) ✅ Selesai (2026-05-23)

**Refactor shared layer (2026-05-23):** karena 3 master skala (Risiko/Umum/Penyakit) punya struktur data identik (items + opsi skor + interpretasi), schema diekstrak ke `lib/master/skalaCommon.ts` dan components diekstrak ke `components/master/skala-shared/` (SkalaList · SkalaDetail · SkalaEmptyState · 3 tabs). 3 master page jadi thin wrapper ~110 lines yang pass `accent` + branded classes + copy. Triase IGD struktur beda (matrix level × parameter), terisolasi di folder sendiri.

#### 2.1 Master Skala Risiko — `/ehis-master/skala-risiko` ✅ (2026-05-23)
**Konsumen:** IGD `PenilaianTab` · RI `PenilaianRisikoPane` · RJ skrining · Accent **teal**

- [x] Schema `lib/master/skalaCommon.ts` (shared) + `lib/master/skalaRisikoMock.ts` (alias + mock 5 skala)
- [x] 5 skala mock tervalidasi:
  - [x] **Barthel Index** (ADL) — 10 items, 6-tier interpretasi (Mandiri Penuh → Ketergantungan Penuh)
  - [x] **Morse Fall Scale** (risiko jatuh) — 6 items, 3-tier (Rendah/Sedang/Tinggi)
  - [x] **Braden Scale** (risiko dekubitus, INVERSE) — 6 items, 5-tier
  - [x] **NRS Pain Scale** (0–10) — `select_value` mode, 11 opsi nilai, 4-tier (Tidak/Ringan/Sedang/Berat)
  - [x] **MUST** (skrining gizi) — 3 items, 3-tier (Rendah/Sedang/Tinggi)
- [x] Components: `SkalaRisikoPage.tsx` thin wrapper → consume `skala-shared/{SkalaList,SkalaDetail,SkalaEmptyState}`
- [x] **Sumber hardcoded yang siap di-replace** (kerjakan saat backend ready):
  - [ ] `rawat-inap/asesmenAwal/asesmenAwalShared.ts:62-142` — BARTHEL_ITEMS · MORSE_ITEMS · BRADEN_ITEMS
  - [ ] `igd/tabs/PenilaianTab.tsx:481-665` — duplicate Morse/Braden/Barthel

#### 2.2 Master Skala Umum — `/ehis-master/skala-umum` ✅ (2026-05-23)
**Konsumen:** TTVTab (semua modul) · StatusFisikPane · IGD Triase preview · Accent **sky**

- [x] `lib/master/skalaUmumMock.ts` pakai `SkalaRecord` dari `skalaCommon.ts` (zero duplikasi types)
- [x] 5 skala mock:
  - [x] **GCS** (Glasgow Coma Scale) — Eye/Verbal/Motor sum 3-15, 3-tier (Berat/Sedang/Ringan)
  - [x] **Tingkat Kesadaran Klinis** — 6 level (Compos Mentis/Apatis/Delirium/Somnolen/Sopor/Koma), `select_value`
  - [x] **Keadaan Umum (KU)** — 4 level (Baik/Sedang/Berat/Kritis), `select_value`
  - [x] **NEWS2** — 7 parameter (RR/SpO2/O2/Suhu/TD/HR/Kesadaran) sum, 4-tier risk
  - [x] **MEWS** — 5 parameter sum, 3-tier risk
- [x] `SkalaUmumPage.tsx` thin wrapper accent sky
- [x] **Sumber hardcoded** (siap replace saat backend ready):
  - [ ] `shared/medical-records/TTVTab.tsx:175-183` — KESADARAN_LABEL
  - [ ] `rawat-inap/tabs/pemeriksaan/StatusFisikPane.tsx:14-16` — KU/KESADARAN/GIZI options

#### 2.3 Master Skala Penyakit — `/ehis-master/skala-penyakit` ✅ (2026-05-23)
**Konsumen:** IGD `PenilaianTab` JantungPanel + KankerPanel · Accent **violet**

- [x] `lib/master/skalaPenyakitMock.ts` pakai `SkalaRecord` dari common
- [x] Skala mock (5 entry lintas spesialisasi):
  - [x] **Kardiologi:** Killip Class (I-IV) · NYHA (I-IV) · TIMI Risk Score 7 items
  - [x] **Onkologi:** ECOG Performance Status (0-5) · Stadium Kanker AJCC 8th ed. (0/I/II/III/IV variants)
  - [ ] TNM Staging detail (T/N/M sub-pick) — di-defer; saat ini stadium tunggal sudah cukup, TNM full grid bisa dikerjakan terpisah saat dibutuhkan klinis
- [x] `SkalaPenyakitPage.tsx` thin wrapper accent violet
- [x] **Sumber hardcoded** (siap replace):
  - [ ] `igd/tabs/PenilaianTab.tsx:685-707` (kardio: KILLIP_ITEMS/NYHA_ITEMS/TIMI_ITEMS)
  - [ ] `igd/tabs/PenilaianTab.tsx:933-946` (onko: ECOG_ITEMS/STADIUM_OPTS)

#### 2.4 Master Triase IGD — `/ehis-master/triase-igd` ✅ (2026-05-23)
**Konsumen:** IGD `TriaseTab` + `TriaseModal` · IGD Board urgensi indicator · Accent **amber**

- [x] `lib/master/triaseMock.ts` — `TriaseRecord` (levels[] + parameters[] dengan `values: Record<levelKode, string>`), `TRIASE_TONE_CFG` 7 tone (red-dark/rose/amber/emerald/sky/slate/violet), `isTriaseValid`, helpers
- [x] 1 mock protokol default ("Protokol Triase IGD RS"):
  - [x] 6 level: Resusitasi/Emergency/Urgent/Less Urgent/Non Urgent/DOA + responsTime per level
  - [x] 8 parameter: Airway · Breathing · Sirkulasi · Nadi · Kesadaran · Nyeri · Waktu Respons · Contoh Kasus
- [x] Components: `TriaseIGDPage` + `TriaseList` (color-stripe badges per level) + `TriaseDetail` 2-tab (Identitas + Matrix) + `MatrixTab` (sticky header + sticky first col, level editor collapsible dengan tone swatch picker, inline textarea cells)
- [x] **Sumber hardcoded** (siap replace): [TriaseTab.tsx:178-298](src/components/igd/tabs/TriaseTab.tsx#L178) — COL_HEADERS + CRITERIA_ROWS

### Kategori B — Reference Klinis (3 master) ✅ Selesai (2026-05-23)

**Strategi mock representative (2026-05-23):** alih-alih import full dataset (besar, lambat dev/bundle), Kategori B pakai mock sample 80–120 entry per master. Schema 1:1 dengan target real dataset → saat backend ready cukup swap mock array dengan API call (`prisma.X.findMany()`). Pola sudah teruji di Katalog Obat (30/ribuan), Lab (31), Tindakan (35). Phase 3 dapat tambah "Import CSV" UI untuk admin yang ingin populate dataset real.

#### 2.5 Master ICD-10 & ICD-9 — `/ehis-master/icd` ✅ (2026-05-23)
**Konsumen:** DiagnosaTab (semua modul) · Resume Medik · INA-CBG mapping · Accent **sky**

- [x] Schema `lib/master/icdMock.ts`: `IcdItem` dengan `jenis: "ICD-10"|"ICD-9"` discriminator + kode + nama Indonesia/Inggris + chapter + blok? + inaCbg?
- [x] Mock representative ~80 entries:
  - [x] **ICD-10 (~60 kode)** lintas 22 chapter WHO (Infeksi/Neoplasma/Darah/Endokrin/Mental/Saraf/Mata/Telinga/Sirkulasi/Pernapasan/Pencernaan/Kulit/Muskuloskeletal/Genitourinari/Kehamilan/Perinatal/Kongenital/Gejala/Cedera/Sebab Luar/Status Kesehatan)
  - [x] **ICD-9-CM (~30 kode)** lintas 5 kategori prosedur (Diagnostik/Radiologi/Laboratorium/Terapi/Prosedur Bedah)
  - [x] Beberapa entry punya `inaCbg` code (mapping klaim BPJS)
- [x] Components: `IcdPage` + `IcdList` (jenis switcher dengan icon + count + chapter dropdown filter + status filter) + `IcdDetail` (jenis picker + kode/nama bilingual + chapter/blok + INA-CBG conditional untuk ICD-10) + `icdShared.ts` (JENIS_CFG sky/amber palette)
- [x] **Sumber siap replace** (saat backend ready):
  - [ ] [diagnosaShared.ts:17-56](src/components/shared/medical-records/diagnosaShared.ts#L17) ICD10 catalog (37 hardcoded)
  - [ ] [diagnosaShared.ts:60-86](src/components/shared/medical-records/diagnosaShared.ts#L60) ICD9 catalog (25 hardcoded)
- [ ] **Phase 3 enhancement:** tombol "Import CSV" untuk admin upload dataset full WHO/Kemkes

#### 2.6 Master Asesmen Katalog — `/ehis-master/asesmen-katalog` ✅ (2026-05-23)
**Konsumen:** AllergyPane · RiwayatPane · AsesmenMedisTab (shared+IGD) · Accent **violet**

- [x] Schema unified `lib/master/asesmenKatalogMock.ts`: `AsesmenItem` dengan kategori discriminator (11 kategori), kode, nama, deskripsi?, snomedCode? (allergen), severityDefault? (reaksi)
- [x] Mock 120 entries lintas 11 kategori (4 grup): **Alergi** (Allergen Obat 15 + Makanan 10 + Lainnya 8 + Reaksi 12) · **Penyakit** (Dahulu 20 + Beresiko 12 + Keluarga 10 + Perilaku Beresiko 8) · **Sosial** (Anggota Keluarga 8) · **Reproduksi** (Metode KB 9 + Jenis Persalinan 5)
- [x] SNOMED CT mapping pada 10 allergen tervalidasi (untuk FHIR AllergyIntolerance interoperability)
- [x] Components: `AsesmenKatalogPage` + `AsesmenList` (kategori filter chips grouped per grup, search NIK/SNOMED, status filter) + `AsesmenDetail` (kategori picker + conditional SNOMED field untuk Allergen + conditional Severity chip untuk Reaksi)
- [x] **Sumber siap replace:**
  - [ ] [asesmenShared.ts:88-188](src/components/shared/asesmen/asesmenShared.ts#L88) — QUICK_PICKS, REACTIONS, PENYAKIT_*, ANGGOTA_KELUARGA, METODE_KB, JENIS_PERSALINAN, SNOMED_CODES

#### 2.7 Master SDKI/SIKI/SLKI — `/ehis-master/sdki` ✅ (2026-05-23)
**Konsumen:** KeperawatanTab RI · CarePlanTab template · Accent **rose**

- [x] Schema `lib/master/sdkiMock.ts`: `SdkiItem` dengan kode D.NNNN, kategori (5 levels: Fisiologis/Psikologis/Perilaku/Relasional/Lingkungan), subKategori, jenis (Aktual/Risiko/Promosi_Kesehatan), penyebabUmum, faktorResiko?, **dataMayor + dataMinor** (subjektif/objektif), **kriteriaHasil[]** (SLKI), **intervensi** (observasi/terapeutik/edukasi/kolaborasi — SIKI 4 kategori)
- [x] Mock ~30 diagnosa lintas semua kategori:
  - [x] Fisiologis Respirasi (D.0001, D.0003, D.0005), Sirkulasi (D.0008, D.0009), Nutrisi/Cairan (D.0019, D.0022, D.0023), Aktivitas (D.0054, D.0056, D.0109), Neurosensori (D.0077, D.0078), Termoregulasi/Integumen (D.0129, D.0130), Eliminasi (D.0040), Risiko Keamanan (D.0142, D.0143, D.0144)
  - [x] Psikologis (D.0080 Ansietas, D.0084 Gangguan Citra Tubuh)
  - [x] Perilaku (D.0111 Defisit Pengetahuan, D.0112 Kesiapan Peningkatan, D.0114 Ketidakpatuhan)
  - [x] Relasional (D.0119 Gangguan Interaksi, D.0121 Ketegangan Pemberi Asuhan)
  - [x] Lingkungan (D.0148 Risiko Cedera Lingkungan)
- [x] Components: 3-tab structure — `IdentitasTab` (kategori grid + jenis selector + conditional faktorResiko untuk diagnosa Risiko) + `KlinisTab` (data mayor/minor 2-column + kriteria SLKI full-width + auto-hide data klinis untuk diagnosa Risiko + info bar) + `IntervensiTab` (4 sub-card SIKI dalam 2-column grid: Observasi/Terapeutik/Edukasi/Kolaborasi) + shared `ListEditor` reusable component (animated row add/remove/reorder)
- [x] **Sumber siap replace:**
  - [ ] [keperawatanShared.ts:77](src/components/shared/medical-records/keperawatanShared.ts#L77) `SDKI_CATALOG` (15 hardcoded di codebase, master menyediakan 30)

### Kategori C — Template & Enum (3 master) ✅ Selesai (2026-05-23)

**Strategi (2026-05-23):** 3 master dengan struktur sangat berbeda → masing-masing punya layout tersendiri (tidak share components seperti Kategori A skala). Status Enum & Template Form pakai sidebar nav (multi-collection per page); Template Anamnesis pakai 2-panel klasik list+detail. Semua reuse `MasterPageLayout` + `MasterListPanel` + `FormPrimitives` shared.

#### 2.8 Master Status Enum — `/ehis-master/status-enum` ✅ (2026-05-23)
**Konsumen:** semua modul · 1 page multi-enum sidebar nav · Accent **violet**

- [x] Schema `lib/master/statusEnumMock.ts`: `EnumEntry` (id/kode/label/deskripsi?/tone/urutan/status/icon?) + `EnumGroup` (key/label/deskripsi/icon/konsumen[]/entries[]); 9 tone palette + 30+ icon registry (Lucide string→component)
- [x] 9 enum group mock:
  - [x] **Status Pulang** (7 entries — Sembuh/Membaik/Rawat Inap/Dirujuk/APS/Belum Sembuh/Meninggal)
  - [x] **Kondisi Umum / KU** (4 — Baik/Sedang/Buruk/Kritis)
  - [x] **Tingkat Kesadaran** (6 — Compos Mentis/Apatis/Delirium/Somnolen/Sopor/Koma)
  - [x] **Kondisi Transfer** (3 — Stabil/Tidak Stabil/Kritis)
  - [x] **Mode Transport** (5 — Jalan Kaki/Kursi Roda/Brankar/Ambulance Internal/Ambulance Eksternal)
  - [x] **Kelas Perawatan** (7 — VIP/Kelas 1-3/ICU/HCU/Isolasi — replaces `RIKelas`)
  - [x] **Hubungan Keluarga** (7 — Suami/Istri/Anak/Ortu/Saudara/Wali/Lainnya)
  - [x] **Profesi Edukator** (6 — Dokter/Perawat/Apoteker/Ahli Gizi/Fisioterapis/Psikolog)
  - [x] **Rute Pemberian Obat** (10 — Oral/IV/IM/SC/Sublingual/Topikal/Inhalasi/Rektal/Nasal/NGT)
- [x] Components: `StatusEnumPage` (~50 lines) + `EnumSidebar` (280px, group list dengan icon+count+aktif-ratio) + `EnumTable` (search/filter/CRUD table dengan inline edit + add form collapsible + reorder up/down + drag-handle) + `EnumEntryForm` (label→auto-slug kode + tone swatch picker 9 opsi + icon select + urutan + live preview chip)
- [x] **Sumber siap replace** (saat backend ready):
  - [ ] [pasienPulangShared.tsx (IGD):35](src/components/igd/tabs/pasienPulang/pasienPulangShared.tsx#L35) STATUS_OPTIONS
  - [ ] [dischargeShared.ts:1-30](src/components/rawat-inap/discharge/dischargeShared.ts) KondisiPulang+HubunganCaregiver+ProfesiEdukasi
  - [ ] [pasienPulangShared.ts (RI):187](src/components/rawat-inap/pasienPulang/pasienPulangShared.ts#L187) STATUS_KEPULANGAN_LIST
  - [ ] `data.ts` `RIKelas` type

#### 2.9 Master Template Anamnesis — `/ehis-master/template-anamnesis` ✅ (2026-05-23)
**Konsumen:** AnamnesisPane (IGD+RI+RJ) · Accent **teal**

- [x] Schema `lib/master/templateAnamnesisMock.ts`: `TemplateAnamnesisItem` dengan id/label/kategori (12 enum)/contextTags (IGD/RI/RJ multi)/keluhanUtama/rps/onsetDurasi/mekanismeCedera?/faktorPemberat/faktorPemerut/statusGeneralis/catatanPerawat?
- [x] 17 template mock lintas context × kategori:
  - [x] **IGD (8):** Nyeri Dada/Sesak Napas/Nyeri Abdomen/Trauma/Stroke/Kejang/Syok/Demam
  - [x] **RI (4):** Gagal Jantung/Pneumonia/ACS/DM Komplikasi (admission long-form)
  - [x] **RJ (5):** ISPA/Nyeri Dada/Kontrol DM/Kontrol Hipertensi/Kontrol Pasca Rawat
- [x] Components: `TemplateAnamnesisPage` orchestrator + `TemplateAnamnesisList` (chip filter per context dengan count + dropdown kategori + status filter) + `TemplateAnamnesisDetail` 3-tab structure: `IdentitasTab` (label+kategori+context multi-select chip dengan badge), `KontenTab` (keluhan+RPS+onset+faktor+statusGeneralis+mekanismeCedera conditional), `PreviewTab` (catatan perawat + live preview lengkap dengan semua field + reminder card)
- [x] **Sumber siap replace:**
  - [ ] [asesmenAwalShared.ts:151](src/components/rawat-inap/asesmenAwal/asesmenAwalShared.ts#L151) `ANAMNESIS_TEMPLATES` RI (3 hardcoded)
  - [ ] [AsesmenMedisTab.tsx:204](src/components/igd/tabs/AsesmenMedisTab.tsx#L204) `IGD_TEMPLATES` (7 hardcoded)
  - [ ] [asesmenAwalRJShared.ts:18](src/components/rawat-jalan/asesmenAwal/asesmenAwalRJShared.ts#L18) `ANAMNESIS_RJ_TEMPLATES` (4 hardcoded)

#### 2.10 Master Template Form — `/ehis-master/template-form` ✅ (2026-05-23)
**Konsumen:** HandoverTab · KonsultasiTab · SBARTransferPanel · InformedConsentTab · PasienPulangTab · SuratDokumenTab · CPPTTab · Accent **sky** (per-jenis: violet/rose/sky/amber)

- [x] Schema `lib/master/templateFormMock.ts`: discriminated union `TemplateFormItem` (jenis: "sbar"|"ic-risiko"|"surat"|"quick-text") — 4 schema berbeda per jenis dengan kolom spesifik (SBAR: S/B/A/R + context; IC: risikoSpesifik[]+manfaat+alternatif+konsekuensiTolak; Surat: body template dengan placeholder; QuickText: shortcut+expansion+kategori)
- [x] 20 mock template (3 SBAR + 4 IC + 5 Surat + 8 QuickText):
  - [x] **SBAR:** Handover Shift RI + Konsultasi DPJP Telepon + Transfer IGD→RI
  - [x] **IC Risiko:** Apendektomi + PCI Kateterisasi Jantung + Transfusi Darah + Ventilator Mekanik
  - [x] **Surat Pulang:** Kontrol/Sakit/Dirawat BPJS/Rujukan Balik FKTP/Kematian (full body dengan `${nama}`/`${noRM}`/`${diagnosis}`/dst placeholder)
  - [x] **CPPT Quick-text:** /normal-thorax /normal-abdomen /normal-neuro /normal-mental /anjuran-jantung /anjuran-dm /plan-obs /plan-pulang
- [x] Components: `TemplateFormPage` orchestrator (custom state, bukan useMasterCrud karena multi-collection per jenis) + `TemplateFormSidebar` 260px (4 jenis dengan icon+deskripsi+count+aktif-ratio + active ring per color) + `TemplateFormList` 320px adaptive sub-label per jenis + `TemplateFormDetail` switch-by-discriminator render 4 pane berbeda + 4 panes terpisah:
  - [x] `SBARPane` 4-section card (S/B/A/R) accent berbeda + tips writing
  - [x] `ICRisikoPane` tag-list builder untuk risikoSpesifik + Heart/GitBranch/Ban section untuk manfaat/alternatif/konsekuensi + PMK 290 reminder
  - [x] `SuratPane` 2-column editor+preview + placeholder picker dengan visual indicator (hijau = sudah dipakai)
  - [x] `QuickTextPane` shortcut validator real-time (no space, starts with /, unique) + word/char counter + preview "ketik shortcut → auto-expand"
- [x] **Sumber siap replace:**
  - [ ] [handoverShared.ts:47](src/components/rawat-inap/tabs/handover/handoverShared.ts#L47) SBAR_DEF
  - [ ] [InformedConsentTab.tsx:104](src/components/shared/medical-records/InformedConsentTab.tsx#L104) `RISIKO_UMUM` (9 generic) + perlu split per-tindakan
  - [ ] [pasienPulangShared.ts:199](src/components/rawat-inap/pasienPulang/pasienPulangShared.ts#L199) `SURAT_TEMPLATE` (RI) + [SuratDokumenTab.tsx]() RJ — saat backend ready
  - [ ] CPPT Quick-text: belum ada implementasi auto-expand di codebase — master ini menyiapkan data, fitur expand jadi enhancement client-side ke depan

### Kategori D — Workflow & Operasional (3 master)

#### 2.11 Master Workflow Edukasi — `/ehis-master/workflow-edukasi` ✅ Selesai (2026-05-23)
**Konsumen:** EdukasiPane (IGD + RI Discharge)

- [x] 7 sub-tab (sidebar nav multi-collection, single page):
  - [x] **Topik Edukasi** (14 entries) + kategori (Medis/Farmasi/Nutrisi/Rehabilitasi/Keperawatan/Administratif/Preventif)
  - [x] **Media Edukasi** (7 entries — Verbal/Leaflet/Booklet/Demo/Video/Poster/Aplikasi Digital)
  - [x] **Metode Edukasi** (5 entries — Ceramah/Diskusi/Demo/Simulasi/Tanya Jawab)
  - [x] **Hambatan Komunikasi** (8 entries — Tidak Ada/Bahasa/Pendengaran/Penglihatan/Kognitif/Emosional/Fisik/Pendidikan)
  - [x] **Tingkat Pemahaman** (3 entries — Paham/Perlu Ulang/Tidak Paham) dengan tone semantik emerald/amber/rose
  - [x] **Tanda Bahaya** (14 entries) per kondisi 7 kelompok (Umum/Kardiovaskular/Respirasi/Neurologi/Pencernaan/Bedah/Obstetri)
  - [x] **Tipe Instruksi Pulang** (6 entries — Discharge/Follow-up/Emergency/Pra-Tindakan/Admisi RI/Rujukan)
- [x] Components: `WorkflowEdukasiPage` orchestrator + `EdukasiSidebar` 280px (7 koleksi card icon+aktif-ratio + active indicator layoutId) + `EdukasiTable` (search + filter status + sub-filter kategori/tone/kondisi conditional + add form collapsible + sticky-header table dengan extra column conditional per koleksi) + `EdukasiRow` (move up/down, edit inline, delete, ExtraCell switch-by-flag render kategori/tone/kondisi chip) + `EdukasiEntryForm` (label→auto-slug kode + per-koleksi conditional field render kategori chip-grid / tone picker / kondisi chip-grid + live preview chip). Accent **amber** (warmth/guidance theme untuk edukasi).
- [x] **Sumber siap replace:**
  - [ ] [EdukasiPane.tsx (IGD):146-189](src/components/igd/tabs/EdukasiPane.tsx#L146) `TOPIK_EDUKASI`/`MEDIA_EDUKASI`/`METODE_EDUKASI`/`HAMBATAN_KOMUNIKASI`/`PEMAHAMAN_CFG`/`TANDA_BAHAYA`/`TIPE_INSTRUKSI`
  - [ ] [dischargeShared.ts:196-219](src/components/rawat-inap/discharge/dischargeShared.ts#L196) `TOPIK_EDUKASI_TEMPLATE` + `KATEGORI_COLOR` + `PEMAHAMAN_CONFIG` duplicate

#### 2.12 Master Discharge Klasifikasi — `/ehis-master/discharge` ✅ Selesai (2026-05-24)
**Konsumen:** RI DischargePlanTab + PasienPulangTab

- [x] 5 sub-master (sidebar nav + switch-by-key pane render, **bukan force-fit table**):
  - [x] **Homecare Services** (10 entries) — flat list table CRUD: Perawatan Luka/Injeksi/Monitoring TTV/Fisioterapi/Nebulisasi/Ganti Kateter/NGT/Stoma/Edukasi Rumah/Paliatif
  - [x] **Alat Bantu Pulang** (9 entries) — flat list table CRUD: Kursi Roda/Kruk/Walker/Oksigen/Nebulizer/Tensimeter/Oximeter/Kateter/Hospital Bed
  - [x] **Discharge Checklist Template** (11 entries dengan `required:boolean` flag + `sublabel` field) — table dengan extra column "Wajib" + sub-filter Wajib/Opsional + toggle inline per-row
  - [x] **Phase Discharge Planning** (3 fase × 11 target items) — **3-card horizontal timeline kanban**: sky/emerald/amber color-stripe + numbered step badge + standar SNARS chip + ChevronRight connector + per-fase target list dengan inline add/edit/reorder + PhaseHeaderEditor untuk edit metadata fase (nama/desc/standar/warna)
  - [x] **Risiko Readmisi Config** (3 parameter × 9 rules × 3 level) — **rule matrix builder** 3-card horizontal (RENDAH emerald / SEDANG amber / TINGGI rose) + per-card add rule form (parameter dropdown × value dropdown auto-exclude used) + level mini-dropdown untuk pindah rule antar level + **live calculator** dengan 3 ParameterPicker → ArrowRight → animated ResultBadge + TriggeredRulesPanel explainer per rule cocok
- [x] Components: `DischargePage` orchestrator (4 StatCard Homecare/AlatBantu/Checklist/Fase-Target) + `DischargeSidebar` 280px (5 sub-master dengan icon + count label per shape) + `panes/ListCollectionPane` (shared untuk 3 koleksi flat-list dengan conditional `hasRequired`/`hasSublabel` props) + `panes/ListEntryForm` (form dengan conditional required toggle + sublabel field) + `panes/PhasePlanningPane` (3-card timeline + ReferenceItem SNARS legend) + `panes/PhaseHeaderEditor` (inline edit fase metadata + color picker) + `panes/RisikoReadmisiPane` (rule matrix + LiveCalculator + TriggeredRulesPanel). Accent **emerald** (positive completion / ready to go home).
- [x] **Sumber siap replace:**
  - [ ] [dischargeShared.ts:180-188](src/components/rawat-inap/discharge/dischargeShared.ts#L180) `HOMECARE_OPTIONS` + `ALAT_BANTU_OPTIONS`
  - [ ] [dischargeShared.ts:235-246](src/components/rawat-inap/discharge/dischargeShared.ts#L235) `CHECKLIST_TEMPLATE` (10 items + required flag)
  - [ ] [dischargeShared.ts:130-154](src/components/rawat-inap/discharge/dischargeShared.ts#L130) `STEP_PHASES` (3 fase) — perlu extend dengan `targets[]` per fase
  - [ ] [dischargeShared.ts:268-281](src/components/rawat-inap/discharge/dischargeShared.ts#L268) `calcRisikoReadmisi()` hard-coded rules → derive dari `risikoRules[]` master

#### 2.13 Master Operasional Klinis — `/ehis-master/operasional` ✅ Selesai (2026-05-24)
**Konsumen:** IntakeOutputTab · GiziNutrisiTab · PPI Isolasi

- [x] 4 sub-koleksi dengan discriminator field (semua flat list):
  - [x] **Sumber Cairan & Output** (31 entries) — Intake 18 (Oral 3 / IV 8 / NGT 3 / Transfusi 4) + Output 13 (Urine 2 / Drainase 3 / Feses 3 / Muntah 2 / Perdarahan 3). Schema `tipe: Intake|Output` + `kategori: string` + per-kategori tone palette (emerald/sky/amber/rose/slate/violet/orange).
  - [x] **Tipe Diet & Tekstur** (16 entries) — 12 Diet (DJR I-III, DM, RP, RL, TP, DGK, DH, DPO, MB, Lainnya) dengan `kaloriDefault` + `batasanDefault` + 4 Tekstur (Biasa/Lunak/Saring/Cair) dengan `tone: slate|sky|amber|indigo`. Schema `jenis: Diet|Tekstur` dengan conditional fields per jenis.
  - [x] **Bundle HAI Items** (12 items) — VAP 5 / CAUTI 3 / CLABSI 4. Schema `bundle: VAP|CAUTI|CLABSI` + `detail` instruksi operasional. Master `BUNDLE_CFG_MASTER` per bundle: label/fullName/trigger/colors (rose/amber/indigo).
  - [x] **Penyakit Wajib Isolasi** (18 penyakit) — Contact 6 (MRSA/VRE/C.diff/ESBL/Scabies/Luka) + Droplet 6 (Influenza/Meningitis/Pertussis/Mumps/Rubella/Difteri) + Airborne 6 (TB Paru/MDR-TB/Campak/Varicella/COVID Aerosol/SARS). Schema `mode: Contact|Droplet|Airborne` + `patogen` + `durasiHariMin/Max` + `catatan` (kapan lepas isolasi). Master `ISOLASI_MODE_CFG` per mode (amber/orange/red).
- [x] **Arsitektur:** sidebar nav (`OperasionalSidebar` 280px, `motion.layoutId="operasional-active-indicator"`) + 4 dedicated panes via switch-by-key pane render. Setiap pane self-contained CRUD: search + status filter + discriminator sub-filter (button chips untuk Tipe/Jenis · interactive **summary cards** untuk Bundle/Mode) + add CTA + sticky-header table + animated add form. Form per sub-master: discriminator picker (segmented 2-button untuk Tipe/Jenis · 3-card untuk Bundle/Mode) + auto-slug kode dari label (prefix INT/OUT/TX/VAP/CTI/CLB) + conditional field render per discriminator. Dup-kode detection real-time + validation banner.
- [x] **Components:** `OperasionalPage` orchestrator (4 StatCard Cairan/Diet-Tekstur/Bundle/Isolasi) + `OperasionalSidebar` (4 sub-master dengan icon + aktif/total ratio) + `operasionalShared.ts` (sortByUrutan/suggestKode/isEntryValid/isDuplicateKode) + 4 pane × 2 file (Pane + Form): `SumberCairanPane/Form` · `DietTeksturPane/Form` · `BundleHAIPane/Form` · `PenyakitIsolasiPane/Form`. Accent **slate** (operasional/utility — defer ke palette internal per discriminator). Bundle HAI + Penyakit Isolasi panes pakai **interactive summary cards** klik-untuk-filter (3-card border-l-4 dengan count chip + trigger info) — UX lebih engaging dibanding plain chip strip. Largest file 451L (mock), pane terbesar 412L (SumberCairanPane), semua jauh di bawah 800 limit.
- [x] `masterNav` group `Workflow Klinis` tambah item ke-3 Operasional Klinis (icon ClipboardCheck).
- [x] **Sumber siap replace:**
  - [ ] [ioShared.ts:42-112](src/components/rawat-inap/tabs/intakeOutput/ioShared.ts#L42) `INTAKE_CATS` + `OUTPUT_CATS` + `INTAKE_CHIP` + `OUTPUT_CHIP` → derive dari `CAIRAN_INITIAL` + `CAIRAN_KATEGORI` + `CAIRAN_TONE_CFG`
  - [ ] [giziNutrisiShared.ts:50-70](src/components/rawat-inap/tabs/giziNutrisi/giziNutrisiShared.ts#L50) `TIPE_DIET_OPTIONS` + `TEKSTUR_CFG` → derive dari `DIET_TEKSTUR_INITIAL` (filter `jenis === "Diet" | "Tekstur"`)
  - [ ] [ppiIsolasiShared.ts:35-140](src/components/rawat-inap/ppiIsolasi/ppiIsolasiShared.ts#L35) `ISOLASI_CFG` + `VAP_ITEMS` + `CAUTI_ITEMS` + `CLABSI_ITEMS` + `BUNDLE_CFG` → derive dari `BUNDLE_HAI_INITIAL` (groupBy `bundle`) + `ISOLASI_MODE_CFG` + `BUNDLE_CFG_MASTER`

---

## Phase 3 — UX Polish

**Effort:** ~1 minggu

### 3.1 Beranda Master — `/ehis-master` ✅ Selesai (2026-05-24)
- [x] Replace placeholder violet box di [app/ehis-master/page.tsx](src/app/ehis-master/page.tsx) → `BerandaMasterPage`
- [x] **KPI Strip** 5 hero card animated (Sumber Daya · Katalog Klinis · Reference · Mapping Coverage · Operasional) dengan number padded eyebrow + accent bar hover transform
- [x] **Quick-Nav Grid** 9 kelompok per `masterNav` (Sumber Daya teal · Katalog Klinis sky · Skala Klinis violet · Reference rose · Template & Enum indigo · Workflow Klinis amber · Penugasan emerald · Operasional pink · Konfigurasi slate) — total 24 nav card. Tiap card: icon ring-1 hover-scale, label, subLabel/count, badge counter mono, ChevronRight translate hover. Hover border-tone untuk depth.
- [x] **Mapping Coverage Panel** sidebar — 8 mini-meter per sub-page (SDM/Kewenangan/Layanan/Tarif/Formularium/Distribusi/Penjamin-Ruangan/RBAC). Progress bar animated (`width 0→%` ease-out delay-stagger 20ms). Color tone semantik: rose <25% / amber <60% / emerald ≥60%. Header summary `filled/total cell` + avg %. CTA "Buka Mapping Hub" footer. Klik baris → deep-link `?sub=<key>`.
- [x] **Recent Edits Panel** sidebar — activity feed 8 entri mock dengan timeline rail vertical (absolute span 100%). Action chip 3-warna (Tambah emerald · Edit sky · Hapus rose) + Icon (Plus/Pencil/Trash2). Initials avatar dari nama user (strip "dr." prefix). `fmtAgo()` relatif (mnt/jam/hari). Klik → deep-link ke route master. Footer audit-trail note italic.
- [x] **Skeleton + Framer Motion** — `useSkeletonDelay(500)` + AnimatePresence fade swap. Layout custom **bukan** `MasterPageLayout` (dashboard, bukan list+detail). Hero header: icon-prefix eyebrow violet + h1 tracking-tight + description max-w-2xl + timestamp pill mono jam HH:mm (hidden mobile).
- [x] **Aggregator helpers** di [berandaShared.ts](src/components/master/beranda/berandaShared.ts) — `getBerandaStats()` consume 16+ mock source (DOKTER_MOCK/PENGGUNA_MOCK/OBAT_MOCK/TINDAKAN_MOCK/LAB_KATALOG_MOCK/RAD_KATALOG_MOCK/ICD_MOCK/ASESMEN_KATALOG_MOCK/SDKI_MOCK/SKALA_RISIKO_MOCK/SKALA_UMUM_MOCK/SKALA_PENYAKIT_MOCK/TRIASE_MOCK/STATUS_ENUM_GROUPS/TEMPLATE_ANAMNESIS_MOCK/TEMPLATE_FORM_MOCK/EDUKASI_COLLECTIONS/OPERASIONAL_INITIAL_STATE/TARIF_MOCK/PAKET_MOCK/PENJAMIN_INITIAL/PPK_INITIAL). `getQuickNavGroups()` denormalisasi nav + count + accent. `MAPPING_COVERAGE` 8 entries dengan estimasi filled/total. `RECENT_EDITS_MOCK` 8 entries lintas master. `TONE_PALETTE` 9 tone static (purge-safe).
- [x] **Responsive** mobile-first: KPI grid `2→3→5` cols, body grid `1→12` (lg: nav col-span-8 + sidebar col-span-4), nav items `1→2→3` cols per kelompok, hero timestamp hidden <sm.
- [x] **Komponen** (6 file, semua <300 lines): [BerandaMasterPage.tsx](src/components/master/beranda/BerandaMasterPage.tsx) 133L · [berandaShared.ts](src/components/master/beranda/berandaShared.ts) 286L · [KPIStrip.tsx](src/components/master/beranda/KPIStrip.tsx) 71L · [QuickNavGrid.tsx](src/components/master/beranda/QuickNavGrid.tsx) 109L · [MappingCoveragePanel.tsx](src/components/master/beranda/MappingCoveragePanel.tsx) 111L · [RecentEditsPanel.tsx](src/components/master/beranda/RecentEditsPanel.tsx) 127L. TypeScript clean.

### 3.2 Banner Default-Flag Katalog Obat
- [ ] Tambah `<MappingSourceBadge subpage="formularium" />` inline pada ToggleSwitch `isFormularium` di tab Klasifikasi Katalog Obat
- [ ] Copy: "Flag ini = default global. Coverage final per-penjamin × kelas dikelola di Mapping Hub → Formularium"

### 3.3 Update masterNav (`lib/navigation.ts`) ✅ Selesai (2026-05-24)
- [x] Restruktur group sesuai Phase 2 final di [navigation.ts:168-242](src/lib/navigation.ts#L168-L242):
  - Utama → Beranda (1)
  - Sumber Daya → Unit & Ruangan · Dokter & Nakes · Pengguna (3)
  - Katalog Klinis → Katalog Obat · Tindakan · Laboratorium · Radiologi · **ICD-10 & ICD-9** · **SDKI / SIKI / SLKI** (6) — ICD & SDKI dipindah dari "Reference" karena lebih semantik di katalog (data aktif dipilih saat entry klinis, bukan lookup pasif)
  - Skala Klinis → Skala Risiko · Skala Umum · Skala Penyakit · Triase IGD (4)
  - **Referensi** (rename dari "Reference" untuk konsistensi Bahasa Indonesia) → Asesmen Katalog (1)
  - Template & Enum → Status Enum · Template Anamnesis · Template Form (3)
  - Workflow Klinis → Workflow Edukasi · Discharge Klasifikasi · Operasional Klinis (3)
  - Penugasan → Mapping Hub (1)
  - Operasional → Tarif & Layanan · Penjamin & Kontrak (2) — Poliklinik (Tier 3) belum dibangun, skip dulu agar tidak dead-link
  - Konfigurasi → Profil RS · Faskes Rujukan (PPK) (2)
- [x] **Total**: 10 grup × 26 item. Verifikasi semua href punya route real (no dead links).
- [x] Sinkronisasi struktur ke [berandaShared.ts](src/components/master/beranda/berandaShared.ts) `getQuickNavGroups()` — sumber sama biar Beranda Master & sidebar nav konsisten. Update desc Referensi → "Referensi asesmen klinis terstandar"; Katalog Klinis → "Obat, tindakan, penunjang, dan kode diagnosa".

### 3.4 Update CLAUDE.md
- [ ] Tambah pointer ke TODO.md di header CLAUDE.md ("Detail Phase Master: lihat [TODO.md](TODO.md)")
- [ ] Update Tier 2 status setelah Phase 2 selesai
- [ ] Mark Tier 0 Beranda Master done setelah 3.1

---

## 📊 Progress Tracker

| Phase | Tasks | Done | % |
|---|---|---|---|
| Phase 0 — Foundation | 7 | 7 | 100% |
| Phase 1 — Refactor | 6 | 6 | 100% |
| Phase 2 — Master Baru | 13 | 13 | 100% |
| Phase 3 — Polish | 4 | 2 | 50% |
| **Total** | **30** | **28** | **93%** |

**Phase 3 progress:** 2/4 — ✅ 3.1 Beranda Master + ✅ 3.3 Restruktur masterNav (2026-05-24). Sisa: 3.2 Banner Default-Flag Katalog Obat (skip dulu) · 3.4 Update CLAUDE.md final.

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
