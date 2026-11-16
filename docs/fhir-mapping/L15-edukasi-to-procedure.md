# L15 · `edukasiToProcedure` — Edukasi Pasien → Procedure (Education)

| | |
|---|---|
| Status | 📋 belum ada |
| Kamar | **Procedure** category SNOMED `409073007` "Education" |
| Playbook | RJ §Edukasi · RI §21 [V] |
| Contoh resmi | RJ: `cat 409073007 · sct|61310001 Nutrition education` · RI: `sct|84635008 + kptl|10913` |

## Sumber EHIS

`DischargeEdukasi` (topikId · topik · kategori · tanggal · profesi · metode · penerima · pemahaman · petugas ·
deletedAt) · `AsesmenEdukasiPasien` / `AsesmenEdukasiEmergency` (edukasi saat asesmen).

## Pemetaan elemen

| Elemen | Aturan |
|---|---|
| `status` | `completed` · dihapus → `entered-in-error` |
| `category` | SNOMED `409073007` Education |
| `code` | **2 coding dalam 1 payload** [V]: KPTL `10913` "Edukasi Kesehatan Individu" (system `http://terminology.kemkes.go.id/CodeSystem/kptl`) **+** SNOMED topik (ECL `< 409073007`) |
| `subject` · `encounter` | ✅ |
| `performer.actor` | Practitioner IHS petugas edukasi |
| `performedDateTime` | `tanggal` |
| `note` | metode · penerima (pasien/keluarga) · pemahaman |

`localId` = `<dischargeEdukasiId>`.

## ConceptMap topik → SNOMED (contoh dari playbook)

| Topik | SNOMED |
|---|---|
| Proses penyakit, diagnosis, rencana asuhan | `84635008` |
| Obat-obatan | `967006` |
| Rehabilitasi medis | `410082002` |
| Manajemen nyeri | `712651001` |
| Gizi | `61310001` |
| Cuci tangan | `698608004` |
| Penggunaan alat medis | `362978005` |

Usulan data: tambah kolom `snomedCode` pada master topik edukasi (`topikId`) — topik tanpa kode = belum siap.

## Jangan salah kamar

Edukasi **bukan** CarePlan dan bukan Communication; satu sesi edukasi per topik = satu Procedure.
