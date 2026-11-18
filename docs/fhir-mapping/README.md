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
| [L04](L04-riwayat-penyakit-to-condition.md) | `riwayatPenyakitToCondition` | `AsesmenPenyakitDahulu` | **Condition** `previous-condition` | semua | 🟡 S4d (9/20 penyakit katalog ber-SNOMED, sisanya ditahan FG-127) |
| [L05](L05-riwayat-keluarga-to-familymemberhistory.md) | `riwayatKeluargaToFamilyMemberHistory` | `AsesmenPenyakitKeluarga(+Item)` | **FamilyMemberHistory** | semua | 🟡 S4d (5/10 penyakit keluarga ber-SNOMED; relationship FAMMEMB FG-129) |
| [L06](L06-alergi-to-allergyintolerance.md) | `alergiToAllergyIntolerance` | `AsesmenAlergi` | **AllergyIntolerance** | semua | 🟡 S3 (kode KFA 91 ✅; manifestasi reaksi S5) |
| [L07](L07-riwayat-obat-to-medicationstatement.md) | `riwayatObatToMedicationStatement` | `AsesmenObat(+Item)` | **MedicationStatement** | semua | 🟡 S5a (rekomendasi formularium ber-KFA; ketik bebas / obat tanpa KFA ditahan FG-134) |
| [L08](L08-ttv-to-observation.md) | `ttvToObservation` | `medicalrecord.Observation` (TTV) | **Observation** `vital-signs` | semua | ✅ S3 |
| [L09](L09-kesadaran-to-observation.md) | `kesadaranToObservation` | `Triase.avpu` · `Observation.statusKesadaran` | **Observation** `exam` 67775-7 | semua | ✅ S4 (Apatis ditahan, D3) |
| [L10](L10-pemeriksaan-fisik-to-observation.md) | `pemeriksaanFisikToObservation` | `PemeriksaanFisik.sistem` (head-to-toe) | **Observation** `exam` LOINC per bagian tubuh | semua | 🟡 S4d (5/11 sistem; sisanya ditahan D12, FG-131) |
| [L11](L11-nyeri-to-observation.md) | `nyeriToObservation` | `Observation.skalaNyeri` + `PenilaianNyeri` | **Observation** `survey` 22253000 + `hasMember` NRS | semua | 🟡 S4 (NRS + Wong-Baker ✅; NIPS ditahan FG-107) |
| [L12](L12-penilaian-to-observation.md) | `penilaianToObservation` | `PenilaianSkala` · `PenilaianStatus` | **Observation** `exam`/`survey` (Morse · Humpty Dumpty · Edmonson · psikologis) | semua | 🟡 S4 (risiko jatuh ✅; Braden D13 · Barthel D5 ditahan; psikologis ⛔) |
| [L13](L13-diagnosa-to-condition.md) | `diagnosaToCondition` | `medicalrecord.Diagnosa` | **Condition** `encounter-diagnosis` + `Encounter.diagnosis` | semua | ⚠️ |
| [L14](L14-tindakan-to-procedure.md) | `tindakanToProcedure` | `DiagnosaProsedur` · `TindakanMedis` | **Procedure** (ICD-9-CM, category) | semua | ✅ S3 |
| [L15](L15-edukasi-to-procedure.md) | `edukasiToProcedure` | `DischargeEdukasi` · `AsesmenEdukasiPasien` | **Procedure** `409073007` Education | semua | 🟡 S4c (5/12 topik berkode; edukasi asesmen belum, FG-122) |
| [L16](L16-lab-to-diagnostic.md) | `labToDiagnostic` | `LabOrder/Item` · `LabResult/Value` | **ServiceRequest · Specimen · Observation · DiagnosticReport** | semua | 🟡 S3 (gerbang terminologi ✅; LOINC master 0%, Specimen ⛔) |
| [L17](L17-rad-to-diagnostic.md) | `radToDiagnostic` | `RadOrder/Item` · `RadResult` | **ServiceRequest · ImagingStudy · Observation · DiagnosticReport** | semua | ⚠️ |
| [L18](L18-resep-to-medicationrequest.md) | `resepToMedicationRequest` | `ResepOrder/Item` + `master.Obat` | **Medication + MedicationRequest** | semua | 🟡 S3 (pola Medication ✅; timing.repeat) |
| [L19](L19-telaah-to-questionnaireresponse.md) | `telaahToQuestionnaireResponse` | `ResepTelaah` | **QuestionnaireResponse** `Q0007` | semua | ✅ S4b (BB/TB 1.1 belum dinilai lokal, FG-113) |
| [L20](L20-dispensing-to-medicationdispense.md) | `dispensingToMedicationDispense` | `ResepDispensing` | **MedicationDispense** (+Medication `contained`) | semua | 🟡 S3 (pola Medication + KFA 93 ✅; qty/batch) |
| [L21](L21-mar-to-medicationadministration.md) | `marToMedicationAdministration` | `MarEntry` | **MedicationAdministration** | RI (IGD) | ✅ S4b (Medication contained; `not-done` belum diuji sandbox FG-115) |
| [L22](L22-careplan-to-goal-careplan.md) | `carePlanToGoalCarePlan` | `CarePlanMasalah/Goal` | **Goal** `nursing` + **CarePlan** | RI | ✅ S4c (Goal teks seperti contoh RI; pola CarePlan per masalah FG-124) |
| [L23](L23-discharge-planning-to-observation.md) | `dischargePlanningToObservation` | `DischargeAsesmen` | **Observation** OC000055 + **CarePlan** 736372004 | RI · IGD | 🟡 S4c (CarePlan ✅; kriteria ditahan D15) |
| [L24](L24-disposisi-to-kondisi-pulang.md) | `disposisiToKondisiPulang` | `Disposisi` | **Condition** kondisi pulang + `Encounter.hospitalization.dischargeDisposition` | semua | ✅ S2 |
| [L25](L25-tindak-lanjut-to-servicerequest.md) | `tindakLanjutToServiceRequest` | `JadwalKontrol` · `RujukanEksternal` · `Spri` · `Konsultasi` | **ServiceRequest** `3457005` (+ SPRI `inpatient-admission`) | semua | 🟡 S4c (kontrol · konsultasi · rujukan ✅; SPRI ditahan D8) |
| [L26](L26-resume-to-composition.md) | `resumeToComposition` | `ResumeMedik` | **Composition** (type per unit) | semua | ✅ S3 |

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
| D3 | Sumber tingkat kesadaran | IGD: `Triase.avpu` (padanan langsung). TTV: `statusKesadaran` dipetakan, **"Apatis" belum punya padanan** → butuh keputusan klinis. **S4: dibangun; Apatis sementara ditahan (Issue `menunggu-keputusan`, FG-104)** | L09 |
| D4 | Keluhan utama wajib berkode SNOMED | ✅ **Dikerjakan S2 (2026-11-17, atas usulan ini):** picker SNOMED di **Anamnesis** IGD/RI/RJ dari subset terkurasi master asesmen kategori **Keluhan Utama** (54 kode, admin dapat menambah); teks bebas tetap (→ `note`). Triase tidak diberi picker (L02 ditunda, D2) | L03 |
| D5 | GCS, SpO₂, Barthel, Braden (di luar playbook) | Tahan sampai uji sandbox; jangan masuk Bundle atomik dulu (1 tolak = 1 kunjungan gagal, FG-61) — **S3: GCS & nyeri sudah dikeluarkan dari vital-signs (salah kamar); SpO₂ masih dikirim sampai D5 diputuskan** | L08 · L12 |
| D6 | Pola Medication | ✅ **Dikerjakan S3 (2026-11-17):** ikuti playbook — **Medication per paket** (contained/entry bersama Request/Dispense), bukan 1 Medication per master obat | L18 · L20 |
| D7 | Kode riwayat penyakit/keluarga/obat | Simpan **kode item katalog** (bukan nama) di record asesmen. ✅ **Disetujui & dikerjakan S4d (2026-11-18)** untuk riwayat penyakit/keluarga: kolom kode sejajar nama, diturunkan Service saat simpan; SNOMED milik katalog. Riwayat obat (L07) ✅ S5a: `obat_id` dipilih dari rekomendasi formularium, KFA dari master Obat | L04 · L05 · L07 |
| D8 | IGD/RJ → Rawat Inap | `dischargeDisposition` tak punya kode "rawat inap" → kirim ServiceRequest `737481003` + SPRI; Encounter RI `basedOn` SPRI (FG-34). **S4c: kode SPRI sudah diverifikasi; SPRI ditahan sebagai Issue sampai diputuskan (FG-121)** | L24 · L25 |
| D9 | Format waktu | Kirim UTC `+00:00` sesuai playbook (sekarang `+07:00`) | semua |
| D10 | "Cara Masuk" Triase mencampur mobilisasi & transportasi | Tambah field **Sarana Transportasi** (Ambulans/Mobil/Motor/Lain-lain) | L02 |
| D11 | Kondisi pulang EHIS (Baik/Sedang/Buruk/Kritis) ≠ playbook (Stabil/Tidak stabil/Perbaikan) | ✅ **Diputuskan 2026-11-17:** form EHIS **tetap** (Baik/Sedang/Buruk/Kritis); disesuaikan ke kode SatuSehat lewat ConceptMap saat kirim | L24 |
| D12 | Head-to-toe EHIS 11 sistem ≠ 28 bagian playbook | Kirim 5 sistem yang padan dulu; pecah field bertahap. ✅ **Disetujui 2026-11-18; tahap 1 dikerjakan S4d** (Kepala · Mata · Leher · Toraks/Paru→Dada · Abdomen→Perut); 6 sistem ditahan sebagai Issue (FG-131) | L10 |
| D13 | Braden → skrining dekubitus (`285304000` boolean) | Ambang skor ditetapkan klinis sebelum diturunkan. **S4: Braden/Braden Q ditahan (Issue `menunggu-keputusan`)** | L12 |
| D14 | Order rad multi-pemeriksaan, ekspertise 1 laporan | SR per item; Observation+DR hanya untuk order 1 pemeriksaan | L17 |
| D15 | Kriteria rencana pemulangan (`OC000055`) tak dicatat | Tambah pilihan 5 nilai playbook di Asesmen Discharge. **S4c: CarePlan pemulangan terkirim; Observation kriteria ditahan (FG-119)** | L23 |
| D16 | Batas meninggal 48 jam untuk RI dari IGD | Hitung dari masuk kunjungan ini atau dari masuk IGD — konfirmasi. **Sementara (S2): dari masuk kunjungan ini** | L24 |
| D17 | Form Pasien Pulang IGD/RI tidak menilai kondisi umum (diturunkan dari status: "Dirujuk ke faskes lain", "Pulang atas permintaan sendiri", …) | Kembalikan pilihan kondisi (Baik/Sedang/Buruk/Kritis — kosakata D11) untuk Rujuk & APS; sampai itu, Condition kondisi pulang tidak dikirim untuk kasus tsb (Issue L24) | L24 |

## Perubahan di sumber data yang dibutuhkan (kualitas data)

| Perubahan | Untuk link | Jenis |
|---|---|---|
| ~~Picker SNOMED keluhan utama (Anamnesis + Triase)~~ ✅ S2 — Anamnesis (Triase ditunda bersama D2) | L03 | UI + kolom kode |
| Pilihan kondisi umum di form Pasien Pulang untuk Rujuk/APS (D17) | L24 | UI kecil |
| ~~Simpan `kode` item katalog asesmen (bukan nama) di riwayat penyakit/keluarga~~ ✅ S4d — kolom `penyakit_kode`/`anggota_kode` diturunkan server (tanpa ubah form) | L04 · L05 | kolom |
| Allergen obat → kode **KFA BZA (91…)** (`AsesmenAlergi.bzaKode` sudah ada) | L06 | adapter |
| ~~Riwayat obat pakai picker KFA (92/93)~~ ✅ S5a — combobox rekomendasi formularium + status (pencarian KFA nasional menunggu FH8) | L07 | UI + kolom |
| ~~Kolom kode FHIR (LOINC/OC) di `master.SkalaInstrument`~~ ✅ S4 — kolom kunci `fhir_pemetaan` + dropdown "Pemetaan SatuSehat" di Master Skala | L11 · L12 | kolom master |
| Waktu penilaian di form Asesmen Risiko (FG-108) · nilai awal TTV tidak disalin diam-diam (FG-109) | L08 · L09 · L11 · L12 | UI kecil |
| Butir "Berat & tinggi badan" di checklist telaah Farmasi (FG-113) · dosis MAR terstruktur nilai + satuan (FG-117) | L19 · L21 | UI kecil |
| Kode SNOMED topik di master topik edukasi | L15 | kolom master |
| Isi LOINC katalog Lab/Rad (UI sudah ada, FG-52) | L16 · L17 | data |
| Field prognosis (opsional) | ⛔ ClinicalImpression | kolom baru |

## Urutan kerja yang diusulkan (setelah disetujui)

1. ✅ **Fondasi** — `links/` registry + `conceptMap.ts` + snapshot loader + gerbang `readiness` + waktu UTC (tanpa mengubah perilaku kirim).
2. ✅ **Blocker Encounter finished** — L03 (keluhan CC) + koreksi L01 (diagnosis CC, discharge `exp-*`) + L24.
3. ✅ **Koreksi kamar yang sudah ada** — L08 (nyeri/GCS keluar dari vital-signs), L06 (KFA alergi obat), L14 (category), L26 (type per unit), L18/L20 (pola Medication).
4. **Link baru bersumber siap** — per kelompok: ✅ **S4a Pemeriksaan** L09 · L11 · L12 · ✅ **S4b Obat** L19 · L21 ·
   ✅ **S4c Rencana & pulang** L22 · L23 · L25 · L15 · ✅ **S4d Anamnesis & fisik** L04 · L05 · L10. L02 ditunda (D2).
5. **Link yang butuh perubahan entry** — ✅ **S5a L07** (picker rekomendasi + KFA), lalu ⛔ ClinicalImpression/NutritionOrder bila diputuskan.

Setiap langkah = branch sendiri, DoD per [ENGINEERING-RULES](../ENGINEERING-RULES.md) (bila belum ada di `main`, lihat branch `chore/engineering-rules`).
