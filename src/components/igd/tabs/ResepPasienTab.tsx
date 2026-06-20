"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  Pill,
  User,
  Building2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  X,
  Pencil,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Clock,
  Stethoscope,
  Phone,
  Printer,
  ShieldCheck,
} from "lucide-react";
import type { IGDPatientDetail, KategoriObat } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  OBAT_CATALOG, SIGNA_OPTIONS, ATURAN_WAKTU, RUTE_OPTIONS, DEPO_OPTIONS,
  KATEGORI_BADGE, HAM_BADGE, type ObatCatalog, obatTersediaToCatalog,
  getAlergiObatRefs, matchAlergiObatRef, mergeAlergiRefs, type AlergiObatRef, KONDISI_KLINIS_DEFAULT, type KondisiKlinis,
  applyStokDepo, STOK_TEXT, stokLabel,
} from "@/components/shared/resep/resepShared";
import { Select } from "@/components/shared/inputs/Select";
import {
  KondisiKlinisPanel, AlergiObatBanner, AlergiMatchWarning,
} from "@/components/shared/resep/ResepKlinisPanel";
import { getAlergi } from "@/lib/api/asesmenMedis/asesmenAlergi";
import { createResep } from "@/lib/api/resep/resep";
import { listLokasiFarmasi, type LokasiFarmasi } from "@/lib/api/master/lokasiFarmasi";
import { listObatTersedia } from "@/lib/api/master/obatTersedia";
import { listStokKlinis, type StokKlinisRow } from "@/lib/api/inventory/stock";
import { useSession } from "@/contexts/SessionContext";
import ResepCetakModal from "@/components/shared/resep/ResepCetakModal";
import type { ResepCetakData } from "@/components/shared/resep/ResepCetakTemplate";
import TteBarcode from "@/components/shared/resep/TteBarcode";

// Kunjungan terpersist (UUID) → tarik alergi nyata dari DB; pasien demo (igd-*) → mock.
const KUNJUNGAN_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Types ─────────────────────────────────────────────────

type StatusRiwayat = "Selesai" | "Diproses" | "Dikembalikan";

interface ResepItem {
  id: string;
  namaObat: string;
  kodeObat: string;
  dosis: string;
  dosisSekali?: string;
  signa: string;
  jumlah: number;
  rute: string;
  aturanPakai: string;
  keterangan: string;
  kategori: KategoriObat;
  isHAM: boolean;
  historyItemId?: string;
}

interface RiwayatResepItem extends Omit<ResepItem, "id" | "isHAM"> {
  id: string;
  isHAM?: boolean;
}

interface RiwayatResep {
  id: string;
  tanggal: string;
  noResep: string;
  dokter: string;
  unit: string;
  status: StatusRiwayat;
  items: RiwayatResepItem[];
}

// ── Mock riwayat resep per noRM ───────────────────────────

const RIWAYAT_MOCK: Record<string, RiwayatResep[]> = {
  "RM-2025-005": [
    {
      id: "rw-1",
      tanggal: "10 April 2026",
      noResep: "RES/2026/04/0189",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      unit: "Poli Jantung",
      status: "Selesai",
      items: [
        {
          id: "rwi-1",
          namaObat: "Aspirin 100mg",
          kodeObat: "FAR-001",
          dosis: "100 mg",
          signa: "1×1",
          jumlah: 30,
          rute: "Oral",
          aturanPakai: "PC (Sesudah Makan)",
          keterangan: "",
          kategori: "Reguler",
        },
        {
          id: "rwi-2",
          namaObat: "Atorvastatin 20mg",
          kodeObat: "FAR-005",
          dosis: "20 mg",
          signa: "1×1",
          jumlah: 30,
          rute: "Oral",
          aturanPakai: "Malam Hari",
          keterangan: "Minum malam",
          kategori: "Reguler",
        },
        {
          id: "rwi-3",
          namaObat: "Amlodipine 5mg",
          kodeObat: "FAR-008",
          dosis: "5 mg",
          signa: "1×1",
          jumlah: 30,
          rute: "Oral",
          aturanPakai: "Terlepas dari Makan",
          keterangan: "",
          kategori: "Reguler",
        },
      ],
    },
    {
      id: "rw-2",
      tanggal: "25 Maret 2026",
      noResep: "RES/2026/03/0442",
      dokter: "dr. Anisa Putri, Sp.PD",
      unit: "Rawat Jalan",
      status: "Selesai",
      items: [
        {
          id: "rwi-4",
          namaObat: "Metformin 500mg",
          kodeObat: "FAR-007",
          dosis: "500 mg",
          signa: "3×1",
          jumlah: 60,
          rute: "Oral",
          aturanPakai: "PC (Sesudah Makan)",
          keterangan: "Mulai dosis rendah",
          kategori: "Reguler",
        },
        {
          id: "rwi-5",
          namaObat: "Omeprazole 20mg",
          kodeObat: "FAR-009",
          dosis: "20 mg",
          signa: "1×1",
          jumlah: 30,
          rute: "Oral",
          aturanPakai: "AC (Sebelum Makan)",
          keterangan: "",
          kategori: "Reguler",
        },
        {
          id: "rwi-6",
          namaObat: "Furosemide 40mg",
          kodeObat: "FAR-012",
          dosis: "40 mg",
          signa: "1×1",
          jumlah: 14,
          rute: "Oral",
          aturanPakai: "AC (Sebelum Makan)",
          keterangan: "Pantau tekanan",
          kategori: "Reguler",
        },
      ],
    },
    {
      id: "rw-3",
      tanggal: "12 Februari 2026",
      noResep: "RES/2026/02/0091",
      dokter: "dr. Anisa Putri, Sp.PD",
      unit: "IGD",
      status: "Selesai",
      items: [
        {
          id: "rwi-7",
          namaObat: "Clopidogrel 75mg",
          kodeObat: "FAR-004",
          dosis: "75 mg",
          signa: "1×1",
          jumlah: 30,
          rute: "Oral",
          aturanPakai: "PC (Sesudah Makan)",
          keterangan: "",
          kategori: "Reguler",
        },
        {
          id: "rwi-8",
          namaObat: "Morfin 10mg/mL Inj",
          kodeObat: "FAR-016",
          dosis: "10 mg/mL",
          signa: "PRN",
          jumlah: 3,
          rute: "IV Bolus",
          aturanPakai: "Terlepas dari Makan",
          keterangan: "Titrasi 2-4mg",
          kategori: "Narkotika",
        },
      ],
    },
  ],
  "RM-2025-012": [
    {
      id: "rw-4",
      tanggal: "8 April 2026",
      noResep: "RES/2026/04/0155",
      dokter: "dr. Hendra Wijaya, Sp.EM",
      unit: "Rawat Jalan",
      status: "Selesai",
      items: [
        {
          id: "rwi-9",
          namaObat: "Metformin 500mg",
          kodeObat: "FAR-007",
          dosis: "500 mg",
          signa: "2×1",
          jumlah: 60,
          rute: "Oral",
          aturanPakai: "PC (Sesudah Makan)",
          keterangan: "",
          kategori: "Reguler",
        },
        {
          id: "rwi-10",
          namaObat: "Omeprazole 20mg",
          kodeObat: "FAR-009",
          dosis: "20 mg",
          signa: "1×1",
          jumlah: 30,
          rute: "Oral",
          aturanPakai: "AC (Sebelum Makan)",
          keterangan: "",
          kategori: "Reguler",
        },
      ],
    },
  ],
};

// ── Badge styles ──────────────────────────────────────────

const STATUS_RIWAYAT: Record<StatusRiwayat, string> = {
  Selesai: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Diproses: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Dikembalikan: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

// ── Form primitives ───────────────────────────────────────

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
      {required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  "h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300";

// ── Drug search ───────────────────────────────────────────

function ObatSearch({
  value,
  onSelect,
  catalog,
  showStock = true,
}: {
  value: string;
  onSelect: (obat: ObatCatalog) => void;
  /** Sumber katalog. Absen → OBAT_CATALOG mock. Diisi → obat ter-formularium DB (obat-tersedia). */
  catalog?: ObatCatalog[];
  /** Badge stok di hasil. Matikan untuk katalog formularium (tanpa data stok). */
  showStock?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ObatCatalog[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const source = catalog ?? OBAT_CATALOG;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const filtered = source.filter(
      (o) =>
        o.nama.toLowerCase().includes(q.toLowerCase()) ||
        o.kode.toLowerCase().includes(q.toLowerCase()),
    ).slice(0, 7);
    setResults(filtered);
    setOpen(filtered.length > 0);
  };

  const pick = (obat: ObatCatalog) => {
    setQuery(obat.nama);
    setOpen(false);
    onSelect(obat);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() =>
            query.length >= 2 && results.length > 0 && setOpen(true)
          }
          placeholder="Ketik nama obat atau kode FAR-..."
          className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((obat) => (
            <button
              key={obat.kode}
              type="button"
              onClick={() => pick(obat)}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-3 py-2 text-left text-xs last:border-0 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">
                  {obat.nama}
                </p>
                <p className="text-[11px] text-slate-400">
                  {obat.kode} · {obat.dosis} {obat.satuan}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    KATEGORI_BADGE[obat.kategori],
                  )}
                >
                  {obat.kategori}
                </span>
                {obat.stokStatus ? (
                  <span className={cn("text-[10px] font-medium", STOK_TEXT[obat.stokStatus])}>
                    {stokLabel(obat.stokStatus, obat.stok)}
                  </span>
                ) : showStock ? (
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      obat.stok > 0 ? "text-emerald-600" : "text-rose-500",
                    )}
                  >
                    {obat.stok > 0 ? `Stok: ${obat.stok}` : "Habis"}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Resep item row (with inline edit) ────────────────────

function ResepRow({
  item,
  index,
  onRemove,
  onEdit,
  alergiHit,
}: {
  item: ResepItem;
  index: number;
  onRemove: () => void;
  onEdit: (updated: ResepItem) => void;
  alergiHit?: AlergiObatRef | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...item });

  const d = <K extends keyof ResepItem>(k: K, v: ResepItem[K]) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    onEdit(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft({ ...item });
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "animate-fade-in rounded-xl border shadow-xs",
        alergiHit ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200" : "border-slate-200 bg-white",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 p-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
          <Pill size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-semibold text-slate-800">
              {item.namaObat}
            </p>
            {item.isHAM && <span className={HAM_BADGE}>⚠ HAM</span>}
            {alergiHit && (
              <span
                title={`Berpotensi alergi terhadap ${alergiHit.allergen}`}
                className="flex items-center gap-0.5 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
              >
                <AlertTriangle size={9} /> Alergi
              </span>
            )}
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                KATEGORI_BADGE[item.kategori],
              )}
            >
              {item.kategori}
            </span>
            {item.kategori !== "Reguler" && !item.isHAM && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                <AlertCircle size={9} />
                Perlu persetujuan khusus
              </span>
            )}
          </div>
          {!editing && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {item.dosis}
              {item.dosisSekali && (
                <>
                  <span className="mx-1 text-slate-300">·</span>
                  <span className="text-slate-600">{item.dosisSekali}/minum</span>
                </>
              )}
              <span className="mx-1 text-slate-300">·</span>
              <span className="font-semibold text-indigo-600">
                {item.signa}
              </span>
              <span className="mx-1 text-slate-300">·</span>
              {item.aturanPakai}
              <span className="mx-1 text-slate-300">·</span>
              {item.rute}
              {item.keterangan && (
                <span className="ml-1 italic text-slate-400">
                  ({item.keterangan})
                </span>
              )}
            </p>
          )}
          {!editing && alergiHit && (
            <p className="mt-1 flex items-start gap-1 text-[10px] font-medium text-rose-700">
              <AlertTriangle size={10} className="mt-0.5 shrink-0" />
              <span>
                Riwayat alergi: <span className="font-bold">{alergiHit.allergen}</span>
                {alergiHit.reactions.length > 0 && <> — efek: {alergiHit.reactions.join(", ")}</>}
              </span>
            </p>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
              ×{item.jumlah}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
              aria-label="Edit aturan pakai"
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={onRemove}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
              aria-label="Hapus obat"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Inline edit panel */}
      {editing && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-3 pb-3 pt-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
            Edit Aturan Pakai
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Signa
              </p>
              <Select
                value={draft.signa}
                onChange={(v) => d("signa", v)}
                options={SIGNA_OPTIONS.map((s) => ({ value: s.val, label: s.val }))}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Waktu
              </p>
              <Select
                value={draft.aturanPakai}
                onChange={(v) => d("aturanPakai", v)}
                options={[...ATURAN_WAKTU]}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Jumlah
              </p>
              <input
                type="number"
                min={1}
                value={draft.jumlah}
                onChange={(e) =>
                  d("jumlah", Math.max(1, Number(e.target.value)))
                }
                className={INPUT_CLS}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Rute
              </p>
              <Select
                value={draft.rute}
                onChange={(v) => d("rute", v)}
                options={[...RUTE_OPTIONS]}
              />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Dosis Sekali Minum
              </p>
              <input
                value={draft.dosisSekali ?? ""}
                onChange={(e) => d("dosisSekali", e.target.value)}
                placeholder="Mis: 1 tablet, 500 mg"
                className={cn(INPUT_CLS, "w-full")}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Keterangan
              </p>
              <input
                value={draft.keterangan}
                onChange={(e) => d("keterangan", e.target.value)}
                placeholder="Keterangan tambahan..."
                className={cn(INPUT_CLS, "w-full")}
              />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            <button
              onClick={cancel}
              className="flex h-7 items-center gap-1 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100"
            >
              <X size={10} /> Batal
            </button>
            <button
              onClick={save}
              className="flex h-7 items-center gap-1 rounded-md bg-indigo-600 px-3 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
            >
              <Check size={10} /> Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty resep state ─────────────────────────────────────

function EmptyResep() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
        <Pill size={18} />
      </span>
      <p className="text-xs text-slate-400">
        Belum ada obat dalam daftar resep
      </p>
      <p className="text-[11px] text-slate-300">
        Cari obat di form kiri, atau salin dari riwayat di bawah
      </p>
    </div>
  );
}

// ── HAM Double-check Modal ────────────────────────────────

function HAMConfirmModal({
  hamItems,
  onConfirm,
  onCancel,
}: {
  hamItems: ResepItem[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">Double-Check HAM Wajib</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Resep mengandung High-Alert Medication. Konfirmasi double-check sebelum order. SKP 3 · PMK 72/2016
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-600">
              Obat HAM dalam resep ini:
            </p>
            <div className="flex flex-col gap-1.5">
              {hamItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-slate-700">{item.namaObat}</span>
                  <span className="text-[11px] text-slate-400">{item.dosis} · {item.signa}</span>
                </div>
              ))}
            </div>
          </div>

          <label className="mb-5 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-red-600"
            />
            <span className="text-xs leading-relaxed text-slate-700">
              Saya konfirmasi telah dilakukan <strong>double-check</strong> dengan petugas lain sesuai SOP HAM rumah sakit
            </span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={!checked}
              className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Konfirmasi & Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Riwayat resep section ─────────────────────────────────

function RiwayatSection({
  riwayat,
  onCopy,
  onCopyAll,
  copiedIds,
}: {
  riwayat: RiwayatResep[];
  onCopy: (item: RiwayatResepItem) => void;
  onCopyAll: (items: RiwayatResepItem[]) => void;
  copiedIds: Set<string>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set([riwayat[0]?.id]),
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (riwayat.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <Clock size={13} className="text-slate-400" />
        <p className="text-xs font-semibold text-slate-700">
          Riwayat Order Obat
        </p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {riwayat.length} resep
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {riwayat.map((r) => {
          const open = expanded.has(r.id);
          const allCopied = r.items.every((it) => copiedIds.has(it.id));
          const someCopied =
            !allCopied && r.items.some((it) => copiedIds.has(it.id));
          const uncoppied = r.items.filter((it) => !copiedIds.has(it.id));
          return (
            <div key={r.id}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-4 py-2.5 transition hover:bg-slate-50">
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="shrink-0 text-slate-400">
                    {open ? (
                      <ChevronDown size={13} />
                    ) : (
                      <ChevronRight size={13} />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs font-semibold text-slate-700">
                      {r.tanggal}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {r.noResep}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Stethoscope size={10} />
                      {r.dokter}
                    </span>
                    <span className="text-[11px] text-slate-400">{r.unit}</span>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">
                    {r.items.length} obat
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-medium",
                      STATUS_RIWAYAT[r.status],
                    )}
                  >
                    {r.status}
                  </span>
                  {/* Salin Semua button */}
                  <button
                    type="button"
                    onClick={() => !allCopied && onCopyAll(uncoppied)}
                    disabled={allCopied}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                      allCopied
                        ? "cursor-default bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                        : someCopied
                          ? "border border-indigo-300 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          : "border border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600",
                    )}
                  >
                    {allCopied ? (
                      <>
                        <Check size={10} /> Semua Disalin
                      </>
                    ) : someCopied ? (
                      <>
                        <Copy size={10} /> Salin Sisanya ({uncoppied.length})
                      </>
                    ) : (
                      <>
                        <Copy size={10} /> Salin Semua ({r.items.length})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Items list */}
              {open && (
                <div className="border-t border-slate-50 bg-slate-50/40 px-4 pb-3 pt-2">
                  <div className="flex flex-col gap-2">
                    {r.items.map((item) => {
                      const alreadyCopied = copiedIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-400">
                            <Pill size={11} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-xs font-semibold text-slate-800">
                                {item.namaObat}
                              </p>
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                  KATEGORI_BADGE[item.kategori],
                                )}
                              >
                                {item.kategori}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {item.dosis}
                              <span className="mx-1 text-slate-300">·</span>
                              <span className="font-semibold text-indigo-600">
                                {item.signa}
                              </span>
                              <span className="mx-1 text-slate-300">·</span>
                              {item.aturanPakai}
                              <span className="mx-1 text-slate-300">·</span>
                              {item.rute}
                              <span className="mx-1 text-slate-300">·</span>
                              <span className="font-medium text-slate-600">
                                ×{item.jumlah}
                              </span>
                              {item.keterangan && (
                                <span className="ml-1 italic text-slate-400">
                                  ({item.keterangan})
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => !alreadyCopied && onCopy(item)}
                            disabled={alreadyCopied}
                            className={cn(
                              "flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                              alreadyCopied
                                ? "cursor-default bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                                : "border border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600",
                            )}
                          >
                            {alreadyCopied ? (
                              <>
                                <Check size={10} /> Disalin
                              </>
                            ) : (
                              <>
                                <Copy size={10} /> Salin ke Resep
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Default form state ────────────────────────────────────

const EMPTY_FORM = {
  namaObat: "",
  kodeObat: "",
  dosis: "",
  dosisSekali: "",
  signa: "3×1",
  aturanPakai: "PC (Sesudah Makan)",
  rute: "Oral",
  jumlah: 1,
  keterangan: "",
  kategori: "Reguler" as KategoriObat,
  isHAM: false,
};

// ── Main component ────────────────────────────────────────

export default function ResepPasienTab({
  patient,
}: {
  patient: IGDPatientDetail;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [items, setItems] = useState<ResepItem[]>([]);
  const [depo, setDepo] = useState<string>("Depo IGD");
  const [catatan, setCatatan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [showHAMModal, setShowHAMModal] = useState(false);
  const [kondisi, setKondisi] = useState<KondisiKlinis>(KONDISI_KLINIS_DEFAULT);
  const [dbAlergiRefs, setDbAlergiRefs] = useState<AlergiObatRef[]>([]);
  const [lokasiFarmasi, setLokasiFarmasi] = useState<LokasiFarmasi[]>([]);
  const [sending, setSending] = useState(false);
  // Resep tertanda-tangan (TTE) hasil order → dipakai layar sukses + cetak.
  const [signedOrder, setSignedOrder] = useState<ResepCetakData | null>(null);
  const [showCetak, setShowCetak] = useState(false);

  // Hanya dokter (DPJP) yang boleh order resep → gate UI = izin clinical.resep:create.
  // (Perawat/Apoteker hanya read; server tetap penjaga sebenarnya via route().)
  const canOrder = useSession().can("clinical.resep", "create");

  const riwayat = RIWAYAT_MOCK[patient.noRM] ?? [];

  // Depo tujuan = Ruangan kategori Farmasi (master); fallback DEPO_OPTIONS bila kosong/gagal.
  useEffect(() => {
    const ac = new AbortController();
    listLokasiFarmasi(ac.signal)
      .then((rows) => {
        if (ac.signal.aborted || rows.length === 0) return;
        setLokasiFarmasi(rows);
        setDepo((prev) => (rows.some((l) => l.nama === prev) ? prev : rows[0].nama));
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const depoOptions = lokasiFarmasi.length ? lokasiFarmasi.map((l) => l.nama) : [...DEPO_OPTIONS];

  // Katalog cari-obat = obat ter-formularium DB (obat-tersedia). Fallback OBAT_CATALOG mock bila
  // kosong/unauth (mis. formularium belum di-set / pasien demo). Obat tampil HANYA bila Aktif &
  // sudah dipetakan ke formularium ≥1 ruangan (Mapping Hub → Formularium).
  const [obatKatalog, setObatKatalog] = useState<ObatCatalog[]>([]);
  useEffect(() => {
    const ac = new AbortController();
    listObatTersedia({}, ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setObatKatalog(rows.map(obatTersediaToCatalog)); })
      .catch(() => {});
    return () => ac.abort();
  }, []);
  // Overlay stok ADVISORY: saldo Obat di depo terpilih (tidak memfilter/menggagalkan peresepan).
  // Penjaga stok sesungguhnya ada di dispensing Farmasi (movement OUT anti-negatif).
  const depoId = useMemo(() => lokasiFarmasi.find((l) => l.nama === depo)?.id ?? null, [lokasiFarmasi, depo]);
  const [stokDepo, setStokDepo] = useState<{ depoId: string; map: Map<string, StokKlinisRow> } | null>(null);
  useEffect(() => {
    if (!depoId) return;
    const ac = new AbortController();
    listStokKlinis(depoId, ac.signal)
      .then((rows) => { if (!ac.signal.aborted) setStokDepo({ depoId, map: new Map(rows.map((r) => [r.itemId, r])) }); })
      .catch(() => {}); // diam — stok hanya advisory, kegagalan tak menghalangi resep
    return () => ac.abort();
  }, [depoId]);

  const obatSource = useMemo(() => {
    const base = obatKatalog.length ? obatKatalog : OBAT_CATALOG;
    return depoId && stokDepo?.depoId === depoId ? applyStokDepo(base, stokDepo.map) : base;
  }, [obatKatalog, stokDepo, depoId]);

  // Tarik alergi NYATA pasien dari rekam medis (Asesmen Medis → Alergi) bila kunjungan terpersist.
  // (Pasien demo non-UUID → lewati; state awal sudah []; halaman remount per pasien.)
  useEffect(() => {
    if (!KUNJUNGAN_UUID_RE.test(patient.id)) return;
    const ac = new AbortController();
    getAlergi(patient.id, ac.signal)
      .then((dto) => {
        if (ac.signal.aborted) return;
        setDbAlergiRefs(
          dto.items
            .filter((it) => it.category === "Obat")
            .map((it) => ({
              allergen: it.allergen,
              reactions: it.reactions,
              severity: it.severity,
              bzaKode: it.bzaKode ?? undefined,
            })),
        );
      })
      .catch(() => {}); // diam — fallback ke mock/teks bebas
    return () => ac.abort();
  }, [patient.id]);

  // Referensi alergi obat = DB (rekam medis) ⊕ teks bebas/mock anamnesis. DPJP kontak → "-".
  const alergiRefs     = mergeAlergiRefs(dbAlergiRefs, getAlergiObatRefs(patient.noRM, patient.riwayatAlergi));
  const alergiObat     = alergiRefs.map((r) => r.allergen);
  const dpjpKontak     = (patient as { dpjpKontak?: string }).dpjpKontak?.trim() || "-";
  const formAlergiHit  = form.namaObat ? matchAlergiObatRef(form.namaObat, alergiRefs) : null;

  const setField = <K extends keyof typeof EMPTY_FORM>(
    k: K,
    v: (typeof EMPTY_FORM)[K],
  ) => setForm((prev) => ({ ...prev, [k]: v }));

  const selectObat = (obat: ObatCatalog) => {
    setForm((prev) => ({
      ...prev,
      namaObat: obat.nama,
      kodeObat: obat.kode,
      dosis: `${obat.dosis} ${obat.satuan}`,
      kategori: obat.kategori,
      isHAM: obat.isHAM ?? false,
    }));
  };

  const clearObat = () => setForm({ ...EMPTY_FORM });

  const addItem = () => {
    if (!form.namaObat) return;
    setItems((prev) => [...prev, { id: `rx-${Date.now()}`, ...form }]);
    setForm({ ...EMPTY_FORM });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const removing = prev.find((i) => i.id === id);
      if (removing?.historyItemId) {
        setCopiedIds((ids) => {
          const next = new Set(ids);
          next.delete(removing.historyItemId!);
          return next;
        });
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const removeAll = () => {
    setCopiedIds(new Set());
    setItems([]);
  };

  const editItem = (updated: ResepItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const copyFromHistory = (histItem: RiwayatResepItem) => {
    const newItem: ResepItem = {
      id: `rx-${Date.now()}`,
      namaObat: histItem.namaObat,
      kodeObat: histItem.kodeObat,
      dosis: histItem.dosis,
      dosisSekali: histItem.dosisSekali,
      signa: histItem.signa,
      jumlah: histItem.jumlah,
      rute: histItem.rute,
      aturanPakai: histItem.aturanPakai,
      keterangan: histItem.keterangan,
      kategori: histItem.kategori,
      isHAM: histItem.isHAM ?? false,
      historyItemId: histItem.id,
    };
    setItems((prev) => [...prev, newItem]);
    setCopiedIds((prev) => new Set(prev).add(histItem.id));
  };

  const copyAllFromHistory = (histItems: RiwayatResepItem[]) => {
    const ts = Date.now();
    const newItems: ResepItem[] = histItems.map((h, i) => ({
      id: `rx-${ts}-${i}`,
      namaObat: h.namaObat,
      kodeObat: h.kodeObat,
      dosis: h.dosis,
      dosisSekali: h.dosisSekali,
      signa: h.signa,
      jumlah: h.jumlah,
      rute: h.rute,
      aturanPakai: h.aturanPakai,
      keterangan: h.keterangan,
      kategori: h.kategori,
      isHAM: h.isHAM ?? false,
      historyItemId: h.id,
    }));
    setItems((prev) => [...prev, ...newItems]);
    setCopiedIds((prev) => {
      const next = new Set(prev);
      histItems.forEach((h) => next.add(h.id));
      return next;
    });
  };

  // Susun data cetak resep dari item + TTE (serial/penanda tangan/waktu).
  const buildCetakData = (
    tte: { token: string; signedBy: string; signedAt: string },
    noResep: string,
  ): ResepCetakData => ({
    noResep,
    tanggal: tte.signedAt,
    pasien: {
      nama: patient.name,
      noRM: patient.noRM,
      usia: `${patient.age} thn`,
      jenisKelamin: patient.gender,
      unit: "IGD",
    },
    dokter: patient.doctor,
    dokterKontak: dpjpKontak === "-" ? undefined : dpjpKontak,
    depo,
    catatan: catatan || undefined,
    kondisi: { ginjal: kondisi.ginjal, kehamilan: kondisi.kehamilan, menyusui: kondisi.menyusui },
    items: items.map((it) => ({
      namaObat: it.namaObat,
      dosis: it.dosis || undefined,
      dosisSekali: it.dosisSekali || undefined,
      signa: it.signa,
      jumlah: it.jumlah,
      rute: it.rute || undefined,
      aturanPakai: it.aturanPakai || undefined,
      kategori: it.kategori,
    })),
    tte,
  });

  // Order + TTE: kunjungan terpersist (UUID) → POST (server tanda tangani, selalu sukses) lalu pakai
  // TTE dari respons. Pasien demo → TTE mock lokal (selalu sukses). Hasil → layar sukses + cetak.
  const submitOrder = async () => {
    if (items.length === 0 || !canOrder) return;
    if (KUNJUNGAN_UUID_RE.test(patient.id)) {
      setSending(true);
      try {
        const dto = await createResep(patient.id, {
          depoKode: lokasiFarmasi.find((l) => l.nama === depo)?.kode,
          depoNama: depo,
          catatan: catatan || undefined,
          kondisiGinjal: kondisi.ginjal,
          kondisiMenyusui: kondisi.menyusui,
          kondisiKehamilan: kondisi.kehamilan,
          prioritas: "Rutin",
          penulis: patient.doctor,
          penulisKontak: dpjpKontak === "-" ? undefined : dpjpKontak,
          items: items.map((it) => ({
            kodeObat: it.kodeObat,
            namaObat: it.namaObat,
            dosis: it.dosis || undefined,
            dosisSekali: it.dosisSekali || undefined,
            signa: it.signa || undefined,
            jumlah: it.jumlah,
            rute: it.rute || undefined,
            aturanPakai: it.aturanPakai || undefined,
            kategori: it.kategori,
            keterangan: it.keterangan || undefined,
            isHAM: it.isHAM,
          })),
        });
        setSignedOrder(buildCetakData(
          {
            token: dto.tteToken ?? "",
            signedBy: dto.tteSignedBy ?? patient.doctor,
            signedAt: dto.tteSignedAt ?? new Date().toISOString(),
          },
          `RES-${dto.id.slice(0, 8).toUpperCase()}`,
        ));
      } catch {
        setSending(false);
        return; // gagal → pertahankan form (boundary error sudah toast di api client)
      }
      setSending(false);
    } else {
      // Demo (non-UUID): TTE mock — selalu sukses.
      const now = new Date();
      const token = `TTE-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
      setSignedOrder(buildCetakData(
        { token, signedBy: patient.doctor, signedAt: now.toISOString() },
        `RES-${token.slice(-8)}`,
      ));
    }
    setSubmitted(true);
  };

  const handleOrder = () => {
    if (items.length === 0 || !canOrder) return;
    if (items.some((i) => i.isHAM)) { setShowHAMModal(true); return; }
    void submitOrder();
  };

  const resetForm = () => {
    setSubmitted(false);
    setSignedOrder(null);
    setShowCetak(false);
    removeAll();
    setCatatan("");
  };

  // ── Success screen ─────────────────────────────────────

  if (submitted && signedOrder) {
    return (
      <>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={28} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-700">Resep Ditandatangani &amp; Diorder</p>
            <p className="mt-1 text-xs text-slate-500">
              {signedOrder.items.length} item dikirim ke{" "}
              <span className="font-semibold text-slate-700">{signedOrder.depo}</span>
            </p>
          </div>

          {/* Kartu TTE — barcode + status sukses */}
          <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700">
              <ShieldCheck size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wide">Tanda Tangan Elektronik — Berhasil</span>
            </div>
            <div className="mt-3 flex justify-center">
              <TteBarcode value={signedOrder.tte.token} height={48} />
            </div>
            <p className="mt-2 text-[11px] text-slate-600">
              Ditandatangani oleh <span className="font-semibold text-slate-800">{signedOrder.tte.signedBy}</span>
            </p>
            <p className="text-[10px] text-slate-400">
              {new Date(signedOrder.tte.signedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCetak(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Printer size={13} /> Preview &amp; Cetak Resep
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Buat Resep Baru
            </button>
          </div>
        </div>

        <ResepCetakModal open={showCetak} onClose={() => setShowCetak(false)} data={signedOrder} />
      </>
    );
  }

  // ── Main layout ────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {showHAMModal && (
        <HAMConfirmModal
          hamItems={items.filter((i) => i.isHAM)}
          onConfirm={() => { setShowHAMModal(false); void submitOrder(); }}
          onCancel={() => setShowHAMModal(false)}
        />
      )}
      {/* ── Prescriber info header ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <User size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Penulis Resep
              </p>
              <p className="text-xs font-semibold text-slate-800">
                {patient.doctor}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                <Phone size={10} className="shrink-0" />
                {dpjpKontak}
              </p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <FileText size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Pasien
              </p>
              <p className="text-xs font-semibold text-slate-800">
                {patient.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {patient.noRM} · {patient.age} thn ·{" "}
                {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 size={14} />
            </span>
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Depo Farmasi
              </p>
              <Select
                value={depo}
                onChange={setDepo}
                options={depoOptions}
                className="h-7 min-w-40 py-0"
              />
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Calendar size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Tanggal Resep
              </p>
              <p className="text-xs font-semibold text-slate-800">
                {patient.tglKunjungan}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column main area ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Left: kondisi klinis + form ── */}
        <div className="flex flex-col gap-3">
          <KondisiKlinisPanel gender={patient.gender} value={kondisi} onChange={setKondisi} />

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-slate-700">
              Tambah Obat ke Resep
            </p>

            <div className="flex flex-col gap-3">
              <AlergiObatBanner allergens={alergiObat} />

              <Field label="Cari Obat" required>
                <ObatSearch
                  value={form.namaObat}
                  onSelect={selectObat}
                  catalog={obatSource}
                  showStock={obatKatalog.length === 0}
                />
              </Field>

              {form.namaObat && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-indigo-800">
                      {form.namaObat}
                    </p>
                    <button
                      onClick={clearObat}
                      className="shrink-0 text-slate-400 transition hover:text-slate-600"
                      aria-label="Hapus pilihan"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-[11px] text-indigo-500">
                    {form.kodeObat} · {form.dosis}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                      KATEGORI_BADGE[form.kategori],
                    )}
                  >
                    {form.kategori}
                  </span>
                  {form.kategori !== "Reguler" && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600">
                      <AlertCircle size={10} />
                      Obat ini memerlukan tanda tangan dan stempel dokter
                    </p>
                  )}
                </div>
              )}

              {formAlergiHit && <AlergiMatchWarning allergen={formAlergiHit.allergen} reactions={formAlergiHit.reactions} />}

              <Field label="Dosis Sekali Minum">
                <input
                  value={form.dosisSekali}
                  onChange={(e) => setField("dosisSekali", e.target.value)}
                  placeholder="Mis: 1 tablet, 500 mg, 5 mL"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Jumlah" required>
                  <input
                    type="number"
                    min={1}
                    value={form.jumlah}
                    onChange={(e) =>
                      setField("jumlah", Math.max(1, Number(e.target.value)))
                    }
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                  />
                </Field>
                <Field label="Rute Pemberian" required>
                  <Select
                    value={form.rute}
                    onChange={(v) => setField("rute", v)}
                    options={[...RUTE_OPTIONS]}
                    className="h-8"
                  />
                </Field>
              </div>

              <div>
                <Label required>Signa (Frekuensi)</Label>
                <div className="flex flex-wrap gap-1">
                  {SIGNA_OPTIONS.map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      title={s.label}
                      onClick={() => setField("signa", s.val)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                        form.signa === s.val
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {s.val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Waktu Pemberian</Label>
                <div className="flex flex-wrap gap-1">
                  {ATURAN_WAKTU.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setField("aturanPakai", a)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                        form.aturanPakai === a
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Keterangan Tambahan">
                <input
                  value={form.keterangan}
                  onChange={(e) => setField("keterangan", e.target.value)}
                  placeholder="Mis: jangan dihancurkan, minum dengan banyak air..."
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                />
              </Field>

              <button
                onClick={addItem}
                disabled={!form.namaObat}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={13} />
                Tambahkan ke Daftar Resep
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: daftar resep + catatan ── */}
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-700">
                  Daftar Resep
                </p>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                  {items.length}
                </span>
              </div>
              {items.length > 0 && (
                <button
                  onClick={removeAll}
                  className="text-[11px] text-slate-400 transition hover:text-rose-500"
                >
                  Hapus semua
                </button>
              )}
            </div>
            <div className="p-3">
              {items.length === 0 ? (
                <EmptyResep />
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((item, i) => (
                    <ResepRow
                      key={item.id}
                      item={item}
                      index={i}
                      onRemove={() => removeItem(item.id)}
                      onEdit={editItem}
                      alergiHit={matchAlergiObatRef(item.namaObat, alergiRefs)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Label>Catatan / Instruksi Farmasi</Label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Instruksi khusus untuk petugas farmasi..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>

      {/* ── Riwayat resep ── */}
      {riwayat.length > 0 && (
        <RiwayatSection
          riwayat={riwayat}
          onCopy={copyFromHistory}
          onCopyAll={copyAllFromHistory}
          copiedIds={copiedIds}
        />
      )}

      {/* ── Sticky footer ── */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-xs text-slate-400">
          {items.length === 0 ? (
            "Tambahkan obat ke daftar resep terlebih dahulu"
          ) : (
            <>
              <span className="font-semibold text-slate-700">
                {items.length} item
              </span>{" "}
              siap diorder ke{" "}
              <span className="font-semibold text-slate-700">{depo}</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {!canOrder && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
              <AlertCircle size={12} /> Hanya dokter (DPJP) yang dapat menandatangani &amp; mengorder resep
            </span>
          )}
          <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            Simpan Draft
          </button>
          <button
            onClick={handleOrder}
            disabled={items.length === 0 || sending || !canOrder}
            title={!canOrder ? "Hanya dokter yang dapat order resep" : undefined}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck size={13} />
            {sending ? "Menandatangani…" : "Tanda Tangani & Order Resep"}
          </button>
        </div>
      </div>
    </div>
  );
}
