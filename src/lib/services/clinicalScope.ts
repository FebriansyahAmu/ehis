// ABAC unit-scope untuk domain klinis (FLOWS §6: scopeBy(actor) di Service, anti-IDOR).
// Membatasi akses rekam medis ke kunjungan yang unit-nya termasuk unit kerja user.
// Superuser/role global = bebas. Di luar scope → notFound (sembunyikan keberadaan, bukan 403).
//
// Dipakai domain klinis pengganti `kunjunganDal.findById` saat memuat kunjungan untuk
// keperluan rekam medis (triase/observasi/cppt/diagnosa/asesmen/…).

import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { canAccessUnit } from "@/lib/auth/careUnit";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { Tx } from "@/lib/db/prisma";

type KunjunganLite = { id: string; unit: string };

/** Lempar notFound bila kunjungan di luar unit kerja actor (anti-IDOR). */
export function assertUnitInScope(actor: Actor, kunjungan: KunjunganLite): void {
  if (!canAccessUnit(actor, kunjungan.unit)) {
    throw Errors.notFound("Kunjungan tidak ditemukan");
  }
}

/**
 * Muat kunjungan + tegakkan unit-scope. Pengganti `kunjunganDal.findById` di domain klinis.
 * Tak ada → notFound. Di luar unit kerja → notFound (tak bocorkan keberadaan).
 */
export async function loadKunjunganInScope(kunjunganId: string, actor: Actor, tx?: Tx) {
  const k = await kunjunganDal.findById(kunjunganId, tx);
  if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
  assertUnitInScope(actor, k);
  return k;
}
