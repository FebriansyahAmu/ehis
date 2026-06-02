# EHIS Backend — Domain: **Kunjungan** (Encounter / FHIR)

> **Entity akar.** Sumbu tunggal yang menghubungkan Patient · Antrean · Order · Invoice · Claim · SEP.
> Membangun ini = menyembuhkan 2 break spine (worklist & invoice) *by construction* (lihat memori `project_backend_spine_gaps`).
> Spec ini men-drive schema Prisma + DAL + Service + API + event. **Dibangun pertama setelah B0-minimal.**
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** (core rules · tech · best practices). Bila konflik, FLOWS menang. Doc ini hanya jelaskan *apa* domain Kunjungan lakukan.
> **Dokumen domain (per-workflow):** `BACKEND-ENCOUNTER` (ini) · `BACKEND-AUTH` · `BACKEND-PATIENT` · `BACKEND-ANTREAN` · `BACKEND-ORDER` · `BACKEND-BILLING` · `BACKEND-CLAIM` · `BACKEND-REALTIME` · `BACKEND-AUDIT` *(sibling, dibuat bertahap)*.
> **Terkait:** [CLAUDE.md](../CLAUDE.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md) · [FLOW-RJ-ONSITE.md](FLOW-RJ-ONSITE.md) · [API-ANTREAN.md](API-ANTREAN.md)
>
> **Stack:** PostgreSQL · Prisma · long-running Node · layered **Route→Service→DAL→Prisma** · SSE+Redis · Auth.js hybrid.
> **Status:** 📋 Spec. Schema ✅ (`Kunjungan` + schema `bpjs`). Service/DAL/API belum mulai.
>
> **Penamaan (2026-06-02):** model = **`Kunjungan`** (istilah bisnis), Postgres schema namespace tetap **`encounter`** (FHIR Encounter). Tabel `encounter.kunjungan`. "Encounter" & "Kunjungan" = konsep sama (1 baris = 1 episode kunjungan).

---

## 1. Scope domain

**Kunjungan OWNS:**
- Siklus hidup kunjungan (`Kunjungan.status`) lintas unit IGD/RJ/RI — sumber kebenaran worklist.
- Finalize/lock kunjungan (immutable `selesaiAt`) + re-open.
- Link ke Antrean (`kodebooking`) + emisi TaskID poli (T4/T5) lewat domain Antrean.
- Pembuatan Invoice draft (delegasi ke domain Billing) saat kunjungan `InService`.

**Kunjungan TIDAK owns** (hanya FK / delegasi):
- Identitas pasien & penjamin (no. BPJS) → **BACKEND-PATIENT** (`pendaftaran.PasienPenjamin`)
- Nomor antrean & TaskID engine → **BACKEND-ANTREAN**
- Order Lab/Rad/Resep/Tindakan → **BACKEND-ORDER**
- Invoice/charge/pembayaran → **BACKEND-BILLING**
- **SEP & Rujukan → schema `bpjs`** (`bpjs.SEP` · `bpjs.Rujukan`), submit V-Claim → **BACKEND-CLAIM** / BPJS
- Isi rekam klinis (asesmen/TTV/CPPT/diagnosa) → domain klinis per-tab (FK `kunjunganId`)

> **Prinsip:** Kunjungan = *spine state machine*, bukan kantong semua data. Record klinis & artefak BPJS menggantung via `kunjunganId`.

---

## 2. Entity model

> Tabel sumbu di Postgres schema **`encounter`** (`@@schema("encounter")`, tabel `kunjungan`). Artefak BPJS di schema **`bpjs`** — lihat FLOWS §9.
> **Implementasi (2026-06-02):** `prisma/schema/encounter.prisma` (model `Kunjungan`) + `prisma/schema/bpjs.prisma` (`SEP`/`Rujukan`), migration `rename_encounter_kunjungan_add_bpjs`. FK riil: `patientId → pendaftaran.Pasien` + `penjaminId → pendaftaran.PasienPenjamin` (lintas-schema). Enum `TipePenjamin` **reuse** dari `pendaftaran`. Tautan domain belum-ada (`dpjpId`/`antreanKodebooking`/`invoiceId`/`bedId`) = UUID placeholder, dijadikan FK saat modulnya siap. CHECK: triase 1..5 + recall ≥ 0.

### 2.1 `Kunjungan` (tabel inti, `encounter.kunjungan`)

| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK (`@default(uuid(7)) @db.Uuid`) | |
| `patientId` | FK→Pasien (`Restrict`) | **idx** |
| `unit` | enum `KunjunganUnit` | `IGD`\|`RawatJalan`\|`RawatInap` — **idx (unit,status)** |
| `status` | enum `KunjunganStatus` | lifecycle terpadu (§3) — **idx (unit,status,createdAt)** |
| `noKunjungan` | string unique | mirror `KunjunganRecord.noKunjungan` (`RJ/2026/xxxx`) |
| `noPendaftaran` | string | `REG-...` |
| `waktuKunjungan` | datetime (timestamptz) | tanggal + jam modal, digabung di Service |
| `antreanKodebooking` | FK→Antrean nullable unique | **idx** · link spine TaskID (RJ/onsite/MJKN) |
| `dpjpId` | FK→Practitioner nullable | DPJP/dokter — **idx** |
| `poli` | string nullable | RJ — poli tujuan |
| `kelas` | enum `KelasRawat` nullable | RI only (VIP/Kelas_1.. /ICU/HCU/Isolasi) |
| `bedId` | FK→Bed nullable | RI only (alokasi → Master Ruangan) |
| `triaseLevel` | int (1..5) nullable | IGD only (CHECK) |
| `caraDatang` | string nullable | IGD: Jalan Kaki/Ambulans/Kendaraan Pribadi |
| `asalMasuk` | string nullable | RI: Dari IGD/Dari Poli/Langsung |
| `callState` enum nullable · `recallCount` int | sub-state panggilan (`Idle`/`Dipanggil`) RJ/farmasi — **tak** mengubah `status` puncak |
| `caraMasuk` | string nullable | |
| `keluhan` | text nullable | keluhan masuk (opsional) |
| `diagnosaMasuk` · `kodeIcdMasuk` | string nullable | denormalisasi dari `bpjs.Rujukan` (tampilan cepat) |
| `penjaminTipe` | enum `TipePenjamin` | snapshot worklist (BPJS_*/Umum/Asuransi/Jamkesda) |
| `penjaminId` | FK→PasienPenjamin nullable (`SetNull`) | **idx** · penjamin dipakai; no. BPJS di penjamin (enc) |
| `invoiceId` | FK→Invoice nullable unique | 1:1, diisi saat `InService` |
| `lockedAt` | datetime nullable | finalize → record klinis append-only |
| `selesaiAt` | datetime nullable | **immutable** (di-set sekali, dipertahankan saat re-open) |
| `version` | int default 0 | **optimistic concurrency** |
| `createdAt`/`updatedAt`/`deletedAt` | datetime | soft-delete |

> **SEP/Rujukan tidak lagi inline** (dulu `noSEP`/`noRujukan` di Encounter) → pindah ke `bpjs.SEP`/`bpjs.Rujukan` (§2.3), diakses via relasi 1:1.

**Enum** (Prisma enum → Postgres native ENUM):
- `KunjunganUnit = IGD | RawatJalan | RawatInap`
- `KunjunganStatus` → §3
- `CallState`, `KelasRawat` (schema `encounter`); `TipePenjamin` re-use dari `pendaftaran`.

**JSONB columns:** tidak perlu di Kunjungan (semua field terstruktur). Sub-state unit kompleks (IGD triase detail) hidup di tabel klinis ber-`kunjunganId`. JSONB+GIN dipakai di domain klinis (SOAP/asesmen/payload BPJS), bukan di sumbu Kunjungan.

### 2.2 Relasi keluar

```
pendaftaran.Pasien          1───N Kunjungan
pendaftaran.PasienPenjamin  1───N Kunjungan   (penjaminId; no. BPJS di penjamin, enc)
Kunjungan 0..1───1 Antrean         (antreanKodebooking)
Kunjungan 1───0..1 Invoice         (invoiceId, dibuat saat InService)
Kunjungan 1───0..1 bpjs.Rujukan    (rujukan masuk / kontrol pasca ranap)
Kunjungan 1───0..1 bpjs.SEP        (SEP terbit utk kunjungan)
bpjs.SEP  *───0..1 bpjs.Rujukan    (SEP dibuat dari rujukan)
Kunjungan 1───N Order              (Order.kunjunganId)
Kunjungan 1───N ClinicalRecord*    (asesmen/ttv/cppt/diagnosa — *.kunjunganId)
Invoice   1───0..1 Claim
```

### 2.3 Artefak BPJS (schema `bpjs`)

> `prisma/schema/bpjs.prisma`. Acuan payload **V-Claim t_sep** (Trustmark). No. kartu peserta = sumber kebenaran di `pendaftaran.PasienPenjamin` (enc); field di sini = snapshot operasional dokumen klaim.

- **`bpjs.Rujukan`** (1:1 Kunjungan) — `sumber` (`RujukanMasuk`/`KontrolPascaRanap`/`RujukanIGD`), `asalRujukan` (Faskes1/Faskes2), `noRujukan` (no. FKTP **atau** No. SEP ranap terakhir utk kontrol), `tglRujukan`, `ppkRujukan`, `diagnosaKode`/`diagnosaNama` (ICD-10, **data inti**), `poliTujuan`, `noSepAsal`.
- **`bpjs.SEP`** (1:1 Kunjungan, opsional 1:1 Rujukan) — `status` (`Draft`/`Terbit`/`Batal`/`Gagal`), `noSep @unique` nullable (terisi saat terbit), `noKartu`, `tglSep`, `ppkPelayanan`, `jnsPelayanan` (RawatInap/RawatJalan), `klsRawatHak`, naik kelas, **tujuanKunj/flagProcedure/kdPenunjang/assesmentPel/poliEksekutif/dpjpLayan/poliTujuan/diagAwal** (RJ), jaminan laka+suplesi, cob/katarak, skdp, dll.

---

## 3. Lifecycle `KunjunganStatus` (state machine)

```
Registered ─▶ Queued ─▶ InService ─▶ Completed ─▶ Closed ─▶ Billed ─▶ Claimed
     │            │          │
     └── Cancelled ◀─────────┘   (sebelum Completed)
```

### Tabel transisi (guard + efek)

| Dari → Ke | Trigger (Service) | Guard | Efek lintas-domain |
|---|---|---|---|
| ∅ → `Registered` | `openKunjungan()` | patient ada; (BPJS→SEP valid) | — |
| `Registered` → `Queued` | check-in / admisi selesai | — | **Antrean T3** · **Invoice draft dibuat** |
| `Queued` → `InService` | `callPatient()` (RJ: Panggil) | sesi loket/poli aktif | **Antrean T4** · SSE board+display |
| `InService` → `Completed` | `completeKunjungan()` | **diagnosa ICD-10 terisi** | **Antrean T5** · set `selesaiAt` · `lockedAt` · (ada resep→Antrean `MenungguFarmasi`) |
| `Completed` → `InService` | `reopenKunjungan()` | belum `Billed` | unlock; `selesaiAt` **dipertahankan** |
| `Completed` → `Closed` | otomatis/akhir hari | — | trigger evaluasi Billing |
| `Closed` → `Billed` | Billing finalize (BACKEND-BILLING) | invoice final | — |
| `Billed` → `Claimed` | Claim submit (BACKEND-CLAIM) | BPJS + SEP | — |
| `*` → `Cancelled` | `cancelKunjungan()` | belum `Completed` | Antrean **T99** (bila dari antrol) |

### Pemetaan ke status lama (migrasi mock → DB)

| Mock lama | → `KunjunganStatus` | Catatan |
|---|---|---|
| `RJOrderStatus.Order_Masuk` | `Queued` | |
| `RJOrderStatus.Dipanggil` | `Queued` (sub: dipanggil) | panggilan = sub-state, bukan status puncak |
| `RJOrderStatus.Dilayani` | `InService` | |
| `RJOrderStatus.Selesai` | `Completed`/`Closed` | + `locked` |
| `RJOrderStatus.Dikembalikan_Admisi` | `Registered` (re-route) | |
| `KunjunganRecord.status="Aktif"` | `Registered`/`Queued` | derivasi per unit |
| IGD triase/board statuses | sub-state internal | `status` puncak tetap seragam |

> **Sub-state** (panggilan, recall, triase fase) disimpan di tabel pendamping atau kolom enum sekunder — **tidak** mengotori `status` puncak yang dipakai worklist lintas unit.

---

## 4. Layer breakdown

### 4.1 DAL — `lib/dal/kunjunganDal.ts`
Akses Prisma murni. **Tiap fungsi terima `tx?` opsional** (transaksi dimiliki Service). **Tiap read terima `actor` → `scopeBy(actor)`** inject filter unit/role (anti-IDOR di app-layer = primer). **Postgres RLS** dipasang sebagai jaring pengaman kedua (defense-in-depth) via `SET app.current_user`/policy per tabel sensitif.

Kontrak (signature desain):
- `create(data, tx?) → Kunjungan`
- `findById(id, actor) → Kunjungan | null` *(scoped)*
- `findByKodebooking(kodebooking, actor)`
- `listByUnitStatus({ unit, status[], cursor, limit }, actor) → { rows, nextCursor }` — **cursor pagination** (worklist besar)
- `updateStatus(id, { status, expectedVersion, patch }, tx?) → Kunjungan` — **version guard** (tolak stale → `CONFLICT`)
- `softDelete(id, tx?)`

**Larangan:** tak ada aturan bisnis, tak tahu HTTP.

### 4.2 Service — `lib/services/kunjunganService.ts`
Business + **batas transaksi** + **authz**. Tak `import prisma` langsung.

Operasi:
- `openKunjungan(input, actor)` — validasi unit-spesifik; bila Registered→Queued, **tx**: create kunjungan + (delegasi) create Invoice draft + emit Antrean T3.
- `callPatient(id, actor)` — `Queued→InService`; emit **T4** (via `antreanService.emitTask`); publish SSE.
- `completeKunjungan(id, actor)` — **guard diagnosa**; **tx**: status `Completed` + set `selesaiAt`/`lockedAt` + emit **T5** + route farmasi bila ada resep; SSE.
- `reopenKunjungan(id, actor)` — guard belum Billed; unlock; pertahankan `selesaiAt`.
- `cancelKunjungan(id, actor, alasan)` — guard belum Completed; emit **T99**.
- `getWorklist({ unit, status[], filter, cursor }, actor)` — baca via DAL scoped.

Authz: RBAC (role boleh aksi) sudah dicek di Route; Service tambah **unit-scope** (perawat ICU hanya RI/ICU) + **ownership** (DPJP hanya kunjungan-nya bila dibatasi).

### 4.2b Orkestrasi admisi (cross-domain)
Alur admisi melampaui 1 domain: **lengkapi Patient + buka Kunjungan + (Rujukan/SEP) + buat Invoice draft + emit T3** dalam **1 transaksi**. Ini **bukan** tugas `kunjunganService` (tak boleh tahu cara melengkapi Patient/terbit SEP). → diorkestrasi **use-case service** `registrationService` (FLOWS §2 — layer use-case) yang mengkomposisi `patientService` + `kunjunganService` + `bpjsService` + `billingService`. `kunjunganService.openKunjungan` tetap operasi domain murni (terima `patientId` valid + Patient `dataLengkap` sesuai kontrak §10). Spec penuh → **BACKEND-REGISTRATION** (nanti).

### 4.3 Validasi/DTO — `lib/schemas/kunjungan.ts` (Zod)
- `OpenKunjunganInput` (discriminated by `unit`: RJ butuh `poli`+`dokter`; RI butuh `kelas`; IGD butuh `triaseLevel?`).
- `CompleteKunjunganInput`, `CancelKunjunganInput`, `WorklistQuery` (unit, status[], cursor, limit≤50).
- Output **DTO** (buang field internal; `version` dikirim untuk optimistic UI).

### 4.4 API — `app/api/v1/kunjungan/*` (Route tipis)
| Method | Path | Service |
|---|---|---|
| `GET` | `/api/v1/kunjungan?unit=&status=&cursor=&limit=` | `getWorklist` |
| `GET` | `/api/v1/kunjungan/:id` | `findById` |
| `POST` | `/api/v1/kunjungan` | `openKunjungan` |
| `POST` | `/api/v1/kunjungan/:id/call` | `callPatient` (T4) |
| `POST` | `/api/v1/kunjungan/:id/complete` | `completeKunjungan` (T5) |
| `POST` | `/api/v1/kunjungan/:id/reopen` | `reopenKunjungan` |
| `POST` | `/api/v1/kunjungan/:id/cancel` | `cancelKunjungan` (T99) |

Tiap Route: `auth → rbac → zod.parse → service(...) → envelope`. Mutation wajib **Idempotency-Key** header.

---

## 5. Event

- **TaskID (antrol)** via `antreanService.emitTask(kodebooking, n)`: T3 (Queued), T4 (call), T5 (complete), T99 (cancel). Engine antrean jaga urutan/monoton/idempoten + outbox retry.
- **SSE** (BACKEND-REALTIME): publish ke Redis channel `board:{unit}` (worklist berubah) + `display:antrean` (panggilan). Payload ringkas (id, status, nomorAntrean) — bukan full record.
- **Audit** (BACKEND-AUDIT): server-side interceptor (bukan edge proxy) log otomatis create/updateStatus/cancel (who/when/before/after).

---

## 6. Indexing (PostgreSQL)

- `(unit, status, createdAt)` — query worklist (paling panas).
- `patientId` — timeline pasien.
- `penjaminId` — join penjamin.
- `antreanKodebooking` unique — join antrean.
- `noKunjungan` unique.
- Cursor pagination by `(createdAt, id)`.

---

## 7. Failure modes & konkurensi

| Skenario | Penanganan |
|---|---|
| 2 petugas Panggil pasien sama | `version` guard → 1 sukses, lain dapat `CONFLICT` (409) → UI refresh |
| SEP gagal saat open (BPJS) | kunjungan tetap dibuat, `bpjs.SEP.status=Gagal`/Draft → outbox retry; tak blokir admisi |
| Complete tanpa diagnosa | Service tolak `VALIDATION` (422) sebelum tx |
| Re-open setelah Billed | tolak `FORBIDDEN_STATE` |
| Invoice gagal dibuat saat open | **rollback** seluruh tx (kunjungan tak setengah jadi) |

---

## 8. Migrasi dari mock (swap pattern)

Sumber mock yang dikonsolidasi jadi tabel `Kunjungan`:
- `registrationStore.kunjungan` (KunjunganRecord) → seed Kunjungan (header).
- `rjQueueStore` (RJOrderStatus + locked + selesaiAt) → kolom `status`/`lockedAt`/`selesaiAt`.
- `igdPatients`/`rawatInapPatients`/`rjPatients` board statis → diganti `getWorklist()` query.
- Modal "Pendaftaran Kunjungan Baru" (DaftarKunjunganModal) → `openKunjungan` + (RJ BPJS) `bpjs.Rujukan` + `bpjs.SEP`.
- Frontend swap: `useRJQueue()`/`RJBoard(patients)` → fetch `/api/v1/kunjungan?unit=RawatJalan` (TanStack Query + SSE invalidate). **Break #1 & #2 sembuh di sini.**

---

## 9. Task checklist

### ENC0 — Schema & migration
- [x] Prisma model `Kunjungan` + enum `KunjunganUnit`/`KunjunganStatus`/`CallState`/`KelasRawat`. FK riil `patientId→pendaftaran.Pasien` + `penjaminId→pendaftaran.PasienPenjamin`; `dpjp/antrean/invoice/bed` = UUID placeholder. `TipePenjamin` reuse pendaftaran.
- [x] Schema `bpjs` (`SEP` + `Rujukan`) — 1:1 ke Kunjungan, SEP↔Rujukan opsional 1:1. Acuan payload V-Claim t_sep.
- [x] Index `(unit,status,createdAt)` + `patientId` + `penjaminId` + `dpjpId` + `(createdAt,id)` cursor + unique `noKunjungan`/`antreanKodebooking`/`invoiceId`. CHECK triase 1..5 + recall≥0.
- [x] Migration `rename_encounter_kunjungan_add_bpjs` applied (diff workaround), no drift.

### ENC1 — DAL
- [ ] `kunjunganDal` (create/findById/findByKodebooking/listByUnitStatus cursor/updateStatus version-guard/softDelete).
- [ ] `scopeBy(actor)` helper (unit/role filter) — uji anti-IDOR.

### ENC2 — Schemas & errors
- [ ] Zod input/output DTO (discriminated by unit) + `WorklistQuery`.
- [ ] Error codes domain: `KUNJUNGAN_NOT_FOUND`, `CONFLICT_VERSION`, `DIAGNOSA_REQUIRED`, `FORBIDDEN_STATE`.

### ENC3 — Service
- [ ] `openKunjungan` (tx: kunjungan + invoice draft + T3) · `callPatient` (T4) · `completeKunjungan` (guard diagnosa, tx, T5, route farmasi) · `reopen` · `cancel` (T99) · `getWorklist`.
- [ ] Hook ke `antreanService.emitTask` (boleh stub bila Antrean belum siap).
- [ ] Authz unit-scope + ownership.

### ENC4 — API
- [ ] 7 route `/api/v1/kunjungan/*` (tipis) + idempotency-key + envelope + handleError.

### ENC5 — Realtime
- [ ] Publish event ke Redis channel `board:{unit}` + `display:antrean` (lewat BACKEND-REALTIME).

### ENC6 — Seed & frontend swap
- [ ] Seed dari registrationStore/rjQueue mock.
- [ ] Swap `RJBoard`/`useRJQueue` → fetch API + SSE. Verifikasi pasien baru muncul di worklist (Break #1) + punya invoice (Break #2).

### ENC7 — Tests
- [ ] Unit Service (transisi + guard diagnosa + version conflict).
- [ ] Integration DAL (cursor pagination + scopeBy + RLS policy) di test DB Postgres (Testcontainers).

---

## 10. Keputusan (terkunci)

1. ✅ **Invoice draft dibuat saat `Registered→Queued`** (check-in/admisi) — charge selalu punya target invoice.
2. ✅ **Sub-state panggil/recall = kolom enum sekunder** (`callState` + `recallCount`) — ringan, tak mengotori `status` puncak. Tabel `KunjunganCall` hanya bila butuh histori panggilan (fase later).
3. ✅ **Bed RI = FK `bedId` di Kunjungan**; logic alokasi/status bed di Master Ruangan/Bed service (bukan domain Kunjungan).
4. ✅ **IGD walk-in**: `antreanKodebooking` null, langsung `InService` (skip Queued antrol); triase mengatur sub-state internal.
5. ✅ **(2026-06-02) Encounter → Kunjungan** (rename model; schema namespace `encounter` tetap). **SEP & Rujukan pindah ke schema `bpjs`** (tabel `bpjs.SEP`/`bpjs.Rujukan`, 1:1 ke Kunjungan) — `noSEP`/`noRujukan` inline dihapus. **Penjamin** dirujuk via FK `penjaminId → pendaftaran.PasienPenjamin` (no. BPJS disimpan di sana, enc).

> **Kontrak Patient↔Kunjungan (terkunci):** `openKunjungan` **mensyaratkan Patient `dataLengkap=true`** untuk **RJ/RI terjadwal**; **IGD & Mr.X** boleh atas pasien **draft** (`dataLengkap=false`) — dilengkapi kemudian di admisi.
