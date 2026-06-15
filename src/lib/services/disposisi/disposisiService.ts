// disposisiService — tab Pasien Pulang (outcome episode). Hanya READ di sini (getLatest);
// PENULISAN disposisi terjadi atomik via kunjunganService.transition("complete") bersama
// kunci lifecycle. RBAC di Route: clinical.keperawatan:read. ABAC careUnit di route() choke-point.

import * as defaultDal from "@/lib/dal/disposisi/disposisiDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { DisposisiEntity } from "@/lib/dal/disposisi/disposisiDal";
import { type DisposisiDTO } from "@/lib/schemas/disposisi/disposisi";

type Dal = typeof defaultDal;

function nullish(v: string | null): string | undefined {
  return v ?? undefined;
}

function toDTO(e: DisposisiEntity): DisposisiDTO {
  return {
    id: e.id,
    jenis: e.jenis as DisposisiDTO["jenis"],
    waktuKeluar: e.waktuKeluar.toISOString(),
    dokter: e.dokter,
    kondisiUmum: e.kondisiUmum,
    diagnosaKeluar: e.diagnosaKeluar,
    instruksi: e.instruksi,
    rujukTujuan: nullish(e.rujukTujuan),
    rujukAlasan: nullish(e.rujukAlasan),
    meninggalWaktu: nullish(e.meninggalWaktu),
    meninggalSebab: nullish(e.meninggalSebab),
    apsAlasan: nullish(e.apsAlasan),
    rawatInapRuangan: nullish(e.rawatInapRuangan),
    rawatInapKelas: nullish(e.rawatInapKelas),
    catatan: nullish(e.catatan),
    pemeriksa: e.pemeriksa,
    createdAt: e.createdAt.toISOString(),
  };
}

export function makeDisposisiService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  // GET — disposisi terbaru (berlaku) per kunjungan; null bila belum diselesaikan.
  async function getLatest(kunjunganId: string, _actor: Actor): Promise<DisposisiDTO | null> {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    const row = await dal.findLatest(kunjunganId);
    return row ? toDTO(row) : null;
  }

  return { getLatest };
}

export const disposisiService = makeDisposisiService();
