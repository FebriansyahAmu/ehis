# L18 · `resepToMedicationRequest` — Resep → Medication + MedicationRequest

| | |
|---|---|
| Status | ⚠️ ada (FH5, [medication.ts](../../src/lib/fhir/adapters/medication.ts)) — **pola Medication berbeda dari resmi**, `timing` tak terstruktur |
| Kamar | **Medication** (per paket) + **MedicationRequest** |
| Playbook | RJ/IGD/RI §Peresepan Obat [V RI tabel 18–19, S sebagian] |
| Contoh resmi | Bundle: `Medication` (`urn:uuid:{{Medication_forRequest}}`) → `MedicationRequest(completed) cat=[outpatient|inpatient]` |

## Sumber EHIS

`ResepOrder` (dokter, depo, isObatPulang, TTE) · `ResepItem` (obat, dosis, frekuensi/signa, rute, jumlah,
durasi, harga) · `master.Obat.kfa` (POA/POV KFA JSONB).

## Keputusan pola Medication (D6)

| | Sekarang (FH5) | Resmi (contoh bundle + playbook) |
|---|---|---|
| Granularitas | 1 Medication per **master obat**, dipakai ulang lintas resep | 1 Medication **per MedicationRequest** (`Medication_forRequest`) dan terpisah per Dispense (`Medication_forDispense`) |
| Kirim | resource berdiri sendiri | dalam Bundle bersama Request/Dispense, atau `contained` (POST terpisah "sudah tidak dapat digunakan mulai 2025" [V IGD]) |
| Kode | KFA POA | Request boleh `92…` (virtual) atau `93…` (aktual); Dispense **wajib `93…`** |

Usulan: ikuti resmi. `localId` Medication = `<resepItemId>:med`.

## Pemetaan elemen MedicationRequest (`*` wajib [S])

| Elemen | Aturan |
|---|---|
| `identifier*` | 2 identifier: `…/prescription/{Org_id}` (per resep, `use` official) + `…/prescription-item/{Org_id}` (per item) [V] |
| `status*` | `completed` setelah dispensing; `active` sebelum · dibatalkan → `cancelled` |
| `intent` | `order` |
| `category` | `outpatient` (RJ/IGD) · `inpatient` (RI) · `discharge` (obat pulang) ✅ |
| `medicationReference*` | Medication paket ini |
| `subject*` · `encounter` · `authoredOn` · `requester` | Patient · Encounter · waktu order · dokter (TTE) |
| `dosageInstruction.sequence` | 1 (dosis tetap); 1,2,… untuk tapering [V] |
| `dosageInstruction.timing.repeat*` | **terstruktur** (frequency/period/periodUnit/when) — `timing.code` (BID/TID/…) boleh, tapi `repeat` tetap wajib diisi [V] |
| `dosageInstruction.route*` | ATC route `http://www.whocc.no/atc` (O/P/R/…) ✅ (FG-48) |
| `dosageInstruction.doseAndRate` | dosis + UCUM |
| `dispenseRequest` | quantity · expectedSupplyDuration (`d`) · performer Organization |
| `substitution.allowed[x]*` | boolean (default `false` kecuali telaah mensubstitusi) |

## Gerbang pra-kirim

Obat ber-KFA (FG-45) · signa terurai jadi `timing.repeat` (FG-49 — parser signa lokal atau field terstruktur di
form resep) · rute terpetakan · racikan → `Medication.ingredient` + extension MedicationType compound (FG-46).

## Jangan salah kamar

- Riwayat obat dari rumah = MedicationStatement (L07), bukan MedicationRequest.
- Obat pulang = MedicationRequest `category` `discharge`, bukan resource lain.
- BMHP/alkes **bukan** Medication (fase Alkes ⛔).
