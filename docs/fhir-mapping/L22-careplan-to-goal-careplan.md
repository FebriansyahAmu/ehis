# L22 · `carePlanToGoalCarePlan` — Rencana Asuhan → Goal + CarePlan

| | |
|---|---|
| Status | 📋 belum ada |
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

`Goal.description` wajib CodeableConcept — target teks bebas tanpa SNOMED: verifikasi sandbox apakah `text` saja
diterima; bila tidak → belum siap (jangan karang kode). DPJP verifikasi (co-sign) sebaiknya sudah ada sebelum kirim.

## Jangan salah kamar

- Rencana pemulangan = CarePlan `736372004` (**L23**), bukan rencana rawat.
- Diagnosa keperawatan SDKI tidak dikirim sebagai Condition; masuk sebagai konteks `CarePlan.description`.
- Instruksi medik di CPPT (`Cppt.instruksi`) belum dikirim (🚫) — kandidat CarePlan kedua bila diputuskan.
