# L04 · `riwayatPenyakitToCondition` — Riwayat Penyakit Pribadi → Condition

| | |
|---|---|
| Status | 🟡 S4d 2026-11-18 — terkirim untuk penyakit katalog ber-SNOMED (9/20) · sisanya ditahan (FG-127) · clinicalStatus belum dicatat (FG-128) |
| Kamar | **Condition** category `previous-condition` (system `http://terminology.kemkes.go.id`) |
| Playbook | RJ/IGD/RI §Anamnesis — Riwayat Penyakit Pribadi [V] |
| Contoh resmi | RI: `previous-condition sct|472969004 History of diabetes mellitus type 2` · `sct|161527007 H/O: asthma` |

## Sumber EHIS

`medicalrecord.AsesmenPenyakitDahulu.penyakit[]` (nama dari katalog `master.AsesmenItem` kategori
`PenyakitDahulu`, punya `snomedCode`) · `catatan`.
`AsesmenFaktorResiko.penyakit[]` (penyakit berisiko) → **tidak** dikirim di sini (bukan riwayat; tak ada kamar).

## Pemetaan elemen

| Elemen | Aturan |
|---|---|
| `category` | `previous-condition` |
| `code*` | SNOMED, ECL `< 417662000 |History of clinical finding in subject|` **atau** `< 443508001 |No history of clinical finding|` |
| `clinicalStatus` | `active` (masih diderita) / `inactive` (sudah sembuh) — system `condition-clinical` |
| `subject*` · `encounter*` | Patient · Encounter |
| `note` | `catatan` |

Satu penyakit = satu Condition. `localId` = `<asesmenId>:<kodeItem>`.

## Masalah kualitas data → keputusan D7

Record menyimpan **nama** penyakit (`String[]`), bukan kode item. Resolve nama → katalog saat kirim rapuh
(nama diubah admin = hilang). Usulan: simpan **kode item** (`PD-NNN`) di record; SNOMED diambil dari katalog.

Catatan kode: katalog harus berisi SNOMED konsep **"History of …"** (situation, turunan `417662000`), bukan
konsep penyakitnya langsung (mis. `44054006` Diabetes) — konsep penyakit langsung salah kamar untuk ECL ini.
Audit `master.AsesmenItem` kategori `PenyakitDahulu` sebelum dipakai.

`clinicalStatus` belum ada di sumber → default `active` atau tambah pilihan "masih/sudah sembuh" (usulan: tambah).

## Dibangun S4d (2026-11-18, D7 disetujui)

- **Sumber kode (D7):** kolom `penyakit_kode` sejajar `penyakit` (`""` = nama tak ada di katalog). Diturunkan **Service saat simpan**
  (cocok nama, trim + case-insensitive, di kategori `PenyakitDahulu`) — klien tidak mengirim kode. Baris lama di-backfill migrasi
  `20261118120000`. SNOMED dibaca dari katalog **saat kirim** (kode + display wajib berpasangan; display tidak dikarang).
- **localId** = `<kunjunganId>:riwayat-penyakit:<kodeItem>` (bukan id baris: sumber append-only "latest wins"). Penyakit yang hilang
  dari simpanan terbaru → `verificationStatus` entered-in-error (hanya bila pernah terkirim).
- **Elemen:** category `previous-condition` · code SNOMED katalog · subject · encounter · `recordedDate` = waktu simpan · `recorder` =
  pencatat (bila onboarding) · `note` = catatan. **`clinicalStatus` tidak diisi** — sumber belum mencatat masih/sudah sembuh (FG-128).
- **Issue `kode-kosong`:** nama di luar katalog · item katalog tanpa SNOMED.
- Composition: sub-section **Riwayat Penyakit Pribadi Terdahulu** `11348-0` "History of Past illness Narrative".

| Katalog | SNOMED (kamus lokal, gaya display contoh resmi) |
|---|---|
| PD-001 Hipertensi | `161501007` H/O: hypertension |
| PD-002 Diabetes Melitus | `161445009` H/O: diabetes mellitus |
| PD-004 Gagal Jantung Kongestif | `161505003` H/O: heart failure |
| PD-006 Asma Bronkial | `161527007` H/O: asthma (= contoh resmi RI) |
| PD-008 Tuberkulosis Paru | `161414005` H/O: tuberculosis |
| PD-013 Batu Saluran Kemih | `161548009` H/O: urinary stone |
| PD-015 Epilepsi | `161480008` H/O: epilepsy |
| PD-016 Gangguan Jiwa | `161464003` H/O: psychiatric disorder |
| PD-018 Rheumatoid Arthritis | `161567008` H/O: rheumatoid arthritis |
| PD lainnya | — tanpa padanan pasti di kamus lokal → ditahan (FG-127) |

Status aktif kode di rilis SNOMED terkini belum terverifikasi (FG-127).

## Jangan salah kamar

- Riwayat penyakit **bukan** `encounter-diagnosis` (L13) dan bukan `problem-list-item` (L03).
- Riwayat penyakit keluarga → L05 (FamilyMemberHistory).
