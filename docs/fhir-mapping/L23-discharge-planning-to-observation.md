# L23 · `dischargePlanningToObservation` — Perencanaan Pemulangan → Observation + CarePlan

| | |
|---|---|
| Status | 📋 belum ada |
| Kamar | **Observation** `survey` code `OC000055` + **CarePlan** category SNOMED `736372004` "Discharge care plan" |
| Playbook | RI §23 · IGD §22 Perencanaan Pemulangan Pasien [V] |
| Contoh resmi | IGD & RI: `Observation cat=[survey] clinical-term|OC000055` + `CarePlan cat=[736372004]` |

## Sumber EHIS

`medicalrecord.DischargeAsesmen` (latest-wins: tanggalRencanaKrs · kondisiPulang · caregiver · kebutuhanHomecare ·
jenisHomecare[] · kebutuhanAlatBantu · alatBantu[] · dukunganKeluarga · kepatuhanObatSebelumnya · riwayatReadmisi · catatan).

## Observation kriteria rencana pemulangan

| Elemen | Aturan |
|---|---|
| category | `survey` |
| `code` | `http://terminology.kemkes.go.id/CodeSystem/clinical-term` `OC000055` "Kriteria Pasien yang dilakukan Rencana Pemulangan" |
| `valueCodeableConcept` | satu dari: SNOMED `105436006` Elderly person · SNOMED `928000` Musculoskeletal disorder · clinical-term `OV000072` perawatan berkelanjutan/panjang · SNOMED `443430002` Requires assistance with all daily activities · clinical-term `OV000073` Tidak masuk kriteria |

**Masalah data (D15):** EHIS tidak mencatat "kriteria" ini secara eksplisit. Menurunkannya dari kolom lain
(umur, alat bantu, homecare) = tebakan. Usulan: tambah pilihan **"Kriteria rencana pemulangan"** (5 nilai playbook)
di form Asesmen Discharge.

## CarePlan pemulangan

| Elemen | Aturan |
|---|---|
| `status` · `intent` | `active` · `plan` |
| `category` | SNOMED `736372004` Discharge care plan |
| `title` | "Rencana Pemulangan" |
| `description` | ringkasan: rencana KRS · caregiver · homecare · alat bantu · catatan |
| `subject` · `encounter` · `author` | Patient · Encounter · pencatat |

`localId` = `<dischargeAsesmenId>:kriteria` · `<dischargeAsesmenId>:careplan`. Latest-wins → PUT resource yang sama.

## Jangan salah kamar

- Checklist dokumen pulang (`DischargeChecklist`) & edukasi (`DischargeEdukasi` → L15) **bukan** bagian resource ini.
- Kondisi saat pulang → L24, bukan `kondisiPulang` rencana di sini.
