"use client";

// Workspace detail order Radiologi (client) — fetch order + hasil dari DB, petakan ke bentuk
// `RadOrder` (yang dikonsumsi desain RadOrderHeader + RadOrderTabs TANPA mengubah desain), kelola
// state + refetch. Ekspertise/Validasi pane menulis ke DB via API; refetch menyegarkan tampilan.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Radiation, ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getRadOrder, type RadOrderWorklistDTO } from "@/lib/api/rad/radOrder";
import { getRadResult } from "@/lib/api/rad/radResult";
import { getRadAkuisisi } from "@/lib/api/rad/radAkuisisi";
import type { RadResultDTO } from "@/lib/schemas/rad/radResult";
import type { RadAkuisisiDTO } from "@/lib/schemas/rad/radAkuisisi";
import {
  type RadOrder, type RadStatus, type Modalitas, type UrgensisRad, type UnitAsalRad,
  type CriticalKategori, type EkspertasiData, type ValidasiData, type AkuisisiData,
} from "./radShared";
import RadOrderHeader from "./RadOrderHeader";
import RadOrderTabs from "./RadOrderTabs";

// ── Pemetaan enum DB → vokabuler desain (mock RadOrder) ──
const MODALITAS_MAP: Record<string, Modalitas> = {
  XR: "Konvensional", CT: "CT", MR: "MRI", RF: "Fluoroskopi",
  US: "USG", MG: "Mammografi", DXA: "DEXA", NM: "Konvensional",
};
const STATUS_MAP: Record<string, RadStatus> = {
  Menunggu: "Menunggu", Diterima: "Akuisisi", Diperiksa: "Akuisisi",
  Divalidasi: "Verifikasi_Hasil", Selesai: "Selesai", Ditolak: "Ditolak", Dibatalkan: "Ditolak",
};
const PRIO_MAP: Record<string, UrgensisRad> = { CITO: "CITO", Segera: "Semi_Cito", Rutin: "Rutin" };
const UNIT_MAP: Record<string, UnitAsalRad> = { IGD: "IGD", "Rawat Inap": "Rawat Inap", "Rawat Jalan": "Rawat Jalan" };

function hitungUsia(tglLahir: string | null): number {
  if (!tglLahir) return 0;
  const t = new Date(tglLahir); const now = new Date();
  let u = now.getFullYear() - t.getFullYear();
  const m = now.getMonth() - t.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < t.getDate())) u--;
  return Math.max(u, 0);
}

function toEkspertasi(r: RadResultDTO, finalized: boolean): EkspertasiData {
  return {
    indikasiKlinis: r.indikasiKlinis,
    teknik: r.teknik,
    temuan: r.temuan,
    kesan: r.kesan,
    saran: r.saran ?? undefined,
    spradNama: r.radiolog,
    spradSIP: r.radiologSip ?? "",
    criticalFindings: r.criticalFindings.map((f) => ({
      id: f.id,
      kategori: f.kategori as CriticalKategori,
      deskripsi: f.deskripsi,
      metode: f.metode ?? undefined,
      namaDokter: f.namaDokter ?? undefined,
      jamLapor: f.jamLapor ?? undefined,
      pelapor: f.pelapor ?? undefined,
      confirmed: f.confirmed,
    })),
    isDraft: !finalized,
    isDone: finalized,
  };
}

function toAkuisisi(a: RadAkuisisiDTO): AkuisisiData {
  const pt = a.paramTeknis ?? {};
  return {
    kvp: pt.kvp, mas: pt.mas, fov: pt.fov, slice: pt.slice,
    probe: pt.probe, frekuensi: pt.frekuensi,
    sekuens: pt.sekuens,
    kv: pt.kv, mAs: pt.mAs,
    radiografer: a.radiografer,
    proteksi: a.proteksi ?? { apron: false, collar: false, gonadShield: false },
    dosis: a.dosis ?? undefined,
    isDone: true,
  };
}

function toValidasi(r: RadResultDTO): ValidasiData | undefined {
  if (!r.validatedAt) return undefined;
  return {
    catatan: r.catatanValidator ?? undefined,
    checkKlinis: true,
    checkLengkap: true,
    validator: r.validator ?? "",
    waktu: r.validatedAt,
    isDone: true,
  };
}

/** Petakan DTO order + hasil + akuisisi DB → bentuk RadOrder (mock) yang dikonsumsi desain. */
function mapToRadOrder(
  dto: RadOrderWorklistDTO,
  result: RadResultDTO | null,
  akuisisi: RadAkuisisiDTO | null,
): RadOrder {
  const created = new Date(dto.createdAt);
  const finalized = dto.status === "Divalidasi" || dto.status === "Selesai";
  return {
    id: dto.id,
    noOrder: dto.noOrder,
    noRM: dto.noRM,
    namaPasien: dto.namaPasien,
    tanggalLahir: dto.tanggalLahir ?? "",
    usia: hitungUsia(dto.tanggalLahir),
    gender: dto.gender,
    tanggal: dto.createdAt.slice(0, 10),
    jam: created.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    dokter: dto.penulis,
    unitAsal: UNIT_MAP[dto.unit] ?? "IGD",
    prioritas: PRIO_MAP[dto.prioritas] ?? "Rutin",
    status: STATUS_MAP[dto.status] ?? "Menunggu",
    items: dto.items.map((it) => ({
      id: it.id,
      kode: it.kode,
      nama: it.nama,
      modalitas: MODALITAS_MAP[it.modalitas] ?? "Konvensional",
      region: it.region,
      withKontras: false,
    })),
    catatan: dto.catatan ?? undefined,
    akuisisi: akuisisi ? toAkuisisi(akuisisi) : undefined,
    ekspertasi: result ? toEkspertasi(result, finalized) : undefined,
    validasi: result ? toValidasi(result) : undefined,
    timestamps: {
      order: dto.createdAt,
      akuisisiMulai: akuisisi?.mulaiAt ?? undefined,
      akuisisiSelesai: akuisisi?.selesaiAt ?? undefined,
      verifikasiHasil: result && finalized ? result.createdAt : undefined,
      rilis: result?.validatedAt ?? undefined,
    },
  };
}

type View =
  | { kind: "loading" }
  | { kind: "ready"; order: RadOrder }
  | { kind: "notfound" }
  | { kind: "error"; msg: string };

export default function RadOrderWorkspace({ id }: { id: string }) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const dto = await getRadOrder(id, ac.signal);
        if (ac.signal.aborted) return;
        let result: RadResultDTO | null = null;
        let akuisisi: RadAkuisisiDTO | null = null;
        try { result = await getRadResult(id, ac.signal); } catch { /* belum ada / tak berhak baca */ }
        try { akuisisi = await getRadAkuisisi(id, ac.signal); } catch { /* belum ada / tak berhak baca */ }
        if (ac.signal.aborted) return;
        setView({ kind: "ready", order: mapToRadOrder(dto, result, akuisisi) });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setView(e instanceof ApiError && e.status === 404
          ? { kind: "notfound" }
          : { kind: "error", msg: e instanceof ApiError ? e.message : "Gagal memuat order" });
      }
    })();
    return () => ac.abort();
  }, [id, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  if (view.kind === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 size={20} className="animate-spin text-teal-500" aria-hidden="true" />
        <span className="text-sm">Memuat order…</span>
      </div>
    );
  }

  if (view.kind !== "ready") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Radiation size={28} className="text-slate-300" aria-hidden="true" />
        <p className="font-medium text-slate-600">
          {view.kind === "notfound" ? "Order radiologi tidak ditemukan" : "Gagal memuat order"}
        </p>
        {view.kind === "error" && <p className="text-sm text-slate-400">{view.msg}</p>}
        <Link
          href="/ehis-care/radiologi"
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
        >
          <ArrowLeft size={13} aria-hidden="true" />Kembali ke Radiologi
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <RadOrderHeader order={view.order} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <RadOrderTabs order={view.order} onRefresh={refresh} />
      </div>
    </div>
  );
}
