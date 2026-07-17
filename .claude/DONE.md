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

## ✅ Selesai — Penyesuaian Tagihan + Refund + Void (Slice 2d Fase 1) (2026-07-17)

Melengkapi "loop uang kasir": diskon/keringanan level-invoice, pembatalan (void) kwitansi, dan refund. Charge tetap PROYEKSI order (read-only) — penyesuaian = level-invoice saja (item-level = Fase 2). Fondasi sebagian sudah ada (kolom Invoice, `voidPayment`, `recordPayment kategori Refund`, desain footer `readOnly`).

- **Adjustment invoice-level (BE)**: Zod `InvoiceAdjustmentInput` (diskonInvoice/materai/ppnPct + alasan + expectedVersion) · `invoiceDal.updateAdjustment` (updateMany guard versi optimistic, bump version) · `billingInvoiceService.setAdjustment` (guard 404 + **diskon ≤ subtotal** + lazy-create invoice + `conflictVersion`) · endpoint `PATCH /kunjungan/:id/billing/invoice/adjustment` (gate `billing.invoice:update`) · client `setInvoiceAdjustment`. Math sudah ada di `getInvoiceState` (`grand=(subtotal−diskon)+PPN+materai`).
- **Adjustment (FE)**: [AdjustmentModal](../src/components/billing/invoice/modals/AdjustmentModal.tsx) (diskon Rp + hint %, materai Rp, PPN %, alasan, **preview grand total live**) dibuka via tombol **"Penyesuaian"** — prop BARU `onAdjust` di [ChargeStickyFooter](../src/components/billing/invoice/tabs/ChargeStickyFooter.tsx) muncul di mode read-only **tanpa** membuka charge rows (`onAdjust` ≠ `!readOnly`); [KunjunganInvoiceDetail](../src/components/billing/invoice/KunjunganInvoiceDetail.tsx) gate `useCan("billing.invoice","update")` → `setInvoiceAdjustment(...,expectedVersion)` → setState.
- **Void (FE, inline di detail)**: tab Pembayaran [KunjunganPembayaranReadonly](../src/components/billing/invoice/tabs/KunjunganPembayaranReadonly.tsx) — tombol **Batalkan** per baris non-void (gate `billing.kasir:create`), dialog alasan wajib → `voidPayment` (guarded, `voidedBy` server) → `onChanged` bump `reloadTick` → refetch. Banner diperbarui: "refund via Kasir · void di sini". (BE `voidPayment` sudah ada.)
- **Refund (via Kasir, terikat shift)**: deep-link `?tab=quick&invoice=<kid>&mode=refund` (tombol **Refund** di detail saat `dibayar>0`) → [QuickPaymentForm](../src/components/billing/kasir/quick/QuickPaymentForm.tsx) prop `mode="refund"` (kategori Refund, batas nominal=`dibayar`, accent rose, header "Refund Untuk"/"Dibayar", tombol "Proses Refund") → [QuickBayarPanel](../src/components/billing/kasir/quick/QuickBayarPanel.tsx) `recordPayment` kini pakai **`kategori: payload.kategori`** (bukan hardcode "Pembayaran") → server sign refund negatif. `deepLinkMode` di-thread [page](../src/app/ehis-billing/pembayaran/page.tsx)→KasirCounterPage→panel. (Reset form QuickPaymentForm dipindah ke pola adjust-state-during-render — lolos `set-state-in-effect`.)
- **Verifikasi**: `tsc` bersih (src; 23 error sisa semua `prisma/scripts` pre-existing) · `eslint` bersih (14 file) · pg-smoke rollback: adjustment guarded update 1 lalu **0 saat versi basi** (guard OK); grand=(571000−100000)+PPN11%(51810)+materai(10000)=**532810**; void guarded 1 lalu 0 (re-void ditolak); refund nominal negatif mengurangi dibayar non-void.
- **Batas (Fase 2)**: diskon/void **per baris charge** butuh tabel `billing.Adjustment` (overlay by `sourceRef` di proyeksi) — belum dibuat (dicatat TECH_DEBT). Adjustment tak mengemit recordBus (widget Total Tagihan header baca order, bukan invoice — tak terpengaruh).

---

## ✅ Selesai — Beranda Billing (BL8) de-mock 100% NYATA (2026-07-17)

Permintaan user: di tab Beranda `/ehis-billing` hapus semua mock data, wire dengan data aktual, **desain tetap**; Card grup **Laporan** dibiarkan (disabled), tombol disable lain dibiarkan.

- **Mock DIHAPUS dari beranda**: `TAGIHAN_BOARD_MOCK`, `KASIR_SHIFT_MOCK`, `SHIFT_PAYMENTS_MOCK`, `KLAIM_HARI_INI_MOCK`, `getRecentPaymentsLintasCounter`, `RecentPaymentEntry`, `TODAY_ISO`, re-export `totalShiftAll` — semua dibuang dari [berandaBillingShared](../src/components/billing/beranda/berandaBillingShared.ts). Aggregator jadi **fungsi murni** menerima input NYATA: `getBillingStats({rows, pendapatan, openShifts})` + `getPasienSiapBayar(rows, limit)` (sisa = total−dibayar). Tipe + config Klaim/KLAIM_KIND_CFG dipertahankan (siap saat E-Klaim backend).
- **[BerandaBillingPage](../src/components/billing/beranda/BerandaBillingPage.tsx)** fetch paralel (mount): `listBillingKunjungan`→`mapProjectionRow` (rows) · `getPaymentSummary({date:today})` (pendapatan) · `getShiftBoard` (openShifts) · `listRecentPayments({limit:10})` (feed). Render digate `loaded && dataReady` (skeleton s/d data siap). Semua dalam gate `billing.invoice:read`/`billing.kasir:read`.
- **5 KPI NYATA** ([KPIStripBilling](../src/components/billing/beranda/KPIStripBilling.tsx) tak berubah, terima `stats`): Tagihan Hari Ini (rows waktuKunjungan hari ini) · Outstanding (sisa>0, bukan Draft) · **Klaim Pending = outstanding penjamin non-Umum** (proxy real, tak ada status "Proses Klaim" di proyeksi) · Pendapatan Hari Ini (`totalMasuk − totalRefund`, count=totalTransaksi) · Shift Aktif (openShifts + counter unik).
- **3 panel prop-driven** (desain + empty-state eksisting dipertahankan): [PasienSiapBayarPanel](../src/components/billing/beranda/PasienSiapBayarPanel.tsx) `entries` + deep-link `→/ehis-billing/tagihan/kunjungan/:kid` (fix dari `/tagihan/:id`); [RecentPaymentsPanel](../src/components/billing/beranda/RecentPaymentsPanel.tsx) `payments: RecentPaymentDTO[]` (invoiceNo→noInvoice, counter→**kasir**, refund `Math.abs(nominal)`, deep-link kunjungan); [KlaimHariIniPanel](../src/components/billing/beranda/KlaimHariIniPanel.tsx) `entries=[]` (E-Klaim belum backend → empty-state, footer tetap link E-Klaim). QuickNavGrid badge dari stats NYATA; **grup Laporan + item disable (Klaim/Refund/Adjustment) TIDAK diubah** (sesuai permintaan).
- **Verifikasi**: `tsc` bersih (src) · `eslint` bersih (5 file) · pg-smoke angka NYATA: 3 kunjungan ber-order (subtotal Σ 1.369.700) → outstanding; 1 pembayaran non-void → Pendapatan+feed; 1 shift Open → Shift Aktif. Empty-state jalan saat data absen.

---

## ✅ Selesai — Kasir Shift PERSIST + dropdown Kasir NYATA (fix shift re-buka lintas navigasi) (2026-07-17)

Permintaan user: (1) di tab Dashboard Pembayaran, shift kasir selalu harus dibuka lagi tiap pindah halaman — fix agar persist; (2) dropdown Kasir di Buka Shift ambil dari **user role "Kasir" + unitKerja kasir** (bukan mock); (3) ganti dropdown native jadi komponen Select yang proper. Akar masalah: `shifts` = state client (mulai `[]`) → hilang saat unmount/navigasi. Solusi: **persist shift ke DB**.

- **Schema Postgres `billing` tabel BARU `Shift`** (migrasi `20260717120000_billing_shift`, additive) — owner sesi `author_user_id` ("shift saya" lintas navigasi) · operator `kasir_pegawai_id` + `kasir_nama` snapshot (server-resolved) · `buka_at`/`buka_saldo_awal`/`buka_catatan` · **snapshot totals saat tutup** (`total_by_metode` JSONB + `total_transaksi` + `total_refund`) · `tutup_*`/`selisih`/`supervisor` · index `(status)` & `(author_user_id, status)`. Diterapkan anti-drift (SQL manual via pg + `migrate resolve --applied`) lalu `prisma generate`.
- **Backend layered**: [shiftDal](../src/lib/dal/billing/shiftDal.ts) (`create`/`findActiveByAuthor`/`listOpen`/`findOpenByCounter`/`listRecentClosed`/`closeGuarded` atomik where status=Open · `listKasirUsers` = user role Kasir + `unitKerja` ILIKE kasir + aktif) + `billingReadDal.aggregatePaymentByShifts` (totals live per shift Open, GROUP BY shift_id×metode) + [shiftService](../src/lib/services/billing/shiftService.ts): **`board(actor)`** → `{active (open milik actor), open (semua, totals live), recentClosed (snapshot)}` · **`openShift`** (cek counter tak double-open + resolve operator dari kandidat kasir **anti-spoof** nama dari DB + owner=actor.userId) · **`closeShift`** (snapshot totals dari payment authoritative + **hitung selisih server** = saldoAkhir − (saldoAwal+Tunai−refund)) · `listKasirUsers`.
- **Endpoint** `GET/POST /billing/shift` (papan + buka) · `PATCH /billing/shift/:id/tutup` · `GET /billing/kasir-users` — gate `billing.kasir` (read/create; resource hanya punya read+create → tutup pakai create) + client [api/billing/shift](../src/lib/api/billing/shift.ts) (`getShiftBoard`/`openShift`/`closeShift`/`listKasirUsers`).
- **[KasirCounterPage](../src/components/billing/kasir/KasirCounterPage.tsx)** — buang `shifts`/`getOpenShift`/`recentClosedShifts`/`activeSummary`/`hydratedActiveShift`/`SESSION_KASIR` mock; fetch `getShiftBoard` tiap mount+`mutationTick` → `active`/`openShifts`/`recents` (mapper `dtoToShift`). **Shift bertahan lintas navigasi** (bug tuntas). Buka/tutup → API → refetch (server snapshot totals). `countersAktif` KPI = jumlah shift Open. Setoran → cetak slip dari shift NYATA (belum persist, follow-up).
- **[BukaShiftModal](../src/components/billing/kasir/modals/BukaShiftModal.tsx)** — dropdown Kasir = **`Select` portal** (`@/components/shared/inputs`, bukan `<select>` native) diisi `GET /billing/kasir-users` (default kandidat pertama); emit `kasirPegawaiId` (bukan nama); empty-state "belum ada pengguna peran Kasir". `KASIR_LIST` mock tak dipakai lagi. Reset form pakai pola "adjust state during render" (bukan effect → lolos `react-hooks/set-state-in-effect`).
- **Verifikasi**: `tsc` bersih (src) · `eslint` bersih (10 file) · pg-smoke rollback lifecycle: kandidat=Clara Angelica (role Kasir+unitKerja Kasir) → buka → **active-by-author ketemu (persist)** → occupancy Kasir-1=1 → totals live (Tunai 300k/QRIS 200k) → tutup guarded (rowcount 1) snapshot JSONB → active-by-author=0. Semua lulus.
- **Batas (follow-up)**: **setoran kas** belum persist (`billing.shift` tak simpan setoran → SetoranFormModal hanya cetak slip; `KASIR_SHIFT_MOCK` masih dipakai Beranda BL8 + modal setoran). Default operator dropdown = kandidat pertama (belum auto = user login; butuh session client).

---

## ✅ Selesai — Kasir Deposit Awal 100% NYATA (hapus PASIEN_ADMISI_MOCK, wire proyeksi billing + empty state) (2026-07-17)

Permintaan user: sub **Deposit Awal** di tab Pembayaran — desain tetap sama tanpa perubahan, hapus semua mock data, wire dengan aktual data dari kunjungan. Daftar admisi pending kini diturunkan dari **proyeksi billing NYATA** (kunjungan Rawat Inap belum ada pembayaran); buka deposit = pembayaran nyata kategori `Deposit`.

- **`PASIEN_ADMISI_MOCK` + `removePasienAdmisi` DIHAPUS** dari [depositMock](../src/lib/billing/depositMock.ts) (5 pasien fiktif). File kini simpan **hanya tipe + heuristik saran nominal** (`PasienAdmisi`/`AdmisiKategori`/`AdmisiUrgensi` · `suggestDeposit` + rate/LOS tables); `searchPasienAdmisi(query, source)` wajib source eksplisit (default mock dibuang).
- **Adapter BARU** [realAdmisi](../src/components/billing/kasir/deposit/realAdmisi.ts) (mirror `realRows`): `isDepositPending(d)` = `unit==="RawatInap" && dibayar<=0` · `mapBillingRowToAdmisi` (kelas/penjamin dipetakan ke vocab; kategori="RI Baru"/urgensi="Rutin"/DPJP="" default karena proyeksi billing tak membawanya) · `toPendingAdmisi(rows)` filter+map → `PasienAdmisi[]`.
- **[DepositAwalPanel](../src/components/billing/kasir/deposit/DepositAwalPanel.tsx) jadi prop-driven** (`pending`/`loading` dari page) — buang state mutasi mock (`appendShiftPayment`/`fromDepositInput`/`nextNoKwitansi`/`removePasienAdmisi`). Seleksi = `selectedId` diturunkan dari daftar nyata (auto-lepas saat pasien hilang). Submit → **`recordPayment(kunjunganId, {kategori:"Deposit", metode, nominal, shiftId, bank, noRef, catatan})`** (invoice lazy-create, kasir server-resolved, kwitansi KW) → kwitansi dari state nyata via `invoiceStateToDetail` + payment terbaru → `onAccumulate` bump → pasien lepas dari daftar (dibayar>0). `previewNominal` = `suggestDeposit(...).total` (bukan 0 lagi). Loading + empty-state ("belum ada pasien RI menunggu deposit").
- **[KasirCounterPage](../src/components/billing/kasir/KasirCounterPage.tsx)** — fetch page-level `listBillingKunjungan` (re-fetch tiap `mutationTick`) → `toPendingAdmisi` → `depositRows`/`depositLoading` state; **badge tab Deposit = `depositRows.length` NYATA** (bukan `PASIEN_ADMISI_MOCK.length`); teruskan `pending`/`loading` ke panel.
- **[AdmisiResultRow](../src/components/billing/kasir/deposit/AdmisiResultRow.tsx)** — sembunyikan span DPJP saat kosong (proyeksi billing tak bawa DPJP); desain tetap saat data lengkap.
- **Verifikasi**: `tsc` bersih (src) · `eslint` bersih (5 file tersentuh) · pg-smoke: 6 kunjungan RawatInap, 0 pembayaran → **2 kunjungan** (RI/2026/00023, RI/2026/00025) muncul di daftar deposit (punya order, belum bayar); sesudah deposit → lepas dari daftar.
- **Batas (follow-up)**: worklist billing **order-driven** (`aggregateOrderTotals`) → RI admisi tanpa order klinis (akomodasi saja) belum muncul sebagai kandidat deposit. Perluas worklist ke RI order-less bila deposit di titik admisi-awal diperlukan (dicatat TECH_DEBT).

---

## ✅ Selesai — Kasir Dashboard 100% NYATA (hapus mock shift, wire payment aggregates + empty states) (2026-07-14)

Permintaan user: tab **Dashboard** di Pembayaran — desain tetap sama, hapus semua mock data, wire dengan aktual data, beri keterangan bila kosong. Angka Dashboard kini di-derive dari **`billing.payment` NYATA**; shift = sesi kasir yang dimulai KOSONG (tanpa mock) → empty states muncul natural.

- **Endpoint agregat BARU** `GET /billing/payments/summary?shiftId=&date=` (gate `billing.kasir:read`): DAL [aggregatePaymentSummary](../src/lib/dal/billing/billingReadDal.ts) (`$queryRawUnsafe`, filter dinamis shiftId/tanggal; per metode: `masuk` non-refund, `refund` = Σ|nominal| refund, `trx` non-refund) → Service `paymentSummary` (rakit `byMetode` + `totalMasuk/Refund/Transaksi`) → DTO `PaymentSummaryDTO` → client `getPaymentSummary`.
- **KasirCounterPage** — `KASIR_SHIFT_MOCK` **dibuang dari page**; `shifts` mulai `[]` → tak ada shift aktif → **EmptyShiftState** (buka shift dulu). Fetch 2 ringkasan NYATA (re-fetch tiap pembayaran via `mutationTick`): **hari ini** (by date → KPI) + **shift aktif** (by shiftId). **Shift aktif di-hidrasi** (`totalByMetode`/`totalTransaksi`/`totalRefund` dari summary) → dipakai ActiveShiftCard + ShiftMethodBreakdown + TutupShiftModal. **Accumulator client dihapus** (`handleAccumulate` kini cuma bump tick); **tutup shift snapshot** total nyata ke baris Recent.
- **ShiftKPIStrip** — terima prop `agg: ShiftKpiAgg` (bukan `aggregateHariIni()` mock); 4 card desain sama dari data nyata + **caption "Belum ada transaksi pembayaran hari ini"** saat `totalTransaksi===0`. **DashboardPanel** meneruskan `kpi`.
- **Empty states** (sesuai permintaan "keterangan bila kosong"): EmptyShiftState (tak ada shift) · RecentShiftsTable "Belum ada shift selesai" (eksisting) · KPI caption kosong · ShiftMethodBreakdown 0-bar natural.
- **Scope**: `KASIR_SHIFT_MOCK` TETAP ada di file (masih dipakai **Beranda BL8** + SetoranFormModal — di luar tab Dashboard). Shift lifecycle masih **sesi client** (buka/tutup belum persist DB) → Recent reset saat reload; persist shift = slice terpisah.
- **Verifikasi:** `tsc` bersih (src) · `eslint` bersih file tersentuh · smoke `pg` rollback: `aggregatePaymentSummary` by shift & by date benar (Tunai 300k · QRIS 200k · refund 50k terpisah · trx=2 non-refund).

---

## ✅ Selesai — Kasir Quick Bayar 100% NYATA (hapus semua mock pembayaran) (2026-07-14)

Permintaan user: "hapus semua mock data di pembayaran/quickBayar, terapkan data real dari kunjungan (fetching pencarian dll), desain sama tanpa perubahan." Seluruh alur Quick Bayar kini bersumber DB — **tanpa mengubah 1 pun komponen desain** (QuickSearchInput / OutstandingResultRow / QuickPaymentForm / RecentPaymentsFeed / ChargeSummaryCard dipertahankan; hanya sumber data di-swap).

- **Search outstanding NYATA** — [QuickBayarPanel](../src/components/billing/kasir/quick/QuickBayarPanel.tsx) fetch `GET /billing/kunjungan` (proyeksi) → `mapProjectionRow` → `TagihanRow[]`; `sisaTagihan = total − dibayar` (dibayar nyata dari DB). [outstandingSearch.ts](../src/lib/billing/outstandingSearch.ts) di-refactor: **buang `TAGIHAN_BOARD_MOCK`**, `searchOutstanding`/`topOutstandingSuggestions` kini WAJIB terima `source` nyata.
- **Bayar NYATA** — submit form → `recordPayment(kunjunganId, {metode,nominal,source:"Quick",shiftId,...})` (kwitansi KW + kasir server-resolved) → refetch worklist+feed + update/clear target sesuai sisa. Kwitansi print dibangun dari state nyata (`invoiceStateToDetail` + payment terbaru), bukan `fromShiftLog` mock.
- **Recent feed NYATA** — endpoint BARU `GET /billing/payments/recent?shiftId=&limit=` (gate `billing.kasir:read`): DAL [listRecentPaymentRows](../src/lib/dal/billing/billingReadDal.ts) (join `billing.payment`+`billing.invoice`, non-void, `$queryRawUnsafe` param) → Service `listRecentPayments` (resolve pasien via `findKunjunganHeaders`) → DTO `RecentPaymentDTO` → client `listRecentPayments` → map ke `ShiftPaymentLog`. Feed di-refresh tiap pembayaran; reprint kwitansi dari feed fetch `getInvoiceState`.
- **ChargeSummaryCard NYATA** — kini UUID-aware: kunjungan (UUID) → fetch `getInvoiceState` → `invoiceStateToDetail` → **`buildChargeSummary`** (helper baru diekstrak dari `getChargeSummary`, dipakai mock & nyata); demo (non-UUID) → mock. Deep-link "Detail" → `/tagihan/kunjungan/[kid]` (UUID-aware).
- **Deep-link unified** — `?tab=quick&invoice=<kid>` kini **pre-select** tagihan ke form Quick Bayar yang sama (fetch state → `outstandingFromState`); komponen `KasirInvoicePayPanel` (desain terpisah dari Slice 2b) **DIHAPUS** — satu UI konsisten. `KasirCounterPage` pass `deepLinkInvoice` langsung (state dismiss dibuang).
- **Mapper bersama** — `invoiceStateToDetail` (InvoiceStateDTO→InvoiceDetail) diekstrak dari KunjunganInvoiceDetail ke [invoiceStateMap.ts](../src/components/billing/invoice/invoiceStateMap.ts) → dipakai detail + kasir (kwitansi/charge-summary), tanpa duplikasi.
- **Verifikasi:** `tsc` bersih (src) · `eslint` bersih file tersentuh · smoke `pg` rollback: query `listRecentPaymentRows` 2 cabang (dgn/tanpa shiftId) OK — 14 kolom teralias benar, nominal numeric, kunjunganId resolve. **Sisa mock Kasir:** shift (buka/tutup/setoran) + tab Deposit Awal (rekonsiliasi = slice terpisah).

---

## ✅ Selesai — Billing Slice 2b+2c: pembayaran NYATA di Kasir + detail adopsi desain InvoiceDetailPage (2026-07-14)

Menutup loop pembayaran end-to-end di atas fondasi 2a, tanpa mengubah tampilan board (permintaan user "tampilan tetap, data nyata") + mengadopsi **desain InvoiceDetailPage** untuk detail tagihan nyata (read-only). **Kasir = satu pintu bayar** ditegakkan: form bayar hanya di Kasir; detail hanya status + deep-link.

- **Board Tagihan status/dibayar/sisa NYATA.** `listKunjunganBilling` kini join invoice+payment: DAL baru [billingReadDal.aggregatePaid](../src/lib/dal/billing/billingReadDal.ts) (`SUM(nominal) … WHERE kunjungan_id = ANY($1::uuid[]) AND voided=false`) → service isi `dibayar`/`sisa`/`billingStatus` per baris. Helper status bersama [billingStatus.ts](../src/lib/services/billing/billingStatus.ts) (`deriveBillingStatus`) dipakai **detail (getInvoiceState) & worklist** → anti-drift. `BillingKunjunganRowDTO` + tambah field; [mapProjectionRow](../src/components/billing/tagihan/realRows.ts) pakai `d.dibayar`+`d.billingStatus` (bukan lagi derivasi dari `locked`).
- **Detail tagihan = desain InvoiceDetailPage, data nyata, read-only.** [KunjunganInvoiceDetail](../src/components/billing/invoice/KunjunganInvoiceDetail.tsx) di `/ehis-billing/tagihan/kunjungan/[kid]` (ganti `KunjunganInvoiceView` sederhana, dihapus): fetch `getInvoiceState` → map `InvoiceStateDTO`→`InvoiceDetail` → render [PatientBannerBilling](../src/components/billing/invoice/PatientBannerBilling.tsx) + [InvoiceTabs](../src/components/billing/invoice/InvoiceTabs.tsx) 4 tab. Reaktif `useRecordVersion(kunjunganId,"order")` (charge=proyeksi). Guard non-UUID (demo) → pesan.
  - **Rincian** = charge proyeksi read-only. Prop **`readOnly`** di-thread ke [RincianChargeTab](../src/components/billing/invoice/tabs/RincianChargeTab.tsx)→[ChargeCategorySection](../src/components/billing/invoice/tabs/ChargeCategorySection.tsx)→[ChargeRow](../src/components/billing/invoice/tabs/ChargeRow.tsx) + [ChargeStickyFooter](../src/components/billing/invoice/tabs/ChargeStickyFooter.tsx): sembunyikan tambah item/kebab diskon-void/diskon-invoice/finalize (non-breaking, default false utk mock InvoiceDetailPage).
  - **Pembayaran** [KunjunganPembayaranReadonly](../src/components/billing/invoice/tabs/KunjunganPembayaranReadonly.tsx) — read-only: banner "satu pintu" + `PaymentSummaryCard` (grand/dibayar/sisa) + riwayat pembayaran DB + CTA **"Terima Pembayaran"** → `/ehis-billing/pembayaran?tab=quick&invoice=<kid>` (Lunas → chip, tanpa CTA).
  - **Klaim/Audit** reuse `KlaimStatusTab`/`RiwayatAuditTab` read-only apa adanya. Cetak struk via `InvoicePrintModal`.
  - `InvoiceStateDTO` di-enrich **pasien gender/age + waktuKunjungan** (buildState fetch `findKunjunganHeaders`) untuk banner.
- **Kasir terima deep-link → pembayaran NYATA.** `pembayaran/page.tsx` baca `?tab`/`?invoice` (server) → [KasirCounterPage](../src/components/billing/kasir/KasirCounterPage.tsx) props `initialTab`/`deepLinkInvoice` (default tab quick bila deep-link) → [QuickBayarPanel](../src/components/billing/kasir/quick/QuickBayarPanel.tsx) render [KasirInvoicePayPanel](../src/components/billing/kasir/quick/KasirInvoicePayPanel.tsx) di atas search: fetch `getInvoiceState` + form (metode chip + nominal default sisa + No.Ref non-tunai) → **`recordPayment` NYATA** → kwitansi KW + sisa/status update in-place; dismissable → search mock biasa. Shift kasir masih mock (accumulate display only).
- **Verifikasi:** `tsc` bersih (src) · `eslint` bersih file tersentuh (+perbaiki 1 lint pre-existing `set-state-in-effect` di QuickBayarPanel via derivasi render) · smoke `pg` rollback: `aggregatePaid` `= ANY(uuid[])` OK — tanpa invoice→0 Belum Lunas · partial→Lunas Sebagian · full→Lunas.
- **Lanjut:** **2d** adjustment (diskon/void item) · shift kasir NYATA (buka/tutup/setoran + rekonsiliasi) = slice terpisah · resolve DPJP nama di board/banner.

---

## ✅ Selesai — Billing Slice 2a: fondasi persist Invoice + Payment (2026-07-14)

Fondasi backend agar tab **Pembayaran (Kasir)** bisa mencatat bayar nyata. Keputusan (disetujui user): **Kasir = SATU pintu bayar** (terikat shift → tutup kas rapi); detail invoice sub-tab Pembayaran → read-only + tombol deep-link ke Kasir (dikerjakan 2b/2c). **Charge tetap PROYEKSI order** (tak disimpan) — Invoice hanya header; **total/sisa/status DIHITUNG** (proyeksi − Σ payment).

- **Schema baru `billing`** (schema Postgres ke-8) — [prisma/schema/billing.prisma](../prisma/schema/billing.prisma): `Invoice` (1/kunjungan **lazy-create**, soft-ref `kunjunganId` unique, `noInvoice` unik, kolom adjustment `diskonInvoice/materai/ppnPct` disiapkan default 0, `version`) + `Payment` (metode/kategori TEXT FE-facing, `nominal` signed [+bayar/deposit −refund], `kasir` server-resolved, `shiftId` disiapkan, **void bukan delete**) + `BillingCounter` (INV/KW, reset per bulan, atomik upsert). FK `payment→invoice` cascade. Migrasi **anti-drift** [20260714120000_billing_init](../prisma/migrations/20260714120000_billing_init/migration.sql) — DDL via `migrate diff` (statement `billing.*` saja, drift ambient dibuang) → `db execute` + `migrate resolve --applied` + `generate` (BUKAN `migrate dev` reset). `billing` ditambah ke datasource `schemas`.
- **Layered:** DAL [billingCounterDal](../src/lib/dal/billing/billingCounterDal.ts)/[invoiceDal](../src/lib/dal/billing/invoiceDal.ts)/[paymentDal](../src/lib/dal/billing/paymentDal.ts) (void ter-guard atomik) · Service [billingInvoiceService](../src/lib/services/billing/billingInvoiceService.ts): `getInvoiceState` (komposisi proyeksi+invoice+payment → grandTotal/dibayar/sisa/**status** Draft/Belum Lunas/Lunas Sebagian/Lunas) · `recordPayment` (resolve-or-create invoice race-safe + nomor KW + **kasir=`resolveActorNama` anti-spoof**) · `voidPayment` (anti-IDOR: payment ∈ invoice kunjungan) · `listPayments`. Zod [payment.ts](../src/lib/schemas/billing/payment.ts) (`PaymentInput`/`VoidPaymentInput`/`InvoiceStateDTO`).
- **Endpoint** (gate: read `billing.invoice:read` · tulis `billing.kasir:create`, lintas-unit): `GET /kunjungan/:id/billing/invoice` (state) · `GET|POST /kunjungan/:id/billing/payment` (list · catat) · `POST /kunjungan/:id/billing/payment/:paymentId/void`. Client [api/billing/invoice](../src/lib/api/billing/invoice.ts).
- **Verifikasi:** `tsc` bersih · `eslint` bersih · migrasi applied+resolved+generate OK (schema `billing` live) · smoke `pg` rollback-wrapped (kunjungan IGD subtotal 560.350: invoice lazy + **unique kunjungan_id ditolak** + 2 payment→dibayar 560.350 sisa 0 Lunas + **void**→dibayar 300.000 Lunas Sebagian + **FK cascade** ✓). **Belum ada UI.**
- **Lanjut:** **2b** — Kasir Quick Bayar nyata (form shift-bound → `recordPayment`) · **2c** — board Tagihan status/sisa nyata + detail adopsi InvoiceDetailPage (Pembayaran read-only + tombol ke Kasir) · **2d** — adjustment diskon/void item.

---

## ✅ Selesai — Billing Slice 1: Proyeksi tagihan read-only dari order klinis (2026-07-13)

Menautkan billing ke **data order nyata** yang diakumulasi di rekam medis. Keputusan arsitektur (disetujui user): **charge = PROYEKSI order, bukan duplikasi** — tabel order klinis (`TindakanMedis`/`ResepOrder`/`LabOrder`/`RadOrder`/`BmhpOrder`) = sumber kebenaran tunggal; billing membaca & memproyeksikan, tak menyalin baris. Harga = **snapshot** saat order (beku). Menyederhanakan rencana lama TODO-BILLING-BACKEND ("post charge di tx klinis") karena order sudah membawa harga.

- **BE proyeksi (tanpa schema baru):** [billingProjectionService.projectByKunjungan](../src/lib/services/billing/billingProjectionService.ts) baca 5 tabel order via DAL (`listByKunjungan`) + `kunjunganDal.findById` → `BillingChargeDTO[]` (selaras `ChargeItem` UI) + subtotal. Order **Dibatalkan/Ditolak tak dihitung** (selaras `costByType`). **Akomodasi** RI diproyeksi dari `waktuKunjungan→selesaiAt/now × rate kelas` (basis **`kelasHak ?? kelas`** = TITIPAN-aware); admin/jasa dokter ditunda. Item tanpa tarif → `untariffed` (Rp 0, ditandai). DTO [schemas/billing/projection](../src/lib/schemas/billing/projection.ts).
- **Endpoint** [`GET /kunjungan/:id/billing`](../src/app/api/v1/kunjungan/[id]/billing/route.ts) gate **`billing.invoice:read`** (staf billing LINTAS-unit; `route()` men-default `scopeKunjungan=false` utk resource non-clinical → tanpa careUnit lock). Client [api/billing/projection](../src/lib/api/billing/projection.ts).
- **FE view read-only** [KunjunganInvoiceView](../src/components/billing/invoice/KunjunganInvoiceView.tsx) di route BARU [`/ehis-billing/tagihan/kunjungan/[kid]`](../src/app/ehis-billing/tagihan/kunjungan/[kid]/page.tsx): header pasien/penjamin/kelas/SEP + total proyeksi + coverage bar + section per-kategori (reuse pure `groupByKategori`/`coverageBreakdown`/`rowSubtotal` + config `KATEGORI_CFG`/`COVERAGE_CFG`/`SOURCE_BADGE_TONE`) + badge "BELUM BERTARIF" + banner read-only "pembayaran & penyesuaian menyusul".
- **Link 1 (dari klinis):** chip [TotalTagihanWidget](../src/components/shared/medical-records/TotalTagihanWidget.tsx) header rekam medis **deep-link** (`target=_blank`) ke view proyeksi (hanya kunjungan UUID; demo display-only).
- **Link 2 (dari billing) — tab Tagihan yang SUDAH ada, tampilan DIPERTAHANKAN, data jadi nyata:** atas masukan user (jangan tambah tab & jangan ubah tampilan), board **[TagihanBoardPage](../src/components/billing/tagihan/TagihanBoardPage.tsx)** asli (Hero + KPI + FilterPanel + QuickTabs + Table + density) **tetap** — hanya sumber data di-swap dari `TAGIHAN_BOARD_MOCK` → **proyeksi nyata**. BoardPage fetch [`GET /billing/kunjungan`](../src/app/api/v1/billing/kunjungan/route.ts) (gate `billing.invoice:read`) → `billingProjectionService.listKunjunganBilling` (agregat SQL efisien [billingReadDal.aggregateOrderTotals](../src/lib/dal/billing/billingReadDal.ts): SUM lintas 5 tabel `::bigint`, Dibatalkan/Ditolak dikecualikan + header typed + akomodasi per-baris + gender/usia) → **adapter [mapProjectionRow](../src/components/billing/tagihan/realRows.ts)** DTO→`TagihanRow` (unit/kelas/penjamin map; **status derivasi** proyeksi: total 0→Draft · terkunci→Belum Lunas; dibayar 0). `TagihanWorkspaceShell`/`TagihanTable`/`TagihanKPIStrip` jadi **prop-driven `rows`** (KPI real: Total/Belum Dibayar/Rawat Inap/Pasien). Baris → rincian `/ehis-billing/tagihan/kunjungan/[kid]`. Default periode diperlebar (bukan "hari ini") krn data lintas-tanggal. **Interim `KunjunganBillingBoard` + index page dihapus**; nav "Tagihan Kunjungan" dihapus (billingNav + Beranda).
- **Verifikasi:** `tsc` bersih · `eslint` bersih · smoke `pg` read-only (agregat OK — 3 kunjungan: IGD Rp560.350 · RI Kelas_2 Rp696.000 + akomodasi · RI Kelas_3 Rp113.350 + akomodasi). Mock `TAGIHAN_BOARD_MOCK` masih dipakai Beranda billing (stat) — tak diubah. **Sisa (Slice 2):** persist `billing.Invoice`+`Payment`+`Adjustment` → **tab Pembayaran** (kasir nyata: catat bayar, sisa/status) + diskon/void + nomor INV + admin/jasa dokter.

---

## ✅ Selesai — Widget "Total Tagihan" di header rekam medis IGD/RI/RJ (2026-07-13)

Header rekam medis ketiga unit kini menampilkan **chip Total Tagihan** = akumulasi biaya SEMUA order klinis kunjungan (Tindakan + Resep + Lab + Radiologi + BMHP). Berbeda dari `BillingMiniWidget` (yang membaca invoice/sisa bayar billing store, BL6 ~80% wired) — ini estimasi **langsung dari order klinis**, lengkap walau charge-ingest billing belum penuh.

- **Komponen shared BARU:** [TotalTagihanWidget](../src/components/shared/medical-records/TotalTagihanWidget.tsx) — chip compact (indigo; slate "—" bila belum ada order bertarif) + **popover rincian per jenis** on hover (dot berwarna per jenis + total + catatan). Hook `useTotalTagihan(kunjunganId, noRM)`.
- **Sumber data:** kunjungan UUID → `Promise.all` fetch `getTindakanMedis` + `listResep/Lab/Bmhp/Rad` → total = `costByType(mergeDbOrders(...)).byType` + `Σ tindakan.harga×jumlah`. Order **Dibatalkan tak dihitung** (via `costByType`). Reuse helper `costByType`/`mergeDbOrders`/`fmtRp` dari `daftarOrderShared` (konsisten dgn `OrderCostSummary` tab Daftar Order, + Tindakan yang belum ada di sana). Pasien demo (non-UUID) → `ORDERS_MOCK[noRM]` (indikatif).
- **Reaktif tanpa refresh:** domain baru **`"order"`** di [recordBus](../src/lib/realtime/recordBus.ts); di-**emit dari API client** (bukan tiap komponen) pada mutasi kunjungan-scoped: `createResep/cancelResep`, `createLabOrder/cancelLabOrder`, `createRadOrder/cancelRadOrder`, `createBmhpOrder/cancelBmhpOrder`, `addTindakanMedis/updateTindakanMedis/deleteTindakanMedis`. Sentralisasi di layer API → semua ~12 call-site (tab order + panel Riwayat + DaftarOrderTab) ter-cover tanpa menyentuh masing-masing. Widget subscribe `useRecordVersion(kunjunganId, "order")` → re-akumulasi.
- **Penempatan:** cluster `ml-auto` breadcrumb — IGD (sebelum `headerAction`), RI (sebelum `BillingMiniWidget`, dua widget berdampingan), RJ (sebelum `FinalizeControl`). Label "Total Tagihan" hidden `<sm` (chip jadi ikon+nominal).
- Verifikasi: `tsc` bersih · `eslint` bersih (10 file tersentuh).

---

## ✅ Selesai — Riwayat Order Resep di tab Resep & Obat (RI + RJ) (2026-07-13)

RI (& RJ, karena berbagi `ResepPane`) sebelumnya tak menampilkan riwayat order resep DB di tab Resep & Obat (hanya IGD `ResepPasienTab` yang punya). Ditambahkan mengambil referensi pola **RiwayatOrderBmhp**.

- **Komponen sudah ada, tinggal di-wire:** [RiwayatOrderResep](../src/components/shared/resep/RiwayatOrderResep.tsx) (dipakai IGD) di-render di [ResepPane](../src/components/shared/medical-records/resep/ResepPane.tsx) (dipakai RI/RJ). Fitur sesuai permintaan: **Salin** (re-order → isi draft), **Batalkan** (`cancelResep`, status Menunggu saja), **latar warna per-status** (`resepOrderRowBg`: Menunggu/Diproses/Selesai/Dibatalkan), filter bucket + expand detail.
- **`copyOrderToForm(o: ResepOrderDTO)`** — map item order DB → draft `ResepRIItem` via `addDraft` (dosis/signa/rute/aturan/kategori/durasi/harga snapshot) + toast.
- **`canWrite`** = `useSession().can("clinical.resep","update")` (gate Batalkan; server tetap penjaga). RI/RJ `[id]` layout sudah `SessionProvider` → `useSession` aman.
- **`refreshKey` (BARU di RiwayatOrderResep, mirror BMHP):** ditambah ke props + effect deps; `ResepPane` bump `riwayatVer` pasca-`createResep` sukses → panel auto-refetch (dulu tak refresh setelah kirim).
- Muncul hanya utk kunjungan terpersist (UUID); demo (ri-1/rj-1 non-UUID) → panel tersembunyi, `RiwayatSection` lokal (template copy) tetap. IGD `ResepPasienTab` tak diubah.
- Verifikasi: `tsc` bersih · `eslint` bersih (hanya warning ternary-statement pra-ada di `RiwayatSection`).

---

## ✅ Selesai — Tab Tindakan di Rawat Inap & Rawat Jalan (shared + DB-wired) (2026-07-13)

RI & RJ sebelumnya tak punya tab **Tindakan** (hanya IGD). Ditambahkan ke keduanya, langsung persist ke `medicalrecord.TindakanMedis`.

- **Ekstraksi shared (anti-fork):** logika TindakanTab IGD (~840L, coupled `IGDPatientDetail` + hardcode tier `IGD`) diangkat ke **[shared/medical-records/TindakanTab](../src/components/shared/medical-records/TindakanTab.tsx)** dengan prop narrow `TindakanTabPatient { kunjunganId, seed? }` + `jenisRuangan` (tier tarif) + `unitLabel` + `penjaminKode="UMUM"`. Search-first katalog ter-assign + kartu konfigurasi + daftar tergrup + sidebar estimasi — identik desain.
- **3 adapter tipis:** [igd/tabs/TindakanTab](../src/components/igd/tabs/TindakanTab.tsx) (tier `IGD`, seed `patient.tindakan`), [rawat-inap/tabs/TindakanTab](../src/components/rawat-inap/tabs/TindakanTab.tsx) (tier `RAWAT_INAP:<kelas>` via `riTarifTier`; ICU/HCU→`ICU`), [rawat-jalan/tabs/TindakanTab](../src/components/rawat-jalan/tabs/TindakanTab.tsx) (tier `RAWAT_JALAN`). IGD kini adapter — perilaku tak berubah.
- **Registrasi tab:** grup Rekam Medis setelah "Pemeriksaan Fisik" di RIRecordTabs & RJRecordTabs, dibungkus `withIdentitas` (verifikasi SKP 1, selaras IGD). Ikut lock-blur saat kunjungan selesai (bukan tab exempt).
- **Backend nol perubahan:** endpoint `/kunjungan/:id/tindakan` sudah unit-agnostic (gate `clinical.tindakan` + careUnit ABAC via `route()`); `TindakanMedisInput.jenisRuangan` = string bebas ≤40 → tier RI/RJ diterima. Snapshot harga/penjamin/jenisRuangan per baris.
- **Catatan tarif:** Tarif Matrix tindakan ter-seed hanya IGD/ICU/RAWAT_INAP:Kelas_1..3/VIP — **RJ belum di-seed → "Belum bertarif"** (harga null, graceful; snapshot konsisten dgn billing untariffed). Follow-up: seed tarif tindakan RAWAT_JALAN.
- Verifikasi: `tsc` bersih · `eslint` bersih (hanya warning `ALL_TABS` konvensi repo).

---

## ✅ Selesai — Gate akses rekam medis: order belum diterima tidak bisa dibuka (IGD + RI + RJ) (2026-07-13)

**Bug:** rekam medis kunjungan yang ordernya **belum diterima** unit (status `Registered`) bisa dibuka — [RIRecordResolver](../src/components/rawat-inap/RIRecordResolver.tsx) & [IGDRecordResolver](../src/components/igd/IGDRecordResolver.tsx) tidak pernah memeriksa `k.status` (jalur masuk: URL langsung + tombol "Buka Rekam Medis" di Riwayat pasien registrasi; worklist sendiri sudah memisahkan order inbox vs census). Kunjungan `Cancelled` juga ikut terbuka.

**Fix (render-time guard, tanpa sentuh effect → bebas lint set-state):**
- Komponen shared BARU [RecordGateScreen](../src/components/shared/RecordGateScreen.tsx) — kartu penjaga 2 varian: **`belum-diterima`** (amber, ikon Hourglass, pesan + hint tindak lanjut per unit + tombol kembali ke worklist) · **`dibatalkan`** (rose, ikon Ban).
- **RI**: `kunjungan.status === "Registered"` → gate (hint: Terima Order di "Order Masuk — Menunggu Diterima" worklist bangsal) · `Cancelled` → gate dibatalkan · lainnya (InService/Completed/…) → rekam normal (Completed tetap read-only lock eksisting).
- **IGD**: kasus sama persis (ditelusuri atas permintaan) → gate identik (hint: tombol "Terima" + pilih bed di board IGD).
- **RJ ✅ (menyusul, keputusan user)**: [RJRecordResolver](../src/components/rawat-jalan/RJRecordResolver.tsx) di-refactor — `fetchDetail` kini kembalikan `{patient, kunjungan}` (DTO status tersimpan di state) → gate **`Registered` DAN `Queued`** (dipanggil ≠ diterima; rekam terbuka hanya pasca-"Terima"/InService) + `Cancelled`; hint arahan worklist RJ. Demo rj-1/rj-2 tak terpengaruh (di-render langsung di page, bukan resolver).
- **TECH_DEBT** baru: guard BE tulis `clinical.*` saat `Registered` (defense-in-depth; perlu whitelist pola `allowWhenLocked` karena registrasi IGD menulis Triase saat status masih Registered).
- Verifikasi: `tsc` bersih · `eslint` bersih.

---

## ✅ Selesai — Rawat Jalan: Filter Periode Tanggal (server-side) (2026-07-12)

Landing [/ehis-care/rawat-jalan](../src/components/rawat-jalan/RJPageView.tsx) kini bisa difilter **rentang tanggal** (worklist/order; Konsultasi punya inbox sendiri).

- **UI** — bar di baris tab: **Dari / Sampai** ([DatePicker](../src/components/shared/inputs/DatePicker.tsx) portal) + preset **Hari Ini · 7 Hari · Bulan Ini** (aktif ter-highlight) + **Reset** (muncul saat periode aktif). Rentang dijaga selalu valid (pilih ujung yang menyilang → tarik ujung lain). Ringkasan "Menampilkan kunjungan periode X – Y (N kunjungan)" di bawah bar.
- **Server-side (bukan filter klien)** — agar bermakna lintas riwayat, bukan hanya jendela 50+30 yang ter-fetch: `WorklistQuery.{dari,sampai}` (Zod regex `YYYY-MM-DD`, opsional) → `kunjunganService.getWorklist` parse **UTC-day** (`dari`=`T00:00:00.000Z`, `sampai`=`T23:59:59.999Z`, selaras konvensi wall-clock UTC repo + `waktuKunjungan.slice(0,10)`) → `kunjunganDal.listByUnitStatus` tambah `waktuKunjungan: { gte, lte }`. Client `listKunjungan` params `dari`/`sampai` (diteruskan `{...params}`); `RJPageView` refetch saat rentang berubah (kedua query aktif+Completed dibawa periode; Completed limit dinaikkan 30→50 saat periode aktif). Kosong = tampilan live (perilaku lama). Tooltip "ada order masuk" ditekan saat menelusuri periode.
- Verifikasi: `tsc` bersih · `eslint` bersih · smoke read-only pg — hari 2026-06-02 = 5/7 RJ cocok rentang, **0 kebocoran** batas hari.

---

## ✅ Selesai — Header Pasien Rawat Jalan: compact + minimalist (pola IGD) (2026-07-11)

[RJPatientHeader](../src/components/rawat-jalan/RJPatientHeader.tsx) dirombak ringkas mengikuti gaya header IGD ([PatientHeader](../src/components/igd/PatientHeader.tsx)):
- **Padding & ukuran diperkecil** (breadcrumb `py-1.5`, identity `py-2`, avatar `h-10 w-10`).
- **Alamat DIHAPUS** dari info chips (permintaan) → chips = Penjamin · **No. SEP** (BARU, ikon FileText, hanya bila ada) · Keluarga.
- **No. SEP di header** — `RJPatientDetail.noSep?` (BARU) diisi adapter [rjDetailApi](../src/components/rawat-jalan/rjDetailApi.ts) dari `k.sep?.noSep` (pasien DB); mock `rj-1` (BPJS) dapat contoh SEP, `rj-2` (Umum) tanpa SEP → chip kondisional.
- **3 widget** (dulu 2 kartu gabung DPJP+tanggal) → **Antrian** (kartu gelap compact) · **DPJP** (kartu emerald read-only) · **Masuk → Keluar** (kartu gelap). Grid kanan `md:grid-cols-[1fr_400px]`.
- **Wiring DATA NYATA (bukan mock)** — audit sumber data header pasien DB: identitas/umur/JK/RM/tgl-lahir (PatientDTO), poli/status/DPJP/penjamin/No.BPJS/No.SEP/Masuk (KunjunganDTO) sudah nyata. **Diperbaiki:** widget **Keluar + badge Terkunci** dulu baca `rjQueueStore` (client) yang **`seed()`={} & tak pernah diisi** → selalu "Masih diperiksa"/tombol mati; kini baca **real DB** `kunjungan.selesaiAt`/`lockedAt` (ditambah ke `RJPatientDetail` + diisi adapter [rjDetailApi](../src/components/rawat-inap/../rawat-jalan/rjDetailApi.ts)); `rjQueueStore` tinggal fallback pasien demo. **Antrian nomor**: TIDAK ada di `KunjunganDTO` → tampil "—" utk pasien DB (tak difabrikasi; butuh sumber antrean bila diinginkan). Pasien demo `rj-1/rj-2` tetap data contoh.
- **Fix gate "Diagnosa belum lengkap" (tak hilang walau diagnosa sudah diisi)** — resolver mengisi `RJPatientDetail.diagnosa=[]` (snapshot statik; domain klinis tak dibawa) → gate `FinalizeControl` selalu gagal utk pasien DB walau tab Diagnosa sudah diisi (tab persist ke DB terpisah, header tak tahu). Diperbaiki pola **live-TTV**: shared [DiagnosaTab](../src/components/shared/medical-records/DiagnosaTab.tsx) `emitRecordChange(kunjunganId, "diagnosa")` di choke-point persist (`runAggregate` add/tipe/status · `removeIcd10` delete); header `FinalizeControl` (UUID) **fetch `getDiagnosa` + `useRecordVersion(patient.id,"diagnosa")`** → hitung `hasDiagnosa` dari DB reaktif (mount + tiap simpan). Pasien demo tetap dari prop lokal. Kunci bus cocok (`DiagnosaTab kunjunganId = patient.id`).
- **Fix tombol "Selesaikan" tak berfungsi (klik → tak terjadi apa-apa)** — dulu `onClick={selesaikanPoli(patient.id)}` = mutasi `rjQueueStore` yang **selalu kosong** (`patch` early-return bila tak ada entry) → no-op utk pasien DB. Kini pasien UUID → buka **[SelesaikanDialog](../src/components/igd/selesai/SelesaikanDialog.tsx) (REUSE IGD)** (jenis/waktu/kondisi/ack) → `transitionKunjungan(patient.id, "complete", version, {waktuSelesai, disposisi})` NYATA (gate server ≥1 Diagnosa Utama Pasti · tulis `medicalrecord.Disposisi` · kunci `lockedAt`/`selesaiAt` atomik) → toast + **refetch resolver** (`onCompleted` diteruskan RJRecordResolver→header→FinalizeControl) → header refleksikan **Terkunci · jam + Keluar**. `RJPatientDetail.version` ditambah (k.version) utk optimistic-concurrency. Server tolak (mis. belum ada Diagnosa Utama Pasti / jenis Rawat_Inap tanpa SPRI) → toast error, dialog tetap terbuka. Pasien demo tetap `selesaikanPoli` (store lokal). RJRecordResolver di-refactor (`fetchDetail` reusable + `refetch`; state init lazy → patuh `react-hooks/set-state-in-effect`).
- **Lock blur rekam medis (pola IGD/RI) — KECUALI tab Disposisi & Surat/Dokumen** — [RJRecordTabs](../src/components/rawat-jalan/RJRecordTabs.tsx): `locked = !!patient.lockedAt || demo`; `lockExempt = active==="disposisi" || active==="surat"`; `lockHere = locked && !lockExempt` → konten tab di-**blur `blur-[1.5px]` + `pointer-events-none` + `opacity-50` + `aria-hidden`** saat terkunci, banner slate "hanya-baca". Tab **Disposisi & Surat/Dokumen dikecualikan** (banner emerald kontekstual: Disposisi = rujukan/admisi/SPRI & dokumen keluar · Surat = penerbitan/cetak surat pasca-selesai) = tak di-blur, tetap interaktif (BE `allowWhenLocked`). Sumber lock diganti dari `rjQueueStore` mati → **real DB `lockedAt`**.
- **Batalkan Selesai (reopen) DB-wired + DUA MODE + high alert ✅** — dulu tombol reopen RJ hanya demo (`bukaKembaliPoli`, "DB reopen RJ belum di-wire"); kini tombol **"Batalkan Selesai"** (rose) tampil di header saat terkunci utk pasien DB (UUID) & demo, membuka **[BatalSelesaiRJDialog](../src/components/rawat-jalan/BatalSelesaiRJDialog.tsx)** (BARU, high-alert rose): peringatan buka-kunci rekam final + **wajib pilih tujuan**: (a) **Perbaikan Pengimputan** — koreksi input, **tgl keluar dipertahankan**; (b) **Perbaikan Menyeluruh** — pelayanan dibuka penuh, **tgl keluar BARU** (kartu ekstra high-alert + peringatan inline) + alasan opsional (medico-legal). Submit → `transitionKunjungan(patient.id,"reopen",version,{alasanReopen, resetSelesai: mode==="menyeluruh"})` → refetch. **BE reopen diperkaya `resetSelesai`**: `TransitionInput.resetSelesai?` (Zod) → route → `kunjunganService` reopen branch `if (opts.resetSelesai) patch.selesaiAt = null` (**`selesaiPertamaAt` jejak audit TETAP** di kedua mode; `UpdateStatusPatch.selesaiAt` diperlebar `Date | null`; kolom sudah nullable → tanpa migrasi) → smoke rollback-wrapped: menyeluruh=selesaiAt null+pertama tetap · koreksi=keduanya tetap. Authz reopen = klinis/loket (marker sama dgn complete), `scopeKunjungan` unit-scope. Demo `bukaKembaliPoli(id, resetSelesai)` selaras (kosongkan `selesaiAt` demo bila menyeluruh).
- **Selesaikan KEMBALI langsung pasca "perbaikan pengimputan" (tanpa form ulang) ✅** — keluhan: setelah batal-selesai mode pengimputan, klik "Selesaikan" malah **membuka form disposisi baru** (jenis/waktu/kondisi). Kini penyelesaian ULANG pasca-pengimputan = **kunci ulang LANGSUNG** (disposisi terakhir tetap berlaku, tgl keluar dipertahankan): header deteksi `reopenedKoreksi = isPersisted && !locked && !!patient.selesaiAt` → tombol jadi **"Selesaikan Kembali"** → `handleRelock()` panggil `transitionKunjungan(id,"complete",version,{})` **TANPA disposisi** (1 klik, tanpa dialog). **BE `complete` di-split 2 jalur**: `opts.disposisi` ada → buat Disposisi baru (+SPRI) — pertama / "menyeluruh"; `opts.disposisi` absen → **re-lock** (tak buat Disposisi, `selesaiAt` dipertahankan, wajib `k.disposisi` sudah ada else `Errors.validation`). **Zod refine "disposisi wajib saat complete" DIHAPUS** (enforcement pindah ke Service yg DB-state-aware; refine tak bisa bedakan re-lock). Mode **menyeluruh** (`selesaiAt` null) → tombol tetap "Selesaikan" → buka SelesaikanDialog isi disposisi + tgl keluar baru. IGD/RI tak berubah (selalu kirim disposisi → jalur create). `SelesaikanDialog.defaultWaktu` (percobaan awal) di-revert — di-superseksi fast-path.
- Verifikasi: `tsc` bersih · `eslint` bersih · smoke reopen 2-mode (rollback) PASS.

---

## ✅ Selesai — Admisi Registrasi: Buat SPRI mandiri (rawat inap terencana, mirror form IGD) (2026-07-11)

Worklist **Admisi Rawat Inap** ([AdmisiRanapBoard](../src/components/registration/admisi/AdmisiRanapBoard.tsx)) kini bisa **menerbitkan SPRI langsung** — bukan hanya memproses SPRI kiriman IGD. Untuk pasien rawat inap **terencana** (mis. dari poliklinik) yang perlu diadmisi tanpa lewat IGD.

**FE** — tombol **"Buat SPRI Baru"** (teal) di header board → [SpriCreateModal](../src/components/registration/admisi/SpriCreateModal.tsx) (portal, accent teal, Escape/backdrop). **Form penerbitan = komponen [SPRIPanel](../src/components/igd/tabs/pasienPulang/SPRIPanel.tsx) yang SAMA PERSIS dengan IGD** (bukan di-fork/di-hand-roll → tampilan identik: kartu violet, header "Penerbitan SPRI", box Mode-Demo, Peserta/No. Kartu BPJS, DPJP + Tanggal, SMF/Poli auto-derive, Jenis Ruang, Indikasi, Keterangan). Modal hanya membungkus dengan konteks admisi:
- **1 · Pasien** — cari `searchPatients` (auto `by=rm` bila digit, else `nama`, debounce 300ms) → kartu pasien terpilih.
- **2 · Kunjungan sumber** — `listKunjungan?patientId` (semua status, terbaru dulu; default terpilih); SPRI **ditautkan** ke kunjungan ini (provenance + sumber diagnosa awal SEP RI). Kosong → banner "daftarkan kunjungan dulu" + submit terkunci.
- **3 · SPRIPanel** — `roster` dibangun dari `listDokter` (spesialistik via jembatan `spesialistikFromSpesialisKode` → SMF/poli auto-derive `resolvePoliBpjs` bekerja seperti IGD); `key={patient.id}` reset saat ganti pasien; SPRIPanel emit `SpriInput` → state modal. Prop baru opsional **`submitHint`** (non-breaking) mengganti teks penutup jadi "Terbitkan SPRI".
- Submit → `createSpri({ ...spriForm, kunjunganId, noKartu:"" })` → toast (No. Ref / "Menunggu No. Referensi") → `onCreated` refetch → kartu muncul di worklist.

**Backend** (layered, **tanpa schema baru** — reuse `encounter.Spri` + `spriDal.create`):
- Zod `CreateSpriInput` = `SpriInput` + `kunjunganId` ([schemas/disposisi/disposisi.ts](../src/lib/schemas/disposisi/disposisi.ts)).
- `spriService.create` ([spriService.ts](../src/lib/services/spri/spriService.ts)) — validasi kunjungan sumber; **No. Kartu di-resolusi SERVER** dari penjamin BPJS pasien (`patientDal.findById` + `decryptPii`, anti-spoof — FE kirim kosong); `user`/pencatat = `resolveActorNama(actor)`; No. Referensi terbit server via `issueSpriRef` (mock BPJS, di luar tx = insert tunggal) → status `Terbit`/`MenungguRef`; kembalikan DTO ber-diagAwal.
- Route `POST /api/v1/spri` ([route.ts](../src/app/api/v1/spri/route.ts)) — gate **`registration.kunjungan:create`**, `scopeKunjungan:false`, status 201.
- API client `createSpri` ([api/spri/spri.ts](../src/lib/api/spri/spri.ts)); jembatan `spesialistikFromSpesialisKode` (SpesialisKode master.Dokter → label spesialistik = kunci SMF_POLI_MAP) di [smfPoliMap.ts](../src/components/igd/tabs/pasienPulang/smfPoliMap.ts), dipakai membangun roster SPRIPanel.

Lifecycle setelahnya identik SPRI kiriman IGD (Revisi/Kirim Ulang/Batalkan/Daftar Rawat Inap → konsumsi + auto-tutup saudara). Verifikasi: `tsc` bersih · `eslint` bersih · **DB smoke** (insert spri→worklist join read→cleanup) **SMOKE_OK** (ter-attach ke kunjungan RJ nyata).

**Addendum (2026-07-11) — form penerbitan SPRI dijadikan komponen bersama + dipakai di Disposisi Rawat Jalan:**
- **Ekstrak [SpriIssuePanel](../src/components/shared/spri/SpriIssuePanel.tsx)** — pembungkus tipis SPRIPanel + pemuatan roster DPJP (spesialistik via `spesialistikFromSpesialisKode`). Dipakai bersama SpriCreateModal (registrasi) **dan** Disposisi RJ → satu sumber form, tak ada duplikasi/drift. SpriCreateModal di-refactor pakai panel ini (logika roster inline dihapus).
- **Fix DPJP tidak ter-fetch** — panel semula tarik dokter via `listDokter` (**gate `master.dokter`** → klinisi RJ / petugas loket 403 → dropdown DPJP kosong). Diganti ke endpoint **`dpjp-tersedia` sesuai hak akses** lewat prop baru `dpjpScope`: `"clinical"` → `GET /master/dpjp-tersedia` (gate `clinical.rekammedis:read`, RJ) · `"loket"` → `GET /bpjs/dpjp-tersedia` (gate `registration.kunjungan:read`, Registrasi). `DpjpTersediaDTO` (nama+pegawaiId+spesialisKode) → roster/opsi DPJP. Verifikasi DB: 5 dokter aktif → **DPJP_LIST_OK**. (RJ adapter set `doctor:""` — nama dpjp-tersedia tanpa gelar, hindari pra-isi tak cocok.)
- **Layout 2-panel + Riwayat SPRI (panel kanan)** — Disposisi RJ → Admisi Rawat Inap kini `grid lg:grid-cols-2`: **kiri** = form penerbitan (SpriIssuePanel) + tombol Terbitkan; **kanan** = **[SpriRiwayatPanel](../src/components/shared/spri/SpriRiwayatPanel.tsx)** = riwayat SPRI pasien (semua SPRI lintas kunjungan, semua status, kartu status/DPJP/ruang/poli/rencana/No.Ref/indikasi/pembuat). Data: **endpoint klinis BARU** `GET /api/v1/kunjungan/:id/spri` (gate `clinical.rekammedis:read` + careUnit) → `spriService.listRiwayatByKunjungan` (resolve `patientId` dari kunjungan → `spriDal.listByPatientId`, semua status terbaru dulu) → client `listSpriRiwayat`. Refetch otomatis sesudah terbit baru (`refreshKey`); pasien demo (non-UUID) → placeholder. Verifikasi: **DB smoke HIST_OK** (2 SPRI beda status → riwayat terbaru-dulu → cleanup). Tanpa schema baru.
- **Hyperlink pratinjau payload SPRI** — di bawah form (SpriIssuePanel, tampil di RJ + Registrasi, BUKAN IGD) tautan "Lihat payload SPRI" → **[SpriPayloadModal](../src/components/shared/spri/SpriPayloadModal.tsx)** (pola RujukanPayloadModal: portal z-60, Escape/backdrop, Salin) menampilkan body wire `{ request: … }` **RencanaKontrol/InsertSPRI** (`noKartu`/`kodeDokter`/`poliKontrol`/`tglRencanaKontrol`/`user`). SpriIssuePanel mengintersep emit SPRIPanel (`handleChange`) untuk salinan `SpriInput` terakhir. **Pengisian preview:** `poliKontrol`/`tglRencanaKontrol` dari form; **`kodeDokter` = `kodeBpjs` DPJP terpilih** (dari `DpjpTersediaDTO`, Mapping Hub → DPJP BPJS; kosong bila DPJP belum di-map — mis. dari 5 dokter hanya 1 ter-map `SpB→31692`); **`user` = akun login** via hook **BARU `useSessionOptional`** (tak-melempar; null di modal Registrasi yang tanpa SessionProvider → user ""); `noKartu` ter-mask (server pakai penuh). Nilai final tetap di-resolusi server (footer modal menandai). Tautan nonaktif s/d form lengkap.
- **Rawat Jalan → Disposisi → Admisi Rawat Inap** ([DisposisiRJTab](../src/components/rawat-jalan/tabs/DisposisiRJTab.tsx)) — form mock lama (alasan admisi/kelas/diagnosa/konfirmasi + preview "Surat Pengantar Admisi" yang menampilkan `patient.poli` mis. "Bedah", **tak persist**) **DIGANTI** dengan `SpriIssuePanel` (form penerbitan SPRI **IDENTIK IGD**). Submit → `createSpri({ ...spriForm, kunjunganId: patient.id, noKartu:"" })` menautkan SPRI ke **kunjungan RJ berjalan** → muncul di Worklist Admisi Registrasi; pasien demo (non-UUID) → `spriDemo` (tak persist). `DisposisiResult` diperluas (`spri?`/`spriDemo?`); SuccessScreen "SPRI Diterbitkan" + No. Referensi + hint "muncul di Worklist Admisi". Const `KELAS_RI`/`KelasRI` + form primitives (Field/PreviewRow/inputCls/textareaCls) yang usang dihapus dari file.
- Verifikasi ulang: `tsc` bersih · `eslint` bersih.

**Follow-up (TECH_DEBT):** No. Referensi masih mock (belum V-Claim InsertSPRI nyata) · SPRI mandiri belum bisa dibuat untuk pasien tanpa kunjungan (harus punya kunjungan sumber) · poliKontrol dari `spesialisKode` = aproksimasi (reconcile referensi BPJS saat integrasi).

---

## ✅ Selesai — Disposisi RJ: Rujuk Eksternal JKN (payload V-Claim t_rujukan) + Surat Rujukan cetak (2026-07-09)

Tab **Disposisi Rawat Jalan** ([DisposisiRJTab](../src/components/rawat-jalan/tabs/DisposisiRJTab.tsx)) dirombak: **Rujuk Internal dihapus** (tinggal **Rujuk Eksternal** + **Admisi Rawat Inap**), form Rujuk Eksternal **sadar-penjamin**, dan kirim menghasilkan **surat rujukan A4 cetak**.

- **Hapus Rujuk Internal** — union `DisposisiTipe` = `rujuk-eksternal|admisi-ri`; `RujukInternalForm`/`PrioritasInternal`/`PRIORITAS`/entri success + import `Siren`/`POLI_CFG` dibuang; grid selektor 3→2 kolom.
- **Ekstraksi folder `disposisi/`** (jaga < 800 baris/file): [shared.tsx](../src/components/rawat-jalan/tabs/disposisi/shared.tsx) (primitif + tipe `DisposisiResult`) · [RujukEksternalForm](../src/components/rawat-jalan/tabs/disposisi/RujukEksternalForm.tsx) (cabang `penjamin.startsWith("BPJS")` → JKN vs Umum) · [RujukJknForm](../src/components/rawat-jalan/tabs/disposisi/RujukJknForm.tsx) · [RujukUmumForm](../src/components/rawat-jalan/tabs/disposisi/RujukUmumForm.tsx) · RujukanPayloadModal · RujukanCetakTemplate · RujukanCetakModal.
- **Form JKN = payload resmi V-Claim `Rujukan/insert` (t_rujukan)** — kontrak kanonik [InsertRujukanPayload](../src/lib/bpjs/bpjsContracts.ts). Field 1:1: `noSep · tglRujukan · tglRencanaKunjungan · ppkDirujuk (8 digit) · jnsPelayanan (1 RI/2 RJ) · catatan · diagRujukan (1 ICD-10) · tipeRujukan (0 Penuh/1 Partial/2 Balik PRB) · poliRujukan (kosong bila tipe 2, wajib 0/1) · user`. Aturan bersyarat poli↔tipe + ppk 8-digit divalidasi via adapter `insertRujukan`. Non-JKN → `RujukUmumForm`.
- **Kontrol global + fetch nyata** — faskes (`listSarana`; FKRTL utk tipe 0/1 · FKTP utk Balik PRB) & poli (`listSpesialistik`) pakai shared **`Select`** (popover portal → tak ter-clip kartu `overflow-hidden`); tanggal pakai **`DatePicker`** (tanpa default `today()`); **SEP autofill** `listSepTerbit(kunjunganId)` (SEP ber-flag `kunjunganIni`, read-only); **diagnosa di-fetch** `getDiagnosa(kunjunganId)` (radio ICD-10 nyata, default Utama, loading+empty state; demo non-UUID → fallback `patient.diagnosa`). Guard `UUID_RE` pakai `patient.id`.
- **`user` = akun login** (`session.namaTampil`) — dipakai di payload & pratinjau (bukan placeholder server).
- **Pratinjau payload = hyperlink → modal** ([RujukanPayloadModal](../src/components/rawat-jalan/tabs/disposisi/RujukanPayloadModal.tsx), pola SEP/RencanaKontrol) — bukan inline `<pre>`; portal z-60, Escape/backdrop, tombol Salin, isi `request.t_rujukan`.
- **Kirim SELALU sukses (mock — belum ada cons-id prod)** — `handleSubmit` panggil `insertRujukan` utk audit (hasil diabaikan), lalu **sintesis respons detail rujukan** (bentuk TrustMark: `AsalRujukan`/`peserta`/`diagnosa`/`tujuanRujukan`/`poliTujuan`/`tgl*`); `noRujukan` format asli `{PPK}{MMYY}B{6digit}` (`PPK_ASAL="0301R001"`); `tglBerlakuKunjungan` = +90 hari.
- **Surat Rujukan cetak A4** — [RujukanCetakTemplate](../src/components/rawat-jalan/tabs/disposisi/RujukanCetakTemplate.tsx) (KOP RS via `KopSuratEklaim`): identitas peserta · blok **Dirujuk Ke** (faskes/jenis/poli) · diagnosa · tanggal (rujukan/rencana/berlaku) · No. Rujukan BPJS · faskes perujuk · catatan · instruksi · TTD dokter perujuk (No. SEP asal DIHAPUS dari surat). [RujukanCetakModal](../src/components/rawat-jalan/tabs/disposisi/RujukanCetakModal.tsx) (`.print-area` A4, pola SuratKontrolCetakModal) dibuka dari SuccessScreen (tombol "Cetak Surat Rujukan"); `DisposisiResult.rujukan` di-thread form→tab.
- **DB-wired + Cetak Ulang ✅** — domain BARU `medicalrecord.RujukanEksternal` (append + soft-delete; `nomor` unik = No. Rujukan `{PPK}{MMYY}B{6}` counter `RUJ-<YYMM>`; **`detail` JSONB = snapshot penuh `RujukanDetail`** → cetak ulang mandiri; migrasi drift-safe `20260709120000`, FK kunjungan cascade, gate `clinical.rekammedis`) — layered [schema](../src/lib/schemas/rujukanEksternal/rujukanEksternal.ts)/[DAL](../src/lib/dal/rujukanEksternal/rujukanEksternalDal.ts)/[Service](../src/lib/services/rujukanEksternal/rujukanEksternalService.ts) (No. Rujukan + berlaku +90h + terbitAt + `pencatat`=actor server-otoritatif)/route `GET/POST /kunjungan/:id/rujukan` + `/:itemId` DELETE/[API](../src/lib/api/rujukanEksternal/rujukanEksternal.ts). **Submit (UUID) → `createRujukan` persist** (No. Rujukan dari server; demo non-UUID = sintesis lokal, tak persist); **`RujukanCetakData` = alias `RujukanDetail`** → `dto.detail` langsung dicetak. **widget hijau "Surat Rujukan Sudah Terbit"** [RujukanKeluarWidget](../src/components/rawat-jalan/tabs/disposisi/RujukanKeluarWidget.tsx) (di bawah selektor Jenis Disposisi saat Rujuk Eksternal dipilih + pasien persisted): detail surat terbaru (No. Rujukan/tujuan/jenis/tipe/tgl/berlaku/diagnosa) + **Cetak Surat** (buka RujukanCetakModal dari snapshot) + **Batalkan** (soft-delete, inline confirm) + surat lain collapsible; refetch saat surat baru terbit (`refreshKey`). Issuance BPJS masih mock (No. Rujukan = counter server, bukan V-Claim) → follow-up TECH_DEBT.
- **Verifikasi**: `prisma generate` + migrasi applied (drift-safe, tanpa reset) · tsc 0 error · ESLint 0 error (hanya warn `_actor` konvensi) · smoke `pg` (counter upsert · JSONB round-trip · unique nomor 23505 · soft-delete active 1→0) · semua file ≤ 596 baris.

---

## ✅ Selesai — Surat & Dokumen RJ: Surat Keterangan Sakit + Sehat + Resume Medik TTE + Riwayat pramuat (2026-07-09)

Sub-menu tab **Surat & Dokumen** ([SuratDokumenTab](../src/components/shared/medical-records/SuratDokumenTab.tsx)) disambung ke DB + TTE (riset standar RS lalu diterapkan; contracts+endpoints+FE per layering rules).

- **Surat Keterangan Sakit** — domain `medicalrecord.SuratKeteranganSakit` (append + soft-delete; counter `SKS-<YYMM><NNN>`; `tglSelesai` = server-compute `addRestDays`) + `GET/POST /kunjungan/:id/surat-sakit` + `/:itemId` DELETE (layered Zod/DAL/Service/route/API). **TTE QR dokter pemeriksa** auto saat create (Dokter-gated, pola Resep); template A4 (rose) + `SuratSakitCetakModal` + `terbilang()`.
- **Surat Keterangan Sehat (SKBS)** — domain `medicalrecord.SuratKeteranganSehat` (pemeriksaan fisik TB/BB/TD/nadi/gol.darah/penglihatan/buta-warna/pendengaran + BMI + kesimpulan; counter `SKH-<YYMM><NNN>`) + `GET/POST /kunjungan/:id/surat-sehat` + DELETE; template A4 (emerald) + BMI auto (`bmiKategori`) + TTE QR.
- **Resume Medik RJ + TTE** — QR DPJP ditampilkan **hanya di cetakan**; kartu Resume Medik RJ jadi **background hijau "sudah di-TTE"** (info di kartu, bukan di form); `tteInfo` tetap mengalir ke `printModel`.
- **Riwayat Surat pramuat** — buka tab Surat & Dokumen → **ketiga surat** (Kontrol/Sakit/Sehat) langsung tampil di panel Riwayat (preload effect keyed `kunjunganId` + `patientRef`; entry-builder `*EntriesFromDtos` di-export tiap pane sebagai sumber tunggal) — **kecuali Resume Medis** (dok tunggal latest-wins).
- **Verifikasi**: tsc/eslint bersih; smoke `pg` per domain (insert semua field incl. TTE, active-count sebelum/sesudah soft-delete, unique nomor 23505, cleanup). Commit e3b5df3 · ed160f9 · 299d26a.

---

## ✅ Selesai — Admisi Rawat Inap: Bed-Map Visual + DPJP ter-assign + Peringatan SPRI (2026-06-25)

Penyempurnaan modal **Pendaftaran Kunjungan Baru** (dibuka dari worklist Admisi via SPRI → "Daftar Rawat Inap").

- **Reservasi Bed = peta visual fullscreen** (ganti dropdown) — [StepKunjunganRi](../src/components/registration/patient/modals/daftar-kunjungan/StepKunjunganRi.tsx): field "nomor reservasi" read-only (bed terpilih) + tombol **Reservasi** → buka [BedMapModal](../src/components/registration/patient/modals/daftar-kunjungan/BedMapModal.tsx) (`createPortal` z-70, di atas wizard z-50). Grid kartu bed ruangan terpilih: **🟢 Tersedia** (klik pilih) · **🔴 Terisi** (+nama pasien & No. RM pemakai, badge "Ditempati"/"Dipesan") · **⚪ Tidak Aktif**. Header ringkasan (Total/Tersedia/Terisi) + search (bed/pasien) + filter Semua/Tersedia/Terisi + footer konfirmasi. Bed terpilih → badge **"✓ Direservasi"** (emerald solid). Animasi buka/tutup mulus via `AnimatePresence` (backdrop fade + panel scale).
- **Backend — enrichment okupansi** (agar "siapa mengisi" muncul): [bedAllocationDal.listActive](../src/lib/dal/bedAllocationDal.ts) join `kunjungan→pasien`; [bedAllocationService](../src/lib/services/bedAllocationService.ts) `toActiveDTO` map `kunjunganNo`/`pasienNama`/`pasienNoRm`; [BedAllocationDTO](../src/lib/schemas/bedAllocation.ts) +field opsional (backward-compat, konsumen lain tak terpengaruh). Endpoint tetap `GET /bed-allocations` (gate `registration.kunjungan:read`).
- **DPJP RI = search dropdown dokter ter-assign ruangan** — `listDokter({ locationId })` (master.PenugasanRuangan, pola IGD) → `Select searchable`; auto-pilih bila 1; ganti ruangan reset bed+DPJP. Input DPJP teks-bebas kini **hanya Rawat Jalan** ([StepKunjungan](../src/components/registration/patient/modals/daftar-kunjungan/StepKunjungan.tsx)). `dpjpId` kini dikirim utk RI juga ([daftarKunjunganApi](../src/components/registration/patient/modals/daftar-kunjungan/daftarKunjunganApi.ts)) → persist `Kunjungan.dpjpId`. Review pakai `dpjpNama` utk IGD & RI.
- **Peringatan DPJP ≠ SPRI** — banner di bawah dropdown DPJP saat admisi via SPRI: 🟠 berbeda (SPRI menetapkan dr. X · SMF Y — Anda memilih dr. Z, non-blocking) · 🟢 sesuai · ⚪ info SPRI sebelum memilih. Pencocokan via nama ter-normalisasi (DTO SPRI ekspos `dpjpNama`/`smfSpesialistik`, bukan pegawaiId). SPRI aktif diturunkan di [PatientDashboard](../src/components/registration/PatientDashboard.tsx) (`ranapSpri` by `?spri=`), prop `spriDpjp` di-thread modal→step. Tipe `SpriDpjpHint` di [config](../src/components/registration/patient/modals/daftar-kunjungan/config.ts).
- **Verifikasi**: tsc 0 error · ESLint 0 error (sisa warn `_actor` konvensi, pre-existing).

---

## ✅ Selesai — Pasien Detail Registrasi: Redesign SaaS + Riwayat Journey Tree (2026-06-25)

Halaman `/ehis-registration/pasien/{id}` di-redesign modern SaaS, full-width.

- **Hero identitas full-width** ([PatientHero](../src/components/registration/patient/PatientHero.tsx)) — avatar (upload hover + pulse dot kunjungan aktif), chips (umur/gender/gol. darah/penjamin), meta grid (RM/NIK/Satusehat/Terdaftar), CTA "Daftar Kunjungan" (terkunci saat ada kunjungan aktif + banner), 3 KPI tile (Total/Aktif/Jadwal) bg soft per-tint. Widget "Sisa Tagihan" **dihapus**. Layout dashboard hero + grid asimetris (kiri 2 / kanan 3), `max-w` dilepas (full width).
- **Aksi Cepat** ([PatientLeftPanel](../src/components/registration/patient/PatientLeftPanel.tsx)) — pane + box tombol bg soft sky (dua tona); Tagihan read-only + deep-link Billing.
- **Riwayat = pohon perjalanan gabungan** ([RiwayatTab](../src/components/registration/patient/RiwayatTab.tsx)) — alur + riwayat jadi 1 tree vertikal (urut terbaru), node teratas/aktif = spotlight "Kunjungan Terakhir" (lebih besar), tiap node **expandable default-terbuka**: Penjamin (Umum/BPJS), No. SEP bila JKN, DPJP, ruangan, diagnosa, cabang Order Layanan. **Keterangan SPRI** (🟢 ber-No.Ref / 🟠 "Menunggu No. Referensi BPJS" — tetap muncul walau ref kosong) dari `listSpri()` di [PatientDashboard](../src/components/registration/PatientDashboard.tsx) (map by kunjunganId/riKunjunganId).
- **Resolve DPJP & Ruangan** — list-item DTO hanya bawa `dpjpId`/`ruanganId`; nama diresolusi lazy: DPJP via `getDokter` (dedup global, pola KunjunganResolver), Ruangan via `getTree()` sekali (peta Location.id→name). `KunjunganRecord` +field `dpjpId`/`ruanganId`/`ruangan` ([data.ts](../src/lib/data.ts)); list adapter [kunjunganRiwayatApi](../src/components/registration/patient/kunjunganRiwayatApi.ts) isi `dpjpId`/`ruanganId`/`klinisPath`. `patientView` enrich `dokter`/`ruangan` (mock tak tersentuh). Nama ruangan tampil **di sebelah unit** (mis. "IGD · Bedah") font sama besar.
- **Tombol "Buka Rekam Medis" per node** — header tiap kunjungan: toggle expand + link **Rekam Medis** (`klinisPath` → worklist klinis unit, tab baru) + chevron (tanpa nested button).
- **Bugfix SDM Assignment** ([SDMAssignmentPane](../src/components/master/mapping/sdm/SDMAssignmentPane.tsx)) — revalidate-on-mount (preserve temp optimistik) agar perubahan assignment tampil tanpa refresh penuh (pane remount via AnimatePresence keyed sebelumnya re-seed snapshot SSR lama).
- **Verifikasi**: tsc 0 error · ESLint 0 error (sisa warn `<img>` LCP avatar, diterima).

---

## ✅ Selesai — Ekspertise & Validasi Radiologi DIGABUNG + Cetak Hasil TTE/QR (2026-06-23)

- **Workflow disatukan** — tab "Validasi & Rilis" dihapus dari nav (file [ValidasiPane](../src/components/rad/tabs/ValidasiPane.tsx) disisakan, tidak dihapus). Alur: isi Ekspertise → **Terbitkan, Validasi & Rilis → Selesai** (satu tombol) → **Cetak Hasil**.
- **Backend (tanpa migrasi)** — `radResultService.saveHasil(finalize=true)` kini = terbit + validasi + rilis sekaligus: stamp `validator`/`validatorUserId`/`validatedAt` saat `create` (validator = radiolog penulis = penanda tangan), transisi `Diterima/Diperiksa → Selesai` langsung (Divalidasi dilewati). [radResultDal.CreateRadResultData](../src/lib/dal/rad/radResultDal.ts) diperluas field validasi. `validate` lama disisakan (legacy). SDM Assignment `assertActorAssignedToRad` tetap.
- **EkspertasiPane** ([EkspertasiPane](../src/components/rad/tabs/EkspertasiPane.tsx)) jadi "Expertise & Validasi" — billing ingest (`ingestRadOrder`, idempotent) saat terbit; done-state + tombol **Cetak Hasil**; alur konfirmasi temuan kritis dipertahankan.
- **Cetak Hasil A4 + QR TTE** — [RadPrintModal](../src/components/rad/RadPrintModal.tsx) (pola PrintPreviewModal Lab): iframe srcdoc + `@page A4` + watermark; narasi indikasi/teknik/temuan/kesan/saran + temuan kritis; TTD radiografer (dari `order.akuisisi`) + **QR TTE radiolog** (`TteQr`, serial `TTE-RAD-…`, payload `EHIS-RAD|…`, deterministik mock-success). Hasil RESMI dari DB (`getRadResult`) fallback `order.ekspertasi`.
- **TteQr dipindah ke shared** — [shared/TteQr](../src/components/shared/TteQr.tsx) (dari `components/lab/`), prefix serial generik; import Lab RiwayatPane di-update.
- **Header 4→3 step** ([RadOrderHeader](../src/components/rad/RadOrderHeader.tsx)) — Verifikasi → Akuisisi → Expertise & Validasi; `STEP_BY_STATUS` disesuaikan (Selesai=3).
- **Verifikasi**: tsc 0 error · ESLint 0 error (hanya warn `_actor` konvensi).

---

## ✅ Selesai — Akuisisi & Dosis Radiologi: form picker + persist DB (OPSIONAL) (2026-06-23)

- **Form akuisisi disempurnakan** ([AkuisisiPane](../src/components/rad/tabs/AkuisisiPane.tsx)) — waktu Mulai/Selesai pakai [DateTimePicker](../src/components/shared/inputs/DateTimePicker.tsx) global (tanpa auto-fill); **radiografer = multi-select** [RadiograferPicker](../src/components/rad/RadiograferPicker.tsx) (accent teal, chip+toggle) dari **roster ter-assign Radiologi** (`useRadRoster`), default = user login (diderivasi via `useMemo`, bukan setState-in-effect), nama diturunkan dari roster (anti-spoof).
- **Sadar radiasi pengion** — helper `isIonizing = mod ∉ {USG, MRI}`: log Dosis + checklist Proteksi Radiasi + DRL/ALARA hanya muncul utk modalitas pengion; USG/MRI tampil "Tanpa Radiasi Pengion". Parameter Teknis (probe/frekuensi) tetap utk USG.
- **OPSIONAL** — tak ada field wajib (`canSubmit = !done`); badge "OPSIONAL"; tombol "Lewati Akuisisi → Expertise" bila kosong.
- **Kontrak baru `medicalrecord.RadAkuisisi`** (append-only "latest wins", migrasi drift-safe `20260623140000`) — `radiografer`/`paramTeknis`/`proteksi`/`dosis` = JSONB (variatif per modalitas; dosis & proteksi NULL utk non-pengion); `mulaiAt`/`selesaiAt`. Relasi `RadOrder.akuisisi[]`.
- **Layered** — [schemas/rad/radAkuisisi.ts](../src/lib/schemas/rad/radAkuisisi.ts) (Zod SaveRadAkuisisiInput + DTO) · [radAkuisisiDal](../src/lib/dal/rad/radAkuisisiDal.ts) · [radAkuisisiService](../src/lib/services/rad/radAkuisisiService.ts) (`getAkuisisi`/`saveAkuisisi`; guard status ∈ {Diterima,Diperiksa} · transisi opsional Diterima→Diperiksa atomik · **SDM Assignment** `assertActorAssignedToRad`) · route `GET/POST /rad/orders/:id/akuisisi` (gate `ancillary.rad.worklist` read/update, scopeKunjungan:false) · API client [radAkuisisi.ts](../src/lib/api/rad/radAkuisisi.ts).
- **Wired FE** — [RadOrderWorkspace](../src/components/rad/RadOrderWorkspace.tsx) fetch `getRadAkuisisi` (paralel hasil) → `toAkuisisi` → `order.akuisisi` + timestamps; AkuisisiPane submit → `saveRadAkuisisi` (toast, `updateRadWorkflow` mock dilepas).
- **Verifikasi**: tsc 0 error · ESLint 0 error (hanya warn `_actor` konvensi) · smoke DB (12 kolom + JSONB round-trip OK, rollback).

---

## ✅ Selesai — Worklist Card-Grid + Detail Order Radiologi DB-driven (desain dipertahankan) (2026-06-23)

Dua permintaan: (1) worklist order jadi **grid kartu**, (2) Detail Order dengan pengisian **ekspertise** memakai **desain mock asli** (tak diubah) — hanya data/kontrak/endpoint disambungkan ke DB.

- **Worklist card-grid** — [RadInbox](../src/components/rad/RadInbox.tsx) "Belum Diterima" & "Dalam Pengerjaan" dari list vertikal → **grid responsif** (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`); kartu "Dalam Pengerjaan" → `Link` ke detail order.
- **Detail Order DB-driven, desain dipertahankan** — desain lama (`RadOrderHeader` + `RadOrderTabs` 8 pane) **tidak diubah**; data dipetakan dari DB:
  - [RadOrderWorkspace](../src/components/rad/RadOrderWorkspace.tsx) (client) fetch `getRadOrder` + `getRadResult` → `mapToRadOrder` (petakan enum DB status/modalitas/prioritas/unit → vokabuler desain; hasil DB → `ekspertasi`/`validasi` shape) → render header + tabs; `refresh` reload-counter.
  - `RadOrderTabs` jadi **controlled** (`order` + `onRefresh`, bukan `initialOrder`+getRadOrderById mock). Detail page → `<RadOrderWorkspace id />`.
- **Kontrak RadResult disesuaikan ke desain** (laporan tunggal, bukan per-item) — kolom additif `indikasi_klinis/teknik/temuan/kesan/saran/radiolog_sip` (migrasi drift-safe `20260623120000`, tabel kosong; `rad_result_item` ditinggalkan); `critical_notifs` JSONB simpan `CriticalFinding[]`; `radiolog`=spradNama. Rewrite [schemas/rad/radResult.ts](../src/lib/schemas/rad/radResult.ts) (SaveRadResultInput + `finalize` flag, ValidateRadResultInput, RadResultDTO single-report). 
- **Backend** [radResultDal](../src/lib/dal/rad/radResultDal.ts) (append-only) + [radResultService](../src/lib/services/rad/radResultService.ts) (`saveHasil` finalize=false draft / finalize=true → transisi Diterima/Diperiksa→Divalidasi atomik · `validate` → Divalidasi→Selesai · SDM Assignment `assertActorAssignedToRad` aktor) + routes `GET/POST /rad/orders/:id/hasil` · `POST /:id/validasi` (gate `ancillary.rad.expertise`) · `GET /kunjungan/:id/rad/:radId/hasil` (klinis).
- **Pane wired (desain utuh)** — `EkspertasiPane` Simpan Draft/Terbitkan → `saveRadResult`; `ValidasiPane` → `validateRadResult` (validator nama free-text sesuai desain) + billing ingest client. `updateRadWorkflow` mock dilepas dari kedua pane.
- **Verifikasi Identitas (SKP 1) selaras Lab** — [VerifikasiPane](../src/components/rad/tabs/VerifikasiPane.tsx) "Diterima Oleh" = **user login** (read-only, badge "user login", bukan input bebas) + **SDM Assignment guard** (`useRadRoster` + banner amber "Belum Ditugaskan ke Radiologi"); layout detail di-wrap `SessionProvider`; `useRadRoster`/`api/rad/radRoster.ts` di-recreate. Pola = Penerimaan Lab (penerima sesi; receive nyata tetap di worklist RadInbox). 
- **Verifikasi**: tsc 0 error · ESLint 0 error · smoke DB (insert/read kolom baru + JSONB criticalFindings OK).
- **Sisa**: pane Persiapan/Kontras/Viewer masih lokal (belum ada DB backing; Akuisisi ✅ persist 2026-06-23) · cetak hasil A4+QR TTE · klinis "Lihat Hasil" di RiwayatOrderRad.

---

## ✅ Selesai — Kontrak Order Radiologi + Hasil (mirror Lab) (2026-06-22)

Fondasi data-contract untuk alur **Order Radiologi → Worklist → Entry Hasil (ekspertise) → Validasi**, persis pola Laboratorium (ASSIGNMENT-RULES + API-RULES). **Belum** ada DAL/Service/route/FE — ini layer kontrak saja; implementasi menyusul.

- **Prisma models** (migrasi drift-safe `20260622130000_init_medicalrecord_rad_order_result`, 4 tabel):
  - `RadOrder` (header: radKode/radNama Location Radiologi + prioritas + klinis/indikasi + penulis + author; status workflow; soft-delete) + `RadOrderItem` (snapshot katalog: kode/nama/**modalitas FHIR**/region/TAT/persiapan/harga).
  - `RadResult` (ekspertise: radiografer + **radiolog** pembaca + catatan + **criticalNotifs JSONB** ACR + **validasi** radiolog stamp; append-only "latest wins") + `RadResultItem` (per pemeriksaan: proyeksi + **temuan + kesan** narasi). Beda dari Lab: hasil rad = narasi temuan/kesan, bukan nilai parameter.
  - Back-relation `radOrder RadOrder[]` di `encounter.Kunjungan`.
- **Zod + DTO** [schemas/rad/radOrder.ts](../src/lib/schemas/rad/radOrder.ts) (RadItemInput/RadOrderInput/RadCancelParams/RadOrderIdParam/RadWorklistQuery + RadOrderItemDTO/RadOrderDTO/**RadPetugasDTO**/RadOrderWorklistDTO) · [schemas/rad/radResult.ts](../src/lib/schemas/rad/radResult.ts) (RadCriticalNotifInput/RadResultItemInput/SaveRadResultInput/ValidateRadResultInput + RadResultItemDTO/RadResultDTO). Mirror schemas/lab/*.
- **API client** [api/rad/radOrder.ts](../src/lib/api/rad/radOrder.ts) (list/create/cancel/worklist/get/receive) · [api/rad/radResult.ts](../src/lib/api/rad/radResult.ts) (get/getForKunjungan/save/validate). Endpoint target: `/kunjungan/:id/rad` · `/rad/orders[...]` · `/rad/orders/:id/hasil|validasi` (belum dibuat).
- **SDM Assignment** [services/rad/radAssignment.ts](../src/lib/services/rad/radAssignment.ts) — mirror labAssignment per ASSIGNMENT-RULES: `radRoster` (`LocationType.Radiologi`), `assertActorAssignedToRad` (penerima/radiografer/radiolog), `resolveValidatorNama` (validator = **radiolog** ter-assign, anti-spoof), bypass `isSuperuser||isGlobal`. ASSIGNMENT-RULES §7 → Radiologi 🟡 (helper siap, enforcement menyusul).
- **Verifikasi**: 4 tabel `rad_*` ada di DB · `prisma generate` OK · tsc bersih (app code) · ESLint 0 problem pada file rad baru.
- **Follow-up (mirror Lab):** DAL (radOrderDal/radResultDal) · Service (radOrderService/radResultService + transisi atomik + assignment enforcement) · routes (`/kunjungan/:id/rad`, `/rad/orders/*`, hasil/validasi, `/rad/orders/:id/petugas`) · RBAC role `ancillary.rad.*` (Radiografer/Radiolog) · FE wiring OrderRadTab persist + Riwayat + worklist Rad.

---

## ✅ Selesai — Order Radiologi LIVE: buat order → Radiologi Terima (2026-06-22)

Slice operasional "bisa terima order" (mirror Lab sampai receive). Order dari klinis tersimpan ke DB & dapat diterima unit Radiologi. **RBAC `ancillary.rad.worklist` (read/update) sudah ter-seed** ke Radiografer + SpRad (tak perlu migrasi RBAC).

- **DAL** [radOrderDal](../src/lib/dal/rad/radOrderDal.ts) — create (header+items) · listByKunjungan · findById · findByIdWithKunjungan (join pasien) · listForRad (worklist) · receive (guard `status=Menunggu`) · cancel · transition · softDelete. Mirror labOrderDal.
- **Service** [radOrderService](../src/lib/services/rad/radOrderService.ts) — create (status awal IGD/RI=`Menunggu`, RJ=`Diterima`; penulis dari input/actor) · list · listForRad · getRadOne · **receive (`assertActorAssignedToRad` — penerima HARUS ter-assign Radiologi, superuser/global bypass)** · listPetugas (roster) · cancel. Map entity→DTO. Mirror labOrderService.
- **Routes** (mirror lab): `GET/POST /api/v1/kunjungan/:id/rad` + `POST /:radId/cancel` (gate **`clinical.tindakan`**, ABAC careUnit) · `GET /api/v1/rad/orders` (worklist) · `GET /:id` · `POST /:id/receive` · `GET /:id/petugas` (gate **`ancillary.rad.worklist`**, `scopeKunjungan:false`).
- **FE OrderRadTab** ([shared](../src/components/shared/medical-records/OrderRadTab.tsx)) — `kunjunganId` di-thread dari wrapper IGD/RI/RJ; submit saat UUID → `createRadOrder` (radNama "Radiologi", item bawa `radCatalogId`+modalitas FHIR+region+harga snapshot) → Order Aktif dari DB (`listRadOrders` + `mapDbRadOrderToActive`); Batalkan → `cancelRadOrder`; tombol loading state. Pasien demo (non-UUID) tetap lokal (mock).
- **FE Rad worklist** — [RadInbox](../src/components/rad/RadInbox.tsx) (DB) di [RadPageView](../src/components/rad/RadPageView.tsx): panel "Order Masuk dari Klinis" (Belum Diterima + Sudah Diterima) + tombol **Terima** (`receiveRadOrder`) + badge pending beranimasi di tab Worklist. **Board mock lama (`RadBoard`) tetap di bawah** utk workflow demo (akuisisi/ekspertise/validasi) — belum DB.
- **ASSIGNMENT-RULES §7 → Radiologi ✅** (receive enforced).
- **Verifikasi**: smoke test data-layer (kunjungan nyata) — CREATE → WORKLIST join → RECEIVE (Menunggu→Diterima) → guard idempoten (receive ke-2 = 0 baris) → cascade delete item, semua lulus. tsc bersih (app code) · ESLint 0 error (warning pre-existing). **Catatan:** roster Radiologi masih kosong → Terima hanya jalan utk Admin (bypass); assign Radiografer ke ruangan Radiologi via Mapping Hub → SDM Assignment agar bisa Terima sebagai Radiografer.
- **Sisa (mirror Lab):** Entry Hasil (ekspertise temuan/kesan) + Validasi radiolog → radResultDal/Service/route + lifecycle penuh di RadBoard (DB) + Riwayat hasil rad di tab klinis.

---

## ✅ Selesai — Riwayat Order Rad (klinis, DB) + hapus mock worklist Rad (2026-06-22)

Dua hal: (1) tab klinis Order Rad kini punya **Riwayat Order Radiologi** (DB, status pemenuhan) seperti Lab; (2) **worklist Rad dibersihkan dari mock**.

- **[RiwayatOrderRad](../src/components/shared/medical-records/orderRad/RiwayatOrderRad.tsx)** (mirror [RiwayatOrderLab](../src/components/shared/medical-records/orderLab/RiwayatOrderLab.tsx)) — fetch `listRadOrders(kunjunganId)`; filter chips per bucket (Belum Diterima/Diproses/Selesai, count); baris status (badge+dot+row-bg per status: Menunggu/Diterima/Diperiksa/Divalidasi/Selesai/Ditolak/Dibatalkan); expand item (nama/kode · modalitas · TAT · tarif + total); **Salin** (re-order → form) + **Batalkan** (`cancelRadOrder`, hanya saat Menunggu, `canWrite`); hint "sedang diproses" utk status proses. Pasien demo (non-UUID) → panel null (mock RiwayatRadSection lama tetap utk noRM mock). Self-contained (status cfg inline). **Lihat Hasil belum** (radResult slice berikutnya).
- **OrderRadTab** refactor: persisted submit **tanpa takeover layar** (bersihkan form + toast + `riwayatSignal++` → RiwayatOrderRad refetch, order baru langsung tampil) — mirip Lab; `activeOrders` (mock) **demo-only** (persisted pakai RiwayatOrderRad, hindari duplikasi); tambah `copyOrderToForm(RadOrderDTO)` (Salin) + `canCancel` (useSession). Hapus jalur "Order Aktif dari DB" + `mapDbRadOrderToActive` (digantikan panel riwayat).
- **Worklist Rad — MOCK DIHAPUS**: `RadPageView` worklist kini **RadInbox (DB) saja** (`<RadBoard/>` mock dilepas) · `(main)/radiologi/page.tsx` buang `deriveRadOrders()` + stat header mock (CITO/Antrian/Diproses/Selesai/Kritis) → tinggal judul + workflow guide (teks statis) + RadPageView. `RadBoard.tsx` + detail workflow mock (`RadOrderTabs`/`RiwayatRadPane`/detail page) **dibiarkan** (bukan worklist; jadi referensi slice lifecycle DB berikutnya).
- **Verifikasi:** tsc bersih (app code) · ESLint 0 error (1 warning pre-existing `no-unused-expressions`).

---

## ✅ Selesai — Tab Klinis Order Radiologi: katalog DB ter-assign + hapus Panduan (2026-06-22)

Tab **Order Radiologi** (shared IGD/RI/RJ) kini ambil katalog dari **DB** (pemeriksaan ter-assign ke ruangan Radiologi), persis pola tab Order Lab — bukan lagi seed statis.

- **Endpoint baru `GET /master/rad-catalog-tersedia`** (mirror `lab-test-tersedia`): hanya pemeriksaan yang ter-assign ke ruangan **Radiologi** (`location_type=Radiologi`) via Mapping Hub → Layanan Unit (grup Rad), distinct + `ruanganKodes[]` + **harga dari Tarif Matrix** per `penjaminKode`+`jenisRuangan`. Gate **`clinical.tindakan:read`** (Dokter/Perawat — bukan master), `scopeKunjungan:false`.
  - Layered: DAL [layananUnitRadDal.listAssignedRadCatalog](../src/lib/dal/master/layananUnitRadDal.ts) (join LayananUnitRad→RadCatalog Aktif + tarif match) → Service [layananUnitRadService.listRadCatalogTersedia](../src/lib/services/master/layananUnitRadService.ts) (agregasi distinct + **format TAT rutin & ringkas persiapan dari blok JSONB** server-side) → route [/master/rad-catalog-tersedia](../src/app/api/v1/master/rad-catalog-tersedia/route.ts). Schema/DTO [radCatalogTersedia.ts](../src/lib/schemas/master/radCatalogTersedia.ts) + client [api/master/radCatalogTersedia.ts](../src/lib/api/master/radCatalogTersedia.ts).
- **FE [OrderRadTab](../src/components/shared/medical-records/OrderRadTab.tsx)**: fetch sekali saat mount (`penjaminKode=UMUM`, `jenisRuangan` = tier dari unit pengirim); `RadSearch` terima `catalog` prop (bukan lagi modul-level statis); loading spinner + error banner (saran cek Mapping Hub) + badge jumlah pemeriksaan; harga tampil di hasil cari, per item daftar order, & **Est. total** di footer.
- **Panduan Order Radiologi DIHAPUS** (panel tips statis) sesuai permintaan.
- **Paket Cepat** di-resolve dari katalog ter-assign by **kode DB `RAD-NNNN`** (sebelumnya `RAD-XR001` yang tak ada di DB → selalu kosong): Trauma Survey / Thorax+Kepala / Abdomen Akut / Stroke Protocol / PE Protocol / Skrining Mammae; paket tanpa anggota disembunyikan, total harga di tooltip.
- **`RAD_CATALOG_SEED`/`formatTAT`/`summarizePersiapan` dihapus dari tab** (formatting pindah server-side; seed masih dipakai Beranda).
- **Belum** persist order rad ke DB (Active Orders masih state lokal mock) — follow-up `medicalrecord.RadOrder` mirror LabOrder.
- **Verifikasi DB**: 24 pemeriksaan ter-assign ke 1 ruangan Radiologi (R2606012), semua ber-harga UMUM/IGD (Rp 100rb–850rb). tsc bersih (app code) · ESLint 0 error (warning pre-existing `_actor`/`no-unused-expressions`).

---

## ✅ Selesai — Tab Klinis Daftar Order: DB-driven (Resep+Lab) + detail + Timeline Status (2026-06-22)

Halaman **Daftar Order** (tab klinis IGD/RI/RJ) kini menampilkan **semua order Resep + Lab kunjungan dari DB** (sebelumnya `ORDERS_MOCK`), lengkap detail item & **Timeline Status** per order.

- **Gabung lintas-jenis** — kunjungan UUID → `Promise.all([listResep, listLabOrders])` → `mergeDbOrders` (map Resep+Lab → `Order` terpadu, urut `createdAt` desc). Pasien demo (non-UUID) → `ORDERS_MOCK` (tak berubah). Loading spinner. Adapter IGD/RI/RJ kirim `kunjunganId = patient.id`.
- **Mapping** [daftarOrderShared.ts](../src/components/shared/medical-records/daftarOrder/daftarOrderShared.ts): `mapResepToOrder`/`mapLabToOrder` (detail item: Resep=dosis·signa·rute·jumlah + HAM badge, Lab=kategori·TAT + CITO); status DB→terpadu (Menunggu/Diterima/Diproses/Selesai/Dibatalkan) + simpan `nativeStatus` + `createdAtISO`. CITO disisipkan ke catatan.
- **Timeline Status** [OrderTimeline](../src/components/shared/medical-records/daftarOrder/OrderTimeline.tsx) (vertikal, di detail OrderRow): tahapan **faithful per-jenis** dari `nativeStatus` — Resep (Order Dibuat→Diterima Farmasi→Telaah→Selesai) · Lab (Order Dibuat→Diterima Lab→Analisa→Validasi→Rilis), else generik; node done/current/pending + waktu order pada stage pertama; **Dibatalkan/Ditolak = kartu terminal**. `buildOrderTimeline`/`orderCreatedLabel` di shared. Stepper horizontal lama (`StatusPipeline`) dihapus.
- **Batalkan** — order DB → API nyata (`cancelResep`/`cancelLabOrder`) + refetch + toast global; tombol hanya muncul saat `nativeStatus="Menunggu"` (cegah 409). Mock → update lokal + CancelToast.
- Rad/BMHP belum punya order DB → kartu/​filter tetap (count 0) sampai endpoint order-nya ada.
- **Latar kartu per status ✅** — `STATUS_CARD` (tint slate/sky/amber/emerald/rose selaras `STATUS_BADGE`) di OrderRow; header hover netral (`bg-black/3`), body detail dinetralkan agar tint status dominan.
- **Widget Estimasi Biaya ✅** — [OrderCostSummary](../src/components/shared/medical-records/daftarOrder/OrderCostSummary.tsx): akumulasi tarif **per jenis** (Resep/Lab/Radiologi/BMHP, kartu bertint jenis) + **grand total** (emerald), order Dibatalkan tak dihitung. Helper `orderCost`/`costByType`/`fmtRp`; `OrderItem.harga` di-carry (Lab dari `item.harga` Tarif Matrix).
- **Harga Resep ditambal end-to-end ✅ (2026-06-22)** — sebelumnya Resep selalu Rp 0 (harga obat ada di `master.Obat.hargaSatuan` tapi tak pernah dibawa turun). Diperbaiki di seluruh rantai: kolom **`ResepItem.harga Int?`** (migrasi drift-safe `20260622120000`) · `ResepItemInput`/`ResepItemDTO` + DAL + Service simpan/return harga · `obat-tersedia` (DTO+service+DAL select) kini expose `hargaSatuan` · form IGD `ResepPasienTab` + shared `ResepPane` bawa harga saat pilih obat (`ObatCatalog.harga`) → `createResep` · mapper `mapResepToOrder` set **biaya baris = harga × jumlah**; per-item harga tampil di detail OrderRow. Model harga: Obat = flat `hargaSatuan` × qty (bukan Tarif Matrix per-penjamin spt Lab/Rad). Verifikasi DB: 29/29 obat aktif ber-`hargaSatuan` & ter-formularium → widget Resep kini ber-nilai nyata. Sisa Rp 0: Rad/BMHP (belum ada order DB).
- **Verifikasi** — tsc bersih (app code) · ESLint bersih (sisa warning pre-existing `_actor`/`no-unused-expressions`).

---

## ✅ Selesai — Tab Klinis Order Lab: tombol "Lihat Hasil" → modal hasil pemeriksaan (2026-06-22)

Card "Riwayat Order Lab" (tab klinis IGD/RI/RJ) kini punya tombol **Lihat Hasil** untuk order Selesai → hasil tampil dalam **modal** yang rapi (bukan inline).

- **Endpoint klinis** `GET /api/v1/kunjungan/:id/lab/:labId/hasil` — gate **`clinical.tindakan:read`** (selaras read order lab; klinisi TIDAK punya `ancillary.lab.worklist` sehingga `getLabResult` lab-staff tak bisa dipakai) + **ABAC careUnit** via params kunjungan. Service `labResultService.getHasilForKunjungan` (verifikasi `order.kunjunganId === kunjungan` anti-IDOR → DTO hasil terbaru / null). Client `getLabResultForKunjungan`.
- **FE** [RiwayatOrderLab](../src/components/shared/medical-records/orderLab/RiwayatOrderLab.tsx): order **Selesai** → chip **"Lihat Hasil"** (emerald, di baris, tanpa perlu expand) buka `LabHasilModal` — header gradient sky→indigo (FlaskConical + labNama + jumlah pemeriksaan), **meta strip** (waktu/CITO/Kritis/Abnormal/total tarif), body `LabHasilView` (parameter **terisi saja**, dikelompokkan kategori, nilai/satuan/rujukan + **flag berwarna** N/H/L/C, baris kritis/abnormal highlight), footer **grid analis/validator/rilis + catatan validator**. Modal: fetch sendiri saat buka (loading/empty state), **Escape + klik-luar** tutup, `backdrop-blur`, animasi framer-motion, `role=dialog`/`aria-modal`. **Di-portal ke `document.body`** (`createPortal`) — wajib karena tab klinis dibungkus `motion.div` ber-`transform` (IGD/RIRecordTabs) yang jadi containing-block `position:fixed` → tanpa portal blur/overlay hanya menutupi area konten, bukan seluruh layar. Status proses (Diterima/Divalidasi) → hint "Hasil sedang diproses". `FLAG_STYLE` self-contained.
- **Verifikasi** — tsc bersih (app code) · ESLint bersih.

---

## ✅ Selesai — Lab: Cetak Hasil sesuai DB + parameter terisi saja + QR TTE validator (2026-06-21)

Cetakan "Hasil Pemeriksaan Lab" (RiwayatPane → PrintPreviewModal) disesuaikan dgn hasil aktual + tanda tangan elektronik.

- **Sumber hasil = DB** — modal fetch `getLabResult(order.id)` (medicalrecord.LabResult, fallback overlay sesi). Sebelumnya pakai `order.hasil` overlay → kosong saat fresh load. Validator/analis/catatan/`validatedAt` juga dari DB (fallback order).
- **Hanya parameter TERISI** — `rows = values.filter(nilai != "")`; kategori tanpa baris terisi otomatis hilang; empty-state bila tak ada yang terisi.
- **QR TTE validator (SpPK)** — komponen baru [TteQr](../src/components/lab/TteQr.tsx): matriks QR-style deterministik (finder 3-sudut + timing + alignment + data dari FNV-1a→mulberry32), SVG `shapeRendering=crispEdges`, SELARAS pola mock [TteBarcode](../src/components/shared/resep/TteBarcode.tsx) resep (QR ter-scan penuh butuh lib encoder → ditunda). Helper `tteSerial(seed)` → `TTE-LAB-…`; payload `EHIS-LAB|noOrder|RM|VALIDATOR|validatedAt|serial`. Footer cetak: TTD analis · **QR + nama + serial + "Tertandatangani elektronik"** (validator) · waktu rilis.
- **CSS print** — kelas semantik (`sign-grid`/`sign-col`/`tte-box`/`cat`/`muted`) ditambah ke `<style>` iframe (Tailwind tak ikut ke iframe) agar tata letak tanda tangan & QR rapi saat dicetak.
- **Kertas A4** — `@page { size:A4; margin:14mm 12mm }` + `*{box-sizing:border-box}` di iframe; preview on-screen jadi **lembar A4 WYSIWYG** (sheet `w-[210mm]` putih + shadow di atas latar abu, modal `max-w-4xl`, `max-h-[78vh]` scroll).
- **Verifikasi** — tsc bersih (app code) · ESLint bersih.

---

## ✅ Selesai — Lab: SDM Assignment jadi HYBRID (enforcement server-side) + ASSIGNMENT-RULES.md (2026-06-21)

Gating SDM Assignment Lab dinaikkan dari **UI-only** → **hybrid RBAC + ABAC** (ditegakkan di server). Client gating ≠ enforcement: tanpa lapis Service, pemegang role yang tak ter-assign bisa menembus via API langsung.

- **Helper bersama** [labAssignment.ts](../src/lib/services/lab/labAssignment.ts) — `labRoster(labKode)` (dedup; labKode→ruangan spesifik else semua Location Laboratorium), `labAssignmentBypassed(actor)` = **`isSuperuser || isGlobal`**, `assertActorAssignedToLab(actor, labKode)` (throw `forbidden` bila bukan SDM ter-assign), `resolveValidatorNama(...)` (nama validator **diturunkan dari roster**, anti-spoof). `labOrderService.listPetugas` di-DRY-kan ke `labRoster`.
- **Enforcement 3 titik (Service, sebelum mutasi):** `labOrderService.receive` & `labResultService.saveHasil` → `assertActorAssignedToLab` (penerima/analis HARUS ter-assign). `labResultService.validate` → `resolveValidatorNama` (validator HARUS dokter ter-assign; non-bypass: `validatorPegawaiId` wajib & diverifikasi → nama dari roster).
- **Kontrak validator** — `ValidateLabResultInput` + `validatorPegawaiId` (uuid opsional); FE kirim pegawaiId (bukan nama). Server menurunkan nama; `validator` (nama) cuma fallback utk actor bypass.
- **Bypass `isSuperuser || isGlobal`** — Admin SELALU lolos (tak terkunci); role global lolos krn SDM = unit-scoping (konsisten careUnit ABAC). DEV actor (`AUTH_ENFORCE=false`) otomatis bypass.
- **FE sinkron** — Penerimaan/Entry Hasil bypass `isSuperuser||isGlobal`; ValidasiPane: select `value=pegawaiId` (bukan nama) + kirim `validatorPegawaiId`, superuser/global pilihan **opsional** (boleh validasi tanpa dokter ter-assign), pra-pilih SpPK login by pegawaiId.
- **Doc baru** [docs/ASSIGNMENT-RULES.md](../docs/ASSIGNMENT-RULES.md) — pola hybrid + bypass + checklist + status penerapan (Lab ✅, Rad/Farmasi 📋), ditambahkan ke tabel Workflow Docs CLAUDE.md.
- **Verifikasi** — tsc bersih (app code) · ESLint bersih (sisa `_actor`); roster DB: Location Laboratorium → 2 ter-assign (Dimas Analis + Rizal Dokter Spesialis). **Follow-up:** terapkan pola ke Rad/Farmasi.

---

## ✅ Selesai — Lab: gating SDM Assignment (penerima/analis ter-assign + validator = dropdown dokter) (2026-06-21)

Penerimaan, Entry Hasil & Validasi kini sadar **SDM Assignment** (`penugasanRuangan` → Location tipe Laboratorium). Petugas yang bukan ter-assign tak bisa menerima/entry; validator dipilih dari dokter ter-assign (bukan otomatis user login).

- **Roster endpoint** `GET /api/v1/lab/orders/:id/petugas` (gate `ancillary.lab.worklist:read`, `scopeKunjungan:false`) → pegawai aktif ter-assign ke Location tipe `Laboratorium`. Order ber-`labKode` → ruangan spesifik; bila kosong (realita sekarang, FE kirim `labNama:"Laboratorium"` tanpa kode) → **semua Location Laboratorium**. Layered: DAL [`listPetugasByLocations`](../src/lib/dal/penugasanRuanganDal.ts) (roster lintas-ruangan, pegawai aktif) → Service [`labOrderService.listPetugas`](../src/lib/services/lab/labOrderService.ts) (dedup per pegawai, nama+gelar, profesi) → DTO `LabPetugasDTO`. API client [`getLabRoster`](../src/lib/api/lab/labRoster.ts) + hook FE [`useLabRoster`](../src/components/lab/useLabRoster.ts) (`petugas`/`doctors` filter "dokter"/`isAssigned`/`loading`).
- **Penerimaan & Entry Hasil** — penerima ([PenerimaanPane](../src/components/lab/tabs/PenerimaanPane.tsx)) & analis ([HasilPane](../src/components/lab/tabs/HasilPane.tsx)) **HARUS** ter-assign: bila bukan SDM ter-assign → [AssignmentGuardBanner](../src/components/lab/AssignmentGuardBanner.tsx) (amber, komponen lab bersama — global toast/banner pattern, bukan `window.alert`) + tombol di-disable. **Superuser bypass** (`isSuperuser`); **tanpa sesi** (dev) tak diblok; peringatan hanya muncul setelah roster termuat (anti-kedip).
- **Validasi** ([ValidasiPane](../src/components/lab/tabs/ValidasiPane.tsx)) — Validator bukan lagi auto user login: **dropdown dokter ter-assign Lab** (profesi mengandung "dokter"), **required**, pra-pilih bila SpPK yang login termasuk roster; warning bila belum ada dokter ter-assign. Nama dokter terpilih dikirim sebagai `input.validator` (operator tetap `validatorUserId = actor.userId`). Tetap di-gate `ancillary.lab.validate:update`.
- **Verifikasi** — tsc bersih (app code) · ESLint bersih (sisa `_actor`); roster DB diverifikasi (1 Location Laboratorium → 2 petugas ter-assign: 1 Analis + 1 Dokter Spesialis → dropdown validator = dokter tsb).

---

## ✅ Selesai — Validasi Hasil Lab: persist + rilis (Divalidasi → Selesai) (2026-06-21)

Validasi hasil lab (SpPK) kini **tersimpan ke DB** + transisi order ke Selesai. Melengkapi alur Entry Hasil.

- **Schema** — kolom validasi ditambah ke `medicalrecord.LabResult` (migrasi `20260621200000`): `validator` · `validator_user_id` · `catatan_validator` · `validated_at`. **Stamp sekali** (pola SerahTerima) pada hasil terbaru; values tetap immutable.
- **Endpoint** `POST /api/v1/lab/orders/:id/validasi` (gate **`ancillary.lab.validate:update`** — SpPK saja, Analis tak punya; `scopeKunjungan:false`): stamp validator + **transisi atomik** order `Divalidasi → Selesai` dalam satu transaksi. Guard `stampValidation` (`validated_at IS NULL`) → anti double-validate. Service `labResultService.validate` (+`clock` utk `validatedAt`); DTO diperluas (validator/catatanValidator/validatedAt). API client `validateLabResult`.
- **Wiring FE** [ValidasiPane](../src/components/lab/tabs/ValidasiPane.tsx): mount fetch `getLabResult` → tampilkan hasil dari DB (overlay sesi diutamakan bila baru entry); **Validator = user login** (read-only, pola HasilPane analis); tombol Validasi di-gate `can("ancillary.lab.validate","update")` (+ hint bila tak berwenang); submit → `validateLabResult` (POST) → overlay + **billing ingest** (`ingestLabOrder`, tetap client-side, pakai `order.items`) + onStatusChange. Mapper DB→HasilItem `dtoValueToHasil` diangkat ke labShared (dipakai HasilPane + ValidasiPane).
- **Verifikasi** — tsc bersih (app code) · ESLint bersih (sisa `_actor`); stamp validasi + guard double-validate (rowcount 1 lalu 0) divalidasi DB (rolled-back). **Follow-up:** billing ingest pindah server-side · cetak hasil tervalidasi dari DB · revisi hasil pasca-reject.

---

## ✅ Selesai — Entry Hasil Lab: contracts table + endpoint persist (2026-06-21)

Hasil entry lab kini **tersimpan ke DB** (sebelumnya overlay client in-session). Tabel kontrak + endpoint layered per API-RULES.

- **Schema** `medicalrecord.LabResult` + `LabResultValue` (migrasi `20260621190000`): 1 `lab_result` (header: analis + catatan + `critical_notifs` JSONB + author) → banyak `lab_result_value` (baris per parameter; snapshot kode/nama/satuan/rujukan/critical/flag + `row_key` + `lab_test_id`/`lab_parameter_id`). **APPEND-ONLY "latest wins"** (revisi = baris baru, terbaru berlaku). FK → `lab_order` cascade; back-relation `results` di LabOrder. FHIR-ready: LabResult ≈ DiagnosticReport · Value ≈ Observation.
- **Endpoint** `/api/v1/lab/orders/:id/hasil` (folder-per-group `lab/`): **GET** hasil terbaru (gate `ancillary.lab.worklist:read`) · **POST** simpan hasil + **transisi atomik** order `Diterima/Sampel Diterima/Dianalisa → Divalidasi` dalam satu transaksi (gate `ancillary.lab.worklist:update`); `scopeKunjungan:false` (penunjang lintas-kunjungan). Layered: [schema](../src/lib/schemas/lab/labResult.ts) → [DAL](../src/lib/dal/lab/labResultDal.ts) (`create`+`findLatestByOrder`) → [Service](../src/lib/services/lab/labResultService.ts) (`makeLabResultService`, analis = `resolveActorNama` actor, transisi via `labOrderDal.transition`) → route → [API client](../src/lib/api/lab/labResult.ts).
- **Wiring FE** [HasilPane](../src/components/lab/tabs/HasilPane.tsx): mount fetch `getLabResult` → kalau ada jadi sumber tampilan (locked view setelah Divalidasi), kalau belum → susun dari katalog; **Simpan** = `saveLabResult` (POST) → order status Divalidasi (remount via `key=active-status` → tampil locked + hasil DB) + overlay in-session (agar Validasi pane sefase tetap lihat). Analis & criticalNotifs dari hasil tersimpan diutamakan.
- **Verifikasi** — tsc bersih (app code) · ESLint bersih (sisa `_actor`); rantai insert/read `lab_result`+`lab_result_value` (FK + JSONB criticalNotifs) divalidasi DB (rolled-back). **Follow-up:** ValidasiPane persist (Divalidasi→Selesai + validator) ke DB · billing ingest · cetak hasil dari DB.

---

## ✅ Selesai — Lab detail: penerima & analis = user login · Entry Hasil = parameter katalog (2026-06-21)

Pada `/ehis-care/laboratorium/{id}`: (1) tab **Penerimaan** "Diterima Oleh" = user yang sedang login (bukan input manual); (2) **Entry Hasil** baris parameter diturunkan dari **katalog master** (LabTest→LabParameter), "Analis Pelaksana" = user login.

- **Penerima/Analis = user login** — [PenerimaanPane](../src/components/lab/tabs/PenerimaanPane.tsx) & [HasilPane](../src/components/lab/tabs/HasilPane.tsx) pakai `useSession().namaTampil` (read-only display + badge "user login"), input teks dihapus; `diterima_oleh`/`analis` disimpan dari sesi. **SessionProvider** ditambah ke [layout detail Lab](../src/app/ehis-care/(fullpage)/laboratorium/[id]/layout.tsx) (fullpage di luar shell).
- **Entry Hasil dari katalog** — baris hasil = **parameter LabTest** yang diorder (mis. "Darah Rutin" → 15 parameter), bukan 1 baris/tes placeholder. Rujukan & critical disesuaikan **gender+usia pasien** (`pickRujukan`), satuan dari katalog. Helper baru `buildHasilFromCatalog`/`pickRujukan`/`hasilKey` di [labShared](../src/components/lab/labShared.ts); `LabOrderItem.labTestId` + `HasilItem.rowKey` (kunci unik param-level) ditambah; `mapDbLabOrder` membawa `labTestId`. HasilPane fetch parameter saat mount (skip bila hasil sudah tersimpan / nilai sudah diketik), fallback baris per-tes bila tes tanpa katalog.
- **Endpoint baru (sisi lab)** — `GET /api/v1/lab/test-params?ids=` (gate **`ancillary.lab.worklist:read`**, scopeKunjungan:false) → parameter katalog utk daftar tes; analis lab boleh baca tanpa hak `master.katalog`. Layered: `labTestDal.findByIds` → `labTestService.getByIds` (actor-less) → route → API client [labCatalog.ts](../src/lib/api/lab/labCatalog.ts). Schema query `LabTestParamsQuery`.
- **Verifikasi** — tsc bersih (app code) · ESLint bersih (sisa `_actor` konvensi); rantai data dicek DB: lab_order_item.lab_test_id terisi + LabTest punya parameter (Darah Rutin 15 · Elektrolit 3).

---

## ✅ Selesai — Workflow detail Lab: hapus step "Pengambilan & Sampel" (4→3 step) (2026-06-21)

Halaman `/ehis-care/laboratorium/{id}` semula 4 step (Penerimaan · Pengambilan & Sampel · Entry Hasil · Validasi). Pengambilan sampel kini dilakukan **langsung di luar aplikasi** → step Sampel dihapus, alur jadi **3 step: Penerimaan → Entry Hasil → Validasi**.

- **Tab dihapus** [LabOrderTabs](../src/components/lab/LabOrderTabs.tsx): tab `sampel` + import `SampelPane` + ikon `Syringe` dihapus; tab di-renumber penerimaan=1 · hasil=2 · validasi=3. File [SampelPane.tsx](../src/components/lab/tabs/) **dihapus** (orphan).
- **Status & step** [labShared](../src/components/lab/labShared.ts): alur ringkas `Menunggu → Diterima → [Entry Hasil] → Divalidasi → Selesai`. `LAB_STATUS_STEPS` buang "Ambil Sampel"/"Sampel Diterima" (5 milestone); `LAB_STATUS_CFG` re-step (Diterima=1 · Dianalisa=2 · Divalidasi=3 · Selesai=4; dua status sampel disetarakan step 1 utk kompat tipe, tak lagi dihasilkan UI) + `Diterima.action` "Ambil Sampel"→**"Entry Hasil"** (tombol kartu worklist). Progress bar [LabOrderCard](../src/components/lab/LabOrderCard.tsx) threshold disesuaikan (max step 4).
- **Entry Hasil langsung** [HasilPane](../src/components/lab/tabs/HasilPane.tsx): `canEnter` kini termasuk `"Diterima"` (entry terbuka sejak order diterima, tanpa registrasi sampel); pesan lock "Terima order pada tab Penerimaan terlebih dahulu".
- **Kriteria Penolakan Sampel → reminder** dipindah dari panel SampelPane ke kolom kanan HasilPane sebagai **"Pertimbangkan Kualitas Sampel"** (panel amber, 6 kriteria Hemolisis/Lipemia/Bekuan/Volume Kurang/Salah Tabung/Label, ref ISO 15189 §5.4.5 · PMK 43/2013) — bahan pertimbangan analis sebelum entry, tampil saat fase entry (`!isLocked`).
- **Verifikasi** — tsc bersih (app code) · ESLint bersih (LabOrderTabs/HasilPane/labShared/LabOrderCard/LabOrderHeader). LabBoard status-group ("Proses"/"Antrian") tetap toleran terhadap status sampel lama (tak lagi muncul). Catatan: penolakan sampel sebagai **aksi** tidak lagi di UI (sesuai pemindahan handling sampel ke luar aplikasi) — bisa ditambah kembali bila perlu.

---

## ✅ Selesai — Riwayat Order Lab di tab klinis Order Lab (mirror Riwayat Order Resep) (2026-06-21)

Tab **Order Lab** klinis (shared IGD/RI/RJ) kini menampilkan **Riwayat Order Lab** DB-backed setelah dokter berhasil order — sejajar fitur **Riwayat Order Resep** di tab Resep.

- **Komponen baru** [RiwayatOrderLab](../src/components/shared/medical-records/orderLab/RiwayatOrderLab.tsx) (mirror [RiwayatOrderResep](../src/components/shared/resep/RiwayatOrderResep.tsx)): fetch `listLabOrders(kunjunganId)` (GET /kunjungan/:id/lab) · filter chips Semua/Belum Diterima/Diproses/Selesai + counts · tombol Muat ulang · baris expand → tabel item (Pemeriksaan/Kategori/TAT/Tarif + total + catatan) · badge CITO · status badge/dot/row-bg per bucket · **Salin** (re-order → isi form) · **Batalkan** (status Menunggu, gate `clinical.tindakan:update`) → `cancelLabOrder`. Pasien demo (non-UUID) → panel auto-hidden.
- **Helper status** di [orderLabShared](../src/components/shared/medical-records/orderLab/orderLabShared.tsx): `labOrderBucket`/`labOrderStatusCfg`/`labOrderRowBg` (8 status Lab + Dibatalkan → 4 bucket belum/proses/selesai/lain) + `toKategoriLab` (coerce string DTO → KategoriLab). Pola identik `resepShared`.
- **Wiring** [OrderLabTab](../src/components/shared/medical-records/OrderLabTab.tsx): pasca-kirim order **terpersist** (UUID) **tidak lagi takeover layar sukses** — form dibersihkan + `riwayatSignal++` → RiwayatOrderLab refetch → order baru langsung tampil di panel (mirip alur worklist). `copyOrderToForm(o)` re-order (dedup by labTestId, set prioritas/catatan). `canCancel = useSession().can("clinical.tindakan","update")`. Layar sukses lama hanya untuk pasien demo (non-UUID). Panel mock lama (Order Aktif + RiwayatLabSection) tetap untuk demo (kosong/hidden utk pasien real).
- **Verifikasi** — cancel route gate `clinical.tindakan:update` + ABAC params.id; `listByKunjungan` filter `deletedAt:null` saja (semua status, newest-first → order Dibatalkan tetap tampil di "Semua"). tsc bersih (app code) · ESLint bersih.

---

## ✅ Selesai — Pegawai: Spesialistik (kondisional) + profesi "Analis Laboratorium" (2026-06-21)

Modal **Data Pegawai** (`/ehis-master/pengguna`, grup Kepegawaian) — saat **Jenis Profesi = "Dokter Spesialis"**, muncul dropdown **Spesialistik** (bidang spesialisasi); + ditambah profesi **"Analis Laboratorium"** ke daftar Jenis Profesi.

- **FE shared** ([penggunaShared.ts](../src/components/master/pengguna/penggunaShared.ts)) — `PROFESI_OPTS` +`"Analis Laboratorium"`; `SPESIALISTIK_OPTS` (24 bidang, label terbaca + singkatan SIP mis. "Jantung & Pembuluh Darah (Sp.JP)"); helper `isSpesialisProfesi` + const `SPESIALIS_PROFESI`; `PegawaiFormData.spesialistik?`.
- **UI kondisional** — di [PegawaiEditModal](../src/components/master/pengguna/PegawaiEditModal.tsx) (ubah) & [PenggunaAddWizard](../src/components/master/pengguna/PenggunaAddWizard.tsx) Step 1 (tambah): field Spesialistik reveal beranimasi (framer-motion fade+slide, tanpa clip dropdown) di kartu beraksen sky/teal; ganti profesi ke non-spesialis → field dikosongkan otomatis; validasi `required` saat profesi spesialis.
- **Backend vertical slice** — kolom `master.Pegawai.spesialistik` (TEXT nullable; migrasi drift-safe `20260621180000_pegawai_spesialistik`) → [schema Zod](../src/lib/schemas/pegawai.ts) (Create + Update nullable + DTO) → [DAL](../src/lib/dal/pegawaiDal.ts) (Create/Update data shape) → [Service](../src/lib/services/pegawaiService.ts) (gate by profesi efektif: bukan "Dokter Spesialis" → dipaksa `null`, anti data-stranded; backstop tak bergantung FE) → [API client](../src/lib/api/pegawai.ts) (mapping wizard→create).
- **Catatan arsitektur** — kredensial klinis penuh (`Dokter.spesialisKode`/STR/SIP/FHIR) **tetap di master Dokter**; `Pegawai.spesialistik` = deklarasi HR, dipakai prefill profil Dokter, BUKAN sumber kebenaran kredensial (selaras catatan di [dokter.prisma](../prisma/schema/dokter.prisma)).
- **Verifikasi** — kolom DB confirmed (information_schema); Prisma client regen; `tsc` bersih (app code); ESLint bersih (sisa 4 warning `_actor` konvensi).

---

## ✅ Selesai — Worklist Laboratorium DB-wired + notifikasi animasi + hapus mock order (2026-06-21)

Worklist Lab di-wire ke DB (sama seperti Farmasi): order yang dibuat dari tab Order Lab kini **muncul di halaman worklist**, lengkap notifikasi animasi jumlah order, dan **semua mock order lab dihapus**.

- **Worklist DB** — [LabPageView](../src/components/lab/LabPageView.tsx) jadi data-owner: fetch `listLabWorklist()` → `mapDbLabOrder` + `applyWorkflowOverlay` → pass ke [LabBoard](../src/components/lab/LabBoard.tsx) (kini props `orders`/`loading`/`onRefetch`). Section **"Belum Diterima"** (status Menunggu) + tombol **Terima** (`receiveLabOrder` → `ancillary.lab.worklist:update`) persis FarmasiBoard. StatCards/filter/paginasi/legend dipertahankan.
- **Notifikasi animasi angka order** — badge di tab **"Worklist Order"** (jumlah order baru belum diterima): muncul via spring + **pulse ring** saat tab tak aktif; StatCards pakai `AnimatedNum` (count pop saat berubah); badge "Belum Diterima · N" animasi spring.
- **Detail page DB** — [`[id]/page.tsx`](../src/app/ehis-care/(fullpage)/laboratorium/[id]/page.tsx) jadi thin server → client [LabOrderDetail](../src/components/lab/LabOrderDetail.tsx) (fetch `getLabOrder(id)` → map + overlay, mirror FarmasiOrderDetail). [LabOrderTabs](../src/components/lab/LabOrderTabs.tsx) kini terima `order`+`onRefresh` (state milik parent; `getLabOrderById` dibuang). Workflow panes (Penerimaan/Sampel/Hasil/Validasi) tetap pakai overlay sesi `updateLabWorkflow`.
- **Riwayat pasien DB** — [RiwayatPane](../src/components/lab/tabs/RiwayatPane.tsx) tarik lintas-order via `listLabWorklist({ noRM })` (bukan `deriveLabOrders`).
- **Hapus mock order** — [labShared](../src/components/lab/labShared.ts) dibersihkan: `LAB_ORDERS_BASE` (6 order seed) + `deriveLabOrders` + `getLabOrderById` + `mergeOrder` **dihapus**; diganti `mapDbLabOrder(dto)` + `applyWorkflowOverlay(order)`. `updateLabWorkflow` (overlay in-session, BUKAN mock data) dipertahankan. Header page.tsx tak lagi hitung stat dari mock (LabBoard sumber live). `KategoriLab` diperluas 7→10 (Feses/Imunologi/Toksikologi) + `KATEGORI_CFG` + `AddOnPane.VALIDITY_HOURS` selaras.
- **Verifikasi** — tsc bersih (app code); ESLint bersih untuk file baru/ubah (sisa 1 warning pre-existing `Date.now` di handler AddOnPane, bukan dari perubahan ini); worklist join query divalidasi (rolled-back) → DTO + pasien join benar.
- **Follow-up** — persist progres sampel/hasil/validasi (kini overlay client, hilang saat refresh) + billing ingest dari LabOrder.

---

## ✅ Selesai — Role "Analis/ATLM Laboratorium" (petugas bench lab) (2026-06-21)

Lab sebelumnya cuma punya `SpPK` (validator) — tak ada role petugas/analis, asimetris dgn Radiologi (Radiografer + SpRad). Ditambah role **`Analis`** ("Analis Laboratorium") sebagai padanan Radiografer di sisi lab.

- **Role baru** — key `Analis`, label "Analis Lab", grant `ancillary.lab.worklist:[read,update]` + `ancillary.lab.critical:[read,create]`. Validasi/sign-off TETAP eksklusif SpPK (`ancillary.lab.validate` tidak diberikan). unit_scoped=true (careUnit di-bypass via `isAncillaryActor` karena permission murni `ancillary.*`).
- **FE** — `UserRole` + `ROLE_CFG` (accent blue, [penggunaShared.ts](../src/components/master/pengguna/penggunaShared.ts)) · `ROLE_OPTIONS` wizard ([penggunaFormShared.tsx](../src/components/master/pengguna/penggunaFormShared.tsx)) · `ROLE_ORDER` + `ROLE_DEFAULT_GRANTS` Mapping Hub RBAC ([rbacShared.ts](../src/components/master/mapping/rbac/rbacShared.ts)). Snapshot generator [gen-rbac-seed.mjs](../prisma/scripts/gen-rbac-seed.mjs) diselaraskan (tak di-rerun → hindari clobber checksum).
- **DB** — migrasi drift-safe `20260621170000_rbac_analis_lab`: INSERT `auth.roles` (Analis) + grant `auth.role_permissions` (4 perm, idempoten). Total role 9→10. Verified role + 4 grants di DB.
- **Dampak** — akun ber-role Analis kini memenuhi gate worklist Lab (`/lab/orders` + `/lab/orders/:id/receive`) yang dibangun di Order Lab contracts; SpPK fokus validasi.

---

## ✅ Selesai — Order Lab contracts table + endpoints (persist order ke Laboratorium) (2026-06-21)

Setelah katalog Order Lab DB-driven, sekarang **order-nya tersimpan** — mirror penuh alur "order resep ke Farmasi", tabel + API layered per [API-RULES](../docs/API-RULES.md).

- **Contracts table** — `medicalrecord.LabOrder` (header) + `medicalrecord.LabOrderItem` (baris tes), mirror `ResepOrder`/`ResepItem`. Order append-only (soft-delete); `status`/`prioritas` mutable (workflow Lab Menunggu→Diterima→…→Selesai/Ditolak); lab tujuan = snapshot kode+nama Location Laboratorium; item snapshot katalog `master.LabTest` (labTestId soft-ref + kode/nama/kategori/TAT + **harga** Tarif Matrix). Migrasi drift-safe `20260621160000_init_medicalrecord_lab_order` (db execute → resolve → generate). Back-relation `Kunjungan.labOrder`.
- **API layered (pola API-RULES)** — schema [lab/labOrder.ts](../src/lib/schemas/lab/labOrder.ts) (Zod input + DTO mirror FE) → DAL [lab/labOrderDal.ts](../src/lib/dal/lab/labOrderDal.ts) (create/list/findByIdWithKunjungan/listForLab/transition/receive/cancel, guard `deletedAt`) → Service [lab/labOrderService.ts](../src/lib/services/lab/labOrderService.ts) (penulis dari actor, statusAwal RJ=Diterima · IGD/RI=Menunggu, guard atomik) → routes:
  - **Klinis** (gate `clinical.tindakan` + ABAC careUnit via params.id): `GET/POST /kunjungan/:id/lab` · `POST /kunjungan/:id/lab/:labId/cancel`.
  - **Worklist Lab** (gate `ancillary.lab.worklist`, lintas-kunjungan `scopeKunjungan:false`): `GET /lab/orders` (filter labKode/status/noRM) · `GET /lab/orders/:id` · `POST /lab/orders/:id/receive`.
  - FE client [api/lab/labOrder.ts](../src/lib/api/lab/labOrder.ts).
- **Producer wiring (sesuaikan)** — `OrderLabPatient.kunjunganId` ditambah; wrapper IGD/RI/RJ kirim `patient.id`. [OrderLabTab](../src/components/shared/medical-records/OrderLabTab.tsx) submit: kunjunganId UUID → `createLabOrder` (map item → snapshot, prioritas Cito→CITO) + toast + state submitting; pasien demo (non-UUID) tetap lokal.
- **Follow-up** — LabBoard worklist masih mock (endpoint `/lab/orders` siap dikonsumsi, mirror FarmasiBoard) · persist hasil/sampel/validasi (workflow lab) · billing ingest dari LabOrder.

---

## ✅ Selesai — Order Lab klinis (IGD/RI/RJ) DB-driven + Paket Cepat dari master (2026-06-21)

Tab **Order Lab** shared ([OrderLabTab](../src/components/shared/medical-records/OrderLabTab.tsx)) berhenti pakai mock katalog — kini menarik tes lab **ter-assign ke ruangan Laboratorium** dari master, lengkap harga, dengan Paket Cepat yang nyata.

- **Endpoint klinis baru** — `GET /api/v1/master/lab-test-tersedia` (gate **`clinical.tindakan:read`** = "Tindakan / Order" Dokter/Perawat, BUKAN master.katalog; `scopeKunjungan:false`). Layered: schema [labTestTersedia.ts](../src/lib/schemas/master/labTestTersedia.ts) → DAL `listAssignedLabTest` (join `LayananUnitLab` → `LabTest` aktif, **location_type=Laboratorium**, harga via relasi `tarif` match `penjaminKode`+`jenisRuangan`) → Service `listLabTestTersedia` (distinct per tes + `ruanganKodes[]`) → [route](../src/app/api/v1/master/lab-test-tersedia/route.ts) + browser client [labTestTersedia.ts](../src/lib/api/master/labTestTersedia.ts). Pola identik `tindakan-tersedia`.
- **(1) Panduan Order Lab dihapus** — box rule statis dibuang; ruang dipakai search + paket.
- **(2) Pencarian dari katalog ter-assign** — `LabSearch` prop-driven (catalog dari DB, loading state, dedup by catalog id), tampilkan kode + kategori + **harga** + TAT. Kategori diperluas ke 10 nilai master (tambah Feses/Imunologi/Toksikologi + ikon/warna). Empty/error state seperti TindakanTab.
- **(3) Paket Cepat dari master + harga** — `PAKET_DEFS` kurasi by **kode master** (DR/ELE/KOL/HDL/TG/UR/CR/UA/SGOT/…); di-resolve terhadap katalog saat render (anggota tak tersedia disembunyikan, paket kosong disembunyikan), tombol tampilkan **jumlah anggota + total harga** dari Tarif Matrix. Estimasi biaya live di header daftar order + footer (+ peringatan "belum bertarif"). Validasi DB: 38 tes ter-assign semua berharga, 10/10 paket resolve penuh.
- **Tarif context** — `tarifTierForUnit(unitPengirim)` (IGD→IGD · *inap*→RAWAT_INAP:Kelas_3 · ICU→ICU · fallback IGD); lab di-tagih flat lintas tier (penjamin UMUM) → harga standar tetap ter-resolve untuk semua unit.
- **File split (≤800 baris)** — file lama 1038 baris dipecah: [orderLab/orderLabShared.tsx](../src/components/shared/medical-records/orderLab/orderLabShared.tsx) (tipe+config+helper+PAKET_DEFS) · [orderLab/orderLabMock.ts](../src/components/shared/medical-records/orderLab/orderLabMock.ts) (riwayat/aktif display-only) · [orderLab/OrderLabHistory.tsx](../src/components/shared/medical-records/orderLab/OrderLabHistory.tsx) (RiwayatLabSection + HasilModal). Main tab ramping.

Follow-up: submit order lab belum persist (masih state lokal → DB order lab = Phase later, sejajar resep); endpoint klinis `rad-catalog-tersedia` untuk OrderRadTab (paralel).

---

## ✅ Selesai — Farmasi Klinis: Detail wiring + Telaah/Dispensing persist + CPPT Apoteker + Register N/P (2026-06-20 → 06-21)

Pematangan modul Farmasi klinis (`/ehis-care/farmasi`): halaman detail benar-benar DB-driven, telaah & dispensing tersimpan sebagai snapshot FHIR-ready, dokumen cetak nyata, worklist dirapikan, CPPT Apoteker terintegrasi, dan Register N/P di-reframe jadi laporan kepatuhan.

- **Detail page DB-only** — [FarmasiOrderDetail](../src/components/farmasi/FarmasiOrderDetail.tsx) fetch `getFarmasiResep(id)` → `mapDbResepOrder`; [FarmasiOrderTabs](../src/components/farmasi/FarmasiOrderTabs.tsx) persist per-aksi + `onOrderChange`. SessionProvider ditambah di layout fullpage farmasi.
- **Telaah persist (PMK 72/2016)** — `medicalrecord.ResepTelaah` (append-only, migrasi `20260620150000`) = QuestionnaireResponse-ready 3-aspek administratif/farmasetik/klinis (`answers` JSONB linkId→bool); `POST /farmasi/resep/:id/telaah` (gate `ancillary.farmasi.telaah`), transisi `Diterima→Ditelaah|Dikembalikan` atomik. [TelaahPane](../src/components/farmasi/tabs/layananFarmasi/TelaahPane.tsx) di-realign ke checklist PMK 72; BB + justifikasi formularium dihapus. Lihat [[project_telaah_resep_fhir]].
- **Dispensing & Serah persist** — `medicalrecord.ResepDispensing` (append-only, migrasi `20260620160000`, MedicationDispense-ready) + `POST /farmasi/resep/:id/dispensing` (gate `ancillary.farmasi.serah`), transisi `Ditelaah→Selesai`. [DispensingSerahPane](../src/components/farmasi/tabs/layananFarmasi/DispensingSerahPane.tsx): LOT/ED dihapus, Telaah Akhir oleh user login (`useSession`), nama penerima/catatan dihapus, edukasi "centang semua", double-witness narkotika dipertahankan.
- **Dokumen cetak nyata** — [DokumenPane](../src/components/farmasi/tabs/layananFarmasi/DokumenPane.tsx) tombol Cetak per dokumen (Resep via `ResepCetakModal`; Label & Etiket via [labelEtiketCetak](../src/components/farmasi/tabs/layananFarmasi/labelEtiketCetak.tsx)). **Kertas thermal**: pemilih ukuran 58/80mm/A4 + `@page` dinamis + layout 1-kolom stack + garis gunting; Kwitansi disabled.
- **Riwayat Resep (DB, lintas-kunjungan)** — filter `noRM` end-to-end (`FarmasiResepQuery`/`listForFarmasi`/`listFarmasiResep`); [RiwayatResepPane](../src/components/farmasi/tabs/layananFarmasi/RiwayatResepPane.tsx) menampilkan SEMUA resep pasien. Status `Dibatalkan` jadi kelas-satu (`FarmasiStatus`+`STATUS_CFG`) — kartu background soft-merah + badge "Order Dibatalkan" + tanpa tombol Detail (fix bug `coerceStatus` yang dulu kolaps ke `Menunggu`).
- **Penamaan depo** — `DEPO_LABEL` (asal order = nama unit IGD/Rawat Inap/Rawat Jalan, bukan "Depo IGD") di worklist/header/riwayat; field "Depo:" sebenarnya pakai `depoNama` nyata (Depo Farmasi) di Dispensing/Cetak. Plumb `depoNama` ke `FarmasiOrder`.
- **Worklist status dropdown** — `<select>` polos → [FarmasiBoard](../src/components/farmasi/FarmasiBoard.tsx) `StatusFilter` kustom (dot warna + jumlah per status + animasi + klik-luar/Esc).
- **CPPT Apoteker terintegrasi** — apoteker menulis ke thread CPPT pasien yang sama (`medicalrecord.Cppt`) via shared [CPPTTab](../src/components/shared/medical-records/CPPTTab.tsx) (`kunjunganId`+`defaultProfesi="Apoteker"`). RBAC: grant Apoteker `clinical.cppt:[read,create,delete]` (migrasi `20260621120000`, mirror Perawat — tanpa update). Cross-unit: `isAncillaryActor` di [careUnit.ts](../src/lib/auth/careUnit.ts) bypass careUnit ABAC untuk aktor penunjang (RBAC tetap menggate resource). Lihat [[project_rbac_penunjang_standalone]].
- **Rekonsiliasi Obat (tab Farmasi, shared)** — tab baru "Rekonsiliasi Obat" di [FarmasiOrderTabs](../src/components/farmasi/FarmasiOrderTabs.tsx) pakai shared [RekonsiliasTab](../src/components/shared/medical-records/RekonsiliasTab.tsx) (persist `medicalrecord.Rekonsiliasi` via `clinical.rekonsiliasi`). **Konteks dari unit asal order** (`rekonContextFor`: IGD→`igd`, lain→`ri`) — fase + label menyesuaikan lokasi yang meng-order. Apoteker = penanggung jawab (PMK 72/2016); efektif berkat grant `clinical.rekonsiliasi:[read,create]` + bypass careUnit `isAncillaryActor`. Katalog obat dari `obat-tersedia` (gate `clinical.resep:read`).
- **Register N/P read-only** — [RegisterNarPsiPane](../src/components/farmasi/narPsi/RegisterNarPsiPane.tsx) di-reframe jadi **lapisan kepatuhan/laporan**: katalog dari `master.Obat` (golongan N/P), saldo+mutasi dari ledger Inventory (`getInvItemDetail`). Modal Tambah Pengeluaran + Stok Opname dihapus (hentikan ledger tandingan); banner sumber data; accent purple→pink. Mock katalog/register/opname di [narPsiShared](../src/components/farmasi/narPsi/narPsiShared.ts) dibuang.

Follow-up → TECH_DEBT §Farmasi (dispensing→OUT Inventory + identitas Register N/P, laporan SIPNAP, CPPT Apoteker edit/flag gating, RI/RJ ResepPane wiring CPPT/TTE).

## ✅ Selesai — Resep Pasien: TTE + Doctor-gate + Cetak (preview/print) (2026-06-19)

Lanjutan slice Resep (IGD). 3 permintaan: (1) hanya dokter yang bisa order; (2) resep wajib TTE — mock always-success + barcode di resep; (3) cetak setelah TTE + preview interaktif, layout proper & modern.

- **Doctor-gate** — order di-gate `useSession().can("clinical.resep","create")` (hanya Dokter/Admin; Perawat/Apoteker read). Tombol → **"Tanda Tangani & Order Resep"**; non-dokter: tombol disable + catatan. Server tetap penjaga (RBAC `route()`).
- **TTE (mock always-success)** — kolom baru `medicalrecord.ResepOrder.{tteToken,tteSignedBy,tteSignedAt}` (migrasi `20260619140000_resep_tte`, drift-safe + generate). [resepService](../src/lib/services/resep/resepService.ts) **auto-tanda-tangani saat create** (serial `TTE-YYMMDD-xxxxxxxx` via clock+randomUUID; penanda tangan = penulis/DPJP). DTO/DAL bawa field TTE. Pasien demo (non-UUID) → TTE mock lokal.
- **Barcode + Cetak** — [TteBarcode](../src/components/shared/resep/TteBarcode.tsx) (SVG deterministik dari serial) · [ResepCetakTemplate](../src/components/shared/resep/ResepCetakTemplate.tsx) (A4 modern: header RS · pasien/DPJP · ℞ daftar obat · chip kondisi klinis · blok TTE barcode + pernyataan sah UU ITE) · [ResepCetakModal](../src/components/shared/resep/ResepCetakModal.tsx) (preview + `window.print()`, infra `.print-area`/`.no-print`). Layar sukses [ResepPasienTab](../src/components/igd/tabs/ResepPasienTab.tsx) → kartu TTE + barcode + "Preview & Cetak Resep". tsc bersih, eslint 0 error. Follow-up: TTE+cetak belum di RI/RJ ResepPane (komponen sudah shared).

## ✅ Selesai — Resep Pasien: Cari Obat → DB obat-tersedia (2026-06-19)

Bug: pencarian obat tak menampilkan obat dari DB. Akar: `ObatSearch` membaca `OBAT_CATALOG` mock (21 item hardcode), bukan DB (IGD bahkan punya `ObatSearch` lokal sendiri yang ikut hardcode).

- Mapper `obatTersediaToCatalog` (ObatTersediaDTO→ObatCatalog; kategori dari golongan, stok 0) di [resepShared](../src/components/shared/resep/resepShared.ts).
- IGD `ObatSearch` lokal + shared [ObatSearch](../src/components/shared/resep/ObatSearch.tsx) di-feed `catalog` dari `GET /master/obat-tersedia` (gate clinical.resep:read), `showStock` off saat pakai DB. Wired IGD [ResepPasienTab](../src/components/igd/tabs/ResepPasienTab.tsx) + shared [ResepPane](../src/components/shared/medical-records/resep/ResepPane.tsx). Fallback mock bila formularium kosong/unauth.
- Catatan: `obat-tersedia` hanya kembalikan obat **Aktif & ter-formularium** (Mapping Hub → Formularium) — by-design.

## ✅ Selesai — Master Pengguna: perbaikan Edit Akun (2026-06-19)

3 bug/penambahan saat edit pengguna:
- **Tambah role tidak tersimpan (flicker lalu hilang)** — jalur Edit hanya update state optimistic, tak panggil API. Fix: [PenggunaPage.handleSubmit](../src/components/master/pengguna/PenggunaPage.tsx) `await assignRoles(...)`; form [PenggunaEditForm](../src/components/master/pengguna/PenggunaEditForm.tsx) **await** sebelum tutup → `refreshUsers()` baca data baru (tanpa revert) + state `saving` + `toast.error`.
- **Endpoint update kredensial** — `PATCH /api/v1/auth/users/:id` (username + reset password, gate `master.pengguna:update`): `UpdateUserInput` (Zod) + `userDal.updateCredentials` + `userService.updateUser` (username unik citext, hash password) + client `updateUser`. Form Edit kini persist username/password (di-await sebelum assignRoles).
- **Kolom Unit kosong** — Unit terikat `unitAssignment` yang di-hardcode `[]`; `unitKerja` pegawai tak di-fetch. Fix: `unitKerja` ditambah ke `UserListItemDTO` + DAL select + service; `userDtoToRecord` map `unitKerja` (nama→kode via helper `unitKerjaToKodes`) → kolom Unit tampil unit kerja pegawai (sumber sementara sampai UserUnitScope dibangun).

## ✅ Selesai — Resep Pasien: Order BE + Worklist Farmasi (2026-06-19)

Backend slice tab Resep Pasien (#15 TODO-CLINICAL → BE 🟢 / Wiring 🟢). 4 permintaan user: (1) hapus panel **Panduan Aturan Resep**; (2) buat contracts berdasarkan FE; (3) dropdown depo = fetch lokasi kategori Farmasi; (4) endpoints layered (API-RULES) → order muncul di halaman Farmasi.

- **Panduan Aturan Resep dihapus** — panel amber di IGD [ResepPasienTab](../src/components/igd/tabs/ResepPasienTab.tsx) + shared [ResepPane](../src/components/shared/medical-records/resep/ResepPane.tsx) (state `showGuide` dibuang); konstanta `ATURAN_PANDUAN` dihapus dari [resepShared.ts](../src/components/shared/resep/resepShared.ts).
- **DB** — `medicalrecord.ResepOrder` (header: depo snapshot + kondisi klinis + penulis + status/prioritas) + `ResepItem` (baris obat), append-only, FK→encounter.kunjungan cascade. **Tabel SENDIRI, bukan domain Order generik** (Daftar/Lab/Rad masih `ORDERS_MOCK`). Migrasi `20260619120000_init_medicalrecord_resep_order` via skrip drift-safe [apply-resep-order.mjs](../prisma/scripts/apply-resep-order.mjs) + `migrate resolve --applied` + generate.
- **Contracts** — [lib/schemas/resep/resep.ts](../src/lib/schemas/resep/resep.ts): `ResepOrderInput`/`ResepItemInput` (Zod, mirror form) + `ResepOrderBody` (z.input untuk pemanggil) + DTO `ResepOrderDTO`/`ResepItemDTO`/`ResepOrderFarmasiDTO` + `FarmasiResepQuery`.
- **Layering** — [resepDal](../src/lib/dal/resep/resepDal.ts) (nested-create items, join kunjungan→pasien utk worklist) → [resepService](../src/lib/services/resep/resepService.ts) (penulis = input/override atau actor; map DTO; unit enum→FE) → routes [kunjungan/:id/resep](../src/app/api/v1/kunjungan/[id]/resep/route.ts) (GET/POST, gate `clinical.resep`) + [farmasi/resep](../src/app/api/v1/farmasi/resep/route.ts) worklist (GET, gate `ancillary.farmasi.telaah`, scopeKunjungan:false). Pola persis `tindakanMedis`.
- **Depo dropdown** — [master/lokasi-farmasi](../src/app/api/v1/master/lokasi-farmasi/route.ts) (gate `clinical.resep:read`, reuse `ruanganService.listRuanganByType("Farmasi")` aktif saja) + client [lokasiFarmasi.ts](../src/lib/api/master/lokasiFarmasi.ts). Kedua form fetch depo dari master (fallback `DEPO_OPTIONS`).
- **Submit + Worklist** — `submitOrder`/`handleSend` POST saat `kunjunganId` UUID (pasien demo non-UUID tetap lokal); tombol "Mengirim…". Order DB muncul di [FarmasiBoard](../src/components/farmasi/FarmasiBoard.tsx) via `listFarmasiResep()` + mapper `mapDbResepOrder` ([farmasiShared.ts](../src/components/farmasi/farmasiShared.ts)) digabung di depan order mock.
- Follow-up → TECH_DEBT (§Farmasi): status workflow Farmasi belum persist utk order DB (board read-only); `bzaKode` belum dibawa dari item IGD; keputusan lebur/pisah vs domain Order generik. tsc bersih (`src/`), eslint 0 error.

## ✅ Selesai — Resep Pasien FE Decision-Support (shared IGD+RI+RJ) (2026-06-18)

Revisi form Resep (FE only — domain Order BE belum dibangun, status #15 TODO-CLINICAL tetap BE/Wiring ⬜). Resep **belum benar-benar 1 komponen**: IGD pakai [ResepPasienTab](../src/components/igd/tabs/ResepPasienTab.tsx) sendiri, RI/RJ pakai shared [ResepPane](../src/components/shared/medical-records/resep/ResepPane.tsx)+[ResepItemRow](../src/components/shared/resep/ResepItemRow.tsx) → enhancement diterapkan ke **kedua** jalur, logika/konstanta dibagi di lapisan shared.

- **Dropdown global** — Depo Farmasi + Signa/Waktu/Rute (edit inline) + Rute (form) pindah dari `<select>` native ke komponen [Select](../src/components/shared/inputs/Select.tsx) (portal popover, keyboard nav).
- **Dosis sekali minum** — field baru di form + edit inline; tampil di daftar/riwayat (`…/minum`). Field opsional `dosisSekali?` ditambah ke `ResepRIItem` ([data.ts](../src/lib/data.ts)) + `ResepItem` IGD.
- **Peringatan alergi obat dari anamnesis** — helper baru di [resepShared.ts](../src/components/shared/resep/resepShared.ts): `getAlergiObat(noRM, riwayatAlergiText?)` baca `ALLERGY_MOCK` (kategori "Obat", dari asesmenShared) + teks bebas `riwayatAlergi` (skip "tidak ada/diketahui"); `matchAlergiObat(namaObat, allergens)` cocok dua-arah + **sadar-golongan** via `FAMILY_SYNONYMS` (Penisilin→Amoxicillin/Ampicillin, NSAID, Sulfa, Aspirin). UI: banner "Alergi Obat Tercatat" di form + warning merah saat obat terpilih/ditambah cocok + badge "⚠ Alergi" persisten per-baris.
- **3 dropdown kondisi klinis** — Fungsi Ginjal (LFG, selalu) + Status Kehamilan + Status Menyusui (khusus ♀ / gender tak diketahui), konstanta `GINJAL/MENYUSUI/KEHAMILAN_OPTIONS` + `KondisiKlinis` di resepShared, panel [KondisiKlinisPanel](../src/components/shared/resep/ResepKlinisPanel.tsx) (highlight + catatan keamanan saat berisiko).
- **No. kontak DPJP** di bawah nama penulis resep — default **"-"** bila tak ada (`ResepPatient.dpjpKontak?`; detail klinis belum bawa nomor DPJP → "-").
- `ResepPatient` +`gender?`/`dpjpKontak?`; RI/RJ record tabs teruskan `gender`. tsc bersih (`src/`), eslint 0 error (warning sisa pre-existing).

## ✅ Selesai — Keperawatan: Evaluasi Shift → contracts table sendiri (Domain 9 Fase C) (2026-06-14)

> Fitur **Tambah Evaluasi Shift** (Riwayat Asuhan Keperawatan, tab Keperawatan IGD): dari blok JSONB di `AsuhanKeperawatan` (di-append via PATCH) → **tabel anak `medicalrecord.AsuhanEvaluasi`** dengan endpoint sendiri. 4 permintaan user: (1) dropdown shift + DatePicker → komponen global; (2) perawat = user login; (3) bangun contracts table + endpoints (API-RULES); (4) wiring FE↔BE. Detail → [TODO-CLINICAL.md](../TODO-CLINICAL.md) Domain 9 Fase C.

1. **Kontrak** — [medicalrecord.prisma](../prisma/schema/medicalrecord.prisma) model **`AsuhanEvaluasi`** (FK `asuhan_id`→`AsuhanKeperawatan` cascade · shift/subjektif?/objektif/statusLuaran · `waktu` timestamptz · perawat+author · **append-only** tanpa updatedAt/soft-delete · index `(asuhan_id, waktu)`). Relasi `AsuhanKeperawatan.evaluasiShift[]` **gantikan kolom JSONB `evaluasi`**. Migrasi `20260614150000_init_medicalrecord_asuhan_evaluasi` (CREATE + FK + **DROP COLUMN evaluasi**).
2. **Lapisan** — [Zod](../src/lib/schemas/keperawatan/asuhanKeperawatan.ts) `EvaluasiInput` (waktu? ISO · shift? · subjektif? · objektif wajib · statusLuaran · perawat?); DTO `EvaluasiShiftDTO` derive tanggal/jam dari `waktu` (TZ Asia/Jakarta) — `evaluasi` dibuang dari Input/Update asuhan. [DAL](../src/lib/dal/keperawatan/asuhanKeperawatanDal.ts) `createEvaluasi`/`listEvaluasi` + `include evaluasiShift` (urut waktu). [Service](../src/lib/services/keperawatan/asuhanKeperawatanService.ts) `addEvaluasi` (perawat=actor · shift derive bila kosong · sinkron `statusLuaran` parent → DTO ter-refresh) + `listEvaluasi`.
3. **Endpoint** — `/kunjungan/:id/asuhan-keperawatan/:itemId/evaluasi` GET (list) + POST 201 — gate **`clinical.keperawatan`** (read/create) + ABAC careUnit (route choke-point via `ItemParam`). [route](../src/app/api/v1/kunjungan/[id]/asuhan-keperawatan/[itemId]/evaluasi/route.ts) + client `addEvaluasiShift`/`getEvaluasiShift`.
4. **FE** — [AsuhanCard](../src/components/shared/medical-records/keperawatan/AsuhanCard.tsx) `EvaluasiForm`: **Tanggal & Waktu = `DateTimePicker`** (ganti `<input date>`+`<input time>`) · **Shift = `Select`** global (ganti `<select>`) · **Perawat = chip read-only sesi login** (no free-text). Callback `onAddEval(EvalDraft{waktu,...})`. [KeperawatanTab IGD](../src/components/igd/tabs/KeperawatanTab.tsx) `handleAddEval` → `addEvaluasiShift` (persisted) / lokal (mock igd-1) + `petugasLogin={session.namaTampil}`. RI copy ([rawat-inap/tabs/KeperawatanTab](../src/components/rawat-inap/tabs/KeperawatanTab.tsx), pakai shared AsuhanCard) ikut disesuaikan ke `EvalDraft` (build EvaluasiShift display lokal — tetap mock).
5. **Verifikasi** — `tsc` bersih (sisa error seed-script `.ts`-ext expected) · `eslint` 0 error (warning `_actor` precedent) · `migrate deploy`+`generate` · DB smoke (kolom benar · JSONB `evaluasi` ter-drop · index timeline · insert + FK-bogus 23503). **Sisa:** wiring RI/RJ penuh (punya copy AsuhanForm/Card sendiri) · verifikasi in-browser (AUTH_ENFORCE).

---

## ✅ Selesai — Rekam Medis Keperawatan (Domain 9: AsuhanKeperawatan persist + template DB) (2026-06-14)

> Tab **Keperawatan IGD** (`ehis-care/igd/{}`): dari state lokal → **persist ke DB** + template asuhan dari **DB `master.sdki`** (bukan mock hardcoded). 5 permintaan user: (1) tanggal→DateTimePicker global + perawat→user login; (2) rename "Katalog SDKI Cepat"→"Katalog Keperawatan (Template)"; (3) fetch katalog keperawatan utk template (SSR jika perlu); (4) auto-fill form saat pilih katalog; (6) contracts endpoint API-RULES; (7) wiring FE↔BE. Detail → [TODO-CLINICAL.md](../TODO-CLINICAL.md) Domain 9.

1. **Kontrak** — [medicalrecord.prisma](../prisma/schema/medicalrecord.prisma) model `AsuhanKeperawatan` (CRUD + soft-delete; blok dataMayor/dataMinor/intervensi/evaluasi = **JSONB**; kriteriaHasil text[]; verify co-sign; kodeSdki soft-ref `master.sdki`; tanggalInput timestamptz; perawat+author) + backref `Kunjungan.asuhanKeperawatan`. Migrasi `20260614130000_init_medicalrecord_asuhan_keperawatan`.
2. **RBAC resource BARU `clinical.keperawatan`** — [rbacShared.ts](../src/components/master/mapping/rbac/rbacShared.ts) leaf + grant Admin/Dokter/**Perawat (penulis utama)** r/c/u/d + migrasi `20260614140000_rbac_clinical_keperawatan`. Dipisah agar Perawat punya CREATE penuh tanpa membuka `clinical.rekammedis` shared. DB smoke: 4 perm · 3 role ×4.
3. **Lapisan** (per-tab) — [Zod](../src/lib/schemas/keperawatan/asuhanKeperawatan.ts) (Input/Update OPTIONAL murni → partial PATCH rapi; normalisasi di Service) · [DAL](../src/lib/dal/keperawatan/asuhanKeperawatanDal.ts) · [Service](../src/lib/services/keperawatan/asuhanKeperawatanService.ts) (assertKunjungan/assertMilik · perawat=resolveActorNama · clean list/data/intervensi/evaluasi · verifiedAt saat verified→true) · Routes `/kunjungan/:id/asuhan-keperawatan` GET/POST + `/:itemId` PATCH/DELETE (gate `clinical.keperawatan`, ABAC careUnit) · [client](../src/lib/api/keperawatan/asuhanKeperawatan.ts).
4. **Template konsumen klinis** — `GET /master/sdki-template` (gate `clinical.keperawatan:read`, `scopeKunjungan:false`) → `sdkiService.listTemplate()` (diagnosa Aktif, bentuk `SdkiCatalogItem`). [route](../src/app/api/v1/master/sdki-template/route.ts) + [client](../src/lib/api/master/sdkiTemplate.ts). Pola identik tindakan-tersedia/obat-tersedia.
5. **FE wiring** — [KeperawatanTab IGD](../src/components/igd/tabs/KeperawatanTab.tsx): UUID-guard `isPersisted`; mount load asuhan DB + catalog; persist create/update/verify/evaluasi/delete via API (mock igd-1 → lokal demo). [AsuhanForm shared](../src/components/shared/medical-records/keperawatan/AsuhanForm.tsx) (IGD-only): rename panel · `catalog` prop (DB) fallback `SDKI_CATALOG` · **DateTimePicker** tanggal · **perawat chip sesi login** (di-inject saat simpan, tanpa setState-in-effect) · auto-fill via `applyTemplate`. [AsuhanCard](../src/components/shared/medical-records/keperawatan/AsuhanCard.tsx): `fmtTanggal`. **SSR tak diperlukan** (tab lazy nested → client-fetch, mirror Rekonsiliasi).
6. **Verifikasi** — `tsc` bersih (sisa error seed-script `.ts`-ext expected) · `eslint` 0 error (warning `_actor` precedent) · `migrate deploy`+`generate` · DB smoke (JSONB+text[] parse · default verified/aktif · FK 23503 · RBAC grants). **Sisa:** wiring RI/RJ (punya copy AsuhanForm/Card sendiri) · import penuh dataset PPNI · verifikasi in-browser (AUTH_ENFORCE).

## ✅ Selesai — Master Katalog Keperawatan (SDKI/SLKI/SIKI) Backend + rename + auto-kode + SSR (2026-06-14)

> Sub-master **SDKI / SIKI / SLKI** dari mock → backend-backed (SSR-hybrid). 4 permintaan user: (1) **rename** tab+url "SDKI / SIKI / SLKI" (`/ehis-master/sdki`) → **"Katalog Keperawatan"** (`/ehis-master/katalog-keperawatan`); (2) **form Kode dihapus** → auto-gen `D.NNNN` + **DiscardDialog**; (3) contracts endpoint (API-RULES) + seed mock → DB + hapus mock; (4) hybrid SSR. Detail backend → [docs/BACKEND-MASTER-KATALOG-KLINIS.md §C.3](../docs/BACKEND-MASTER-KATALOG-KLINIS.md).

1. **Kontrak** — [sdki.prisma](../prisma/schema/sdki.prisma) `master.Sdki` (**katalog leaf** soft-delete; enum kategori/jenis/status TEXT pass-through; blok `data_mayor`/`data_minor`/`intervensi` = **JSONB**; `kriteria_hasil` = `text[]`; **kode `D.NNNN` auto** via `master.SdkiCounter` scope="D") + unique partial index `kode WHERE deleted_at IS NULL`. Migrasi `20260614120000_init_master_sdki`.
2. **Lapisan** — [schema](../src/lib/schemas/master/sdki.ts) (`CreateSdkiInput`/`Update`/`SdkiQuery`/`SdkiDTO`; kode TIDAK di input) · [DAL](../src/lib/dal/master/sdkiDal.ts) (CRUD + keyset list + `nextSdkiSeq` counter) · [Service](../src/lib/services/master/sdkiService.ts) (`list` actor-less SSR · kode auto `D.NNNN` dalam `transaction` · JSONB⇄DTO defensif) · Routes `GET/POST /master/sdki` + `PATCH/DELETE /:id` (gate **`master.katalog`**) · [client](../src/lib/api/master/sdki.ts).
3. **Seed + hapus mock** — [sdkiSeed.ts](../src/lib/master/sdkiSeed.ts) (data pindah dari mock; 27 diagnosa, kode resmi PPNI apa adanya) + [seed-sdki.mts](../prisma/scripts/seed-sdki.mts) (counter[D]=148 → entri baru D.0149). `SDKI_MOCK` **dihapus** dari [sdkiMock.ts](../src/lib/master/sdkiMock.ts) (tipe+helper tetap; `isSdkiValid` di-relax — kode server-owned). Konsumen Beranda → `SDKI_COUNT` indikatif (presedan `OBAT_COUNT`).
4. **FE rewrite SSR-hybrid** — [katalog-keperawatan/page.tsx](../src/app/ehis-master/katalog-keperawatan/page.tsx) (server, `sdkiService.list`) → [SdkiPage](../src/components/master/sdki/SdkiPage.tsx) (client `initial`/`prefetched` + CUD `/api` + `guardDirty` + [DiscardDialog](../src/components/master/sdki/DiscardDialog.tsx)). [IdentitasTab](../src/components/master/sdki/tabs/IdentitasTab.tsx): field Kode → **display read-only "Auto"** (D.NNNN saat simpan). Nav + Beranda quick-nav di-rename. Route lama `app/ehis-master/sdki/` dihapus.
5. **Verifikasi** — `tsc` clean (hanya error seed-script `.ts`-ext expected) · `eslint` 0 error (3 warning `_actor` = ABAC-seam, sama obat/tindakan) · `migrate deploy`+`generate`+seed · DB smoke (27 rows · JSONB resolve D.0077 · `nextSdkiSeq`→149→D.0149 · unique 23505). **Follow-up:** konsumen klinis KeperawatanTab masih `SDKI_CATALOG` mock (migrasi DB = task terpisah, analog obat-tersedia) · import penuh dataset PPNI · verifikasi in-browser (AUTH_ENFORCE).

## ✅ Selesai — Mapping Hub Formularium Backend (grant Obat ⇄ Ruangan) (2026-06-13)

> Sub-pane **Formularium** ([formularium/](../src/components/master/mapping/formularium/)) dari mock → backend-backed (SSR-hybrid), **di-redesign** jadi grant N:N **Obat ⇄ Ruangan (Location)** persis Layanan Unit (matriks baris Obat × kolom Ruangan). **Universal lintas penjamin** — tab penjamin & dimensi kelas dihapus (keputusan user: "semua bisa digunakan mau BPJS atau Umum"). Status di [docs/BACKEND-MAPPING.md](../docs/BACKEND-MAPPING.md) §6. Lihat memori [[project_mapping_hub_backend]].

1. **Iterasi-1 (override-on-default, lalu di-superseded)** — sempat dibangun sbg edge `(obat × penjaminKode × kelas) → allowed/alasan` upsert-by-triple (migrasi `20260613160000_init_master_formularium`). Atas arahan user diganti ke model per-UNIT.
2. **Kontrak FormulariumObat (grant)** — [formularium.prisma](../prisma/schema/formularium.prisma) `master.FormulariumObat` (`obatId` FK Restrict + `locationId` FK Restrict; `@@unique(obatId, locationId)` → **grant idempoten**; HARD delete; back-relation `Obat.formularium` + `Location.formularium @relation("FormulariumLokasi")`). Migrasi `20260613170000_formularium_to_unit` (DROP tabel bentuk lama yg masih kosong → CREATE grant). `prisma generate`.
3. **Lapisan (mirror LayananUnit)** — [schema](../src/lib/schemas/master/formularium.ts) (`GrantFormulariumInput`/`FormulariumQuery`/`FormulariumEdgeDTO {id,obatId,locationId,ruanganKode}`) · [DAL](../src/lib/dal/master/formulariumDal.ts) (`create`/`findByPair`/keyset list/`findObat`+`findLocation` guard, include `location.kode`) · [Service](../src/lib/services/master/formulariumService.ts) (`list` actor-less · `grant` idempoten guard obat+location · `revoke` hard-delete) · Route `GET/POST /master/formularium` + `DELETE /:id` (gate **`master.mapping`**, DELETE pakai action `update` — resource hanya punya read/update) · [client](../src/lib/api/master/formularium.ts) (`listAllFormularium`/`grantFormularium`/`revokeFormularium`).
4. **FE rewrite SSR-hybrid** — [formulariumShared.ts](../src/components/master/mapping/formularium/formulariumShared.ts) **reuse** helper grant-map + kolom-unit dari `layananShared` (`LayananMap`/`setPresence`/`hasLayanan`/`unitsFromTree`/`UNIT_CATEGORY_CFG`) + edge-cache per-sesi **TERPISAH** (anti-clobber dgn Layanan Unit). [FormulariumMatrix](../src/components/master/mapping/formularium/FormulariumMatrix.tsx) = baris Obat per-kategori × kolom Ruangan, sel grant, tri-state kolom/grup (violet). [FormulariumPane](../src/components/master/mapping/formularium/FormulariumPane.tsx) **reuse `LayananUnitTreePanel`** (filter show/hide kolom), grant/revoke optimistik + reconcile-on-mount + bulk kolom/baris/grup. SSR: [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) `obatService.list`+`formulariumService.list` → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) (`initialObat`/`initialFormularium`+`initialTree`) → Pane.
5. **Verifikasi** — `tsc`/`eslint` clean (2 warning `_actor` = ABAC-seam, sama layananUnitService) · `migrate deploy` (2 migrasi) · DB smoke (ROLLBACK): grant + unique-block 23505 + FK obat/location 23503 ✓. **Sisa**: mobile drill-down view (Layanan Unit punya `LayananUnitMobileView`; Formularium tabel scroll horizontal di mobile) · verifikasi in-browser (AUTH_ENFORCE).

## ✅ Selesai — Rekam Medis Tindakan Medis (persist recording per-kunjungan) (2026-06-12)

> Domain klinis BARU `medicalrecord.TindakanMedis` — pencatatan tindakan yang DILAKUKAN per kunjungan (jumlah + biaya snapshot) → hilir Billing. Melengkapi tab Tindakan IGD: recording yang tadinya state lokal kini **persist ke DB** saat kunjunganId UUID (pola `isPersisted` DiagnosaTab). BEDA dari `DiagnosaProsedur` (koding ICD-9 utk klaim) — ini operasional + harga.

1. **Kontrak** — [medicalrecord.prisma](../prisma/schema/medicalrecord.prisma) model `TindakanMedis` (kunjunganId FK Cascade · `tindakanId?` ref master · snapshot kode/nama/kategori · jumlah · **harga/penjaminKode/jenisRuangan beku saat dicatat** · pelaksana + authorUserId/PegawaiId · soft-delete) + back-relation `Kunjungan.tindakanMedis`. Migrasi `20260612070000_init_medicalrecord_tindakan_medis` (FK cross-schema → encounter.kunjungan).
2. **Lapisan** (per-tab, [[feedback_lib_folder_per_feature]]) — [schema](../src/lib/schemas/tindakanMedis/tindakanMedis.ts) (`TindakanMedisInput`/`Update`/`ItemParam`/`DTO`) · [DAL](../src/lib/dal/tindakanMedis/tindakanMedisDal.ts) (list/findById/create/update/softDelete) · [Service](../src/lib/services/tindakanMedis/tindakanMedisService.ts) (assertKunjungan + assertMilik · pelaksana = input override ATAU `resolveActorNama`) · Routes `GET/POST /kunjungan/:id/tindakan` + `PATCH/DELETE /:itemId` · [client](../src/lib/api/tindakanMedis/tindakanMedis.ts).
3. **RBAC** — `clinical.tindakan` di-grant **full CRUD** ke Admin/Dokter/Perawat (sebelumnya Dokter [r,c,u] · Perawat [r,u]) — klinisi pelaksana boleh tambah/ubah-jumlah/hapus(soft) di encounter aktif. Migrasi `20260612080000_rbac_clinical_tindakan_grants` + snapshot [rbacShared.ts](../src/components/master/mapping/rbac/rbacShared.ts). ABAC careUnit tetap men-scope per-kunjungan (route() choke-point clinical.*).
4. **FE wiring** — [TindakanTab](../src/components/igd/tabs/TindakanTab.tsx): `isPersisted = UUID_RE.test(patient.id)` → mount load `getTindakanMedis`; add → `addTindakanMedis` (snapshot tindakanId/kategori master/harga + penjamin UMUM/IGD); changeJumlah → `updateTindakanMedis` optimistik; remove → `deleteTindakanMedis` optimistik + reconcile (`reload`); indikator "Menyimpan…". Pasien IGD mock (igd-1, bukan UUID) tetap lokal — zero regresi.
5. **Verifikasi** — `tsc`/`eslint` clean · `prisma generate` · `migrate deploy` (2 migrasi) · DB smoke: struktur + FK Cascade + FK-bogus 23503 + insert/update-jumlah/soft-delete/list-filter + RBAC 4 aksi Admin/Dokter/Perawat semua ✓.

## ✅ Selesai — Mapping Hub Tarif Matrix Backend + Jenis Ruangan (2026-06-12)

> Sub-pane **Tarif Matrix** ([tarif/](../src/components/master/mapping/tarif/)) dari mock → backend-backed (SSR-hybrid), dengan dimensi kolom **"Jenis Ruangan"** (tier tarif) menggantikan kelas flat. Status & rasional di [docs/BACKEND-MAPPING.md](../docs/BACKEND-MAPPING.md) §5. **Migrasi `20260612060000` belum `migrate deploy`** (DB lokal mati saat dibuat — perlu deploy saat DB up).

1. **Kontrak TarifTindakan** — [tarifTindakan.prisma](../prisma/schema/tarifTindakan.prisma) `master.TarifTindakan` (`tindakanId` FK Restrict + `penjaminKode` string + `jenisRuangan` tier-string + `harga` Int rupiah; `@@unique(tindakanId, penjaminKode, jenisRuangan)` → **upsert by triple**; leaf tanpa version) + [schema](../src/lib/schemas/master/tarifTindakan.ts) (`UpsertTarifInput`/`TarifQuery`/`TarifTindakanDTO`) + [DAL](../src/lib/dal/master/tarifTindakanDal.ts) (`upsert` by triple, keyset list) + [Service](../src/lib/services/master/tarifTindakanService.ts) (`list` actor-less · `upsert` guard tindakan · `remove`) + Route `GET/POST /master/tarif-tindakan` + `DELETE /:id` (gate **`master.tarif`**, action update utk upsert) + [client](../src/lib/api/master/tarifTindakan.ts) (`listAllTarif`/`upsertTarif`/`deleteTarif`). Migrasi `20260612060000_init_master_tarif_tindakan` (additive). `prisma generate` (model baru).
2. **Dimensi "Jenis Ruangan" (derive dari tree)** — [tarifShared.ts](../src/components/master/mapping/tarif/tarifShared.ts) ditulis ulang: `JenisRuanganTier` (key `locationType[:kelas]`, mis. `IGD`·`RAWAT_INAP:KELAS_3`·`RAWAT_INAP:VIP`·`ICU`·`OK`) + `tiersFromTree(tree)` (analog `unitsFromTree` Layanan Unit — distinct tier dari Location aktif, exclude Penunjang & inap tanpa kelas) + `TIER_META`/`TIER_GROUP_CFG`. **Tarif per kelas, BUKAN per ruangan fisik** (kamar 3A-1 & 3B-2 sama Kelas III → harga sama).
3. **KRIS-aware per penjamin** — `validTiersForPenjamin(tipe, derived)`: BPJS → tier inap berkelas collapse jadi 1 `RAWAT_INAP:KRIS` (Perpres 59/2024) + tier non-inap tetap; Umum/Asuransi/Jamkesda → VIP/Kelas tetap, tanpa KRIS. KRIS = tier sintetis (tree tak punya kelas KRIS).
4. **FE rewrite SSR-hybrid** — [TarifPane](../src/components/master/mapping/tarif/TarifPane.tsx): baris = Katalog Tindakan DB (`tindakanRecordsFromDTO`, persis Layanan Unit), kolom = `visibleTiers` per penjamin, sel = harga edge; edit inline → **upsert (>0) / delete (≤0) optimistik** + reconcile (`dirtyRef` guard, `listAllTarif` re-seed) + toast; Bulk Update % = loop upsert sel terisi. [TarifMatrix](../src/components/master/mapping/tarif/TarifMatrix.tsx) kolom dari `tiers` prop (bukan `KELAS_LIST`). SSR: [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) `tarifTindakanService.list` → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) `initialTarif` → Pane (`tindakan`/`tree`/`tarif`).
5. **Keputusan model** (konfirmasi user): derive tier dari tree · KRIS+klasik valid-per-penjamin · `penjaminKode` = kode string (master Penjamin backend menyusul Tier 3, belum FK). `tsc`/`eslint` clean. Lihat memori `project_tarif_jenis_ruangan`.
6. **Fix casing key tier** (2026-06-12) — key META inap `RAWAT_INAP:KELAS_3` → `RAWAT_INAP:Kelas_3` (sama persis enum `LocationKelas`); sebelumnya tier Kelas nyasar ke "Lainnya" (fallback) karena `RAWAT_INAP:${kelas}` tak cocok. Murni FE, key tersimpan DB sudah benar. Verifikasi live: 6 tier (IGD/Kelas 3/2/1/VIP/ICU) semua cocok.
7. **Flat-rate per tindakan** (2026-06-12) — tombol `=` per baris matriks ([TarifMatrix](../src/components/master/mapping/tarif/TarifMatrix.tsx) `FlatRateButton` popover) → `handleFlatRate(tindakanId, harga)` di Pane samakan 1 harga ke SEMUA tier sheet penjamin aktif (batched upsert optimistik + toast). Untuk tindakan ber-harga seragam lintas ruangan/kelas (pasang infus, EKG, akses IV).

## ✅ Selesai — Tindakan IGD Redesign + Konsumen Klinis `tindakan-tersedia` (2026-06-12)

> Tab **Tindakan IGD** ([TindakanTab](../src/components/igd/tabs/TindakanTab.tsx)) di-redesign mirip tab Diagnosa + jadi konsumen pertama Layanan Unit dari sisi klinis. Status backend Mapping Hub didokumentasikan di [docs/BACKEND-MAPPING.md](../docs/BACKEND-MAPPING.md).

1. **Endpoint klinis `tindakan-tersedia`** — `GET /api/v1/master/tindakan-tersedia` baca katalog tindakan **ter-assign** (join `LayananUnit → Tindakan`, distinct + `ruanganKodes[]`, opsional `?ruanganKode=`). Gate **`clinical.tindakan:read`** (Dokter/Perawat) — BUKAN `master.katalog`/`master.mapping` (perawat tak punya hak master); `scopeKunjungan:false` (katalog murni tanpa konteks kunjungan). **Read-only over tabel existing → ZERO migrasi.** Lapisan: [schema](../src/lib/schemas/master/tindakanTersedia.ts) · DAL [`listAssignedTindakan`](../src/lib/dal/master/layananUnitDal.ts) (filter `active`+`deletedAt null`) · Service [`listTindakanTersedia`](../src/lib/services/master/layananUnitService.ts) (agregasi distinct, actor-less) · [route](../src/app/api/v1/master/tindakan-tersedia/route.ts) · [client](../src/lib/api/master/tindakanTersedia.ts). **Lab & Rad tereksklusi** by-design (Lab = tabel paralel `LayananUnitLab`; Rad bukan entri LayananUnit → menu Order tersendiri).
2. **TindakanTab redesign (mirip Diagnosa)** — search-first (dropdown tergrup per kategori) → **kartu konfigurasi** (jumlah stepper + pelaksana **prefilled dari sesi login**) → daftar **tergrup** Diagnostik/Terapi/Prosedur (aksen sky/emerald/amber, animasi add/remove) + **sidebar Ringkasan** (jenis + total qty + bar komposisi + nota hilir Billing/Resume). State states: loading · error (tak login/tanpa hak) · **katalog kosong** (arahkan ke Mapping Hub → Layanan Unit) · belum ada tindakan. Palet indigo/sky/emerald/amber (tanpa ungu). `TINDAKAN_MOCK` lama tak lagi dipakai di tab ini. Item simpan `tindakanId` (forward-ready persist). **Recording = state lokal** (belum ada endpoint persist; detail IGD masih mock).
3. **Verifikasi identitas dari user login** — [IdentitasVerifikasiBanner](../src/components/shared/medical-records/IdentitasVerifikasiBanner.tsx) tambah prop opsional `defaultPerawat`: bila ada (dari sesi) → field perawat jadi **chip read-only** bertanda "Sesi Login" (verifikator = identitas login, tak bisa diketik manual); fallback input manual bila sesi null (RI tak terpengaruh). [IGDRecordTabs](../src/components/igd/IGDRecordTabs.tsx) `useSession()` → `defaultPerawat={session?.namaTampil}`.
4. **Sisa (forward-ready)** — scoping per-ruangan pasien (endpoint sudah terima `?ruanganKode=`; FE belum kirim karena ruangan pasien IGD masih mock) · persist recording tindakan ke rekam medis (domain `clinical.tindakan` per-kunjungan). `tsc`/`eslint` clean.

## ✅ Selesai — Katalog Lab → Layanan Unit Mapping + Matrix Bulk Select-All (2026-06-12)

> Katalog Laboratorium kini dapat dipetakan ke Ruangan di **Mapping Hub → Layanan Unit** sebagai grup baris **"Tindakan Laboratorium"** (matriks terpadu Tindakan+Lab). Backend = tabel **paralel** `master.LayananUnitLab` (bukan polymorphic — tetap berdiri-sendiri sampai federasi chargemaster CM2/CM5). Lihat memori `project_lab_catalog_model`.

1. **Backend LayananUnitLab (contracts paralel)** — model [layananUnit.prisma](../prisma/schema/layananUnit.prisma) `master.LayananUnitLab` (LabTest⇄Location, hard-delete join, `@@unique([labTestId, locationId])` → grant idempoten, FK `Restrict`, back-relation `LabTest.layananUnits` + `Location.layananLab`) mengikuti pola `LayananUnit` · [schema](../src/lib/schemas/master/layananUnitLab.ts) (`GrantLayananLabInput`/`LayananLabQuery`/`LayananUnitLabEdgeDTO`) · [DAL](../src/lib/dal/master/layananUnitLabDal.ts) (`findByPair` keyed `labTestId_locationId`, keyset cursor) · [Service](../src/lib/services/master/layananUnitLabService.ts) (`list` actor-less SSR · `grant` guard lab+location idempoten · `revoke` hard-delete) · Route `GET/POST /master/layanan-unit-lab` + `DELETE /:id` (RBAC `master.mapping`) · [client](../src/lib/api/master/layananUnitLab.ts) (`listAllLayananLab` cursor loop). Migrasi `20260612050000_init_master_layanan_unit_lab` (additive-manual + `migrate deploy`). DB smoke: tabel + 4 index + 2 FK OK; 38 tes lab aktif.
2. **FE unified row/edge model** — [layananShared.ts](../src/components/master/mapping/layanan/layananShared.ts) digeneralisasi: `LayananRow` (`kind` tindakan|lab) + `LayananEdge` (`rowId`+`kind`) → Matrix/MobileView jadi jenis-agnostik. `ROW_KATEGORI_CFG`/`ORDER` tambah `Laboratorium` (cyan); `rowsFromTindakan`/`rowsFromLab` (chip `${n} par` cyan)/`groupRowsByKategori`; `tindakanToEdge`/`labToEdge`/`mapFromEdges`. Counter di-rename `countUnitPerTindakan`→`countUnitPerRow`, `countTindakanPerUnit`→`countRowsPerUnit` (cascade ke Matrix/MobileView/TreePanel). Cache module-level digeneralisasi ke `LayananEdge`.
3. **Pane routing per-kind** — [LayananUnitPane](../src/components/master/mapping/layanan/LayananUnitPane.tsx) terima `lab`+`layananLab`; `allRows = rowsFromTindakan ∪ rowsFromLab`, `kindById`; `persistCell` rute grant/revoke per kind (`grantLayananLab`/`revokeLayananLab` vs tindakan); reconcile fetch `listAllLayanan` + `listAllLayananLab` paralel (fallback `listLabTest({status:"Aktif"})`). SSR hybrid: [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) tambah `labTestService.list` + `layananUnitLabService.list` (`Promise.allSettled`) → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) (`initialLab`/`initialLayananLab`) → Pane.
4. **Bulk select-all 3 level (tri-state)** — selaras pola `VisCheckbox` TreePanel, aksen teal: **(a) per kolom/Location** — checkbox tri-state di header kolom matriks (`handleToggleColumn`), state dari `activeRows` (baris lolos filter kategori). **(b) per baris** — klik judul baris (sudah ada). **(c) per grup kategori** — header tiap `KategoriBlock` jadi tombol tri-state (`handleToggleGroup`: semua baris grup × semua kolom tampak, batched 1 `applyChanges`), termasuk grup "Tindakan Laboratorium". Mobile drill-down ([LayananUnitMobileView](../src/components/master/mapping/layanan/LayananUnitMobileView.tsx)) dapat paritas tombol **"Semua"** per grup utk unit terpilih (`handleToggleGroup(rowIds, unitKode, granted)`). Semua batched → satu update optimistik + persist paralel + revert-sel-gagal. `tsc`/`eslint` clean.

## ✅ Selesai — Katalog Tindakan Backend + Mapping Hub Layanan Unit (2026-06-12)

> Master **[/ehis-master/katalog-tindakan](../src/app/ehis-master/katalog-tindakan/)** jadi backend-backed (layered + SSR hybrid), dan Mapping Hub **Layanan Unit** konsumsi data real. Spec: [docs/BACKEND-MASTER-KATALOG-KLINIS.md](../docs/BACKEND-MASTER-KATALOG-KLINIS.md) §A. Tech debt kode `unitDefault`↔Location → chargemaster CM2.

1. **Katalog Tindakan backend (contracts)** — [tindakan.prisma](../prisma/schema/tindakan.prisma) (`Tindakan` + enum `TindakanKategori`/`TingkatKompleksitas`, **katalog leaf tanpa version**, soft-delete) + [schemas/master/tindakan.ts](../src/lib/schemas/master/tindakan.ts) (Zod+DTO mirror `TindakanRecord`) + [tindakanDal.ts](../src/lib/dal/master/tindakanDal.ts) + [tindakanService.ts](../src/lib/services/master/tindakanService.ts) (`list` actor-less, status⇄active) + Route GET/POST/PATCH/DELETE (`master.katalog`) + [api/master/tindakan.ts](../src/lib/api/master/tindakan.ts). Mengikuti pola sibling **ICD**. Migrasi `20260612000000_add_master_tindakan` (additive-manual + `migrate deploy`).
2. **FE swap SSR hybrid** — [page.tsx](../src/app/ehis-master/katalog-tindakan/page.tsx) Server Component panggil `tindakanService.list` langsung → `initial`/`prefetched`; [KatalogTindakanPage](../src/components/master/katalog-tindakan/KatalogTindakanPage.tsx) seed `useMasterCrud` + CUD via client (`commit`/`removeLocal`) + toast + DiscardDialog + fallback client fetch. `TINDAKAN_MOCK` dikosongkan.
3. **Form Katalog Tindakan (UI)** — toggle **Status KPTL** (`ToggleSwitch` + `SectionGroup` reveal) buka Nomor KPTL + Tingkat Kompleksitas (kini **opsional**, default null) · **dropdown Kategori kustom** (dot warna + popover beranimasi, klik-luar/Escape) · **DiscardDialog** (pola master/icd) ganti `window.confirm` saat batal/pindah dirty.
4. **Kode ICD-9 opsional** — form edit `required`→`hint="Opsional"`; `isTindakanValid` hanya cek nama; kontrak sudah `.optional()` + Prisma `@default("")`.
5. **5 kategori tambahan** — `Non Kategori`·`Prosedur Bedah`·`Prosedur Non Bedah`·`Keperawatan`·`Tindakan Invasif` lintas-lapis (prisma enum + migrasi `20260612010000` `ADD VALUE IF NOT EXISTS` + union FE + `KATEGORI_CFG`/`KATEGORI_ORDER` + Zod + DAL + IGD `IGD_KATEGORI_MAP`).
6. **Mapping Hub → Layanan Unit konsumsi real** — baris = tindakan DB; **kolom = Location (Ruangan) aktif** dari master Unit & Ruangan (`unitsFromTree`, selaras SDM `ruanganFromTree`). SSR hybrid: [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) fetch tindakan+tree (`Promise.allSettled`) → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) → [LayananUnitPane](../src/components/master/mapping/layanan/LayananUnitPane.tsx) (fallback `getTree`+`listTindakan`). Seed default di-scope ke kode unit valid (stat akurat). `LayananUnitMatrix` kolom dari prop. Helper baru [layananShared.ts](../src/components/master/mapping/layanan/layananShared.ts): `unitsFromTree`/`tindakanRecordsFromDTO`.
7. **Layanan Unit — tree filter kolom + persist FULL** — (a) **Panel tree filter** [LayananUnitTreePanel](../src/components/master/mapping/layanan/LayananUnitTreePanel.tsx) (Unit→Ruangan collapsible, checkbox tri-state per unit, fokus 1-klik, chip jenis Klinis/Poli/Penunjang, Semua/Kosong) → mempersempit kolom saat Location banyak; toggle baris hanya menyangkut kolom tampak. (b) **Persist backend** — model join [layananUnit.prisma](../prisma/schema/layananUnit.prisma) `master.LayananUnit` (Tindakan⇄Location, hard-delete, unik, NO version, pola `PenugasanRuangan`) + [schema](../src/lib/schemas/master/layananUnit.ts)/[DAL](../src/lib/dal/master/layananUnitDal.ts)/[Service](../src/lib/services/master/layananUnitService.ts) (`list` actor-less · `grant` idempoten · `revoke`) + Route `GET/POST /master/layanan-unit` + `DELETE /:id` (RBAC `master.mapping`) + [client](../src/lib/api/master/layananUnit.ts) (`listAllLayanan` loop). Migrasi `20260612030000_init_master_layanan_unit`. (c) **Matriks ter-wire** — kolom bawa `id` Location → `kodeToId`; toggle sel/baris/kolom = `applyChanges` optimistik → grant/revoke paralel → **revert sel gagal** + toast; index `${tindakanId}|${ruanganKode}→edgeId` ([layananShared.ts](../src/components/master/mapping/layanan/layananShared.ts) `mapFromEdges`/`edgeKey`/`setPresence`); seed `LayananMap` dari edge SSR (`layananUnitService.list` di [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx)); indikator **auto-save**; "Reset Default" (jalur `unitDefault` usang) dibuang. DB smoke: insert+unique-block+FK OK.

## ✅ Selesai — RBAC Prosedur ICD-9 + Record Bus Reaktivitas (2026-06-11/12)

1. **Split prosedur ICD-9** — resource `clinical.prosedur` (read/create/delete) terpisah dari `clinical.diagnosa` (ICD-10) → **Perawat boleh input ICD-9** tanpa hak tulis ICD-10. Endpoint `diagnosa/prosedur/*` re-gate + grant Perawat (`clinical.diagnosa:read` + `clinical.prosedur:*`). Migrasi `20260611250000_rbac_split_prosedur_icd9`. Lihat memori `project_rbac_rekammedis_and_receive`.
2. **Record Bus** [lib/realtime/recordBus.ts](../src/lib/realtime/recordBus.ts) — sinkron header↔tab tanpa refresh (`useSyncExternalStore`, key kunjungan+domain). TTVTab simpan → emit `observation` → PatientHeader re-fetch vitals. Calon sink SSE lintas-user.

## ✅ Selesai — Master Pengguna & Pegawai Backend + Wiring (2026-06-05)

> Tabel **[/ehis-master/pengguna](../src/app/ehis-master/pengguna/)** tersambung penuh ke DB (akun real + pegawai). Layered **Route→Service→DAL→Prisma**, multi-schema `master` + `auth`. Provisioning akun saja — **login/JWT belum** (`getActor()` = DEV actor). Tech debt: [TECH_DEBT.md](../TECH_DEBT.md#pengguna--pegawai-backend-wired-2026-06-05).

1. **Kontrak Pegawai disamakan dgn form** — enum `StatusPegawai` → `ASN/Outsourcing/Honorer/Magang/Mitra` (migrasi data-preserving remap PNS|PPPK→ASN, Kontrak→Outsourcing) + kolom `agama`, `profesi` (sumber kebenaran Dokter/Perawat/…), + DTO `punyaAkun` (relasi balik `auth.User`). `isDokter` diturunkan dari profesi∈{Dokter,Dokter Gigi,Dokter Spesialis} ∨ practitionerId. Migration `20260604140000_pegawai_align_status_agama_profesi`.
2. **API Pegawai (CRUD wired)** — [pegawai.ts](../src/lib/api/pegawai.ts): `createPegawai` (form→CreateInput mapper, buang field kosong) · `listPegawai` · `getPegawai` (detail) · `updatePegawai` (PATCH + `expectedVersion`). Endpoint `GET/POST/PATCH/DELETE` di route pegawai.
3. **Auth provisioning** — schema `auth.*` diimplementasi: hash [password.ts](../src/lib/crypto/password.ts) (scrypt, swappable argon2id) · Zod [user.ts](../src/lib/schemas/user.ts) · DAL [userDal.ts](../src/lib/dal/userDal.ts) (username citext-unik, 1 akun/pegawai, resolve key→Role, list) · Service [userService.ts](../src/lib/services/userService.ts) (zero-orphan, createUser, assignRoles transaksional, listUsers) · Route `GET/POST /auth/users` + `PATCH /auth/users/:id/roles` · seed 9 Role (migration `20260604150000_seed_auth_roles`).
4. **Wizard "Tambah Pengguna" 3-step WIRED** — Step 1 `POST /master/pegawai` · Step 2 `POST /auth/users` (hash password) · Step 3 `PATCH …/roles` (assign peran+status; map status FE Aktif/Suspended/Non_Aktif → server Active/Suspended/Locked). Tiap step toast sukses; error CONFLICT/VALIDATION di banner.
5. **Tabel real + baris kuning** — akun real dari `GET /auth/users` (mock `PENGGUNA_MOCK` dihapus) digabung pegawai `punyaAkun:false` sebagai **baris kuning soft** ("Belum punya akun") + stat "Belum Berakun". Menu ⋮ baris kuning: **"Buatkan Akun"** (wizard mode provisioning, mulai Step 2 dgn pegawaiId existing, Step 1 di-skip) + **"Ubah Data Pegawai"**.
6. **Ubah Data Pegawai** — [PegawaiEditModal](../src/components/master/pengguna/PegawaiEditModal.tsx): `GET` detail (prefill) → PATCH `expectedVersion` (NIK locked/masked, version guard → CONFLICT_VERSION). Ada juga di menu baris akun.
7. **Menu aksi via portal** — `RowActionsMenu` (createPortal + `usePopover` fixed-position) → dropdown lepas dari `overflow` tabel (fix menu terpotong/merusak layout). Hapus plumbing `openMenuId` lama.
8. **Unit test** — [pegawaiService.test.ts](../src/lib/services/pegawaiService.test.ts) 19 + [userService.test.ts](../src/lib/services/userService.test.ts) 8 = **27 pass**. **Smoke test live** semua endpoint (create→assign→list→GET detail→PATCH update+isDokter derive→CONFLICT/CONFLICT_VERSION/VALIDATION).

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
