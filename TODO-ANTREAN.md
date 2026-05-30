# EHIS Antrean — Phase Roadmap

> **Source of truth untuk modul mandiri `/ehis-antrian` (Antrean Online JKN + Onsite + TaskID Antrol BPJS).**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
>
> **Workflow docs:**
> - [docs/API-ANTREAN.md](docs/API-ANTREAN.md) — **Kontrak API edge BPJS ↔ REST internal** (adapter, method, mapping)
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO-REGISTRASI.md](TODO-REGISTRASI.md) — **Loket Pendaftaran** — modal yang di-*trigger* dari "Respon Kedatangan" + cetak SEP RJ
> - [TODO-BPJS.md](TODO-BPJS.md) — V-Claim & bridging WS BPJS (Antrol sejajar tapi WS terpisah)
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap (bridging WS Antrean BPJS real)
>
> **Last updated:** 2026-05-30
> **Status:** 📋 **Planned — modul belum dibuat.** Diputuskan jadi modul mandiri (2026-05-30). Spec TaskID Antrol BPJS dikunci (2026-05-30).
> **Target effort:** ~2–2.5 minggu (frontend, mock-first).

> ### 🚦 Urutan Build (disepakati 2026-05-30)
> `REG0` (fondasi persistensi) → `ANT1` (store + TaskID engine) → `REG1`/`REG2` (pasien baru + daftar kunjungan + SEP RJ) → `ANT2` (Antrean List) → `ANT4` (Respon Kedatangan bridge) → sisanya (`ANT3` Pengaturan · `ANT5` Monitoring · `ANT6` Referensi/HFIS · `ANT7` Display+polish).
> REG0 & ANT1 boleh paralel. Task 6–7 (antrean farmasi) di-cover tapi dikerjakan setelah core flow stabil.

---

## 📌 Konteks & Keputusan

**Antrean** = modul mandiri `/ehis-antrian` yang jadi **owner** seluruh antrean (online Mobile JKN/JKN-Faskes + onsite loket), **owner TaskID lifecycle Antrol BPJS**, dan **jembatan ke pendaftaran**. Modul registrasi & Care RJ tidak menulis nomor antrean — mereka hanya *consume* + meng-emit event TaskID via callback.

### Keputusan scope (2026-05-30)
| Topik | Keputusan |
|---|---|
| **Lokasi** | Modul baru `/ehis-antrian` (mandiri, accent `indigo`/`cyan`). |
| **Owner data antrean + TaskID** | Modul ini. Registrasi/Care **consume** & emit event, tidak menulis nomor. |
| **3 channel** | (1) **MJKN** online (inbound, `x-token`) — **FOKUS BATCH INI** · (2) **Onsite** pasien tanpa HP (RS hit BPJS outbound, `cons-id`+`secret`) — nanti · (3) **Website resmi RS** — nanti. |
| **Auth 2 arah** | Inbound MJKN→RS = `x-token`. Outbound RS→BPJS (`updatewaktu`, onsite add) = `cons-id`+`secret`+signature. Lihat [docs/API-ANTREAN.md](docs/API-ANTREAN.md) §1–2. |
| **Board loket** | **PINDAH ke sini** (tab *Antrean List*) — sebelumnya direncanakan di `/ehis-registration/antrian` (REG3). Registrasi cukup sediakan modal yang di-trigger dari "Respon Kedatangan". |
| **Jembatan ke pendaftaran** | Tombol **"Respon Kedatangan"** di Antrean List → trigger modal Pasien Baru / Daftar Kunjungan di registrasi (lihat alur di ANT4). |

### Prinsip arsitektur
1. **Mock-first → swap pattern** — kontrak data 1:1 dengan respons WS Antrean BPJS (`kodebooking`, `taskid`, `waktu` ms). Zero-refactor saat backend bridging.
2. **TaskID = state machine + outbox** — emisi TaskID **otomatis dari event nyata lintas modul**, divalidasi berurutan & monoton, dikirim via outbox dgn retry. (Detail di bawah.)
3. **Single owner** — `antreanStore` reaktif (`useSyncExternalStore`) satu-satunya sumber; modul lain baca `AntreanOnlineRef` ringan + panggil `emitTask()`.
4. **Jadwal dokter = single source di Master** — buat **sub-menu baru `/ehis-master/jadwal-dokter`** yang **tarik jadwal via HFIS** (keputusan 2026-05-30). Itu jadi sumber tunggal; antrean & poli RJ hanya *consume*. Jangan duplikasi jadwal di modul antrean.
5. **Hak akses (buka loket, pos antrian)** — depend RBAC Phase B0; bangun dulu tanpa gating, marker `// TODO(RBAC-B0)`.

---

## 🔑 Referensi: TaskID Lifecycle Antrol BPJS *(dikunci — jangan ubah tanpa diskusi)*

Payload `antrean/updatewaktu`:
```jsonc
{ "kodebooking": "<dari servis tambah antrean>", "taskid": <1..7|99>, "waktu": <timestamp ms> }
```

| TaskID | Makna | Event UI pemicu (EHIS) | Modul |
|:---:|---|---|---|
| **1** | mulai waktu tunggu admisi | Klik **Respon Kedatangan** (pasien **BARU**) | `/ehis-antrian` |
| **2** | akhir tunggu admisi / mulai layan admisi | Modal pendaftaran/daftar-kunjungan **dibuka** (mulai dilayani) | `/ehis-registration` |
| **3** | akhir layan admisi / mulai tunggu poli | Kunjungan RJ **berhasil dibuat** (+ SEP terbit bila BPJS) | `/ehis-registration` |
| **4** | akhir tunggu poli / mulai layan poli | Perawat poli klik **Panggil** (pemanggilan poli) di worklist RJ | EHIS Care (RJ) |
| **5** | akhir layan poli / mulai tunggu farmasi | Klik **Selesai Pelayanan Poli** | EHIS Care (RJ) |
| **6** | akhir tunggu farmasi / mulai layan farmasi | Farmasi mulai **menyiapkan** obat (`workflowStore`) | Farmasi |
| **7** | akhir — obat **selesai** dibuat | Obat **diserahkan** (`workflowStore`) | Farmasi |
| **99** | tidak hadir / batal | No-show setelah N panggilan / batal manual | `/ehis-antrian` |

**Aturan wajib (validasi sebelum kirim):**
- **Pasien BARU:** `1 → 2 → 3 → 4 → 5` (+ `6 → 7` bila ada obat). Check-in = **task 1**.
- **Pasien LAMA:** `3 → 4 → 5` (+ `6 → 7` bila ada obat). Check-in = **task 3** (lewati admisi tunggu/layan).
- **Berurutan & monoton:** taskid kecil harus dikirim lebih dulu; `waktu(taskN) ≤ waktu(taskN+1)`. Tolak/clamp emisi out-of-order.
- **Sisa antrean** berkurang pada **task 5**. **Pemanggilan poli** muncul pada **task 4**.
- `jenisresep: "Tidak ada" | "Racikan" | "Non racikan"` — **hanya** bila RS implementasi antrean farmasi (task 6/7). → EHIS punya modul Farmasi, jadi **di-cover & di-flag `antreanFarmasiEnabled` (default ON)**; bisa dimatikan untuk hilangkan kolom + task 6/7.
- **Deteksi Baru vs Lama** (sesuai spec resmi, lihat [docs/API-ANTREAN.md](docs/API-ANTREAN.md) §6): saat **Ambil Antrean** (`POST /antrean`), RS yang tak menemukan pasien membalas **code 202 (Pasien Baru)** → MJKN lanjut hit `POST /pasien` → RS terbitkan `norm` + pesan "datang ke admisi melengkapi RM" → MJKN ulang Ambil Antrean dgn `norm` → dapat `kodebooking`. Jadi **pasien baru online sudah punya `norm` + data minimal** sebelum tiba. Pasien Baru → titik mulai task 1; Lama → task 3.

> **Catatan lintas modul:** task 1–3 dipicu dari `/ehis-antrian` + `/ehis-registration`, **task 4–5 dari EHIS Care RJ**, **task 6–7 dari Farmasi**. Jadi `antreanStore` harus expose `emitTask(kodebooking, taskid)` yang dipanggil modul-modul itu — ini "spine" yang sama dgn Registration→Care.

---

## 🔌 Arah Integrasi & WS Surface — *RS sebagai Provider*

**Klarifikasi 2026-05-30:** RS **meng-host Web Service** yang dipanggil **Mobile JKN (inbound)**, bukan sebaliknya. Payload `BpjsPesertaAutofill` di [TODO-REGISTRASI.md](TODO-REGISTRASI.md) REG1.1 = *request body* yang **dikirim MJKN ke WS kita** untuk kasus **pasien belum punya No. RM** (pasien baru).

### Inbound — WS yang RS **ekspos**, dipanggil Mobile JKN (`x-token`) — **fokus batch ini**
Endpoint & payload 1:1 lihat [docs/API-ANTREAN.md](docs/API-ANTREAN.md) §4–5: `GET /auth/token` · `POST /antrean/status` · `POST /antrean` (Ambil — **balikan 202 = pasien baru**) · `POST /antrean/sisa` · `POST /antrean/batal` (→task 99) · `POST /antrean/checkin` (→task 1/3) · `POST /pasien` (peserta → norm) · `POST /antrean-farmasi[/status]` · `POST /jadwal-operasi/{rs,pasien}` (stub).

### Outbound — RS **memanggil** WS BPJS Antrean RS (`cons-id`+`secret`+signature)
| Endpoint | Fungsi | Channel |
|---|---|---|
| `antrean/updatewaktu` | kirim **TaskID** 1..7/99 + waktu | **semua channel** |
| `antrean/add` | RS daftarkan antrean ke BPJS | **Onsite** (nanti) |
| `antrean/dashboard/*` | lapor waktu tunggu/layan | semua |

> **Ownership:** WS server (inbound) + client BPJS (outbound, auth cons-id/secret) = **backend** → [TODOS_BACKEND.md](TODOS_BACKEND.md) Phase B-BPJS/Antrean. **Frontend mock-first**: `antreanStore` mensimulasikan *inbound* MJKN (seed antrean masuk, termasuk pasien baru via 202) + *outbox* mensimulasikan *outbound* `updatewaktu`. UI tidak berubah saat WS real disambung.

---

## Phase ANT0 — Scaffold Modul

**Effort:** 0.5 hari.

- [ ] `ModuleKey "antrian"` + `ModuleDescriptor` di [navigation.ts](src/lib/navigation.ts) (`MODULES`), accent indigo/cyan.
- [ ] `antrianNav` (Beranda · Antrean List · Pengaturan · Referensi · Monitoring · Display) + `NAV_MAP`.
- [ ] Route group `src/app/ehis-antrian/` + layout + beranda scaffold.

---

## Phase ANT1 — Data Contracts, Store & TaskID Engine

**Effort:** 1.5 hari · **ROI:** semua tab + wiring lintas modul bisa paralel.

- [ ] `AntreanRecord` — `kodebooking`, `nomorAntrean`(angka+nama poli), `pos`, `loket`, `tanggal`, `jenisPasien:"Baru"|"Lama"`, `poli`, `dokter`, `caraBayar`, `noRM?`, `nik?`, `nama`, `kontak`, `tglLahir`, `jamEstimasi`, `sumber:"Mobile JKN"|"JKN Faskes"|"Loket"`, `status`.
- [ ] `TaskLog` — `{ taskid, waktu(ms), kirimStatus:"pending"|"terkirim"|"gagal", attempts, error?, editedBy? }`.
- [ ] **TaskID state machine** — `emitTask(kodebooking, taskid, waktu?)`:
  - validasi urutan sesuai jenis pasien (Baru `1-5`, Lama `3-5`, +6/7),
  - guard monoton (clamp/warn bila out-of-order),
  - idempoten per `(kodebooking, taskid)`.
- [ ] **Outbox + retry** — antre kirim ke WS (mock), status per task, auto-retry + manual re-send.
- [ ] `AntreanOnlineRef` (kontrak ringan consume): `{ kodebooking, nomorAntrean, jamEstimasi, taskTerakhir, status }`.
- [ ] `antreanStore` (sessionStorage-backed `useSyncExternalStore`) + mock seed (online + onsite, campuran Baru/Lama, beberapa dgn obat).

---

## Phase ANT2 — Tab: Antrean List (Board Loket) *(menggantikan REG3)*

**Effort:** 2–3 hari · **inti modul.**

### ANT2.1 Header kontrol "Buka Loket"
- [ ] Pilih **Pos Antrian** · pilih **Loket** · **Tanggal** (DatePicker) · **Jenis Pasien** (Lama/Baru) · tombol **Buka Loket** (+ Tutup Loket).
- [ ] Sesi loket aktif mengikat aksi petugas (siapkan shift log untuk audit).

### ANT2.2 Tabel antrean
- [ ] Kolom: Pos|Loket · Jenis · No Antrian · **Poli Tujuan** (Antrian / Estimasi Jam / Nama Poli) · Dokter · Cara Bayar · No RM · Nama · Kontak · Tgl Lahir · Jenis.
- [ ] Density tokens `m-*` + skeleton 500ms + filter status.

### ANT2.3 Aksi baris
- [ ] **Panggil** → set status Dipanggil, tampil di Display (ANT5). (Pemanggilan poli = task 4, dipicu dari Care RJ — di sini = panggil loket admisi.)
- [ ] **Respon Kedatangan** → jalankan alur bridge (ANT4).
- [ ] Batal / No-show → **task 99** + alasan.

---

## Phase ANT3 — Tab: Pengaturan Antrian

**Effort:** 1.5–2 hari.

- [ ] **Mapping Pos Antrian** (pos → loket → poli).
- [ ] **Tambah Pos Antrian** (CRUD pos & loket).
- [ ] **Hak Akses Antrian** — UI disiapkan, gating nyata `// TODO(RBAC-B0)`.
- [ ] **Jadwal Dokter** — **consume** dari sub-menu Master baru `/ehis-master/jadwal-dokter` (lihat dependency di bawah). Jangan duplikasi.

---

## Phase ANT4 — Tab: Antrean List → "Respon Kedatangan" Bridge ke Registrasi

**Effort:** 2 hari · **Pair dgn** [TODO-REGISTRASI.md](TODO-REGISTRASI.md) REG1+REG2. **Kritis.**

Tombol **Respon Kedatangan** mencabang berdasarkan ada/tidaknya No. RM:

### ANT4.1 Pasien BARU — **emit task 1** saat Respon Kedatangan, **task 2** saat modal dibuka, **task 3** saat kunjungan dibuat.

**(a) Baru via ONLINE** — sudah punya `norm` + data minimal dari WS `POST /pasien` ([docs/API-ANTREAN.md](docs/API-ANTREAN.md) §6):
- [ ] Respon Kedatangan → buka `/pasien/{norm}` (in-app MDI [PatientDashboard](src/components/registration/PatientDashboard.tsx) + query param) dgn data **ter-prefill (incomplete)**.
- [ ] **Lengkapi data RM** (field non-BPJS: tempat lahir, gol darah, agama, dst — lihat REG1.1) → bukan buat dari nol.
- [ ] Lanjut **Modal Daftar Kunjungan RJ** + cetak SEP.

**(b) Walk-in murni** — belum ada `norm` sama sekali:
- [ ] Trigger **PasienBaruModal** penuh (autofill `BpjsPesertaAutofill` bila peserta BPJS) → sukses → buka `/pasien/{rm}` → Daftar Kunjungan RJ + SEP.

### ANT4.2 Pasien LAMA (sudah punya No. RM)
- [ ] **emit task 3** saat Respon Kedatangan (check-in pasien lama = task 3).
- [ ] Buka `/pasien/{rm}` dgn **Modal Daftar Kunjungan RJ auto-trigger** (via query param, mis. `?daftar=rj&kodebooking=...`).
- [ ] Daftar seperti biasa + cetak SEP bila BPJS.

### ANT4.3 Wiring consume
- [ ] `getAntreanByPasien(noRM)` / `getAntreanByBooking(kode)` untuk consume.
- [ ] Badge "Antrean #B-xx · est. 10:30 · task N" di detail kunjungan RJ + worklist RJ EHIS Care.
- [ ] Hook `emitTask` dipanggil dari EHIS Care RJ (lihat ANT4.4) & Farmasi (task 6 siapkan, task 7 serah).

### ANT4.4 Enhancement EHIS Care RJ — Terima Order Poli (emit T4/T5) *(fungsi BARU)*

**Cek 2026-05-30:** belum ada — [RJBoard](src/components/rawat-jalan/RJBoard.tsx) read-only, kartu cuma `Link`; `RJStatus` ([data.ts:2106](src/lib/data.ts#L2106)) sumbu klinis-skrining statis, tanpa store/aksi.

**Sumbu Antrean-Poli (baru, drive T4/T5):**
```
Order_Masuk ─(Panggil ⇒ T4)─▶ Dipanggil ─(Terima)─▶ Dilayani ─(Selesai Pelayanan ⇒ T5)─▶ Selesai
   └─(Batal Kunjungan)─▶ Dikembalikan_Admisi   // kembali ke loket (sekarang TIDAK fire T99)
```
- [ ] Tipe `RJOrderStatus` (`Order_Masuk | Dipanggil | Diterima/Dilayani | Selesai | Dikembalikan_Admisi`) — sumbu terpisah dari `RJStatus` klinis (Terima ⇒ masuk alur klinis `Menunggu_Skrining`).
- [ ] Tombol aksi di kartu worklist RJ: **Panggil · Terima · Batal Kunjungan**.
- [ ] **Validasi: harus Panggil dulu → baru bisa Terima** (Terima disabled bila status ≠ `Dipanggil`). Panggil = **emit T4**.
- [ ] **Terima** → status `Dilayani` + buka alur klinis (no task baru — T4 sudah di Panggil).
- [ ] **Selesai Pelayanan Poli** → **emit T5** (sisa antrean berkurang) → `MenungguFarmasi` (ada resep) / `Selesai`.
- [ ] **Batal Kunjungan** → status `Dikembalikan_Admisi`, order balik ke worklist loket (admisi). *(T99 ditunda.)*
- [ ] Store transisi status RJ (reaktif, pola `useSyncExternalStore`) — `RJBoard` tidak lagi read-only.
- [ ] **Mock data simulasi**: tambah entri `rjPatients` status `Order_Masuk` (belum dipanggil) & `Dipanggil` (belum diterima) agar board menampilkan pasien **belum diterima** + tombol aksinya. Badge "Order Masuk dari Admisi".

---

## Phase ANT5 — Tab: Monitoring Status Antrian

**Effort:** 1.5 hari.

- [ ] List antrean + **Task Antrian** per kodebooking (timeline task 1..7/99 + waktu).
- [ ] **Monitoring pengiriman task** — status terkirim/gagal per task, jumlah attempt, error WS.
- [ ] **Task editable** — koreksi taskid/waktu manual + **re-send** (untuk perbaiki compliance bila WS sempat gagal). Tetap validasi monoton.
- [ ] KPI compliance: % task terkirim, jumlah gagal, rata-rata waktu tunggu/layan per tahap.

---

## Phase ANT6 — Tab: Referensi (HFIS / Mobile JKN)

**Effort:** 1 hari.

- [ ] **Referensi Poli HFIS** (mock) — mapping poli RS ↔ poli BPJS.
- [ ] **Referensi Mobile JKN** — kapasitas/kuota JKN & non-JKN per poli, jam praktik.
- [ ] **Jadwal Dokter HFIS** — tarik/sinkron jadwal dari HFIS yang **mengisi sub-menu Master `/ehis-master/jadwal-dokter`** (sumber tunggal). Antrean & poli RJ consume dari Master, bukan dari sini langsung.

---

## 🧩 Dependency: Sub-menu Master Jadwal Dokter *(prasyarat ANT3/ANT6)*

**Effort:** 1–1.5 hari · **Modul:** `/ehis-master` (bukan antrean, tapi diperlukan antrean).

- [ ] Sub-menu baru `/ehis-master/jadwal-dokter` + item di `masterNav` (group "Sumber Daya" / "Operasional").
- [ ] **Tarik jadwal via HFIS** (mock WS) → simpan sebagai jadwal RS = single source. Grid mingguan per dokter/poli + kapasitas/kuota.
- [ ] Expose `getJadwalDokter(poli|dokter, tanggal)` untuk di-consume Antrean (estimasi jam) & RJ.
- [ ] Sinkronkan dgn CLAUDE.md Master Tier 3 (Poliklinik & Jadwal Dokter) yang sebelumnya TECH_DEBT — item ini **mengangkatnya jadi aktif**.

---

## Phase ANT7 — Display Antrean + Beranda + Polish

**Effort:** 1.5 hari.

- [ ] **Display antrean** (layar tunggu): nomor sedang dipanggil per loket/poli + animasi + hook TTS opsional.
- [ ] **Beranda** modul: KPI (online vs onsite, no-show rate, rata-rata waktu tunggu, compliance task) + ringkasan per poli.
- [ ] **Audit trail** antrean (filter + export) — konsisten pola audit BPJS.
- [ ] Skeleton 500ms + density tokens + animasi stagger.

---

## 🔗 Integrasi Lintas Modul

- **→ [TODO-REGISTRASI.md](TODO-REGISTRASI.md)**: Respon Kedatangan men-trigger PasienBaru (REG1) & DaftarKunjungan+SEP RJ (REG2); board loket pindah ke sini (REG3 di-deprecate).
- **→ EHIS Care (RJ)**: emit **task 4** (Panggil poli) & **task 5** (selesai poli) via `emitTask`.
- **→ Farmasi**: emit **task 6** (siapkan obat) & **task 7** (serah obat) via `workflowStore` → `emitTask`.
- **→ `/ehis-master/jadwal-dokter`** (sub-menu baru): single source jadwal dokter (tarik via HFIS); antrean & RJ consume.
- **→ [TODO-BPJS.md](TODO-BPJS.md)**: Antrol WS sejajar V-Claim — share kredensial bridging, endpoint terpisah.
- **→ Backend**: **ekspos WS provider** (inbound MJKN: `ref/poli`, `jadwaldokter`, `antrean/tambah`, `antrean/batal`, `antrean/status`, `antrean/checkin`) + **client Antrol** (outbound: `antrean/updatewaktu`, `dashboard`). Lihat WS Surface di atas → [TODOS_BACKEND.md](TODOS_BACKEND.md).
