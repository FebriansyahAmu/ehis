# L21 · `marToMedicationAdministration` — MAR (Pemberian Obat) → MedicationAdministration

| | |
|---|---|
| Status | ✅ S4b 2026-11-18 ([links/mar.ts](../../src/lib/fhir/links/mar.ts) · `toFhirMedicationAdministration` di [adapters/medication.ts](../../src/lib/fhir/adapters/medication.ts)) — belum ada data uji MAR (FG-118) · sisa: `not-done` belum diuji sandbox (FG-115), dosis terstruktur (FG-117) |
| Kamar | **MedicationAdministration** + **Medication** (1 paket per obat; **contained**, mengikuti contoh RI) |
| Playbook | RI §19 · IGD §21 · RJ §19 Pemberian Obat [V] |
| Contoh resmi | RI bundle: `MedicationAdministration(completed) cat=[inpatient]` setelah Dispense |
| Unit | RI (MAR) · IGD bila pemberian dicatat |

## Sumber EHIS

`medicalrecord.MarEntry` (resepItemId · namaObat · dosis · rute · tanggal · shift · status · waktuPemberian ·
perawat · perawat2 (verifikator HAM) · catatan) — latest-wins per obat × tanggal × shift.

## Pemetaan elemen (`*` wajib)

| Elemen | Aturan |
|---|---|
| `status*` | ConceptMap status MAR → `completed` (diberikan) · `not-done` (tidak diberikan/ditolak, + `statusReason`) · `on-hold` (ditunda) |
| `category` | `inpatient` (system medication-admin-category) |
| `medicationReference` | Medication paket (KFA dari order) |
| `subject` · `context` | Patient · Encounter |
| `effectiveDateTime`/`effectivePeriod` | dari `tanggal` + `waktuPemberian` (WIB lokal → UTC) |
| `performer.actor` | Practitioner IHS perawat pemberi |
| `request` | MedicationRequest item (L18) via `resepItemId` |
| `dosage.route` | ATC route `http://www.whocc.no/atc` |
| `dosage.dose` | nilai + UCUM (dosis teks → perlu terurai) |
| `note` | catatan · verifikator kedua HAM (nama) |

`localId` = `<resepItemId>:<tanggal>:<shift>` (**slot**, bukan id entri — MarEntry append-only, tiap koreksi = baris baru;
dengan kunci slot, koreksi = PUT resource yang sama).

**Dibangun S4b (2026-11-18), verbatim playbook RI v6.0 §19:**

| Status MAR (entri terakhir slot) | Dikirim |
|---|---|
| Diberikan | `completed` · `effectivePeriod` start = end = tanggal + `waktuPemberian` WIB → UTC · `reasonCode` reason-medication-given `b` "Given as Ordered" (contoh RI). Jam kosong/rusak → Issue L21 |
| Ditolak · TidakTersedia | `not-done` + `statusReason.text` (playbook tak memberi kode; waktu = saat dicatat) — FG-115 |
| Ditunda | tidak dibuat; bila slot pernah terkirim → `entered-in-error` |

Medication contained (`#med`): KFA 93 diutamakan, cadangan 92 (playbook tidak mengatur MA — FG-116). `dosage.text` = dosis teks;
`dosage.dose` UCUM hanya bila teks "<angka> <satuan>" (mg/g/mcg/mL/IU) — FG-117. `note` = catatan + verifikator kedua HAM.
`category` `inpatient` (RI) / `outpatient` (IGD). Obat tanpa KFA → MedicationRequest tak terkirim → Issue L21 per item.

## Gerbang pra-kirim

MedicationRequest item sudah terkirim · perawat punya IHS · `waktuPemberian` terisi untuk status `completed`.

## Jangan salah kamar

Pemberian ≠ penyerahan apotek (L20) ≠ resep (L18). Jadwal dosis yang **belum** diberikan tidak dikirim.
