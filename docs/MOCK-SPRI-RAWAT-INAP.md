# MOCK — Penerbitan SPRI (Surat Perintah Rawat Inap) "Selalu Berhasil"

> **Status:** 🟡 MOCK aktif (pengembangan) · dibuat 2026-06-24
> **Tujuan:** alur **Selesaikan Kunjungan → Rawat Inap** di IGD (tab Pasien Pulang) bisa
> dijalankan tanpa integrasi V-Claim BPJS.
> **Aksi produksi:** ganti satu fungsi (`terbitkanSPRI`) ke panggilan V-Claim `insertSPRI`.
> Checklist di bawah.

---

## Apa yang di-mock

`terbitkanSPRI(request)` **selalu sukses** dan mengembalikan **nomor referensi SPRI** tiruan.
Tidak pernah melempar / gagal.

- **Format nomor referensi:** `PPK(4) R 001 MM YY K SEQ(6)` — contoh BPJS `0491R0010626K000291`
  = `0491` · `R` · `001` · `06` (bulan) · `26` (tahun) · `K` · `000291` (urutan).
  Bagian `MM/YY` sadar-waktu; `SEQ` 6-digit acak per terbit.
- Delay ~600ms meniru latensi jaringan (skeleton/loading tetap terlihat).

## Sumber tunggal (swap point)

| Item | Lokasi |
|---|---|
| **Fungsi mock** | [`src/components/igd/tabs/pasienPulang/spriMock.ts`](../src/components/igd/tabs/pasienPulang/spriMock.ts) → `terbitkanSPRI(req)` |
| Panel UI | [`SPRIPanel.tsx`](../src/components/igd/tabs/pasienPulang/SPRIPanel.tsx) (dipakai saat status pemulangan = **Rawat Inap**) |
| Tab induk | [`PasienPulangTab.tsx`](../src/components/igd/tabs/PasienPulangTab.tsx) — gerbang submit `spriIssued` |

```ts
// Kontrak yang DIPERTAHANKAN saat ganti ke produksi (1:1 payload BPJS request.*):
export interface SPRIRequest {
  noKartu: string;            // nomor kartu BPJS peserta
  kodeDokter: string;         // kode dokter DPJP (kode BPJS)
  poliKontrol: string;        // kode poli/spesialistik TUJUAN rawat (lihat catatan di bawah)
  tglRencanaKontrol: string;  // yyyy-MM-dd — tanggal mulai rawat inap
  user: string;               // user pembuat SPRI (login)
}
export async function terbitkanSPRI(req: SPRIRequest): Promise<SPRIResult>; // { noReferensi, ... }
```

## Pemetaan form → payload

Form panel (4 field yang diminta) → payload BPJS:

| Field form | Payload | Catatan |
|---|---|---|
| **Nomor Referensi** | *(response)* | read-only, muncul setelah terbit |
| **DPJP** | `kodeDokter` **+ sumber SMF** | kirim **nama** DPJP (TODO map → kode BPJS) · **`spesialistik` DPJP → `poliKontrol`** |
| **SMF / Poli Tujuan** | `poliKontrol` | **read-only, auto** dari spesialistik DPJP via [`smfPoliMap.ts`](../src/components/igd/tabs/pasienPulang/smfPoliMap.ts) |
| **Jenis Ruang Perawatan** | — (field RS) | tipe ruang/kelas rawat; **tidak lagi** dipakai sbg poliKontrol |
| **Indikasi / Keterangan** | — | field RS untuk dokumen SPRI cetak; tidak ada di payload BPJS |
| *(otomatis)* `patient.noBpjs` | `noKartu` | dari penjamin pasien |
| *(otomatis)* tgl dipilih | `tglRencanaKontrol` | default hari ini (DatePicker) |
| *(otomatis)* user login | `user` | `session.namaTampil` |

## ✅ `poliKontrol` = SMF tujuan, diturunkan dari DPJP (sudah diimplementasi)

`poliKontrol` pada `insertSPRI` BPJS = **kode poli/spesialistik TUJUAN tempat pasien akan
dirawat-inapkan** (mis. `INT` Penyakit Dalam, `JAN` Jantung) — yaitu SMF/spesialistik DPJP
penanggung jawab rawat inap. **Bukan** ruang/IGD asal tempat SPRI diterbitkan. (Fakta "SPRI
sebagian besar terbit lewat IGD" hanya menentukan *asal* penerbitan.)

**Rantai turunan (live):** DPJP terpilih → `roster.spesialistik` (dari `master.Pegawai.spesialistik`,
disurface lewat `PetugasDTO.spesialistik` di `GET /kunjungan/:id/petugas`) → `resolvePoliBpjs()`
([`smfPoliMap.ts`](../src/components/igd/tabs/pasienPulang/smfPoliMap.ts)) → `{ kode, nama }` poli →
`poliKontrol`. Ditampilkan read-only di panel (kartu "SMF / Poli Tujuan").

> ⚠️ Kode poli di `smfPoliMap` = **aproksimasi gaya BPJS**. Saat produksi, RECONCILE dgn referensi
> resmi V-Claim `getPoliRK`/`getDokterRK` ([`vClaimRencanaKontrol.ts`](../src/lib/bpjs/vClaimRencanaKontrol.ts)
> spec 10–11) — kode bisa beda per regional/PPK.
>
> **Edge case:** DPJP **dokter umum** (tanpa `spesialistik`) → tak ada SMF → `poliKontrol` dikirim
> kosong + panel menampilkan peringatan. Putuskan fallback (poli "Umum" / pilih manual) saat produksi.

---

## ✅ Checklist migrasi ke PRODUKSI (V-Claim insertSPRI)

1. Implementasikan body `terbitkanSPRI()` → panggil BFF V-Claim `insertSPRI`
   (sudah ada adapter mock: [`vClaimRencanaKontrol.ts`](../src/lib/bpjs/vClaimRencanaKontrol.ts) `insertSPRI`).
2. **`kodeDokter`**: tambah pemetaan `Pegawai/Dokter → kode dokter BPJS`; ganti pengiriman nama DPJP.
3. **`poliKontrol`**: derivasi dari spesialistik DPJP **sudah jalan** ([`smfPoliMap.ts`](../src/components/igd/tabs/pasienPulang/smfPoliMap.ts)).
   Sisa: (a) reconcile kode poli dgn referensi `getPoliRK`; (b) tentukan fallback DPJP dokter umum (tanpa SMF).
4. Aktifkan kembali kemungkinan **gagal**: panel `SPRIPanel` perlu menampilkan error & TIDAK
   meng-set `spriIssued` saat respons BPJS bukan sukses (sekarang dipaksa sukses).
5. Hapus banner **"Mode Demo · Mock SPRI"** di `SPRIPanel`.
6. (Opsional) Simpan SPRI ke domain RS (mis. `medicalrecord.Disposisi` / tabel SPRI) + cetak A4.
7. Hapus delay tiruan 600ms.
