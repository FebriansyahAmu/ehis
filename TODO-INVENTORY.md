# EHIS Inventory — Module Roadmap & Workflow

> **Modul BARU** `/ehis-inventory` — logistik & gudang farmasi/alkes RS. Dokumen ini = **workflow
> pengerjaan + roadmap** modul. Dibangun **mock-first → swap ke backend** (pola seluruh modul EHIS).
>
> **Status:** 🚧 **FE SELESAI (mock-first, 2026-06-19)** — modul `/ehis-inventory` aktif: Beranda + 6 menu
> (Daftar Barang · Stok Opname · Pengiriman · Rekanan · Monitoring · Distribusi), accent **cyan** (no purple),
> SaaS interaktif (drawer/KPI/filter). Distribusi Obat di Mapping Hub dihapus.
> **Backend ✅ (2026-06-19)** — **BE0–BE7 SELESAI**: schema `inventory` (ledger+proyeksi) + RBAC + 7 menu
> ter-swap ke DB layered (ledger movement = source of truth, reservasi `qtyReserved`, FEFO). Detail per
> slice di **[TODO-INVENTORY-BACKEND.md](TODO-INVENTORY-BACKEND.md)** (Fase BE0–BE8).
> **Urutan kerja (diminta):** (1) **dokumen ini** ✅ → (2) **Frontend** ✅ → (3) **Backend** ✅ ([roadmap](TODO-INVENTORY-BACKEND.md)).
>
> Referensi pola modul: [TODO-BILLING.md](TODO-BILLING.md) · [TODO-EKLAIM.md](TODO-EKLAIM.md) · registrasi modul di
> [src/lib/navigation.ts](src/lib/navigation.ts) · RBAC tree [prisma/scripts/gen-rbac-seed.mjs](prisma/scripts/gen-rbac-seed.mjs) ·
> backend layering [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md) + [docs/API-RULES.md](docs/API-RULES.md).

---

## 0. Tujuan & keputusan arsitektur

**Inventory = layer LOGISTIK OPERASIONAL di atas katalog master** — bukan katalog, bukan mapping.

| Layer | Apa | Di mana |
|---|---|---|
| **Master katalog** (definisi barang) | Obat & BMHP — identitas/harga/regulasi | `master.obat` · `master.bmhp` ✅ (sudah ada) |
| **Mapping ketersediaan** (boleh-ada-di-unit) | Obat ⇄ Location · BMHP ⇄ Location (Ketersediaan Farmasi) | `master.FormulariumObat` ✅ · `master.FormulariumBmhp` ✅ (2026-06-19) |
| **Inventory** (stok nyata + pergerakan) | saldo stok per-lokasi · batch/ED · mutasi · opname · penerimaan · distribusi · rekanan | **`inventory.*` (modul BARU ini)** |

**Keputusan kunci (lanjutan keputusan sesi BMHP — "master katalog tetap terpisah, stok disatukan di layer atas"):**

1. **Satu layer stok lintas-katalog.** Inventory memperlakukan Obat **dan** BMHP sebagai "barang" seragam. Item inventory me-*refer* ke katalog (`obatId` XOR `bmhpId`), **bukan** menggandakan definisi. Gudang tak peduli obat vs alkes — yang dia urus: qty, batch, ED, lokasi, pergerakan.
2. **Movement-ledger = source of truth.** Semua perubahan stok = baris append-only di `StockMovement` (IN/OUT/TRANSFER/ADJUST/OPNAME). **Saldo = proyeksi** dari ledger (bukan angka yang di-edit langsung) → audit-able, anti-drift, rekonsiliasi mudah.
3. **"Daftar Barang" bersumber dari katalog + ter-assign location.** Saat menambah barang ke inventory sebuah lokasi, picker hanya menampilkan item katalog yang **ter-formularium** ke lokasi itu (Obat via `FormulariumObat` ✅; BMHP via `FormulariumBmhp` ✅ 2026-06-19 — backend siap; **FE picker BMHP belum baca filter ini** → sementara masih tampil seluruh katalog BMHP aktif).
4. **Modul mandiri, bukan sub-Master.** Punya route group `/ehis-inventory`, `ModuleKey "inventory"`, RBAC `inventory.*`, persona **Logistik/Gudang** — sejajar Billing/E-Klaim.

---

## 1. Pindah dari "Distribusi Obat" (Mapping Hub) → hapus

Sub-tab **Distribusi Obat** di `/ehis-master/mapping` saat ini = matriks toggle "obat di-stock di depo mana" + angka stok **mock** ([distribusiShared.ts](src/components/master/mapping/distribusi/distribusiShared.ts) `initDistribusiMap`). Itu **mapping config**, bukan stok operasional — perannya **digantikan** oleh modul Inventory (Daftar Barang per-lokasi + Distribusi).

**Aksi (Phase INV0):**
- Hapus `SUBPAGE_REGISTRY` entri `"distribusi"` + tipe `SubpageKey` di [mappingShared.ts](src/components/master/mapping/mappingShared.ts).
- Hapus folder [src/components/master/mapping/distribusi/](src/components/master/mapping/distribusi/) (`DistribusiPane` · `DistribusiMatrix` · `distribusiShared`).
- Bersihkan referensi di [MappingHubPage.tsx](src/components/master/mapping/MappingHubPage.tsx) (switch/render pane) + import `PackageSearch` bila jadi yatim.
- `depoMock.ts` → cek konsumen lain sebelum hapus (mungkin dipakai farmasi); kalau hanya distribusi mapping → boleh dibuang, konsep depo pindah ke Location kategori Farmasi (sudah dipakai endpoint `lokasi-farmasi`).
- Verifikasi `tsc` + eslint bersih setelah pencabutan.

> **Catatan:** "ter-assign ke location" yang tetap relevan = **Formularium** (Mapping Hub). Itu **tidak** dihapus — justru jadi sumber picker "Daftar Barang" Inventory.

---

## 2. Registrasi modul (mengikuti pola MODULES)

| Titik | Perubahan | File |
|---|---|---|
| **Route group** | buat `src/app/ehis-inventory/` + `layout.tsx` (`await requireModule("inventory")` → `<ModuleLayout moduleKey="inventory">`) + halaman per sub-menu | `src/app/ehis-inventory/**` |
| **ModuleKey** | tambah `"inventory"` ke `ModuleKey` union | [navigation.ts](src/lib/navigation.ts) |
| **ModuleDescriptor** | entri `MODULES` (label "EHIS Inventory", desc "Logistik & gudang", href `/ehis-inventory`, icon `Warehouse`/`PackageSearch`, accent **cyan**, perms `["inventory.view"]`) — ModuleSwitcher auto-pickup | [navigation.ts](src/lib/navigation.ts) `MODULES` |
| **Sub-nav** | `inventoryNav: NavGroup[]` (Beranda + 6 menu, tiap item ber-`perm`) + daftarkan di `NAV_MAP` | [navigation.ts](src/lib/navigation.ts) |
| **RBAC** | tambah grup `inventory` ke `PERMISSION_TREE` + grants role; generate migration seed | [gen-rbac-seed.mjs](prisma/scripts/gen-rbac-seed.mjs) + migration baru |
| **requireModule** | otomatis bekerja via `getModule("inventory")` | [requireModule.ts](src/lib/auth/requireModule.ts) |

### RBAC `inventory.*` (usulan)
```
inventory.view        read                     // gate MODUL (pola master.view) — TERPISAH dari data
inventory.barang      read create update delete// item & saldo stok
inventory.opname      read create update       // sesi stok opname + posting selisih
inventory.pengiriman  read create update       // penerimaan (GRN) + transfer antar-lokasi
inventory.distribusi  read create update       // permintaan (amprahan) + pengeluaran ke unit
inventory.rekanan     read create update delete// master vendor/PBF
inventory.monitoring  read export              // dashboard alert/laporan stok
```
**Role default:** `Admin` full · **role baru `Logistik`** (staf gudang) full kecuali rekanan-delete · `Apoteker` (`inventory.view:read` + `barang/opname/distribusi:read` untuk depo farmasi). Role baru → tambah ke seed `roles` + `ROLE_DEFAULT_GRANTS`. (Konfirmasi: buat role `Logistik` atau cukup grant ke Apoteker/Admin? → §10.)

---

## 3. Sub-menu (Beranda + 6 menu yang diminta)

| # | Menu | Isi | Gate |
|---|---|---|---|
| 0 | **Beranda** | KPI strip (total SKU · nilai stok · item kritis/habis · ED ≤90 hari) · quick-nav · ringkasan pergerakan + alert | `inventory.view` |
| 1 | **Daftar Barang** | tabel item stok lintas-lokasi; **tambah barang via picker katalog** (Obat+BMHP, hanya ter-assign lokasi); filter katalog/lokasi/status; kartu detail item = saldo + min/max/reorder + daftar batch/ED (FEFO) + riwayat mutasi | `inventory.barang` |
| 2 | **Stok Opname** | sesi opname per-lokasi (Draft→Hitung→Review→Posted); qty sistem vs fisik → **selisih** + alasan → posting jadi `ADJUST` movement; cetak berita acara | `inventory.opname` |
| 3 | **Pengiriman** | **Penerimaan** (GRN dari vendor: PO/surat jalan, qty, batch, ED, harga → `IN`) + **Transfer** antar-lokasi (gudang→depo: `TRANSFER` out/in) | `inventory.pengiriman` |
| 4 | **Rekanan** | master vendor/distributor (PBF): identitas, kontak, izin PBF, item yang dipasok, lead time, status | `inventory.rekanan` |
| 5 | **Monitoring** | board alert: kritis/habis (reorder) · **FEFO/expiry** (akan ED) · slow/fast moving · nilai stok per-lokasi · tren konsumsi; export | `inventory.monitoring` |
| 6 | **Distribusi** | **permintaan/amprahan** unit → **pengeluaran** dari gudang/depo (`OUT`/`TRANSFER`); pengganti operasional sub-tab Mapping lama; lacak konsumsi per-unit | `inventory.distribusi` |

> Catatan: **dispensing Farmasi** (serah obat ke pasien) idealnya memicu `OUT` movement otomatis — integrasi Phase later (§9). MVP: pergerakan manual via Distribusi/Pengiriman.

---

## 4. Data model (backend — Phase later)

> Schema Postgres baru **`inventory`** (tambah ke `datasource.schemas` di [config.prisma](prisma/schema/config.prisma)).
> Konvensi FLOWS §9: uuid v7 · timestamptz · soft-delete (master) / append-only (ledger). Drift-safe migration (memori *migration-drift-pattern*).

```
InventoryItem        // 1 SKU stockable = referensi ke katalog (polymorphic-by-nullable-FK)
  id · obatId? · bmhpId?  (tepat satu terisi — CHECK xor) · jenis(Obat|BMHP) · satuanDasar · aktif
  @@unique([obatId]) / @@unique([bmhpId])   // 1 item per produk katalog

StockBalance         // saldo per item × lokasi (PROYEKSI dari ledger; di-recompute, bukan di-edit)
  itemId · locationId · qty · min · max · reorderPoint
  @@unique([itemId, locationId])

StockBatch           // lot/batch per item × lokasi (FEFO)
  id · itemId · locationId · batchNo · expiryDate · qty · hargaBeli?

StockMovement        // LEDGER append-only — SUMBER KEBENARAN stok
  id · itemId · jenis(IN|OUT|TRANSFER|ADJUST|OPNAME) · fromLocationId? · toLocationId?
  · qty · batchNo? · expiryDate? · refType? · refId? · alasan? · actorUserId · createdAt

OpnameSession        // sesi stok opname
  id · locationId · status(Draft|Counting|Review|Posted) · periode · catatan · postedAt? · actor
OpnameLine
  id · sessionId · itemId · batchNo? · qtySistem · qtyFisik · selisih(generated) · alasan?

GoodsReceipt (Pengiriman-masuk)  + GoodsReceiptLine   // penerimaan dari vendor (GRN)
  header: vendorId · noSuratJalan · noPO? · tanggal · toLocationId · status
  line: itemId · batchNo · expiryDate · qty · hargaBeli

StockTransfer (Pengiriman-internal) + line            // mutasi antar-lokasi
DistributionRequest (Distribusi) + line               // amprahan unit → pengeluaran

Vendor               // Rekanan
  id · kode · nama · jenis(PBF|Distributor|Manufaktur) · izinPbf · kontak · alamat · leadTimeHari · status

// Counter kode (pola master.ObatCounter): InventoryCounter per dokumen (GRN-, TRF-, OPN-, DST-, VND-)
```

**Aturan:** saldo & batch **tak pernah di-UPDATE langsung dari UI** — selalu lewat movement (transaksi: tulis `StockMovement` → recompute `StockBalance`/`StockBatch` dalam 1 `transaction`). Ini menjaga audit + memungkinkan rebuild saldo dari ledger.

---

## 5. Design direction — SaaS interaktif, **TANPA ungu**

> Permintaan user + memori [feedback](../memory): **hindari violet / indigo / ungu / fuchsia.**

- **Accent modul = `cyan`** (logistik/segar; distinct dari care=rose, registrasi=sky, billing=amber, eklaim=teal, bpjs/report=emerald, master=violet ❌, dashboard=indigo ❌). Permukaan netral **slate/zinc**.
- **Palet status stok** (semantik, konsisten lintas menu):
  `Aman` emerald · `Rendah` amber · `Kritis` orange · `Habis` rose · `Masuk/IN` sky · `Transfer` cyan · `Opname/Adjust` slate.
- **Rasa SaaS interaktif:** KPI cards + sparkline · tabel padat dengan sticky header + filter chips · drawer/side-panel untuk detail item (bukan full-page) · command-style search di Daftar Barang · skeleton 500ms (`useSkeletonDelay`) · animasi masuk halus (framer-motion, hormati `prefers-reduced-motion`) · toast (`@/lib/ui/toastStore`) · empty states bergambar.
- **Reuse density tokens** `m-*` + komponen shared bila pas; tapi modul ini **bukan** Master Template Layer → boleh komponen sendiri di `src/components/inventory/`.
- **A11y:** semantic, keyboard-nav, fokus terlihat, jangan andalkan warna saja (status pakai label+dot).

---

## 6. Frontend plan (mock-first — dikerjakan DULU)

Struktur (mirror `billing`/`eklaim`):
```
src/app/ehis-inventory/
  layout.tsx                      // requireModule("inventory") + ModuleLayout
  page.tsx                        // Beranda
  barang/page.tsx · opname/page.tsx · pengiriman/page.tsx
  rekanan/page.tsx · monitoring/page.tsx · distribusi/page.tsx
src/components/inventory/
  InventoryBeranda.tsx · DaftarBarang/ · Opname/ · Pengiriman/ · Rekanan/ · Monitoring/ · Distribusi/
  inventoryShared.ts              // tipe + status cfg + helper
src/lib/inventory/
  inventoryMock.ts                // ITEM/BALANCE/MOVEMENT/VENDOR mock (schema 1:1 target Prisma)
```
- **Mock-first → swap:** semua data dari `inventoryMock.ts` dulu; saat backend siap = ganti import ke `@/lib/api/inventory/*` (zero refactor UI, pola katalog).
- Picker "Daftar Barang" konsumsi katalog: `fetchAllObat` + `fetchAllBmhp` (sudah ada) → filter ter-formularium (mock: tandai sebagian).
- Komitmen: tak ada file > 800 baris → pecah per sub-komponen.

---

## 7. Backend plan (Phase later)

Per sub-domain, layering **Route → Service → DAL → Prisma** (API-RULES):
- Schema `inventory` + model §4 → `prisma/schema/inventory.prisma`; migration drift-safe (`apply-*.mjs` → `migrate resolve --applied` → `generate`).
- Service movement = transaksi atomik (tulis ledger + recompute saldo/batch). `list` actor-less (SSR-hybrid).
- Endpoint per menu: `/api/v1/inventory/{items,balances,movements,opname,receipts,transfers,distribusi,vendors}` (gate `inventory.*`).
- Seed awal: vendor + beberapa item + saldo dari katalog ter-seed.

---

## 8. Phasing & checklist

### FE (mock-first) — ✅ SELESAI 2026-06-19
- [x] **INV0 — Cabut Distribusi Mapping** (§1): `SubpageKey`/registry + folder `distribusi/` + `depoMock.ts` dihapus; `MappingHubPage`/`MappingSourceBadge` dibersihkan. `tsc` + eslint bersih.
- [x] **INV1 — Registrasi modul** (§2): `ModuleKey "inventory"` + `MODULES` (accent **cyan**, ikon Warehouse) + `inventoryNav` + `NAV_MAP` + route group `src/app/ehis-inventory/` + `layout.tsx` (`requireModule("inventory")`) + ModuleSwitcher auto-pickup. **Nav perm `inventory.*` = forward-ref** (gate ke superadmin sampai RBAC di-seed di INV9).
- [x] **INV2 — Beranda**: KPI strip (SKU/nilai/reorder/ED) + quick-nav 6 menu + 3 panel (reorder · FEFO · pergerakan terkini).
- [x] **INV3 — Daftar Barang**: filter lokasi (agregat "Semua") + jenis + status + search; tabel; drawer detail (saldo per-lokasi + batch FEFO + mutasi); drawer Tambah Barang dari katalog (Obat+BMHP) per-lokasi + parameter min/ROP/max.
- [x] **INV4 — Distribusi**: amprahan list + filter + drawer detail (qtyMinta/qtyKeluar) + aksi "Proses & Keluarkan".
- [x] **INV5 — Pengiriman**: 2 tab Penerimaan (GRN: batch/ED/harga beli) + Transfer antar-lokasi + drawer detail.
- [x] **INV6 — Stok Opname**: sesi list + **modal interaktif** (input qtyFisik + selisih live + paginasi + "Posting") + **Batalkan SO** (status `Dibatalkan` merah, sesi read-only) + **Cetak Berita Acara A4** (sesi Posted).
- [x] **INV7 — Rekanan**: vendor list + filter jenis + drawer detail + drawer Tambah Rekanan (form lokal).
- [x] **INV8 — Monitoring**: reorder board (progress bar) + FEFO/expiry + nilai stok per-lokasi (bar) + barang paling bergerak.
- [x] UI kit bersama `inventoryShared.tsx` (InvShell/KpiCard/SectionCard/StatusPill/SlideOver/SearchInput/FilterChip/PrimaryButton/EmptyState) — accent cyan, **tanpa ungu**, SaaS.
- [x] Mock `inventoryMock.ts` (items/balances/batches/movements/vendors/receipts/transfers/distribusi/opname + helper status & FEFO).
- [x] `tsc --noEmit` bersih + eslint bersih (modul Inventory).

### Backend — ✅ BE0–BE7 selesai (2026-06-19) · detail [TODO-INVENTORY-BACKEND.md](TODO-INVENTORY-BACKEND.md)
- [x] **INV1-RBAC** — `inventory.*` ke `rbacShared.ts` + `gen-rbac-seed.mjs` + delta migration seed (BE0b).
- [x] **INV9 — Backend** (§4/§7): schema `inventory` + migration drift-safe + layering Route/Service/DAL + seed; swap FE mock→API (`@/lib/api/inventory/*`) — 7 menu (Beranda·Daftar Barang·Opname·Penerimaan·Transfer·Distribusi·Rekanan·Monitoring).
- [ ] **INV10 — Integrasi** (§9): dispensing Farmasi → OUT; billing; (BPJS Aplicares = bed≠stok, abaikan). _follow-up._
- [ ] **Follow-up**: Vendor edit/delete UI · partial-fulfill distribusi · distribusi ke unit klinis (OUT) · role `Logistik` dedikasi · picker `bmhp-tersedia` per-lokasi.
- [ ] Docs: arsip ke [.claude/DONE.md](.claude/DONE.md).

---

## 9. Konsumen / integrasi (hilir — Phase later)

- **Farmasi (dispensing):** serah obat/BMHP ke pasien → otomatis `OUT` movement dari depo (kurangi stok). Sumber order = `medicalrecord.ResepOrder` (sudah ada) + worklist Farmasi.
- **Tindakan:** BMHP melekat ke tindakan → `OUT` saat tindakan dikerjakan (selaras [docs/BACKEND-MASTER-KATALOG-BMHP.md §8](docs/BACKEND-MASTER-KATALOG-BMHP.md)).
- **Billing/Chargemaster:** pemakaian item → charge (harga snapshot) — [TODO-CHARGEMASTER.md](TODO-CHARGEMASTER.md).
- **Pengadaan/PO:** GRN idealnya merujuk PO (modul Procurement = di luar scope awal; GRN bisa berdiri tanpa PO dulu).

---

## 10. Keputusan terbuka (perlu konfirmasi)

1. **Role baru `Logistik`** vs cukup grant `inventory.*` ke Apoteker + Admin? (default usul: buat role `Logistik`.)
2. **Cakupan lokasi stok:** semua `Location` (Gudang + Depo Farmasi + ruangan unit) atau hanya kategori Farmasi/Gudang? (usul: Location bertanda "menyimpan stok" — butuh flag/inferensi dari kategori.)
3. **BMHP ter-assign location:** ✅ `master.FormulariumBmhp` + `/master/formularium-bmhp` **sudah ada** (2026-06-19, Mapping Hub → Ketersediaan Farmasi sub BMHP). **Sisa:** FE picker "Daftar Barang" BMHP belum baca filter lokasi → sementara masih tampil seluruh katalog BMHP aktif.
4. **Nama modul UI:** "EHIS Inventory" / "EHIS Logistik" / "EHIS Gudang"? (usul: **Inventory**.)
5. **Hapus `depoMock.ts`** saat cabut Distribusi — pastikan tak ada konsumen lain.
