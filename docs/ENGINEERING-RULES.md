# EHIS — Engineering Rules (Git · Verifikasi · Security · UI · Backend)

> Aturan kerja lintas-modul, berlaku mulai **2026-11-17**. Aturan domain tetap di dokumennya masing-masing
> ([BACKEND-FLOWS](BACKEND-FLOWS.md) · [API-RULES](API-RULES.md) · [ASSIGNMENT-RULES](ASSIGNMENT-RULES.md) ·
> [RAWAT-INAP-RECORD-RULES](RAWAT-INAP-RECORD-RULES.md) · [FHIR-RULES](FHIR-RULES.md) · [BPJS-WS-RULES](BPJS-WS-RULES.md)).
> Bila bertentangan soal **arsitektur backend**, BACKEND-FLOWS menang; soal **proses kerja**, dokumen ini menang.
> Celah keamanan yang ditemukan dicatat di [SECURITY-GAP.md](SECURITY-GAP.md).

---

## 1. Git — branch per fitur

| Aturan | Detail |
|---|---|
| **G1 Tak ada kerja langsung di `main`** | Setiap fitur/perbaikan dikerjakan di branch baru dari `main` terbaru. |
| **G2 Penamaan** | `<tipe>/<area>-<ringkas>` huruf kecil, kebab-case. Tipe: `feat` · `fix` · `refactor` · `chore` · `docs`. Contoh: `feat/fhir-fh8-validator`, `fix/lab-hasil-param-id`, `chore/engineering-rules`. |
| **G3 Satu branch = satu topik** | Temuan di luar topik → catat (GAP/TECH_DEBT) atau branch terpisah, jangan ditumpuk. |
| **G4 Commit message** | Gaya repo: `add:` / `fix:` / `change:` + ringkasan Bahasa Indonesia huruf kecil, body poin singkat. User yang commit; Claude memberi rekomendasi di akhir pekerjaan. |
| **G5 Alur gabung** | push branch → buka PR (template otomatis) → **CI hijau** → **squash merge** ke `main` → hapus branch. |
| **G6 Sinkron** | Sebelum membuat branch: `git switch main && git pull`. Branch lama tertinggal → `git merge main` (bukan rebase branch yang sudah di-push). |
| **G7 Larangan** | Tak ada force-push ke `main`; tak ada commit `.env`, kode generate (`src/generated/`), cache (`.next/`, `.codenpm/`, `.eslintcache`). |
| **G8 Migrasi DB** | File migrasi ikut branch fiturnya. Diterapkan lokal via `prisma db execute` + `migrate resolve --applied` (pola drift-safe), additive. |

**Peran Claude:** membuat branch (`git switch -c …`) **sebelum edit pertama** sebuah fitur, setelah memastikan `git status` bersih.

**Setelan repo GitHub (sekali, oleh pemilik repo):** Settings → Branches → aturan untuk `main`: *Require a pull request* + *Require status checks* (`Typecheck · Lint · Test`) — aktifkan **setelah CI pertama hijau** (lihat SG-14). Settings → Code security: Dependabot alerts + security updates, Secret scanning + push protection.

---

## 2. Verifikasi bertingkat — tetap review, tanpa membebani laptop

Laptop dev: RAM 7,7 GB (bebas sering < 1 GB saat VS Code + browser terbuka). Pemeriksaan berat (tsc penuh atas
±2.100 file + 16 MB tipe Prisma, lint seluruh repo, `next build`) **dipindah ke CI**. Review tetap wajib setiap fitur.

| Tingkat | Kapan | Apa | Biaya |
|---|---|---|---|
| **0 Editor** | Setiap edit | Diagnostik TS server VS Code per file (sudah berjalan, tanpa proses baru) | ≈0 |
| **1 Lokal ringan** | Akhir fitur | `npm run check:changed` → cek RAM bebas ≥ 1 GB · ESLint **hanya file berubah** (+cache) · **tsc terbatas** pada graf impor file berubah (heap ≤ 1 GB; graf terlalu besar → diserahkan ke CI) · `vitest related` (maks 2 worker) · peringatan file > 800 baris | kecil (graf UI ±300 MB) |
| **2 CI** | Push / PR | [ci.yml](../.github/workflows/ci.yml): `prisma generate` → `next typegen` → **tsc penuh** → **ESLint penuh** → **vitest** · audit dependensi | 0 di laptop |
| **Review** | Akhir fitur | Review diff branch (`git diff main...HEAD`) terhadap checklist §3 & §5; `/code-review` level low/medium bila perlu | kecil |

**Aturan pendukung**
- **V1** Satu proses berat pada satu waktu. Jangan jalankan dev server + tsc/lint bersamaan.
- **V2** `next build` **tidak** dijalankan di laptop. `npm run typecheck` (tsc penuh) hanya bila RAM bebas ≥ 2 GB dan tak ada proses berat lain — normalnya serahkan ke CI.
- **V3** Lint tak pernah menyentuh `src/generated/**` (sudah di-ignore di [eslint.config.mjs](../eslint.config.mjs)).
- **V4** Vitest maksimal 2 worker ([vitest.config.ts](../vitest.config.ts)).
- **V5** Yang belum terverifikasi (belum dibuka di browser, belum diuji sandbox, tsc tertunda) dicatat di file GAP area terkait — bukan dipaksa dijalankan.
- **V6** [.vscode/settings.json](../.vscode/settings.json) mengecualikan `src/generated`, `.next`, `node_modules`, `.codenpm` dari watcher & pencarian; ESLint extension lint saat simpan.

---

## 3. Security — standar OWASP

**Acuan:**
- **OWASP ASVS 5.0, target Level 2** — checklist verifikasi (data rekam medis = data sensitif tinggi).
- **OWASP Top 10:2025** & **OWASP API Security Top 10 (2023)** — peta risiko saat merancang & mereview.
- Regulasi pelengkap: **UU 27/2022 (Pelindungan Data Pribadi)** · **PMK 24/2022 (Rekam Medis Elektronik)** — kerahasiaan, integritas, ketersediaan, jejak akses.

**Aturan wajib (dicek di setiap PR — ada di template PR)**

| # | Aturan | Risiko OWASP |
|---|---|---|
| **S1** | Endpoint API selalu lewat `route()` dengan `resource` + `action` RBAC; tak ada handler telanjang. | A01 Broken Access Control |
| **S2** | Akses data milik kunjungan/pasien dicek kepemilikan: `scopeKunjungan` (default) atau verifikasi relasi di Service (anti-IDOR, mis. order ∈ kunjungan). Unit penunjang: SDM Assignment ([ASSIGNMENT-RULES](ASSIGNMENT-RULES.md)). | API1 BOLA · A01 |
| **S3** | Semua input divalidasi **Zod** di batas (body/query/params); Service tak percaya data klien untuk identitas aktor/nama (diturunkan server, anti-spoof). | A05 Injection · API3 |
| **S4** | SQL: Prisma, atau raw **berparameter**. `$queryRawUnsafe` hanya dengan potongan SQL konstanta/whitelist — nilai dari user selalu lewat parameter `$n`. | A05 Injection |
| **S5** | Tanpa PII/PHI (NIK, nama, diagnosis, hasil) di log aplikasi, pesan error, URL/query string. Audit memakai hash ([FHIR-RULES](FHIR-RULES.md) R14, BPJS R8). | A09 · ASVS Data Protection |
| **S6** | Secret hanya server-side: modul ber-`import "server-only"`, dibaca dari env, tak pernah dikirim ke klien atau di-commit. | A04 Cryptographic Failures · A02 |
| **S7** | Error ke klien = pesan aman (`handleError`); stack/SQL hanya di log server. | A10 Mishandling of Exceptional Conditions |
| **S8** | Panggilan eksternal (BPJS/SatuSehat) di luar transaksi DB, ber-timeout, retry/circuit, diaudit; host target tetap dari config (bukan dari input user). | API10 Unsafe Consumption of APIs · SSRF |
| **S9** | `dangerouslySetInnerHTML` hanya untuk konstanta statis (mis. CSS cetak), tak pernah data user. | A05 (XSS) |
| **S10** | Dependensi baru: cek kebutuhan, lisensi, pemeliharaan; dependensi luar registry npm (mis. `xlsx` dari CDN SheetJS) dipantau manual. | A03 Software Supply Chain Failures |
| **S11** | Fitur yang menyentuh auth, sesi, data sensitif massal, atau integrasi eksternal → tulis catatan ancaman singkat (aset · aktor · penyalahgunaan · kontrol) di dokumen fitur. | A06 Insecure Design |

Backlog perbaikan keamanan (header, CSRF/Origin, rate-limit login, dll.) → [SECURITY-GAP.md](SECURITY-GAP.md).

---

## 4. UI — frontend-design + shadcn/ui bertahap

| # | Aturan |
|---|---|
| **U1** | Setiap pekerjaan UI tetap **invoke skill `frontend-design`** sebelum menulis komponen. |
| **U2** | **shadcn/ui diadopsi bertahap, bukan rewrite.** Primitif di-*copy-in* ke `src/components/ui/` (kode milik kita), berbasis **Radix**. Dipakai untuk fitur baru & layar yang sedang disentuh. |
| **U3** | Prioritas adopsi = komponen yang aksesibilitasnya sulit dibuat sendiri: **Dialog/Sheet** (focus trap, Esc, aria), **Popover**, **DropdownMenu**, **Tooltip**, **Tabs**, **Command** (combobox cari). |
| **U4** | Komponen global yang sudah ada (`Select`, `DatePicker`, `TimePicker`, toast, `DiscardDialog`, `ConfirmDialog`) **tetap dipakai** sampai diganti secara sengaja di branch tersendiri — jangan ada dua pola untuk hal yang sama di satu layar. |
| **U5** | Token semantik shadcn memakai variabel **`--ui-*`** di [globals.css](../src/app/globals.css) (terpisah dari `--primary/--border` lama yang ikut blok `prefers-color-scheme`), dipetakan ke palet EHIS (default indigo-600, slate); **tanpa ungu**. Aksen modul: atribut **`data-accent`** (`teal`·`cyan`·`sky`·`emerald`·`amber`·`rose`, varian -700 agar teks putih lolos AA). Konten ber-portal (Sheet/Dialog/Popover/Dropdown) dirender di `<body>` → pasang `data-accent` **di Content-nya**, bukan hanya di pembungkus halaman. |
| **U6** | Primitif shadcn memakai **`cn` dari `@/lib/ui/utils`** (clsx + tailwind-merge — `className` pemakai bisa menimpa default). `cn()` lama di `@/lib/utils` (gabung string, dipakai ±2.000 file) **tidak diubah**. Utilitas density `m-mini … m-lg` didaftarkan sebagai grup `ehis-density` (teruji: tak bentrok dengan margin `m-*` maupun `text-*`; antar-density yang terakhir menang). |
| **U6b** | Base shadcn (warna border/outline default) **di-scope ke `[data-slot]`** dalam `@layer base` — bukan `*` global seperti template shadcn — sehingga halaman lama tidak berubah. Animasi enter/exit dari `tw-animate-css`. App light-only: varian `dark:` pada primitif tidak aktif (dark mode = `data-theme="dark"`, belum dipakai). |
| **U6c** | **Menambah komponen:** `npm run ui:add -- <nama>` ([scripts/shadcn-add.mjs](../scripts/shadcn-add.mjs)), **bukan** `npx shadcn add` langsung — CLI 4.x menulis `import { cn } from "cn"` dan memasang paket npm `cn` pihak ketiga. Dependensi npm komponen (mis. `cmdk`) dipasang manual setelah cek `npx shadcn@4.23.0 add <nama> --dry-run`. Teks bawaan berbahasa Inggris dilokalkan (mis. `Close` → `Tutup`). |
| **U7** | Aksesibilitas target **WCAG 2.2 AA**: semua aksi bisa via keyboard, fokus terlihat, label form, kontras ≥ 4.5:1, status tak hanya lewat warna, hormati `prefers-reduced-motion`. |
| **U8** | Responsif mobile-first; tak ada scroll horizontal halaman (tabel lebar boleh scroll di dalam kontainernya). |

**Setup ✅ (2026-11-17, branch `chore/ui-shadcn-setup`):** [components.json](../components.json) (style `new-york`, Radix) · dependensi `radix-ui` · `class-variance-authority` · `clsx` · `tailwind-merge` · `tw-animate-css` · `cmdk` · primitif di [src/components/ui/](../src/components/ui/): `button` · `dialog` · `sheet` · `popover` · `dropdown-menu` · `tooltip` · `tabs` · `command`.

**+Card · Badge (2026-11-19, branch `feat/care-beranda-redesign`):** token `--ui-card`/`--ui-card-foreground` (+`--color-card*`). Dipakai **Beranda EHIS Care** ([page](../src/app/ehis-care/(main)/page.tsx) + [components/care/beranda/](../src/components/care/beranda/)): strip KPI 1 Card (sel `gap-px`), kartu layanan per kelompok Pelayanan/Penunjang dengan pola *stretched link* (hanya judul = `<a>`, `::after` menutup kartu; hover & cincin fokus di kartu via `has-[a:hover]`/`has-[a:focus-visible]`), animasi masuk `motion-safe:` saja, badge "Data contoh" (angka belum terhubung data).

**Pilot:** drawer detail resource konsol FHIR ([resourceUi.tsx](../src/components/fhir/resource/resourceUi.tsx) `ResourceDrawer`) dipindah dari overlay buatan sendiri ke **`Sheet` + `Tabs`** (focus trap, Esc/klik luar, roving focus tab, `aria` dari `SheetTitle`/`SheetDescription`) dengan `data-accent="teal"`; tombol "Buka kunjungan" → `Button` shadcn (teal-700, lolos AA). Pemakai drawer mempertahankan data terpilih selama animasi tutup (tanpa kedip kosong). **Belum dibuka di browser.**

---

## 5. Backend — konsisten dengan arsitektur

| # | Aturan |
|---|---|
| **B1** | Berlapis **Route → Service → DAL**: route tipis (`route()` + Zod + RBAC), aturan bisnis & authz halus di Service, DAL Prisma murni (terima `tx?`, tanpa aturan bisnis). |
| **B2** | Kontrak di `src/lib/schemas/<domain>/` (Zod + DTO); client API di `src/lib/api/<domain>/` me-reuse tipe via `import type`. Domain baru dikelompokkan per tab/fitur di tiap layer. |
| **B3** | Mutasi multi-tabel dalam satu transaksi; integrasi eksternal lewat **outbox** di tx yang sama — aksi klinis tak pernah gagal karena sistem luar. |
| **B4** | Konvensi data: UUID v7 · `timestamptz` · soft-delete · optimistic concurrency (`version`) untuk entitas yang diedit bersama · append-only "latest wins" untuk dokumen klinis. |
| **B5** | Migrasi **additive**, SQL ditulis manual → `db execute` → `migrate resolve --applied` → `prisma generate`. Perubahan destruktif butuh rencana tersendiri. |
| **B6** | Audit untuk aksi finansial, klinis sensitif, dan panggilan eksternal (immutable, aktor dari server). |
| **B7** | Ukuran file ≤ 800 baris. File yang sudah melebihi (17 file per 2026-11-17) tidak boleh bertambah; dipecah saat disentuh. |
| **B8** | Test unit Service (DAL di-mock) untuk logika bisnis & otorisasi baru — terutama jalur authz/kepemilikan (lihat SG-05). |

---

## 6. Definition of Done (per branch)

1. Branch dari `main` terbaru, satu topik (G1–G3).
2. Diagnostik editor bersih untuk file yang disentuh (tingkat 0).
3. `npm run check:changed` lulus (tingkat 1).
4. Checklist keamanan §3 dicek; catatan ancaman bila S11 berlaku.
5. UI: frontend-design di-invoke, aksesibilitas U7 dicek.
6. Dokumen diperbarui: CLAUDE.md (baris modul), TODO-* terkait, GAP area (verifikasi tertunda & temuan).
7. Rekomendasi commit message diberikan.
8. PR dibuka, **CI hijau**, squash merge.
