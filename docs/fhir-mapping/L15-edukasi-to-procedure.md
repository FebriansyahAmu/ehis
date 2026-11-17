# L15 · `edukasiToProcedure` — Edukasi Pasien → Procedure (Education)

| | |
|---|---|
| Status | 🟡 S4c 2026-11-18 — edukasi pemulangan ✅ (SNOMED topik + KPTL 10913) · 7/12 topik tanpa padanan ditahan (FG-122) · edukasi saat asesmen belum |
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

**Dibangun S4c (2026-11-18):** topik pemulangan = template FE `TOPIK_EDUKASI_TEMPLATE` (bukan tabel master) → peta kode di
`EDUKASI_TOPIK` (conceptMap, diuji mencakup semua template). Display verbatim playbook RJ Tabel 25:

| Template | SNOMED |
|---|---|
| edu-01 Diagnosis & perjalanan penyakit | `84635008` Disease process or condition education |
| edu-03 Cara penggunaan obat · edu-04 Efek samping obat | `967006` Medication education |
| edu-05 Diet & nutrisi | `61310001` Nutrition education |
| edu-07 Aktivitas fisik bertahap (kategori Rehabilitasi) | `410082002` Rehabilitation therapy education |
| edu-02 · 06 · 08 · 09 · 10 · 11 · 12 | — tidak ada padanan pasti → ditahan (FG-122) |

Daftar playbook juga memuat `712651001` Education about pain · `698608004` Hand washing education · `362978005` Medical equipment or
device education (belum ada template topiknya). KPTL `10913` "Edukasi Kesehatan Individu" **wajib** bersama SNOMED ("Perlu dikirimkan
2 `Procedure.code` dalam 1 payload"). `performedPeriod` = jam pencatatan bila hari sama dengan tanggal sesi, selain itu tanggal saja (FG-123).

## Jangan salah kamar

Edukasi **bukan** CarePlan dan bukan Communication; satu sesi edukasi per topik = satu Procedure.
