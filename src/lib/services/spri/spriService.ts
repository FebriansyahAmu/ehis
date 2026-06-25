// spriService — SPRI (Surat Perintah Rawat Inap) sebagai artefak admisi BPJS dgn lifecycle sendiri.
// PENERBITAN awal terjadi atomik di kunjunganService.transition("complete") (jenis Rawat_Inap).
// Di sini: worklist admisi (registrasi) + REVISI No. Referensi (retry BPJS, boleh setelah kunjungan
// IGD terkunci — SPRI bukan clinical.*) + KONSUMSI (tautkan kunjungan Rawat Inap hasil admisi).
//
// RBAC di Route: registration.kunjungan (petugas loket/admisi). Tanpa permission baru.

import * as defaultDal from "@/lib/dal/spri/spriDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { issueSpriRef } from "@/lib/services/spri/spriBpjsMock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { SpriEntity } from "@/lib/dal/spri/spriDal";
import type { SpriDTO, SpriQuery, SpriStatus, ConsumeSpriInput } from "@/lib/schemas/disposisi/disposisi";

type Dal = typeof defaultDal;

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDTO(e: SpriEntity): SpriDTO {
  return {
    id: e.id,
    kunjunganId: e.kunjunganId,
    noKunjungan: e.kunjungan.noKunjungan,
    noRM: e.kunjungan.pasien.noRm,
    namaPasien: e.kunjungan.pasien.nama,
    noKartu: e.noKartu,
    dpjpNama: e.dpjpNama,
    smfSpesialistik: e.smfSpesialistik ?? null,
    poliKode: e.poliKode ?? null,
    poliNama: e.poliNama ?? null,
    tglRencanaRawat: fmtDate(e.tglRencanaRawat),
    jenisPerawatan: e.jenisPerawatan,
    indikasi: e.indikasi,
    keterangan: e.keterangan ?? null,
    noReferensi: e.noReferensi ?? null,
    status: e.status as SpriStatus,
    riKunjunganId: e.riKunjunganId ?? null,
    user: e.user,
    createdAt: e.createdAt.toISOString(),
    version: e.version,
  };
}

export function makeSpriService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Worklist admisi. Default = belum dikonsumsi (MenungguRef + Terbit). */
  async function listWorklist(query: SpriQuery, _actor: Actor): Promise<SpriDTO[]> {
    const rows = await dal.listWorklist({ status: query.status });
    return rows.map(toDTO);
  }

  /** Revisi & kirim ulang → retry penerbitan No. Referensi ke BPJS. Hanya saat MenungguRef.
   *  Tidak kena lock kunjungan (resource administratif sendiri). */
  async function revise(id: string, _actor: Actor): Promise<SpriDTO> {
    const row = await dal.findById(id);
    if (!row) throw Errors.notFound("SPRI tidak ditemukan");
    if (row.status !== "MenungguRef") {
      throw Errors.conflict("SPRI sudah terbit referensi / dikonsumsi — revisi tidak berlaku");
    }
    const noReferensi = await issueSpriRef(row.noKartu);
    if (!noReferensi) {
      // BPJS masih bermasalah → tetap MenungguRef (idempoten), kembalikan apa adanya.
      const fresh = await dal.findByIdWithKunjungan(id);
      return toDTO(fresh!);
    }
    const n = await dal.updateRevisi(id, row.version, { noReferensi, status: "Terbit" });
    if (n === 0) throw Errors.conflict("Status SPRI berubah — muat ulang");
    const fresh = await dal.findByIdWithKunjungan(id);
    return toDTO(fresh!);
  }

  /** Konsumsi → tautkan kunjungan Rawat Inap hasil admisi + status Dikonsumsi (keluar worklist). */
  async function consume(id: string, input: ConsumeSpriInput, _actor: Actor): Promise<SpriDTO> {
    const row = await dal.findById(id);
    if (!row) throw Errors.notFound("SPRI tidak ditemukan");
    if (row.status === "Dikonsumsi") throw Errors.conflict("SPRI sudah dikonsumsi (admisi sudah dibuat)");
    const ri = await kunjunganDal.findById(input.riKunjunganId);
    if (!ri) throw Errors.notFound("Kunjungan Rawat Inap tidak ditemukan");
    const n = await dal.consume(id, input.riKunjunganId);
    if (n === 0) throw Errors.conflict("Status SPRI berubah — muat ulang");
    const fresh = await dal.findByIdWithKunjungan(id);
    return toDTO(fresh!);
  }

  return { listWorklist, revise, consume };
}

export const spriService = makeSpriService();
