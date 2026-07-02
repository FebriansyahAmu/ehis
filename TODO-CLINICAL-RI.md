# TODO — Rekam Medis Klinis Rawat Inap (DB-wiring tab)

> **Tujuan:** sambungkan **tab rekam medis Rawat Inap** ke DB sehingga pasien NYATA (kunjungan DB
> hasil admisi) bisa **mulai pengisian** end-to-end, bukan mock-UI.
> **Aturan main (HOW):** [docs/RAWAT-INAP-RECORD-RULES.md](docs/RAWAT-INAP-RECORD-RULES.md) — R1–R10 + DoD.
> **Domain backend (WHAT):** [TODO-CLINICAL.md](TODO-CLINICAL.md) — satu set tabel `medicalrecord.*` lintas-unit.
> Dibuat 2026-06-29.

## Titik berangkat (temuan)

- ✅ **Seam buka rekam RI nyata siap** — [RIRecordResolver](src/components/rawat-inap/RIRecordResolver.tsx)
  + adapter [riDetailApi](src/components/rawat-inap/riDetailApi.ts) (`id = kunjungan UUID`, klinis kosong) →
  `RIPatientHeader`+`RIRecordTabs`; kartu census (klik) → mulai pengisian. `SessionProvider` di layout `[id]`.
- ✅ **Fondasi DB solid** — spine `encounter.Kunjungan` + invarian unit ditegakkan partial CHECK
  (`kunjungan_*_chk`, migrasi `20260629140000`). Tabel klinis `medicalrecord.*` **unit-agnostic** (key `kunjunganId`).
- ✅ **Banyak domain klinis SUDAH ada** (dibangun di IGD) → mayoritas kerja RI = **menyambung tab**, bukan bikin domain.
- ⚠️ **Persistensi sebagian tab di-wire di lapis tab IGD, bukan tab RI.** Komponen shared form
  (`keperawatan/`, `pemeriksaan/`) TIDAK memanggil API sendiri → wrapper RI (`rawat-inap/tabs/*`) yang
  harus menyambung GET/POST (mirror IGD).
- ⚠️ **Sebagian tab RI belum punya domain** (ICU Scoring, Discharge, MAR, Konseling) → butuh BE baru. (Care Plan ✅ · Intake/Output ✅ 2026-07-01.)

## Dua kategori kerja

- **Kategori A — SAMBUNG (domain sudah ada, tinggal wire tab RI; murah).**
- **Kategori B — BANGUN DOMAIN dulu (BE baru) lalu wire (mahal).**

Semua mengikuti R1–R10 + DoD per-tab di rules doc. Tab shared (✅) sudah persist by `kunjunganId` → RI inherit gratis.

---

## Tracker tab RI (23 tab · per 2026-06-30)

Legenda: 🟢 DB-wired · 🟡 sebagian/verifikasi · ⬜ mock/lokal (target). Sumber: [RIRecordTabs](src/components/rawat-inap/RIRecordTabs.tsx).

| # | Tab (grup) | Status | Kat. | Domain `medicalrecord.*` | Catatan RI |
|---|---|---|---|---|---|
| 1 | CPPT / SOAP (RM) | 🟢 | — | `Cppt` | shared wired (co-sign DPJP); **default jenis catatan = SBAR** saat tab dibuka (prop `defaultJenis`, 2026-07-01) |
| 2 | TTV (RM) | 🟢 | — | `Observation` | **DB-wired (2026-07-01)** — wrapper RI [rawat-inap/tabs/TTVTab](src/components/rawat-inap/tabs/TTVTab.tsx) fetch `listObservasi` + `onSave`=`recordObservasi` (mode RI multi-shift: shift dipilih, waktu=now server); perawat=user login (server otoritatif `resolvePerawat(actor)`, `recordedBy` display); `emitRecordChange` header sync. Backend `Observation` shared IGD/RI/RJ (gate `clinical.rekammedis`) |
| 3 | Diagnosa (RM) | 🟢 | — | `Diagnosa`+`DiagnosaProsedur` | **DB-wired** (verifikasi 2026-07-01) — RI wrapper teruskan `kunjunganId`; shared persist per-aksi (add/update/delete ICD-10 + add/delete ICD-9). Gate ICD-10 **`clinical.diagnosa`** (Dokter c/r/u, Perawat **read-only**, delete Admin-only) · ICD-9 **`clinical.prosedur`** (Dokter+Perawat c/r/d). ⚠️ `clinical.diagnosa:delete` belum di-grant ke Dokter → tombol hapus diagnosis 403 utk Dokter (pre-existing, sama IGD) |
| 4 | Serah Terima Shift (RM) | 🟢 | — | `SerahTerima` | shared wired (SBAR closed-loop) |
| 5 | Rekonsiliasi Obat (RM) | 🟢 | — | `Rekonsiliasi` | shared wired (context `ri`) |
| 6 | Resep & Obat (Lyn) | 🟢 | — | `ResepOrder` | shared wired; **TTE+cetak baru IGD** (RI menyusul) |
| 7 | Daftar Order (Lyn) | 🟢 | — | gabung Resep/Lab | shared DB-driven (read) |
| 8 | Order Lab (Lyn) | 🟢 | — | `LabOrder` | shared wired |
| 9 | Order Radiologi (Lyn) | 🟢 | — | `RadOrder` | shared wired |
| 10 | Order BMHP (Lyn) | 🟢 | — | (order BMHP) | shared wired |
| 11 | Informed Consent (RM) | 🟢 | — | `InformedConsent` | shared wired — terverifikasi 2026-07-02 (wrapper RI kirim `patient.id` UUID; add/list/detail+TTD/delete via `/kunjungan/:id/consent`) |
| 12 | Konsultasi (Lyn) | 🟢 | A | `Konsultasi` (BARU) | **DB-wired closed-loop (2026-07-02)** — domain `medicalrecord.Konsultasi` (SBAR, Terkirim→Diterima→Dijawab→Selesai, transisi guarded); sisi PEMINTA = tab shared (`/kunjungan/:id/konsultasi` create/selesai/batal, careUnit ABAC; DetailPane mode `peminta`) · sisi KONSULTAN = **worklist RJ** [KonsultasiInbox](src/components/rawat-jalan/KonsultasiInbox.tsx) + halaman jawab fokus `/ehis-care/rawat-jalan/konsultasi/:id` (`/konsultasi` standalone `scopeKunjungan:false`, terima+jawab); **jawaban → auto-CPPT** kunjungan asal (tx sama); RBAC BARU `clinical.konsultasi` (Dokter CRUD · Perawat read); nama aktor = user login |
| 13 | Asuhan Keperawatan (RM) | 🟢 | A | `AsuhanKeperawatan`+`AsuhanEvaluasi` | **DB-wired (2026-07-01)** — port pola IGD ke wrapper RI [rawat-inap/tabs/KeperawatanTab](src/components/rawat-inap/tabs/KeperawatanTab.tsx): `getAsuhanKeperawatan`/create/update/delete + `addEvaluasiShift` (evaluasi shift anak) + template `listSdkiTemplate`; `isPersisted` UUID guard (demo lokal); petugas=user login (`session.namaTampil`); co-sign verify; gate `clinical.keperawatan`. Pertahankan BundleHAI (ICU/HCU) |
| 14 | Pemeriksaan Fisik (RM) | ⬜ | A | `PemeriksaanFisik`+`PenandaanAnatomi` | RI per-sistem ditunda → bangun+wire |
| 15 | Asesmen Awal (RM) | 🟢 | A | `Anamnesis` (+riwayat/alergi/skrining) | **4 sub-pane (Anamnesis/Riwayat/Alergi/Skrining) 🟢 wired** (2026-06-30). Penilaian Risiko **dipindah** ke tab top-level "Penilaian" → rincian [§Sub-pane Asesmen Awal](#sub-pane-asesmen-awal-tab-15--per-2026-06-30) |
| 15b | **Penilaian (RM)** | 🟢 | A | `medicalrecord.penilaian_*` (Fisik/Nyeri/Status/Pediatrik) + `PenilaianSkala` (master skala) + `PenilaianKomposit` (Jantung/Kanker) | **Tab top-level shared BARU (2026-06-30)** — [PenilaianTab](src/components/shared/penilaian/PenilaianTab.tsx) dipromosikan dari IGD ke `components/shared/penilaian/` + di-parametrize `modul`; RI render `modul="RI"`. 7 sub-menu DB-wired; skala Risiko/Jantung/Kanker **master-driven** via `konsumenModul`. Hardcode Barthel/Morse/Braden + violet dihapus. |
| 16 | Pasien Pulang (Lyn) | ⬜ | A | `Disposisi` (transisi `complete`) | pola IGD; sambung pintu RI + lock |
| 17 | Rencana Asuhan / Care Plan (RM) | 🟢 | B | `CarePlanMasalah`+`CarePlanGoal` (BARU) | **DB-wired (2026-07-01)** — RAT **Goal-centric & problem-oriented** (anti re-entry: masalah link Diagnosa/SDKI via `sumber`+`refKode`; goal terukur per PPA = data baru). Parent/child + co-sign DPJP per-masalah (gate **`clinical.careplan`** BARU, verify khusus Dokter di Service). `/kunjungan/:id/care-plan` (+`/:masalahId`, `/goal`, `/goal/:goalId`) layered. FE [CarePlanTab](src/components/rawat-inap/tabs/CarePlanTab.tsx) rewrite problem-oriented (UUID guard; demo lokal). Phase-based hardcode (PhaseSection) dihapus. |
| 18 | Intake / Output (RM) | 🟢 | B | `IntakeOutput`+`IntakeOutputTarget` (BARU) | **DB-wired (2026-07-01)** — domain BARU: entri cairan append-only time-series + soft-delete (`intake_output`) + target DPJP latest-wins (`intake_output_target`). `/kunjungan/:id/intake-output` (GET agregat · POST entri · DELETE `/:itemId` · POST `/target`) layered, gate **`clinical.rekammedis`** (reuse). FE [IntakeOutputTab](src/components/rawat-inap/tabs/IntakeOutputTab.tsx) wired (UUID guard; demo lokal; pencatat/updatedBy=user login). Follow-up: target belum DPJP-only |
| 19 | Gizi & Nutrisi (RM) | ⬜ | B? | sebagian gizi | verifikasi domain; extend |
| 20 | ICU Scoring (RM) | ⬜ | B | **belum ada** (SOFA/APACHE) | hanya kelas ICU/HCU (`showFor`) |
| 21 | Discharge Planning (Lyn) | ⬜ | B | **belum ada** | rencana pulang SNARS |
| 22 | MAR (Lyn) | 🟢 | B | `MarEntry` (BARU) | **DB-wired (2026-07-02)** — baris obat = derivasi `ResepItem` order non-batal (bukan tabel sendiri); entri append-only **"latest wins"** per (obat×tanggal×shift), snapshot namaObat/dosis/rute medikolegal; `GET/POST /kunjungan/:id/mar` (gate `clinical.keperawatan`); perawat = **user login** (server otoritatif, modal read-only "Sesi Login"); **HAM wajib verifikator ke-2 ditegakkan Service**; demo (non-UUID) tetap mock lokal |
| 23 | Konseling Obat (Lyn) | ⬜ | B | **belum ada** | discharge counseling PP 5 |

> Tab shared yang ⬜ (Keperawatan/Pemeriksaan/Asesmen) = wiring lintas-unit → menyelesaikannya juga
> menutup gap RJ (lihat TECH_DEBT "shared RI/RJ pane belum di-wire").

### Sub-pane Asesmen Awal (tab #15) — per 2026-06-30

Tab Asesmen Awal RI = **4 sub-pane** ([AsesmenAwalTab](src/components/rawat-inap/tabs/AsesmenAwalTab.tsx)) — **semua 🟢** (DB-wired 2026-06-30). Penilaian Risiko **dikeluarkan** dari Asesmen Awal & dijadikan **tab top-level "Penilaian"** shared (lihat baris 15b). **Indikator hijau SubNav + progress akurat saat tab dibuka** — 1 panggilan `GET /kunjungan/:id/asesmen/ringkasan` (reuse pola IGD) men-set status terisi per sub-tab tanpa harus mengklik tiap sub-tab dulu (berlaku RI **dan** RJ).

| # | Sub-pane | Std | Status | Domain / endpoint | Catatan RI |
|---|---|---|---|---|---|
| 1 | **Anamnesis** | AP 1.1 | 🟢 | `medicalrecord.Anamnesis` (+JSONB `sosial`/`spiritual`) · `GET/POST /kunjungan/:id/anamnesis` + `/anamnesis-sebelumnya` | **DB-wired (2026-06-30)** [AnamnesisPaneRI](src/components/rawat-inap/asesmenAwal/AnamnesisPaneRI.tsx): tombol **Simpan** persist (append-only, pemeriksa=sesi login); muat anamnesis terbaru saat mount; panel **Anamnesis Sebelumnya** longitudinal lintas-kunjungan ([AnamnesisSebelumnya](src/components/shared/medical-records/AnamnesisSebelumnya.tsx)); Sumber Anamnesis = tombol pilih; **Psikososial & Spiritual opsional**; **Template Cepat dari DB** ([AnamnesisTemplatePicker](src/components/shared/medical-records/AnamnesisTemplatePicker.tsx) `modul="RI"`, master Template Anamnesis TE2). Guard UUID (demo `ri-1`/`ri-3` → lokal). |
| 2 | **Riwayat Medis** | AP 1.1 | 🟢 | 9 domain `medicalrecord.asesmen*` (Penyakit Dahulu/Obat/GayaHidup/FaktorResiko/PenyakitKeluarga/Tuberkulosis/Ginekologi/Perawatan/Obstetri) · `GET/POST /kunjungan/:id/asesmen/<domain>` + `/asesmen/riwayat-sebelumnya` | **DB-wired (2026-06-30)** [RiwayatPane](src/components/shared/asesmen/RiwayatPane.tsx): 9 sub-menu muat saat dibuka + **Simpan** persist (append-only "latest wins"); warna **sky** (bukan violet/indigo); panel **Riwayat Sebelumnya** longitudinal per sub-menu (1 endpoint konsolidasi [riwayatSebelumnyaService](src/lib/services/asesmenMedis/riwayatSebelumnyaService.ts) agregasi 9 DAL `listLatestByKunjunganIds`); **reload pasca-simpan tanpa refresh** → entri baru langsung muncul ("Kunjungan Ini") + dot hijau sub-menu; progress naik + nav hijau saat ≥1 sub-menu terisi. Guard UUID (demo lokal). |
| 3 | **Alergi** | AP 1.1 | 🟢 | `medicalrecord.Alergi` (item, per-aksi) + `AlergiAsesmen` (NKA) · `GET/POST/PATCH /kunjungan/:id/asesmen/alergi` + `DELETE /:itemId` + **baru** `GET /asesmen/alergi-sebelumnya` | **DB-wired (2026-06-30)** shared [AllergyPane](src/components/shared/asesmen/AllergyPane.tsx): muat alergi aktif+NKA saat mount, tambah/hapus/NKA **persist per-aksi** (selaras IGD); warna **sky**. **Carry-forward + rekonsiliasi** — panel **"Riwayat Alergi dari Kunjungan Sebelumnya"** (alergi aktif kunjungan LAIN pasien, dedup per allergen terbaru, [alergiSebelumnyaService](src/lib/services/asesmenMedis/alergiSebelumnyaService.ts)) + tombol **Bawa** / **Bawa Semua** → `addAlergi` ke kunjungan ini (rekam RI lengkap & aman utk peresepan, tanpa fragmentasi/migrasi). Item yang sudah ada di daftar disembunyikan. **Opsi allergen Makanan/Lainnya + reaksi + SNOMED kini dari master Asesmen Katalog DB** (`useAsesmenKatalog` + `AsesmenKatalogProvider` di tab, fallback konstanta) — selaras IGD; Obat tetap dari Katalog Obat+BZA. Guard UUID (demo lokal). **Berlaku RJ** (shared pane sama). |
| 4 | **Skrining Gizi** | AP 1.3 | 🟢 | `medicalrecord.AsesmenGizi` (MUST, append) · `GET/POST /kunjungan/:id/asesmen/gizi` (gate `clinical.rekammedis`) | **DB-wired (2026-06-30)** — shared [GiziPane](src/components/shared/asesmen/GiziPane.tsx) sudah DB-ready (fetch riwayat + persist append + skor MUST + risk), tinggal [SkriningPane](src/components/rawat-inap/asesmenAwal/SkriningPane.tsx) **forward `kunjunganId`+`recordedBy`** (nama petugas=sesi login, read-only) dari tab RI. Warna **indigo→sky** (GiziPane + wrapper). Riwayat skrining per kunjungan tampil + entri baru animasi. Guard UUID (demo lokal). Catatan: hanya RI+IGD (RJ tak punya sub-tab Skrining). |
| ~~5~~ | ~~Penilaian Risiko~~ | AP 1.4–1.5 | ➡️ **dipindah** | — | **DIKELUARKAN dari Asesmen Awal (2026-06-30)** → jadi tab top-level **"Penilaian"** shared (baris 15b), master-driven `konsumenModul`. Hardcode Barthel/Morse/Braden + violet dihapus. |

> **DoD sub-pane (R8/R10):** tulis lewat sub-pane RI (UUID) → baris ber-`kunjungan_id` benar setelah refresh; demo non-UUID tetap lokal; tracker + RULES §3 disinkronkan saat naik 🟢. Menutup sub-pane 2–4 juga menutup gap RJ (shared pane sama).

---

## Fase eksekusi (urut by frekuensi pakai bangsal)

### RI-CL0 — Fondasi ✅ (2026-06-29)
- [x] Resolver + adapter + `SessionProvider` + invarian DB (CHECK). Seam pengisian RI hidup.

### RI-CL1 — Kategori A: sambung domain existing (prioritas)
- [ ] **Asuhan Keperawatan** — wire `rawat-inap/tabs/KeperawatanTab` → `GET/POST /kunjungan/:id/asuhan-keperawatan` (+ `/:itemId/evaluasi`), gate `clinical.keperawatan`, perawat=sesi login, template `master.sdki`. Mirror IGD.
- [ ] **Pemeriksaan Fisik** — bangun varian RI per-sistem (head-to-toe RI ditunda di IGD) + wire `PemeriksaanTab` → `PemeriksaanFisik`(+`PenandaanAnatomi`), gate `clinical.pemeriksaan`.
- [~] **Asesmen Awal** — 5 sub-pane ([§Sub-pane Asesmen Awal](#sub-pane-asesmen-awal-tab-15--per-2026-06-30)):
  - [x] **Anamnesis 🟢** (2026-06-30) — `medicalrecord.Anamnesis` (+sosial/spiritual) · Simpan persist + muat saat mount · panel **Anamnesis Sebelumnya** · Sumber tombol · Psikososial opsional · **Template Cepat dari DB** (master Template Anamnesis TE2).
  - [x] **Riwayat Medis 🟢** (2026-06-30) — 9 domain `asesmen*` wired via `kunjunganId` (muat + Simpan append-only) · warna sky · panel **Riwayat Sebelumnya** longitudinal (`/asesmen/riwayat-sebelumnya`, 1 endpoint agregasi 9 DAL `listLatestByKunjunganIds`) · **reload tanpa refresh** + dot hijau sub-menu · progress/nav hijau saat ≥1 terisi. Berlaku RJ (shared pane sama).
  - [x] **Ringkasan SubNav** (2026-06-30) — `GET /kunjungan/:id/asesmen/ringkasan` (reuse pola IGD) dipanggil saat tab dibuka → sub-tab terisi langsung hijau + progress akurat tanpa klik tiap sub-tab (RI + RJ).
  - [x] **Alergi 🟢** (2026-06-30) — shared `AllergyPane` DB-wired via `kunjunganId` (muat + tambah/hapus/NKA per-aksi, warna sky) + **carry-forward**: panel "Riwayat Alergi dari Kunjungan Sebelumnya" (`/asesmen/alergi-sebelumnya`, dedup per allergen) + **Bawa**/**Bawa Semua** → salin ke kunjungan ini (rekonsiliasi, tanpa migrasi). Berlaku RJ (shared pane sama).
  - [x] **Skrining Gizi 🟢** (2026-06-30) — `medicalrecord.AsesmenGizi` (MUST) via `GET/POST /kunjungan/:id/asesmen/gizi`; shared `GiziPane` sudah DB-ready, `SkriningPane` forward `kunjunganId`+`recordedBy` (petugas=sesi login); warna indigo→sky. Hanya RI+IGD (RJ tak punya sub-tab ini).
  - [x] **Penilaian → tab top-level shared 🟢** (2026-06-30) — alih-alih wire pane hardcode, **[PenilaianTab](src/components/shared/penilaian/PenilaianTab.tsx) IGD dipromosikan ke `components/shared/penilaian/`** (parametrize `modul`), RI render `modul="RI"` sebagai tab top-level baru. 7 sub-menu DB-wired (Fisik/Nyeri/Status/Pediatrik/Asesmen Risiko/Jantung/Kanker); skala master-driven via `konsumenModul`. Penilaian Risiko keluar dari Asesmen Awal; hardcode Barthel/Morse/Braden + violet dihapus. **Penyempurnaan lanjut:** badge "wajib" minimal-set RI · `modul` ICU-aware untuk kelas ICU/HCU.
- [ ] **Pasien Pulang (Disposisi)** — sambungkan pintu RI ke transisi `complete` (`medicalrecord.Disposisi` + lock + gate Diagnosa Utama). Deep-link dari board "Selesai".
- [x] **Informed Consent 🟢** (terverifikasi 2026-07-02) — shared tab sudah DB-wired (UUID guard; `addInformedConsent` + `DaftarICPane` self-fetch list/detail TTD + cetak; soft-delete) dan wrapper RI meneruskan `patient.id` = kunjungan UUID. Tidak perlu kerja tambahan.
- [x] **Konsultasi 🟢** (2026-07-02) — domain BARU `medicalrecord.Konsultasi` closed-loop SBAR: peminta (tab RI/RJ wired by `kunjunganId`) kirim → **worklist konsultan di halaman Rawat Jalan** ([KonsultasiInbox](src/components/rawat-jalan/KonsultasiInbox.tsx)) → halaman jawab fokus `/rawat-jalan/konsultasi/:id` ([KonsultasiAnswerWorkspace](src/components/rawat-jalan/konsultasi/KonsultasiAnswerWorkspace.tsx), Terima → Jawab, konsultan = sesi login) → **jawaban auto-CPPT** ke kunjungan asal → peminta Konfirmasi Selesai (read-back DPJP) / Batalkan saat Terkirim. RBAC `clinical.konsultasi` (migrasi `20260702130000`). **Picker Dokter Konsultan ✅ (2026-07-02)** — field di RequestPane = dropdown searchable **dokter ter-assign ke ruangan poli** (SDM Assignment, `GET /master/konsultan-tersedia` gate `clinical.konsultasi:read`; filter by SMF via token gelar `SMF_SP_TOKEN` ↔ `Pegawai.spesialistik` "(Sp.B)", SMF tanpa kecocokan → tampil semua + banner; fallback input teks bila endpoint gagal/kosong). Follow-up: enforcement SMF↔spesialis server-side · aksi Tolak · SLA overdue badge · filter worklist by SMF dokter login · simpan `dokterKonsultanPegawaiId` (kini nama snapshot saja).

### RI-CL2 — Kategori B: domain baru (BE + FE)
- [✅] **Intake / Output** — domain `medicalrecord.IntakeOutput`+`IntakeOutputTarget` (entri per-shift append-only + target balance latest-wins) + endpoint + wire tab (2026-07-01).
- [ ] **ICU Scoring** — domain SOFA/APACHE (append-only, skor terhitung) + wire (hanya kelas ICU/HCU).
- [✅] **Rencana Asuhan / Care Plan** — domain `CarePlanMasalah`+`CarePlanGoal` (Goal-centric, problem-oriented) + co-sign DPJP + wire (2026-07-01).
- [ ] **Gizi & Nutrisi** — verifikasi/extend domain gizi + wire (diet order + monitoring).
- [✅] **MAR** — domain `medicalrecord.MarEntry` (append-only latest-wins per obat×tanggal×shift; baris obat derivasi ResepItem order non-batal; HAM double-check server-side; perawat = actor login) + `GET/POST /kunjungan/:id/mar` + wire [MARTab](src/components/shared/medical-records/MARTab.tsx) (2026-07-02).
- [ ] **Discharge Planning · Konseling Obat** — domain + wire (SNARS PP 5 / PKPO 6).

### RI-CL3 — Polish RI-spesifik
- [ ] **Status klinis board** — derivasi Kritis/Observasi/Konsultasi dari data klinis (bukan hanya lifecycle). [RawatInapPageView.toPatient](src/components/rawat-inap/RawatInapPageView.tsx).
- [ ] **Isolasi persist** — `RIPatientHeader` IsolasiPanel masih state lokal → persist (PPI 5).
- [ ] **DPJP edit header** — `DPJPCard onSave` masih no-op → PATCH `kunjungan.dpjpId`.
- [ ] **Billing baca `kelasHak`** — akomodasi TITIPAN ikut hak kelas (sinkron billing).

---

## Keputusan terkunci

1. **Reuse domain lintas-unit** — RI memakai tabel `medicalrecord.*` yang sama dengan IGD/RJ (R1). TIDAK ada `ri_cppt`/`ri_keperawatan`.
2. **Wrapper RI tipis** — beda perilaku via props (`history`/`context:"ri"`/`showMAR`/`showDate`), bukan fork (R2).
3. **Guard UUID** — pasien nyata (UUID) → DB; demo `ri-1`/`ri-3` → lokal (R3/R4).
4. **Backend berlapis + gate** — `clinical.*` + careUnit ABAC; domain baru ikut pola Route→Service→DAL (R5); migrasi anti-drift (R7).
5. **Append-only / latest-wins** sesuai domain; hormati lock kunjungan (R6/R9).
6. **Sinkron dok** — tiap tab naik 🟢: update tracker di sini + [docs/RAWAT-INAP-RECORD-RULES.md §3](docs/RAWAT-INAP-RECORD-RULES.md) + [CLAUDE.md](CLAUDE.md) + [TECH_DEBT.md](TECH_DEBT.md) (R10).

## Verifikasi (per tab)

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` bersih `^src/` + `eslint` file tersentuh.
- Smoke `pg`: tulis lewat tab RI → baris muncul ber-`kunjungan_id` benar; lock dihormati; demo non-UUID tetap lokal.
- Buka rekam RI nyata → tab terkait memuat data tersimpan setelah refresh.
