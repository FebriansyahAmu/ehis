# L27 · `riwayatPerjalananToClinicalImpression` — Riwayat Perjalanan Penyakit → ClinicalImpression

| | |
|---|---|
| Status | ✅ S6a 2026-11-18 — terkirim dari `Anamnesis.rps` (semua unit) |
| Kamar | **ClinicalImpression** `312850006` History of disorder |
| Playbook | RJ v7.0 bab 6 · RI v6.0 bab 6 · IGD v5.2 bab 8 "Pengiriman Data Riwayat Perjalanan Penyakit" (Tabel: SNOMED 312850006 + `summary` string) |
| Contoh resmi | RI bundle: `ClinicalImpression` 312850006 — status · code · subject · encounter · effectiveDateTime · date · assessor · summary (tanpa identifier) |

## Sumber EHIS

`medicalrecord.Anamnesis.rps` (Riwayat Penyakit Sekarang — narasi wajib di form Anamnesis IGD/RI/RJ). Anamnesis append-only
"latest wins" → **1 resource per kunjungan** (`localId` = `<kunjunganId>:riwayat-perjalanan`): simpan ulang = PUT resource yang sama.

## Pemetaan elemen

| Elemen | Aturan |
|---|---|
| `status` | `completed` · narasi dikosongkan / "-" di simpanan terbaru → `entered-in-error` (hanya bila pernah terkirim) |
| `code` | SNOMED `312850006` "History of disorder" (`CLINICAL_IMPRESSION.riwayatPerjalanan`) |
| `subject` · `encounter` | Patient · Encounter kunjungan |
| `effectiveDateTime` · `date` | waktu simpan anamnesis terbaru (UTC) |
| `assessor` | Practitioner penulis anamnesis (bila sudah onboarding FH1) |
| `summary` | `rps` (trim) |

Composition: rujukan di section **Perencanaan Perawatan** `18776-5` (mengikuti contoh resmi RI — bukan sub-section Anamnesis).

## Konflik sumber (FG-141)

Daftar elemen IGD bab 8 ikut menandai `investigation.code` dan `prognosisCodeableConcept` wajib, sedangkan contoh resmi RI tidak memuat
keduanya. Diikuti contoh resmi (payload tervalidasi); prognosis punya bab sendiri (RJ/RI bab 23, `20481000`) yang belum bersumber di EHIS.

## Jangan salah kamar

- Riwayat perjalanan penyakit **bukan** Condition `previous-condition` (itu L04 riwayat penyakit terdahulu).
- Rasional klinis (`TK000056`) dan prognosis (`20481000`) adalah ClinicalImpression lain — belum punya sumber terstruktur (⛔ README).

## Dibangun S6a

[links/riwayatPerjalanan.ts](../../src/lib/fhir/links/riwayatPerjalanan.ts) (rencana kirim/tarik) ·
[adapters/anamnesis.ts](../../src/lib/fhir/adapters/anamnesis.ts) `toFhirRiwayatPerjalanan` ·
[anamnesisSyncService](../../src/lib/services/fhir/anamnesisSyncService.ts) · test [koreksiS6a.test.ts](../../src/lib/fhir/links/koreksiS6a.test.ts).
