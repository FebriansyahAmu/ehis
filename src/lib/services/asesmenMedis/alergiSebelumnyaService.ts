// alergiSebelumnyaService — Alergi longitudinal untuk panel "Riwayat Alergi Sebelumnya"
// + carry-forward. Mengembalikan alergi aktif dari kunjungan LAIN pasien (bukan kunjungan
// aktif), di-dedup per allergen (terbaru menang) + provenance. ACTOR-LESS (SSR-safe).
// Pintu = kunjungan dibuka (divalidasi ∈ unit di Route); agregasi lintas-unit pasien sama.

import * as kunjunganDal from "@/lib/dal/kunjunganDal";
import * as alergiDal from "@/lib/dal/asesmenMedis/asesmenAlergiDal";
import { Errors } from "@/lib/errors/appError";
import type { Actor } from "@/lib/auth/actor";
import type {
  AlergiSebelumnyaDTO, AlergiSebelumnyaItemDTO,
} from "@/lib/schemas/asesmenMedis/alergiSebelumnya";
import type {
  AlergiKategori, AlergiSeverity, AlergiStatus,
} from "@/lib/schemas/asesmenMedis/asesmenAlergi";

const UNIT_LABEL: Record<string, string> = {
  IGD: "IGD", RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap",
};

function jakartaDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

interface KunjunganMeta { noKunjungan: string; unit: string; unitLabel: string }

export function makeAlergiSebelumnyaService() {
  async function getAlergi(kunjunganId: string, _actor: Actor): Promise<AlergiSebelumnyaDTO> {
    const cur = await kunjunganDal.findById(kunjunganId);
    if (!cur) throw Errors.notFound("Kunjungan tidak ditemukan");

    const { items: kunjungan } = await kunjunganDal.listByUnitStatus({ patientId: cur.patientId, limit: 100 });
    // Kunjungan LAIN (bukan yang sedang dibuka) → sumber riwayat alergi.
    const others = kunjungan.filter((k) => k.id !== kunjunganId);
    const meta = new Map<string, KunjunganMeta>(
      others.map((k) => [k.id, {
        noKunjungan: k.noKunjungan, unit: k.unit, unitLabel: UNIT_LABEL[k.unit] ?? k.unit,
      }]),
    );
    const otherIds = others.map((k) => k.id);

    const [rows, nkaRows] = await Promise.all([
      alergiDal.listByKunjunganIds(otherIds),
      alergiDal.listNkaTrueByKunjunganIds(otherIds),
    ]);

    // Dedup per allergen (case-insensitive) — rows sudah terbaru→terlama, ambil yang pertama.
    const seen = new Set<string>();
    const items: AlergiSebelumnyaItemDTO[] = [];
    for (const r of rows) {
      const m = meta.get(r.kunjunganId);
      if (!m) continue;
      const key = r.allergen.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        sourceId: r.id,
        kunjunganId: r.kunjunganId,
        noKunjungan: m.noKunjungan,
        unit: m.unit,
        unitLabel: m.unitLabel,
        tanggal: jakartaDate(r.createdAt),
        pemeriksa: r.pemeriksa,
        category: r.category as AlergiKategori,
        allergen: r.allergen,
        reactions: r.reactions,
        severity: r.severity as AlergiSeverity,
        status: r.status as AlergiStatus,
        keterangan: r.keterangan,
        snomedCode: r.snomedCode,
        bzaKode: r.bzaKode,
      });
    }

    return {
      kunjunganId,
      patientId: cur.patientId,
      nkaSebelumnya: nkaRows.length > 0,
      items,
    };
  }

  return { getAlergi };
}

export const alergiSebelumnyaService = makeAlergiSebelumnyaService();
