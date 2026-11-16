# L05 · `riwayatKeluargaToFamilyMemberHistory` — Riwayat Penyakit Keluarga → FamilyMemberHistory

| | |
|---|---|
| Status | 📋 belum ada |
| Kamar | **FamilyMemberHistory** |
| Playbook | RJ/IGD/RI §Anamnesis — Riwayat Penyakit Keluarga [V] |
| Contoh resmi | RI bundle: 1 entry `FamilyMemberHistory(completed)` |

## Sumber EHIS

`AsesmenPenyakitKeluarga` + `AsesmenPenyakitKeluargaItem` (anggota · penyakit[] · keterangan). Anggota &
penyakit dari katalog `master.AsesmenItem` (`AnggotaKeluarga`, `PenyakitKeluarga`).

## Pemetaan elemen (`*` wajib)

| Elemen | Aturan |
|---|---|
| `status*` | `completed` |
| `patient*` | Patient |
| `relationship*` | system `http://terminology.hl7.org/CodeSystem/v3-RoleCode` — playbook memakai `FAMMEMB` "Family member"; boleh lebih spesifik (`FTH`, `MTH`, `SIB`, …) bila anggota diketahui |
| `condition.code*` | SNOMED, ECL `< 416471007 |Family history of clinical finding|` atau `< 160266009 |No family history of clinical finding|` |
| `condition.outcome` | SNOMED, ECL `< 418138009` (opsional) |
| `condition.contributedToDeath` · `deceasedBoolean` | boolean (opsional, belum ada di sumber) |
| `note` | `keterangan` |

Satu item anggota = satu FamilyMemberHistory, berisi N `condition`. `localId` = `<itemId>`.

## ConceptMap anggota keluarga (usulan)

| EHIS (katalog AnggotaKeluarga) | v3-RoleCode |
|---|---|
| Ayah | `FTH` |
| Ibu | `MTH` |
| Saudara kandung | `SIB` |
| Anak | `CHILD` |
| Kakek/Nenek | `GRPRN` |
| lainnya / tak spesifik | `FAMMEMB` |

## Masalah kualitas data

Sama dengan L04 (D7): simpan kode item, bukan nama; katalog `PenyakitKeluarga` harus berisi konsep
**"Family history of …"** (turunan `416471007`), bukan konsep penyakit langsung.

## Jangan salah kamar

Penyakit keluarga **bukan** Condition milik pasien — jangan dikirim sebagai Condition `previous-condition`.
