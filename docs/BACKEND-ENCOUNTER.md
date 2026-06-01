# EHIS Backend — Domain: **Encounter** (Kunjungan)

> **Entity akar.** Sumbu tunggal yang menghubungkan Patient · Antrean · Order · Invoice · Claim · SEP.
> Membangun ini = menyembuhkan 2 break spine (worklist & invoice) *by construction* (lihat memori `project_backend_spine_gaps`).
> Spec ini men-drive schema Prisma + DAL + Service + API + event. **Dibangun pertama setelah B0-minimal.**
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** (core rules · tech · best practices). Bila konflik, FLOWS menang. Doc ini hanya jelaskan *apa* domain Encounter lakukan.
> **Dokumen domain (per-workflow):** `BACKEND-ENCOUNTER` (ini) · `BACKEND-AUTH` · `BACKEND-PATIENT` · `BACKEND-ANTREAN` · `BACKEND-ORDER` · `BACKEND-BILLING` · `BACKEND-CLAIM` · `BACKEND-REALTIME` · `BACKEND-AUDIT` *(sibling, dibuat bertahap)*.
> **Terkait:** [CLAUDE.md](../CLAUDE.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md) · [FLOW-RJ-ONSITE.md](FLOW-RJ-ONSITE.md) · [API-ANTREAN.md](API-ANTREAN.md)
>
> **Stack:** PostgreSQL · Prisma · long-running Node · layered **Route→Service→DAL→Prisma** · SSE+Redis · Auth.js hybrid.
> **Status:** 📋 Spec. Implementasi belum mulai.

---

## 1. Scope domain

**Encounter OWNS:**
- Siklus hidup kunjungan (`Encounter.status`) lintas unit IGD/RJ/RI — sumber kebenaran worklist.
- Finalize/lock encounter (immutable `selesaiAt`) + re-open.
- Link ke Antrean (`kodebooking`) + emisi TaskID poli (T4/T5) lewat domain Antrean.
- Pembuatan Invoice draft (delegasi ke domain Billing) saat encounter `InService`.

**Encounter TIDAK owns** (hanya FK / delegasi):
- Identitas pasien → **BACKEND-PATIENT**
- Nomor antrean & TaskID engine → **BACKEND-ANTREAN**
- Order Lab/Rad/Resep/Tindakan → **BACKEND-ORDER**
- Invoice/charge/pembayaran → **BACKEND-BILLING**
- SEP & V-Claim → **BACKEND-CLAIM** / BPJS
- Isi rekam klinis (asesmen/TTV/CPPT/diagnosa) → domain klinis per-tab (FK `encounterId`)

> **Prinsip:** Encounter = *spine state machine*, bukan kantong semua data. Record klinis menggantung via `encounterId`.

---

## 2. Entity model

> Semua tabel domain ini di Postgres schema **`encounter`** (`@@schema("encounter")`) — lihat FLOWS §9. FK ke `patient.Patient`/`auth.Practitioner`/`billing.Invoice` lintas-schema (1 DB).

### 2.1 `Encounter` (tabel inti)

| Field | Tipe | Catatan / index |
|---|---|---|
| `id` | UUID v7 PK (`@default(uuid(7)) @db.Uuid`) | |
| `patientId` | FK→Patient | **idx** |
| `unit` | enum `EncounterUnit` | `IGD`\|`RawatJalan`\|`RawatInap` — **idx (unit,status)** |
| `status` | enum `EncounterStatus` | lifecycle terpadu (§3) — **idx (unit,status,createdAt)** |
| `noKunjungan` | string unique | mirror `KunjunganRecord.noKunjungan` (`RJ/2026/xxxx`) |
| `noPendaftaran` | string | `REG-...` |
| `antreanKodebooking` | FK→Antrean nullable | **idx** · link spine TaskID (RJ/onsite/MJKN) |
| `dpjpId` | FK→Practitioner nullable | DPJP/dokter |
| `poli` | string nullable | RJ only |
| `kelas` | enum `KelasRawat` nullable | RI only (VIP/Kelas_1.. /ICU/HCU/Isolasi) |
| `bedId` | FK→Bed nullable | RI only (delegasi alokasi → BACKEND-PATIENT/Master Ruangan) |
| `triaseLevel` | int (1..5) nullable | IGD only |
| `callState` enum nullable · `recallCount` int | sub-state panggilan (`Idle`/`Dipanggil`) RJ/farmasi — **tak** mengubah `status` puncak |
| `caraMasuk` | string nullable | |
| `keluhan` | text nullable | keluhan masuk |
| `penjaminTipe` | enum `TipePenjamin` | BPJS_*/Umum/Asuransi/Jamkesda |
| `noPenjamin` | string nullable | no kartu |
| `noSEP` | string nullable | diisi domain Claim |
| `noRujukan` | string nullable | |
| `invoiceId` | FK→Invoice nullable unique | 1:1, diisi saat `InService` |
| `lockedAt` | datetime nullable | finalize → record klinis append-only |
| `selesaiAt` | datetime nullable | **immutable** (di-set sekali, dipertahankan saat re-open) |
| `version` | int default 0 | **optimistic concurrency** |
| `createdAt`/`updatedAt`/`deletedAt` | datetime | soft-delete |

**Enum** (Prisma enum → Postgres native ENUM):
- `EncounterUnit = IGD | RawatJalan | RawatInap`
- `EncounterStatus` → §3
- `KelasRawat`, `TipePenjamin` → re-use dari domain Patient/Master.

**JSONB columns:** tidak perlu di Encounter (semua field terstruktur). Sub-state unit kompleks (IGD triase detail) hidup di tabel klinis ber-`encounterId`. JSONB+GIN dipakai di domain klinis (SOAP/asesmen/payload BPJS), bukan di sumbu Encounter.

### 2.2 Relasi keluar

```
Patient 1───N Encounter
Encounter 0..1───1 Antrean        (antreanKodebooking)
Encounter 1───0..1 Invoice        (invoiceId, dibuat saat InService)
Encounter 1───N Order             (Order.encounterId)
Encounter 1───N ClinicalRecord*   (asesmen/ttv/cppt/diagnosa — *.encounterId)
Invoice   1───0..1 Claim
```

---

## 3. Lifecycle `EncounterStatus` (state machine)

```
Registered ─▶ Queued ─▶ InService ─▶ Completed ─▶ Closed ─▶ Billed ─▶ Claimed
     │            │          │
     └── Cancelled ◀─────────┘   (sebelum Completed)
```

### Tabel transisi (guard + efek)

| Dari → Ke | Trigger (Service) | Guard | Efek lintas-domain |
|---|---|---|---|
| ∅ → `Registered` | `openEncounter()` | patient ada; (BPJS→SEP valid) | — |
| `Registered` → `Queued` | check-in / admisi selesai | — | **Antrean T3** · **Invoice draft dibuat** |
| `Queued` → `InService` | `callPatient()` (RJ: Panggil) | sesi loket/poli aktif | **Antrean T4** · SSE board+display |
| `InService` → `Completed` | `completeEncounter()` | **diagnosa ICD-10 terisi** | **Antrean T5** · set `selesaiAt` · `lockedAt` · (ada resep→Antrean `MenungguFarmasi`) |
| `Completed` → `InService` | `reopenEncounter()` | belum `Billed` | unlock; `selesaiAt` **dipertahankan** |
| `Completed` → `Closed` | otomatis/akhir hari | — | trigger evaluasi Billing |
| `Closed` → `Billed` | Billing finalize (BACKEND-BILLING) | invoice final | — |
| `Billed` → `Claimed` | Claim submit (BACKEND-CLAIM) | BPJS + SEP | — |
| `*` → `Cancelled` | `cancelEncounter()` | belum `Completed` | Antrean **T99** (bila dari antrol) |

### Pemetaan ke status lama (migrasi mock → DB)

| Mock lama | → `EncounterStatus` | Catatan |
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

### 4.1 DAL — `lib/dal/encounterDal.ts`
Akses Prisma murni. **Tiap fungsi terima `tx?` opsional** (transaksi dimiliki Service). **Tiap read terima `actor` → `scopeBy(actor)`** inject filter unit/role (anti-IDOR di app-layer = primer). **Postgres RLS** dipasang sebagai jaring pengaman kedua (defense-in-depth) via `SET app.current_user`/policy per tabel sensitif.

Kontrak (signature desain):
- `create(data, tx?) → Encounter`
- `findById(id, actor) → Encounter | null` *(scoped)*
- `findByKodebooking(kodebooking, actor)`
- `listByUnitStatus({ unit, status[], cursor, limit }, actor) → { rows, nextCursor }` — **cursor pagination** (worklist besar)
- `updateStatus(id, { status, expectedVersion, patch }, tx?) → Encounter` — **version guard** (tolak stale → `CONFLICT`)
- `softDelete(id, tx?)`

**Larangan:** tak ada aturan bisnis, tak tahu HTTP.

### 4.2 Service — `lib/services/encounterService.ts`
Business + **batas transaksi** + **authz**. Tak `import prisma` langsung.

Operasi:
- `openEncounter(input, actor)` — validasi unit-spesifik; bila Registered→Queued, **tx**: create encounter + (delegasi) create Invoice draft + emit Antrean T3.
- `callPatient(id, actor)` — `Queued→InService`; emit **T4** (via `antreanService.emitTask`); publish SSE.
- `completeEncounter(id, actor)` — **guard diagnosa**; **tx**: status `Completed` + set `selesaiAt`/`lockedAt` + emit **T5** + route farmasi bila ada resep; SSE.
- `reopenEncounter(id, actor)` — guard belum Billed; unlock; pertahankan `selesaiAt`.
- `cancelEncounter(id, actor, alasan)` — guard belum Completed; emit **T99**.
- `getWorklist({ unit, status[], filter, cursor }, actor)` — baca via DAL scoped.

Authz: RBAC (role boleh aksi) sudah dicek di Route; Service tambah **unit-scope** (perawat ICU hanya RI/ICU) + **ownership** (DPJP hanya encounter-nya bila dibatasi).

### 4.2b Orkestrasi admisi (cross-domain)
Alur admisi melampaui 1 domain: **lengkapi Patient + buka Encounter + buat Invoice draft + (SEP) + emit T3** dalam **1 transaksi**. Ini **bukan** tugas `encounterService` (tak boleh tahu cara melengkapi Patient). → diorkestrasi **use-case service** `registrationService` (FLOWS §2 — layer use-case) yang mengkomposisi `patientService` + `encounterService` + `billingService` + `claimService`. `encounterService.openEncounter` tetap operasi domain murni (terima `patientId` valid + Patient `dataLengkap` sesuai kontrak §10). Spec penuh → **BACKEND-REGISTRATION** (nanti).

### 4.3 Validasi/DTO — `lib/schemas/encounter.ts` (Zod)
- `OpenEncounterInput` (discriminated by `unit`: RJ butuh `poli`+`dokter`; RI butuh `kelas`; IGD butuh `triaseLevel?`).
- `CompleteEncounterInput`, `CancelEncounterInput`, `WorklistQuery` (unit, status[], cursor, limit≤50).
- Output **DTO** (buang field internal; `version` dikirim untuk optimistic UI).

### 4.4 API — `app/api/v1/encounters/*` (Route tipis)
| Method | Path | Service |
|---|---|---|
| `GET` | `/api/v1/encounters?unit=&status=&cursor=&limit=` | `getWorklist` |
| `GET` | `/api/v1/encounters/:id` | `findById` |
| `POST` | `/api/v1/encounters` | `openEncounter` |
| `POST` | `/api/v1/encounters/:id/call` | `callPatient` (T4) |
| `POST` | `/api/v1/encounters/:id/complete` | `completeEncounter` (T5) |
| `POST` | `/api/v1/encounters/:id/reopen` | `reopenEncounter` |
| `POST` | `/api/v1/encounters/:id/cancel` | `cancelEncounter` (T99) |

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
- `antreanKodebooking` unique-ish — join antrean.
- `noKunjungan` unique.
- Cursor pagination by `(createdAt, id)`.

---

## 7. Failure modes & konkurensi

| Skenario | Penanganan |
|---|---|
| 2 petugas Panggil pasien sama | `version` guard → 1 sukses, lain dapat `CONFLICT` (409) → UI refresh |
| SEP gagal saat open (BPJS) | encounter tetap dibuat, SEP `pending` → outbox retry; tak blokir admisi |
| Complete tanpa diagnosa | Service tolak `VALIDATION` (422) sebelum tx |
| Re-open setelah Billed | tolak `FORBIDDEN_STATE` |
| Invoice gagal dibuat saat open | **rollback** seluruh tx (encounter tak setengah jadi) |

---

## 8. Migrasi dari mock (swap pattern)

Sumber mock yang dikonsolidasi jadi tabel `Encounter`:
- `registrationStore.kunjungan` (KunjunganRecord) → seed Encounter (header).
- `rjQueueStore` (RJOrderStatus + locked + selesaiAt) → kolom `status`/`lockedAt`/`selesaiAt`.
- `igdPatients`/`rawatInapPatients`/`rjPatients` board statis → diganti `getWorklist()` query.
- Frontend swap: `useRJQueue()`/`RJBoard(patients)` → fetch `/api/v1/encounters?unit=RawatJalan` (TanStack Query + SSE invalidate). **Break #1 & #2 sembuh di sini.**

---

## 9. Task checklist

### ENC0 — Schema & migration
- [ ] Prisma model `Encounter` + enum `EncounterUnit`/`EncounterStatus` + relasi FK (Patient/Antrean/Invoice/Order/Bed/Practitioner).
- [ ] Index `(unit,status,createdAt)` + `patientId` + unique `noKunjungan`.
- [ ] `migrate dev` + review SQL (no destructive).

### ENC1 — DAL
- [ ] `encounterDal` (create/findById/findByKodebooking/listByUnitStatus cursor/updateStatus version-guard/softDelete).
- [ ] `scopeBy(actor)` helper (unit/role filter) — uji anti-IDOR.

### ENC2 — Schemas & errors
- [ ] Zod input/output DTO (discriminated by unit) + `WorklistQuery`.
- [ ] Error codes domain: `ENCOUNTER_NOT_FOUND`, `CONFLICT_VERSION`, `DIAGNOSA_REQUIRED`, `FORBIDDEN_STATE`.

### ENC3 — Service
- [ ] `openEncounter` (tx: encounter + invoice draft + T3) · `callPatient` (T4) · `completeEncounter` (guard diagnosa, tx, T5, route farmasi) · `reopen` · `cancel` (T99) · `getWorklist`.
- [ ] Hook ke `antreanService.emitTask` (boleh stub bila Antrean belum siap).
- [ ] Authz unit-scope + ownership.

### ENC4 — API
- [ ] 7 route `/api/v1/encounters/*` (tipis) + idempotency-key + envelope + handleError.

### ENC5 — Realtime
- [ ] Publish event ke Redis channel `board:{unit}` + `display:antrean` (lewat BACKEND-REALTIME).

### ENC6 — Seed & frontend swap
- [ ] Seed dari registrationStore/rjQueue mock.
- [ ] Swap `RJBoard`/`useRJQueue` → fetch API + SSE. Verifikasi pasien baru muncul di worklist (Break #1) + punya invoice (Break #2).

### ENC7 — Tests
- [ ] Unit Service (transisi + guard diagnosa + version conflict).
- [ ] Integration DAL (cursor pagination + scopeBy + RLS policy) di test DB Postgres (Testcontainers).

---

## 10. Keputusan (terkunci 2026-06-01)

1. ✅ **Invoice draft dibuat saat `Registered→Queued`** (check-in/admisi) — charge selalu punya target invoice.
2. ✅ **Sub-state panggil/recall = kolom enum sekunder** (`callState` + `recallCount`) — ringan, tak mengotori `status` puncak. Tabel `EncounterCall` hanya bila butuh histori panggilan (fase later).
3. ✅ **Bed RI = FK `bedId` di Encounter**; logic alokasi/status bed di Master Ruangan/Bed service (bukan domain Encounter).
4. ✅ **IGD walk-in**: `antreanKodebooking` null, langsung `InService` (skip Queued antrol); triase mengatur sub-state internal.

> **Kontrak Patient↔Encounter (terkunci):** `openEncounter` **mensyaratkan Patient `dataLengkap=true`** untuk **RJ/RI terjadwal**; **IGD & Mr.X** boleh atas pasien **draft** (`dataLengkap=false`) — dilengkapi kemudian di admisi.
