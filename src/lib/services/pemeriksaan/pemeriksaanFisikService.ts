// pemeriksaanFisikService — tab Pemeriksaan (status generalis + head-to-toe, SNARS AP 1).
// Append-only "latest wins": list (riwayat) + add (baris baru). dokterPemeriksa = roster ruangan
// (input); perawat = input override ATAU nama actor. RBAC di Route: clinical.pemeriksaan (read/create).
// ABAC careUnit di route() choke-point (clinical.* + params.id). Blok orientasi/sistem/bodyMarkings =
// JSONB; tanggal/jam = derive dari waktuPemeriksaan (TZ Asia/Jakarta). Selaras anamnesisService.

import * as defaultDal from "@/lib/dal/pemeriksaan/pemeriksaanFisikDal";
import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import { resolveActorNama } from "@/lib/services/actorName";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { PemeriksaanEntity } from "@/lib/dal/pemeriksaan/pemeriksaanFisikDal";
import {
  type PemeriksaanFisikInput, type PemeriksaanFisikDTO,
} from "@/lib/schemas/pemeriksaan/pemeriksaanFisik";

type Dal = typeof defaultDal;

// ── waktuPemeriksaan (timestamptz) → tanggal/jam tampilan (TZ Asia/Jakarta) ─────
const DATE_FMT = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });

// ── JSONB → tipe DTO (defensif: kolom Json bisa apa saja) ──────────────────────
function s(v: unknown): string { return typeof v === "string" ? v : ""; }
function b(v: unknown): boolean { return v === true; }
function toOrientasi(v: unknown): { waktu: boolean; tempat: boolean; orang: boolean } {
  const o = (v ?? {}) as Record<string, unknown>;
  return { waktu: b(o.waktu), tempat: b(o.tempat), orang: b(o.orang) };
}
function toSistem(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = s(val);
  return out;
}
function toBodyMarkings(v: unknown): { region: string; label: string; catatan: string }[] {
  if (!Array.isArray(v)) return [];
  return v.map((e) => {
    const o = (e ?? {}) as Record<string, unknown>;
    return { region: s(o.region), label: s(o.label), catatan: s(o.catatan) };
  });
}

function toDTO(e: PemeriksaanEntity): PemeriksaanFisikDTO {
  return {
    id: e.id,
    waktuPemeriksaan: e.waktuPemeriksaan.toISOString(),
    tanggal: DATE_FMT.format(e.waktuPemeriksaan),
    jam: TIME_FMT.format(e.waktuPemeriksaan),
    dokter: e.dokterPemeriksa,
    perawat: e.perawat,
    ku: e.ku,
    kesadaran: e.kesadaran,
    gizi: e.gizi,
    mobilitas: e.mobilitas ?? undefined,
    orientasi: toOrientasi(e.orientasi),
    catatanGeneralis: e.catatanGeneralis ?? "",
    sistem: toSistem(e.sistem),
    temuanAbnormal: e.temuanAbnormal,
    temuanLain: e.temuanLain,
    catatanUmum: e.catatanUmum ?? "",
    bodyMarkings: toBodyMarkings(e.bodyMarkings),
  };
}

// Normalisasi input → bentuk simpan.
function cleanList(a?: string[]): string[] { return (a ?? []).map((x) => x.trim()).filter(Boolean); }
function cleanBodyMarkings(a?: { region: string; label: string; catatan: string }[]) {
  return (a ?? []).map((m) => ({ region: m.region, label: m.label, catatan: m.catatan }));
}

export function makePemeriksaanFisikService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  async function assertKunjungan(kunjunganId: string) {
    const k = await kunjunganDal.findById(kunjunganId);
    if (!k) throw Errors.notFound("Kunjungan tidak ditemukan");
    return k;
  }

  // GET — riwayat pemeriksaan fisik per kunjungan (terbaru dulu).
  async function list(kunjunganId: string, _actor: Actor): Promise<PemeriksaanFisikDTO[]> {
    await assertKunjungan(kunjunganId);
    const rows = await dal.list(kunjunganId);
    return rows.map(toDTO);
  }

  // POST — tambah 1 pemeriksaan fisik (append-only; baris baru = re-pemeriksaan).
  async function add(
    kunjunganId: string,
    input: PemeriksaanFisikInput,
    actor: Actor,
  ): Promise<PemeriksaanFisikDTO> {
    await assertKunjungan(kunjunganId);
    const perawat = input.perawat?.trim() || (await resolveActorNama(actor));
    const row = await dal.create({
      kunjunganId,
      ku: input.ku,
      kesadaran: input.kesadaran,
      gizi: input.gizi,
      mobilitas: input.mobilitas ?? null,
      orientasi: input.orientasi ?? { waktu: true, tempat: true, orang: true },
      catatanGeneralis: input.catatanGeneralis?.trim() || null,
      sistem: input.sistem ?? {},
      temuanAbnormal: cleanList(input.temuanAbnormal),
      temuanLain: cleanList(input.temuanLain),
      catatanUmum: input.catatanUmum?.trim() || null,
      bodyMarkings: cleanBodyMarkings(input.bodyMarkings),
      waktuPemeriksaan: input.waktuPemeriksaan ? new Date(input.waktuPemeriksaan) : new Date(),
      dokterPemeriksa: input.dokterPemeriksa?.trim() ?? "",
      perawat,
      authorUserId: actor.userId,
      authorPegawaiId: actor.pegawaiId,
    });
    return toDTO(row);
  }

  return { list, add };
}

export const pemeriksaanFisikService = makePemeriksaanFisikService();
