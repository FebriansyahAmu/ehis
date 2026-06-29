# Aturan Kanonik — Rekam Medis Rawat Inap (DB-wiring tab klinis)

> **Baca sebelum menyentuh tab rekam medis Rawat Inap atau menyambungkannya ke DB.**
> Doc ini menjaga Tier-2 (penyelesaian DB-wiring tab klinis RI) **tetap on-track** dan konsisten
> dengan fondasi arsitektur yang sudah disepakati. Menang bila konflik dengan kebiasaan ad-hoc.
>
> Terkait: [docs/BACKEND-FLOWS.md](BACKEND-FLOWS.md) · [docs/API-RULES.md](API-RULES.md) ·
> [docs/ASSIGNMENT-RULES.md](ASSIGNMENT-RULES.md) · [TODO-CLINICAL.md](../TODO-CLINICAL.md)

---

## 0. Prinsip arsitektur (mengapa)

Pembeda IGD/RI/RJ **terpusat di satu titik**, lalu menyebar sebagai variasi tipis:

- **Satu spine tunggal `encounter.Kunjungan`**, didiskriminasi enum `unit` (`IGD`/`RawatJalan`/`RawatInap`).
  Bukan tabel per-unit; atribut khas-unit = kolom **nullable jarang (sparse)** + invarian dijaga
  **partial CHECK constraint** di DB (migrasi `20260629140000_kunjungan_unit_invariants`:
  `kunjungan_ri_kelas_chk` · `kunjungan_titipan_kelashak_chk` · `kunjungan_unit_kelas_scope_chk` ·
  `kunjungan_rj_poli_chk`; plus `kunjungan_triase_range_chk` lama).
- **Tabel klinis (schema `medicalrecord`) UNIT-AGNOSTIC** — menggantung via `kunjunganId` saja,
  **tanpa kolom unit**. Unit selalu diturunkan via join ke `Kunjungan.unit`.
- **Presentasi = shared core + thin per-unit adapter.** Komponen tab di
  `components/shared/medical-records/`; tiap modul (`igd/tabs`, `rawat-inap/tabs`, `rawat-jalan/tabs`)
  cuma menyetel props pembeda (`context`/`showDate`/`triage`/`showMAR`/`unitLabel`).

**Konsekuensi praktis:** karena klinis hanya butuh `kunjunganId` (UUID), membuka rekam RI nyata =
[RIRecordResolver](../src/components/rawat-inap/RIRecordResolver.tsx) membangun `RawatInapPatientDetail`
ber-`id = kunjungan UUID`, lalu tab shared yang sudah DB-wired **langsung persist ke tabel yang sama**
dengan IGD/RJ. Wiring tab RI = **menyambung, bukan refactor**.

---

## 1. Aturan wajib (R1–R10)

**R1 — Tabel klinis tak pernah tahu unit.** Domain `medicalrecord.*` di-key `kunjunganId`.
**JANGAN** menambah kolom `unit`/`kelas`/diskriminator modul ke tabel klinis. Butuh unit? Join ke
`Kunjungan`. (Pengecualian sah: free-text seperti `AsesmenRawatInapItem.unit` = "RS/unit asal rujukan",
bukan diskriminator encounter.)

**R2 — Bedakan unit lewat props/adapter, BUKAN fork komponen.** Jangan menyalin tab shared jadi versi
RI sendiri. Wrapper RI di `rawat-inap/tabs/*` harus tipis (delegasi ke shared + props). Perbedaan
perilaku = prop (`context`, `showDate`, `requiresVerification`, `showMAR`, `history`, `unitLabel`).

**R3 — Identitas pasien = `kunjungan UUID`.** Adapter [riDetailApi](../src/components/rawat-inap/riDetailApi.ts)
men-set `RawatInapPatientDetail.id = k.id`. Tab menurunkan `kunjunganId` dari `patient.id`.

**R4 — Guard DB vs demo via UUID.** `isPersisted = UUID_RE.test(kunjunganId)`. UUID → mode DB
(fetch/persist nyata). Non-UUID (pasien seed `ri-1`/`ri-3`) → mode lokal/mock (tanpa network).
Pola ini sudah ada di shared CPPT/TTV/Order — **ikuti, jangan reinvent**.

**R5 — Backend berlapis + gate benar.** Endpoint baru = Route→Service→DAL→Prisma
(lihat [API-RULES.md](API-RULES.md)). Gate **`clinical.rekammedis`** (atau resource klinis spesifik
domain, mis. `clinical.keperawatan`/`clinical.pemeriksaan`) **+ ABAC careUnit** di choke-point `route()`.
**Reuse domain `medicalrecord.*` yang sudah ada** (dipakai IGD) — jangan bikin tabel paralel khusus RI.

**R6 — Tulis sesuai konvensi domain.** Append-only atau "latest-wins" + soft-delete (lihat pola
masing-masing domain di [TODO-CLINICAL.md](../TODO-CLINICAL.md)). Tanpa hard-delete. Tulis lewat
transisi/atomik bila domain menuntut (mis. Disposisi via `complete`).

**R7 — Migrasi additive + anti-drift.** Kolom/tabel baru = nullable/additive, **data-preserving**.
Eksekusi: audit read-only → (backfill bila perlu) → SQL manual via `pg` → `prisma migrate resolve
--applied`. **JANGAN `migrate dev`** (reset karena drift). Invarian unit yang baru = tambah **partial
CHECK** (audit pelanggar = 0 dulu). Lihat pola di memory `[[project_migration_drift_pattern]]`.

**R8 — `SessionProvider` di layout fullpage.** Tab klinis pakai `useSession` (penulis = user login,
gate order). Layout `[id]` RI sudah di-wrap — pertahankan.

**R9 — Hormati lock kunjungan.** Saat `Kunjungan` terkunci (Completed/`lockedAt`), tulis `clinical.*`
ditolak di `route()`; baca lolos. FE disable/blur. Jangan akali dari tab.

**R10 — Sinkronkan dokumentasi.** Setiap tab yang naik dari mock → DB: update **tracker §3** di doc ini
+ baris Rawat Inap [CLAUDE.md](../CLAUDE.md) + checklist [TECH_DEBT.md](../TECH_DEBT.md).

---

## 2. Definition of Done — wiring SATU tab RI

- [ ] Domain `medicalrecord.*` tersedia (atau ditambah via migrasi anti-drift R7).
- [ ] Layered Route→Service→DAL + RBAC gate + careUnit ABAC (R5).
- [ ] Zod input + DTO + API client (`lib/api/...`).
- [ ] Tab: muat awal `GET …/:kunjunganId/<domain>`; simpan `POST/PATCH`; guard UUID (R3, R4).
- [ ] Tidak ada kolom unit di tabel klinis (R1); wrapper RI tetap tipis (R2).
- [ ] `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` bersih `^src/` + `eslint` file tersentuh.
- [ ] Smoke `pg`: tulis lewat tab → baris muncul ber-`kunjungan_id` benar; lock dihormati (R9).
- [ ] Tracker §3 + CLAUDE.md + TECH_DEBT diperbarui (R10).

---

## 3. Tracker status tab RI (per 2026-06-29)

Sumber: [RIRecordTabs](../src/components/rawat-inap/RIRecordTabs.tsx). ✅ = persist by `kunjunganId`
(via komponen shared DB-wired, RI inherit) · 🟡 = perlu verifikasi · ❌ = mock/lokal (persist belum
disambung di lapis tab RI).

| Tab | Status | Domain target `medicalrecord.*` |
|---|---|---|
| CPPT / SOAP | ✅ | `Cppt` |
| TTV | ✅ | `Observation` |
| Diagnosa | ✅ | `Diagnosa` |
| Daftar Order | ✅ | gabungan Resep/Lab/Rad |
| Order Lab | ✅ | `LabOrder` |
| Order Radiologi | ✅ | `RadOrder` |
| Order BMHP | ✅ | (order BMHP) |
| Resep & Obat | ✅ | `ResepOrder` |
| Serah Terima Shift | ✅ | `SerahTerima` |
| Rekonsiliasi Obat | ✅ | (rekonsiliasi) |
| Informed Consent | 🟡 | verifikasi persist di konteks RI |
| Asuhan Keperawatan | ❌ | `AsuhanKeperawatan` (+`AsuhanEvaluasi`) — wiring ada di IGD, belum di tab RI |
| Pemeriksaan Fisik | ❌ | `PemeriksaanFisik` (+`PenandaanAnatomi`) — per-sistem RI ditunda |
| Asesmen Awal | ❌ | anamnesis/asesmen (domain ada, tab RI mock) |
| Rencana Asuhan (Care Plan) | ❌ | belum ada domain — desain dulu |
| Intake / Output | ❌ | belum ada domain — desain dulu |
| Gizi & Nutrisi | ❌ | sebagian domain gizi — verifikasi |
| ICU Scoring | ❌ | belum ada domain (SOFA/APACHE) |
| Discharge Planning | ❌ | belum ada domain |
| Pasien Pulang | ❌ | `Disposisi` via transisi `complete` (pola IGD) — sambung ke RI |
| MAR | ❌ | turunan `ResepDispensing`/administrasi — desain |
| Konseling Obat | ❌ | belum ada domain |
| Konsultasi | 🟡 | verifikasi (domain konsultasi lintas-unit) |

**Urutan kerja disarankan** (by frekuensi pakai bangsal): Asuhan Keperawatan → Pemeriksaan Fisik →
Asesmen Awal → Pasien Pulang (Disposisi) → Intake/Output → Gizi → sisanya.

---

## 4. Anti-pattern (jangan)

- ❌ Menambah kolom `unit` ke tabel `medicalrecord.*` (langgar R1 + fondasi FHIR-aligned).
- ❌ Membuat tabel klinis paralel khusus RI yang menduplikasi domain IGD.
- ❌ Fork komponen tab shared jadi salinan RI (langgar R2 → drift).
- ❌ `prisma migrate dev` untuk perubahan data-preserving (reset/drift) — pakai R7.
- ❌ Memisah `Kunjungan` jadi tabel per-unit / mengubah model Encounter (nol ROI, rusak FHIR).
- ❌ Persist langsung dari komponen shared form tanpa lewat Service berlapis + gate.
