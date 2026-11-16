# L21 · `marToMedicationAdministration` — MAR (Pemberian Obat) → MedicationAdministration

| | |
|---|---|
| Status | 📋 belum ada |
| Kamar | **MedicationAdministration** + **Medication** (1 paket per obat) |
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

`localId` = `<marEntryId>`. Karena MarEntry **latest-wins**, perubahan entri = PUT resource yang sama (hash berubah).

## Gerbang pra-kirim

MedicationRequest item sudah terkirim · perawat punya IHS · `waktuPemberian` terisi untuk status `completed`.

## Jangan salah kamar

Pemberian ≠ penyerahan apotek (L20) ≠ resep (L18). Jadwal dosis yang **belum** diberikan tidak dikirim.
