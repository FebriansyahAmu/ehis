# L25 · `tindakLanjutToServiceRequest` — Rencana Tindak Lanjut (kontrol · rujuk · SPRI · konsultasi) → ServiceRequest

| | |
|---|---|
| Status | 🟡 S4c 2026-11-18 — kontrol · konsultasi · rujukan eksternal ✅ · SPRI ditahan (D8, FG-121) · Location poli belum dipetakan (FG-125) |
| Kamar | **ServiceRequest** category SNOMED `3457005` "Patient referral" (+ SR SPRI category Kemkes `inpatient-admission`) |
| Playbook | RJ/IGD/RI §Rencana Tindak Lanjut + §Instruksi Tindak Lanjut & Sarana Transportasi Rujuk [V] |
| Contoh resmi | RJ: `ServiceRequest cat=[3457005] sct|737481003 Inpatient care management` · RI: `737492002` + `185389009 Follow-up visit` |

## Sumber EHIS → kode

| Sumber | Jenis | `code` (SNOMED) | Lokasi/tujuan |
|---|---|---|---|
| `JadwalKontrol` | Rujukan internal — kontrol ulang | `185389009` Follow-up visit | `locationCode` `OF` (poli) atau `locationReference` Location poli · `occurrenceDateTime` = tanggal kontrol |
| `Disposisi` Rawat_Inap · `encounter.Spri` | Rujukan internal — rawat inap | `737481003` Inpatient care management | + **SR kedua SPRI**: system `http://terminology.kemkes.go.id` category `inpatient-admission` code `spri` [V RJ] |
| `Konsultasi` | Rujukan internal — konsultasi | `11429006` Consultation | SMF tujuan (teks) |
| `RujukanEksternal` (rawat jalan) | Rujukan eksternal | `737492002` Outpatient care management | `locationCode` `HOSP`/`PC` + `text` faskes |
| `RujukanEksternal` (rawat inap) | Rujukan eksternal | `737481003` Inpatient care management | `locationCode` `HOSP` |
| Sarana transportasi rujuk | — | — | `locationCode` `AMB` Ambulance (v3-RoleCode) |

System `locationCode`: `http://terminology.hl7.org/CodeSystem/v3-RoleCode`.

## Elemen wajib

`status` (`active`/`completed`/`revoked` saat batal) · `intent` (`order`/`plan`) · `code` · `subject` · `encounter` ·
`performer` (untuk instruksi tindak lanjut) · identifier `…/servicerequest/{Org_id}` · `authoredOn` · `requester`
(dokter) · `patientInstruction` = kontak keadaan darurat · `reasonReference` Condition diagnosis bila ada.

`localId` = `<sumberTabel>:<id>` (mis. `jadwal-kontrol:<id>`, `spri:<id>`) — beda tabel, kunci tidak boleh bentrok.

## Dibangun S4c (2026-11-18, verbatim playbook RJ Tabel 28/30)

| Sumber | `code` | status | Lokasi · waktu |
|---|---|---|---|
| JadwalKontrol | `185389009` Follow-up visit, text "Kontrol <poli> — <dokter>" | terhapus → `revoked` | `locationCode` `OF` "Outpatient facility" + text poli · `occurrenceDateTime` = tanggal kontrol · performer = dokter kontrol (bila onboarding) |
| Konsultasi | `11429006` Consultation, text "Konsultasi <SMF>" | Selesai → `completed`, terhapus → `revoked` | priority CITO→stat · Urgen→urgent · performer = konsultan |
| RujukanEksternal | `jnsPelayanan` "1" → `737481003` · "2" → `737492002` (lainnya = Issue) | terhapus → `revoked` | `HOSP` "Hospital" · `tipeRujukan` "2" (rujuk balik) → `PC` "Primary care clinic" · `occurrenceDateTime` = tgl rencana kunjungan · reasonCode = diagnosa rujukan |
| Spri | — | ditahan (Issue `menunggu-keputusan`, D8) | — |

Semua: `intent` `original-order` · category `3457005` "Patient referral" · identifier `servicerequest/{Org_id}` = nomor dokumen ·
`reasonCode` ICD-10 diagnosis Utama · `patientInstruction` = instruksi + "Dalam keadaan darurat dapat menghubungi <RS> di nomor
<telp Profil RS>". Semua masuk section Composition "Rencana Tindak Lanjut" 8653-8.

## Tautan antar-Encounter (D8 / FG-34)

Encounter RI baru (L01) `basedOn` → SR SPRI ini. Dengan begitu kunjungan IGD/RJ → RI tertaut tanpa mengubah class.

## Jangan salah kamar

- Rencana kontrol **bukan** Appointment (modul scheduling SatuSehat terpisah) dan bukan Encounter baru.
- Order lab/rad juga ServiceRequest tetapi category berbeda (`108252007`/`363679005`, L16/L17) — category menentukan kamar.
- Surat rujukan BPJS (No. Rujukan) tetap di modul BPJS; di sini hanya teks/identifier pendukung.
