# EHIS Backend — Master Data: **Grup Sumber Daya** (schema `master`)

> **Data referensi RS** (bukan transaksional). Dikonsumsi lintas-modul: Kunjungan (bed/kelas/unit),
> Antrean (poli), Order (unit/katalog), Billing (tarif), Klaim (penjamin), BPJS (Aplicares/V-Claim ruangan).
> Master = **sumber kebenaran statis** — jarang berubah, banyak dibaca → kandidat utama cache (FLOWS §12).
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** (core rules · tech · best practices). Bila konflik, FLOWS menang.
> **1 file per grup pengerjaan** master (`BACKEND-MASTER-<GRUP>.md`). File ini = grup **Sumber Daya** (Pegawai · Pengguna · **Unit & Ruangan** · Dokter). Peta seluruh grup → §0.
> **Dokumen domain terkait:** [BACKEND-ENCOUNTER](BACKEND-ENCOUNTER.md) (consumer `bedId`/`kelas`/`unit`) · [BACKEND-PATIENT](BACKEND-PATIENT.md) (pola `Alamat` kode+nama wilayah) · [BACKEND-AUTH](BACKEND-AUTH.md) (RBAC).
> **Terkait:** [CLAUDE.md](../CLAUDE.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md) (Phase B1) · memori `project_wilayah_strategy`.
>
> **Stack:** PostgreSQL · Prisma (`@@schema("master")`) · layered **Route→Service→DAL→Prisma** · Redis cache-aside · Auth.js RBAC.
> **Status:** 📋 Spec. Sub-grup **Pegawai/Pengguna ✅** (sudah ter-implementasi, lihat [TODOS_BACKEND.md](../TODOS_BACKEND.md#b11-sumber-daya)). File ini menambah sub-grup **Unit & Ruangan** (🚧 spec pertama) · **Dokter** 📋.

---

## 0. Peta grup master (urut frontend `/ehis-master`)

Master FE = 26 sub-master + 8 mapping + Beranda (lihat [CLAUDE.md](../CLAUDE.md) module map). Backend dibangun **per grup**, **1 file `BACKEND-MASTER-<GRUP>.md` per grup**, schema mock 1:1 → swap import:

| Grup | File workflow | Sub-master | Status |
|---|---|---|---|
| **Sumber Daya** | **BACKEND-MASTER-SUMBER-DAYA** (ini) | Pegawai · Pengguna · **Unit & Ruangan** · Dokter | 🚧 Pegawai/Pengguna ✅ · Unit&Ruangan §A · Dokter 📋 |
| Katalog Klinis | BACKEND-MASTER-KATALOG-KLINIS | Obat · Tindakan · Lab · Radiologi · ICD · SDKI | 📋 |
| Skala Klinis | BACKEND-MASTER-SKALA | Risiko · Umum · Penyakit · Triase | 📋 |
| Referensi/Template/Enum | BACKEND-MASTER-TEMPLATE | Asesmen · Status Enum · Anamnesis · Form | 📋 |
| Workflow Klinis | BACKEND-MASTER-WORKFLOW-KLINIS | Edukasi · Discharge · Operasional | 📋 |
| Operasional | BACKEND-MASTER-OPERASIONAL | Tarif · Penjamin · PPK | 📋 |
| Konfigurasi | BACKEND-MASTER-KONFIGURASI | Profil RS (singleton, schema `config`) | 📋 |
| Mapping Hub | BACKEND-MASTER-MAPPING | SDM×Unit · Kewenangan · Layanan · Tarif · Formularium · Distribusi · Penjamin-Ruangan · RBAC | 📋 |
| Beranda | BACKEND-MASTER-BERANDA | stats · recent-edits · mapping-coverage (aggregator) | 📋 |

---

## A. Sub-grup **Sumber Daya — Unit & Ruangan**

> **Frontend referensi:** [/ehis-master/ruangan](../src/app/ehis-master/ruangan/page.tsx) — **Unified Tree** (1 route). Komponen: [RuanganPage](../src/components/master/ruangan/RuanganPage.tsx) · [TreePanel](../src/components/master/ruangan/TreePanel.tsx) · [OrganizationForm](../src/components/master/ruangan/forms/OrganizationForm.tsx) · [LocationForm](../src/components/master/ruangan/forms/LocationForm.tsx) · [BedManagerPanel](../src/components/master/ruangan/forms/BedManagerPanel.tsx).
> **Mock target:** [ruanganShared.ts](../src/components/master/ruangan/ruanganShared.ts) `RUANGAN_MOCK: AnyNode[]` + helpers (`getChildren`/`getEffectiveAlamat`/`getAncestors`/`countDescendants`).
> **Keputusan arsitektur (CLAUDE.md):** Organization & Location = **satu pohon** (n-level via `parentId`), Bed = **sub-collection** Location. FHIR strategy: adapter `toFhirOrganization`/`toFhirLocation` di modul `/ehis-fhir` (BUKAN di sini).

### A.1 Scope domain

**Unit & Ruangan OWNS:**
- Pohon organisasi RS: **Unit** (`Organization`, n-level partOf) — instalasi/departemen/KSM/tim.
- **Ruangan** (`Location`) — selalu anak sebuah Unit; tipe (Rawat Inap/Poli/ICU/IGD/OK/Penunjang) + kelas + kapasitas.
- **Bed** (sub-collection Ruangan) — identitas + **status master** (`active`/`inactive`/`suspended=maintenance`).
- Alamat unit + inherit/override alamat ruangan (Convention over Configuration).

**TIDAK owns (delegasi/consumer):**
- **Identitas RS Induk (root)** → **Profil RS singleton** (schema `config`). Root = baris `Organization` nyata (FK integrity sub-unit), TAPI field inti **read-only di sini** (di-seed/sync dari Profil RS). Lihat A.10 #1.
- **Status bed OPERASIONAL** (`Tersedia`/`Terisi`) → **workflow klinis** saat admisi/pulang (CLAUDE.md). Master Bed hanya `active/inactive/maintenance`. **Jangan** simpan okupansi di sini.
- **Kode wilayah Kemendagri** (provinsi→kelurahan) → master `Wilayah` + API lazy (`project_wilayah_strategy`). Alamat di sini hanya **menyimpan kode+nama snapshot** (pola `pendaftaran.PasienAlamat`).
- **Kode ruangan BPJS V-Claim** (Aplicares/SEP) → Mapping Hub `penjamin-ruangan` (`MappingRuanganRecord`) + adapter BPJS. Lihat A.5/A.10 #4.
- **Penugasan SDM↔Unit · Tindakan↔Unit** → Mapping Hub (FK ke Unit dari sana).

### A.2 Entity model (schema `master`)

> Pemodelan relasional **memecah** `AnyNode` (union mock) jadi **3 tabel** ber-FK (lebih bersih dari union nullable-soup; selaras FHIR R4 Organization/Location). Tree UI direkonstruksi di Service (`tree` read).

#### `Organization` (Unit) — self-referential tree
| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | |
| `parentId` | FK→Organization nullable (`Restrict`) | **null HANYA root**; partOf — **idx** · CHECK anti-cycle (Service) |
| `kode` | string `@unique` | mis. `IGD`/`RI`/`RJ` (uppercase) |
| `nama` | string | |
| `orgType` | enum `OrgType` | `prov`\|`dept`\|`dept_clin`\|`team` (root = `prov`) |
| `active` | boolean `@default(true)` | non-aktif ≠ hapus |
| `telp` / `email` | string nullable | |
| `alamat*` (kode+nama wilayah) | kolom | pola `PasienAlamat` (lihat A.2.4) |
| `gpsLat` / `gpsLng` | float nullable | opsional |
| `isRoot` | boolean `@default(false)` | root RS (1 baris) — di-guard read-only (A.10 #1) |
| `version` · `createdAt` · `updatedAt` · `deletedAt` | — | optimistic concurrency + soft-delete |

#### `Location` (Ruangan) — anak Unit
| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | |
| `organizationId` | FK→Organization (`Restrict`) | **wajib** — ruangan selalu di bawah Unit — **idx** |
| `kode` | string `@unique` | mis. `RI-MEL` |
| `nama` | string | |
| `locationType` | enum `LocationType` | `Rawat_Inap`\|`Rawat_Jalan`\|`ICU`\|`HCU`\|`Isolasi`\|`IGD`\|`OK`\|`Penunjang` — **idx** |
| `kelas` | enum `LocationKelas` nullable | `VIP`\|`Kelas_1..3` · null = "—" (tak berlaku) |
| `kapasitas` | int `@default(1)` | bed yang direncanakan (CHECK 1..50) |
| `overrideAlamat` | boolean `@default(false)` | true → pakai `alamat*` lokal; false → inherit Unit (A.2.4) |
| `alamat*` | kolom nullable | hanya terisi bila `overrideAlamat` |
| `active` | boolean `@default(true)` | |
| `version`/`createdAt`/`updatedAt`/`deletedAt` | — | |

#### `Bed` (sub-collection Ruangan)
| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | |
| `locationId` | FK→Location (`Cascade` soft? → **Restrict**, hapus eksplisit) | **idx** |
| `kode` | string `@unique` | mis. `MEL-01` |
| `nama` | string | mis. "Bed 01" |
| `status` | enum `BedStatus` | `active`\|`inactive`\|`suspended` — **master**, BUKAN okupansi |
| `createdAt`/`updatedAt`/`deletedAt` | — | soft-delete |

> **FK riil ke domain lain** menunjuk KE SINI saat modul siap: `encounter.Kunjungan.bedId → master.Bed.id`, `encounter.Kunjungan.kelas` selaras enum `KelasRawat`. Saat ini placeholder UUID di encounter (BACKEND-ENCOUNTER §2).

#### A.2.4 Alamat (kode+nama wilayah) — pola `PasienAlamat`
Mock `Alamat` hanya simpan nama bebas + 1 `kodeWilayah`. **Target DB diperkaya** ke pola `pendaftaran.PasienAlamat` (kode + nama per level, untuk FHIR `administrativeCode` + join wilayah):
`jalan` · `rtRw?` · `kodePos` · `provinsiKode`/`provinsiNama` · `kotaKode`/`kotaNama` · `kecamatanKode`/`kecamatanNama` · `kelurahanKode`/`kelurahanNama`. **Convention over Configuration:** Location tanpa `overrideAlamat` mewarisi alamat Unit terdekat (resolve `getEffectiveAlamat` di Service).

**Enum** (Prisma native): `OrgType` · `LocationType` · `LocationKelas` · `BedStatus` (semua `@@schema("master")`).

### A.3 Lifecycle & invariants

Master **bukan** state machine transaksional — siklusnya **aktif/non-aktif + soft-delete**. Yang dijaga = **integritas pohon** (deklaratif dulu, FLOWS §2 hybrid):

| Invariant | Penegakan |
|---|---|
| `Organization.kode`/`Location.kode`/`Bed.kode` unik | **UNIQUE** (DB) |
| Ruangan selalu punya Unit induk | **FK NOT NULL** `organizationId` |
| Bed selalu punya Ruangan | **FK NOT NULL** `locationId` |
| Kapasitas 1..50 · triase-like range | **CHECK** |
| Tak ada cycle parent (A→B→A) | **Service** (walk ancestor sebelum set `parentId`) |
| **Hapus** Unit hanya bila **tak punya anak** (Org/Location) | **Service guard** → `FORBIDDEN_STATE` (cermin UI `childCount===0`) |
| **Hapus** Ruangan hanya bila **tak punya bed** | **Service guard** (cermin UI `beds.length===0`) |
| Jumlah bed ≤ `kapasitas` | **Service guard** saat tambah bed (cermin `overCapacity`) |
| **Root RS** tak bisa di-hapus / non-aktif / ubah identitas inti | **Service guard** `isRoot` (A.10 #1) |
| Non-aktif unit = `active:false` (BUKAN delete) | toggle — data tetap untuk histori/FK |

- **Soft-delete** (`deletedAt`) default; hard-delete dilarang (referensi historis: `Kunjungan.bedId` lama).
- **Optimistic concurrency** (`version`) di Organization & Location (diedit banyak admin master).

### A.4 Layer breakdown

#### A.4.1 DAL — `lib/dal/ruanganDal.ts` (atau `sumberDayaDal.ts`)
Akses Prisma murni, terima `tx?`. Master = data RS-wide → **scopeBy ringan** (read terbuka untuk semua role ber-izin; tulis dibatasi RBAC, bukan unit-scope). Soft-delete difilter default.
- `listTree()` → semua Organization + Location + Bed (3 query, di-assemble Service). Cache-able.
- `findOrg(id)` / `findLocation(id)` / `findBed(id)`
- `createOrg/updateOrg(version-guard)/softDeleteOrg`
- `createLocation/updateLocation(version-guard)/softDeleteLocation`
- `createBed/updateBed/softDeleteBed`
- `countOrgChildren(orgId)` · `countLocationsOfOrg(orgId)` · `countBedsOfLocation(locId)` (guard hapus/kapasitas)
- `hasDescendant(ancestorId, candidateParentId)` (anti-cycle)

#### A.4.2 Service — `lib/services/ruanganService.ts`
Business + transaksi + authz + **cache invalidation**. Tak `import prisma`.
- `getTree(actor)` — assemble `AnyNode[]`-kompatibel (Org+Loc+Bed nested `beds[]`) → DTO. **Cache-aside** (`cache:master:ruangan:tree`).
- `createUnit/updateUnit(input, actor)` — validasi orgType, anti-cycle saat `parentId` berubah, guard root read-only.
- `deleteUnit(id, actor)` — guard `countOrgChildren===0` + bukan root.
- `createRuangan/updateRuangan` — validasi `locationType`/`kelas`/`kapasitas`, resolve inherit alamat.
- `deleteRuangan(id, actor)` — guard `countBeds===0`.
- `addBed/updateBed/deleteBed` — guard kapasitas + kode unik.
- **Semua mutasi:** bump version, audit, **invalidate** `cache:master:ruangan:*`.

> **Determinisme (FLOWS §14):** `clock`/`genId` di-inject (jangan `Date.now()`/`randomUUID()` di Service).

#### A.4.3 Validasi/DTO — `lib/schemas/ruangan.ts` (Zod)
- `CreateUnitInput`/`UpdateUnitInput` (kode upper, alamat opsional, `parentId` uuid).
- `CreateRuanganInput`/`UpdateRuanganInput` (discriminated? tidak perlu — flat; `kelas` boleh null).
- `BedInput` (nama, kode, status enum).
- Output **DTO**: tree node (`OrganizationDTO`/`LocationDTO` dgn `beds[]`) — mirror tipe FE `OrganizationNode`/`LocationNode`/`BedSubRecord` agar **zero-refactor UI**.

#### A.4.4 API — `app/api/v1/master/{unit,ruangan,bed}/*` (Route tipis)

> **Tanpa segmen grup `sumber-daya`** (itu nama menu UI, bukan resource) — konsisten dgn `/api/v1/master/pegawai`. **Nest 1 level** untuk create/list (koleksi milik parent); **flat** untuk operasi item ber-UUID (Bed). Tree = *view* koleksi ruangan via query (`?view=tree`) — bukan `/ruangan/tree` (hindari ambigu vs `[id]` di App Router).

| Method | Path | Service |
|---|---|---|
| `GET` | `/api/v1/master/ruangan?view=tree` | `getTree` (cache) |
| `POST` | `/api/v1/master/unit` | `createUnit` |
| `PATCH` | `/api/v1/master/unit/:id` | `updateUnit` (version) |
| `DELETE` | `/api/v1/master/unit/:id` | `deleteUnit` (guard no-child) |
| `POST` | `/api/v1/master/ruangan` | `createRuangan` |
| `PATCH` | `/api/v1/master/ruangan/:id` | `updateRuangan` (version) |
| `DELETE` | `/api/v1/master/ruangan/:id` | `deleteRuangan` (guard no-bed) |
| `POST` | `/api/v1/master/ruangan/:id/bed` | `addBed` (create — nest, butuh parent + kapasitas) |
| `PATCH` | `/api/v1/master/bed/:bedId` | `updateBed` (flat — Bed ber-UUID) |
| `DELETE` | `/api/v1/master/bed/:bedId` | `deleteBed` (flat) |

- RBAC: `master.ruangan:read` (semua staf ber-izin) · `master.ruangan:create/update/delete` (admin master).
- Mutasi wajib **Idempotency-Key** (FLOWS §7.4). Tiap Route: `auth→rbac→zod→service→envelope→handleError`.
- **Catatan UI:** [BedManagerPanel](../src/components/master/ruangan/forms/BedManagerPanel.tsx) saat ini batch `beds[]` lewat save Location. Saat swap, adapter terjemahkan jadi panggilan bed sub-resource (create/update/delete eksplisit) → audit per-bed + anti mass-assignment.

### A.5 Event
- **Cache invalidation** (utama): tiap CUD → hapus `cache:master:ruangan:*` (FLOWS §12).
- **Audit** (FLOWS §13): CUD Org/Location/Bed → `AuditLog` → feed **Beranda Master** `RecentEditsPanel`.
- **Consumer notif (opsional):** perubahan ruangan/bed yang relevan Aplicares → enqueue **outbox BPJS** (`ref-sync`/Aplicares bed sync, BACKEND-BPJS) — BUKAN live call.
- Master jarang berubah → **tidak** butuh SSE board.

### A.6 Indexing
- `Organization`: `parentId`, `kode` unique, partial `deletedAt IS NULL`.
- `Location`: `organizationId`, `kode` unique, `locationType`, partial `deletedAt IS NULL`.
- `Bed`: `locationId`, `kode` unique.

### A.7 Failure modes
| Skenario | Penanganan |
|---|---|
| Hapus Unit yang masih punya sub-unit/ruangan | `FORBIDDEN_STATE` (409) — UI sembunyikan tombol hapus |
| Hapus Ruangan yang masih punya bed | `FORBIDDEN_STATE` (409) |
| Tambah bed melebihi kapasitas | `VALIDATION` (422) |
| Set `parentId` membentuk cycle | `VALIDATION` (422) — `hasDescendant` cek |
| Kode duplikat | `CONFLICT` (409) — unique DB → P2002 |
| Ubah identitas/parent RS root | `FORBIDDEN` (403) — root read-only |
| 2 admin edit unit sama | `version` guard → `CONFLICT_VERSION` (409) |

### A.8 Migrasi mock → DB (swap pattern)
- `RUANGAN_MOCK` (`AnyNode[]`) → **seed** ke `Organization`/`Location`/`Bed` (split union). Root (`rs-root`) → Organization `isRoot:true` di-seed dari `RS_PROFIL` (sampai Profil RS singleton ada).
- `RS_ROOT_ID`/`RS_PROFIL` placeholder → tetap import 1 file sampai schema `config.ProfilRS` dibangun.
- Frontend swap: [RuanganPage](../src/components/master/ruangan/RuanganPage.tsx) baca `RUANGAN_MOCK` → fetch `GET /api/v1/master/ruangan?view=tree` (TanStack Query). Form `onSave`/`onDelete` → POST/PATCH/DELETE. Helpers (`getChildren`/`getEffectiveAlamat`/dst) tetap dipakai client atas DTO tree.
- Alamat: perkaya dari 1 `kodeWilayah` → kode+nama per level (A.2.4); mock lama di-map di adapter.

### A.9 Task checklist (Sumber Daya — Unit & Ruangan)

#### SD0 — Schema & migration
- [x] Model `Organization` (self-ref) + `Location` (FK org) + `Bed` (FK loc) di [`prisma/schema/ruangan.prisma`](../prisma/schema/ruangan.prisma). Enum `OrgType`/`LocationType`/`LocationKelas`/`BedStatus`. (`master` sudah di `config.prisma` schemas[].) **`prisma validate` ✅.**
- [x] Alamat kode+nama wilayah (pola PasienAlamat) + `overrideAlamat` flag Location.
- [x] Index (A.6) + UNIQUE kode (Prisma). **Sisa:** CHECK kapasitas 1..50 + partial-unique `deleted_at IS NULL` = **SQL manual** di migration body.
- [x] Migration [`20260605120000_init_master_ruangan`](../prisma/migrations/20260605120000_init_master_ruangan/migration.sql) **applied** (via `db execute` + `migrate resolve --applied` — pola data-preserving, hindari reset drift) + CHECK `kapasitas 1..50`. Status `migrate status` ✅ up-to-date · client re-generated. **Sisa:** seed dari `RUANGAN_MOCK` (root `isRoot`) → SD5.

#### SD1 — DAL
- [x] [`ruanganDal`](../src/lib/dal/ruanganDal.ts) — tree reads (listOrganizations/listLocations+beds) + CRUD per entity + `countOrgChildren`/`countBedsOfLocation` (guards). `tx?` + soft-delete filter + version-guard update/delete.

#### SD2 — Schemas & errors
- [x] Zod input + DTO ([`src/lib/schemas/ruangan.ts`](../src/lib/schemas/ruangan.ts)) — vocab FE (mirror `OrganizationNode`/`LocationNode`/`BedSubRecord`); `tsc` ✅. Mapping FE⇄Prisma (dept-clin/kelas "—"/alamat/parentId) dikerjakan di Service (SD3).
- [x] Error: pakai katalog `appError` existing — `CONFLICT` (kode P2002), `FORBIDDEN_STATE` (punya anak/bed), `VALIDATION` (kapasitas/cycle), `FORBIDDEN` (root), `CONFLICT_VERSION` (stale).

#### SD3 — Service
- [x] [`ruanganService`](../src/lib/services/ruanganService.ts) — `getTree` (assemble array datar) · `createUnit`/`updateUnit`(anti-cycle + root guard + version)/`deleteUnit`(no-child) · `createRuangan`/`updateRuangan`(kapasitas≥bed + alamat override)/`deleteRuangan`(no-bed) · `addBed`/`updateBed`/`deleteBed`(kapasitas). Mapping vocab FE⇄DB (dept-clin/kelas "—"/alamat/parentId). **Smoke live ✅** (createUnit map · kelas map · over-capacity · getTree datar+bed nested · guard hapus · root read-only · anti-cycle).
- [ ] **Sisa:** cache-aside Redis (invalidate getTree saat CUD) + audit emit — infra GAP-B belum ada (TODO di kode).

#### SD4 — API
- [x] 8 route `/api/v1/master/{unit,ruangan,bed}/*` (tipis, RBAC `master.ruangan` + handleError + envelope): GET `ruangan?view=tree` · POST `unit`·`ruangan`·`ruangan/:id/bed` · PATCH/DELETE `unit/:id`·`ruangan/:id`·`bed/:bedId`. `tsc` ✅. **Sisa:** enforce Idempotency-Key (header sudah dibaca route(); store GAP-D belum ada).

#### SD5 — Seed & frontend swap
- [ ] `seed.ts` segmen ruangan. Swap `RuanganPage`/form ke fetch API. Verifikasi tree + CRUD + delete-guard tampil benar.

#### SD6 — Tests
- [ ] Unit Service: anti-cycle, guard hapus (no-child/no-bed), kapasitas, root read-only, version conflict, inherit alamat, kode duplikat→CONFLICT.
- [ ] Integration DAL (Testcontainers): tree assemble, count guards, soft-delete filter, unique constraint.

### A.10 Keputusan (terbuka / terkunci)
1. **RS root = baris `Organization` nyata** (`isRoot:true`, `parentId:null`), di-**seed/sync dari Profil RS singleton** (schema `config`, belum dibangun). Field inti **read-only** di modul ini (cermin `RSRootBanner` FE). *(Terkunci — jaga FK integrity sub-unit.)*
2. **Bed status master ≠ operasional.** `active/inactive/suspended` = master; `Tersedia/Terisi` = workflow klinis admisi/pulang (CLAUDE.md). Master **tidak** simpan okupansi. *(Terkunci.)*
3. **3 tabel ber-FK**, bukan 1 tabel union `AnyNode`. Tree direkonstruksi di Service. *(Terkunci — selaras FHIR R4 + relasional bersih.)*
4. **Kode ruangan BPJS** (Aplicares/V-Claim) **tidak** di tabel Location → di Mapping Hub `penjamin-ruangan` (`MappingRuanganRecord`) + adapter BPJS. Location simpan kode RS internal saja. *(Terkunci, konsisten `project_wilayah_strategy` & scope-split master.)*
5. **Bed sub-resource eksplisit** (bukan replace-set via Location PATCH) — auditable per-bed, anti mass-assignment. UI batch di-adaptasi saat swap. *(Rekomendasi — final saat implementasi SD4.)*
6. **Alamat diperkaya** ke kode+nama per level (pola PasienAlamat) — lebih kaya dari mock (1 `kodeWilayah`). *(Terkunci — butuh FHIR `administrativeCode`.)*
