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
4. **On-hand vs Available** — `qtyReserved` dimodelkan sekarang, di-*wire* saat Transfer/Distribusi (BE5). `available = onHand − reserved`.
5. **Atomic · anti-negatif · idempoten** — movement + saldo dalam 1 transaksi; `OUT` update bersyarat (tolak bila stok kurang); `refId` cegah dobel-posting.
6. **Item = (`itemJenis`, `itemId`)** → soft ref `master.Obat`/`master.Bmhp` (1:1 dgn FE mock `jenis`+`catalogId`); lokasi = `locationId` → `master.Location`. **Tanpa FK Prisma lintas-schema** (validasi di Service), selaras `encounter.BedAllocation.bedId`.
7. **Daftar Barang = (ter-assign Ketersediaan Farmasi) ∪ (ber-stok)** — item assigned tapi stok 0 tetap tampil; item ber-stok yang di-de-assign tak hilang.

---

## 📋 Worklist (BE0 → BE8)

| # | Slice | Status | Inti |
|---|-------|:---:|------|
| **BE0** | Foundation (schema + migrasi + client) | ✅ | schema `inventory`: 6 enum + 12 model + counter |
| **BE0b** | RBAC `inventory.*` | ✅ | 7 leaf + seed perms + grant Admin/Apoteker |
| **BE1** | Core ledger | 📋 | `postMovement` transaksional·idempoten·anti-negatif·FEFO + DAL batch/balance |
| **BE2** | Daftar Barang | 📋 | read endpoint (join master + saldo + status) + seed stok awal + swap FE |
| **BE3** | Rekanan (Vendor) | 📋 | CRUD layered (kode `VND-NNN`) + swap FE |
| **BE4** | Penerimaan (GoodsReceipt) | 📋 | create/post → movement IN + batch + swap FE |
| **BE5** | Transfer + Distribusi | 📋 | TRANSFER/OUT + reservasi (`qtyReserved`) + swap FE |
| **BE6** | Stok Opname | 📋 | post → ADJUST per selisih + swap FE |
| **BE7** | Monitoring + Beranda | 📋 | aggregate (low/expiring/value/recent) + swap FE |
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

---

## 🗺️ Peta file target (per layer — diisi saat slice dikerjakan)

| Layer | Path kanonik (target) |
|-------|------------------------|
| Prisma schema | [prisma/schema/inventory.prisma](prisma/schema/inventory.prisma) ✅ |
| Zod schemas | `src/lib/schemas/inventory/*.ts` 📋 |
| DAL | `src/lib/dal/inventory/*.ts` 📋 |
| Service | `src/lib/services/inventory/*.ts` (incl. `movementService` core) 📋 |
| API routes | `src/app/api/v1/inventory/*` 📋 |
| API client | `src/lib/api/inventory/*.ts` 📋 |
| Seed | `prisma/scripts/seed-inventory.mts` 📋 |

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
