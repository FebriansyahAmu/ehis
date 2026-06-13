// obatService — Master Katalog Obat. Business rule + map entity→DTO (ObatRecord).
// Vocab FE⇄DB hanya null⇄undefined; enum (kategori/bentuk/rute/golongan/status)
// pass-through TEXT. Katalog leaf (tanpa optimistic-version). `list` ACTOR-LESS →
// Server Component boleh panggil (SSR hybrid, API-RULES §6.1). KFA = blok JSONB →
// replace utuh bila field `kfa` dikirim saat update.

import * as defaultDal from "@/lib/dal/master/obatDal";
import { transaction } from "@/lib/db/prisma";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { Prisma } from "@/generated/prisma/client";
import type { ObatData, ObatPatch, ObatEntity } from "@/lib/dal/master/obatDal";
import type {
  KfaMapping, KfaMappedIngredient,
  ObatKategori, SediaanBentuk, SatuanTerkecil, RutePemberian, GolonganObat, StatusObat,
} from "@/lib/master/obatMock";
import type {
  CreateObatInput, UpdateObatInput, ObatQuery, ObatDTO, KfaMappingInput,
} from "@/lib/schemas/master/obat";

type Dal = typeof defaultDal;
const DEFAULT_LIMIT = 100;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // periode kode obat ikut kalender WIB

// ── KFA JSON ⇄ KfaMapping ─────────────────────────────────

function ingredientFromJson(v: unknown): KfaMappedIngredient | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.kode !== "string" && typeof o.display !== "string") return null;
  return {
    kode: typeof o.kode === "string" ? o.kode : "",
    display: typeof o.display === "string" ? o.display : "",
    dosis: typeof o.dosis === "number" ? o.dosis : undefined,
    satuan: typeof o.satuan === "string" ? o.satuan : undefined,
    dosisPerSatuan: typeof o.dosisPerSatuan === "string" ? o.dosisPerSatuan : undefined,
  };
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

/** Parse kolom JSONB → KfaMapping. Mapping kosong (tanpa POA/POV/BZA) → undefined. */
function kfaFromJson(v: unknown): KfaMapping | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const zatAktif = Array.isArray(o.zatAktif)
    ? o.zatAktif.map(ingredientFromJson).filter((x): x is KfaMappedIngredient => x !== null)
    : [];
  const m: KfaMapping = {
    poaKode: str(o.poaKode), poaNama: str(o.poaNama), nie: str(o.nie),
    povKode: str(o.povKode), povNama: str(o.povNama),
    ruteKode: str(o.ruteKode), ruteNama: str(o.ruteNama),
    bentukKode: str(o.bentukKode), bentukNama: str(o.bentukNama),
    zatAktif,
    sumber: o.sumber === "KFA_API" ? "KFA_API" : o.sumber === "Manual" ? "Manual" : undefined,
    mappedAt: str(o.mappedAt),
  };
  const empty = !m.poaKode && !m.povKode && !m.ruteKode && !m.bentukKode && !m.nie && zatAktif.length === 0;
  return empty ? undefined : m;
}

/** KfaMappingInput → objek JSON siap simpan (buang undefined). */
function mappingInputToJson(m: KfaMappingInput): Prisma.InputJsonValue {
  const out: Record<string, unknown> = {
    zatAktif: m.zatAktif.map((z) => ({
      kode: z.kode,
      display: z.display,
      ...(z.dosis !== undefined ? { dosis: z.dosis } : {}),
      ...(z.satuan ? { satuan: z.satuan } : {}),
      ...(z.dosisPerSatuan ? { dosisPerSatuan: z.dosisPerSatuan } : {}),
    })),
  };
  for (const k of ["poaKode", "poaNama", "nie", "povKode", "povNama", "ruteKode", "ruteNama", "bentukKode", "bentukNama", "sumber", "mappedAt"] as const) {
    if (m[k] !== undefined) out[k] = m[k];
  }
  return out as Prisma.InputJsonValue;
}

// ── Entity → DTO (ObatRecord) ─────────────────────────────

const nu = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

function toDTO(e: ObatEntity): ObatDTO {
  return {
    id: e.id,
    kode: e.kode,
    namaGenerik: e.namaGenerik,
    namaDagang: e.namaDagang,
    pabrik: nu(e.pabrik),
    kategori: e.kategori as ObatKategori,
    bentuk: e.bentuk as SediaanBentuk,
    kekuatan: e.kekuatan,
    satuanTerkecil: (nu(e.satuanTerkecil) as SatuanTerkecil | undefined),
    rute: (nu(e.rute) as RutePemberian | undefined),

    isFormularium: e.isFormularium,
    isHAM: e.isHAM,
    isLASA: e.isLASA,
    lasaPairIds: e.lasaPairIds.length ? e.lasaPairIds : undefined,
    golongan: (nu(e.golongan) as GolonganObat | undefined),
    isColdChain: e.isColdChain,
    isRestricted: e.isRestricted,

    indikasi: nu(e.indikasi),
    kontraindikasi: nu(e.kontraindikasi),
    dosisDewasa: nu(e.dosisDewasa),
    dosisAnak: nu(e.dosisAnak),
    efekSamping: nu(e.efekSamping),
    interaksiObat: nu(e.interaksiObat),
    catatanKhusus: nu(e.catatanKhusus),

    hargaSatuan: e.hargaSatuan,
    hpp: nu(e.hpp),
    het: nu(e.het),
    kodeFornas: nu(e.kodeFornas),
    bpjsCoverage: e.bpjsCoverage,
    batasResepPerKunjungan: nu(e.batasResepPerKunjungan),

    kfa: kfaFromJson(e.kfa),
    status: e.status as StatusObat,
  };
}

// ── Input → DAL data ──────────────────────────────────────

function createToData(input: CreateObatInput): ObatData {
  return {
    kode: "", // di-overwrite Service dgn OBT-<YYMM><NNN> (auto, dalam transaksi)
    namaGenerik: input.namaGenerik,
    namaDagang: input.namaDagang,
    pabrik: input.pabrik ?? null,
    kategori: input.kategori ?? "Lainnya",
    bentuk: input.bentuk ?? "Tablet",
    kekuatan: input.kekuatan ?? "",
    satuanTerkecil: input.satuanTerkecil ?? null,
    rute: input.rute ?? null,

    isFormularium: input.isFormularium ?? false,
    isHAM: input.isHAM ?? false,
    isLASA: input.isLASA ?? false,
    lasaPairIds: input.lasaPairIds ?? [],
    golongan: input.golongan ?? null,
    isColdChain: input.isColdChain ?? false,
    isRestricted: input.isRestricted ?? false,

    indikasi: input.indikasi ?? null,
    kontraindikasi: input.kontraindikasi ?? null,
    dosisDewasa: input.dosisDewasa ?? null,
    dosisAnak: input.dosisAnak ?? null,
    efekSamping: input.efekSamping ?? null,
    interaksiObat: input.interaksiObat ?? null,
    catatanKhusus: input.catatanKhusus ?? null,

    hargaSatuan: input.hargaSatuan ?? 0,
    hpp: input.hpp ?? null,
    het: input.het ?? null,
    kodeFornas: input.kodeFornas ?? null,
    bpjsCoverage: input.bpjsCoverage ?? false,
    batasResepPerKunjungan: input.batasResepPerKunjungan ?? null,

    kfa: input.kfa ? mappingInputToJson(input.kfa) : undefined,
    status: input.status ?? "Aktif",
  };
}

function setDefined<K extends keyof ObatPatch>(target: ObatPatch, key: K, value: ObatPatch[K] | undefined) {
  if (value !== undefined) target[key] = value;
}

function updateToPatch(input: UpdateObatInput): ObatPatch {
  const p: ObatPatch = {}; // `kode` immutable (auto-gen) → tak ikut patch
  setDefined(p, "namaGenerik", input.namaGenerik);
  setDefined(p, "namaDagang", input.namaDagang);
  setDefined(p, "pabrik", input.pabrik ?? null);
  setDefined(p, "kategori", input.kategori);
  setDefined(p, "bentuk", input.bentuk);
  setDefined(p, "kekuatan", input.kekuatan);
  setDefined(p, "satuanTerkecil", input.satuanTerkecil ?? null);
  setDefined(p, "rute", input.rute ?? null);

  setDefined(p, "isFormularium", input.isFormularium);
  setDefined(p, "isHAM", input.isHAM);
  setDefined(p, "isLASA", input.isLASA);
  setDefined(p, "lasaPairIds", input.lasaPairIds);
  setDefined(p, "golongan", input.golongan ?? null);
  setDefined(p, "isColdChain", input.isColdChain);
  setDefined(p, "isRestricted", input.isRestricted);

  setDefined(p, "indikasi", input.indikasi ?? null);
  setDefined(p, "kontraindikasi", input.kontraindikasi ?? null);
  setDefined(p, "dosisDewasa", input.dosisDewasa ?? null);
  setDefined(p, "dosisAnak", input.dosisAnak ?? null);
  setDefined(p, "efekSamping", input.efekSamping ?? null);
  setDefined(p, "interaksiObat", input.interaksiObat ?? null);
  setDefined(p, "catatanKhusus", input.catatanKhusus ?? null);

  setDefined(p, "hargaSatuan", input.hargaSatuan);
  setDefined(p, "hpp", input.hpp ?? null);
  setDefined(p, "het", input.het ?? null);
  setDefined(p, "kodeFornas", input.kodeFornas ?? null);
  setDefined(p, "bpjsCoverage", input.bpjsCoverage);
  setDefined(p, "batasResepPerKunjungan", input.batasResepPerKunjungan ?? null);

  if (input.kfa !== undefined) p.kfa = mappingInputToJson(input.kfa);
  setDefined(p, "status", input.status);
  return p;
}

// ── Service factory ───────────────────────────────────────

export function makeObatService(deps: { dal?: Dal; clock?: Clock } = {}) {
  const dal = deps.dal ?? defaultDal;
  const clock = deps.clock ?? systemClock;

  /** Periode "YYMM" zona WIB (mis. "2606") — penanda bulan reset sequence kode. */
  function obatPeriode(): string {
    const wib = new Date(clock.now().getTime() + WIB_OFFSET_MS);
    const yy = String(wib.getUTCFullYear() % 100).padStart(2, "0");
    const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
    return `${yy}${mm}`;
  }

  /** Kode obat `OBT-<YYMM><NNN>`. Pad min 3 digit; bila >999/bulan lebar tumbuh. */
  function formatObatKode(periode: string, seq: number): string {
    return `OBT-${periode}${String(seq).padStart(3, "0")}`;
  }

  /** List + filter (q/kategori/status) + keyset cursor. ACTOR-LESS (SSR-safe). */
  async function list(query: ObatQuery): Promise<{ items: ObatDTO[]; cursor: string | null }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const status = query.status && query.status !== "Semua" ? query.status : undefined;

    const rows = await dal.list({
      q: query.q || undefined,
      kategori: query.kategori,
      status,
      cursorId: query.cursor,
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { items: page.map(toDTO), cursor: hasMore ? page[page.length - 1].id : null };
  }

  /** Kode auto `OBT-<YYMM><NNN>` (counter atomik) + create dalam 1 transaksi. */
  async function create(input: CreateObatInput, _actor: Actor): Promise<ObatDTO> {
    const row = await transaction(async (tx) => {
      const periode = obatPeriode();
      const seq = await dal.nextObatSeq(periode, tx);
      const data = createToData(input);
      data.kode = formatObatKode(periode, seq);
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  async function update(id: string, input: UpdateObatInput, _actor: Actor): Promise<ObatDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Obat tidak ditemukan");
    const row = await dal.update(id, updateToPatch(input));
    return toDTO(row);
  }

  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Obat tidak ditemukan");
  }

  return { list, create, update, remove };
}

export const obatService = makeObatService();
