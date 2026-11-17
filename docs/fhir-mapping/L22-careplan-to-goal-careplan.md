# L22 · `carePlanToGoalCarePlan` — Rencana Asuhan → Goal + CarePlan

| | |
|---|---|
| Status | ✅ S4c 2026-11-18 ([adapters/rencana.ts](../../src/lib/fhir/adapters/rencana.ts) · [rencanaSyncService](../../src/lib/services/fhir/rencanaSyncService.ts)) — Goal `description.text` (contoh resmi RI juga teks saja → gerbang SNOMED gugur) · CarePlan per masalah, category IGD `TK000068` mengikuti tabel playbook (FG-120) · sisa: pola CarePlan per kunjungan & instruksi medik (FG-124) |
| Kamar | **Goal** (category `nursing`) + **CarePlan** (rencana rawat & instruksi medik/keperawatan) |
| Playbook | RJ/IGD/RI §Tujuan Perawatan (Goal) · §Rencana Rawat · §Instruksi Medik dan Keperawatan (CarePlan) [V] |
| Contoh resmi | RJ: 2× `CarePlan cat 736271009` · IGD: 2× `CarePlan cat 702779007` · RI: `Goal cat nursing` + 2× `CarePlan cat 736353004` |

## Sumber EHIS

`CarePlanMasalah` (masalah · sumber Diagnosa/SDKI · refKode · status · verifikasi DPJP) + `CarePlanGoal` (ppa ·
target · indikator · targetWaktu · intervensi[] · status · evaluasi). Saat ini **RI** saja.

## Pemetaan

| Resource | Elemen | Sumber / aturan |
|---|---|---|
| **Goal** (per CarePlanGoal) | `lifecycleStatus*` | `planned`/`active`/`completed`/`cancelled` dari status goal |
| | `category` | system `goal-category` code `nursing` |
| | `description*` | SNOMED (ECL `< 404684003`) + `text` = target — **target EHIS teks bebas** → lihat gerbang |
| | `achievementStatus` | dari `evaluasi` (system `goal-achievement`) |
| | `target.dueDate` | `targetWaktu` bila tanggal |
| | `expressedBy` · `addresses` | Practitioner PPA · Condition (bila `sumber` = Diagnosa → L13) |
| **CarePlan** (per masalah) | `status*` · `intent*` | `active`/`completed` · `plan` |
| | `category*` | per unit (contoh resmi): RJ `736271009` · IGD `702779007` (tabel playbook IGD menyebut `TK000068` → verifikasi) · RI `736353004` |
| | `title*` · `description*` | masalah · ringkasan intervensi |
| | `goal` | Goal terkait |
| | `subject*` · `encounter*` · `author*` | Patient · Encounter · pencatat/DPJP verifikator |

`localId` = `<goalId>` · `<masalahId>`.

## Gerbang pra-kirim

`Goal.description` wajib CodeableConcept — **contoh resmi RI memakai `{"text": …}` saja** (dicek 2026-11-18), jadi target teks
bebas dikirim sebagai `text` tanpa SNOMED. Wajib playbook RI Tabel 8: `lifecycleStatus` · `description` · `subject`.
CarePlan wajib `author` → ditahan bila pencatat belum onboarding Practitioner (FG-125). DPJP verifikasi (co-sign) belum jadi
gerbang (FG-124).

**Dibangun S4c:** lifecycle Goal = status goal (`Tercapai` → completed) kecuali masalah Teratasi (completed) / Batal (cancelled) /
terhapus (entered-in-error); `achievementStatus` goal-achievement `in-progress`/`improving`/`achieved`; `statusDate` = tanggal WIB;
target waktu · intervensi · evaluasi → `note`. CarePlan: status Aktif/Teratasi/Batal → active/completed/revoked, `description` =
masalah (+ sumber/kode) + daftar tujuan. Category: RI `736353004` "Inpatient care plan" (Tabel 9) · IGD `TK000068` "Emergency care
plan" (Tabel 10) · RJ `736271009` (contoh). Goal & CarePlan masuk section Composition "Perencanaan Perawatan" 18776-5.

## Jangan salah kamar

- Rencana pemulangan = CarePlan `736372004` (**L23**), bukan rencana rawat.
- Diagnosa keperawatan SDKI tidak dikirim sebagai Condition; masuk sebagai konteks `CarePlan.description`.
- Instruksi medik di CPPT (`Cppt.instruksi`) belum dikirim (🚫) — kandidat CarePlan kedua bila diputuskan.
