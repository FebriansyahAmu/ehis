"use client";

import { FlaskConical } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

interface Props {
  totalItem: number;
  onAddNew: () => void;
}

export default function LabItemEmptyState({ totalItem, onAddNew }: Props) {
  return (
    <MasterEmptyState
      accent="sky"
      icon={FlaskConical}
      title="Pilih pemeriksaan untuk diedit"
      description="Lengkapi identitas, nilai rujukan per gender & usia, serta threshold delta check dan nilai kritis untuk integrasi auto-flag HasilPane."
      totalCount={totalItem}
      totalLabel="pemeriksaan tersedia"
      onAddNew={onAddNew}
      addLabel="Tambah Pemeriksaan"
    />
  );
}
