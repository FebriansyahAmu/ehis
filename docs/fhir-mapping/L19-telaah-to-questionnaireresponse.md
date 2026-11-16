# L19 · `telaahToQuestionnaireResponse` — Telaah Resep → QuestionnaireResponse Q0007

| | |
|---|---|
| Status | 📋 belum ada (sumber sudah dirancang FHIR-ready, 2026-06-20) |
| Kamar | **QuestionnaireResponse** · `questionnaire` = `https://fhir.kemkes.go.id/Questionnaire/Q0007` |
| Playbook | RJ/IGD/RI §Pengkajian Resep [V IGD §19, RI] |
| Contoh resmi | Bundle RJ/IGD/RI: `QuestionnaireResponse(completed) Q0007` setelah MedicationRequest |

## Sumber EHIS

`medicalrecord.ResepTelaah` (answers JSON `linkId → boolean` · lulusAdministrasi/Farmasetik/Klinis · apoteker ·
authorPegawaiId · createdAt). 1 telaah = 1 QuestionnaireResponse; telaah ulang → resource baru (append-only lokal).

## Struktur item Q0007 [V]

| linkId | Pertanyaan | Jawaban |
|---|---|---|
| 1 · 1.1–1.4 | Persyaratan administrasi (identitas pasien · identitas dokter · tanggal resep · ruangan asal) | `valueCoding` |
| 2 · 2.1–2.4 | Persyaratan farmasetik (nama/bentuk/kekuatan · dosis & jumlah · stabilitas · aturan pakai) | `valueCoding` |
| 3.1 | Ketepatan indikasi/dosis/waktu | `valueCoding` |
| 3.2–3.5 | Duplikasi · alergi & ROTD · kontraindikasi · interaksi | `valueBoolean` (+ `valueString` keterangan) |
| 4 | Resep yang dikaji | `valueReference` → MedicationRequest (satu per item resep) |

`valueCoding` system `http://terminology.kemkes.go.id/CodeSystem/clinical-term`: `OV000052` Sesuai · `OV000053` Tidak Sesuai.

## Elemen wajib

`questionnaire` · `status` `completed` · `subject` · `encounter` · `authored` (= createdAt) · `author` (Practitioner
apoteker) · `source` · `item`. `localId` = `<telaahId>`. Bergantung L18 (MedicationRequest sudah ada).

## ⚠️ Risiko makna terbalik (cek wajib saat coding)

Jawaban lokal bermakna **"lulus"** (`true` = memenuhi syarat). Item 3.2–3.5 Q0007 bertanya **"ada masalah?"**
(duplikasi/alergi/kontraindikasi/interaksi) → `valueBoolean` harus **dibalik** dari "lulus". Untuk 1.x/2.x/3.1:
lulus → `OV000052`, tidak lulus → `OV000053`. ConceptMap linkId lokal ↔ linkId Q0007 harus eksplisit dan diuji.

## Jangan salah kamar

Telaah resep **bukan** Observation/Procedure; satu-satunya kamar resmi = QR Q0007.
