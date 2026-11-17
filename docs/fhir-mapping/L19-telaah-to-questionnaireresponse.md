# L19 · `telaahToQuestionnaireResponse` — Telaah Resep → QuestionnaireResponse Q0007

| | |
|---|---|
| Status | ✅ S4b 2026-11-18 ([links/telaah.ts](../../src/lib/fhir/links/telaah.ts) · [adapters/pengkajianResep.ts](../../src/lib/fhir/adapters/pengkajianResep.ts)) — struktur contoh RI (contoh IGD bersarang salah, FG-112) · sisa: BB/TB di 1.1 (FG-113) · butir tanpa padanan (FG-114) |
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

## ConceptMap butir lokal → Q0007 (dibangun S4b, diuji)

| Q0007 | Butir lokal (`answers.<grup>.<linkId>`, true = lulus) | Jawaban |
|---|---|---|
| 1.1 | `adm-identitas` **dan** `adm-umur-jk` (BB/TB tidak dinilai lokal — FG-113) | semua lulus → `OV000052`, selain itu `OV000053` |
| 1.2 · 1.3 · 1.4 | `adm-dokter` · `adm-tanggal` · `adm-unit` | idem |
| 2.1 · 2.2 · 2.3 · 2.4 | `farm-nama-kekuatan` · `farm-dosis-jumlah` · `farm-stabilitas` · `farm-aturan` | idem |
| 3.1 | `klin-indikasi` **dan** `klin-dosis` **dan** `klin-aturan-lama` | idem |
| 3.2 · 3.3 · 3.4 · 3.5 | `klin-duplikasi` · `klin-rotd` · `klin-kontraindikasi` · `klin-interaksi` | `valueBoolean` = **tidak** lulus |
| 4 | MedicationRequest resep yang terkirim (semua item) | `valueReference` |
| — | `farm-kompatibilitas` | tidak dikirim (tak ada item Q0007) |

Butir lokal kosong/rusak → QR ditahan (Issue L19 `kode-kosong`). Order resep dihapus → `entered-in-error` bila pernah terkirim.
`author` = Practitioner apoteker bila sudah onboarding (sama dengan nakes lain).

## ⚠️ Risiko makna terbalik (cek wajib saat coding)

Jawaban lokal bermakna **"lulus"** (`true` = memenuhi syarat). Item 3.2–3.5 Q0007 bertanya **"ada masalah?"**
(duplikasi/alergi/kontraindikasi/interaksi) → `valueBoolean` harus **dibalik** dari "lulus". Untuk 1.x/2.x/3.1:
lulus → `OV000052`, tidak lulus → `OV000053`. ConceptMap linkId lokal ↔ linkId Q0007 harus eksplisit dan diuji.

## Jangan salah kamar

Telaah resep **bukan** Observation/Procedure; satu-satunya kamar resmi = QR Q0007.
