"use client";

import { Siren } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

export default function TriaseEmptyState({
  totalItem, onAddNew,
}: {
  totalItem: number;
  onAddNew: () => void;
}) {
  return (
    <MasterEmptyState
      accent="amber"
      icon={Siren}
      title="Pilih protokol triase di kiri"
      description="Atau tambah protokol baru — definisikan 5–6 level urgensi + kriteria klinis per parameter (airway, breathing, sirkulasi, kesadaran, dll). Editable inline pada tab Matrix."
      totalCount={totalItem}
      totalLabel="protokol tersedia"
      onAddNew={onAddNew}
      addLabel="Tambah Protokol Triase"
    />
  );
}
