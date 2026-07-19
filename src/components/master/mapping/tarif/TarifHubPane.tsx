"use client";

// Wadah 3 sub-tab Tarif (segmented, pola Ketersediaan Farmasi):
//   • Matriks Layanan  → Tarif Matrix eksisting (Tindakan/Lab/Rad × Penjamin × Jenis Ruangan)
//   • Ruang Rawat      → tarif akomodasi/hari per (Kelas × Penjamin)
//   • Administrasi     → biaya administrasi/kunjungan per (Unit × Penjamin)
// Hanya sub-tab aktif yang di-mount. Matriks menerima SSR props; 2 sub-tab baru client-fetch on mount.

import { useState } from "react";
import { Table2, BedDouble, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import type { TindakanDTO } from "@/lib/api/master/tindakan";
import type { LabTestDTO } from "@/lib/api/master/labTest";
import type { RadCatalogDTO } from "@/lib/api/master/radCatalog";
import type { TarifTindakanDTO } from "@/lib/schemas/master/tarifTindakan";
import type { TarifLabTestDTO } from "@/lib/schemas/master/tarifLabTest";
import type { TarifRadCatalogDTO } from "@/lib/schemas/master/tarifRadCatalog";
import {
  listAllTarifKamar, upsertTarifKamar, deleteTarifKamar, type UpsertTarifKamarInput,
} from "@/lib/api/master/tarifKamar";
import {
  listAllTarifAdministrasi, upsertTarifAdministrasi, deleteTarifAdministrasi,
  type UpsertTarifAdministrasiInput,
} from "@/lib/api/master/tarifAdministrasi";
import TarifPane from "./TarifPane";
import TarifSimplePane from "./simpleTarif/TarifSimplePane";
import {
  type SimpleTarifConfig, type SimpleTarifEdge, KELAS_ROWS, UNIT_ROWS,
} from "./simpleTarif/tarifSimpleShared";
import type { TarifInput } from "./tarifShared";

type View = "matriks" | "kamar" | "administrasi";

interface Props {
  tindakan?: TindakanDTO[];
  lab?: LabTestDTO[];
  rad?: RadCatalogDTO[];
  tree?: AnyNode[];
  tarif?: TarifTindakanDTO[];
  tarifLab?: TarifLabTestDTO[];
  tarifRad?: TarifRadCatalogDTO[];
}

// input.jasaSarana != null → mode breakdown (kirim 3 komponen; server set harga = jumlah); else total-only.
const komponenOf = (input: TarifInput) =>
  input.jasaSarana != null
    ? { jasaSarana: input.jasaSarana, jasaMedis: input.jasaMedis ?? 0, jasaParamedis: input.jasaParamedis ?? 0 }
    : {};

// ── Config sub-tab Ruang Rawat ──────────────────────────
const KAMAR_CONFIG: SimpleTarifConfig = {
  id: "kamar",
  title: "Tarif Ruang Rawat",
  subtitle: "Akomodasi kamar per hari, per kelas. Basis tagihan akomodasi RI (kelasHak/kelas).",
  rowHeader: "Kelas",
  unitSuffix: "/hari",
  rows: KELAS_ROWS,
  listAll: async (signal) =>
    (await listAllTarifKamar(signal)).map((d): SimpleTarifEdge => ({
      id: d.id, rowKey: d.kelas, penjaminKode: d.penjaminKode,
      harga: d.harga, jasaSarana: d.jasaSarana, jasaMedis: d.jasaMedis, jasaParamedis: d.jasaParamedis,
      noSk: d.noSk, tglSk: d.tglSk,
    })),
  upsert: async (rowKey, penjaminKode, input) => {
    const d = await upsertTarifKamar({
      kelas: rowKey as UpsertTarifKamarInput["kelas"], penjaminKode, harga: input.harga, ...komponenOf(input),
      noSk: input.noSk ?? undefined, tglSk: input.tglSk ?? undefined,
    });
    return { id: d.id, rowKey: d.kelas, penjaminKode: d.penjaminKode, harga: d.harga, jasaSarana: d.jasaSarana, jasaMedis: d.jasaMedis, jasaParamedis: d.jasaParamedis, noSk: d.noSk, tglSk: d.tglSk };
  },
  remove: (id) => deleteTarifKamar(id),
};

// ── Config sub-tab Administrasi ─────────────────────────
const ADMIN_CONFIG: SimpleTarifConfig = {
  id: "administrasi",
  title: "Tarif Administrasi",
  subtitle: "Biaya administrasi/pendaftaran per kunjungan, per unit layanan.",
  rowHeader: "Unit",
  rows: UNIT_ROWS,
  listAll: async (signal) =>
    (await listAllTarifAdministrasi(signal)).map((d): SimpleTarifEdge => ({
      id: d.id, rowKey: d.unit, penjaminKode: d.penjaminKode,
      harga: d.harga, jasaSarana: d.jasaSarana, jasaMedis: d.jasaMedis, jasaParamedis: d.jasaParamedis,
      noSk: d.noSk, tglSk: d.tglSk,
    })),
  upsert: async (rowKey, penjaminKode, input) => {
    const d = await upsertTarifAdministrasi({
      unit: rowKey as UpsertTarifAdministrasiInput["unit"], penjaminKode, harga: input.harga, ...komponenOf(input),
      noSk: input.noSk ?? undefined, tglSk: input.tglSk ?? undefined,
    });
    return { id: d.id, rowKey: d.unit, penjaminKode: d.penjaminKode, harga: d.harga, jasaSarana: d.jasaSarana, jasaMedis: d.jasaMedis, jasaParamedis: d.jasaParamedis, noSk: d.noSk, tglSk: d.tglSk };
  },
  remove: (id) => deleteTarifAdministrasi(id),
};

export default function TarifHubPane(props: Props) {
  const [view, setView] = useState<View>("matriks");

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm">
        <SegTab active={view === "matriks"} onClick={() => setView("matriks")} icon={Table2} label="Matriks Layanan" sub="Tindakan · Lab · Rad" />
        <SegTab active={view === "kamar"} onClick={() => setView("kamar")} icon={BedDouble} label="Ruang Rawat" sub="Akomodasi/hari" />
        <SegTab active={view === "administrasi"} onClick={() => setView("administrasi")} icon={ReceiptText} label="Administrasi" sub="Per kunjungan" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {view === "matriks" && <TarifPane {...props} />}
        {view === "kamar" && <TarifSimplePane config={KAMAR_CONFIG} />}
        {view === "administrasi" && <TarifSimplePane config={ADMIN_CONFIG} />}
      </div>
    </div>
  );
}

function SegTab({
  active, onClick, icon: Icon, label, sub,
}: {
  active: boolean; onClick: () => void; icon: typeof Table2; label: string; sub: string;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 transition",
        active ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon size={14} className={active ? "text-amber-600" : "text-slate-400"} />
      <div className="text-left">
        <p className={cn("m-xs font-bold leading-tight", active ? "text-slate-900" : "text-slate-500")}>{label}</p>
        <p className="m-mini leading-tight text-slate-400">{sub}</p>
      </div>
    </button>
  );
}
