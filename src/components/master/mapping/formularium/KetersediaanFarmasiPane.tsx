"use client";

import { useState } from "react";
import { Pill, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import type { ObatRecord } from "@/lib/master/obatMock";
import type { BmhpRecord } from "@/lib/master/bmhpMock";
import type { FormulariumEdgeDTO } from "@/lib/api/master/formularium";
import type { FormulariumBmhpEdgeDTO } from "@/lib/api/master/formulariumBmhp";
import FormulariumPane from "./FormulariumPane";
import FormulariumBmhpPane from "./FormulariumBmhpPane";

type View = "obat" | "bmhp";

interface Props {
  /** Katalog obat dari SSR — diteruskan ke sub-pane Obat (Formularium). */
  obat?: ObatRecord[];
  /** Edge formularium Obat dari SSR — seed map sub-pane Obat. */
  formularium?: FormulariumEdgeDTO[];
  /** Katalog BMHP dari SSR — diteruskan ke sub-pane BMHP (Ketersediaan). */
  bmhp?: BmhpRecord[];
  /** Edge ketersediaan BMHP dari SSR — seed map sub-pane BMHP. */
  formulariumBmhp?: FormulariumBmhpEdgeDTO[];
  /** Tree Ruangan dari SSR — kolom unit (lokasi farmasi) untuk kedua sub-pane. */
  tree?: AnyNode[];
}

/**
 * Ketersediaan Farmasi — wadah 2 sub-pane: Obat (Formularium klinis) & BMHP (daftar standar depo).
 * Keduanya = matriks katalog × lokasi farmasi, tabel persist TERPISAH (FormulariumObat /
 * FormulariumBmhp). Switch via segmented control; hanya sub-pane aktif yang di-mount (cache
 * sesi per-modul cegah re-fetch flicker saat bolak-balik tab).
 */
export default function KetersediaanFarmasiPane({ obat, formularium, bmhp, formulariumBmhp, tree }: Props) {
  const [view, setView] = useState<View>("obat");

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Segmented switcher Obat | BMHP */}
      <div className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm">
        <SegTab
          active={view === "obat"}
          onClick={() => setView("obat")}
          icon={Pill}
          label="Obat"
          sub="Formularium"
          activeCls="text-violet-700"
        />
        <SegTab
          active={view === "bmhp"}
          onClick={() => setView("bmhp")}
          icon={Syringe}
          label="BMHP"
          sub="Daftar Depo"
          activeCls="text-teal-700"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {view === "obat" ? (
          <FormulariumPane obat={obat} tree={tree} formularium={formularium} />
        ) : (
          <FormulariumBmhpPane bmhp={bmhp} tree={tree} formularium={formulariumBmhp} />
        )}
      </div>
    </div>
  );
}

function SegTab({
  active, onClick, icon: Icon, label, sub, activeCls,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconComponent;
  label: string;
  sub: string;
  activeCls: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 transition",
        active ? cn("bg-white shadow-sm ring-1 ring-slate-200", activeCls) : "text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon size={15} className="shrink-0" />
      <span className="text-left leading-tight">
        <span className="block m-xs font-bold">{label}</span>
        <span className={cn("block m-mini font-medium", active ? "opacity-70" : "text-slate-400")}>{sub}</span>
      </span>
    </button>
  );
}
