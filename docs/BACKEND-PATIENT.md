# EHIS Backend — Domain: **Patient** (Identitas Pasien / Master Pasien)

> Identitas tunggal pasien — akar bersama dengan Encounter. **Tabel pertama B0** (semua FK menggantung ke `Patient`).
> Menutup gap kontrak registrasi (audit pra-backend): `noKK` · `dataLengkap` · mapping wilayah BPJS↔Kemendagri · **NIK dedup** (cegah double-MRN).
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md).** Bila konflik, FLOWS menang.
> **Terkait:** [BACKEND-ENCOUNTER.md](BACKEND-ENCOUNTER.md) · [BACKEND-AUTH.md](BACKEND-AUTH.md) · [TODO-REGISTRASI.md](../TODO-REGISTRASI.md) (REG0/REG1.1) · [docs/API-ANTREAN.md](API-ANTREAN.md) §6.
> Sumber tipe (frontend mock): [data.ts](../src/lib/data.ts) `PatientMaster` · [registration/types.ts](../src/lib/registration/types.ts) `NewPatientInput`/`BpjsPesertaAutofill` · [registrationStore.ts](../src/lib/registration/registrationStore.ts).
>
> **Status:** 📋 Spec. Implementasi belum mulai.

---

## 1. Scope domain

**Patient OWNS:**
- Identitas & demografi pasien (1 baris = 1 manusia). **NIK dedup** + generasi `noRM`.
- Model **draft → lengkap** (`dataLengkap`) — daftar minimal di kiosk/MJKN, dilengkapi di admisi.
- Alamat (kode wilayah **Kemendagri** untuk FHIR + simpanan kode BPJS apa adanya).
- Penjamin default, alergi awal, kontak darurat.
- Autofill peserta BPJS (`BpjsPesertaAutofill` → field) + **mapping wilayah**.
- **Merge** duplikat (resolusi double-MRN).

**Patient TIDAK owns** (FK / delegasi):
- Kunjungan/episode → **BACKEND-ENCOUNTER** (`Encounter.patientId`).
- Antrean, order, billing, klaim → domain masing-masing (via Encounter).
- Rekam klinis (asesmen/CPPT/diagnosa) → domain klinis (`encounterId`, bukan `patientId`).
- Alergi yang ditemukan saat asesmen klinis → domain klinis; Patient hanya simpan **alergi awal** (registrasi).

> **Prinsip:** Patient = identitas + demografi stabil. Data yang berubah per-kunjungan menggantung di Encounter.

---

## 2. Entity model

> Semua tabel domain ini di Postgres schema **`pendaftaran`** (`@@schema("pendaftaran")`) — lihat FLOWS §9.
> **Implementasi (2026-06-01):** `prisma/schema/pendaftaran.prisma` — model `Pasien` + `PasienAlamat`/`PasienPenjamin`/`PasienAlergiAwal`/`PasienKontakDarurat`. Migration `init_pendaftaran` applied.
>
> **3 refinement vs spec awal (temuan dari PasienBaruModal):**
> 1. **Alamat 1:N** (bukan 1:1) — enum `JenisAlamat {KTP, Domisili}`, `@@unique([pasienId, jenis])`. Form punya flag `samaAlamat` (KTP≠domisili).
> 2. **Golongan darah dipecah** — `golonganDarah` (ABO enum) + `rhesus` (Positif/Negatif) — form input `A+/A-`, `PatientMaster` lama cuma ABO.
> 3. **`statusPerkawinan` = enum Dukcapil** (`BelumKawin/Kawin/CeraiHidup/CeraiMati`) — frontend lama `Janda/Duda` & `Cerai Hidup/Mati`, adapter map saat swap.
> 4. **NIK dedup** via `nikHash @unique` *nullable* — Postgres anggap NULL distinct → Mr.X (NULL) boleh banyak, NIK asli wajib unik. (Tak perlu partial-unique manual.)
> 5. **`agama/pendidikan/pekerjaan/suku` = text** (+ `TODO(master)`), bukan enum — konsisten precedent `Pegawai`.

### 2.1 `Patient`
| Field | Catatan / index |
|---|---|
| `id` PK | UUID v7 (`@default(uuid(7)) @db.Uuid`) |
| `noRM` unique | **Postgres sequence** + format `RM-{th}-{seq}` (ganti `max+1` race-prone mock) |
| `nik` (16) | **partial unique** (where not null & not Mr.X) — anti double-MRN. **PII-encrypted** at-rest |
| `noKK` (16) nullable | **field baru** (belum ada di mock) — dari BPJS. PII-encrypted |
| `nama` | **trigram index** (pg_trgm) untuk search typo-tolerant |
| `gender` enum `L\|P` | |
| `tanggalLahir` date · `tempatLahir` | (umur **dihitung**, bukan disimpan — `now()` injectable) |
| `golonganDarah` · `statusPerkawinan` · `agama` · `pekerjaan` · `pendidikan` · `suku` · `kewarganegaraan` | demografi (nullable saat draft) |
| `noHp` · `email` | kontak |
| `dataLengkap` bool default false | **draft flag** — false = minimal (kiosk/MJKN), true = lengkap (admisi) |
| `isAnonim` bool default false | **Mr.X** (pasien tak dikenal IGD) — NIK boleh kosong |
| `mergedIntoId` FK→Patient nullable | bila record ini hasil merge (lihat §3) |
| `version` int · `createdAt`/`updatedAt`/`deletedAt` | soft-delete + optimistic concurrency |

### 2.2 `PatientAddress` (1:1 atau embedded)
| Field | Catatan |
|---|---|
| `alamat` · `rtRw` · `kodePos` | jalan |
| `kelurahanKode`/`kelurahanNama` · `kecamatanKode`/`kecamatanNama` · `kotaKode`/`kotaNama` · `provinsiKode`/`provinsiNama` | **kode Kemendagri** (untuk FHIR `administrativeCode`) |
| `bpjsKodeProp`/`bpjsKodeDati2`/`bpjsKodeKec`/`bpjsKodeKel` nullable | **kode BPJS apa adanya** (≠ Kemendagri — lihat gotcha) |

### 2.3 `PatientPenjamin`
- `tipe` enum `TipePenjamin` (`BPJS_Non_PBI`/`BPJS_PBI`/`Umum`/`Asuransi`/`Jamkesda`) · `nama` · `nomor` (no kartu — **PII-encrypted**).

### 2.4 `PatientAlergiAwal` (1:N) & `KontakDarurat` (1:N)
- Alergi awal: `nama` · `reaksi?` · `tingkat?` (alergi klinis lengkap = domain klinis).
- Kontak darurat: `nama` · `hubungan` · `noHp` · `alamat?`.

> **⚠️ Gotcha wilayah BPJS (dari REG1.1):**
> 1. **Kode BPJS ≠ Kemendagri** (`kodeprop:"11"`+"Jawa Barat" vs Kemendagri Jabar=32). Simpan kode BPJS apa adanya **+** resolve ke Kemendagri saat sync FHIR via tabel mapping.
> 2. **Label `rt`/`rw` BPJS tertukar** — BPJS `rw`→RT kita, `rt`→RW kita. Map saat autofill.

---

## 3. Lifecycle

```
Draft (dataLengkap=false) ──(lengkapi di admisi)──▶ Complete (dataLengkap=true)
   │                                                      │
   └── Mr.X (isAnonim, NIK kosong) ──(identitas diketahui)─┘
Active ──(soft-delete)──▶ Deleted        Active ──(merge)──▶ Merged (mergedIntoId)
```

- **Draft** — dibuat minimal (NIK · nama · TTL · noHP) saat kiosk/MJKN/walk-in cepat; `noRM` sudah terbit.
- **Complete** — di admisi, field demografi dilengkapi → `dataLengkap=true`.
- **Mr.X** — IGD pasien tak dikenal: `isAnonim=true`, NIK kosong (partial-unique melewati); identitas dilengkapi belakangan → ambil jalur dedup.
- **Merge** — bila ditemukan 2 `noRM` untuk 1 orang: pilih survivor, set `mergedIntoId` di loser, **re-assign `Encounter.patientId`** ke survivor (transaksi), audit. Lookup loser noRM redirect ke survivor. *(Advanced — schema disiapkan, operasi bisa fase-later.)*

---

## 4. Layer breakdown

### 4.1 DAL — `lib/dal/patientDal.ts`
- `create(data, tx?)` · `findById(id, actor)` · `findByNoRM(noRM, actor)` · `findByNik(nik)` (untuk dedup) · `searchByNamaTglLahir(q)` (trigram) · `update(id, {expectedVersion, patch}, tx?)` (version guard) · `softDelete` · `reassignEncounters(loserId, survivorId, tx)` (merge).
- `nextNoRM(tx)` — pakai **sequence** Postgres.
- `scopeBy(actor)` — pasien umumnya readable lintas unit oleh role klinis; tetap audit akses (data sensitif).

### 4.2 Service — `lib/services/patientService.ts`
- `registerPatient(input, actor)` — **dedup-first**: cek `findByNik` → bila ada & bukan Mr.X → **kembalikan existing** (cegah double-MRN, bukan error). Else create (draft/complete sesuai kelengkapan).
- `completePatient(id, input, actor)` — lengkapi draft → `dataLengkap=true`.
- `autofillFromBpjs(peserta: BpjsPesertaAutofill)` — `bpjsPesertaToForm()`: map field + **mapping wilayah** (Kemendagri + simpan kode BPJS) + **swap rt/rw**.
- `searchPatient(query, actor)` — by NIK/noRM (exact) atau nama+tglLahir (fuzzy trigram).
- `mergePatients(loserId, survivorId, actor)` — **tx**: set `mergedIntoId` + `reassignEncounters` + audit. Guard role (Admin).
- Inject `clock`/`genId`. PII-encryption di boundary simpan/baca.

### 4.3 Schema/DTO — `lib/schemas/patient.ts` (Zod)
- `RegisterPatientInput` (mirror `NewPatientInput` + `noKK`), `CompletePatientInput`, `SearchQuery`, `BpjsPesertaAutofill`.
- Validasi: NIK 16 digit (kecuali Mr.X), tglLahir tak di masa depan, noHP format.
- Output DTO: **NIK/noKartu di-mask** kecuali role berwenang (mis. `3201••••••••1234`).

### 4.4 API — `app/api/v1/patients/*`
| Method | Path | Service |
|---|---|---|
| GET | `/api/v1/patients?q=&by=nik\|rm\|nama` | `searchPatient` |
| GET | `/api/v1/patients/:id` | `findById` (redirect bila merged) |
| POST | `/api/v1/patients` | `registerPatient` (dedup-first) |
| PATCH | `/api/v1/patients/:id` | `completePatient` |
| POST | `/api/v1/patients/bpjs-autofill` | `autofillFromBpjs` (preview, tak simpan) |
| POST | `/api/v1/patients/:id/merge` | `mergePatients` (Admin) |

Idempotency-Key wajib untuk POST (cegah double-create saat retry).

---

## 5. Event
- Audit (**BACKEND-AUDIT**): `PATIENT_CREATED`, `PATIENT_COMPLETED`, `PATIENT_MERGED`, `PATIENT_VIEWED` (akses data sensitif wajib di-log — UU PDP). **PII-scrubbing** di log.
- Tidak ada SSE (identitas tak real-time). `PATIENT_CREATED` bisa trigger cache warmup opsional.

---

## 6. Indexing
- `noRM` unique · `nik` **partial unique** (`WHERE nik IS NOT NULL AND is_anonim=false`).
- `nama` **GIN trigram** (pg_trgm) untuk fuzzy search.
- `(tanggalLahir)` + composite untuk search nama+tgl.
- `mergedIntoId` (redirect lookup).

---

## 7. Failure modes

| Skenario | Penanganan |
|---|---|
| NIK sudah ada (double-MRN) | `registerPatient` dedup-first → kembalikan pasien existing (bukan create/error) |
| Race generate `noRM` (2 daftar bareng) | **sequence** Postgres atomik (hilangkan race `max+1` mock) |
| Mr.X tanpa NIK | `isAnonim=true`, lewati unique; dedup saat identitas diketahui |
| NIK BPJS beda dengan input manual | flag verifikasi; jangan timpa diam-diam |
| Merge konflik (data beda) | survivor menang; simpan snapshot loser di audit; reversible? (§10) |
| Kode wilayah BPJS ditulis ke field Kemendagri | **dilarang** — simpan terpisah, resolve via mapping |

---

## 8. Migrasi mock → DB

- `PatientMaster` (data.ts) + `registrationStore.patients` → tabel `Patient` (+ Address/Penjamin/Alergi/Kontak).
- **Tutup gap kontrak** (audit pra-backend): tambah `noKK`, `dataLengkap`, `isAnonim`, kode wilayah Kemendagri+BPJS, `mergedIntoId`.
- `generateNoRM` (`max+1`) → **sequence**. `findPatientByNik`/`findPatient` → `findByNik`/`searchPatient`.
- Frontend swap: `addPatient`/`getMergedPatient`/`getAllMergedPatients` → `/api/v1/patients/*` (TanStack Query). `PasienBaruModal` submit → `registerPatient` (dedup-first); mode "Lengkapi Data" → `completePatient`.
- **Resolver** REG0.3 (server seed + store overlay) tak perlu lagi — satu sumber DB.

---

## 9. Task checklist

### PAT0 — Schema & sequence
- [x] Prisma `Pasien` (+`noKkEnc`/`dataLengkap`/`isAnonim`/`mergedIntoId`/`version`) + `PasienAlamat`/`PasienPenjamin`/`PasienAlergiAwal`/`PasienKontakDarurat`. *(schema `pendaftaran`, migration `init_pendaftaran`)*
- [x] Sequence `pendaftaran.no_rm_seq` (manual SQL). GIN trigram `nama` (`pg_trgm`, in-schema raw ops). NIK unik via `nikHash @unique` nullable.
- [ ] Format helper `RM-{th}-{seq}` (Service, pakai `nextval`). Seed dari `patientMasterData` mock.

### PAT1 — DAL
- [x] `patientDal` (create/findById/findByNoRm/findByNikHash/findByPasporHash/searchByNama trigram+cursor/updateWithVersion/upsertAddress/softDelete/nextNoRmSeq). `reassignEncounters` (merge) = fase later.
- [x] PII helper `lib/crypto/pii.ts` (AES-256-GCM enc/dec + HMAC hash + mask) at-rest.

### PAT2 — Schema & errors
- [x] Zod `RegisterPatientInput`(+noKK/isWna/noPaspor/anonim)/`CompletePatientInput`(+expectedVersion)/`SearchQuery`/`IdParam`. `BpjsPesertaAutofill` = fase later.
- [x] DTO masking NIK/noKartu (`maskPii`). Error katalog FLOWS §4 (`AppError`+`handleError`); `DUPLICATE_NIK`→resolve (dedup-first, bukan error).

### PAT3 — Service
- [x] `registerPatient` **dedup-first** (+race P2002 fallback) · `completePatient` (version guard, tx, upsert alamat) · `searchPatient` (NIK/RM exact + nama trigram cursor) · `getPatient`. `autofillFromBpjs`/`mergePatients` = fase later. Clock di-inject (no Date.now).

### PAT4 — API
- [x] Route `/api/v1/patients` (GET search/list, POST register 201) + `/[id]` (GET, PATCH complete). Wrapper `route()` reusable: auth→RBAC→Zod→envelope→handleError. **Smoke-test PASS** (POST/dedup/search trigram+NIK/GET/PATCH+version-guard 409/404/422).

### Fondasi backend (dibangun bareng PAT — reusable semua domain)
- [x] `lib/db/prisma.ts` (singleton + pg driver adapter + `transaction()` helper) · `lib/core/clock.ts` (seam) · `lib/crypto/pii.ts` · `lib/errors/{appError,handleError}.ts` · `lib/http/{envelope,route}.ts` · `lib/auth/actor.ts` (getActor STUB → BACKEND-AUTH). Zod + `@prisma/adapter-pg` terpasang. PII keys di `.env` (dev).

### PAT5 — Frontend swap
- [x] **API client** `lib/api/client.ts` (envelope-aware, ApiError, same-origin+credentials, Idempotency-Key per mutation, AbortSignal) + `lib/api/patients.ts` (tipe reuse `import type` dari schema server).
- [x] **`PasienBaruModal` create → POST `/api/v1/patients`** (adapter `pasienBaruApi.ts` map vocab: Dukcapil/goldarah+rhesus/sumber; error banner; abort on unmount). tsc clean.
- [ ] **Reads belum di-swap** (masih `registrationStore` mock): `PatientResolver`/`KunjunganResolver` (detail), board (`getAllMergedPatients`), `ApmKiosk` dedup, `DaftarKunjunganModal`. ⚠️ Konsekuensi: pasien dibuat via API masuk DB, tapi halaman detail/`/pasien/{rm}` belum menemukannya (resolver baca store) — perlu swap read ke `getPatient`/`searchPatients` + alur kunjungan ke Encounter API (belum dibangun).
- [ ] Dedup NIK di FE (precheck `searchPatients(by:nik)`) + draft→complete (`completePatient`) UI.

### PAT6 — Tests
- [ ] Unit: dedup-first (NIK ada → return existing) · draft→complete · autofill mapping wilayah + rt/rw swap · merge re-assign encounter · NIK masking per role.
- [ ] Integration DAL: sequence noRM concurrency · partial unique NIK · trigram search.

---

## 10. Keputusan (terkunci 2026-06-01)

1. ✅ **PII encryption = app-level** (encrypt sebelum simpan; kunci di Secret Manager) — portabel + scrubbing konsisten. Bukan `pgcrypto`.
2. ✅ **Merge one-way + audit snapshot** — simpan snapshot loser di audit; undo manual. Bukan reversible otomatis.
3. ✅ **Address = tabel 1:1 terpisah** (`PatientAddress`) — rapi + reusable untuk FHIR adapter.
4. ✅ **Mapping wilayah BPJS↔Kemendagri = tabel Master + cache** (bukan lib statis) — bisa di-update tanpa deploy.
5. ✅ **1 penjamin primer** di Patient untuk sekarang; coordination-of-benefits (BPJS + asuransi swasta) = fase later di Encounter/Claim. **Dijaga DB**: partial-unique `(pasien_id) WHERE is_primer AND deleted_at IS NULL`.

### Hasil audit schema (2026-06-01)
6. ✅ **DB guarantees** (migration `pendaftaran_audit_fixes`): CHECK `nik_enc`/`nik_hash` sepasang · CHECK `nomor_enc`/`nomor_hash` penjamin sepasang · partial-unique single-primer. (Manual SQL — drift-safe, Prisma abaikan CHECK + predicate-index + sequence; `migrate diff` terbukti empty.)
7. ✅ **Timestamp konsisten** — `createdAt`/`updatedAt` ditambah ke `PasienAlamat`/`PasienAlergiAwal`/`PasienKontakDarurat` (UU PDP akurasi data).
8. ✅ **Unik global (bukan partial) untuk `noRm` & `nikHash`** — sengaja termasuk row soft-deleted: noRM tak boleh didaur-ulang, NIK terhapus tak boleh hidup di MRN baru (RME).
9. ✅ **WNA / paspor** (migration `pasien_wna_paspor`): `Pasien` +`isWna` +`noPasporEnc`/`noPasporHash @unique`. CHECK `pasien_paspor_pair_chk` (enc/hash sepasang) + CHECK `pasien_identitas_chk` (**non-anonim WAJIB NIK ATAU paspor**, Mr.X dikecualikan). Service: cabang WNA pakai paspor sebagai kunci dedup.
