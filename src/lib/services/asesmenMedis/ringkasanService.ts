// ringkasanService — Asesmen Medis · RINGKASAN STATUS. Menggabungkan flag eksistensi
// granular dari DAL menjadi status per sub-menu (derajat "selesai" = aturan bisnis):
//   alergi  = NKA ditegaskan ATAU ada item alergi aktif
//   edukasi = salah satu dari 3 pane (pasien/emergency/EOL) atau pertemuan keluarga
// Read-only; tak menulis. RBAC `clinical.igd` di Route; ABAC unit-scope menyusul.

import * as defaultDal from "@/lib/dal/asesmenMedis/ringkasanDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsesmenRingkasanDTO } from "@/lib/schemas/asesmenMedis/ringkasan";

type Dal = typeof defaultDal;

export function makeRingkasanService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Status terisi per sub-menu Asesmen Medis (1 panggilan, untuk progress SubNav). */
  async function get(kunjunganId: string, _actor: Actor): Promise<AsesmenRingkasanDTO> {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");

    const r = await dal.getRingkasan(kunjunganId);
    return {
      kunjunganId,
      anamnesis: r.anamnesis,
      riwayat: r.riwayat,
      alergi: r.alergiNka || r.alergiItem,
      skrining: r.gizi,
      edukasi: r.edukasiPasien || r.edukasiEmergency || r.edukasiEol || r.edukasiMeeting,
    };
  }

  return { get };
}

export const ringkasanService = makeRingkasanService();
