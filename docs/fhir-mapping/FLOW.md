# FHIR Mapping — Flow Eksekusi

> Turunan dari [ARSITEKTUR.md](ARSITEKTUR.md) (keputusan D1) dan spesifikasi link L01–L26 ([README](README.md)).
> Dokumen ini menjawab: **kapan** data dikirim, **urutan** resource, **apa yang terjadi** bila data belum siap,
> dan **urutan kerja** (branch) untuk membangunnya. Status: 2026-11-17.

## 1. Pemicu (event EHIS → job kirim)

Semua pemicu hanya **meng-enqueue deskriptor job** `encounter.sync` ke `fhir.sync_log` di dalam transaksi aksi
klinis (R4). Payload **tidak** disimpan di job — dibangun ulang worker dari data terkini.

| Event EHIS | Sudah ada | Catatan |
|---|---|---|
| Kunjungan diterima (`receive` → InService) | ✅ FH3 | Encounter pertama kali (in-progress) |
| Selesaikan kunjungan (`complete`) | ✅ FH3 | Encounter `finished` + semua resource |
| Batal Selesai (`reopen`) | ✅ FH3 | Kirim ulang koreksi (tanpa status mundur) |
| Batal kunjungan (`cancel`) | ✅ FH3 | `cancelled` bila pernah terkirim |
| Dispensing Farmasi | ✅ FH5 | |
| Validasi hasil Lab · terbit ekspertise Rad | ✅ FH6 | |
| TTE Resume Medik | 📋 baru | Composition `final` |
| Kirim ulang manual (konsol `/ehis-fhir`) | ✅ FH9 | Untuk data yang diubah di antara transisi (FG-43) |

Satu kunjungan = paling banyak **satu job aktif** (job baru menggabung ke job yang menunggu — perilaku outbox eksisting).

## 2. Alur satu job (worker & pratinjau konsol memakai jalur yang SAMA)

```
worker claim job (kunjunganId)
 │
 ├─ ① SNAPSHOT  loadEncounterSnapshot(kunjunganId)
 │     1 putaran Promise.all, query ber-indeks kunjungan_id: kunjungan · diagnosa · prosedur · tindakan ·
 │     ttv · alergi · resep · lab · rad · resume · disposisi (+ sumber baru per link: anamnesis, triase, …)
 │
 ├─ ② REFS      Patient IHS (resolve by NIK bila belum) · Practitioner (DPJP, author per baris) · Location
 │     → prasyarat ENCOUNTER kurang = BLOKIR job (gagal non-retry; pratinjau: tampil sebagai blocker)
 │
 ├─ ③ PER LINK  untuk tiap link aktif sesuai unit, urut dependensi (§3):
 │       rows(snapshot) → readiness(row) ──belum siap──▶ catat Issue (tidak dikirim, tidak menggagalkan job)
 │                              │ siap
 │                              ▼
 │                        build(row, ctx) → resource FHIR (murni)
 │
 ├─ ④ DIFF      hash kanonik vs resource_map → sama = noop (tak ikut Bundle)
 │
 ├─ ⑤ SINK      bundle (default): resource siap & berubah → 1 Bundle transaction per fase
 │              single: POST/PUT per resource
 │
 └─ ⑥ RECORD    resource_map (ihsId, hash, kunjungan_id) · sync_log (acked/failed + Issue) · audit
```

Pratinjau konsol berhenti di ⑤ (PreviewSink: tanpa jaringan/tulis) → menampilkan per resource
**Terkirim / Berubah / Belum** + daftar **Issue "belum siap"** per link.

## 3. Urutan resource dalam satu kunjungan

Urutan mengikuti referensi (resource yang dirujuk lebih dulu) dan contoh Bundle resmi.

| Fase | Link | Resource |
|---|---|---|
| **A. Encounter ada** | L01 | Encounter `in-progress` (POST bila belum pernah terkirim) |
| **B1. Anamnesis** | L03 · L04 · L05 · L06 · L07 | Condition keluhan · Condition riwayat · FamilyMemberHistory · AllergyIntolerance · MedicationStatement |
| **B2. Pemeriksaan** | L08 · L09 · L10 · L11 · L12 | Observation tanda vital · kesadaran · head-to-toe · nyeri · skala risiko |
| **B3. Diagnosis & tindakan** | L13 · L14 · L15 | Condition diagnosis · Procedure · Procedure edukasi |
| **B4. Penunjang** | L16 · L17 | ServiceRequest → Specimen → Observation → DiagnosticReport |
| **B5. Obat** | L18 → L19 → L20 → L21 | Medication+MedicationRequest → QuestionnaireResponse → Medication+MedicationDispense → MedicationAdministration |
| **B6. Rencana & pulang** | L22 · L23 · L24 · L25 | Goal/CarePlan · rencana pemulangan · Condition kondisi pulang · ServiceRequest tindak lanjut |
| **C. Encounter final** | L01 | PUT Encounter: status target · `diagnosis` (CC dari L03 + DD dari L13) · `period.end` · `length` · `dischargeDisposition` (L24) · riwayat lokasi |
| **D. Dokumen** | L26 | Composition (merujuk resource fase B yang terkirim) |

L02 (triase) ditunda (D2). Link ⛔ (ClinicalImpression, NutritionOrder, …) tidak punya sumber → tidak ada fase.

## 4. Gerbang kesiapan (readiness)

| Tingkat | Contoh | Akibat |
|---|---|---|
| **Blokir job** | Patient tanpa NIK/IHS · DPJP tanpa IHS · ruangan belum onboarding | Seluruh job gagal (non-retry) sampai dilengkapi; pratinjau tetap jalan dengan placeholder |
| **Blokir `finished`** | Tidak ada Condition keluhan utama (CC) siap · diagnosis Utama belum ada | Fase B tetap terkirim; Encounter tetap `in-progress` sampai syarat terpenuhi |
| **Tahan item** | Kode kosong/salah format (ICD-10, LOINC, KFA, SNOMED) · kode lab salah kategori Permintaan/Hasil · nakes item tanpa IHS | Item itu saja tidak dikirim; item lain jalan. Bundle tidak ikut gagal karena 1 item (mitigasi FG-61) |
| **Di luar playbook** | GCS · SpO₂ · Barthel · FLACC · CPOT (D5) | Tidak dikirim sampai lolos uji sandbox |
| **Menunggu keputusan** | Kesadaran Apatis (D3) · Braden (D13) | Item ditahan sampai keputusan klinis (Issue `menunggu-keputusan`) |

Setiap item tertahan menjadi **Issue** `{ link, localId, kode, pesan }` — tampil di konsol per kunjungan, bukan
lagi teks "dilewati" yang hilang (FG-36/FG-37).

## 5. Siklus status kunjungan → Encounter

```
Registered/Queued ──(tidak dikirim)
        │ receive
        ▼
   InService ── Encounter in-progress · resource fase B dikirim bertahap (pemicu §1)
        │ complete
        ▼
   Completed ── PUT Encounter finished (fase C) + Composition (fase D)
        │ reopen                         ▲
        └── koreksi data → PUT finished ─┘   (status TIDAK mundur ke in-progress — FG-29)

   InService ──cancel──▶ Cancelled ── PUT cancelled (hanya bila pernah terkirim)
```

## 6. Urutan kerja (branch per langkah)

| Langkah | Branch (usulan) | Isi | Mengubah payload? |
|---|---|---|---|
| **S1 Fondasi** ✅ 2026-11-17 | `feat/fhir-mapping-fondasi` | Waktu UTC (D9) · hash kanonik · `conceptMap.ts` (enum → kode, exhaustive) · kontrak & registry link · `loadEncounterSnapshot` dipakai layanan sinkron eksisting · tipe Issue | Ya: format waktu + display kelas → semua resource terkirim ulang sekali (PUT, FG-89) |
| **S2 Blocker finished** ✅ 2026-11-17 | `feat/fhir-encounter-finished` | L03 keluhan (D4: picker SNOMED di Anamnesis, subset master Keluhan Utama) · L01 koreksi (CC, `classHistory`, `length`, `triaged`, `location.period`; multi-lokasi menunggu fitur pindah ruangan) · L24 (kode meninggal, kondisi pulang D11) · gerbang "blokir finished" | Ya: Encounter + 2 Condition baru per kunjungan. Temuan: FG-93 (kunjungan terkunci tanpa kode keluhan), D17 |
| **S3 Koreksi kamar** ✅ 2026-11-17 | `fix/fhir-mapping-kamar` | L08 (nyeri/GCS keluar) · L06 (KFA alergi obat) · L14 (category, reasonReference) · L26 (type per unit, section ber-entry) · L18/L20 (pola Medication D6) · L16 (gerbang Permintaan/Hasil, category per bagian) · konsol panel Data ditahan (FG-91) | Ya: Medication per paket, Observation nyeri/GCS berhenti (yatim di mock, FG-100), Composition baru |
| **S4a Pemeriksaan** ✅ 2026-11-17 | `feat/fhir-link-pemeriksaan` | L09 kesadaran (AVPU triase + TTV) · L11 nyeri (induk Pain + `hasMember` NRS/Wong-Baker) · L12 risiko jatuh (Morse/Humpty Dumpty/Edmonson) · kolom pemetaan di Master Skala · Issue `menunggu-keputusan` | Ya: per baris TTV +1 kesadaran +2 nyeri (FG-110). Temuan FG-104..111 |
| **S4b Obat** ✅ 2026-11-18 | `feat/fhir-link-obat` | L19 telaah → QuestionnaireResponse Q0007 (item 4 → MedicationRequest resep) · L21 MAR → MedicationAdministration per slot (Medication contained) | Ya: +1 QR per telaah, +1 MA per slot MAR. Temuan FG-112..118 |
| **S4c Rencana & pulang** ✅ 2026-11-18 | `feat/fhir-link-rencana` | L22 Goal + CarePlan rencana rawat · L23 CarePlan pemulangan (kriteria ditahan D15) · L15 Procedure edukasi (SNOMED + KPTL) · L25 ServiceRequest kontrol/konsultasi/rujukan (SPRI ditahan D8) · 3 section Composition baru | Ya: Goal/CarePlan/Procedure/ServiceRequest baru + section resume. Temuan FG-119..125 |
| **S4d Anamnesis & fisik** | `feat/fhir-link-anamnesis` (usulan) | L04 · L05 · L10 | Butuh D7 (kode katalog) · D12 (5 sistem) |
| **S5 Perubahan entry** | per form | Picker KFA riwayat obat (L07), kolom kode master skala/topik edukasi, field transportasi (D10) | — |

Setiap langkah: dokumen link diperbarui statusnya (✅) + gap ditutup di [FHIR-GAP.md](../FHIR-GAP.md).
