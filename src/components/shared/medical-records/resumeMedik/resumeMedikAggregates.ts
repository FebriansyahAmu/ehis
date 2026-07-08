// Agregator Resume Medik — SHARED (RI · RJ). Tarik data klinis NYATA per kunjungan dari domain
// DB (Observation/Diagnosa+Prosedur/TindakanMedis/Resep/LabResult/RadResult) → view-model
// ResumeMedikData (TTV masuk vs pulang · lab abnormal · rad · obat · tindakan). Tiap sumber
// independen & toleran gagal (gagal 1 domain ≠ gagal semua). Unit-agnostic: dipanggil pane RI/RJ
// saat kunjunganId = UUID (pasien nyata); demo tetap mock.

import { listObservasi, type ObservationDTO } from "@/lib/api/observation";
import { getDiagnosa } from "@/lib/api/diagnosa/diagnosa";
import { getTindakanMedis } from "@/lib/api/tindakanMedis/tindakanMedis";
import { listResep } from "@/lib/api/resep/resep";
import { listLabOrders } from "@/lib/api/lab/labOrder";
import { getLabResultForKunjungan } from "@/lib/api/lab/labResult";
import { listRadOrders } from "@/lib/api/rad/radOrder";
import { getRadResultForKunjungan } from "@/lib/api/rad/radResult";
import type { IGDDiagnosa } from "@/lib/data";
import type {
  TVVSummaryItem, HasilLabSummary, HasilRadSummary, ObatSelamaRawat, TindakanResume,
  ObatPulangItem,
} from "./resumeMedikTypes";

export interface ResumeAggregates {
  ttvMasuk: TVVSummaryItem | null;
  ttvPulang: TVVSummaryItem | null;
  hasilLabAbnormal: HasilLabSummary[];
  hasilRad: HasilRadSummary[];
  obatSelamaRawat: ObatSelamaRawat[];
  /** Obat pulang NYATA = item order resep ber-flag isObatPulang (non-batal) — sumber
   *  ceklis kelengkapan "Minimal 1 obat pulang" + counter header (RI). */
  obatPulang: ObatPulangItem[];
  tindakan: TindakanResume[];
  diagnosa: IGDDiagnosa[];
  /** Meta observasi — deteksi "TTV pulang belum/kedaluwarsa" (banner catat cepat). */
  obsCount: number;
  lastObsAt: string | null; // ISO waktuObservasi terakhir
}

// ── Helpers format ────────────────────────────────────────────────────────────

function fmtTgl(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Mapper per sumber ─────────────────────────────────────────────────────────

export function obsToTtv(o: ObservationDTO, label: "Masuk" | "Pulang"): TVVSummaryItem {
  const vs = o.vitalSigns;
  return {
    label,
    tanggal: `${fmtTgl(o.waktuObservasi)} ${o.jam}`,
    tekananDarah: `${vs.tdSistolik}/${vs.tdDiastolik}`,
    nadi: vs.nadi,
    rr: vs.respirasi,
    suhu: vs.suhu,
    spo2: vs.spo2,
    gcs: vs.gcsEye + vs.gcsVerbal + vs.gcsMotor,
    kesadaran: o.statusKesadaran,
  };
}

const LAB_FLAG: Record<string, HasilLabSummary["flag"]> = { H: "tinggi", L: "rendah", C: "kritis" };
const ORDER_SKIP = new Set(["Dibatalkan", "Ditolak"]);
/** Order lab/rad yang hasilnya mungkin sudah ada (hemat request hasil). */
const ORDER_HAS_RESULT = new Set(["Divalidasi", "Selesai"]);

// ── Fetcher utama ─────────────────────────────────────────────────────────────

export async function fetchResumeAggregates(
  kunjunganId: string, signal?: AbortSignal,
): Promise<ResumeAggregates> {
  const [obsR, diagR, tindakanR, resepR, labR, radR] = await Promise.allSettled([
    listObservasi(kunjunganId, signal),
    getDiagnosa(kunjunganId, signal),
    getTindakanMedis(kunjunganId, signal),
    listResep(kunjunganId, signal),
    listLabOrders(kunjunganId, signal),
    listRadOrders(kunjunganId, signal),
  ]);

  // TTV: observasi pertama = masuk, terakhir = pulang (bila ≥2 entri).
  let ttvMasuk: TVVSummaryItem | null = null;
  let ttvPulang: TVVSummaryItem | null = null;
  let obsCount = 0;
  let lastObsAt: string | null = null;
  if (obsR.status === "fulfilled" && obsR.value.length > 0) {
    const sorted = [...obsR.value].sort(
      (a, b) => new Date(a.waktuObservasi).getTime() - new Date(b.waktuObservasi).getTime(),
    );
    obsCount = sorted.length;
    lastObsAt = sorted[sorted.length - 1].waktuObservasi;
    ttvMasuk = obsToTtv(sorted[0], "Masuk");
    if (sorted.length > 1) ttvPulang = obsToTtv(sorted[sorted.length - 1], "Pulang");
  }

  // Diagnosa (ICD-10) + prosedur terkode (ICD-9) dari tab Diagnosa.
  const diagnosa: IGDDiagnosa[] = [];
  const tindakan: TindakanResume[] = [];
  if (diagR.status === "fulfilled") {
    for (const d of diagR.value.items) {
      diagnosa.push({
        id: d.id, kodeIcd10: d.kodeIcd10, namaDiagnosis: d.namaDiagnosis,
        tipe: d.tipe, status: d.status,
      });
    }
    for (const p of diagR.value.prosedur) {
      tindakan.push({ kodeIcd9: p.kode, namaTindakan: p.nama, tanggal: fmtTgl(p.createdAt) });
    }
  }

  // Tindakan medis (tab Tindakan) — gabung, dedupe by kode+nama.
  if (tindakanR.status === "fulfilled") {
    const seen = new Set(tindakan.map(t => `${t.kodeIcd9}|${t.namaTindakan}`.toLowerCase()));
    for (const t of tindakanR.value) {
      const key = `${t.kode}|${t.nama}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tindakan.push({ kodeIcd9: t.kode || "—", namaTindakan: t.nama, tanggal: fmtTgl(t.dilakukanPada) });
    }
  }

  // Obat selama rawat — flatten item resep non-batal (mulai = tgl order; akhir = + durasi).
  // Order ber-flag isObatPulang juga dipetakan ke daftar obat pulang (ceklis resume).
  const obatSelamaRawat: ObatSelamaRawat[] = [];
  const obatPulang: ObatPulangItem[] = [];
  if (resepR.status === "fulfilled") {
    for (const order of resepR.value) {
      if (order.status === "Dibatalkan") continue;
      for (const it of order.items) {
        const mulai = new Date(order.createdAt);
        const akhir = it.durasiHari > 0
          ? new Date(mulai.getTime() + it.durasiHari * 86400000)
          : null;
        obatSelamaRawat.push({
          namaObat: it.namaObat,
          dosis: it.dosisSekali || it.dosis || it.signa || "—",
          rute: it.rute || "—",
          mulaiTanggal: fmtTgl(order.createdAt),
          akhirTanggal: akhir ? fmtTgl(akhir.toISOString()) : "—",
          isHAM: it.isHAM,
        });
        if (order.isObatPulang) {
          obatPulang.push({
            id: it.id,
            namaObat: it.namaObat,
            dosis: it.dosisSekali || it.dosis || "",
            frekuensi: it.signa || "",
            durasi: it.durasiHari > 0 ? `${it.durasiHari} hari` : "",
            instruksi: it.aturanPakai || it.keterangan || "",
            isHAM: it.isHAM,
            fromResep: true,
          });
        }
      }
    }
  }

  // Lab abnormal — hasil order selesai/divalidasi, hanya flag H/L/C.
  const hasilLabAbnormal: HasilLabSummary[] = [];
  if (labR.status === "fulfilled") {
    const done = labR.value.filter(o => !ORDER_SKIP.has(o.status) && ORDER_HAS_RESULT.has(o.status));
    const results = await Promise.allSettled(
      done.map(o => getLabResultForKunjungan(kunjunganId, o.id, signal)),
    );
    for (const r of results) {
      if (r.status !== "fulfilled" || !r.value) continue;
      for (const v of r.value.values) {
        const flag = v.flag ? LAB_FLAG[v.flag] : undefined;
        if (!flag || !v.nilai) continue;
        hasilLabAbnormal.push({
          nama: v.nama, nilai: v.nilai, satuan: v.satuan,
          rujukan: v.rujukanStr, flag, tanggal: fmtTgl(r.value.createdAt),
        });
      }
    }
  }

  // Rad — ekspertise terbit (kesan) per order.
  const hasilRad: HasilRadSummary[] = [];
  if (radR.status === "fulfilled") {
    const done = radR.value.filter(o => !ORDER_SKIP.has(o.status) && ORDER_HAS_RESULT.has(o.status));
    const results = await Promise.allSettled(
      done.map(async o => ({ order: o, hasil: await getRadResultForKunjungan(kunjunganId, o.id, signal) })),
    );
    for (const r of results) {
      if (r.status !== "fulfilled" || !r.value.hasil?.kesan) continue;
      hasilRad.push({
        jenis: r.value.order.items.map(i => i.nama).join(", ") || r.value.order.radNama,
        tanggal: fmtTgl(r.value.hasil.createdAt),
        kesimpulan: r.value.hasil.kesan,
      });
    }
  }

  return {
    ttvMasuk, ttvPulang, hasilLabAbnormal, hasilRad, obatSelamaRawat, obatPulang,
    tindakan, diagnosa, obsCount, lastObsAt,
  };
}

/** Format waktu tanda tangan utk tampilan ("4 Juli 2026, 14.30"). */
export function fmtSignedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
