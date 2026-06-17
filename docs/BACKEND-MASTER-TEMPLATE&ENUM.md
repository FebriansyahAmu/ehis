# EHIS Backend — Master Data: **Grup Template & Enum** (schema `master`)

> **Konfigurasi sistem klinis** (bukan katalog item, bukan transaksional): enum kecil lintas-modul + template pre-fill yang **mengganti hardcoded constants** yang kini tersebar di tab `ehis-care`. Master = **single source of truth** untuk dropdown/pilihan/template → ubah di sini, semua modul konsumen ikut berubah. Banyak dibaca, jarang ditulis → kandidat **cache** (FLOWS §12).
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** (core rules · tech · best practices). Bila konflik, FLOWS menang.
> **1 file per grup pengerjaan** master (`BACKEND-MASTER-<GRUP>.md`). File ini = grup **Template & Enum** (menu sidebar `/ehis-master` → "Template & Enum"). Peta seluruh grup → [BACKEND-MASTER-SUMBER-DAYA §0](BACKEND-MASTER-SUMBER-DAYA.md#0-peta-grup-master-urut-frontend-ehis-master).
> **Dokumen terkait:** [API-RULES](API-RULES.md) (resep endpoint) · [BACKEND-AUTH](BACKEND-AUTH.md) (RBAC) · [BACKEND-MASTER-KATALOG-KLINIS](BACKEND-MASTER-KATALOG-KLINIS.md) (preseden katalog leaf) · [BACKEND-MASTER-SKALA-KLINIK](BACKEND-MASTER-SKALA-KLINIK.md) (preseden JSONB-block + counter).
> **Terkait:** [CLAUDE.md](../CLAUDE.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md).
>
> **Stack:** PostgreSQL · Prisma (`@@schema("master")`) · layered **Route→Service→DAL→Prisma** · Redis cache-aside (menyusul) · Auth.js RBAC.
> **Status:** 📋 **PLANNED (2026-06-17)** — dokumen perencanaan. Belum ada kode. Eksekusi **per tab** (TE1 → TE2 → TE3), tiap tab = vertical slice lengkap (schema+migrasi → Zod → DAL → Service → endpoint → seed → page SSR-hybrid → wiring klinis).

---

## 0. Cakupan grup

Menu **Template & Enum** di `/ehis-master` (gate **`master.konfigurasi`**, Admin). 3 sub-menu = 3 tab = 3 target pengerjaan. **Tiap tab berdiri sendiri** (domain field beda) — JANGAN disatukan ke satu tabel.

| # | Tab | Route FE | Mock / tipe FE | Konsumen klinis (saat ini hardcode) | Status backend |
|---|---|---|---|---|---|
| TE1 | **Status Enum** | [/ehis-master/status-enum](../src/app/ehis-master/status-enum/) | [statusEnumMock.ts](../src/lib/master/statusEnumMock.ts) — 9 grup / 55 entri | PasienPulang · StatusFisikPane · TTVTab · Transfer SBAR · Registrasi RI · Caregiver · Edukasi · MAR | 📋 |
| TE2 | **Template Anamnesis** | [/ehis-master/template-anamnesis](../src/app/ehis-master/template-anamnesis/) | [templateAnamnesisMock.ts](../src/lib/master/templateAnamnesisMock.ts) — 17 template | AnamnesisPane IGD/RI/RJ | 📋 |
| TE3 | **Template Form** | [/ehis-master/template-form](../src/app/ehis-master/template-form/) | [templateFormMock.ts](../src/lib/master/templateFormMock.ts) — 20 template (4 jenis) | HandoverTab · KonsultasiTab · InformedConsentTab · PasienPulang · SuratDokumen · CPPT quick-text | 📋 |

> **Fakta awal (verifikasi 2026-06-17):** Ketiga mock **belum dikonsumsi tab klinis manapun** — hanya dipakai page master masing-masing + hitungan Beranda master ([berandaShared.ts](../src/components/master/beranda/berandaShared.ts)). Tab klinis kini punya **konstanta hardcode sendiri**. "Wiring" = arahkan tab klinis konsumsi master via API (ganti konstanta → fetch + fallback), **bukan** menyambung mock yang sudah dipakai.

---

## 1. Keputusan desain lintas-tab (baca dulu)

### 1.1 Model per tab — bukan 1 tabel universal
Tiap tab punya bentuk data sangat berbeda (enum baris kecil vs template teks panjang vs union 4-jenis). Federasi paksa → over-engineering. **3 tabel terpisah**, masing-masing **katalog leaf** (TANPA optimistic-version), uuid v7, soft-delete (`deletedAt`), timestamptz. Enum FE-facing (kategori/jenis/status/tone/context) = **TEXT pass-through** divalidasi Zod (pola identik `Sdki`/`SkalaInstrument`/`Obat`).

### 1.2 Kode auto-gen (Status Enum) vs tanpa kode (Template)
- **Status Enum** — `kode` **AUTO-GEN per grup/kategori** `<PREFIX>-NNN` (pola **Asesmen Katalog**), prefix per grup (`SPL`/`KUM`/`TKS`/`KTR`/`MTR`/`KPW`/`HKL`/`PED`/`ROB`) via **`master.EnumCounter`** (scope=prefix, upsert-increment atomik). Kode **BUKAN input manual**, immutable, unik per grup. _(Revisi 2026-06-17: semula direncanakan kode semantik manual; diubah ke auto-gen atas permintaan — konsekuensi di §5.)_
- **Template Anamnesis & Template Form** — tak punya kode publik; identitas = `label` + `id` uuid. **Tanpa counter, tanpa field kode.**

→ Hanya **Status Enum** menambah tabel `*Counter` (`EnumCounter`). Template tabs tetap tanpa counter.

### 1.3 RBAC dua gate (master vs klinis) — pola `*-tersedia`
Tiap tab → **2 set endpoint**:
1. **Master CRUD** `/api/v1/master/<tab>` (+`/:id`) — gate **`master.konfigurasi`** (Admin kelola). r/c/u/d.
2. **Konsumsi klinis** `/api/v1/master/<tab>-tersedia` — gate **`clinical.rekammedis:read`** (Dokter/Perawat baca untuk dropdown/template; **tak butuh hak master**), `scopeKunjungan:false` (katalog murni tanpa konteks kunjungan). Reuse `service.list` dgn `status:"Aktif"` dipaksa + filter konsumen. **Pola identik** [asesmen-tersedia](../src/app/api/v1/master/asesmen-tersedia/route.ts) / [skala-tersedia] / [tindakan-tersedia].

### 1.4 Page master = SSR-hybrid
Ketiga page kini **pure client** (`useSkeletonDelay` + mock array). Migrasi ke **SSR-hybrid** (API-RULES §6.1, pola Skala/Asesmen):
- `page.tsx` (server) panggil `service.list` langsung → first paint `{ initial, prefetched }`.
- Client component seed `useMasterCrud` dari `initial`; fallback fetch bila `!prefetched`; CUD via browser `/api` (`commit`/`removeLocal`) + toast.
- **Batal/pindah saat dirty → `DiscardDialog` global** (`confirmDirty: () => true`, pola SkalaRisiko/Asesmen — buang `window.confirm`). TemplateFormPage yang kini pakai state CRUD manual + `window.confirm` di-refactor ke `useMasterCrud`.

### 1.5 Wiring klinis = fetch-once Context + fallback konstanta
Pola **persis** [asesmenKatalogContext](../src/components/shared/asesmen/asesmenKatalogContext.tsx) (preseden 2026-06-17):
- Provider `"use client"` fetch `<tab>-tersedia` **SEKALI** saat mount → bangun opsi/template.
- **FALLBACK** ke konstanta lama (mock config) bila DB belum termuat / gagal / offline → tanpa kedip kosong, tanpa regresi.
- Hook `use<Tab>()` dipakai komponen konsumen tanpa prop-drilling.
- Provider dipasang di boundary terdekat tab konsumen (mis. layout detail kunjungan / tab spesifik).

### 1.6 Mock → seed (pola OBAT_MOCK/SDKI_MOCK)
Data array dipindah ke **`*Seed.ts`** Node-loadable (**plain data, tanpa import lucide/React**) agar seed script (Node 24 strip, `@/`-free, `pg` langsung) bisa memuatnya. **Config render tetap di `*Mock.ts`** (TONE_CFG, ICON_REGISTRY, KATEGORI_CFG, JENIS_CFG — semua yg import lucide). Array `*_MOCK` lama dihapus / jadi re-export dari seed bila masih dipakai fallback FE.

### 1.7 Migrasi drift-safe (WAJIB)
`migrate dev` DILARANG (drift checksum, lihat [memory] migration-drift). Per tab:
1. Tulis `prisma/schema/<tab>.prisma` + `prisma/migrations/<ts>_init_master_<tab>/migration.sql` (CREATE TABLE additive).
2. Apply via `prisma/scripts/apply-<tab>.mjs` (pg `Client`, jalankan SQL).
3. `npx prisma migrate resolve --applied <migration_name>` → tandai applied tanpa reset.
4. `npx prisma generate` → refresh client.
5. Seed via `node --env-file=.env prisma/scripts/seed-<tab>.mts`.

---

## 2. TE1 — Status Enum

> **Status: ✅ TE1 SELESAI (2026-06-17)** — schema+migrasi (applied) · Zod · DAL · Service · 3 endpoint · browser API · seed **55 entri / 9 grup** · **master page wired** (SSR-hybrid + CRUD + reorder + DiscardDialog; KODE auto-gen read-only) · **wiring klinis SELEKTIF** (hook reusable `useStatusEnum` + 1 konsumen free-string: InformedConsentTab hubungan; typed-union deferred-by-decision — §2.3). tsc+eslint bersih (`_actor` unused = sengaja). **Lanjut: TE2 Template Anamnesis.**

**Domain OWNS:** katalog enum kecil lintas-modul. 9 **grup** (key fixed, metadata kode) × N **entri** (data DB editable). Entri = `kode` (**auto-gen** `<PREFIX>-NNN`) + `label` + `deskripsi` + `tone` (warna) + `urutan` + `status` + `icon` (key string).

**Grup (fixed, metadata tetap kode) + prefix kode:** `status-pulang`→SPL · `kondisi-umum`→KUM · `tingkat-kesadaran`→TKS · `kondisi-transfer`→KTR · `mode-transport`→MTR · `kelas-perawatan`→KPW · `hubungan-keluarga`→HKL · `profesi-edukator`→PED · `rute-obat`→ROB.

### 2.1 Model — `master.EnumEntry` + `master.EnumCounter`
Metadata grup (label/deskripsi/icon/konsumen) **fixed config** → tetap di `statusEnumMock.ts` (bukan DB; 9 key tak pernah berubah by user). Hanya **entri** masuk DB. Kode auto-gen `<PREFIX>-NNN` via `EnumCounter` (scope=prefix grup, upsert-increment atomik — pola `AsesmenCounter`).

```prisma
// prisma/schema/statusEnum.prisma  (@@schema "master")
model EnumEntry {
  id        String  @id @default(uuid(7)) @db.Uuid
  groupKey  String  @map("group_key")   // status-pulang | kondisi-umum | ... (9 fixed, FE-facing TEXT)
  kode      String                       // `<PREFIX>-NNN` AUTO-GEN (counter per grup), immutable, unik per grup
  label     String
  deskripsi String  @default("")
  tone      String  @default("slate")    // EnumTone FE-facing
  icon      String?                       // key ICON_REGISTRY (render-only)
  urutan    Int     @default(0)
  status    String  @default("Aktif")     // Aktif | NonAktif
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)

  @@index([groupKey, deletedAt])           // list per grup
  @@map("enum_entry")
  @@schema("master")
}

model EnumCounter {                         // scope = prefix grup (SPL/KUM/...); upsert-increment atomik
  scope   String @id
  lastSeq Int    @map("last_seq")
  @@map("enum_counter")
  @@schema("master")
}
```
**Unique partial index** (raw SQL di migration): `CREATE UNIQUE INDEX enum_entry_group_kode_uq ON master.enum_entry (group_key, kode) WHERE deleted_at IS NULL;`

### 2.2 Lapisan (as-built)
| Lapis | File | Catatan |
|---|---|---|
| **Schema (Zod+DTO)** | [statusEnum.ts](../src/lib/schemas/master/statusEnum.ts) | `EnumGroupKeyEnum` (9) · `EnumToneEnum` (9) · `EnumStatusEnum` · **`ENUM_GROUP_PREFIX`** (map grup→prefix) · `CreateEnumEntryInput` (**TANPA kode** — auto-gen) · `UpdateEnumEntryInput` (parsial, **kode & groupKey immutable**) · `EnumQuery` (`groupKey?`/`q?`/`status?`/`limit?`) · `IdParam` · `EnumEntryDTO` (mirror EnumEntry + `groupKey`). |
| **DAL** | [statusEnumDal.ts](../src/lib/dal/master/statusEnumDal.ts) | `create`/`findById`/`update`/`softDelete`/`list` (orderBy `groupKey,urutan,kode,id`) + **`nextEnumSeq`** (counter upsert) + **`maxUrutan`** (default urutan entri baru). `EnumEntryData`/`EnumEntryPatch` (omit kode/groupKey). |
| **Service** | [statusEnumService.ts](../src/lib/services/master/statusEnumService.ts) | `makeStatusEnumService` (factory+DI) · `list` **actor-less** (status `Semua`→undefined) · `create` (kode auto `<PREFIX>-NNN` via `nextEnumSeq` dalam transaksi; urutan default `maxUrutan+1`) · `update` (kode/groupKey immutable) · `remove`. Singleton `statusEnumService`. |
| **Route master** | [status-enum/route.ts](../src/app/api/v1/master/status-enum/route.ts) (GET+POST) + [[id]/route.ts](../src/app/api/v1/master/status-enum/[id]/route.ts) (PATCH+DELETE) | gate `master.konfigurasi`. |
| **Route klinis** | [status-enum-tersedia/route.ts](../src/app/api/v1/master/status-enum-tersedia/route.ts) (GET) | gate `clinical.rekammedis:read`, `scopeKunjungan:false`, status dipaksa `Aktif`, filter `?groupKey=`. |
| **Browser API** | [statusEnum.ts](../src/lib/api/master/statusEnum.ts) | `listStatusEnum` · `listStatusEnumTersedia` · `createStatusEnum` · `updateStatusEnum` · `deleteStatusEnum`. |
| **Seed data** | [statusEnumSeed.ts](../src/lib/master/statusEnumSeed.ts) (plain, Node-loadable) | 9 grup × entri (icon=string, tanpa lucide) + `formatEnumKode`. **`statusEnumMock.ts` di-refactor** → compose `STATUS_ENUM_GROUPS` dari seed (ikon via ICON_REGISTRY + kode generated formula sama → FE≡DB); simpan TONE_CFG/ICON_REGISTRY/helper. |
| **Seed script** | [seed-statusEnum.mts](../prisma/scripts/seed-statusEnum.mts) | `@/`-free, pg langsung; **GENERATE `<PREFIX>-NNN` per grup** (urutan array) + set counter=jumlah entri. ✅ run: 55 entri / 9 counter. |
| **Page swap** | [page.tsx](../src/app/ehis-master/status-enum/page.tsx) (SSR) + [StatusEnumPage.tsx](../src/components/master/status-enum/StatusEnumPage.tsx) (client SSR-hybrid) | ✅ TE1.9 — first paint via `statusEnumService.list`; `items` state dari `initial` (DTO→ItemWithGroup); **groups compose** = meta statis × entri DB per groupKey; CRUD via /api (add `createStatusEnum` · edit `updateStatusEnum` · delete window.confirm · **reorder ↑↓** = 2× PATCH urutan optimistik) + toast; **DiscardDialog** gate pindah kategori saat form add/edit terbuka. [EnumTable](../src/components/master/status-enum/EnumTable.tsx) granular async handlers + `busy` lock; [EnumEntryForm](../src/components/master/status-enum/EnumEntryForm.tsx) **KODE read-only** ("Auto · `<PREFIX>`-NNN" saat create, kode existing saat edit). |

### 2.3 Wiring klinis — strategi **SELEKTIF** (keputusan 2026-06-17)
**Temuan audit konsumen:** konsumen klinis status-enum BUKAN dropdown bebas — mayoritas **typed union** (StatusFisikPane `KesadaranPF`/`KU`, `RIKelas`, Disposisi `jenis`, InformedConsentModal `HubunganPenanda`) dgn **vocab berbeda** dari master (`Composmentis`≠`Compos Mentis`; KU `Berat`≠`Buruk/Kritis`), atau **free-text** (EdukasiPane nama petugas/hubungan), atau **konstanta lokal di luar 9 grup** (TOPIK/MEDIA edukasi). Memaksa master menyetir field bertipe → hilang type-safety + admin bisa simpan nilai tak dikenal.

**Keputusan (user):** wire **HANYA field yang disimpan free-string & cocok**; field **typed-union TETAP union kode** (master = admin/reference, BUKAN sumber field bertipe). Lalu lanjut TE2/TE3.

**Infra reusable ✅** [useStatusEnum.ts](../src/components/shared/enum/useStatusEnum.ts) — hook `useStatusEnum(groupKey)`: fetch SEKALI per grup (cache + inflight dedupe lintas mount) dari `/status-enum-tersedia`, FALLBACK ke `STATUS_ENUM_GROUPS` (entri Aktif) → tanpa kedip. Mengembalikan `{ options, labels, loaded, fromDb }`. **Hanya untuk field free-string.**

**Konsumen ter-wire ✅:**
- **hubungan-keluarga** → [InformedConsentTab](../src/components/shared/medical-records/InformedConsentTab.tsx) `<Select>` Penanda Tangan: opsi = `["Pasien Sendiri", ...master hubungan-keluarga]` (relasi caregiver dari master + self-case konstan), `form.hubungan` tetap string. `HUBUNGAN_TAB` lama dihapus.

**Sengaja TIDAK di-wire (tetap kode):** StatusFisikPane (KU/Kesadaran union) · TTVTab (kesadaran) · Registrasi RI (RIKelas) · Disposisi/PasienPulang (jenis union) · InformedConsentModal (`HubunganPenanda` union + "Pasien Sendiri") · EdukasiPane (free-text/konstanta lokal). Revisit per-konsumen nanti bila perlu (mis. ubah free-text→datalist).

---

## 3. TE2 — Template Anamnesis

**Domain OWNS:** koleksi template anamnesis pre-fill. Flat, field teks kaya. `label` + `kategori` (ChiefComplaint) + `contextTags[]` (IGD/RI/RJ) + isi (`keluhanUtama`/`rps`/`onsetDurasi`/`mekanismeCedera?`/`faktorPemberat`/`faktorPemerut`/`statusGeneralis`/`catatanPerawat?`) + `status`.

### 3.1 Model — `master.TemplateAnamnesis` (1 tabel flat)
```prisma
// prisma/schema/templateAnamnesis.prisma  (@@schema "master")
model TemplateAnamnesis {
  id              String  @id @default(uuid(7)) @db.Uuid
  label           String
  kategori        String                       // ChiefComplaintCategory FE-facing
  contextTags     String[] @map("context_tags") // IGD/RI/RJ
  keluhanUtama    String  @map("keluhan_utama")
  rps             String  @default("")
  onsetDurasi     String  @default("") @map("onset_durasi")
  mekanismeCedera String? @map("mekanisme_cedera")
  faktorPemberat  String  @default("") @map("faktor_pemberat")
  faktorPemerut   String  @default("") @map("faktor_pemerut")
  statusGeneralis String  @default("") @map("status_generalis")
  catatanPerawat  String? @map("catatan_perawat")
  status          String  @default("Aktif")
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)

  @@index([kategori, deletedAt])
  @@map("template_anamnesis")
  @@schema("master")
}
```
Tanpa kode, tanpa counter. `contextTags` = `String[]` (filter konsumen per modul).

### 3.2 Lapisan
| Lapis | File | Catatan |
|---|---|---|
| **Schema** | `src/lib/schemas/master/templateAnamnesis.ts` | `ChiefComplaintEnum` (12) · `ModulContextEnum` (IGD/RI/RJ) · `CreateTemplateAnamnesisInput` · `UpdateTemplateAnamnesisInput` (parsial) · `TemplateAnamnesisQuery` (`q?`/`kategori?`/`context?`/`status?`) · `IdParam` · `TemplateAnamnesisDTO`. Validasi `contextTags` ≥1, `label`+`keluhanUtama` wajib. |
| **DAL** | `src/lib/dal/master/templateAnamnesisDal.ts` | CRUD + `list` (filter q/kategori/context(`has`)/status, orderBy `label`). |
| **Service** | `src/lib/services/master/templateAnamnesisService.ts` | `makeTemplateAnamnesisService` · `list` actor-less + CRUD. Singleton. |
| **Route master** | `src/app/api/v1/master/template-anamnesis/route.ts` + `[id]/route.ts` | gate `master.konfigurasi`. |
| **Route klinis** | `src/app/api/v1/master/template-anamnesis-tersedia/route.ts` | gate `clinical.rekammedis:read`, `?context=IGD\|RI\|RJ`, status Aktif. |
| **Browser API** | `src/lib/api/master/templateAnamnesis.ts` | list/listTersedia/create/update/delete. |
| **Seed** | `src/lib/master/templateAnamnesisSeed.ts` (plain) + `prisma/scripts/seed-templateAnamnesis.mts` | 17 template. KATEGORI_CFG/CONTEXT_CFG tetap di mock. |
| **Page swap** | `page.tsx` SSR + `TemplateAnamnesisPage.tsx` SSR-hybrid | `useMasterCrud` sudah dipakai → tinggal seed dari `initial` + DiscardDialog. |

### 3.3 Wiring klinis (fase akhir TE2)
Context `src/components/shared/anamnesis/templateAnamnesisContext.tsx` (`useTemplateAnamnesis(context)`), fallback konstanta. Konsumen: **AnamnesisPane** (shared, dipakai IGD/RI/RJ) — picker template kini tarik dari master ter-filter `contextTags` sesuai modul aktif. Identifikasi lokasi picker hardcode saat fase wiring.

---

## 4. TE3 — Template Form

**Domain OWNS:** library template form 4 jenis (discriminator `jenis`): **SBAR** (Handover/Konsultasi/Transfer) · **IC-Risiko** (per tindakan) · **Surat** (5 jenis surat pulang) · **Quick-text** (smart phrase CPPT). Tiap jenis punya field beda.

### 4.1 Model — `master.TemplateForm` (1 tabel, diskriminasi `jenis` + payload JSONB)
Pola **identik** `medicalrecord.PenilaianKomposit` (1 tabel diskriminasi `jenis`, `data` JSONB) — field type-specific tak dipaksa jadi kolom. Kolom umum (id/jenis/label/deskripsi/status) + **`payload` JSONB** untuk field per-jenis (divalidasi Zod discriminated union, set/replace utuh).

```prisma
// prisma/schema/templateForm.prisma  (@@schema "master")
model TemplateForm {
  id        String  @id @default(uuid(7)) @db.Uuid
  jenis     String                          // sbar | ic-risiko | surat | quick-text (FE-facing)
  label     String
  deskripsi String  @default("")
  status    String  @default("Aktif")
  /// payload per-jenis — divalidasi discriminatedUnion Zod, di-set/replace utuh:
  ///  sbar:       { context, situation, background, assessment, recommendation }
  ///  ic-risiko:  { tindakan, kodeIcd9?, risikoSpesifik[], manfaat, alternatif, konsekuensiTolak }
  ///  surat:      { jenisSurat, body }
  ///  quick-text: { shortcut, kategori, expansion }
  payload   Json    @db.JsonB
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)

  @@index([jenis, deletedAt])
  @@map("template_form")
  @@schema("master")
}
```
**Catatan unik:** Quick-text `shortcut` harus unik (mis. `/normal-thorax`). Karena di JSONB, unik ditegakkan di **Service layer** (cek sebelum create/update jenis quick-text), bukan DB constraint. (Bila perlu jaminan DB → kolom generated/expression index fase lanjut.)

### 4.2 Lapisan
| Lapis | File | Catatan |
|---|---|---|
| **Schema** | `src/lib/schemas/master/templateForm.ts` | `TemplateFormJenisEnum` (4) · sub-schema payload per jenis (`SbarPayload`/`IcRisikoPayload`/`SuratPayload`/`QuickTextPayload`) · **`CreateTemplateFormInput` = `z.discriminatedUnion("jenis", …)`** (label+payload sesuai jenis) · `UpdateTemplateFormInput` (parsial, **jenis immutable**) · `TemplateFormQuery` (`jenis?`/`q?`/`status?`) · `IdParam` · `TemplateFormDTO`. Enum bantu: `SBARContext`/`JenisSuratPulang`/`QuickTextKategori`. |
| **DAL** | `src/lib/dal/master/templateFormDal.ts` | CRUD + `list` (filter jenis/q/status, orderBy `jenis,label`). JSONB ⇄ defensif (`toPayload`). |
| **Service** | `src/lib/services/master/templateFormService.ts` | `makeTemplateFormService` · `list` actor-less + CRUD · **validasi shortcut unik** (jenis quick-text) → `Errors.conflict`. JSONB parse via Zod payload schema. Singleton. |
| **Route master** | `src/app/api/v1/master/template-form/route.ts` + `[id]/route.ts` | gate `master.konfigurasi`. |
| **Route klinis** | `src/app/api/v1/master/template-form-tersedia/route.ts` | gate `clinical.rekammedis:read`, `?jenis=`, status Aktif. |
| **Browser API** | `src/lib/api/master/templateForm.ts` | list/listTersedia/create/update/delete. |
| **Seed** | `src/lib/master/templateFormSeed.ts` (plain) + `prisma/scripts/seed-templateForm.mts` | 20 template (3 SBAR + 4 IC + 5 Surat + 8 Quick-text) → flatten ke `{jenis,label,deskripsi,status,payload}`. JENIS_CFG/SURAT_CFG/dst tetap di mock. |
| **Page swap** | `page.tsx` SSR + `TemplateFormPage.tsx` SSR-hybrid | **refactor**: state CRUD manual + `window.confirm` → `useMasterCrud` + DiscardDialog. Sidebar per-jenis tetap. |

### 4.3 Wiring klinis (fase akhir TE3)
Context `src/components/shared/template-form/templateFormContext.tsx` (`useTemplateForm(jenis)`), fallback konstanta. Konsumen per jenis:
- **sbar** → HandoverTab · KonsultasiTab · SBAR Transfer IGD→RI (picker template SBAR).
- **ic-risiko** → InformedConsentTab (auto-populate risiko saat pilih tindakan).
- **surat** → PasienPulangTab RI · SuratDokumenTab RJ (body template + placeholder).
- **quick-text** → CPPTTab (expand `/shortcut` → paragraf).
> 4 konsumen independen — boleh wiring satu per satu.

---

## 5. Risiko & catatan

- **`kelas-perawatan` vs type `RIKelas`** — enum Kelas Perawatan beririsan dgn `RIKelas` (`src/lib/data.ts`) **dan** master Ruangan (locationType:kelas). Saat wiring Registrasi RI: master enum = **label/tampilan**, sumber kelas operasional tetap tree Ruangan + `RIKelas` type. JANGAN bikin master enum jadi FK tarif/bed (itu domain Ruangan/Tarif). Status Enum di sini = **display/dropdown reference**, bukan otoritas kelas billing.
- **`rute-obat`** — master dasar rute ada di Katalog Obat (KFA). Entri di sini hanya kompat dropdown asesmen rekonsiliasi; jangan jadikan sumber rute resep (itu Obat/KFA).
- **Quick-text shortcut unik** — ditegakkan Service, bukan DB (JSONB). Uji race ringan; cukup untuk volume master kecil.
- **Group-meta Status Enum hard-coded** — 9 key fixed di kode. Menambah GRUP baru = perubahan kode (bukan data). User hanya kelola **entri**. Ini disengaja (grup = kontrak konsumen, bukan data bebas).
- **Kode Status Enum auto-gen (bukan semantik)** — sejak revisi 2026-06-17 kode = `<PREFIX>-NNN` surrogate (mis. `SPL-003`), BUKAN `RAWAT_INAP`/`MENINGGAL`. **Konsekuensi:** konsumen klinis & logika yang dulu mengandalkan kode semantik (mis. mapping Disposisi `jenis`, status BPJS) HARUS match via **`label`** atau **`id`** + snapshot, bukan string kode. Saat wiring (TE1.10): simpan `id`+snapshot `label` di rekam medis, jangan hard-match kode. Authority kelas/billing tetap di `RIKelas`/Ruangan/Tarif (lihat butir pertama).
- **Beranda master count** ([berandaShared.ts](../src/components/master/beranda/berandaShared.ts)) baca mock 3 tab ini → setelah swap, ganti ke count indikatif / fetch (pola Obat saat OBAT_MOCK dihapus).

---

## 6. Checklist eksekusi (per tab — vertical slice)

> Urutan: **TE1 → TE2 → TE3**. Tiap langkah selesai → `npx tsc --noEmit` (filter `src/`) + `eslint` file tersentuh sebelum lanjut. `_actor` unused = sengaja (ABAC-seam, pola skalaService).

### TE1 — Status Enum
- [x] **TE1.1** Schema `statusEnum.prisma` (`EnumEntry` + **`EnumCounter`**) + migration `init_master_status_enum` (CREATE TABLE + unique partial index) → apply-script + `migrate resolve --applied` + `generate`. ✅
- [x] **TE1.2** Zod `schemas/master/statusEnum.ts` (enums + `ENUM_GROUP_PREFIX` + Create(tanpa kode)/Update/Query/DTO). ✅
- [x] **TE1.3** DAL `statusEnumDal.ts` (+ `nextEnumSeq` + `maxUrutan`). ✅
- [x] **TE1.4** Service `statusEnumService.ts` (kode auto `<PREFIX>-NNN` per grup, counter atomik). ✅
- [x] **TE1.5** Route master `/status-enum` + `/:id` (gate `master.konfigurasi`). ✅
- [x] **TE1.6** Route klinis `/status-enum-tersedia` (gate `clinical.rekammedis:read`). ✅
- [x] **TE1.7** Browser API `api/master/statusEnum.ts`. ✅
- [x] **TE1.8** Seed: `statusEnumSeed.ts` (plain) + refactor `statusEnumMock.ts` (compose dari seed) + `seed-statusEnum.mts` → jalankan **55 entri / 9 grup** (SPL=7·KUM=4·TKS=6·KTR=3·MTR=5·KPW=7·HKL=7·PED=6·ROB=10). ✅
- [x] **TE1.9** Page swap SSR-hybrid ([page.tsx](../src/app/ehis-master/status-enum/page.tsx) + [StatusEnumPage.tsx](../src/components/master/status-enum/StatusEnumPage.tsx)) — CRUD via /api + reorder optimistik + DiscardDialog (pindah kategori) + KODE read-only auto-gen. tsc+eslint bersih. ✅
- [x] **TE1.10** Wiring klinis **SELEKTIF** (keputusan user 2026-06-17): hook reusable [useStatusEnum](../src/components/shared/enum/useStatusEnum.ts) (fetch-once + cache + fallback) + 1 konsumen free-string ter-wire ([InformedConsentTab](../src/components/shared/medical-records/InformedConsentTab.tsx) hubungan = master `hubungan-keluarga` + "Pasien Sendiri"). Field typed-union (Kesadaran/KU/RIKelas/Disposisi/HubunganPenanda) **TIDAK di-wire by design** (§2.3). ✅
- [x] **TE1.11** Update progress: doc ini (status ✅ + §2.2/§2.3). CLAUDE.md cell `/ehis-master` + DONE.md → saat batch TE selesai. ✅

### TE2 — Template Anamnesis
- [ ] **TE2.1** Schema `templateAnamnesis.prisma` + migration → apply + resolve + generate.
- [ ] **TE2.2** Zod `schemas/master/templateAnamnesis.ts`.
- [ ] **TE2.3** DAL · **TE2.4** Service · **TE2.5** Route master · **TE2.6** Route klinis (`?context=`) · **TE2.7** Browser API.
- [ ] **TE2.8** Seed (17 template).
- [ ] **TE2.9** Page swap SSR-hybrid (seed `useMasterCrud` + DiscardDialog).
- [ ] **TE2.10** Wiring klinis: Context + AnamnesisPane picker (filter `contextTags` per modul).
- [ ] **TE2.11** Update progress.

### TE3 — Template Form
- [ ] **TE3.1** Schema `templateForm.prisma` (JSONB payload) + migration → apply + resolve + generate.
- [ ] **TE3.2** Zod `schemas/master/templateForm.ts` (`discriminatedUnion` payload per jenis).
- [ ] **TE3.3** DAL · **TE3.4** Service (validasi shortcut unik quick-text) · **TE3.5** Route master · **TE3.6** Route klinis (`?jenis=`) · **TE3.7** Browser API.
- [ ] **TE3.8** Seed (20 template, 4 jenis flatten ke payload).
- [ ] **TE3.9** Page swap SSR-hybrid (**refactor ke `useMasterCrud`** + DiscardDialog).
- [ ] **TE3.10** Wiring klinis: Context + 4 konsumen (Handover/Konsul/Transfer SBAR · IC · Surat · CPPT quick-text).
- [ ] **TE3.11** Update progress.
