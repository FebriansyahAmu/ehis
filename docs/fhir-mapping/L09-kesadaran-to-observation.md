# L09 · `kesadaranToObservation` — Tingkat Kesadaran → Observation

| | |
|---|---|
| Status | ✅ S4 2026-11-17 ([links/pemeriksaan.ts](../../src/lib/fhir/links/pemeriksaan.ts) · [adapters/pemeriksaan.ts](../../src/lib/fhir/adapters/pemeriksaan.ts)) — AVPU triase + `statusKesadaran` TTV; **Apatis ditahan** (Issue `menunggu-keputusan`, D3 / FG-104). Masuk section Composition **Tanda Vital** (contoh resmi RI) |
| Kamar | **Observation** category `exam` · code LOINC `67775-7` "Level of responsiveness" · `valueCodeableConcept` SNOMED |
| Playbook | IGD §5c · RJ/RI §Pemeriksaan Fisik [V IGD] |
| Contoh resmi | RJ/IGD/RI: `Observation cat=[exam] loinc|67775-7` (RJ menaruhnya di `vital-signs` — contoh tidak konsisten; ikuti tabel playbook: `exam`) |

## Sumber EHIS (keputusan D3 — sumber tunggal per momen)

| Momen | Sumber | Nilai lokal |
|---|---|---|
| Triase IGD | `Triase.avpu` | AVPU |
| Observasi berkala (semua unit) | `Observation.statusKesadaran` | `Compos_Mentis` · `Apatis` · `Somnolen` · `Sopor` · `Koma` |
| Tidak dipakai | `PenilaianFisik.kesadaran` · `PemeriksaanFisik.kesadaran` · `PenilaianStatus.kesadaran` · `Triase.kondisiTiba` | duplikat → hindari 3 versi kesadaran yang berbeda di SatuSehat |

## Nilai resmi (SNOMED) [V IGD — diverifikasi ulang verbatim 2026-11-17]

| Kode | Display | Label playbook |
|---|---|---|
| `248234008` | Mentally alert | Sadar Baik / Alert |
| `300202002` | Response to voice | Berespon dengan kata-kata / Voice |
| `450847001` | Response to pain | Hanya berespons jika dirangsang nyeri / Pain |
| `422768004` | Unresponsive | Tidak sadar / Unresponsive |
| `130987000` | Acute confusion | Gelisah atau bingung |
| `2776000` | Delirium | Acute Confusional States |

## ConceptMap (usulan — perlu konfirmasi klinis)

| Lokal | SNOMED | Catatan |
|---|---|---|
| AVPU `A` | `248234008` | padanan langsung |
| AVPU `V` | `300202002` | padanan langsung |
| AVPU `P` | `450847001` | padanan langsung |
| AVPU `U` | `422768004` | padanan langsung |
| `Compos_Mentis` | `248234008` | |
| `Somnolen` | `300202002` | mendekati (mengantuk, bangun dengan suara) |
| `Sopor` | `450847001` | mendekati (bangun dengan nyeri) |
| `Koma` | `422768004` | |
| `Apatis` | **belum ada padanan** | D3: pilih `248234008` + `valueCodeableConcept.text`, atau jangan kirim |

## Elemen wajib

`status` · `code` · `subject` · `encounter` · `performer` · `effectiveDateTime` (= waktu triase / observasi).
`localId` = `<triaseId>:avpu` atau `<observationId>:kesadaran`.

## Jangan salah kamar

Kesadaran **bukan** GCS (GCS = skor, di luar playbook) dan **bukan** level triase (L02).
