# L07 · `riwayatObatToMedicationStatement` — Riwayat Pengobatan → MedicationStatement

| | |
|---|---|
| Status | 🟡 S5a 2026-11-18 — terkirim untuk obat dipilih dari rekomendasi formularium ber-KFA · ketik bebas / tanpa KFA ditahan (FG-134) |
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

## Dibangun S5a (2026-11-18)

Verbatim playbook RJ/RI Tabel 3 · IGD Tabel 4 item 6 + skenario (RJ/RI Tabel 4 · IGD Tabel 5): wajib `status` · `medication[x]` ·
`subject` (+ `context` bertanda * di IGD). Obat **bukan dari fasyankes ini** → `medicationCodeableConcept` system `http://sys-ids.kemkes.go.id/kfa`:
`93…` "Kode Produk Obat Aktual" bila merek diketahui, `92…` "Kode Produk Obat Template" bila tidak (contoh: 93005512 / 92001087 Ampicillin).

- **Form (IGD · RI · RJ, satu editor bersama):** Nama obat = combobox ketik + **rekomendasi formularium RS** (`/master/obat-tersedia`) dengan
  badge KFA; pilih → `obat_id` tertaut; ketik ulang → lepas tautan. Isian **Status** baru (Masih diminum → `active` · Sudah berhenti → `completed`).
- **Kode:** server memvalidasi `obat_id`; KFA diturunkan dari `master.obat.kfa` saat kirim (tidak dari klien). **Template 92 diutamakan**, aktual 93
  cadangan (riwayat dituturkan — merek umumnya tak diketahui, FG-135).
- **Elemen:** `dateAsserted` = waktu simpan · `dosage.text` = dosis · frekuensi · rute · `note` = sejak · indikasi. `category`, `effective[x]`,
  `informationSource` tidak dikirim (FG-136). localId `<kunjunganId>:riwayat-obat:<obatId>`; obat yang dihapus → entered-in-error.
- **Issue `kode-kosong`:** ketik bebas · obat katalog tanpa KFA · status kosong.
- Composition: sub-section **Riwayat Pengobatan** `10160-0` "History of Medication use Narrative".
- Belum: obat dari fasyankes ini via `medicationReference` (MedicationDispense) · pencarian KFA nasional (FH8).

## Jangan salah kamar

- Riwayat obat **bukan** MedicationRequest (itu resep kunjungan ini, L18).
- Obat pulang **bukan** MedicationStatement → MedicationRequest/Dispense ber-`category` discharge (L18/L20).
