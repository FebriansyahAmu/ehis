# EHIS Backend — **API-RULES** (Pola Endpoint · Layering · Error Handling — Konkret)

> 🧭 **Peta cepat "cara menulis endpoint di repo ini".** Sementara [BACKEND-FLOWS](BACKEND-FLOWS.md)
> menjelaskan **mengapa** (kontrak & standar prosa lintas-domain), dokumen ini menjelaskan **bagaimana**
> — pola konkret yang **benar-benar dipakai di kode**, dengan penunjuk file kanonik + skeleton siap-salin.
> Jika ada konflik aturan, **FLOWS yang menang**; API-RULES hanya merangkum implementasinya.
>
> **Baca ini dulu** sebelum menambah/mengubah endpoint. Sumber kebenaran = file kode yang ditunjuk
> (bukan dokumen ini) — bila kode berubah, perbarui dokumen.
>
> **Terkait:** [BACKEND-FLOWS](BACKEND-FLOWS.md) (kontrak) · [CLAUDE.md](../CLAUDE.md) · domain doc per modul (lihat [§9](#9-index--posisi-dokumen)).
> **Status:** ✅ v1 — diturunkan dari implementasi `master/ruangan` + `kunjungan` + `patients` (2026-06-05).

---

## 0. Daftar Isi

1. Lima lapis & aliran request (`route()` wrapper)
2. Anatomi endpoint — contoh nyata beranotasi
3. Aturan per-lapis + 1 hal yang TAK BOLEH dilanggar
4. Error handling — katalog, siapa melempar apa, satu boundary
5. Validasi & DTO — input Zod + DTO mirror FE (entity tak bocor)
6. Pola lintas-cutting yang dikodifikasi
   - 6.1 Konsumsi GET dari frontend — SSR hybrid (cache-ready)
7. Resep: tambah endpoint baru dalam 7 langkah
8. File kanonik (salin dari sini) + anti-pattern
9. Index & posisi dokumen
10. Postur keamanan & keselarasan standar internasional

---

## 1. Lima lapis & aliran request

```
HTTP → route() wrapper → Service → DAL → Prisma → PostgreSQL
       (lib/http)        (lib/services)  (lib/dal)  (lib/db)
```

Setiap endpoint dibungkus **satu** helper `route()` di [src/lib/http/route.ts](../src/lib/http/route.ts).
Wrapper ini menjalankan urutan SERAGAM — Route file tak pernah mengulangnya:

```
getActor(req)  →  assertCan(actor, resource, action)  →  Zod.parse(params/query/body)
   AuthN              RBAC                                 Validasi
        →  handler({ body, query, params, actor, idempotencyKey })  →  envelope sukses
                              (panggil TEPAT 1 service)                 (success/reply/paginated)
        →  catch → handleError(e) → envelope gagal + HTTP status
```

Konsekuensi: **Route file = deklaratif, tanpa `try/catch`, tanpa parsing manual, tanpa if-else domain.**

---

## 2. Anatomi endpoint — contoh nyata beranotasi

Pola tunggal untuk **semua** endpoint. Contoh dari [master/unit](../src/app/api/v1/master/unit/route.ts) & [kunjungan](../src/app/api/v1/kunjungan/route.ts):

```ts
// src/app/api/v1/master/unit/route.ts
import { route, reply } from "@/lib/http/route";
import { CreateUnitInput } from "@/lib/schemas/ruangan";
import { ruanganService } from "@/lib/services/ruanganService";

export const POST = route({
  resource: "master.ruangan",   // ┐ RBAC: assertCan(actor, resource, action)
  action: "create",             // ┘  dijalankan wrapper SEBELUM handler
  body: CreateUnitInput,        // Zod — di-parse jadi `body` bertipe
  handler: async ({ body, actor }) => {
    const unit = await ruanganService.createUnit(body, actor);  // TEPAT 1 service
    return reply(unit, { status: 201, message: `Unit ${unit.name} dibuat` });
  },
});
```

Tiga bentuk return handler:

| Return | Hasil envelope | Kapan |
|---|---|---|
| `data` mentah | `{ ok:true, data }` status default (200) | read/update sederhana |
| `reply(data, { status?, message?, meta? })` | kontrol penuh status/message | create (201), atau perlu toast `message` |
| `paginated(items, { cursor })` | `{ ok:true, data, meta:{cursor} }` | list cursor |

Contoh list + cursor (dari [kunjungan/route.ts](../src/app/api/v1/kunjungan/route.ts)):

```ts
export const GET = route({
  resource: "registration.kunjungan", action: "read",
  query: WorklistQuery,                         // ?unit=&status=&cursor=&limit=
  handler: async ({ query, actor }) => {
    const { items, cursor } = await kunjunganService.getWorklist(query, actor);
    return paginated(items, { cursor });
  },
});
```

Route dinamis (`[id]`, `[bedId]`) → `params` di-parse dari Zod (`IdParam`, `BedIdParam`); query (mis. `?expectedVersion=`) → `DeleteQuery`. Lihat [master/unit/[id]/route.ts](../src/app/api/v1/master/unit/[id]/route.ts).

---

## 3. Aturan per-lapis + 1 hal yang TAK BOLEH dilanggar

| Lapis | File contoh | Boleh | **Larangan keras (1 baris)** |
|---|---|---|---|
| **Route** | `app/api/v1/**/route.ts` | deklarasi `route({...})`, pilih service, set status/message | **Tidak ada logika bisnis / Prisma / try-catch.** Tepat 1 panggilan service. |
| **Service** | [ruanganService.ts](../src/lib/services/ruanganService.ts) | business rule, guard, batas transaksi (`transaction()`), authz, map DTO, lempar `AppError` | **Tak `import { prisma }`** (pakai `transaction` + DAL). **Tak tahu HTTP.** **Tak `Date.now()`** (pakai `clock`). |
| **DAL** | [ruanganDal.ts](../src/lib/dal/ruanganDal.ts) | query Prisma, `select`/`include`, terima `tx?`, filter `deletedAt: null` | **Tak ada aturan bisnis / validasi domain.** Tak tahu HTTP. Tak lempar `AppError`. |
| **Schema** | [schemas/ruangan.ts](../src/lib/schemas/ruangan.ts) | Zod input + DTO interface (mirror FE) | **Entity Prisma tak boleh jadi tipe response.** |
| **Infra** | [http/](../src/lib/http/) · [errors/](../src/lib/errors/) · [db/prisma.ts](../src/lib/db/prisma.ts) · [auth/actor.ts](../src/lib/auth/actor.ts) | dipakai semua endpoint | Jangan duplikat di Route/Service. |

Arah impor **satu arah**: `Route → Service → DAL → Prisma`. DAL tak impor Service; Service tak impor Route.

---

## 4. Error handling — katalog, siapa melempar, satu boundary

**Service melempar `AppError`; SATU `handleError` di boundary `route()` memetakan ke envelope + status.**
Prisma/SQL/stack **tak pernah** bocor ke klien.

- **Katalog kode** → [src/lib/errors/appError.ts](../src/lib/errors/appError.ts). Pakai factory `Errors.*`, jangan `new AppError` manual kecuali kode khusus:

  | Factory | Code → HTTP | Pakai saat |
  |---|---|---|
  | `Errors.validation(msg, details?)` | VALIDATION → 422 | input/relasi tak valid (parent tak ada, kapasitas < bed) |
  | `Errors.notFound(msg)` | NOT_FOUND → 404 | resource tak ada **atau di luar scope** (anti-IDOR: sembunyikan keberadaan) |
  | `Errors.forbidden(msg)` | FORBIDDEN → 403 | RBAC/ABAC tolak (mis. root RS read-only) |
  | `Errors.conflict(msg)` | CONFLICT → 409 | unik dilanggar (umumnya otomatis dari P2002) |
  | `Errors.conflictVersion()` | CONFLICT_VERSION → 409 | optimistic concurrency stale (lihat §6) |
  | `Errors.forbiddenState(msg)` | FORBIDDEN_STATE → 409 | transisi state ilegal (hapus unit yang masih punya anak) |
  | `Errors.internal(msg)` | INTERNAL → 500 | invariant rusak (gagal re-load pasca update) |

- **Boundary tunggal** → [src/lib/errors/handleError.ts](../src/lib/errors/handleError.ts). Urutan map:
  1. `AppError` → pakai code+status+details apa adanya.
  2. `ZodError` → 422 VALIDATION + `details[]` (path+message).
  3. Prisma `P2025`→NOT_FOUND · `P2002`→CONFLICT (sebut kolom) · `P2003`→VALIDATION.
  4. Tak terduga → `console.error` server-side + 500 generik (tak bocor).

- **Envelope** → [src/lib/http/envelope.ts](../src/lib/http/envelope.ts): sukses `{ ok:true, data, message?, meta? }` · gagal `{ ok:false, error:{ code, message, details? } }`.

---

## 5. Validasi & DTO — input Zod + DTO mirror FE

Di [src/lib/schemas/<domain>.ts](../src/lib/schemas/ruangan.ts) co-locate **dua** hal:

1. **Input Zod** (`CreateXInput`, `UpdateXInput`, `IdParam`, `XQuery`, `DeleteQuery`). Update bawa `expectedVersion` untuk concurrency. Query pakai `z.coerce.number()` untuk angka dari string.
2. **DTO interface** untuk response — **mirror vocab Frontend**, bukan kolom DB. Tujuan: **zero-refactor UI** saat swap mock→API (memori `project mock-first → swap`).

> **Entity Prisma TIDAK boleh jadi tipe response.** Service memetakan entity → DTO (`toOrgDTO`/`toLocationDTO`/`toBedDTO` di ruanganService). Ini sekaligus titik **vocab mapping FE⇄DB** (mis. `dept-clin`⇄`dept_clin`, kelas `"—"`⇄`null`, alamat nama-based⇄kolom kode+nama).

---

## 6. Pola lintas-cutting yang dikodifikasi

Semua sudah ada di kode — **ikuti, jangan temukan ulang**:

- **Service factory + DI** — `makeXService(deps: { clock?, dal? })` + singleton `export const xService = makeXService()`. Memungkinkan inject `dal` palsu & `clock` deterministik di test. ([ruanganService.ts:40](../src/lib/services/ruanganService.ts#L40))
- **Determinisme waktu** — Service tak panggil `Date.now()`/`new Date()`; pakai `clock.now()` dari [lib/core/clock](../src/lib/core/clock.ts). (FLOWS §14)
- **Batas transaksi milik Service** — Service impor `transaction` dari [db/prisma.ts](../src/lib/db/prisma.ts), bungkus alur multi-tabel, teruskan `tx` ke DAL. DAL menerima `tx?` via helper `db(tx)`. (FLOWS §7)
- **Optimistic concurrency (`version`)** — update/delete lewat `updateXWithVersion(id, expectedVersion, data, tx)` → `updateMany({ where:{ id, version, deletedAt:null }, data:{ ...d, version:{increment:1} } })`. Service: `if (count === 0) throw Errors.conflictVersion()`. Bed = leaf → tanpa version. ([ruanganDal.ts:129](../src/lib/dal/ruanganDal.ts#L129))
- **Soft-delete** — set `deletedAt` (+ `active:false`), **jangan hard delete**. Semua read DAL filter `deletedAt: null`.
- **Patch parsial** — helper module-level `setDefined(target, key, value)` (set hanya bila `!== undefined`) + pure mapper `unitPatch`/`ruanganPatch` yang memisahkan **mapping data** dari **guard/orkestrasi**. ([ruanganService.ts:36](../src/lib/services/ruanganService.ts#L36)) → ganti tumpukan `if (input.x !== undefined) data.y = ...`.
- **Read-after-write** — pasca `updateWithVersion`, re-`find` di dalam tx untuk return DTO segar; bila hilang → `Errors.internal`.
- **Cursor pagination** — list besar pakai `?cursor=&limit=`, return `paginated(items, { cursor })`. Bukan offset. (FLOWS §16)
- **Idempotency (seam)** — `route()` membaca header `Idempotency-Key` → `handler` arg, tapi **enforcement belum** (GAP-D infra). Untuk mutation, terima key; penegakan menyusul saat Redis siap.
- **Auth (seam)** — `getActor()` kini mengembalikan **DEV actor super-akses** (runtime auth belum dibangun, [BACKEND-AUTH](BACKEND-AUTH.md)). Signature `getActor`/`assertCan` **final** → saat auth siap, isi diganti tanpa menyentuh Route/Service. Service tetap terima `actor` & siapkan scope (ABAC) lewat parameter walau kini super-akses.

### 6.1 Konsumsi GET dari frontend — SSR hybrid (cache-ready)

**Default untuk membaca data di halaman: hybrid.** Render awal di **Server Component** + interaksi (filter/paginasi/live) lewat **client fetch ke `/api`**.

> **Aturan emas: Server Component panggil SERVICE LANGSUNG, bukan `fetch('/api/...')` ke diri sendiri.**
> Service kita HTTP-agnostic (§1) → bisa dikonsumsi Route *dan* Server Component. Memanggil `/api` dari
> server = anti-pattern (hop HTTP ekstra, butuh URL absolut, kehilangan type-safety, juggling auth).

```tsx
// page.tsx — Server Component: render awal, tanpa hop HTTP, type-safe
import { pegawaiService } from "@/lib/services/pegawaiService";
export default async function PenggunaPage() {
  const { items } = await pegawaiService.listPegawai({ aktif: true, limit: 50 });
  return <PegawaiTable initial={items} />;   // Client Component fetch /api saat filter berubah
}
```

| Jalur | Pakai untuk | Sumber data |
|---|---|---|
| **SSR (Server Component)** | first paint / data awal (no spinner) | **Service langsung** |
| **Client fetch (`/api`)** | filter, pencarian, paginasi cursor, live update | endpoint `route()` |

**Cache-ready (penting agar Redis nanti tidak ribet):** cache-aside Redis hidup di **Service**, jadi SSR & `/api` **berbagi satu cache** otomatis — kedua jalur tak berubah saat Redis masuk. Disiplin sekarang:
1. **Jangan tambah cache tandingan** di layer Next/HTTP untuk data yang sama (SSR via Service-langsung sudah menghindari Next fetch-cache → Redis jadi satu-satunya rumah cache).
2. **Cache key di filter stabil** (mis. `aktif=true`); biarkan `q=` (free-text) **bypass cache** (high-cardinality, hit-rate rendah).
3. Invalidasi pada CUD (di Service) → SSR `router.refresh()` + client refetch dua-duanya lihat data segar.

> ⚠️ **SSR bukan alat keamanan/penyembunyian.** Fetch hilang dari Network tab, tapi data tetap ada di HTML/RSC payload (inspectable). Proteksi data = **AuthN/RBAC** (seam di atas), bukan SSR. **Jangan** SSR-kan list yang murni interaktif/berubah-cepat tanpa nilai first-paint.

---

## 7. Resep: tambah endpoint baru dalam 7 langkah

1. **Schema** — tambah `CreateXInput`/`UpdateXInput`/`XQuery` (Zod) + `XDTO` (mirror FE) di `lib/schemas/<domain>.ts`.
2. **DAL** — fungsi akses Prisma di `lib/dal/<domain>Dal.ts`: terima `tx?`, filter `deletedAt:null`, version-guard untuk update/delete, `select/include` anti-N+1. Tanpa logika bisnis.
3. **Service** — di `makeXService`: guard + business rule, `transaction()` bila multi-tabel, map entity→DTO, lempar `Errors.*`. Inject `clock`/`dal`.
4. **Route** — file `app/api/v1/<resource>/route.ts`: `export const METHOD = route({ resource, action, body/query/params, handler })`. Tepat 1 panggilan service.
5. **Type-check** — `npx tsc --noEmit` (wajib sebelum commit, CLAUDE.md workflow).
6. **Test** — unit test Service (inject dal palsu + clock) untuk guard/concurrency; integration DAL bila perlu (Testcontainers). Lihat [pegawaiService.test.ts](../src/lib/services/pegawaiService.test.ts).
7. **Docs** — perbarui checklist domain doc (`BACKEND-{DOMAIN}`) + tabel kontrak API; bila pola baru → catat di sini.

**Definition of Done per endpoint** → FLOWS §18.

### 7.1 Organisasi file — flat (legacy) vs folder-per-tab (domain baru)

Layering tetap sama; ini **hanya tata-letak file** (tak mengubah arah impor Route→Service→DAL→Schema).

- **Legacy (flat-by-layer)** — domain awal (`ruangan`, `kunjungan`, `pegawai`, `dokter`, `bedAllocation`, `triase`, `observation`, …) tetap file datar di akar tiap layer: `lib/schemas/<domain>.ts` · `lib/dal/<domain>Dal.ts` · `lib/services/<domain>Service.ts` · `lib/api/<domain>.ts`. **Jangan refactor** tanpa diminta.
- **Domain BARU = folder-per-GROUP** (konvensi 2026-06-09, diperluas 2026-06-10) — kelompokkan per **group** = **tab UI** (domain klinis) ATAU **nama modul** (fitur modul), sub-folder bernama group di dalam tiap layer, **nama file dipertahankan**:

  ```
  lib/schemas/<group>/<fitur>.ts          # tab klinis: lib/schemas/asesmenMedis/anamnesis.ts
  lib/dal/<group>/<fitur>Dal.ts           # modul:      lib/dal/master/icdDal.ts
  lib/services/<group>/<fitur>Service.ts  #             lib/services/master/icdService.ts
  lib/api/<group>/<fitur>.ts              #             lib/api/master/icd.ts
  ```
  `<group>` ditentukan per jenis domain: **rekam medis (klinis)** → nama **Tab di sidebar** rekam medis (`asesmenMedis/`; menyusul triase/CPPT/diagnosa/dll) · **modul non-klinis** → **nama modul** (`master/` utk semua fitur `/ehis-master`). Impor: `@/lib/api/<group>/<fitur>`. Satu group = satu folder per layer → mudah diakses & scalable.

  Aturan turunan:
  - **Route** tetap di `app/api/**` mengikuti **URL** (tak ikut folder lib). Endpoint sub-tab dikelompokkan di path: `app/api/v1/kunjungan/[id]/asesmen/<fitur>/route.ts`.
  - **Helper lintas-domain** (mis. [`services/actorName.ts`](../src/lib/services/actorName.ts) untuk resolve nama pencatat dari actor) tetap di **akar** layer-nya, BUKAN di dalam folder tab.
  - Langkah §7 di atas berlaku sama — hanya jalur file yang berubah (`<domain>` → `<tab>/<fitur>`).

  Contoh nyata: tab **Asesmen Medis** → `lib/{schemas,dal,services,api}/asesmenMedis/` (anamnesis + 5 pane riwayat) · modul **Master** → `lib/{schemas,dal,services,api}/master/` (ICD: `icd`/`icdDal`/`icdService`).

---

## 8. File kanonik (salin dari sini) + anti-pattern

**Referensi terbersih saat ini = domain `master/ruangan`** (Route+Service+DAL+Schema lengkap, sudah di-refactor & smoke-verified):

| Lapis | Salin dari |
|---|---|
| Wrapper/envelope/error | [http/route.ts](../src/lib/http/route.ts) · [http/envelope.ts](../src/lib/http/envelope.ts) · [errors/appError.ts](../src/lib/errors/appError.ts) · [errors/handleError.ts](../src/lib/errors/handleError.ts) |
| Route (POST/PATCH/DELETE/GET) | [master/unit/route.ts](../src/app/api/v1/master/unit/route.ts) · [master/unit/[id]/route.ts](../src/app/api/v1/master/unit/[id]/route.ts) · [kunjungan/route.ts](../src/app/api/v1/kunjungan/route.ts) |
| Service (factory+DI+tx+DTO) | [ruanganService.ts](../src/lib/services/ruanganService.ts) |
| DAL (tx?+version+soft-delete) | [ruanganDal.ts](../src/lib/dal/ruanganDal.ts) |
| Schema (Zod+DTO mirror) | [schemas/ruangan.ts](../src/lib/schemas/ruangan.ts) |
| DB singleton + tx | [db/prisma.ts](../src/lib/db/prisma.ts) |
| Auth seam | [auth/actor.ts](../src/lib/auth/actor.ts) |
| **Domain baru = folder-per-tab** (§7.1) | [schemas/asesmenMedis/anamnesis.ts](../src/lib/schemas/asesmenMedis/anamnesis.ts) · [services/asesmenMedis/anamnesisService.ts](../src/lib/services/asesmenMedis/anamnesisService.ts) · [api/asesmenMedis/anamnesis.ts](../src/lib/api/asesmenMedis/anamnesis.ts) |
| Helper lintas-domain (akar layer) | [services/actorName.ts](../src/lib/services/actorName.ts) |

**Anti-pattern (jangan):**
- ❌ `try/catch` atau `NextResponse.json` manual di Route — pakai `route()` + `reply()`.
- ❌ `import { prisma }` di Service — pakai `transaction()` + DAL.
- ❌ Kembalikan entity Prisma sebagai response — map ke DTO.
- ❌ `Date.now()`/`new Date()` di Service — `clock.now()`.
- ❌ Hard delete — soft-delete (`deletedAt`).
- ❌ Tumpukan `if (input.x !== undefined)` — `setDefined` + pure patch mapper.
- ❌ Lempar string/Error biasa dari Service — `Errors.*` (AppError).
- ❌ Bocorkan keberadaan resource di luar scope — `Errors.notFound` (bukan forbidden).

---

## 9. Index & posisi dokumen

```
BACKEND-FLOWS   = kontrak & standar (mengapa) — menang bila konflik
API-RULES (ini) = resep konkret + peta file (bagaimana menulis endpoint)
BACKEND-{DOMAIN}= spesifik domain (apa yang domain lakukan)
```

- Kontrak lintas-domain: [BACKEND-FLOWS](BACKEND-FLOWS.md) (§2 layering · §4 error · §7 data rules · §16 API · §18 DoD).
- Domain doc: [BACKEND-ENCOUNTER](BACKEND-ENCOUNTER.md) · [BACKEND-AUTH](BACKEND-AUTH.md) · [BACKEND-PATIENT](BACKEND-PATIENT.md) · [BACKEND-MASTER-SUMBER-DAYA](BACKEND-MASTER-SUMBER-DAYA.md).
- State proyek: [CLAUDE.md](../CLAUDE.md) · roadmap backend: [TODOS_BACKEND.md](../TODOS_BACKEND.md).

---

## 10. Postur keamanan & keselarasan standar internasional

> **Sikap repo: HYBRID.** Pertahankan design pattern kita (tier-1 di sisi desain) + adopsi *selektif* hal
> internasional yang **(a) cheap-now/expensive-later** atau **(b) wajib untuk domain healthcare**, dan
> **tolak secara sadar** yang manfaatnya belum ada. Tujuan seksi ini: batasan & deviasi **tercatat eksplisit**,
> bukan terlihat seperti kelalaian saat di-audit (OWASP API Top 10 · ASVS · HIPAA · GDPR).

### 10.1 Status enforce per kontrol (jujur — design vs runtime)

| Kontrol | Design | Runtime | Sumber kebenaran |
|---|---|---|---|
| AuthN (verify session/JWT) | 🟢 seam final | 🔴 DEV super-actor | [auth/actor.ts](../src/lib/auth/actor.ts) → [BACKEND-AUTH](BACKEND-AUTH.md) |
| RBAC (`assertCan`) | 🟢 | 🔴 di-bypass DEV `*` | [auth/actor.ts](../src/lib/auth/actor.ts#L42) |
| ABAC / unit-scope (`scopeBy`) | 🟡 seam (actor diteruskan) | 🔴 belum ada | Service terima `actor`, `scopeBy` belum diimplementasi |
| Mass-assign / property-auth | 🟢 | 🟢 | `setDefined` allow-list + DTO ([ruanganService.ts](../src/lib/services/ruanganService.ts#L36)) |
| Idempotency | 🟢 header dibaca | 🔴 belum di-enforce | GAP-D infra (Redis) |
| Rate limiting | 🟡 kode `RATE_LIMITED` ada | 🔴 belum ada | [appError.ts](../src/lib/errors/appError.ts) |
| Audit trail CUD | 🟡 di DoD | 🔴 belum di-emit | **§10.2 item 1** |
| Error tak bocor internal | 🟢 | 🟢 | [handleError.ts](../src/lib/errors/handleError.ts) |
| Security headers / CORS | 🔴 | 🔴 | **§10.2 item 3** (proxy) |

### 10.2 Yang DIADOPSI (urut prioritas)

1. **Audit trail CUD — adopt now (infra lintas-cutting).** Emit di boundary `transaction()`/outbox, bukan ditambal per-endpoint. *Alasan:* cheap sekarang (pola merambat gratis), **mustahil di-backfill** (HIPAA §164.312(b) · SNARS) — data "siapa-mengubah-apa" yang hilang tak bisa direkonstruksi.
2. **Strategi erasure PII vs soft-delete — decide now (schema).** Tetapkan kolom PII + pendekatan crypto-shred / anonymization **sebelum** data pasien ada. *Alasan:* `deletedAt` menyimpan PII plaintext selamanya → bertabrakan dengan GDPR "right to erasure". Cukup keputusan model dulu, belum implementasi penuh.
3. **Security headers + CORS — adopt (deployment/proxy).** Tanggung jawab `proxy.ts`/reverse-proxy (HSTS, CSP, `X-Content-Type-Options`, CORS allow-list), **bukan** per-endpoint. OWASP API8.
4. **Disiplin actor (sudah seam, tegakkan).** Setiap Service WAJIB tetap terima `actor` & menyiapkan titik `scopeBy` walau kini DEV actor — agar saat AuthN/ABAC nyata masuk, **Route/Service tak berubah**. Bukan adopsi baru; aturan disiplin.

### 10.3 Deviasi yang DISENGAJA (bukan kelalaian)

| Standar internasional | Pilihan kita | Alasan menunda/menolak |
|---|---|---|
| **RFC 9457 Problem Details** (`application/problem+json`) | Envelope custom `{ok,error:{code,message,details}}` | Konsumen saat ini cuma frontend internal → manfaat interop ≈ nol. **Mitigasi:** katalog `code` dijaga **stabil** agar bisa dipetakan ke Problem Details di *edge* bila kelak ada API publik. Tinjau ulang saat ada konsumen eksternal. |
| **HTTP ETag + `If-Match` → 412** | `expectedVersion` di body → `409 CONFLICT_VERSION` | Lebih sederhana & sudah bekerja; concurrency cukup di layer aplikasi. Decline sadar. |
| **HATEOAS (Richardson L3)** | REST Level 2 (verbs + status) | Hampir tak ada konsumen yang memakai; overhead tak sepadan. |

### 10.4 Deploy gate (hard rule)

> **JANGAN hadapkan API ke jaringan tak tepercaya sebelum** AuthN + RBAC nyata aktif (BACKEND-AUTH) **dan** audit trail CUD ter-emit. Sampai itu, API ini *dirancang aman namun berjalan tanpa pintu* — hanya untuk dev/jaringan internal tepercaya.

Keputusan terbuka turunan seksi ini dirujuk juga di [BACKEND-FLOWS §17](BACKEND-FLOWS.md) (index) — perbarui di sini saat statusnya berubah.
