# EHIS Antrean — Phase Roadmap

> **Source of truth untuk modul mandiri `/ehis-antrian` (Antrean Online JKN + Onsite + TaskID Antrol BPJS).**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
>
> **Workflow docs:**
> - [docs/FLOW-RJ-ONSITE.md](docs/FLOW-RJ-ONSITE.md) — **Algoritma alur RJ onsite + TaskID** (acuan implementasi)
> - [docs/API-ANTREAN.md](docs/API-ANTREAN.md) — **Kontrak API edge BPJS ↔ REST internal** (adapter, method, mapping)
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO-REGISTRASI.md](TODO-REGISTRASI.md) — **Loket Pendaftaran** — modal yang di-*trigger* dari "Respon Kedatangan" + cetak SEP RJ
> - [TODO-BPJS.md](TODO-BPJS.md) — V-Claim & bridging WS BPJS (Antrol sejajar tapi WS terpisah)
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap (bridging WS Antrean BPJS real)
>
> **Last updated:** 2026-05-31
> **Status:** 🚧 **In progress.** `REG0` ✅ · `ANT1` ✅ (store+TaskID engine) · `ANT0` ✅ (scaffold modul) · `ANT-ONSITE` ✅ (kiosk APM Lama+Baru → ambil antrean → struk) · `ANT2` ✅ (Antrean List board: Buka Loket + tabel + filter + aksi Panggil/Respon/Batal) · `ANT3` ✅ (Pengaturan 4-tab: Mapping/CRUD Pos-Loket/Hak Akses/Jadwal · posStore reaktif) · Master Jadwal Dokter ✅ (dependency) · `ANT4` ✅ (Respon Kedatangan → bridge registrasi: PasienBaru/DaftarKunjungan persist + deep-link + emit task) · `ANT5` ✅ (Monitoring: timeline TaskID + outbox kirim/gagal/pending + koreksi/re-send + KPI compliance) · `ANT6` ✅ (Referensi 3-tab: Poli HFIS · Mobile JKN · Jadwal HFIS sync). **Next:** `ANT-RJ` (Care RJ worklist + emit T4/T5) · `ANT7` Display + Beranda polish. Spec TaskID Antrol BPJS dikunci (2026-05-30).
> **Target effort:** ~2–2.5 minggu (frontend, mock-first).

> ### 🚦 Urutan Build (disepakati 2026-05-30)
> **Onsite-first (2026-05-31):** `REG0` ✅ → `ANT1` (store + TaskID engine + types) → **`ANT-ONSITE`** (kiosk APM: Pasien Baru/Lama → ambil antrean → struk) → `ANT2` (Tabel Antrean + check-in admisi) → `REG`/`SEP` (lengkapi data + SEP RJ di admisi) → `ANT-RJ` (Care RJ worklist + emit T4/T5) → sisanya (`ANT3` Pengaturan · `ANT5` Monitoring · `ANT6` Referensi/HFIS · `ANT7` Display+polish). **MJKN** = thin API wrapper, dikerjakan paling akhir.
> REG0 & ANT1 boleh paralel. Task 6–7 (antrean farmasi) di-cover tapi dikerjakan setelah core flow stabil.

---

## 📌 Konteks & Keputusan

**Antrean** = modul mandiri `/ehis-antrian` yang jadi **owner** seluruh antrean (online Mobile JKN/JKN-Faskes + onsite loket), **owner TaskID lifecycle Antrol BPJS**, dan **jembatan ke pendaftaran**. Modul registrasi & Care RJ tidak menulis nomor antrean — mereka hanya *consume* + meng-emit event TaskID via callback.

### Keputusan scope (2026-05-30)
| Topik | Keputusan |
|---|---|
| **Lokasi** | Modul baru `/ehis-antrian` (mandiri, accent `indigo`/`cyan`). |
| **Owner data antrean + TaskID** | Modul ini. Registrasi/Care **consume** & emit event, tidak menulis nomor. |
| **3 channel** | (1) **Onsite/APM** (kiosk, RS hit BPJS outbound `cons-id`+`secret`) — **FOKUS BATCH INI** (paling demoable + jadi mesin inti) · (2) **MJKN** online (inbound `x-token`) — **thin wrapper nanti** (MJKN tinggal hit API kita: daftar pasien + ambil antrean → simpel) · (3) **Website resmi RS** — nanti. |
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
| **1** | mulai waktu tunggu admisi | Pasien **BARU**: **cetak struk di APM** (= check-in/hadir) | `/ehis-antrian` (kiosk) |
| **2** | akhir tunggu admisi / mulai layan admisi | Modal **Lengkapi Data** **DIBUKA** (Respon Kedatangan) — lock saat buka, bukan simpan | `/ehis-registration` |
| **3** | akhir layan admisi / mulai tunggu poli | **BARU**: Simpan & Terbitkan SEP (kunjungan+cetak SEP) di admisi. **LAMA**: cetak struk di APM (auto-SEP, skip loket) | `/ehis-registration` / kiosk |
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

**Struktur rute (konvensi `(main)` + `(fullpage)`, sama seperti `/ehis-registration`):**
```
src/app/ehis-antrian/
├── (main)/                  ← layout admin (Navbar + Sidebar + tabs)
│   ├── page.tsx             → Beranda (+ tombol "Buka Mode APM")
│   ├── antrean/page.tsx     → Tab Antrean List (ANT2, petugas admisi)
│   ├── pengaturan/…         → ANT3
│   ├── referensi/…          → ANT6
│   └── monitoring/…         → ANT5
└── (fullpage)/
    └── apm/page.tsx         → KIOSK APM (ANT-ONSITE) — full-screen, TANPA sidebar
```

- [x] `ModuleKey "antrian"` + `ModuleDescriptor` di [navigation.ts](src/lib/navigation.ts) (`MODULES`), accent indigo/cyan. (2026-05-31)
- [x] `antrianNav` (Beranda · Antrean List · Monitoring · Display · Pengaturan · Referensi) + `NAV_MAP`. (2026-05-31)
- [x] Route group `(main)` (layout admin + Beranda KPI/launcher + 5 stub tab `AntrianComingSoon`) + `(fullpage)` (kiosk APM, layout tanpa sidebar). (2026-05-31)

---

## Phase ANT1 — Data Contracts, Store & TaskID Engine ✅ (2026-05-31)

**Effort:** 1.5 hari · **ROI:** semua tab + wiring lintas modul bisa paralel.

- [x] `AntreanRecord` · `TaskLog` · `TaskId` · `AntreanStatus` · `CreateAntreanInput` · `AntreanOnlineRef` + `TASK_SEQUENCE`/`TASK_LABEL` di [src/lib/antrean/types.ts](src/lib/antrean/types.ts).
- [x] **TaskID engine** [src/lib/antrean/antreanStore.ts](src/lib/antrean/antreanStore.ts) — `emitTask(kodebooking, taskid, waktu?)`: idempoten per `(kode,taskid)` · guard urutan (`TASK_SEQUENCE` Baru 1→7 / Lama 3→7, 99 kapan saja) · clamp monoton (`waktu ≥ last+1ms`) · `nextExpectedTask()`.
- [x] **Outbox stub** — `sendToOutbox()` (mock WS sukses; status per task pending→terkirim). *(retry/gagal + edit manual → ANT5 Monitoring.)*
- [x] `antreanStore` (sessionStorage `ehis.antrean.v1`, `useSyncExternalStore`) — `createAntrean()` · `checkin()` (Baru→T1/MenungguAdmisi, Lama→T3/MenungguPoli) · `setStatus()` · `batalAntrean()` (T99) · `getAntrean()`/`getAllAntrean()`/`getAntreanByPasien()` · `toOnlineRef()`.
- [ ] **Mock seed** — ditunda ke ANT-ONSITE/ANT2 (kiosk akan mengisi antrean nyata; seed kalau perlu data board awal).

---

## Phase ANT-ONSITE — Kiosk APM (Pasien Baru/Lama → Ambil Antrean) *(FOKUS — build pertama setelah ANT1)*

**Effort:** 3–4 hari · **inti channel onsite.** UI kiosk besar/touch, dibantu pasien/security. Depend: ANT1 ✅ (store+types), `addPatient` minimal (REG), mock V-Claim (cek peserta/rujukan) + jadwal dokter.

**Lokasi:** `/ehis-antrian/(fullpage)/apm` — **layar full-screen TANPA sidebar** (mesin kiosk). Diluncurkan dari Beranda (tombol "Buka Mode APM"). Hasil `AntreanRecord` tampil di **Tab Antrean List** (`(main)/antrean`) untuk diproses admisi.

**Pilihan awal: Pasien Lama / Pasien Baru.**

> **Status ANT-ONSITE: ✅ (2026-05-31).** Kiosk wizard di [src/components/antrean/apm/](src/components/antrean/apm/) — `ApmKioskPage` (orchestrator `useReducer` + idle-reset 120s) · `ApmShell` (header jam live + **toggle fullscreen** + stepper 5-fase + footer **Kembali prominent**/Mulai Ulang) · 6 step (`StepWelcome`/`StepCariPasien`/`StepInputBaru`/`StepPenjamin`/`StepPoliDokter`/`StepStruk`) · primitif `apmUi` (KioskButton/ChoiceCard/KioskField/KuotaBar/PoliIcon). Mock katalog [onsiteMock.ts](src/lib/antrean/onsiteMock.ts) (12 poli + 15 dokter + kuota JKN/non-JKN + estimasi jam). Helper `findPatient`/`findPatientByNik` di registrationStore. Cetak struk thermal 58mm via `print:` variant. TSC + ESLint clean.
>
> **Touch UX (2026-05-31):** On-screen keyboard [keyboard/](src/components/antrean/apm/keyboard/) — `ApmKeyboardProvider` (registry field + active state) · `KioskInput` (daftar ke keyboard; di tablet produksi set `readOnly` untuk tekan OS keyboard) · `ApmKeyboard` (numpad / QWERTY caps, muncul dari bawah saat field di-tap). Fullscreen [useFullscreen.ts](src/components/antrean/apm/useFullscreen.ts) — auto-enter pada tap pertama (browser wajib user gesture, tak bisa auto saat load) + toggle header. Input `date` tetap native picker.

### ANT-ONSITE.Lama — Pasien Lama
1. [x] **Cari** (NIK / noRM) + **tanggal lahir** → temukan rekam (registrationStore `findPatient` + seed) → kartu konfirmasi identitas.
2. [x] Pilih **penjamin** (BPJS) → **no. kartu autofill** via `findPesertaByNik`. *(Cabang **Umum** → lewati rujukan → langsung poli/dokter, kuota non-JKN.)*
3. [x] **Cek rujukan/surat kontrol** by kartu (`findRujukansByKartu`, filter non-Expired) → **pilih rujukan** (poli rujukan auto-preselect di langkah poli).
4. [x] Pilih **poli** → pilih **dokter** (`KuotaBar` sisa kuota JKN/non-JKN + estimasi jam dilayani).
5. [x] **Ambil antrian** → `createAntrean` (`kodebooking`) → **auto-terbit SEP + `addKunjungan` RJ di APM** → **cetak struk + SEP**.
6. [x] **emit Task 3 di APM** (`checkin` Lama = T3) → status `MenungguPoli` → instruksi struk "langsung ke ruang tunggu poli, SKIP loket".

### ANT-ONSITE.Baru — Pasien Baru
1. [x] **Input minimal**: NIK · Nama · Tempat Lahir · Tanggal Lahir · No HP (gender derive dari NIK). → **NIK dedup**: bila NIK sudah ada → interstitial alihkan ke jalur Lama.
2. [x] Buat **draft patient** (`addPatient` minimal, norm terbit; alamat/dll placeholder dilengkapi di loket). *TODO(REG) flag `dataLengkap:false` saat field tersedia di schema.*
3. [x] Pilih **penjamin** (BPJS) → **no. kartu manual / autofill by NIK**. *(Cabang Umum → lewati cek rujukan.)*
4. [x] **Cek rujukan/surat kontrol** by kartu (filter aktif).
5. [x] Pilih **poli** → pilih **dokter** (sisa kuota).
6. [x] **Ambil antrian** → `AntreanRecord` + `kodebooking` → **cetak struk**.
7. [x] **emit Task 1 di APM** (`checkin` Baru = T1) → status `MenungguAdmisi` → instruksi struk "menunggu dipanggil ke loket admisi".
8. [ ] Di loket admisi: **buka modal Lengkapi Data → Task 2** · **Simpan & Terbitkan SEP → Task 3**. *(Scope `/ehis-registration` ANT4/REG — di luar batch kiosk ini.)*

> **SEP**: Pasien **Lama** auto-terbit di **APM** (skip loket). Pasien **Baru** terbit+cetak di **loket admisi** (T3). T2 di-lock saat **modal dibuka** (Opsi A). Lihat [docs/FLOW-RJ-ONSITE.md](docs/FLOW-RJ-ONSITE.md).

---

## Phase ANT2 — Tab: Antrean List (Board Loket) ✅ (2026-05-31) *(menggantikan REG3)*

**Effort:** 2–3 hari · **inti modul.**

> **Status ANT2: ✅ (2026-05-31).** Board di [src/components/antrean/board/](src/components/antrean/board/) — `AntreanListPage` (orchestrator reaktif `useAntreanStore` + `useLoketStore` · filter status chip + counts + pencarian + DensityToggle + toast) · `LoketControlBar` (Buka/Tutup Loket + SessionBar + Shift Log popover audit) · `AntreanTable` (12 kolom, aksi Panggil/Respon/Batal, gating sesi loket) · `BatalModal` (Batal/TidakHadir + preset alasan → task 99) · `boardShared` (STATUS_META + badge + formatter). Store sesi [loketStore.ts](src/lib/antrean/loketStore.ts) (session + shiftLog + map panggilan, pola `useSyncExternalStore`+sessionStorage) · katalog [loketMock.ts](src/lib/antrean/loketMock.ts) (3 pos + loket). TSC + ESLint clean.

### ANT2.1 Header kontrol "Buka Loket"
- [x] Pilih **Pos Antrian** · pilih **Loket** (cascading) · **Tanggal** (date input) · **Jenis Pasien** (Semua/Baru/Lama) · tombol **Buka Loket** (+ Tutup Loket). (2026-05-31)
- [x] Sesi loket aktif mengikat aksi petugas + **Shift Log** popover (audit buka/tutup/panggil/respon/batal). (2026-05-31)

### ANT2.2 Tabel antrean
- [x] Kolom: Pos·Loket · Jenis · No Antrean · **Poli Tujuan** (Antrian / Estimasi Jam / Nama Poli) · Dokter · Bayar · No RM · Nama · Kontak · Tgl Lahir · Status · Aksi. (2026-05-31)
- [x] Density tokens `m-*` + skeleton 500ms + filter status (chip + counts) + pencarian. (2026-05-31)

### ANT2.3 Aksi baris
- [x] **Panggil** → set status `DipanggilAdmisi` + catat panggilan ke loket aktif (siap tampil di Display ANT5). Hanya untuk `MenungguAdmisi`. (2026-05-31)
- [ ] **Respon Kedatangan** → alur bridge (ANT4). **Stub:** log + toast; wiring modal registrasi di **ANT4**.
- [x] Batal / No-show → **task 99** + alasan (modal preset). (2026-05-31)

---

## Phase ANT3 — Tab: Pengaturan Antrian ✅ (2026-05-31)

**Effort:** 1.5–2 hari.

> **Status ANT3: ✅ (2026-05-31).** Tabbed UI di [src/components/antrean/pengaturan/](src/components/antrean/pengaturan/) — `PengaturanPage` (4 tab + DensityToggle + skeleton) · `MappingPosTab` (toggle poli per pos) · `PosLoketTab` (CRUD pos+loket inline edit + reset) · `HakAksesTab` (matriks 4 peran × 5 izin, enforcement stub) · `JadwalDokterTab` (read-only consume `onsiteMock` + cross-link Master). Konfigurasi pos/loket/poli diangkat ke store reaktif [posStore.ts](src/lib/antrean/posStore.ts) (`useSyncExternalStore`+sessionStorage, seed dari loketMock) → **board "Buka Loket" consume store ini** (LoketControlBar + AntreanTable loketLabel). TSC + ESLint clean.

- [x] **Mapping Pos Antrian** (pos → loket → poli) — toggle chip poli per pos, live ke board. (2026-05-31)
- [x] **Tambah Pos Antrian** (CRUD pos & loket) — add/rename/hapus pos + add/hapus loket + reset. (2026-05-31)
- [x] **Hak Akses Antrian** — UI matriks peran×izin disiapkan, gating nyata `// TODO(RBAC-B0)`. (2026-05-31)
- [x] **Jadwal Dokter** — view **read-only consume** dari Master `/ehis-master/jadwal-dokter` (sudah dibangun, lihat dependency) + cross-link "Kelola di Master". Grup per poli → kartu dokter → slot per hari + kuota. (2026-05-31)

---

## Phase ANT4 — Tab: Antrean List → "Respon Kedatangan" Bridge ke Registrasi ✅ (2026-05-31)

**Effort:** 2 hari · **Pair dgn** [TODO-REGISTRASI.md](TODO-REGISTRASI.md) REG1+REG2. **Kritis.**

> **Status ANT4: ✅ (2026-05-31).** `handleRespon` di [AntreanListPage](src/components/antrean/board/AntreanListPage.tsx) mencabang per No. RM → deep-link `/ehis-registration/pasien/{rm}?daftar=rj&kodebooking=...`. [PatientDashboard](src/components/registration/PatientDashboard.tsx) baca `useSearchParams` → auto-buka Daftar Kunjungan. **Dua modal registrasi yang sebelumnya stub kini persist** (REG1/REG2 minimal): [PasienBaruModal](src/components/registration/pasien-baru/PasienBaruModal.tsx) `addPatient` + prop `prefill`/`onSuccess(noRM)`; [DaftarKunjunganModal](src/components/registration/patient/modals/DaftarKunjunganModal.tsx) `addKunjungan` + prop `kodebooking` → emit T3 + status MenungguPoli + SEP + panel sukses. TSC + ESLint clean.

Tombol **Respon Kedatangan** mencabang berdasarkan ada/tidaknya No. RM:

### ANT4.1 Pasien BARU — **emit task 1** saat Respon Kedatangan, **task 2** saat modal dibuka, **task 3** saat kunjungan dibuat.

**(a) Baru via ONLINE** — sudah punya `norm` + data minimal dari WS `POST /pasien`:
- [x] Respon Kedatangan → emit T1+T2 → buka `/pasien/{norm}?daftar=rj&kodebooking=...` (auto-trigger Daftar Kunjungan). (2026-05-31)
- [~] **Lengkapi data RM** (field non-BPJS) — dashboard terbuka, kelengkapan field manual (REG1.1 detail menyusul). (2026-05-31)
- [x] Lanjut **Modal Daftar Kunjungan RJ** + SEP (BPJS). (2026-05-31)

**(b) Walk-in murni** — belum ada `norm` sama sekali:
- [x] Trigger **PasienBaruModal** penuh (prefill NIK/nama/penjamin dari antrean) → `addPatient` → `onSuccess(noRM)` → emit T1+T2 → buka `/pasien/{rm}?daftar=rj` → Daftar Kunjungan RJ + SEP. (2026-05-31) `BpjsPesertaAutofill` penuh = REG follow-up.

### ANT4.2 Pasien LAMA (sudah punya No. RM)
- [x] **emit task 3** saat Respon Kedatangan (idempoten dgn checkin kiosk). (2026-05-31)
- [x] Buka `/pasien/{rm}?daftar=rj&kodebooking=...` dgn **Modal Daftar Kunjungan RJ auto-trigger**. (2026-05-31)
- [x] Daftar + SEP bila BPJS (dummy `genSEP`, backend V-Claim nanti). (2026-05-31)

### ANT4.3 Wiring consume
- [x] `getAntreanByPasien(noRM)` tersedia di store; link kunjungan↔antrean via `kodebooking` (PendaftaranKunjunganInput). (2026-05-31)
- [ ] Badge "Antrean #B-xx · est. 10:30 · task N" di detail kunjungan RJ + worklist RJ EHIS Care — **follow-up** (perlu render di KunjunganDetail/RJBoard).
- [ ] Hook `emitTask` dari EHIS Care RJ (Phase ANT-RJ) & Farmasi (task 6/7) — **follow-up** (Phase ANT-RJ).

---

## Phase ANT-RJ — EHIS Care RJ: Worklist Actionable (Terima/Panggil/Batal + emit T4/T5) *(modul Care, fungsi BARU)*

**Effort:** 2–2.5 hari (worklist actionable + finalize/lock) · **Modul:** `/ehis-care/rawat-jalan` (bukan antrean, tapi sumber emit T4/T5). **Depend:** `emitTask` dari ANT1 (boleh distub dulu lalu disambung).

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

### ANT-RJ.Lock — Finalize & Lock Encounter (RJ) *(keputusan 2026-05-30)*

Tombol **Selesaikan** di header [RJPatientHeader](src/components/rawat-jalan/RJPatientHeader.tsx) (kiri tombol X, baris breadcrumb). Untuk **RJ cukup Selesaikan & lock** — **tanpa modal disposisi** (disposisi-di-tombol-Selesai = pola **RI & IGD** nanti; [DisposisiRJTab](src/components/rawat-jalan/tabs/DisposisiRJTab.tsx) tetap terpisah).

- [ ] **Guard wajib sebelum lock: diagnosa (ICD-10) terisi** — syarat data klaim. Surface kelengkapan ini juga di sub-tab terkait (data kebutuhan klaim), bukan hanya di tombol. Tombol disabled + tampilkan penghambat bila belum lengkap.
- [ ] Klik **Selesaikan** → **emit T5** → status `Selesai` → **lock encounter** (read-only: asesmen · TTV · edit CPPT · edit diagnosa · order baru · resep baru).
- [ ] Capture **`selesaiAt`** = timestamp finalize **pertama** → **immutable** (tidak berubah walau di-reopen).
- [ ] **Whitelist tetap boleh pasca-lock**: rencana kontrol (+ SEP kontrol berikutnya) · penerbitan surat (sehat/sakit/keterangan/salinan resep/rujukan susulan) · cetak dokumen/SEP/resume.
- [ ] **Batalkan Selesai** (re-open) → unlock untuk edit lagi. `selesaiAt` pertama **dipertahankan** (tidak bisa diubah untuk sekarang).
- [ ] Flag `locked` + `selesaiAt` di store RJ (nyatu dgn store transisi di atas, pola `useSyncExternalStore`). Header tampilkan status terkunci + ganti tombol jadi "Batalkan Selesai".
- [ ] Episode/farmasi: bila ada resep, farmasi tetap jalan (T6/T7) setelah lock — lock hanya menutup input klinis poli, bukan farmasi/billing.

---

## Phase ANT5 — Tab: Monitoring Status Antrian ✅ (2026-05-31)

**Effort:** 1.5 hari.

> **Status ANT5: ✅ (2026-05-31).** [src/components/antrean/monitoring/](src/components/antrean/monitoring/) — `MonitoringPage` (KPI compliance + filter kirim + search + grid kartu) · `TaskTimeline` (sequence 1..7/99 per kodebooking, node terisi/belum + waktu + attempt + error) · `TaskEditModal` (koreksi waktu monoton + kirim ulang) · `monitoringShared` (KirimBadge + fmt). Store: `resendTask` (mock sukses, attempts+1) + `editTaskWaktu` (validasi monoton) di [antreanStore](src/lib/antrean/antreanStore.ts). Seed diberi variasi `gagal`/`pending` ([antreanSeed](src/lib/antrean/antreanSeed.ts)) untuk demo. TSC + ESLint clean.

- [x] List antrean + **Task Antrian** per kodebooking (timeline task 1..7/99 + waktu). (2026-05-31)
- [x] **Monitoring pengiriman task** — status terkirim/gagal/pending per task, jumlah attempt, error WS. (2026-05-31)
- [x] **Task editable** — koreksi waktu manual + **re-send** (perbaiki compliance bila WS gagal). Validasi monoton. (2026-05-31)
- [x] KPI compliance: % task terkirim, jumlah gagal/pending, rata-rata jeda antar-tahap. (2026-05-31)

---

## Phase ANT6 — Tab: Referensi (HFIS / Mobile JKN) ✅ (2026-05-31)

**Effort:** 1 hari.

> **Status ANT6: ✅ (2026-05-31).** [src/components/antrean/referensi/](src/components/antrean/referensi/) — `ReferensiPage` (3 tab) · `PoliHfisTab` (mapping RS↔BPJS dari [refMock.ts](src/lib/antrean/refMock.ts) + search) · `MobileJknTab` (kapasitas/kuota per poli **derive dari Master Jadwal Dokter** + summary) · `JadwalHfisTab` (tombol Tarik & Sinkron → `syncFromHFIS` mengisi Master + last-synced + cross-link). Semua read-only / consume Master. TSC + ESLint clean.

- [x] **Referensi Poli HFIS** (mock) — mapping poli RS ↔ poli BPJS + search. (2026-05-31)
- [x] **Referensi Mobile JKN** — kapasitas/kuota JKN & non-JKN per poli + jam praktik (derive dari Master). (2026-05-31)
- [x] **Jadwal Dokter HFIS** — tarik/sinkron HFIS yang **mengisi Master `/ehis-master/jadwal-dokter`** (sumber tunggal); Antrean & RJ consume dari Master. (2026-05-31)

---

## 🧩 Dependency: Sub-menu Master Jadwal Dokter ✅ (2026-05-31) *(prasyarat ANT3/ANT6)*

**Effort:** 1–1.5 hari · **Modul:** `/ehis-master` (bukan antrean, tapi diperlukan antrean).

> **Status: ✅ (2026-05-31).** Sub-menu `/ehis-master/jadwal-dokter` (group "Sumber Daya", icon CalendarDays). Store single source [jadwalDokterStore.ts](src/lib/master/jadwalDokterStore.ts) (`useSyncExternalStore`+sessionStorage, seed 15 dokter selaras kode antrean) · HFIS mock sync (`syncFromHFIS` + cap waktu) · grid mingguan 7 hari × dokter ([WeeklyGrid](src/components/master/jadwal-dokter/WeeklyGrid.tsx)) · edit slot+kuota ([SlotEditModal](src/components/master/jadwal-dokter/SlotEditModal.tsx)) · API consume `getJadwalDokter`/`getSlotFor`/`getJadwalDokterFor`/`hariFromTanggal`. ANT3.4 `JadwalDokterTab` kini **consume store ini** (bukan onsiteMock lagi). TSC + ESLint clean.

- [x] Sub-menu baru `/ehis-master/jadwal-dokter` + item di `masterNav` (group "Sumber Daya"). (2026-05-31)
- [x] **Tarik jadwal via HFIS** (mock WS) → simpan sebagai jadwal RS = single source. Grid mingguan per dokter/poli + kapasitas/kuota. (2026-05-31)
- [x] Expose `getJadwalDokterFor(poli|dokter, tanggal)` + `getSlotFor` untuk di-consume Antrean (estimasi jam) & RJ. (2026-05-31)
- [~] Sinkronkan dgn CLAUDE.md Master Tier 3 — item diangkat jadi aktif. **Sisa swap:** kiosk APM `onsiteMock.estimasiDilayani` masih pakai katalog sendiri → repoint ke `getSlotFor` (follow-up, kode dokter/poli sudah selaras).

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
- **→ EHIS Care (RJ)**: emit **task 4** (Panggil poli) & **task 5** (Selesai Pelayanan) via `emitTask` — worklist actionable (Terima/Panggil/Batal). Lihat **Phase ANT-RJ**.
- **→ Farmasi**: emit **task 6** (siapkan obat) & **task 7** (serah obat) via `workflowStore` → `emitTask`.
- **→ `/ehis-master/jadwal-dokter`** (sub-menu baru): single source jadwal dokter (tarik via HFIS); antrean & RJ consume.
- **→ [TODO-BPJS.md](TODO-BPJS.md)**: Antrol WS sejajar V-Claim — share kredensial bridging, endpoint terpisah.
- **→ Backend**: **ekspos WS provider** (inbound MJKN: `ref/poli`, `jadwaldokter`, `antrean/tambah`, `antrean/batal`, `antrean/status`, `antrean/checkin`) + **client Antrol** (outbound: `antrean/updatewaktu`, `dashboard`). Lihat WS Surface di atas → [TODOS_BACKEND.md](TODOS_BACKEND.md).
