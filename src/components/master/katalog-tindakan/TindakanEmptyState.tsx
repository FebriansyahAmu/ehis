"use client";

import { Zap } from "lucide-react";
import { MasterEmptyState } from "@/components/master/shared";

interface Props {
  totalTindakan: number;
  onAddNew: () => void;
}

export default function TindakanEmptyState({ totalTindakan, onAddNew }: Props) {
  return (
    <MasterEmptyState
      accent="teal"
      icon={Zap}
      title="Pilih Tindakan"
      description="Klik item di panel kiri untuk melihat & mengedit detail, atau tambah tindakan baru ke katalog."
      totalCount={totalTindakan}
      totalLabel="tindakan terdaftar"
      onAddNew={onAddNew}
      addLabel="Tambah Tindakan Baru"
    />
  );
}
