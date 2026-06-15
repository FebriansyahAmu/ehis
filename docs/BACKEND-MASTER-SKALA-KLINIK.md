# EHIS Backend — Master Data: **Grup Skala Klinis** (schema `master`)

> **Data referensi klinis** (bukan transaksional): instrumen penilaian & klasifikasi yang **dipakai sebagai panduan** saat asesmen/triase, lalu **hasilnya** dicatat di domain klinis (`medicalrecord`). Master = sumber kebenaran **statis**, jarang berubah, banyak dibaca → kandidat utama **cache** (FLOWS §12).
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** (core rules · tech · best practices). Bila konflik, FLOWS menang.
> **1 file per grup pengerjaan** master (`BACKEND-MASTER-<GRUP>.md`). File ini = grup **Skala Klinis** (Skala Risiko · Skala Umum · Skala Penyakit · **Triase IGD**). Peta seluruh grup → [BACKEND-MASTER-SUMBER-DAYA §0](BACKEND-MASTER-SUMBER-DAYA.md#0-peta-grup-master-urut-frontend-ehis-master).
> **Dokumen domain terkait:** [TODO-CLINICAL.md](../TODO-CLINICAL.md) (domain `medicalrecord.Triase` — **konsumen** matrix ini) · [BACKEND-AUTH](BACKEND-AUTH.md) (RBAC) · [API-RULES](API-RULES.md) (resep endpoint).
> **Terkait:** [CLAUDE.md](../CLAUDE.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md).
>
> **Stack:** PostgreSQL · Prisma (`@@schema("master")`) · layered **Route→Service→DAL→Prisma** · Redis cache-aside · Auth.js RBAC.
> **Status:** **Triase IGD ✅ backend + FE wired (2026-06-08)** — SK0 RBAC + TR1–TR8 selesai (schema 4 tabel + migration + seed DEFAULT-IGD · Zod · DAL · Service single-default · 7 endpoint · client · master page swap ke API · klinis CriteriaTable fetch default) · **TR8b** banyak kriteria/sel · **TR8c** riset kriteria (ESI/ATS/CTAS/MTS/PMK) + `tipeNilai`/`satuan` + 4 parameter best-practice → DB enriched **12 param · 131 sel** (§A.10). Sisa: **TR9** keputusan vokabuler level (§A.8.1) · **TR10** tests. · **Skala Risiko ✅ backend + FE wired (2026-06-15)** — `master.SkalaInstrument` (kategori "Risiko") + counter kode `SR-NNNN` + RBAC `master.skala` + 4 endpoint CRUD + seed 5 instrumen (Barthel/Morse/Braden/NRS/MUST) + master page swap ke API (kode auto, DiscardDialog). **Skala Umum/Penyakit 📋** (reuse `SkalaInstrument`, scope SU/SP — §B).

---

## 0. Cakupan grup & dua bentuk data

Grup **Skala Klinis** (`/ehis-master` → menu "Skala Klinis", [navigation.ts:315](../src/lib/navigation.ts#L315)) memuat **4 sub-master** dengan **2 bentuk data berbeda** — penting dibedakan karena pemodelan DB-nya tidak sama:

| Sub-master | Route FE | Bentuk data | Mock | Komponen |
|---|---|---|---|---|
| **Triase IGD** | `/ehis-master/triase-igd` | **Matrix** `level × parameter` (bukan skoring) | [triaseMock.ts](../src/lib/master/triaseMock.ts) | [TriaseIGDPage](../src/components/master/triase-igd/TriaseIGDPage.tsx) |
| Skala Risiko | `/ehis-master/skala-risiko` | **Skoring** (items × opsi skor + interpretasi) | [skalaRisikoMock.ts](../src/lib/master/skalaRisikoMock.ts) | [SkalaRisikoPage](../src/components/master/skala-risiko/SkalaRisikoPage.tsx) |
| Skala Umum | `/ehis-master/skala-umum` | **Skoring** | [skalaUmumMock.ts](../src/lib/master/skalaUmumMock.ts) | [SkalaUmumPage](../src/components/master/skala-umum/SkalaUmumPage.tsx) |
| Skala Penyakit | `/ehis-master/skala-penyakit` | **Skoring** | [skalaPenyakitMock.ts](../src/lib/master/skalaPenyakitMock.ts) | [SkalaPenyakitPage](../src/components/master/skala-penyakit/SkalaPenyakitPage.tsx) |

- **Bentuk skoring** (Risiko/Umum/Penyakit) berbagi `SkalaRecord` ([skalaCommon.ts](../src/lib/master/skalaCommon.ts)): `items[]` (tiap item punya `options[]` ber-skor) + `interpretasi[]` (rentang skor → label + tindakan). Morse/Braden/Barthel/NEWS2/NYHA/Killip/dst. → **§B** (placeholder, pemodelan terpisah).
- **Bentuk matrix** (Triase) **tidak** ber-skor; ia adalah tabel keputusan: tiap **level urgensi** (kolom) × **parameter klinis** (baris) → **deskripsi kriteria** (sel). → **§A** (fokus dokumen ini, sesuai permintaan).

> **Jangan paksakan 1 schema** untuk dua bentuk ini. Triase = `Protocol → Level[] / Parameter[] → Criteria[]`; Skala skoring = `Skala → Item[] → Option[]` + `Interpretasi[]`. Keduanya hidup di schema `master`, file DAL/Service terpisah.

---

## A. Sub-grup **Skala Klinis — Triase IGD**

> **Frontend referensi:** [/ehis-master/triase-igd](../src/app/ehis-master/triase-igd/page.tsx) → [TriaseIGDPage](../src/components/master/triase-igd/TriaseIGDPage.tsx) · tab [IdentitasTab](../src/components/master/triase-igd/tabs/IdentitasTab.tsx) (identitas protokol + status) · tab [MatrixTab](../src/components/master/triase-igd/tabs/MatrixTab.tsx) (editor inline level × parameter).
> **Mock target:** [triaseMock.ts](../src/lib/master/triaseMock.ts) — `TRIASE_MOCK: TriaseRecord[]` (1 protokol default), tipe `TriaseRecord`/`TriaseLevel`/`TriaseParameter`, palette `TRIASE_TONE_CFG`, validator `isTriaseValid`.
> **Standar klinis:** ESI 5-level (ENA 2020) + DOA · **PMK 47/2018** (Klasifikasi & Standar Pelayanan IGD RS di Indonesia).
> **Konsumen utama:** domain klinis **`medicalrecord.Triase`** — tab Triase IGD menampilkan **"Tabel Kriteria Triase"** sebagai panduan keputusan perawat (lihat A.8).

### A.1 Scope domain

**Triase IGD (master) OWNS:**
- **Protokol triase** (`TriaseRecord`): identitas (`kode`, `nama`, `deskripsi`, `protokol` = referensi standar) + `status` (Aktif/Non-Aktif).
- **Level urgensi** (kolom matrix): `kode` (mis. `resusitasi`/`emergency`/`urgent`/`lessUrgent`/`nonUrgent`/`doa`), `label`, `tone` (warna chip/header), `responsTime` ("Segera"/"< 10 menit"), `prioritas` (1 = tertinggi), `deskripsi`.
- **Parameter kriteria** (baris matrix): `kode`, `label` (Airway · Breathing/RR · Sirkulasi/TD · Nadi · Kesadaran(GCS) · Skala Nyeri(VAS) · Waktu Respons · Contoh Kasus).
- **Sel kriteria** (matrix cell): deskripsi klinis per (parameter × level). Mock = `parameter.values: Record<levelKode, string>`.

**TIDAK owns (delegasi/konsumen):**
- **Hasil triase pasien** (level final yang dipilih, TTV saat triase, perawat penilai, waktu) → **`medicalrecord.Triase`** (append-only, lihat [TODO-CLINICAL.md](../TODO-CLINICAL.md)). Master hanya menyediakan **panduan**; tak menyimpan kejadian pasien.
- **Pointer level di kunjungan** (`encounter.Kunjungan.triaseLevel` — cache int 1..4 untuk board IGD "Belum Triase") → domain `encounter`, di-set oleh service `medicalrecord.Triase`.
- **Skoring TTV / NEWS2 / GCS** → Skala Umum (§B) + `medicalrecord.Observation` (domain berikutnya).

### A.2 Entity model (schema `master`) — **rekomendasi**

> Mock menyimpan matrix sebagai `parameter.values: Record<levelKode,string>` (peta string→string). **Target DB menormalkan** jadi tabel relasional (selaras pola SUMBER-DAYA yang memecah `AnyNode` union → 3 tabel). Matrix UI direkonstruksi di Service (read `protocol` lengkap → nested DTO 1:1 dengan `TriaseRecord`).

#### `TriaseProtocol` — protokol triase
| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | |
| `kode` | string `@unique` | mis. `DEFAULT-IGD`/`ESI`/`ATS` (uppercase) |
| `nama` | string | |
| `deskripsi` | text nullable | |
| `protokol` | string nullable | referensi standar (free-text) |
| `status` | enum `TriaseStatus` | `Aktif`\|`Non_Aktif` |
| `isDefault` | boolean `@default(false)` | protokol yang dikonsumsi IGD TriaseTab (lihat invariant A.3) |
| `version` · `createdAt` · `updatedAt` · `deletedAt` | — | optimistic concurrency + soft-delete |

#### `TriaseLevel` — kolom (urgensi)
| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | |
| `protocolId` | FK→TriaseProtocol (`Cascade`) | **idx** |
| `kode` | string | mis. `resusitasi` (slug) — **unik per protokol** |
| `label` | string | "Resusitasi" |
| `tone` | enum `TriaseTone` | `red_dark`\|`rose`\|`amber`\|`emerald`\|`sky`\|`slate`\|`violet` |
| `responsTime` | string nullable | "Segera" / "< 10 menit" |
| `prioritas` | int | 1 = tertinggi (CHECK ≥ 1) |
| `deskripsi` | text nullable | ringkasan klinis |
| `urutan` | int | urutan kolom (drag/move di MatrixTab) |
| — | — | `@@unique([protocolId, kode])` |

#### `TriaseParameter` — baris (kriteria)
| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | |
| `protocolId` | FK→TriaseProtocol (`Cascade`) | **idx** |
| `kode` | string | mis. `airway` (slug) — **unik per protokol** |
| `label` | string | "Airway" |
| `urutan` | int | urutan baris |
| `tipeNilai` | string `@default("Kategori")` `@map("tipe_nilai")` | hint tipe nilai (FE `TriaseValueType`): `Kategori`/`Numerik`/`Teks` — **fondasi auto-klasifikasi level dari TTV**. String (hint presentasional, bukan enum) |
| `satuan` | string? | satuan ukur parameter Numerik (`×/mnt`, `mmHg`, `%`, `°C`) |
| — | — | `@@unique([protocolId, kode])` |

#### `TriaseCriteria` — item kriteria dalam sel (parameter × level)
> **Update 2026-06-08:** satu sel BOLEH punya **banyak** item kriteria → `@@unique([parameterId, levelId])` **dihapus**; `urutan` menjaga urutan item. FE `parameter.values` = **`Record<levelKode, string[]>`** (daftar per sel).

| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK | |
| `parameterId` | FK→TriaseParameter (`Cascade`) | **idx** |
| `levelId` | FK→TriaseLevel (`Cascade`) | **idx** · idx komposit `(parameterId, levelId)` |
| `nilai` | text | 1 item kriteria klinis (boleh "—"/kosong) |
| `urutan` | int `@default(0)` | urutan item dalam sel |

**Enum** (Prisma native, `@@schema("master")`): `TriaseStatus` · `TriaseTone`.

> **Alternatif pragmatis (jika over-normalisasi terasa berat):** simpan sel sebagai **JSONB** `criteria` di `TriaseParameter` (mirror `values: Record<levelKode,string>` apa adanya). **Trade-off:** lebih cepat di-seed & 1:1 dgn mock, TAPI kehilangan FK integrity (level dihapus → sel yatim), tak bisa query "semua kriteria level X", dan menyalahi preferensi *"hindari JSON blob"* di keputusan klinis. **Rekomendasi tetap `TriaseCriteria` relasional** karena matrix kecil (≤ 6×8 ≈ 48 baris/protokol) → biaya normalisasi murah, manfaat integritas besar.

### A.3 Lifecycle & invariants

Master **bukan** state machine transaksional — siklus = **aktif/non-aktif + soft-delete**. Yang dijaga:

| Invariant | Penegakan |
|---|---|
| `TriaseProtocol.kode` unik | **UNIQUE** (DB) |
| Level/Parameter `kode` unik **per protokol** | **`@@unique([protocolId, kode])`** |
| ~~1 sel per (parameter, level)~~ → **banyak item per sel** | unique **dihapus** (TR8b); `urutan` jaga urutan item dalam sel |
| **Tepat satu** protokol `isDefault:true` **& Aktif** per RS | **Service guard** (set default baru → unset yang lama, dalam 1 tx). Cermin UI: IdentitasTab "Hanya boleh satu protokol aktif default per RS." |
| Protokol valid = `kode` + `nama` + **≥ 2 level** + **≥ 1 parameter** | **Service** (cermin `isTriaseValid`) — tolak set `isDefault` bila tak valid |
| `prioritas` level ≥ 1 | **CHECK** |
| Hapus level → sel di kolom itu ikut terhapus | **FK `Cascade`** (MatrixTab sudah cleanup `values` di FE) |

- **Soft-delete** (`deletedAt`) di `TriaseProtocol`; level/parameter/sel mengikuti protokol (hard child via cascade saat protokol benar-benar dihapus, atau ikut soft via filter `protocol.deletedAt`).
- **Optimistic concurrency** (`version`) di `TriaseProtocol` (diedit admin master; matrix besar → hindari lost-update).

### A.4 Layer breakdown

#### A.4.1 DAL — `lib/dal/triaseProtocolDal.ts`
Akses Prisma murni, terima `tx?`. Soft-delete difilter default. Master RS-wide → read terbuka untuk role ber-izin, tulis dibatasi RBAC.
- `list()` → semua protokol (ringkas, tanpa matrix) — untuk TriaseList.
- `findFull(id)` → protokol + `levels[]` (orderBy `urutan`) + `parameters[]` (orderBy `urutan`) + `criteria[]` → di-assemble Service jadi `TriaseRecord`-kompatibel.
- `findDefault()` → protokol `isDefault:true, status:Aktif, deletedAt:null` + matrix lengkap (**dikonsumsi medicalrecord**, A.8).
- `createProtocol/updateProtocol(version-guard)/softDeleteProtocol`
- `replaceMatrix(protocolId, {levels, parameters, criteria}, tx)` → delete-insert anak dalam tx (MatrixTab menyimpan seluruh matrix sekaligus — mirror pola `replaceKontakDarurat` di pegawaiDal).
- `unsetOtherDefaults(exceptId, tx)` → jaga invariant single-default.

#### A.4.2 Service — `lib/services/triaseProtocolService.ts`
Business + transaksi + authz + **cache invalidation**. Tak `import prisma` (pakai `transaction` + DAL). `clock`/`genId` di-inject (FLOWS §14).
- `list(actor)` → DTO ringkas.
- `getFull(id, actor)` → assemble `TriaseRecordDTO` (nested levels/parameters + `parameter.values` direkonstruksi dari `criteria`) — **1:1 dengan tipe FE** → zero-refactor UI.
- `getDefault(actor)` → matrix protokol default (**cache-aside** `cache:master:triase:default`).
- `createProtocol/updateProtocol(input, actor)` → validasi `isTriaseValid`, set/replace matrix via `replaceMatrix`, jaga single-default (unset lama), bump version, audit, **invalidate** `cache:master:triase:*`.
- `setDefault(id, actor)` → tolak bila protokol tak valid; `unsetOtherDefaults` + set; invalidate cache.
- `deleteProtocol(id, version, actor)` → soft-delete; tolak hapus protokol default aktif (harus pindah default dulu).

#### A.4.3 Validasi/DTO — `lib/schemas/triaseProtocol.ts` (Zod)
- `CreateTriaseInput`/`UpdateTriaseInput`: `kode` (upper), `nama`, `deskripsi?`, `protokol?`, `status`, `levels[]` (kode slug, label, tone enum, responsTime?, prioritas int, deskripsi?), `parameters[]` (kode slug, label, `values: Record<string,string>`).
- Output **DTO** `TriaseRecordDTO`: **mirror `TriaseRecord`** (`levels: TriaseLevelDTO[]`, `parameters: TriaseParameterDTO[]` dgn `values` map) → FE swap import tanpa ubah render.
- Re-export `TriaseLevelTone`/`TriaseStatus` agar FE & server selaras (pola `import type` seperti `api/pegawai.ts`).

#### A.4.4 API — `app/api/v1/master/triase-igd/*` (Route tipis)

> **Tanpa segmen grup `skala-klinis`** (nama menu UI, bukan resource) — konsisten dgn `/api/v1/master/pegawai`, `/api/v1/master/ruangan`.

| Method | Path | Service | RBAC |
|---|---|---|---|
| `GET` | `/api/v1/master/triase-igd` | `list` | `master.triase:read` |
| `GET` | `/api/v1/master/triase-igd/default` | `getDefault` (cache) | `master.triase:read` |
| `GET` | `/api/v1/master/triase-igd/:id` | `getFull` | `master.triase:read` |
| `POST` | `/api/v1/master/triase-igd` | `createProtocol` | `master.triase:create` |
| `PATCH` | `/api/v1/master/triase-igd/:id` | `updateProtocol` (version) | `master.triase:update` |
| `PATCH` | `/api/v1/master/triase-igd/:id/default` | `setDefault` | `master.triase:update` |
| `DELETE` | `/api/v1/master/triase-igd/:id` | `deleteProtocol` (version) | `master.triase:delete` |

- Tiap Route: `getActor → assertCan(RBAC) → zod(params/body) → service → envelope → handleError`. Mutasi wajib **Idempotency-Key** (FLOWS §7.4).
- **RBAC baru:** key `master.triase:{read,create,update,delete}` perlu **di-seed** (saat ini grup Skala belum punya permission). Sampai itu ada, hanya superadmin (Admin global) lolos `assertCan`. Catat di task A.9 SK0.

### A.5 Event
- **Cache invalidation** (utama): tiap CUD/setDefault → hapus `cache:master:triase:*`.
- **Audit** (FLOWS §13): CUD protokol → `AuditLog` → feed **Beranda Master** RecentEdits.
- Master jarang berubah → **tidak** butuh SSE.

### A.6 Indexing
- `TriaseProtocol`: `kode` unique, partial `deletedAt IS NULL`, partial unique `isDefault WHERE isDefault AND status='Aktif'` (backstop single-default).
- `TriaseLevel`/`TriaseParameter`: `protocolId`, `@@unique([protocolId, kode])`.
- `TriaseCriteria`: `parameterId`, `levelId`, idx komposit `(parameterId, levelId)` (unique **dihapus** sejak TR8b — banyak item per sel).

### A.7 Failure modes
| Skenario | Penanganan |
|---|---|
| Kode protokol duplikat | `CONFLICT` (409) — unique DB P2002 |
| Set default protokol tak valid (< 2 level / < 1 parameter) | `VALIDATION` (422) — cermin `isTriaseValid` |
| Hapus protokol default aktif | `FORBIDDEN_STATE` (409) — pindah default dulu |
| 2 admin edit protokol sama | `version` guard → `CONFLICT_VERSION` (409) |
| Sel mereferensi level/parameter beda protokol | dicegah struktur tabel (FK + assemble per-protokol di Service) |

### A.8 ⭐ Konsumsi oleh `medicalrecord.Triase` — "Tabel Kriteria Triase"

**Inti permintaan:** master Triase IGD = **sumber kebenaran tunggal** untuk matrix kriteria; domain klinis **mem-fetch**-nya (bukan hardcode).

**Kondisi sekarang (duplikasi):** [TriaseTab.tsx:186-306](../src/components/igd/tabs/TriaseTab.tsx#L186-L306) men-**hardcode** `COL_HEADERS` (6 level) + `CRITERIA_ROWS` (8 parameter) yang **identik byte-per-byte** dengan `DEFAULT_PROTOCOL` di [triaseMock.ts](../src/lib/master/triaseMock.ts). Header mock sudah menandai: *"Replace: igd/tabs/TriaseTab.tsx (COL_HEADERS + CRITERIA_ROWS hardcoded)"*.

**Target swap:**
1. Tambah client `src/lib/api/triaseProtocol.ts` → `getDefaultTriaseProtocol(signal?)` → `GET /api/v1/master/triase-igd/default`.
2. `CriteriaTable()` di [TriaseTab.tsx:308](../src/components/igd/tabs/TriaseTab.tsx#L308) fetch protokol default (TanStack Query / self-fetch seperti pola Triase Fase B) → render `levels` sebagai kolom + `parameters` sebagai baris + `criteria` sebagai sel. Hapus konstanta hardcode.
3. Cache di server (`getDefault`) → master read-mostly, murah.

> **Pemisahan peran (penting):** matrix master = **panduan keputusan** (decision-support) yang **dibaca** perawat; ia **bukan** nilai yang disimpan. Yang **dicatat** ke `medicalrecord.Triase` adalah `triageLevel` (klasifikasi final) + TTV + perawat — domain klinis terpisah.

#### ⚠️ A.8.1 Keputusan terbuka — keselarasan vokabuler level
- **Master** punya **6 level** ber-slug: `resusitasi`/`emergency`/`urgent`/`lessUrgent`/`nonUrgent`/`doa` (ESI-style, [triaseMock.ts:91](../src/lib/master/triaseMock.ts#L91)).
- **`medicalrecord.Triase.triageLevel`** menyimpan **4 level**: `P1`/`P2`/`P3`/`P4` ([data.ts:5](../src/lib/data.ts#L5), enum `TriaseLevel` di [schema medicalrecord](../prisma/schema/medicalrecord.prisma)).

Dua kosakata berbeda → **harus diputuskan** sebelum konsumsi penuh:
- **Opsi 1 (rekomendasi awal):** master matrix tetap sebagai **referensi tampilan** (P1–P4 di record TIDAK terikat slug master). Map manual P1↔resusitasi/emergency, P2↔urgent, dst. di lapisan tampilan saja. Cepat, tak ubah schema klinis. **Risiko:** dua sumber level bisa drift.
- **Opsi 2 (lebih bersih, lebih mahal):** `medicalrecord.Triase.triageLevel` mereferensi `TriaseLevel.kode` (atau `id`) dari protokol default — single vocabulary. Hilangkan enum P1–P4 hardcode. **Butuh:** migrasi enum→FK + penyesuaian board IGD (`encounter.Kunjungan.triaseLevel` int 1..4 → derive dari `prioritas` level). **Risiko:** lebih invasif, sentuh board.

**Belum diputuskan** — catat di [TODO-CLINICAL.md](../TODO-CLINICAL.md) Domain 1 Triase sebagai blocker konsumsi penuh. Sampai diputuskan, konsumsi matrix (A.8 langkah 1–3) **tetap bisa jalan** untuk tampilan; hanya pemetaan level final yang menunggu keputusan.

### A.9 Task checklist (Triase IGD)

- [x] **SK0 — RBAC seed**: permission `master.triase:{read,create,update,delete}` (migration `20260608141000_rbac_add_triase_perms`) + grant Admin full, Dokter/Perawat read; snapshot di [rbacShared.ts](../src/components/master/mapping/rbac/rbacShared.ts) + [gen-rbac-seed.mjs](../prisma/scripts/gen-rbac-seed.mjs).
- [x] **TR1 — Schema & migration**: [triaseProtocol.prisma](../prisma/schema/triaseProtocol.prisma) — `TriaseProtocol`/`TriaseProtocolLevel`/`TriaseProtocolParameter`/`TriaseProtocolCriteria` + enum `TriaseStatus` (tone = String, presentasional). Migration `20260608140000_init_triase_protocol` (partial-unique single-default + CHECK prioritas + cascade FK). **`tone` = String** (bukan enum — bukan keputusan-kritis, hindari masalah hyphen).
- [x] **TR2 — Zod schema** [triaseProtocol.ts](../src/lib/schemas/triaseProtocol.ts) (DTO mirror `TriaseRecord` + version/isDefault).
- [x] **TR3 — DAL** [triaseProtocolDal.ts](../src/lib/dal/triaseProtocolDal.ts) (`listFull`/`findFull`/`findDefaultFull`/`deleteChildren`+`createLevels/Parameters/Criteria`/`unsetOtherDefaults`).
- [x] **TR4 — Service** [triaseProtocolService.ts](../src/lib/services/triaseProtocolService.ts) (single-default invariant, validasi matrix utk isDefault, replace matrix, version guard). _Cache-aside ditunda (infra Redis belum ada — spt ruanganService)._
- [x] **TR5 — API** `/api/v1/master/triase-igd/*` (7 endpoint: list/create/default/detail/update/delete/set-default).
- [x] **TR6 — Client** [api/triaseProtocol.ts](../src/lib/api/triaseProtocol.ts) + seed [seed_triase.sql](../prisma/seed_triase.sql) (DEFAULT-IGD: 1 protokol · 6 level · 8 param · 48 sel, idempoten).
- [x] **TR7 — Swap FE master**: [TriaseIGDPage](../src/components/master/triase-igd/TriaseIGDPage.tsx) fetch API (CUD via client; `useMasterCrud` + helper baru `commit`/`removeLocal`; toast).
- [x] **TR8 — Swap konsumsi klinis**: `CriteriaTable` di [TriaseTab.tsx](../src/components/igd/tabs/TriaseTab.tsx) → fetch `getDefaultTriaseProtocol` (konstanta `COL_HEADERS`/`CRITERIA_ROWS` disisakan sebagai **fallback degradasi** offline/belum-login, bukan source-of-truth).
- [x] **TR8b — Banyak kriteria per sel** (2026-06-08, migration `20260608150000_triase_criteria_multi`): drop unique (parameter,level) + kolom `urutan`; `values` → `Record<levelKode, string[]>` lintas-lapisan (Zod/DAL/Service/mock/[MatrixTab](../src/components/master/triase-igd/tabs/MatrixTab.tsx) `CellEditor` add/hapus item per sel/[TriaseTab](../src/components/igd/tabs/TriaseTab.tsx) render bullet). `useMasterCrud` helper `commit`/`removeLocal` reused.
- [x] **TR8c — Riset kriteria + parameter best-practice + `tipeNilai`/`satuan`** (2026-06-08): (1) `tipeNilai`/`satuan` di `TriaseProtocolParameter` (migration `20260608160000_triase_param_tipe_nilai`, aditif) lintas-lapisan (Zod/DAL/Service/mock/[MatrixTab](../src/components/master/triase-igd/tabs/MatrixTab.tsx) selector tipe+satuan/page converter). (2) Enrichment **non-destruktif & idempoten** [seed_triase_enrich.sql](../prisma/seed_triase_enrich.sql) — append kriteria riset (ESI/ATS/CTAS/MTS/PMK) ke 8 parameter existing (base 48 sel utuh) + **4 parameter baru** (SpO₂/Suhu/Perdarahan/Risiko Perilaku). Pasca-enrich DB: **12 parameter · 131 sel · single-default utuh**. Referensi klinis di **§A.10**.
- [ ] **TR9 — Keputusan A.8.1** (vokabuler level P1–P4 ⇄ slug master) + wiring map.
- [ ] **TR10 — Tests** (Service: single-default, validasi; DAL: replace matrix tx).

### A.10 📚 Referensi klinis — kriteria triase (riset 2026-06-08)

Sumber: **ESI** (Emergency Severity Index v4/v5, ENA/AHRQ) · **ATS** (Australasian Triage Scale, ACEM/Safety&Quality AU) · **CTAS** (Canadian Triage & Acuity Scale) · **MTS** (Manchester) · **PMK 47/2018** (regulasi IGD Indonesia, mengadopsi ATS). Matrix `DEFAULT-IGD` di-seed dari sintesis ini.

**Prinsip lintas-sistem:**
- **"The worst wins"** — level akhir = kriteria tertinggi yang positif (bukan rata-rata). Penilaian klinis senior boleh meng-*override* ke atas.
- **Danger-zone vital sign** (ESI v4/v5) — 1 vital di zona bahaya pada pasien L3 → naik L2 otomatis.
- Angka vital **bukan kriteria tunggal absolut** (ATS) — selalu + tampilan klinis & keluhan.

**Ambang dewasa (harmonisasi) per level — Resusitasi · Emergency · Urgent · Less · Non:**
| Parameter | Resusitasi | Emergency | Urgent | Less | Non |
|---|---|---|---|---|---|
| **RR** (×/mnt) | apnea / < 8 | > 30 (ATS ≥36) | 25–30 | 21–24 | 12–20 |
| **SpO₂** (CTAS) | < 90% + distress | < 92% | 92–94% | ≥ 95% | ≥ 95% |
| **Nadi** (×/mnt, ESI DZ) | tak teraba | < 40 / > 140 | 50–60 / 100–140 | 100–110 | 60–100 |
| **TD sistolik** | tak terukur | < 90 (syok) | 90–100 | borderline | normal |
| **GCS** | ≤ 8 | 9–12 | 13–14 | 15+keluhan | 15 |
| **Nyeri** (VAS) | — | 8–10 sentral | 4–7 / berat perifer | 1–3 | 0–2 |
| **Suhu** (°C) | <32 / >41 | >38,3 sepsis / <35 | 38–39 | 37,5–38 | afebris |

> ESI danger-zone dewasa: HR > 100 atau < 50 · RR > 20 atau < 12 · SBP < 90 · SpO₂ < 92% · suhu > 38,3°C. **Pediatrik:** ambang per pita umur (bayi/anak ≠ dewasa) — belum dimodelkan (lihat gap di bawah).

**Parameter best-practice yang ditambah** (di luar 8 awal): **SpO₂** (CTAS first-order modifier terkuat) · **Suhu** (danger-zone sepsis) · **Perdarahan** (descriptor ATS) · **Risiko Perilaku** (kategori *behavioural* ATS: agitasi/kekerasan/risiko bunuh diri).

**Gap / future work (belum dimodelkan):**
1. **Ambang numerik terstruktur** — `tipeNilai="Numerik"` + `satuan` sudah jadi *fondasi*; rule-engine auto-klasifikasi (operator+angka per sel → usul level dari TTV) belum dibangun.
2. **Pita umur pediatrik** — ambang vital per kelompok usia (varian matrix / parameter ber-*age band*).
3. **Modifier keluhan utama** (dua-langkah MTS/CTAS: flowchart keluhan + modifier fisiologis) — "Contoh Kasus" baru benih sisi keluhan.
4. **Glukosa, mekanisme cedera/trauma, obstetri** — modifier risiko tambahan di RS besar.

**Sumber daring:** [ESI/AHRQ](https://www.ahrq.gov/patient-safety/settings/emergency-dept/esi.html) · [ATS Descriptors (Safety&Quality AU)](https://www.safetyandquality.gov.au/sites/default/files/2024-04/emergency_triage_education_kit_-_australasian_triage_scale_-_descriptors_for_categories.pdf) · [CTAS 2016 Revisions (CJEM)](https://www.cambridge.org/core/journals/canadian-journal-of-emergency-medicine/article/revisions-to-the-canadian-emergency-department-triage-and-acuity-scale-ctas-guidelines-2016/E2CB3E2063C54E11259313FA4FEAE495) · [PMK 47/2018](https://pdf2.sumselgo.id/ppiddinkes/unggah/33242327-PMK47-tahun-2018-tentang-pelayanan-kegawatdaruratan.pdf) · [ED Triage StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK557583/)

---

## B. Sub-grup **Skala Klinis — Risiko / Umum / Penyakit** (skoring)

> **Skala Risiko ✅ SELESAI (2026-06-15)** — backend + FE wired; **13 instrumen tervalidasi** ter-seed (`SR-0001..0013`), distratifikasi dewasa/pediatrik/neonatus/kritis (lihat B.1.1). **Umum/Penyakit 📋** (reuse model & layer yang sama, beda `kategori`/scope kode).

Ketiganya berbagi `SkalaRecord` ([skalaCommon.ts](../src/lib/master/skalaCommon.ts)): `items[]` (tiap item `options[]` ber-`score`) + `scoringMode` (`sum_items`\|`select_value`) + `arah` (`higher_is_worse`\|`lower_is_worse`) + `interpretasi[]` (rentang `min..max` → `label` + `action` + `tone`) + `konsumenModul[]` (IGD/RI/RJ/ICU).

### B.1 Pemodelan (terimplementasi) — **1 tabel lintas-kategori + JSONB**

Keputusan: **TIDAK** menormalkan item/opsi/interpretasi jadi tabel terpisah (pola SDKI blok JSONB) — instrumen di-baca/tulis sebagai satu unit (replace-all), tak ada query lintas-opsi. Hemat & 1:1 dgn `SkalaRecord` FE.

- **`SkalaInstrument`** ([skalaInstrument.prisma](../prisma/schema/skalaInstrument.prisma), `@@schema("master")`): `id` · `kode` (auto) · `nama` · `singkat` · `deskripsi` · `referensi` · `kategori` (Risiko/Umum/Penyakit) · `scoringMode` · `arah` · `totalMax` · `items` **JSONB** (`SkalaItem[]` dgn `options[]`) · `interpretasi` **JSONB** · `konsumenModul` **text[]** (assignment unit) · `status` · createdAt/updatedAt/deletedAt (soft-delete; katalog leaf tanpa version). Index `(kategori, deleted_at)`.
- **`SkalaCounter`** (PK `scope` = prefix kategori): kode auto `<PREFIX>-NNNN` (SR=Risiko, SU=Umum, SP=Penyakit), increment atomik (pola `SdkiCounter`). **Kode BUKAN nama** (MORSE→`SR-0002`) — di-generate saat simpan/seed; input manual dihapus (FE display "Auto").
- **Assignment per unit** (poin konsumen) = `konsumenModul` text[] (IGD/RI/RJ/ICU), di-toggle di IdentitasTab; dipakai filter `?modul=` utk konsumsi klinis.

### B.2 Layer (Risiko) — terimplementasi

- Zod [schemas/master/skalaRisiko.ts](../src/lib/schemas/master/skalaRisiko.ts) (Input tanpa kode/kategori; DTO mirror `SkalaRecord`; items/interpretasi nested Zod → JSONB).
- DAL [dal/master/skalaRisikoDal.ts](../src/lib/dal/master/skalaRisikoDal.ts) (`nextSkalaSeq(scope)`/create/findById/update/softDelete/list filter q+modul+status).
- Service — **factory generik** [services/master/skalaService.ts](../src/lib/services/master/skalaService.ts) `makeSkalaService({ kategori, scope })` (kode `<SCOPE>-NNNN` atomik dlm tx, JSONB defensif toItems/toInterpretasi, actor-less list SSR-safe); [skalaRisikoService.ts](../src/lib/services/master/skalaRisikoService.ts) = wrapper Risiko/SR. **DRY: Risiko & Penyakit satu sumber logika.**
- API `/api/v1/master/skala-risiko` (GET list+filter · POST) + `/:id` (PATCH · DELETE), gate `master.skala`. Client [api/master/skalaRisiko.ts](../src/lib/api/master/skalaRisiko.ts).
- FE: [SkalaRisikoPage](../src/components/master/skala-risiko/SkalaRisikoPage.tsx) SSR-hybrid (initial via service + client CUD `commit`/`removeLocal`), **kode read-only "Auto"** (IdentitasTab shared), **batal → DiscardDialog global** (bukan window.confirm). Seed [seed-skala-risiko.mts](../prisma/scripts/seed-skala-risiko.mts) → **13 instrumen tervalidasi** `SR-0001..0013` (counter=13).

### B.1.1 Cakupan instrumen ter-seed (stratifikasi usia & kondisi)

Instrumen di-audit 1:1 terhadap publikasi aslinya (item, bobot skor, cut-off). Stratifikasi mengikuti syarat JCI/SNARS "appropriate to patient age & condition":

| Domain | Dewasa | Pediatrik | Neonatus | Kritis/Non-verbal |
|---|---|---|---|---|
| **ADL** | Barthel (Mahoney 1965) | — | — | — |
| **Jatuh** | Morse (1989) | Humpty Dumpty (2009) | — | — |
| **Nyeri** | NRS (self-report) | Wong-Baker FACES (1988) · FLACC (1997) | NIPS (1993) | CPOT (2006, ICU) · FLACC |
| **Dekubitus** | Braden (1987) | Braden Q (2003) | — | — |
| **Gizi** | MUST (BAPEN 2003) · MST (Ferguson 1999) | STRONGkids (2010) | — | — |

`arah=lower_is_worse` (inverse): Barthel, Braden, Braden Q. Sisanya `higher_is_worse`. `scoringMode=select_value`: NRS, Wong-Baker. Skala dewasa stabil di `SR-0001..0005`; stratifikasi tambahan `SR-0006..0013`.

> **Catatan model:** tidak ada modul `konsumenModul` khusus pediatrik/NICU (enum = IGD/RI/RJ/ICU) — skala anak/neonatus dipetakan ke IGD/RI/RJ; pemilihan instrumen sesuai usia diserahkan ke klinisi saat asesmen. Penambahan enum modul = perubahan skema (ditunda, belum dibutuhkan).

### B.3 Konsumen klinis ✅ SELESAI (2026-06-15)

Tab **Penilaian** IGD: 3 sub-tab hardcode (Morse/Braden/Barthel) **dikonsolidasi jadi 1 sub-tab generik "Asesmen Risiko"** ([SkalaRisikoPanel](../src/components/igd/tabs/penilaian/SkalaRisikoPanel.tsx)) yang menarik instrumen dari master (filter `?modul=` per unit IGD/RI/RJ/ICU) → render generik (items×opsi + skor live + interpretasi, sadar `arah` inverse & `scoringMode`). Selaras pola A.8: **master = panduan, record = hasil**.

- **Read katalog (klinis):** `GET /api/v1/master/skala-tersedia?modul=IGD` → instrumen AKTIF kategori Risiko ter-assign unit. Gate **`clinical.penilaian:read`** (BUKAN master.skala — klinisi tak punya hak master), `scopeKunjungan:false`. Reuse `skalaRisikoService.list` (pola `sdki-template`/`tindakan-tersedia`). [route](../src/app/api/v1/master/skala-tersedia/route.ts).
- **Record hasil:** `medicalrecord.PenilaianSkala` — **SATU tabel `penilaian_skala`** untuk semua skala skoring (snapshot `skalaKode`/`skalaNama` denormalisasi + `jawaban` JSONB + `totalSkor`/`totalMax` + `interpretasiLabel`/`tone`). Append-only. `GET/POST /api/v1/kunjungan/:id/penilaian-skala`, gate `clinical.penilaian` (read/create). Layer: [schema](../src/lib/schemas/penilaian/penilaianSkala.ts) · [dal](../src/lib/dal/penilaian/penilaianSkalaDal.ts) · [service](../src/lib/services/penilaian/penilaianSkalaService.ts) · [client](../src/lib/api/penilaian/penilaianSkala.ts). Migrasi `20260615200000_init_medicalrecord_penilaian_skala`.
- **Keputusan model:** 1 tabel generik (BUKAN `penilaian_jatuh`/`_dekubitus`/`_barthel` terpisah) — skala skoring berbagi satu bentuk; skoring dihitung FE (single source = definisi master), BE simpan snapshot apa adanya. Primitives tab Penilaian diekstrak ke [shared.tsx](../src/components/igd/tabs/penilaian/shared.tsx).
- **Sisa:** RI/RJ tab Penilaian (jika ada) tinggal pass `modul` berbeda; Skala **Umum** master = follow-up (reuse `SkalaInstrument` scope SU).

### B.4 Skala Penyakit + konsumen komposit (Jantung/Kanker) ✅ SELESAI (2026-06-15)

**Master Skala Penyakit** (kategori "Penyakit", scope **SP**) reuse `SkalaInstrument` + factory `makeSkalaService` (B.2). Layer paralel Risiko:
- Service [skalaPenyakitService.ts](../src/lib/services/master/skalaPenyakitService.ts) (`makeSkalaService({ kategori:"Penyakit", scope:"SP" })`). Schema/DTO **di-reuse** dari `skalaRisiko` (category-agnostic).
- API `/api/v1/master/skala-penyakit` (GET·POST) + `/:id` (PATCH·DELETE), gate `master.skala`. Client [api/master/skalaPenyakit.ts](../src/lib/api/master/skalaPenyakit.ts).
- FE [SkalaPenyakitPage](../src/components/master/skala-penyakit/SkalaPenyakitPage.tsx) SSR-hybrid (accent violet, kode "Auto" `SP-NNNN`, DiscardDialog). Route [/ehis-master/skala-penyakit](../src/app/ehis-master/skala-penyakit/page.tsx) (nav sudah ada).
- Seed [seed-skala-penyakit.mts](../prisma/scripts/seed-skala-penyakit.mts) → **6 klasifikasi tervalidasi** `SP-0001..0006`: Killip (1967) · NYHA (1994) · TIMI (Antman 2000) · ECOG (Oken 1982) · Grade (WHO/AJCC G1–G4) · Stadium AJCC 8th. `select_value` semua kecuali TIMI (`sum_items`).

**Konsumen komposit** — tab Penilaian **Jantung** ([JantungPanel](../src/components/igd/tabs/penilaian/JantungPanel.tsx)) & **Kanker** ([KankerPanel](../src/components/igd/tabs/penilaian/KankerPanel.tsx)):
- **Komposit** = narasi + vocab bespoke + klasifikasi baku yang **dikomposisi dari master** (`GET /master/skala-tersedia?kategori=Penyakit&modul=`, dispatch service per kategori). Asosiasi skala→panel via **name-match** (cardiac `/killip|nyha|timi/i`, onco `/ecog|grade|stadium/i`) — kode auto SP-NNNN tak bisa dipakai match. **Follow-up:** kolom `domain` tag bila master di-rename.
- Klasifikasi dirender `<ScaleField>` + mesin `computeScale` (shared) — single source skoring = definisi master. **TNM (T/N/M) TETAP vocab bespoke** (staging lookup site-specific, BUKAN skala).
- **Record:** `medicalrecord.PenilaianKomposit` — **SATU tabel `penilaian_komposit`** diskriminasi `jenis` (Jantung/Kanker), `data` JSONB snapshot utuh (narasi+vocab+`data.skala[]` hasil klasifikasi), append-only. `GET/POST /api/v1/kunjungan/:id/penilaian-komposit?jenis=`, gate `clinical.penilaian`. Layer [schema](../src/lib/schemas/penilaian/penilaianKomposit.ts)·[dal](../src/lib/dal/penilaian/penilaianKompositDal.ts)·[service](../src/lib/services/penilaian/penilaianKompositService.ts)·[client](../src/lib/api/penilaian/penilaianKomposit.ts). Migrasi `20260615210000_init_medicalrecord_penilaian_komposit`.
- **Catatan unit-filter:** di IGD muncul Killip+TIMI (NYHA=RI/RJ/ICU); onko (ECOG/Grade/Stadium=RI/RJ) → empty-state di IGD (staging onkologi memang inpatient/rawat-jalan). Assignment master = sumber kebenaran.

**RBAC:** `master.skala:{read,create,update,delete}` ✅ (migration `20260615190000_rbac_master_skala`; Admin full · Dokter/Perawat read). Konsumen klinis gate `clinical.penilaian`.

---

## C. Catatan lintas-sub

- **2 file DAL/Service terpisah** dalam grup ini: `triaseProtocol*` (matrix) vs `skalaInstrument*` (skoring). Jangan satukan — bentuk data beda.
- **Cache namespace:** `cache:master:triase:*` & `cache:master:skala:*`.
- **Seed:** `TRIASE_MOCK` (1 protokol default) + `SKALA_*_MOCK` → seed idempoten (upsert by `kode`).
- **Definition of Done (FLOWS):** layered · Zod in/out · RBAC enforced · cache invalidation · audit · tsc clean · seed reproducible · swap FE zero-refactor (DTO mirror tipe FE).
