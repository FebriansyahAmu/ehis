// bmhpService — Master Katalog BMHP/BHP. Business rule + map entity→DTO (BmhpRecord).
// Vocab FE⇄DB hanya null⇄undefined; enum (kategori/satuan/kelasRisiko/status) pass-through
// TEXT. Katalog leaf (tanpa optimistic-version). `list` ACTOR-LESS → Server Component boleh
// panggil (SSR hybrid, API-RULES §6.1). Kode auto `BHP-<YYMM><NNN>` (counter atomik). Pola
// identik obatService (tanpa blok KFA — KFA Alkes ditunda).

import * as defaultDal from "@/lib/dal/master/bmhpDal";
import { transaction } from "@/lib/db/prisma";
import { systemClock, type Clock } from "@/lib/core/clock";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { BmhpData, BmhpPatch, BmhpEntity } from "@/lib/dal/master/bmhpDal";
import type {
  BmhpKategori, BmhpSatuan, KelasRisiko, StatusBmhp,
} from "@/lib/master/bmhpMock";
import type {
  CreateBmhpInput, UpdateBmhpInput, BmhpQuery, BmhpDTO,
} from "@/lib/schemas/master/bmhp";

type Dal = typeof defaultDal;
const DEFAULT_LIMIT = 100;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // periode kode BMHP ikut kalender WIB

// ── Entity → DTO (BmhpRecord) ─────────────────────────────

const nu = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

function toDTO(e: BmhpEntity): BmhpDTO {
  return {
    id: e.id,
    kode: e.kode,
    nama: e.nama,
    merek: nu(e.merek),
    pabrik: nu(e.pabrik),
    kategori: e.kategori as BmhpKategori,
    ukuran: nu(e.ukuran),
    satuan: e.satuan as BmhpSatuan,
    isiPerKemasan: nu(e.isiPerKemasan),

    isSteril: e.isSteril,
    isSingleUse: e.isSingleUse,
    isImplan: e.isImplan,
    kelasRisiko: (nu(e.kelasRisiko) as KelasRisiko | undefined),
    isFormularium: e.isFormularium,

    nomorIzinEdar: nu(e.nomorIzinEdar),
    kodeEKatalog: nu(e.kodeEKatalog),

    hargaSatuan: e.hargaSatuan,
    hpp: nu(e.hpp),
    het: nu(e.het),
    bpjsCoverage: e.bpjsCoverage,

    catatan: nu(e.catatan),
    status: e.status as StatusBmhp,
  };
}

// ── Input → DAL data ──────────────────────────────────────

function createToData(input: CreateBmhpInput): BmhpData {
  return {
    kode: "", // di-overwrite Service dgn BHP-<YYMM><NNN> (auto, dalam transaksi)
    nama: input.nama,
    merek: input.merek ?? null,
    pabrik: input.pabrik ?? null,
    kategori: input.kategori ?? "Lainnya",
    ukuran: input.ukuran ?? null,
    satuan: input.satuan ?? "Pcs",
    isiPerKemasan: input.isiPerKemasan ?? null,

    isSteril: input.isSteril ?? false,
    isSingleUse: input.isSingleUse ?? true,
    isImplan: input.isImplan ?? false,
    kelasRisiko: input.kelasRisiko ?? null,
    isFormularium: input.isFormularium ?? false,

    nomorIzinEdar: input.nomorIzinEdar ?? null,
    kodeEKatalog: input.kodeEKatalog ?? null,

    hargaSatuan: input.hargaSatuan ?? 0,
    hpp: input.hpp ?? null,
    het: input.het ?? null,
    bpjsCoverage: input.bpjsCoverage ?? false,

    catatan: input.catatan ?? null,
    status: input.status ?? "Aktif",
  };
}

function setDefined<K extends keyof BmhpPatch>(target: BmhpPatch, key: K, value: BmhpPatch[K] | undefined) {
  if (value !== undefined) target[key] = value;
}

function updateToPatch(input: UpdateBmhpInput): BmhpPatch {
  const p: BmhpPatch = {}; // `kode` immutable (auto-gen) → tak ikut patch
  setDefined(p, "nama", input.nama);
  setDefined(p, "merek", input.merek ?? null);
  setDefined(p, "pabrik", input.pabrik ?? null);
  setDefined(p, "kategori", input.kategori);
  setDefined(p, "ukuran", input.ukuran ?? null);
  setDefined(p, "satuan", input.satuan);
  setDefined(p, "isiPerKemasan", input.isiPerKemasan ?? null);

  setDefined(p, "isSteril", input.isSteril);
  setDefined(p, "isSingleUse", input.isSingleUse);
  setDefined(p, "isImplan", input.isImplan);
  setDefined(p, "kelasRisiko", input.kelasRisiko ?? null);
  setDefined(p, "isFormularium", input.isFormularium);

  setDefined(p, "nomorIzinEdar", input.nomorIzinEdar ?? null);
  setDefined(p, "kodeEKatalog", input.kodeEKatalog ?? null);

  setDefined(p, "hargaSatuan", input.hargaSatuan);
  setDefined(p, "hpp", input.hpp ?? null);
  setDefined(p, "het", input.het ?? null);
  setDefined(p, "bpjsCoverage", input.bpjsCoverage);

  setDefined(p, "catatan", input.catatan ?? null);
  setDefined(p, "status", input.status);
  return p;
}

// ── Service factory ───────────────────────────────────────

export function makeBmhpService(deps: { dal?: Dal; clock?: Clock } = {}) {
  const dal = deps.dal ?? defaultDal;
  const clock = deps.clock ?? systemClock;

  /** Periode "YYMM" zona WIB (mis. "2606") — penanda bulan reset sequence kode. */
  function bmhpPeriode(): string {
    const wib = new Date(clock.now().getTime() + WIB_OFFSET_MS);
    const yy = String(wib.getUTCFullYear() % 100).padStart(2, "0");
    const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
    return `${yy}${mm}`;
  }

  /** Kode BMHP `BHP-<YYMM><NNN>`. Pad min 3 digit; bila >999/bulan lebar tumbuh. */
  function formatBmhpKode(periode: string, seq: number): string {
    return `BHP-${periode}${String(seq).padStart(3, "0")}`;
  }

  /** List + filter (q/kategori/status) + keyset cursor. ACTOR-LESS (SSR-safe). */
  async function list(query: BmhpQuery): Promise<{ items: BmhpDTO[]; cursor: string | null }> {
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

  /** Kode auto `BHP-<YYMM><NNN>` (counter atomik) + create dalam 1 transaksi. */
  async function create(input: CreateBmhpInput, _actor: Actor): Promise<BmhpDTO> {
    const row = await transaction(async (tx) => {
      const periode = bmhpPeriode();
      const seq = await dal.nextBmhpSeq(periode, tx);
      const data = createToData(input);
      data.kode = formatBmhpKode(periode, seq);
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  async function update(id: string, input: UpdateBmhpInput, _actor: Actor): Promise<BmhpDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("BMHP tidak ditemukan");
    const row = await dal.update(id, updateToPatch(input));
    return toDTO(row);
  }

  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("BMHP tidak ditemukan");
  }

  return { list, create, update, remove };
}

export const bmhpService = makeBmhpService();
