"use client";

import { motion } from "framer-motion";
import {
  type BmhpRecord,
} from "@/lib/master/bmhpMock";
import {
  ToggleSwitch, SectionGroup,
  MappingSourceBadge,
} from "@/components/master/shared";

interface KlasifikasiTabProps {
  draft: BmhpRecord;
  onPatch: (patch: Partial<BmhpRecord>) => void;
}

export default function KlasifikasiTab({ draft, onPatch }: KlasifikasiTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {/* Formularium & Penanganan */}
      <SectionGroup
        title="Status Formularium & Penanganan"
        desc="Flag yang men-trigger workflow khusus (penanganan aseptik, anti-reuse, tracking implan)."
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* Formularium row — full width agar banner mapping flush di bawahnya */}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <ToggleSwitch
              value={draft.isFormularium}
              onChange={(v) => onPatch({ isFormularium: v })}
              label="Formularium / e-Katalog RS"
              desc="Termasuk daftar formularium RS. Non-form perlu justifikasi."
              accent="emerald"
            />
            <MappingSourceBadge
              subpage="formularium"
              variant="banner"
              title="Default global — ketersediaan per-unit dikelola di Mapping Hub"
              description="Flag ini hanya seed default per barang. Ketersediaan BMHP per ruangan/depo di-set di Mapping Hub → Formularium (Phase later)."
              ctaLabel="Atur Ketersediaan"
            />
          </div>
          <ToggleSwitch
            value={draft.isSteril}
            onChange={(v) => onPatch({ isSteril: v })}
            label="Steril"
            desc="Perlu penanganan aseptik; cek integritas kemasan & kedaluwarsa."
            accent="sky"
          />
          <ToggleSwitch
            value={draft.isSingleUse}
            onChange={(v) => onPatch({ isSingleUse: v })}
            label="Sekali Pakai (Single-Use)"
            desc="Tidak boleh di-reuse. Buang setelah dipakai."
            accent="amber"
          />
          <ToggleSwitch
            value={draft.isImplan}
            onChange={(v) => onPatch({ isImplan: v })}
            label="Implan"
            desc="Butuh tracking serial/UDI per-unit (di luar katalog)."
            accent="rose"
          />
          <ToggleSwitch
            value={draft.bpjsCoverage ?? false}
            onChange={(v) => onPatch({ bpjsCoverage: v })}
            label="Tertanggung BPJS"
            desc="Umumnya include dalam paket INA-CBG (bukan charge terpisah)."
            accent="teal"
          />
        </div>
      </SectionGroup>
    </motion.div>
  );
}
