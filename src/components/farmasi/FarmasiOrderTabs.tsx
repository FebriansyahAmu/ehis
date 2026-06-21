"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, FileText, Activity, ShieldAlert, ClipboardList, ClipboardCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mapDbResepOrder,
  type FarmasiOrder, type TelaahData,
  type FarmasiOrderItem, type SerahTerima, type CatatanFarmasi,
} from "./farmasiShared";
import { telaahFarmasiResep, dispensingFarmasiResep, type FarmasiTelaahBody } from "@/lib/api/resep/resep";
import { ingestFarmasiOrder } from "@/lib/billing/chargeIngest";
import { emitFarmasiTask } from "@/lib/farmasi/farmasiQueueStore";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import CPPTTab           from "@/components/shared/medical-records/CPPTTab";
import RekonsiliasTab    from "@/components/shared/medical-records/RekonsiliasTab";
import type { RekonContext } from "@/components/shared/medical-records/rekonsiliasi/rekonsiliasiShared";
import LayananFarmasiTab from "./tabs/LayananFarmasiTab";
import PTOPane           from "./tabs/PTOPane";
import MESOPane          from "./tabs/MESOPane";
import DRPPane           from "./tabs/DRPPane";

// ── Tab definitions ───────────────────────────────────────

interface TabDef { id: string; label: string; icon: LucideIcon; group: "workflow" | "klinis" }

const TABS: TabDef[] = [
  { id: "layanan",      label: "Layanan Farmasi",      icon: Pill,           group: "workflow" },
  { id: "cppt",         label: "CPPT Apoteker",         icon: FileText,       group: "workflow" },
  { id: "rekonsiliasi", label: "Rekonsiliasi Obat",     icon: ClipboardCheck, group: "workflow" },
  { id: "pto",          label: "Monitoring Terapi",     icon: Activity,       group: "klinis"  },
  { id: "meso",         label: "Pelaporan ESO",          icon: ShieldAlert,    group: "klinis"  },
  { id: "drp",          label: "Masalah Terkait Obat",  icon: ClipboardList,  group: "klinis"  },
];

type TabId = "layanan" | "cppt" | "rekonsiliasi" | "pto" | "meso" | "drp";

/** Konteks rekonsiliasi dari unit asal order (location yang meng-order obat). */
function rekonContextFor(unit: FarmasiOrder["unit"]): RekonContext {
  return unit === "IGD" ? "igd" : "ri";
}

// ── Nav item ──────────────────────────────────────────────

function NavItem({ tab, active, onClick }: { tab: TabDef; active: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "mx-2 flex w-[calc(100%-16px)] items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-all duration-150",
        active
          ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
          : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
      )}
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{tab.label}</span>
    </button>
  );
}

function GroupSeparator({ label }: { label: string }) {
  return (
    <p className="mb-1 mt-3 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">
      {label}
    </p>
  );
}

// ── Callback types ────────────────────────────────────────

export interface FarmasiOrderCallbacks {
  onTelaahSubmit:     (orderId: string, data: TelaahData) => void;
  onDispensasiSubmit: (orderId: string, items: FarmasiOrderItem[], serahTerima: SerahTerima) => void;
  onCatatanAdd:       (orderId: string, catatan: CatatanFarmasi) => void;
}

// ── Main ──────────────────────────────────────────────────

export default function FarmasiOrderTabs({
  order,
  onOrderChange,
}: {
  order: FarmasiOrder;
  onOrderChange: (o: FarmasiOrder) => void;
}) {
  const [active, setActive] = useState<TabId>("layanan");

  // Transisi status persist ke DB (medicalrecord.ResepOrder). Snapshot telaah/serah/lot
  // di-overlay client-side (fondasi: belum dipersist) agar tampil selama sesi. mapDbResepOrder
  // membangun ulang order dari DTO segar → overlay data isian + catatan yang sudah ada.

  async function handleTelaahSubmit(id: string, data: TelaahData) {
    try {
      const body: FarmasiTelaahBody = {
        result:            data.result,
        alasanKembali:     data.alasanKembali,
        catatan:           data.catatan,
        answers:           data.answers,
        lulusAdministrasi: data.checks.administratif,
        lulusFarmasetik:   data.checks.farmasetis,
        lulusKlinis:       data.checks.klinis,
        substitusi:        data.substitusi,
        lasaKonfirmasi:    data.lasaKonfirmasi,
      };
      const dto = await telaahFarmasiResep(id, body);
      onOrderChange({ ...mapDbResepOrder(dto), catatan: order.catatan }); // telaah ikut dari DTO
      if (data.result === "Disetujui") {
        emitFarmasiTask(order.noRM, 6); // Antrol T6 — mulai layan farmasi (best-effort, by No. RM)
        toast.success("Resep ditelaah", "Siap dispensasi & serah");
      } else {
        toast.success("Resep dikembalikan", "Dikembalikan ke DPJP");
      }
    } catch (e) {
      toast.error("Gagal menyimpan telaah", e instanceof ApiError ? e.message : undefined);
    }
  }

  async function handleDispensasiSubmit(id: string, items: FarmasiOrderItem[], serahTerima: SerahTerima) {
    try {
      const dto  = await dispensingFarmasiResep(id, {
        edukasi:           serahTerima.edukasi,
        semuaLabelDicetak: serahTerima.semuaLabelDicetak,
        lasaKonfirmasi:    serahTerima.lasaKonfirmasi,
        petugas2Nar:       serahTerima.petugas2NAR,
        narDoubleCheck:    serahTerima.narDoubleCheck,
      });
      const next: FarmasiOrder = {
        ...mapDbResepOrder(dto),
        items, serahTerima, telaah: order.telaah, catatan: order.catatan,
      };
      onOrderChange(next);
      emitFarmasiTask(order.noRM, 7); // Antrol T7 — obat diserahkan = akhir layan farmasi
      // BL6.1 — silent wiring ke Billing. Idempotent (dedupe by sourceRef).
      const result = ingestFarmasiOrder({
        ...next,
        timestamps: { ...(next.timestamps ?? { masuk: next.tanggal }), serahTerima: serahTerima.waktu },
      });
      if (result.ok && result.added > 0) {
        console.info(
          `[Billing] Farmasi ${next.noOrder} → invoice ${result.invoiceId} (+${result.added} charges, ${result.skipped} skipped)`,
        );
      }
      toast.success("Obat diserahkan", `${next.noOrder} selesai`);
    } catch (e) {
      toast.error("Gagal menyelesaikan dispensing", e instanceof ApiError ? e.message : undefined);
    }
  }

  function handleCatatanAdd(_id: string, catatan: CatatanFarmasi) {
    onOrderChange({ ...order, catatan: [...(order.catatan ?? []), catatan] });
  }

  const callbacks: FarmasiOrderCallbacks = {
    onTelaahSubmit:     handleTelaahSubmit,
    onDispensasiSubmit: handleDispensasiSubmit,
    onCatatanAdd:       handleCatatanAdd,
  };

  return (
    <div className="flex min-h-0 flex-1">

      {/* ── Sidebar ── */}
      <nav
        className="flex w-52 shrink-0 flex-col overflow-y-auto border-r border-slate-100 bg-slate-50/60 pb-6"
        aria-label="Tab layanan farmasi"
      >
        <GroupSeparator label="Pelayanan Farmasi" />
        {TABS.filter((t) => t.group === "workflow").map((tab) => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id as TabId)} />
        ))}
        <GroupSeparator label="Klinis" />
        {TABS.filter((t) => t.group === "klinis").map((tab) => (
          <NavItem key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id as TabId)} />
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1,  y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 p-4 md:p-6"
          >
            {active === "layanan" && <LayananFarmasiTab order={order} callbacks={callbacks} />}
            {active === "cppt"    && <CPPTTab initialEntries={[]} showDate kunjunganId={order.kunjunganId} defaultProfesi="Apoteker" />}
            {active === "rekonsiliasi" && (
              <RekonsiliasTab
                patient={{ id: order.kunjunganId, noRM: order.noRM, name: order.namaPasien }}
                context={rekonContextFor(order.unit)}
              />
            )}
            {active === "pto"     && <PTOPane  items={order.items} noRM={order.noRM} />}
            {active === "meso"    && <MESOPane order={order} />}
            {active === "drp"     && <DRPPane  order={order} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
