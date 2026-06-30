// riwayatSebelumnyaService — agregasi longitudinal 9 domain Riwayat Medis untuk panel
// "Riwayat Sebelumnya" (read-only) di samping form. Per domain: asesmen terbaru per
// kunjungan, lintas semua kunjungan pasien + ringkasan singkat. ACTOR-LESS (SSR-safe).
// Pintu = kunjungan dibuka (divalidasi ∈ unit di Route); agregasi lintas-unit pasien sama.

import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as penyakitDahuluDal from "@/lib/dal/asesmenMedis/asesmenPenyakitDahuluDal";
import * as obatDal from "@/lib/dal/asesmenMedis/asesmenObatDal";
import * as gayaHidupDal from "@/lib/dal/asesmenMedis/asesmenGayaHidupDal";
import * as faktorResikoDal from "@/lib/dal/asesmenMedis/asesmenFaktorResikoDal";
import * as penyakitKeluargaDal from "@/lib/dal/asesmenMedis/asesmenPenyakitKeluargaDal";
import * as tuberkulosisDal from "@/lib/dal/asesmenMedis/asesmenTuberkulosisDal";
import * as ginekologiDal from "@/lib/dal/asesmenMedis/asesmenGinekologiDal";
import * as perawatanDal from "@/lib/dal/asesmenMedis/asesmenPerawatanDal";
import * as obstetriDal from "@/lib/dal/asesmenMedis/asesmenObstetriDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  RiwayatSebelumnyaDTO, RiwayatEpisodeDTO, RiwayatDomainKey,
} from "@/lib/schemas/asesmenMedis/riwayatSebelumnya";

const UNIT_LABEL: Record<string, string> = {
  IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap",
};

function jakartaDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

interface KunjunganMeta { noKunjungan: string; unit: string; unitLabel: string; poli: string | null }
type Row = { kunjunganId: string; createdAt: Date; pemeriksa: string };

/** Bangun episode (terbaru dulu) untuk satu domain dari baris latest-per-kunjungan. */
function buildEpisodes<T extends Row>(
  rows: T[], meta: Map<string, KunjunganMeta>, currentId: string, summarize: (r: T) => string,
): RiwayatEpisodeDTO[] {
  return [...rows]
    .filter((r) => meta.has(r.kunjunganId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((r) => {
      const m = meta.get(r.kunjunganId)!;
      return {
        kunjunganId: r.kunjunganId,
        noKunjungan: m.noKunjungan,
        unit: m.unit,
        unitLabel: m.unitLabel,
        poli: m.poli,
        tanggal: jakartaDate(r.createdAt),
        isCurrent: r.kunjunganId === currentId,
        pemeriksa: r.pemeriksa,
        summary: summarize(r) || "—",
      };
    });
}

const dash = (v: string | null | undefined) => (v && v.trim() ? v.trim() : "");
const ynLabel = (v: boolean | null) => (v === true ? "Ya" : v === false ? "Tidak" : "");
const MEROKOK_LABEL: Record<string, string> = { ya: "Perokok aktif", tidak: "Tidak merokok", mantan: "Mantan perokok" };

export function makeRiwayatSebelumnyaService() {
  async function getRiwayat(kunjunganId: string, _actor: Actor): Promise<RiwayatSebelumnyaDTO> {
    const cur = await kunjunganDal.findById(kunjunganId);
    if (!cur) throw Errors.notFound("Kunjungan tidak ditemukan");

    const { items } = await kunjunganDal.listByUnitStatus({ patientId: cur.patientId, limit: 100 });
    const meta = new Map<string, KunjunganMeta>(
      items.map((k) => [k.id, {
        noKunjungan: k.noKunjungan, unit: k.unit,
        unitLabel: UNIT_LABEL[k.unit] ?? k.unit, poli: k.poli ?? null,
      }]),
    );
    const ids = items.map((k) => k.id);

    const [pd, ob, gh, fr, pk, tb, gn, pr, obs] = await Promise.all([
      penyakitDahuluDal.listLatestByKunjunganIds(ids),
      obatDal.listLatestByKunjunganIds(ids),
      gayaHidupDal.listLatestByKunjunganIds(ids),
      faktorResikoDal.listLatestByKunjunganIds(ids),
      penyakitKeluargaDal.listLatestByKunjunganIds(ids),
      tuberkulosisDal.listLatestByKunjunganIds(ids),
      ginekologiDal.listLatestByKunjunganIds(ids),
      perawatanDal.listLatestByKunjunganIds(ids),
      obstetriDal.listLatestByKunjunganIds(ids),
    ]);

    const domains: Record<RiwayatDomainKey, RiwayatEpisodeDTO[]> = {
      penyakitDahulu: buildEpisodes(pd, meta, kunjunganId, (r) =>
        r.penyakit.length ? r.penyakit.join(", ") : (dash(r.catatan) ? "Ada catatan" : "")),
      obat: buildEpisodes(ob, meta, kunjunganId, (r) =>
        r.items.length ? `${r.items.length} obat: ${r.items.slice(0, 3).map((i) => i.nama).join(", ")}${r.items.length > 3 ? "…" : ""}` : ""),
      gayaHidup: buildEpisodes(gh, meta, kunjunganId, (r) =>
        [r.merokokStatus ? (MEROKOK_LABEL[r.merokokStatus] ?? r.merokokStatus) : "", r.paparanAsap ? "paparan asap +" : ""].filter(Boolean).join(" · ")),
      faktorResiko: buildEpisodes(fr, meta, kunjunganId, (r) =>
        [...r.penyakit, ...r.perilaku, dash(r.penyakitLain), dash(r.perilakuLain)].filter(Boolean).join(", ")),
      penyakitKeluarga: buildEpisodes(pk, meta, kunjunganId, (r) => {
        const n = r.items.filter((i) => i.penyakit.length > 0 || dash(i.keterangan)).length;
        return n ? `${n} anggota berisiko` : (dash(r.riwayatLain) ? "Ada catatan" : "");
      }),
      tuberkulosis: buildEpisodes(tb, meta, kunjunganId, (r) =>
        r.riwayatTbc === null ? "" : `Riwayat TBC: ${ynLabel(r.riwayatTbc)}${r.tcmHasil ? ` · TCM ${r.tcmHasil}` : ""}`),
      ginekologi: buildEpisodes(gn, meta, kunjunganId, (r) =>
        [dash(r.statusMenstruasi), r.papSmear ? "Pap +" : "", r.iva ? "IVA +" : ""].filter(Boolean).join(" · ")),
      perawatan: buildEpisodes(pr, meta, kunjunganId, (r) =>
        `${r.rawatItems.length} rawat · ${r.pembedahanItems.length} operasi`),
      obstetri: buildEpisodes(obs, meta, kunjunganId, (r) =>
        `G${dash(r.gravida) || "-"} P${dash(r.para) || "-"} A${dash(r.abortus) || "-"}${r.persalinanItems.length ? ` · ${r.persalinanItems.length} persalinan` : ""}`),
    };

    return { kunjunganId, patientId: cur.patientId, domains };
  }

  return { getRiwayat };
}

export const riwayatSebelumnyaService = makeRiwayatSebelumnyaService();
