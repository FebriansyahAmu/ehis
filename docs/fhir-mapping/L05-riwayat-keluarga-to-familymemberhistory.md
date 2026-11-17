# L05 · `riwayatKeluargaToFamilyMemberHistory` — Riwayat Penyakit Keluarga → FamilyMemberHistory

| | |
|---|---|
| Status | 🟡 S4d 2026-11-18 — terkirim per anggota untuk penyakit katalog ber-SNOMED (5/10) · relationship FAMMEMB (FG-129) |
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

## Dibangun S4d (2026-11-18, D7 disetujui)

- **Sumber kode (D7):** `anggota_kode` (AK-NNN) + `penyakit_kode` sejajar `penyakit`, diturunkan Service saat simpan (pola L04).
- **localId** = `<kunjunganId>:riwayat-keluarga:<kodeAnggota | nama-anggota>`; anggota sama dalam satu simpanan digabung. Anggota yang
  hilang dari simpanan terbaru → `status` entered-in-error (hanya bila pernah terkirim).
- **Elemen:** `status` completed · patient · `date` = waktu simpan · `relationship` = **`FAMMEMB` "Family member"** (satu-satunya kode di
  tabel playbook) + `text` = anggota EHIS (Ayah/Ibu/…) · `condition[].code` SNOMED katalog · `note` = keterangan. Tanpa encounter (R4).
  ConceptMap anggota → v3-RoleCode spesifik (usulan di atas) **belum dipakai** (FG-129).
- Anggota tanpa satu pun penyakit ber-SNOMED tidak dikirim; tiap penyakit tak berkode = Issue `kode-kosong`.
- Composition: sub-section **Riwayat Penyakit Keluarga** `10157-6` "History of family member diseases Narrative".

| Katalog | SNOMED |
|---|---|
| PK-001 Hipertensi | `160357008` FH: Hypertension |
| PK-002 Diabetes Melitus | `160303001` FH: Diabetes mellitus |
| PK-006 Tuberkulosis | `160280002` FH: Tuberculosis |
| PK-007 Asma | `160377001` FH: Asthma |
| PK-008 Thalassemia | `160319008` FH: Thalassemia |
| PK-003 Jantung · 004 Stroke · 005 Kanker · 009 Gangguan Jiwa · 010 HIV | — ditahan (FG-127) |

## Jangan salah kamar

Penyakit keluarga **bukan** Condition milik pasien — jangan dikirim sebagai Condition `previous-condition`.
