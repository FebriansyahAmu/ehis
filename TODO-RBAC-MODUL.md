# TODO — RBAC Visibilitas Modul per-Role

> **Tujuan:** user dengan role tertentu (mis. **Registrasi**) hanya bisa **melihat & mengakses** modul/sub-menu/aksi yang sesuai izinnya; sisanya tidak tampil & tidak bisa dibuka.
> Acuan auth: [docs/BACKEND-AUTH.md](docs/BACKEND-AUTH.md) (§9 checklist, §11 gap). Dibuat 2026-06-07.

## Titik berangkat (temuan)
- 🔴 **`isGlobal` ketuker `unitScoped`** — `authService.authzOf` set `isGlobal = role.unitScoped===false`, lalu `assertCan` bypass RBAC bila `isGlobal`. Karena Registrasi/Kasir di-seed `unitScoped=false`, mereka **bypass seluruh RBAC** (bisa semua modul). Kebalikan dari tujuan.
- ⚠️ **Matriks RBAC di Master = MOCK** — `RBACPane` pakai `useState(initRBACMap())` dari snapshot statis; tak persist ke DB. Izin role nyata hanya dari **seed** (`auth.role_permissions`).
- ❌ **Visibilitas modul belum ada** — Sidebar/ModuleSwitcher tampil semua; tak ada peta modul/menu→izin, tak ada guard halaman.
- ✅ **API enforcement sudah ada** — `assertCan(resource, action)` di semua `route()`. Tinggal "dibangunkan" (Fase 1).

## Keputusan terkunci (2026-06-07)
1. **Registrasi tetap `clinical.rj:read`.** → Modul **Care tetap muncul** tapi **hanya sub-menu Rawat Jalan (read-only)**; IGD & Rawat Inap tersembunyi (konsekuensi gating sub-menu).
2. **Dashboard di-gerbang (bukan universal), Registrasi diberi akses.** → Butuh permission baru **`dashboard.view`** (belum ada di tree) + grant ke Registrasi (dan role lain sesuai kebutuhan).
3. **Granularitas gating sampai sub-menu + aksi** — tiap NavItem terikat izin; tombol create/update/delete ikut disembunyikan/disable via `can(resource, action)`.
4. **`antrian`** *(default, belum dikonfirmasi eksplisit)* — Registrasi **boleh akses** (antrian erat dgn registrasi). Revisi bila perlu.

### Target tampilan user Registrasi
Registrasi (registration.*) · Dashboard (dashboard.view) · Care→Rawat Jalan read-only (clinical.rj:read) · Antrian. **Master/Billing/E-Klaim/BPJS/Report tidak tampil.**

---

## Fase 1 — Pisahkan `isSuperuser` dari `isGlobal`/`unitScoped`  ✅ SELESAI (2026-06-07)
Fondasi. Tanpa ini, sisa fase tak terasa.
- [x] `src/lib/auth/superuser.ts` — `SUPERUSER_ROLE_KEYS=["Admin"]` + `hasSuperuserRole(roles)`.
- [x] `actor.ts` — `Actor.isSuperuser`; `actorFromClaims` derive dari `claims.roles`; `assertCan` bypass pakai **`isSuperuser`** (bukan `isGlobal`); `DEV_ACTOR.isSuperuser=true`. `isGlobal` tetap (dari unitScoped) untuk ABAC nanti.
- [x] `authService.buildSession` — tambah `isSuperuser` (dari roleKeys).
- [x] `schemas/auth.ts` — `SessionDTO.isSuperuser`.
- [x] `SessionContext.can()` — pakai `session.isSuperuser` (bukan `isGlobal`).
- **Tanpa** migration / ubah JWT (roles sudah ada di claims).
- **DoD terpenuhi:** `tsc` bersih · 16 tes auth lulus · smoke E2E (token buatan): Registrasi (`isGlobal:true`,bukan Admin) → `/master/pegawai` **403**, `/patients` **200**; Admin (superuser) → `/master/pegawai` **200**.

## Fase 2 — Visibilitas sampai sub-menu + aksi  🚧 (2a–2d ✅, 2e tersisa)
Hasil yang diinginkan secara nyata.
- [x] **2a** permission `dashboard.view` → `PERMISSION_TREE`+`rbacShared`+generator, re-seed (migration `20260607140000_rbac_dashboard_view`, 96→**97 perm**). Grant **Registrasi** (Admin via allFull).
- [x] **2b** model izin nav: `NavItem.perm` (string|array) + `ModuleDescriptor.perms` + helper isomorphic (`navItemVisible`/`canSeeModule`/`visibleNav`/`visibleModules`/`homeHref`) di `navigation.ts`. **Care** dianotasi per sub-menu (igd/ri/rj/farmasi/lab/rad); modul lain gate level-modul (cukup; per-item menyusul bila ada role parsial).
- [x] **2c** gating klien: `ModuleSwitcher` (filter `visibleModules`, modul aktif selalu ada, anti-kedip saat loading) + `Sidebar` (`visibleNav`, buang group kosong).
- [x] **2d** guard server per-modul: `requireModule(key)` (`getServerActor`+`canSeeModule`→`redirect(homeHref)`) di 9 layout (6 edit + 3 top-level baru care/registration/antrian utk route-group).
- [~] **2e** **Gating aksi** — **primitif + konvensi ✅**, rollout per-modul iteratif:
  - [x] Primitif [`src/components/auth/Can.tsx`](src/components/auth/Can.tsx) — `<Can resource action fallback>` + hook `useCan()`. UX-only; server tetap penjaga.
  - [x] Contoh kanonik: tombol **"Pasien Baru"** ([PasienListControls](src/components/registration/pasien-list/PasienListControls.tsx)) digerbang `registration.pasien:create`.
  - [ ] Rollout sisa per-modul (Master CRUD, Billing, Kunjungan, dll.) — bungkus tombol create/update/delete dgn `<Can>` / `useCan()`. Dikerjakan deliberately saat tiap modul disentuh (hindari wrapping buta massal).
- **DoD 2a–2d terpenuhi:** `tsc` bersih · smoke E2E (token Registrasi): `/ehis-{master,billing,eklaim,report,bpjs}` → **307 → /ehis-dashboard**; `/ehis-{dashboard,care,registration,antrian}` → **200**; Admin → semua **200**.

### Catatan follow-up
- **Layar publik** `ehis-antrian/(fullpage)/{display,apm}` (monitor antrean/kiosk APM) kini ikut ter-guard (& sudah diblok proxy). Bila perlu publik tanpa login → allowlist di **proxy + requireModule**.
- Per-item gating Master/Billing/dst. (saat ini level-modul) — tambah `perm` per NavItem saat ada role dgn akses parsial.

## Fase 3 — Wire matriks RBAC ke DB (self-service)  ✅ SELESAI (2026-06-07)
- [x] DAL [`rbacAdminDal`](src/lib/dal/rbacAdminDal.ts) + Service [`rbacAdminService`](src/lib/services/rbacAdminService.ts) (`getMatrix` · `updateRoleGrants` REPLACE dalam tx + `invalidateRbacCache()`).
- [x] Endpoint: `GET /api/v1/auth/rbac` (matriks) + `PATCH /api/v1/auth/rbac/[roleKey]` (gate `master.mapping` read/update).
- [x] Client [`api/rbac.ts`](src/lib/api/rbac.ts) + [`RBACPane`](src/components/master/mapping/rbac/RBACPane.tsx) fetch DB (ganti `initRBACMap` mock) + tombol **Simpan/Reset** per role + dirty/loading/error. Konverter `mapFromGrants`/`grantsForRole` di rbacShared.
- **DoD terpenuhi:** ubah izin role dari Master → tulis `role_permissions` + invalidasi cache → langsung berefek runtime, tanpa migration. Smoke: GET matrix (Admin) 200/9 role · PATCH idempoten 200 · Registrasi→GET 403 · kode asing 422.

---
## Catatan
- Konten **dashboard** untuk Registrasi masih scaffold (CLAUDE.md) — pembangunan terpisah, di luar scope RBAC ini.
- ABAC unit-scope (`requireScope`) tetap MUST sebelum akun **klinis** unit-scoped live (BACKEND-AUTH §11) — terkait tapi beda slice dari visibilitas modul ini.
