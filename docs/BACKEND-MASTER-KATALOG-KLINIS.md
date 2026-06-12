# EHIS Backend — Master Data: **Grup Katalog Klinis** (schema `master`)

> **Data referensi klinis-operasional** (bukan transaksional): katalog item yang **dipakai sebagai sumber** saat koding/order/billing — tindakan medis (ICD-9-CM), pemeriksaan lab, pemeriksaan radiologi, obat, kode ICD, diagnosa keperawatan. Master = **sumber kebenaran statis**, jarang berubah, banyak dibaca → kandidat utama **cache** (FLOWS §12).
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** (core rules · tech · best practices). Bila konflik, FLOWS menang.
> **1 file per grup pengerjaan** master (`BACKEND-MASTER-<GRUP>.md`). File ini = grup **Katalog Klinis** (Obat · **Tindakan** · Lab · Radiologi · **ICD** · SDKI). Peta seluruh grup → [BACKEND-MASTER-SUMBER-DAYA §0](BACKEND-MASTER-SUMBER-DAYA.md#0-peta-grup-master-urut-frontend-ehis-master).
> **Dokumen terkait:** [API-RULES](API-RULES.md) (resep endpoint) · [BACKEND-AUTH](BACKEND-AUTH.md) (RBAC) · [TODO-CHARGEMASTER.md](../TODO-CHARGEMASTER.md) (federasi billable-service — **konsumen** katalog ini).
> **Terkait:** [CLAUDE.md](../CLAUDE.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md#b12-katalog-klinis).
>
> **Stack:** PostgreSQL · Prisma (`@@schema("master")`) · layered **Route→Service→DAL→Prisma** · Redis cache-aside (menyusul) · Auth.js RBAC.
> **Status:** **Katalog Tindakan ✅ backend + FE wired (2026-06-12)** — schema + migrasi + Zod + DAL + Service + 4 endpoint + client + page swap SSR-hybrid; kode ICD-9 **opsional**; 16 kategori (11 awal + 5 tambahan); **dikonsumsi Mapping Hub → Layanan Unit** (§A.8). · **ICD-10/9 ✅ backend + wired (2026-06-07)** — lihat §B. · **Katalog Lab ✅ backend + FE wired (2026-06-12)** — model **Tes→Parameter** (panel): `LabTest`+`LabParameter` (rujukan numerik per-parameter = JSONB) + migrasi + Zod + DAL (nested **replace-all**) + Service + 4 endpoint + client + **form rewrite** (tab Parameter · **Satuan combobox** riset · **DiscardDialog** · field **KODE dihapus**) + SSR-hybrid; **seeded 38 tes / 88 parameter** standar (PMK 43/2013 · NCEP ATP III · WHO · SAMHSA) — §C. · **Obat · Radiologi · SDKI 📋** (analisis ringkas — §C).

---

## 0. Cakupan grup

Grup **Katalog Klinis** (`/ehis-master` → menu "Katalog Klinis"). Tiap sub-master **berdiri sendiri** (field domain spesifik) — JANGAN disatukan ke satu tabel; federasi lintas-katalog dilakukan di layer **chargemaster** (lihat [TODO-CHARGEMASTER.md](../TODO-CHARGEMASTER.md), Opsi A).

| Sub-master | Route FE | Mock / tipe FE | Status backend |
|---|---|---|---|
| **Katalog Tindakan** | `/ehis-master/katalog-tindakan` | [tindakanMock.ts](../src/lib/master/tindakanMock.ts) `TindakanRecord` | ✅ (§A) |
| **ICD-10 / ICD-9-CM** | `/ehis-master/icd` | [icdMock.ts](../src/lib/master/icdMock.ts) `IcdItem` | ✅ (§B) |
| Katalog Obat | `/ehis-master/katalog-obat` | [obatMock.ts](../src/lib/master/obatMock.ts) `ObatRecord` | 📋 (§C) |
| Katalog Lab | `/ehis-master/katalog-lab` | [labTestCatalog.ts](../src/lib/master/labTestCatalog.ts) `LabTestRecord` + [labTestSeed.ts](../src/lib/master/labTestSeed.ts) | ✅ wired (§C) — Tes→Parameter, seeded 38/88 |
| Katalog Radiologi | `/ehis-master/katalog-radiologi` | [radCatalogMock.ts](../src/lib/master/radCatalogMock.ts) `RadCatalogRecord` | 📋 (§C) |
| SDKI (Diagnosa Keperawatan) | `/ehis-master/sdki` | [sdkiMock.ts](../src/lib/master/sdkiMock.ts) | 📋 (§C) |

> **Pemisahan klinis vs billable (penting):** katalog di sini = **data domain klinis** (Tindakan: kompleksitas/KPTL/ICD-9 · Lab: nilai rujukan/delta · Rad: template/persiapan). Layer **tarif/billable** (harga × penjamin × kelas, `unitTerkait`) hidup di **chargemaster terpisah** yang **mer-referensi** item katalog via `(sourceType, sourceId)` — bukan kolom di katalog ini. Lihat [TODO-CHARGEMASTER.md](../TODO-CHARGEMASTER.md).

---

## A. Sub-grup **Katalog Klinis — Katalog Tindakan** ✅

> **Frontend referensi:** [/ehis-master/katalog-tindakan](../src/app/ehis-master/katalog-tindakan/page.tsx) → [KatalogTindakanPage](../src/components/master/katalog-tindakan/KatalogTindakanPage.tsx) · tab [TindakanIdentitasTab](../src/components/master/katalog-tindakan/tabs/TindakanIdentitasTab.tsx) (identitas + status KPTL) · tab [TindakanRelasiTab](../src/components/master/katalog-tindakan/tabs/TindakanRelasiTab.tsx) (spesialis & unit default — seed Mapping Hub).
> **Mock target:** [tindakanMock.ts](../src/lib/master/tindakanMock.ts) — `TINDAKAN_MOCK: TindakanRecord[]` (**dikosongkan** 2026-06-12 → diisi via form/DB), tipe `TindakanRecord`/`TindakanKategori`/`TingkatKompleksitas`, config `KATEGORI_CFG`/`KOMPLEKSITAS_CFG`/`KATEGORI_ORDER`.
> **Standar:** kode prosedur **ICD-9-CM**. Status **KPTL** (opsional) → Nomor KPTL + tingkat kompleksitas.

### A.1 Scope domain

**Katalog Tindakan OWNS:**
- **Identitas tindakan**: `kode` (ICD-9-CM, **opsional**), `nama`, `kategori` (16 nilai), `deskripsi`, `status` (Aktif/NonAktif).
- **Status KPTL** (opsional): `kptlAktif` (toggle) → `nomorKptl` + `kompleksitas` (Sederhana/Sedang/Khusus/Canggih). Saat KPTL non-aktif, keduanya null.
- **Relasi default** (seed Mapping Hub): `spesialisDefault[]` (kewenangan) + `unitDefault[]` (layanan unit).

**TIDAK owns (delegasi/konsumen):**
- **Tarif/harga** (per penjamin × kelas) → **chargemaster** ([TODO-CHARGEMASTER.md](../TODO-CHARGEMASTER.md)); baris tarif merujuk `sourceType=tindakan, sourceId`.
- **Kewenangan dokter** (`Dokter × Tindakan`) & **Layanan unit** (`Tindakan × Unit`) → **Mapping Hub** (FK ke tindakan dari sana); katalog hanya kasih **seed default**.
- **Pencatatan tindakan pasien** (yang benar-benar dilakukan) → domain klinis (`medicalrecord`/`Order`).

### A.2 Entity model (schema `master`)

[tindakan.prisma](../prisma/schema/tindakan.prisma) — **katalog leaf** (analog `IcdCode`): **TANPA optimistic-version** (jarang di-edit konkuren), soft-delete, uuid v7, timestamptz.

#### `Tindakan`
| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | |
| `kode` | string `@default("")` | ICD-9-CM — **boleh kosong** (entry baru = nama dulu) |
| `nama` | string | wajib |
| `kategori` | enum `TindakanKategori` | nilai **identik union FE** → tanpa vocab-map |
| `kptlAktif` | boolean `@default(false)` `@map("kptl_aktif")` | toggle status KPTL |
| `nomorKptl` | string? `@map("nomor_kptl")` | hanya relevan saat `kptlAktif` |
| `kompleksitas` | enum `TingkatKompleksitas`? | **null** saat KPTL non-aktif |
| `spesialisDefault` | `String[]` `@map("spesialis_default")` | kode spesialis (loose; dokter domain owns enum) |
| `unitDefault` | `String[]` `@map("unit_default")` | kode unit (seed Layanan Unit) |
| `deskripsi` | string? | |
| `active` | boolean `@default(true)` | FE `status` "Aktif"/"NonAktif" ⇄ `active` |
| `createdAt`·`updatedAt`·`deletedAt` | timestamptz | soft-delete |
| — | — | `@@index([kategori, active])` · `@@index([kode])` |

**Enum** (Prisma native, `@@schema("master")`):
- `TindakanKategori` (**16**): `Konsultasi`·`Tindakan_Medis`·`Diagnostik`·`Bedah_Minor`·`Bedah_Mayor`·`Bedah_Khusus`·`Obstetri`·`Pediatrik`·`Resusitasi`·`Anestesi`·`Spesialistik` (11 awal) + `Non_Kategori`·`Prosedur_Bedah`·`Prosedur_Non_Bedah`·`Keperawatan`·`Tindakan_Invasif` (5 tambahan, 2026-06-12).
- `TingkatKompleksitas` (4): `Sederhana`·`Sedang`·`Khusus`·`Canggih`.

> **Nilai enum = union FE persis** (termasuk `Tindakan_Medis` ber-underscore) → Service **tak perlu** vocab-map kategori/kompleksitas (beda dgn ICD `jenis`). Hanya `status` "Aktif"/"NonAktif" ⇄ `active` boolean dipetakan.

**Migrasi:** [`20260612000000_add_master_tindakan`](../prisma/migrations/20260612000000_add_master_tindakan/migration.sql) (enum + tabel + index) · [`20260612010000_tindakan_kategori_add_values`](../prisma/migrations/20260612010000_tindakan_kategori_add_values/migration.sql) (5 nilai kategori, `ADD VALUE IF NOT EXISTS` idempoten). **Ditulis additive-manual + `migrate deploy`** (bukan `migrate dev`/diff penuh) karena live DB punya drift di tabel lain — lihat memori `project_migration_drift_pattern`.

### A.3 Lifecycle & invariants

Master = **aktif/non-aktif + soft-delete** (bukan state machine). Yang dijaga:

| Invariant | Penegakan |
|---|---|
| `nama` wajib (kode boleh kosong) | **Service** (cermin `isTindakanValid` — hanya cek nama) + Zod `nama.min(1)` |
| Kode ICD-9 **opsional** | Zod `.optional()` · Prisma `@default("")` — TAK ada unique kode (boleh kosong/duplikat sementara) |
| KPTL non-aktif → `nomorKptl`/`kompleksitas` null | FE bersihkan saat toggle off + Service simpan apa adanya |
| Soft-delete | `deletedAt`+`active:false`; semua read DAL filter `deletedAt:null` |

> **Tanpa optimistic-version** (katalog leaf, low-concurrency) → update = `updateMany({where:{id, deletedAt:null}})`. Bila kelak butuh proteksi konkuren, tambah `version` (pola ruangan/pegawai).

### A.4 Layer breakdown (semua ✅)

| Lapis | File | Catatan |
|---|---|---|
| **Schema (Zod+DTO)** | [schemas/master/tindakan.ts](../src/lib/schemas/master/tindakan.ts) | `CreateTindakanInput`/`UpdateTindakanInput`/`TindakanQuery`/`IdParam` + DTO `TindakanDTO` **mirror `TindakanRecord`**. `nomorKptl`/`deskripsi` = `clearableStr` (""/null → clear). |
| **DAL** | [dal/master/tindakanDal.ts](../src/lib/dal/master/tindakanDal.ts) | `create`/`findById`/`update`/`softDelete`/`list` (filter q/kategori/kompleksitas/active + keyset cursor). Enum string-union loose. |
| **Service** | [services/master/tindakanService.ts](../src/lib/services/master/tindakanService.ts) | `list`/`create`/`update`/`remove`. `toDTO` (status⇄active; kategori/kompleksitas pass-through). `setDefined` patch parsial. **`list` actor-less** (SSR-friendly, pola `dokterService.listDokter`). |
| **Route** | [tindakan/route.ts](../src/app/api/v1/master/tindakan/route.ts) (GET+POST) · [tindakan/[id]/route.ts](../src/app/api/v1/master/tindakan/[id]/route.ts) (PATCH+DELETE) | RBAC `master.katalog`. |
| **API client** | [api/master/tindakan.ts](../src/lib/api/master/tindakan.ts) | `listTindakan`/`createTindakan`/`updateTindakan`/`deleteTindakan`. |

#### A.4.1 API endpoints

| Method | Path | Service | RBAC |
|---|---|---|---|
| `GET` | `/api/v1/master/tindakan?q=&kategori=&kompleksitas=&status=&cursor=&limit=` | `list` (cursor) | `master.katalog:read` |
| `POST` | `/api/v1/master/tindakan` | `create` (201) | `master.katalog:create` |
| `PATCH` | `/api/v1/master/tindakan/:id` | `update` (parsial) | `master.katalog:update` |
| `DELETE` | `/api/v1/master/tindakan/:id` | `remove` (soft) | `master.katalog:delete` |

> RBAC pakai resource **`master.katalog`** (existing, "Katalog Obat/Lab/ICD") — bukan key baru. Admin full; Apoteker read/update.

### A.5 FE wiring — SSR hybrid

- **Page (Server Component)** [/ehis-master/katalog-tindakan/page.tsx](../src/app/ehis-master/katalog-tindakan/page.tsx): `tindakanService.list({limit:200})` **langsung** (tanpa hop HTTP) → `initial` + `prefetched` ke client. `dynamic="force-dynamic"`. Gagal → fallback client fetch (API-RULES §6.1).
- **Client** [KatalogTindakanPage](../src/components/master/katalog-tindakan/KatalogTindakanPage.tsx): seed `useMasterCrud` dari SSR (DTO→record); **CUD** via `createTindakan`/`updateTindakan` + `crud.commit` · `deleteTindakan` + `crud.removeLocal` + toast. Filter client-side (katalog kecil). DiscardDialog untuk buang-perubahan.
- **DTO→record:** `spesialisDefault: string[]` (DTO) di-narrow `as SpesialisCode[]` saat wiring (kode string sama).

### A.6 Failure modes
| Skenario | Penanganan |
|---|---|
| Simpan tanpa nama | `VALIDATION` (422) — Zod `nama.min(1)` |
| Update id tak ada | `NOT_FOUND` (404) — Service `findById` guard |
| Tanpa izin `master.katalog:*` | `FORBIDDEN` (403) — `assertCan` di route() |

### A.7 Keputusan desain (2026-06-12)
1. **Kode ICD-9 opsional** — alur form: entry baru = nama dulu (kode disembunyikan), kode diisi belakangan via edit (juga opsional). `isTindakanValid` hanya cek nama.
2. **5 kategori tambahan** — `Non Kategori`·`Prosedur Bedah`·`Prosedur Non Bedah`·`Keperawatan`·`Tindakan Invasif`. Ditambah lintas-lapis (prisma enum + migrasi `ADD VALUE` + union FE + `KATEGORI_CFG` warna + `KATEGORI_ORDER` + Zod enum + DAL union + IGD `IGD_KATEGORI_MAP`).
3. **Katalog leaf tanpa version** — selaras `IcdCode`; tindakan jarang di-edit konkuren.

### A.8 ⭐ Konsumsi oleh Mapping Hub — **Layanan Unit** (2026-06-12)

Mapping Hub **Layanan Unit** (`Tindakan × Unit → boleh dilakukan`) kini **konsumsi data real** (sebelumnya `TINDAKAN_MOCK` kosong):
- **Baris** = tindakan dari `/master/tindakan` (DB).
- **Kolom** = **Location (Ruangan) aktif** dari master Unit & Ruangan — selaras pola SDM Assignment (`ruanganFromTree`: filter `type==="Location" && active`).
- **SSR hybrid:** [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) fetch tindakan (`tindakanService.list`) + tree (`ruanganService.getTree`) via Service (`Promise.allSettled`, independen) → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) → [LayananUnitPane](../src/components/master/mapping/layanan/LayananUnitPane.tsx). Fallback client (`getTree` + `listTindakan`).
- Helper [layananShared.ts](../src/components/master/mapping/layanan/layananShared.ts): `unitsFromTree()` (Location→kolom) + `tindakanRecordsFromDTO()`.

> **⚠️ Gap kode unit (CM2):** `tindakan.unitDefault` (kode curated tab Relasi, mis. `IGD`) **≠** kode Location (`IGD-TRI`) → seed default Layanan Unit di-**scope** ke kode unit valid agar stat granted akurat; default cell mulai kosong, admin map manual. Penyelarasan kode Relasi↔Location = kerja **chargemaster CM2** ([TODO-CHARGEMASTER.md](../TODO-CHARGEMASTER.md)). **Kewenangan Klinis tetap Tindakan-only** (tak ikut federasi).

#### A.8.1 Persistensi mapping — `master.LayananUnit` (backend ✅ 2026-06-12)

Matriks Layanan Unit kini punya **tabel persist** (sebelumnya state-only). Join N:N **Tindakan ⇄ Location** — sumber-of-truth Layanan Unit (interim, Tindakan-only; bersatu ke `Tarif.unitTerkait` saat chargemaster CM2/CM5).

- **Model:** [layananUnit.prisma](../prisma/schema/layananUnit.prisma) — `LayananUnit(tindakanId, locationId)`, unik `(tindakan,location)` → grant idempoten, **hard-delete** saat dicabut, **NO version** (join). FK `Restrict` ke `Tindakan`+`Location`. Pola persis [PenugasanRuangan](../prisma/schema/penugasanRuangan.prisma).
- **Layer:** [schemas/master/layananUnit.ts](../src/lib/schemas/master/layananUnit.ts) (Grant/Query/DTO edge ramping + `ruanganKode` dari join) · [layananUnitDal.ts](../src/lib/dal/master/layananUnitDal.ts) (create/findById/findByPair/list keyset/deleteById + guard tindakan/location) · [layananUnitService.ts](../src/lib/services/master/layananUnitService.ts) (`list` **actor-less** → SSR · `grant` idempoten · `revoke` hard-delete).
- **Endpoint** (RBAC **`master.mapping`** — pane Mapping Hub, bukan resource baru):
  - `GET /master/layanan-unit?tindakanId=&locationId=&cursor=&limit=` (`:read`) — list edge, cursor; `listAllLayanan()` loop utk map penuh.
  - `POST /master/layanan-unit {tindakanId, locationId}` (`:update`) — grant idempoten (201 baru / 200 sudah ada).
  - `DELETE /master/layanan-unit/:id` (`:update`) — revoke.
- **Client:** [api/master/layananUnit.ts](../src/lib/api/master/layananUnit.ts) (`listLayanan`/`listAllLayanan`/`grantLayanan`/`revokeLayanan`).
- **FE wiring ✅:** [LayananUnitPane](../src/components/master/mapping/layanan/LayananUnitPane.tsx) — `unitsFromTree` bawa `id` (Location) → `kodeToId`; toggle sel/baris/kolom = `applyChanges` (optimistik → `grant`/`revoke` paralel → **revert sel gagal** + toast); index `${tindakanId}|${ruanganKode}→edgeId` ([layananShared.ts](../src/components/master/mapping/layanan/layananShared.ts) `mapFromEdges`/`edgeKey`/`setPresence`); seed `LayananMap` dari edge SSR ([mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) `layananUnitService.list`); indikator **auto-save**; tombol "Reset Default" (jalur `unitDefault`) dibuang.

### A.9 Task checklist (Katalog Tindakan)
- [x] **KT0 — Schema & migrasi**: [tindakan.prisma](../prisma/schema/tindakan.prisma) + migrasi tabel & 5 kategori.
- [x] **KT1 — Zod + DTO** [schemas/master/tindakan.ts](../src/lib/schemas/master/tindakan.ts) (kode opsional, KPTL, clearable).
- [x] **KT2 — DAL** [tindakanDal.ts](../src/lib/dal/master/tindakanDal.ts).
- [x] **KT3 — Service** [tindakanService.ts](../src/lib/services/master/tindakanService.ts) (`list` actor-less).
- [x] **KT4 — API** 4 endpoint (`master.katalog`).
- [x] **KT5 — Client** [api/master/tindakan.ts](../src/lib/api/master/tindakan.ts).
- [x] **KT6 — Swap FE** [KatalogTindakanPage](../src/components/master/katalog-tindakan/KatalogTindakanPage.tsx) SSR hybrid + CUD + toast.
- [x] **KT7 — Konsumsi Mapping Hub Layanan Unit** (§A.8) — baris DB + kolom Location, SSR hybrid.
- [x] **KT8a — Persist Layanan Unit** (§A.8.1) — `master.LayananUnit` + 3 endpoint grant/revoke/list + **matriks ter-wire** (grant/revoke optimistik, seed edge SSR, auto-save).
- [ ] **KT8 — Tests** (Service: create/update/soft-delete; DAL: list filter+cursor).
- [ ] **KT9 — Cache-aside** (saat Redis siap) + seed contoh (opsional; katalog diisi manual).

---

## B. Sub-grup **Katalog Klinis — ICD-10 / ICD-9-CM** ✅

> Sudah backend + wired (2026-06-07). **Referensi besar** (ICD-10 ±15.000) → di-seed via **bulk import** Excel/CSV, bukan hardcode. Inti = `CODE · DISPLAY · VERSION` (unduhan SatuSehat).

| Lapis | File |
|---|---|
| Schema (enum `IcdJenis` ICD_10/ICD_9, `IcdCode`) | [icd.prisma](../prisma/schema/icd.prisma) |
| Zod+DTO | [schemas/master/icd.ts](../src/lib/schemas/master/icd.ts) |
| DAL | [dal/master/icdDal.ts](../src/lib/dal/master/icdDal.ts) (`createManySkip` bulk) |
| Service | [services/master/icdService.ts](../src/lib/services/master/icdService.ts) (vocab `ICD-10`⇄`ICD_10`, import ter-chunk) |
| API | `/api/v1/master/icd` (GET list+cursor · POST) · `/:id` (PATCH·DELETE) · `/import` (bulk) — RBAC `master.icd` |
| Client | [api/master/icd.ts](../src/lib/api/master/icd.ts) |
| FE | [IcdPage](../src/components/master/icd/IcdPage.tsx) (client fetch + import modal) |

> **Catatan:** ICD = **reference leaf** (tanpa version), natural-key `@@unique([jenis, kode])` (dukung `createMany skipDuplicates`). Dikonsumsi DiagnosaTab (semua modul) + INA-CBG/iDRG mapping. **Katalog Tindakan mengikuti pola DAL/Service ICD** (sibling terdekat).

---

## C. Sub-grup **Obat · Radiologi · SDKI** 📋 · **Lab ✅**

> **Lab ✅ (2026-06-12)** — dibangun penuh (lihat baris **Katalog Lab** di bawah). Sisa (**Obat · Radiologi · SDKI**) = placeholder; pola dasar = sibling **Tindakan/ICD** (leaf, soft-delete, layered), tapi **Rad punya anak relasional** (bukan leaf murni).

| Sub-master | Mock | Catatan pemodelan |
|---|---|---|
| **Katalog Obat** | [obatMock.ts](../src/lib/master/obatMock.ts) `ObatRecord` (30+ field) | HAM/LASA/Formularium flags · golongan UU 35/2009. Leaf besar; konsumen Farmasi + Resep + chargemaster. |
| **Katalog Lab ✅** | [labTestCatalog.ts](../src/lib/master/labTestCatalog.ts) `LabTestRecord` (+ [labTestSeed.ts](../src/lib/master/labTestSeed.ts)) | **Model Tes→Parameter** (panel): `LabTest` (orderable: kategori/spesimen/metode/TAT) **1:N** `LabParameter` (analit: satuan + **tipe Numerik/Kualitatif** + nilai kritis + delta). **Rentang rujukan numerik per-parameter = JSONB** (`[{gender,usiaMin?,usiaMax?,low,high,ket?}]`) — hindari tabel ke-3. Update = **replace-all** parameter (anak, bukan entitas mandiri). Form: tab Parameter + **Satuan combobox** (satuan baku riset) + DiscardDialog; **KODE field dihapus** (auto). Seeded 38 tes / 88 parameter (Darah Rutin/Urine Rutin panel · Kimia Darah · Widal · NAPZA cutoff SAMHSA · Plano/hCG · Golongan Darah). **Lab mock lama** ([labCatalogMock.ts](../src/lib/master/labCatalogMock.ts), single-analit) tetap dipakai HasilPane/TrendPane — belum dimigrasi. |
| **Katalog Radiologi** | [radCatalogMock.ts](../src/lib/master/radCatalogMock.ts) `RadCatalogRecord` | Persiapan/DRL + reporting template + kontras info. PMK 1014/2008. Anak: template/persiapan (array atau child). |
| **SDKI** | [sdkiMock.ts](../src/lib/master/sdkiMock.ts) | Diagnosa keperawatan (SDKI/SLKI/SIKI). Konsumen AsuhanForm keperawatan. |

**Konsumen lintas:** Lab/Rad katalog dikonsumsi **OrderLabTab/OrderRadTab** (rekam medis) + worklist Lab/Rad. **Chargemaster** (CM0–CM5) memfederasi Tindakan+Lab+Rad jadi billable-service untuk Tarif + Layanan Unit.

---

## D. Catatan lintas-sub
- **Katalog klinis ≠ chargemaster.** Field domain (kompleksitas/nilai rujukan/template) tetap di katalog masing-masing; tarif/`unitTerkait` di chargemaster yang mer-referensi via `(sourceType, sourceId)`. **JANGAN merge 3 katalog jadi 1 tabel.**
- **Leaf vs anak relasional:** Tindakan/ICD/Obat/SDKI = leaf; Lab/Rad = punya anak (nilai rujukan/template) → DAL `replaceChildren` dalam tx (pola `replaceMatrix` triase / `replaceKontakDarurat` pegawai).
- **Cache namespace** (saat Redis): `cache:master:tindakan:*` · `cache:master:icd:*` · dst.
- **Definition of Done (FLOWS):** layered · Zod in/out · RBAC enforced · soft-delete · audit · tsc clean · swap FE zero-refactor (DTO mirror tipe FE) · tests Service+DAL.
