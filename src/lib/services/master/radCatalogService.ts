// radCatalogService — Master Katalog Radiologi. Business rule + map entity→DTO. Vocab
// modalitas/region/kategori/status pass-through (enum identik union FE). Kode `RAD-NNNN`
// AUTO-GEN (counter atomik, dalam transaksi). Blok terstruktur = JSONB (di-set/replace utuh).
// Katalog leaf (tanpa optimistic-version). RBAC `master.katalog` di Route.

import * as defaultDal from "@/lib/dal/master/radCatalogDal";
import { transaction } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { RadCatalogEntity, RadCatalogData, RadCatalogPatch } from "@/lib/dal/master/radCatalogDal";
import {
  type CreateRadCatalogInput, type UpdateRadCatalogInput, type RadCatalogQuery,
  type RadCatalogDTO, type TatTargetDTO, type PersiapanDTO, type KontrasDTO,
  type DrlDTO, type ReportingTemplateDTO,
  type RadModalitasDTO, type RadRegionDTO, type RadKategoriDTO,
  type RadJenisKontrasDTO, type RadStatusDTO,
} from "@/lib/schemas/master/radCatalog";

type Dal = typeof defaultDal;

const DEFAULT_LIMIT = 200;

// ── JSONB → DTO (defensif: kolom Json bisa apa saja) ──────────────────────────
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function toTat(v: unknown): TatTargetDTO {
  const o = (v ?? {}) as Record<string, unknown>;
  return { cito: num(o.cito) ?? 0, semiCito: num(o.semiCito) ?? 0, rutin: num(o.rutin) ?? 0 };
}
function toPersiapan(v: unknown): PersiapanDTO {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    puasaJam: num(o.puasaJam),
    premedikasi: str(o.premedikasi),
    kontraindikasi: strArr(o.kontraindikasi),
    instruksiPasien: str(o.instruksiPasien),
    catatanKhusus: str(o.catatanKhusus),
  };
}
function toKontras(v: unknown): KontrasDTO {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    jenis: (str(o.jenis) ?? "Tanpa") as RadJenisKontrasDTO,
    dosisMl: num(o.dosisMl),
    kecepatanInjeksiMlSec: num(o.kecepatanInjeksiMlSec),
    premedikasiSteroidJikaAlergi: typeof o.premedikasiSteroidJikaAlergi === "boolean" ? o.premedikasiSteroidJikaAlergi : undefined,
    catatan: str(o.catatan),
  };
}
function toDrl(v: unknown): DrlDTO | undefined {
  if (v === null || v === undefined) return undefined;
  const o = v as Record<string, unknown>;
  const dto: DrlDTO = {
    ctdiVol: num(o.ctdiVol), dlp: num(o.dlp), dap: num(o.dap),
    waktuFluoroMenit: num(o.waktuFluoroMenit), entranceDose: num(o.entranceDose),
    catatan: str(o.catatan),
  };
  return Object.values(dto).some((x) => x !== undefined) ? dto : undefined;
}
function toReporting(v: unknown): ReportingTemplateDTO {
  const o = (v ?? {}) as Record<string, unknown>;
  return { struktur: strArr(o.struktur), templateTemuan: str(o.templateTemuan) };
}

function toDTO(e: RadCatalogEntity): RadCatalogDTO {
  return {
    id: e.id,
    kode: e.kode,
    kodeIcd: e.kodeIcd ?? undefined,
    nama: e.nama,
    modalitas: e.modalitas as RadModalitasDTO,
    modalitasSubtype: e.modalitasSubtype ?? undefined,
    region: e.region as RadRegionDTO,
    kategori: e.kategori as RadKategoriDTO,
    estimasiWaktuMenit: e.estimasiWaktuMenit,
    tatTargetMenit: toTat(e.tatTarget),
    persiapan: toPersiapan(e.persiapan),
    kontras: toKontras(e.kontras),
    drlReferensi: toDrl(e.drlReferensi),
    reportingTemplate: toReporting(e.reportingTemplate),
    deskripsi: e.deskripsi ?? undefined,
    status: e.status as RadStatusDTO,
  };
}

const EMPTY_TAT = { cito: 60, semiCito: 180, rutin: 360 };
const EMPTY_PERSIAPAN = { kontraindikasi: [] };
const EMPTY_KONTRAS = { jenis: "Tanpa" };
const EMPTY_REPORTING = { struktur: ["Indikasi Klinis", "Teknik Pemeriksaan", "Temuan", "Kesan", "Saran"] };

function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export function makeRadCatalogService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Kode radiologi `RAD-NNNN` (pad min 4 digit). */
  function formatKode(seq: number): string {
    return `RAD-${String(seq).padStart(4, "0")}`;
  }

  /** List + filter (q/modalitas/kategori/status) + keyset cursor. ACTOR-LESS (SSR-safe). */
  async function list(query: RadCatalogQuery): Promise<{ items: RadCatalogDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await dal.list({
      q: query.q || undefined,
      modalitas: query.modalitas,
      kategori: query.kategori,
      status,
      cursorId: query.cursor,
      limit: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  /** Tambah 1 pemeriksaan. Kode auto `RAD-NNNN` (counter atomik) dalam 1 transaksi. */
  async function create(input: CreateRadCatalogInput, _actor: Actor): Promise<RadCatalogDTO> {
    const row = await transaction(async (tx) => {
      const seq = await dal.nextRadSeq(tx);
      const data: RadCatalogData = {
        kode: formatKode(seq),
        kodeIcd: input.kodeIcd ?? null,
        nama: input.nama,
        modalitas: input.modalitas ?? "XR",
        modalitasSubtype: input.modalitasSubtype ?? null,
        region: input.region ?? "Thorax",
        kategori: input.kategori ?? "Diagnostik",
        estimasiWaktuMenit: input.estimasiWaktuMenit ?? 15,
        tatTarget: input.tatTarget ?? EMPTY_TAT,
        persiapan: input.persiapan ?? EMPTY_PERSIAPAN,
        kontras: input.kontras ?? EMPTY_KONTRAS,
        drlReferensi: input.drlReferensi ?? null,
        reportingTemplate: input.reportingTemplate ?? EMPTY_REPORTING,
        deskripsi: input.deskripsi ?? null,
        status: input.status ?? "Aktif",
      };
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  /** Ubah 1 pemeriksaan (parsial). Kode immutable (auto-gen). */
  async function update(id: string, input: UpdateRadCatalogInput, _actor: Actor): Promise<RadCatalogDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Pemeriksaan radiologi tidak ditemukan");

    const patch: RadCatalogPatch = {};
    setDefined(patch, "nama", input.nama);
    if (input.kodeIcd !== undefined) patch.kodeIcd = input.kodeIcd ?? null;
    setDefined(patch, "modalitas", input.modalitas);
    if (input.modalitasSubtype !== undefined) patch.modalitasSubtype = input.modalitasSubtype ?? null;
    setDefined(patch, "region", input.region);
    setDefined(patch, "kategori", input.kategori);
    setDefined(patch, "estimasiWaktuMenit", input.estimasiWaktuMenit);
    if (input.tatTarget !== undefined) patch.tatTarget = input.tatTarget;
    if (input.persiapan !== undefined) patch.persiapan = input.persiapan;
    if (input.kontras !== undefined) patch.kontras = input.kontras;
    if (input.drlReferensi !== undefined) patch.drlReferensi = input.drlReferensi ?? null;
    if (input.reportingTemplate !== undefined) patch.reportingTemplate = input.reportingTemplate;
    if (input.deskripsi !== undefined) patch.deskripsi = input.deskripsi ?? null;
    setDefined(patch, "status", input.status);

    const row = await dal.update(id, patch);
    return toDTO(row);
  }

  /** Soft-delete 1 pemeriksaan. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Pemeriksaan radiologi tidak ditemukan");
  }

  return { list, create, update, remove };
}

export const radCatalogService = makeRadCatalogService();
