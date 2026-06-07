# TODO — Rekam Medis Klinis (Backend) · mulai dari IGD

> **Tujuan:** bangun domain klinis (medical record) di backend, menggantung pada spine `encounter.Kunjungan`.
> **Mulai dari IGD** karena alurnya paling lengkap (19 tab) & sebagian besar tab-nya **shared** ke RI/RJ → satu set tabel klinis dipakai lintas modul.
> Acuan: [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md) · [docs/API-RULES.md](docs/API-RULES.md) · [TODOS_BACKEND.md](TODOS_BACKEND.md). Dibuat 2026-06-07.

## Titik berangkat (temuan)

- ✅ **Spine `Kunjungan` siap** ([encounter.prisma](prisma/schema/encounter.prisma)) — doc-nya eksplisit: _"data klinis TIDAK di sini → menggantung via `kunjunganId`."_ Belum ada satupun tabel klinis.
- ✅ **Seam swap siap** — [igdDetailApi.ts](src/components/igd/igdDetailApi.ts) mengisi `diagnosa/cppt/tindakan/vitalSigns/disposisi` dengan nilai kosong + komentar _"domain backend belum ada"_. Integrasi = isi array ini per-domain. **Zero refactor UI.**
- ✅ **Pola layered matang** — Route(`route()`)→Service(factory)→DAL(`db(tx)`)→Prisma, `transaction`, optimistic concurrency, soft-delete. Mirror persis dari `kunjungan`/`bedAllocation`.
- ✅ **RBAC klinis ter-seed** — `clinical.igd|ri|rj|cppt|diagnosa|tindakan|resep` (read/create/update/delete) sudah ada di PERMISSION_TREE + DB. Tak perlu permission baru untuk domain klinis.
- ⚠️ **ABAC unit-scope belum** — `assertCan` baru RBAC. Tulis klinis oleh akun unit-scoped (Dokter/Perawat) **belum fail-closed**. Keputusan: **bangun domain dulu (RBAC), ABAC `requireScope` menyusul sebelum akun klinis live** (BACKEND-AUTH §11).

## Konsolidasi 19 tab IGD → ~9 domain klinis

Tab ≠ tabel. Banyak tab = view berbeda atas domain yang sama; komponen `shared/medical-records/` membuktikan bentuk data seragam lintas IGD/RI/RJ.

| Domain (tabel target) | Tab terkait                                                           | Shared?    | Catatan                                                                                 |
| --------------------- | --------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| **Triase**            | Triase                                                                | IGD-only   | sebagian sudah di `Kunjungan.triaseLevel/caraDatang`                                    |
| **Observation**       | TTV · Penilaian (skor Morse/Braden/Barthel/NRS/NEWS2)                 | ✅         | time-series (pertimbangkan TimescaleDB)                                                 |
| **CPPT**              | CPPT/SOAP                                                             | ✅         | append-only + co-sign DPJP                                                              |
| **Condition**         | Diagnosa                                                              | ✅         | ICD-10; dibutuhkan billing/e-klaim                                                      |
| **Procedure**         | Tindakan IGD                                                          | IGD-only\* | ICD-9-CM; trigger charge billing                                                        |
| **Assessment**        | Asesmen Medis · Pemeriksaan (status fisik 11-sistem) · Riwayat/Alergi | ✅ inti    | narasi + head-to-toe                                                                    |
| **Consent**           | Informed Consent                                                      | ✅         | PMK 290/2008                                                                            |
| **MedReconciliation** | Rekonsiliasi                                                          | ✅         | HAM badge                                                                               |
| **NursingCare**       | Keperawatan (asuhan keperawatan SDKI/SLKI/SIKI)                       | ✅         | proses keperawatan; bisa berbagi pola CPPT                                              |
| **Handover**          | Serah Terima (SBAR)                                                   | ✅         | auto-populate TTV                                                                       |
| **Order** (REUSE)     | Daftar Order · Resep · Order Lab · Order Rad                          | ✅         | **domain Order tersendiri** (`ORDERS_MOCK` single source) — rekam medis cukup _membaca_ |
| **Outcome/Disposisi** | Pasien Pulang · Rujukan Keluar · Penandaan Gambar                     | IGD-only   | outcome episode                                                                         |

\* "IGD-only" = wrapper di folder `igd/`, domainnya tetap sama → **satu** tabel lintas-unit.

## Pelacak 19 Tab IGD (status backend per-tab)

Urutan persis seperti di [IGDRecordTabs.tsx](src/components/igd/IGDRecordTabs.tsx) (Rekam Medis 13 + Layanan 6). **FE 19/19 ✅** (mock). Yang dilacak di sini = **backend**: kolom **BE** (schema+DAL+service+endpoint, ~Fase A) & **Wiring** (resolver + tab konsumsi DB, ~Fase B/C).
Legenda: 🟢 selesai · 🟡 sebagian · ⬜ belum.

**Status global backend: 1/19 dimulai** (Triase Fase A ✅; wiring & 18 tab lain ⬜).

| #   | Tab (grup)               | Domain target     | FE  | BE  | Wiring | Catatan                                              |
| --- | ------------------------ | ----------------- | --- | --- | ------ | ---------------------------------------------------- |
| 1   | **Triase** (RM)          | Triase            | ✅  | 🟢  | ⬜     | Fase A ✅; sisa Fase B (tab) + C (modal/board)        |
| 2   | **TTV** (RM)             | Observation       | ✅  | ⬜  | ⬜     | shared; time-series; tanpa co-sign → domain ke-2     |
| 3   | **Asesmen Medis** (RM)   | Assessment        | ✅  | ⬜  | ⬜     | narasi + riwayat/alergi                              |
| 4   | **Diagnosa** (RM)        | Condition         | ✅  | ⬜  | ⬜     | ICD-10; dibutuhkan billing/e-klaim                   |
| 5   | **CPPT / SOAP** (RM)     | CPPT              | ✅  | ⬜  | ⬜     | append-only + co-sign DPJP → domain ke-3             |
| 6   | **Tindakan IGD** (RM)    | Procedure         | ✅  | ⬜  | ⬜     | ICD-9-CM; trigger charge billing                     |
| 7   | **Informed Consent** (RM)| Consent           | ✅  | ⬜  | ⬜     | PMK 290/2008                                         |
| 8   | **Rekonsiliasi** (RM)    | MedReconciliation | ✅  | ⬜  | ⬜     | HAM badge; context igd/ri                            |
| 9   | **Keperawatan** (RM)     | NursingCare       | ✅  | ⬜  | ⬜     | asuhan keperawatan; bisa berbagi pola CPPT           |
| 10  | **Pemeriksaan** (RM)     | Assessment        | ✅  | ⬜  | ⬜     | status fisik 11-sistem (StatusFisikPane)             |
| 11  | **Penilaian** (RM)       | Observation       | ✅  | ⬜  | ⬜     | skor Morse/Braden/Barthel/NRS/NEWS2 (= Observation)  |
| 12  | **Penandaan Gambar** (RM)| Outcome/Annotation| ✅  | ⬜  | ⬜     | body-diagram markup (anatomis)                       |
| 13  | **Serah Terima** (RM)    | Handover          | ✅  | ⬜  | ⬜     | SBAR; auto-populate TTV                              |
| 14  | **Daftar Order** (Lyn)   | Order (REUSE)     | ✅  | ⬜  | ⬜     | domain Order tersendiri — rekam medis cukup _membaca_|
| 15  | **Resep Pasien** (Lyn)   | Order (REUSE)     | ✅  | ⬜  | ⬜     | MedicationRequest                                    |
| 16  | **Order Lab** (Lyn)      | Order (REUSE)     | ✅  | ⬜  | ⬜     | ServiceRequest (lab)                                 |
| 17  | **Order Radiologi** (Lyn)| Order (REUSE)     | ✅  | ⬜  | ⬜     | ServiceRequest (rad)                                 |
| 18  | **Rujukan Keluar** (Lyn) | Outcome/Disposisi | ✅  | ⬜  | ⬜     | referral keluar                                      |
| 19  | **Pasien Pulang** (Lyn)  | Outcome/Disposisi | ✅  | ⬜  | ⬜     | outcome episode (5 panel: sembuh/rujuk/APS/transfer/meninggal) |

> Beberapa tab berbagi satu domain (mis. TTV+Penilaian → Observation; Asesmen+Pemeriksaan → Assessment; Daftar/Resep/Lab/Rad → Order) → satu tabel/endpoint melayani >1 tab. Menyelesaikan satu domain bisa mencentang beberapa baris sekaligus.

## Keputusan terkunci (2026-06-07)

1. **Satu set tabel klinis lintas-unit** — keyed `kunjunganId`, di schema Postgres baru **`medicalrecord`**. BUKAN `igd_cppt`/`ri_cppt`. Komponen shared sudah membuktikan bentuk data seragam.
2. **Normalized & FHIR-mappable, bukan JSON blob** — kolom terstruktur untuk field queryable (kode diagnosa, level triase, skor); `text[]` untuk multi-select; `text` untuk narasi bebas. Adapter `toFhir*` ([TODOS_BACKEND.md](TODOS_BACKEND.md)) menyusul. Enum Postgres hanya untuk field keputusan-kritis (mis. `TriaseLevel`).
3. **Append-only / immutable** untuk catatan klinis (CPPT, Observation, Triase) — medico-legal/SNARS. Koreksi = addendum/baris baru; verifikasi DPJP = state-transition (co-sign), bukan edit. `kunjungan.*` denormalisasi = pointer ke baris terbaru.
4. **RBAC-first, ABAC-later** — endpoint pakai `clinical.*` RBAC sekarang; `requireScope`/`scopeBy(actor)` MUST sebelum akun klinis unit-scoped diaktifkan.
5. **Author dari `actor`** — `authorUserId`/`authorPegawaiId` dari token (server-side), nama denormalisasi untuk tampilan. Bukan free-text murni.
6. **Reuse Order** — Daftar/Resep/Lab/Rad = domain Order tersendiri, bukan bagian rekam medis.

## Urutan domain (prioritas)

1. **Triase** ← **domain pertama** (pintu masuk IGD, sebagian field sudah di spine, membuktikan pola E2E).
2. **Observation** (TTV + skor Penilaian) — shared, simpel, tanpa co-sign.
3. **CPPT** — tulang punggung dokumentasi + pola append-only & co-sign.
4. **Condition** (Diagnosa) — dibutuhkan billing/e-klaim hilir.
5. **Procedure** (Tindakan) — trigger charge billing.
6. Sisanya: Assessment · Consent · MedReconciliation · Handover · Outcome/Disposisi.

---

## Domain 1 — TRIASE 🚧

**Model `medicalrecord.Triase`** (append-only, keyed `kunjunganId`):

- Tiap simpan = baris immutable; re-triase = baris baru; latest by `createdAt` = current. `kunjungan.triaseLevel` (Int 1..4) = pointer/cache ke yang terbaru (sinkron dalam transaksi).
- Kolom terstruktur mirror `TriaseEntryForm` ([TriasePrimaryForm.tsx](src/components/igd/TriasePrimaryForm.tsx)): kedatangan · anamnesis · ABCDE primary survey · diagnosa sementara · tindakan triase · keputusan `TriaseLevel` (enum P1–P4) · PJ. Multi-select (`gejalaPenyerta`/`suaraNapasAbnormal`/`tindakanTriase`) = `text[]`. Author dari actor.
- **Dua pintu masuk, satu endpoint**: [TriaseTab](src/components/igd/tabs/TriaseTab.tsx) (dalam rekam medis) + [TriaseModal/IGDTriaseButton](src/components/igd/TriaseModal.tsx) (board/pendaftaran) → keduanya panggil endpoint yang sama.

### Fase A — Backend (schema → endpoint) ✅ SELESAI (2026-06-07)

- [x] **A1** `prisma/schema/medicalrecord.prisma` — schema baru `medicalrecord`; enum `TriaseLevel`; model `Triase` (+ relasi balik `triase Triase[]` di `Kunjungan`). `"medicalrecord"` ditambah ke `schemas` di [config.prisma](prisma/schema/config.prisma).
- [x] **A2** migration `20260607150000_init_clinical_triase` (enum+tabel+index+FK→`encounter.kunjungan`) + rename `20260608120000_rename_clinical_to_medicalrecord` (`ALTER SCHEMA clinical RENAME TO medicalrecord`, data-preserving). Applied via `prisma migrate deploy` + `prisma generate`.
- [x] **A3** Zod [`src/lib/schemas/triase.ts`](src/lib/schemas/triase.ts) — `TriaseLevel`, `TriaseInput` (field wajib + opsional + `text[]`), `TriaseDTO`, `triaseLevelToInt`.
- [x] **A4** DAL [`src/lib/dal/triaseDal.ts`](src/lib/dal/triaseDal.ts) — `create(tx)` · `latestByKunjungan(tx)` + [`kunjunganDal.setTriaseLevel`](src/lib/dal/kunjunganDal.ts).
- [x] **A5** Service [`src/lib/services/triaseService.ts`](src/lib/services/triaseService.ts) — `save` = tx { insert + sync `triaseLevel` } · `getLatest` · validasi kunjungan ada & unit IGD · author dari actor.
- [x] **A6** Endpoint [`src/app/api/v1/kunjungan/[id]/triase/route.ts`](src/app/api/v1/kunjungan/[id]/triase/route.ts) — `GET` (`clinical.igd:read`) + `POST` 201 (`clinical.igd:create`).
- **DoD A:** ✅ `tsc` bersih · ✅ `migrate status` up-to-date. ⏳ smoke HTTP (POST/GET via curl) butuh dev server + token — belum dijalankan.

### Fase B — Wiring TriaseTab + resolver

- [ ] **B1** Client [`src/lib/api/triase.ts`](src/lib/api/triase.ts) — `saveTriase(kunjunganId, input)` · `getTriase(kunjunganId)`.
- [ ] **B2** [igdDetailApi.ts](src/components/igd/igdDetailApi.ts) / resolver — muat triase terbaru → seed form (bukan hanya `triaseLevel`).
- [ ] **B3** [TriaseTab](src/components/igd/tabs/TriaseTab.tsx) — tombol "Simpan Pengkajian Triase" → `saveTriase`; loading/error/sukses; reload konsisten dari DB.
- **DoD B:** simpan dari tab → board IGD pasien itu tak lagi "Belum Triase"; re-triase → level ter-update; reload konsisten.

### Fase C — Satukan board/modal

- [ ] **C1** [TriaseModal/IGDTriaseButton](src/components/igd/TriaseModal.tsx) → endpoint yang sama; sinkron status board IGD.
- **DoD C:** triase dari board & dari tab menulis ke baris yang sama; satu source of truth.

---

## Catatan

- ABAC `requireScope` (unit-scope) = slice terpisah, MUST sebelum akun klinis unit-scoped live ([TECH_DEBT.md](TECH_DEBT.md#-auth--rbac-security) §🔑).
- Real-time board (commit + SSE) menggantikan `workflowStore` client-side — di luar slice rekam medis (lihat Key Architecture Decisions di [CLAUDE.md](CLAUDE.md)).
- Audit/access-log catatan sensitif (CPPT/diagnosa) — TODOS_BACKEND §security; desain tabel klinis sudah siapkan kolom audit.
