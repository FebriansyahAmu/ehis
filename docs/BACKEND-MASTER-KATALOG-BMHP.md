# EHIS Master — Workflow **Katalog BMHP / BHP** (schema `master`)

> **Grup:** Katalog Klinis (`/ehis-master`). Dokumen ini = **workflow pengerjaan** sub-grup baru
> **Katalog BMHP/BHP** (Bahan Medis Habis Pakai / Bahan Habis Pakai), dibangun **MENIRU Katalog Obat**
> (arsitektur, layering, pola kode auto, leaf soft-delete, SSR-hybrid). Referensi induk:
> [BACKEND-MASTER-KATALOG-KLINIS.md §C.1](BACKEND-MASTER-KATALOG-KLINIS.md) (Katalog Obat) ·
> kontrak [API-RULES.md](API-RULES.md) (menang: [BACKEND-FLOWS.md](BACKEND-FLOWS.md)).
>
> **Status:** ✅ **SELESAI (FE + Backend, 2026-06-19)** — `/ehis-master/katalog-bmhp` wired penuh ke DB
> `master.bmhp` (CRUD layered, gate `master.katalog`, kode auto `BHP-<YYMM><NNN>`, leaf soft-delete, SSR-hybrid).
> Accent **teal**, ikon **Syringe**, 3 tab, DiscardDialog. **18 item ter-seed** (`BHP-2606001..018`). TSC bersih.

---

## 0. Tujuan & keputusan

**Pisahkan Obat vs BMHP/BHP menjadi DUA katalog terpisah** (model, halaman, kode, seed sendiri) —
BUKAN satu tabel dengan flag `jenis`. Alasan:

1. **Field set beda jauh.** Obat punya golongan UU 35/2009 (Narkotika/Psikotropika), HAM/LASA, indikasi/dosis/ESO/interaksi, pemetaan KFA **zat aktif (BZA)**. BMHP punya ukuran/size, steril/single-use, kelas risiko alkes (A–D), no. izin edar **AKL/AKD**, dan (opsional) KFA **Alkes** — TANPA field klinis-obat. Satu tabel = mayoritas kolom null silang → kotor.
2. **Konsumen beda.** Obat → Resep (`clinical.resep`) + Formularium. BMHP → melekat ke **Tindakan**/paket + billing (charge), bukan "diresepkan" dalam arti signa/dosis.
3. **Vocab & regulasi beda.** Obat = Fornas/BPOB; BMHP = e-Katalog LKPP + Permenkes Alkes. Kode pun beda prefix.

> **Reference = Katalog Obat.** Semua pola di bawah **disalin** dari stack Obat (file ditunjuk per-langkah).
> BMHP = "Obat tanpa field klinis-obat + field alkes". Bila ragu pola → lihat file Obat yang setara.

**Istilah:** BMHP (Bahan Medis Habis Pakai) ⊇ BHP (Bahan Habis Pakai) — di RS sering disebut bersama.
Kita pakai **satu katalog `Bmhp`** mencakup keduanya; pemisahan medis/non-medis = lewat `kategori`.

---

## 1. Apa itu BMHP/BHP + beda vs Obat

**Contoh BMHP/BHP:** spuit/syringe, infus set, sarung tangan (steril/non-steril), kasa & perban,
kateter & selang (NGT/folley/suction), jarum & benang bedah, antiseptik/desinfektan, APD (masker/gown),
plester, elektroda EKG, kanul O₂, urine bag, blood set.

| Aspek | Katalog **Obat** | Katalog **BMHP/BHP** |
|---|---|---|
| Identitas | generik + dagang + pabrik + bentuk + kekuatan + rute | nama + merek + pabrik + **ukuran/size** + satuan + kemasan |
| Klasifikasi | Formularium · HAM · LASA · golongan UU 35/2009 · cold-chain | **steril · single-use · implan · kelas risiko alkes (A–D)** · Formularium/e-Katalog |
| Klinis | indikasi · dosis · ESO · interaksi | — (tidak ada) |
| Regulasi | Fornas (`kodeFornas`) · BPJS coverage | **No. Izin Edar AKL/AKD** · **e-Katalog LKPP** · BPJS coverage |
| KFA (FHIR SatuSehat) | zat aktif (**BZA**) | **KFA Alkes** (produk alkes) — opsional, Phase later |
| Kode auto | `OBT-<YYMM><NNN>` | **`BHP-<YYMM><NNN>`** |
| Konsumen | Resep · Formularium · billing | Tindakan/paket · billing · (Formularium BMHP) |

---

## 2. Model data — `master.Bmhp` + `master.BmhpCounter`

> Salin pola dari [prisma/schema/obat.prisma](../prisma/schema/obat.prisma). Buat file baru
> **`prisma/schema/bmhp.prisma`**. Leaf → **tanpa optimistic-version** · soft-delete · uuid v7 ·
> timestamptz · enum FE-facing = **TEXT** pass-through (validasi di Zod) · harga = Int rupiah.

```prisma
model Bmhp {
  id   String @id @default(uuid(7)) @db.Uuid
  kode String @default("") // auto BHP-<YYMM><NNN> (immutable, di-set Service)

  // ── Identitas ──
  nama       String                       // "Spuit 3cc", "Kasa Steril 16x16"
  merek      String?                      // nama dagang / merek
  pabrik     String?
  kategori   String                       // FE union BMHP (Alat Suntik & Infus | Sarung Tangan | …)
  ukuran     String?                      // "3 cc" | "No. 7" | "Fr 16" | "16x16 cm"
  satuan     String                       // Pcs | Set | Box | Pasang | Rol | Lembar | Vial | Sachet
  isiPerKemasan Int?     @map("isi_per_kemasan") // isi per box/pak (opsional)

  // ── Klasifikasi alkes ──
  isSteril      Boolean @default(false) @map("is_steril")
  isSingleUse   Boolean @default(true)  @map("is_single_use")
  isImplan      Boolean @default(false) @map("is_implan")        // implan → tracking khusus
  kelasRisiko   String? @map("kelas_risiko")                      // Alkes class A|B|C|D (Permenkes)
  isFormularium Boolean @default(false) @map("is_formularium")    // masuk formularium/e-katalog RS

  // ── Regulasi ──
  nomorIzinEdar String? @map("nomor_izin_edar")  // AKL (dalam negeri) / AKD (impor)
  kodeEKatalog  String? @map("kode_e_katalog")   // LKPP e-katalog (analog kodeFornas)

  // ── Harga & coverage ──
  hargaSatuan  Int     @default(0) @map("harga_satuan")
  hpp          Int?
  het          Int?
  bpjsCoverage Boolean @default(false) @map("bpjs_coverage") // umumnya include paket INA-CBG

  // ── KFA Alkes (FHIR SatuSehat) — blok JSONB, OPSIONAL (Phase later) ──
  /// { poaKode?, poaNama?, povKode?, povNama?, nie?, kelasKode?, kelasNama?, sumber?, mappedAt? }
  kfa Json? @db.JsonB

  // ── Meta ──
  catatan   String?
  status    String    @default("Aktif") // Aktif | Non_Aktif | Discontinued
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(3)

  @@index([kategori, deletedAt])
  @@index([kode])
  @@map("bmhp")
  @@schema("master")
}

// Counter kode BMHP per-bulan (atomik, anti-race). Pola IDENTIK master.ObatCounter /
// pendaftaran.rm_counter: upsert by PK `periode` → INSERT … ON CONFLICT … RETURNING.
model BmhpCounter {
  periode String @id @db.Char(4) // "YYMM" WIB
  lastSeq Int    @map("last_seq")

  @@map("bmhp_counter")
  @@schema("master")
}
```

**Dropped dari Obat (sengaja):** `golongan`, `isHAM`, `isLASA`/`lasaPairIds`, `rute`, `indikasi`,
`kontraindikasi`, `dosisDewasa/Anak`, `efekSamping`, `interaksiObat`, `batasResepPerKunjungan`.

---

## 3. Vocab terkontrol (FE union → Zod enum)

Tipe + config FE di **`src/lib/master/bmhpMock.ts`** (mirror [obatMock.ts](../src/lib/master/obatMock.ts):
`type BmhpRecord` + enum konstanta). Zod enum mirror-nya di schema (§4).

```ts
// Kategori BMHP (sesuaikan inventaris RS)
"Alat Suntik & Infus" | "Sarung Tangan" | "Kasa & Pembalut" | "Kateter & Selang" |
"Jarum & Benang Bedah" | "Antiseptik & Desinfektan" | "APD" |
"Alat Diagnostik Habis Pakai" | "Lainnya"

// Satuan
"Pcs" | "Set" | "Box" | "Pasang" | "Rol" | "Lembar" | "Vial" | "Sachet" | "Ampul"

// Kelas risiko alkes (Permenkes 62/2017)
"A" | "B" | "C" | "D"

// Status
"Aktif" | "Non_Aktif" | "Discontinued"
```

---

## 4. Layer breakdown (mirror Obat, file baru)

> Arah impor satu arah Route→Service→DAL→Prisma (API-RULES §1). RBAC **reuse `master.katalog`**
> (TANPA permission baru — sama seperti Obat/Tindakan/Lab/Rad; Admin full, Apoteker read/update).

| Lapis | File baru (salin dari Obat) | Isi |
|---|---|---|
| **Schema (Zod+DTO)** | `src/lib/schemas/master/bmhp.ts` ← [obat.ts](../src/lib/schemas/master/obat.ts) | `CreateBmhpInput`/`UpdateBmhpInput`/`BmhpQuery`/`IdParam` + `BmhpDTO = BmhpRecord` (mirror penuh → zero-map). `kode` **TIDAK** di-input (auto). KFA Alkes block opsional. |
| **DAL** | `src/lib/dal/master/bmhpDal.ts` ← [obatDal.ts](../src/lib/dal/master/obatDal.ts) | `nextBmhpSeq(periode,tx)` (upsert `bmhpCounter`) · `create`/`findById`/`update`/`softDelete`(set `deletedAt`+status Non_Aktif) · `list({q,kategori,status,cursorId,limit})` (filter `deletedAt:null`, OR `kode/nama/merek`). |
| **Service** | `src/lib/services/master/bmhpService.ts` ← [obatService.ts](../src/lib/services/master/obatService.ts) | factory `makeBmhpService({dal?,clock?})` · kode auto `BHP-<YYMM><NNN>` (periode WIB via `clock`, counter atomik dalam `transaction`) · `toDTO` (null⇄undefined) · `createToData`/`updateToPatch` (`setDefined`) · `list` **actor-less** (SSR-safe). KFA JSON⇄block helper (bila KFA Alkes dipakai; else skip). |
| **Route** | `src/app/api/v1/master/bmhp/route.ts` ← [obat/route.ts](../src/app/api/v1/master/obat/route.ts) | `GET` (`master.katalog:read`, paginated) + `POST` (`master.katalog:create`, 201). |
| **Route [id]** | `src/app/api/v1/master/bmhp/[id]/route.ts` ← [obat/[id]/route.ts](../src/app/api/v1/master/obat/[id]/route.ts) | `PATCH` (update) + `DELETE` (soft-delete), gate `master.katalog`. |
| **Client** | `src/lib/api/master/bmhp.ts` ← [obat.ts](../src/lib/api/master/obat.ts) | `listBmhp`/`fetchAllBmhp`/`createBmhp`/`updateBmhp`/`deleteBmhp`. |

Kode auto (Service):
```ts
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
function bmhpPeriode(now: Date) { /* "YYMM" WIB — identik obatPeriode */ }
function formatBmhpKode(periode: string, seq: number) { return `BHP-${periode}${String(seq).padStart(3,"0")}`; }
// create(): transaction → seq = dal.nextBmhpSeq(periode,tx) → data.kode = formatBmhpKode(...) → dal.create
```

---

## 5. Frontend — `/ehis-master/katalog-bmhp`

> Mirror [KatalogObatPage](../src/components/master/katalog-obat/KatalogObatPage.tsx) (SSR hybrid: page Server
> Component panggil `bmhpService.list()` langsung → komponen client fetch `/api` saat filter, API-RULES §6.1).

- **Page:** `src/app/ehis-master/katalog-bmhp/page.tsx` (SSR) → `src/components/master/katalog-bmhp/KatalogBmhpPage.tsx`.
- **Komponen:** `BmhpList` · `BmhpDetail` · `BmhpEmptyState` + form tabs di `katalog-bmhp/tabs/`:
  **Identitas** (nama/merek/pabrik/kategori/ukuran/satuan/kemasan) · **Klasifikasi** (steril/single-use/implan/kelas risiko/formularium + izin edar AKL/AKD + e-katalog) · **Harga** (satuan/HPP/HET/BPJS). **Mapping KFA Alkes** = tab opsional (Phase later).
- **Kode = read-only "Auto"** di form (seperti Obat/SDKI/Rad). Batal saat dirty → **DiscardDialog** global.
- **Nav:** tambah item di [navigation.ts](../src/lib/navigation.ts) grup "Katalog Klinis" (setelah "Katalog Obat"):
  ```ts
  { label: "Katalog BMHP/BHP", href: "/ehis-master/katalog-bmhp", icon: Syringe, perm: "master.katalog" },
  ```

---

## 6. Seed

> Mirror [seed-obat.mts](../prisma/scripts/seed-obat.mts) (pakai `pg` langsung, import `.ts`-extension,
> `@/`-free — lihat memori *seed-run-mechanism*). Data di **`src/lib/master/bmhpSeed.ts`** (`BMHP_SEED`).

- Skrip: `prisma/scripts/seed-bmhp.mts` — TRUNCATE `master.bmhp` lalu insert ulang (idempoten), set `bmhp_counter` ke seq tertinggi per periode (pola seed-obat). Kode bisa di-derive `BHP-<periode><NNN>` urut, ATAU di-generate via counter.
- Jalankan: `node --env-file=.env prisma/scripts/seed-bmhp.mts`.
- Target seed awal: ~20–30 BMHP umum (spuit, infus set, sarung tangan, kasa, kateter, masker, dst.) lintas kategori.

---

## 7. Migration (drift-safe)

> Ikuti pola yang dipakai di sesi ini (memori *migration-drift-pattern*): **JANGAN `migrate dev`**
> (drift checksum). Tulis SQL + apply via skrip `pg`, lalu `resolve --applied` + `generate`.

1. Tambah model ke `prisma/schema/bmhp.prisma` (§2) + tambahkan ke `datasource` schemas bila perlu (sudah ada schema `master`).
2. `prisma/migrations/<TS>_init_master_bmhp/migration.sql` — `CREATE TABLE "master"."bmhp" (...)` + `"master"."bmhp_counter" (...)` + index. (Tanpa FK lintas-schema; leaf mandiri.)
3. `prisma/scripts/apply-bmhp.mjs` (mirror [apply-resep-order.mjs](../prisma/scripts/apply-resep-order.mjs)) — guard `information_schema` + jalankan SQL.
4. `node --env-file=.env prisma/scripts/apply-bmhp.mjs` → `npx prisma migrate resolve --applied <TS>_init_master_bmhp` → `npx prisma generate`.

---

## 8. Konsumen (hilir — sebagian Phase later)

- **Klinis (Tindakan/paket):** BMHP melekat ke tindakan → endpoint baca `GET /master/bmhp-tersedia`
  (mirror [obat-tersedia](../src/app/api/v1/master/obat-tersedia/route.ts), gate **`clinical.tindakan:read`**)
  bila/saat BMHP di-formularium-kan per unit. **Phase later.**
- **Billing/Chargemaster:** BMHP = charge item (harga snapshot) saat dipakai di tindakan — selaras
  federasi chargemaster ([TODO-CHARGEMASTER.md](../TODO-CHARGEMASTER.md)). **Phase later.**
- **Mapping Hub — Formularium/Distribusi BMHP:** grant BMHP⇄Location (tabel **terpisah** `master.FormulariumBmhp`,
  BUKAN reuse `FormulariumObat`) bila perlu ketersediaan per-unit. **Phase later.**

> MVP = **katalog mandiri** (CRUD + seed + FE) dulu, persis Obat saat pertama dibangun. Konsumen menyusul.

---

## 9. Checklist / Definition of Done

### FE (mock-first) — ✅ SELESAI 2026-06-19
- [x] `src/lib/master/bmhpMock.ts` — `BmhpRecord` + union enum (kategori/satuan/kelas-risiko/status) + config map + helper + **`BMHP_MOCK` (18 seed FE)**. *(Seed FE in-file sebagai `BMHP_MOCK`; `bmhpSeed.ts` untuk DB = saat backend.)*
- [x] `katalogBmhpShared.ts` — tab registry **3 tab** (Identitas · Klasifikasi · Harga) + completeness + `fmtIDR`/`calcMargin` + `bmhpInitials`.
- [x] FE page `/ehis-master/katalog-bmhp` + `KatalogBmhpPage`/`BmhpList`/`BmhpDetail`/`BmhpEmptyState` + tabs + **DiscardDialog** + kode **tidak di-input** (auto). Accent **teal**, ikon **Syringe**.
- [x] Nav item "Katalog BMHP/BHP" (perm `master.katalog`, ikon `Syringe`) setelah Katalog Obat.
- [x] `npx tsc --noEmit` bersih + eslint bersih (file BMHP).

### Backend — ✅ SELESAI 2026-06-19
- [x] `prisma/schema/bmhp.prisma` — model `Bmhp` + `BmhpCounter` (§2; +kolom `kfa` JSONB disiapkan, ditunda).
- [x] Migration `20260619140000_init_master_bmhp` + apply drift-safe (`apply-bmhp.mjs` → `migrate resolve --applied` → `generate`).
- [x] `bmhpSeed.ts` (`BMHP_SEED`, 18 item) — data dipisah dari `bmhpMock.ts` (pola obatSeed); `BMHP_MOCK` dihapus.
- [x] Schema `lib/schemas/master/bmhp.ts` (Zod + `BmhpDTO = BmhpRecord`).
- [x] DAL `lib/dal/master/bmhpDal.ts` (+ `nextBmhpSeq` counter atomik).
- [x] Service `lib/services/master/bmhpService.ts` (kode auto `BHP-<YYMM><NNN>`, leaf, soft-delete, list actor-less).
- [x] Routes `app/api/v1/master/bmhp/route.ts` + `[id]/route.ts` (gate `master.katalog`).
- [x] Client `lib/api/master/bmhp.ts` + **swap `KatalogBmhpPage` mock→API** (SSR-hybrid + createBmhp/updateBmhp/deleteBmhp) + `page.tsx` panggil `bmhpService.list()`.
- [x] Seed `prisma/scripts/seed-bmhp.mts` dijalankan → **18 item `BHP-2606001..018` · counter[2606]=18**.
- [x] `npx tsc --noEmit` bersih (eslint: hanya warning `_actor` konvensi, identik obatService).
- [ ] Docs: arsip ke [.claude/DONE.md](../.claude/DONE.md) + CLAUDE.md Module Map (opsional).

**DoD per endpoint** → [BACKEND-FLOWS §18](BACKEND-FLOWS.md). **Cara nulis endpoint** → [API-RULES §7](API-RULES.md).

---

## 10. Keputusan terbuka

- **KFA Alkes (FHIR SatuSehat):** disiapkan kolom `kfa` JSONB tapi **ditunda** — pemetaan BMHP ke
  KFA Alkes (produk alkes, BUKAN zat aktif/BZA) butuh sumber KFA v2 Alkes. Tab Mapping KFA = Phase later.
- **Implan tracking (`isImplan`):** flag disiapkan; tracking serial/UDI per-unit implan = di luar katalog (domain inventory/billing).
- **Pisah BMHP vs BHP non-medis:** sementara satu tabel, dibedakan `kategori`. Bila kelak perlu pemisahan
  tegas (mis. ATK habis pakai non-medis), evaluasi ulang — kemungkinan tetap satu tabel + kategori.
