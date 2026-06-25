# MOCK — SPRI (Surat Perintah Rawat Inap) + Lifecycle Admisi

> **Status:** 🟡 MOCK aktif (pengembangan) · dibuat 2026-06-24 · arsitektur lifecycle 2026-06-25
> **Tujuan:** alur **IGD pulang → Rawat Inap** berjalan tanpa integrasi V-Claim BPJS, dengan
> penerbitan No. Referensi + revisi + worklist admisi yang terpersist.
> **Aksi produksi:** ganti satu fungsi server (`issueSpriRef`) ke V-Claim `insertSPRI`.

---

## Arsitektur (ringkas)

SPRI = **artefak administratif BPJS dengan lifecycle sendiri**, DIPISAH dari `medicalrecord.Disposisi`
(snapshot klinis immutable yang ikut lock kunjungan). Tabel **`encounter.Spri`** punya `status` +
`version`, sehingga **No. Referensi bisa direvisi SETELAH kunjungan IGD terkunci**.

```
IGD: status pulang "Rawat Inap" → Selesaikan
  └─ kunjunganService.transition("complete") [1 transaksi]
       ├─ tulis medicalrecord.Disposisi (jenis Rawat_Inap)
       ├─ issueSpriRef(noKartu) → No. Referensi | null
       ├─ buat encounter.Spri (status Terbit | MenungguRef)
       └─ set kunjungan.lockedAt (selesai + terkunci)

Registrasi: /ehis-registration (Beranda → tab "Admisi IGD & RI" — worklist kartu SPRI)
  ├─ "Revisi & Kirim Ulang" → PATCH /spri/:id/revisi → retry issueSpriRef  (boleh saat IGD terkunci)
  └─ "Daftar Rawat Inap"    → /pasien/{noRM}?daftar=ranap&spri={id}
       └─ DaftarKunjunganModal (initial unit=Rawat Inap) → daftar RI sukses
            └─ POST /spri/:id/konsumsi (riKunjunganId) → status Dikonsumsi (keluar worklist)
```

**Status SPRI:** `MenungguRef` (ref belum terbit / BPJS bermasalah) · `Terbit` (ref ada) ·
`Dikonsumsi` (admisi RI dibuat) · `Batal`.

## Apa yang di-mock

`issueSpriRef(noKartu)` (server) — mengembalikan No. Referensi format `0491R0010625K000291`
(`PPK·R·001·MM·YY·K·SEQ`), atau **`null`** bila kepesertaan dianggap bermasalah. Aturan demo
"tidak aktif" (sampai V-Claim nyata): **noKartu kosong** ATAU **digit terakhir = `0`**. Surat SPRI
TETAP terbit saat null — referensi diisi via revisi.

## Sumber tunggal (swap point)

| Item | Lokasi |
|---|---|
| **Mock BPJS (issue ref)** | [`src/lib/services/spri/spriBpjsMock.ts`](../src/lib/services/spri/spriBpjsMock.ts) → `issueSpriRef(noKartu)` |
| Penerbitan atomik (complete) | [`kunjunganService.ts`](../src/lib/services/kunjunganService.ts) blok `action === "complete"` |
| Lifecycle (worklist/revisi/konsumsi) | [`spriService.ts`](../src/lib/services/spri/spriService.ts) · DAL [`spriDal.ts`](../src/lib/dal/spri/spriDal.ts) |
| Kontrak | `encounter.Spri` (prisma/schema/encounter.prisma) · Zod `SpriInput`/`SpriDTO` [disposisi.ts](../src/lib/schemas/disposisi/disposisi.ts) |
| API client | [`src/lib/api/spri/spri.ts`](../src/lib/api/spri/spri.ts) (`listSpri`/`reviseSpri`/`consumeSpri`) |
| Form IGD | [`SPRIPanel.tsx`](../src/components/igd/tabs/pasienPulang/SPRIPanel.tsx) (form murni; emit `onChange`) |
| Worklist admisi | [`AdmisiRanapBoard.tsx`](../src/components/registration/admisi/AdmisiRanapBoard.tsx) — tab "Admisi IGD & RI" di Beranda Registrasi ([RegistrationBerandaPage.tsx](../src/components/registration/beranda/RegistrationBerandaPage.tsx)); tab "Admisi RJ" = [`AdmisiRjBoard.tsx`](../src/components/registration/admisi/AdmisiRjBoard.tsx) (riwayat pendaftaran RJ) |
| SMF→poli | [`smfPoliMap.ts`](../src/components/igd/tabs/pasienPulang/smfPoliMap.ts) (turun dari spesialistik DPJP) |

## Pemetaan form → kontrak

| Field form (SPRIPanel) | Tujuan | Catatan |
|---|---|---|
| DPJP | `Spri.dpjpNama` + `kodeDokter` (produksi) | dari roster ruangan; `dpjpPegawaiId` ikut |
| (otomatis) spesialistik DPJP → poli | `Spri.poliKode/poliNama` = `poliKontrol` | via `smfPoliMap`; null bila dokter umum |
| Tanggal Rencana Rawat | `Spri.tglRencanaRawat` | default hari ini (DatePicker) |
| Jenis Ruang Perawatan | `Spri.jenisPerawatan` | Perawatan Biasa/Intensif/Isolasi/HCU/ICU |
| Indikasi / Keterangan | `Spri.indikasi/keterangan` | field RS |
| (otomatis) `patient.noBpjs` | `Spri.noKartu` | dipakai issueSpriRef |
| (server) issueSpriRef | `Spri.noReferensi` + `status` | Terbit / MenungguRef |

## ✅ Checklist migrasi ke PRODUKSI (V-Claim insertSPRI)

1. Ganti body `issueSpriRef()` → panggil BFF V-Claim `insertSPRI` (adapter mock sudah ada:
   [`vClaimRencanaKontrol.ts`](../src/lib/bpjs/vClaimRencanaKontrol.ts) `insertSPRI`). Map timeout/error → `null`.
2. **`kodeDokter`**: tambah pemetaan `Pegawai/Dokter → kode dokter BPJS`; SPRIPanel kirim kode (bukan nama).
3. **`poliKontrol`**: reconcile kode `smfPoliMap` dgn referensi resmi `getPoliRK`; fallback DPJP dokter umum (tanpa SMF).
4. **Idempotency**: `issueSpriRef` dipanggil di dalam transaksi `complete` — pertimbangkan idempotency-key / kompensasi bila BPJS sukses tapi tx rollback (mock: tak ada efek samping).
5. Hapus banner "Mode Demo · Mock SPRI" di SPRIPanel; hapus aturan demo "digit 0 = nonaktif".
6. (Opsional) Cetak A4 SPRI + QR; tampilkan No. Referensi di dokumen (kosong saat MenungguRef).

## Catatan

- **Non-BPJS (Umum) Rawat Inap**: `noKartu` kosong → `issueSpriRef` null → status `MenungguRef`
  (label worklist "Menunggu Ref BPJS" kurang tepat utk Umum). Admisi tetap bisa dilanjutkan; perketat saat produksi bila SPRI di-skip untuk non-BPJS.
- **RBAC**: worklist + revisi + konsumsi pakai `registration.kunjungan` (read/update) — tanpa permission baru.
