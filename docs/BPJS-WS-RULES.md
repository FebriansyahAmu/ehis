# BPJS Web Service — RULES (kontrak menulis panggilan ke BPJS)

> **Baca SEBELUM menulis/mengubah integrasi BPJS apa pun.** Ini aturan kanonik; menang bila
> konflik dengan kebiasaan lama FE mock. Roadmap eksekusi: [TODO-BPJS-WS.md](../TODO-BPJS-WS.md).
> Pola layering umum: [docs/BACKEND-FLOWS.md](BACKEND-FLOWS.md) · [docs/API-RULES.md](API-RULES.md).

---

## Arsitektur Layering (peta rung)

Connector BPJS = **rung transport**, sejajar **DAL Prisma** (bukan menggantikannya). DAL bicara ke
DB kita; connector bicara ke sistem eksternal (BPJS). **Service** = satu-satunya yang memegang keduanya.

```
FE adapter            src/lib/api/bpjs/*        ← thin fetch ke BFF (BUKAN ke BPJS)
   │ fetch /api/v1/bpjs/...
   ▼
ROUTE (BFF)           src/app/api/v1/bpjs/*     ← RBAC gate · parse Zod · Result→HTTP. TIPIS.
   ▼
SERVICE (orkestrasi)  src/lib/services/bpjs*    ← OTAK: pilih mock/real · audit · idempotency ·
   │   ├──────────────┐                            rate-limit · persist domain · OUTBOX
   ▼                  ▼
CONNECTOR           DAL (Prisma)                ← 2 peripheral yang dikoordinir Service:
src/lib/bpjs/server/*  src/lib/dal/bpjs/*           • connector = sistem EKSTERNAL (BPJS) ✅
(sign→fetch→decode)    bpjs.SEP/Rujukan/            • DAL = DB KITA (Postgres)
   ▼                   BpjsAuditLog
BPJS V-Claim (sandbox/prod)
```

| Rung | Boleh | TIDAK boleh |
|---|---|---|
| **Route** `app/api/v1/bpjs/*` | RBAC, validasi input, map `Result`→HTTP | tahu cons-secret, panggil connector tanpa service |
| **Service** `services/bpjs*` | pilih **mock vs real** (`BPJS_MODE`), **audit** (DAL), **idempotency**, **rate-limit**, **persist** SEP/noSep, **outbox** | bikin signature/decrypt sendiri |
| **Connector** `bpjs/server/*` | sign, fetch, decode → `Result` | side-effect domain, sentuh DB, tahu `actor`/session |
| **DAL** `dal/bpjs/*` | Prisma read/write `bpjs.*` + `BpjsAuditLog` | panggil BPJS / HTTP |

**Konsekuensi terpenting (R4) — panggilan eksternal KELUAR dari DB tx.** `bpjsService.issueSep`
kini mock & jalan di dalam tx register kunjungan; saat connector nyata masuk, polanya jadi
**outbox/kompensasi**:

```
tx#1 : persist Kunjungan + SEP status=Draft (noSep=null)        ← cepat, lepas lock
 ──  : issueSep → connector.callBpjs(insertSEP)                  ← di LUAR tx (lambat/bisa gagal)
tx#2 : update SEP → Terbit + noSep   (atau → Gagal + alasan)     ← idempoten; retry = aksi server
```

`bpjs.SepStatus` sudah punya `Draft/Terbit/Batal/Gagal`. Swap mock→real = ganti **isi**
`issueSep` saja (signature tetap) → **Route & FE tak berubah**.

---

## R1 — Secrets server-only (MUTLAK)

- `cons-id`, `cons-secret`, `user_key` **hanya** di server (env / DB terenkripsi). **TIDAK PERNAH**
  di-bundle ke browser, di-`NEXT_PUBLIC_*`, atau di-import dari komponen `"use client"`.
- Signing (HMAC) & decrypt (AES) **hanya di server**. File connector pakai `import "server-only"`.
- **Mengapa:** cons-secret = identitas RS ke BPJS. Bocor = penyalahgunaan akun + sanksi.

## R2 — Semua panggilan lewat connector server, FE lewat BFF

- Alur tetap: **Browser → `/api/v1/bpjs/*` (BFF kita) → connector → BPJS.** Tidak ada
  browser→BPJS langsung (CORS pun menolak; lagipula melanggar R1).
- FE adapter (`src/lib/bpjs/vClaim*.ts`, `aplicaresAdapter.ts`) = pemanggil BFF, bukan pemanggil BPJS.
- **Mengapa:** satu choke-point untuk auth, audit, rate-limit, decode, error.

## R3 — Layered: Route → Service → Connector

- **Route** (`app/api/v1/bpjs/...`): RBAC gate + parse input + map `Result`→HTTP. Tipis.
- **Service** (`lib/services/bpjs/*`): orkestrasi + **side-effect domain** (persist SEP/noSep,
  update kunjungan). Tulis audit. Idempotency.
- **Connector** (`lib/bpjs/server/*`): transport murni (sign→POST→decode→`Result`). Tanpa domain.
- **Mengapa:** sama dengan seluruh app; mudah diuji + di-mock per lapis.

## R4 — Panggilan eksternal TIDAK di dalam DB transaction → outbox/kompensasi

- HTTP ke BPJS bisa lambat/timeout; jangan kunci row DB selama itu.
- Pola: (a) catat intent (status `Pending`) → (b) panggil BPJS di luar tx → (c) tx kedua tulis
  hasil (`noSep`, status `Terbit`/`Gagal`). Retry = aksi server idempoten, bukan re-tx panjang.
- **Mengapa:** mencegah lock contention + state setengah jadi saat BPJS down.

## R5 — Satu pipeline decode untuk SEMUA response

```
response(base64) → AES-256-CBC decrypt → LZ-String decompress → JSON.parse → Result<T>
key = SHA256(consId + consSecret + timestamp)  // 32 byte
iv  = key.slice(0, 16)
```
- Helper tunggal `decodeBpjsResponse(raw, timestamp)`. **Jangan** duplikasi per endpoint.
- LZ-String pakai `decompressFromEncodedURIComponent` (NPM `lz-string`).
- **Mengapa:** V-Claim 2.x meng-enkripsi+kompres response; salah satu langkah lupa → "data acak".
  (No-op LZ FE sekarang TIDAK cukup — wajib tambah AES.)

## R6 — Signature & timestamp

- `X-signature = base64(HMAC_SHA256(`${consId}&${timestamp}`, consSecret))`.
- `X-timestamp` = **Unix epoch detik UTC** (`Math.floor(Date.now()/1000)`).
- Server **wajib NTP-synced**; drift di luar toleransi BPJS → request ditolak. Pakai `timestamp`
  yang SAMA untuk header **dan** untuk derive AES key.
- Header: `X-cons-id`, `X-timestamp`, `X-signature`, `user_key` (lowercase + underscore).

## R7 — Envelope & kode

- Semua response = `{ metaData: { code, message }, response }`.
- `code === "200"` → sukses. `"201"` → kosong/not-found (Ok tanpa response). Lainnya →
  `BPJSBusinessError` bertipe (jangan retry).
- Map ke `Result<T, BPJSError>`; jangan lempar untuk error bisnis (itu jalur normal).

## R8 — Idempotency untuk WRITE (SEP dkk)

- Setiap write (insert SEP, insert SPRI) butuh **idempotency key**; dedupe sebelum kirim ulang.
- Simpan `noSep`/nomor hasil BPJS; **jangan pernah terbit ganda**. Retry = cek-dulu-lalu-kirim.
- **Mengapa:** SEP ganda = klaim kacau + audit BPJS bermasalah.

## R9 — Audit setiap panggilan (DB, 5 tahun)

- Tulis 1 baris `BpjsAuditLog` per call: endpoint, method, requestHash, responseCode, success,
  durationMs, actor, actorRole, consId, idempotencyKey, retryCount, errorType.
- **PII**: simpan `noKartuHash`/`nikHash` (hash), **bukan** plaintext, di audit & log. NIK/noKartu
  at-rest via [pii.ts](../src/lib/crypto/pii.ts) (encrypt), DTO **masked**.
- **Mengapa:** kepatuhan UU PDP 27/2022 + telusur sengketa klaim.

## R10 — Retry & circuit breaker

- Retry **hanya** `NetworkError`/timeout (backoff terbatas, mis. ≤2x). Error bisnis BPJS = tidak retry.
- Circuit breaker per service (V-Claim/Aplicares): buka saat gagal beruntun → fail-fast, lindungi UX.

## R11 — Rate limit per cons-id

- BPJS membatasi kuota per cons-id. Counter Redis; tolak dini `429` saat mendekati kuota.

## R12 — Kode referensi: SYNC, bukan lookup live

- Kode BPJS (dokter DPJP, poli, diagnosa, faskes, wilayah) **di-sync** ke tabel lokal + tabel
  mapping internal↔BPJS; **join saat build payload**. Jangan hit referensi BPJS per-request user.
- **Mengapa:** sama alasan [[project_wilayah_strategy]] — latensi, kuota, joinable, offline-safe.
  Ini juga jalur resmi mengisi `skdp.kodeDPJP`/`dpjpLayan` (map `Dokter`→kode DPJP BPJS).

## R13 — Mode & environment

- `BPJS_MODE=mock|sandbox|prod`. `mock` = parity dev/CI (shape sama, tanpa jaringan).
- Override baca-saja saat `BPJS_MODE=mock` (write tetap mock): `BPJS_REFERENSI_LIVE=true` (sync
  referensi) · `BPJS_BACA_LIVE=true` (panggilan baca per pengguna, mis. cek kepesertaan). Keduanya
  butuh env inti lengkap (`BPJS_CONS_ID/SECRET/USER_KEY/VCLAIM_BASE_URL`); jangan naikkan
  `BPJS_MODE` hanya untuk menguji baca — itu ikut menyalakan write.
- **Sandbox dulu** (`apijkn-dev`). **Write (SEP) DILARANG ke prod** sebelum sandbox hijau.
- Base URL & path per-versi **verifikasi di katalog layanan BPJS** (berubah antar rilis).

## R14 — Jangan log payload sensitif

- Jangan `console.log` body request/response mentah berisi PII. Audit pakai **hash**, bukan isi.

---

## Peta file (target — connector server BARU)

| Lapis | File | Isi |
|---|---|---|
| Config | `src/lib/bpjs/server/config.ts` | env loader + Zod, `server-only` |
| Signature | `src/lib/bpjs/server/signature.ts` | HMAC + timestamp |
| Decode | `src/lib/bpjs/server/decrypt.ts` | AES-256-CBC + LZ-String |
| Transport | `src/lib/bpjs/server/httpClient.ts` | fetch wrapper + envelope + retry |
| Service | `src/lib/services/bpjs/*` | orkestrasi + persist + audit + idempotency |
| Route | `src/app/api/v1/bpjs/*` | BFF, RBAC gate |
| Audit | `BpjsAuditLog` (Prisma) | 1 baris/call, 5 thn |

> FE lama (`src/lib/bpjs/vClaim*.ts`, `authHeader.ts`, `lzStringHelper.ts`) = **di-swap** jadi
> pemanggil BFF; formula yang sudah benar (signature/timestamp) **dipindahkan** ke server, stub
> mock dibuang dari jalur nyata (tetap untuk `BPJS_MODE=mock`).
