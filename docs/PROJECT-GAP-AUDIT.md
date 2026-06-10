# EHIS — Project Gap Audit & Best-Practice Remediation Plan

> 📋 **Hasil audit menyeluruh (2026-06-10)** atas seluruh roadmap (`TODO*.md`), dokumen kontrak (`docs/`),
> kontrak WS BPJS (`contracts/`), registry tech-debt, dan gap klinis (`.claude/GAP_ANALYSIS.md`),
> diverifikasi silang terhadap kode aktual (route, auth, test, config).
>
> **Tujuan:** satu tempat untuk melihat (1) kekurangan proyek per dimensi — keamanan, best practice,
> kelengkapan TODO, gap klinis/regulasi — dan (2) solusi best-practice berprioritas.
> **Sifat:** snapshot audit; perbarui saat item P0/P1 selesai. Bila konflik aturan → [BACKEND-FLOWS](BACKEND-FLOWS.md) menang.

---

## 0. Ringkasan Eksekutif

| Dimensi | Nilai | Satu kalimat |
|---|---|---|
| **Arsitektur & desain** | 🟢 Kuat | Layered Route→Service→DAL disiplin, error catalog, DTO mapping, optimistic concurrency, soft-delete, multi-schema PG — *tier-1 by design*. |
| **Keamanan (runtime)** | 🔴 Belum production-safe | Auth aktif, tapi **ABAC/scopeBy belum ada** (IDOR), **audit trail CUD belum di-emit**, security headers kosong, idempotency tidak ditegakkan, HMAC BPJS masih stub. |
| **Testing & QA** | 🔴 Sangat tipis | **4 file unit test** untuk **59 API route**; 0 integration test; 0 e2e; gate coverage ≥85% di FLOWS §15 belum ditegakkan. |
| **CI/CD & infra** | 🔴 Tidak ada | Tidak ada `.github/workflows`, tidak ada `docker-compose`, tidak ada backup/monitoring/Sentry/Prometheus. |
| **Dokumentasi & roadmap** | 🟢 Sangat baik | Kontrak FLOWS/API-RULES/BACKEND-* lengkap & jujur (tabel design-vs-runtime); risiko utamanya *drift* dokumen vs kode. |
| **Kelengkapan fungsional** | 🟡 FE matang, BE ~15% | Frontend 6 modul ✅ 100% (mock); backend baru master/registrasi/auth/klinis-awal — **~570 task terbuka** lintas 10 file TODO. |
| **Compliance klinis** | 🟡 Ada gap tertrack | IC Rawat Inap (🔴), print dokumen legal PMK 269, audit retensi 5 thn UU PDP, IKP PMK 11/2017 — semua tercatat tapi belum dibangun. |

**Kesimpulan:** proyek ini *dirancang aman namun berjalan tanpa sebagian pintu* (kutipan API-RULES §10.4 — akurat).
Kekurangan terbesar bukan desain, melainkan **eksekusi kontrol yang sudah didesain**: testing, CI, audit trail,
ABAC, dan infrastruktur produksi. Deploy gate di API-RULES §10.4 **wajib dipertahankan**.

---

## 1. Snapshot Roadmap (TODO List)

Hasil hitung checklist per file (2026-06-10):

| File | Open | Done | Status ringkas |
|---|---:|---:|---|
| [TODOS_BACKEND.md](../TODOS_BACKEND.md) | **192** | 5 | Backend = bulk pekerjaan tersisa (B1 katalog, B2 klinis penuh, B3 integrasi, B4 perf). |
| [TODO-BILLING.md](../TODO-BILLING.md) | 82 | 168 | FE core ✅; BL5 Adjustment, BL7 Reports, seluruh API billing belum. |
| [TODO-DASHBOARD.md](../TODO-DASHBOARD.md) | 77 | **0** | Modul belum dimulai sama sekali (roadmap DB0–DB7 sudah matang). |
| [TODO.md](../TODO.md) | 66 | 149 | Sisa = migrasi konsumen hardcode → master + Phase 4 backend. |
| [TODO-BPJS.md](../TODO-BPJS.md) | 34 | 227 | FE ✅ 100%; sisa = backend transport (HMAC/LZ/secret/circuit-breaker). |
| [TODO-REGISTRASI.md](../TODO-REGISTRASI.md) | 27 | 40 | Backend RJ+IGD/RI ✅; sisa board loket, SEP existing-kunjungan, tab Aksi mock. |
| [TODO-ANTREAN.md](../TODO-ANTREAN.md) | 5 | 56 | Hampir selesai; sisa bridge & audit. |
| [TODO-EKLAIM.md](../TODO-EKLAIM.md) | 4 | 186 | FE ✅; sisa deferred (zod adapter, fixtures). |
| [TODO-CLINICAL.md](../TODO-CLINICAL.md) | 1 | 41 | Domain Triase ✅; domain klinis berikutnya belum di-checklist-kan (lihat §5.3). |
| [TODO-RBAC-MODUL.md](../TODO-RBAC-MODUL.md) | 1 | 14 | Sisa rollout `<Can>` per modul. |
| **Total terlihat** | **~489** | **~876** | + item TECH_DEBT (±70) tidak berbentuk checklist semua. |

### Masalah struktural TODO (bukan jumlahnya)

1. **Tidak ada prioritas lintas-file.** 10 file TODO masing-masing punya fase internal, tapi tak ada
   *single ranked backlog*. CLAUDE.md "Active Work" hanya menyebut opsi, bukan urutan. → Risiko: pekerjaan
   melebar (modul baru FE) sementara fondasi produksi (test/CI/audit) tak pernah jadi "fase yang dipilih".
2. **Duplikasi item antar file.** Contoh nyata: rate-limit login muncul di TECH_DEBT §Auth, BACKEND-AUTH §11,
   dan TODOS_BACKEND B0; HMAC BPJS muncul di TECH_DEBT, TODO-BPJS, dan TODOS_BACKEND B3.5. Tidak ada penanda
   "canonical owner" → risiko dianggap selesai di satu file padahal terbuka di file lain.
3. **TODOS_BACKEND.md drift terhadap kontrak.** File ini ditulis pra-FLOWS: masih menyebut *NextAuth.js +
   bcrypt* (B0) padahal keputusan terkunci = custom `jose` + scrypt→argon2id; masih `?page=N` offset
   pagination padahal FLOWS §16 = cursor; path `api/<module>` tanpa `v1`. → Perlu rebaseline (lihat §6, S-13).
4. **Definition of Done tidak ditegakkan retroaktif.** FLOWS §18 mensyaratkan unit test + audit + idempotency
   per endpoint — 59 route sudah ada, mayoritas tidak memenuhi DoD-nya sendiri (lihat §3).

---

## 2. Temuan Keamanan (urut keparahan)

Verifikasi langsung ke kode (bukan hanya dokumen). Status baseline yang sudah BAIK: `.env` ter-gitignore ✅,
tidak ada env file ter-commit ✅, PII field-level encryption ada ([src/lib/crypto/pii.ts](../src/lib/crypto/pii.ts)) ✅,
error tidak bocorkan internal ✅, JWT httpOnly + refresh rotation + reuse-detection + lockout ✅,
mass-assignment terjaga (`setDefined` allow-list) ✅.

### 🔴 SEC-1 — ABAC / `scopeBy(actor)` belum ada → IDOR terbuka (OWASP API1/API5)
- **Fakta:** Service menerima `actor` tapi tidak ada satupun filter unit-scope/ownership di DAL. Semua user
  ter-autentikasi dengan permission `read` dapat membaca **resource unit mana pun** (mis. perawat poli membaca
  rekam medis IGD pasien lain) hanya dengan mengganti `:id`.
- **Mitigasi saat ini:** hanya akun superadmin yang ada → belum menggigit. Tapi ini **gate keras** sebelum
  akun klinis dibuat ([BACKEND-AUTH §11 MUST #3](BACKEND-AUTH.md)).
- **Solusi:** implement `requireScope(actor, unit)` + helper `scopeBy(actor, where)` yang **selalu** di-inject
  DAL (fail-closed: role `unitScoped=true` tanpa `UserUnitScope` → tolak). Resource di luar scope → `NOT_FOUND`
  (sudah jadi konvensi). Tambah **Postgres RLS** sebagai defense-in-depth (FLOWS §9) — policy per tabel
  pasien/klinis dengan `app.current_user_id`. Unit test allow/deny per role wajib (AUTH6 yang masih kosong).

### 🔴 SEC-2 — Audit trail CUD & auth events belum di-emit (HIPAA §164.312(b) · UU PDP · SNARS)
- **Fakta:** Tidak ada tabel `AuditLog`; login/logout/CUD tidak tercatat. API-RULES §10.2 sendiri menyebut
  "mustahil di-backfill" — setiap hari berjalan tanpa audit = data forensik hilang permanen.
- **Solusi:** bangun **sekarang** sebagai infra lintas-cutting, bukan per-endpoint: (a) tabel
  `audit.AuditLog (who/action/resource/resourceId/before/after/ip/ua/ts)` retensi 5 thn; (b) emit di satu
  boundary — wrapper `transaction()` atau hook di `route()` pasca-handler untuk mutation; (c) event auth
  (LOGIN/LOGIN_FAILED/LOGOUT/REVOKE) dari `authService`. PII-scrub payload before/after.

### 🔴 SEC-3 — RBAC domain klinis shared salah resource
- **Fakta:** endpoint rekam medis shared (`/kunjungan/:id/{triase,observasi,anamnesis}`) semua di-gate
  `clinical.igd:*` padahal dipakai lintas IGD/RI/RJ → akun RI/RJ akan **salah ditolak** menulis TTV/anamnesis.
  (TECH_DEBT §Auth, tracked.)
- **Solusi:** pilih opsi (a) dari TECH_DEBT — permission per-domain (`clinical.observation`, dst.) + re-seed —
  lebih sederhana daripada gate dinamis per-unit, dan tetap kompatibel `route()` resource statis. ABAC unit
  (SEC-1) yang menangani "boleh unit mana", RBAC cukup "boleh domain apa".

### 🔴 SEC-4 — Security headers & CORS = kosong total
- **Fakta:** `next.config.ts` = `{}`; `proxy.ts` tidak set header apa pun. Tidak ada HSTS, CSP,
  X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CORS allowlist.
- **Solusi (cheap, ≤1 hari):** `headers()` di `next.config.ts` — HSTS (saat TLS), `X-Content-Type-Options:
  nosniff`, `frame-ancestors 'none'`, Referrer-Policy `strict-origin-when-cross-origin`, CSP mulai
  report-only lalu enforce. CORS: API internal → same-origin only, tolak preflight asing.

### 🟠 SEC-5 — Idempotency dibaca tapi tidak ditegakkan
- **Fakta:** `route.ts` membaca header `Idempotency-Key` lalu meneruskannya — tidak ada penyimpanan/replay.
  Double-submit form = double SEP/charge/kunjungan. FLOWS §7.4 mewajibkannya untuk SEMUA mutation.
- **Solusi:** jangan tunggu Redis — interim **tabel `IdempotencyKey` di Postgres** (key unik + response hash +
  TTL via pg_cron purge), enforce di `route()` untuk POST. Swap storage ke Redis saat tersedia tanpa ubah seam.

### 🟠 SEC-6 — Rate-limit login hanya lockout per-akun
- **Fakta:** lockout 5×/15m per-akun ✅, tapi tanpa limit per-IP → credential stuffing terdistribusi lintas
  username tidak tertahan; juga belum ada rate-limit endpoint umum (`RATE_LIMITED` cuma kode error).
- **Solusi:** interim in-memory/DB sliding-window per-IP di `POST /auth/login` (FLOWS membolehkan interim
  non-Redis); produksi pindah Redis. Tambah limit kasar per-user untuk mutation API.

### 🟠 SEC-7 — Transport BPJS masih mock yang terlihat seperti nyata
- **Fakta:** `mockHmacSha256Base64()` = base64 payload (bukan HMAC), LZ-String no-op, kredensial
  `BPJS_CREDS_MOCK` di kode. Tidak berbahaya selama tidak menyentuh endpoint BPJS asli, tapi **berisiko
  tertukar sebagai siap-produksi** karena seluruh UI BPJS tampak berfungsi.
- **Solusi:** (a) tandai keras di runtime — banner/log "BPJS MOCK MODE" bila `BPJS_MODE !== "production"`;
  (b) saat backend: HMAC via `crypto.createHmac`, `lz-string` NPM, kredensial dari env/secret-manager,
  decrypt response (V-Claim mengembalikan payload terenkripsi+kompresi); (c) rate-limit per cons-id +
  circuit breaker + retry queue outbox (sudah ter-spec di TODO-BPJS).

### 🟡 SEC-8 — Sisa hardening (tracked, konfirmasi saja)
- `AUTH_SECRET` produksi + rotasi (MUST saat deploy) · revoke instan Redis (window token curian ≤30m
  diterima sementara) · scrypt→argon2id (format self-describing, migrasi mulus) · CSRF token untuk mutasi
  berisiko (saat ini `sameSite=lax`) · MFA TOTP role admin (field sudah ada) · `changePassword` FE +
  `mustChangePassword` · sanitasi rich-text klinis server-side (FLOWS §8 — **belum ada implementasi**;
  wajib sebelum CPPT/markdown tersimpan dari input bebas).

---

## 3. Temuan Best Practice Engineering

### 🔴 ENG-1 — Testing jauh di bawah kontrak sendiri
- **Fakta:** 4 file test (`jwt`, `authService`, `pegawaiService`, `userService`) vs **59 route** + puluhan
  service/DAL. 0 integration (Testcontainers ter-spec tapi belum pernah dipakai), 0 e2e, 0 contract test.
  Domain berisiko tinggi **tanpa test sama sekali**: `kunjunganService` (state machine lifecycle!),
  `bedAllocation` (anti-double-booking!), `ruanganService`, `triase`, `icd import`.
- **Solusi:** tegakkan piramida FLOWS §15 mulai dari **state machine & uang/bed**: (1) unit test
  `kunjunganService` semua transisi legal+ilegal, (2) `bedAllocation` reserve/occupy/release + konflik 409,
  (3) integration DAL untuk partial-unique bed & cursor pagination, (4) jadikan DoD §18 *blocking* — endpoint
  baru tanpa test tidak di-merge. Target awal realistis: semua Service yang memutasi status/stok/uang.

### 🔴 ENG-2 — Tidak ada CI/CD
- **Fakta:** `.github/workflows` tidak ada. `tsc --noEmit` hanya konvensi manual pra-commit.
- **Solusi (≤½ hari):** GitHub Actions: `lint` + `tsc --noEmit` + `vitest run` on PR + push main. Tahap 2:
  job integration (Testcontainers) + `prisma migrate diff` check. Tanpa CI, gate coverage & DoD hanya prosa.

### 🔴 ENG-3 — Tidak ada infra produksi: Docker, backup, monitoring, observability
- **Fakta:** tidak ada `docker-compose.yml` (Postgres/Redis dev di-setup manual), tidak ada strategi backup
  (pg_dump), pino/correlationId/Prometheus/Sentry/health-probe belum ada — padahal FLOWS §13 mewajibkan.
  Logging saat ini `console.error` di `handleError`.
- **Solusi:** (a) `docker-compose.yml` dev (postgres+redis) — juga menurunkan friksi onboarding & CI;
  (b) pino + correlationId di `route()` (seam sudah ada di desain proxy) + PII-redact; (c) `/api/health`
  readiness; (d) backup: pg_dump harian + uji restore — **data RS tanpa backup teruji = risiko legal**;
  (e) Sentry/metrics menyusul saat deploy nyata.

### 🟠 ENG-4 — Realtime & cache: didesain, belum ada
- **Fakta:** SSE+Redis pub/sub (FLOWS §10), BullMQ outbox (§11), cache-aside (§12) — semuanya 0%.
  Konsekuensi nyata sekarang: board RJ/IGD tidak sinkron antar-operator (fetch sekali + patch optimistik),
  `workflowStore` klinis murni client-side (data hilang saat refresh).
- **Solusi:** jangan bangun ketiganya sekaligus. Urutan nilai: (1) **polling interval 15–30s** di board
  (sudah jadi fallback resmi FLOWS §10 — murah, hilangkan stale board hari ini), (2) SSE saat Redis masuk,
  (3) outbox BullMQ saat integrasi BPJS nyata dimulai (prasyarat keras transaksi-aman ke eksternal).

### 🟠 ENG-5 — Dua sumber kebenaran selama transisi mock→DB
- **Fakta:** modul ber-backend (registrasi/master) hidup berdampingan dengan modul full-mock
  (billing/eklaim/BPJS/klinis lain). Contoh konkret yang sudah tercatat: `RUANGAN_MOCK` masih dikonsumsi
  Aplicares & Mapping Hub padahal ruangan sudah di DB; detail IGD masih 100% mock padahal board IGD dari DB;
  kartu pasien DB belum bisa di-link ke rekam medis.
- **Solusi:** aturan transisi eksplisit — *setiap kali sebuah entity naik ke DB, sweep semua konsumen mock-nya
  dalam fase yang sama* (grep import mock = checklist). Tambah lint rule/CI grep yang melarang import
  `*Mock.ts` dari file yang sudah berlabel backend-wired.

### 🟡 ENG-6 — Konsistensi kecil
- Pagination cap 50 tanpa UI "muat lebih" (tabel Pengguna terpotong >50 baris — bug data tak terlihat).
- Edit/suspend/hapus AKUN masih optimistic-only (revert saat refresh) — UX menipu operator.
- `correlationId` belum ada di proxy/route → debugging produksi lintas-layer akan sulit.
- Beberapa stat (ICD "kode dimuat") menghitung halaman ter-fetch, bukan total — label harus jujur atau tambah COUNT.

---

## 4. Gap Klinis & Compliance (dari GAP_ANALYSIS + STANDARDS, divalidasi masih terbuka)

| Gap | Standar | Prioritas | Catatan solusi |
|---|---|---|---|
| **Informed Consent di Rawat Inap** | PMK 290/2008 · HPK 2.1–2.2 | 🔴 Tinggi | Shared `InformedConsentTab` sudah ada — reuse, bukan bangun baru. Gap tertinggi yang termurah ditutup. |
| **Print/Export dokumen legal PDF** (CPPT, Resume Medis/Pulang, surat, IC) | PMK 269/2008 · PMK 24/2022 | 🔴 Tinggi | RM elektronik tanpa cetakan legal = blocker operasional nyata. Mulai `window.print()` + stylesheet (pola sudah ada di E-Klaim/BPJS A4) — jangan langsung react-pdf. |
| **Audit trail RM** (akses & perubahan record) | UU PDP (retensi 5 thn) · PMK 24/2022 | 🔴 | = SEC-2. Termasuk *access log* baca record sensitif (CPPT/diagnosa) — belum ada di desain manapun, tambahkan ke BACKEND-AUDIT. |
| **RME append-only enforcement** | PMK 24/2022 | 🟠 | Didesain (FLOWS §7.1: addendum berversi + trigger immutability) tapi domain klinis backend baru Triase/Observasi/Anamnesis — pastikan trigger locked + `supersededById` masuk sejak migrasi domain CPPT, bukan retrofit. |
| **HAM label di IGD** | SKP 3 | 🟡 | RI sudah ada; selaraskan IGD. |
| **Isolasi/PPI + bundle HAI** | SNARS PPI 1–7 | 🟡 | FE RI ada (ppiIsolasi) — backend belum. |
| **MAR gate dispensasi** | SNARS PKPO | 🟡 | Perawat bisa catat pemberian obat yang belum diserahkan farmasi (TECH_DEBT) — patient-safety bug, naikkan prioritas saat MAR dipakai nyata. |
| **Laporan IKP** (KTD/KNC/Sentinel) | PMK 11/2017 | ⏸ | Modul EHIS-Safety — keputusan sadar, biarkan tracked. |
| **Transfusi darah, APACHE/SOFA, Clinical Pathway** | SNARS PP 4 / PP | 🟢 | Backlog sadar. |
| **SatuSehat/FHIR** | Kemenkes (wajib bertahap RS) | 🟠 | Modul `/ehis-fhir` 0%; regulasi interop berjalan — minimal jangan biarkan tanpa target kuartal. |

---

## 5. Gap Arsitektur Data & Integrasi

### 5.1 Spine lintas-modul (dari memori `project_backend_spine_gaps`, masih relevan)
Dua jahitan yang menyembuhkan break lintas-modul — **Encounter tunggal** (Reg→worklist klinis) sudah jalan
untuk RJ/IGD/RI dasar; **Invoice tunggal** (Reg→billing) belum ada sama sekali (invoice draft saat check-in
masih TODO di `kunjunganService`). Selama Invoice belum jadi entity DB, seluruh modul billing FE menumpuk
di atas store client yang akan di-rework. → Prioritaskan skeleton `billing.Invoice` + charge ingest minimal
sebelum memperluas fitur billing FE lain (BL5/BL7).

### 5.2 Kontrak BPJS (`contracts/`)
8 file kontrak (SEP, Peserta, Rujukan, RencanaKontrol, Monitoring, Aplicares, Signature, WS-ANTREAN) =
salinan spesifikasi WS BPJS mentah. Masalah: (a) **tidak berversi/bertanggal** — V-Claim sering berubah
(REST V2 vs V1) dan tak ada catatan kapan disalin; (b) belum ada validasi runtime — adapter mock tidak
di-parse Zod terhadap kontrak ini, sehingga drift kontrak↔adapter tak terdeteksi. → Solusi: header metadata
(versi WS, tanggal unduh, sumber) per file + Zod schema per response yang dipakai adapter (sudah direncanakan
di TODO-EKLAIM `zodSchemas.ts` — perluas ke semua adapter BPJS).

### 5.3 TODO-CLINICAL terlalu pendek untuk sisa pekerjaannya
Domain 1 (Triase) selesai, tapi domain 2–9 (Observation→CPPT→Condition→Procedure→…) belum punya checklist
sama sekali (open=1). Backend klinis = pekerjaan terbesar & paling sensitif regulasi (append-only, co-sign,
locking) — perlu di-breakdown sebelum dikerjakan, jangan didesain sambil jalan.

---

## 6. Rencana Solusi Berprioritas

> Prinsip: **tutup kontrol yang sudah didesain sebelum menambah fitur baru.** Semua item di bawah sudah punya
> seam di kode — biaya sekarang jauh lebih murah daripada retrofit.

### P0 — Fondasi produksi (kerjakan sebelum fitur baru apa pun; ~2–3 minggu)

| # | Solusi | Menutup | Effort |
|---|---|---|---|
| S-1 | **CI GitHub Actions**: lint + tsc + vitest per PR | ENG-2 | ½ hari |
| S-2 | **Audit trail**: tabel `audit.AuditLog` + emit terpusat di `route()`/`transaction()` untuk mutation + event auth | SEC-2, gap UU PDP | 2–3 hari |
| S-3 | **Security headers** di `next.config.ts` + CORS same-origin | SEC-4 | ½–1 hari |
| S-4 | **ABAC `requireScope` + `scopeBy` di DAL** (fail-closed) + unit test allow/deny | SEC-1 | 3–4 hari |
| S-5 | **Fix resource RBAC klinis shared** (perm per-domain + re-seed) | SEC-3 | 1 hari |
| S-6 | **Unit test domain kritis**: kunjungan state machine, bedAllocation, triase guard | ENG-1 | 3–4 hari |
| S-7 | **Idempotency enforcement** interim Postgres di `route()` untuk POST | SEC-5 | 1–2 hari |
| S-8 | **docker-compose dev** (postgres+redis) + `/api/health` + pino+correlationId dasar | ENG-3 | 1–2 hari |
| S-9 | **Rate-limit login per-IP** (in-memory/DB interim) | SEC-6 | ½ hari |

Setelah P0: API boleh dipakai akun non-superadmin di jaringan internal. **Deploy publik tetap menunggu P1.**

### P1 — Pra-go-live (sebelum data pasien nyata / jaringan tak tepercaya)

| # | Solusi | Menutup |
|---|---|---|
| S-10 | `AUTH_SECRET` produksi via secret manager + rencana rotasi; kredensial BPJS idem | SEC-8, SEC-7 |
| S-11 | Backup pg_dump harian + **uji restore** terjadwal | ENG-3 |
| S-12 | Print/PDF dokumen legal (CPPT, Resume, IC) via print-stylesheet | Gap klinis 🔴 |
| S-13 | **Rebaseline TODOS_BACKEND.md** terhadap FLOWS/API-RULES (hapus NextAuth/bcrypt/offset-pagination; tandai canonical owner tiap item duplikat) | §1 drift |
| S-14 | Integration test DAL (Testcontainers): bed partial-unique, cursor, soft-delete filter | ENG-1 |
| S-15 | Sanitasi rich-text klinis server-side sebelum domain CPPT dibangun | SEC-8 |
| S-16 | Polling board 15–30s (stopgap realtime) | ENG-4 |
| S-17 | Informed Consent RI (reuse shared tab) + HAM label IGD | Gap klinis 🔴/🟡 |
| S-18 | Postgres **RLS** tabel pasien/klinis (defense-in-depth pasca S-4) | SEC-1 |

### P2 — Hardening & skala (paralel dengan kelanjutan backend B1/B2)

Redis (revoke jti, rate-limit, cache `perm:` & master) → SSE realtime → BullMQ outbox BPJS + HMAC/LZ nyata +
circuit breaker → argon2id swap → MFA admin → Sentry/Prometheus → mock-sweep per entity (ENG-5) →
breakdown TODO-CLINICAL domain 2–9 → e2e alur spine (registrasi→SEP→klinis→billing).

### Saran tata kelola backlog (menjawab "TODOLIST")

1. Buat **`TODO-NOW.md`** (atau seksi tetap di CLAUDE.md): maksimal 10 item ranked lintas-file, masing-masing
   menunjuk item canonical di file asalnya. Semua file TODO lain = referensi, bukan antrian.
2. Setiap item keamanan/compliance diberi label gate-nya (`pre-clinical-accounts`, `pre-prod`, `pre-public`)
   — meniru pola yang sudah benar di BACKEND-AUTH §11.
3. Jalankan ulang hitung `- [ ]` (perintah audit ini) tiap akhir fase untuk mengukur tren, bukan perasaan.

---

## 7. Apa yang TIDAK perlu diubah

Untuk mencegah audit ini dibaca sebagai "rombak semuanya" — hal berikut sudah benar dan jangan disentuh:

- **Layering + `route()` wrapper + error catalog + DTO mapping** — disiplin & konsisten; deviasi sadar
  (envelope custom vs RFC 9457, `expectedVersion` vs ETag, no-HATEOAS) terdokumentasi dengan alasan yang valid.
- **Mock-first → swap pattern** — terbukti bekerja (registrasi/master zero-refactor UI).
- **Keputusan terkunci**: multi-schema 1-DB, UUID v7, custom `jose`, wilayah via DB internal, iDRG-first,
  Encounter tunggal, App=decisions/DB=guarantees.
- **Kejujuran dokumentasi** (tabel design-vs-runtime API-RULES §10.1, deviasi tercatat §10.3, deploy gate §10.4)
  — pertahankan pola ini; audit ini hanya menambahkan *enforcement plan* di atasnya.

---

*Audit oleh Claude Code, 2026-06-10. Sumber: 10 file TODO*, 9 docs, 8 contracts, TECH_DEBT, GAP_ANALYSIS,
STANDARDS, CLAUDE.md + verifikasi kode (`src/app/api` 59 route · 4 test file · next.config · proxy.ts ·
.gitignore · lib/http/route.ts · lib/crypto).*
