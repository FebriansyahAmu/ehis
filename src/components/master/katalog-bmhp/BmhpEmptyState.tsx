"use client";

import { Syringe } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

interface Props {
  totalBmhp: number;
  onAddNew: () => void;
}

export default function BmhpEmptyState({ totalBmhp, onAddNew }: Props) {
  return (
    <MasterEmptyState
      accent="teal"
      icon={Syringe}
      title="Pilih BMHP di sebelah kiri"
      description="Atau tambah BMHP/BHP baru untuk mengelola identitas, klasifikasi (steril / single-use / kelas risiko), regulasi izin edar, dan harga."
      totalCount={totalBmhp}
      totalLabel="BMHP aktif"
      onAddNew={onAddNew}
      addLabel="Tambah BMHP Baru"
    />
  );
}
