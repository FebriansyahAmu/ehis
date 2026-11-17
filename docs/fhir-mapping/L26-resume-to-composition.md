# L26 · `resumeToComposition` — Resume Medis → Composition

| | |
|---|---|
| Status | ✅ dikoreksi S3 2026-11-17 — `type` per unit, section bersarang ber-`entry` (keluhan · alergi · tanda vital · lab · rad · diagnosis akhir · tindakan · obat/obat pulang · kondisi pulang) + narasi Perjalanan Kunjungan, `attester` saat TTE. Section lain menyusul bersama link-nya (S4) |
| Kamar | **Composition** · category LOINC `LP173421-1` "Report" · `type` **per unit** |
| Playbook | RJ §Resume Medis (Tabel 35) · IGD §28 · RI §30 [V] |
| Contoh resmi | RI bundle: `Composition type 34105-7 Hospital Discharge summary` |
| Bergantung | **semua link** — dikirim terakhir; section merujuk resource yang sudah ada |

## Sumber EHIS

`medicalrecord.ResumeMedik` (RI/RJ; append-only latest-wins: ringkasanKlinis · dataKlinis JSON snapshot ·
kondisiMasuk/Pulang · TTE `tteSignedBy/At`). Unit IGD: cek sumber resume IGD (`ResumePulang`) saat coding.

## `type` per unit [V]

| Unit | LOINC `type` | Display |
|---|---|---|
| Rawat Jalan | `88645-7` | Outpatient hospital Discharge summary |
| IGD | `97663-9` | Emergency medicine Emergency department Discharge summary |
| Rawat Inap | `34105-7` | Hospital Discharge summary |

Sekarang: `18842-5` untuk semua unit → ❌ ganti.

## Elemen wajib [V]

`status` (`preliminary` sebelum TTE · `final` sesudah) · `type` · `subject` · `date` · `author[]` (DPJP) · `title` ·
`attester.mode` (`legal`, party = DPJP penanda tangan TTE, time = `tteSignedAt`) · `relatesTo` (hanya revisi:
`replaces` → Composition sebelumnya) · `encounter` · `custodian` Organization.

## Section → kode → resource entry

| Section | Kode | `entry` dari link |
|---|---|---|
| Anamnesis | Kemkes `TK000003` | — (induk) |
| ↳ Keluhan utama | LOINC `10154-3` | L03 (CC) |
| ↳ Keluhan penyerta | `11450-4` | L03 (penyerta) |
| ↳ Riwayat alergi | `48765-2` | L06 |
| ↳ Riwayat penyakit dahulu / sekarang | `11348-0` / `10164-2` | L04 (`inactive` / `active`) |
| ↳ Riwayat penyakit keluarga | `10157-6` | L05 |
| ↳ Riwayat pengobatan | `10160-0` | L07 |
| Pemeriksaan fisik | Kemkes `TK000007` | — |
| ↳ Tanda vital | `8716-3` | L08 · L09 |
| ↳ Head to toe | `10187-3` | L10 |
| Pemeriksaan fungsional | `47420-5` | L12 |
| Perencanaan perawatan | `18776-5` | L22 |
| Pemeriksaan penunjang | Kemkes `TK000009` → Lab `11502-2` · Rad `18782-3` | L16 · L17 |
| Diagnosis | Kemkes `TK000004` → Awal `42347-5` · Akhir `78375-3` | L13 (`AD` / `DD`) |
| Tindakan/prosedur | Kemkes `TK000005` | L14 |
| Farmasi | Kemkes `TK000013` → Obat saat kunjungan `42346-7` · Obat pulang `75311-1` | L18 · L20 · L21 |
| Diet | `42344-2` rekomendasi · `61144-2` diberikan | ⛔ NutritionOrder |
| Edukasi | `34895-3` | L15 |
| Kondisi saat meninggalkan RS | `10184-0` | L24 |
| Rencana tindak lanjut | `8653-8` | L23 · L25 |
| Perjalanan kunjungan | `8648-8` | narasi `ringkasanKlinis` (`text.status` `generated`) ✅ |
| IGD saja: Asesmen awal IGD · Skrining | `97667-0` · Kemkes `TK000129` | L02 · L09 · L11 · L12 |

Kemkes system: `http://terminology.kemkes.go.id`. Section tanpa resource terkirim → **dihilangkan** (bukan diisi
teks kosong). Sekarang section diagnosis memakai `11535-2` → ganti `78375-3`.

## Gerbang pra-kirim

Encounter sudah `finished` · resource yang dirujuk sudah ber-IHS id (atau ada di Bundle yang sama) · TTE ada
untuk status `final` (FG-64).

## Jangan salah kamar

Composition **tidak** membawa data baru — hanya merujuk resource dari link lain + narasi perjalanan. Data yang
hanya ada di narasi resume (tanpa link) tidak boleh dijadikan "satu-satunya sumber" di SatuSehat.
