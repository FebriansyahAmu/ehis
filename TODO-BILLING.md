# EHIS Billing — Phase Roadmap

> **Source of truth untuk modul `/ehis-billing` (Kasir & Tagihan).**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
>
> **Workflow docs:**
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO.md](TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap (Billing depend B0/B1.7/B1.9)
> - [.claude/STANDARDS.md](.claude/STANDARDS.md) — clinical & finance standards
>
> **Last updated:** 2026-05-24
> **Status:** 🔧 Scaffold-only — `page.tsx` placeholder amber, nav `/tagihan` + `/pembayaran` ter-declare belum ada implementasi.
> **Target effort:** ~4–5 minggu (frontend full) · paralel dengan backend B0/B1.7/B1.9 dapat dimulai.

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

### BL1.3 Bulk actions

- [ ] **Selection checkbox** per-row + header checkbox indeterminate.
- [ ] **Bulk action bar** muncul saat selected >0:
  - "Print Batch" (multi struk PDF)
  - "Submit Klaim" (untuk yang status `Final` + penjamin BPJS/Asuransi)
  - "Export Excel" (xlsx download)

### BL1.4 Quick views

- [ ] **Tab pre-filter** di atas tabel: "Semua" · "Draft" · "Belum Lunas" · "Klaim Pending" · "Hari Ini" — masing-masing dengan count.

**Acceptance BL1:** worklist tampil 20+ tagihan demo lintas status/penjamin/unit, filter & search responsive, klik row → buka detail di route nested.

---

## Phase BL2 — Invoice Detail (4-tab per kunjungan)

**Route:** `/ehis-billing/tagihan/[id]` · **Effort:** 5–6 hari · **Konsumen:** Kasir, Admin Billing
**Pattern reference:** Farmasi OrderDetail 5-tab + Pasien Pulang RI

### BL2.1 Header pasien (banner)

- [ ] **`PatientBannerBilling`** — identitas pasien + ✓ verified · Penjamin/Kelas/SEP chip · Tanggal kunjungan · Unit · DPJP · Status tagihan (chip besar) · Quick actions kanan (Print / Submit Klaim / Refund).
- [ ] **Status timeline** mini horizontal: Draft → Final → Lunas/Klaim (dengan timestamp + actor).

### BL2.2 Tab 1: Rincian Charge

- [ ] **Group by kategori** dengan collapsible section (Akomodasi · Tindakan · Lab · Rad · Obat & BMHP · Jasa Dokter · Lain-lain). Setiap section: subtotal kategori + count items.
- [ ] **Row item** menampilkan:
  - Tanggal (compact)
  - Nama item (link ke source — orderId/resepId)
  - Source modul badge (sm chip)
  - Qty × satuan
  - Harga satuan
  - Subtotal
  - Coverage chip (Penjamin: emerald / Pasien: amber / Mixed: split)
  - Action kebab: Edit Diskon · Void · Detail Source
- [ ] **Auto-pull dari `sourceAdapter`** — saat tab dibuka, scan kunjungan terkait:
  - Lab/Rad orders dengan status `Selesai` → pull via `chargeFromOrder`
  - Resep dengan status farmasi `Selesai` → pull via `chargeFromResep`
  - Tindakan dari `TindakanTab` (IGD/RI/RJ) → pull via `chargeFromTindakan`
  - Akomodasi RI per-hari (mulai admisi sampai discharge / hari ini)
  - Jasa dokter IGD/Visite RI/Konsultasi RJ
- [ ] **Auto-resolve harga** — pakai `getHargaTindakan` / `getHargaObat` sesuai penjamin + kelas pasien.
- [ ] **Manual add item** — dropdown dari `TARIF_MOCK` + custom item (free-form, requires alasan).
- [ ] **Diskon per-item modal** — input nominal/persen + alasan + minta approval (jika nominal > threshold).
- [ ] **Void item modal** — alasan wajib + cetak audit log.
- [ ] **Sticky footer** — Subtotal, Diskon, PPN, Materai, Grand Total, Saldo Deposit, Sisa Tagihan. Animated.

### BL2.3 Tab 2: Pembayaran

- [ ] **Saldo Deposit card** — saldo current + breakdown deposit history.
- [ ] **Form tambah pembayaran**:
  - Metode chip (Tunai / Transfer / QRIS / EDC / Voucher)
  - Nominal input (suggest sisa tagihan as default)
  - Konfirmasi nominal terbilang (verbal alias guard)
  - Bukti upload (transfer/EDC)
  - Kasir auto-set dari session
  - Submit → buat `DepositRecord` + update `dibayar` di billing
- [ ] **List pembayaran historis** — tanggal/waktu/metode/nominal/kasir/no kwitansi + action Print Kwitansi / Void (with confirm).
- [ ] **Refund flow** — tombol "Refund" → modal pilih dari deposit existing → nominal partial OK → buat `DepositRecord` baru dengan `refundOf` + `jumlah negatif`.

### BL2.4 Tab 3: Klaim Penjamin

- [ ] **Visible only untuk** penjamin BPJS/Asuransi/Jamkesda (Umum: tab hidden).
- [ ] **INA-CBG preview** (BPJS) — card dengan:
  - Diagnosa primer + sekunder (auto dari DiagnosaTab kunjungan)
  - Tindakan ICD-9 (auto dari TindakanTab + Lab/Rad)
  - Kelas + LOS
  - INA-CBG code resolved (via `resolveInaCbg`)
  - Tarif INA-CBG vs total RS — selisih cover/over highlight
- [ ] **SEP info card** — noSEP, validitas, kelas dijamin, sisa hari rawat.
- [ ] **Form Submit Klaim** — pilih klaim batch + tombol "Generate Berkas Klaim" (mock: dummy PDF).
- [ ] **Status klaim timeline** — Submitted → Pending → Approved/Rejected → Paid (timestamp + actor).
- [ ] **Form catatan rejection** — jika status Rejected, tampilkan alasan + tombol "Ajukan Banding".

### BL2.5 Tab 4: Riwayat Audit

- [ ] **Timeline vertikal** semua event: create/edit item/diskon/void/payment/refund/submit klaim/finalize.
- [ ] **Per-entry**: timestamp + actor avatar + action chip + diff jika edit (before/after value).
- [ ] **Filter by actor / action type / date range**.
- [ ] **Export CSV** audit trail.

### BL2.6 Print Preview

- [ ] **`InvoicePrintModal`** — preview struk A5/A4 dengan KOP RS (consume `RS_PROFIL.kop`):
  - Header KOP + No invoice + tanggal
  - Pasien identitas (nama/RM/penjamin)
  - Tabel rincian (group per kategori, total per kategori, grand total)
  - Pembayaran history
  - Sisa + tanda tangan kasir + pasien
- [ ] **`window.print()` + print stylesheet** — A5 default, A4 toggle.
- [ ] **`KwitansiPrintModal`** — per-deposit kwitansi.

**Acceptance BL2:** buka invoice `RM-2025-005`, auto-pull 14 items dari mock klinis, tampilkan grand total benar, tambah pembayaran 200rb update sisa real-time, tab Klaim BPJS INA-CBG resolved, print preview tampil dengan KOP RS.

---

## Phase BL3 — Pembayaran / Kasir Counter

**Route:** `/ehis-billing/pembayaran` · **Effort:** 3–4 hari
**Pattern reference:** Lab/Rad worklist + form modal

### BL3.1 Counter Dashboard

- [ ] **Header strip** Kasir Shift Card — counter name · kasir name · jam buka · total transaksi hari ini · saldo current.
- [ ] **Form Buka Shift** modal — pilih counter + saldo awal kas → buat `KasirShift` Open.
- [ ] **Form Tutup Shift** modal — input saldo akhir kas → calc selisih + breakdown per metode bayar → close shift + cetak laporan.

### BL3.2 Quick Search Pembayaran

- [ ] **Search input besar** di atas — search no tagihan / no RM / nama → tampil row pasien dengan sisa tagihan + tombol "Bayar Sekarang".
- [ ] **Quick payment form** inline — sama seperti BL2.3 tapi tanpa harus buka detail.
- [ ] **Recent payments feed** — 10 pembayaran terakhir di shift ini.

### BL3.3 Deposit Awal (Admisi)

- [ ] **Form deposit awal** untuk pasien yang baru admisi RI / pre-op tindakan major.
- [ ] **Suggest amount** based on kelas + estimasi LOS (avg per kelas).
- [ ] **Buat draft invoice** dengan deposit awal sebagai entri pertama.

### BL3.4 Laporan Tutup Kas

- [ ] **`LaporanKasShift` print modal** — breakdown: Tunai/Transfer/QRIS/EDC + selisih + signature kasir + supervisor.
- [ ] **Setoran ke keuangan** form — pilih shift closed + input no setor + tanggal serah.

**Acceptance BL3:** kasir bisa buka shift, terima pembayaran, tutup shift dengan saldo balanced, cetak laporan.

---

## Phase BL4 — Klaim BPJS & Asuransi

**Route:** `/ehis-billing/klaim` (sub-route) · **Effort:** 4–5 hari
**Pattern reference:** Lab Register + Rad Register

### BL4.1 Klaim Board

- [ ] **Worklist klaim** mirip Tagihan Board tapi filter:
  - Penjamin dropdown (BPJS/Asuransi/Jamkesda)
  - Status: Belum Submit / Submitted / Pending / Approved / Rejected / Paid
  - Periode klaim (bulan)
- [ ] **Bulk submit klaim** — pilih multiple → generate berkas klaim batch.
- [ ] **Filter cepat tab**: "Siap Submit" · "Pending" · "Rejected" (perlu intervensi).

### BL4.2 INA-CBG Calculator

- [ ] **Standalone calculator** modal/page:
  - Input: ICD-10 primer + sekunder, ICD-9 prosedur, kelas, LOS, jenis kelamin/usia
  - Output: INA-CBG code + nominal + breakdown grouper
  - Bandingkan dengan tarif RS aktual → highlight over/under.

### BL4.3 Berkas Klaim Generator (mock)

- [ ] **Generate dummy PDF** berisi: SEP + resume medik + diagnosa + tindakan + tarif INA-CBG + tanda tangan dokter.
- [ ] **Stub upload** ke "BPJS V-Claim" (mock: success after 1.5s delay).

### BL4.4 Tracking & Recap

- [ ] **Detail klaim view** — status + history + nominal disetujui vs diajukan + alasan rejection.
- [ ] **Ajukan banding** form — tambah catatan + dokumen pendukung.
- [ ] **Recap bulanan** — total klaim per penjamin × bulan, approval rate, average days to paid.

**Acceptance BL4:** submit klaim demo, status berubah ke Submitted, INA-CBG resolved benar untuk 10 sample kasus.

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

## Phase BL6 — Integrasi Lintas Modul (Charge Ingestion)

**Effort:** 3–4 hari · **Strategi:** silent wiring di balik tab existing — UI klinis tidak berubah, billing auto-update.

### BL6.1 Trigger Points

- [ ] **Farmasi → Billing**: saat `FarmasiOrderDetail` status berubah ke `Selesai` → `billingStore.addCharge(chargeFromResep(item, ...))`.
- [ ] **Lab → Billing**: saat `LabOrderDetail` status `Tervalidasi` → push charge per test.
- [ ] **Rad → Billing**: saat `RadOrderDetail` status `Tervalidasi` → push charge per modalitas.
- [ ] **Tindakan → Billing**: saat `TindakanTab` save entry (IGD/RI/RJ) → push charge.
- [ ] **Akomodasi RI → Billing**: scheduled job (mock: on mount Billing detail) → loop hari rawat dari `tanggalAdmisi` ke `today` → push 1 charge "Kamar Kelas X" per hari.
- [ ] **Jasa Dokter**:
  - IGD: 1 charge per `CPPT verified by DPJP`.
  - RI: 1 charge per visite (CPPT DPJP per hari).
  - RJ: 1 charge per kunjungan.
  - Konsultasi: 1 charge per `KonsultasiTab` closed-loop.

### BL6.2 Discharge Gating (RI)

- [ ] **`PasienPulangTab` (RI) gate**: cek `BillingRecord.sisa === 0` atau `statusKlaim === "Approved"` sebelum izinkan finalize discharge.
- [ ] **Banner warning** kuning jika sisa >0: "Sisa tagihan Rp X — selesaikan di Kasir sebelum pasien pulang".
- [ ] **Bypass dengan approval** untuk kasus emergency/transfer.

### BL6.3 Print Tagihan dari klinis

- [ ] **Quick action "Lihat Tagihan"** di PatientBanner IGD/RI/RJ → deep link ke `/ehis-billing/tagihan/[id]`.
- [ ] **Mini billing widget** di sidebar kanan `RIRecordTabs` (collapsible) — sisa tagihan ringkas + tombol "Buka Tagihan".

**Acceptance BL6:** order lab CITO di IGD selesai → otomatis muncul sebagai charge baru di tagihan kunjungan dalam <1s. Discharge RI dengan sisa >0 di-block kecuali approval.

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

### BL7.3 Klaim BPJS

- [ ] **Recap klaim bulanan** — total submit/approved/rejected/paid + average days to paid.
- [ ] **INA-CBG margin analysis** — selisih tarif RS vs INA-CBG per group (over/under).

### BL7.4 Pendapatan Dokter (Jasa Pelayanan)

- [ ] **Recap per DPJP** — total tindakan + jasa medis per bulan.
- [ ] **Detail per dokter** — list tindakan + tarif + share %.

### BL7.5 Export

- [ ] **Excel export** (`xlsx`) per report.
- [ ] **PDF export** (print-stylesheet → `window.print()`).

**Acceptance BL7:** dashboard tampil data demo 30 hari, drill-down per unit/penjamin/dokter berfungsi.

---

## Phase BL8 — Beranda Billing (Dashboard)

**Route:** `/ehis-billing` (replace placeholder) · **Effort:** 2 hari
**Pattern reference:** Beranda Master di Phase 3.1

### BL8.1 Layout

- [ ] **Hero header** — icon-prefix eyebrow amber + h1 "EHIS Billing" + tanggal hari ini + jam pill.
- [ ] **KPI Strip** 5 hero card animated:
  - Tagihan Hari Ini (count + Rp)
  - Outstanding Total
  - Klaim Pending (count + Rp menunggu)
  - Pendapatan Hari Ini
  - Shift Aktif (jumlah counter buka)
- [ ] **Quick-Nav Grid** 3 grup × 6 nav card:
  - Transaksi: Tagihan · Pembayaran · Klaim · Refund
  - Operasional: Kasir Shift · Adjustment · Deposit Awal
  - Laporan: Pendapatan · Outstanding · Klaim Recap

### BL8.2 Sidebar Panel

- [ ] **"Pasien Siap Bayar"** — list 8 pasien yang sudah discharge tapi belum lunas (sort by sisa desc).
- [ ] **"Klaim Hari Ini"** — list klaim status changed today (Submitted/Approved/Rejected).
- [ ] **"Recent Payments"** — feed 10 pembayaran terakhir lintas counter.

### BL8.3 Components

- [ ] `BerandaBillingPage.tsx` · `KPIStripBilling.tsx` · `QuickNavGridBilling.tsx` · `PasienSiapBayarPanel.tsx` · `KlaimHariIniPanel.tsx` · `RecentPaymentsPanel.tsx`.

**Acceptance BL8:** beranda load <500ms (skeleton), KPI angka match seed mock, klik nav card route ke sub-page.

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
| BL0 — Foundation | 4 | 0 | 0% |
| BL1 — Tagihan Board | 4 | 2 | 50% |
| BL2 — Invoice Detail | 6 | 0 | 0% |
| BL3 — Pembayaran | 4 | 0 | 0% |
| BL4 — Klaim Penjamin | 4 | 0 | 0% |
| BL5 — Adjustment | 3 | 0 | 0% |
| BL6 — Integrasi Lintas Modul | 3 | 0 | 0% |
| BL7 — Reports | 5 | 0 | 0% |
| BL8 — Beranda Billing | 3 | 0 | 0% |
| BL9 — UX Polish | 4 | 0 | 0% |
| **Total** | **40** | **2** | **5%** |

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
├── inaCbgResolver.ts       # INA-CBG lookup (mock → backend)
├── invoiceCalc.ts          # pure subTotal/grandTotal/ppn helpers
├── sourceAdapter.ts        # chargeFromOrder/Resep/Tindakan/Akomodasi
├── billingStore.ts         # client store draft + transactions
├── billingMock.ts          # BILLING_BOARD_MOCK, KLAIM_BOARD_MOCK, KASIR_SHIFT_MOCK
└── inaCbgMock.ts           # INA_CBG_LOOKUP_MOCK

src/app/ehis-billing/
├── page.tsx                # Beranda (BL8)
├── tagihan/
│   ├── page.tsx            # Tagihan Board (BL1)
│   └── [id]/page.tsx       # Invoice Detail (BL2)
├── pembayaran/page.tsx     # Counter Dashboard (BL3)
├── klaim/
│   ├── page.tsx            # Klaim Board (BL4.1)
│   └── [id]/page.tsx       # Klaim Detail (BL4.4)
├── adjustment/page.tsx     # Adjustment workflow (BL5)
└── report/page.tsx         # Reports (BL7) — atau push ke /ehis-report

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
│   ├── InvoiceDetailPage.tsx
│   ├── PatientBannerBilling.tsx
│   ├── tabs/
│   │   ├── RincianChargeTab.tsx
│   │   ├── PembayaranTab.tsx
│   │   ├── KlaimTab.tsx
│   │   └── RiwayatAuditTab.tsx
│   ├── modals/
│   │   ├── AddItemModal.tsx
│   │   ├── DiskonItemModal.tsx
│   │   ├── VoidItemModal.tsx
│   │   ├── PembayaranModal.tsx
│   │   ├── RefundModal.tsx
│   │   ├── InvoicePrintModal.tsx
│   │   └── KwitansiPrintModal.tsx
│   └── invoiceShared.ts
├── kasir/                  # BL3
│   ├── KasirCounterPage.tsx
│   ├── BukaShiftModal.tsx
│   ├── TutupShiftModal.tsx
│   ├── QuickSearchPayment.tsx
│   └── LaporanKasShiftModal.tsx
├── klaim/                  # BL4
│   ├── KlaimBoardPage.tsx
│   ├── KlaimDetailPage.tsx
│   ├── InaCbgCalculator.tsx
│   └── BerkasKlaimGenerator.tsx
├── adjustment/             # BL5
│   ├── AdjustmentApprovalPanel.tsx
│   └── WriteOffForm.tsx
├── reports/                # BL7
│   ├── PendapatanDashboard.tsx
│   ├── AgingReport.tsx
│   ├── KlaimRecap.tsx
│   └── JasaPelayananDokter.tsx
└── shared/
    ├── ChargeSourceBadge.tsx
    ├── StatusTagihanChip.tsx
    ├── CoverageChip.tsx
    └── PenjaminBadge.tsx
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
