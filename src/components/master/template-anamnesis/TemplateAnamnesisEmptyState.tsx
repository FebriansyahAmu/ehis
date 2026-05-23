"use client";

import { Stethoscope } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

interface Props {
  totalItem: number;
  onAddNew: () => void;
}

export default function TemplateAnamnesisEmptyState({ totalItem, onAddNew }: Props) {
  return (
    <MasterEmptyState
      accent="teal"
      icon={Stethoscope}
      title="Pilih template untuk melihat detail"
      description="Template anamnesis dipakai untuk pre-fill field RPS, faktor, dan status generalis di IGD/RI/RJ. Pilih dari daftar kiri atau tambah template baru."
      totalLabel="template tersedia"
      totalCount={totalItem}
      addLabel="Tambah Template"
      onAddNew={onAddNew}
    />
  );
}
