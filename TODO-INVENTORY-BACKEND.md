# Inventory (Logistik) — Backend Integration Roadmap

> Progress tracker **backend** modul `/ehis-inventory`. FE mock-first sudah jadi → swap ke DB layered.
> Induk modul (arsitektur, keputusan, FE mock): [TODO-INVENTORY.md](TODO-INVENTORY.md).
> Kontrak layering/error/API: [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md) · [docs/API-RULES.md](docs/API-RULES.md).

**Legenda:** ✅ selesai · 🚧 berjalan · 📋 belum · ⏸️ ditunda

---

## 🧱 Prinsip desain (disepakati di diskusi 2026-06-19)

1. **Movement-ledger = sumber kebenaran** (`StockMovement`, append-only, immutable). **Saldo = proyeksi** (`StockBatch` per batch + `StockBalance` rollup per item×lokasi), di-update **transaksional** bersama tiap movement → audit-able, anti-drift, rebuildable.
2. **Granularitas batch + ED** — saldo terkecil = per (item × lokasi × batch/lot × ED) untuk **FEFO**, recall, alert kadaluwarsa. Angka level-lokasi = `Σ` batch.
3. **Satuan dasar** disimpan internal (konversi kemasan hanya di tampilan/input).
4. **On-hand vs Available** — `qtyReserved` (saldo rollup) di-*wire* di BE5: draft Transfer/Distribusi **mereservasi** stok sumber (guard atomik `available ≥ qty`), posting/batal **melepas**. `available = onHand − reserved`. Reservasi = proyeksi state-dokumen (tak diturunkan dari ledger immutable → di-rebuild dari dokumen terbuka).
5. **Atomic · anti-negatif · idempoten** — movement + saldo dalam 1 transaksi; `OUT` update bersyarat (tolak bila stok kurang); `refId` cegah dobel-posting.
6. **Item = (`itemJenis`, `itemId`)** → soft ref `master.Obat`/`master.Bmhp` (1:1 dgn FE mock `jenis`+`catalogId`); lokasi = `locationId` → `master.Location`. **Tanpa FK Prisma lintas-schema** (validasi di Service), selaras `encounter.BedAllocation.bedId`.
7. **Daftar Barang = (ter-assign Ketersediaan Farmasi) ∪ (ber-stok)** — item assigned tapi stok 0 tetap tampil; item ber-stok yang di-de-assign tak hilang.

---

## 📋 Worklist (BE0 → BE8)

| # | Slice | Status | Inti |
|---|-------|:---:|------|
| **BE0** | Foundation (schema + migrasi + client) | ✅ | schema `inventory`: 6 enum + 12 model + counter |
| **BE0b** | RBAC `inventory.*` | ✅ | 7 leaf + seed perms + grant Admin/Apoteker |
| **BE1** | Core ledger | ✅ | `postMovement` transaksional·anti-negatif·FEFO + DAL batch/balance |
| **BE2** | Daftar Barang | ✅ | read endpoint (join master + saldo) + seed dari edge formularium + swap FE |
| **BE3** | Rekanan (Vendor) | ✅ | CRUD layered (kode `VND-NNN`) + swap FE |
| **BE4** | Penerimaan (GoodsReceipt) | ✅ | create draft → post → movement IN (stok bertambah) + swap FE |
| **BE5** | Transfer + Distribusi | ✅ | create draft → reservasi `qtyReserved`; post → TRANSFER (sumber − / tujuan +) + lepas reservasi + swap FE |
| **BE6** | Stok Opname | ✅ | create snapshot → save fisik → post → OPNAME per selisih + swap FE |
| **BE7** | Monitoring + Beranda | ✅ | aggregate read (nilai/reorder/ED-FEFO/movers/recent) + swap FE |
| **BE8** | Verify + docs | 📋 | tsc/eslint + update [TODO-INVENTORY.md](TODO-INVENTORY.md) + [CLAUDE.md](CLAUDE.md) |

---

## ✅ BE0 — Foundation (2026-06-19)

Schema Postgres ke-7 `inventory`. Item ref `itemJenis`+`itemId`; soft cross-schema ref ke master.

- Schema: [prisma/schema/inventory.prisma](prisma/schema/inventory.prisma) — `StockMovement` (ledger) · `StockBatch` · `StockBalance` · `Vendor` · `GoodsReceipt`(+`GoodsReceiptItem`) · `StockTransfer`(+`StockTransferItem`) · `DistribusiRequest`(+`DistribusiItem`) · `OpnameSession`(+`OpnameItem`) · `InvCounter`.
- Datasource schemas (+`inventory`): [prisma/schema/config.prisma](prisma/schema/config.prisma).
- Migrasi (drift-safe, DDL Prisma-exact via `migrate diff`): [prisma/migrations/20260619180000_inventory_init/migration.sql](prisma/migrations/20260619180000_inventory_init/migration.sql) → applied + `migrate resolve --applied` + `generate`.
- Tipe & mock FE (target swap 1:1): [src/lib/inventory/inventoryMock.ts](src/lib/inventory/inventoryMock.ts).

## ✅ BE0b — RBAC (2026-06-19)

- Modul `inventory` di tree runtime: [src/components/master/mapping/rbac/rbacShared.ts](src/components/master/mapping/rbac/rbacShared.ts) — leaf `inventory.{view,barang,opname,pengiriman,distribusi,monitoring,rekanan}`.
- Seed perms + grant (Admin penuh · Apoteker operasional): [prisma/migrations/20260619190000_rbac_inventory/migration.sql](prisma/migrations/20260619190000_rbac_inventory/migration.sql) → applied + resolved.
- Snapshot generator disinkronkan (tak di-run): [prisma/scripts/gen-rbac-seed.mjs](prisma/scripts/gen-rbac-seed.mjs).
- Role `Logistik` dedikasi: ⏸️ ditunda (sementara Apoteker pegang inventory).

## ✅ BE1 — Core ledger (2026-06-19)

Primitif tunggal `postMovement` = satu-satunya jalur tulis stok (ledger + proyeksi atomik).

- DAL: [src/lib/dal/inventory/stockDal.ts](src/lib/dal/inventory/stockDal.ts) — batch (`getBatch`/`createBatch`/`incBatch`/`decBatchGuarded` anti-negatif/`listBatchesFEFO`), saldo (`balanceDelta`/`setBalancePolicy`), ledger (`createMovement`), reads + join master (Obat/Bmhp/Location cross-schema soft-ref).
- Service: [src/lib/services/inventory/movementService.ts](src/lib/services/inventory/movementService.ts) — `postMovement(input, ctx, tx)` menangani IN/OUT/TRANSFER/ADJUST/OPNAME; FEFO (ED terdekat dulu, bisa pecah multi-batch), anti-negatif via guard, TRANSFER pertahankan identitas batch (no+ED) di tujuan. **WAJIB dipanggil dalam transaksi caller** (dipakai BE4–BE6).

## ✅ BE2 — Daftar Barang (2026-06-19)

Stok nyata per lokasi dari DB (sebelumnya mock). Saldo = proyeksi, di-join snapshot katalog master.

- Schemas/DTO: [src/lib/schemas/inventory/stock.ts](src/lib/schemas/inventory/stock.ts) (`InvLocationDTO`/`InvStockRowDTO`/`InvItemDetailDTO`).
- Service (read, actor-less): [src/lib/services/inventory/stockService.ts](src/lib/services/inventory/stockService.ts) — `listLocations` · `listStock(locationId)` · `itemDetail(jenis,itemId)`.
- Routes (gate `inventory.barang:read`): [locations](src/app/api/v1/inventory/locations/route.ts) · [stock](src/app/api/v1/inventory/stock/route.ts) · [stock/item](src/app/api/v1/inventory/stock/item/route.ts).
- API client: [src/lib/api/inventory/stock.ts](src/lib/api/inventory/stock.ts).
- Seed (idempoten, dari **edge Ketersediaan Farmasi** → opening IN): [prisma/scripts/seed-inventory.mts](prisma/scripts/seed-inventory.mts) — 76 saldo · 65 batch+movement (11 Habis). Status bervariasi (Aman/Rendah/Kritis/Habis/Berlebih).
- **FE swap ✅**: [DaftarBarang.tsx](src/components/inventory/DaftarBarang.tsx) — dropdown lokasi + tabel + drawer detail (saldo lintas-lokasi · batch FEFO · pergerakan) kini fetch API (mock data dilepas; helper status/format tetap dari `inventoryMock`).

## ✅ BE3 — Rekanan / Vendor (2026-06-19)

CRUD master vendor (PBF/Distributor/Manufaktur). Kode auto `VND-<NNN>` (global via `InvCounter`).

- Schema: [src/lib/schemas/inventory/vendor.ts](src/lib/schemas/inventory/vendor.ts) (Create/Update/Query/DTO = FE `Vendor`).
- DAL: [src/lib/dal/inventory/vendorDal.ts](src/lib/dal/inventory/vendorDal.ts) (`nextVendorSeq` · CRUD · soft-delete).
- Service: [src/lib/services/inventory/vendorService.ts](src/lib/services/inventory/vendorService.ts) (`list` actor-less · create kode-auto · update · remove).
- Routes (gate `inventory.rekanan`): [vendors](src/app/api/v1/inventory/vendors/route.ts) (GET/POST) · [vendors/:id](src/app/api/v1/inventory/vendors/[id]/route.ts) (PATCH/DELETE).
- API client: [src/lib/api/inventory/vendor.ts](src/lib/api/inventory/vendor.ts).
- Seed: 5 vendor (di [seed-inventory.mts](prisma/scripts/seed-inventory.mts), idempoten bila tabel kosong).
- **FE swap ✅**: [Rekanan.tsx](src/components/inventory/Rekanan.tsx) — list fetch API + Tambah Rekanan async (kode auto server). Edit/Delete UI = follow-up (BE sudah siap).

## ✅ BE4 — Penerimaan / GoodsReceipt (2026-06-19)

Penerimaan barang dari rekanan. **Create = Draft** (belum pengaruhi stok); **Post = movement IN**
per baris (stok lokasi tujuan BERTAMBAH via `movementService.postMovement`, batch+saldo) lalu Selesai.

- Counter/docNo: [counterDal.ts](src/lib/dal/inventory/counterDal.ts) + [docNo.ts](src/lib/services/inventory/docNo.ts) (`GRN-<YYMM><NNN>` WIB; reusable TRF/DST/OPN).
- Schema: [src/lib/schemas/inventory/receipt.ts](src/lib/schemas/inventory/receipt.ts) (Create + Query + DTO diperkaya nama vendor/lokasi/item).
- DAL: [src/lib/dal/inventory/receiptDal.ts](src/lib/dal/inventory/receiptDal.ts) (nested items · joins vendor/pegawai).
- Service: [src/lib/services/inventory/receiptService.ts](src/lib/services/inventory/receiptService.ts) — `list`/`get`/`create` (Draft, petugas dari `actor.pegawaiId`)/`post` (idempoten, transaksi → `postMovement IN`).
- Routes (gate `inventory.pengiriman`): [receipts](src/app/api/v1/inventory/receipts/route.ts) (GET/POST) · [:id](src/app/api/v1/inventory/receipts/[id]/route.ts) (GET) · [:id/post](src/app/api/v1/inventory/receipts/[id]/post/route.ts) (POST update).
- API client: [src/lib/api/inventory/receipt.ts](src/lib/api/inventory/receipt.ts).
- Seed: 2 GRN (Draft + Diproses, belum diposting) di [seed-inventory.mts](prisma/scripts/seed-inventory.mts).
- **FE swap ✅**: [Pengiriman.tsx](src/components/inventory/Pengiriman.tsx) tab **Penerimaan** = API (list + detail + **Tambah Penerimaan** drawer multi-baris + tombol **Posting → Terima Barang**).

## ✅ BE5 — Transfer + Distribusi (2026-06-19)

Mutasi stok antar lokasi farmasi. **Reservasi 2-fase**: create draft → `qtyReserved` di saldo sumber
bertambah (guard atomik); **post** → lepas reservasi + `movementService.postMovement` **TRANSFER** per
baris (sumber −, tujuan +, identitas batch/FEFO) → Selesai; **cancel** → lepas reservasi → Dibatalkan.
Beda: **Transfer** = mutasi langsung; **Distribusi** = demand-driven (`pemohon` + `qtyMinta`/`qtyKeluar`,
`fulfill` isi `qtyKeluar`). Keduanya gudang↔depo (lokasi tracked → saldo tujuan ikut terjaga).

- Reservasi DAL (saldo rollup): [stockDal.ts](src/lib/dal/inventory/stockDal.ts) — `reserveBalanceGuarded` (`UPDATE … WHERE (qty_on_hand − qty_reserved) ≥ qty`, raw atomik) · `releaseReserve` (clamp ≥ 0) · `findPegawaiNama`.
- Schemas: [transfer.ts](src/lib/schemas/inventory/transfer.ts) · [distribusi.ts](src/lib/schemas/inventory/distribusi.ts) (Create/Query/DTO diperkaya nama; refine sumber≠tujuan).
- DAL: [transferDal.ts](src/lib/dal/inventory/transferDal.ts) · [distribusiDal.ts](src/lib/dal/inventory/distribusiDal.ts) (nested items · `setItemKeluar`).
- Service: [transferService.ts](src/lib/services/inventory/transferService.ts) (`list`/`get`/`create`/`post`/`cancel`) · [distribusiService.ts](src/lib/services/inventory/distribusiService.ts) (`list`/`get`/`create`/`fulfill`/`cancel`) — validasi lokasi = farmasi, petugas dari `actor.pegawaiId`.
- Routes (gate `inventory.pengiriman` transfer · `inventory.distribusi` distribusi): [transfers](src/app/api/v1/inventory/transfers/route.ts) + [:id](src/app/api/v1/inventory/transfers/[id]/route.ts) + [:id/post](src/app/api/v1/inventory/transfers/[id]/post/route.ts) + [:id/cancel](src/app/api/v1/inventory/transfers/[id]/cancel/route.ts) · [distribusi](src/app/api/v1/inventory/distribusi/route.ts) + [:id](src/app/api/v1/inventory/distribusi/[id]/route.ts) + [:id/fulfill](src/app/api/v1/inventory/distribusi/[id]/fulfill/route.ts) + [:id/cancel](src/app/api/v1/inventory/distribusi/[id]/cancel/route.ts).
- API client: [transfer.ts](src/lib/api/inventory/transfer.ts) · [distribusi.ts](src/lib/api/inventory/distribusi.ts).
- Seed: 1 draft TRF + 1 draft DST (gudang → depo, reservasi konsisten) di [seed-inventory.mts](prisma/scripts/seed-inventory.mts).
- **FE swap ✅**: [Pengiriman.tsx](src/components/inventory/Pengiriman.tsx) tab **Transfer** = API (list + detail + **Tambah Transfer** drawer + Posting/Batalkan) · [Distribusi.tsx](src/components/inventory/Distribusi.tsx) = API (list + detail + **Tambah Permintaan** drawer + Proses/Batalkan; mock `INV_DISTRIBUSI`/`INV_TRANSFERS` dilepas dari kedua komponen).
- **Catatan**: fulfill = penuh (`qtyKeluar = qtyMinta`); partial-fulfill = follow-up. Distribusi ke unit klinis non-farmasi (OUT) = follow-up (kini gudang↔depo via TRANSFER).

## ✅ BE6 — Stok Opname (2026-06-19)

Hitung fisik per lokasi → posting selisih. **3 fase**: `create` snapshot saldo lokasi (`qtySistem`,
`qtyFisik` null) status Counting → `saveCounts` isi fisik (Counting↔Review, hanya baris milik sesi) →
`post` movement **OPNAME** per selisih (`qtyFisik − qtySistem` snapshot) via `movementService` →
Posted. Selisih + (surplus → batch `ADJ-…`) / − (susut → outflow FEFO, anti-negatif).

- Schema: [opname.ts](src/lib/schemas/inventory/opname.ts) (Create + SaveCounts + Query + DTO diperkaya nama/satuan).
- DAL: [opnameDal.ts](src/lib/dal/inventory/opnameDal.ts) (snapshot nested · `updateItem` · `updateStatus`).
- Service: [opnameService.ts](src/lib/services/inventory/opnameService.ts) — `create` (snapshot `listBalancesByLocation`, tolak lokasi kosong) · `saveCounts` (status turunan) · `post` (wajib semua terhitung, idempoten) · `list`/`get`.
- Routes (gate `inventory.opname`): [opname](src/app/api/v1/inventory/opname/route.ts) (GET/POST) · [:id](src/app/api/v1/inventory/opname/[id]/route.ts) (GET/PATCH save) · [:id/post](src/app/api/v1/inventory/opname/[id]/post/route.ts) (POST).
- API client: [opname.ts](src/lib/api/inventory/opname.ts).
- Seed: 1 sesi Counting (6 item di gudang) di [seed-inventory.mts](prisma/scripts/seed-inventory.mts).
- **FE swap ✅**: [StokOpname.tsx](src/components/inventory/StokOpname.tsx) — list + **Mulai Opname** (pilih lokasi → snapshot) + editor fisik (Simpan progres + Posting; selisih live) = API; mock `INV_OPNAME` dilepas.
- **Catatan**: selisih dihitung vs `qtySistem` snapshot (konsisten dgn kolom Selisih di FE); set-system-to-physical murni = follow-up.

## ✅ BE7 — Monitoring + Beranda (2026-06-19)

Agregat read-only lintas lokasi dari saldo+batch+ledger (di-join snapshot harga/nama katalog). **2
endpoint**: `overview` (Beranda) + `monitoring`. Status stok (`Aman/Rendah/Kritis/Habis/Berlebih`)
dihitung server (qty vs ROP/max); warna di FE (`STOK_STATUS_CFG`).

- Aggregate DAL: [stockDal.ts](src/lib/dal/inventory/stockDal.ts) — `listAllBalances` · `listExpiringBatches(cutoff)` (FEFO) · `listRecentMovements(limit)` · `topMovers(limit)` (groupBy Σ qty OUT+TRANSFER).
- DTO: [dashboard.ts](src/lib/schemas/inventory/dashboard.ts) (`InvBerandaDTO` · `InvMonitoringDTO` + baris alert/expiring/mover/loc-value).
- Service (actor-less): [dashboardService.ts](src/lib/services/inventory/dashboardService.ts) — `overview` (KPI sku/nilai/reorder/ED≤90 + lowStock 7 + expiring 6 + recent 6) · `monitoring` (KPI nilai/reorder/ED≤120/habis + reorder all + expiry all + nilai per lokasi + movers 6).
- Routes: [overview](src/app/api/v1/inventory/dashboard/overview/route.ts) (gate `inventory.view:read`) · [monitoring](src/app/api/v1/inventory/dashboard/monitoring/route.ts) (gate `inventory.monitoring:read`).
- API client: [dashboard.ts](src/lib/api/inventory/dashboard.ts).
- **FE swap ✅**: [InventoryBeranda.tsx](src/components/inventory/InventoryBeranda.tsx) + [Monitoring.tsx](src/components/inventory/Monitoring.tsx) = API; mock data (`INV_BALANCES/BATCHES/MOVEMENTS/ITEMS/LOCATIONS` + `itemById`/`locById`) dilepas (helper config `STOK_STATUS_CFG`/`MOVEMENT_CFG`/`fmt*`/`daysToExpiry`/`itemInitials` tetap).
- **Verified** (DB probe): 76 saldo · nilai ≈ Rp 4,05 M · 11 habis · 27 reorder · 7 batch ED ≤120hr. Movers kosong sampai ada transfer/distribusi diposting (kini hanya OPENING IN).

---

## 🗺️ Peta file target (per layer)

| Layer | Path kanonik |
|-------|------------------------|
| Prisma schema | [prisma/schema/inventory.prisma](prisma/schema/inventory.prisma) ✅ |
| Zod schemas | stock ✅ · vendor ✅ · receipt ✅ · transfer ✅ · distribusi ✅ · opname ✅ · dashboard ✅ |
| DAL | stockDal ✅ (+aggregate) · vendorDal ✅ · counterDal ✅ · receiptDal ✅ · transferDal ✅ · distribusiDal ✅ · opnameDal ✅ |
| Service | movementService ✅ · stockService ✅ · vendorService ✅ · docNo ✅ · receiptService ✅ · transferService ✅ · distribusiService ✅ · opnameService ✅ · dashboardService ✅ |
| API routes | `{locations,stock,stock/item,vendors(/:id),receipts(/:id)(/:id/post),transfers(/:id)(/post)(/cancel),distribusi(/:id)(/fulfill)(/cancel),opname(/:id)(/post),dashboard/{overview,monitoring}}` ✅ |
| API client | stock ✅ · vendor ✅ · receipt ✅ · transfer ✅ · distribusi ✅ · opname ✅ · dashboard ✅ |
| Seed | [prisma/scripts/seed-inventory.mts](prisma/scripts/seed-inventory.mts) ✅ |

### FE (sudah ada — target swap mock → API)

| Menu | Komponen | Route |
|------|----------|-------|
| Beranda | [InventoryBeranda.tsx](src/components/inventory/InventoryBeranda.tsx) | [page.tsx](src/app/ehis-inventory/page.tsx) |
| Daftar Barang | [DaftarBarang.tsx](src/components/inventory/DaftarBarang.tsx) | [barang/page.tsx](src/app/ehis-inventory/barang/page.tsx) |
| Stok Opname | [StokOpname.tsx](src/components/inventory/StokOpname.tsx) | [opname/page.tsx](src/app/ehis-inventory/opname/page.tsx) |
| Pengiriman | [Pengiriman.tsx](src/components/inventory/Pengiriman.tsx) | [pengiriman/page.tsx](src/app/ehis-inventory/pengiriman/page.tsx) |
| Distribusi | [Distribusi.tsx](src/components/inventory/Distribusi.tsx) | [distribusi/page.tsx](src/app/ehis-inventory/distribusi/page.tsx) |
| Rekanan | [Rekanan.tsx](src/components/inventory/Rekanan.tsx) | [rekanan/page.tsx](src/app/ehis-inventory/rekanan/page.tsx) |
| Monitoring | [Monitoring.tsx](src/components/inventory/Monitoring.tsx) | [monitoring/page.tsx](src/app/ehis-inventory/monitoring/page.tsx) |
| UI kit | [inventoryShared.tsx](src/components/inventory/inventoryShared.tsx) | — |
