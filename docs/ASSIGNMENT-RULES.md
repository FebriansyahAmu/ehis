# ASSIGNMENT-RULES — Hybrid Authz (RBAC + SDM Assignment ABAC)

> **Kapan baca ini:** sebelum menambah/mengubah aksi tulis pada **unit penunjang** (Lab/Rad/Farmasi)
> atau aksi apa pun yang "hanya boleh oleh petugas yang **ditugaskan** ke ruangan/unit itu".
> Pelengkap [BACKEND-AUTH.md](BACKEND-AUTH.md) (RBAC/ABAC inti) & [API-RULES.md](API-RULES.md) (resep endpoint).

## 0. TL;DR

Otorisasi tulis = **dua lapis, saling melengkapi**:

| Lapis | Pertanyaan | Di mana | Mekanisme |
|---|---|---|---|
| **RBAC** | "Boleh nggak role ini *melakukan jenis aksi* ini?" | `route()` (guard) | `assertCan(actor, resource, action)` |
| **ABAC SDM Assignment** | "Orang ini *benar-benar ditugaskan* ke unit/ruangan ini?" | **Service** | cek `actor.pegawaiId ∈ roster` (`master.penugasanRuangan`) |

**Client gating ≠ enforcement.** Banner/disable/dropdown di UI hanya pemandu — server **wajib** memvalidasi.
Tanpa lapis Service, pemegang role yang **tak ter-assign** tetap bisa menembus lewat API langsung.

## 1. Bypass (WAJIB)

```ts
export function labAssignmentBypassed(actor: Actor): boolean {
  return actor.isSuperuser || actor.isGlobal;
}
```

- **`isSuperuser` (Admin)** → SELALU bypass (semua cek). Tak boleh ada cek SDM yang mengunci Admin.
- **`isGlobal`** (role tak terikat unit) → bypass juga: SDM Assignment = *unit-scoping*, konsisten dgn
  cara careUnit ABAC bypass `isGlobal` (lihat [actor.ts](../src/lib/auth/actor.ts) — "isGlobal = bypass unit-scope").
- **DEV actor** (`AUTH_ENFORCE=false`, tanpa sesi) = `isSuperuser+isGlobal` → otomatis bypass (tak mengganggu transisi).

> RBAC bypass tetap **hanya** `isSuperuser` (`assertCan`). `isGlobal` BUKAN bypass RBAC.

## 2. Dua bentuk cek

### a. ACTOR ter-assign (penerima / pelaksana)

Aksi yang dilakukan oleh & atas nama actor (terima order, entry hasil, akuisisi citra, dispensing):

```ts
await assertActorAssignedToLab(actor, order.labKode); // throw Errors.forbidden bila bukan SDM ter-assign
```

### b. ENTITAS TERPILIH ter-assign (mis. validator/DPJP dipilih dari dropdown)

Nama **jangan** dipercaya dari FE (bisa di-spoof). FE kirim **`<entity>PegawaiId`**, server **menurunkan nama
dari roster** setelah verifikasi:

```ts
// FE select: value = pegawaiId (BUKAN nama). Kirim { validatorPegawaiId }.
const validator = await resolveValidatorNama(actor, order.labKode,
  { pegawaiId: input.validatorPegawaiId, nama: input.validator }, () => resolveActorNama(actor));
// non-bypass: pegawaiId WAJIB & harus dokter ter-assign → nama dari roster; bypass: boleh fallback.
```

## 3. Roster — sumber kebenaran

- Roster = `master.penugasanRuangan` (Pegawai ⇄ Location) **AKTIF** (`pegawai.deletedAt=null && isActive`).
- Resolusi lokasi: order ber-**kode lokasi** (mis. `labKode`) → ruangan **spesifik**; kosong → **semua Location
  bertipe unit itu** (mis. `LocationType.Laboratorium`). Lihat [labAssignment.ts](../src/lib/services/lab/labAssignment.ts).
- DAL: [`penugasanRuanganDal.listPetugasByLocations({ locationIds })`](../src/lib/dal/penugasanRuanganDal.ts).
- Endpoint roster (FE) konsisten: `GET /<unit>/orders/:id/petugas` (gate `ancillary.<unit>.worklist:read`,
  `scopeKunjungan:false`) → `LabPetugasDTO[] = { pegawaiId, namaTampil, profesi }`.

## 4. Letak kode (layering)

| Lapis | Tanggung jawab |
|---|---|
| **Route** | RBAC `assertCan` (via `route({resource,action})`) — **bukan** SDM. |
| **Service** | Panggil `assertActorAssignedToLab` / `resolveValidatorNama` **sebelum** mutasi (di dalam guard transisi). |
| **Helper** `lib/services/<unit>/<unit>Assignment.ts` | `roster()`, `bypassed()`, `assertActor…()`, `resolve…Nama()` — reusable, satu sumber. |
| **DAL** | Query murni penugasan + lokasi. Tanpa aturan. |

Error = `Errors.forbidden("…")` dgn pesan **operasional** ("Anda belum ditugaskan ke unit … Hubungi admin"),
bukan 403 generik — supaya petugas tahu remedi-nya.

## 5. Sisi FE (gating UI — pelengkap, bukan pengganti)

- Hook `use<Unit>Roster(orderId)` → `{ petugas, doctors, isAssigned, loading }`.
- **Anti-kedip:** peringatan hanya muncul `!loading && !!session && !isSuperuser && !isGlobal && !isAssigned(pegawaiId)`.
- Pakai **komponen banner bersama** (mis. [AssignmentGuardBanner](../src/components/lab/AssignmentGuardBanner.tsx)) +
  disable tombol. **Jangan `window.alert`** — pakai komponen global/toast.
- Dropdown entitas-terpilih: `<option value={pegawaiId}>` (bukan nama). Superuser/global → pilihan opsional.

## 6. Checklist tiap aksi baru

- [ ] RBAC di `route()` sudah benar (`resource:action`).
- [ ] Cek SDM di **Service** (actor *atau* entitas-terpilih) **sebelum** mutasi.
- [ ] Bypass `isSuperuser || isGlobal` terpasang (Admin tak terkunci).
- [ ] Nama entitas-terpilih **diturunkan dari roster** (anti-spoof), bukan dari body FE.
- [ ] Pesan `forbidden` operasional.
- [ ] FE: banner/disable/dropdown — sadar bypass, sadar loading.

## 7. Status penerapan

| Unit | Aksi ter-enforce SDM | Catatan |
|---|---|---|
| **Lab** ✅ (2026-06-21) | `receive` · `saveHasil` (analis) · `validate` (validator dipilih) | [labAssignment.ts](../src/lib/services/lab/labAssignment.ts) |
| Radiologi | 📋 belum | pola sama (`radAssignment.ts`, `LocationType.Radiologi`) |
| Farmasi | 📋 belum | dispensing/telaah; `LocationType.Farmasi` |
