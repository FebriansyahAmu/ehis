// asuhanKeperawatanService — tab Keperawatan (asuhan keperawatan SDKI/SLKI/SIKI per kunjungan).
// CRUD: add/edit/verify(co-sign)/evaluasi shift/hapus(soft). Perawat = input override ATAU nama actor.
// RBAC di Route: clinical.keperawatan (read/create/update/delete). ABAC careUnit di route() choke-point
// (clinical.* + params.id). Blok pengkajian/intervensi/evaluasi = JSONB. Selaras tindakanMedisService.

import * as defaultDal from "@/lib/dal/keperawatan/asuhanKeperawatanDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { AsuhanEntity, UpdateAsuhanData } from "@/lib/dal/keperawatan/asuhanKeperawatanDal";
import {
  type AsuhanKeperawatanInput, type AsuhanKeperawatanUpdate,
  type AsuhanKeperawatanDTO, type EvaluasiShiftDTO, type StatusLuaranDTO,
} from "@/lib/schemas/keperawatan/asuhanKeperawatan";

// Normalisasi input → bentuk simpan (buang baris kosong; default string).
function cleanList(a?: string[]): string[] { return (a ?? []).map((x) => x.trim()).filter(Boolean); }
function cleanData(d?: { subjektif?: string; objektif?: string }) {
  return { subjektif: d?.subjektif ?? "", objektif: d?.objektif ?? "" };
}
function cleanIntervensi(iv?: { observasi?: string[]; terapeutik?: string[]; edukasi?: string[]; kolaborasi?: string[] }) {
  return {
    observasi: cleanList(iv?.observasi), terapeutik: cleanList(iv?.terapeutik),
    edukasi: cleanList(iv?.edukasi), kolaborasi: cleanList(iv?.kolaborasi),
  };
}
// Evaluasi shift → objek string-penuh (tanpa undefined) agar valid InputJsonValue.
type EvalInput = {
  id?: string; tanggal?: string; jam?: string; shift?: "Pagi" | "Siang" | "Malam";
  subjektif?: string; objektif?: string; statusLuaran: string; perawat?: string;
};
function cleanEvaluasi(arr?: EvalInput[]) {
  return (arr ?? []).map((e, i) => ({
    id: e.id || `eval-${Date.now()}-${i}`,
    tanggal: e.tanggal ?? "",
    jam: e.jam ?? "",
    shift: e.shift ?? "Pagi",
    subjektif: e.subjektif ?? "",
    objektif: e.objektif ?? "",
    statusLuaran: e.statusLuaran,
    perawat: e.perawat ?? "",
  }));
}

type Dal = typeof defaultDal;

// ── JSONB → tipe DTO (defensif: kolom Json bisa apa saja) ──────────────────────
function s(v: unknown): string { return typeof v === "string" ? v : ""; }
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function toData(v: unknown): { subjektif: string; objektif: string } {
  const o = (v ?? {}) as Record<string, unknown>;
  return { subjektif: s(o.subjektif), objektif: s(o.objektif) };
}
function toIntervensi(v: unknown) {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    observasi: strArr(o.observasi), terapeutik: strArr(o.terapeutik),
    edukasi: strArr(o.edukasi), kolaborasi: strArr(o.kolaborasi),
  };
}
function toEvaluasi(v: unknown): EvaluasiShiftDTO[] {
  if (!Array.isArray(v)) return [];
  return v.map((e, i) => {
    const o = (e ?? {}) as Record<string, unknown>;
    const shift = o.shift === "Pagi" || o.shift === "Siang" || o.shift === "Malam" ? o.shift : "Pagi";
    return {
      id: s(o.id) || `eval-${i}`,
      tanggal: s(o.tanggal), jam: s(o.jam), shift,
      subjektif: s(o.subjektif), objektif: s(o.objektif),
      statusLuaran: (s(o.statusLuaran) || "Dipantau") as StatusLuaranDTO,
      perawat: s(o.perawat),
    };
  });
}

function toDTO(e: AsuhanEntity): AsuhanKeperawatanDTO {
  return {
    id: e.id,
    kodeSdki: e.kodeSdki,
    diagnosa: e.diagnosa,
    penyebab: e.penyebab,
    faktorResiko: e.faktorResiko,
    dataMayor: toData(e.dataMayor),
    dataMinor: toData(e.dataMinor),
    tujuanDurasi: e.tujuanDurasi,
    tujuanUnit: e.tujuanUnit === "Jam" ? "Jam" : "Hari",
    selama: e.selama,
    kriteriaHasil: e.kriteriaHasil,
    statusLuaran: e.statusLuaran as StatusLuaranDTO,
    intervensi: toIntervensi(e.intervensi),
    evaluasi: toEvaluasi(e.evaluasi),
    tanggalInput: e.tanggalInput.toISOString(),
    perawat: e.perawat,
    verified: e.verified,
    verifiedBy: e.verifiedBy ?? "",
    verifiedAt: e.verifiedAt ? e.verifiedAt.toISOString() : "",
    aktif: e.aktif,
  };
}

function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export function makeAsuhanKeperawatanService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  async function assertMilik(kunjunganId: string, itemId: string): Promise<AsuhanEntity> {
    const item = await dal.findById(itemId);
    if (!item || item.kunjunganId !== kunjunganId || item.deletedAt) {
      throw Errors.notFound("Asuhan keperawatan tidak ditemukan");
    }
    return item;
  }

  async function list(kunjunganId: string, _actor: Actor): Promise<AsuhanKeperawatanDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  async function add(
    kunjunganId: string,
    input: AsuhanKeperawatanInput,
    actor: Actor,
  ): Promise<AsuhanKeperawatanDTO> {
    await assertKunjungan(kunjunganId);
    const perawat = input.perawat?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      kodeSdki: input.kodeSdki ?? "",
      diagnosa: input.diagnosa,
      penyebab: input.penyebab ?? "",
      faktorResiko: input.faktorResiko ?? "",
      dataMayor: cleanData(input.dataMayor),
      dataMinor: cleanData(input.dataMinor),
      tujuanDurasi: input.tujuanDurasi ?? "",
      tujuanUnit: input.tujuanUnit ?? "Hari",
      selama: input.selama ?? "",
      kriteriaHasil: cleanList(input.kriteriaHasil),
      statusLuaran: input.statusLuaran ?? "Dipantau",
      intervensi: cleanIntervensi(input.intervensi),
      evaluasi: cleanEvaluasi(input.evaluasi),
      tanggalInput: input.tanggalInput ? new Date(input.tanggalInput) : new Date(),
      perawat,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  async function update(
    kunjunganId: string,
    itemId: string,
    input: AsuhanKeperawatanUpdate,
    _actor: Actor,
  ): Promise<AsuhanKeperawatanDTO> {
    await assertKunjungan(kunjunganId);
    const existing = await assertMilik(kunjunganId, itemId);

    const patch: UpdateAsuhanData = {};
    setDefined(patch, "kodeSdki", input.kodeSdki);
    setDefined(patch, "diagnosa", input.diagnosa);
    setDefined(patch, "penyebab", input.penyebab);
    setDefined(patch, "faktorResiko", input.faktorResiko);
    if (input.dataMayor !== undefined) patch.dataMayor = cleanData(input.dataMayor);
    if (input.dataMinor !== undefined) patch.dataMinor = cleanData(input.dataMinor);
    setDefined(patch, "tujuanDurasi", input.tujuanDurasi);
    setDefined(patch, "tujuanUnit", input.tujuanUnit);
    setDefined(patch, "selama", input.selama);
    if (input.kriteriaHasil !== undefined) patch.kriteriaHasil = cleanList(input.kriteriaHasil);
    setDefined(patch, "statusLuaran", input.statusLuaran);
    if (input.intervensi !== undefined) patch.intervensi = cleanIntervensi(input.intervensi);
    if (input.evaluasi !== undefined) patch.evaluasi = cleanEvaluasi(input.evaluasi);
    if (input.tanggalInput !== undefined) patch.tanggalInput = new Date(input.tanggalInput);
    setDefined(patch, "perawat", input.perawat);
    setDefined(patch, "aktif", input.aktif);

    // Verifikasi co-sign: set verifiedAt saat verified→true; bersihkan saat di-batalkan.
    if (input.verified !== undefined) {
      patch.verified = input.verified;
      if (input.verified) {
        patch.verifiedBy = input.verifiedBy?.trim() || existing.verifiedBy || "";
        patch.verifiedAt = existing.verified && existing.verifiedAt ? existing.verifiedAt : new Date();
      } else {
        patch.verifiedBy = null;
        patch.verifiedAt = null;
      }
    } else if (input.verifiedBy !== undefined) {
      patch.verifiedBy = input.verifiedBy.trim();
    }

    if (Object.keys(patch).length > 0) {
      const count = await dal.update(itemId, patch);
      if (count === 0) throw Errors.notFound("Asuhan keperawatan tidak ditemukan");
    }
    return toDTO(await assertMilik(kunjunganId, itemId));
  }

  async function remove(kunjunganId: string, itemId: string, _actor: Actor): Promise<void> {
    await assertKunjungan(kunjunganId);
    await assertMilik(kunjunganId, itemId);
    await dal.softDelete(itemId);
  }

  return { list, add, update, remove };
}

export const asuhanKeperawatanService = makeAsuhanKeperawatanService();
