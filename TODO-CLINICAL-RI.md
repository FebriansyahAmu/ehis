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
- ⚠️ **Sebagian tab RI belum punya domain** (Care Plan, Intake/Output, ICU Scoring, Discharge, MAR, Konseling) → butuh BE baru.

## Dua kategori kerja

- **Kategori A — SAMBUNG (domain sudah ada, tinggal wire tab RI; murah).**
- **Kategori B — BANGUN DOMAIN dulu (BE baru) lalu wire (mahal).**

Semua mengikuti R1–R10 + DoD per-tab di rules doc. Tab shared (✅) sudah persist by `kunjunganId` → RI inherit gratis.

---

## Tracker tab RI (23 tab · per 2026-06-29)

Legenda: 🟢 DB-wired · 🟡 verifikasi · ⬜ mock/lokal (target). Sumber: [RIRecordTabs](src/components/rawat-inap/RIRecordTabs.tsx).

| # | Tab (grup) | Status | Kat. | Domain `medicalrecord.*` | Catatan RI |
|---|---|---|---|---|---|
| 1 | CPPT / SOAP (RM) | 🟢 | — | `Cppt` | shared wired (co-sign DPJP) |
| 2 | TTV (RM) | 🟢 | — | `Observation` | shared wired; RI multi-shift (`history`) |
| 3 | Diagnosa (RM) | 🟢 | — | `Diagnosa` | shared wired |
| 4 | Serah Terima Shift (RM) | 🟢 | — | `SerahTerima` | shared wired (SBAR closed-loop) |
| 5 | Rekonsiliasi Obat (RM) | 🟢 | — | `Rekonsiliasi` | shared wired (context `ri`) |
| 6 | Resep & Obat (Lyn) | 🟢 | — | `ResepOrder` | shared wired; **TTE+cetak baru IGD** (RI menyusul) |
| 7 | Daftar Order (Lyn) | 🟢 | — | gabung Resep/Lab | shared DB-driven (read) |
| 8 | Order Lab (Lyn) | 🟢 | — | `LabOrder` | shared wired |
| 9 | Order Radiologi (Lyn) | 🟢 | — | `RadOrder` | shared wired |
| 10 | Order BMHP (Lyn) | 🟢 | — | (order BMHP) | shared wired |
| 11 | Informed Consent (RM) | 🟡 | A | `InformedConsent` | verifikasi persist di konteks RI |
| 12 | Konsultasi (Lyn) | 🟡 | A | (konsultasi lintas-unit) | verifikasi domain + wire |
| 13 | Asuhan Keperawatan (RM) | ⬜ | A | `AsuhanKeperawatan`+`AsuhanEvaluasi` | wiring ada di IGD; wire tab RI |
| 14 | Pemeriksaan Fisik (RM) | ⬜ | A | `PemeriksaanFisik`+`PenandaanAnatomi` | RI per-sistem ditunda → bangun+wire |
| 15 | Asesmen Awal (RM) | ⬜ | A | anamnesis/riwayat/alergi/skrining | domain ada (IGD); shared RI pane belum di-wire |
| 16 | Pasien Pulang (Lyn) | ⬜ | A | `Disposisi` (transisi `complete`) | pola IGD; sambung pintu RI + lock |
| 17 | Rencana Asuhan / Care Plan (RM) | ⬜ | B | **belum ada** | desain domain dulu |
| 18 | Intake / Output (RM) | ⬜ | B | **belum ada** | balance cairan per-shift |
| 19 | Gizi & Nutrisi (RM) | ⬜ | B? | sebagian gizi | verifikasi domain; extend |
| 20 | ICU Scoring (RM) | ⬜ | B | **belum ada** (SOFA/APACHE) | hanya kelas ICU/HCU (`showFor`) |
| 21 | Discharge Planning (Lyn) | ⬜ | B | **belum ada** | rencana pulang SNARS |
| 22 | MAR (Lyn) | ⬜ | B | turunan dispensing/administrasi | Medication Administration Record per-shift |
| 23 | Konseling Obat (Lyn) | ⬜ | B | **belum ada** | discharge counseling PP 5 |

> Tab shared yang ⬜ (Keperawatan/Pemeriksaan/Asesmen) = wiring lintas-unit → menyelesaikannya juga
> menutup gap RJ (lihat TECH_DEBT "shared RI/RJ pane belum di-wire").

---

## Fase eksekusi (urut by frekuensi pakai bangsal)

### RI-CL0 — Fondasi ✅ (2026-06-29)
- [x] Resolver + adapter + `SessionProvider` + invarian DB (CHECK). Seam pengisian RI hidup.

### RI-CL1 — Kategori A: sambung domain existing (prioritas)
- [ ] **Asuhan Keperawatan** — wire `rawat-inap/tabs/KeperawatanTab` → `GET/POST /kunjungan/:id/asuhan-keperawatan` (+ `/:itemId/evaluasi`), gate `clinical.keperawatan`, perawat=sesi login, template `master.sdki`. Mirror IGD.
- [ ] **Pemeriksaan Fisik** — bangun varian RI per-sistem (head-to-toe RI ditunda di IGD) + wire `PemeriksaanTab` → `PemeriksaanFisik`(+`PenandaanAnatomi`), gate `clinical.pemeriksaan`.
- [ ] **Asesmen Awal** — wire shared `asesmen/*` pane (Anamnesis/Riwayat/Alergi/Skrining Gizi) ke domain yang sudah ada via `kunjunganId`. (Tutup juga gap RJ.)
- [ ] **Pasien Pulang (Disposisi)** — sambungkan pintu RI ke transisi `complete` (`medicalrecord.Disposisi` + lock + gate Diagnosa Utama). Deep-link dari board "Selesai".
- [ ] **Informed Consent / Konsultasi** — verifikasi persist by `kunjunganId` di konteks RI; wire bila belum.

### RI-CL2 — Kategori B: domain baru (BE + FE)
- [ ] **Intake / Output** — domain `medicalrecord.IntakeOutput` (entri per-shift + balance) + endpoint + wire tab.
- [ ] **ICU Scoring** — domain SOFA/APACHE (append-only, skor terhitung) + wire (hanya kelas ICU/HCU).
- [ ] **Rencana Asuhan / Care Plan** — domain rencana asuhan (fase/target) + wire.
- [ ] **Gizi & Nutrisi** — verifikasi/extend domain gizi + wire (diet order + monitoring).
- [ ] **Discharge Planning · MAR · Konseling Obat** — domain + wire (SNARS PP 5 / PKPO 6).

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
