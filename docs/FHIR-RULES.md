# FHIR / SatuSehat — RULES (kontrak menulis panggilan ke SatuSehat)

> **Baca SEBELUM menulis/mengubah integrasi SatuSehat apa pun.** Aturan kanonik; menang bila konflik
> dengan kebiasaan lama FE mock. Roadmap eksekusi: [TODO-FHIR.md](../TODO-FHIR.md).
> Pola layering umum: [docs/BACKEND-FLOWS.md](BACKEND-FLOWS.md) · [docs/API-RULES.md](API-RULES.md).
> Kembar pola: [docs/BPJS-WS-RULES.md](BPJS-WS-RULES.md) (connector spine yang di-mirror di sini).
> **Status: DESAIN (belum ada kode).** Skema & signature di bawah = rancangan untuk direview, bukan implementasi.

---

## Arsitektur Layering (peta rung)

Connector SatuSehat = **rung transport**, sejajar **DAL Prisma** (bukan menggantikannya). DAL bicara ke DB
kita; connector bicara ke sistem eksternal (SatuSehat). **Service** = satu-satunya yang memegang keduanya.
**Identik** pola BPJS-WS ([docs/BPJS-WS-RULES.md](BPJS-WS-RULES.md)) — beda hanya isi transport (OAuth Bearer +
FHIR JSON, bukan HMAC + AES/LZ).

```
FE adapter            src/lib/api/fhir/*        ← thin fetch ke BFF (BUKAN ke SatuSehat)
   │ fetch /api/v1/fhir/...
   ▼
ROUTE (BFF)           src/app/api/v1/fhir/*     ← RBAC gate · parse Zod · Result→HTTP. TIPIS (route()).
   ▼
SERVICE (orkestrasi)  src/lib/services/fhir/*   ← OTAK: pilih mock/real · resolve id-mapping · build Bundle ·
   │   ├──────────────┐                            validasi lokal · audit · idempotency · OUTBOX · persist SyncLog
   ▼                  ▼
CONNECTOR           DAL (Prisma)                ← 2 peripheral yang dikoordinir Service:
src/lib/fhir/server/*  src/lib/dal/fhir/*           • connector = sistem EKSTERNAL (SatuSehat) ✅
(token→fetch→OperationOutcome)  fhir.ResourceMap/          • DAL = DB KITA (Postgres)
   ▼                            SyncLog/Outbox/FhirAuditLog
SatuSehat  OAuth2 /oauth2/v1 · FHIR /fhir-r4/v1 · KFA /kfa-v2 · Masterdata /masterdata/v1  (sandbox/prod)
```

| Rung | Boleh | TIDAK boleh |
|---|---|---|
| **Route** `app/api/v1/fhir/*` | RBAC, validasi input (Zod), map `Result`→HTTP (via `route()`) | tahu client_secret, panggil connector tanpa service |
| **Service** `services/fhir/*` | pilih **mock vs real** (`SATUSEHAT_MODE`), resolve `ResourceMap`, build Bundle, **audit** (DAL), **idempotency**, **outbox**, persist IHS id | bikin token/HTTP sendiri |
| **Connector** `fhir/server/*` | token, fetch, parse FHIR/OperationOutcome → `Result` | side-effect domain, sentuh DB, tahu `actor`/session |
| **DAL** `dal/fhir/*` | Prisma read/write `fhir.*` + `FhirAuditLog` | panggil SatuSehat / HTTP |

**Konsekuensi terpenting (R4) — panggilan eksternal KELUAR dari DB tx aksi klinis.** Aksi klinis (mis. simpan
Diagnosa) commit dulu; kiriman ke SatuSehat dicatat sebagai **outbox** lalu dikirim asinkron:

```
tx#1 : persist rekam medis (Diagnosa/Encounter/…) + fhir.SyncLog status=Pending    ← cepat, lepas lock
 ──  : outbox worker → connector.callSatuSehat(POST Bundle)                          ← di LUAR tx (lambat/gagal)
tx#2 : update SyncLog → Acked + simpan ResourceMap(ihsId)   (atau → Failed + OperationOutcome)  ← idempoten
```

Swap mock→real = ganti isi connector (`SATUSEHAT_MODE`) → **Route & FE tak berubah**.

---

## R1 — Secrets server-only (MUTLAK)

- `client_id`, `client_secret`, `Organization ID` RS, kunci RSA/AES KYC **hanya** di server (env/DB enc).
  **TIDAK PERNAH** di-bundle ke browser, `NEXT_PUBLIC_*`, atau di-import dari komponen `"use client"`.
- OAuth token exchange + KYC encrypt **hanya di server**. File connector pakai `import "server-only"`
  (pola [src/lib/bpjs/server/config.ts](../src/lib/bpjs/server/config.ts)).
- **Mengapa:** client_secret = identitas RS ke SatuSehat. Bocor = penyalahgunaan akun + sanksi PDP.

## R2 — Semua panggilan lewat connector server, FE lewat BFF

- Alur: **Browser → `/api/v1/fhir/*` (BFF kita) → connector → SatuSehat.** Tidak ada browser→SatuSehat
  (CORS menolak; lagipula melanggar R1).
- FE adapter (`src/lib/api/fhir/*`) = pemanggil BFF, bukan pemanggil SatuSehat.
- **Mengapa:** satu choke-point untuk token, audit, rate-limit, error.

## R3 — Layered: Route → Service → Connector

- **Route** (`app/api/v1/fhir/...`): pakai helper `route()` ([src/lib/http/route.ts](../src/lib/http/route.ts)) —
  RBAC gate + parse input + map `Result`→HTTP. Tipis, tanpa try/catch.
- **Service** (`lib/services/fhir/*`): orkestrasi + **side-effect domain** (persist IHS id, SyncLog).
  Audit. Idempotency. Outbox.
- **Connector** (`fhir/server/*`): transport murni (token→fetch→parse→`Result`). Tanpa domain.
- **Mengapa:** sama seluruh app; mudah diuji + di-mock per lapis.

## R4 — Panggilan eksternal TIDAK di dalam DB transaction → outbox/kompensasi

- HTTP ke SatuSehat bisa lambat/timeout; jangan kunci row DB selama itu.
- Pola: (a) catat intent `fhir.SyncLog` status `Pending` → (b) kirim Bundle di luar tx → (c) tx kedua tulis
  hasil (`ResourceMap.ihsId`, status `Acked`/`Failed` + OperationOutcome). Retry = aksi server idempoten.
- **Mengapa:** cegah lock contention + state setengah jadi saat SatuSehat down.

## R5 — Token OAuth2: SATU manager, cache + auto-refresh

- `POST {base}/oauth2/v1/accesstoken?grant_type=client_credentials` — `client_id`+`client_secret` di **body**
  `application/x-www-form-urlencoded`. Respons `access_token` (BearerToken), `expires_in≈3599` (~1 jam).
- **Cache token** (in-memory/Redis) + refresh **sebelum** kedaluwarsa (mis. TTL−60s). Satu helper
  `getSatuSehatToken()`; **jangan** minta token per-request.
- **Mengapa (R11):** rate-limit token **1 req/menit per client_id** setelah gagal → minta-per-request = kena 429.

## R6 — Auth header & content

- Setiap request FHIR/KFA/Masterdata: `Authorization: Bearer <access_token>` + `Content-Type: application/json`.
- Datetime **ISO-8601 dengan offset** (`2026-08-19T10:30:00+07:00`). NIK **16 digit** tervalidasi.

## R7 — Response: FHIR resource / Bundle / OperationOutcome → Result

- Sukses: `201 Created` (POST create, resource + `id`) · `200` (GET by id = resource; search = **Bundle**
  `type=searchset`) · `200`/`201` (PUT).
- Error: **`OperationOutcome`** (4xx/5xx) → map ke `Result<T, FhirError>` (`Ok`/`Err`, pola
  [src/lib/bpjs/server/httpClient.ts](../src/lib/bpjs/server/httpClient.ts)). Simpan `issue[].diagnostics`.
- **Jangan lempar** untuk error bisnis (validasi kode/format) — itu jalur normal (Err), bukan exception.
- **Beda dari BPJS:** TIDAK ada envelope `metaData` + TIDAK ada AES/LZ decode. FHIR = JSON polos over HTTPS.

## R8 — Idempotency WRITE: resolve-first + ResourceMap (anti duplikat)

- **JANGAN create membuta.** Untuk Organization/Location/Practitioner/Patient: **search dulu** (by
  `identifier`), simpan `fhir.ResourceMap(env, localType, localId ↔ ihsId)`.
- **ResourceMap per `env`** (mock|sandbox|prod — ditetapkan FH1 2026-10-26): IHS id sandbox tak berlaku di prod
  dan id mock palsu → selalu baca/tulis dengan env aktif. Kolom denormalisasi di tabel domain
  (`Pasien.idSatusehat`, `Dokter.ihsPractitionerId`) **hanya diisi id produksi**. Kunjungan/klinis: cek ResourceMap
  sebelum POST; sudah ada → **PUT by id** (upsert), belum → POST create lalu simpan `ihsId`.
- **Encounter juga resolve-first (2026-11-21, FG-32):** belum ada di ResourceMap → `GET Encounter?identifier=
  http://sys-ids.kemkes.go.id/encounter/{orgId}|{noKunjungan}` dulu (didukung Sandbox); ketemu → petakan lalu PUT.
  Cari gagal → batalkan POST. Respons Bundle: `location` SatuSehat = URL **absolut** → baca via
  `parseEntryResponse` (fhirShared), jangan `split("/")`.
- Header `Idempotency-Key` (sudah didukung `route()`) untuk aksi kirim.
- **Mengapa:** double-create Encounter/Condition = data ganda di SatuSehat + audit kacau.

## R9 — Audit setiap panggilan (DB, 5 tahun)

- Tulis 1 baris `fhir.FhirAuditLog` per call: mode, endpoint (path placeholder TANPA PII), method,
  requestHash, responseStatus, success, durationMs, resourceType, ihsId, actor, actorRole, idempotencyKey,
  errorType, retryCount. Mirror [BpjsAuditLog](../prisma/schema/bpjs.prisma).
- **PII**: simpan `nikHash`/`ihsNumberHash` (hash), **bukan** plaintext. NIK at-rest via
  [pii.ts](../src/lib/crypto/pii.ts); DTO masked.
- **Mengapa:** kepatuhan UU PDP 27/2022 + telusur sengketa data.

## R10 — Retry & circuit breaker

- Retry **hanya** `NetworkError`/timeout/`5xx` (backoff terbatas ≤2×). `OperationOutcome` validasi (4xx) =
  **tidak** retry (perbaiki payload).
- Circuit breaker per host: buka saat gagal beruntun → fail-fast, lindungi outbox worker.

## R11 — Rate limit

- Token: **1/menit per client_id** (R5). FHIR call: hormati kuota SatuSehat; counter + backoff.

## R12 — Terminologi: validasi LOKAL, bukan lookup live (TAK ADA terminology server)

- **SatuSehat TIDAK menyediakan terminology server yang bisa di-query** (`$lookup`/`$validate-code`/
  `$translate` **TIDAK ADA**). Validasi kode terjadi **implisit server-side saat POST** (kode salah →
  `OperationOutcome`).
- Karena itu: **bangun validator lokal** (ICD-10/ICD-9-CM/LOINC/SNOMED/KFA) di build-payload; kode diambil
  dari **master lokal** (`master.Icd`, `master.Obat.kfa`, `master.LabTest` LOINC), **bukan** hit SatuSehat
  per-request. KFA & Wilayah **di-sync** (R sync master), bukan lookup live.
- Sistem kode kanonik (R17): pakai persis system URL SatuSehat.
- **Mengapa:** latensi/kuota + offline-safe; sama alasan [[project_wilayah_strategy]].

## R13 — Mode & environment

- `SATUSEHAT_MODE=mock|sandbox|prod`. `mock` = parity dev/CI (shape sama, tanpa jaringan; connector menolak
  jalan → adapter mock di service, pola `callBpjs` menolak `mode=mock`).
- **Sandbox dulu** (`api-satusehat-stg.dto.kemkes.go.id`). **Write ke prod DILARANG** sebelum sandbox hijau.
- Base host & path: [TODO-FHIR.md §0](../TODO-FHIR.md). Config `import "server-only"` + Zod + `blankToUndef`
  (pola [config.ts](../src/lib/bpjs/server/config.ts)).

## R14 — Jangan log payload sensitif

- Jangan `console.log` request/response FHIR mentah berisi PII (nama/NIK/alamat/klinis). Audit pakai **hash**.
- **Satu-satunya tempat isi request/response disimpan = log pengiriman** (`fhir.fhir_audit_payload`, 2026-11-21),
  ditulis otomatis oleh `auditedFhirCall` — JANGAN menyimpan payload di tempat lain (sync_log, console, file). Syarat
  yang dijaga di sana: NIK/KK/paspor dimasker **sebelum** disimpan (juga di URL pencarian ter-encode) · body
  dienkripsi AES-256-GCM (`encryptPii`) · target `oauth` tak pernah dicatat isinya · dipangkas setelah
  `SATUSEHAT_LOG_BODY_DAYS` (default 90; 0 = mati) sementara baris audit tetap 5 thn · dibaca hanya via
  `GET /fhir/log/:id` (RBAC `fhir.sync:read` + dicatat di log akses rekam medis).
- Service baru yang memanggil `fhirRequest` WAJIB menyertakan tautan data (`localType`/`localId`, klinis +
  `kunjunganId`; Bundle + `localRefs` berurutan) agar riwayatnya muncul di tab **Log pengiriman** konsol.

## R15 — Resolve-first onboarding (Practitioner GET-only · Patient GET lalu POST bila tak ada)

- **Patient**: resolve IHS via `GET /Patient?identifier=https://fhir.kemkes.go.id/id/nik|<nik>` → Bundle;
  IHS = `Patient.id` + identifier `.../id/ihs-number`. Simpan ke `pendaftaran.Pasien.idSatusehat` **dan**
  `ResourceMap`. **RS tidak "membuat" master pasien membuta** — resolve dulu.
- **Patient belum terdaftar** (Playbook MPI "Pasien dengan NIK", langkah 2): bila GET by NIK kosong, RS **wajib**
  `POST /Patient` — elemen wajib identifier NIK · name · birthDate · gender · address + extension
  `administrativeCode` (kode Kemendagri datar: provinsi 2 · kota 4 · kecamatan 6 · kelurahan 10 digit); opsional
  tempat lahir · No. KK · telecom. SatuSehat mencocokkan dengan KTP di Dukcapil (nama TANPA gelar, alamat KTP).
  Implementasi `registerPatient` **selalu GET dulu di request yang sama** (sudah ada → petakan tanpa POST; 409 →
  GET ulang), cek kelengkapan sebelum memanggil, dan **dipicu operator** (`fhir.sync:create`) — worker
  Encounter tetap GET-only (tak membuat data MPI tanpa pemeriksaan). Bayi baru lahir (`nik-ibu`) belum (FG-20).
- **Practitioner**: **GET-only** (RS tak create nakes) — resolve by NIK nakes, simpan IHS.
- **Organization/Location**: search dulu (by name/identifier), create/PUT bila belum ada, simpan IHS.

## R16 — Bundle transaction: satu Bundle per Service Module, urut-referensi

- Kirim **`Bundle type=transaction`** per unit sesuai komposisi resmi ([TODO-FHIR.md §1e](../TODO-FHIR.md)):
  Rawat Jalan (`AMB`) · IGD (`EMER`, +triase) · Rawat Inap (`IMP`) · Kefarmasian (2-fase).
- Referensi antar-entry pakai `fullUrl: urn:uuid:<x>` + `request.method/url`. Urutan mengikuti alur klinis
  (Patient → Encounter → anamnesis → pemeriksaan → penalaran → rencana → penunjang → tindakan → obat → Composition).
- **Mengapa:** atomik per kunjungan + referensi valid dalam satu transaksi.

## R17 — Sistem kode kanonik (dipakai saat build payload)

| Guna | system URL |
|---|---|
| NIK | `https://fhir.kemkes.go.id/id/nik` |
| NIK ibu (bayi) | `https://fhir.kemkes.go.id/id/nik-ibu` |
| IHS-number | `https://fhir.kemkes.go.id/id/ihs-number` |
| ICD-10 (Condition) | `http://hl7.org/fhir/sid/icd-10` |
| ICD-9-CM (Procedure) | `http://hl7.org/fhir/sid/icd-9-cm` |
| LOINC (Observation/Report) | `http://loinc.org` |
| SNOMED-CT | `http://snomed.info/sct` |
| KFA (Medication) | `http://sys-ids.kemkes.go.id/kfa` |
| Encounter class | `http://terminology.hl7.org/CodeSystem/v3-ActCode` (`AMB`/`EMER`/`IMP`) |

---

## Peta file (target — connector server BARU)

| Lapis | File | Isi |
|---|---|---|
| Config | `src/lib/fhir/server/config.ts` | env loader + Zod, `server-only`, `SATUSEHAT_MODE` |
| Token | `src/lib/fhir/server/token.ts` | OAuth2 client_credentials + cache + auto-refresh (R5) |
| Transport | `src/lib/fhir/server/httpClient.ts` | `callSatuSehat` fetch wrapper + OperationOutcome + retry |
| Bundle | `src/lib/fhir/server/bundle.ts` | builder `Bundle type=transaction` (urn:uuid refs) |
| Shared | `src/lib/fhir/fhirShared.ts` | `Result`/`Ok`/`Err`/`FhirError`/tipe resource ringkas |
| Adapter | `src/lib/fhir/adapters/*` | `toFhirPatient/Encounter/Condition/...` dari domain lokal |
| Service | `src/lib/services/fhir/*` | orkestrasi + resolve ResourceMap + persist + audit + outbox |
| Route | `src/app/api/v1/fhir/*` | BFF, RBAC gate (`route()`) |
| DAL | `src/lib/dal/fhir/*` | Prisma `fhir.*` |
| Schema | `prisma/schema/fhir.prisma` | ResourceMap · SyncLog/Outbox · Consent · FhirAuditLog |

---

## Skema `fhir` (RANCANGAN — belum migrasi)

```prisma
// Peta resource lokal ↔ IHS id SatuSehat. Resolve-first, anti create ganda (R8/R15).
model ResourceMap {
  id          String   @id @default(uuid(7)) @db.Uuid
  localType   String   @map("local_type")   // Patient|Encounter|Condition|Procedure|Observation|...
  localId     String   @map("local_id")     // PK domain lokal (kunjunganId/diagnosaId/...)
  resourceType String  @map("resource_type")// FHIR resourceType
  ihsId       String   @map("ihs_id")        // logical id SatuSehat
  versionId   String?  @map("version_id")    // meta.versionId terakhir
  hash        String?                        // hash payload terkirim (deteksi perubahan → PUT)
  lastSyncAt  DateTime @map("last_sync_at") @db.Timestamptz(3)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  @@unique([localType, localId])
  @@index([resourceType, ihsId])
  @@map("resource_map")
  @@schema("fhir")
}

// Outbox/antrean kiriman. Aksi klinis commit → SyncLog Pending → worker kirim → Acked/Failed (R4).
model SyncLog {
  id          String   @id @default(uuid(7)) @db.Uuid
  trigger     String                          // encounter.complete | diagnosa.create | ...
  kunjunganId String?  @map("kunjungan_id") @db.Uuid
  bundleType  String   @map("bundle_type")    // transaction | single
  payload     Json                            // Bundle/resource (JSONB)
  status      SyncStatus @default(Pending)
  attempts    Int      @default(0)
  lastError   Json?    @map("last_error")      // OperationOutcome
  ihsRefs     Json?    @map("ihs_refs")        // hasil: {resourceType: ihsId}
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  @@index([status, createdAt])
  @@index([kunjunganId])
  @@map("sync_log")
  @@schema("fhir")
}
enum SyncStatus { Pending Sending Acked Failed Skipped @@schema("fhir") }

// General consent (berbagi data) — FHIR Consent. ≠ medicalrecord.InformedConsent (persetujuan tindakan).
model Consent {
  id          String   @id @default(uuid(7)) @db.Uuid
  patientId   String   @map("patient_id") @db.Uuid
  ihsConsentId String? @map("ihs_consent_id")
  status      String                          // active | inactive | rejected
  scope       String?                         // patient-privacy
  provisionType String? @map("provision_type")// permit | deny
  raw         Json?                            // FHIR Consent snapshot
  recordedAt  DateTime @map("recorded_at") @db.Timestamptz(3)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  @@index([patientId])
  @@map("consent")
  @@schema("fhir")
}

// Audit tiap call (5 thn). Mirror bpjs.BpjsAuditLog; PII di-hash (R9/R14).
model FhirAuditLog {
  id            String   @id @default(uuid(7)) @db.Uuid
  startedAt     DateTime @map("started_at") @db.Timestamptz(3)
  mode          String                         // mock | sandbox | prod
  target        String                         // fhir | kfa | masterdata | oauth | kyc
  endpoint      String                         // path placeholder TANPA PII
  method        String
  resourceType  String?  @map("resource_type")
  ihsId         String?  @map("ihs_id")
  requestHash   String?  @map("request_hash")
  responseStatus String  @map("response_status")
  success       Boolean
  durationMs    Int      @map("duration_ms")
  errorType     String?  @map("error_type")
  retryCount    Int      @default(0) @map("retry_count")
  nikHash       String?  @map("nik_hash")
  actor         String
  actorRole     String   @map("actor_role")
  idempotencyKey String? @map("idempotency_key")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  @@index([startedAt])
  @@index([target, endpoint])
  @@map("fhir_audit_log")
  @@schema("fhir")
}
```

RBAC baru (seed): resource **`fhir.sync`** (r/c/u/d) untuk konsol `/ehis-fhir` (Admin/operator interop);
konsumsi otomatis (hook aksi klinis → SyncLog) tak butuh grant tambahan (jalan sbagai side-effect server).

---

## Kontrak connector (RANCANGAN)

```ts
// src/lib/fhir/server/token.ts — SATU manager token (R5/R11)
export async function getSatuSehatToken(): Promise<string>;   // cache + auto-refresh; throw FhirConfigError bila mode!=mock & kredensial kurang

// src/lib/fhir/server/httpClient.ts — SATU choke-point transport (R7/R10)
export interface FhirCallOptions {
  target?: "fhir" | "kfa" | "masterdata" | "kyc";   // default "fhir"
  method?: "GET" | "POST" | "PUT" | "PATCH";        // default "GET"
  path: string;                                     // relatif base, mis. "Patient?identifier=..|.."
  body?: unknown;                                    // resource / Bundle
  allowInMock?: boolean;                             // uji read-only walau mode mock (pola BPJS)
  timeoutMs?: number; retries?: number;
}
export async function callSatuSehat<T = unknown>(o: FhirCallOptions): Promise<Result<T, FhirError>>;
// menolak saat SATUSEHAT_MODE=mock (kecuali allowInMock) → adapter mock dipakai di service.

// src/lib/services/fhir/*.ts — seam mock/real
//   isFhirMockMode() ? mockAdapter.x() : callSatuSehat({...})
```

`Result`/`Ok`/`Err`/`FhirError` di `fhirShared.ts` (pola `bpjsShared`). `FhirError` =
`{ type: "NetworkError"|"OperationOutcome"|"ConfigError", status?, issues?, retryable }`.

---

## Sequence flows

**1) Token (R5/R11)**
```
service butuh token → getSatuSehatToken()
  cache hit & belum <60s exp → return cached
  else → POST /oauth2/v1/accesstoken (form) → simpan {token, exp} → return
```

**2) Resolve IHS Patient (R15)**
```
registrasi/aksi → resolvePatientIhs(nik)
  ResourceMap/Pasien.idSatusehat ada → pakai
  else → GET /Patient?identifier=<nik-system>|<nik>
    Bundle.total>0 → simpan idSatusehat + ResourceMap → return ihsId
    total=0 → PatientNotFound (belum terdaftar SatuSehat / NIK salah)
      operator "Daftarkan" (registerPatient) → cek elemen wajib → GET ulang → masih kosong → POST /Patient
        2xx → simpan id (Pasien.idSatusehat hanya prod) + ResourceMap
        4xx → OperationOutcome per elemen (mis. tak cocok Dukcapil) → peta tidak berubah
```

**3) Encounter bundle (R4/R16)**
```
transisi kunjungan (mis. complete) commit  ──tx#1──> + SyncLog(Pending, payload=Bundle)
outbox worker → build Bundle (urn:uuid) → callSatuSehat(POST / , transaction)
  Ok → tx#2: SyncLog=Acked + ResourceMap per entry (ihsId)
  Err(OperationOutcome) → tx#2: SyncLog=Failed + simpan issue  (retry = aksi server)
```

---

## Adapter mapping (domain lokal → FHIR) — ringkas

> Contoh payload JSON per resource (Patient/Encounter/Condition/Procedure/Observation/Medication chain/
> ServiceRequest/DiagnosticReport/Composition + Bundle transaction) = **[docs/FHIR-PAYLOADS.md](FHIR-PAYLOADS.md)**
> (dirakit dari contoh resmi kemkes `/fhir/resources/*`).


| FHIR | Sumber lokal | Kode/terminologi |
|---|---|---|
| Patient | `pendaftaran.Pasien` (+idSatusehat) | identifier NIK |
| Practitioner | `master.Pegawai`/`Dokter` | identifier NIK (GET-only) |
| Organization/Location | `master.Location` | — |
| Encounter | `encounter.Kunjungan` | class AMB/EMER/IMP |
| Condition | `medicalrecord.Diagnosa` | ICD-10 |
| Procedure | `TindakanMedis`/`DiagnosaProsedur` | ICD-9-CM |
| Observation | `Observation` (TTV)/`LabResultValue` | LOINC |
| AllergyIntolerance | `AsesmenAlergi` | SNOMED |
| Medication(+Request/Dispense) | `master.Obat`(KFA) · `ResepOrder`/`ResepItem` · `ResepDispensing` | KFA |
| ServiceRequest/Specimen/DiagnosticReport | `LabOrder`/`RadOrder`/`LabResult`/`RadResult` | LOINC/SNOMED/DICOM |
| Composition | `ResumeMedik`/`Cppt`/`Anamnesis` | — |

---

## Definition of Done (per endpoint/adapter)

1. Layered: FE `api/fhir/*` → `route()` (RBAC) → service → connector/DAL. Tak ada shortcut.
2. `SATUSEHAT_MODE=mock` jalan tanpa jaringan (adapter mock, shape sama). `sandbox` terbukti hijau sebelum prod.
3. Idempoten: resolve-first + ResourceMap; retry aman; tak pernah create ganda (R8/R15).
4. Panggilan eksternal di luar DB tx (outbox) (R4). Audit 1 baris/call, PII di-hash (R9/R14).
5. Kode divalidasi lokal (R12) + system URL kanonik (R17). Datetime ISO-8601 +07:00.
6. `tsc --noEmit` bersih + eslint file tersentuh. Tak ada secret ke client (R1).
