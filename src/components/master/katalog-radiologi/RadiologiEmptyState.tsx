"use client";

import { Radiation } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

export default function RadiologiEmptyState({
  totalItem, onAddNew,
}: {
  totalItem: number;
  onAddNew: () => void;
}) {
  return (
    <MasterEmptyState
      accent="rose"
      icon={Radiation}
      title="Pilih pemeriksaan di kiri"
      description="Atau tambah pemeriksaan radiologi baru — lengkapi modalitas, protap persiapan, Diagnostic Reference Level (DRL) sesuai PMK 1014/2008, dan reporting template per modalitas."
      totalCount={totalItem}
      totalLabel="pemeriksaan tersedia"
      onAddNew={onAddNew}
      addLabel="Tambah Pemeriksaan Baru"
    />
  );
}
