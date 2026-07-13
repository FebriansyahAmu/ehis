# EHIS Billing — Phase Roadmap

> **Source of truth untuk modul `/ehis-billing` (Kasir & Tagihan).**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
>
> **Workflow docs:**
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO.md](TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TODO-EKLAIM.md](TODO-EKLAIM.md) — **Klaim BPJS & Asuransi roadmap (PISAH modul ke `/ehis-eklaim`)**
> - [TODO-BILLING-BACKEND.md](TODO-BILLING-BACKEND.md) — **Billing BACKEND (📋 2026-07-13): Invoice DB + charge ingest server-side** — merealisasikan sisa BL0/BL6 secara nyata; `billingStore`/`chargeIngest` client di-retire di fase BB8
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap (Billing depend B0/B1.7/B1.9)
> - [.claude/STANDARDS.md](.claude/STANDARDS.md) — clinical & finance standards
>
> **Last updated:** 2026-05-26
> **Status:** ✅ **Core `/ehis-billing` operasional 100%** — BL1 Tagihan Board + BL2 Invoice Detail 4-tab + BL3 Kasir Counter 3-tab + **BL6 Charge Ingestion ~80%** (Lab/Rad/Farmasi/Akomodasi silent-wired, Tindakan + JasaDokter pending) + **BL8 Beranda Billing 100%** (KPI strip + Quick Nav + 3 panel aktivitas) + **Single-source refactor** (registrasi `/ehis-registration/pasien/{id}` jadi read-only + deep-link, payment exclusive di `/ehis-billing`). Reactive store via `useSyncExternalStore` — charge ingest dari modul klinis auto-update Invoice Detail + Discharge Banner + Mini Widget. **Sisa fase (BL5 Adjustment · BL7 Reports · BL9 Polish · BL0 formal types)** ditunda — core kasir + cross-modul integration sudah cukup untuk demo end-to-end. **Klaim Penjamin DIPISAH ke modul baru `/ehis-eklaim`** (lihat [TODO-EKLAIM.md](TODO-EKLAIM.md)).
> **Target effort:** ~3 minggu (frontend full, after split) · paralel dengan backend B0/B1.7/B1.9 dapat dimulai.

> ### 🔀 Scope Split (2026-05-24)
>
> Setelah riset workflow klaim BPJS (4 role hand-off, batch monthly submission, reconciliation 1-to-N, integrasi V-Claim/E-Klaim Kemenkes, banding/dispute workflow), modul **Klaim DIPISAH** dari billing:
>
> | Tetap di `/ehis-billing` | Pindah ke `/ehis-eklaim` |
> |---|---|
> | Tagihan board + Invoice detail | Klaim board (cross-invoice) |
> | Rincian charge + Pembayaran | Berkas generator + Submission batch |
> | Refund + Adjustment | INA-CBG Calculator + Grouper |
> | Kasir shift + Counter | Banding/Dispute workflow |
> | Cetak struk + Kwitansi | Reconciliation transfer BPJS |
> | Klaim status **read-only chip** (BL2.4-lite) | Dashboard analytics klaim |
>
> **Cross-link**: Invoice detail → tab Klaim → tombol "Buka di E-Klaim" deep link ke `/ehis-eklaim/klaim/[claimId]`. `ClaimRecord` single source di-host di `/ehis-eklaim`, billing read-only cache.

---

## 📌 Konteks Singkat

**Billing Kasir** = hilir keuangan dari semua modul klinis. Setiap pelayanan yang sudah `Selesai` di IGD/RI/RJ/Farmasi/Lab/Rad menjadi *charge line* di tagihan kunjungan. Kasir merangkum, menerapkan tarif master (per-penjamin × kelas), menerima pembayaran/deposit, dan menutup klaim BPJS/Asuransi.

**Status hari ini** (frontend):
- ✅ Master Tarif `/ehis-master/tarif` lengkap (`TARIF_MOCK`, 18+ entri × 8 kategori) + `PaketLayanan`.
- ✅ Master Penjamin `/ehis-master/penjamin` (`PENJAMIN_MOCK`, 6 penjamin × 4 tipe) + `KELAS_LIST` 7 kelas.
- ✅ Mapping Tarif (`/ehis-master/mapping?sub=tarif`) — matrix `penjamin × tindakan × kelas → harga` 1470+ cell.
- ✅ Mapping Formularium — `penjamin × obat × kelas → { allowed, alasan? }` untuk gating obat saat dispensing.
- ✅ Types di [data.ts:769-815](src/lib/data.ts#L769-L815) — `BillingRecord`, `ItemTagihan`, `DepositRecord`, `KasirData`, `StatusTagihan`, `MetodeBayar`, `KategoriItem`.
- ✅ Mock seed di `patientMasterData[RM-2025-005]` — 3 invoice + KasirData detail (14 items + 2 deposits).
- ✅ Nav `billingNav` di [navigation.ts:260-272](src/lib/navigation.ts#L260-L272) — Beranda + Tagihan + Pembayaran.
- ❌ UI: hanya placeholder amber card.
- ❌ Charge ingestion: belum ada wiring dari `ORDERS_MOCK`/Resep/Tindakan ke tagihan.

**Prinsip arsitektur** (sebelum coding):
1. **Charge-driven, bukan input manual** — setiap item tagihan **harus** ada `sourceRef` ke event klinis (orderId, resepId, tindakanId, dischargeId, kunjunganId). Kasir = aggregator, bukan re-entry.
2. **Mock-first → swap pattern** — schema 1:1 dengan target Prisma `Invoice`/`Charge`/`Payment`/`Claim` tables. Sama seperti pola Master Phase 0–3.
3. **Mapping Hub adalah source-of-truth harga** — `getTarif(penjaminId, tindakanId, kelasId)` dari Tarif Matrix; jangan duplikasi base price di Billing.
4. **State workflow eksplisit** — `Draft → Final → Sent_to_Claim | Paid | Partial | Refund`. Setiap transisi audit-trail.
5. **No long-scroll** — Detail tagihan split 4-tab (Rincian · Pembayaran · Klaim · Riwayat).
6. **Density tokens `m-*`** wajib untuk tabel rincian charge (banyak baris, perlu compact).
7. **Accent module = amber** (sudah dipakai di scaffold + sidebar icon `Receipt`/`Wallet`).
8. **Compliance**: PMK 76/2016 (INA-CBG), PMK 64/2016 (tarif), Permendagri 27/2013 (BLUD), UU PDP no.27/2022 (audit trail finansial).

---

## Phase BL0 — Foundation & Data Contracts

**Effort:** 3-4 hari · **ROI:** semua fase berikut bisa paralel, schema stabil

### BL0.1 Extend types di [data.ts](src/lib/data.ts)

- [ ] **`BillingRecord` extend** — tambah field:
  - `kelas?: KelasRawat` (untuk INA-CBG grouping)
  - `inaCbgCode?: string` + `inaCbgTarif?: number` (auto-derive dari ICD-10/ICD-9 + LOS + kelas)
  - `tarifJaminan?: number` (jumlah ditanggung penjamin)
  - `tarifPasien?: number` (selisih ditanggung pasien — naik kelas, non-cover, dll)
  - `ppn?: number` · `diskon?: number` · `materai?: number`
  - `statusKlaim?: "Belum Submit" | "Submitted" | "Pending" | "Approved" | "Rejected" | "Paid"`
  - `noSEP?: string` (BPJS Surat Eligibilitas Pasien)
  - `createdBy: string` · `createdAt: string` · `finalizedAt?: string` · `finalizedBy?: string`
- [ ] **`ItemTagihan` extend** — tambah:
  - `sourceModul: "IGD" | "RI" | "RJ" | "Farmasi" | "Lab" | "Rad" | "Akomodasi" | "Adjustment"`
  - `sourceRef: string` (orderId / resepItemId / tindakanId / hariRawatId)
  - `tarifMasterId?: string` (link ke `TarifRecord.id`)
  - `coverage: "Penjamin" | "Pasien" | "Mixed"` — derived dari formularium/tarif matrix
  - `diskonItem?: number` · `alasanDiskon?: string`
  - `voided?: boolean` · `voidedReason?: string` · `voidedBy?: string` · `voidedAt?: string`
- [ ] **`DepositRecord` extend** — tambah:
  - `kasirShiftId: string` (link ke buka/tutup shift)
  - `noKwitansi: string` (auto-generate `KW/YYYY/MM/NNNNN`)
  - `bukti?: string` (URL foto struk transfer, optional)
  - `refundOf?: string` (jika ini refund dari deposit lain)

### BL0.2 Tambah types baru

- [ ] **`ClaimRecord`** — tracking siklus klaim ke BPJS/Asuransi:
  ```ts
  {
    id, noKlaim, billingId, penjaminId,
    submittedAt?, submittedBy?,
    inaCbgCode?, inaCbgTarif?,
    diagnosaPrimer: string, diagnosaSekunder: string[],
    tindakanIcd9: string[], los?: number, kelas: KelasRawat,
    statusPenjamin: "Pending" | "Approved" | "Rejected" | "Paid",
    nominalDisetujui?: number, alasanRejection?: string,
    catatan?: string,
  }
  ```
- [ ] **`KasirShift`** — open/close shift counter:
  ```ts
  {
    id, kasirNama, counter: "Kasir-1" | "Kasir-2" | ...,
    bukaAt, bukaSaldoAwal,
    tutupAt?, tutupSaldoAkhir?,
    totalTunai, totalTransfer, totalQris, totalEdc,
    selisih?: number, // tutupSaldoAkhir - (bukaSaldoAwal + totalTunai)
    status: "Open" | "Closed",
  }
  ```
- [ ] **`AdjustmentRecord`** — diskon/pembebasan/write-off:
  ```ts
  {
    id, billingId, jenis: "Diskon" | "Pembebasan" | "Write-off" | "Refund",
    nominal, alasan, requestedBy, approvedBy?, approvedAt?,
    status: "Pending" | "Approved" | "Rejected",
  }
  ```
- [ ] **`StatusTagihan`** — extend dari current `"Lunas" | "Belum Lunas" | "Proses Klaim" | "Ditanggung"` jadi lebih granular:
  ```ts
  "Draft" | "Final" | "Lunas" | "Lunas Sebagian" | "Belum Lunas"
  | "Proses Klaim" | "Klaim Disetujui" | "Klaim Ditolak"
  | "Refund" | "Void"
  ```
  Backward-compat: alias lama tetap diterima saat migrasi.

### BL0.3 Helpers shared di `src/lib/billing/`

- [ ] **`billing/hargaResolver.ts`** — `getHargaTindakan(tindakanId, penjaminId, kelasId)` → query `TarifMap` dari Mapping Hub; fallback ke `TarifRecord.tarifUmum`/`tarifBPJS`/`tarifAsuransi` jika cell kosong.
- [ ] **`billing/hargaObat.ts`** — `getHargaObat(obatId, qty, penjaminId, kelasId)` → cek `FormulariumMap[penjamin][obat][kelas].allowed`; jika `false` → coverage = "Pasien"; else → coverage = "Penjamin".
- [ ] **`billing/inaCbgResolver.ts`** — stub fungsi `resolveInaCbg(diagnosaList, tindakanList, kelas, los) → { code, tarif }`. Mock pakai lookup table sederhana (10 INA-CBG paling umum) sampai backend ready.
- [ ] **`billing/invoiceCalc.ts`** — pure functions:
  - `subTotal(items)` · `totalDiskon(items, billDiskon)` · `totalPpn(subtotal, ppnPct)` · `grandTotal(...)` · `sisaTagihan(grand, dibayar)` · `saldoDeposit(deposits)` · `balanceColor(sisa)`
- [ ] **`billing/sourceAdapter.ts`** — adapter untuk pull charge dari modul lain:
  - `chargeFromOrder(order, penjaminId, kelasId): ItemTagihan[]`
  - `chargeFromResep(resepItem, penjaminId, kelasId): ItemTagihan`
  - `chargeFromTindakan(tindakanEntry, penjaminId, kelasId): ItemTagihan`
  - `chargeFromAkomodasi(kunjunganRI, tanggalRange): ItemTagihan[]` (per-hari)
  - `chargeFromJasaDokter(cpptEntry | konsultasi): ItemTagihan`
- [ ] **`billing/billingStore.ts`** — client store untuk draft invoice + transaksi sementara (mirror pattern `workflowStore`).

### BL0.4 Mock seed

- [ ] **Expand `KasirData` mock** di [data.ts](src/lib/data.ts) ke 5–6 pasien lintas unit:
  - `RM-2025-005` (Joko Prasetyo IGD BPJS — sudah ada)
  - `RM-2025-003` (Pasien GJK RI BPJS Kelas 2 — 5 hari rawat, multi-charge lab/rad/farmasi)
  - `RM-2025-007` (Pasien Syok Sepsis ICU BPJS — non-coverage premium tertentu)
  - `RM-2025-012` (Siti Rahayu IGD Umum — pembayaran tunai langsung)
  - 1 RJ Umum + 1 RJ BPJS dengan konsultasi + resep ringan
- [ ] **`BILLING_BOARD_MOCK`** — denormalized list semua tagihan lintas pasien untuk worklist (dengan field summary: pasien, kunjungan, unit, penjamin, total, sisa, status).
- [ ] **`KLAIM_BOARD_MOCK`** — list `ClaimRecord` untuk Klaim BPJS dashboard.
- [ ] **`KASIR_SHIFT_MOCK`** — 2–3 entri shift Open + Closed untuk demo tutup kas.
- [ ] **`INA_CBG_LOOKUP_MOCK`** — 10–20 paling umum (I-1-01-I akut MI, I-4-10-I gagal jantung, dll).

**Acceptance BL0:** semua types compile clean, mock siap dipakai 5+ pasien, helpers `getHargaTindakan` / `getHargaObat` return value benar untuk kombinasi BPJS/Umum/Asuransi × kelas, `invoiceCalc` unit-coverable.

---

## Phase BL1 — Tagihan Board (Worklist)

**Route:** `/ehis-billing/tagihan` · **Effort:** 3–4 hari · **Konsumen:** Kasir, Admin Billing, Direksi
**Accent:** amber · **Pattern reference:** Farmasi Board + Lab Board

### BL1.1 Layout & Filter ✅ Selesai (2026-05-24)

- [x] **Header strip** ✅ — 4 KPI Card lintas tone amber/rose/sky/emerald di [TagihanKPIStrip.tsx](src/components/billing/tagihan/TagihanKPIStrip.tsx):
  - "Tagihan Hari Ini" amber (count + total Rp + trend chip)
  - "Outstanding" rose (total + count tagihan + trend > 7 hari)
  - "Klaim Pending" sky (count + total menunggu)
  - "Pendapatan Hari Ini" emerald (total + count transaksi + trend % vs avg)
  - Setiap card: accent bar gradient kiri + icon ring + value besar (22px bold tone-text) + sub-label + trend chip (TrendingUp/Down/Flat). Hover translate-y-[-2px] + shadow-md.
- [x] **Filter Panel kiri 300px sticky** ✅ — [TagihanFilterPanel.tsx](src/components/billing/tagihan/TagihanFilterPanel.tsx):
  - Header dengan badge "X filter aktif" + reset link
  - Section 1 — **Pencarian**: SearchInput icon-prefixed, text-slate-800, max-w full panel, clear-X button conditional
  - Section 2 — **Periode**: 5 preset chip (Hari Ini / 7 Hari / 30 Hari / Bulan Ini / Kustom). Kustom expand 2 date inputs (max-w-[130px] each) animated height
  - Section 3 — **Unit**: 6 chip multi-select (IGD/RJ/RI/Lab/Rad/Farmasi) dengan icon + warna per unit (rose/sky/teal/amber/pink/emerald)
  - Section 4 — **Penjamin**: native select styled (max-w-[260px], custom SVG chevron, text-slate-800)
  - Section 5 — **Kelas**: 7 chip square (VIP/K1/K2/K3/ICU/HCU/RJ) min-w-[42px] center
  - Section 6 — **Status**: 10 chip multi-select dengan dot + icon + tone per status (emerald lunas / rose belum-lunas / amber proses / sky submitted / dst)
  - Footer dengan count aktif + reset button (disabled jika 0 aktif)
  - **Internal scroll** body — page tidak long-scroll
- [x] **Quick Tabs + Density Toggle** ✅ — [TagihanWorkspaceShell.tsx](src/components/billing/tagihan/TagihanWorkspaceShell.tsx):
  - 5 quick tab (Semua/Draft/Belum Lunas/Klaim Pending/Hari Ini) dengan count badge mono + animated underline `motion.layoutId` antar tab
  - Density toggle 3-pos (Compact/Comfortable/Cozy) icon-only segmented control
- [x] **Hero Header** ✅ — [TagihanHero.tsx](src/components/billing/tagihan/TagihanHero.tsx): eyebrow chip + h1 + desc + timestamp pill + "Buat Tagihan" CTA amber (group hover Plus rotate-90)
- [x] **Orchestrator** ✅ — [TagihanBoardPage.tsx](src/components/billing/tagihan/TagihanBoardPage.tsx): useSkeletonDelay(500), AnimatePresence fade, grid 2-panel `[300px_minmax(0,1fr)]`, max-h calc viewport untuk no long-scroll
- [x] **Route entry** ✅ — [app/ehis-billing/tagihan/page.tsx](src/app/ehis-billing/tagihan/page.tsx) thin import
- [x] **Shared types & configs** ✅ — [tagihanShared.ts](src/components/billing/tagihan/tagihanShared.ts): `TagihanFilterState`, `defaultFilters()`, `applyPeriodePreset()`, `countActiveFilters()`, `UNIT_CFG`/`KELAS_CFG`/`STATUS_CFG`/`KPI_MOCK`/`KPI_TONE`
- [x] **Workspace placeholder** ✅ — gradient amber dashed border + icon ring + "Snapshot Filter Aktif" card grid 2-col yang reflect filter state real-time. Siap diganti dengan `TagihanTable` di BL1.2.

**File sizes:** Shared 200L · Hero 50L · KPI 85L · Filter 280L · Workspace 240L · Board 110L · Route 8L. Semua jauh di bawah 800 limit. TS clean.

**Design decisions:**
- **Accent module amber** lintas semua surface — konsisten dengan icon nav `Receipt`/`Wallet`.
- **No indigo/violet** — palette: amber primary · rose/emerald/sky/teal sebagai semantic tone · slate neutral.
- **Form fields dark text** (`text-slate-800`), label uppercase muted (`text-slate-500` 10.5px tracking-wider).
- **Form max-width capped**: search panel-fluid, select 260px, date 130px — tidak ada field selebar layar.
- **No long-scroll**: outer page `min-h-0 flex-col`, kedua panel `max-h-[calc(100vh-340px)]`, internal `overflow-y-auto`.
- **Animations**: skeleton 500ms · KPI stagger 40ms · chip active-scale 0.97 · hover translate-y · framer motion `layoutId` underline tab.

### BL1.2 Tabel Worklist ✅ Selesai (2026-05-24)

- [x] **Sticky-header table** ✅ — [TagihanTable.tsx](src/components/billing/tagihan/parts/TagihanTable.tsx) 10 kolom:
  - Checkbox (bulk select dengan indeterminate state untuk select-all)
  - **No Tagihan + Tanggal** (mono · `formatTanggalShort` "24 Mei · 13:45" + tooltip `formatTanggalFull`)
  - **Pasien** (nama bold + noRM mono · gender · age sub-line)
  - **Unit · Kelas** (chip per UNIT_CFG dengan icon + dot · kelas short chip)
  - **Penjamin** (badge `PENJAMIN_CFG` 4-tipe: slate/emerald/sky/amber · hide-on lg)
  - **Total** (right-align tabular-nums · `fmtRupiahShort` bold + `fmtRupiah` micro tooltip)
  - **Dibayar** (subtle gray "—" jika 0 · hide-on lg)
  - **Sisa** (color: emerald "Lunas" jika 0 · rose normal · rose-700 jika >5jt)
  - **Status** (chip dari `STATUS_CFG` dengan icon + dot per 10 status)
  - **Aksi** (kebab `MoreVertical` → dropdown menu)
- [x] **Sort dinamis** ✅ — 6 kolom sortable (No Tagihan/Tanggal via Pasien/Total/Dibayar/Sisa/Status) dengan `cycleSort` 3-state (asc → desc → off). Visual: `ChevronUp/Down` saat sorted + `ChevronsUpDown` muted saat idle. Default `tanggal desc`.
- [x] **Bulk-select + bulk-action bar** ✅ — header checkbox indeterminate + per-row checkbox. Saat selected >0 muncul amber action bar dengan summary (count · total · sisa) + button **Print Batch** / **Submit Klaim** (primary amber) / **Batal**.
- [x] **Density-aware row** ✅ — [TagihanRow.tsx](src/components/billing/tagihan/parts/TagihanRow.tsx) `DENSITY_CFG`: compact (py-2 · 11.5px) · comfortable (py-2.5 · 12.5px) · cozy (py-3.5 · 13px). Row stagger animation max 0.3s (clamp untuk perf).
- [x] **Row interactivity** ✅ — hover bg-slate-50/80, selected row tinted amber-50/60, click row → callback `handleOpenDetail` (log untuk BL2 yang belum dibangun). Checkbox & kebab `e.stopPropagation()` agar tidak trigger row click.
- [x] **Kebab actions menu** ✅ — [TagihanRowActions.tsx](src/components/billing/tagihan/parts/TagihanRowActions.tsx) dropdown 5 aksi: Lihat Detail · Buka Kunjungan · Cetak Struk · Refund · Void (danger rose dengan top-divider). Per-action `disabledIf` conditional (Print disabled jika Draft/Void · Refund disabled jika dibayar=0 · Void disabled jika sudah Lunas/Approved). Outside-click + ESC close.
- [x] **Empty state amber** ✅ — [TagihanEmptyState.tsx](src/components/billing/tagihan/parts/TagihanEmptyState.tsx) spring-in animated `SearchX` icon dalam amber ring + copy berbeda saat hasActiveFilters vs initial empty + CTA "Reset semua filter".
- [x] **Footer summary** ✅ — di bawah tabel: count rows + density label + Total Rp + Sisa Rp (emerald jika 0, rose jika >0). Mono font.
- [x] **Filter + Sort logic terpisah** ✅ — [tagihanBoardLogic.ts](src/components/billing/tagihan/tagihanBoardLogic.ts) pure functions: `applyFilters` (search/periode/unit/kelas/penjamin/status/quickTab) · `applySort` · `cycleSort` · helpers `formatRelativeId`/`formatTanggalShort`/`formatTanggalFull`. Zero React state — testable.
- [x] **Mock data** ✅ — [tagihanBoardMock.ts](src/lib/billing/tagihanBoardMock.ts) `TAGIHAN_BOARD_MOCK` 25 invoice lintas 6 unit × 4 tipe penjamin × 7 kelas × 10 status, distribusi tanggal 2026-04-28 → 2026-05-24 (range 26 hari). Type `PenjaminTipeRow = Exclude<PenjaminFilter, "all">` exclude sentinel filter.
- [x] **Responsive column hide** ✅ — Penjamin + Dibayar `hidden lg:table-cell` saat viewport <1024px untuk hindari overflow horizontal.
- [x] **Workspace integration** ✅ — `TagihanWorkspaceShell.tsx` swap placeholder → `<TagihanTable />`, dead-code `WorkspacePlaceholder` + helpers dibersihkan. Sticky-header bekerja relatif terhadap workspace internal scroll container — page tidak long-scroll.

**File sizes:** Mock 200L · Logic 110L · Table 280L · Row 175L · RowActions 130L · EmptyState 50L. Total BL1.2: 945L lintas 6 file, semua jauh di bawah 800 limit. TS clean.

**Design decisions:**
- **Mono font + tabular-nums** untuk semua kolom numerik (Total/Dibayar/Sisa/noTagihan) — alignment angka rapi.
- **Sub-line pattern** (nama + RM kecil di bawah) memungkinkan compact density tetap informatif tanpa truncate.
- **Sort cycle 3-state** (asc → desc → off) lebih ergonomis dari 2-state — user bisa kembali ke default tanpa reset filter.
- **Bulk-action bar conditional** muncul/hide animated — tidak permanent space yang membuat layout shift.
- **Kebab dengan disabledIf rule** mencerminkan business logic (no print untuk Draft, no refund tanpa pembayaran) — guard kesalahan kasir.
- **Penjamin tone selaras** dengan `PENJAMIN_TIPE_CFG` di master penjamin → konsistensi cross-modul saat Tagihan Board ↔ Master.

### BL1.3 Bulk actions ✅ Selesai (2026-05-24)

- [x] **Selection checkbox** ✅ — header indeterminate + per-row (sudah ada dari BL1.2, tetap berlaku).
- [x] **Bulk action bar** dipisah ke component [TagihanBulkBar.tsx](src/components/billing/tagihan/parts/TagihanBulkBar.tsx) (~140L) — slide-down animasi via framer `motion.div` (opacity + y-4 → 0, 180ms easeOut). Conditional render saat `selected.size > 0`, tidak meninggalkan layout-shift.
- [x] **3 aksi + eligibility rules** ✅:
  - **Print Batch** — eligibility: `status !== "Draft" && status !== "Void"` (Draft belum punya konten dicetak; Void = soft-deleted)
  - **Export Excel** — selalu eligible (semua row bisa diexport ke CSV) → wire ke `exportTagihanCsv` di logic file → trigger browser download `.csv` dengan BOM UTF-8 (Excel-compatible), nama file otomatis `tagihan-YYYY-MM-DD.csv`
  - **Submit Klaim** — eligibility: `penjamin.tipe !== "umum" && status ∈ {Final, Belum Lunas, Lunas Sebagian, Klaim Ditolak}` — Umum tidak butuh klaim, status final/rejected boleh resubmit
- [x] **Eligibility badge** ✅ — saat partial eligibility (mis. selected 5 row tapi cuma 3 yang valid untuk klaim) muncul mini badge mono "3/5" di tombol — UX feedback transparent berapa yang akan diproses tanpa bikin user kaget.
- [x] **Disabled state** ✅ — tombol disabled + opacity-50 + cursor-not-allowed + tooltip hint per rule ("Pilih minimal 1 tagihan penjamin BPJS/Asuransi/Jamkesda dengan status Final / Belum Lunas / Klaim Ditolak").
- [x] **Summary inline** ✅ — count "N tagihan dipilih" dengan badge bulat + sub-info Total/Sisa (mono, sisa rose/emerald sesuai 0-or-positif), hide pada mobile (`hidden sm:inline`) untuk hemat ruang.
- [x] **Batal pilihan icon-only** ✅ — ganti tombol text "Batal" → IconButton `X` 7×7 di paling kanan, lebih compact + selaras pattern dismiss.
- [x] **Handler stub di TagihanTable** ✅ — `handlePrintBatch`/`handleSubmitKlaim` log ke console (real wiring di BL2.6 print modal + BL4.1 klaim batch); `handleExportExcel` real-execute via `exportTagihanCsv`.

### BL1.4 Quick views ✅ Selesai (2026-05-24)

- [x] **Tab pre-filter** ✅ — sudah ada dari BL1.1 di [TagihanWorkspaceShell.tsx](src/components/billing/tagihan/TagihanWorkspaceShell.tsx), 5 tab: Semua · Draft · Belum Lunas · Klaim Pending · Hari Ini.
- [x] **Count dinamis (after-filter aware)** ✅ — sebelumnya hardcoded di `QUICK_TABS.count` — sekarang dihitung real-time via `computeQuickTabCounts(TAGIHAN_BOARD_MOCK, filters)` di [tagihanBoardLogic.ts](src/components/billing/tagihan/tagihanBoardLogic.ts). Memo dep: semua filter field kecuali `quickTab` dan `density`. Count mereflect "jika klik tab ini, dapat berapa row" — UX honest, bukan global counter.
- [x] **`applyFiltersExceptQuickTab` helper** ✅ — refactor `applyFilters` extract `passesCoreFilters` shared, hindari duplikasi logic search/periode/unit/kelas/penjamin/status.
- [x] **Empty-state visual untuk count=0** ✅ — tab dengan count 0 (filter kombinasi tidak match): opacity-55 + badge muted dengan ring slate-100 + tooltip "Tidak ada tagihan 'X' pada filter saat ini". Tab masih clickable (user bisa lihat empty state table).
- [x] **`QUICK_TABS` data shape cleanup** ✅ — hapus field `count` hardcoded, sisakan `{ value, label }` only — count sekarang single-source-of-truth dari computed function.
- [x] **Quick tab rule (logic)** ✅ — sudah ada di `matchesQuickTab`:
  - **Semua**: pass-through
  - **Draft**: `status === "Draft"`
  - **Belum Lunas**: `status === "Belum Lunas" || status === "Lunas Sebagian"` (gabung partial)
  - **Klaim Pending**: `status === "Proses Klaim"`
  - **Hari Ini**: `tanggalISO.startsWith(today)`

**File sizes BL1.3 + BL1.4:** BulkBar baru 140L · Logic +60L (counts + applyFiltersExceptQuickTab + exportTagihanCsv) · WorkspaceShell +20L (memo + isEmpty styling) · Table -25L (inline BulkBar removed). Total tetap jauh di bawah 800 limit per-file. TS clean.

**Design decisions:**
- **Eligibility rules built-in** (bukan post-confirmation) — kurangi cognitive load kasir, langsung "apa yang valid untuk action ini".
- **Partial-count badge "3/5"** lebih jujur dari sekadar disabled / full-execute — user tahu persis berapa yang akan terproses.
- **CSV (bukan XLSX) sebagai stub Export Excel** — XLSX butuh lib eksternal (`xlsx` ~400KB), CSV native browser + BOM UTF-8 sudah dibuka Excel dengan benar (Rupiah/unicode aman). Swap ke `xlsx` lib di BL9 jika user request format native.
- **Count dinamis after-filter** lebih informatif dari count global — kalau user sudah filter `unit: IGD`, count tab "Draft" harus mereflect "berapa Draft di IGD" (bukan total semua Draft).
- **count=0 tab tidak dinonaktifkan** (tetap clickable) — agar user bisa lihat empty state friendly dengan CTA reset, lebih intuitif dari tombol mati.

**Acceptance BL1 ✅:** worklist tampil 25 tagihan demo lintas 6 unit × 4 tipe penjamin × 7 kelas × 10 status, filter & search real-time, sort 3-state per-kolom, bulk select dengan 3 aksi (Print/Export/Submit Klaim) + eligibility rules + disabled tooltip, quick-tab dengan count after-filter aware, click row → log handler ready untuk BL2 wiring.

---

## Phase BL2 — Invoice Detail (4-tab per kunjungan)

**Route:** `/ehis-billing/tagihan/[id]` · **Effort:** 5–6 hari · **Konsumen:** Kasir, Admin Billing
**Pattern reference:** Farmasi OrderDetail 5-tab + Pasien Pulang RI

### BL2.1 Header pasien (banner) ✅ Selesai (2026-05-24)

- [x] **`PatientBannerBilling`** ✅ — [PatientBannerBilling.tsx](src/components/billing/invoice/PatientBannerBilling.tsx) (205L):
  - Breadcrumb "← Tagihan Board" + noTagihan mono di kanan
  - Avatar bulat dengan gradien amber-100→amber-200, initial 2-letter dari nama
  - Identity row: nama bold + `BadgeCheck` verified chip emerald + gender/usia/noRM mono
  - Chips strip: Unit (via UNIT_CFG cross-modul) + Kelas + Penjamin nama + SEP (`ShieldCheck` icon sky)
  - Meta line: tanggal long format · DPJP · noKunjungan mono
  - Status chip besar di kanan dengan spring entrance + STATUS_BANNER_CFG (10 status mapped)
  - Quick actions: **Print Struk** (always) · **Submit Klaim** (hide if Umum) · **Refund** (hide if dibayar=0) — primary Submit Klaim amber
- [x] **Status timeline mini horizontal** ✅ — [InvoiceStatusTimeline.tsx](src/components/billing/invoice/InvoiceStatusTimeline.tsx) (110L):
  - 4-step: Draft → Final → Klaim → Selesai (label dinamis per status)
  - Dot 6×6 dengan icon, animated stagger (0.06s delay per step, spring stiffness 380)
  - Connector line: gray default, animated emerald sweep saat next step done (scaleX 0→1, 400ms)
  - Current step: animated ripple pulse `motion.span` 1.4s loop
  - Tiap step: label semibold + timestamp+actor compact `id-ID` format, atau italic hint detail
  - Horizontal-scroll friendly (`overflow-x-auto`)

### BL2.2 Tab 1: Rincian Charge ✅ Selesai (2026-05-24)

- [x] **Group by kategori (7 kategori)** ✅ — [ChargeCategorySection.tsx](src/components/billing/invoice/tabs/ChargeCategorySection.tsx) (157L):
  - Collapsible section dengan AnimatePresence (height 0↔auto, 180ms easeOut)
  - Header: chevron rotate, ikon kategori dalam ring (per KATEGORI_CFG: teal/sky/amber/pink/emerald/rose/slate), label + count + subtotal mono kanan
  - Default open: Akomodasi · Tindakan · Lab (3 paling sering dibutuhkan); lainnya collapsed
  - Voided items: badge "N void" di header + toggle Eye/EyeOff "Tampilkan/Sembunyikan voided" di footer section
  - Empty kategori auto-skip (tidak render section kosong)
- [x] **Row item full kolom** ✅ — [ChargeRow.tsx](src/components/billing/invoice/tabs/ChargeRow.tsx) (223L) 8 kolom:
  - **Tgl** (mono `id-ID` short)
  - **Item** (semibold + `ExternalLink` ikon kecil → open source · "Voided: reason" italic rose · "Diskon -Rp X · alasan" italic emerald jika ada)
  - **Source** (badge per SOURCE_BADGE_TONE 8 modul)
  - **Qty + satuan** (tabular-nums)
  - **Harga satuan** (mono)
  - **Subtotal** (mono bold — voided: strikethrough; diskon: stacked gross strikethrough atas + net bold bawah)
  - **Coverage** (chip COVERAGE_CFG 3-tipe: Penjamin emerald / Pasien amber / Mixed sky)
  - **Aksi** (kebab `MoreVertical` 7×7 → dropdown: Apply Diskon · Detail Source · divider · Void Item rose; jika voided: hanya Pulihkan)
  - Kebab: outside-click + ESC close, `e.stopPropagation()` hindari row-click
- [x] **Sticky footer totals** ✅ — [ChargeStickyFooter.tsx](src/components/billing/invoice/tabs/ChargeStickyFooter.tsx) (147L):
  - Breakdown row atas: Subtotal Items · Diskon Item · Diskon Invoice · PPN · Materai (conditional render, hidden jika 0)
  - Main totals row: **Grand Total** amber + **Saldo Deposit** sky + **Sisa Tagihan** (emerald jika Lunas, rose jika belum) — 3 totals dengan icon-ring + label uppercase + value besar mono bold
  - Actions kanan: **Diskon Invoice** outline + **Finalize** primary (hanya tampil saat status=Draft)
  - Sticky `bottom-0 z-10` dengan `backdrop-blur-md` dalam scroll container — tidak menutupi konten
  - Animasi mount: slide-up 20px + fade (250ms easeOut)
- [x] **Coverage breakdown banner** ✅ — di atas list section (di RincianChargeTab):
  - Stacked bar 3-segment (emerald Penjamin / sky Mixed / amber Pasien) dengan width % proporsional
  - Legend 3-col dengan dot + label + nominal + persen
  - Hide Mixed legend jika 0 — clean layout
- [x] **Modal: Tambah Item** ✅ — [AddItemModal.tsx](src/components/billing/invoice/modals/AddItemModal.tsx) (314L, termasuk shared modal pieces):
  - Form: Kategori (select) · Nama · Qty + Satuan (2-col) · Harga + Coverage (2-col) · Alasan (textarea)
  - Validation: nama wajib, qty/harga > 0, alasan wajib jika kategori "Lain-lain" (audit trail)
  - Live preview subtotal mono amber besar
  - Export `ModalShell` + `Field` + `ModalFooter` + `inputCn` + `selectCn` untuk reuse oleh modal lain
  - Inputs pakai text-slate-800 (dark text per preferensi), focus ring amber
- [x] **Modal: Apply Diskon** ✅ — [DiskonItemModal.tsx](src/components/billing/invoice/modals/DiskonItemModal.tsx) (193L):
  - Item context card menampilkan nama + qty×harga + subtotal
  - Mode toggle Rupiah ↔ Persen (segmented control bg-slate-100)
  - Validation: > 0, nominal ≤ gross, persen ≤ 100, alasan wajib
  - Preview grid 3-col: Gross / Diskon (emerald) / Net (amber bold besar)
- [x] **Modal: Void Item** ✅ — [VoidItemModal.tsx](src/components/billing/invoice/modals/VoidItemModal.tsx) (104L):
  - Warning banner rose dengan AlertTriangle ikon — explain konsekuensi + reassure recoverable
  - Item context dengan subtotal strikethrough rose
  - Reason textarea min 5 char (audit trail) + autofocus
  - Primary button danger rose
- [x] **State lifting + handlers di orchestrator** ✅ — [InvoiceDetailPage.tsx](src/components/billing/invoice/InvoiceDetailPage.tsx) (236L):
  - `addItem` / `applyDiskon` / `voidItem` / `unvoidItem` mutate detail state setState immutable
  - Modal state `modal: "add" | "diskon" | "void" | null` + `targetItem` + `addKategori`
  - `handleItemAction` dispatcher dari kebab → modal mana yang dibuka
  - `useSkeletonDelay(400)` + AnimatePresence fade
- [x] **`InvoiceTabs` nav 4-tab** ✅ — [InvoiceTabs.tsx](src/components/billing/invoice/InvoiceTabs.tsx) (82L):
  - 4 tab: Rincian (itemCount badge) · Pembayaran · Klaim (hide untuk Umum) · Riwayat
  - Active tab: ring-1, underline `motion.layoutId` antar tab, icon ikut warna
  - Tab Pembayaran/Klaim/Riwayat tampil `TabPlaceholder` dengan ikon Construction + hint ke BL2.3/2.4/2.5
- [x] **Pure calc helpers** ✅ — [src/lib/billing/invoiceCalc.ts](src/lib/billing/invoiceCalc.ts) (97L):
  - `rowSubtotal` / `rowGross` / `totalGross` / `totalDiskonItem` / `netAfterItemDiskon`
  - `ppnAmount` / `grandTotal` / `sisaTagihan` / `saldoDeposit`
  - `groupByKategori` (return KategoriSummary[] dengan voidedCount, ordered, skip empty)
  - `coverageBreakdown` (Penjamin/Pasien/Mixed nominal aggregation)
  - Pure functions, zero React state — testable
- [x] **Mock detail seed** ✅ — [invoiceMock.ts](src/components/billing/invoice/invoiceMock.ts) (231L):
  - **INV-001** Joko Prasetyo IGD BPJS K2: 14 items lintas 6 kategori, 1 item coverage Pasien (obat non-formularium), dibayar 500K dari grand 1.78jt + materai
  - **INV-009** Sutrisno Bagus ICU BPJS Non-PBI: 14 items lintas 6 kategori, 1 item diskon (Meropenem selisih kelas), diskon invoice 250K (kebijaksanaan direktur), dibayar 2jt
  - Schema 1:1 dengan target backend `Charge`/`Invoice` — swap query saja saat siap
- [x] **Navigation wiring** ✅ — `TagihanTable.handleOpenDetail` + kebab action `detail` `router.push("/ehis-billing/tagihan/[id]")`. Route entry [app/ehis-billing/tagihan/[id]/page.tsx](src/app/ehis-billing/tagihan/[id]/page.tsx) — async params (Next 16) + `notFound()` jika id tidak match.
- [ ] **Auto-pull dari `sourceAdapter` (BL6 dependency)** — saat tab dibuka, scan kunjungan terkait Lab/Rad/Farmasi/Tindakan/Akomodasi. **Sekarang masih manual mock seed** karena `sourceAdapter.ts` (BL0.3) belum dibangun. Pengganti: items diisi langsung di `invoiceMock.ts`, schema sudah siap `sourceRef` per item.
- [ ] **Auto-resolve harga (BL0 dependency)** — `getHargaTindakan`/`getHargaObat` belum ada. Sekarang harga hardcoded di mock — saat BL0.3 helpers ready, mock akan update untuk panggil resolver.

**File sizes BL2.1+2.2:** Shared 183L · Mock 231L · Calc 97L · Banner 205L · Timeline 110L · Tabs nav 82L · DetailPage 236L · RincianTab 178L · CategorySection 157L · Row 223L · StickyFooter 147L · AddModal 314L · DiskonModal 193L · VoidModal 104L · Route 12L. Total ~2470L lintas 15 file, semua jauh di bawah 800 limit. TS clean.

**Design decisions:**
- **State di-lift ke InvoiceDetailPage** (bukan Zustand/Context) — scope masih 1 page, useState cukup. Saat BL6 charge ingestion via WebSocket, akan migrate ke `billingStore`.
- **Modal pakai ModalShell shared component** dari AddItemModal — DRY: Field/ModalFooter/inputCn/selectCn juga di-export reuse oleh Diskon+Void modal. 3 modal jadi consistent (tombol Batal/Confirm, validasi error, escape close).
- **Coverage breakdown banner** sebagai infotainment di atas — bantu kasir/admin lihat distribusi tanpa buka tab Klaim.
- **Sticky footer dengan backdrop-blur** — totals selalu visible, scroll items panjang tidak loose context grand total.
- **Diskon per-item dengan mode toggle Rp/% + live preview** — UX dipermudah; angka diskon ter-clamp ke gross/100% otomatis.
- **Void = soft delete + toggle Tampilkan** — recoverable, audit-friendly. Bukan hard remove.
- **Manual add item alasan wajib kalau "Lain-lain"** — gating untuk audit (kategori known tidak butuh alasan; lain-lain harus dijustifikasi).
- **2-pasien mock detail** (BPJS IGD K2 + BPJS ICU) — cover 2 jenis pasien penting (single-day vs multi-day, K2 vs ICU, with/without diskon invoice).
- **Banner sticky tidak dipilih** untuk page ini — banner cukup kompak; scroll page bawa banner lewat. Tab nav yang menjadi anchor.

### BL2.3 Tab 2: Pembayaran ✅ Selesai (2026-05-24)

- [x] **Types extend** ✅ — `PaymentRecord`, `MetodeBayar` (5: Tunai/Transfer/QRIS/EDC/Voucher), `PaymentKategori` (Pembayaran/Deposit/Refund), `METODE_CFG` + `METODE_ORDER` di [invoiceShared.ts](src/components/billing/invoice/invoiceShared.ts). Field `payments[]` ditambahkan ke `InvoiceDetail`. `dibayar` jadi field cache untuk fallback header.
- [x] **Pure helpers** ✅ — [paymentCalc.ts](src/lib/billing/paymentCalc.ts) (101L): `totalDibayar` · `totalPembayaranGross` · `totalRefund` · `totalByMetode` (breakdown shift) · `countByKategori` · `nextNoKwitansi` (auto-gen `KW/YYYY/MM/NNNNN` sequential) · `refundedAmountFor` · `refundableAmount` (sisa yang masih bisa direfund) · `sortPaymentsDesc`. + [terbilang.ts](src/lib/billing/terbilang.ts) (71L): Indonesian number-to-words helper (seratus / seribu / sejuta / sebelas / setriliun handling).
- [x] **`invoiceCalc.ts` upgrade** ✅ — `saldoDeposit` + `sisaTagihan` sekarang derive dari `payments[]` jika tersedia; fallback ke `detail.dibayar`. Otomatis sync setelah add/refund/void payment.
- [x] **Mock seed extend** ✅ — INV-001: 1 deposit Tunai Rp 500K. INV-009: 3 payment (Deposit Transfer BCA Rp 1.5M + Pembayaran EDC Mandiri Rp 750K + Refund QRIS Rp 250K dengan `refundOf` linkage) — demonstrate full lifecycle dengan no kwitansi sequential.
- [x] **PaymentSummaryCard** ✅ — [PaymentSummaryCard.tsx](src/components/billing/invoice/tabs/payment/PaymentSummaryCard.tsx) (120L): 3 KPI card horizontal (Grand Total amber / Sudah Dibayar sky dengan animated progress bar % / Sisa Tagihan emerald-or-rose conditional). Accent stripe vertikal kiri + icon ring 9×9 + value mono bold 16-18px + stagger 50ms.
- [x] **PaymentForm** ✅ — [PaymentForm.tsx](src/components/billing/invoice/tabs/payment/PaymentForm.tsx) (354L):
  - Header dengan kasir session badge (mock `Sari (Kasir-1)` — backend session)
  - **Quick fill chips**: Lunasi Sisa (dengan Sparkles icon) · Setengah · 100rb · 500rb. Auto-disabled jika sisa ≤ 0.
  - **Metode segmented control 5-chip** dalam container bg-slate-50 dengan ring + bg-color per cfg saat active + hint micro-text di bawah
  - **Nominal input** large right-aligned mono 16px + live **terbilang preview** Indonesia italic
  - **Kategori toggle** Pembayaran ↔ Deposit (2-button)
  - **Conditional fields per metode**: Bank dropdown (BCA/Mandiri/BNI/BRI/BSI/CIMB) + No Referensi animated expand height (motion 180ms) — wajib untuk Transfer/EDC/QRIS
  - **Bukti upload stub** untuk Transfer/EDC — dashed border + Upload icon
  - **Catatan textarea** opsional 2 rows
  - **Validation real-time**: nominal > 0, nominal ≤ sisa (jika Pembayaran), noRef wajib untuk method tertentu, bank wajib untuk Transfer/EDC
  - **Submit button** full-width amber dengan emerald success state 1.2s setelah submit (justSubmitted flag)
- [x] **PaymentRow** ✅ — [PaymentRow.tsx](src/components/billing/invoice/tabs/payment/PaymentRow.tsx) (259L):
  - Grid 4-col: metode icon (9×9 ring) · main col · nominal · kebab
  - Main col: nama metode + badge Deposit/Refund + no kwitansi mono · meta-line (Clock+tanggal · kasir · bank · noRef) · catatan italic "" jika ada · "Refund dari kwitansi X" link tracker · "Void: reason" italic rose
  - Nominal: rose-untuk-refund (dengan prefix `−`) · strikethrough untuk voided · slate untuk normal
  - Voided row: bg-slate-50/60 + opacity-60 + strikethrough nama
  - **Kebab dropdown** 4-aksi: Cetak Kwitansi · Lihat Detail · divider · Refund Sebagian (hide jika sudah refund/voided) · Void Pembayaran (danger rose, hide jika voided). Outside-click + ESC close. Stop-propagation.
- [x] **PaymentHistoryList** ✅ — [PaymentHistoryList.tsx](src/components/billing/invoice/tabs/payment/PaymentHistoryList.tsx) (151L):
  - Header: ikon + label + count badge + total bersih mono di kanan
  - **Filter chip strip**: Semua / Pembayaran / Deposit / Refund / Voided — count per kategori dari `countByKategori`, empty chips disabled
  - Sorted desc by tanggalISO via `sortPaymentsDesc`
  - Map `byId` untuk row lookup "Refund dari kwitansi X"
  - Empty state: Inbox icon + copy berbeda untuk filter-empty vs initial-empty
  - Internal scroll (`overflow-y-auto`) — page tidak long-scroll
- [x] **PembayaranTab orchestrator** ✅ — [PembayaranTab.tsx](src/components/billing/invoice/tabs/PembayaranTab.tsx) (59L): grid `[380px_1fr]` lg-up, sticky-left form (`lg:sticky lg:top-2`) + history flex-1. Stacked vertical pada mobile. Internal scroll wrapper.
- [x] **RefundModal** ✅ — [RefundModal.tsx](src/components/billing/invoice/modals/RefundModal.tsx) (225L):
  - Source payment context card (icon + metode + nominal + kwitansi) + grid 2-col stat (Nominal Asli vs Sudah Direfund)
  - Nominal input + live terbilang
  - Quick chips: Maks / 50% / 25% dari `refundableAmount`
  - Metode pengembalian dropdown (4 metode, exclude Voucher)
  - Alasan textarea min 5 char
  - Preview banner orange "Refund yang akan dicatat −Rp X"
  - Validation: nominal > 0, ≤ refundable, alasan ≥ 5 char
  - Submit danger rose
- [x] **VoidPaymentModal** ✅ — [VoidPaymentModal.tsx](src/components/billing/invoice/modals/VoidPaymentModal.tsx) (118L):
  - Warning banner rose (AlertTriangle) — jelaskan konsekuensi + reassure recoverable via Audit (BL2.5)
  - Payment context dengan nominal strikethrough
  - Reason textarea autofocus min 5 char
  - Submit danger rose
- [x] **InvoiceDetailPage wiring** ✅ — handler `addPayment` (auto-generate noKwitansi via `nextNoKwitansi` + immutable concat), `refundPayment` (buat record baru dengan nominal negatif + `refundOf` + kategori "Refund"), `voidPayment` (mutate voided=true). `dibayar` field di-recompute setiap mutasi untuk sync header. Handler banner "Refund" sekarang switch tab ke pembayaran (bukan log).
- [x] **InvoiceTabs Pembayaran** ✅ — placeholder TabPlaceholder replaced dengan `<PembayaranTab />`. ModalKey extended jadi `"add" | "diskon" | "void" | "refund" | "void-payment" | null`.

**File sizes BL2.3:** SummaryCard 120L · Form 354L · Row 259L · HistoryList 151L · PembayaranTab 59L · RefundModal 225L · VoidPaymentModal 118L · paymentCalc 101L · terbilang 71L. Total ~1460L lintas 9 file, semua jauh di bawah 800 limit. TS clean (npx tsc --noEmit).

**Design decisions:**
- **Form di sticky-left, history di flex-right** — kasir bisa lihat history sambil isi form, tidak perlu scroll bolak-balik.
- **Quick fill "Lunasi Sisa"** dengan Sparkles icon — UX paling sering kasir mau lunasin penuh, kurangi typing.
- **Terbilang Indonesia live** — verbal alias guard kebiasaan kasir kerjasama "lima ratus ribu rupiah" — match terbilang dengan nominal.
- **Conditional fields per metode** (Bank+NoRef untuk Transfer/EDC, NoRef untuk QRIS) — tidak overwhelm dengan field tidak relevan untuk Tunai/Voucher.
- **Refund sebagai record baru dengan nominal negatif** (bukan mutate origin) — preserve audit trail asli. `refundOf` field track linkage untuk display "Refund dari kwitansi X".
- **Void = soft delete + tetap visible** dengan filter chip — bisa di-Unvoid di Audit Tab (BL2.5). Bukan hard delete.
- **No kwitansi sequential auto-generate** — scan max running number lalu +1 (mock); backend BL3 ganti DB sequence per shift.
- **`refundableAmount` helper** — bisa refund sebagian, lalu refund lagi sampai gross — UI Quick chip "Maks" reflect realtime.
- **`dibayar` field tetap di-cache di InvoiceDetail** — agar header banner & Rincian Sticky Footer tidak perlu loop payments setiap render. Sync via mutator.

### BL2.4 Tab 3: Klaim Status (read-only — lite) ✅ Selesai (2026-05-24)

> **Scope diciutkan.** Form Submit Klaim, INA-CBG Calculator, Berkas Generator, Banding workflow → **pindah ke `/ehis-eklaim`** (lihat [TODO-EKLAIM.md](TODO-EKLAIM.md) fase EK2-EK6). Tab di sini = **read-only info + deep link** untuk cross-modul awareness.

- [x] **Visible only untuk** penjamin BPJS/Asuransi/Jamkesda ✅ — sudah ada di [InvoiceTabs.tsx](src/components/billing/invoice/InvoiceTabs.tsx) via `hideForUmum: true`.
- [x] **Claim status card** ✅ — [ClaimStatusCard.tsx](src/components/billing/invoice/tabs/klaim/ClaimStatusCard.tsx) (166L):
  - Chip status besar dengan icon ring 12×12 spring entrance (6 status: Belum Submit / Pending Verifikasi / Approved / Rejected / Paid / Banding) dari `CLAIM_STATUS_CFG` di [claimReadCache.ts](src/lib/billing/claimReadCache.ts)
  - Right side: no klaim mono + ID internal (dl/dt/dd structure di slate-50 card)
  - Last update strip dengan Clock+timestamp + User+actor + MessageSquareText+note italic (jika ada)
  - **Conditional banners** per-status: Rejected → rose banner alasan · Approved → emerald banner nominalDisetujui · Banding → amber banner deadline
- [x] **INA-CBG resolved preview** ✅ — [InaCbgPreview.tsx](src/components/billing/invoice/tabs/klaim/InaCbgPreview.tsx) (164L):
  - 1-row card horizontal: kode CBG mono sky-700 (e.g. `I-4-10-III`) + nama bundle full + LOS pill
  - 3-stat grid: Tarif CBG (sky) · Total RS (slate) · Selisih (emerald `TrendingUp` jika untung / rose `TrendingDown` jika rugi) dengan persentase
  - Footer: "Dihitung di /ehis-eklaim/calculator · read-only"
  - Empty state (`<EmptyCbg />`) jika `inaCbg` undefined
- [x] **SEP info read-only** ✅ — [SepInfoCard.tsx](src/components/billing/invoice/tabs/klaim/SepInfoCard.tsx) (139L):
  - 3 row: No SEP (mono) · Validitas (date + chip emerald/amber/rose berdasar `computeValidity`) · Kelas Dijamin (chip sky dengan Layers icon)
  - Validitas auto-detect: <0 hari → Expired rose · ≤7 hari → Hampir Expired amber dengan "{n}h lagi" hint · >7 → Valid emerald
- [x] **Berkas checklist mini** ✅ — [BerkasChecklistMini.tsx](src/components/billing/invoice/tabs/klaim/BerkasChecklistMini.tsx) (157L):
  - Header: count "X dari Y berkas wajib siap" + persentase mono di kanan + gradient progress bar (rose <70% / amber 70-99% / emerald 100%) via `berkasProgress(required-only basis)`
  - Sorted list: required-missing first (rose AlertCircle) · required-ready (emerald CheckCircle2) · optional-missing (slate Circle) · optional-ready
  - Per-row: icon + nama + kode mono uppercase + badge Wajib (rose ring) / Opsional (slate ring)
  - Footer: "Upload & verifikasi berkas di /ehis-eklaim"
- [x] **Deep-link CTA besar** ✅ — [DeepLinkCta.tsx](src/components/billing/invoice/tabs/klaim/DeepLinkCta.tsx) (83L):
  - Full-width amber gradient button dengan decorative shine effect on-hover (translate-x sweep 700ms)
  - Left: eyebrow chip "E-Klaim BPJS / Asuransi" + label besar "Buka di E-Klaim" + subtext
  - Right: no klaim mono pill (hide mobile) + ArrowRight icon di ring putih (translate-x on group-hover)
  - 2 variant: `existing` (klaim ada) atau `new` (empty state CTA)
  - Click handler: `onClick(href)` jika di-pass, default `console.log` (modul `/ehis-eklaim` belum dibangun — wire `router.push(href)` saat EK0 ready)
- [x] **Fallback empty state** ✅ — [KlaimEmptyState.tsx](src/components/billing/invoice/tabs/klaim/KlaimEmptyState.tsx) (77L):
  - Centered hero card amber dashed border + `FileQuestion` icon ring + heading "Belum ada klaim tercatat" + desc dengan invoice mono
  - **Pre-req list** (3 item): Invoice difinalisasi · Coding ICD lengkap · Berkas tersedia (di `<PreReq />` sub)
  - CTA primary `<DeepLinkCta variant="new" />` → `eklaimDeepLink(null, invoiceId)` → `/ehis-eklaim/klaim/new?invoiceId=X`
- [x] **Helper claimReadCache.ts** ✅ — [src/lib/billing/claimReadCache.ts](src/lib/billing/claimReadCache.ts) (220L):
  - `ClaimStatus` (6 nilai) + `CLAIM_STATUS_CFG` (icon/bg/text/ring/dot/hint per status)
  - `ClaimBerkas` + `ClaimInaCbg` + `ClaimRecordRead` (read-only shape 1:1 dengan target `ClaimRecord`)
  - `MOCK_CLAIMS["INV-009"]` seed: Sutrisno Bagus ICU BPJS, Pending Verifikasi, INA-CBG I-4-10-III dengan selisih rugi 1.4M, 7 berkas (6 ready + 1 RUJUKAN N/A)
  - `getClaimStatusForInvoice(invoiceId)` — return `null` untuk INV-001 (→ empty state) atau record (→ full UI)
  - Helpers: `berkasProgress(berkas)` (required-only %) · `inaCbgMargin(cbg)` (selisih + pct + isUntung) · `eklaimDeepLink(claim, invoiceId)` (URL existing vs new)
- [x] **KlaimStatusTab orchestrator** ✅ — [KlaimStatusTab.tsx](src/components/billing/invoice/tabs/KlaimStatusTab.tsx) (92L):
  - `useMemo(getClaimStatusForInvoice(detail.id))` — fallback `<KlaimEmptyState />` jika null
  - Layout vertikal stacked: Row 1 ClaimStatusCard (full) · Row 2 InaCbgPreview (full) · Row 3 grid 2-col SepInfoCard + BerkasChecklistMini · Row 4 DeepLinkCta (full) · Footnote "read-only" disclaimer
  - Motion fade+y entrance 200ms
- [x] **InvoiceDetailPage wiring** ✅ — replace `<TabPlaceholder title="Klaim Penjamin">` → `<KlaimStatusTab detail={detail} onOpenEklaim={handleOpenEklaim} />`. Handler `handleSubmitKlaim` di banner sekarang switch tab ke klaim (bukan log). `handleOpenEklaim` stub log (modul `/ehis-eklaim` belum dibangun).

**File sizes BL2.4:** claimReadCache 220L · KlaimStatusTab 92L · ClaimStatusCard 166L · InaCbgPreview 164L · SepInfoCard 139L · BerkasChecklistMini 157L · DeepLinkCta 83L · KlaimEmptyState 77L. Total ~1098L lintas 8 file, semua jauh di bawah 800 limit. TS clean (`npx tsc --noEmit` exit 0).

**Design decisions:**
- **Read-only strict** — no edit/submit action di tab ini. Semua mutate ada di modul `/ehis-eklaim`. Footnote di bawah tab eksplisit declare ini.
- **Empty state CTA lebih kuat dari error message** — bila `claim=null` (mayoritas invoice baru), pre-req list edukatif sebelum CTA, bukan placeholder kosong frustasi.
- **Pre-req list di empty state** (Invoice Final, Coding ICD, Berkas) — kasir sadar dependency sebelum klik CTA, kurangi back-and-forth dengan tim klaim.
- **INA-CBG selisih dengan emerald (untung) vs rose (rugi) + persentase** — pesan finansial penting buat manajemen, langsung visible tanpa drill-down ke EKLAIM.
- **SEP validitas auto-warning 7 hari** — kurangi insiden klaim ditolak gara-gara SEP expired (kasus umum di RS BPJS).
- **Berkas progress basis required-only** — non-required tidak block 100%; checklist tetap tampil keduanya tapi % bersih dari noise opsional.
- **DeepLinkCta dengan shine effect + lift hover** — visual cue jelas "ini exit point ke modul lain", bukan tombol biasa.
- **Stub handler `console.log` saat /ehis-eklaim belum ada** — hindari 404 dev runtime. Wire `router.push(href)` saat EK0 route entry siap (single-line change di `handleOpenEklaim`).
- **Cache pattern di `claimReadCache.ts`** — schema 1:1 dengan target `ClaimRecord` di EKLAIM. Swap `MOCK_CLAIMS[id]` → `await fetch('/api/eklaim/claim?invoiceId=...')` saat backend ready. Zero refactor UI.

### BL2.5 Tab 4: Riwayat Audit ✅ Selesai (2026-05-24)

- [x] **Timeline vertikal grouped by date** ✅ — [AuditTimeline.tsx](src/components/billing/invoice/tabs/audit/AuditTimeline.tsx) (111L):
  - Group per tanggal via `groupAuditByDate(events)` di [auditTrail.ts](src/lib/billing/auditTrail.ts) — return `{ dateISO, dateLabel ("Sabtu, 24 Mei 2026"), events[] }` sorted DESC
  - Date header sticky `top-0` dengan backdrop-blur — pill berisi ISO date mono + label panjang + count badge per-group
  - Vertical line absolute di kolom-2 (gradient from-slate-200 via-slate-200 to-transparent) — di belakang dot tiap row
  - Stagger animation: `Math.min(0.3, groupIdx * 0.08 + idx * 0.03)` per event (clamp untuk perf di list panjang)
  - Empty states: berbeda copy untuk `hasActiveFilters` (SearchX icon + CTA reset) vs initial empty (Inbox icon + hint workflow)
- [x] **Per-entry: AuditEventRow** ✅ — [AuditEventRow.tsx](src/components/billing/invoice/tabs/audit/AuditEventRow.tsx) (149L):
  - Grid 3-col: `[44px time mono | 24px dot | 1fr body card]`
  - **Time** mono right-align HH:MM (formatTime)
  - **Dot** 3.5×3.5 dengan ring-4 ring-white (memotong vertical line di belakangnya) — warna sesuai tone action
  - **Body card** white rounded border hover dengan:
    - Avatar circle 7×7 inisial 2-letter (`actorInitials`) — bg per-tone
    - Actor name bold + role muted + action chip (icon + label) dengan palette per kategori
    - Summary text 1-liner
    - Right meta: nominal mono (rose untuk refund/diskon, emerald untuk pembayaran/add)
  - **Bottom strip** (slate-50) conditional: target ref (Receipt icon + label + type uppercase) · noKwitansi (Hash icon) · reason (MessageSquareWarning amber + italic quote) · diff block
- [x] **AuditDiffBlock (before/after)** ✅ — [AuditDiffBlock.tsx](src/components/billing/invoice/tabs/audit/AuditDiffBlock.tsx) (75L):
  - Grid 2-col `[110px field | 1fr values]` per diff
  - Field label uppercase mono kecil + 2 chip: before (strikethrough rose ring) → ArrowRight → after (emerald bold ring)
  - Conditional render: `isAddOnly` (cuma after) · `isRemoveOnly` (cuma "dihapus" italic) · normal (before → after)
  - Money formatting (`isMoney=true` → `fmtRupiah`)
- [x] **Filter by actor / action / date range** ✅ — [AuditFilterBar.tsx](src/components/billing/invoice/tabs/audit/AuditFilterBar.tsx) (306L):
  - **Action chips multi-select** (12 kinds dari `AUDIT_ACTION_ORDER`): rounded-full pill icon+label, per-tone palette saat active (slate/amber/emerald/sky/rose/violet/teal), check icon ke kanan saat aktif, tooltip per `description`
  - **Actor multi-select dropdown**: button styled (border amber-300 saat ada selection) + chevron rotate · panel max-h-64 internal scroll · per-actor name+role · check kanan + bg amber saat selected · outside-click + ESC close
  - **Date range** dengan 2 native `<input type="date">` + ArrowRight separator + CalendarDays icon prefix · auto-clamp via `max={to}` / `min={from}`
  - Header: title + count "X / Y event" + chip "N aktif" amber jika ada filter
  - Actions kanan: Reset (disabled jika 0 aktif) + **Export CSV** amber primary (disabled jika 0 events)
- [x] **Export CSV** ✅ — `exportAuditCsv(events, invoiceNo, filename?)` di [auditTrail.ts](src/lib/billing/auditTrail.ts):
  - Header 11 kolom: Timestamp/Aktor/Peran/Aksi/Kategori/Target/Ringkasan/Nominal/Alasan/Diff/NoKwitansi
  - Diff serialized `"Field: before → after | Field: before → after"`
  - Money formatted Indonesian via `Intl.NumberFormat` saat `isMoney=true`
  - BOM UTF-8 → Excel kenali Rupiah/unicode aman
  - Auto-filename `audit-{invoiceNo-sanitized}-{YYYY-MM-DD}.csv`
- [x] **Helper layer auditTrail.ts** ✅ — [src/lib/billing/auditTrail.ts](src/lib/billing/auditTrail.ts) (482L):
  - 12 `AuditActionKind` dengan `AUDIT_ACTION_CFG` (label/icon/category/tone/description per kind)
  - `AUDIT_TONE_PALETTE` 7-tone (bg/text/ring/dot/avatarBg)
  - Types: `AuditActor`, `AuditDiff` (field/before/after/isMoney), `AuditEvent` (id/at/invoiceId/actor/action/summary/target/amount/reason/diff/noKwitansi)
  - `AUDIT_EVENTS_MOCK`: 18 events INV-009 (multi-day ICU lifecycle: create→add×6→diskon item→add×3→payment×2→refund→add→diskon invoice→finalize→klaim submit→klaim status×2) + 5 events INV-001 (single-day IGD: create→add×2→finalize→payment)
  - Helpers: `getAuditEventsForInvoice` (sorted DESC) · `applyAuditFilters` · `countActiveAuditFilters` · `uniqueActors` (sorted alfabet) · `groupAuditByDate` · `actorInitials` · `formatTime` · `exportAuditCsv`
- [x] **RiwayatAuditTab orchestrator** ✅ — [RiwayatAuditTab.tsx](src/components/billing/invoice/tabs/RiwayatAuditTab.tsx) (85L):
  - `useMemo` chain: `getAuditEventsForInvoice` → `uniqueActors` → `applyAuditFilters`
  - State `filters` (AuditFilterState) dengan `defaultAuditFilters()` initial
  - `hasActiveFilters` derived (actor/action length OR dateFrom/dateTo set)
  - Handlers: `handleReset` · `handleExport` (call `exportAuditCsv` + console log)
  - Layout vertikal: AuditFilterBar (top) + AuditTimeline (body) + footnote UU PDP compliance
- [x] **InvoiceDetailPage wiring** ✅ — `<TabPlaceholder>` riwayat replaced dengan `<RiwayatAuditTab detail={detail} />`. Cleanup: `Construction` import + `TabPlaceholder` sub-function dihapus (sudah tidak ada caller setelah BL2.4 + BL2.5 done).

**File sizes BL2.5:** auditTrail 482L · RiwayatAuditTab 85L · AuditFilterBar 306L · AuditTimeline 111L · AuditEventRow 149L · AuditDiffBlock 75L. Total ~1208L lintas 6 file, semua jauh di bawah 800 limit. TS clean (`npx tsc --noEmit` exit 0).

**Design decisions:**
- **Timeline pattern dengan vertical line + dot ring-4 putih** — visual classic Gmail/Linear, mudah scan kronologi. Ring putih memotong line tipis di belakang dot, bukan tertindih.
- **Grouped per date dengan sticky header pill** — kasir/auditor scrolling 18+ events tidak loose context tanggal. Pill mono+label memudahkan reference verbal ("event di 24 Mei jam 09:10").
- **Action chips per tone** (12 warna konsisten dengan kategori: payment=emerald, void=rose, klaim=sky/teal, diskon=violet, finalize=amber) — visual cluster langsung tahu jenis aksi sebelum baca label.
- **Multi-select untuk actor + action** (bukan single) — auditor sering need "tampilkan semua aksi `Sari` + `Bambang` selama Mei" tanpa multiple pass.
- **Avatar inisial 2-letter** dengan bg per-tone-action — visual cue siapa actor + jenis aksi simultan, hindari overhead foto.
- **Diff block 2-chip strikethrough → bold** — pattern git diff klasik, instant readability untuk "Status: Draft → Final".
- **Nominal rose untuk refund/diskon · emerald untuk pembayaran/add** — semantic finansial: keluar (rose) vs masuk/positif (emerald). Prefix "−" untuk refund.
- **CSV export 11 kolom dengan diff serialized "Field: before → after"** — Excel-friendly, copy ke auditor tanpa konversi.
- **Footer disclaimer compliance UU PDP 27/2022** — tegaskan ke user audit trail bersifat immutable + retensi 5 tahun, bukan sekedar log informasi.
- **Stagger animation clamp `Math.min(0.3, ...)`** — list 18 events di INV-009 jika di-stagger linear bisa 0.6s+ delay terakhir, clamp untuk UX cepat tapi tetap ada efek.

### BL2.6 Print Preview ✅ Selesai (2026-05-24)

- [x] **InvoicePrintModal** ✅ — [InvoicePrintModal.tsx](src/components/billing/invoice/modals/InvoicePrintModal.tsx) (38L) thin wrapper di atas `PrintModalShell` + `<InvoiceSheet />`. Paper default A5 (struk kasir), toggle A4 untuk surat resmi.
- [x] **InvoiceSheet (konten struk)** ✅ — [InvoiceSheet.tsx](src/components/billing/invoice/modals/print/InvoiceSheet.tsx) (363L):
  - **KOP** via `<KopSurat />` shared — logo placeholder + nama RS + subtitle akreditasi + alamat + meta-info (telp/fax/email/web) + double border bawah klasik
  - **Title strip** centered: "Struk Tagihan Pasien" + No invoice mono + tanggal+jam + no kunjungan
  - **Identitas pasien grid 2-col** dalam border slate-300 bg-slate-50/40: 10 field (Nama/RM/Gender/Usia/Unit/Kelas/Penjamin/SEP/DPJP/Kunjungan)
  - **Tabel rincian** 7 kolom (No/Tgl/Item/Qty/Satuan/Harga/Subtotal) dengan **section header per kategori** (CategoryGroup) — running number reset per section · subtotal per kategori footer bg-slate-50/60 · diskon item displayed italic rose inline · voided items di-skip dari print
  - **Breakdown totals** right-aligned table: Subtotal gross · Diskon Item (rose) · Subtotal Setelah Diskon · Diskon Invoice (rose + alasan hint) · PPN % (conditional) · Materai (conditional) · double-border separator · **GRAND TOTAL** bold uppercase + **Terbilang** italic Indonesia via `terbilang()`
  - **Pembayaran history** table 5-col: Tgl/Metode/NoKwitansi/Kasir/Nominal — voided row strikethrough + refund nominal rose dengan prefix "−" · footer Total Dibayar + Sisa Tagihan dengan tone emerald-jika-lunas / rose-jika-belum
  - **Signature block** 2-col (Pasien/Penanggung kiri, Petugas Kasir kanan dengan auto-fill nama kasir terakhir + lokasi+tanggal)
  - **Footer** disclaimer kecil "Struk sah & berlaku" + timestamp auto-generate
- [x] **KwitansiPrintModal** ✅ — [KwitansiPrintModal.tsx](src/components/billing/invoice/modals/KwitansiPrintModal.tsx) (36L) wrapper untuk `<KwitansiSheet />`.
- [x] **KwitansiSheet** ✅ — [KwitansiSheet.tsx](src/components/billing/invoice/modals/print/KwitansiSheet.tsx) (162L):
  - **KOP** sama dengan invoice (`<KopSurat />` shared)
  - **Title** besar uppercase tracking-widest: "KWITANSI" atau "KWITANSI REFUND" · No kwitansi mono di bawah
  - **VOIDED banner** rose bordered jika `payment.voided` ("VOIDED · TIDAK BERLAKU")
  - **Body** format Indonesian klasik dengan `<Row label>`: Telah diterima dari (nama uppercase + RM) · Sejumlah (nominal Rupiah 20px bold mono, prefix "−" untuk refund) · Terbilang (italic dalam border-l klasik bg-slate-50) · Untuk pembayaran (description per kategori Deposit/Pembayaran/Refund + ref tagihan+kunjungan+unit+kelas + catatan italic) · Metode (+ bank + noRef conditional) · Tanggal terima (long format) · Refund atas kwitansi (conditional via `refundOf` lookup)
  - **Signature** 2-col (Penyetor/Pasien kiri, Kasir kanan dengan auto-fill `payment.kasir`)
  - **Footer** disclaimer + 1×24h reporting hint + dicetak otomatis EHIS timestamp
- [x] **PrintModalShell shared** ✅ — [PrintModalShell.tsx](src/components/billing/invoice/modals/print/PrintModalShell.tsx) (155L):
  - Full-viewport modal (inset-3 / md:inset-6) — preview area scrollable bg-slate-200/60 yang simulate kertas dengan width per-paper (PAPER_CFG.screenWidthPx: A5=520px / A4=720px)
  - **Toolbar `.no-print`**: ikon printer ring + title + sub "Format A4/A5 · description" + **PaperSegmented control** (A5/A4 toggle) + button **Cetak** amber primary (trigger `window.print()` dengan delay 60ms framer settle) + **X close** + ESC handler
  - **Footer tip `.no-print`**: "Save as PDF di browser dialog" + kbd Esc shortcut hint
  - Children diharapkan punya `.print-area` root → @media print rule hide semua kecuali element ini
- [x] **KopSurat shared** ✅ — [KopSurat.tsx](src/components/billing/invoice/modals/print/KopSurat.tsx) (64L): consume `RS_PROFIL_INITIAL` dari [rsProfilStore](src/lib/master/rsProfilStore.ts). Logo placeholder 20×20 (Building2 icon + 4-letter kode RS) + identity centered (nama uppercase 20px + nama inggris italic + subtitle akreditasi + kelas + alamat kop + telp/fax/email/web) + double-border bawah `border-b-[3px] border-double border-slate-800` (style dokumen RS pemerintah klasik).
- [x] **SignatureBlock shared** ✅ — [SignatureBlock.tsx](src/components/billing/invoice/modals/print/SignatureBlock.tsx) (71L): grid 2-col, slot kanan menampilkan lokasi+tanggal di atas. Signature space dengan dotted underline placeholder + nama uppercase + top-border + hint italic.
- [x] **printShared.ts** ✅ — [printShared.ts](src/components/billing/invoice/modals/print/printShared.ts) (78L): `PaperSize` ("A4" | "A5") · `PAPER_CFG` (label/description/screenWidthPx) · `PAPER_ORDER` ["A5", "A4"] · format helpers `fmtTanggalLong`/`fmtTanggalShort`/`fmtTanggalJam`/`fmtJamWib` · `triggerPrint(delayMs=60)` (window.print dengan delay untuk frame settle) · re-export `terbilang`.
- [x] **`@media print` stylesheet** ✅ — [globals.css](src/app/globals.css):
  - Reset: `body *` visibility hidden, `.print-area *` visibility visible — print area absolute positioned full-width
  - `.no-print` display:none saat print — buat semua toolbar/overlay/footer-hint exclude
  - Color-adjust: exact (force tone print)
  - `@page` margin 12mm × 10mm
  - Paper width via `data-paper="A4"|"A5"` di `.print-area` (190mm A4 / 138mm A5)
  - Helpers: `.page-break-before` (always) · `.page-break-avoid` (inside) — dipakai untuk hindari section terpotong di tengah
- [x] **Wiring di InvoiceDetailPage** ✅ — `ModalKey` extended `"print" | "kwitansi"`. `handlePrint` (banner button) → `setModal("print")` · `handlePaymentAction(action="print")` (PaymentRow kebab "Cetak Kwitansi") → `setModal("kwitansi")` (sudah set `targetPayment` di scope). Kedua modal mount di akhir component tree.

**File sizes BL2.6:** InvoicePrintModal 38L · KwitansiPrintModal 36L · InvoiceSheet 363L · KwitansiSheet 162L · PrintModalShell 155L · KopSurat 64L · SignatureBlock 71L · printShared 78L. Total ~967L lintas 8 file, semua jauh di bawah 800 limit. TS clean (`npx tsc --noEmit` exit 0). Plus +52L di globals.css (@media print + @page rules).

**Design decisions:**
- **Sheet sebagai konten dipisah dari modal wrapper** — `<InvoiceSheet />` reusable jika nanti dipakai untuk preview di tab lain atau halaman dedicated cetak. Modal hanya kerangka.
- **`.print-area` whitelist pattern** di @media print — hide semua dulu, lalu un-hide hanya area print + childrennya. Robust untuk apa pun yang ada di app shell (sidebar, navbar, framer-motion overlay) — semua otomatis hilang dari print.
- **`.no-print` blacklist** di toolbar/overlay/footer-tip — gampang scan untuk identifikasi "ini element UI, bukan konten print".
- **`triggerPrint(delayMs=60)`** — framer-motion masih animating saat `window.print()` dipanggil kadang preview blank/partial di Chrome. Delay 60ms buat frame settle.
- **Paper size via `data-paper` attribute** di `.print-area` — CSS-only switch, tidak perlu rerender React saat user toggle A4/A5. Preview frame width juga update via inline style.
- **A5 default** untuk struk kasir (paling sering dicetak ke printer struk Epson TM-U220 atau Star TSP143) · A4 toggle untuk surat resmi BPJS/asuransi reimburse.
- **Voided items SKIPPED dari print** (bukan strikethrough) — print untuk pasien tidak perlu lihat noise audit · audit lengkap di tab Riwayat Audit BL2.5.
- **Voided payment TETAP tampil** dengan strikethrough — penting untuk transparency saldo (kalau di-skip, total dibayar tidak match dengan jumlah row visible — pasien bingung).
- **Kasir name auto-fill dari payment terakhir** di InvoiceSheet — saat ini mock, backend ganti dengan session active kasir.
- **KopSurat reusable** untuk fase BL3 LaporanKasShift + BL5 ApprovalAdjustment + BL7 reports — DRY.
- **Border-double + tracking-[0.2em] uppercase** untuk header — convey "dokumen resmi RS pemerintah" tanpa overhead grafis.
- **Terbilang Indonesia di Grand Total + Kwitansi nominal** — wajib di RS pemerintah/BLUD per konvensi audit BPK.
- **PaymentRow kebab "Cetak Kwitansi" sudah ada dari BL2.3** — hanya wire ulang dispatcher (sebelumnya log only, sekarang real modal).

**Acceptance BL2 ✅:** buka invoice INV-009, scroll 4 tab smooth (Rincian 14 items+totals+sticky footer · Pembayaran form+history+filter · Klaim Status read-only+deep link · Riwayat Audit 18-event timeline+filter+CSV export), banner button "Print Struk" → modal preview A5/A4 dengan KOP RS Harapan Sehat · PaymentRow kebab "Cetak Kwitansi" → kwitansi modal dengan terbilang. Browser print dialog tampil hanya `.print-area` (sidebar/navbar/toolbar/overlay otomatis exclude).

**Acceptance BL2:** buka invoice `RM-2025-005`, auto-pull 14 items dari mock klinis, tampilkan grand total benar, tambah pembayaran 200rb update sisa real-time, tab Klaim BPJS INA-CBG resolved, print preview tampil dengan KOP RS.

---

## Phase BL3 — Pembayaran / Kasir Counter

**Route:** `/ehis-billing/pembayaran` · **Effort:** 3–4 hari
**Pattern reference:** Lab/Rad worklist + form modal

### BL3.1 Counter Dashboard ✅ Selesai (2026-05-24)

- [x] **Active Shift Card (Header strip + Body)** ✅ — [ActiveShiftCard.tsx](src/components/billing/kasir/ActiveShiftCard.tsx) (206L):
  - **Header strip**: counter chip (icon + bg/text/ring per COUNTER_TONE) + counter nama + status pill "Sedang Berjalan" emerald dengan pulse dot · kasir nama + lokasi (MapPin) · jam buka mono + chip durasi emerald (formatDuration HH:MM live) · button "Tutup Shift" rose
  - **Body grid 4-col stat** (mobile 2-col): Saldo Awal · Total Tunai (emerald) · Total Non-Tunai (sky) · **Saldo Cash Current** (amber + ring inset highlight — "yang seharusnya di laci"). Setiap cell dengan icon + label uppercase + value mono bold + hint kecil.
  - **Footer**: count transaksi mono + refund inline (jika >0 rose) + total semua metode + shift ID mono kanan
- [x] **EmptyShiftState** ✅ — [EmptyShiftState.tsx](src/components/billing/kasir/EmptyShiftState.tsx) (72L): hero card amber dashed + LockOpen icon spring entrance + pre-req list 3-item ("Pilih counter tidak occupied · catat saldo fisik · catatan serah-terima") + AlertCircle warning "tanpa shift Open form pembayaran disabled" + CTA "Buka Shift Baru" amber primary.
- [x] **Form Buka Shift modal** ✅ — [BukaShiftModal.tsx](src/components/billing/kasir/modals/BukaShiftModal.tsx) (219L):
  - **Counter pilih visual** grid 2-col card-style (4 counter): icon + nama + lokasi · active (tone) / occupied (slate strikethrough disabled) / available · auto-block dengan `isCounterOccupied(counter, shifts)`
  - **Kasir dropdown** dari `KASIR_LIST` (4 kasir mock) + Lokasi field auto-fill dari counter terpilih
  - **Saldo Awal input** numeric + placeholder "500000" + font mono tabular
  - **Catatan serah-terima** opsional 2-row
  - **Konfirmasi card** amber yang preview "Sari Wulandari akan membuka shift di Kasir Utama dengan saldo Rp 500.000"
  - Validation: counter not-occupied · kasir wajib · saldo ≥0
- [x] **Form Tutup Shift modal** ✅ — [TutupShiftModal.tsx](src/components/billing/kasir/modals/TutupShiftModal.tsx) (303L):
  - **Shift context card** (icon + counter nama + kasir + jam buka + durasi + shift ID mono)
  - **Breakdown auto** sesi ini (5 metode bayar — disable opacity untuk yang 0) dengan total semua mono bold di bawah
  - **Stat reference grid 2-col**: Saldo Awal · Total Tunai (emerald) · Refund (rose, conditional) · Non-Tunai (sky, conditional)
  - **Saldo Cash Expected** card amber bold 18px (auto-compute via `expectedCashOnHand`: bukaSaldo + tunai − refund)
  - **Saldo Akhir input** numeric autofocus (default pre-fill = expected)
  - **Selisih live card** dengan 3 tone palette: **Balance** emerald (CheckCircle2) · **Surplus** sky (TrendingUp) · **Minus — Audit Required** rose (AlertTriangle) — formula `tutupSaldoAkhir − expectedCash`
  - **Catatan textarea** dengan label dinamis: WAJIB jika selisih ≠ 0 (min 5 char validation, placeholder hint berbeda per surplus/minus/balance)
  - Submit button "Tutup Shift (Balance)" atau "Tutup Shift dengan Selisih" (danger rose) — button danger jika selisih ≠ 0
- [x] **ShiftKPIStrip** ✅ — [ShiftKPIStrip.tsx](src/components/billing/kasir/ShiftKPIStrip.tsx) (129L): 4 KPI card vertical (di right column) atau 2-col mobile — Total Transaksi Hari Ini (amber) · Pemasukan Tunai (emerald) · Pemasukan Non-Tunai (sky) · Refund Hari Ini (rose, muted opacity 50 jika 0). Accent stripe gradient kiri + icon ring + value mono bold + hint. Aggregate lintas semua shift hari ini via `aggregateHariIni()`.
- [x] **ShiftMethodBreakdown** ✅ — [ShiftMethodBreakdown.tsx](src/components/billing/kasir/ShiftMethodBreakdown.tsx) (149L):
  - **Header**: PieChart icon + title + subtitle + total mono kanan
  - **Stacked horizontal bar** 5-segment (Tunai/Transfer/QRIS/EDC/Voucher) dengan animated width % via framer (durasi 500ms) — pakai `METODE_CFG.dot` warna
  - **Rows per metode** grid 4-col (icon · label+hint · nominal mono · pct mono kanan) — empty metode opacity 50
- [x] **RecentShiftsTable** ✅ — [RecentShiftsTable.tsx](src/components/billing/kasir/RecentShiftsTable.tsx) (184L):
  - Header: History icon + count "X shift selesai · sort terbaru dulu"
  - Tabel 6-kolom: Counter (icon ring + nama + ID mono kecil) · Kasir · Buka → Tutup (date+jam mono + durasi chip) · Total (nominal mono + count trx) · **Selisih chip** (Balance emerald CheckCircle2 / Surplus sky TrendingUp / Minus rose TrendingDown) · Supervisor + status pill
  - Sorted DESC by bukaAt via `recentClosedShifts(shifts, 8)`
  - Empty state "Belum ada shift selesai"
- [x] **OtherCountersStrip** (info-only, BL3.1 bonus) ✅ — di kanan column: list counter Open milik kasir lain (4 mock data) dengan emerald "Open" pulse pill — kasir aware counter lain juga sedang aktif.
- [x] **KasirHero** ✅ — [KasirHero.tsx](src/components/billing/kasir/KasirHero.tsx) (74L): eyebrow chip Wallet amber + h1 "Pembayaran & Counter Kasir" + desc + timestamp pill + CTA dinamis (Buka Shift Baru amber jika no Open, Tutup Shift rose jika ada Open).
- [x] **kasirShared.ts** ✅ — [kasirShared.ts](src/components/billing/kasir/kasirShared.ts) (56L): `COUNTER_TONE` (4 counter: amber/teal/sky/rose dengan Building/BedDouble/Stethoscope/Siren icons) · `SHIFT_STATUS_CFG` (Open/Closed dengan LockOpen/Lock) · re-export helper functions dari kasirShiftMock.
- [x] **Data layer kasirShiftMock.ts** ✅ — [kasirShiftMock.ts](src/lib/billing/kasirShiftMock.ts) (334L):
  - Types: `CounterId` (4 counter) · `ShiftStatus` (Open/Closed) · `ShiftMetodeBreakdown` (5 metode) · `KasirShift` (id/counter/kasirNama/status/bukaAt/bukaSaldoAwal/totalByMetode/totalTransaksi/totalRefund/tutupAt?/tutupSaldoAkhir?/selisih?/supervisor?/catatan)
  - Mock: `COUNTER_LIST` (4) + `KASIR_LIST` (4) + `KASIR_SHIFT_MOCK` (6 shift: 2 Open hari ini Sari/Bambang + 4 Closed beberapa hari terakhir cover balance/minus/surplus)
  - Helpers: `totalShiftAll` · `totalShiftNonTunai` · `expectedCashOnHand` (formula: bukaSaldo + Tunai − Refund) · `computeSelisih(shift, saldoAkhir)` · `formatDuration(bukaAt, sampai?)` · `formatJam` · `formatTanggalShort` · `getOpenShift(shifts, kasirNama?)` · `isCounterOccupied(counter)` · `recentClosedShifts(limit=10)` · `aggregateHariIni(date?)` (return totalTransaksi/tunai/nonTunai/refund/all/countersAktif)
- [x] **KasirCounterPage orchestrator** ✅ — [KasirCounterPage.tsx](src/components/billing/kasir/KasirCounterPage.tsx) (249L):
  - `useSkeletonDelay(500)` + AnimatePresence fade + SkeletonShell 2-col placeholder
  - State: `shifts` (mutable list KasirShift) · `modal` ("buka" | "tutup" | null) · `activeShift` (useMemo `getOpenShift(shifts, SESSION_KASIR)`)
  - Layout 2-col `[2fr_1fr]` lg-up: Left = ActiveShiftCard atau EmptyShiftState + ShiftMethodBreakdown + RecentShiftsTable · Right = ShiftKPIStrip + OtherCountersStrip
  - Handlers: `handleOpenShift(input)` (immutable concat newShift dengan id timestamp) · `handleCloseShift(input)` (immutable map mutate shift jadi Closed dengan tutupAt/tutupSaldoAkhir/selisih/supervisor auto-fill)
  - Mock session: anggap user = "Sari Wulandari" (kasir-1 default active)
- [x] **Route entry** ✅ — [app/ehis-billing/pembayaran/page.tsx](src/app/ehis-billing/pembayaran/page.tsx) thin import (8L) dengan metadata title.

**File sizes BL3.1:** kasirShiftMock 334L · kasirShared 56L · KasirHero 74L · ActiveShiftCard 206L · EmptyShiftState 72L · KasirCounterPage 249L · RecentShiftsTable 184L · ShiftKPIStrip 129L · ShiftMethodBreakdown 149L · BukaShiftModal 219L · TutupShiftModal 303L · route 8L. Total ~1983L lintas 12 file, semua jauh di bawah 800 limit. TS clean (`npx tsc --noEmit` exit 0).

**Design decisions:**
- **Active vs Empty state** sebagai 2 mode primer di left column — kasir langsung paham state "boleh bayar / belum boleh". Bukan banner warning di atas form (yang biasanya hilang dari peripheral vision saat scroll).
- **Saldo Cash Current** dengan highlight ring amber inset — fokus visual #1, ini angka paling penting saat shift berjalan ("berapa kas yang harus ada di laci saat ini").
- **Counter occupied auto-detect** di BukaShiftModal — disable card visual + strikethrough, ketimbang error message setelah submit. Hindari kasir frustrasi.
- **Selisih live di TutupShiftModal** dengan 3 tone palette (Balance / Surplus / Minus) — instan feedback sebelum submit, kasir bisa coba ulang hitung kalau ada miss.
- **Catatan WAJIB jika selisih ≠ 0** (min 5 char) — gating audit, semua surplus/minus harus dijustifikasi.
- **OtherCountersStrip** awareness lintas counter — kasir tahu siapa lagi yang lagi shift (saat ada coordination call, mau swap, dll). Live data dari same `shifts[]` state.
- **expectedCashOnHand** asumsi semua refund tunai (worst case) — backend bisa track refund per-metode untuk akurasi. Mock disclaimer di TutupShiftModal "Refund (asumsi cash)".
- **handleCloseShift auto-fill supervisor** mock — backend ganti dengan approval workflow (button "Minta Approval" yang trigger notifikasi supervisor).
- **2 shift Open di mock** (Sari + Bambang) — demonstrate scenario realistic, biasanya RS punya 2-4 counter buka simultan.
- **Mock cover 3 selisih cases**: balance (24/05 Sari + Yanti) · minus (Rian Rp -50K) · surplus (Bambang Rp +35K) — sebagai demo audit chip variation di RecentShiftsTable.

### BL3.2 Quick Search Pembayaran ✅ Selesai (2026-05-24)

- [x] **Search input besar** ✅ — [QuickSearchInput.tsx](src/components/billing/kasir/quick/QuickSearchInput.tsx) (55L): large prominent bar dengan border-2 + ring-4 amber saat focus/value, Search icon prefix (amber saat aktif), clear button X muncul saat ada value. Auto-focus saat tab dibuka. Placeholder "Cari no tagihan / no RM / nama pasien…".
- [x] **Outstanding result list** ✅ — [OutstandingResultRow.tsx](src/components/billing/kasir/quick/OutstandingResultRow.tsx) (97L): row pasien card dengan grid 3-col (main · sisa · CTA). Main col: nama bold + RM mono + gender/usia + meta (Hash noTagihan · Building unit/kelas · User penjamin). Sisa: nominal mono dengan tone (rose >5jt / amber default) + ratio "dari total". CTA "Bayar" amber pill yang transform jadi solid amber saat hover/selected. Active state ring amber-2.
- [x] **Search logic** ✅ — [outstandingSearch.ts](src/lib/billing/outstandingSearch.ts) (53L): `searchOutstanding(query, source, limit=12)` filter `sisa>0 && status!=="Void"` lalu match query ke noTagihan/nama/RM/noKunjungan case-insensitive, sort by sisa terbesar dulu. `topOutstandingSuggestions(limit=5)` saat search kosong — surface kasir ke "yang paling besar".
- [x] **Quick payment form inline** ✅ — [QuickPaymentForm.tsx](src/components/billing/kasir/quick/QuickPaymentForm.tsx) (318L):
  - **Header context card** amber gradient dengan info target (nama pasien + RM + noTagihan + unit/kelas/penjamin) + Sisa nominal mono besar di kanan
  - **Quick chips**: Lunasi Sisa (emerald + Sparkles) · Setengah · preset 100rb/500rb/1jt (auto-filter yang ≤ sisa)
  - **Metode segmented** grid 5-col (icon + label tiap metode) dengan active tone palette per `METODE_CFG`
  - **Nominal input** large 18px mono right-align + live terbilang italic Indonesia
  - **Conditional bank + noRef** animated expand untuk Transfer/EDC (bank dropdown 6 bank) / QRIS (noRef only)
  - **Catatan opsional** + Submit button full-width amber dengan emerald success state 1.5s (Zap icon "Terima Pembayaran Rp X" / CheckCircle2 "Berhasil!")
  - Default kategori = "Pembayaran" (BL2.3 form punya toggle Pembayaran/Deposit, Quick form simplified ke Pembayaran karena Deposit ada di tab terpisah BL3.3)
- [x] **Recent payments feed** ✅ — [RecentPaymentsFeed.tsx](src/components/billing/kasir/quick/RecentPaymentsFeed.tsx) (185L):
  - Header dengan History icon + count "X transaksi di shift ini"
  - Tiap row: metode icon ring + nama pasien + RM mono + badge Deposit (sky) / Refund (rose) inline · invoice no + bank + noRef · nominal mono right-align (emerald untuk masuk, rose untuk refund dengan prefix "−") · jam relatif (Baru saja / Xm lalu / HH:MM today / "dd MMM HH:MM" lainnya)
  - Hover-only print kwitansi button icon-only (printer icon, opacity-0 → 100 on hover row)
  - Empty state Inbox icon + copy "Belum ada pembayaran"
- [x] **Quick Bayar orchestrator** ✅ — [QuickBayarPanel.tsx](src/components/billing/kasir/quick/QuickBayarPanel.tsx) (196L):
  - Layout 2-col `[3fr_2fr]` lg-up: Left = search input + (result list ATAU form jika ada selected) AnimatePresence mode="wait" · Right sticky = RecentPaymentsFeed
  - State: `query` · `selected` (OutstandingResult | null) · `feedRefresh` (trigger re-read feed)
  - Auto-deselect logic: jika selected row hilang dari results setelah search → reset
  - Submit handler: append ke `shiftPaymentsMock` via `appendShiftPayment` + `nextNoKwitansi` auto-gen + invoke `onAccumulate` ke parent (update shift total) + close form OR keep open update sisa jika partial
- [x] **shiftPaymentsMock data layer** ✅ — [shiftPaymentsMock.ts](src/lib/billing/shiftPaymentsMock.ts) (128L): type `ShiftPaymentLog` (extends PaymentRecord + invoiceId/No + pasienNama/RM) · `SHIFT_PAYMENTS_MOCK[shiftId]` map (8 pre-seed payment untuk Sari kasir-1 lintas metode/kategori · Bambang kasir-2 sengaja kosong demo empty state) · helpers `getShiftPayments(shiftId, limit)` sorted DESC + `appendShiftPayment(shiftId, log)` (unshift terbaru di depan).

### BL3.3 Deposit Awal (Admisi) ✅ Selesai (2026-05-24)

- [x] **Search pasien admisi** ✅ — [AdmisiResultRow.tsx](src/components/billing/kasir/deposit/AdmisiResultRow.tsx) (130L): row pasien admisi card dengan kategori icon (BedDouble RI Baru / Stethoscope Pre-Op / Activity ICU) + main (nama+RM+gender/usia + urgensi pill `Rutin slate / Cito amber / Emergency rose`) + diagnosa singkat + rencana tindakan jika pre-op + meta noKunjungan/kelas/penjamin/dpjp + rencana admisi (jam relatif: "Hari ini · HH:MM" rose-bold jika <6h, atau "dd MMM · HH:MM").
- [x] **Form deposit awal** ✅ — [DepositForm.tsx](src/components/billing/kasir/deposit/DepositForm.tsx) (351L):
  - **Header context** amber gradient dengan label "Deposit Awal · Kategori" + nama pasien bold + RM mono + meta unit/kelas/penjamin
  - **LOS slider** (1-30 hari) dengan label "Estimasi Length of Stay" + value mono bold real-time
  - **Saran Sistem card** sky dengan Calculator icon: rate info ("Rp 1.2jt/hari × 5 hari = Rp 6.000.000") + buffer ("+ buffer Rp 600.000") + total mono bold besar sky-700
  - **Metode segmented** 5-col (sama pattern QuickPaymentForm)
  - **Nominal input** dengan dual-mode: default ikut suggested.total, manual override saat user ketik (badge "manual override" / "ikut saran sistem" indikator). Link "← Pakai saran" untuk reset ke suggested.
  - **Live terbilang** italic Indonesia
  - **Conditional bank + noRef** untuk Transfer/EDC/QRIS
  - **Submit** full-width amber "Buka Deposit Rp X" / "Deposit Tercatat!" success state
- [x] **suggestDeposit helper** ✅ — [depositMock.ts](src/lib/billing/depositMock.ts) (218L):
  - `KELAS_RATE_PER_HARI`: VIP 2jt / K1 1.2jt / K2 800k / K3 450k / ICU 1.5jt / HCU 1jt
  - `DEFAULT_LOS`: RI Baru 5h / Pre-Op Major 7h / ICU Admisi 3h
  - Formula `suggestDeposit({kelas, losDays, kategori, penjaminTipe}) → {base, buffer, total, rateInfo}` — base = rate × LOS; buffer = base × pct dimana Umum 30% / Asuransi 20% / BPJS-Jamkesda 10%; total = base + buffer
  - Output `rateInfo` formatted string untuk display "Rp 1.2jt/hari × 5 hari"
  - **Mock PASIEN_ADMISI_MOCK** 5 pasien cover semua skenario: Hadi (RI Umum K1) · Lina (Pre-Op VIP Asuransi) · Sutrisno (ICU BPJS Cito) · Maya (Persalinan K2 BPJS PBI) · Bambang (Appendisitis Pre-Op VIP Umum Emergency)
  - `searchPasienAdmisi(query)` sort by urgensi (Emergency > Cito > Rutin) lalu rencanaAdmisi asc — emergency surface duluan
- [x] **Draft invoice preview** ✅ — [DraftInvoicePreview.tsx](src/components/billing/kasir/deposit/DraftInvoicePreview.tsx) (128L):
  - Card sticky di right column saat ada pasien selected
  - 4 row preview: Invoice baru (no tagihan placeholder mono) · Payment record #1 (Deposit metode nominal) · Charge items (0 item muted, "akan diisi auto BL6") · Saldo Deposit Awal (emerald accent bold)
  - Footer disclaimer "pasien hilang dari list admisi pending, lihat di tab Tagihan"
  - Saat tidak ada selection → `<DepositInfoCard />` info panel "Apa itu Deposit Awal?" + suggest amount logic + override hint
- [x] **Deposit Awal orchestrator** ✅ — [DepositAwalPanel.tsx](src/components/billing/kasir/deposit/DepositAwalPanel.tsx) (250L):
  - Layout 2-col `[3fr_2fr]`: Left = search + (admisi list ATAU form) · Right sticky = DraftInvoicePreview / DepositInfoCard
  - Submit handler: create payment log dengan `kategori="Deposit"` + invoiceId placeholder draft + append ke shiftPaymentsMock + invoke `onAccumulate` + remove pasien dari `PASIEN_ADMISI_MOCK` + reset selection + trigger `tick++` untuk re-render list
  - Empty results state berbeda untuk "search empty" vs "tidak ada pasien admisi"
- [x] **Suggest amount based on kelas + LOS** ✅ — sudah inline di DepositForm + suggestDeposit helper (lihat di atas).
- [x] **Buat draft invoice** ✅ — saat submit, simulate creation via console.log + payment log (real backend BL3.3 prisma `invoice.create` + nested `payment.create` dalam 1 transaction).

### BL3.2 + BL3.3 Enrichment — ChargeSummary detail per-kategori ✅ Selesai (2026-05-24)

> **Konteks**: design awal Quick Bayar dan Deposit form hanya menampilkan SISA TAGIHAN total tanpa rincian. Gap UX: kasir tidak bisa jawab pertanyaan pasien "kenapa bayar segini?" tanpa pindah halaman. Solusi: tambah `ChargeSummaryCard` (Quick Bayar — lookup actual invoice) dan `EstimateChargeCard` (Deposit Awal — projection rate × LOS + buffer).

- [x] **Data layer chargeSummary.ts** ✅ — [chargeSummary.ts](src/lib/billing/chargeSummary.ts) (196L):
  - `getChargeSummary(invoiceId)` — lookup `INVOICE_DETAIL_MOCK[id]` → reuse `groupByKategori` + `netAfterItemDiskon` + `grandTotal` + `sisaTagihan` + `saldoDeposit` helpers (zero duplikasi). Return `{ kategori[], subTotal, diskonInvoice, ppn, materai, grandTotal, dibayar, sisa, itemCountTotal, hasDetail }`. Per-kategori `dominantCoverage` derived dari tally items (Penjamin/Pasien/Mixed) untuk badge.
  - `projectDepositBreakdown({kelas, losDays, penjaminTipe, admisiKategori})` — projection 3-baris (Akomodasi rate × LOS · Jasa Dokter visite × LOS · Buffer Obat/Lab/Tindakan dengan persentase per kategori admisi RI Baru 25% / Pre-Op Major 50% / ICU Admisi 80%). Penjamin coverage factor (Umum 100% / Asuransi 85% / BPJS-Jamkesda 30%) untuk derive beban pasien aktual.
- [x] **ChargeSummaryCard (Quick Bayar)** ✅ — [ChargeSummaryCard.tsx](src/components/billing/kasir/quick/ChargeSummaryCard.tsx) (232L):
  - **Header toggle**: ChevronDown rotate + ListChecks icon amber + label "Rincian Charge" + count chip "N kategori · M item" + grand subtotal mono kanan
  - **Body (expandable)** AnimatePresence height: 0↔auto:
    - List per-kategori dengan icon ring (per `KATEGORI_CFG`) + nama + count item + coverage badge (Penjamin emerald / Pasien amber / Mixed sky) + subtotal mono kanan
    - Footer totals dl/dt/dd: Sub-Total · Diskon Invoice (rose conditional) · PPN (conditional) · Materai (conditional) · **Grand Total** uppercase bold · Sudah Dibayar (emerald, conditional) · Sisa Tagihan (amber bold, sisaTone)
    - **Deep-link CTA** "Lihat Rincian Lengkap (per-item · void · audit · klaim)" → `/ehis-billing/tagihan/[id]` dengan ExternalLink icon shift on hover
  - **Auto-expand logic**: `itemCountTotal <= 5` → expanded saat mount (small invoice tidak ada untungnya collapse)
  - **Fallback `<NoDetailFallback />`** jika `hasDetail=false` — banner dashed slate dengan FileQuestion icon + deep-link "Buka detail tagihan"
- [x] **EstimateChargeCard (Deposit Awal)** ✅ — [EstimateChargeCard.tsx](src/components/billing/kasir/deposit/EstimateChargeCard.tsx) (140L):
  - **Header**: Sparkles amber + "Rencana Charge Estimasi" + chip "{losDays} hari rawat" amber + estimasi total mono kanan
  - **List 3-row** per-kategori dari `projectDepositBreakdown.rows` (Akomodasi/Jasa Dokter/Obat & BMHP buffer) dengan ikon + hint mono kecil ("Kelas K1 × 5 hari" · "Visite DPJP × 5 hari" · "Estimasi Pre-Op Major (Lab/Rad/Obat/Tindakan)") + nominal mono
  - **Footer**: Sub-Estimasi (full cost) · `Ditanggung Penjamin (~70%)` dengan TrendingDown emerald (conditional saat coveragePct > 0) · **Estimasi Beban Pasien** uppercase bold amber
  - **Footnote disclaimer** amber InfoIcon: "Estimasi kasar berbasis kelas × LOS + buffer. Charge real bisa berbeda — total final tergantung tindakan, obat, dan hasil lab/rad aktual."
  - **Live re-calc** via `useMemo` saat `losDays` slider berubah (re-render <16ms)
- [x] **Wiring di forms** ✅:
  - **QuickPaymentForm**: insert `<ChargeSummaryCard invoiceId={target.id} />` di body antara header context dan quick chips
  - **DepositForm**: insert `<EstimateChargeCard kelas losDays penjaminTipe admisiKategori />` setelah LOS slider sebelum Suggested breakdown card — live update saat LOS berubah
- [x] **Extend INVOICE_DETAIL_MOCK** ✅ — tambah 3 invoice detail baru di [invoiceMock.ts](src/components/billing/invoice/invoiceMock.ts): INV-003 (Bambang Sutrisno RI VIP Asuransi — Kardiologi PCI, 9 items, deposit 5jt) · INV-007 (Hendro Wibowo RI K1 BPJS — PCI + Stent DES, 5 items, klaim disetujui menunggu transfer) · INV-008 (Putri Maharani IGD K3 Jamkesda — small invoice 5 items 525K total). Sekarang search top-5 outstanding semua punya detail untuk demo.

**File sizes BL3.2-3.3 enrichment:** chargeSummary 196L · ChargeSummaryCard 232L · EstimateChargeCard 140L · QuickPaymentForm +5L (322L) · DepositForm +10L (360L) · invoiceMock +152L (434L). Total ~735L baru + 167L extension. TS clean (`npx tsc --noEmit` exit 0).

**Design decisions:**
- **Reuse existing helpers** (`groupByKategori`, `netAfterItemDiskon`, `grandTotal`, `sisaTagihan`) dari [invoiceCalc.ts](src/lib/billing/invoiceCalc.ts) — single source of truth, ChargeSummaryCard tidak re-implement aggregation logic.
- **Per-kategori (bukan per-item) di L1** — 5-7 baris breakdown scan-friendly, kasir bisa jawab pasien <3 detik. Per-item available via deep-link "Lihat Rincian Lengkap".
- **Auto-expand untuk small invoice (≤5 items)** — visual ringan, kasir tidak perlu klik tambahan untuk konten yang sudah pendek.
- **Coverage badge per kategori** (dominantCoverage) — instan info "kategori ini sebagian besar ditanggung Penjamin / Pasien". Kasir bisa explain "obat ini ditanggung BPJS, obat ini selisih dibayar sendiri".
- **EstimateChargeCard untuk Deposit** beda dari ChargeSummaryCard — pasien BARU belum punya invoice, jadi projection (forward-looking) bukan lookup. Hint mono kecil yang explain formula ("Kelas K1 × 5 hari").
- **Coverage factor di projectDepositBreakdown** (Umum 100% / Asuransi 85% / BPJS 30%) — reflect realita beban pasien aktual. BPJS hanya bayar selisih kelas / non-formularium.
- **Buffer % per admisi kategori** (RI Baru 25% / Pre-Op 50% / ICU 80%) — ICU = high-cost (sedasi, kultur, ventilator); pre-op = BMHP banyak + obat post-op; RI Baru = lebih predictable.
- **Live re-calc via useMemo** di EstimateChargeCard — slider LOS berubah, semua angka update <16ms, kasir feel responsive.
- **NoDetailFallback** untuk invoice tanpa detail mock — graceful degradation, deep-link tetap muncul.
- **Deep-link "Lihat Rincian Lengkap"** ke `/ehis-billing/tagihan/[id]` — escape hatch untuk audit complex tanpa duplikasi feature di counter.
- **Coverage chip pakai existing `COVERAGE_CFG`** dari invoiceShared.ts — konsisten dengan tampilan ChargeRow di Invoice Detail tab Rincian (BL2.2).

### BL3.2 + BL3.3 + BL2.3 Enrichment — Print Flow & Management View ✅ Selesai (2026-05-25)

> **Konteks**: setelah BL3.2/3.3 selesai, 2 gap muncul: (1) **tidak ada cetakan kwitansi setelah save** — kasir harus pindah ke invoice detail untuk cetak, padahal pasien menunggu di counter; (2) **persepsi redundansi** antara Tab Pembayaran (di invoice detail) dan Tab Quick Bayar (di counter) — user prompt: "bukanya ini memungkinkan adanya redundant?". Solusi consolidated plan: Batch 1 (Critical) auto-print + Batch 2 (Important) clarify persona + provenance tracking. Batch 3 (Nice-to-have demote inline form + promote refund/void + user preference toggle) belum dijalankan.

**Batch 1 — Critical (auto-print kwitansi):**

- [x] **kwitansiContext.ts adapter** ✅ — [kwitansiContext.ts](src/lib/billing/kwitansiContext.ts) (~110L): bridge `ShiftPaymentLog` ↔ `{InvoiceDetail, PaymentRecord}` untuk `KwitansiPrintModal`. 3 entry-point: `fromExistingInvoice(log)` (lookup `INVOICE_DETAIL_MOCK`) · `fromDepositInput(pasien, log)` (synthesize draft `InvoiceDetail` dari `PasienAdmisi` — invoice belum ada di DB) · `fromShiftLog(log)` (auto: cek `draftDetail` cache → fallback existing invoice). Strip 5 field extension dari log (`invoiceId`/`invoiceNo`/`pasienNama`/`pasienRM`/`draftDetail`) saat extract `PaymentRecord`.
- [x] **ShiftPaymentLog.draftDetail cache** ✅ — extend [shiftPaymentsMock.ts](src/lib/billing/shiftPaymentsMock.ts) dengan optional `draftDetail?: InvoiceDetail`. Saat deposit awal di-submit, panel synthesize ctx + simpan `detail` di log → reprint dari Recent Feed tetap bisa render header lengkap walaupun invoice masih draft. Backend ready: hapus field, query `prisma.invoice.findUnique`.
- [x] **C1 Quick Bayar auto-print** ✅ — [QuickBayarPanel.tsx](src/components/billing/kasir/quick/QuickBayarPanel.tsx) `handlePaymentSubmit` setelah `appendShiftPayment` → `onPrintKwitansi(fromShiftLog(log))` bubble ke parent. Modal langsung terbuka, kasir hanya tinggal klik Cetak (atau close jika tidak perlu).
- [x] **C2 Deposit awal auto-print** ✅ — [DepositAwalPanel.tsx](src/components/billing/kasir/deposit/DepositAwalPanel.tsx) `handleDepositSubmit` synthesize ctx via `fromDepositInput(pasien, baseLog)` → simpan `ctx.detail` ke `log.draftDetail` → append → `onPrintKwitansi(ctx)`. Kwitansi deposit muncul instan post-save, pasien dapat slip sebelum balik ke ruang admisi.
- [x] **KasirCounterPage host modal** ✅ — [KasirCounterPage.tsx](src/components/billing/kasir/KasirCounterPage.tsx) tambah state `kwitansiCtx: KwitansiContext | null` + render `<KwitansiPrintModal>` di akhir tree + pass `setKwitansiCtx` ke kedua panel. Single source of truth untuk kwitansi preview state, panel-panel tidak perlu host modal sendiri.

**Batch 2 — Important (management view + provenance):**

- [x] **I1 Reprint dari Recent Feed** ✅ — [QuickBayarPanel.tsx](src/components/billing/kasir/quick/QuickBayarPanel.tsx) `handleReprintFromFeed(p)` wrap `RecentPaymentsFeed.onPrintKwitansi` — klik tombol printer di feed row trigger same modal. Existing `Printer` icon button di [RecentPaymentsFeed.tsx](src/components/billing/kasir/quick/RecentPaymentsFeed.tsx) (sudah ada UI, sebelumnya `onPrintKwitansi` prop tidak di-wire dari KasirCounterPage). Sekarang fungsional 100%.
- [x] **I2 Management Banner di PembayaranTab** ✅ — [PembayaranTab.tsx](src/components/billing/invoice/tabs/PembayaranTab.tsx) tambah `<ManagementBanner />` di top dengan 3 elemen: (a) icon `Layers` indigo + title "Detail Management View · per Invoice" + body explain peran (refund / void / cicilan terstruktur 1 invoice) · (b) cross-link button "Quick Bayar" amber dengan `Zap` icon + `ExternalLink` → `/ehis-billing/pembayaran?tab=quick` · (c) sm:flex-row layout (mobile stack, desktop side-by-side). Tujuan: hilangkan persepsi redundansi — user lihat banner langsung tahu "ini bukan tempat antrian cepat, ini detail manajemen 1 invoice".
- [x] **I3 Cross-link OutstandingResultRow ke Detail** ✅ — [OutstandingResultRow.tsx](src/components/billing/kasir/quick/OutstandingResultRow.tsx) refactor outer dari `motion.button` ke `motion.div` (HTML valid — button tidak boleh nest `<a>`) + split 3 button area (main info / sisa / actions) yang masing-masing trigger `onSelect`, plus `Link target="_blank"` "Detail" secondary di bawah "Bayar". stopPropagation pada Link supaya tidak trigger main select. Kasir bisa "peek" invoice detail tanpa kehilangan posisi di Quick Bayar list.
- [x] **I4 `source` field di PaymentRecord** ✅ — extend [invoiceShared.ts](src/components/billing/invoice/invoiceShared.ts) dengan `type PaymentSource = "Quick" | "Detail" | "Deposit" | "Refund"` + optional `source?: PaymentSource` di `PaymentRecord` (default "Detail" di addPayment InvoiceDetailPage jika tidak set). Auto-set di submit handlers:
  - `QuickPaymentForm.submit` → `source: "Quick"`
  - `DepositForm.submit` → `source: "Deposit"`
  - `PaymentForm (Detail)` → fallback `"Detail"` (set di `InvoiceDetailPage.addPayment` jika caller absent)
  - `refundPayment` (InvoiceDetailPage) → `source: "Refund"`
- [x] **Render badge `via Quick` / `via Detail`** ✅ — [PaymentRow.tsx](src/components/billing/invoice/tabs/payment/PaymentRow.tsx) tambah `SOURCE_CFG` (4-color palette: amber Quick / indigo Detail / sky Deposit / orange Refund) + render small chip "via {label}" di meta row dekat `noKwitansi`. Conditional: hanya tampil saat `kategori === "Pembayaran"` (Deposit + Refund sudah ada chip kategori sendiri jadi tidak duplikat). Tooltip "Pembayaran diterima via Quick/Detail" via `title` attr.
- [x] **Backfill `source` di mock data** ✅ — INV-001 pay-001-01 → `source: "Deposit"` · INV-003 pay-003-01 → `source: "Deposit"` · INV-009 3 payments → `Deposit/Detail/Refund` masing-masing. Plus 8 entry [shiftPaymentsMock.ts](src/lib/billing/shiftPaymentsMock.ts) SHIFT_001 — mix `Quick` (5) + `Detail` (1) + `Deposit` (1) untuk demonstrate diverse sources di Recent Feed.

**File sizes BL3 print enrichment:** kwitansiContext 110L (new) · KasirCounterPage +8L (281L) · QuickBayarPanel +18L (214L) · DepositAwalPanel +14L (264L) · QuickPaymentForm +1L · DepositForm +1L · OutstandingResultRow rewrite 130L (97L→130L) · PembayaranTab +71L (133L) · PaymentRow +22L · invoiceShared +6L · InvoiceDetailPage +3L · invoiceMock +4L · shiftPaymentsMock +9L (132L). Total ~280L baru + 80L extension. TS clean (`npx tsc --noEmit` exit 0).

**Design decisions:**
- **kwitansiContext adapter ≠ duplicate getInvoiceDetail** — adapter punya 2 use case yang berbeda: (1) lookup existing (caller punya invoiceId, butuh PaymentRecord pure) · (2) synthesize draft (deposit awal, invoice belum exist). `getInvoiceDetail` di invoiceMock.ts hanya cover case #1 + return full mock object. Bridge ini provide narrow interface `{detail, payment}` yang exactly cocok untuk KwitansiPrintModal.
- **draftDetail di-cache di log, bukan global registry** — alternative `DEPOSIT_DRAFT_DETAILS: Record<id, InvoiceDetail>` ditolak karena: (a) global state bocor antar shift · (b) hard to clean up · (c) coupling antara log & cache fragile. Embed di log = single owner, auto cleanup saat log di-purge.
- **Auto-print TIDAK pakai user toggle (N3 Nice-to-have)** — Batch 1 sengaja default ON tanpa toggle. Rationale: 95% kasir akan cetak (compliance + pasien minta bukti). Toggle = future tweak jika user complain workflow modal terlalu cepat.
- **Banner Management bukan banner permanent di atas semua tab** — hanya di Tab Pembayaran, karena di sinilah persepsi redundansi muncul. Tab Rincian / Klaim / Riwayat punya purpose jelas yang tidak overlap dengan Counter.
- **Cross-link "Quick Bayar" pakai `?tab=quick` query param** — future-friendly: KasirCounterPage tinggal `useSearchParams` untuk auto-switch tab. Belum di-wire (deferred ke follow-up), URL tetap valid dan user bisa manual klik tab saat landing.
- **Detail link di OutstandingResultRow `target="_blank"`** — kasir tidak kehilangan posisi di counter saat peek detail. Plus pakai `rel="noopener noreferrer"` untuk security.
- **`source` field bukan computed dari kategori** — kategori (Pembayaran/Deposit/Refund) = WHAT. Source (Quick/Detail/Deposit/Refund) = WHERE diinput. Orthogonal axes: Pembayaran bisa diinput via Quick ATAU Detail. Tracking ini bermanfaat untuk audit per-counter performance + future report "Quick Bayar coverage ratio".
- **Render badge `via X` hanya saat `kategori === Pembayaran`** — Deposit + Refund sudah ada chip kategori distinct (sky/orange). Avoid visual noise dengan duplikat info.
- **SOURCE_CFG amber untuk Quick** — match accent module (amber = billing). Indigo untuk Detail = contrast yang clear.
- **Pre-seed mock dengan distribusi realistic** — SHIFT_001 8 entries: 5 Quick (62%) + 1 Detail (12%) + 1 Deposit (12%) + 1 Refund placeholder (di INV-009). Reflect realita: mayoritas pembayaran via counter cepat, sebagian besar via detail management saat kasus complex (refund/void).

### Restructure: Tab-based architecture ✅

- [x] **KasirTabs nav** ✅ — [KasirTabs.tsx](src/components/billing/kasir/KasirTabs.tsx) (83L): 3 tab `Dashboard / Quick Bayar / Deposit Awal` dengan icon (LayoutDashboard/Zap/PiggyBank) + count badge mono + framer motion `layoutId` underline + `disabledIfNoShift` flag untuk Quick & Deposit (tab disabled + tooltip "Buka shift dulu" jika no active shift).
- [x] **DashboardPanel extract** ✅ — [DashboardPanel.tsx](src/components/billing/kasir/DashboardPanel.tsx) (96L): isi tab Dashboard yang sebelumnya inline di KasirCounterPage (ActiveShiftCard / EmptyShiftState · MethodBreakdown · RecentShiftsTable + KPI + OtherCounters di kanan).
- [x] **KasirCounterPage restructure** ✅ — [KasirCounterPage.tsx](src/components/billing/kasir/KasirCounterPage.tsx) (273L):
  - State: `shifts` (mutable) · `activeTab` · `modal` · `mutationTick` (trigger re-render saat mock store mutated di QuickBayar/Deposit)
  - Tab counts derived dari `getShiftPayments(activeShift.id).length` (Quick) + `PASIEN_ADMISI_MOCK.length` (Deposit)
  - **`handleAccumulate(metode, nominal)`** — payment dari Quick/Deposit otomatis update `activeShift.totalByMetode[metode] + nominal` + `totalTransaksi++` (live demo bahwa BL3.2/3.3 actions feed kembali ke BL3.1 dashboard)
  - AnimatePresence mode="wait" switch antar panel dengan fade+y transition 180ms
  - Modal Buka/Tutup tetap di akhir component tree

**File sizes BL3.2 + BL3.3:** shiftPaymentsMock 128L · outstandingSearch 53L · depositMock 218L · KasirTabs 83L · DashboardPanel 96L · OutstandingResultRow 97L · QuickBayarPanel 196L · QuickPaymentForm 318L · QuickSearchInput 55L · RecentPaymentsFeed 185L · AdmisiResultRow 130L · DepositAwalPanel 250L · DepositForm 351L · DraftInvoicePreview 128L · KasirCounterPage 273L (refactored). Total ~2561L lintas 15 file, semua jauh di bawah 800 limit. TS clean (`npx tsc --noEmit` exit 0).

**Design decisions:**
- **3-tab architecture** (Dashboard/Quick Bayar/Deposit) — kasir punya 3 mode kerja yang clear-cut. Hindari single-page yang overwhelming dengan semua fungsi sekaligus.
- **Tab disabled jika no active shift** — gating workflow, kasir harus buka shift dulu sebelum bisa terima bayar. Tooltip clear "Buka shift dulu untuk aksi ini".
- **Tab count badge live** dari `getShiftPayments().length` (Quick = jumlah transaksi shift) dan `PASIEN_ADMISI_MOCK.length` (Deposit = pasien menunggu). Beri kasir context numeric tanpa harus klik tab.
- **handleAccumulate auto-update activeShift** — payment dari tab Quick/Deposit feed langsung ke `totalByMetode` di Dashboard tab. Demo realistic flow: terima bayar → switch tab Dashboard → lihat saldo cash naik real-time.
- **Quick form simplified dari BL2.3 PaymentForm** — no kategori toggle (default Pembayaran), header context card berbeda (target invoice info), submit button "Terima Pembayaran" eksplisit. UX: kasir tidak perlu mikir kategori (deposit di tab terpisah).
- **suggestDeposit dengan buffer per penjamin** (Umum 30% > Asuransi 20% > BPJS 10%) — reflect realita: Umum harus cover semua (perlu deposit besar), BPJS hanya cover non-cover items (deposit kecil).
- **Override nominal dengan badge indikator** — UX clarity: kasir tahu apakah saran sistem atau manual. Link "← Pakai saran" untuk easy reset.
- **DraftInvoicePreview sticky di right** — saat kasir input deposit form, preview "what will happen" visible. Reduce post-submit surprise.
- **PASIEN_ADMISI_MOCK auto-delete saat submit** — mock realism: pasien dari list pending hilang setelah deposit dibuka. `tick++` trigger re-render via `useEffect` dependency.
- **Search input large + ring-4 amber saat focus** — focal point UX, kasir cepat tau "ini cari, ketik di sini".
- **Sort by urgensi di admisi** — Emergency surface duluan, audit-friendly (kasir tidak miss kasus CITO yang butuh deposit segera).
- **Layout 2-col `[3fr_2fr]`** consistent di Quick + Deposit panel — predictable UX antar tab.
- **AnimatePresence mode="wait"** antar list↔form dan antar tab — smooth transition tanpa overlap.

### BL3.4 Laporan Tutup Kas ✅ Selesai (2026-05-25)

- [x] **`LaporanKasShift` print modal** ✅ — [LaporanKasShiftModal.tsx](src/components/billing/kasir/modals/LaporanKasShiftModal.tsx) (24L) wrapper di atas `PrintModalShell` + [LaporanKasShiftSheet.tsx](src/components/billing/kasir/print/LaporanKasShiftSheet.tsx) (256L). A4 default (dokumen arsip resmi), A5 toggle untuk fit struk printer.
  - **KOP RS** via `KopSurat` shared
  - **Title strip** centered: "LAPORAN TUTUP KAS" uppercase tracking-[0.3em] + Shift ID mono + timestamp cetak
  - **Section 1 — Identitas Shift** grid 2-col dalam border slate-300 bg-slate-50/40: Counter+lokasi · Kasir+Supervisor · Buka→Tutup+Durasi · Total Transaksi
  - **Section 2 — Rincian Transaksi per Metode** tabel 4-kolom border-solid (No/Metode/Keterangan/Nominal). 5 metode (Tunai/Transfer/QRIS/EDC/Voucher) + row refund conditional (rose) + footer **TOTAL PENERIMAAN BERSIH** bold dengan border-2 slate-700. Terbilang Indonesia di bawah.
  - **Section 3 — Rekonsiliasi Kas Tunai** tabel 6-baris equation: Saldo Awal + Tunai − Refund Tunai = **Saldo Tunai Seharusnya** (Expected, amber bordered) · Saldo Akhir Aktual · **Selisih** dengan 3-tone palette (Balance emerald · Surplus sky · Minus rose) + ikon. Footer mini-grid: Total Non-Tunai + Saldo Wajib Disetor.
  - **Section 4 — Catatan** kasir tutup + buka shift (italic quote)
  - **Signature** 2-col via `SignatureBlock` shared (Kasir · Supervisor) dengan lokasi+tanggal di kanan
  - **Footer compliance** disclaimer: BLUD Permendagri 27/2013 (arsip 5 tahun) + UU PDP 27/2022 + Berita Acara Audit jika selisih ≠ 0
- [x] **`SetoranFormModal` + Setoran ke keuangan flow** ✅ — [SetoranFormModal.tsx](src/components/billing/kasir/modals/SetoranFormModal.tsx) (252L):
  - **Shift context card** amber dengan icon Wallet + counter nama + kasir + shift ID mono + 4-stat grid (Saldo Akhir · Saldo Awal · Selisih Shift · **Net Tunai (suggest)** amber bold)
  - **Form 4 field**: No Setoran (auto-gen `STR/YYYY/MM/NNNNN` via `nextNoSetor`, editable mono) · Tanggal Serah (`datetime-local` default now) · Penerima (select 3 bendahara mock: Hari Mulyana/Ningsih Pratiwi/Agus Setiawan) · Nominal Rp (default `tutupSaldoAkhir − bukaSaldoAwal`, large right-align mono dengan badge "ikut saran" amber atau link "← Pakai saran" untuk reset) + Catatan opsional 2-row
  - **Live terbilang** Indonesia italic saat nominal > 0
  - **Sky warning banner** jika nominal manual ≠ saran sistem ("Pastikan catatan menyertakan alasan perbedaan")
  - **Validation real-time**: noSetor + tanggalSerah + penerima wajib, nominal > 0
  - **Submit "Catat & Cetak Slip"** dengan icon PiggyBank — auto-pivot ke `SetoranSlipPrintModal` setelah save (mirror pattern auto-print kwitansi di BL3.2/3.3)
  - Reuse `ModalShell` / `Field` / `ModalFooter` / `inputCn` / `selectCn` dari `AddItemModal` (DRY)
- [x] **`SetoranSlipPrintModal` + `SetoranSlipSheet`** ✅ — [SetoranSlipPrintModal.tsx](src/components/billing/kasir/modals/SetoranSlipPrintModal.tsx) (24L) wrapper + [SetoranSlipSheet.tsx](src/components/billing/kasir/print/SetoranSlipSheet.tsx) (138L). A5 default (compact 1-halaman untuk arsip keuangan), A4 toggle.
  - **KOP RS** + Title "SLIP SETORAN KAS" + No Setoran mono
  - **Body 6 Row klasik**: Telah diterima dari (kasir nama + counter) · Diterima oleh (bendahara) · Sejumlah (nominal Rupiah 20px bold mono) · Terbilang (italic dalam border-l klasik) · Sumber kas (shift ID + counter + jam buka/tutup; conditional catatan selisih) · Tanggal serah (long format + jam) · Catatan opsional
  - **Signature** 2-col (Penyetor/Kasir · Penerima/Bendahara)
  - **Footer compliance** disclaimer 2 copy + arsip 5 tahun + 1×24h reporting selisih
- [x] **Kebab actions di `RecentShiftsTable`** ✅ — [RecentShiftsTable.tsx](src/components/billing/kasir/RecentShiftsTable.tsx) extended dengan kolom **Setoran** (badge "Disetor" emerald PiggyBank icon / "Belum" amber Clock4 icon + tooltip `noSetor + penerima`) + kolom **Aksi** (MoreVertical kebab dropdown):
  - **"Cetak Laporan Tutup Kas"** (FileText icon) — selalu available
  - **"Catat Setoran"** (PiggyBank icon, accent amber) — jika belum disetor → buka SetoranFormModal
  - **"Cetak Slip Setoran"** (Printer icon) — jika sudah disetor → langsung buka SetoranSlipPrintModal
  - Outside-click + ESC close
  - Status pill (Open/Closed) + Supervisor truncate di-pindah ke kolom Setoran (1 kolom merge untuk hemat ruang horizontal)
- [x] **Extend type `KasirShift`** ✅ — [kasirShiftMock.ts](src/lib/billing/kasirShiftMock.ts) tambah optional `setoran?: SetoranRecord` field:
  ```ts
  interface SetoranRecord {
    noSetor: string;        // STR/YYYY/MM/NNNNN
    tanggalSerah: string;   // ISO
    penerima: string;
    nominal: number;
    catatan?: string;
  }
  ```
  Schema 1:1 dengan target Prisma — backend siap pisah jadi tabel `SetoranKas` dengan FK ke `shiftId`.
- [x] **Helpers baru** ✅ — di [kasirShiftMock.ts](src/lib/billing/kasirShiftMock.ts):
  - `nextNoSetor(shifts, refDate?)` — scan setoran bulan ini → max running number + 1, format `STR/YYYY/MM/NNNNN`. Backend ganti `prisma.setoran.findFirst({ orderBy: { noSetor: "desc" } })` dalam transaction.
  - `shiftsBelumDisetor(shifts)` — filter Closed + !setoran, sorted DESC by bukaAt. Untuk future "Setoran Queue" view (BL8 dashboard).
- [x] **Mock seed extend** ✅ — 2 dari 4 closed shift sudah punya `setoran`: `shift-2026-0523-sore` (Sari, balance, STR/2026/05/00041) + `shift-2026-0522-pagi` (Bambang, surplus 35K, STR/2026/05/00040). 2 closed shift sengaja belum disetor (`shift-2026-0523-malam` IGD nunggu jam keuangan buka + `shift-2026-0523-pagi` Rian minus 50K) — demo flow "Catat Setoran" baru.
- [x] **Wiring di `KasirCounterPage`** ✅ — state `shiftActionState: { action, shift } | null` + handler `handleShiftAction` (dispatcher dari kebab → set state) + handler `handleRecordSetoran` (immutable mutate `shifts[].setoran` + auto-pivot ke setoran-slip print modal). Pass `onShiftAction` ke `DashboardPanel` → `RecentShiftsTable`. 3 modal mount di akhir component tree dengan `open` derived dari `action`.

**File sizes BL3.4:** LaporanKasShiftSheet 256L · LaporanKasShiftModal 24L · SetoranSlipSheet 138L · SetoranSlipPrintModal 24L · SetoranFormModal 252L · RecentShiftsTable rewrite 320L (185L→320L, +135L untuk kolom Setoran + ShiftRowActions kebab) · kasirShiftMock +60L (type SetoranRecord + 2 setoran mock seed + nextNoSetor + shiftsBelumDisetor + 394L total) · KasirCounterPage +35L (state shiftActionState + handler handleRecordSetoran/handleShiftAction + 3 modal render) · DashboardPanel +3L (onShiftAction prop drill). Total ~860L baru + 230L extension lintas 8 file, semua jauh di bawah 800 limit. TS clean (`npx tsc --noEmit` source files 0 error).

**Design decisions:**
- **Laporan A4 default · Slip Setoran A5 default** — laporan = dokumen arsip resmi (perlu space untuk reconciliation table + signature 2-col); slip = kompak 1-halaman cocok printer struk + folder arsip keuangan.
- **Section numbering 1-4 di laporan** + border solid tabel — convey "dokumen audit formal", BLUD compliance. Bukan UI dashboard.
- **Reconciliation table dengan ReconRow + 3-tone selisih** — kasir + auditor visual scan: Expected vs Aktual + selisih jelas dengan ikon (CheckCircle2/TrendingUp/AlertTriangle). Selisih ≠ 0 → row rose + label "Audit Required" eksplisit.
- **Total Penerimaan Bersih = total − refund** (bukan total gross) — refund self-cancel dari penerimaan, biar reconciliation accurate.
- **Auto-pivot setelah `handleRecordSetoran`** — save → langsung buka SetoranSlipPrintModal. Mirror pattern BL3.2/3.3 auto-print kwitansi: kasir tidak perlu klik 2x untuk cetak slip post-save. Bendahara langsung dapat cetakan untuk tanda-tangan.
- **Default nominal setoran = `tutupSaldoAkhir − bukaSaldoAwal`** — convention RS BLUD (saldo awal kembali ke next shift, net cash income disetor). User bisa override dengan badge indikator "manual override" vs "ikut saran" + alasan wajib di catatan.
- **3 bendahara mock dengan role berbeda** (Bendahara Penerima · Staf Keuangan · Kasubag Keuangan) — RS biasanya hierarki: hari biasa staf/penerima, weekend/cito kasubag. Backend ganti dengan filter role + master pegawai.
- **`nextNoSetor` scan bulan-ini saja** (bukan global) — running number reset per bulan, sesuai konvensi nomor surat RS pemerintah `STR/YYYY/MM/NNNNN`.
- **2 mock setoran + 2 sengaja belum disetor** — demonstrate 2 state realistic: badge Disetor (emerald) vs Belum (amber), kebab action pilihan berbeda.
- **Kebab "Catat Setoran" pakai accent amber** (bukan slate netral) — visual cue: ini action utama yang dibutuhkan operationally setelah tutup shift. "Cetak Laporan" + "Cetak Slip Setoran" netral karena read-only.
- **Kolom Setoran merge dengan Supervisor + Status** — hemat horizontal space (table jadi 7 kolom saja), supervisor truncate 22 char, status sebagai mini dot pill di bawah badge setoran. Trade-off compactness vs readability — laporan detail lengkap tetap ada di print preview.
- **3-state modal dispatcher via discriminated union** `{ action: ShiftRowAction, shift: KasirShift } | null` — 1 state object, modal `open` derived dari `action === "laporan"` dll. Lebih clean dari 3 state terpisah.

**Acceptance BL3.4 ✅:** klik kebab Aksi di Recent Shifts → 3 menu (laporan / setoran-form atau setoran-slip). "Cetak Laporan Tutup Kas" tampil A4 sheet lengkap dengan rekonsiliasi 5-metode + selisih palette + signature kasir+supervisor. "Catat Setoran" buka form dengan auto-gen STR/2026/05/00042, default nominal net cash, save → langsung cetak slip A5. "Cetak Slip Setoran" untuk shift sudah disetor tampil slip dengan no setoran + bendahara + nominal + terbilang.

**Acceptance BL3:** kasir bisa buka shift, terima pembayaran, tutup shift dengan saldo balanced, cetak laporan **+ catat setoran ke bendahara + cetak slip setoran**.

---

## Phase BL4 — ~~Klaim BPJS & Asuransi~~ → PINDAH KE [`/ehis-eklaim`](TODO-EKLAIM.md)

> **Seluruh fase BL4 dipindah** ke modul baru `/ehis-eklaim` per keputusan arsitektur 2026-05-24.
>
> **Alasan:** workflow klaim adalah batch cross-invoice (puluhan/ratusan tagihan per submit), persona berbeda (Tim Klaim/Coder ≠ Kasir), integrasi V-Claim/E-Klaim Kemenkes berat, butuh dashboard analytics dedicated (approval rate · aging · INA-CBG margin), reconciliation 1-to-N transfer BPJS kompleks.
>
> **Roadmap baru:** [TODO-EKLAIM.md](TODO-EKLAIM.md) fase EK0-EK9 (~3-4 minggu effort).
> - EK1 Beranda E-Klaim · EK2 Klaim Board · EK3 Klaim Detail (6 tab)
> - EK4 INA-CBG Calculator · EK5 Berkas Generator · EK6 Banding
> - EK7 Reconciliation · EK8 Dashboard Analytics · EK9 Polish
>
> **Yang tetap di billing:** BL2.4-lite (read-only status chip + deep link cross-modul).

---

## Phase BL5 — Adjustment & Diskon

**Route:** `/ehis-billing/adjustment` · **Effort:** 2–3 hari

### BL5.1 Master Diskon

- [ ] **`/ehis-master/diskon`** (new master, accent rose):
  - List jenis diskon: Pegawai RS, Keluarga Pegawai, Direktur Discretion, Bansos, Promo, dll.
  - Field: kode, nama, jenis (`%` / `Rp`), nominal/persen, batas maksimum, perlu approval (`approvalRequired: boolean`), berlaku untuk (kategori filter), masa berlaku.
- [ ] **Mock 8–10 jenis diskon**.

### BL5.2 Approval Workflow

- [ ] **`AdjustmentApprovalPanel`** — list adjustment Pending dengan tombol Approve / Reject.
- [ ] **Notifikasi** to approver saat ada request baru (in-app only, badge counter).
- [ ] **Audit log** per adjustment dengan reason approve/reject.

### BL5.3 Write-off

- [ ] **Form write-off** piutang tak tertagih (>90 hari outstanding) — wajib approval direksi.
- [ ] **Laporan write-off bulanan**.

**Acceptance BL5:** kasir request diskon Pegawai 20%, supervisor approve, item subtotal berubah, audit trail tercatat.

---

## Phase BL6 — Integrasi Lintas Modul (Charge Ingestion) ✅ ~80% (2026-05-26)

**Effort:** 3–4 hari · **Strategi:** silent wiring di balik tab existing — UI klinis tidak berubah, billing auto-update.

> **Status:** Foundation observable store + adapter pure pattern + ingest orchestrator selesai. Lab/Rad/Farmasi/Akomodasi sudah live-wired. Tindakan + Jasa Dokter pending (adapter ready, tinggal hook ke save handler). Mini Widget IGD/RJ pending (drop-in component sudah ada).

### Foundation (Pure Adapter + Observable Store) ✅

- [x] **`src/lib/billing/priceResolver.ts`** ✅ (193L) — Pure resolvers `resolveTindakanPrice` / `resolveLabPrice` / `resolveRadPrice` / `resolveObatPrice` / `resolveJasaDokterPrice` / `resolveAkomodasiPrice` (TARIF_MOCK + OBAT_MOCK + `AKOMODASI_RATE_PER_HARI` per kelas). Return `PriceResolution { hargaSatuan, resolved, source, masterId? }`.
- [x] **`src/lib/billing/sourceAdapter.ts`** ✅ (283L) — Pure converters event → `ChargeItem[]`. `chargeFromLabOrder(order, ctx)` (1 per test, sourceRef `lab:{orderId}:{kode}`) · `chargeFromRadOrder` · `chargeFromFarmasiOrder` (per item dispensing) · `chargeFromTindakan` · `chargeFromAkomodasi` (loop tanggal range, 1 charge per hari) · `chargeFromJasaDokter`. Helper `defaultCoverage(penjamin)` → Pasien (Umum) / Penjamin (others). Idempotent via deterministic `sourceRef`.
- [x] **`src/lib/billing/billingStore.ts`** ✅ (206L) — Observable store dengan `useSyncExternalStore`. Module singleton `Map<invoiceId, InvoiceDetail>` + `Set<listeners>`. Public API:
  - `setInvoiceDetail(id, detail)` / `getInvoiceDetail(id)` / `mutateInvoice(id, updater)`
  - `appendCharges(id, items, opts)` — dedupe by `sourceRef`, return `{ added, skipped, invoiceId, ok }`
  - `findActiveInvoiceForPasien(noRM)` — scan store first, fallback `TAGIHAN_BOARD_MOCK`; return non-Lunas non-Void latest
  - `useInvoiceDetail(id)` — React hook subscribe re-render
- [x] **`src/lib/billing/chargeIngest.ts`** ✅ (217L) — High-level orchestrator. `ingestLabOrder(order, invoiceId?)` / `ingestRadOrder` / `ingestFarmasiOrder` / `ingestAkomodasi({invoiceId, kunjunganId, tanggalAdmisi, tanggalSampai?})`. Auto-resolve invoiceId via `findActiveInvoiceForPasien` jika tidak di-pass. Return `IngestResult` dengan `reason` field untuk debugging ("no-invoice" / "invoice-not-in-store" / "no-items").

### BL6.1 Trigger Points — silent wiring di handler "Selesai" / "Tervalidasi"

- [x] **Lab → Billing** ✅ — [src/components/lab/tabs/ValidasiPane.tsx](src/components/lab/tabs/ValidasiPane.tsx) `handleValidate` setelah `updateLabWorkflow` → `ingestLabOrder(order)`. Console log "[Billing] Lab {noOrder} → invoice {id} (+N charges)". Idempotent saat re-validate.
- [x] **Rad → Billing** ✅ — [src/components/rad/tabs/ValidasiPane.tsx](src/components/rad/tabs/ValidasiPane.tsx) `handleValidate` → `ingestRadOrder({...order, status: "Selesai", timestamps: {..., verifikasiHasil: now}})`. Sama pattern dengan Lab.
- [x] **Farmasi → Billing** ✅ — [src/components/farmasi/FarmasiOrderTabs.tsx](src/components/farmasi/FarmasiOrderTabs.tsx) `handleDispensasiSubmit` → `ingestFarmasiOrder({...order, items, serahTerima, status: "Selesai", timestamps: {..., serahTerima: serahTerima.waktu}})`.
- [x] **Akomodasi RI → Billing** ✅ — [src/components/billing/invoice/InvoiceDetailPage.tsx](src/components/billing/invoice/InvoiceDetailPage.tsx) `useEffect` mount: jika invoice tipe RI dan `kelas` tersedia → `ingestAkomodasi({invoiceId, kunjunganId, tanggalAdmisi, tanggalSampai?})`. Loop hari rawat per `tanggalAdmisi` → today. Dedupe by sourceRef `akomodasi:{kunjunganId}:{yyyy-mm-dd}` aman saat re-mount.
- [ ] **Tindakan → Billing** — pending. Adapter `chargeFromTindakan` sudah ready. Tinggal hook ke `TindakanTab` save handler (1 line `ingestTindakan(...)`) di IGD/RI/RJ.
- [ ] **Jasa Dokter** — pending. Adapter `chargeFromJasaDokter` ready. Hook ke CPPT verified handler (IGD per-shift · RI per-visite-day · RJ per-visit) + KonsultasiTab closed-loop.

### BL6.2 Discharge Gating (RI) ✅

- [x] **`BillingGateBanner`** ✅ — [src/components/rawat-inap/pasienPulang/BillingGateBanner.tsx](src/components/rawat-inap/pasienPulang/BillingGateBanner.tsx) (189L). Reactive via `useInvoiceDetail` — re-render saat charge ingest atau payment baru. 4 union states:
  - `no-invoice` (slate Info) — discharge boleh, charge biasanya muncul auto setelah modul klinis tutup order
  - `lunas` (emerald CheckCircle2) — total Rp X sudah dibayar penuh + deep-link Buka Billing
  - `klaim` (sky ShieldCheck) — klaim {penjamin} dalam proses, sisa selisih ditanggung penjamin + deep-link
  - `outstanding` (rose AlertTriangle + badge "Perlu Aksi") — sisa Rp X, selesaikan di Kasir + deep-link
- [x] **Wired di `PasienPulangTab`** ✅ — [src/components/rawat-inap/tabs/PasienPulangTab.tsx](src/components/rawat-inap/tabs/PasienPulangTab.tsx) di antara header dan sub-tab nav.
- [ ] **Bypass dengan approval** — pending. Saat ini UI tidak hard-block (banner visual saja), backend nanti enforce constraint via API.

### BL6.3 Cross-modul Widget ✅ ~33%

- [x] **`BillingMiniWidget`** ✅ — [src/components/shared/medical-records/BillingMiniWidget.tsx](src/components/shared/medical-records/BillingMiniWidget.tsx) (155L). Reactive via `useInvoiceDetail`. 2 mode (compact chip / card 2-row) × 3 state (no-invoice slate · lunas emerald · outstanding rose). Klik → `target="_blank"` ke `/ehis-billing/tagihan/[id]`.
- [x] **RI breadcrumb** ✅ — [src/components/rawat-inap/RIPatientHeader.tsx](src/components/rawat-inap/RIPatientHeader.tsx) wire `<BillingMiniWidget noRM={...} compact />` di breadcrumb bar (antara status badge dan X close).
- [ ] **IGD `PatientBanner`** — pending. Component shared, drop-in ready (`<BillingMiniWidget noRM={pasien.noRM} compact />`).
- [ ] **RJ `RJPatientHeader`** — pending. Sama dengan IGD.

### Single-source Refactor (bonus, 2026-05-25)

> **Konteks:** registrasi `/ehis-registration/pasien/{id}` punya `AccountingModal.tsx` 506L yang duplikat form pembayaran/deposit dari `/ehis-billing`. Violation single-source-of-truth → user feedback: "fix-kan dlu, bahwa semua tagihan pembayaran itu lewat modul ehis-billing".

- [x] **Delete `AccountingModal.tsx`** ✅ (506L) — duplicate payment form dihapus.
- [x] **`PatientDashboard.tsx`** ✅ — hapus `showKasir` state · `AccountingModal` import & render · `onKasir` prop.
- [x] **`PatientLeftPanel.tsx`** ✅ — hapus `onKasir` prop · tambah badge "Read-only" di header · footer CTA "Buka di Billing Kasir →" `Link target="_blank"` ke `/ehis-billing/tagihan` · row click always opens peek modal (bukan trigger payment).
- [x] **`BillingDetailModal.tsx`** ✅ — info banner amber "Read-only view · transaksi dikelola di Billing" + footer split (primary "Buka di Billing Kasir →" deep-link + "Tutup" secondary).

**Acceptance BL6 (sebagian) ✅:** Lab CITO di IGD selesai → otomatis muncul charge baru di invoice detail (`useInvoiceDetail` re-render) + Discharge Banner update + Mini Widget RI breadcrumb update — semua reactive, <100ms karena `useSyncExternalStore` notify sinkron. Registrasi tidak bisa input payment lagi (read-only + deep-link only).

---

## Phase BL7 — Reports & Analytics

**Route:** `/ehis-billing/report` (atau push ke `/ehis-report`) · **Effort:** 3–4 hari

### BL7.1 Pendapatan

- [ ] **Pendapatan Harian/Bulanan** dashboard — line chart total/dibayar/sisa per hari.
- [ ] **Breakdown per Unit** — pie/bar IGD/RJ/RI/Lab/Rad/Farmasi.
- [ ] **Breakdown per Penjamin** — BPJS vs Umum vs Asuransi.
- [ ] **Breakdown per Kategori** — Tindakan/Lab/Rad/Obat/Akomodasi/Jasa Dokter.

### BL7.2 Outstanding & Aging

- [ ] **Aging piutang report** — bucket 0-30/31-60/61-90/>90 hari per penjamin.
- [ ] **Top 10 outstanding** — daftar pasien dengan sisa terbesar.

### ~~BL7.3 Klaim BPJS~~ → PINDAH KE [`/ehis-eklaim`](TODO-EKLAIM.md) EK8 Dashboard Analytics

> Recap klaim + INA-CBG margin analysis menjadi tanggung jawab modul E-Klaim (EK8), bukan reporting billing. Billing tetap punya report Pendapatan/Outstanding/Aging/Pendapatan Dokter.

### BL7.4 Pendapatan Dokter (Jasa Pelayanan)

- [ ] **Recap per DPJP** — total tindakan + jasa medis per bulan.
- [ ] **Detail per dokter** — list tindakan + tarif + share %.

### BL7.5 Export

- [ ] **Excel export** (`xlsx`) per report.
- [ ] **PDF export** (print-stylesheet → `window.print()`).

**Acceptance BL7:** dashboard tampil data demo 30 hari, drill-down per unit/penjamin/dokter berfungsi.

---

## Phase BL8 — Beranda Billing (Dashboard) ✅ 100% (2026-05-25)

**Route:** `/ehis-billing` (replace placeholder) · **Effort:** 2 hari
**Pattern reference:** Beranda Master di Phase 3.1

### BL8.1 Layout ✅

- [x] **Hero header** ✅ — eyebrow chip Wallet amber + h1 "EHIS Billing" + desc + timestamp pill `id-ID` long format + jam mono.
- [x] **KPI Strip** 5 hero card animated ✅ — [KPIStripBilling.tsx](src/components/billing/beranda/KPIStripBilling.tsx) (116L):
  - **Tagihan Hari Ini** amber (count + total Rp + trend chip vs kemarin)
  - **Outstanding Total** rose (total + count tagihan + sub-trend >7 hari)
  - **Klaim Pending** sky (count + total menunggu)
  - **Pendapatan Hari Ini** emerald (total + count transaksi + trend % vs avg)
  - **Shift Aktif** violet (count counter buka + sub-counter lokasi)
  - Accent stripe gradient kiri + icon ring + value mono bold 22px + sub-label + stagger 50ms entrance.
- [x] **Quick-Nav Grid** 3 grup ✅ — [QuickNavGridBilling.tsx](src/components/billing/beranda/QuickNavGridBilling.tsx) (144L):
  - **Transaksi** (amber): Tagihan · Pembayaran · Invoice (3 active)
  - **Operasional** (emerald): Kasir Shift · Deposit Awal · Quick Bayar · Adjustment (1 active + 1 disabled BL5)
  - **Laporan** (sky): Pendapatan · Outstanding · Klaim Recap (semua disabled — BL7/EK pending)
  - Disabled state opacity-50 + cursor-not-allowed + tooltip "Akan dibangun di BL5/BL7" — UX honest tentang scope.

### BL8.2 Sidebar Panel ✅

- [x] **"Pasien Siap Bayar"** ✅ — [PasienSiapBayarPanel.tsx](src/components/billing/beranda/PasienSiapBayarPanel.tsx) (147L). Top 6 outstanding dari `TAGIHAN_BOARD_MOCK` sort `sisa` desc, filter `sisa > 0 && status !== "Void"`. Per-row: pasien nama + RM + unit chip · progress bar dibayar/total · sisa amber/rose · tombol "Buka" → deep-link.
- [x] **"Klaim Hari Ini"** ✅ — [KlaimHariIniPanel.tsx](src/components/billing/beranda/KlaimHariIniPanel.tsx) (139L). 5 aktivitas klaim inline mock `KLAIM_HARI_INI_MOCK` (kind: Submitted/Approved/Rejected/Banding · penjamin BPJS/Asuransi/Jamkesda badge · timestamp relatif + nominal).
- [x] **"Recent Payments"** ✅ — [RecentPaymentsPanel.tsx](src/components/billing/beranda/RecentPaymentsPanel.tsx) (147L). 8 pembayaran terakhir lintas counter dari aggregate `SHIFT_PAYMENTS_MOCK` sort `tanggalISO` desc. Per-row: metode icon · pasien · invoice mono · kasir · nominal (emerald/rose tone untuk masuk/refund) · jam relatif.

### BL8.3 Components ✅

- [x] **`berandaBillingShared.ts`** ✅ (301L) — `getBillingStats()` aggregate `TAGIHAN_BOARD_MOCK + KASIR_SHIFT_MOCK + SHIFT_PAYMENTS_MOCK` · `KLAIM_HARI_INI_MOCK` (5 entries inline) · `TODAY_ISO` constant `"2026-05-24"` (consistent dengan mock data range).
- [x] **`BerandaBillingPage.tsx`** ✅ (142L) — orchestrator dengan 12-col grid (Hero full + KPI Strip full · Quick Nav span-8 + Recent Payments span-4 · PasienSiapBayar span-7 + Klaim span-5) + `useSkeletonDelay(500)` + AnimatePresence fade.
- [x] **Route entry** ✅ — [src/app/ehis-billing/page.tsx](src/app/ehis-billing/page.tsx) thin import metadata `"Billing · Beranda"`.

**File sizes BL8:** berandaBillingShared 301L · BerandaBillingPage 142L · KPIStripBilling 116L · QuickNavGridBilling 144L · PasienSiapBayarPanel 147L · KlaimHariIniPanel 139L · RecentPaymentsPanel 147L. Total ~1136L lintas 7 file, semua jauh di bawah 800 limit. TS clean.

**Design decisions:**
- **TODAY_ISO konstanta** — tanggal demo `"2026-05-24"` di-pin biar mock konsisten (sesuaikan dengan `KASIR_SHIFT_MOCK.bukaAt`). Backend nanti pakai `new Date().toISOString()`.
- **Disabled state honest** untuk nav yang belum dibangun — kasir tidak akan klik dead-link, tooltip jelas mention fase yang akan menyiapkan.
- **KPI Strip + 3-row dashboard** pattern mirror Beranda Master — predictable navigation experience lintas modul.
- **PasienSiapBayar = outstanding sort DESC** (bukan tanggal) — pesan operasional: angka terbesar dulu, fokus kasir ke yang paling impactful.

**Acceptance BL8 ✅:** beranda load <500ms (skeleton), KPI angka match seed mock (Tagihan Hari Ini = count(TODAY_ISO entries) · Outstanding = sum(sisa>0) · dst), klik nav card route ke sub-page (Tagihan/Pembayaran/Invoice aktif, lainnya disabled tooltip).

---

## Phase BL9 — UX Polish

**Effort:** 2 hari

### BL9.1 Print Stylesheet

- [ ] **`@media print`** untuk InvoicePrint + KwitansiPrint + LaporanKasShift + BerkasKlaim — pakai KOP RS.
- [ ] **Format Indonesia** — `fmtRupiah` consistent, terbilang Indonesia helper.

### BL9.2 Skeleton & Animasi

- [ ] **`useSkeletonDelay(500)`** semua route.
- [ ] **AnimatePresence** fade swap antar tab/page.
- [ ] **Row stagger** di tabel (delay 20ms per row).

### BL9.3 Density Toggle

- [ ] **Density tokens `m-*`** di Tagihan Board, Invoice Detail (tab Rincian), Klaim Board.

### BL9.4 Update Workflow Docs

- [ ] **CLAUDE.md** — update Module Map row `ehis-billing` dari 🔧 Scaffold → ✅ + ringkasan modul.
- [ ] **TODO-BILLING.md progress tracker** — update tabel di bawah.
- [ ] **TECH_DEBT.md** — catat decision: `MAR overdue alert` (existing) bisa pull dari billing untuk gate "obat sudah dispensed". Decision: Billing punya source-of-truth untuk dispensed status — link ke `MARTab` gate.
- [ ] **Add `mappingNav` cross-link** di Mapping Hub Tarif/Formularium → "Lihat dampak di Billing" tab.

---

## 📊 Progress Tracker

| Phase | Tasks | Done | % |
|---|---|---|---|
| BL0 — Foundation (foundation libs done, formal types pending) | 4 | 1 | 25% 🚧 |
| BL1 — Tagihan Board | 4 | 4 | 100% ✅ |
| BL2 — Invoice Detail | 6 | 6 | 100% ✅ |
| BL3 — Pembayaran | 4 | 4 | 100% ✅ |
| ~~BL4~~ — Klaim Penjamin | ~~4~~ | — | → [TODO-EKLAIM.md](TODO-EKLAIM.md) |
| BL5 — Adjustment | 3 | 0 | 0% |
| BL6 — Integrasi Lintas Modul | 3 | 2.5 | 80% 🚧 |
| BL7 — Reports | 4 | 0 | 0% |
| BL8 — Beranda Billing | 3 | 3 | 100% ✅ |
| BL9 — UX Polish | 4 | 0 | 0% |
| **Total** | **35** | **20.5** | **~59%** |

**Status (2026-05-26):** Core `/ehis-billing` operasional 100% — kasir bisa terima bayar end-to-end (Tagihan Board → Invoice Detail → Kasir Counter → Print Kwitansi/Laporan). Cross-modul integration ~80% (Lab/Rad/Farmasi/Akomodasi reactive · Tindakan + JasaDokter pending). Beranda Billing 100% sebagai entry point modul. Fase lanjutan (BL5 Adjustment · BL7 Reports · BL9 Polish · BL0 formal types · sisa BL6 triggers + IGD/RJ widget) ditunda — akan di-pick up sesuai prioritas business.

**Catatan:** Total turun dari 40 → 35 task (−4 BL4 + −1 BL7.3 yang pindah ke EKLAIM). Effort billing turun ~4-5 minggu → ~3 minggu.

---

## 🏗 Key Architecture Decisions (jangan diubah tanpa diskusi)

1. **Billing = aggregator, bukan re-entry**. Tidak ada form "input charge manual" tanpa `sourceRef` (kecuali `kategori: "Lain-lain"` dengan alasan wajib + audit).
2. **Source-of-truth harga di Mapping Hub Tarif**, bukan di Billing. Saat penjamin/kelas pasien berubah → recalculate semua items via `getHargaTindakan`.
3. **Formularium gating obat** — dilakukan saat dispensing di Farmasi (block atau warning), bukan saat billing. Jika obat non-formularium ter-dispense → otomatis flag `coverage: "Pasien"`.
4. **INA-CBG resolution** — selalu hitung di akhir (saat finalize), bukan per-item. Karena INA-CBG = bundle pricing.
5. **Discharge gating ketat** untuk RI dengan penjamin Umum/Asuransi non-cashless. BPJS: cek klaim Approved/Paid. Bypass: hanya emergency transfer dengan approval supervisor.
6. **Shift kasir wajib** untuk semua transaksi pembayaran. Tidak boleh terima bayar tanpa shift Open.
7. **Refund != Void**: Refund = uang kembali ke pasien (kasir cash out), Void = batalkan transaksi yang salah input. Audit trail berbeda.
8. **PPN & Materai** — opt-in per RS (toggle di `RS_PROFIL`), default off untuk RS pemerintah/BLUD.
9. **No long-scroll Detail**: 4-tab split (Rincian · Pembayaran · Klaim · Riwayat). Print preview di modal terpisah.
10. **Accent module amber** lintas Billing — konsisten dengan icon `Receipt`/`Wallet` di nav.

---

## 🗂 File Structure Target

```
src/lib/billing/
├── hargaResolver.ts        # getHargaTindakan via TarifMap
├── hargaObat.ts            # getHargaObat via FormulariumMap
├── invoiceCalc.ts          # pure subTotal/grandTotal/ppn helpers
├── paymentCalc.ts          # totalDibayar/refundable/nextNoKwitansi ✅
├── terbilang.ts            # number-to-words Indonesia ✅
├── sourceAdapter.ts        # chargeFromOrder/Resep/Tindakan/Akomodasi
├── billingStore.ts         # client store draft + transactions
├── billingMock.ts          # BILLING_BOARD_MOCK, KASIR_SHIFT_MOCK
└── claimReadCache.ts       # read-only cache klaim status untuk Tab BL2.4-lite

# (inaCbgResolver, KLAIM_BOARD_MOCK, INA_CBG_LOOKUP_MOCK) → pindah ke src/lib/eklaim/

src/app/ehis-billing/
├── page.tsx                # Beranda (BL8)
├── tagihan/
│   ├── page.tsx            # Tagihan Board (BL1) ✅
│   └── [id]/page.tsx       # Invoice Detail (BL2) ✅
├── pembayaran/page.tsx     # Counter Dashboard (BL3)
├── adjustment/page.tsx     # Adjustment workflow (BL5)
└── report/page.tsx         # Reports (BL7) — atau push ke /ehis-report

# /ehis-billing/klaim/ → pindah ke /ehis-eklaim (lihat TODO-EKLAIM.md)

src/components/billing/
├── beranda/                # BL8
│   ├── BerandaBillingPage.tsx
│   ├── KPIStripBilling.tsx
│   ├── QuickNavGridBilling.tsx
│   ├── PasienSiapBayarPanel.tsx
│   ├── KlaimHariIniPanel.tsx
│   └── RecentPaymentsPanel.tsx
├── tagihan/                # BL1
│   ├── TagihanBoardPage.tsx
│   ├── TagihanFilterBar.tsx
│   ├── TagihanTable.tsx
│   ├── TagihanRow.tsx
│   └── tagihanShared.ts
├── invoice/                # BL2
│   ├── InvoiceDetailPage.tsx          ✅
│   ├── PatientBannerBilling.tsx       ✅
│   ├── InvoiceStatusTimeline.tsx      ✅
│   ├── InvoiceTabs.tsx                ✅
│   ├── invoiceShared.ts               ✅
│   ├── invoiceMock.ts                 ✅
│   ├── tabs/
│   │   ├── RincianChargeTab.tsx       ✅ (BL2.2)
│   │   ├── ChargeCategorySection.tsx  ✅
│   │   ├── ChargeRow.tsx              ✅
│   │   ├── ChargeStickyFooter.tsx     ✅
│   │   ├── PembayaranTab.tsx          ✅ (BL2.3)
│   │   ├── payment/                   ✅
│   │   │   ├── PaymentSummaryCard.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── PaymentHistoryList.tsx
│   │   │   └── PaymentRow.tsx
│   │   ├── KlaimStatusTab.tsx         # BL2.4-lite (read-only + deep link)
│   │   └── RiwayatAuditTab.tsx        # BL2.5
│   └── modals/
│       ├── AddItemModal.tsx           ✅
│       ├── DiskonItemModal.tsx        ✅
│       ├── VoidItemModal.tsx          ✅
│       ├── RefundModal.tsx            ✅
│       ├── VoidPaymentModal.tsx       ✅
│       ├── InvoicePrintModal.tsx      # BL2.6
│       └── KwitansiPrintModal.tsx     # BL2.6
├── kasir/                  # BL3
│   ├── KasirCounterPage.tsx
│   ├── BukaShiftModal.tsx
│   ├── TutupShiftModal.tsx
│   ├── QuickSearchPayment.tsx
│   └── LaporanKasShiftModal.tsx
├── adjustment/             # BL5
│   ├── AdjustmentApprovalPanel.tsx
│   └── WriteOffForm.tsx
├── reports/                # BL7 (4 task — KlaimRecap pindah ke EKLAIM)
│   ├── PendapatanDashboard.tsx
│   ├── AgingReport.tsx
│   └── JasaPelayananDokter.tsx
└── shared/
    ├── ChargeSourceBadge.tsx
    ├── StatusTagihanChip.tsx
    ├── CoverageChip.tsx
    └── PenjaminBadge.tsx

# src/components/billing/klaim/ → pindah ke src/components/eklaim/ (lihat TODO-EKLAIM.md)
```

**File limit ≤800 lines** — split ke sub-components jika lebih besar.

---

## 🚦 Workflow

- **Saat menyelesaikan task BL**: (1) centang `[x]` + tanggal, (2) update progress tracker, (3) pindah detail ke [.claude/DONE.md](.claude/DONE.md) jika fase besar selesai.
- **Saat menemukan dependency baru**: tambah ke section "Cross-Module Dependencies" di bawah.
- **Saat backend ready**: swap import mock → API route per file (lihat [TODOS_BACKEND.md](TODOS_BACKEND.md) section B1.7 + tambahan billing-specific endpoints di bawah).
- **Sebelum commit**: `npx tsc --noEmit` + verifikasi seed mock benar (5 pasien dengan invoice valid).

---

## 🔗 Cross-Module Dependencies

| Modul Sumber | Trigger Event | Charge yang Dihasilkan |
|---|---|---|
| IGD `TindakanTab` | Save entry | 1 charge per tindakan (jasa medis + bahan) |
| IGD/RI/RJ `CPPTTab` | Verified DPJP | 1 charge "Jasa Dokter Visite" (RI: per hari; IGD: per shift; RJ: per visit) |
| Farmasi `Order` | Status `Selesai` | N charge per resep item (obat + BMHP) |
| Lab `Order` | Status `Tervalidasi` | N charge per test (panel/individual) |
| Rad `Order` | Status `Tervalidasi` | 1 charge per modalitas + kontras (jika ada) |
| RI `KamarRawat` | Admisi → daily | 1 charge "Akomodasi Kelas X" per hari |
| RJ `KonsultasiTab` | Closed-loop | 1 charge "Konsultasi SMF" |
| RJ `SuratDokumenTab` | Print surat berbayar | 1 charge per surat (admin fee) |
| IGD/RI/RJ `InformedConsentTab` | Tindakan major | 1 charge "Admin Tindakan" (opsional) |

**Reverse dependencies** (Billing → modul lain):
- `MARTab` gate: cek `ItemTagihan(sourceModul=Farmasi).status === Dispensed` sebelum perawat catat MAR (lihat [TECH_DEBT.md MAR overdue](TECH_DEBT.md#mar-medication-administration-record)).
- `PasienPulangTab` (RI) gate: cek `Billing.sisa === 0` sebelum izinkan finalize.

---

## 📡 Backend Endpoints (Tambahan untuk [TODOS_BACKEND.md](TODOS_BACKEND.md))

Setelah B1.7 master tarif/penjamin ready, billing butuh:

- [ ] `POST/GET/PUT /api/billing/invoice` — CRUD invoice. PUT untuk finalize.
- [ ] `GET /api/billing/board` — worklist + filter (pagination).
- [ ] `POST /api/billing/invoice/[id]/charge` — tambah item charge (manual atau adapter).
- [ ] `DELETE /api/billing/invoice/[id]/charge/[itemId]` — void item (soft delete + audit).
- [ ] `POST /api/billing/invoice/[id]/diskon` — apply diskon per item.
- [ ] `POST /api/billing/invoice/[id]/payment` — terima pembayaran → create `Deposit`.
- [ ] `POST /api/billing/invoice/[id]/refund` — refund deposit.
- [ ] `POST /api/billing/invoice/[id]/finalize` — Draft → Final, lock items.
- [ ] `POST /api/billing/invoice/[id]/print` — generate PDF struk.
- [ ] `POST /api/billing/claim` — buat klaim baru.
- [ ] `POST /api/billing/claim/[id]/submit` — submit ke V-Claim/Asuransi.
- [ ] `PUT /api/billing/claim/[id]/status` — update status (Approved/Rejected/Paid).
- [ ] `POST /api/billing/kasir-shift/buka` — open shift.
- [ ] `POST /api/billing/kasir-shift/[id]/tutup` — close shift + selisih calc.
- [ ] `GET /api/billing/kasir-shift/[id]/laporan` — generate laporan PDF.
- [ ] `POST /api/billing/adjustment` — request diskon/write-off.
- [ ] `PUT /api/billing/adjustment/[id]/approve` — approve/reject.
- [ ] `GET /api/billing/reports/pendapatan?from=&to=&groupBy=` — dashboard data.
- [ ] `GET /api/billing/reports/aging` — aging piutang.
- [ ] `GET /api/billing/reports/klaim-recap?month=` — recap klaim.
- [ ] `GET /api/billing/reports/jasa-dokter?dokterId=&month=` — pendapatan dokter.
- [ ] `POST /api/billing/inacbg/resolve` — INA-CBG calculator endpoint (jika kompleks server-side).

**Real-time updates** (B0 WebSocket/SSE):
- Charge baru di-push → invoice detail auto-refresh.
- Pembayaran masuk → board status berubah live.
- Klaim status changed di V-Claim → notify in-app.

---

## 📚 Compliance & Standards

- **PMK 76/2016** — Pedoman INA-CBG (Indonesia Case Based Groups).
- **PMK 64/2016** — Standar Tarif Pelayanan Kesehatan Program JKN.
- **Permendagri 27/2013** — Pengelolaan Keuangan BLUD.
- **UU 27/2022 (UU PDP)** — audit trail finansial wajib retained ≥5 tahun.
- **PMK 269/2008** — kerahasiaan dokumen RM termasuk billing (akses berbasis RBAC).
- **SAK ETAP / SAK Syariah** — pengakuan pendapatan (untuk RS berbasis syariah, opsi opt-in).

---

## 🚀 Roadmap Berikutnya (After BL0–BL9)

- [ ] **Real-time V-Claim integration** (depend backend B3.2).
- [ ] **E-faktur / QRIS integration** (Midtrans/Xendit gateway).
- [ ] **Mobile cashless** (QR check-out di TT pasien sebelum pulang).
- [ ] **Multi-currency** (untuk pasien asing, jika RS punya pelayanan medical tourism).
- [ ] **Tax compliance** — e-faktur untuk pasien korporat/asuransi reimburse.
- [ ] **Pendapatan dokter share** — calc otomatis berdasar kontrak (fee-for-service vs fixed salary + bonus).
- [ ] **Billing-Akuntansi bridge** — push journal entry ke modul akuntansi (jika ada).
- [ ] **Audit trail forensic** — query "siapa edit cell X kapan" untuk investigasi.

---

## ✅ Acceptance per Phase (Ringkasan)

| Phase | Acceptance Marker |
|---|---|
| BL0 | TS clean · helpers unit-testable · 5 pasien mock |
| BL1 | Worklist 20+ row · filter responsive · density toggle jalan |
| BL2 | Auto-pull 14+ items dari klinis · grand total benar · 4 tab navigasi smooth · print preview |
| BL3 | Shift Open→Tutup balance · payment flow tunai/transfer/QRIS · kwitansi cetak |
| BL4 | Submit klaim → status Submitted · INA-CBG 10 kasus resolved · banding flow |
| BL5 | Diskon Pegawai 20% applied · approval routing · audit trail |
| BL6 | Lab CITO selesai → charge muncul <1s · discharge gating aktif |
| BL7 | Dashboard 30 hari · drill-down · export Excel/PDF |
| BL8 | Beranda load <500ms · KPI match seed · nav route benar |
| BL9 | Print stylesheet KOP RS · skeleton 500ms · density `m-*` |
