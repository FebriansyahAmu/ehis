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
> **Status:** Sub-grup **Pegawai/Pengguna ✅** + **Unit & Ruangan ✅** (SD0–SD5 ter-implementasi & wired + SSR hybrid; **SD6 tests** 📋) · **Dokter 🚧** (DK0–DK4 ✅ schema+contracts+DAL+Service+API, smoke live OK; **DK5 FE swap · DK6 tests** 📋 → §B). Lihat [TODOS_BACKEND.md](../TODOS_BACKEND.md#b11-sumber-daya).

---

## 0. Peta grup master (urut frontend `/ehis-master`)

Master FE = 26 sub-master + 8 mapping + Beranda (lihat [CLAUDE.md](../CLAUDE.md) module map). Backend dibangun **per grup**, **1 file `BACKEND-MASTER-<GRUP>.md` per grup**, schema mock 1:1 → swap import:

| Grup | File workflow | Sub-master | Status |
|---|---|---|---|
| **Sumber Daya** | **BACKEND-MASTER-SUMBER-DAYA** (ini) | Pegawai · Pengguna · **Unit & Ruangan** · Dokter | Pegawai/Pengguna ✅ · Unit&Ruangan ✅ (SD0–5; SD6 tests 📋) · Dokter 🚧 (DK0–4 ✅; DK5–6 📋) |
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
- [x] Migration [`20260605120000_init_master_ruangan`](../prisma/migrations/20260605120000_init_master_ruangan/migration.sql) **applied** (via `db execute` + `migrate resolve --applied` — pola data-preserving, hindari reset drift) + CHECK `kapasitas 1..50`. Status `migrate status` ✅ up-to-date · client re-generated. Seed **clean root** (RS Induk saja) ✅ → SD5.

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

#### SD5 — Seed & frontend swap ✅
- [x] **Frontend wired** ke API: [`src/lib/api/ruangan.ts`](../src/lib/api/ruangan.ts) (getTree + CUD unit/ruangan/bed) + [`RuanganPage`](../src/components/master/ruangan/RuanganPage.tsx). **SSR hybrid** (first paint via Service langsung di [`page.tsx`](../src/app/ehis-master/ruangan/page.tsx), pola API-RULES §6.1; CUD client). Forms batch-save → RuanganPage orkestrasi PATCH + **rekonsiliasi bed granular** (delete→patch ruangan→update→add, capacity-safe). Optimistic concurrency (`version`) + `tsc` ✅.
- [x] **UX**: toast sukses/gagal (CUD), **ConfirmDialog** destruktif (ganti `confirm()`, palet rose/slate — invoke skill frontend-design), **kode auto** `<PREFIX><YYMM><NNN>` (Unit `UN` · Ruangan `R` · Bed `BD`; editable, unik dijaga server).
- [x] **Seed = clean root** ([`prisma/seed_ruangan_clean.sql`](../prisma/seed_ruangan_clean.sql)): TRUNCATE 3 tabel + insert HANYA RS Induk (idempotent) → uji dari keadaan bersih. **Bukan** seed penuh `RUANGAN_MOCK` (mock masih dipakai BPJS Aplicares + Mapping Hub → migrasi terpisah, lihat [TECH_DEBT](../TECH_DEBT.md)).

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

---

## B. Sub-grup **Sumber Daya — Dokter (Practitioner)**

> **Frontend referensi:** [/ehis-master/dokter](../src/app/ehis-master/dokter/page.tsx) — split-pane (list + detail). Komponen: [DokterPage](../src/components/master/dokter/DokterPage.tsx) · [DokterList](../src/components/master/dokter/DokterList.tsx) · [DokterDetail](../src/components/master/dokter/DokterDetail.tsx) (2 tab: Profil & Lisensi · Jadwal Praktik) · [ProfilLisensiTab](../src/components/master/dokter/sections/ProfilLisensiTab.tsx) · [JadwalTab](../src/components/master/dokter/sections/JadwalTab.tsx).
> **Mock target:** [dokterShared.ts](../src/components/master/dokter/dokterShared.ts) `DOKTER_MOCK: DokterRecord[]` + `SpesialisCode`/`SPESIALIS_LABEL`/`POLI_LIST`/`JadwalSlot`.
> **Keputusan arsitektur (CLAUDE.md · pegawai.prisma):** Kredensial klinis (STR/SIP/spesialis) **TIDAK** di `Pegawai` → **master Dokter via `practitionerId`**. Penugasan poli/unit → **Mapping Hub** (`sdm`). Jadwal praktik → **Jadwal Dokter** (single source HFIS, dikonsumsi Antrean/RJ). FHIR `Practitioner` adapter → modul `/ehis-fhir`.

### B.0 ⚠️ Gap analysis — relasi **Pengguna → Pegawai → Dokter**

Alur identitas yang **disepakati** (sesuai arahan: "ambil semua datanya lewat pengguna dulu, lalu lengkapi di Dokter & Nakes beberapa data"):

```
Pengguna (wizard Tambah)  →  master.Pegawai          →  master.Dokter (ekstensi klinis 1:1)
  Step1 Data Pegawai         identitas + profesi          STR/SIP/spesialis/kualifikasi
  (NIK·nama·JK·TTL·email)    isDokter diturunkan          status praktik · IHS Practitioner
                             practitionerId (pointer) ←───┘ (di-set saat row Dokter dibuat)
```

`isDokter` sudah dihitung di [`pegawaiService`](../src/lib/services/pegawaiService.ts): `practitionerId != null` **ATAU** `profesi ∈ {Dokter, Dokter Gigi, Dokter Spesialis}`. Jadi begitu pegawai berprofesi dokter dibuat lewat Pengguna, ia **otomatis kandidat** baris Dokter.

**Gap yang harus ditutup saat backend Dokter dibangun:**

| # | Gap (kondisi FE/mock sekarang) | Target |
|---|---|---|
| G1 | **Tak ada model `Dokter`/`Practitioner`** di schema `master` — hanya `Pegawai.practitionerId String?` placeholder. | Tambah model `Dokter` 1:1 `Pegawai` (FK `pegawaiId @unique`). |
| G2 | **`DokterRecord` (mock) menduplikasi identitas Pegawai** — `nik · nama · tanggalLahir · jenisKelamin · email · telp` semuanya **sudah** ada di `master.Pegawai`. | Identitas **TIDAK** disimpan di Dokter → di-read via **join Pegawai** (DTO gabungan). Dokter hanya **own** kredensial klinis. |
| G3 | **`DokterPage.handleAdd` membuat dokter "from scratch"** (input NIK/nama sendiri) — bertentangan dgn alur identitas-dari-Pegawai. | Ganti jadi pola **provisioning** (cermin "Buatkan Akun" Pengguna): pilih **pegawai profesi-dokter yang belum punya baris Dokter** → lengkapi STR/SIP/spesialis. Daftarnya = `GET /dokter/tanpa-profil` (mereka SUDAH dokter, hanya belum punya profil — bukan "kandidat"). |
| G4 | **`ProfilLisensiTab` meng-edit NIK/nama/JK/TTL** (field identitas). | Field identitas → **read-only** di sini (snapshot dari Pegawai); diubah di **Ubah Data Pegawai**. Dokter-detail hanya edit kredensial klinis + status praktik. |
| G5 | **`poliAssignment` ada di `DokterRecord`** (mock) walau UI sudah pasang `MappingSourceBadge`. | Field **dihapus** dari model Dokter — sumber kebenaran = Mapping Hub `sdm` (FK ke Unit/Poli dari sana). |
| G6 | **`jadwal: JadwalSlot[]` di `DokterRecord`** + tab "Jadwal Praktik" per-dokter. | Jadwal praktik = **Jadwal Dokter** (HFIS single source). Promote ke sana (lihat [TECH_DEBT](../TECH_DEBT.md) "Promote Jadwal Praktik"). Dokter model **tidak** own jadwal. |
| G7 | **`status` (Aktif/Cuti/Non_Aktif)** kabur vs `Pegawai.isActive` & status akun. | `statusPraktik` = **ketersediaan klinis** (Cuti dst.), DISTINCT dari `Pegawai.isActive` (kepegawaian) & `auth.User.status` (akun). 3 status terpisah, jangan digabung. |
| G8 | Tak ada penanganan **masa berlaku STR/SIP**. | `strBerlakuHingga`/`sipBerlakuHingga` (Date) → kandidat alert "lisensi mau kedaluwarsa" (Beranda Master / dashboard). |
| G9 | Tautan **FHIR Practitioner** belum jelas. | `ihsPractitionerId` (SatuSehat) di Dokter; **anchor = NIK Pegawai** (enc+hash). Sync via `/ehis-fhir` (bukan di sini). |

**Konsumen `practitionerId` (jangan rusak saat refactor):** auth provisioning ([userService](../src/lib/services/userService.ts) — "user dokter?"), `encounter.Kunjungan.dpjpId → master Dokter via Pegawai.practitionerId` ([encounter.prisma](../prisma/schema/encounter.prisma):89), nama DPJP di board RJ/IGD ([TECH_DEBT](../TECH_DEBT.md) "Nama DPJP").

### B.1 Scope domain

**Dokter OWNS (kredensial klinis — ekstensi 1:1 Pegawai):**
- Spesialis (enum) + kualifikasi (auto-fill dari spesialis, override-able).
- STR (No. KKI + masa berlaku) · SIP (No. DPMPTSP + masa berlaku).
- Status praktik (`Aktif`/`Cuti`/`Non_Aktif`) — ketersediaan klinis.
- `ihsPractitionerId` (SatuSehat) — tautan FHIR Practitioner.

**TIDAK owns (delegasi/consumer):**
- **Identitas** (NIK·nama·gelar·JK·TTL·email·telp) → `master.Pegawai` (read via join; edit di Ubah Data Pegawai). *(G2/G4)*
- **Penugasan poli/unit klinis** → Mapping Hub `sdm` (`DokterRecord.poliAssignment` dihapus). *(G5)*
- **Jadwal praktik** → master **Jadwal Dokter** (HFIS). *(G6)*

### B.2 Entity model (schema `master`)

#### `Dokter` (Practitioner) — ekstensi klinis 1:1 `Pegawai`
| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | = nilai yang disimpan di `Pegawai.practitionerId` |
| `pegawaiId` | FK→Pegawai `@unique` (`Restrict`) | **1:1 anchor** — identitas dibaca dari sini (idx unik) |
| `spesialisKode` | enum `SpesialisKedokteran` | `Umum`\|`SpJP`\|`SpPD`\|… (mirror `SpesialisCode` FE) |
| `kualifikasi` | string nullable | auto-fill dari spesialis, override-able |
| `noStr` | string nullable | No. STR (KKI) |
| `strBerlakuHingga` | Date nullable | masa berlaku STR *(G8 alert)* |
| `noSip` | string nullable | No. SIP (DPMPTSP) — RS bisa >1 SIP (fase later: tabel SIP 1:N) |
| `sipBerlakuHingga` | Date nullable | masa berlaku SIP |
| `statusPraktik` | enum `StatusPraktik` `@default(Aktif)` | `Aktif`\|`Cuti`\|`Non_Aktif` — ketersediaan klinis *(G7)* |
| `ihsPractitionerId` | string nullable | SatuSehat Practitioner IHS *(G9, sync di /ehis-fhir)* |
| `version` · `createdAt` · `updatedAt` · `deletedAt` | — | optimistic concurrency + soft-delete |

> **NB:** **tak ada** kolom identitas di sini (G2). DTO detail = `Dokter` ⋈ `Pegawai` (namaTampil, nikMasked, JK, TTL, email, telp dari Pegawai).

**Relasi 1:1 (keputusan B.10 #1):** `Dokter.pegawaiId @unique` = sisi pemilik FK. `Pegawai.practitionerId` tetap sebagai **pointer denormalized** (= `Dokter.id`), di-set **dalam transaksi yang sama** saat baris Dokter dibuat — dipakai untuk fast-path "isDokter" + FHIR anchor + DPJP join. Saat model ini live, `Pegawai.practitionerId` dijadikan **FK→Dokter.id** (sekarang plain uuid; pegawai.prisma:89).

**Enum baru** (Prisma native, `@@schema("master")`): `SpesialisKedokteran` (mirror `SpesialisCode`) · `StatusPraktik`.

### B.3 Lifecycle & invariants
| Invariant | Penegakan |
|---|---|
| 1 Pegawai ⇒ **paling banyak 1** Dokter | **UNIQUE** `pegawaiId` (DB) |
| Baris Dokter hanya untuk pegawai **profesi dokter** | **Service guard** (cek `profesi ∈ DOKTER_PROFESI`) → `VALIDATION` |
| Buat Dokter ⇒ set `Pegawai.practitionerId` (& sebaliknya saat hapus) | **Service, 1 transaksi** (konsistensi pointer) |
| STR/SIP unik bila diisi | **partial UNIQUE** (`WHERE x IS NOT NULL`) — SQL manual di migration |
| Hapus = soft-delete + **unset** `practitionerId` | **Service** — jangan hard-delete (referensi DPJP historis) |
| Edit identitas dari sini | **DITOLAK** — field read-only, arahkan ke Ubah Data Pegawai *(G4)* |
| 2 admin edit dokter sama | **`version`** guard → `CONFLICT_VERSION` |

### B.4 Layer breakdown
- **DAL** `lib/dal/dokterDal.ts` — `listDokter()` (join Pegawai, filter `isDokter`/status/search) · `findDokter(id)` (⋈ Pegawai) · `findByPegawai(pegawaiId)` · `listTanpaProfil()` (dokter tanpa profil, G3) · `createDokter(tx)` · `updateDokter(version-guard)` · `softDeleteDokter`. Terima `tx?`; soft-delete filter default.
- **Service** `lib/services/dokterService.ts` — `listDokter(actor)` (DTO gabungan) · `getDokter(id, actor)` · `listTanpaProfil(actor)` (pegawai dokter belum punya profil) · `createDokter(input, actor)` (**transaksi**: insert Dokter + set `Pegawai.practitionerId`; guard profesi-dokter) · `updateDokter(id, input, actor)` (kredensial only + version) · `deleteDokter(id, actor)` (soft + unset pointer). Auto-fill `kualifikasi` dari `spesialisKode` bila kosong. `clock`/`genId` inject. Cache-aside `cache:master:dokter:*`.
- **Schemas/DTO** `lib/schemas/dokter.ts` (Zod) — `CreateDokterInput` (`pegawaiId` uuid + kredensial) · `UpdateDokterInput` (kredensial + `expectedVersion`) · `ListQuery` (q/status/cursor). DTO `DokterDTO` = kredensial **+ identitas dari Pegawai** (mirror tipe FE `DokterRecord` minus poli/jadwal → zero-refactor list/detail).
- **API** `app/api/v1/master/dokter/*` (Route tipis · RBAC `master.dokter` · handleError · envelope):

| Method | Path | Service |
|---|---|---|
| `GET` | `/api/v1/master/dokter` | `listDokter` (cache · join Pegawai · filter status/q) |
| `GET` | `/api/v1/master/dokter/:id` | `getDokter` (⋈ Pegawai) |
| `GET` | `/api/v1/master/dokter/tanpa-profil` | `listTanpaProfil` (pegawai dokter tanpa profil — G3) |
| `POST` | `/api/v1/master/dokter` | `createDokter` (body `pegawaiId` + kredensial; tx set pointer) |
| `PATCH` | `/api/v1/master/dokter/:id` | `updateDokter` (version · kredensial only) |
| `DELETE` | `/api/v1/master/dokter/:id` | `deleteDokter` (soft + unset `practitionerId`) |

> RBAC: `master.dokter:read` (staf ber-izin) · `:create/update/delete` (admin master). Mutasi wajib **Idempotency-Key** (FLOWS §7.4). Pola Route: `auth→rbac→zod→service→envelope→handleError`.

### B.5 Event
- **Cache invalidation:** CUD → hapus `cache:master:dokter:*` **dan** `cache:master:pegawai:*` (karena `practitionerId`/`isDokter` ikut berubah).
- **Audit** (FLOWS §13): CUD → `AuditLog` → feed Beranda Master `RecentEditsPanel`.
- **Alert lisensi (opsional, G8):** job harian cek `str/sipBerlakuHingga` mendekati kedaluwarsa → notif Beranda Master.
- **FHIR (G9):** perubahan dokter relevan Practitioner → enqueue outbox `/ehis-fhir` (BUKAN live).

### B.6 Indexing
- `Dokter`: `pegawaiId` unique, `spesialisKode`, `statusPraktik`, partial `deletedAt IS NULL`; partial-unique `noStr`/`noSip` (`WHERE NOT NULL`).

### B.7 Failure modes
| Skenario | Penanganan |
|---|---|
| Buat Dokter untuk pegawai non-dokter | `VALIDATION` (422) — guard profesi |
| Buat Dokter untuk pegawai yang **sudah** punya profil | `CONFLICT` (409) — unique `pegawaiId` (P2002) |
| STR/SIP duplikat | `CONFLICT` (409) — partial unique |
| Edit field identitas dari endpoint Dokter | `VALIDATION` (422) — field tak diterima skema (arahkan ke Pegawai) |
| 2 admin edit dokter sama | `version` guard → `CONFLICT_VERSION` (409) |
| Hapus dokter yang jadi DPJP kunjungan aktif | soft-delete OK (histori aman); cegah assignment baru via Mapping Hub/`statusPraktik` |

### B.8 Migrasi mock → DB (swap pattern)
- `DOKTER_MOCK` → **seed** `Dokter` **dengan menautkan ke Pegawai existing** by NIK/nama (bukan buat identitas baru). Pegawai dokter di `PEGAWAI_MOCK` (peg-002/008/009/012…) ⇒ baris Dokter; set `practitionerId`.
- **Buang dari `DokterRecord`** saat tipe diselaraskan ke DTO: `poliAssignment` (→Mapping Hub) · `jadwal` (→Jadwal Dokter) · identitas (→join Pegawai, jadi read-only).
- Frontend swap: [DokterPage](../src/components/master/dokter/DokterPage.tsx) baca `DOKTER_MOCK` → `GET /api/v1/master/dokter`. `handleAdd` (G3) → modal **provisioning** dari `GET …/tanpa-profil`. `handleSave`/`handleDelete` → PATCH/DELETE. `ProfilLisensiTab` identitas jadi read-only (G4). **SSR hybrid** sama seperti Pengguna/Ruangan (API-RULES §6.1).

### B.9 Task checklist (Sumber Daya — Dokter)

#### DK0 — Schema & migration ✅
- [x] Model `Dokter` (`pegawaiId @unique` FK→Pegawai, `onDelete: Restrict`) + enum `SpesialisKedokteran`/`StatusPraktik` di [`prisma/schema/dokter.prisma`](../prisma/schema/dokter.prisma) + back-relation `Pegawai.dokter Dokter?`. **`prisma validate` ✅.** `Pegawai.practitionerId` **tetap plain uuid** sebagai pointer denormalized (di-maintain Service) — **bukan** FK kedua (hindari circular FK + migrasi data-preserving; B.10 #1).
- [x] `noStr`/`noSip` `@unique` pada kolom **NULLABLE** → Postgres anggap NULL distinct (uniqueness hanya saat terisi) = setara partial-unique **tanpa SQL manual / drift**.
- [x] Migration [`20260606120000_init_master_dokter`](../prisma/migrations/20260606120000_init_master_dokter/migration.sql) **applied** (pola `db execute` + `migrate resolve --applied` — data-preserving, hindari reset drift). `migrate diff` **empty** + `migrate status` up-to-date · client re-generated.

#### DK1 — DAL ✅
- [x] [`dokterDal`](../src/lib/dal/dokterDal.ts) — `list` (join Pegawai, search nama/NIP/STR/SIP, filter spesialis/status, cursor) · `findById` · `findByPegawai` (uniqueness) · `findPegawai` (guard profesi) · `listTanpaProfil` (anti-join `dokter: { is: null }`) · `create(tx)` · `updateWithVersion` · `softDeleteWithVersion` · `linkPegawai`/`unlinkPegawai` (pointer, no version bump). `tx?` + soft-delete filter.

#### DK2 — Schemas & errors ✅
- [x] Zod [`src/lib/schemas/dokter.ts`](../src/lib/schemas/dokter.ts): `CreateDokterInput` (pegawaiId + kredensial) · `UpdateDokterInput` (kredensial + version, **tanpa identitas** — G4) · `ListQuery` · `DeleteQuery`. DTO `DokterListItemDTO`/`DokterDTO` (kredensial ⋈ identitas Pegawai, NIK masked, `str/sipExpired` G8) + `DokterTanpaProfilDTO`. `SPESIALIS_LABEL` server-side. Katalog `appError` existing. `tsc` ✅.

#### DK3 — Service ✅
- [x] [`dokterService`](../src/lib/services/dokterService.ts) (factory `makeDokterService({clock,dal})`) — `listDokter`/`getDokter` (DTO gabungan, mask NIK, expired via clock) · `listTanpaProfil` · `createDokter` (**transaksi**: guard profesi-dokter + uniqueness 1:1 → create → `linkPegawai` set pointer; auto-fill kualifikasi dari spesialis) · `updateDokter` (version guard, kredensial only, tanggal nullable patch) · `deleteDokter` (soft + `unlinkPegawai`). **Smoke live ✅** (provisioning dr Olivia Kirana Sp.OG dari daftar tanpa-profil → join identitas · auto-fill · pointer set · getList konsisten · daftar berkurang · guard duplikat→CONFLICT · cleanup). **Sisa:** cache-aside + audit menunggu infra GAP-B (sama seperti Ruangan SD3).

#### DK4 — API ✅
- [x] Route tipis `/api/v1/master/dokter/*` (pola `route()`: auth→RBAC `master.dokter`→Zod→envelope→handleError): GET `dokter?...` (list) · POST `dokter` (provisioning) · GET `dokter/tanpa-profil` ([tanpa-profil/route.ts](../src/app/api/v1/master/dokter/tanpa-profil/route.ts) — segmen statis diutamakan di atas `[id]`) · GET/PATCH/DELETE `dokter/:id` ([[id]/route.ts](../src/app/api/v1/master/dokter/[id]/route.ts)). `tsc` ✅. **Sisa:** enforce Idempotency-Key saat store GAP-D ada. (Catatan: dev server perlu **restart** sekali agar Prisma client singleton memuat delegate `dokter` baru.)

#### DK5 — Seed & frontend swap
- [ ] Seed `Dokter` tertaut Pegawai existing (by NIK). Frontend wired: `src/lib/api/dokter.ts` + DokterPage (SSR hybrid). **Refactor FE:** modal provisioning dari daftar dokter tanpa-profil (G3) · identitas read-only (G4) · buang `poliAssignment`/`jadwal` dari tipe (G5/G6).

#### DK6 — Tests
- [ ] Unit Service: guard profesi-dokter, unique pegawai (1:1), pointer set/unset transaksional, version conflict, auto-fill kualifikasi, filter tanpa-profil.
- [ ] Integration DAL (Testcontainers): join Pegawai, partial-unique STR/SIP, soft-delete filter.

### B.10 Keputusan (terbuka / terkunci)
1. **Dokter = ekstensi 1:1 Pegawai** (`pegawaiId @unique`), **bukan** entitas identitas mandiri. Identitas di-read via join; `Pegawai.practitionerId` = pointer denormalized di-maintain transaksional. *(Terkunci — sesuai arahan "identitas dari Pengguna, kredensial dilengkapi di Dokter" + pegawai.prisma:8/89.)*
2. **3 status terpisah jangan digabung:** `auth.User.status` (akun) · `Pegawai.isActive` (kepegawaian) · `Dokter.statusPraktik` (ketersediaan klinis). *(Terkunci — G7.)*
3. **poliAssignment & jadwal BUKAN milik Dokter** → Mapping Hub `sdm` (poli/unit) & master Jadwal Dokter (HFIS). *(Terkunci — keputusan arsitektur CLAUDE.md 2026-05-22 + single-source HFIS.)*
4. **Tambah Dokter = provisioning** (pilih pegawai dokter existing), **bukan** create from scratch. *(Terkunci — G3, cermin "Buatkan Akun" Pengguna.)*
5. **Multi-SIP** (RS bisa terbitkan >1 SIP per dokter) → mulai single kolom; **fase later** tabel `DokterSip` 1:N bila dibutuhkan. *(Terbuka.)*
6. **FHIR Practitioner** sync (NIK lookup, `ihsPractitionerId`) → modul `/ehis-fhir`, bukan di sini. *(Terkunci — konsisten strategi FHIR master.)*
