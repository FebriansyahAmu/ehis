// penilaianSkalaService — tab Penilaian, sub-menu Asesmen Risiko (generik, master-driven).
// Append-only: list (riwayat) + add (baris baru). Skor & interpretasi DIHITUNG di FE/master
// (single source) → BE menyimpan snapshot apa adanya (skalaKode/nama + jawaban + skor + interpretasi).
// pemeriksa = input override ATAU nama actor. tanggal/waktu derive dari createdAt (TZ Asia/Jakarta).
// RBAC di Route: clinical.penilaian (read/create). ABAC careUnit di route() choke-point.
// Selaras penilaianStatusService.

import * as defaultDal from "@/lib/dal/penilaian/penilaianSkalaDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PenilaianSkalaEntity } from "@/lib/dal/penilaian/penilaianSkalaDal";
import {
  type PenilaianSkalaInput, type PenilaianSkalaDTO, type PenilaianSkalaJawaban,
} from "@/lib/schemas/penilaian/penilaianSkala";

type Dal = typeof defaultDal;

const DATE_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });

// ── JSONB → tipe DTO (defensif: kolom Json bisa apa saja) ──────────────────────
function s(v: unknown): string { return typeof v === "string" ? v : ""; }
function num(v: unknown): number { return typeof v === "number" ? v : 0; }

function toJawaban(v: unknown): PenilaianSkalaJawaban[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return { itemId: s(o.itemId), itemLabel: s(o.itemLabel), score: num(o.score), optionLabel: s(o.optionLabel) };
  });
}

function toDTO(e: PenilaianSkalaEntity): PenilaianSkalaDTO {
  return {
    id: e.id,
    skalaKode: e.skalaKode,
    skalaNama: e.skalaNama,
    kategori: e.kategori,
    totalSkor: e.totalSkor,
    totalMax: e.totalMax,
    interpretasiLabel: e.interpretasiLabel,
    interpretasiTone: e.interpretasiTone,
    jawaban: toJawaban(e.jawaban),
    catatan: e.catatan,
    pemeriksa: e.pemeriksa,
    tanggal: DATE_FMT.format(e.createdAt),
    waktu: e.createdAt.toISOString(),
  };
}

export function makePenilaianSkalaService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // GET — riwayat penilaian skala per kunjungan (terbaru dulu).
  async function list(kunjunganId: string, _actor: Actor): Promise<PenilaianSkalaDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — tambah 1 penilaian skala (append-only).
  async function add(
    kunjunganId: string, input: PenilaianSkalaInput, actor: Actor,
  ): Promise<PenilaianSkalaDTO> {
    await assertKunjungan(kunjunganId);

    const jawaban = (input.jawaban ?? []).map((j) => ({
      itemId: j.itemId, itemLabel: j.itemLabel ?? "", score: j.score, optionLabel: j.optionLabel ?? "",
    }));
    if (jawaban.length === 0) {
      throw Errors.validation("Isi minimal satu item penilaian skala");
    }

    const pemeriksa = input.pemeriksa?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      skalaKode: input.skalaKode.trim(),
      skalaNama: input.skalaNama.trim(),
      kategori: input.kategori?.trim() || "Risiko",
      totalSkor: input.totalSkor,
      totalMax: input.totalMax,
      interpretasiLabel: input.interpretasiLabel?.trim() ?? "",
      interpretasiTone: input.interpretasiTone?.trim() ?? "",
      jawaban,
      catatan: input.catatan?.trim() ?? "",
      pemeriksa,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  return { list, add };
}

export const penilaianSkalaService = makePenilaianSkalaService();
