# EHIS Backend — Domain: **Auth** (Authentication · Session · RBAC/ABAC)

> Identitas, sesi, dan otorisasi seluruh sistem. **Dibangun di B0** (auth seam) sebelum domain lain — tapi
> enforcement RBAC penuh menyusul bertahap (di awal cukup identitas + audit jalan).
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** — terutama §6 (Authz 4 lapis). Bila konflik, FLOWS menang.
> **Terkait:** [BACKEND-ENCOUNTER.md](BACKEND-ENCOUNTER.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md) (B0/B1.9 RBAC) · memori `project_backend_stack`.
> Sumber RBAC existing (frontend mock): [rbacShared.ts](../src/components/master/mapping/rbac/rbacShared.ts) · [penggunaShared.ts](../src/components/master/pengguna/penggunaShared.ts).
>
> **Model auth:** **hybrid** — JWT access pendek + DB refresh rotating + (Redis revocation ⏳ ditunda).
> **Lapisan sesi:** **custom JWT (`jose`)** — bukan Auth.js v5 (keputusan ulang 2026-06-07 §10 #7).
> **Status:** ✅ **Core terimplementasi (2026-06-07)** — login/refresh/logout/me · JWT issue/verify · refresh rotation + reuse detection · lockout DB · RBAC seed (89 perm/176 grant) · proxy optimistic · FE wiring (SessionContext/Navbar). **Belum aktif** (`AUTH_ENFORCE=false`). Redis + ABAC + bootstrap akun = **MUST-HAVE tersisa** (lihat §11).

---

## 1. Scope domain

**Auth OWNS:**
- Identitas user (`User`), kredensial (argon2id), status akun (aktif/suspend/lock).
- Sesi: access JWT pendek + refresh token DB (rotating) + revocation Redis.
- **Enforcement** authz 4 lapis (FLOWS §6): AuthN · RBAC · ABAC/unit-scope · IDOR helper.
- Guard helpers yang dipakai semua domain: `requireAuth` · `requirePermission` · `requireScope`.
- `proxy.ts` (optimistic redirect) + Auth.js v5 wiring.

**Auth TIDAK owns** (delegasi):
- **Matriks RBAC** (Role × leaf → actions) = **master data**, dikelola di **Mapping Hub** (`/ehis-master/mapping/rbac`) → domain Master. Auth meng-*konsumsi* + *enforce* + cache.
- Data dokter/nakes → domain Patient/Master (`User.dokterId` link).
- Audit log → **BACKEND-AUDIT** (Auth hanya emit event login/logout/revoke).

> **Boundary penting:** *siapa boleh apa* (kebijakan) diatur Admin di Mapping Hub (data). *Memaksakan* kebijakan itu (enforcement) = Auth. Pisahkan policy vs enforcement.

---

## 2. Entity model

> Semua tabel domain ini di Postgres schema **`auth`** (`@@schema("auth")`) — lihat FLOWS §9 topologi multi-schema.

### 2.1 `User`
| Field | Catatan |
|---|---|
| `id` PK | UUID v7 (`@default(uuid(7)) @db.Uuid`) |
| `username` unique · `email` (citext) unique | |
| `passwordHash` | **argon2id** (bukan bcrypt; tunable) |
| roles → **`UserRole` (M:N)** | **multi-role** (keputusan terkunci). Permission efektif = **union** semua role per leaf/action (§2.2) |
| `dokterId` FK→Practitioner nullable | link untuk role klinis (Dokter/SpPK/SpRad) |
| `status` enum | `Active`\|`Suspended`\|`Locked` |
| `tokenVersion` int default 0 | **bump = revoke semua sesi** (dicek per-request via Redis) |
| `mfaEnabled` bool · `mfaSecret` (encrypted) nullable | TOTP — **DITUNDA pasca-MVP**; field disiapkan (forward-compat) |
| `failedLoginCount` int · `lockedUntil` datetime nullable | brute-force lockout |
| `lastLoginAt` · `createdAt`/`updatedAt`/`deletedAt` | soft-delete |

### 2.2 `Role` · `Permission` · `RolePermission` *(matriks = master data, di-seed dari mock)*
- **`Role`** — 9 baris: `Admin · Dokter · Perawat · Apoteker · Radiografer · SpPK · SpRad · Kasir · Registrasi`. (`key`, `name`, `description`, **`unitScoped: boolean`** — global vs unit-scoped, lihat §2.3).
- **`UserRole`** — join **M:N** `(userId, roleId)`. **Permission efektif user = UNION** `grantedActions` lintas semua role-nya per leaf (paling permisif menang). Cache `perm:user:{userId}` (invalidate saat role/RBAC user berubah).
- **`Permission`** — **atomik per (resource × action)** dari `PERMISSION_TREE` (28 leaf × aksi ≈ 100 baris). Field: `resource` (leaf key mis. `clinical.cppt`), `action` (CrudAction), `kode` unik (`clinical.cppt:update`), `nama`, `modul`. *(Relasional & ternormalisasi — bukan `actions[]` array; selaras referensi `usr_permission`.)*
- **`RolePermission`** — **join murni** `(roleId, permissionId)` = `RBACMap`. Matrix leaf→actions[] untuk UI = hasil **derive** dari join ini. Editable di Mapping Hub. Seed dari `ROLE_DEFAULT_GRANTS`.
- **`CrudAction`** enum = `read · create · update · delete · export` (5).

### 2.3 `UserUnitScope` *(ABAC — least privilege)*
- `(userId, unitId/unitKey)` — unit yang boleh diakses user (mis. Perawat hanya ICU). Sumber: `Pengguna.unitAssignment` (Mapping Hub).
- **Semantik kosong (terkunci, best practice least-privilege):**
  - **Role global** (`Role.unitScoped=false` — Admin/Registrasi/Kasir) → cek unit-scope **di-bypass**, akses semua unit.
  - **Role unit-scoped** (`unitScoped=true` — Perawat/Dokter) → **wajib ≥1 unit**; `UserUnitScope` kosong = **tolak** akses data klinis (fail-closed).
- **`UserUnitScope` (ABAC operasional) ≠ `master.Pegawai.unitKerja` (penempatan HR)** — dua lapisan beda, **jangan dijadikan satu pemilik ganda** (anti divergensi):
  - `Pegawai.unitKerja` = **fakta HR / org chart** ("tercatat di unit/departemen mana"). Konvensi **1 home unit**. **Tidak** dipakai untuk kontrol akses.
  - `UserUnitScope` = **cakupan akses operasional** ("boleh layani/akses data unit mana", N:N, time-bound bila perlu). **Sumber kebenaran** untuk ABAC; **editor tunggal = Mapping Hub SDM Assignment**.
  - **Seed-on-provision (pola terkunci):** unit yang dipilih saat buat akun ditulis **SEKALI** ke `UserUnitScope` dalam transaksi provisioning (idealnya **wizard Step 3 "Unit Akses"**) → cegah role unit-scoped lahir dengan scope kosong. Setelah itu, perubahan **hanya** di Mapping Hub; UI entitas read-only + `MappingSourceBadge`.
  - **Status interim (pra-auth-runtime):** field Unit Kerja di wizard sementara **multi-select** (lihat [TECH_DEBT](../TECH_DEBT.md)) berperan sebagai **seed** saja. Saat auth runtime dibangun: pindah pemilih multi ke Step 3 (tulis `UserUnitScope`), `unitKerja` balik **single home**, dan migrasi kosakata unit SDM Assignment (`UNIT_LIST`/`POLI_LIST` legacy) → **id `master.ruangan`** (target FK `unitId`).

### 2.4 `RefreshToken` (sesi)
| Field | Catatan |
|---|---|
| `id` PK · `userId` FK | |
| `tokenHash` | refresh token di-hash (jangan simpan plaintext) |
| `familyId` | grup rotasi — **reuse detection** |
| `expiresAt` | **3 jam** (idle timeout; sliding — di-perpanjang saat rotasi) |
| `revokedAt` nullable · `replacedById` nullable | rotasi/cabut |
| `ip` · `userAgent` · `createdAt` · `lastUsedAt` | audit sesi (UU PDP) |

### 2.5 Redis (bukan tabel)
- `revoked:jti:{jti}` → blocklist access token (TTL = sisa umur token).
- `tokenVersion:{userId}` → cache versi (cek cepat per-request; bump saat revoke).
- `rl:login:{ip|username}` → counter rate-limit login.
- `perm:{roleId}` → cache RBACMap role (invalidate saat Mapping Hub update).

---

## 3. Lifecycle sesi (state machine)

```
Login (kredensial) ─▶ Active ─(access exp 30m)─▶ Refresh(rotate) ─▶ Active …  [refresh idle 3h]
       │                     │
       │                     ├─(logout / idle timeout)─▶ Revoked (sesi ini)
       └─(gagal Nx)─▶ Locked └─(revoke-all: bump tokenVersion)─▶ Revoked (semua sesi user)
```

### Alur inti

**Login** — verifikasi `username`+password (argon2id) →
- terbitkan **access JWT** (**30m**; claims: `sub`, `roles[]`, `tokenVersion`, `jti`, `exp`, opsional `unitScope[]`),
- terbitkan **refresh token** (random, simpan **hash** di `RefreshToken`, set cookie httpOnly),
- catat `lastLoginAt` + emit audit `LOGIN`. Rate-limit + reset `failedLoginCount`.

**Per request (jalur panas)** — verify signature JWT (in-memory) → **1 cek Redis**: `jti` tak di-blocklist **dan** `tokenVersion` cocok → lolos. (≈ secepat JWT murni, tetap bisa dicabut.)

**Refresh** — access expired → kirim refresh → cek hash di DB + belum revoked + belum expired → **rotasi**: terbitkan refresh baru, `revokedAt` yang lama, link `replacedById`. **Reuse detection:** bila refresh sudah-revoked dipakai lagi → indikasi pencurian → revoke seluruh `familyId` + bump `tokenVersion`.

**Revoke instan** — logout 1 device: blocklist `jti` + revoke refresh. Revoke semua (pecat/ganti password/breach): **bump `tokenVersion`** (DB+Redis) → semua access invalid + hapus refresh user.

**Lockout** — `failedLoginCount ≥ N` → set `lockedUntil` (backoff). Rate-limit Redis per IP+username.

---

## 4. Layer breakdown

### 4.1 `proxy.ts` (Next.js 16 — **Node.js runtime**, optimistic saja) ✅ DIBUAT [src/proxy.ts](../src/proxy.ts)
- ⚠️ **Koreksi**: proxy v16 **default Node.js runtime** (bukan edge; `runtime` config dilarang di proxy). Konvensi `proxy` = rename dari `middleware` sejak Next v16.0.0.
- Cek **cookie sesi ADA** (`ehis_rt`/`ehis_at`) → bila tidak → redirect `/login` (+ `?next=`). Di-gate `AUTH_ENFORCE` (false = no-op).
- **❌ TIDAK** verify signature/Redis/RBAC di sini (FLOWS §6 — bisa di-bypass; Next menyarankan proxy "last resort" & selalu verifikasi ulang di server). `config.matcher` untuk page routes.
- ⏳ `correlationId` belum (TODO).

### 4.2 Guards — `lib/auth/guards.ts` (dipakai semua Route)
- `requireAuth(req) → Actor` — verify JWT + Redis revoke check; gagal → `UNAUTHENTICATED` (401).
- `requirePermission(actor, leafKey, action)` — cek **union** `RolePermission` semua role actor (cache `perm:user:{id}`); gagal → `FORBIDDEN` (403).
- `requireScope(actor, unit)` — role global bypass; role unit-scoped cek `UserUnitScope` (kosong → tolak); di luar → `FORBIDDEN`/`NOT_FOUND`.
- `Actor = { userId, roles[], unitScope[], dokterId? }` — diteruskan ke Service untuk authz row-level (IDOR).

### 4.3 Service — `lib/services/authService.ts`
- `login(credentials, ctx)` · `refresh(token, ctx)` · `logout(jti)` · `revokeAllSessions(userId)` · `verifyMfa()` · `changePassword()`.
- Transaksi untuk rotasi refresh. Emit audit. Inject `clock`/`genId` (FLOWS §14).
- `getPermissions(role)` — baca `RolePermission` (cache-aside Redis `perm:{roleId}`).

### 4.4 DAL — `lib/dal/authDal.ts`
- `findUserByUsername` · `findRefreshByHash` · `createRefresh`/`rotateRefresh`/`revokeRefreshFamily` · `bumpTokenVersion` · `incFailedLogin`/`resetFailedLogin`.

### 4.5 Schema/DTO — `lib/schemas/auth.ts` (Zod)
- `LoginInput` (username, password, mfaCode?), `RefreshInput`. Output: **tak pernah** kirim hash/secret.

### 4.6 API — `app/api/v1/auth/*`
| Method | Path | Service |
|---|---|---|
| POST | `/api/v1/auth/login` | `login` |
| POST | `/api/v1/auth/refresh` | `refresh` |
| POST | `/api/v1/auth/logout` | `logout` |
| POST | `/api/v1/auth/mfa/verify` | `verifyMfa` |
| GET | `/api/v1/auth/me` | session + permissions (untuk UI gating) |

### 4.7 ~~Auth.js v5 wiring~~ → **DIGANTI: custom JWT (`jose`)** (Keputusan 2026-06-07 §10 #7)
> Auth.js v5 **tidak jadi dipakai**. Alasan: mekanisme berat (refresh rotation, reuse detection, revocation, lockout) memang sudah "lapisan kita"; dengan Redis ditunda, Auth.js tinggal shell cookie/credentials yang nilainya tipis. Custom `jose` lebih pas dengan `route()`+`Actor`+`RefreshToken` yang sudah ada (lihat §11). SSO/OIDC nanti tetap bisa ditambah di belakang seam `getActor` tanpa bongkar route/service.
- **Implementasi nyata:** [jwt.ts](../src/lib/auth/jwt.ts) (issue/verify HS256, clock injectable) · [tokens.ts](../src/lib/auth/tokens.ts) (refresh opaque + SHA-256) · [cookies.ts](../src/lib/auth/cookies.ts) (httpOnly `ehis_at`/`ehis_rt`) · [authService.ts](../src/lib/services/authService.ts) · [authDal.ts](../src/lib/dal/authDal.ts) · [rbacCache.ts](../src/lib/auth/rbacCache.ts) (in-process, pengganti cache Redis `perm:`).
- **Seam:** `getActor`/`getServerActor` ([actor.ts](../src/lib/auth/actor.ts)) verify JWT → `Actor`; permission di-expand dari `roles` via rbacCache. Signature tetap → route/service tak berubah.

---

## 5. Event (audit)
Emit ke **BACKEND-AUDIT**: `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `REFRESH`, `REVOKE_ALL`, `PASSWORD_CHANGE`, `MFA_ENABLED`, `ACCOUNT_LOCKED`. Simpan ip/ua/actor. **PII-scrubbing** — jangan log password/token.

---

## 6. Indexing
- `User.username` unique, `User.email` unique, `User.roleId`.
- `RefreshToken.tokenHash` unique, `(userId, revokedAt)`, `familyId`.
- `RolePermission (roleId, permissionKey)` unique composite.
- `UserUnitScope (userId, unitId)` unique composite.

---

## 7. Failure modes

| Skenario | Penanganan |
|---|---|
| Brute-force login | rate-limit Redis + `failedLoginCount`→`lockedUntil` (backoff) |
| Refresh token dicuri & dipakai ulang | reuse detection (familyId revoked) → cabut semua sesi user |
| Pecat staf / ganti password | `revokeAllSessions` → bump `tokenVersion` (instan) |
| RBAC matrix berubah di Mapping Hub | invalidate cache `perm:{roleId}` |
| **Redis down** | **graceful degradation** (terkunci): signature JWT tetap divalidasi (stateless); revoke-check di-skip → fall back JWT-only + **alert keras** + (opsional) cek `tokenVersion` ke DB untuk aksi sensitif. Risiko dibatasi TTL 30m. Revoke pada **refresh** tetap ketat (hit DB). **Bukan** fail-closed global (life-safety). |
| Clock skew JWT | toleransi kecil; `clock` injectable |

---

## 8. Migrasi mock → DB

- **Tak ada auth di frontend saat ini** — semua route terbuka. Frontend marker `// TODO(RBAC-B0)` (mis. di Antrean Pengaturan Hak Akses) menunggu domain ini.
- **Seed dari mock**: `Role` (9) + `Permission` (28 leaf dari `PERMISSION_TREE`) + `RolePermission` (dari `ROLE_DEFAULT_GRANTS`) + `User` contoh per role. `UserUnitScope` dari `Pengguna.unitAssignment`.
- **Frontend swap**: tambah login page + `/me` untuk UI permission-gating (sembunyikan menu/aksi sesuai `RolePermission`). Mapping Hub RBAC pane → `PUT /api/master/mapping/rbac` (domain Master) yang menulis `RolePermission` + invalidate cache Auth.
- Enforcement bertahap: B0 = identitas + audit jalan (gate longgar); kemudian aktifkan `requirePermission`/`requireScope` per modul.

---

## 9. Task checklist  *(status 2026-06-07)*

Legenda: `[x]` selesai · `[~]` sebagian/diadaptasi · `[ ]` belum · ⏳ sengaja ditunda.

### AUTH0 — Schema & seed
- [x] Prisma model `User`/`Role`(+`unitScoped`)/`UserRole`(M:N)/`Permission`/`RolePermission`/`UserUnitScope`/`RefreshToken` + enum `CrudAction`/`UserStatus`.
- [x] Index (§6) + unique constraints.
- [~] Seed: Role (9) ✅ · **Permission (89) + RolePermission (176)** ✅ dari `rbacShared` ([migration seed_rbac](../prisma/migrations/20260607120000_seed_rbac/migration.sql)) · `unitScoped` Kasir/Registrasi dikoreksi → global ✅. **User contoh per role ❌ (bootstrap belum)** · password **scrypt** (argon2id ⏳).

### AUTH1 — Core hybrid
- [~] `lib/auth`: hash **scrypt** ✅ (argon2id ⏳ swap) · JWT issue/verify (`jose`, inject `clock`) ✅ · refresh rotation + **reuse detection** ✅ · **Redis revoke (`jti`/`tokenVersion`) ⏳ DITUNDA** (revoke ditegakkan saat refresh/DB; window ≤30m, §5).
- [~] `authService` login/refresh/logout/revokeAll/changePassword ✅ · **lockout DB** ✅ · **rate-limit Redis ⏳ ditunda**.
- [x] `authDal`.

### AUTH2 — ~~Auth.js v5~~ → custom `jose` + proxy
- [~] **Auth.js v5 DIGANTI custom JWT (`jose`)** (§4.7, §10 #7) — Credentials/JWT-strategy tak dipakai.
- [~] `proxy.ts` optimistic redirect ✅ (gated `AUTH_ENFORCE`). `correlationId` ⏳.

### AUTH3 — Guards & enforcement
- [~] `requireAuth`+`requirePermission` = **`route()` + `getActor` + `assertCan`** ✅ (bentuk beda dari spec, fungsi setara). **`requireScope`/ABAC unit-scope ❌ belum dibangun.**
- [~] Cache RBAC = **rbacCache in-process** ✅ + `invalidateRbacCache()` (Redis `perm:{roleId}` ⏳).
- [~] Integrasi domain: `getActor` terpasang di **SEMUA** route via `route()` ✅ — tapi enforcement **gated off** (`AUTH_ENFORCE=false`).

### AUTH4 — API & UI
- [x] Route `/api/v1/auth/*` login/refresh/logout/me ✅ tipis + envelope (mfa ⏳).
- [~] Login page ✅ + `SessionContext`/`/me` ✅ + Navbar user+logout ✅ + **silent refresh client (401→refresh→retry)** ✅. **Menu/aksi gating via `can()` ❌ belum diterapkan.**

### AUTH5 — Polish *(MFA DITUNDA pasca-MVP)*
- [~] Idle timeout refresh 3h ✅ (struktur). **Security headers ❌** · **SSR auto-refresh ❌** (§11 MUST-HAVE).
- [~] MFA TOTP — **ditunda**; field `mfaEnabled`/`mfaSecret` di schema (forward-compat).

### AUTH6 — Tests
- [x] Unit: login sukses/gagal/**lockout** · refresh **rotate** · **reuse detection** · revoke/changePassword · JWT round-trip/expiry/tamper. ([authService.test](../src/lib/services/authService.test.ts) · [jwt.test](../src/lib/auth/jwt.test.ts), 16 tes).
- [ ] `requireScope` allow/deny (belum ada) · Integration DAL (refresh family, RLS).

---

## 10. Keputusan (terkunci 2026-06-01)

1. ✅ **Multi-role** — user punya banyak role (`UserRole` M:N). Permission efektif = **union** lintas role (paling permisif menang).
2. ✅ **TTL** — access **30 menit** · refresh **3 jam** (idle timeout, sliding saat rotasi).
3. ✅ **MFA DITUNDA** pasca-MVP — field `mfaEnabled`/`mfaSecret` tetap di schema (forward-compat), enforcement nanti.
4. ✅ **Unit-scope least-privilege** — `Role.unitScoped` flag: role global (Admin/Registrasi/Kasir) bypass; role scoped (Perawat/Dokter) **wajib ≥1 unit**, kosong = tolak data klinis.
5. ✅ **Redis down = graceful degradation** — validasi JWT-only + alert + (opsional) `tokenVersion` ke DB untuk aksi sensitif; **bukan** fail-closed global (life-safety). Risiko dibatasi TTL 30m.
6. ⏳ **SSO/LDAP** — **terbuka** (Credentials lokal dulu; SSO menyusul bila RS punya IdP).
7. ✅ **Lapisan sesi = custom JWT (`jose`), BUKAN Auth.js v5** (keputusan ulang **2026-06-07**). Manfaat Auth.js tipis di arsitektur ini (mekanisme berat sudah custom + Redis ditunda); SSO nanti ditambah di belakang seam `getActor`. Mengganti §4.7 awal.
8. ✅ **Gate bertahap `AUTH_ENFORCE`** (env, **2026-06-07**) — satu sakelar menyatukan enforcement server (`getActor` → 401) + proxy redirect. `false` (default) = transisi/dev terbuka (fallback DEV actor); `true` = proteksi nyata. Cegah lockout pra-bootstrap. **Interim — dihapus saat auth wajib di prod.**
9. ⏳ **Redis ditunda** (**2026-06-07**, belum di-setup) — revoke instan (`jti` blocklist), rate-limit, cache `perm:` ditunda; degradasi terkendali (§5): revoke via refresh/DB, window access ≤30m.

---

## 11. Analisis Gap & MUST-HAVE *(2026-06-07)*

**Posisi sekarang:** rangka + data + core runtime auth **sudah jalan**, tapi **belum ditegakkan** (`AUTH_ENFORCE=false`). Login/refresh/logout/me, rotasi+reuse-detection, lockout, RBAC seed, proxy, dan FE (SessionContext/Navbar/silent-refresh) sudah ada. Yang menghalangi "auth nyata di prod" terbagi MUST-HAVE vs SHOULD/LATER.

### 🔴 MUST-HAVE — blocker sebelum `AUTH_ENFORCE=true`
1. **Bootstrap akun (≥1 Admin).** Tanpa akun, enforce = **lockout total** (tak ada yang bisa login). Butuh Pegawai → User → role Admin (idempoten). **Prasyarat #1.**
2. **Selaraskan resource-key route ↔ permission ter-seed.** Tiga key route **tak ada** di `PERMISSION_TREE` → role non-Admin akan **ditolak salah** saat enforce:
   - `registration.patient` (tree pakai `registration.pasien`) — **mismatch nama**.
   - `master.pegawai` — **tak ada** di tree.
   - `master.penugasan-ruangan` — **tak ada** di tree.
   → Putuskan satu kosakata: rename route ATAU tambah leaf ke `PERMISSION_TREE` + re-seed. (Admin lolos karena `isGlobal`, jadi bug ini "tersembunyi" sampai role lain dipakai.)
3. **Penanganan access-expired di SSR.** `getServerActor` belum punya auto-refresh; saat enforce, navigasi SSR pasca-30m (refresh masih valid) → 401/redirect walau sesi hidup. Opsi: proxy/route melakukan rotasi, atau `getServerActor` mencoba refresh. **Wajib** sebelum enforce agar UX tak putus tiap 30m.
4. **`AUTH_SECRET` produksi** yang kuat (bukan default dev) + rencana rotasi. (Saat ini di-generate ke `.env` dev.)
5. **ABAC `requireScope` minimal** sebelum modul **klinis** live — role unit-scoped (Perawat/Dokter) tanpa `UserUnitScope` harus fail-closed terhadap data klinis. Saat ini `assertCan` hanya RBAC (belum cek unit). Tidak menghalangi modul master/registrasi, **tapi wajib untuk klinis**.

### 🟡 SHOULD / LATER — bukan blocker awal
- **Redis** (§5): `jti` blocklist (revoke instan), rate-limit login, cache `perm:{roleId}`. Sekarang in-process + degradasi DB.
- **argon2id** swap (format hash self-describing → migrasi mulus).
- **Menu/aksi gating** via `can()` di Sidebar/komponen (kosmetik; server tetap penjaga).
- **Security headers** + `correlationId` di proxy + **audit events** (LOGIN/LOGOUT/REVOKE → BACKEND-AUDIT).
- **MFA TOTP** (field siap).
- **`changePassword` flow FE** + paksa saat `mustChangePassword=true`.

### Urutan aktivasi aman
`bootstrap admin` → `selaraskan resource-key` → `test login E2E` → `SSR refresh` → **set `AUTH_ENFORCE=true`** → (klinis) tambah `requireScope` → (hardening) Redis + argon2id + audit.
