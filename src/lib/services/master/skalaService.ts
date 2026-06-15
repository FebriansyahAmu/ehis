// skalaService — factory generik master Skala Klinis (skoring), parametrik per `kategori` + `scope`
// kode (SR=Risiko · SU=Umum · SP=Penyakit). Business + map entity→DTO (mirror SkalaRecord).
// Kode `<SCOPE>-NNNN` AUTO-GEN (counter atomik, dalam transaksi). items[]/interpretasi[] = JSONB
// (set/replace utuh). Katalog leaf (tanpa version). RBAC master.skala di Route.
//
// Dipakai oleh skalaRisikoService (Risiko/SR) & skalaPenyakitService (Penyakit/SP) — satu sumber
// logika, beda config. Schema input/DTO (schemas/master/skalaRisiko) category-agnostic → di-reuse.

import * as defaultDal from "@/lib/dal/master/skalaRisikoDal";
import { transaction } from "@/lib/db/prisma";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type { SkalaEntity, SkalaData, SkalaPatch } from "@/lib/dal/master/skalaRisikoDal";
import {
  type CreateSkalaRisikoInput, type UpdateSkalaRisikoInput, type SkalaRisikoQuery,
  type SkalaRisikoDTO, type SkalaItemDTO, type SkalaInterpretasiDTO,
} from "@/lib/schemas/master/skalaRisiko";

type Dal = typeof defaultDal;

const DEFAULT_LIMIT = 300;

// ── JSONB → tipe DTO (defensif: kolom Json bisa apa saja) ──────────────────────
function s(v: unknown): string { return typeof v === "string" ? v : ""; }
function n(v: unknown): number { return typeof v === "number" ? v : 0; }

function toItems(v: unknown): SkalaItemDTO[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    const options = Array.isArray(o.options) ? o.options : [];
    return {
      id: s(o.id),
      label: s(o.label),
      maxScore: n(o.maxScore),
      options: options.map((op) => {
        const p = (op ?? {}) as Record<string, unknown>;
        const detail = s(p.detail);
        return { score: n(p.score), label: s(p.label), ...(detail ? { detail } : {}) };
      }),
    };
  });
}
function toInterpretasi(v: unknown): SkalaInterpretasiDTO[] {
  if (!Array.isArray(v)) return [];
  return v.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return {
      id: s(o.id),
      min: n(o.min),
      max: n(o.max),
      label: s(o.label),
      tone: (s(o.tone) || "sky") as SkalaInterpretasiDTO["tone"],
      action: s(o.action),
    };
  });
}

function toDTO(e: SkalaEntity): SkalaRisikoDTO {
  return {
    id: e.id,
    kode: e.kode,
    nama: e.nama,
    singkat: e.singkat,
    deskripsi: e.deskripsi,
    scoringMode: e.scoringMode as SkalaRisikoDTO["scoringMode"],
    arah: e.arah as SkalaRisikoDTO["arah"],
    items: toItems(e.items),
    totalMax: e.totalMax,
    interpretasi: toInterpretasi(e.interpretasi),
    referensi: e.referensi,
    konsumenModul: e.konsumenModul as SkalaRisikoDTO["konsumenModul"],
    status: e.status as SkalaRisikoDTO["status"],
  };
}

function setDefined<T extends object, K extends keyof T>(t: T, k: K, v: T[K] | undefined) {
  if (v !== undefined) t[k] = v;
}

export interface SkalaServiceConfig {
  kategori: string; // "Risiko" | "Umum" | "Penyakit"
  scope: string;    // prefix kode counter: "SR" | "SU" | "SP"
  dal?: Dal;
}

export function makeSkalaService(config: SkalaServiceConfig) {
  const { kategori, scope } = config;
  const dal = config.dal ?? defaultDal;

  /** Kode skala `<SCOPE>-NNNN` (pad min 4 digit). */
  function formatKode(seq: number): string {
    return `${scope}-${String(seq).padStart(4, "0")}`;
  }

  /** List + filter (q/modul/status) untuk kategori ini. ACTOR-LESS (SSR-safe). */
  async function list(query: SkalaRisikoQuery): Promise<{ items: SkalaRisikoDTO[] }> {
    const status = query.status && query.status !== "Semua" ? query.status : undefined;
    const rows = await dal.list({
      kategori,
      q: query.q || undefined,
      modul: query.modul,
      status,
      limit: query.limit ?? DEFAULT_LIMIT,
    });
    return { items: rows.map(toDTO) };
  }

  /** Tambah 1 skala. Kode auto `<SCOPE>-NNNN` (counter atomik) dalam 1 transaksi. */
  async function create(input: CreateSkalaRisikoInput, _actor: Actor): Promise<SkalaRisikoDTO> {
    const row = await transaction(async (tx) => {
      const seq = await dal.nextSkalaSeq(scope, tx);
      const data: SkalaData = {
        kode: formatKode(seq),
        nama: input.nama,
        singkat: input.singkat ?? "",
        deskripsi: input.deskripsi ?? "",
        referensi: input.referensi ?? "",
        kategori,
        scoringMode: input.scoringMode ?? "sum_items",
        arah: input.arah ?? "higher_is_worse",
        totalMax: input.totalMax ?? 0,
        items: input.items ?? [],
        interpretasi: input.interpretasi ?? [],
        konsumenModul: input.konsumenModul ?? [],
        status: input.status ?? "Aktif",
      };
      return dal.create(data, tx);
    });
    return toDTO(row);
  }

  /** Ubah 1 skala (parsial). Kode immutable (auto-gen). */
  async function update(id: string, input: UpdateSkalaRisikoInput, _actor: Actor): Promise<SkalaRisikoDTO> {
    const existing = await dal.findById(id);
    if (!existing) throw Errors.notFound("Skala tidak ditemukan");

    const patch: SkalaPatch = {};
    setDefined(patch, "nama", input.nama);
    setDefined(patch, "singkat", input.singkat);
    setDefined(patch, "deskripsi", input.deskripsi);
    setDefined(patch, "referensi", input.referensi);
    setDefined(patch, "scoringMode", input.scoringMode);
    setDefined(patch, "arah", input.arah);
    setDefined(patch, "totalMax", input.totalMax);
    if (input.items !== undefined) patch.items = input.items;
    if (input.interpretasi !== undefined) patch.interpretasi = input.interpretasi;
    setDefined(patch, "konsumenModul", input.konsumenModul);
    setDefined(patch, "status", input.status);

    const row = await dal.update(id, patch);
    return toDTO(row);
  }

  /** Soft-delete 1 skala. */
  async function remove(id: string, _actor: Actor): Promise<void> {
    const count = await dal.softDelete(id);
    if (count === 0) throw Errors.notFound("Skala tidak ditemukan");
  }

  return { list, create, update, remove };
}
