"use client";

import { motion } from "framer-motion";
import { Info, Baby, User, AlertCircle, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObatRecord } from "@/lib/master/obatMock";
import { Field, TextArea, SectionGroup } from "../FormPrimitives";

interface KlinisTabProps {
  draft: ObatRecord;
  onPatch: (patch: Partial<ObatRecord>) => void;
}

export default function KlinisTab({ draft, onPatch }: KlinisTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {/* Indikasi & Kontraindikasi */}
      <SectionGroup
        title="Indikasi & Kontraindikasi"
        desc="Singkat & padat — DPJP melihat ini saat memilih obat di resep."
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ClinicalField
            icon={Info}
            iconCls="text-sky-600 bg-sky-50"
            label="Indikasi"
            value={draft.indikasi ?? ""}
            onChange={(v) => onPatch({ indikasi: v || undefined })}
            placeholder="Contoh: Infeksi saluran nafas, infeksi saluran kemih."
            rows={3}
          />
          <ClinicalField
            icon={AlertCircle}
            iconCls="text-rose-600 bg-rose-50"
            label="Kontraindikasi"
            value={draft.kontraindikasi ?? ""}
            onChange={(v) => onPatch({ kontraindikasi: v || undefined })}
            placeholder="Contoh: Hipersensitif terhadap penisilin. Gangguan hati berat."
            rows={3}
          />
        </div>
      </SectionGroup>

      {/* Dosis */}
      <SectionGroup
        title="Dosis Lazim"
        desc="Dosis pegangan — selalu titrasi sesuai kondisi pasien."
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ClinicalField
            icon={User}
            iconCls="text-violet-600 bg-violet-50"
            label="Dewasa"
            value={draft.dosisDewasa ?? ""}
            onChange={(v) => onPatch({ dosisDewasa: v || undefined })}
            placeholder="Contoh: 500 mg-1 g setiap 8 jam, 5-7 hari."
            rows={2}
          />
          <ClinicalField
            icon={Baby}
            iconCls="text-pink-600 bg-pink-50"
            label="Anak / Pediatrik"
            value={draft.dosisAnak ?? ""}
            onChange={(v) => onPatch({ dosisAnak: v || undefined })}
            placeholder="Contoh: 25-45 mg/kgBB/hari dibagi 2-3 dosis."
            rows={2}
          />
        </div>
      </SectionGroup>

      {/* ESO & Interaksi */}
      <SectionGroup
        title="Efek Samping & Interaksi"
        desc="Informasi yang muncul di label obat & konseling pasien pulang."
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ClinicalField
            icon={AlertCircle}
            iconCls="text-amber-600 bg-amber-50"
            label="Efek Samping Umum"
            value={draft.efekSamping ?? ""}
            onChange={(v) => onPatch({ efekSamping: v || undefined })}
            placeholder="Contoh: Mual, diare, ruam kulit, kandidiasis."
            rows={3}
          />
          <ClinicalField
            icon={Link2}
            iconCls="text-orange-600 bg-orange-50"
            label="Interaksi Obat Penting"
            value={draft.interaksiObat ?? ""}
            onChange={(v) => onPatch({ interaksiObat: v || undefined })}
            placeholder="Satu interaksi per baris.\nContoh:\n- Warfarin → ↑ efek antikoagulan\n- OCPs → ↓ efektivitas kontrasepsi"
            rows={3}
          />
        </div>
      </SectionGroup>

      {/* Catatan Khusus */}
      <SectionGroup
        title="Catatan Khusus"
        desc="Instruksi khusus untuk apoteker / perawat (penyimpanan, monitoring, edukasi)."
      >
        <Field label="Catatan" hint="Muncul di TelaahPane apoteker.">
          <TextArea
            value={draft.catatanKhusus ?? ""}
            onChange={(v) => onPatch({ catatanKhusus: v || undefined })}
            placeholder="Contoh: Simpan 2-8°C. Double-check 2 perawat sebelum administer. Catat di register narkotika."
            rows={3}
          />
        </Field>
      </SectionGroup>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────

function ClinicalField({
  icon: Icon, iconCls, label, value, onChange, placeholder, rows,
}: {
  icon: React.ElementType;
  iconCls: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className={cn("flex h-5 w-5 items-center justify-center rounded-md", iconCls)}>
          <Icon size={10} />
        </span>
        <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <TextArea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}
