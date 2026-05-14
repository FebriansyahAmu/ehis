# EHIS — Clinical Standards & Compliance

> Referensi statis. Dibaca on-demand saat ada pertanyaan klinis/compliance.
> Untuk gap analysis aktif → `.claude/GAP_ANALYSIS.md`

---

## Regulasi Nasional (Kemenkes)

| Peraturan            | Topik                               | Implikasi pada Sistem                                             |
| -------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| PMK 269/2008         | Rekam Medis                         | ICD-10 wajib, resume medis wajib, identifikasi pasien, SOAP       |
| PMK 290/2008         | Persetujuan Tindakan Medis          | IC tertulis wajib sebelum semua tindakan invasif                  |
| PMK 47/2018          | Pelayanan Kegawatdaruratan          | Triase ESI, observasi terjadwal, transfer internal/eksternal      |
| PMK 76/2016          | INA-CBG                             | Grouper diagnosis + prosedur ICD-10/ICD-9 untuk klaim BPJS        |
| PMK 11/2017          | Keselamatan Pasien                  | 6 Sasaran Keselamatan Pasien (SKP / IPSG)                         |
| PMK 72/2016          | Standar Pelayanan Kefarmasian di RS | Formularium RS, HAM, rekonsiliasi obat, unit dose dispensing, MAR |
| PMK 4/2018           | Formularium Nasional (Fornas)       | Obat Fornas wajib untuk pasien BPJS; pengendalian peresepan       |
| PERMENKES 1438/2010  | Standar Pelayanan Kedokteran        | Clinical Pathway per diagnosis wajib per KSM; acuan PPK           |
| SNARS Ed. 1.1 (KARS) | Akreditasi RS                       | Standar AP, ARK, PP, HPK, SKP, PPI — detail di bawah              |

## Standar Klinis Profesi

| Badan     | Standar                      | Konteks                                              |
| --------- | ---------------------------- | ---------------------------------------------------- |
| PPNI      | SDKI · SLKI · SIKI (2018)    | Diagnosa + Luaran + Intervensi Keperawatan Indonesia |
| IDI / KSM | Panduan Praktik Klinis (PPK) | Standar tatalaksana per diagnosis                    |
| PERDICI   | Triase IGD (ESI Level 1–5)   | Emergency Severity Index                             |

## Standar Internasional

| Standar                       | Topik                                                                       |
| ----------------------------- | --------------------------------------------------------------------------- |
| JCI IPSG 1–6                  | Patient identification, SBAR, HAM, surgical safety, hand hygiene, fall      |
| WHO Surgical Safety Checklist | Sign-in → Time-out → Sign-out                                               |
| NEWS2 / MEWS                  | Early Warning Score berbasis TTV otomatis                                   |
| APACHE II / SOFA              | ICU/HCU severity scoring                                                    |
| HIMSS EMRAM Level 1–7         | Tingkat kematangan adopsi EMR — acuan roadmap digitalisasi RS               |
| HL7 FHIR R4                   | Standar interoperabilitas data klinis antar sistem (Lab, Rad, BPJS, P-Care) |

---

## Clinical Documentation Flow

### IGD — Alur Ideal Per Kunjungan

```
[Pendaftaran] ──► [Triase ESI] ──► [TTV Awal + Skala Nyeri] ──► [Asesmen Awal Medis & Kep.]
                                                                        │
                              ┌─────────────────────────────────────────┘
                              ▼
              [Pemeriksaan Fisik] ──► [Penilaian/Scoring: GCS, EWS, Jatuh, Braden, ADL]
                              │
                              ▼
              [Diagnosa ICD-10 + Tipe + Status] ──► [INA-CBG Preview]
                              │
                              ▼
              [Tindakan/Prosedur] ──► [Informed Consent] ──► [Rekonsiliasi Obat]
                              │
                              ├──► [Resep & Obat] ──► [Order Lab] ──► [Order Rad]
                              │
                              ▼
              [CPPT/SOAP ongoing] ◄──► [Monitoring TTV Ulang (terjadwal)]
                              │
                              ▼
              [Asuhan Keperawatan SDKI/SIKI] ──► [Edukasi Pasien & Keluarga]
                              │
                              ▼
         [Disposisi: Pulang | Rawat Inap | Rujuk Keluar | APS | Meninggal]
                              │
              ┌───────────────┼──────────────────┐
              ▼               ▼                  ▼
      [Surat Pulang]  [SBAR Transfer RI]  [Surat Rujukan]
```

### Rawat Inap — Alur Ideal Per Episode

```
[Transfer dari IGD / Masuk Langsung]
          │
          ▼
[Asesmen Awal RI — wajib dalam 24 jam (SNARS AP 1)]
  • Anamnesis lengkap (RPS, RPD, RPK, sosek, spiritual)
  • Pemeriksaan fisik head-to-toe
  • ADL / Barthel Index
  • Asesmen Nutrisi (MST)
  • Asesmen Risiko Jatuh (Morse)
  • Asesmen Risiko Decubitus (Braden)
          │
          ▼
[Diagnosa ICD-10] ──► [Rencana Asuhan Terintegrasi (DPJP + Kep + PPA)]
          │
          ▼
┌─────────────────────── SIKLUS HARIAN ──────────────────────────┐
│  • CPPT/SOAP per shift (DPJP + Perawat + PPA)                  │
│  • TTV per shift (pagi / siang / malam) + NEWS2                │
│  • Asuhan Keperawatan (SDKI/SLKI/SIKI) — evaluasi harian       │
│  • Intake/Output — balance cairan per shift                    │
│  • Pemeriksaan Fisik terjadwal                                 │
│  • Monitoring Nyeri (0–10)                                     │
└────────────────────────────────────────────────────────────────┘
          │
          ├──► [Order Lab] ──► [Order Radiologi] ──► [Konsultasi SMF]
          │
          ├──► [Resep & Obat / MAR (Medication Administration Record)]
          │
          ▼
[Discharge Planning — mulai hari ke-1 (SNARS ARK 5)]
  • Edukasi pasien & keluarga
  • Kebutuhan home care
  • Rencana follow-up & kontrol
  • Obat pulang & instruksi
          │
          ▼
[Resume Medis — wajib PMK 269/2008] ──► [Surat Pulang / Rujukan]
```

### Rawat Jalan — Alur Ideal Per Kunjungan

```
[Pendaftaran / Antrian Poliklinik] ──► [Verifikasi Kepesertaan BPJS / SEP]
          │
          ▼
[Triase / Skrining Awal Perawat]  • TTV + Skala Nyeri  • Keluhan utama
          │
          ▼
[Konsultasi Dokter]
  • Anamnesis + Pemeriksaan Fisik  • CPPT / SOAP  • Diagnosa ICD-10 + Tipe
          │
          ├──► [Resep & Obat] ──► [Order Lab] ──► [Order Rad]
          │
          ├──► [Informed Consent] (untuk prosedur minor di poli)
          │
          ▼
[Hasil Pemeriksaan Lab / Rad] ──► [Re-evaluasi & Follow-up CPPT]
          │
          ▼
[Disposisi: Pulang | Rujuk IGD | Rawat Inap | Konsul SMF Lain]
          │
          ▼
[Surat Kontrol / Surat Rujukan / Resume Kunjungan / Resep Pulang]
```

---

## Keputusan Scope Arsitektur

| Modul                              | Standar                            | Keputusan                     | Keterangan                                                                                              |
| ---------------------------------- | ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Rawat Jalan (Poliklinik)**       | SNARS AP 1 · PMK 269/2008          | ✅ Masuk EHIS-Care            | Sub-modul `/ehis-care/rawat-jalan`. Mayoritas reuse shared components dari IGD.                         |
| **EHIS-Lab (Laboratorium)**        | SNARS AP 5                         | ✅ Modul Terpisah `/ehis-lab` | Rekam medis hanya referensi/link ke hasil, tidak embed.                                                 |
| **EHIS-Rad (Radiologi)**           | SNARS AP 5                         | ✅ Modul Terpisah `/ehis-rad` | Sama dengan EHIS-Lab.                                                                                   |
| **IBS / Kamar Operasi**            | WHO Surgical Checklist · SNARS PAB | 🟡 Roadmap Jangka Panjang     | Pre-op, anestesi record, Sign-in/Time-out/Sign-out, PACU monitoring                                    |
| **BPJS / P-Care Integration**      | PMK 76/2016 · BPJS IT              | ⏸ TBD                         | Keputusan belum diperlukan; fokus UI clinical dulu                                                      |
| **Farmasi Klinis (EHIS-Pharmacy)** | PMK 72/2016 · PMK 4/2018           | 🟡 Roadmap                    | Dispensing, verifikasi apoteker, HAM, unit dose. Berbeda dari Resep & Obat di rekam medis               |
| **Laporan IKP (EHIS-Safety)**      | PMK 11/2017 · SNARS SKP            | 🟡 Roadmap                    | KTD/KNC/Sentinel → review → grading → tindak lanjut → dashboard                                        |
