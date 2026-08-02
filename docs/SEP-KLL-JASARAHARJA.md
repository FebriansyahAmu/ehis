# SEP Kecelakaan (KLL) & Klaim Jasa Raharja / BPJS — Aturan & Implementasi

> Referensi kanonik penerbitan SEP untuk pasien kecelakaan + alur klaim berjenjang.
> Baca sebelum menyentuh jaminan kecelakaan pada SEP / tab Data Kecelakaan.

## 1. Prinsip — penjaminan berjenjang (tiered)

KLL **bukan** ditanggung BPJS lebih dulu (koordinasi Jasa Raharja–BPJS–Polri; UU 33 & 34/1964 jo Perpres 82/2018 Pasal 52):

1. **Penjamin pertama = PT Jasa Raharja** — biaya perawatan **maks. Rp 20.000.000** (santunan meninggal/cacat Rp 50 jt = pos terpisah, bukan perawatan).
2. **Sisa di atas plafon → BPJS Kesehatan (suplesi)** — syarat peserta aktif + rujukan berjenjang.
3. Kecelakaan kerja murni → **BPJS Ketenagakerjaan (JKK)**, bukan BPJS Kesehatan.

## 2. Kode `lakaLantas` (t_sep.jaminan.lakaLantas)

| Kode | Enum (`bpjs.LakaLantas`) | Makna | Penjamin |
|---|---|---|---|
| `0` | `BKLL` | Bukan laka lantas | BPJS reguler |
| `1` | `KLL_BKK` | KLL, bukan kecelakaan kerja | **Jasa Raharja** ≤20jt → BPJS suplesi |
| `2` | `KLL_KK` | KLL sekaligus kecelakaan kerja | JR → **BPJS Ketenagakerjaan** |
| `3` | `KK` | Kecelakaan kerja murni | **BPJS Ketenagakerjaan** |

**Derivasi dari `encounter.Kecelakaan.jenis`** (jembatan): `kll`→`KLL_BKK` · `kerja`→`KK` · `lainnya`→`BKLL`.
`KLL_KK` (dua-duanya, mis. ojol saat tugas) = edge-case → disetel operator langsung di form SEP (jenis tunggal tak bisa mewakili dua).

## 3. Field jaminan pada SEP KLL

- `lakaLantas` (kode) · `noLP` (No. Laporan Polisi — sering belum ada saat masuk IGD; boleh disusulkan)
- `penjamin.tglKejadian` · `penjamin.keterangan` (kronologi)
- `penjamin.suplesi.{suplesi, noSepSuplesi}` (lanjutan perawatan kecelakaan yang sama = 1 episode)
- `penjamin.suplesi.lokasiLaka.{kdPropinsi, kdKabupaten, kdKecamatan}` — **kode wilayah BPJS** lokasi kejadian (routing cabang JR). **DITUNDA** (lihat §6).

## 4. Alur klaim end-to-end

```
Pasien KLL masuk (IGD/RJ/RI)
  └─ Terbit SEP lakaLantas≠0  (jaminan sementara bila LP belum ada)
       └─ RS lapor Jasa Raharja + lengkapi No. LP (updateSEP)
            └─ JR verifikasi & jamin biaya perawatan ≤ Rp 20 jt
                 └─ biaya > 20 jt → SEP suplesi (suplesi=1, noSepSuplesi=SEP awal)
                      └─ selisih ditagih ke BPJS (INA-CBG/iDRG)
```

V-Claim terkait: `insertSEP` (flag) · `suplesiCek` · `dataIndukKecelakaan` · `updateSEP` (tambah noLP). Ketiga read = mock di `/ehis-bpjs`.

## 5. Implementasi di sistem (per 2026-08-02)

### Dua gerbang menulis `SEP.jaminan`
1. **Form SEP pendaftaran** ([SepFormBody](../src/components/registration/patient/modals/daftar-kunjungan/sep/SepFormBody.tsx)) — section "Jaminan Kecelakaan": operator isi lakaLantas/noLP/tglKejadian/keterangan/suplesi manual saat terbit SEP.
2. **Tab Data Kecelakaan → jembatan** ([SepBridgePanel](../src/components/registration/kunjungan/Tabs/kecelakaan/SepBridgePanel.tsx)) — primitif **`kecelakaanService.syncToSep`** menyalin data kecelakaan tersimpan ke **SEP aktif** (`bpjsDal.updateSepJaminan`): lakaLantas (derive dari jenis) + No. LP + tgl kejadian + kronologi + suplesi. Pola sama dengan `linkRujukan`.

Endpoint: `POST /kunjungan/:id/kecelakaan/sync-sep` (gate `registration.kunjungan:update`) · `GET /kunjungan/:id/kecelakaan/suplesi-kandidat` (SEP KLL terbit pasien lintas kunjungan → kandidat No. SEP suplesi).

### Suplesi
`encounter.Kecelakaan.{suplesi, noSepSuplesi}` (migrasi `20260802160000`). FE: checkbox "Perawatan lanjutan" + chip kandidat SEP KLL sebelumnya (dari `listLakaSepByPatient`) → tersalin ke `SEP.jaminan.penjamin.suplesi` saat sync.

### No. LP susulan
LP yang datang belakangan → isi di tab (statusLP=`ada` + noLapPol) → **Sinkronkan ke SEP** menuliskan `noLp` ke SEP aktif (menutup kebutuhan updateSEP-noLP dari sisi RS).

## 6. Yang DITUNDA (butuh sisi BPJS)

- **`lokasiLaka` (kode wilayah kejadian)** — SEP butuh **kode referensi BPJS**, sedangkan `master.Wilayah` yang di-seed = **Kemendagri** (kode berbeda). Perlu **referensi wilayah BPJS + mapping Kemendagri↔BPJS**, di-sync dari endpoint referensi BPJS (konektor masih mock). Sampai itu ada: `lokasiLaka` **dikosongkan**; `updateSepJaminan` sengaja TIDAK menulis `lokasiKdProp/Kab/Kec` (kolom SEP sudah ada, tetap null). SEP KLL tetap terbit & sebagian besar valid; hanya routing presisi JR menunggu.
- **Konektor Jasa Raharja / `suplesiCek` / `dataIndukKecelakaan` NYATA** — masih mock (belum ada cons-id). Status koordinasi JR + status klaim di tab = tracker manual RS.
- **`updateSEP` V-Claim nyata** — `syncToSep` menulis DB SEP.jaminan (mock issuance). Saat V-Claim aktif, panggil `updateSEP` di dalam alur yang sama.

## 7. Aturan main

- Jembatan membaca record kecelakaan **tersimpan** (single source) → simpan dulu sebelum sync.
- `syncToSep` menolak: non-BPJS · tanpa SEP aktif · kunjungan `Cancelled`.
- `lakaLantas` = derivasi jenis (server-otoritatif), bukan input bebas FE.
- Jangan menulis `lokasiKd*` sampai referensi/mapping BPJS tersedia (hindari kirim kode Kemendagri ke field BPJS).
