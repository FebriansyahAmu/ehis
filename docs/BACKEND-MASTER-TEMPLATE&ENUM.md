# EHIS Backend — Master Data: **Grup Template & Enum** (schema `master`)

> **Konfigurasi sistem klinis** (bukan katalog item, bukan transaksional): enum kecil lintas-modul + template pre-fill yang **mengganti hardcoded constants** yang kini tersebar di tab `ehis-care`. Master = **single source of truth** untuk dropdown/pilihan/template → ubah di sini, semua modul konsumen ikut berubah. Banyak dibaca, jarang ditulis → kandidat **cache** (FLOWS §12).
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** (core rules · tech · best practices). Bila konflik, FLOWS menang.
> **1 file per grup pengerjaan** master (`BACKEND-MASTER-<GRUP>.md`). File ini = grup **Template & Enum** (menu sidebar `/ehis-master` → "Template & Enum"). Peta seluruh grup → [BACKEND-MASTER-SUMBER-DAYA §0](BACKEND-MASTER-SUMBER-DAYA.md#0-peta-grup-master-urut-frontend-ehis-master).
> **Dokumen terkait:** [API-RULES](API-RULES.md) (resep endpoint) · [BACKEND-AUTH](BACKEND-AUTH.md) (RBAC) · [BACKEND-MASTER-KATALOG-KLINIS](BACKEND-MASTER-KATALOG-KLINIS.md) (preseden katalog leaf) · [BACKEND-MASTER-SKALA-KLINIK](BACKEND-MASTER-SKALA-KLINIK.md) (preseden JSONB-block + counter).
> **Terkait:** [CLAUDE.md](../CLAUDE.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md).
>
> **Stack:** PostgreSQL · Prisma (`@@schema("master")`) · layered **Route→Service→DAL→Prisma** · Redis cache-aside (menyusul) · Auth.js RBAC.
> **Status:** 🟢 **TE1 ✅ (2026-06-17) · TE2 ✅ (2026-06-30) · TE3 📋 PLANNED.** Eksekusi **per tab** (TE1 → TE2 → TE3), tiap tab = vertical slice lengkap (schema+migrasi → Zod → DAL → Service → endpoint → seed → page SSR-hybrid → wiring klinis).

---

## 0. Cakupan grup

Menu **Template & Enum** di `/ehis-master` (gate **`master.konfigurasi`**, Admin). 3 sub-menu = 3 tab = 3 target pengerjaan. **Tiap tab berdiri sendiri** (domain field beda) — JANGAN disatukan ke satu tabel.

| # | Tab | Route FE | Mock / tipe FE | Konsumen klinis (saat ini hardcode) | Status backend |
|---|---|---|---|---|---|
| TE1 | **Status Enum** | [/ehis-master/status-enum](../src/app/ehis-master/status-enum/) | [statusEnumMock.ts](../src/lib/master/statusEnumMock.ts) — **3 grup / 15 entri** (6 grup dihapus 2026-06-17) | SBAR Transfer/Handover (Kondisi Transfer · Mode Transport) · Informed Consent (Hubungan Keluarga) | ✅ |
| TE2 | **Template Anamnesis** | [/ehis-master/template-anamnesis](../src/app/ehis-master/template-anamnesis/) | [templateAnamnesisMock.ts](../src/lib/master/templateAnamnesisMock.ts) (tipe+config) + [templateAnamnesisSeed.ts](../src/lib/master/templateAnamnesisSeed.ts) — 17 template | AnamnesisPane IGD/RI/RJ (picker `?modul=`) | ✅ |
| TE3 | **Template Form** | [/ehis-master/template-form](../src/app/ehis-master/template-form/) | [templateFormMock.ts](../src/lib/master/templateFormMock.ts) — 20 template (4 jenis) | HandoverTab · KonsultasiTab · InformedConsentTab · PasienPulang · SuratDokumen · CPPT quick-text | 📋 |

> **Fakta awal (verifikasi 2026-06-17):** Ketiga mock **belum dikonsumsi tab klinis manapun** — hanya dipakai page master masing-masing + hitungan Beranda master ([berandaShared.ts](../src/components/master/beranda/berandaShared.ts)). Tab klinis kini punya **konstanta hardcode sendiri**. "Wiring" = arahkan tab klinis konsumsi master via API (ganti konstanta → fetch + fallback), **bukan** menyambung mock yang sudah dipakai.

---

## 1. Keputusan desain lintas-tab (baca dulu)

### 1.1 Model per tab — bukan 1 tabel universal
Tiap tab punya bentuk data sangat berbeda (enum baris kecil vs template teks panjang vs union 4-jenis). Federasi paksa → over-engineering. **3 tabel terpisah**, masing-masing **katalog leaf** (TANPA optimistic-version), uuid v7, soft-delete (`deletedAt`), timestamptz. Enum FE-facing (kategori/jenis/status/tone/context) = **TEXT pass-through** divalidasi Zod (pola identik `Sdki`/`SkalaInstrument`/`Obat`).

### 1.2 Kode auto-gen (Status Enum) vs tanpa kode (Template)
- **Status Enum** — `kode` **AUTO-GEN per grup/kategori** `<PREFIX>-NNN` (pola **Asesmen Katalog**), prefix per grup (`KTR`/`MTR`/`HKL` — 3 grup) via **`master.EnumCounter`** (scope=prefix, upsert-increment atomik). Kode **BUKAN input manual**, immutable, unik per grup. _(Revisi 2026-06-17: kode auto-gen; lalu lingkup diciutkan dari 9→3 grup — §2.3/§5.)_
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

> **Status: ✅ TE1 SELESAI (2026-06-17)** — schema+migrasi (applied) · Zod · DAL · Service · 3 endpoint · browser API · seed **15 entri / 3 grup** (KTR·MTR·HKL — **6 grup dihapus**, §2.3) · **master page wired** (SSR-hybrid + CRUD + reorder + DiscardDialog; KODE auto-gen read-only) · **wiring klinis SELEKTIF** (hook reusable `useStatusEnum` + 1 konsumen free-string: InformedConsentTab hubungan). tsc+eslint bersih (`_actor` unused = sengaja). **Lanjut: TE2 Template Anamnesis.**

**Domain OWNS:** katalog enum kecil lintas-modul. 9 **grup** (key fixed, metadata kode) × N **entri** (data DB editable). Entri = `kode` (**auto-gen** `<PREFIX>-NNN`) + `label` + `deskripsi` + `tone` (warna) + `urutan` + `status` + `icon` (key string).

**Grup (fixed, metadata tetap kode) + prefix kode — 3 grup:** `kondisi-transfer`→KTR · `mode-transport`→MTR · `hubungan-keluarga`→HKL.
> **6 grup DIHAPUS (2026-06-17)** dari seed/FE/Zod/DB: `status-pulang` (lifecycle Disposisi + BPJS), `kondisi-umum`/`tingkat-kesadaran` (typed union `KU`/`KesadaranPF`), `kelas-perawatan` (otoritas Ruangan/Tarif/RIKelas), `rute-obat` (otoritas Obat/KFA), `profesi-edukator` (otoritas Pegawai). Alasan lengkap §2.3/§5.

### 2.1 Model — `master.EnumEntry` + `master.EnumCounter`
Metadata grup (label/deskripsi/icon/konsumen) **fixed config** → tetap di `statusEnumMock.ts` (bukan DB; 9 key tak pernah berubah by user). Hanya **entri** masuk DB. Kode auto-gen `<PREFIX>-NNN` via `EnumCounter` (scope=prefix grup, upsert-increment atomik — pola `AsesmenCounter`).

```prisma
// prisma/schema/statusEnum.prisma  (@@schema "master")
model EnumEntry {
  id        String  @id @default(uuid(7)) @db.Uuid
  groupKey  String  @map("group_key")   // kondisi-transfer | mode-transport | hubungan-keluarga (3 fixed, FE-facing TEXT)
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

model EnumCounter {                         // scope = prefix grup (KTR/MTR/HKL); upsert-increment atomik
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
| **Schema (Zod+DTO)** | [statusEnum.ts](../src/lib/schemas/master/statusEnum.ts) | `EnumGroupKeyEnum` (3) · `EnumToneEnum` (9) · `EnumStatusEnum` · **`ENUM_GROUP_PREFIX`** (3: KTR/MTR/HKL) · `CreateEnumEntryInput` (**TANPA kode** — auto-gen) · `UpdateEnumEntryInput` (parsial, **kode & groupKey immutable**) · `EnumQuery` (`groupKey?`/`q?`/`status?`/`limit?`) · `IdParam` · `EnumEntryDTO` (mirror EnumEntry + `groupKey`). |
| **DAL** | [statusEnumDal.ts](../src/lib/dal/master/statusEnumDal.ts) | `create`/`findById`/`update`/`softDelete`/`list` (orderBy `groupKey,urutan,kode,id`) + **`nextEnumSeq`** (counter upsert) + **`maxUrutan`** (default urutan entri baru). `EnumEntryData`/`EnumEntryPatch` (omit kode/groupKey). |
| **Service** | [statusEnumService.ts](../src/lib/services/master/statusEnumService.ts) | `makeStatusEnumService` (factory+DI) · `list` **actor-less** (status `Semua`→undefined) · `create` (kode auto `<PREFIX>-NNN` via `nextEnumSeq` dalam transaksi; urutan default `maxUrutan+1`) · `update` (kode/groupKey immutable) · `remove`. Singleton `statusEnumService`. |
| **Route master** | [status-enum/route.ts](../src/app/api/v1/master/status-enum/route.ts) (GET+POST) + [[id]/route.ts](../src/app/api/v1/master/status-enum/[id]/route.ts) (PATCH+DELETE) | gate `master.konfigurasi`. |
| **Route klinis** | [status-enum-tersedia/route.ts](../src/app/api/v1/master/status-enum-tersedia/route.ts) (GET) | gate `clinical.rekammedis:read`, `scopeKunjungan:false`, status dipaksa `Aktif`, filter `?groupKey=`. |
| **Browser API** | [statusEnum.ts](../src/lib/api/master/statusEnum.ts) | `listStatusEnum` · `listStatusEnumTersedia` · `createStatusEnum` · `updateStatusEnum` · `deleteStatusEnum`. |
| **Seed data** | [statusEnumSeed.ts](../src/lib/master/statusEnumSeed.ts) (plain, Node-loadable) | **3 grup** × entri (icon=string, tanpa lucide) + `formatEnumKode`. **`statusEnumMock.ts` di-refactor** → compose `STATUS_ENUM_GROUPS` dari seed (ikon via ICON_REGISTRY + kode generated formula sama → FE≡DB); simpan TONE_CFG/ICON_REGISTRY/helper. |
| **Seed script** | [seed-statusEnum.mts](../prisma/scripts/seed-statusEnum.mts) | `@/`-free, pg langsung; **GENERATE `<PREFIX>-NNN` per grup** (urutan array) + set counter=jumlah entri. ✅ run: **15 entri / 3 counter** (KTR=3·MTR=5·HKL=7). |
| **Page swap** | [page.tsx](../src/app/ehis-master/status-enum/page.tsx) (SSR) + [StatusEnumPage.tsx](../src/components/master/status-enum/StatusEnumPage.tsx) (client SSR-hybrid) | ✅ TE1.9 — first paint via `statusEnumService.list`; `items` state dari `initial` (DTO→ItemWithGroup); **groups compose** = meta statis × entri DB per groupKey; CRUD via /api (add `createStatusEnum` · edit `updateStatusEnum` · delete window.confirm · **reorder ↑↓** = 2× PATCH urutan optimistik) + toast; **DiscardDialog** gate pindah kategori saat form add/edit terbuka. [EnumTable](../src/components/master/status-enum/EnumTable.tsx) granular async handlers + `busy` lock; [EnumEntryForm](../src/components/master/status-enum/EnumEntryForm.tsx) **KODE read-only** ("Auto · `<PREFIX>`-NNN" saat create, kode existing saat edit). |

### 2.3 Wiring klinis — strategi **SELEKTIF** (keputusan 2026-06-17)
**Temuan audit konsumen:** konsumen klinis status-enum BUKAN dropdown bebas — mayoritas **typed union** (StatusFisikPane `KesadaranPF`/`KU`, `RIKelas`, Disposisi `jenis`, InformedConsentModal `HubunganPenanda`) dgn **vocab berbeda** dari master (`Composmentis`≠`Compos Mentis`; KU `Berat`≠`Buruk/Kritis`), atau **free-text** (EdukasiPane nama petugas/hubungan), atau **konstanta lokal di luar 9 grup** (TOPIK/MEDIA edukasi). Memaksa master menyetir field bertipe → hilang type-safety + admin bisa simpan nilai tak dikenal.

**Keputusan (user):** wire **HANYA field yang disimpan free-string & cocok**; field **typed-union TETAP union kode** (master = admin/reference, BUKAN sumber field bertipe). Lalu lanjut TE2/TE3.

> **Lanjut: TE3 Template Form** (TE2 selesai — §3).

**Infra reusable ✅** [useStatusEnum.ts](../src/components/shared/enum/useStatusEnum.ts) — hook `useStatusEnum(groupKey)`: fetch SEKALI per grup (cache + inflight dedupe lintas mount) dari `/status-enum-tersedia`, FALLBACK ke `STATUS_ENUM_GROUPS` (entri Aktif) → tanpa kedip. Mengembalikan `{ options, labels, loaded, fromDb }`. **Hanya untuk field free-string.**

**Konsumen ter-wire ✅:**
- **hubungan-keluarga** → [InformedConsentTab](../src/components/shared/medical-records/InformedConsentTab.tsx) `<Select>` Penanda Tangan: opsi = `["Pasien Sendiri", ...master hubungan-keluarga]` (relasi caregiver dari master + self-case konstan), `form.hubungan` tetap string. `HUBUNGAN_TAB` lama dihapus.

**6 grup DIHAPUS dari master (2026-06-17)** — bukan sekadar tak di-wire, tapi dibuang dari seed/FE (`statusEnumSeed`/`statusEnumMock` `StatusEnumKey`)/Zod (`EnumGroupKeyEnum`/`ENUM_GROUP_PREFIX`)/DB (re-seed wipe). Field klinisnya tetap pakai sumber masing-masing:
- `status-pulang` → typed union + state-machine Disposisi (+ BPJS). · `kondisi-umum`/`tingkat-kesadaran` → union `KU`/`KesadaranPF` di StatusFisikPane/TTV. · `kelas-perawatan` → `RIKelas`/master Ruangan/Tarif. · `rute-obat` → master Obat/KFA. · `profesi-edukator` → master Pegawai (profesi) / EdukasiPane free-text.

Master Status Enum kini **murni 3 grup operasional** (Kondisi Transfer · Mode Transport · Hubungan Keluarga). Tindak lanjut wiring sisa yang layak: `mode-transport` + `kondisi-transfer` di SBAR Transfer/Handover (pakai `useStatusEnum`).

---

## 3. TE2 — Template Anamnesis

> **Status: ✅ TE2 SELESAI (2026-06-30)** — schema+migrasi `20260630120000` (applied, no drift) · Zod · DAL · Service · 3 endpoint (master CRUD + `template-anamnesis-tersedia?modul=`) · browser API · seed **17 template** (IGD 8 · RI 6 · RJ 5, dual-tag terhitung) · master page SSR-hybrid · **wiring klinis 3 pane** (IGD/RI/RJ). tsc+eslint bersih (`_actor` unused = sengaja).
>
> **Deviasi dari rencana (as-built):**
> 1. Query konsumen = **`?modul=`** (bukan `?context=`); DTO konsumen ringkas terpisah **`AnamnesisTemplateDTO`** (hanya field pre-fill).
> 2. Wiring **bukan** Context-provider + fallback konstanta → pakai **shared komponen** [AnamnesisTemplatePicker](../src/components/shared/medical-records/AnamnesisTemplatePicker.tsx) (fetch saat mount, loading/empty/error in-place). **3 array hardcode lama DIHAPUS** (`IGD_TEMPLATES` di AsesmenMedisTab · `ANAMNESIS_TEMPLATES` di asesmenAwalShared · `ANAMNESIS_RJ_TEMPLATES` di asesmenAwalRJShared) → DB = single source; picker degradasi ke empty/error, form anamnesis tetap berfungsi.
> 3. Bukan 1 "AnamnesisPane shared" — IGD (inline `AsesmenMedisTab`), RI (`AnamnesisPaneRI`), RJ (`AnamnesisPaneRJ`) pane terpisah; **ketiganya** di-wire (`modul="IGD|RI|RJ"`, RJ map `statusGeneralis→keadaanUmum`).
> 4. `TEMPLATE_ANAMNESIS_MOCK` **dihapus**; data → [templateAnamnesisSeed.ts](../src/lib/master/templateAnamnesisSeed.ts), tipe+config (KATEGORI_CFG/CONTEXT_CFG/helper) tetap di `templateAnamnesisMock.ts`; Beranda master baca `TEMPLATE_ANAMNESIS_SEED.length`.

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
| **Route klinis** | [template-anamnesis-tersedia/route.ts](../src/app/api/v1/master/template-anamnesis-tersedia/route.ts) | gate `clinical.rekammedis:read`, `scopeKunjungan:false`, `?modul=IGD\|RI\|RJ` (wajib), status Aktif. |
| **Browser API** | `src/lib/api/master/templateAnamnesis.ts` | list/listTersedia/create/update/delete. |
| **Seed** | `src/lib/master/templateAnamnesisSeed.ts` (plain) + `prisma/scripts/seed-templateAnamnesis.mts` | 17 template. KATEGORI_CFG/CONTEXT_CFG tetap di mock. |
| **Page swap** | `page.tsx` SSR + `TemplateAnamnesisPage.tsx` SSR-hybrid | `useMasterCrud` sudah dipakai → tinggal seed dari `initial` + DiscardDialog. |

### 3.3 Wiring klinis ✅ (as-built)
Shared komponen [AnamnesisTemplatePicker](../src/components/shared/medical-records/AnamnesisTemplatePicker.tsx) (`modul` prop) menggantikan 3 picker hardcode. Fetch `template-anamnesis-tersedia?modul=` saat mount; klik template → `onApply(t: AnamnesisTemplateDTO)` prefill form. Di-wire ke **3 pane**: IGD ([AsesmenMedisTab](../src/components/igd/tabs/AsesmenMedisTab.tsx) `AnamnesisPane`), RI ([AnamnesisPaneRI](../src/components/rawat-inap/asesmenAwal/AnamnesisPaneRI.tsx)), RJ ([AnamnesisPaneRJ](../src/components/rawat-jalan/asesmenAwal/AnamnesisPaneRJ.tsx) — map `statusGeneralis→keadaanUmum`). **Tanpa fallback konstanta** (DB single source) — picker degradasi anggun ke empty/error, form tetap jalan.

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

- **✅ Cleanup 9→3 grup (2026-06-17, DONE)** — grup yang punya otoritas lain / typed-union / vocab baku **sudah dihapus** dari master (status-pulang, kondisi-umum, tingkat-kesadaran, kelas-perawatan, rute-obat, profesi-edukator). Tidak ada lagi "second source of truth": kelas→Ruangan/Tarif/`RIKelas` · rute→Obat/KFA · profesi→Pegawai · status-pulang→Disposisi+BPJS · KU/kesadaran→union. Master Status Enum = **3 grup operasional free-string saja**.
- **Group-meta Status Enum hard-coded** — 3 key fixed di kode (`StatusEnumKey`/`EnumGroupKeyEnum`). Menambah GRUP baru = perubahan kode (bukan data). User hanya kelola **entri**. Disengaja (grup = kontrak konsumen).
- **Kode Status Enum auto-gen surrogate** — kode = `<PREFIX>-NNN` (KTR/MTR/HKL), BUKAN semantik. Konsumen klinis menyimpan **label** (free-string), bukan kode → tak ada logika yang hard-match kode (3 grup tersisa memang display-only).
- **Quick-text shortcut unik** (TE3) — ditegakkan Service, bukan DB (JSONB). Uji race ringan; cukup untuk volume master kecil.
- **Beranda master count** ([berandaShared.ts](../src/components/master/beranda/berandaShared.ts)) — `sumStatusEnum()` auto-reduce ke 3 grup/15 entri (hanya `reduce`/`.length`, tak ada break). Saat swap penuh ke DB, ganti ke count indikatif/fetch (pola Obat).

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
- [x] **TE1.8** Seed: `statusEnumSeed.ts` (plain) + refactor `statusEnumMock.ts` (compose dari seed) + `seed-statusEnum.mts` → jalankan **15 entri / 3 grup** (KTR=3·MTR=5·HKL=7). _(Awalnya 9 grup/55 entri; 6 grup dihapus 2026-06-17.)_ ✅
- [x] **TE1.9** Page swap SSR-hybrid ([page.tsx](../src/app/ehis-master/status-enum/page.tsx) + [StatusEnumPage.tsx](../src/components/master/status-enum/StatusEnumPage.tsx)) — CRUD via /api + reorder optimistik + DiscardDialog (pindah kategori) + KODE read-only auto-gen. tsc+eslint bersih. ✅
- [x] **TE1.10** Wiring klinis **SELEKTIF** (keputusan user 2026-06-17): hook reusable [useStatusEnum](../src/components/shared/enum/useStatusEnum.ts) (fetch-once + cache + fallback) + 1 konsumen free-string ter-wire ([InformedConsentTab](../src/components/shared/medical-records/InformedConsentTab.tsx) hubungan = master `hubungan-keluarga` + "Pasien Sendiri"). Field typed-union (Kesadaran/KU/RIKelas/Disposisi/HubunganPenanda) **TIDAK di-wire by design** (§2.3). ✅
- [x] **TE1.11** Update progress: doc ini (status ✅ + §2.2/§2.3). CLAUDE.md cell `/ehis-master` + DONE.md → saat batch TE selesai. ✅

### TE2 — Template Anamnesis ✅ (2026-06-30)
- [x] **TE2.1** Schema `templateAnamnesis.prisma` + migration `20260630120000` → apply (pg) + resolve --applied + generate. ✅
- [x] **TE2.2** Zod `schemas/master/templateAnamnesis.ts` (ChiefComplaint 12 · Modul IGD/RI/RJ · Create/Update/Query/IdParam + `TemplateAnamnesisDTO` + `AnamnesisTemplateDTO` konsumen). ✅
- [x] **TE2.3** DAL · **TE2.4** Service (factory, list actor-less + CRUD + `listForModul`) · **TE2.5** Route master (gate `master.konfigurasi`) · **TE2.6** Route klinis `template-anamnesis-tersedia?modul=` (gate `clinical.rekammedis:read`) · **TE2.7** Browser API (master + tersedia). ✅
- [x] **TE2.8** Seed: `templateAnamnesisSeed.ts` (plain) + `seed-template-anamnesis.mts` → **17 template**; `TEMPLATE_ANAMNESIS_MOCK` dihapus; beranda → `TEMPLATE_ANAMNESIS_SEED.length`. ✅
- [x] **TE2.9** Page swap SSR-hybrid ([page.tsx](../src/app/ehis-master/template-anamnesis/page.tsx) + [TemplateAnamnesisPage.tsx](../src/components/master/template-anamnesis/TemplateAnamnesisPage.tsx)) — `useMasterCrud` seed dari `initial` + CRUD via /api + toast. ✅
- [x] **TE2.10** Wiring klinis: **shared [AnamnesisTemplatePicker](../src/components/shared/medical-records/AnamnesisTemplatePicker.tsx)** (fetch `?modul=`) di IGD/RI/RJ; 3 array hardcode dihapus. _(Bukan Context-provider — §3.3 deviasi.)_ ✅
- [x] **TE2.11** Update progress: doc ini (§0/§3/§6 + header) + CLAUDE.md. ✅

### TE3 — Template Form
- [ ] **TE3.1** Schema `templateForm.prisma` (JSONB payload) + migration → apply + resolve + generate.
- [ ] **TE3.2** Zod `schemas/master/templateForm.ts` (`discriminatedUnion` payload per jenis).
- [ ] **TE3.3** DAL · **TE3.4** Service (validasi shortcut unik quick-text) · **TE3.5** Route master · **TE3.6** Route klinis (`?jenis=`) · **TE3.7** Browser API.
- [ ] **TE3.8** Seed (20 template, 4 jenis flatten ke payload).
- [ ] **TE3.9** Page swap SSR-hybrid (**refactor ke `useMasterCrud`** + DiscardDialog).
- [ ] **TE3.10** Wiring klinis: Context + 4 konsumen (Handover/Konsul/Transfer SBAR · IC · Surat · CPPT quick-text).
- [ ] **TE3.11** Update progress.
