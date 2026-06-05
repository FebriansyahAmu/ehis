# EHIS Backend — **FLOWS** (Core Rules · Tech · Best Practices)

> 🏛️ **Dokumen INTI backend.** Semua aturan, keputusan teknologi, konvensi, dan best practice
> lintas-domain ada di sini. **Setiap dokumen `BACKEND-{DOMAIN}` (Kunjungan/Auth/Patient/…) MEWARISI
> dokumen ini** — domain doc hanya menjelaskan _apa_ yang domain itu lakukan; FLOWS menjelaskan _bagaimana_
> kita membangunnya. Jika ada konflik, **FLOWS yang menang.**
>
> **Sifat:** living document. Update saat ada keputusan arsitektur baru. Tidak ada kode aplikasi di sini — ini kontrak & standar.
>
> **Terkait:** [CLAUDE.md](../CLAUDE.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md) · [API-RULES.md](API-RULES.md) (resep endpoint konkret + peta file) · [BACKEND-ENCOUNTER.md](BACKEND-ENCOUNTER.md) · memori `project_backend_stack`, `project_backend_spine_gaps`.
> **Status:** 🚧 v1 — fondasi. Terkunci 2026-06-01.

---

## 0. Daftar Isi

1. Stack terkunci
2. Arsitektur layered & struktur folder — incl. **Batas Logika App vs Database** (hybrid)
3. Siklus hidup request (request lifecycle)
4. Response envelope & Error handling
5. Validasi & DTO
6. Authentication & Authorization (4 lapis)
7. Aturan data (RME append-only · soft-delete · concurrency · idempotency · transaksi)
8. Security checklist (OWASP + healthcare)
9. Konvensi database (PostgreSQL)
10. Realtime (SSE + Redis Pub/Sub)
11. Background jobs (BullMQ) & Outbox
12. Caching (Redis)
13. Observability & logging
14. Konvensi kode & penamaan
15. Testing strategy
16. Konvensi API (versioning · pagination · filtering)
17. Template dokumen domain + index
18. Definition of Done

---

## 1. Stack terkunci

| Komponen                   | Pilihan                                                        | Alasan                                                                                            |
| -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Database**               | **PostgreSQL**                                                 | JSONB+GIN (data klinis), Row-Level Security (IDOR defense), TimescaleDB opsional (TTV), full-text |
| **ORM**                    | **Prisma**                                                     | mock frontend sudah 1:1; swap import → query                                                      |
| **Runtime**                | **Long-running Node / container**                              | pool DB normal, SSE/WS hidup-lama, BullMQ worker                                                  |
| **Realtime**               | **SSE + Redis Pub/Sub** (client: TanStack Query)               | broadcast satu-arah antrean; fan-out antar instance                                               |
| **Auth**                   | **Auth.js v5 hybrid** — JWT pendek + DB refresh + Redis revoke | performa JWT + revocation instan                                                                  |
| **Cache / Queue / PubSub** | **Redis** (+ BullMQ)                                           | revocation, cache master, rate-limit, outbox BPJS, cron                                           |
| **Validasi**               | **Zod**                                                        | infer type, schema co-located                                                                     |
| **Logging**                | **pino** + correlation ID                                      | structured, low overhead                                                                          |
| **Test**                   | **Vitest** (unit) + **Testcontainers** (integration Postgres)  |                                                                                                   |

---

## 2. Arsitektur layered & struktur folder

### Aturan dependensi (tidak boleh dilanggar)

```
Route (API)  →  Service (lib)  →  DAL (repository)  →  Prisma  →  PostgreSQL
  tipis          business           akses data
```

- **Arah impor satu arah**: Route→Service→DAL. **DAL tak boleh impor Service**, Service tak boleh impor Route, Service **tak boleh `import { prisma }`**.
- **Route TIDAK boleh** punya logika bisnis, query Prisma, atau if-else domain.
- **Service TIDAK tahu** soal `Request`/`Response`/HTTP. Murni domain.
- **DAL TIDAK punya** aturan bisnis/validasi domain — hanya CRUD + query + scope.

### Struktur folder

```
src/
├── proxy.ts                            # Next.js 16 (ex-middleware): edge ringan — redirect optimistic, correlationId. BUKAN auth authoritative.
├── app/api/v1/<resource>/route.ts      # Route handlers (tipis)
├── lib/
│   ├── services/<domain>Service.ts     # business logic + transaksi + authz (1 domain)
│   ├── services/usecases/<flow>Service.ts # orkestrator lintas-domain (admisi/discharge)
│   ├── dal/<domain>Dal.ts              # akses Prisma + scopeBy(actor)
│   ├── schemas/<domain>.ts             # Zod input/output (DTO)
│   ├── errors/                         # AppError + catalog + mapper
│   ├── auth/                           # session, rbac, guards
│   ├── realtime/                       # SSE publisher + Redis pub/sub
│   ├── jobs/                           # BullMQ queues + workers
│   ├── cache/                          # Redis cache-aside helpers
│   ├── db/                             # Prisma client singleton + tx helper
│   └── observability/                  # logger, requestContext, metrics
└── prisma/
    ├── schema/                 # multi-file (prismaSchemaFolder) — 1 file per MODUL
    │   ├── config.prisma       #   generator + datasource (schemas[] + extensions)
    │   ├── auth.prisma         #   models modul auth (@@schema("auth"))
    │   └── <modul>.prisma      #   patient.prisma, encounter.prisma, …
    ├── reference/              # desain MySQL lama 122-model (acuan coverage saja)
    ├── migrations/
    └── seed.ts
    # prisma.config.ts → schema: "prisma/schema" (folder)
```

### Tanggung jawab per layer (kontrak)

| Layer       | Boleh                                                                                                             | Dilarang                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Route**   | parse req, `zod.parse`, cek auth+RBAC, panggil **1** service, map ke envelope, set status                         | logika bisnis, Prisma, transaksi, hitung  |
| **Service** | orchestrate, business rules, **batas transaksi** (`$transaction`), authz unit-scope+IDOR, DTO mapping, emit event | impor prisma langsung, tahu HTTP          |
| **DAL**     | query Prisma, `select`/`include` (anti N+1), `scopeBy(actor)`, terima `tx?`                                       | aturan bisnis, validasi domain, tahu HTTP |

### Use-case / Orchestrator services (cross-domain)

Sebagian alur melampaui 1 domain (mis. **admisi** = Patient + Kunjungan + Invoice + SEP + emit antrean dalam **1 transaksi**). Logika komposisi ini **tidak** ditaruh di salah satu domain service (biar domain tetap murni & tak saling tahu). → **use-case service** di `lib/services/usecases/<flow>Service.ts` (mis. `registrationService`, `dischargeService`) yang:
- memanggil beberapa **domain service** + memegang **batas transaksi lintas-domain**;
- **tidak punya DAL sendiri** (delegasi ke domain);
- jadi satu-satunya tempat alur bisnis multi-domain.

Domain service tetap fokus 1 domain & murni. Route memanggil **use-case service** ATAU **domain service** (tetap 1 panggilan per Route, FLOWS §2).

---

### Batas Logika: App vs Database *(hybrid layer — evaluasi ulang saat build)*

**Prinsip:** **App (Service) = DECISIONS · Database = GUARANTEES.** Business/workflow logic SELALU di Service
(satu sumber kebenaran, testable, reviewable). DB dipakai untuk **jaminan integritas, identifier, dan read/batch berat** — **bukan** aturan bisnis.

| Konstruk DB | Verdict | Pakai untuk (EHIS) | Hindari untuk |
|---|---|---|---|
| **Sequence** | ✅ | `noRM`/`noSEP`/no.invoice/no.antrean — ganti `max+1` yang race-prone | — |
| **View** | ✅ (read) | worklist (`Kunjungan` by unit+status), join read kompleks | menyembunyikan mutasi |
| **Materialized View** | ✅ | agregat berat: BOR/ALOS Dashboard, laporan bulanan (refresh via job) | data real-time |
| **Function** | ⚠️ selektif | dipakai dalam RLS policy, generated column (umur, index JSONB) | business rule |
| **Trigger** | ⚠️ guarantee saja | `updated_at` · immutability RME locked · audit backstop · counter denormal | **workflow bisnis** (transisi, tarif) |
| **Stored Procedure** | ⚠️ sangat selektif | batch set-based: grouping klaim massal, purge retensi, migrasi | logika per-request |
| **CHECK/UNIQUE/FK/EXCLUSION** | ✅✅ wajib | invariant deklaratif (triase 1..5, status enum, unik `noKunjungan`) | — |
| **pg_cron** | ✅ terbatas | housekeeping DB: refresh matview, partisi, vacuum | job app/eksternal (→ BullMQ) |

**Aturan keras:**
- **Constraint deklaratif dulu** (CHECK/UNIQUE/FK/EXCLUSION) sebelum trigger. Trigger hanya saat deklaratif tak bisa mengekspresikan.
- **DILARANG** business rule di trigger/SP → logika tersembunyi + dua sumber kebenaran (mustahil di-test, Prisma buta).
- **Healthcare defense-in-depth** (boleh di DB): immutability record RME `locked` (trigger tolak UPDATE/DELETE, PMK 24/2022) · audit backstop · RLS · sequence identifier.
- **Job split**: BullMQ = job app + panggilan eksternal (BPJS/outbox); pg_cron = housekeeping DB murni. Jangan duplikasi.

**Friksi Prisma (disadari):** trigger/function/SP/view **tidak** dikelola `schema.prisma` → ditulis manual sebagai SQL di file `migrations/` (version-controlled). View bisa di-map sebagai model **read-only**. Jangan berlebihan — tiap objek DB = beban maintenance di luar visibilitas ORM.

---

## 3. Siklus hidup request

```
0. Proxy (proxy.ts)  → ringan saja: correlationId, optimistic redirect (cek cookie sesi ADA),
                       rate-limit kasar. ❌ BUKAN verifikasi token authoritative (bisa dibypass).
1. Route guard       → AuthN authoritative: JWT verify + Redis revoke check → 401
                     → rbac.assert(user, resource, action) → 403
                     → zod.parse(input) → 422
                     → service.method(dto, actor)
2. Service           → authz row-level/unit-scope → 403/404 (404 untuk hide existence)
                     → business rules; bila multi-tabel: prisma.$transaction
                     → dal.*(…, tx); emit event (SSE/audit/job)
                     → map entity → DTO
3. Route             → { ok:true, data } envelope (+ status)
4. Server wrapper    → audit log (CUD), structured log, metrics
```

> **Next.js 16:** `middleware.ts` → **`proxy.ts`** (fungsi `proxy`). Lapisan ini hanya untuk concern edge ringan
> (redirect optimistic, rewrite, header, correlationId). **Auth/authz authoritative HARUS di Route guard / DAL** —
> bukan di proxy — karena edge layer bisa di-bypass (pelajaran CVE bypass middleware 2025).

Semua mutation wajib header **`Idempotency-Key`** (lihat §7).

---

## 4. Response envelope & Error handling

### Envelope (konsisten semua endpoint)

```
Sukses : { ok: true,  data: T, message?: string, meta?: { cursor?, total? } }
Gagal  : { ok: false, error: { code: string, message: string, details?: unknown } }
```

- `message` (sukses) = teks human-readable opsional untuk feedback user (driver toast); di-set via `reply(data, { status?, message? })` di handler. `message` (error) = aman untuk user (tak bocorkan internal). `details` opsional (mis. field errors Zod) — **jangan** sertakan stack/SQL.
- **Semantik status**: POST yang membuat resource → `201`; bila dedup mengembalikan yang sudah ada → `200`. Handler kontrol via `reply(..., { status })`.

### `AppError` + katalog kode

Service melempar `AppError(code, httpStatus, message, details?)`. **Satu** `handleError()` di Route mapping ke envelope + status. Prisma error **tak boleh bocor** ke client.

| Code                 | HTTP    | Makna                                                                |
| -------------------- | ------- | -------------------------------------------------------------------- |
| `VALIDATION`         | 422     | input gagal Zod / aturan domain                                      |
| `UNAUTHENTICATED`    | 401     | tak ada/invalid sesi                                                 |
| `FORBIDDEN`          | 403     | RBAC/scope tolak                                                     |
| `NOT_FOUND`          | 404     | resource tak ada **atau** di luar scope (hide existence → anti-IDOR) |
| `CONFLICT_VERSION`   | 409     | optimistic concurrency stale                                         |
| `FORBIDDEN_STATE`    | 409     | transisi state ilegal (mis. reopen setelah Billed)                   |
| `IDEMPOTENCY_REPLAY` | 200/409 | request duplikat                                                     |
| `RATE_LIMITED`       | 429     | throttle                                                             |
| `UPSTREAM_ERROR`     | 502     | WS BPJS/eksternal gagal                                              |
| `INTERNAL`           | 500     | tak terduga (log full, message generik)                              |

**Prisma→AppError mapping** (di DAL/db layer): `P2025`→`NOT_FOUND`, `P2002`→`CONFLICT` (unique), `P2003`→`VALIDATION` (FK), lainnya→`INTERNAL`.

---

## 5. Validasi & DTO

- **Validasi di boundary Route** dengan Zod **sebelum** masuk Service. Service hanya terima DTO valid & typed.
- **Input DTO** = Zod schema (`z.infer`). Discriminated union untuk varian (mis. Kunjungan per `unit`).
- **Output DTO** = mapping eksplisit dari entity (Service) — **buang** field sensitif (passwordHash, token, NIK bila tak perlu). Jangan kirim entity Prisma mentah.
- Batas: `limit ≤ 50` untuk list; string panjang dibatasi; sanitasi rich-text catatan klinis (anti-XSS, §8).
- Schema co-located di `lib/schemas/<domain>.ts`, dipakai bareng Route + (opsional) client.

---

## 6. Authentication & Authorization — 4 lapis

| Lapis                 | Pertanyaan                                            | Lokasi                                                                   |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| **AuthN**             | Siapa user ini?                                       | **Route guard / DAL** — JWT verify + **Redis** (jti blocklist + tokenVersion). Proxy hanya optimistic redirect. |
| **RBAC**              | Role boleh akses fitur ini?                           | **Route guard** — `rbac.assert(user, resource, action)`                 |
| **ABAC / unit-scope** | Boleh untuk unit/konteks ini? (perawat ICU hanya ICU) | **Service**                                                              |
| **IDOR / ownership**  | Boleh resource SPESIFIK ini?                          | **Service + DAL `scopeBy(actor)`** (+ **Postgres RLS** defense-in-depth) |

**Aturan keras:**

- RBAC saja **tidak cukup** — IDOR dicegah di Service/DAL. Helper `scopeBy(actor, query)` **selalu** inject filter; lupa = bug keamanan.
- Resource di luar scope → balas **`NOT_FOUND`** (bukan 403) agar tak membocorkan keberadaannya.
- **Proxy (`proxy.ts`) ≠ tempat auth.** Edge layer hanya optimistic (cek cookie ada → redirect). Verifikasi authoritative (signature JWT + Redis revoke + RBAC + scope) **wajib di server/Route guard** — edge bisa di-bypass.
- **Auth hybrid** (detail → `BACKEND-AUTH`): JWT access ~15m + refresh DB rotating + revoke via Redis (bump `tokenVersion`/blocklist `jti`). Idle timeout; argon2id; rate-limit login; MFA role admin/direksi.

---

## 7. Aturan data (wajib semua domain)

1. **RME append-only (PMK 24/2022)** — record klinis terverifikasi/terkunci **tak boleh overwrite**. Perubahan = **addendum berversi** (`revisedBy`/`revisedAt`/`supersededById`). CPPT yang sudah di-co-sign DPJP & encounter `locked` → kunci.
2. **Soft-delete default** — `deletedAt`; filter default di DAL. **Hard-delete dilarang** untuk data klinis/finansial (retensi legal).
3. **Optimistic concurrency** — kolom `version` di entity yang diedit banyak staf (Kunjungan, klinis). Update kirim `expectedVersion` → mismatch = `CONFLICT_VERSION` (409).
4. **Idempotency** — semua POST/PUT/DELETE terima `Idempotency-Key`. Simpan hasil per key (Redis, TTL) → replay balas hasil sama. Cegah double SEP/invoice/charge.
5. **Transaksi** — operasi multi-tabel di **Service** via `prisma.$transaction`. DAL terima `tx?`. Gagal = rollback total (tak ada record setengah jadi).
6. **Timezone** — simpan **UTC** di DB; render WIB di edge/UI. Timestamp klinis legal-sensitif.
7. **Audit** — semua CUD otomatis tercatat (§13 + `BACKEND-AUDIT`).

---

## 8. Security checklist (OWASP + healthcare)

- **IDOR** → §6 (scopeBy + RLS + NOT_FOUND).
- **XSS** → React auto-escape; **sanitasi** Markdown/rich-text catatan klinis sebelum simpan (DOMPurify-equiv di server). Tak render HTML mentah.
- **SQL injection** → Prisma parameterized (default aman); **dilarang** `$queryRawUnsafe` dengan input user.
- **Secrets** → env + Vault/Secret Manager; **jangan commit** (BPJS consId/secret/userKey, JWT secret, DB url).
- **PII at-rest** → field-level encryption NIK & no. kartu BPJS (UU PDP 27/2022). **PII-scrubbing di log** — jangan log NIK/nama/kartu mentah.
- **Rate limiting** (Redis) → per-user, per-IP (login brute-force), per-cons-id (BPJS ~1000/hari).
- **Transport** → TLS wajib; **security headers** (HSTS, X-Content-Type-Options, frame-options); **CORS** allowlist ketat.
- **CSRF** → Auth.js built-in untuk cookie-based.
- **Mass assignment** → DTO eksplisit; jangan spread req.body ke Prisma.
- **Dependency** → audit berkala; pin versi.
- **Memory leak** → tutup koneksi/subscription SSE saat client disconnect; jangan tahan referensi di Map global tanpa TTL/cleanup.

---

## 9. Konvensi database (PostgreSQL)

- **Topologi (terkunci 2026-06-01): 1 database fisik · multi-schema per modul** (Prisma `multiSchema`, GA di Prisma 7). Namespace: `auth` · `sdm` · `pendaftaran` · `encounter` · `bpjs` · `order` · `billing` · `claim` · `master` · `antrean` · `audit`. Tiap model `@@schema("<modul>")`. **FK & transaksi lintas-schema OK** (tetap 1 DB). Kode dipecah **1 file `.prisma` per modul** di `prisma/schema/` (`prismaSchemaFolder`, di-merge) + `config.prisma` (generator+datasource). **1 migration history · 1 Client · 1 pool**. *(Ingat: banyak FILE .prisma = organisasi kode; multi Postgres-schema `@@schema` = namespace DB — dua hal beda.)* **BUKAN** database-per-modul (akan memutus FK + butuh distributed-tx — tak perlu untuk monolit).
- **Modular-monolith discipline**: DAL domain **hanya** akses schema-nya sendiri; data domain lain diakses **lewat Service domain itu** (bukan query langsung). FK boleh lintas-schema, tapi **write tetap di domain pemilik**. Ini menjaga boundary modul + memudahkan ekstraksi nanti bila perlu.
- **Penamaan**: tabel/kolom Prisma camelCase model → snake_case di DB via `@@map`/`@map` (konsisten). FK `<entity>Id`.
- **PK = UUID v7** (`@id @default(uuid(7)) @db.Uuid`) — native 16-byte + **time-ordered** (locality index bagus untuk insert volume tinggi; lebih baik dari cuid-string atau uuid v4 random). Client-generated → tak butuh extension.
- **Timestamp = `@db.Timestamptz(3)`** untuk semua `DateTime` (simpan UTC, FLOWS §7) — **bukan** `timestamp` polos (default Prisma di PG).
- **Case-insensitive = `@db.Citext`** (extension `citext`) untuk `username`/`email` dst — uniqueness CI di DB, bukan ditambal app.
- **String = `text`** (default Prisma di PG) — di Postgres `text` ≡ `varchar(n)` secara performa, jadi tak perlu batasi panjang; pakai CHECK constraint bila butuh domain limit.
- **Index**: setiap FK; composite untuk query panas (mis. `(unit,status,createdAt)`); cursor pagination by `(createdAt,id)`.
- **JSONB + GIN** untuk data semi-struktur (SOAP, asesmen, TaskLog, payload BPJS) yang perlu di-query. Field terstruktur tetap kolom biasa.
- **Enum** Postgres native (Prisma enum).
- **RLS** policy per tabel sensitif (pasien/klinis) sebagai defense-in-depth: set `app.current_user_id`/`app.unit_scope` per koneksi, policy filter baris.
- **Migrasi**: `prisma migrate dev` (dev) / `migrate deploy` (prod). **No auto-migrate destruktif di prod**; review SQL tiap migrasi; backward-compatible (expand→migrate→contract).
- **Seed**: `prisma/seed.ts` import mock files → populate (mock 1:1 sudah ada).
- **TimescaleDB**: opsional untuk TTV/observasi bila volume tinggi (hypertable).

---

## 10. Realtime (SSE + Redis Pub/Sub)

- **Arah**: server→client satu arah. Service emit domain event → publish ke **Redis channel** → SSE handler (Node) fan-out ke client subscriber.
- **Channel naming**: `board:{unit}` (worklist IGD/RJ/RI), `display:antrean`, `display:farmasi`, `order:{kunjunganId}` (hasil lab/rad rilis).
- **Payload ringkas** — kirim id + delta state (status, nomorAntrean), **bukan** full record. Client refetch detail via TanStack Query bila perlu.
- **Scope di SSE** — subscriber hanya terima channel sesuai unit/role (authz juga di koneksi SSE).
- **Client**: TanStack Query untuk cache + optimistic update; SSE event → `queryClient.invalidateQueries`. Polling = fallback saja.
- **Cleanup**: unsubscribe Redis + tutup stream saat client disconnect (anti memory leak).

---

## 11. Background jobs (BullMQ) & Outbox

- **Outbox pattern** untuk semua panggilan eksternal (BPJS updatewaktu, SEP, claim submit): tulis intent ke DB dalam transaksi domain → worker kirim async dengan **retry + exponential backoff** (30s→2m→10m→manual) + idempotency key. UI **tak terblokir** kegagalan WS.
- **Cron** (repeatable job): sync referensi BPJS (poli/faskes/diagnosa), refresh cache, laporan terjadwal.
- **Queues**: `outbox-bpjs`, `ref-sync`, `reports`, `fhir-sync`. Dead-letter untuk yang gagal permanen.
- Jangan kerjakan kerja berat di request thread.

---

## 12. Caching (Redis)

- **Cache-aside** untuk master data jarang berubah (Obat/Tindakan/ICD/Penjamin): TTL (mis. 1 jam) + **invalidate saat CUD**.
- **Stampede protection** — lock/single-flight atau SWR saat cache miss ramai.
- **Key naming**: `cache:{domain}:{id|query-hash}`. Namespaced.
- Jangan cache data klinis pasien (sensitif + sering berubah) kecuali sesi pendek beralasan.

---

## 13. Observability & logging

- **Structured logging (pino)** — JSON; level (debug/info/warn/error).
- **Correlation/request ID** per request (middleware) → propagate ke semua log + ke header response.
- **PII-scrubbing** di logger (redact NIK/nama/kartu/token).
- **Audit log** (`BACKEND-AUDIT`) — tabel `AuditLog` (who/action/resource/resourceId/before/after/ip/ua/ts), retensi 5 thn (UU PDP). Middleware otomatis untuk CUD. Feed Dashboard/Beranda Master/BPJS.
- **Metrics** (Prometheus) + **error tracking** (Sentry) + **health/readiness probe** + **graceful shutdown** (drain SSE + jobs).

---

## 14. Konvensi kode & penamaan

- **File ≤ 800 baris** (konsisten dengan frontend) — split bila lebih.
- **Penamaan file**: `<domain>Service.ts`, `<domain>Dal.ts`, `<domain>.ts` (schema). camelCase fungsi, PascalCase tipe.
- **Fungsi Service** = verba domain (`openKunjungan`, `completeKunjungan`), bukan CRUD generik.
- **Fungsi DAL** = CRUD/query (`findById`, `listByUnitStatus`, `updateStatus`).
- **Clean code**: fungsi kecil & single-purpose; early-return; no magic number (konstanta bernama); komentar menjelaskan _kenapa_, bukan _apa_.
- **Pure & testable**: business logic di Service = pure sejauh mungkin (efek samping via DAL/emitter yang di-inject).
- **🚫 Dilarang non-determinisme langsung di Service** — **tidak boleh** `Date.now()`, `new Date()`, `Math.random()`, `crypto.randomUUID()` di tengah business logic. Pakai dependency yang di-inject: **`clock.now()`** & **`genId()`** (+ `genCuid`/sequence untuk nomor). Alasan: deterministik & testable (mis. clamp monoton TaskID antrean butuh waktu yang bisa di-stub). *Catatan migrasi: mock store frontend (`antreanStore`/`registrationStore`) pakai `Date.now()`/`max+1` — saat porting ke Service, ganti ke seam injeksi.*
- **No `any`** — tipe eksplisit; `unknown` + narrow bila perlu.

---

## 15. Testing strategy

> **Test bukan afterthought.** Setiap endpoint/operasi domain WAJIB punya test sebelum dianggap Done (§18).
> Piramida: banyak **unit** (cepat, no DB) → secukupnya **integration** → sedikit **e2e** kritis.

| Level | Target | Tool | Wajib untuk |
|---|---|---|---|
| **Unit** | **Service** (business rules, transisi state machine, guard, authz decision, error throwing, DTO mapping) — **DAL & efek samping di-mock** | Vitest | semua operasi Service |
| **Integration** | **DAL** (query, cursor pagination, `scopeBy`, RLS policy, transaksi, constraint/trigger benar-benar fire) | Vitest + **Testcontainers Postgres** | tiap fungsi DAL non-trivial |
| **E2E (kritis)** | alur tembus via API (registrasi→SEP→klaim, panggil→T4/T5, lock→immutability) | Vitest/Playwright API | alur spine utama |
| **Contract** | Zod schema ↔ DTO tetap selaras dgn frontend | type-check + fixture | tiap schema |

### Yang WAJIB di-unit-test (Service)
- **State machine** — tiap transisi sah + tiap transisi ilegal ditolak (`FORBIDDEN_STATE`). Mis. Kunjungan: `Queued→InService` ok, `Completed→InService` setelah Billed ditolak.
- **Guard bisnis** — mis. `completeKunjungan` tanpa diagnosa → `VALIDATION`.
- **Authz** — actor luar unit-scope → `NOT_FOUND`/`FORBIDDEN`.
- **Optimistic concurrency** — `expectedVersion` stale → `CONFLICT_VERSION`.
- **Idempotency** — replay key → hasil sama, tak dobel.
- **Error mapping** — Prisma error → AppError code benar.

### Pola yang membuat ini bisa (testability by design)
- **Inject seam yang perlu di-mock**: DAL, **clock `now()`**, **id-gen**, event emitter, client eksternal (BPJS) — sebagai dependency, bukan import langsung di tengah logic. → Service deterministik & murni.
- **Determinisme**: dilarang `Date.now()`/`Math.random()` langsung di Service — pakai `clock`/`genId` yang di-inject. (Mock store frontend pakai `Date.now()` — di backend ini diganti.) Test set waktu/id tetap → assert tepat.
- **Test factory/fixture** per entity (builder pasien/encounter) — hindari duplikasi setup.
- **AAA** (Arrange-Act-Assert), 1 perilaku per test, nama deskriptif (`completeKunjungan_tanpaDiagnosa_tolak`).

### Coverage & CI
- **Gate wajib ≥ ~85%** pada **business logic kritis**: state machine, authz/scope, guard, error mapping, perhitungan finansial (tarif/invoice/iDRG). UI-glue & boilerplate tak dikejar 100%.
- **CI** (§stack): lint + typecheck + unit + integration (Testcontainers) **harus hijau** sebelum merge. E2E kritis di pipeline terpisah/nightly.
- Lokasi test: co-located `*.test.ts` (unit) + `__tests__/integration/` (DAL). Naming `<file>.test.ts`.

---

## 16. Konvensi API

- **Versioning**: `/api/v1/...`. Breaking change → `/api/v2`.
- **Resource naming**: plural noun (`/kunjungan`, `/patients`), sub-resource (`/kunjungan/:id/complete` untuk aksi non-CRUD = verba).
- **Pagination**: **cursor-based** untuk list besar (`?cursor=&limit=`), bukan offset. Response `meta.cursor`.
- **Filtering**: query param eksplisit (`?unit=&status=`), divalidasi Zod.
- **Idempotency**: header `Idempotency-Key` wajib untuk mutation.
- **HTTP status** sesuai katalog error (§4).

---

## 17. Template dokumen domain + index

Setiap `BACKEND-{DOMAIN}.md` mengikuti struktur ini (lihat [BACKEND-ENCOUNTER.md](BACKEND-ENCOUNTER.md) sebagai contoh):

1. Scope (owns vs delegasi) · 2. Entity model · 3. Lifecycle/state machine · 4. Layer breakdown (DAL/Service/Schema/API) · 5. Event · 6. Indexing · 7. Failure modes · 8. Migrasi mock→DB · 9. Task checklist · 10. Keputusan terbuka.

**Index domain** (dibuat bertahap):

| Domain                         | File                                      | Status             |
| ------------------------------ | ----------------------------------------- | ------------------ |
| Core rules                     | **BACKEND-FLOWS** (ini)                   | ✅ v1              |
| Resep endpoint (konkret)       | [API-RULES](API-RULES.md)                 | ✅ v1 (pola+peta file) |
| Kunjungan (akar)               | [BACKEND-ENCOUNTER](BACKEND-ENCOUNTER.md) | ✅ spec            |
| Auth & session                 | [BACKEND-AUTH](BACKEND-AUTH.md)           | ✅ spec            |
| Patient                        | [BACKEND-PATIENT](BACKEND-PATIENT.md)     | ✅ spec            |
| Master · Sumber Daya (`master`) | [BACKEND-MASTER-SUMBER-DAYA](BACKEND-MASTER-SUMBER-DAYA.md) | 🚧 spec (Unit & Ruangan) · 1 file/grup |
| Antrean (TaskID)               | BACKEND-ANTREAN                           | 📋                 |
| Order (Lab/Rad/Resep/Tindakan) | BACKEND-ORDER                             | 📋                 |
| Billing (Invoice/Payment)      | BACKEND-BILLING                           | 📋                 |
| Claim (iDRG) + SEP/BPJS        | BACKEND-CLAIM                             | 📋                 |
| Registration (use-case admisi) | BACKEND-REGISTRATION                      | 📋 (orkestrator)   |
| Realtime (SSE/Redis)           | BACKEND-REALTIME                          | 📋                 |
| Audit                          | BACKEND-AUDIT                             | 📋                 |

---

## 18. Definition of Done (per endpoint/domain)

- [ ] Zod schema input + output DTO (no entity bocor)
- [ ] Service pure-ish + transaksi bila multi-tabel + authz unit-scope/IDOR
- [ ] DAL scoped (`scopeBy`) + index untuk query baru
- [ ] Error pakai katalog (§4), tak bocorkan internal
- [ ] Idempotency untuk mutation
- [ ] Audit tercatat untuk CUD
- [ ] Event (SSE/job) bila perlu, dengan cleanup
- [ ] Unit test Service + integration test DAL
- [ ] Tak ada `any`, file ≤800 baris
- [ ] Migration reviewed + seed updated
