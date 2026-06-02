# EHIS — Flow Rawat Jalan Onsite (APM) + TaskID BPJS

> Algoritma acuan implementasi alur pendaftaran RJ onsite (kiosk APM) → admisi → poli → farmasi → selesai, dengan emisi TaskID Antrol BPJS (1–7/99).
> Pendamping: [TODO-ANTREAN.md](../TODO-ANTREAN.md) · [TODO-REGISTRASI.md](../TODO-REGISTRASI.md) · [docs/API-ANTREAN.md](API-ANTREAN.md) · [contracts/WS-ANTREAN-RS.md](../contracts/WS-ANTREAN-RS.md)
> **Last updated:** 2026-05-31. **Scope batch ini:** channel **Onsite/APM** (MJKN = thin API wrapper nanti).

---

## Ringkasan titik emit TaskID

| Task | Makna | Dipicu di | Modul |
|:--:|---|---|---|
| **1** (Baru) | mulai tunggu admisi | **Cetak struk di APM** (= check-in/hadir) | `/ehis-antrian` (kiosk) |
| **2** (Baru) | mulai layan admisi | **Modal "Lengkapi Data" DIBUKA** (Respon Kedatangan) | `/ehis-registration` |
| **3** (Baru) | selesai admisi / mulai tunggu poli | **Simpan & Terbitkan SEP** (data lengkap + kunjungan + **cetak SEP**) | `/ehis-registration` |
| **3** (Lama) | mulai tunggu poli | **Cetak struk di APM** (auto-SEP + kunjungan di APM, skip loket) | `/ehis-antrian` (kiosk) |
| 4, 5 | mulai layan poli · selesai poli | Panggil · Selesaikan | EHIS Care RJ |
| 6, 7 | mulai layan farmasi · obat selesai | Siapkan/Racik · Serah obat | Farmasi |
| 99 | tidak hadir / batal | No-show / batal | `/ehis-antrian` |

**Aturan urutan:** Baru `1→2→3→4→5` (+`6→7` bila resep) · Lama `3→4→5` (+`6→7`). Sisa antrean ↓ di **T5**, pemanggilan poli muncul di **T4**.
**Kunci penting (grounded BPJS/RS, 2026-05-31):**
- **T1 (Baru) & T3 (Lama) dipicu di APM** saat cetak struk (= check-in/hadir, sesuai fitur check-in Mobile JKN V2).
- **T2 (Baru)** dikunci saat **modal Lengkapi Data DIBUKA** (bukan saat simpan) → `T2−T1` = waktu tunggu admisi murni.
- **SEP**: Pasien **Baru** → cetak di **admisi (T3)**. Pasien **Lama** → **auto-terbit di APM (T3)**, skip loket (pola RS modern: tunggu turun 45→11 mnt).

---

## Algoritma

```text
══════════════════════════════════════════════════════════════
 FASE 1 — KIOSK APM (Onsite)            [/ehis-antrian]  → T1(Baru)/T3(Lama) di sini
══════════════════════════════════════════════════════════════
PROSEDUR KioskAmbilAntrean():
  pilih ← "Pasien Lama" | "Pasien Baru"

  JIKA "Pasien Lama":
    pasien ← cari(NIK | noRM, tglLahir)
    JIKA tidak ketemu → pesan + arahkan ke "Pasien Baru"; SELESAI

  JIKA "Pasien Baru":
    input ← {NIK, Nama, TempatLahir, TglLahir, NoHP}
    existing ← cariByNIK(input.NIK)                  # NIK dedup
    JIKA existing ≠ null → alihkan ke jalur "Lama"(existing)
    SELAIN ITU:
      pasien ← addPatient({...input, dataLengkap:false})   # draft, norm terbit

  penjamin ← "BPJS" | "Umum"
  JIKA BPJS:
    noKartu ← (lama? autofill(pasien) : inputManual | cariByNIK→autofill)
    rujukan ← cekRujukan(noKartu)                    # mock V-Claim
    validasi rujukan AKTIF & belum kadaluarsa
    JIKA lama → rujukanDipilih ← pilih(rujukan[])
  JIKA Umum:
    lewati cek kartu/rujukan                          # kuota non-JKN

  poli   ← pilihPoli()
  dokter ← pilihDokter(poli)                          # tampilkan sisa kuota

  antrean ← ambilAntrean({pasien, penjamin, noKartu?, rujukan?, poli, dokter})
            → AntreanRecord{ status:Booked, kodebooking, nomorAntrean, estimasi }
  JIKA jenis == "Lama":
    JIKA BPJS → terbitkanSEP(rujukan); buatKunjungan(unit=RJ, kodebooking)   # AUTO di APM
    cetakStruk(antrean)                               # + SEP
    emitTask(kodebooking, 3)                          # ⏱ T3 di APM = mulai tunggu poli
    antrean.status ← MenungguPoli                     # langsung ke worklist poli, SKIP loket
  JIKA jenis == "Baru":
    cetakStruk(antrean)                               # no.antrean·poli·dokter·estJam·kodebooking
    emitTask(kodebooking, 1)                          # ⏱ T1 di APM = check-in/hadir, mulai tunggu admisi
    antrean.status ← MenungguAdmisi                   # menunggu dipanggil ke loket admisi
  antrean → masuk TABEL ANTREAN

══════════════════════════════════════════════════════════════
 FASE 2 — ADMISI: Check-in + Kunjungan + SEP   [/ehis-registration]
══════════════════════════════════════════════════════════════
PROSEDUR AdmisiProses(antrean):                       # HANYA pasien BARU (Lama sudah selesai di APM)
  petugas pilih baris di Tabel Antrean:
    [Panggil]  → status DipanggilAdmisi               # manggil nomor, TANPA task
    [Respon Kedatangan] → bukaModal "Lengkapi Data RM"(prefill draft)
        onOpen → emitTask(kodebooking, 2)             # ⏱ T2 = MULAI layan admisi (lock saat modal DIBUKA)
        status ← DilayaniAdmisi

  di dalam modal: lengkapiDataRM(pasien); pasien.dataLengkap ← true
  [Simpan & Terbitkan SEP]:
    buatKunjungan(unit=RJ, kodebooking)               # = order ke poli
    terbitkanSEP() + cetakSEP()                       # SEP cetak HANYA di sini
    emitTask(kodebooking, 3)                          # ⏱ T3 = selesai admisi / mulai tunggu poli
    antrean.status ← MenungguPoli
  # kunjungan kini membawa kodebooking (link antrean ↔ encounter)
  # waktu tunggu admisi = T2 − T1 ; waktu layan admisi = T3 − T2

══════════════════════════════════════════════════════════════
 FASE 3 — POLI            [/ehis-care/rawat-jalan]
══════════════════════════════════════════════════════════════
PROSEDUR PoliLayani(kunjungan):                       # worklist RJ, status awal: Order_Masuk
  AKSI Panggil:
    emitTask(kodebooking, 4)                          # pemanggilan poli = mulai layan poli
    status ← Dipanggil
  AKSI Terima  [VALIDASI: status harus == Dipanggil]:
    status ← Dilayani → buka alur klinis (asesmen·CPPT·diagnosa·resep)
  AKSI Batal Kunjungan:
    status ← Dikembalikan_Admisi                      # (belum fire T99)

  AKSI Selesaikan (tombol header):
    GUARD: diagnosa ICD-10 utama WAJIB terisi          # else tombol disabled
    emitTask(kodebooking, 5)                          # selesai poli → sisa antrean berkurang
    selesaiAt ← now   (IMMUTABLE)
    lockKunjungan()                                   # read-only; whitelist: kontrol·surat·cetak
    status ← (ada resep ? MenungguFarmasi : Selesai)
  AKSI Batalkan Selesai:
    unlockKunjungan()                                 # selesaiAt TIDAK berubah

══════════════════════════════════════════════════════════════
 FASE 4 — FARMASI (hanya jika ada resep)   [/ehis-care/farmasi]
══════════════════════════════════════════════════════════════
PROSEDUR Farmasi(kunjungan):
  AKSI Siapkan/Racik:
    emitTask(kodebooking, 6)                          # mulai layan farmasi
    set jenisresep ∈ {Racikan, Non-racikan}
  AKSI Serahkan obat:
    emitTask(kodebooking, 7)                          # obat selesai
    status ← Selesai   (episode kunjungan close)

══════════════════════════════════════════════════════════════
 TASKID ENGINE (dipanggil lintas modul)    [antreanStore]
══════════════════════════════════════════════════════════════
FUNGSI emitTask(kodebooking, taskid, waktu=now):
  log ← getTaskLog(kodebooking)
  JIKA log.has(taskid)          → RETURN              # idempoten
  JIKA ¬urutanSah(log, taskid)  → WARN/REJECT         # Baru:1→5, Lama:3→5, (+6→7)
  JIKA waktu < log.lastWaktu    → waktu ← log.lastWaktu + 1ms   # clamp monoton + warn
  log.simpan({taskid, waktu, kirim:"pending"})
  outbox.enqueue → POST /antrean/task (updatewaktu)   # retry; backend (mock=stub)

ATURAN: Baru 1→2→3→4→5 (+6→7) · Lama 3→4→5 (+6→7)
        sisa antrean ↓ di T5 · pemanggilan poli muncul di T4

══════════════════════════════════════════════════════════════
 EXCEPTION
══════════════════════════════════════════════════════════════
no-show (≥N panggilan / lewat jam praktik)  → emitTask(kodebooking, 99)
batal antrean (kiosk/MJKN/loket)            → emitTask(kodebooking, 99)
```

---

## State antrean (status machine)

```
Booked ─(check-in admisi)─▶ [Baru: MenungguAdmisi → DilayaniAdmisi → MenungguPoli]
                            [Lama: ──────────────────────────────▶ MenungguPoli]
MenungguPoli ─(Panggil)─▶ Dipanggil ─(Terima)─▶ Dilayani ─(Selesai Pelayanan)─▶ MenungguFarmasi
MenungguFarmasi ─(Siapkan)─▶ DilayaniFarmasi ─(Serah)─▶ Selesai
   (tanpa resep: Dilayani ─(Selesai)─▶ Selesai)
   (kapan saja: ─▶ TidakHadir | Batal | Dikembalikan_Admisi)
```

## Catatan implementasi
- **Mock-first**: kiosk & store di client; `emitTask` outbox = stub (backend swap → `updatewaktu`).
- **Onsite**: RS hit BPJS `antrean/add` (outbound, `cons-id`+`secret`) — backend. **MJKN**: hit API kita (`x-token`) — thin wrapper nanti.
- **SEP**: pasien **Baru** terbit+cetak di admisi (T3); pasien **Lama** auto-terbit di APM (T3, skip loket). **Draft patient** (`dataLengkap:false`) dilengkapi di admisi (Baru).
- **T2 di-lock saat modal Lengkapi Data DIBUKA** (Opsi A, bukan saat simpan) → waktu tunggu admisi akurat.
- **Lock encounter**: read-only kecuali rencana kontrol · penerbitan surat · cetak. `selesaiAt` immutable; "Batalkan Selesai" unlock tanpa ubah `selesaiAt`.
