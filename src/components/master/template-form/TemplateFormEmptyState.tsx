"use client";

import { MasterEmptyState } from "@/components/master/shared";
import { type TemplateFormJenis, JENIS_CFG } from "@/lib/master/templateFormMock";

interface Props {
  jenis: TemplateFormJenis;
  totalItem: number;
  onAddNew: () => void;
}

export default function TemplateFormEmptyState({ jenis, totalItem, onAddNew }: Props) {
  const cfg = JENIS_CFG[jenis];

  return (
    <MasterEmptyState
      accent="sky"
      icon={cfg.icon}
      title={`Pilih template ${cfg.short} untuk melihat detail`}
      description={cfg.deskripsi}
      totalCount={totalItem}
      totalLabel={`${cfg.short} tersedia`}
      addLabel={`Tambah ${cfg.short}`}
      onAddNew={onAddNew}
    />
  );
}
