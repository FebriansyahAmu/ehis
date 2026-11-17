# L08 · `ttvToObservation` — Tanda Vital & Antropometri → Observation

| | |
|---|---|
| Status | ✅ dikoreksi S3 2026-11-17 — nyeri & GCS dikeluarkan (nyeri → L11 S4; GCS menunggu D5), nilai 0 = kosong; SpO₂ masih dikirim (D5 belum diputuskan) |
| Kamar | **Observation** category `vital-signs` (system `http://terminology.hl7.org/CodeSystem/observation-category`) |
| Playbook | RJ/IGD/RI §Pemeriksaan Fisik — Tanda Vital & Antropometri [V] |
| Contoh resmi | RI: 8480-6 · 8462-4 · 8310-5 · 8867-4 · 9279-1 · 8302-2 · 29463-7 · 8277-6 (semua `vital-signs`) |

## Sumber EHIS

`medicalrecord.Observation` (1 baris = 1 waktu observasi/shift): tdSistolik · tdDiastolik · nadi · respirasi ·
suhu · spo2 · gcsEye/Verbal/Motor · skalaNyeri · beratBadan · tinggiBadan · statusKesadaran · waktuObservasi ·
authorPegawaiId.

## Pemetaan (1 baris → N Observation, `localId` = `<observationId>:<key>`)

| key | Parameter | LOINC | UCUM | Status |
|---|---|---|---|---|
| `sbp` | Sistolik | `8480-6` | `mm[Hg]` | ✅ |
| `dbp` | Diastolik | `8462-4` | `mm[Hg]` | ✅ (terpisah dari sistolik, sesuai contoh resmi) |
| `hr` | Nadi | `8867-4` | `/min` (unit `beats/min`) | ✅ (samakan teks unit) |
| `rr` | Respirasi | `9279-1` | `/min` (unit `breaths/min`) | ✅ (samakan teks unit) |
| `temp` | Suhu | `8310-5` | `Cel` (unit `C`) | ✅ |
| `bh` | Tinggi badan | `8302-2` | `cm` | ✅ |
| `bw` | Berat badan | `29463-7` | `kg` | ✅ |
| `bsa` | Luas permukaan tubuh (anak) | `8277-6` | `m2` | 📋 opsional (hitung dari BB/TB) |
| `spo2` | Saturasi O₂ | `59408-5` | `%` | ⚠️ **di luar playbook** — kode HL7 vital-signs valid, tapi tahan sampai uji sandbox (D5) |
| `gcs` | GCS total | `9269-2` | `{score}` | ❌ **salah kamar**: bukan vital sign (category `exam`) & di luar playbook → keluarkan dari link ini; kesadaran resmi = L09 |
| `pain` | Skala nyeri | `72514-3` | `{score}` | ❌ **salah kamar**: playbook menaruh nyeri di asesmen nyeri category `survey` → pindah ke **L11** |

Elemen wajib [V]: `status` (`final`) · `code` · `subject` · `encounter` · `performer` (perawat pencatat).
`effectiveDateTime` = `waktuObservasi` (bukan `createdAt`).

## Gerbang pra-kirim

Nilai numerik valid (`Number.isFinite`, rentang fisiologis wajar — tolak 0 sebagai "tidak diisi") · performer
punya IHS · `statusKesadaran` → L09, bukan di sini.

## Jangan salah kamar

- Satu Observation = satu parameter (bukan panel `85353-1` dengan component) — sesuai contoh resmi.
- Skor nyeri, GCS, kesadaran **tidak** di category `vital-signs`.
- TTV triase IGD dan TTV ruangan memakai link yang sama (sumber tabel yang sama), dibedakan oleh waktu.

## Gap & koreksi

| # | Temuan | Tindakan |
|---|---|---|
| 1 | ✅ S3 — `pain` di vital-signs | Pindah ke L11 (survey, SNOMED 22253000 + NRS 1172399009) |
| 2 | ✅ S3 (keluar) — `gcs` di vital-signs | Keluarkan; putuskan kirim GCS sebagai `exam` setelah uji sandbox (D5) |
| 3 | `spo2` di luar playbook | Tahan / kirim terpisah dari Bundle atomik sampai terbukti diterima (D5) |
| 4 | ✅ S3 — Nilai `0` default ikut terkirim | Gerbang: 0 = kosong untuk parameter yang tak mungkin 0 |
