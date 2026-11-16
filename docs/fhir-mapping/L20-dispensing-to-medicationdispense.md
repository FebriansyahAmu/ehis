# L20 · `dispensingToMedicationDispense` — Penyerahan Obat → MedicationDispense

| | |
|---|---|
| Status | ⚠️ ada (FH5) — pola Medication (D6), qty per item, batch |
| Kamar | **MedicationDispense** + **Medication** (`93…`, contained atau entry Bundle) |
| Playbook | RJ/IGD/RI §Pengeluaran Obat [V] |
| Contoh resmi | Bundle: `Medication` (`{{Medication_forDispense}}`) → `MedicationDispense(completed) cat=[outpatient|inpatient]` |

## Sumber EHIS

`medicalrecord.ResepDispensing` (1 dispensing = seluruh item order) · `ResepItem` · `master.Obat.kfa` ·
(batch/ED: ledger Inventory — dispensing→OUT belum terhubung).

## Aturan resmi [V]

- **1 paket per obat**: Medication + MedicationDispense dikirim bersamaan; 2 obat = 2 paket.
- Kirim terpisah (2× POST) **sudah tidak dapat dipakai mulai 2025** [V IGD]; pakai Bundle (entry bersama) atau `MedicationDispense.contained`.
- `Medication.code` untuk dispense **wajib KFA `93…`** (produk aktual). Bila tanpa merek → kode 93 "Umum".
- **Obat kronis** (RJ): 2 MedicationDispense — hari 1–7 identifier system `http://sys-ids.kemkes.go.id/claim-dispense-type` value `7-hari-inacbg`; hari 8–30 value `23-hari-apotek-online` [V RJ].

## Pemetaan elemen (`*` wajib)

| Elemen | Aturan |
|---|---|
| `identifier*` | `…/prescription/{Org_id}` + `…/prescription-item/{Org_id}` (sama dengan Request) |
| `status*` | `completed` · dibatalkan → `cancelled` |
| `category` | `outpatient`/`inpatient`/`discharge` — system `http://terminology.hl7.org/fhir/CodeSystem/medicationdispense-category` ✅ |
| `medicationReference*` | Medication paket (93…) |
| `subject*` · `context*` | Patient · Encounter |
| `performer.actor` | Practitioner apoteker |
| `location` | Location depo farmasi |
| `authorizingPrescription` | MedicationRequest item (L18) |
| `quantity` | jumlah **diserahkan per item** + satuan (FG-50) |
| `daysSupply` | durasi (`d`) ✅ |
| `whenPrepared` · `whenHandedOver` | waktu siap · waktu serah |
| `dosageInstruction` | sama dengan Request (route ATC, dose UCUM) |
| `Medication.batch` | `lotNumber` · `expirationDate` (dari Inventory — ⛔ belum terhubung) |

`localId` = `<dispensingId>:<resepItemId>` (MedicationDispense) · `…:med` (Medication).

## Gerbang pra-kirim

KFA 93 tersedia (KFA POA 92 saja → belum siap untuk dispense) · MedicationRequest item sudah terkirim · apoteker punya IHS.

## Jangan salah kamar

Pemberian obat oleh perawat ke pasien = MedicationAdministration (L21), **bukan** Dispense.
