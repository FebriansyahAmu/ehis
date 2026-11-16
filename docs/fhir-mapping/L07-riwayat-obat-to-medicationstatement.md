# L07 · `riwayatObatToMedicationStatement` — Riwayat Pengobatan → MedicationStatement

| | |
|---|---|
| Status | 📋 belum ada — butuh perubahan entry (D7) |
| Kamar | **MedicationStatement** |
| Playbook | RJ/IGD/RI §Anamnesis — Riwayat Pengobatan [V] |
| Contoh resmi | RI bundle: `MedicationStatement(completed) cat=[inpatient]` |

## Sumber EHIS

`medicalrecord.AsesmenObat` + `AsesmenObatItem` (nama · dosis · frekuensi · rute · sejak · indikasi) —
**nama obat ketik bebas**. `Anamnesis.obatSaatIni` (teks) dan `Rekonsiliasi` **tidak** dipakai (sumber tunggal = AsesmenObat).

## Pemetaan elemen (`*` wajib)

| Elemen | Aturan |
|---|---|
| `status*` | `active` (masih diminum) / `completed` |
| `medication[x]*` | **Obat dari RS ini** → `medicationReference` ke Medication yang pernah di-dispense (cari via MedicationDispense pasien) · **Obat dari luar** → `medicationCodeableConcept` KFA: `93…` bila merek diketahui, `92…` bila hanya generik [V] |
| `subject*` | Patient |
| `context*` (IGD) | Encounter |
| `category` | sesuai contoh resmi (`inpatient` untuk RI; outpatient/community untuk RJ — verifikasi sandbox) |
| `effectivePeriod.start` | `sejak` bila terstruktur |
| `dosage.text` | gabungan dosis + frekuensi + rute |
| `reasonCode`/`note` | `indikasi` sebagai teks |

## Masalah kualitas data → D7

`medication[x]*` wajib berkode KFA, sedangkan sumber teks bebas. Usulan: item riwayat obat memakai **picker
KFA** (sama dengan katalog obat, plus pencarian KFA 92/93 untuk obat yang tidak ada di formularium RS).
Item tanpa KFA → belum siap (teks tetap tersimpan lokal).

## Jangan salah kamar

- Riwayat obat **bukan** MedicationRequest (itu resep kunjungan ini, L18).
- Obat pulang **bukan** MedicationStatement → MedicationRequest/Dispense ber-`category` discharge (L18/L20).
