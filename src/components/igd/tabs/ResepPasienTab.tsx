"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  Pill,
  User,
  Building2,
  Calendar,
  FlaskConical,
  AlertCircle,
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
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────

type KategoriObat = "Reguler" | "Narkotika" | "Psikotropika";
type StatusRiwayat = "Selesai" | "Diproses" | "Dikembalikan";

interface ResepItem {
  id: string;
  namaObat: string;
  kodeObat: string;
  dosis: string;
  signa: string;
  jumlah: number;
  rute: string;
  aturanPakai: string;
  keterangan: string;
  kategori: KategoriObat;
  historyItemId?: string;
}

interface ObatCatalog {
  kode: string;
  nama: string;
  dosis: string;
  satuan: string;
  stok: number;
  kategori: KategoriObat;
}

interface RiwayatResepItem extends Omit<ResepItem, "id"> {
  id: string;
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

// ── Mock catalog ──────────────────────────────────────────

const OBAT_CATALOG: ObatCatalog[] = [
  {
    kode: "FAR-001",
    nama: "Aspirin 100mg",
    dosis: "100",
    satuan: "mg",
    stok: 150,
    kategori: "Reguler",
  },
  {
    kode: "FAR-002",
    nama: "Aspirin 500mg",
    dosis: "500",
    satuan: "mg",
    stok: 80,
    kategori: "Reguler",
  },
  {
    kode: "FAR-003",
    nama: "Amoxicillin 500mg",
    dosis: "500",
    satuan: "mg",
    stok: 200,
    kategori: "Reguler",
  },
  {
    kode: "FAR-004",
    nama: "Clopidogrel 75mg",
    dosis: "75",
    satuan: "mg",
    stok: 60,
    kategori: "Reguler",
  },
  {
    kode: "FAR-005",
    nama: "Atorvastatin 20mg",
    dosis: "20",
    satuan: "mg",
    stok: 120,
    kategori: "Reguler",
  },
  {
    kode: "FAR-006",
    nama: "Atorvastatin 40mg",
    dosis: "40",
    satuan: "mg",
    stok: 75,
    kategori: "Reguler",
  },
  {
    kode: "FAR-007",
    nama: "Metformin 500mg",
    dosis: "500",
    satuan: "mg",
    stok: 300,
    kategori: "Reguler",
  },
  {
    kode: "FAR-008",
    nama: "Amlodipine 5mg",
    dosis: "5",
    satuan: "mg",
    stok: 90,
    kategori: "Reguler",
  },
  {
    kode: "FAR-009",
    nama: "Omeprazole 20mg",
    dosis: "20",
    satuan: "mg",
    stok: 250,
    kategori: "Reguler",
  },
  {
    kode: "FAR-010",
    nama: "Paracetamol 500mg",
    dosis: "500",
    satuan: "mg",
    stok: 500,
    kategori: "Reguler",
  },
  {
    kode: "FAR-011",
    nama: "Ibuprofen 400mg",
    dosis: "400",
    satuan: "mg",
    stok: 180,
    kategori: "Reguler",
  },
  {
    kode: "FAR-012",
    nama: "Furosemide 40mg",
    dosis: "40",
    satuan: "mg",
    stok: 100,
    kategori: "Reguler",
  },
  {
    kode: "FAR-013",
    nama: "NaCl 0,9% 500mL",
    dosis: "500",
    satuan: "mL",
    stok: 80,
    kategori: "Reguler",
  },
  {
    kode: "FAR-014",
    nama: "Dextrose 5% 500mL",
    dosis: "500",
    satuan: "mL",
    stok: 60,
    kategori: "Reguler",
  },
  {
    kode: "FAR-015",
    nama: "Dopamin 200mg/5mL",
    dosis: "200",
    satuan: "mg/5mL",
    stok: 25,
    kategori: "Reguler",
  },
  {
    kode: "FAR-016",
    nama: "Morfin 10mg/mL Inj",
    dosis: "10",
    satuan: "mg/mL",
    stok: 20,
    kategori: "Narkotika",
  },
  {
    kode: "FAR-017",
    nama: "Fentanyl 100mcg Inj",
    dosis: "100",
    satuan: "mcg",
    stok: 15,
    kategori: "Narkotika",
  },
  {
    kode: "FAR-018",
    nama: "Codein 10mg",
    dosis: "10",
    satuan: "mg",
    stok: 40,
    kategori: "Narkotika",
  },
  {
    kode: "FAR-019",
    nama: "Midazolam 5mg/5mL",
    dosis: "5",
    satuan: "mg/5mL",
    stok: 30,
    kategori: "Psikotropika",
  },
  {
    kode: "FAR-020",
    nama: "Diazepam 5mg",
    dosis: "5",
    satuan: "mg",
    stok: 50,
    kategori: "Psikotropika",
  },
  {
    kode: "FAR-021",
    nama: "Alprazolam 0,5mg",
    dosis: "0,5",
    satuan: "mg",
    stok: 35,
    kategori: "Psikotropika",
  },
];

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

// ── Constants ─────────────────────────────────────────────

const SIGNA_OPTIONS = [
  { val: "1×1", label: "Sekali sehari satu" },
  { val: "2×1", label: "Dua kali sehari satu" },
  { val: "3×1", label: "Tiga kali sehari satu" },
  { val: "4×1", label: "Empat kali sehari satu" },
  { val: "1×2", label: "Sekali sehari dua" },
  { val: "2×2", label: "Dua kali sehari dua" },
  { val: "3×2", label: "Tiga kali sehari dua" },
  { val: "PRN", label: "Jika perlu (PRN)" },
];

const ATURAN_WAKTU = [
  "AC (Sebelum Makan)",
  "PC (Sesudah Makan)",
  "Bersama Makan",
  "Terlepas dari Makan",
  "Malam Hari",
];

const RUTE_OPTIONS = [
  "Oral",
  "Sublingual",
  "IV Bolus",
  "IV Drip",
  "IM",
  "SC",
  "Inhalasi",
  "Topikal",
  "Rektal",
  "NGT",
];

const DEPO_OPTIONS = [
  "Depo IGD",
  "Depo Rawat Inap",
  "Apotek Rawat Jalan",
  "Apotek 24 Jam",
];

const ATURAN_PANDUAN = [
  "Peresepan maksimal 7 hari untuk obat reguler (BPJS).",
  "Narkotika/Psikotropika wajib tanda tangan dokter dan stempel resmi.",
  "Dosis tidak boleh melebihi dosis maksimal harian yang direkomendasikan.",
  "Pastikan tidak ada interaksi dengan obat yang sedang dikonsumsi pasien.",
  "Obat narkotika harus disertai indikasi klinis yang jelas.",
  "Obat di luar formularium wajib dilampiri surat keterangan medis (SKM).",
  "Resep harus ditulis lengkap: nama, dosis, signa, jumlah, dan rute.",
];

// ── Badge styles ──────────────────────────────────────────

const KATEGORI_BADGE: Record<KategoriObat, string> = {
  Reguler: "bg-slate-100 text-slate-600",
  Narkotika: "bg-rose-100 text-rose-700",
  Psikotropika: "bg-amber-100 text-amber-700",
};

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
}: {
  value: string;
  onSelect: (obat: ObatCatalog) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ObatCatalog[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const filtered = OBAT_CATALOG.filter(
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
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    obat.stok > 0 ? "text-emerald-600" : "text-rose-500",
                  )}
                >
                  {obat.stok > 0 ? `Stok: ${obat.stok}` : "Habis"}
                </span>
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
}: {
  item: ResepItem;
  index: number;
  onRemove: () => void;
  onEdit: (updated: ResepItem) => void;
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
      className="animate-fade-in rounded-xl border border-slate-200 bg-white shadow-xs"
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
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                KATEGORI_BADGE[item.kategori],
              )}
            >
              {item.kategori}
            </span>
            {item.kategori !== "Reguler" && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                <AlertCircle size={9} />
                Perlu persetujuan khusus
              </span>
            )}
          </div>
          {!editing && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {item.dosis}
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
              <select
                value={draft.signa}
                onChange={(e) => d("signa", e.target.value)}
                className={INPUT_CLS}
              >
                {SIGNA_OPTIONS.map((s) => (
                  <option key={s.val} value={s.val}>
                    {s.val}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Waktu
              </p>
              <select
                value={draft.aturanPakai}
                onChange={(e) => d("aturanPakai", e.target.value)}
                className={INPUT_CLS}
              >
                {ATURAN_WAKTU.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
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
              <select
                value={draft.rute}
                onChange={(e) => d("rute", e.target.value)}
                className={INPUT_CLS}
              >
                {RUTE_OPTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2">
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
  signa: "3×1",
  aturanPakai: "PC (Sesudah Makan)",
  rute: "Oral",
  jumlah: 1,
  keterangan: "",
  kategori: "Reguler" as KategoriObat,
};

// ── Main component ────────────────────────────────────────

export default function ResepPasienTab({
  patient,
}: {
  patient: IGDPatientDetail;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [items, setItems] = useState<ResepItem[]>([]);
  const [depo, setDepo] = useState(DEPO_OPTIONS[0]);
  const [catatan, setCatatan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  const riwayat = RIWAYAT_MOCK[patient.noRM] ?? [];

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
      signa: histItem.signa,
      jumlah: histItem.jumlah,
      rute: histItem.rute,
      aturanPakai: histItem.aturanPakai,
      keterangan: histItem.keterangan,
      kategori: histItem.kategori,
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
      signa: h.signa,
      jumlah: h.jumlah,
      rute: h.rute,
      aturanPakai: h.aturanPakai,
      keterangan: h.keterangan,
      kategori: h.kategori,
      historyItemId: h.id,
    }));
    setItems((prev) => [...prev, ...newItems]);
    setCopiedIds((prev) => {
      const next = new Set(prev);
      histItems.forEach((h) => next.add(h.id));
      return next;
    });
  };

  const handleOrder = () => {
    if (items.length === 0) return;
    setSubmitted(true);
  };

  // ── Success screen ─────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={28} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Resep Berhasil Diorder
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {items.length} item dikirim ke{" "}
            <span className="font-semibold text-slate-700">{depo}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Penulis resep: {patient.doctor}
          </p>
        </div>
        <button
          onClick={() => {
            setSubmitted(false);
            removeAll();
            setCatatan("");
          }}
          className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Buat Resep Baru
        </button>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
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
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Depo Farmasi
              </p>
              <select
                value={depo}
                onChange={(e) => setDepo(e.target.value)}
                className="mt-0.5 rounded-md border border-slate-200 bg-transparent px-2 py-0.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              >
                {DEPO_OPTIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
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
        {/* ── Left: panduan + form ── */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Panduan Aturan Resep
            </p>
            <ul className="space-y-1">
              {ATURAN_PANDUAN.map((rule, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-amber-700"
                >
                  <span className="mt-0.5 shrink-0 text-amber-400">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-slate-700">
              Tambah Obat ke Resep
            </p>

            <div className="flex flex-col gap-3">
              <Field label="Cari Obat" required>
                <ObatSearch value={form.namaObat} onSelect={selectObat} />
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
                  <select
                    value={form.rute}
                    onChange={(e) => setField("rute", e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                  >
                    {RUTE_OPTIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
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
          <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            Simpan Draft
          </button>
          <button
            onClick={handleOrder}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FlaskConical size={13} />
            Order Resep ke Farmasi
          </button>
        </div>
      </div>
    </div>
  );
}
