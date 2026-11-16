# L10 · `pemeriksaanFisikToObservation` — Pemeriksaan Fisik Head-to-Toe → Observation

| | |
|---|---|
| Status | 📋 belum ada |
| Kamar | **Observation** category `exam` · LOINC per bagian tubuh · `valueString` (narasi temuan) |
| Playbook | RJ/IGD/RI §Pemeriksaan Fisik — Head to Toe [V IGD] |
| Contoh resmi | RI bundle: 28 Observation `exam` "Physical findings of … Narrative" |

## Sumber EHIS

`medicalrecord.PemeriksaanFisik.sistem` (JSON, 11 sistem: `kepala` · `mata` · `tht` · `leher` · `toraks_paru` ·
`jantung` · `abdomen` · `urogenital` · `ekstremitas` · `neurologi` · `kulit`) · `waktuPemeriksaan` · dokter pemeriksa.
`ku`/`gizi`/`mobilitas`/`bodyMarkings` tidak punya kamar → tidak dikirim. `kesadaran` → L09.

## ConceptMap sistem EHIS → kode playbook

| Sistem EHIS | LOINC playbook | Status |
|---|---|---|
| `kepala` | `10199-8` Head | ✅ padan |
| `mata` | `10197-2` Eye | ✅ padan |
| `leher` | `11411-6` Neck | ✅ padan |
| `toraks_paru` | `11391-0` Chest | ✅ padan |
| `abdomen` | `10191-5` Abdomen | ✅ padan |
| `tht` | Telinga `10195-6` · Hidung `10203-8` · Tenggorokan `56867-5` | ⚠️ 1 teks EHIS = 3 kamar → **pecah field** (D12) atau jangan kirim |
| `urogenital` | Genital `11400-9` | ⚠️ sebagian (temuan CVA/kandung kemih bukan genital) → D12 |
| `ekstremitas` | Lengan atas `11386-0` · lengan bawah `11398-5` · tangan `11404-1` · tungkai atas `11414-0` · tungkai bawah `11389-4` · kaki `11397-7` · … | ⚠️ 1 teks = banyak kamar → D12 |
| `jantung` | tidak ada di daftar playbook | ⛔ tahan |
| `neurologi` | tidak ada di daftar playbook | ⛔ tahan |
| `kulit` | tidak ada di daftar playbook | ⛔ tahan |

Daftar lengkap kode playbook (28 bagian, termasuk bodySite SNOMED untuk langit-langit/tonsil/anus/jari/kuku/
persendian) ada di playbook IGD §5c; kode yang **tidak** ada di daftar itu tidak boleh dikarang.

## Elemen

`status` (`final`) · category `exam` · `code` · `subject` · `encounter` · `performer` (dokter pemeriksa) ·
`effectiveDateTime` = `waktuPemeriksaan` · `valueString` = teks temuan sistem.
`localId` = `<pemeriksaanFisikId>:<sistem>`.

## Gerbang pra-kirim

Teks temuan tidak kosong. Sistem yang hanya berisi teks "normal" default yang tidak diubah petugas — tetap
dikirim (itu temuan normal yang didokumentasikan), selama petugas menyimpan.

## Keputusan D12

Pilih salah satu: (a) form head-to-toe dipecah mengikuti bagian playbook (paling rapi, perubahan UI), atau
(b) kirim hanya 5 sistem yang padan sekarang, sisanya ditahan. Usulan: **(b) dulu, (a) bertahap**.
