# L23 · `dischargePlanningToObservation` — Perencanaan Pemulangan → Observation + CarePlan

| | |
|---|---|
| Status | 🟡 S4c 2026-11-18 — CarePlan `736372004` ✅ (localId per kunjungan) · Observation kriteria `OC000055` ditahan (D15, FG-119) |
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

`localId` = `<kunjunganId>:kriteria-pemulangan` · `<kunjunganId>:rencana-pemulangan` — **per kunjungan**, bukan id baris:
DischargeAsesmen append-only (tiap simpan = baris baru), jadi kunci baris akan membuat CarePlan ganda. Asesmen terakhir → PUT resource
yang sama. Title "Perencanaan Pemulangan Pasien" (contoh resmi); masuk section Composition "Kondisi Saat Meninggalkan RS" 10184-0 dan
"Rencana Tindak Lanjut" 8653-8 (seperti contoh RI).

## Jangan salah kamar

- Checklist dokumen pulang (`DischargeChecklist`) & edukasi (`DischargeEdukasi` → L15) **bukan** bagian resource ini.
- Kondisi saat pulang → L24, bukan `kondisiPulang` rencana di sini.
