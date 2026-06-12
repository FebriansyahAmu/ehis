// informedConsentService — tab Informed Consent (persetujuan tindakan per kunjungan, PMK 290/2008).
// Per-item tambah/hapus(soft); IMMUTABLE (tanpa update). Petugas = nama actor (user login).
// RBAC di Route: clinical.consent (read/create/delete). ABAC careUnit di route() choke-point (clinical.*).
// Selaras tindakanMedisService. DTO TANPA signatureData (hasSignature = derived dari signatureMethod).

import * as defaultDal from "@/lib/dal/informedConsent/informedConsentDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  InformedConsentInput, InformedConsentDTO, InformedConsentDetailDTO,
} from "@/lib/schemas/informedConsent/informedConsent";

type Dal = typeof defaultDal;
// Baris daftar (signatureData di-omit) — cukup untuk DTO; findById (full) tetap assignable.
type ConsentRow = Awaited<ReturnType<typeof defaultDal.list>>[number];
type ConsentFull = NonNullable<Awaited<ReturnType<typeof defaultDal.findById>>>;

function toDTO(c: ConsentRow): InformedConsentDTO {
  return {
    id: c.id,
    noFormulir: c.noFormulir,
    tindakanId: c.tindakanId ?? null,
    tindakanNama: c.tindakanNama,
    tindakanKategori: c.tindakanKategori ?? null,
    tujuan: c.tujuan ?? null,
    manfaat: c.manfaat ?? null,
    risiko: c.risiko,
    risikoLain: c.risikoLain ?? null,
    alternatif: c.alternatif ?? null,
    konsekuensiTolak: c.konsekuensiTolak ?? null,
    pertanyaanPasien: c.pertanyaanPasien ?? null,
    keputusan: c.keputusan === "menolak" ? "menolak" : "setuju",
    alasanTolak: c.alasanTolak ?? null,
    penandaHubungan: c.penandaHubungan,
    penandaNama: c.penandaNama,
    saksi1: c.saksi1 ?? null,
    saksi2: c.saksi2 ?? null,
    namaDokter: c.namaDokter,
    signatureMethod: c.signatureMethod ?? null,
    hasSignature: c.signatureMethod != null,
    signedAt: c.signedAt?.toISOString() ?? null,
    waktuPersetujuan: c.waktuPersetujuan.toISOString(),
    petugas: c.petugas,
    createdAt: c.createdAt.toISOString(),
  };
}

// Detail (full) = list DTO + TTD image. Untuk cetak/preview satu formulir.
function toDetailDTO(c: ConsentFull): InformedConsentDetailDTO {
  return { ...toDTO(c), signatureData: c.signatureData ?? null };
}

export function makeInformedConsentService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<InformedConsentDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  async function getDetail(
    kunjunganId: string,
    itemId: string,
    _actor: Actor,
  ): Promise<InformedConsentDetailDTO> {
    await assertKunjungan(kunjunganId);
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Persetujuan tidak ditemukan");
    }
    return toDetailDTO(item);
  }

  async function add(
    kunjunganId: string,
    input: InformedConsentInput,
    actor: Actor,
  ): Promise<InformedConsentDTO> {
    await assertKunjungan(kunjunganId);
    const petugas = await resolveActorNama(actor);
    const row = await dal.create({
      kunjunganId,
      noFormulir: input.noFormulir,
      tindakanId: input.tindakanId ?? null,
      tindakanNama: input.tindakanNama,
      tindakanKategori: input.tindakanKategori ?? null,
      tujuan: input.tujuan ?? null,
      manfaat: input.manfaat ?? null,
      risiko: input.risiko,
      risikoLain: input.risikoLain ?? null,
      alternatif: input.alternatif ?? null,
      konsekuensiTolak: input.konsekuensiTolak ?? null,
      pertanyaanPasien: input.pertanyaanPasien ?? null,
      keputusan: input.keputusan,
      alasanTolak: input.alasanTolak ?? null,
      penandaHubungan: input.penandaHubungan,
      penandaNama: input.penandaNama,
      saksi1: input.saksi1 ?? null,
      saksi2: input.saksi2 ?? null,
      namaDokter: input.namaDokter,
      signatureMethod: input.signatureMethod ?? null,
      signatureData: input.signatureData ?? null,
      signedAt: input.signedAt ?? null,
      waktuPersetujuan: input.waktuPersetujuan,
      petugas,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Persetujuan tidak ditemukan");
    }
    await dal.softDelete(itemId);
  }

  return { list, getDetail, add, remove };
}

export const informedConsentService = makeInformedConsentService();
