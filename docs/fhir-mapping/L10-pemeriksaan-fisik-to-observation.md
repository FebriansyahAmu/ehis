# L10 · `pemeriksaanFisikToObservation` — Pemeriksaan Fisik Head-to-Toe → Observation

| | |
|---|---|
| Status | 🟡 S4d 2026-11-18 — 5/11 sistem terkirim (D12 tahap 1) · 6 ditahan (FG-131) · performer = pencatat (FG-130) |
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
(b) kirim hanya 5 sistem yang padan sekarang, sisanya ditahan. Usulan: **(b) dulu, (a) bertahap** — ✅ **disetujui 2026-11-18**.

## Dibangun S4d (2026-11-18)

- Peta di `PEMERIKSAAN_FISIK` (conceptMap, exhaustive atas 11 sistem): Kepala `10199-8` · Mata `10197-2` · Leher `11411-6` ·
  Toraks/Paru → Dada `11391-0` · Abdomen → Perut `10191-5` (display verbatim playbook RJ/RI Tabel 5 · IGD Tabel 6 + contoh RI).
- Sumber append-only "latest wins" → hanya pemeriksaan **terbaru** yang dikirim; **localId** = `<kunjunganId>:pemeriksaan-fisik:<sistem>`.
  Sistem padan yang dikosongkan di pemeriksaan terbaru → `status` entered-in-error (hanya bila pernah terkirim).
- Bentuk = contoh resmi RI: `exam` · `valueString` · `effectiveDateTime` = `issued` = waktu pemeriksaan · `performer` = **pencatat**
  (dokter pemeriksa hanya disimpan sebagai nama — FG-130).
- Ditahan (Issue): THT · Urogenital · Ekstremitas = `menunggu-keputusan` (pecah field); Jantung · Neurologi · Kulit = `di-luar-playbook`.
- Composition: sub-section **Pemeriksaan Fisik Head to Toe** `10187-3` "Review of systems Narrative - Reported" (di bawah Pemeriksaan Fisik).
- Catatan playbook (FG-132): kuku kaki `770805009` (RJ/RI) vs `77085009` (IGD); SNOMED bagian di `code` (RJ) vs `bodySite` (RI/IGD) —
  ikuti contoh RI (`bodySite`) saat field dipecah.
