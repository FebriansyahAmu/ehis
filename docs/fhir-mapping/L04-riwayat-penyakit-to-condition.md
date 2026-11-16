# L04 · `riwayatPenyakitToCondition` — Riwayat Penyakit Pribadi → Condition

| | |
|---|---|
| Status | 📋 belum ada |
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

## Jangan salah kamar

- Riwayat penyakit **bukan** `encounter-diagnosis` (L13) dan bukan `problem-list-item` (L03).
- Riwayat penyakit keluarga → L05 (FamilyMemberHistory).
