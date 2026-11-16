# L14 · `tindakanToProcedure` — Prosedur & Tindakan Medis → Procedure

| | |
|---|---|
| Status | ⚠️ ada (FH4, `toFhirProcedure`) — tanpa `category`, tindakan tanpa ICD-9 hilang |
| Kamar | **Procedure** (`status` completed) — ICD-9-CM (+ KPTL / SNOMED) |
| Playbook | RJ/IGD/RI §Tindakan/Prosedur Medis [S] |
| Contoh resmi | RJ: `cat 277132007 · icd-9-cm|93.94 Nebulizer` · IGD: `cat 373110003 · icd-9-cm|74.0` · RI: Procedure `icd-9-cm|39.95 Hemodialysis + sct|302497006` (KPTL `11586…` ada di ServiceRequest order-nya) |

## Sumber EHIS

| Sumber | Isi | Peran |
|---|---|---|
| `DiagnosaProsedur` | kode ICD-9-CM · nama · kategori | **pengodean** (klaim) |
| `TindakanMedis` | kode katalog (ICD-9 opsional) · nama · kategori (16) · pelaksana · `dilakukanPada` | **pelaksanaan** (billing) |

**Aturan sumber tunggal (sudah dipakai FH4):** ICD-9 yang sama di kedua sumber dikirim **sekali**. Prioritas
waktu & performer dari `TindakanMedis` (lebih akurat); kode dari `DiagnosaProsedur`. Kunci dedupe = kode ICD-9.

## Pemetaan elemen (`*` wajib)

| Elemen | Aturan |
|---|---|
| `status*` | `completed` · dihapus → `entered-in-error` |
| `category` | SNOMED, ECL `< 71388002 |Procedure|` — ConceptMap dari kategori tindakan (di bawah) |
| `code*` | ICD-9-CM `http://hl7.org/fhir/sid/icd-9-cm` (+ KPTL `http://terminology.kemkes.go.id/CodeSystem/kptl` bila katalog punya) |
| `subject*` · `encounter*` | ✅ |
| `performer.actor*` | Practitioner IHS pelaksana |
| `performedPeriod` | `dilakukanPada` (start=end bila durasi tak dicatat) |
| `reasonReference` | Condition diagnosis Utama (L13) — lebih tepat dari `reasonCode` teks |
| `note` | catatan |

## ConceptMap kategori → `category` (usulan, perlu cek 16 kategori katalog)

| Jenis | SNOMED |
|---|---|
| Diagnostik (EKG, spirometri, …) | `103693007` Diagnostic procedure |
| Terapeutik (nebulizer, hemodialisis, …) | `277132007` Therapeutic procedure |
| Bedah / operatif | `387713003` Surgical procedure |
| Konseling | `409063005` Counseling |
| Edukasi | → **L15** (bukan di sini) |

## Gerbang pra-kirim

Kode ICD-9-CM ada (FG-37: tindakan katalog tanpa ICD-9 = belum siap, tampil di konsol — bukan dilewati diam-diam) ·
performer punya IHS.

## Jangan salah kamar

- Edukasi pasien **bukan** Procedure umum — punya category `409073007` sendiri (L15).
- Status puasa sebelum lab = Procedure `792805006` milik **L16**, bukan tindakan medis.
- Pemeriksaan penunjang non-lab/rad (EKG/ekokardiografi `PemeriksaanPenunjang`) → Procedure + Observation hasil (pola RI §15), bukan DiagnosticReport lab.
- `focalDevice`/`usedCode` alkes → fase Alkes (⛔), jangan diisi kode sementara.
