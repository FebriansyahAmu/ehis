# FHIR Mapping — EMR EHIS → SatuSehat (indeks link)

> **Status: DRAFT riset 2026-11-17 — menunggu persetujuan, lalu flow & coding.**
> Tujuan: setiap data rekam medis EHIS masuk ke **resource + kategori + kode yang benar** di SatuSehat
> ("tidak salah kamar"), dengan performa dan kualitas data yang konsisten.
>
> - Arsitektur & best practice (jawaban "pakai procedure DB atau tidak") → **[ARSITEKTUR.md](ARSITEKTUR.md)**
> - Flow eksekusi (pemicu · urutan resource · gerbang readiness · branch per langkah S1–S5) → **[FLOW.md](FLOW.md)** — S1 Fondasi ✅ 2026-11-17
> - Aturan connector → [../FHIR-RULES.md](../FHIR-RULES.md) · gap implementasi → [../FHIR-GAP.md](../FHIR-GAP.md) · roadmap → [../../TODO-FHIR.md](../../TODO-FHIR.md)

## Sumber riset (first-party saja)

| Sumber | Versi | Dipakai untuk |
|---|---|---|
| Playbook **Resume Medis – Rawat Jalan** `satusehat.kemkes.go.id/platform/docs/id/interoperability/rme-rawat-jalan/` | v7.0 · 10 Jan 2026 | RJ (class `AMB`) |
| Playbook **Pelayanan IGD** `…/interoperability/igd/` | v5.2 · 30 Okt 2025 | IGD (class `EMER`), triase, asesmen awal, skrining |
| Playbook **Rawat Inap** `…/interoperability/rawat-inap-new/` | v6.0 · 10 Jan 2026 | RI (class `IMP`), kelas/titip rawat, MedicationAdministration |
| Bundle transaction resmi (Postman SatuSehat) [`../fhir-postman/bundles/`](../fhir-postman/bundles/) | ditarik 2026-08-19 | contoh payload utuh RJ (25 entry) · IGD (29) · RI (141) |

Catatan riset: halaman playbook sangat panjang (±400–470 rb karakter); bagian yang dikutip di dokumen link
ditandai **[V]** bila dibaca verbatim. Yang tidak ditemukan di playbook (mis. GCS, Barthel, kode
`participant.type`) ditandai **di luar playbook** → tunggu uji sandbox sebelum dikirim.
Kunci Postman API di `.env` sudah tidak valid (401, 2026-11-17) → refresh contoh resmi butuh kunci baru.

## Legenda status

| Simbol | Arti |
|---|---|
| ✅ | Sudah ada (FH3–FH7 / langkah S1–S5) dan sesuai playbook |
| ⚠️ | Sudah ada tapi **salah kamar / kode / pola** — perlu koreksi |
| 📋 | Belum ada, **sumber data EHIS sudah ada** → tinggal dibangun |
| ⛔ | Ada di playbook, **EHIS belum punya sumber data** |
| 🚫 | Data EHIS yang **tidak punya kamar** di SatuSehat → sengaja tidak dikirim |

## Peta kamar — semua link

| ID | Link | Sumber EHIS | Resource SatuSehat (kamar) | Unit | Status |
|---|---|---|---|---|---|
| [L01](L01-kunjungan-to-encounter.md) | `kunjunganToEncounter` | `encounter.Kunjungan` + `BedAllocation` + `Disposisi` | **Encounter** (class AMB/EMER/IMP) | semua | ✅ S2 (riwayat lokasi menunggu fitur pindah ruangan, FG-30) |
| [L02](L02-triase-to-observation.md) | `triaseToObservation` | `medicalrecord.Triase` | **Observation** `survey` (transportasi · surat rujukan · CTAS) | IGD | 📋 |
| [L03](L03-keluhan-to-condition.md) | `keluhanToCondition` | `Anamnesis.keluhanUtama` · `Triase.keluhanUtama/gejalaPenyerta` | **Condition** `chief-complaint` / `problem-list-item` + `Encounter.diagnosis` **CC** | semua | ✅ S2 keluhan utama · 📋 keluhan penyerta (ditunda bersama D2) |
| [L04](L04-riwayat-penyakit-to-condition.md) | `riwayatPenyakitToCondition` | `AsesmenPenyakitDahulu` | **Condition** `previous-condition` | semua | 📋 |
| [L05](L05-riwayat-keluarga-to-familymemberhistory.md) | `riwayatKeluargaToFamilyMemberHistory` | `AsesmenPenyakitKeluarga(+Item)` | **FamilyMemberHistory** | semua | 📋 |
| [L06](L06-alergi-to-allergyintolerance.md) | `alergiToAllergyIntolerance` | `AsesmenAlergi` | **AllergyIntolerance** | semua | ⚠️ |
| [L07](L07-riwayat-obat-to-medicationstatement.md) | `riwayatObatToMedicationStatement` | `AsesmenObat(+Item)` | **MedicationStatement** | semua | 📋 |
| [L08](L08-ttv-to-observation.md) | `ttvToObservation` | `medicalrecord.Observation` (TTV) | **Observation** `vital-signs` | semua | ⚠️ |
| [L09](L09-kesadaran-to-observation.md) | `kesadaranToObservation` | `Triase.avpu` · `Observation.statusKesadaran` | **Observation** `exam` 67775-7 | semua | 📋 |
| [L10](L10-pemeriksaan-fisik-to-observation.md) | `pemeriksaanFisikToObservation` | `PemeriksaanFisik.sistem` (head-to-toe) | **Observation** `exam` LOINC per bagian tubuh | semua | 📋 |
| [L11](L11-nyeri-to-observation.md) | `nyeriToObservation` | `Observation.skalaNyeri` + `PenilaianNyeri` | **Observation** `survey` 22253000 + `hasMember` NRS | semua | 📋 |
| [L12](L12-penilaian-to-observation.md) | `penilaianToObservation` | `PenilaianSkala` · `PenilaianStatus` | **Observation** `exam`/`survey` (Morse · Humpty Dumpty · Edmonson · psikologis) | semua | 📋 |
| [L13](L13-diagnosa-to-condition.md) | `diagnosaToCondition` | `medicalrecord.Diagnosa` | **Condition** `encounter-diagnosis` + `Encounter.diagnosis` | semua | ⚠️ |
| [L14](L14-tindakan-to-procedure.md) | `tindakanToProcedure` | `DiagnosaProsedur` · `TindakanMedis` | **Procedure** (ICD-9-CM, category) | semua | ⚠️ |
| [L15](L15-edukasi-to-procedure.md) | `edukasiToProcedure` | `DischargeEdukasi` · `AsesmenEdukasiPasien` | **Procedure** `409073007` Education | semua | 📋 |
| [L16](L16-lab-to-diagnostic.md) | `labToDiagnostic` | `LabOrder/Item` · `LabResult/Value` | **ServiceRequest · Specimen · Observation · DiagnosticReport** | semua | ⚠️ |
| [L17](L17-rad-to-diagnostic.md) | `radToDiagnostic` | `RadOrder/Item` · `RadResult` | **ServiceRequest · ImagingStudy · Observation · DiagnosticReport** | semua | ⚠️ |
| [L18](L18-resep-to-medicationrequest.md) | `resepToMedicationRequest` | `ResepOrder/Item` + `master.Obat` | **Medication + MedicationRequest** | semua | ⚠️ |
| [L19](L19-telaah-to-questionnaireresponse.md) | `telaahToQuestionnaireResponse` | `ResepTelaah` | **QuestionnaireResponse** `Q0007` | semua | 📋 |
| [L20](L20-dispensing-to-medicationdispense.md) | `dispensingToMedicationDispense` | `ResepDispensing` | **MedicationDispense** (+Medication `contained`) | semua | ⚠️ |
| [L21](L21-mar-to-medicationadministration.md) | `marToMedicationAdministration` | `MarEntry` | **MedicationAdministration** | RI (IGD) | 📋 |
| [L22](L22-careplan-to-goal-careplan.md) | `carePlanToGoalCarePlan` | `CarePlanMasalah/Goal` | **Goal** `nursing` + **CarePlan** | RI | 📋 |
| [L23](L23-discharge-planning-to-observation.md) | `dischargePlanningToObservation` | `DischargeAsesmen` | **Observation** OC000055 + **CarePlan** 736372004 | RI · IGD | 📋 |
| [L24](L24-disposisi-to-kondisi-pulang.md) | `disposisiToKondisiPulang` | `Disposisi` | **Condition** kondisi pulang + `Encounter.hospitalization.dischargeDisposition` | semua | ✅ S2 |
| [L25](L25-tindak-lanjut-to-servicerequest.md) | `tindakLanjutToServiceRequest` | `JadwalKontrol` · `RujukanEksternal` · `Spri` · `Konsultasi` | **ServiceRequest** `3457005` (+ SPRI `inpatient-admission`) | semua | 📋 |
| [L26](L26-resume-to-composition.md) | `resumeToComposition` | `ResumeMedik` | **Composition** (type per unit) | semua | ⚠️ |

### ⛔ Ada di playbook, EHIS belum punya sumber terstruktur

| Kamar SatuSehat | Isi | Catatan |
|---|---|---|
| ClinicalImpression `312850006` | Riwayat perjalanan penyakit | Narasi ada di CPPT/Resume, tapi belum field terstruktur |
| ClinicalImpression `TK000056` | Rasional klinis | — |
| ClinicalImpression `20481000` | Prognosis (baik/dubia ad bonam/dubia ad malam/buruk) | Kandidat field baru di Disposisi/Resume |
| RiskAssessment | Penilaian risiko penyakit | — |
| NutritionOrder | Diet (proposal/order) | Belum ada domain order diet |
| Specimen | Data sampel lab | Pengambilan sampel di luar aplikasi (FG-53) |
| ImagingStudy | DICOM study | Butuh PACS/DICOM router (FG-54) |
| Device/DeviceRequest/SupplyDelivery | Alkes | Kandidat dari `BmhpOrder` — fase lanjut |
| QuestionnaireResponse `Q0008` | Skrining batuk (IGD) | Kandidat dari `AsesmenTuberkulosis` — perlu cek kecocokan item |
| Encounter `extension` EncounterToFacility | Status pengunjung `new/returning/unknown` | Bisa diturunkan dari riwayat kunjungan pasien; system URL belum ditemukan di playbook |

### 🚫 Data EHIS yang sengaja tidak dikirim

| Sumber EHIS | Alasan |
|---|---|
| `Cppt` | Catatan naratif per PPA; tak ada kamar khusus. Isinya hanya bahan narasi Composition ("Perjalanan Kunjungan") bila dipakai |
| `SerahTerima` · `IntakeOutput` · `PenandaanAnatomi/Gambar` · `AsuhanEvaluasi` | Dokumentasi internal / di luar playbook |
| `AsuhanKeperawatan` (SDKI) | Tidak ada kamar diagnosa keperawatan di playbook; tujuan keperawatan dikirim lewat L22 (Goal `nursing`) |
| `InformedConsent` | Menunggu modul Consent (FG-09) |
| `Rekonsiliasi` | Duplikat L07 (riwayat obat) — sumber tunggal = AsesmenObat |
| `AsesmenGizi` · `PenilaianPediatrik` · `PenilaianKomposit` · `AsesmenObstetri/Ginekologi` | Milik **modul penerapan** tematik (Gizi, Tumbuh Kembang, Registri Jantung/Kanker, ANC) — fase lanjut, bukan 3 modul pelayanan dasar |
| Surat sakit/sehat · billing | Bukan rekam klinis SatuSehat (klaim = modul terpisah, ditunda) |

## Keputusan yang butuh persetujuan (sebelum coding)

| # | Keputusan | Usulan | Link |
|---|---|---|---|
| D1 | Arsitektur mapping | Mapper TS murni per link + ConceptMap + gerbang; **bukan** stored procedure | [ARSITEKTUR](ARSITEKTUR.md) |
| D2 | Triase → CTAS 6 nilai (`75910-0`) | ⏸ **Ditunda (keputusan user 2026-11-17)** — L02 tidak dikerjakan dulu. Usulan tersimpan di L02: kode dari level protokol paling gawat (1:1 CTAS), dicek terhadap pita warna P1–P4; P4 Hitam ≠ otomatis DOA | L02 |
| D3 | Sumber tingkat kesadaran | IGD: `Triase.avpu` (padanan langsung). TTV: `statusKesadaran` dipetakan, **"Apatis" belum punya padanan** → butuh keputusan klinis | L09 |
| D4 | Keluhan utama wajib berkode SNOMED | ✅ **Dikerjakan S2 (2026-11-17, atas usulan ini):** picker SNOMED di **Anamnesis** IGD/RI/RJ dari subset terkurasi master asesmen kategori **Keluhan Utama** (54 kode, admin dapat menambah); teks bebas tetap (→ `note`). Triase tidak diberi picker (L02 ditunda, D2) | L03 |
| D5 | GCS, SpO₂, Barthel, Braden (di luar playbook) | Tahan sampai uji sandbox; jangan masuk Bundle atomik dulu (1 tolak = 1 kunjungan gagal, FG-61) | L08 · L12 |
| D6 | Pola Medication | Ikuti playbook: **Medication per paket** (contained/entry bersama Request/Dispense), bukan 1 Medication per master obat | L18 · L20 |
| D7 | Kode riwayat penyakit/keluarga/obat | Simpan **kode item katalog** (bukan nama) di record asesmen | L04 · L05 · L07 |
| D8 | IGD/RJ → Rawat Inap | `dischargeDisposition` tak punya kode "rawat inap" → kirim ServiceRequest `737481003` + SPRI; Encounter RI `basedOn` SPRI (FG-34) | L24 · L25 |
| D9 | Format waktu | Kirim UTC `+00:00` sesuai playbook (sekarang `+07:00`) | semua |
| D10 | "Cara Masuk" Triase mencampur mobilisasi & transportasi | Tambah field **Sarana Transportasi** (Ambulans/Mobil/Motor/Lain-lain) | L02 |
| D11 | Kondisi pulang EHIS (Baik/Sedang/Buruk/Kritis) ≠ playbook (Stabil/Tidak stabil/Perbaikan) | ✅ **Diputuskan 2026-11-17:** form EHIS **tetap** (Baik/Sedang/Buruk/Kritis); disesuaikan ke kode SatuSehat lewat ConceptMap saat kirim | L24 |
| D12 | Head-to-toe EHIS 11 sistem ≠ 28 bagian playbook | Kirim 5 sistem yang padan dulu; pecah field bertahap | L10 |
| D13 | Braden → skrining dekubitus (`285304000` boolean) | Ambang skor ditetapkan klinis sebelum diturunkan | L12 |
| D14 | Order rad multi-pemeriksaan, ekspertise 1 laporan | SR per item; Observation+DR hanya untuk order 1 pemeriksaan | L17 |
| D15 | Kriteria rencana pemulangan (`OC000055`) tak dicatat | Tambah pilihan 5 nilai playbook di Asesmen Discharge | L23 |
| D16 | Batas meninggal 48 jam untuk RI dari IGD | Hitung dari masuk kunjungan ini atau dari masuk IGD — konfirmasi. **Sementara (S2): dari masuk kunjungan ini** | L24 |
| D17 | Form Pasien Pulang IGD/RI tidak menilai kondisi umum (diturunkan dari status: "Dirujuk ke faskes lain", "Pulang atas permintaan sendiri", …) | Kembalikan pilihan kondisi (Baik/Sedang/Buruk/Kritis — kosakata D11) untuk Rujuk & APS; sampai itu, Condition kondisi pulang tidak dikirim untuk kasus tsb (Issue L24) | L24 |

## Perubahan di sumber data yang dibutuhkan (kualitas data)

| Perubahan | Untuk link | Jenis |
|---|---|---|
| ~~Picker SNOMED keluhan utama (Anamnesis + Triase)~~ ✅ S2 — Anamnesis (Triase ditunda bersama D2) | L03 | UI + kolom kode |
| Pilihan kondisi umum di form Pasien Pulang untuk Rujuk/APS (D17) | L24 | UI kecil |
| Simpan `kode` item katalog asesmen (bukan nama) di riwayat penyakit/keluarga | L04 · L05 | kolom + UI kecil |
| Allergen obat → kode **KFA BZA (91…)** (`AsesmenAlergi.bzaKode` sudah ada) | L06 | adapter |
| Riwayat obat pakai picker KFA (92/93) | L07 | UI + kolom |
| Kolom kode FHIR (LOINC/OC) di `master.SkalaInstrument` | L12 | kolom master |
| Kode SNOMED topik di master topik edukasi | L15 | kolom master |
| Isi LOINC katalog Lab/Rad (UI sudah ada, FG-52) | L16 · L17 | data |
| Field prognosis (opsional) | ⛔ ClinicalImpression | kolom baru |

## Urutan kerja yang diusulkan (setelah disetujui)

1. ✅ **Fondasi** — `links/` registry + `conceptMap.ts` + snapshot loader + gerbang `readiness` + waktu UTC (tanpa mengubah perilaku kirim).
2. ✅ **Blocker Encounter finished** — L03 (keluhan CC) + koreksi L01 (diagnosis CC, discharge `exp-*`) + L24.
3. **Koreksi kamar yang sudah ada** — L08 (nyeri/GCS keluar dari vital-signs), L06 (KFA alergi obat), L14 (category), L26 (type per unit), L18/L20 (pola Medication).
4. **Link baru bersumber siap** — L02, L09, L11, L12, L19, L21, L23, L25, L04, L05, L10, L15, L22.
5. **Link yang butuh perubahan entry** — L07 (picker KFA), lalu ⛔ ClinicalImpression/NutritionOrder bila diputuskan.

Setiap langkah = branch sendiri, DoD per [ENGINEERING-RULES](../ENGINEERING-RULES.md) (bila belum ada di `main`, lihat branch `chore/engineering-rules`).
