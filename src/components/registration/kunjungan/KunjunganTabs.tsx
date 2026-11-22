"use client";

// Navigasi tab Detail Kunjungan — Radix Tabs (primitif yang sama dengan shadcn Tabs). Gaya ditulis di
// sini karena TabsTrigger shadcn terikat varian pill/line + orientasi tetap; di sini orientasi berubah
// per layar: ≥ md = sidebar vertikal ber-grup, < md = baris horizontal yang bisa digeser.
//
// Aksesibilitas: tablist hanya berisi tab (label grup & pemisah aria-hidden) · aktivasi MANUAL
// (panel berisi form yang memuat data saat dibuka — panah tidak memuat tiap tab yang dilewati) ·
// tab terpilih ditandai garis border di pseudo-element (tetap terlihat di forced-colors), bukan warna
// saja, tanpa mengubah ukuran tab · tab terpilih digulir ke tampilan saat berganti.

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import {
  Ban, Car, ClipboardList, CreditCard, Navigation, Package, Printer, Upload,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { useMediaQuery } from "@/lib/ui/useMediaQuery";
import type { KunjunganRecord, PatientMaster } from "@/lib/data";
import { OverviewTab } from "./Tabs/OverviewTab";
import {
  PenjaminForm, PaketForm, RujukanForm, KecelakaanForm,
  UpdateSEPForm, CetakTab,
} from "./Tabs/ActionForms";
import { BatalkanForm } from "./Tabs/BatalkanKunjunganTab";
import type { PenjaminPatch } from "./Tabs/PenjaminForm";

// ─── Tab definitions ──────────────────────────────────────────

export type KunjunganTabId =
  | "overview"
  | "penjamin" | "paket" | "rujukan" | "kecelakaan"
  | "update-sep" | "cetak" | "batal";

type Tone = "default" | "warning" | "danger";

interface TabDef {
  id: KunjunganTabId;
  label: string;
  icon: LucideIcon;
  tone?: Tone;
}

const GROUPS: readonly { label: string; tabs: readonly TabDef[] }[] = [
  {
    label: "Informasi",
    tabs: [{ id: "overview", label: "Ringkasan & Info", icon: ClipboardList }],
  },
  {
    label: "Aksi kunjungan",
    tabs: [
      { id: "penjamin", label: "Ubah Penjamin", icon: CreditCard },
      { id: "paket", label: "Ubah Paket", icon: Package },
      { id: "rujukan", label: "Surat Rujukan", icon: Navigation },
      { id: "kecelakaan", label: "Data Kecelakaan", icon: Car, tone: "warning" },
    ],
  },
  {
    label: "Manajemen",
    tabs: [
      { id: "update-sep", label: "Update SEP", icon: Upload },
      { id: "cetak", label: "Cetak Dokumen", icon: Printer },
      { id: "batal", label: "Batalkan Kunjungan", icon: Ban, tone: "danger" },
    ],
  },
];

const ALL_TABS = GROUPS.flatMap((g) => g.tabs);

// Warna teks ≥ 4.5:1 di latar putih/tint; garis penanda (-600) ≥ 3:1.
const TONE: Record<Tone, string> = {
  default:
    "text-slate-600 hover:text-slate-900 data-[state=active]:bg-sky-50 data-[state=active]:text-sky-800 before:border-sky-600",
  warning:
    "text-amber-700 hover:text-amber-800 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-800 before:border-amber-600",
  danger:
    "text-rose-600 hover:text-rose-700 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 before:border-rose-600",
};

const TRIGGER = cn(
  "relative inline-flex flex-none snap-start items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 m-sm font-medium transition-colors",
  "hover:not-data-[state=active]:bg-slate-100",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-600",
  // Penanda terpilih: garis bawah (ponsel) → bilah kiri (≥ md), border di ::before.
  "before:pointer-events-none before:absolute before:inset-x-2 before:bottom-0 before:border-b-2 before:opacity-0 data-[state=active]:before:opacity-100",
  "md:w-full md:before:left-0 md:before:right-auto md:before:inset-y-1.5 md:before:border-b-0 md:before:border-l-[3px]",
);

// ─── Panels ───────────────────────────────────────────────────

interface PanelCtx {
  kunjungan: KunjunganRecord;
  icdCodes: string[];
  patient: PatientMaster;
  navigate: (id: KunjunganTabId) => void;
  patchKunjungan: (patch: PenjaminPatch) => void;
}

function PanelBody({ id, kunjungan, icdCodes, patient, navigate, patchKunjungan }: PanelCtx & { id: KunjunganTabId }): ReactNode {
  switch (id) {
    case "overview":
      return <OverviewTab kunjungan={kunjungan} icdCodes={icdCodes} onNavigate={navigate} />;
    case "penjamin":
      return <PenjaminForm kunjungan={kunjungan} patient={patient} onSaved={patchKunjungan} onNavigate={navigate} />;
    case "paket":
      return <PaketForm kunjungan={kunjungan} />;
    case "rujukan":
      return <RujukanForm kunjungan={kunjungan} />;
    case "kecelakaan":
      return <KecelakaanForm kunjungan={kunjungan} />;
    case "update-sep":
      return <UpdateSEPForm kunjungan={kunjungan} />;
    case "cetak":
      return <CetakTab kunjungan={kunjungan} patient={patient} />;
    case "batal":
      return <BatalkanForm kunjungan={kunjungan} />;
  }
}

// ─── Main export ──────────────────────────────────────────────

export default function KunjunganTabs({
  kunjungan: initialKunjungan,
  icdCodes,
  patient,
}: {
  kunjungan: KunjunganRecord;
  icdCodes: string[];
  patient: PatientMaster;
}) {
  const [active, setActive] = useState<KunjunganTabId>("overview");
  // Perubahan penjamin/SEP dari tab Ubah Penjamin ditimpakan di sini → tab lain (Ringkasan, Update SEP,
  // Cetak) langsung memakai data terbaru tanpa memuat ulang halaman.
  const [patch, setPatch] = useState<PenjaminPatch | null>(null);
  const kunjungan = useMemo(() => (patch ? { ...initialKunjungan, ...patch } : initialKunjungan), [initialKunjungan, patch]);
  const patchKunjungan = useCallback((p: PenjaminPatch) => setPatch((prev) => ({ ...prev, ...p })), []);
  const isWide = useMediaQuery("(min-width: 768px)", true);
  const triggers = useRef(new Map<KunjunganTabId, HTMLButtonElement>());

  // Tab terpilih selalu terlihat di baris yang bisa digeser (hanya menggulir tablist, bukan halaman).
  useEffect(() => {
    triggers.current
      .get(active)
      ?.scrollIntoView({ block: "nearest", inline: "nearest", container: "nearest" } as ScrollIntoViewOptions);
  }, [active]);

  // Pindah tab dari dalam panel (mis. "Buka Update SEP"): fokus ikut ke tab tujuan agar tidak hilang
  // bersama tombol pemicu yang ter-unmount.
  const navigate = useCallback((id: KunjunganTabId) => {
    setActive(id);
    requestAnimationFrame(() => triggers.current.get(id)?.focus());
  }, []);

  return (
    <TabsPrimitive.Root
      value={active}
      onValueChange={(v) => setActive(v as KunjunganTabId)}
      orientation={isWide ? "vertical" : "horizontal"}
      activationMode="manual"
      className="flex min-h-0 flex-1 flex-col md:flex-row"
    >
      <div className="shrink-0 border-b border-slate-200 bg-white md:w-56 md:overflow-y-auto md:border-r md:border-b-0">
        <TabsPrimitive.List
          aria-label="Bagian detail kunjungan"
          className="flex snap-x snap-proximity scroll-px-2 gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:thin] md:flex-col md:gap-0.5 md:overflow-x-visible md:px-2 md:py-3"
        >
          {GROUPS.map((g, gi) => (
            <Fragment key={g.label}>
              {gi > 0 && <span aria-hidden="true" className="my-1.5 w-px shrink-0 bg-slate-200 md:hidden" />}
              <span
                aria-hidden="true"
                className={cn(
                  "m-mini hidden px-3 pb-1 font-semibold uppercase tracking-wider text-slate-500 md:block",
                  gi > 0 ? "pt-4" : "pt-0.5",
                )}
              >
                {g.label}
              </span>
              {g.tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsPrimitive.Trigger
                    key={t.id}
                    value={t.id}
                    // Panel non-aktif tidak dirender → aria-controls akan menunjuk id yang tak ada.
                    aria-controls={undefined}
                    ref={(el) => {
                      if (el) triggers.current.set(t.id, el);
                      else triggers.current.delete(t.id);
                    }}
                    className={cn(TRIGGER, TONE[t.tone ?? "default"])}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t.label}</span>
                  </TabsPrimitive.Trigger>
                );
              })}
            </Fragment>
          ))}
        </TabsPrimitive.List>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {ALL_TABS.map((t) => (
          <TabsPrimitive.Content
            key={t.id}
            value={t.id}
            className="outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-600"
          >
            {/* fill-mode `backwards`, BUKAN `both`: keyframe fade-in berakhir di `transform: translateY(0)` —
                bila menempel sesudah animasi, panel jadi containing block utk `position: fixed` sehingga
                modal di dalam tab (SEP, Surat KK1/JR) terkurung di panel & terpotong area gulir. */}
            <div className="p-4 motion-safe:animate-[fade-in_0.2s_ease_backwards] md:p-6">
              <PanelBody
                id={t.id}
                kunjungan={kunjungan}
                icdCodes={icdCodes}
                patient={patient}
                navigate={navigate}
                patchKunjungan={patchKunjungan}
              />
            </div>
          </TabsPrimitive.Content>
        ))}
      </div>
    </TabsPrimitive.Root>
  );
}
