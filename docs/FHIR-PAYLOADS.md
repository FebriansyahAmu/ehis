# FHIR / SatuSehat — Referensi Payload (contoh JSON per resource)

> Referensi payload untuk membangun adapter `toFhir*` ([docs/FHIR-RULES.md](FHIR-RULES.md) §Adapter · [TODO-FHIR.md](../TODO-FHIR.md)).
> Dipakai saat implementasi FH1–FH7. **Status: DESAIN/REFERENSI.**

## Provenans & disclaimer (baca dulu)

- **Payload VERBATIM RESMI sudah tersedia di [docs/fhir-postman/](fhir-postman/)** — ditarik langsung dari
  **workspace Postman RESMI SatuSehat** (`satusehat/satusehat-public`, di-fork + Postman API): `resources/`
  = 1 contoh Create kanonik per resource (25 file, lengkap dgn `meta.profile`/ingredient/administrativeCode),
  `bundles/` = **Bundle transaction utuh** per Service Module (RJ/IGD/RI). **Itu sumber otoritatif** —
  gunakan file JSON tsb saat menulis adapter.
- Contoh **inline di dokumen ini** = versi RINGKAS (dirakit dari contoh docs kemkes
  `satusehat.kemkes.go.id/platform/docs/id/fhir/resources/<resource>/`) untuk baca cepat + anotasi sumber
  EHIS. Bila beda, **file di `docs/fhir-postman/` menang**.
- **WAJIB divalidasi ulang ke sandbox** (`api-satusehat-stg.dto.kemkes.go.id`) sebelum prod — struktur bisa
  berubah antar versi Playbook.
- Placeholder inline: `{ihsPatient}`/`{ihsPractitioner}`/`{ihsOrg}`/`{ihsLocation}` = IHS id hasil resolve;
  `urn:uuid:<x>` = referensi antar-entry dalam **Bundle transaction**. (File Postman pakai variabel
  `{{Patient_id}}`/`{{Org_id}}`/`{{Encounter_uuid}}` — lihat [docs/fhir-postman/README.md](fhir-postman/README.md).)

---

## A. Onboarding (resolve-first — [docs/FHIR-RULES.md](FHIR-RULES.md) R15)

### Patient — resolve IHS by NIK (GET, tak create)
```
GET /fhir-r4/v1/Patient?identifier=https://fhir.kemkes.go.id/id/nik|3175xxxxxxxxxxxx
→ 200 Bundle(searchset); IHS = entry[0].resource.id  (+ identifier system .../id/ihs-number)
```
Bentuk resource (untuk referensi field — **EHIS: `pendaftaran.Pasien`**, simpan `idSatusehat`):
```json
{
  "resourceType": "Patient",
  "identifier": [
    { "use": "official", "system": "https://fhir.kemkes.go.id/id/nik", "value": "3175xxxxxxxxxxxx" }
  ],
  "active": true,
  "name": [{ "use": "official", "text": "BUDI SANTOSO" }],
  "gender": "male",
  "birthDate": "1990-05-12",
  "address": [{
    "use": "home",
    "line": ["Jl. H.R. Rasuna Said Blok X5 Kav. 4-9 Kuningan"],
    "city": "Jakarta", "postalCode": "12950", "country": "ID",
    "extension": [{
      "url": "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
      "extension": [
        { "url": "province", "valueCode": "10" },
        { "url": "city", "valueCode": "1010" },
        { "url": "district", "valueCode": "1010101" },
        { "url": "village", "valueCode": "1010101101" },
        { "url": "rt", "valueCode": "2" },
        { "url": "rw", "valueCode": "2" }
      ]
    }]
  }]
}
```
> ⚠️ `administrativeCode` pakai **kode wilayah SatuSehat** (≠ dotted Kemendagri di `master.Wilayah`) → butuh mapping (gunakan `/masterdata/v1/*` SatuSehat, atau tabel mapping). Detail lihat [TODO-FHIR.md §1h](../TODO-FHIR.md).

### Practitioner — resolve IHS by NIK (GET-only, RS tak create)
```
GET /fhir-r4/v1/Practitioner?identifier=https://fhir.kemkes.go.id/id/nik|7209061211900001
→ Bundle; IHS = resource.id  (sandbox sample: NIK 7209061211900001 → dr. Alexander → IHS 10009880728)
```
**EHIS: `master.Pegawai`+`Dokter`** (NIK nakes) → simpan IHS di ResourceMap.

### Organization  (**EHIS: `master.Location` Org tree / `master.RsProfil`**)
```json
{
  "resourceType": "Organization",
  "identifier": [
    { "use": "official", "system": "http://sys-ids.kemkes.go.id/organization/{orgId}", "value": "Poliklinik Rawat Jalan" }
  ],
  "active": true,
  "type": [{ "coding": [
    { "system": "http://terminology.hl7.org/CodeSystem/organization-type", "code": "dept", "display": "Hospital Department" }
  ] }],
  "name": "Poliklinik Rawat Jalan",
  "partOf": { "reference": "Organization/{ihsOrg}" },
  "telecom": [{ "system": "phone", "value": "+6221-7830426", "use": "work" }],
  "address": [{ "use": "work", "type": "both", "line": ["Jalan Jati Asih"], "city": "Jakarta", "postalCode": "55292", "country": "ID" }]
}
```

### Location  (**EHIS: `master.Location` Ruangan/Bed**)
```json
{
  "resourceType": "Location",
  "identifier": [
    { "use": "official", "system": "http://sys-ids.kemkes.go.id/location/{orgId}", "value": "G-2-R-1A" }
  ],
  "status": "active",
  "name": "Ruang 1A IRJT",
  "physicalType": { "coding": [
    { "system": "http://terminology.hl7.org/CodeSystem/location-physical-type", "code": "ro", "display": "Room" }
  ] },
  "managingOrganization": { "reference": "Organization/{ihsOrg}", "display": "RSUD ..." }
}
```

---

## B. Klinis (RS menulis — POST/PUT)

### Encounter  (**EHIS: `encounter.Kunjungan`**) — class per unit: `AMB` RJ · `EMER` IGD · `IMP` RI
```json
{
  "resourceType": "Encounter",
  "identifier": [
    { "system": "http://sys-ids.kemkes.go.id/encounter/{orgId}", "use": "official", "value": "P20240001" }
  ],
  "status": "arrived",
  "class": { "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB", "display": "ambulatory" },
  "subject": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "participant": [{
    "type": [{ "coding": [
      { "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "ATND", "display": "attender" }
    ] }],
    "individual": { "reference": "Practitioner/{ihsPractitioner}", "display": "dr. Bronsig" }
  }],
  "period": { "start": "2026-08-19T08:00:00+07:00" },
  "location": [{ "location": { "reference": "Location/{ihsLocation}", "display": "Ruang 1A, Poliklinik Rawat Jalan" } }],
  "diagnosis": [{ "condition": { "reference": "urn:uuid:condition-1" }, "rank": 1 }],
  "serviceProvider": { "reference": "Organization/{ihsOrg}" }
}
```
> Status lifecycle: `arrived → in-progress → finished` (IGD tambah `triaged` di awal). PATCH status saat transisi kunjungan.

### Condition  (**EHIS: `medicalrecord.Diagnosa`** — ICD-10)
```json
{
  "resourceType": "Condition",
  "clinicalStatus": { "coding": [
    { "system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active", "display": "Active" }
  ] },
  "category": [{ "coding": [
    { "system": "http://terminology.hl7.org/CodeSystem/condition-category", "code": "encounter-diagnosis", "display": "Encounter Diagnosis" }
  ] }],
  "code": { "coding": [
    { "system": "http://hl7.org/fhir/sid/icd-10", "code": "A15.0", "display": "Tuberculosis of lung, confirmed by sputum microscopy with or without culture" }
  ] },
  "subject": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "encounter": { "reference": "urn:uuid:encounter-1" }
}
```

### Observation  (**EHIS: `medicalrecord.Observation` TTV / `LabResultValue`** — LOINC)
```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [{ "coding": [
    { "system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs", "display": "Vital Signs" }
  ] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "8867-4", "display": "Heart rate" }] },
  "subject": { "reference": "Patient/{ihsPatient}" },
  "encounter": { "reference": "urn:uuid:encounter-1" },
  "effectiveDateTime": "2026-08-19T08:10:00+07:00",
  "valueQuantity": { "value": 80, "unit": "beats/minute", "system": "http://unitsofmeasure.org", "code": "/min" }
}
```

### Procedure  (**EHIS: `TindakanMedis`/`DiagnosaProsedur`** — ICD-9-CM)
```json
{
  "resourceType": "Procedure",
  "status": "completed",
  "category": { "coding": [{ "system": "http://snomed.info/sct", "code": "103693007", "display": "Diagnostic procedure" }] },
  "code": { "coding": [{ "system": "http://hl7.org/fhir/sid/icd-9-cm", "code": "87.44", "display": "Routine chest x-ray, so described" }] },
  "subject": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "encounter": { "reference": "urn:uuid:encounter-1" },
  "performedDateTime": "2026-08-19T09:00:00+07:00",
  "performer": [{ "actor": { "reference": "Practitioner/{ihsPractitioner}", "display": "dr. Bronsig" } }],
  "reasonCode": [{ "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "A15.0", "display": "Tuberculosis of lung ..." }] }],
  "bodySite": [{ "coding": [{ "system": "http://snomed.info/sct", "code": "302551006", "display": "Entire Thorax" }] }]
}
```

### AllergyIntolerance  (**EHIS: `AsesmenAlergi`** — SNOMED)
```json
{
  "resourceType": "AllergyIntolerance",
  "clinicalStatus": { "coding": [
    { "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "code": "active", "display": "Active" }
  ] },
  "verificationStatus": { "coding": [
    { "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", "code": "unconfirmed", "display": "Unconfirmed" }
  ] },
  "category": ["food"],
  "criticality": "low",
  "code": { "coding": [{ "system": "http://snomed.info/sct", "code": "89811004", "display": "Gluten (substance)" }] },
  "patient": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "encounter": { "reference": "urn:uuid:encounter-1" },
  "reaction": [{ "manifestation": [{ "coding": [
    { "system": "http://snomed.info/sct", "code": "126485001", "display": "Urticaria (disorder)" }
  ] }] }]
}
```

### Medication  (**EHIS: `master.Obat` KFA JSONB** — KFA `sys-ids.kemkes.go.id/kfa`)
```json
{
  "resourceType": "Medication",
  "identifier": [{ "system": "http://sys-ids.kemkes.go.id/medication/{orgId}", "use": "official", "value": "123456789" }],
  "code": { "coding": [
    { "system": "http://sys-ids.kemkes.go.id/kfa", "code": "93001019", "display": "OAT / Rifampicin 150 mg / Isoniazid 75 mg / Pyrazinamide 400 mg / Ethambutol 275 mg Kaplet Salut Selaput (KIMIA FARMA)" }
  ] },
  "status": "active",
  "form": { "coding": [
    { "system": "http://terminology.kemkes.go.id/CodeSystem/medication-form", "code": "BS023", "display": "Kaplet Salut Selaput" }
  ] },
  "extension": [{
    "url": "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
    "valueCodeableConcept": { "coding": [
      { "system": "https://terminology.kemkes.go.id/CodeSystem/medication-type", "code": "NC", "display": "Non-compound" }
    ] }
  }],
  "ingredient": [{
    "itemCodeableConcept": { "coding": [{ "system": "http://sys-ids.kemkes.go.id/kfa", "code": "91000314", "display": "Acarbose" }] },
    "strength": {
      "numerator": { "value": 325, "system": "http://unitsofmeasure.org", "code": "mg" },
      "denominator": { "value": 1, "system": "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm", "code": "TAB" }
    }
  }]
}
```

### MedicationRequest  (**EHIS: `ResepOrder`+`ResepItem`**)
```json
{
  "resourceType": "MedicationRequest",
  "status": "active",
  "intent": "order",
  "medicationReference": { "reference": "urn:uuid:medication-1", "display": "OAT ... (KIMIA FARMA)" },
  "subject": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "encounter": { "reference": "urn:uuid:encounter-1" },
  "authoredOn": "2026-08-19",
  "requester": { "reference": "Practitioner/{ihsPractitioner}", "display": "dr. Bronsig" },
  "dosageInstruction": [{ "timing": { "repeat": { "frequency": 1, "period": 1, "periodUnit": "d" } } }],
  "dispenseRequest": { "quantity": { "value": 120, "unit": "TAB", "system": "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm", "code": "TAB" } }
}
```

### MedicationDispense  (**EHIS: `ResepDispensing`**)
```json
{
  "resourceType": "MedicationDispense",
  "status": "completed",
  "medicationReference": { "reference": "urn:uuid:medication-1", "display": "OAT ... (KIMIA FARMA)" },
  "subject": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "context": { "reference": "urn:uuid:encounter-1" },
  "performer": [{
    "function": { "coding": [
      { "system": "http://terminology.hl7.org/CodeSystem/medicationdispense-performer-function", "code": "dataenterer", "display": "Data Enterer" }
    ] },
    "actor": { "reference": "Practitioner/{ihsPractitioner}", "display": "John Miller" }
  }],
  "authorizingPrescription": [{ "reference": "urn:uuid:medicationrequest-1" }],
  "quantity": { "value": 120, "system": "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm", "code": "TAB" },
  "whenHandedOver": "2026-08-19T16:20:00+07:00",
  "dosageInstruction": [{ "sequence": 1, "timing": { "repeat": { "frequency": 1, "period": 1, "periodUnit": "d" } } }]
}
```

### ServiceRequest  (**EHIS: `LabOrder`/`RadOrder`**)
```json
{
  "resourceType": "ServiceRequest",
  "status": "active",
  "intent": "original-order",
  "category": [{ "coding": [{ "system": "http://snomed.info/sct", "code": "108252007", "display": "Laboratory procedure" }] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "11477-7", "display": "Microscopic observation [Identifier] in Sputum by Acid fast stain" }] },
  "subject": { "reference": "Patient/{ihsPatient}" },
  "encounter": { "reference": "urn:uuid:encounter-1" },
  "occurrenceDateTime": "2026-08-19",
  "requester": { "reference": "Practitioner/{ihsPractitioner}", "display": "dr. Bronsig" },
  "reasonCode": [{ "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "A15.0" }] }]
}
```

### Specimen  (**EHIS: `LabOrder` sampel**)
```json
{
  "resourceType": "Specimen",
  "identifier": [{ "system": "http://sys-ids.kemkes.go.id/specimen/{orgId}", "use": "official", "value": "00001" }],
  "status": "available",
  "type": { "coding": [{ "system": "http://snomed.info/sct", "code": "119294007", "display": "Dried blood specimen" }] },
  "subject": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "receivedTime": "2026-08-19T08:25:00+07:00",
  "collection": {
    "collectedDateTime": "2026-08-19T08:15:00+07:00",
    "bodySite": { "coding": [{ "system": "http://snomed.info/sct", "code": "106004", "display": "Posterior carpal region" }] }
  }
}
```

### DiagnosticReport  (**EHIS: `LabResult`/`RadResult`** — LOINC)
```json
{
  "resourceType": "DiagnosticReport",
  "status": "final",
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v2-0074", "code": "LAB", "display": "Laboratory" }] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "11477-7", "display": "Microscopic observation [Identifier] in Sputum by Acid fast stain" }] },
  "subject": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "encounter": { "reference": "urn:uuid:encounter-1" },
  "effectiveDateTime": "2026-08-19T10:00:00+07:00",
  "issued": "2026-08-19T10:30:00+07:00",
  "performer": [{ "reference": "Organization/{ihsOrg}" }],
  "result": [{ "reference": "urn:uuid:observation-lab-1" }]
}
```

### Composition  (**EHIS: `ResumeMedik`/`Cppt`/`Anamnesis`** — dokumen)
```json
{
  "resourceType": "Composition",
  "status": "final",
  "type": { "coding": [{ "system": "http://loinc.org", "code": "18842-5", "display": "Discharge Summary" }] },
  "subject": { "reference": "Patient/{ihsPatient}", "display": "BUDI SANTOSO" },
  "encounter": { "reference": "urn:uuid:encounter-1" },
  "date": "2026-08-19T12:00:00+07:00",
  "author": [{ "reference": "Practitioner/{ihsPractitioner}", "display": "dr. Bronsig" }],
  "title": "Resume Medis Rawat Jalan",
  "section": [{
    "code": { "coding": [{ "system": "http://loinc.org", "code": "42334-2", "display": "Discharge diet (narrative)" }] },
    "entry": [{ "reference": "urn:uuid:condition-1" }]
  }]
}
```

---

## C. Bundle transaction (kirim 1 kunjungan sekaligus — [docs/FHIR-RULES.md](FHIR-RULES.md) R16)

Referensi antar-entry pakai `fullUrl: urn:uuid:<x>`; urutan mengikuti Service Module ([TODO-FHIR.md §1e](../TODO-FHIR.md)).
```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:encounter-1",
      "resource": { "resourceType": "Encounter", "status": "arrived", "class": { "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB" }, "subject": { "reference": "Patient/{ihsPatient}" }, "serviceProvider": { "reference": "Organization/{ihsOrg}" } },
      "request": { "method": "POST", "url": "Encounter" }
    },
    {
      "fullUrl": "urn:uuid:condition-1",
      "resource": { "resourceType": "Condition", "code": { "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "A15.0" }] }, "subject": { "reference": "Patient/{ihsPatient}" }, "encounter": { "reference": "urn:uuid:encounter-1" } },
      "request": { "method": "POST", "url": "Condition" }
    },
    {
      "fullUrl": "urn:uuid:observation-1",
      "resource": { "resourceType": "Observation", "status": "final", "code": { "coding": [{ "system": "http://loinc.org", "code": "8867-4" }] }, "subject": { "reference": "Patient/{ihsPatient}" }, "encounter": { "reference": "urn:uuid:encounter-1" }, "valueQuantity": { "value": 80, "unit": "beats/minute", "system": "http://unitsofmeasure.org", "code": "/min" } },
      "request": { "method": "POST", "url": "Observation" }
    }
  ]
}
```
> Response = `Bundle type=transaction-response`; ambil `entry[].response.location` → IHS id per resource → simpan ke `fhir.ResourceMap` (R4/R8).

---

## D. Payload Postman byte-perfect — SUDAH DIAMBIL ✅

Verbatim official payload dari collection resmi SatuSehat sudah ditarik (via Postman API) ke
**[docs/fhir-postman/](fhir-postman/)** — `resources/*.json` (25 resource) + `bundles/*.json` (RJ/IGD/RI
transaction). Cara refresh (bila SatuSehat rilis versi baru) + daftar uid collection + legenda variabel =
**[docs/fhir-postman/README.md](fhir-postman/README.md)**. Workspace: `https://www.postman.com/satusehat/satusehat-public`.
