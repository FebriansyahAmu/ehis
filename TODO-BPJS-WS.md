# TODO — BPJS Web Service Integration (Backend)

> **Scope:** membuat **web service NYATA ke BPJS** (V-Claim, Aplicares, dst) — mengganti
> mock di `/ehis-bpjs` (FE 100% ✅, [TODO-BPJS.md](TODO-BPJS.md)) dengan connector server-side.
> **Bukan** UI baru — UI sudah ada; ini lapisan transport + service + persist.
> **Aturan wajib dibaca dulu:** [docs/BPJS-WS-RULES.md](docs/BPJS-WS-RULES.md).
>
> **Keputusan (2026-06-26):** vertical slice pertama = **BWS0 Connector Spine**; environment target
> awal = **Sandbox** (`apijkn-dev`). Write (SEP) hanya setelah sandbox lolos.

---

## 🧭 Prinsip Inti (ringkas — detail di RULES)

1. **Server-only.** Browser → BFF kita (`/api/v1/bpjs/*`) → BPJS. Browser TIDAK pernah lihat
   cons-secret, TIDAK sign, TIDAK decrypt. Ini perubahan terbesar dari kondisi FE sekarang.
2. **Satu pipeline transport** dipakai semua endpoint: sign → POST → parse envelope →
   **AES-256-CBC decrypt** → **LZ-String decompress** → JSON → `Result` bertipe.
3. **Layered**: Route → `bpjsService` → `connector`. Side-effect domain (persist SEP/noSep) di
   Service. Panggilan eksternal **tak bisa** di dalam DB tx → pakai **outbox/kompensasi**.
4. **Referensi di-sync, bukan lookup live** ([[project_wilayah_strategy]]): kode BPJS
   (dokter DPJP/poli/diagnosa/faskes/wilayah) → tabel lokal + mapping internal↔BPJS, join saat build.
5. **`BPJS_MODE=mock|sandbox|prod`** — mock = parity layer dev/CI; sandbox sebelum prod; write
   dilarang ke prod sebelum sandbox hijau.

---

## 🔴 BWS0 — Connector Spine (server) — **FIRST SLICE**

> Fondasi. Tanpa ini tidak ada endpoint yang bisa real. Target uji = **sandbox** (read dulu).
>
> **✅ Status (2026-06-26):** BWS0.1–0.5 **SELESAI** (transport core + audit/rate-limit/idempotency) — tsc+eslint clean. Crypto **terverifikasi**: HMAC cocok vektor dok BPJS (`"aaa"/"bbb" → 20BKS3PW…`), AES-256-CBC+LZ-String round-trip identik. Tabel `bpjs.bpjs_audit_log` dibuat + migrasi ter-apply. **Sisa BWS0:** 0.6 smoke READ live ke sandbox — **DITUNDA** (belum ada cons-id/keys; akan diisi di `.env` saat kredensial sandbox tersedia).

### BWS0.1 — Secrets & Config (server)
- [x] **Env contract** ([config.ts](src/lib/bpjs/server/config.ts) `EnvSchema`): `BPJS_MODE`, `BPJS_CONS_ID/SECRET/USER_KEY`, `BPJS_KODE_PPK`, `BPJS_{VCLAIM,APLICARES,ANTREAN}_BASE_URL` (+ per-service `user_key`), `BPJS_TIMESTAMP_TOLERANCE_SEC`, `BPJS_REQUEST_TIMEOUT_MS`. Sandbox base: `https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev/` *(verifikasi di katalog layanan BPJS — versi/path berubah-ubah)*. **TODO ops:** isi `.env` sandbox nyata.
- [x] **Loader server-only** [config.ts](src/lib/bpjs/server/config.ts) `getBpjsConfig()` — Zod-validated, di-cache, **fail-fast** (`BpjsConfigError`) bila kredensial inti/base-URL V-Claim hilang saat mode != mock. `import "server-only"` aktif.
- [ ] **(Opsi multi-faskes)** kredensial per-faskes di DB **terenkripsi** (reuse [pii.ts](src/lib/crypto/pii.ts) pola enc) — fase later; awal cukup env tunggal.
- [ ] **Hapus** `BPJS_CREDS_MOCK` dari jalur client (pindah ke server config; mock value hanya untuk `BPJS_MODE=mock`) — **→ BWS1 de-client**.

### BWS0.2 — Signature & Headers (server crypto)
- [x] [signature.ts](src/lib/bpjs/server/signature.ts) — Node `crypto.createHmac("sha256", secret)` atas `${consId}&${ts}` → base64; `buildBpjsHeaders` kembalikan 4-header + Content-Type **dan** timestamp (dipakai ulang utk decode). Timestamp = Unix epoch **detik UTC**. **Terverifikasi vs vektor dok BPJS.**
- [~] **Clock-skew** — `BPJS_TIMESTAMP_TOLERANCE_SEC` disimpan di config; penegakan = **ops** (server WAJIB NTP-synced; kita generate timestamp dari jam server). Tak ada kode reject (tak relevan untuk timestamp sendiri).
- [x] Formula benar (`buildSignatureMessage`/`nowUnixSeconds`) di server; stub `mockHmacSha256Base64` [authHeader.ts](src/lib/bpjs/authHeader.ts) **tidak** dipakai jalur nyata (dibuang saat BWS1 de-client).

### BWS0.3 — Decrypt + Decompress pipeline
- [x] `npm install lz-string` ✅ — [decrypt.ts](src/lib/bpjs/server/decrypt.ts) pakai `LZString.decompressFromEncodedURIComponent`.
- [x] **AES-256-CBC decrypt** (langkah yang hilang di FE): `key = SHA256(consId+consSecret+timestamp)` (32 byte), `iv = key[0..16]`, `createDecipheriv` atas `response` base64 → LZ → JSON. **Round-trip terverifikasi.**
- [x] **Helper tunggal** `decodeBpjsResponse(raw, consId, secret, ts)` + `encodeBpjsResponse` (test). Dipakai semua endpoint via httpClient.

### BWS0.4 — HTTP client + Envelope + Error
- [x] [httpClient.ts](src/lib/bpjs/server/httpClient.ts) `callBpjs<T>()` — inject 4 header, timeout (AbortController), **retry hanya NetworkError** (backoff ≤2s, default 2x); decode pakai timestamp attempt yang sama. Menolak saat `BPJS_MODE=mock`. *(circuit-breaker = BWS9.)*
- [x] **Envelope parser** `finalize()` — `{metaData:{code,message}, response}`; `200`=Ok(+decode), non-200 → `BPJSError` bertipe (`makeBPJSMetaError`), non-JSON → 500. Reuse `BPJSEnvelope`/`Result` dari [bpjsShared.ts](src/lib/bpjs/bpjsShared.ts).
- [x] **Error taxonomy** — jalur normal: `NetworkError`(retryable)/`BPJSMetaError`(code) via `Result`; infra fail-loud (throw): `BpjsConfigError`/`BpjsDecodeError` ([errors.ts](src/lib/bpjs/server/errors.ts)). `RateLimitError` → BWS0.5.

### BWS0.5 — Audit (DB) + Rate-limit + Idempotency ✅
- [x] **`bpjs.BpjsAuditLog`** ([bpjs.prisma](prisma/schema/bpjs.prisma) + migrasi `20260626120000_bpjs_audit_log`, ter-apply): startedAt, mode, service, endpoint, method, requestHash, **noKartuHash/nikHash** (di-hash), responseHash, responseCode, success, durationMs, errorType, retryCount, actor, actorRole, consId, idempotencyKey. **Retensi 5 thn** = purge cron (ops, BWS9).
- [x] **audit → tulis DB di Service** ([services/bpjs/audit.ts](src/lib/services/bpjs/audit.ts) `auditedCall` + DAL [dal/bpjs/auditDal.ts](src/lib/dal/bpjs/auditDal.ts)); PII di-hash via [pii.ts](src/lib/crypto/pii.ts) `hashPii`; **best-effort** (gagal audit ≠ gagal panggilan). Connector tetap murni.
- [x] **Rate-limit per cons-id** ([bpjs/server/rateLimit.ts](src/lib/bpjs/server/rateLimit.ts) `consumeRateLimit`/`checkRateLimit`, counter harian). ⚠️ **in-memory per-proses** — swap ke **Redis** untuk multi-instance (signature tetap).
- [x] **Idempotency** ([services/bpjs/idempotency.ts](src/lib/services/bpjs/idempotency.ts)): `generateIdempotencyKey` (reuse bpjsShared) + `hasRecentSuccess` (cek audit sukses dlm window). Hard-stop durable = unique DB domain (bpjs.SEP). Simpan `noSep` = tx#2 issueSep (BWS4).

### BWS0.6 — Verifikasi spine (sandbox)
- [ ] Smoke 1 endpoint **read** (Kepesertaan / Referensi) live ke sandbox → decode sukses → audit row tertulis. Tanpa ini, BWS1+ tak boleh lanjut.
- [ ] Test vektor signature & decrypt dari dok resmi BPJS cocok 1:1.

**DoD BWS0:** satu panggilan read sandbox nyata berhasil decode + ter-audit di DB; secret tak pernah ke client (`grep` bundle bersih); `BPJS_MODE=mock` tetap jalan untuk CI.

---

## BWS1 — BFF endpoints + de-client
- [ ] Route handlers `/api/v1/bpjs/*` (RBAC gate per fitur, reuse `bpjs.*` permission bila ada / `registration.*`).
- [ ] FE adapter (`vClaim*.ts`, `aplicaresAdapter.ts`) → panggil **BFF**, bukan BPJS langsung.
- [ ] Hapus jalur signing/credential di client; `credentialsStore` jadi server-only.

## BWS2 — V-Claim Kepesertaan (read pertama, risiko rendah)
- [ ] `getPesertaByNoKartu` / `byNik` live (sandbox) → swap [vClaimKepesertaan.ts](src/lib/bpjs/vClaimKepesertaan.ts).
- [ ] Prefill verifikasi kepesertaan registrasi pakai data nyata (kini un-mask dari DB).

## BWS3 — Reference sync (cron/BullMQ) — **unblock kode DPJP/SEP**
- [ ] Tabel referensi + sync: **dokter DPJP** · poli · diagnosa (ICD) · faskes · propinsi/kab/kec BPJS.
- [ ] **Mapping internal↔BPJS**: `master.Dokter` ↔ kode DPJP BPJS (kolom/ tabel map) — **langsung membuka gap `skdp.kodeDPJP`** (lihat [TECH_DEBT.md](TECH_DEBT.md) §Step SEP). Ekspos `dpjpPegawaiId` di `SpriDTO`.
- [ ] Job repeatable (default 24h) + `POST /api/v1/bpjs/admin/sync-references`.

## BWS4 — V-Claim SEP (write) — ganti mock SEP registrasi
- [ ] `insertSEP`/`updateSEP`/`deleteSEP` live; **idempotency wajib** (jangan dobel terbit); simpan `noSep`.
- [ ] **Adapter t_sep flat→nested** (lihat gap di TECH_DEBT) + map nilai (kelas/laka/lokasiLaka/rujukan internal RANAP/skdp.kodeDPJP).
- [ ] Wire ke `kunjunganService` (registrasi) via **outbox/kompensasi** (panggilan eksternal di luar DB tx).

## BWS5 — Rujukan + Rencana Kontrol / SPRI
- [ ] Rujukan cari/list live; RK/SPRI insert → **ganti `spriBpjsMock`** ([docs/MOCK-SPRI-RAWAT-INAP.md](docs/MOCK-SPRI-RAWAT-INAP.md)).

## BWS6 — Monitoring + Klaim
- [ ] Monitoring kunjungan/klaim; **claim submission** → tautkan ke `/ehis-eklaim`.

## BWS7 — Aplicares bed sync
- [ ] Cron push ketersediaan kamar → tabel `AplicaresKamar`; sumber dari master Ruangan.

## BWS8 — Antrean RS / PCare / Apotek *(later — bila in-scope)*

## BWS9 — Hardening
- [ ] Circuit breaker per service · observability (metrics/log) · rotasi secret · retensi audit · **cutover sandbox→prod** (write hanya setelah sandbox hijau).

---

## ⏱ Estimasi kasar

| Fase | Est |
|---|---|
| BWS0 Connector spine | 4–6 hari |
| BWS1 BFF + de-client | 2–3 hari |
| BWS2 Kepesertaan read | 1–2 hari |
| BWS3 Reference sync + mapping DPJP | 4–6 hari |
| BWS4 SEP write + outbox | 4–6 hari |
| BWS5–6 Rujukan/RK/Monitoring/Klaim | 5–8 hari |
| BWS7 Aplicares | 3–5 hari |
| BWS9 Hardening | 3–5 hari |

---

## 🔗 Terkait
- Aturan: [docs/BPJS-WS-RULES.md](docs/BPJS-WS-RULES.md)
- FE hub (mock yang di-swap): [TODO-BPJS.md](TODO-BPJS.md) · `src/lib/bpjs/*`
- Backend phase lama: [TODOS_BACKEND.md](TODOS_BACKEND.md#b35-bpjs-integration-hub-backend-phase-b-bpjs)
- Gap SEP/DPJP yang dibuka BWS3/BWS4: [TECH_DEBT.md](TECH_DEBT.md)
- Mock yang diganti: [docs/MOCK-JKN-KEPESERTAAN.md](docs/MOCK-JKN-KEPESERTAAN.md) · [docs/MOCK-SPRI-RAWAT-INAP.md](docs/MOCK-SPRI-RAWAT-INAP.md)
