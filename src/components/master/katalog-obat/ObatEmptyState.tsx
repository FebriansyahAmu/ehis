"use client";

import { Pill } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

interface Props {
  totalObat: number;
  onAddNew: () => void;
}

export default function ObatEmptyState({ totalObat, onAddNew }: Props) {
  return (
    <MasterEmptyState
      accent="violet"
      icon={Pill}
      title="Pilih obat di sebelah kiri"
      description="Atau tambah obat baru untuk mengelola identitas, klasifikasi (HAM/LASA/Golongan), informasi klinis, dan harga."
      totalCount={totalObat}
      totalLabel="obat aktif"
      onAddNew={onAddNew}
      addLabel="Tambah Obat Baru"
    />
  );
}
