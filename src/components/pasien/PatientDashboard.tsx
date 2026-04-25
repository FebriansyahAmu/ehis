"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera, Printer, Pencil, Check, X, ChevronRight, ChevronDown, ChevronUp,
  Phone, Mail, MapPin, Shield, Receipt, FileText, Stethoscope, BedDouble,
  FlaskConical, Radiation, Pill, AlertCircle, CreditCard, Wallet, Calculator,
  Tag, ArrowRight, Plus, User, UserCheck, ClipboardList, Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PatientMaster, PenjaminData, TipePenjamin, UnitKunjungan,
  KasirData, KategoriItem, MetodeBayar, DepositRecord, BillingRecord,
} from "@/lib/data";
import { patientMasterData } from "@/lib/data";

// ── Style maps ─────────────────────────────────────────────

const UNIT_CFG: Record<UnitKunjungan, { bg: string; text: string; icon: LucideIcon }> = {
  "IGD":          { bg: "bg-rose-100",    text: "text-rose-700",    icon: AlertCircle  },
  "Rawat Jalan":  { bg: "bg-sky-100",     text: "text-sky-700",     icon: Stethoscope  },
  "Rawat Inap":   { bg: "bg-emerald-100", text: "text-emerald-700", icon: BedDouble    },
  "Laboratorium": { bg: "bg-teal-100",    text: "text-teal-700",    icon: FlaskConical },
  "Radiologi":    { bg: "bg-orange-100",  text: "text-orange-700",  icon: Radiation    },
  "Farmasi":      { bg: "bg-violet-100",  text: "text-violet-700",  icon: Pill         },
};

const KUNJUNGAN_STATUS: Record<string, string> = {
  Selesai:    "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  Aktif:      "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  Dibatalkan: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  Aktif:      "Di Ruangan",
  Selesai:    "Selesai",
  Dibatalkan: "Dibatalkan",
};

type FilterStatus = "Semua" | "Aktif" | "Selesai" | "Dibatalkan";
const FILTER_OPTS: { key: FilterStatus; label: string }[] = [
  { key: "Semua",      label: "Semua"       },
  { key: "Aktif",      label: "Di Ruangan"  },
  { key: "Selesai",    label: "Selesai"     },
  { key: "Dibatalkan", label: "Dibatalkan"  },
];

const PENJAMIN_CFG: Record<TipePenjamin, { bg: string; border: string; badge: string; label: string }> = {
  BPJS_Non_PBI: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-600 text-white", label: "BPJS Non-PBI"    },
  BPJS_PBI:     { bg: "bg-teal-50",    border: "border-teal-200",    badge: "bg-teal-600 text-white",    label: "BPJS PBI"        },
  Umum:         { bg: "bg-slate-50",   border: "border-slate-200",   badge: "bg-slate-600 text-white",   label: "Umum / Mandiri"  },
  Asuransi:     { bg: "bg-indigo-50",  border: "border-indigo-200",  badge: "bg-indigo-600 text-white",  label: "Asuransi Swasta" },
  Jamkesda:     { bg: "bg-amber-50",   border: "border-amber-200",   badge: "bg-amber-600 text-white",   label: "Jamkesda"        },
};

const KATEGORI_CFG: Record<KategoriItem, { color: string; bg: string; icon: LucideIcon }> = {
  "Tindakan":     { color: "text-sky-700",    bg: "bg-sky-50 border-sky-200",     icon: Stethoscope  },
  "Obat":         { color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: Pill       },
  "Laboratorium": { color: "text-teal-700",   bg: "bg-teal-50 border-teal-200",   icon: FlaskConical },
  "Radiologi":    { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: Radiation  },
  "Akomodasi":    { color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: BedDouble  },
  "Lain-lain":    { color: "text-slate-700",  bg: "bg-slate-50 border-slate-200",  icon: Tag        },
};

const TAGIHAN_STATUS: Record<string, string> = {
  Lunas:            "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  "Belum Lunas":    "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  "Proses Klaim":   "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Ditanggung:       "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
};

// ── Helpers ────────────────────────────────────────────────

function fmtRp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function calcKasir(kasir: KasirData) {
  const totalTagihan = kasir.items.reduce((s, i) => s + i.qty * i.harga, 0);
  const totalDeposit = kasir.deposits.reduce((s, d) => s + d.jumlah, 0);
  const sisaBayar    = Math.max(0, totalTagihan - totalDeposit);
  const byKategori   = kasir.items.reduce<Record<KategoriItem, number>>((acc, i) => {
    acc[i.kategori] = (acc[i.kategori] ?? 0) + i.qty * i.harga;
    return acc;
  }, {} as Record<KategoriItem, number>);
  return { totalTagihan, totalDeposit, sisaBayar, byKategori };
}

// ── Primitives ─────────────────────────────────────────────

function InfoRow({ label, value, mono, span3 }: {
  label: string; value: React.ReactNode; mono?: boolean; span3?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", span3 && "col-span-3")}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className={cn("text-xs font-medium leading-snug text-slate-700", mono && "font-mono")}>
        {value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

function CardSection({ title, icon: Icon, accent, actions, children }: {
  title: string; icon: LucideIcon; accent: string;
  actions?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs border-l-4", accent)}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon size={13} className="shrink-0 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">{title}</span>
        </div>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children, size = "md" }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl";
}) {
  const maxW = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-5xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className={cn("flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl", maxW)}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Tutup" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
            <X size={13} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditSmallBtn({ onClick, label = "Edit" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
      <Pencil size={11} /> {label}
    </button>
  );
}

// ── Edit Data Pribadi Modal ────────────────────────────────

function EditDataModal({ patient, onClose, onSave }: {
  patient: PatientMaster;
  onClose: () => void;
  onSave: (p: PatientMaster) => void;
}) {
  const [d, setD] = useState({ ...patient });
  const FIELDS = [
    { key: "name" as const,            label: "Nama Lengkap",      span: true  },
    { key: "nik" as const,             label: "NIK",               span: false },
    { key: "tempatLahir" as const,     label: "Tempat Lahir",      span: false },
    { key: "tanggalLahir" as const,    label: "Tanggal Lahir",     span: false },
    { key: "agama" as const,           label: "Agama",             span: false },
    { key: "statusPerkawinan" as const,label: "Status Perkawinan", span: false },
    { key: "pekerjaan" as const,       label: "Pekerjaan",         span: false },
    { key: "pendidikan" as const,      label: "Pendidikan",        span: false },
    { key: "suku" as const,            label: "Suku",              span: false },
    { key: "kewarganegaraan" as const, label: "Kewarganegaraan",   span: false },
    { key: "noHp" as const,            label: "No. HP",            span: false },
    { key: "email" as const,           label: "Email",             span: false },
    { key: "alamat" as const,          label: "Alamat",            span: true  },
    { key: "kelurahan" as const,       label: "Kelurahan",         span: false },
    { key: "kecamatan" as const,       label: "Kecamatan",         span: false },
    { key: "kota" as const,            label: "Kota",              span: false },
    { key: "provinsi" as const,        label: "Provinsi",          span: false },
    { key: "kodePos" as const,         label: "Kode Pos",          span: false },
  ];
  return (
    <ModalShell title="Edit Data Pribadi" subtitle="Perubahan akan disimpan ke rekam medis pasien" onClose={onClose} size="lg">
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, span }) => (
            <div key={key} className={cn("flex flex-col gap-1", span && "col-span-2")}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
              <input
                value={(d[key] ?? "") as string}
                onChange={(e) => setD((x) => ({ ...x, [key]: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 gap-2 border-t border-slate-100 px-5 py-4">
        <button onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
        <button onClick={() => { onSave(d); onClose(); }} className="flex-1 cursor-pointer rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700">Simpan</button>
      </div>
    </ModalShell>
  );
}

// ── Edit Kontak Modal ──────────────────────────────────────

function EditKontakModal({ patient, onClose, onSave }: {
  patient: PatientMaster;
  onClose: () => void;
  onSave: (p: PatientMaster) => void;
}) {
  const [d, setD]   = useState({ ...patient.kontakDarurat });
  const [hp, setHp] = useState(patient.noHp);
  const [em, setEm] = useState(patient.email ?? "");

  return (
    <ModalShell title="Edit Kontak & Penanggung Jawab" onClose={onClose} size="md">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kontak Pasien</p>
          {[
            { label: "No. HP Pasien",  val: hp,  set: setHp },
            { label: "Email Pasien",   val: em,  set: setEm },
          ].map(({ label, val, set }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
              <input value={val} onChange={(e) => set(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kontak Darurat / Penanggung Jawab</p>
          {([
            { key: "nama" as const,     label: "Nama" },
            { key: "hubungan" as const, label: "Hubungan" },
            { key: "noHp" as const,     label: "No. HP" },
            { key: "alamat" as const,   label: "Alamat" },
          ]).map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
              <input value={(d[key] ?? "") as string} onChange={(e) => setD((x) => ({ ...x, [key]: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 gap-2 border-t border-slate-100 px-5 py-4">
        <button onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
        <button onClick={() => { onSave({ ...patient, noHp: hp, email: em, kontakDarurat: d }); onClose(); }}
          className="flex-1 cursor-pointer rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700">Simpan</button>
      </div>
    </ModalShell>
  );
}

// ── Ubah Penjamin Modal ────────────────────────────────────

function UbahPenjaminModal({ current, onClose, onSave }: {
  current: PenjaminData; onClose: () => void; onSave: (p: PenjaminData) => void;
}) {
  const [d, setD] = useState<PenjaminData>({ ...current });
  const OPTS: { value: TipePenjamin; label: string }[] = [
    { value: "Umum",         label: "Umum / Mandiri"  },
    { value: "BPJS_Non_PBI", label: "BPJS Non-PBI"    },
    { value: "BPJS_PBI",     label: "BPJS PBI"        },
    { value: "Asuransi",     label: "Asuransi Swasta" },
    { value: "Jamkesda",     label: "Jamkesda"        },
  ];
  const isBpjs = d.tipe === "BPJS_Non_PBI" || d.tipe === "BPJS_PBI";
  return (
    <ModalShell title="Ubah Penjamin" onClose={onClose} size="md">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Jenis Penjamin</p>
          <div className="grid grid-cols-2 gap-2">
            {OPTS.map((o) => (
              <button key={o.value} onClick={() => setD((x) => ({ ...x, tipe: o.value }))}
                className={cn("cursor-pointer rounded-lg border px-3 py-2 text-left text-xs font-medium transition",
                  d.tipe === o.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {isBpjs && (<>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. BPJS</label>
            <input value={d.nomor ?? ""} onChange={(e) => setD((x) => ({ ...x, nomor: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200" />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kelas Perawatan</p>
            <div className="flex gap-2">
              {(["1","2","3"] as const).map((k) => (
                <button key={k} onClick={() => setD((x) => ({ ...x, kelas: k }))}
                  className={cn("flex-1 cursor-pointer rounded-lg border py-2 text-xs font-bold transition",
                    d.kelas === k ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                  Kelas {k}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Berlaku s/d</label>
            <input value={d.berlakuSampai ?? ""} onChange={(e) => setD((x) => ({ ...x, berlakuSampai: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200" />
          </div>
        </>)}
        {d.tipe === "Asuransi" && (<>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Asuransi</label>
            <input value={d.nama ?? ""} onChange={(e) => setD((x) => ({ ...x, nama: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. Polis</label>
            <input value={d.noPolis ?? ""} onChange={(e) => setD((x) => ({ ...x, noPolis: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200" />
          </div>
        </>)}
      </div>
      <div className="flex shrink-0 gap-2 border-t border-slate-100 px-5 py-4">
        <button onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
        <button onClick={() => { onSave(d); onClose(); }} className="flex-1 cursor-pointer rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700">Simpan</button>
      </div>
    </ModalShell>
  );
}

// ── Accounting Modal ───────────────────────────────────────

type AccTab = "ringkasan" | "rincian" | "kasir" | "deposit";

function AccountingModal({ kasir, patient, onClose }: {
  kasir: KasirData; patient: PatientMaster; onClose: () => void;
}) {
  const [tab, setTab]   = useState<AccTab>("ringkasan");
  const [uang, setUang] = useState("");
  const [metode, setMetode] = useState<MetodeBayar>("Tunai");
  const [expandedKat, setExpandedKat] = useState<KategoriItem | null>(null);
  const [localDeposits, setLocalDeposits] = useState<DepositRecord[]>(kasir.deposits);
  const [showAddDeposit, setShowAddDeposit] = useState(false);
  const [newDep, setNewDep] = useState<Partial<DepositRecord>>({ metode: "Tunai", tanggal: "14 Apr 2026", waktu: "", jumlah: 0, kasir: "" });

  const { totalTagihan, totalDeposit: baseDeposit, byKategori } = useMemo(() => calcKasir(kasir), [kasir]);
  const totalDeposit = localDeposits.reduce((s, d) => s + d.jumlah, 0);
  const sisaBayar    = Math.max(0, totalTagihan - totalDeposit);
  const uangNum      = parseFloat(uang.replace(/[^0-9]/g, "")) || 0;
  const kembalian    = uangNum > sisaBayar ? uangNum - sisaBayar : 0;
  const kurang       = uangNum > 0 && uangNum < sisaBayar ? sisaBayar - uangNum : 0;

  const kategoris = Object.keys(byKategori) as KategoriItem[];

  const TABS: { id: AccTab; label: string; icon: LucideIcon }[] = [
    { id: "ringkasan", label: "Ringkasan",        icon: Receipt    },
    { id: "rincian",   label: "Rincian Tagihan",  icon: FileText   },
    { id: "kasir",     label: "Kasir / Bayar",    icon: Calculator },
    { id: "deposit",   label: "Deposit",          icon: Wallet     },
  ];

  const METODE_OPTS: MetodeBayar[] = ["Tunai", "Transfer", "QRIS", "BPJS", "Asuransi"];

  return (
    <ModalShell
      title={`Kasir — ${patient.name}`}
      subtitle={`${kasir.noTagihan} · ${kasir.noKunjungan} · ${kasir.tanggal}`}
      onClose={onClose}
      size="xl"
    >
      {/* Tab bar */}
      <div className="flex shrink-0 gap-0.5 border-b border-slate-100 bg-slate-50 px-4 pt-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 px-3.5 py-2 text-xs font-semibold transition",
              tab === id
                ? "border-slate-200 bg-white text-indigo-600 shadow-xs"
                : "border-transparent text-slate-400 hover:text-slate-600",
            )}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── RINGKASAN ── */}
        {tab === "ringkasan" && (
          <div className="p-5 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tagihan</p>
                <p className="mt-1 text-lg font-black text-slate-900">{fmtRp(totalTagihan)}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Total Deposit</p>
                <p className="mt-1 text-lg font-black text-emerald-700">{fmtRp(totalDeposit)}</p>
              </div>
              <div className={cn("rounded-xl border p-4 text-center", sisaBayar > 0 ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50")}>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", sisaBayar > 0 ? "text-rose-500" : "text-emerald-500")}>Sisa Bayar</p>
                <p className={cn("mt-1 text-lg font-black", sisaBayar > 0 ? "text-rose-700" : "text-emerald-700")}>{fmtRp(sisaBayar)}</p>
              </div>
            </div>

            {/* Per-category breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-xs font-semibold text-slate-600">Rincian per Kategori</p>
              </div>
              <div className="divide-y divide-slate-50">
                {kategoris.map((kat) => {
                  const cfg = KATEGORI_CFG[kat];
                  const KIcon = cfg.icon;
                  return (
                    <div key={kat} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border text-[10px]", cfg.bg)}>
                          <KIcon size={11} className={cfg.color} />
                        </span>
                        <span className="text-xs font-medium text-slate-600">{kat}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{fmtRp(byKategori[kat] ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">Grand Total</span>
                <span className="text-sm font-black text-slate-900">{fmtRp(totalTagihan)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs text-slate-500">Status Pembayaran</span>
              <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", TAGIHAN_STATUS[kasir.statusPembayaran])}>
                {kasir.statusPembayaran}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs text-slate-500">Penjamin</span>
              <span className="text-xs font-semibold text-slate-700">{kasir.penjamin}</span>
            </div>
          </div>
        )}

        {/* ── RINCIAN ── */}
        {tab === "rincian" && (
          <div className="p-5 space-y-3">
            {kategoris.map((kat) => {
              const cfg   = KATEGORI_CFG[kat];
              const KIcon = cfg.icon;
              const items = kasir.items.filter((i) => i.kategori === kat);
              const sub   = items.reduce((s, i) => s + i.qty * i.harga, 0);
              const open  = expandedKat === kat;
              return (
                <div key={kat} className={cn("overflow-hidden rounded-xl border", cfg.bg.split(" ")[1])}>
                  <button onClick={() => setExpandedKat(open ? null : kat)}
                    className="flex w-full cursor-pointer items-center justify-between px-4 py-3 hover:bg-white/50 transition">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", cfg.bg)}>
                        <KIcon size={13} className={cfg.color} />
                      </span>
                      <span className={cn("text-xs font-bold", cfg.color)}>{kat}</span>
                      <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{items.length} item</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{fmtRp(sub)}</span>
                      {open ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-white/60 bg-white/70 px-4 py-2">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-2 text-left">Nama Item</th>
                            <th className="pb-2 text-center">Qty</th>
                            <th className="pb-2 text-center">Satuan</th>
                            <th className="pb-2 text-right">Harga</th>
                            <th className="pb-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1.5 font-medium text-slate-700">{item.nama}</td>
                              <td className="py-1.5 text-center text-slate-500">{item.qty}</td>
                              <td className="py-1.5 text-center text-slate-400">{item.satuan}</td>
                              <td className="py-1.5 text-right text-slate-500">{fmtRp(item.harga)}</td>
                              <td className="py-1.5 text-right font-semibold text-slate-800">{fmtRp(item.qty * item.harga)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200">
                            <td colSpan={4} className="pt-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtotal {kat}</td>
                            <td className="pt-2 text-right text-xs font-bold text-slate-900">{fmtRp(sub)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Grand total */}
            <div className="flex items-center justify-between rounded-xl border-2 border-slate-300 bg-white px-4 py-3">
              <span className="text-sm font-bold text-slate-700">GRAND TOTAL</span>
              <span className="text-base font-black text-slate-900">{fmtRp(totalTagihan)}</span>
            </div>
          </div>
        )}

        {/* ── KASIR / BAYAR ── */}
        {tab === "kasir" && (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            {/* Left: breakdown */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rincian Pembayaran</p>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {kategoris.map((kat) => (
                    <div key={kat} className="flex justify-between px-4 py-2 text-xs">
                      <span className="text-slate-500">{kat}</span>
                      <span className="font-medium text-slate-700">{fmtRp(byKategori[kat] ?? 0)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
                  <span className="font-bold text-slate-700">Total Tagihan</span>
                  <span className="font-bold text-slate-900">{fmtRp(totalTagihan)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 px-4 py-2 text-xs">
                  <span className="text-emerald-600">Deposit Diterima</span>
                  <span className="font-semibold text-emerald-700">({fmtRp(totalDeposit)})</span>
                </div>
                <div className={cn("flex justify-between border-t px-4 py-3", sisaBayar > 0 ? "border-rose-100 bg-rose-50" : "border-emerald-100 bg-emerald-50")}>
                  <span className={cn("text-sm font-black", sisaBayar > 0 ? "text-rose-700" : "text-emerald-700")}>SISA BAYAR</span>
                  <span className={cn("text-sm font-black", sisaBayar > 0 ? "text-rose-800" : "text-emerald-800")}>{fmtRp(sisaBayar)}</span>
                </div>
              </div>
            </div>

            {/* Right: payment form */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {METODE_OPTS.map((m) => (
                  <button key={m} onClick={() => setMetode(m)}
                    className={cn("cursor-pointer rounded-lg border py-2 text-xs font-semibold transition",
                      metode === m
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                    {m}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Uang Diterima</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={uang}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setUang(raw ? new Intl.NumberFormat("id-ID").format(parseInt(raw)) : "");
                    }}
                    placeholder="0"
                    className="w-full rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 py-3 text-right text-xl font-black text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Kembalian / Kurang */}
              <div className={cn("rounded-xl border-2 p-4 text-center",
                uangNum === 0           ? "border-slate-200 bg-slate-50" :
                kembalian > 0           ? "border-emerald-300 bg-emerald-50" :
                kurang > 0              ? "border-rose-300 bg-rose-50"
                                        : "border-emerald-300 bg-emerald-50")}>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider",
                  uangNum === 0 ? "text-slate-400" : kembalian > 0 ? "text-emerald-500" : kurang > 0 ? "text-rose-500" : "text-emerald-500")}>
                  {uangNum === 0 ? "Kembalian" : kembalian > 0 ? "Kembalian" : kurang > 0 ? "Kekurangan" : "Pas / Lunas"}
                </p>
                <p className={cn("mt-1 text-2xl font-black",
                  uangNum === 0 ? "text-slate-300" : kembalian > 0 ? "text-emerald-700" : kurang > 0 ? "text-rose-700" : "text-emerald-700")}>
                  {uangNum === 0 ? fmtRp(0) : kembalian > 0 ? fmtRp(kembalian) : kurang > 0 ? fmtRp(kurang) : "Lunas ✓"}
                </p>
              </div>

              <button
                disabled={uangNum < sisaBayar && uangNum > 0 || uangNum === 0}
                className="w-full cursor-pointer rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proses Pembayaran
              </button>
            </div>
          </div>
        )}

        {/* ── DEPOSIT ── */}
        {tab === "deposit" && (
          <div className="p-5 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Total Deposit</p>
                <p className="mt-1 text-base font-black text-emerald-700">{fmtRp(totalDeposit)}</p>
              </div>
              <div className={cn("rounded-xl border p-3 text-center", sisaBayar > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50")}>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", sisaBayar > 0 ? "text-rose-500" : "text-slate-400")}>Hutang / Sisa</p>
                <p className={cn("mt-1 text-base font-black", sisaBayar > 0 ? "text-rose-700" : "text-slate-400")}>{fmtRp(sisaBayar)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tagihan</p>
                <p className="mt-1 text-base font-black text-slate-700">{fmtRp(totalTagihan)}</p>
              </div>
            </div>

            {/* Deposit list */}
            <div className="space-y-2">
              {localDeposits.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">Belum ada deposit.</p>
              )}
              {localDeposits.map((dep) => (
                <div key={dep.id} className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-emerald-800">{fmtRp(dep.jumlah)}</p>
                    <p className="mt-0.5 text-[11px] text-emerald-600">{dep.tanggal} {dep.waktu} · <span className="font-medium">{dep.metode}</span></p>
                    {dep.keterangan && <p className="mt-0.5 text-[11px] text-emerald-500">{dep.keterangan}</p>}
                    <p className="mt-0.5 text-[10px] text-emerald-400">Kasir: {dep.kasir}</p>
                  </div>
                  <span className="rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-600">{dep.metode}</span>
                </div>
              ))}
            </div>

            {/* Add deposit form */}
            {showAddDeposit ? (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Tambah Deposit Baru</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: "tanggal" as const, label: "Tanggal" },
                    { key: "waktu" as const,   label: "Waktu" },
                    { key: "kasir" as const,   label: "Nama Kasir" },
                    { key: "keterangan" as const, label: "Keterangan" },
                  ]).map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
                      <input value={(newDep[key] ?? "") as string} onChange={(e) => setNewDep((x) => ({ ...x, [key]: e.target.value }))}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Jumlah (Rp)</label>
                  <input type="number" value={newDep.jumlah || ""} onChange={(e) => setNewDep((x) => ({ ...x, jumlah: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200" />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Metode</p>
                  <div className="flex gap-2 flex-wrap">
                    {METODE_OPTS.map((m) => (
                      <button key={m} onClick={() => setNewDep((x) => ({ ...x, metode: m }))}
                        className={cn("cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                          newDep.metode === m ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600")}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddDeposit(false)}
                    className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                  <button onClick={() => {
                    if (!newDep.jumlah || !newDep.kasir) return;
                    const record: DepositRecord = {
                      id: `dp-${Date.now()}`, tanggal: newDep.tanggal || "", waktu: newDep.waktu || "",
                      jumlah: newDep.jumlah, metode: newDep.metode as MetodeBayar,
                      keterangan: newDep.keterangan, kasir: newDep.kasir,
                    };
                    setLocalDeposits((prev) => [...prev, record]);
                    setNewDep({ metode: "Tunai", tanggal: "", waktu: "", jumlah: 0, kasir: "" });
                    setShowAddDeposit(false);
                  }} className="flex-1 cursor-pointer rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700">
                    Simpan Deposit
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddDeposit(true)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-3 text-xs font-semibold text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-100">
                <Plus size={13} /> Tambah Deposit Baru
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
        <div className="text-xs text-slate-400">
          Sisa bayar: <strong className={cn(sisaBayar > 0 ? "text-rose-600" : "text-emerald-600")}>{fmtRp(sisaBayar)}</strong>
        </div>
        <button onClick={onClose} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          Tutup
        </button>
      </div>
    </ModalShell>
  );
}

// ── Billing Detail Modal ───────────────────────────────────

function BillingDetailModal({ record, onClose }: { record: BillingRecord; onClose: () => void }) {
  const total = record.rincian.reduce((s, r) => s + r.qty * r.harga, 0);
  const uc = UNIT_CFG[record.unit];
  const UIcon = uc.icon;
  return (
    <ModalShell
      title={`Tagihan — ${record.unit}`}
      subtitle={`${record.noTagihan} · ${record.tanggal}`}
      onClose={onClose}
      size="md"
    >
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold", uc.bg, uc.text)}>
            <UIcon size={12} /> {record.unit}
          </span>
          <span className="font-mono text-[10px] text-slate-400">{record.noKunjungan}</span>
          <span className={cn("ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1", TAGIHAN_STATUS[record.status])}>
            {record.status}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Penjamin</span>
          <span className="font-medium text-slate-700">{record.penjamin}</span>
        </div>

        {/* Rincian table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2.5 text-left">Item</th>
                <th className="px-4 py-2.5 text-center">Qty</th>
                <th className="px-4 py-2.5 text-right">Harga</th>
                <th className="px-4 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {record.rincian.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{r.nama}</td>
                  <td className="px-4 py-2.5 text-center text-slate-500">{r.qty}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{fmtRp(r.harga)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{fmtRp(r.qty * r.harga)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-600">Total</td>
                <td className="px-4 py-3 text-right text-sm font-black text-slate-900">{fmtRp(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {record.dibayar > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs">
            <span className="text-emerald-600">Dibayar</span>
            <span className="font-bold text-emerald-700">{fmtRp(record.dibayar)}</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-3">
        <button onClick={onClose} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
          Tutup
        </button>
      </div>
    </ModalShell>
  );
}

// ── Riwayat Kunjungan Modal ────────────────────────────────

function RiwayatKunjunganModal({ kunjungan, onClose }: {
  kunjungan: PatientMaster["riwayatKunjungan"];
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<FilterStatus>("Semua");
  const filtered = useMemo(
    () => filter === "Semua" ? kunjungan : kunjungan.filter((k) => k.status === filter),
    [kunjungan, filter],
  );
  return (
    <ModalShell title="Riwayat Kunjungan" subtitle="Semua kunjungan pasien ini" onClose={onClose} size="lg">
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-100 px-5 py-3">
        {FILTER_OPTS.map((opt) => {
          const cnt = opt.key === "Semua" ? kunjungan.length : kunjungan.filter((k) => k.status === opt.key).length;
          return (
            <button key={opt.key} onClick={() => setFilter(opt.key)}
              className={cn("flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition",
                filter === opt.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
              {opt.label}
              <span className={cn("rounded-full px-1.5 text-[9px] font-bold", filter === opt.key ? "bg-white/20 text-white" : "text-slate-400")}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.map((k) => {
          const uc = UNIT_CFG[k.unit];
          const UIcon = uc.icon;
          return (
            <div key={k.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", uc.bg)}>
                <UIcon size={16} className={uc.text} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800">{k.unit}</p>
                <p className="font-mono text-[10px] text-slate-400">{k.noKunjungan}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-slate-500">{k.tanggal}</p>
                <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold", KUNJUNGAN_STATUS[k.status])}>
                  {STATUS_LABEL[k.status] ?? k.status}
                </span>
              </div>
              <div className="text-slate-300">
                <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">Tidak ada kunjungan.</p>
        )}
      </div>
      <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-3">
        <button onClick={onClose} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
          Tutup
        </button>
      </div>
    </ModalShell>
  );
}

// ── Main component ─────────────────────────────────────────

export default function PatientDashboard({ patient: init }: { patient: PatientMaster }) {
  const router = useRouter();

  // ── Multi-tab state ──────────────────────────────────────
  const [tabs, setTabs]             = useState<PatientMaster[]>([init]);
  const [activeId, setActiveId]     = useState(init.id);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const patient = tabs.find((t) => t.id === activeId) ?? tabs[0];

  function setPatient(value: PatientMaster | ((prev: PatientMaster) => PatientMaster)) {
    setTabs((prev) => prev.map((t) =>
      t.id === activeId ? (typeof value === "function" ? value(t) : value) : t,
    ));
  }

  function switchTab(id: string) {
    setActiveId(id);
    setEditData(false); setEditKontak(false); setPenjamin(false);
    setKasir(false); setRiwayat(false); setOpenBillingId(null);
    setShowSearch(false);
  }

  function openPatient(p: PatientMaster) {
    if (!tabs.some((t) => t.id === p.id)) setTabs((prev) => [...prev, p]);
    switchTab(p.id);
    setSearchQuery("");
  }

  function closeTab(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    const idx       = tabs.findIndex((t) => t.id === id);
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining[Math.max(0, idx - 1)].id);
  }

  const allPatients   = useMemo(() => Object.values(patientMasterData), []);
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? allPatients.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.noRM.toLowerCase().includes(q) ||
          p.nik.includes(q),
        )
      : allPatients;
    return list.slice(0, 6);
  }, [searchQuery, allPatients]);

  // ── Per-patient UI state ─────────────────────────────────
  const [showEditData, setEditData]     = useState(false);
  const [showEditKontak, setEditKontak] = useState(false);
  const [showPenjamin, setPenjamin]     = useState(false);
  const [showKasir, setKasir]           = useState(false);
  const [showRiwayat, setRiwayat]       = useState(false);
  const [openBillingId, setOpenBillingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");
  const photoRef = useRef<HTMLInputElement>(null);

  const filteredKunjungan = useMemo(
    () => filterStatus === "Semua"
      ? patient.riwayatKunjungan
      : patient.riwayatKunjungan.filter((k) => k.status === filterStatus),
    [patient.riwayatKunjungan, filterStatus],
  );

  const initials     = patient.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const pjCfg        = PENJAMIN_CFG[patient.penjamin.tipe];
  const kasirCalc    = useMemo(() => patient.kasir ? calcKasir(patient.kasir) : null, [patient.kasir]);
  const totalDeposit = patient.kasir?.deposits.reduce((s, d) => s + d.jumlah, 0) ?? 0;
  const activeVisit  = patient.riwayatKunjungan.find((k) => k.status === "Aktif");

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPhotoPreview(URL.createObjectURL(f));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">

      {/* ── Header: breadcrumb + tab bar ── */}
      <header className="shrink-0 bg-white shadow-xs">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-1.5 text-xs text-slate-400">
          <Link href="/ehis-care" className="transition hover:text-slate-600">Beranda</Link>
          <ChevronRight size={10} className="shrink-0" />
          <span className="font-medium text-slate-600">Pasien</span>
          <Link
            href="/ehis-care"
            className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={12} />
          </Link>
        </div>

        {/* Tab bar */}
        <div className="relative flex items-end border-b border-slate-200 bg-slate-50/60 px-3 pt-2">

          {/* Patient tabs */}
          {tabs.map((tab) => {
            const isActive   = tab.id === activeId;
            const tabInitials = tab.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
            const hasActive  = tab.riwayatKunjungan.some((k) => k.status === "Aktif");
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={cn(
                  "group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-t-lg border px-3 py-2 text-left transition",
                  isActive
                    ? "z-10 border-b-white border-slate-200 bg-white text-slate-800 shadow-xs"
                    : "border-transparent bg-transparent text-slate-500 hover:bg-white/70 hover:text-slate-700",
                )}
                style={isActive ? { marginBottom: -1 } : undefined}
              >
                {/* Gender strip */}
                <div className={cn(
                  "h-3.5 w-1 shrink-0 rounded-full",
                  tab.gender === "L" ? "bg-sky-400" : "bg-pink-400",
                )} />

                {/* Avatar */}
                <div className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-black",
                  tab.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                )}>
                  {tabInitials}
                </div>

                {/* Name + RM */}
                <div className="min-w-0">
                  <p className="max-w-[110px] truncate text-[11px] font-semibold leading-tight">
                    {tab.name.split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p className="font-mono text-[9px] leading-tight opacity-50">{tab.noRM}</p>
                </div>

                {/* Active indicator dot */}
                {hasActive && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                )}

                {/* Close button */}
                {tabs.length > 1 && (
                  <span
                    role="button"
                    onClick={(e) => closeTab(tab.id, e)}
                    className="ml-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-0 transition hover:bg-slate-200 group-hover:opacity-100"
                  >
                    <X size={9} />
                  </span>
                )}
              </button>
            );
          })}

          {/* Search / add tab button */}
          <div className="relative mb-0.5 ml-1 pb-1.5">
            <button
              onClick={() => { setShowSearch((v) => !v); setSearchQuery(""); }}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition",
                showSearch
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-dashed border-slate-300 bg-white text-slate-400 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600",
              )}
            >
              <Plus size={11} />
              <span>Tambah Pasien</span>
            </button>

            {/* Search dropdown */}
            {showSearch && (
              <div className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {/* Search input */}
                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                  <Search size={13} className="shrink-0 text-slate-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nama, No. RM, atau NIK…"
                    className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-300 outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="cursor-pointer text-slate-300 hover:text-slate-500">
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="py-5 text-center text-xs text-slate-400">Tidak ada hasil.</p>
                  ) : (
                    <>
                      {!searchQuery && (
                        <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Semua Pasien
                        </p>
                      )}
                      {searchResults.map((p) => {
                        const pInitials = p.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
                        const isOpen    = tabs.some((t) => t.id === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => openPatient(p)}
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                          >
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                              p.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                            )}>
                              {pInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{p.noRM} · {p.age} thn</p>
                            </div>
                            {isOpen ? (
                              <span className="shrink-0 rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-600">
                                Terbuka
                              </span>
                            ) : (
                              <Plus size={11} className="shrink-0 text-slate-300" />
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Spacer fills bottom border */}
          <div className="flex-1 border-b border-slate-200" style={{ marginBottom: -1 }} />
        </div>
      </header>

      {/* Backdrop to close search */}
      {showSearch && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">

          {/* ── Col 1-3: Profile + Billing ── */}
          <div className="flex flex-col gap-4 md:col-span-3">

            {/* Profile card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              {/* Gradient header */}
              <div className={cn(
                "relative h-16 bg-linear-to-br",
                patient.gender === "L" ? "from-slate-600 to-teal-800" : "from-pink-500 to-rose-600",
              )}>
                <button onClick={() => window.print()}
                  className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white/15 text-white/80 transition hover:bg-white/25">
                  <Printer size={11} />
                </button>
              </div>

              {/* Avatar + info */}
              <div className="flex flex-col items-center px-4 pb-4">
                {/* Avatar overlaps gradient */}
                <div className="group relative -mt-8 mb-2.5">
                  {photoPreview ? (
                    <img src={photoPreview} alt={patient.name}
                      className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-md" />
                  ) : (
                    <div className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full text-lg font-black ring-4 ring-white shadow-md",
                      patient.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                    )}>
                      {initials}
                    </div>
                  )}
                  <button onClick={() => photoRef.current?.click()}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/30">
                    <Camera size={13} className="text-white opacity-0 transition group-hover:opacity-100" />
                  </button>
                </div>

                <h2 className="text-sm font-bold leading-tight text-slate-900 text-center">{patient.name}</h2>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {patient.age} thn · {patient.gender === "L" ? "L" : "P"}
                  </span>
                  <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">
                    {patient.golonganDarah}
                  </span>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", pjCfg.badge)}>
                    {pjCfg.label}
                  </span>
                </div>

                {/* ID fields */}
                <div className="mt-3 w-full space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 text-[10px] text-slate-400">Rekam Medis</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">{patient.noRM}</span>
                  </div>
                  {patient.idSatusehat && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="shrink-0 text-[10px] text-slate-400">ID Satusehat</span>
                      <span className="font-mono text-[10px] font-semibold text-indigo-600">{patient.idSatusehat}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 text-[10px] text-slate-400">Terdaftar</span>
                    <span className="text-[10px] text-slate-500">{patient.terdaftar}</span>
                  </div>
                </div>

                <button onClick={() => setEditData(true)}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">
                  <Pencil size={11} /> Lihat & Edit Data Diri
                </button>
              </div>
            </div>

            {/* Billing card — grouped by kunjungan, newest first */}
            {patient.billing.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Receipt size={12} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Rincian Tagihan</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {patient.billing.length} kunjungan
                  </span>
                </div>

                <div className="divide-y divide-slate-50">
                  {patient.billing.map((b) => {
                    const uc       = UNIT_CFG[b.unit];
                    const UIcon    = uc.icon;
                    const isActive = b.noTagihan === patient.kasir?.noTagihan;
                    return (
                      <div key={b.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/70">
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", uc.bg)}>
                          <UIcon size={13} className={uc.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-700">{b.unit}</p>
                          <p className="font-mono text-[9px] text-slate-400 truncate">{b.noKunjungan}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-black text-slate-900">{fmtRp(b.totalBiaya)}</p>
                          <span className={cn("text-[9px] font-semibold leading-tight", TAGIHAN_STATUS[b.status].split(" ").find((c) => c.startsWith("text-"))!)}>
                            {b.status}
                          </span>
                        </div>
                        <button
                          onClick={() => isActive ? setKasir(true) : setOpenBillingId(b.id)}
                          title={isActive ? "Buka kasir lengkap" : "Lihat rincian"}
                          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Footer: grand total + sisa bayar aktif */}
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-slate-500">Grand Total</span>
                    <span className="font-black text-slate-900">
                      {fmtRp(patient.billing.reduce((s, b) => s + b.totalBiaya, 0))}
                    </span>
                  </div>
                  {kasirCalc && kasirCalc.sisaBayar > 0 && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rose-500">Sisa Bayar Aktif</span>
                      <span className="font-bold text-rose-600">{fmtRp(kasirCalc.sisaBayar)}</span>
                    </div>
                  )}
                  {totalDeposit > 0 && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-500">Deposit</span>
                      <span className="font-semibold text-emerald-600">{fmtRp(totalDeposit)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                <Receipt size={20} className="text-slate-200" />
                <p className="text-xs text-slate-400">Tidak ada tagihan</p>
              </div>
            )}
          </div>

          {/* ── Col 4-9: Penjamin ── */}
          <div className="md:col-span-6">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", pjCfg.bg, pjCfg.border)}>
                    <Shield size={13} className="text-slate-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Penjamin &amp; Jaminan</span>
                </div>
                <EditSmallBtn onClick={() => setPenjamin(true)} label="Ubah" />
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Penjamin type */}
                <div className={cn("flex items-start gap-3 rounded-2xl border p-4", pjCfg.bg, pjCfg.border)}>
                  <div className="flex-1">
                    <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-bold", pjCfg.badge)}>{pjCfg.label}</span>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {patient.penjamin.kelas && (
                        <span className="rounded-full border border-white/60 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          Kelas {patient.penjamin.kelas}
                        </span>
                      )}
                      {patient.penjamin.berlakuSampai && (
                        <span className="text-[10px] text-slate-500">s/d {patient.penjamin.berlakuSampai}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BPJS nomor peserta */}
                {patient.penjamin.nomor && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">No. Peserta</p>
                    <p className="mt-1 font-mono text-lg font-bold tracking-[0.12em] text-slate-800">
                      {patient.penjamin.nomor}
                    </p>
                  </div>
                )}

                {/* SEP */}
                {patient.penjamin.noSEP && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">No. SEP (Surat Eligibilitas Peserta)</p>
                    <p className="mt-1 font-mono text-sm font-bold text-emerald-800">{patient.penjamin.noSEP}</p>
                  </div>
                )}

                {patient.penjamin.noPolis && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">No. Polis Asuransi</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-indigo-800">{patient.penjamin.noPolis}</p>
                  </div>
                )}

                {/* Active visit banner */}
                {activeVisit && (
                  <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3">
                    {(() => { const UIcon = UNIT_CFG[activeVisit.unit].icon; return (
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", UNIT_CFG[activeVisit.unit].bg)}>
                        <UIcon size={14} className={UNIT_CFG[activeVisit.unit].text} />
                      </div>
                    ); })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Sedang Dirawat</p>
                      <p className="text-xs font-medium text-slate-700">{activeVisit.unit} · {activeVisit.tanggal}</p>
                    </div>
                    <span className="rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-bold text-white">Aktif</span>
                  </div>
                )}

                {/* Riwayat button */}
                <div className="border-t border-slate-100 pt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kunjungan</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                      {patient.riwayatKunjungan.length} total
                    </span>
                  </div>
                  <button onClick={() => setRiwayat(true)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={13} />
                      <span>Lihat Semua Riwayat Kunjungan</span>
                    </div>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Col 10-12: Info & Quick Actions ── */}
          <div className="flex flex-col gap-4 md:col-span-3">

            {/* Stats */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 px-4 py-3">
                <span className="text-xs font-semibold text-slate-700">Informasi Pasien</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-indigo-50 p-3 text-center">
                    <p className="text-xl font-black text-indigo-700">{patient.riwayatKunjungan.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Kunjungan</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3 text-center">
                    <p className="text-xl font-black text-sky-700">
                      {patient.riwayatKunjungan.filter((k) => k.status === "Aktif").length}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-sky-400">Aktif</p>
                  </div>
                </div>

                <InfoRow label="No. HP" value={patient.noHp} mono />

                {/* Kontak darurat */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600">
                    <Phone size={9} /> Kontak Darurat
                  </p>
                  <p className="text-xs font-semibold text-slate-700">{patient.kontakDarurat.nama}</p>
                  <p className="text-[10px] text-slate-500">{patient.kontakDarurat.hubungan} · {patient.kontakDarurat.noHp}</p>
                </div>

                {/* Allergy */}
                {patient.alergi && patient.alergi.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-600">
                      <AlertCircle size={9} /> Riwayat Alergi
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {patient.alergi.map((a) => (
                        <span key={a} className="rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-700">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 px-4 py-3">
                <span className="text-xs font-semibold text-slate-700">Aksi Cepat</span>
              </div>
              <div className="p-3 space-y-1.5">
                {[
                  { icon: Phone,       label: "Edit Kontak & PJ",    onClick: () => setEditKontak(true) },
                  { icon: Camera,      label: "Ubah Foto Pasien",     onClick: () => photoRef.current?.click() },
                  { icon: Printer,     label: "Cetak Kartu Pasien",   onClick: () => window.print() },
                  { icon: UserCheck,   label: "Surat Keterangan",     onClick: () => {} },
                  { icon: ClipboardList, label: "Rekam Medis Lengkap", onClick: () => {} },
                ].map(({ icon: Icon, label, onClick }) => (
                  <button key={label} onClick={onClick}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                    <Icon size={12} className="shrink-0 text-slate-400" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Full width: Riwayat Kunjungan table ── */}
          <div className="md:col-span-12">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">Riwayat Kunjungan</span>
                </div>
                <div className="flex items-center gap-1">
                  {FILTER_OPTS.map((opt) => {
                    const count = opt.key === "Semua"
                      ? patient.riwayatKunjungan.length
                      : patient.riwayatKunjungan.filter((k) => k.status === opt.key).length;
                    return (
                      <button key={opt.key} onClick={() => setFilterStatus(opt.key)}
                        className={cn(
                          "flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                          filterStatus === opt.key ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                        )}>
                        {opt.label}
                        <span className={cn("text-[9px] font-bold", filterStatus === opt.key ? "text-white/70" : "text-slate-400")}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3 text-left">No. Kunjungan</th>
                      <th className="px-5 py-3 text-left">Tanggal</th>
                      <th className="px-5 py-3 text-left">Unit / Ruangan</th>
                      <th className="px-5 py-3 text-left">Dokter</th>
                      <th className="px-5 py-3 text-left">Diagnosa</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredKunjungan.map((k) => {
                      const uc    = UNIT_CFG[k.unit];
                      const UIcon = uc.icon;
                      return (
                        <tr key={k.id} className="transition hover:bg-slate-50/80">
                          <td className="px-5 py-3 font-mono text-[11px] text-slate-400">{k.noKunjungan}</td>
                          <td className="px-5 py-3 text-slate-600">{k.tanggal}</td>
                          <td className="px-5 py-3">
                            <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold", uc.bg, uc.text)}>
                              <UIcon size={10} /> {k.unit}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{k.dokter}</td>
                          <td className="px-5 py-3 font-medium text-slate-700">{k.diagnosa}</td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => k.detailPath && router.push(k.detailPath)}
                              className={cn(
                                "inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                                KUNJUNGAN_STATUS[k.status],
                                k.detailPath ? "hover:opacity-80 hover:shadow-xs" : "cursor-default",
                              )}
                            >
                              {STATUS_LABEL[k.status] ?? k.status}
                              {k.detailPath && <ArrowRight size={9} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredKunjungan.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                          Tidak ada kunjungan dengan status ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {showEditData   && <EditDataModal    patient={patient} onClose={() => setEditData(false)}   onSave={(p) => setPatient(p)} />}
      {showEditKontak && <EditKontakModal  patient={patient} onClose={() => setEditKontak(false)} onSave={(p) => setPatient(p)} />}
      {showPenjamin   && <UbahPenjaminModal current={patient.penjamin} onClose={() => setPenjamin(false)} onSave={(pj) => setPatient((p) => ({ ...p, penjamin: pj }))} />}
      {showKasir && patient.kasir && <AccountingModal kasir={patient.kasir} patient={patient} onClose={() => setKasir(false)} />}
      {showRiwayat   && <RiwayatKunjunganModal kunjungan={patient.riwayatKunjungan} onClose={() => setRiwayat(false)} />}
      {openBillingId && (() => {
        const rec = patient.billing.find((b) => b.id === openBillingId);
        return rec ? <BillingDetailModal record={rec} onClose={() => setOpenBillingId(null)} /> : null;
      })()}

      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
    </div>
  );
}
